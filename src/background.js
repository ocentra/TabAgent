// Path to the offscreen document
const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen.html';
const GOOGLE_DRIVE_OFFSCREEN_DOCUMENT_PATH = 'src/google_drive_offscreen.html';

// --- Popup State Management ---
// Stores a mapping: { tabId: popupWindowId }
let detachedPopups = {};
// Stores a mapping: { popupWindowId: tabId } for quick lookup on window removal
let popupIdToTabId = {};

// DNR Rule Constants
const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

// ========================================================================
// == Declarative Net Request Rules Setup
// ========================================================================

async function updateDeclarativeNetRequestRules() {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map(rule => rule.id);

    const rulesToAdd = [
        {
            id: DNR_RULE_ID_1,
            priority: DNR_RULE_PRIORITY_1,
            action: {
                type: 'modifyHeaders',
                responseHeaders: [
                    // Attempt to remove X-Frame-Options
                    { header: 'x-frame-options', operation: 'remove' },
                    { header: 'X-Frame-Options', operation: 'remove' }, // Case variations
                    // Attempt to remove frame-ancestors from CSP
                    { header: 'content-security-policy', operation: 'remove' },
                    { header: 'Content-Security-Policy', operation: 'remove' } // Case variations
                     // Note: Removing the entire CSP header is blunt. A more refined approach
                     // would involve parsing the header and removing only the frame-ancestors directive,
                     // but that's significantly more complex within DNR rules.
                ]
            },
            condition: {
                // Apply to main frame documents requested from any domain
                resourceTypes: ['main_frame'],
                urlFilter: '|http*://*/*|' // Matches http and https URLs
                 // Consider adding requestDomains or initiatorDomains if needed for specificity
            }
        }
    ];

    const rulesToRemove = currentRuleIds.filter(id => id === DNR_RULE_ID_1);

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rulesToRemove,
            addRules: rulesToAdd
        });
        console.log("Declarative Net Request rules updated successfully.");
    } catch (error) {
        console.error("Error updating Declarative Net Request rules:", error);
    }
}

// Call rule setup on background script start
updateDeclarativeNetRequestRules();

// ========================================================================
// == Offscreen Document Management & Scraping
// ========================================================================

// Checks if an offscreen document is currently open.
async function hasOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(path)]
    });
    return existingContexts.length > 0;
}

// Creates the offscreen document if it doesn't already exist.
async function setupOffscreenDocument(path, reasons, justification) {
    if (await hasOffscreenDocument(path)) {
        console.log(`Background: Offscreen document at ${path} already exists.`);
        return;
    }
    
    // Extract filename for the createDocument call
    const filename = path.split('/').pop(); // Get the part after the last '/'
    
    console.log(`Background: Creating offscreen document using filename: ${filename}...`);
    await chrome.offscreen.createDocument({
        url: filename, // <<< Use only the filename relative to root
        reasons: reasons,
        justification: justification,
    });
    console.log(`Background: Offscreen document created successfully using ${filename}.`);
}

// STAGE 1: Scrapes a URL using fetch + offscreen document + Readability
async function scrapeUrlWithOffscreen(url) {
    console.log(`[Stage 1] Attempting Offscreen Direct: ${url}`);
    if (!url || !url.startsWith('http')) throw new Error(`Invalid URL: ${url}`);

    await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH, ['IFRAME_SCRIPTING'], 'Load Google Picker API and handle external scripts/UI');

    let htmlContent;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        htmlContent = await response.text();
        console.log(`[Stage 1] Fetched HTML (${htmlContent.length} bytes)`);
    } catch (error) {
        throw new Error(`Failed to fetch URL: ${error.message}`);
    }

    console.log('[Stage 1] Sending HTML to offscreen document...');
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'parseHTML',
            target: 'offscreen',
            htmlContent: htmlContent
        });
        console.log('[Stage 1] Received response from offscreen:', response);

        if (response?.success && response.article) {
            return response.article; // Success!
        } else if (response?.success && response.article === null) {
            throw new Error('Readability found no content (offscreen).');
        } else {
            throw new Error(`Offscreen parsing error: ${response?.error || 'Invalid response format'}`);
        }
    } catch (error) {
        console.error('[Stage 1] Communication/Parsing error with offscreen:', error);
        throw new Error(`Offscreen stage failed: ${error.message}`);
    }
}

// ========================================================================
// == Offscreen + iframe Scraping (Stage 2)
// ========================================================================

// STAGE 2: Scrapes URL using offscreen document + iframe + dynamic script
async function scrapeUrlWithOffscreenIframe(url) {
    console.log(`[Stage 2] Attempting Offscreen + iframe: ${url}`);
    const DYNAMIC_SCRIPT_ID_PREFIX = 'offscreen-scrape-';
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult';
    const IFRAME_LOAD_TIMEOUT = 30000; // 30 seconds for iframe + script execution
    let dynamicScripterId = null;

    // --- Cleanup function --- 
    const cleanup = async (scriptIdBase) => {
        console.log(`[Stage 2 Cleanup] Starting cleanup for script ID base: ${scriptIdBase}`);
        // Unregister the single dynamic script ID we registered
        if (scriptIdBase) {
             try {
                 await chrome.scripting.unregisterContentScripts({ ids: [scriptIdBase] }); // Only unregister the base ID
                 console.log(`[Stage 2 Cleanup] Unregistered script: ${scriptIdBase}`);
             } catch (error) {
                 console.warn(`[Stage 2 Cleanup] Failed to unregister script ${scriptIdBase}:`, error);
             }
        }
        // Remove iframe in offscreen document
        try {
            await chrome.runtime.sendMessage({ type: 'removeIframe', target: 'offscreen' });
            console.log('[Stage 2 Cleanup] Sent removeIframe request to offscreen.');
        } catch (error) {
            console.warn('[Stage 2 Cleanup] Failed to send removeIframe request: ', error);
        }
    };

    try {
        // 1. Ensure Offscreen Document Exists
        await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH, ['IFRAME_SCRIPTING'], 'Load Google Picker API and handle external scripts/UI');

        // 2. Create Iframe in Offscreen Document
        console.log('[Stage 2] Sending createIframe request to offscreen...');
        const createResponse = await chrome.runtime.sendMessage({
            type: 'createIframe',
            target: 'offscreen',
            url: url
        });
        if (!createResponse?.success) {
            throw new Error(`Failed to create iframe in offscreen: ${createResponse?.error || 'Unknown error'}`);
        }
        console.log('[Stage 2] Iframe creation request successful. Waiting for load and script...');

        // 3. Register Dynamic Content Script(s)
        dynamicScripterId = `${DYNAMIC_SCRIPT_ID_PREFIX}${Date.now()}`;

        // Register dependencies and the helper script using file paths
        await chrome.scripting.registerContentScripts([{
            id: dynamicScripterId,
            // Inject dependencies AND the new helper script
            js: ['Readability.js', 'webScraper.js', 'scriptingReadabilityHelper.js'], 
            matches: [url], // Target the specific URL
            runAt: 'document_idle',
            world: 'ISOLATED',
            allFrames: true, // IMPORTANT: Target the iframe
            persistAcrossSessions: false
        }]);
        console.log(`[Stage 2] Registered dynamic script(s): ${dynamicScripterId} (files: Readability.js, webScraper.js, scriptingReadabilityHelper.js)`);

        // 4. Wait for Response from Dynamic Script (with Timeout)
        let messageListener = null;
        const scriptResponsePromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                console.warn(`[Stage 2] Timeout (${IFRAME_LOAD_TIMEOUT / 1000}s) waiting for response from dynamic script.`);
                if (messageListener) {
                    chrome.runtime.onMessage.removeListener(messageListener);
                }
                reject(new Error('Timeout waiting for dynamic script response.'));
            }, IFRAME_LOAD_TIMEOUT);

            messageListener = (message, sender, sendResponse) => {
                if (message?.type === DYNAMIC_SCRIPT_MESSAGE_TYPE) {
                    console.log('[Stage 2] Received response from dynamic script:', message.payload);
                    clearTimeout(timeoutId);
                    chrome.runtime.onMessage.removeListener(messageListener);
                    if (message.payload?.success) {
                        resolve(message.payload); // Resolve with the parsed article data
                    } else {
                        reject(new Error(message.payload?.error || 'Dynamic script reported failure.'));
                    }
                    return false; // No further response needed
                }
                // Important: Return true if other async listeners might handle this message
                // return true;
                return false; // Or false if this listener is exclusive for this type
            };

            chrome.runtime.onMessage.addListener(messageListener);
            console.log('[Stage 2] Listener added for dynamic script response.');
        });

        // 5. Await the result
        const resultPayload = await scriptResponsePromise;

        // 6. Cleanup (successful case)
        await cleanup(dynamicScripterId); // Pass base ID to cleanup
        return resultPayload; // Return the successful payload

    } catch (error) {
        console.error(`[Stage 2] Error during Offscreen + iframe process:`, error);
        // 7. Cleanup (error case)
        await cleanup(dynamicScripterId); // Pass base ID to cleanup
        // Rethrow the error to be caught by the orchestrator
        throw new Error(`Stage 2 (Offscreen + iframe) failed: ${error.message}`);
    }
}


// ========================================================================
// == Temporary Tab + executeScript Scraping (Stage 3)
// ========================================================================

// STAGE 3: Scrapes URL using temporary tab + executeScript + Readability
async function scrapeUrlWithTempTabExecuteScript(url) {
    console.log(`[Stage 3] Attempting Temp Tab + executeScript: ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000; // 30 seconds

    // Function to inject and execute inside the target tab
    function grabContentWithReadability() {
        // Check if Readability is already available (e.g., from content.js injection)
        if (typeof Readability === 'undefined') {
            // Basic check, might need a more robust way if Readability isn't globally attached
            // Or, consider injecting Readability.js library itself via executeScript
            // if this approach proves unreliable across different sites/build setups.
            console.error('[Stage 3 ExecuteScript] Readability class is not available.');
            return { success: false, error: 'Readability library not found in tab context.' };
        }
        try {
            // Using cloneNode(true) is safer as Readability modifies the DOM
            const documentClone = document.cloneNode(true);
            const article = new Readability(documentClone).parse();
            // Return necessary fields
            return {
                success: true,
                title: article ? article.title : '',
                textContent: article ? article.textContent : '',
                content: article ? article.content : '', // HTML content
                byline: article ? article.byline : '',
                length: article ? article.length : 0,
                excerpt: article ? article.excerpt : '',
                siteName: article ? article.siteName : ''
                // Add other fields from Readability Article object if needed
            };
        } catch (e) {
            console.error('[Stage 3 ExecuteScript] Error running Readability:', e);
            return { success: false, error: `Readability execution failed: ${e.message}` };
        }
    }

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg) => {
            console.warn(`[Stage 3] Cleanup: ${errorMsg}`);
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 3] Error removing tab ${tempTabId}: ${err.message}`));
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };

        // 1. Create Tab
        try {
            const tab = await chrome.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
            console.log(`[Stage 3] Created temp tab ${tempTabId} for executeScript.`);
        } catch (error) {
            return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }

        // 2. Wait for Tab Load with Timeout
        let loadTimeoutId = null;
        const loadPromise = new Promise((resolveLoad, rejectLoad) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                // Wait for 'complete' status
                if (tabId === tempTabId && changeInfo.status === 'complete') {
                    console.log(`[Stage 3] Tab ${tempTabId} loaded.`);
                    if (loadTimeoutId) clearTimeout(loadTimeoutId);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolveLoad(); // Tab is ready
                }
                // Consider handling potential load errors here if needed (e.g., changeInfo.status === 'error')
            };
            chrome.tabs.onUpdated.addListener(listener);

            // Timeout
            loadTimeoutId = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1000}s) waiting for page load.`));
            }, TEMP_TAB_LOAD_TIMEOUT);
        });

        try {
            await loadPromise;
        } catch (error) {
            return cleanupAndReject(`Load failed or timed out: ${error.message}`);
        }

        // 3. Execute Script
        console.log(`[Stage 3] Executing script in tab ${tempTabId}`);
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tempTabId },
                func: grabContentWithReadability,
                // world: 'MAIN' // Use MAIN world if Readability relies on page's JS context
                               // Use 'ISOLATED' (default) if Readability is self-contained or injected separately
            });

            // Always clean up tab after script execution attempt
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 3] Error removing tab ${tempTabId} post-execute: ${err.message}`));
                tempTabId = null;
            }

            if (results && results.length > 0 && results[0].result) {
                const scriptResult = results[0].result;
                if (scriptResult.success) {
                    console.log('[Stage 3] executeScript succeeded.');
                    // Resolve with the article object directly
                    resolve(scriptResult);
                } else {
                    // Script ran but reported failure (e.g., Readability error)
                    reject(new Error(scriptResult.error || 'executeScript function reported failure.'));
                }
            } else {
                 // Handle cases where executeScript failed to return a result
                 // Check chrome.runtime.lastError within the callback if not using async/await
                 const lastError = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No result returned';
                 reject(new Error(`executeScript failed: ${lastError}`));
            }

        } catch (error) {
            // Handle errors during the executeScript call itself (e.g., permission issues, invalid target)
            cleanupAndReject(`executeScript call failed: ${error.message}`);
        }
    });
}


// ========================================================================
// == Temporary Tab + Content Script Scraping (Stage 4 - Last Resort)
// ========================================================================

// STAGE 4 (Last Resort): Scrapes URL using temporary tab + content script + Readability
async function scrapeUrlWithTempTab_ContentScript(url) {
    console.log(`[Stage 4] Attempting Temp Tab + Content Script: ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000; // 30 seconds

    return new Promise(async (resolve, reject) => { // Make outer function async for await inside create callback
        const cleanupAndReject = (errorMsg) => {
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => {});
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };

        // 1. Create Tab
        try {
             const tab = await chrome.tabs.create({ url: url, active: false });
             tempTabId = tab.id;
             if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
             console.log(`[Stage 4] Created temp tab ${tempTabId}`);
        } catch(error) {
             return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }
       
        // 2. Wait for Tab Load with Timeout
        let loadTimeoutId = null;
        const loadPromise = new Promise((resolveLoad, rejectLoad) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                if (tabId === tempTabId && changeInfo.status === 'complete') {
                    console.log(`[Stage 4] Tab ${tempTabId} loaded.`);
                    if (loadTimeoutId) clearTimeout(loadTimeoutId);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolveLoad();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            loadTimeoutId = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                rejectLoad(new Error('Timeout waiting for page load.'));
            }, TEMP_TAB_LOAD_TIMEOUT);
        });

        try {
            await loadPromise;
        } catch(error) {
            return cleanupAndReject(error.message);
        }
        
        // 3. Send Scrape Request to Content Script
        console.log(`[Stage 4] Sending SCRAPE_PAGE to content script in tab ${tempTabId}`);
        try {
            const response = await chrome.tabs.sendMessage(tempTabId, { type: 'SCRAPE_PAGE' });
            // Cleanup immediately after getting response (or error)
            if (tempTabId) chrome.tabs.remove(tempTabId).catch(err => {}); 
            tempTabId = null;

            if (response?.success) {
                console.log(`[Stage 4] Success from content script.`);
                resolve(response); // Resolve with the content script's response structure
            } else {
                reject(new Error(response?.error || 'Content script failed or gave invalid response.'));
            }
        } catch (error) {
             // Error during sendMessage or if content script is unavailable
             cleanupAndReject(`Messaging content script failed: ${error.message}`);
        }
    });
}


// ========================================================================
// == Orchestrator Function
// ========================================================================

// Main function to attempt scraping using multiple stages
async function scrapeUrlMultiStage(url, chatId, messageId) {
    console.log(`Scraping Orchestrator: Starting for ${url}. ChatID: ${chatId}, MessageID: ${messageId}`);
    let resultPayload;

    try {
        // --- Stage 1: Try Offscreen Direct ---
        const article = await scrapeUrlWithOffscreen(url);
        console.log(`Scraping Orchestrator: Stage 1 (Offscreen) Succeeded for ${url}.`);
        resultPayload = {
            chatId: chatId,       // Include Chat ID
            messageId: messageId, // Include Message ID
            success: true,
            method: 'offscreenDirect',
            url: url,
            title: article.title,
            textContent: article.textContent,
            content: article.content,
            byline: article.byline,
            length: article.length,
            excerpt: article.excerpt,
            siteName: article.siteName
        };
    } catch (stage1Error) {
        console.warn(`Scraping Orchestrator: Stage 1 (Offscreen Direct) Failed for ${url}: ${stage1Error.message}`);

        try {
            // --- Stage 2: Try Offscreen + iframe ---
            const iframeResult = await scrapeUrlWithOffscreenIframe(url);
            console.log(`Scraping Orchestrator: Stage 2 (Offscreen + iframe) Succeeded for ${url}.`);
            resultPayload = {
                chatId: chatId,       // Include Chat ID
                messageId: messageId, // Include Message ID
                success: true,
                method: 'offscreenIframe',
                url: url,
                ...iframeResult
            };
        } catch (stage2Error) {
            console.warn(`Scraping Orchestrator: Stage 2 (Offscreen + iframe) Failed for ${url}: ${stage2Error.message}`);

            try {
                 // --- Stage 3: Try Temp Tab + executeScript ---
                 const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url);
                 console.log(`Scraping Orchestrator: Stage 3 (Temp Tab + executeScript) Succeeded for ${url}.`);
                 resultPayload = {
                     chatId: chatId,       // Include Chat ID
                     messageId: messageId, // Include Message ID
                     success: true,
                     method: 'tempTabExecuteScript',
                     url: url,
                     ...executeScriptResult
                 };
            } catch (stage3Error) {
                 console.warn(`Scraping Orchestrator: Stage 3 (Temp Tab + executeScript) Failed for ${url}: ${stage3Error.message}`);

                 try {
                    // --- Stage 4: Try Temporary Tab + Content Script (Last Resort) ---
                    const tempTabResult = await scrapeUrlWithTempTab_ContentScript(url);
                    console.log(`Scraping Orchestrator: Stage 4 (Temp Tab + Content Script) Succeeded for ${url}.`);
                    resultPayload = {
                        chatId: chatId,       // Include Chat ID
                        messageId: messageId, // Include Message ID
                        success: true,
                        method: 'tempTabContentScript',
                        url: url,
                        ...tempTabResult
                    };
                 } catch (stage4Error) {
                     console.error(`Scraping Orchestrator: Stage 4 (Temp Tab + Content Script) Failed for ${url}: ${stage4Error.message}`);
                     // --- All Stages Failed ---
                     resultPayload = {
                         chatId: chatId,       // Include Chat ID
                         messageId: messageId, // Include Message ID
                         success: false,
                         url: url,
                         error: stage4Error.message || 'Scraping failed using all available methods.'
                     };
                 }
            }
        }
    }
    return resultPayload; // This payload now includes chatId and messageId
}


// ========================================================================
// == Extension Lifecycle & Event Listeners
// ========================================================================

// --- Side Panel Setup Listener ---
chrome.runtime.onInstalled.addListener(() => {
    // --- RE-ENABLE default open on click ---
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true }) // Let Chrome handle opening
        .catch((error) => console.error('Error setting side panel behavior:', error));
    console.log("Tab Agent background: Side panel behavior set (default open on click).");

    // Clean up storage on install/update (optional)
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log("Cleaned up old detached states on install/update.");
            });
        }
    });
});

// --- Handle Action Click Manually ONLY for closing popups ---
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
        console.error("Action Clicked: Missing tab ID.");
        return;
    }
    const tabId = tab.id;
    console.log(`Action clicked for tab ${tabId}`);

    // Check if a popup exists for this tab
    const existingPopupId = detachedPopups[tabId];

    if (existingPopupId) {
        console.log(`Popup ${existingPopupId} exists for tab ${tabId}. Attempting to close popup.`);
        try {
            // Close the existing popup window
            await chrome.windows.remove(existingPopupId);
            // The onRemoved listener below will handle cleanup of maps and storage.
            console.log(`Closed popup window ${existingPopupId} via action click.`);
            // IMPORTANT: Do NOT try to open the side panel here. Let the *next* click trigger the default behavior.
        } catch (error) {
            console.warn(`Failed to close popup ${existingPopupId} via action click, maybe already closed?`, error);
            // Clean up maps and storage defensively if closing failed, as onRemoved might not trigger
            if (popupIdToTabId[existingPopupId]) {
                 console.log(`Force cleaning maps and storage for tab ${tabId} after failed close.`);
                delete detachedPopups[tabId];
                delete popupIdToTabId[existingPopupId];
                try {
                     await chrome.storage.local.remove(`detachedState_${tabId}`);
                     // Also ensure side panel is enabled for next click
                     await chrome.sidePanel.setOptions({ tabId: tabId, enabled: true });
                } catch (cleanupError) {
                     console.error("Error during defensive cleanup:", cleanupError);
                }
            }
        }
    } else {
        // --- DO NOTHING HERE ---
        console.log(`No popup exists for tab ${tabId}. Default side panel opening behavior should trigger.`);
        // If no popup exists, we let the `setPanelBehavior({ openPanelOnActionClick: true })` handle the opening.
        // We explicitly DO NOT call setOptions or open here to avoid the user gesture error.
    }
});

// --- Listen for Popup Window Closure ---
chrome.windows.onRemoved.addListener(async (windowId) => {
    console.log(`Window removed: ${windowId}`);
    // Check if this was a detached popup we were tracking
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        console.log(`Popup window ${windowId} for tab ${tabId} was closed.`);
        // Clean up the state associated with this tab
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        try {
            await chrome.storage.local.remove(`detachedState_${tabId}`);
            console.log(`Removed detached state from storage for tab ${tabId}`);

            // --- IMPORTANT: Re-enable side panel for the original tab ---
            // This ensures that the next action click can open the side panel via default behavior.
            await chrome.sidePanel.setOptions({ tabId: tabId, enabled: true });
            console.log(`Re-enabled side panel for tab ${tabId} after popup closed.`);

        } catch (error) {
             console.error(`Error cleaning up storage or re-enabling side panel for tab ${tabId} on popup close:`, error);
        }

    } else {
         console.log(`Window ${windowId} closed, but it wasn't a tracked popup.`);
    }
});


// --- Core Message Listener (Handles queries and detach requests) ---
// (Keep this listener exactly the same as the previous version)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background: Received message:", message, "from sender:", sender);

    // --- Handle Query (Modified to check sender context) ---
    if (message.type === 'query') {
        const { text, model, tabId, chatId, messageId } = message; // Extract IDs

        // Validate IDs
        if (!chatId || !messageId) {
            console.error("Background: Received query without chatId or messageId.", message);
            // Try to send error back even without full context if possible
            if (messageId) { // If we have messageId, we can target the placeholder
                chrome.runtime.sendMessage({
                    type: 'error',
                    chatId: chatId || 'unknown', // Include chatId if known
                    messageId: messageId,
                    error: "Missing chat/message ID in query request"
                }).catch(e => console.warn("BG: Error sending missing ID error back:", e));
            }
            sendResponse({ success: false, error: "Missing chat/message ID in query" }); // Acknowledge receipt with error
            return false; // Return false as we handled synchronously
        }

        console.log(`Background: Processing query "${text}" for model "${model}". ChatID: ${chatId}, MessageID: ${messageId}`);

        // --- TODO: Implement Agentic Workflow (Task 7) --- Replace placeholder logic
        const placeholderResponse = `(Tab ${tabId || 'N/A'}) Background received: "${text}". Agent logic for ${model} not implemented.`;

        setTimeout(() => { // Simulate async processing
            try {
                // Check if the sender still exists before sending (important!)
                // Use chrome.runtime.sendMessage to broadcast; sidepanel listener filters by chatId/messageId
                chrome.runtime.sendMessage({ 
                    type: 'response', 
                    chatId: chatId,       // Include Chat ID
                    messageId: messageId, // Include Message ID
                    text: placeholderResponse 
                }).catch(e => console.warn(`BG: Could not send response for ${messageId}, context likely closed.`, e));
                console.log(`Background: Sent placeholder response for ${messageId}.`);
            } catch (error) { 
                // Catch potential immediate errors, though sendMessage itself is async
                console.warn(`Background: Error sending placeholder response for ${messageId}`, error);
                 // Attempt to send an error back to the specific message placeholder
                 chrome.runtime.sendMessage({ 
                     type: 'error', 
                     chatId: chatId,
                     messageId: messageId,
                     error: `Failed to send response: ${error.message}`
                 }).catch(e => console.warn(`BG: Could not send error message for ${messageId} after initial failure.`, e));
            }
        }, 500);
        
        sendResponse({ success: true, message: "Query received, processing..." }); // Acknowledge receipt
        return true; // Indicate async response will be sent later via separate sendMessage

    // --- Handle Request for Tab ID ---
    } else if (message.type === 'getTabId') {
        if (sender.tab && sender.tab.id) {
            try {
                sendResponse({ type: 'tabIdResponse', tabId: sender.tab.id });
            } catch(e) { console.warn("BG: Could not send tabId response"); }
            return false;
        } else {
            // Fallback: get the active tab in the current window
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    try {
                        sendResponse({ type: 'tabIdResponse', tabId: tabs[0].id });
                    } catch(e) { console.warn("BG: Could not send tabId response (fallback)"); }
                } else {
                    console.warn("Background: 'getTabId' fallback could not find active tab.");
                    try {
                        sendResponse({ type: 'error', error: 'Could not determine sender tab ID (no active tab).' });
                    } catch(e) { console.warn("BG: Could not send tabId error response (fallback)"); }
                }
            });
            return true; // Indicate async response needed for query
        }

    // --- Handle Popup Creation Tracking ---
    } else if (message.type === 'popupCreated') {
         if (message.popupId && message.tabId) {
             detachedPopups[message.tabId] = message.popupId;
             popupIdToTabId[message.popupId] = message.tabId;
             console.log(`Background: Tracked popup ${message.popupId} for tab ${message.tabId}`);
             // Optional: Send confirmation back? Not usually needed.
             // sendResponse({ type: 'popupTracked' });
         } else {
             console.error("Background: Invalid 'popupCreated' message:", message);
             // sendResponse({ type: 'error', error: 'Invalid popup tracking info.' });
         }
         return false; // Synchronous processing of this message type

    // --- Handle Get Popup for Tab ---
    } else if (message.type === 'getPopupForTab') {
        // Return the popup window ID for the given tab, if any
        const popupId = detachedPopups[message.tabId];
        if (popupId) {
            sendResponse({ popupId });
        } else {
            sendResponse({ popupId: null });
        }
        return false;

    // --- Handle URL Scraping Request (Using Multi-Stage Fallback) ---
    } else if (message.type === 'TEMP_SCRAPE_URL') {
        const urlToScrape = message.url;
        const { chatId, messageId } = message; // Extract IDs
        const requesterTabId = message.tabId || (sender.tab ? sender.tab.id : null); // Context tab

        // Validate IDs
        if (!chatId || !messageId) {
             console.error("Background: Received TEMP_SCRAPE_URL without chatId or messageId.", message);
             // Cannot easily send error back here as we don't use sendResponse
             // The UI timeout/placeholder logic will have to handle this.
             return false; // Stop processing this invalid request
        }

        console.log(`Background: Received TEMP_SCRAPE_URL for: ${urlToScrape}. ChatID: ${chatId}, MessageID: ${messageId}. Starting multi-stage scrape.`);

        // Use the orchestrator function - run async but don't hold channel open
        (async () => {
            // Pass IDs to the orchestrator
            const finalResultPayload = await scrapeUrlMultiStage(urlToScrape, chatId, messageId);
            
            // Send the final result (success or error payload) back via a new message
            // The payload now contains chatId and messageId
            console.log('[Background Listener] Sending final scrape result:', finalResultPayload);
            try {
                 chrome.runtime.sendMessage({ 
                     type: 'TEMP_SCRAPE_RESULT', 
                     // No longer need to add chatId/messageId here, they are IN the payload
                     payload: finalResultPayload 
                 }).catch(e => console.warn("[Background Listener] Failed to send final scrape result:", e));
            } catch (sendError) {
                 // Catch sync errors during send, though unlikely for sendMessage
                 console.warn(`[Background Listener] Synchronous error sending final scrape result:`, sendError);
            }
        })();

        sendResponse({ success: true, message: "Scrape request received." }); // Acknowledge receipt immediately
        // DO NOT return true here. We send the result later via a separate sendMessage.
        return false; 

    // --- MODIFIED: Handle Request for Drive File List ---
    } else if (message.type === 'requestDriveFileList') {
        const folderId = message.folderId || 'root'; // <<< Get folderId from message
        console.log(`Background: Received requestDriveFileList for folder: ${folderId}`);
        (async () => {
            let files = null;
            let errorMsg = null;
            try {
                const token = await getDriveToken();
                // Pass folderId to the fetch function
                files = await fetchDriveFileList(token, folderId); 
            } catch (error) {
                console.error(`Background: Error handling requestDriveFileList (Folder: ${folderId}):`, error);
                errorMsg = error.message || "Unknown error fetching file list.";
            }
            // Send response back to sidepanel, include folderId for context
            chrome.runtime.sendMessage({
                type: 'driveFileListResponse',
                success: !errorMsg,
                folderId: folderId, // <<< Include folderId in response
                files: files, // Will be null on error
                error: errorMsg
            }).catch(e => console.warn("Background: Failed to send driveFileListResponse", e));
        })();
        sendResponse({ success: true, message: "Request received, fetching file list..."}); // Acknowledge
        return true; // Indicate async response handling

    // --- NEW: Handle Request for Drive File Content ---
    } else if (message.type === 'fetchDriveFileContent') {
        const { fileId, fileName } = message; // Expect fileId and optionally name
        console.log(`Background: Received fetchDriveFileContent for ID: ${fileId}`);
        if (!fileId) {
             console.error("Background: fetchDriveFileContent missing fileId");
             // Send error back? For now, just log.
             return false;
        }
        (async () => {
             let content = null;
             let errorMsg = null;
             try {
                 const token = await getDriveToken(); // Might need error handling if token expired
                 content = await fetchDriveFileContent(token, fileId);
             } catch (error) {
                 console.error(`Background: Error handling fetchDriveFileContent for ${fileId}:`, error);
                 errorMsg = error.message || "Unknown error fetching file content.";
             }
             // Send response back to sidepanel
             chrome.runtime.sendMessage({
                 type: 'driveFileContentResponse',
                 success: !errorMsg,
                 fileId: fileId,
                 fileName: fileName, // Pass name back for context
                 content: content, // Will be placeholder or null on error
                 error: errorMsg
             }).catch(e => console.warn("Background: Failed to send driveFileContentResponse", e));
        })();
         sendResponse({ success: true, message: "Request received, fetching file content..."}); // Acknowledge
         return true; // Indicate async response handling

    // --- Handle messages intended for the *parsing* offscreen document --- 
    } else if (message.target === 'offscreen' && (message.type === 'parseHTML' || message.type === 'createIframe' || message.type === 'removeIframe')){
        console.log(`Background: Forwarding ${message.type} message to parsing offscreen document.`);
         (async () => {
            const parsingPath = OFFSCREEN_DOCUMENT_PATH;
            try {
                 await setupOffscreenDocument(
                     parsingPath,
                     ['DOM_PARSER', 'IFRAME_SCRIPTING'],
                     'Parse HTML content and manage scraping iframes'
                 );
                 const response = await chrome.runtime.sendMessage(message);
                 console.log(`Background: Received response from parsing offscreen for ${message.type}:`, response);
             } catch (error) {
                 console.error(`Background: Error ensuring/communicating with parsing offscreen document for ${message.type}:`, error);
             }
         })();
         return false; 
    } else if (message.target === 'offscreen_google_drive') {
        console.warn("Background: Received message explicitly targeted to 'offscreen_google_drive' outside of picker initiation flow. Ignoring.");
        return false;
    // --- Handle Unknown ---
    } else {
        console.log("Background: Received unknown message type:", message.type);
        try {
            sendResponse({ type: 'error', error: 'Unknown message type received by background script.' });
        } catch (e) {
            console.warn("Background: Could not send error response for unknown message type.");
        }
        return false; // Synchronous response or no response needed
    }
});

// --- TODO: Add Model Loading, Scraping, RAG, Agent setup ---

console.log("Tab Agent background script loaded and listening for messages.");

// Optional Keep Alive (Uncomment if needed)
// let lifeline; keepAlive(); ... etc

// ========================================================================
// == Google Drive API Integration
// ========================================================================

async function getDriveToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(token);
            }
        });
    });
}

// MODIFIED: Accepts folderId and fetches files/folders within it
async function fetchDriveFileList(token, folderId = 'root') { 
    const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)"; // Adjust fields as needed
    // MODIFIED QUERY: Filter by parent folder and include folders
    const query = `'${folderId}' in parents and trashed=false`; 
    const pageSize = 100; // Increase page size slightly?
    const orderBy = 'folder,modifiedTime desc'; // List folders first, then by date

    const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
        pageSize: pageSize.toString(),
        q: query,
        fields: fields,
        orderBy: orderBy 
    })}`;

    console.log(`Background: Fetching Drive list for folder '${folderId}': ${url}`);
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error(`Background: Drive API files.list error (Folder: ${folderId}):`, response.status, errorData);
        // Handle specific errors like 404 Not Found for folderId
        if (response.status === 404) {
            throw new Error(`Folder with ID '${folderId}' not found or access denied.`);
        }
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }

    const data = await response.json();
    console.log(`Background: Drive API files.list success (Folder: ${folderId}). Found ${data.files?.length || 0} items.`);
    return data.files || []; // Return the array of files/folders
}

async function fetchDriveFileContent(token, fileId) {
    // TODO: Implement file content fetching (Phase 2)
    console.warn(`Background: fetchDriveFileContent not implemented yet for fileId: ${fileId}`);
    return `(Content fetch not implemented for ${fileId})`; // Placeholder
    // Example structure for text:
    // const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    // const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    // if (!response.ok) throw new Error(...);
    // const content = await response.text();
    // return content;
}