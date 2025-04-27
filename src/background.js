const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';


let detachedPopups = {};
let popupIdToTabId = {};

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

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
                    { header: 'x-frame-options', operation: 'remove' },
                    { header: 'X-Frame-Options', operation: 'remove' },
                    { header: 'content-security-policy', operation: 'remove' },
                    { header: 'Content-Security-Policy', operation: 'remove' }
                ]
            },
            condition: {
                resourceTypes: ['main_frame'],
                urlFilter: '|http*://*/*|'
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

updateDeclarativeNetRequestRules();

async function hasOffscreenDocument(path) {
    const filename = path.split('/').pop();
    const targetUrl = chrome.runtime.getURL(filename);
    console.log(`[Debug] hasOffscreenDocument: Checking for URL: ${targetUrl}`);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [targetUrl]
    });
    console.log(`[Debug] hasOffscreenDocument: Found ${existingContexts.length} matching contexts.`);
    return existingContexts.length > 0;
}

async function setupOffscreenDocument(path, reasons, justification) {
    if (await hasOffscreenDocument(path)) {
        console.log(`Background: Offscreen document at ${path} already exists.`);
        return;
    }
    const filename = path.split('/').pop();
    console.log(`Background: Creating offscreen document using filename: ${filename}...`);
    await chrome.offscreen.createDocument({
        url: filename,
        reasons: reasons,
        justification: justification,
    });
    console.log(`Background: Offscreen document created successfully using ${filename}.`);
}

async function scrapeUrlWithOffscreenIframe(url) {
    console.log(`[Stage 2] Attempting Offscreen + iframe: ${url}`);
    const DYNAMIC_SCRIPT_ID_PREFIX = 'offscreen-scrape-';
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult';
    const IFRAME_LOAD_TIMEOUT = 30000;
    let dynamicScripterId = null;

    const cleanup = async (scriptIdBase) => {
        console.log(`[Stage 2 Cleanup] Starting cleanup for script ID base: ${scriptIdBase}`);
        if (scriptIdBase) {
             try {
                 await chrome.scripting.unregisterContentScripts({ ids: [scriptIdBase] });
                 console.log(`[Stage 2 Cleanup] Unregistered script: ${scriptIdBase}`);
             } catch (error) {
                 console.warn(`[Stage 2 Cleanup] Failed to unregister script ${scriptIdBase}:`, error);
             }
        }
        try {
            await chrome.runtime.sendMessage({ type: 'removeIframe', target: 'offscreen' });
            console.log('[Stage 2 Cleanup] Sent removeIframe request to offscreen.');
        } catch (error) {
            console.warn('[Stage 2 Cleanup] Failed to send removeIframe request: ', error);
        }
    };

    try {
        await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH, ['DOM_PARSER', 'IFRAME_SCRIPTING'], 'Parse HTML content and manage scraping iframes');
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
        dynamicScripterId = `${DYNAMIC_SCRIPT_ID_PREFIX}${Date.now()}`;
        await chrome.scripting.registerContentScripts([{
            id: dynamicScripterId,
            js: ['PageExtractor.js', 'stage2-helper.js'],
            matches: [url],
            runAt: 'document_idle',
            world: 'ISOLATED',
            allFrames: true,
            persistAcrossSessions: false
        }]);
        console.log(`[Stage 2] Registered dynamic script(s): ${dynamicScripterId} (files: PageExtractor.js, stage2-helper.js)`);
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
                        resolve(message.payload);
                    } else {
                        reject(new Error(message.payload?.error || 'Dynamic script reported failure.'));
                    }
                    return false;
                }
                return false;
            };
            chrome.runtime.onMessage.addListener(messageListener);
            console.log('[Stage 2] Listener added for dynamic script response.');
        });
        const resultPayload = await scriptResponsePromise;
        await cleanup(dynamicScripterId);
        return resultPayload;
    } catch (error) {
        console.error(`[Stage 2] Error during Offscreen + iframe process:`, error);
        await cleanup(dynamicScripterId);
        throw new Error(`Stage 2 (Offscreen + iframe) failed: ${error.message}`);
    }
}

async function scrapeUrlWithTempTabExecuteScript(url) {
    console.log(`[Stage 3] Attempting Temp Tab + executeScript (using window.scraper.extract): ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg) => {
            console.warn(`[Stage 3] Cleanup: ${errorMsg}`);
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 3] Error removing tab ${tempTabId}: ${err.message}`));
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };
        try {
            const tab = await chrome.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
            console.log(`[Stage 3] Created temp tab ${tempTabId} for executeScript.`);
        } catch (error) {
            return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }
        let loadTimeoutId = null;
        const loadPromise = new Promise((resolveLoad, rejectLoad) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                if (tabId === tempTabId && changeInfo.status === 'complete') {
                    console.log(`[Stage 3] Tab ${tempTabId} loaded.`);
                    if (loadTimeoutId) clearTimeout(loadTimeoutId);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolveLoad();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
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
        console.log(`[Stage 3] Injecting PageExtractor.js and calling window.scraper.extract() in tab ${tempTabId}`);
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tempTabId },
                files: ['PageExtractor.js']
            });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tempTabId },
                func: () => window.scraper.extract(),
            });
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 3] Error removing tab ${tempTabId} post-execute: ${err.message}`));
                tempTabId = null;
            }
            if (results && results.length > 0 && results[0].result) {
                const scriptResult = results[0].result;
                if (scriptResult && typeof scriptResult === 'object') {
                    console.log('[Stage 3] window.scraper.extract() succeeded.');
                    resolve(scriptResult);
                } else {
                    reject(new Error(scriptResult?.error || 'window.scraper.extract() failed or returned null.'));
                }
            } else {
                 const lastError = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No result returned';
                 reject(new Error(`executeScript failed: ${lastError}`));
            }
        } catch (error) {
            cleanupAndReject(`executeScript call failed: ${error.message}`);
        }
    });
}

async function scrapeUrlWithTempTab_ContentScript(url) {
    console.log(`[Stage 4] Attempting Temp Tab + Content Script: ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg) => {
            if (tempTabId) {
                chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 4] Error removing tab ${tempTabId} during cleanup: ${err.message}`));
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };
        try {
             const tab = await chrome.tabs.create({ url: url, active: false });
             tempTabId = tab.id;
             if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
             console.log(`[Stage 4] Created temp tab ${tempTabId}`);
        } catch(error) {
             return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }
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
        console.log(`[Stage 4] Sending SCRAPE_PAGE to content script in tab ${tempTabId}`);
        try {
            const response = await chrome.tabs.sendMessage(tempTabId, { type: 'SCRAPE_PAGE' });
            if (tempTabId) chrome.tabs.remove(tempTabId).catch(err => console.warn(`[Stage 4] Error removing tab ${tempTabId} post-message: ${err.message}`));
            tempTabId = null;
            if (response?.success) {
                console.log(`[Stage 4] Success from content script.`);
                resolve(response);
            } else {
                reject(new Error(response?.error || 'Content script failed or gave invalid response.'));
            }
        } catch (error) {
             cleanupAndReject(`Messaging content script failed: ${error.message}`);
        }
    });
}

async function scrapeUrlMultiStage(url, chatId, messageId) {
    console.log(`Scraping Orchestrator: Starting for ${url}. ChatID: ${chatId}, MessageID: ${messageId}`);
    const sendStageResult = (stageResult) => {
        console.log(`[Orchestrator] Sending STAGE_SCRAPE_RESULT for Stage ${stageResult.stage}, ChatID: ${chatId}, Success: ${stageResult.success}`);
        chrome.runtime.sendMessage({
            type: 'STAGE_SCRAPE_RESULT',
            payload: stageResult
        }).catch(e => console.warn(`[Orchestrator] Failed to send result for Stage ${stageResult.stage}:`, e));
    };

    // --- Outer try block to ensure finally always runs --- 
    try { 
        try {
            const iframeResult = await scrapeUrlWithOffscreenIframe(url);
            console.log(`[Orchestrator Log] Stage 2 (Offscreen + iframe) Succeeded for ${url}.`);
            const stage2SuccessPayload = {
                stage: 2, success: true, chatId: chatId, messageId: messageId,
                method: 'offscreenIframe', url: url,
                length: iframeResult?.text?.length || 0,
                ...iframeResult
            };
            sendStageResult(stage2SuccessPayload);
            return; // <<< Return early on success
        } catch (stage2Error) {
            console.warn(`[Orchestrator Log] Stage 2 (Offscreen + iframe) Failed for ${url}: ${stage2Error.message}`);
            sendStageResult({ stage: 2, success: false, chatId: chatId, messageId: messageId, error: stage2Error.message });
        }

        // --- If Stage 2 failed, try Stage 3 --- 
        try {
             const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url);
             console.log(`[Orchestrator Log] Stage 3 (Temp Tab + executeScript) Succeeded for ${url}.`);
             const stage3SuccessPayload = {
                stage: 3, success: true, chatId: chatId, messageId: messageId,
                method: 'tempTabExecuteScript', url: url,
                length: executeScriptResult?.text?.length || 0,
                ...executeScriptResult
             };
             sendStageResult(stage3SuccessPayload);
             return; // <<< Return early on success
        } catch (stage3Error) {
             console.warn(`[Orchestrator Log] Stage 3 (Temp Tab + executeScript) Failed for ${url}: ${stage3Error.message}`);
             sendStageResult({ stage: 3, success: false, chatId: chatId, messageId: messageId, error: stage3Error.message });
        }

        // --- If Stage 3 failed, try Stage 4 --- 
        try {
            const tempTabResult = await scrapeUrlWithTempTab_ContentScript(url);
            console.log(`[Orchestrator Log] Stage 4 (Temp Tab + Content Script) Succeeded for ${url}.`);
            const stage4SuccessPayload = {
                stage: 4, success: true, chatId: chatId, messageId: messageId,
                method: 'tempTabContentScript', url: url,
                length: tempTabResult?.text?.length || 0,
                ...tempTabResult
            };
            console.log("[Orchestrator Log] Stage 4 Payload being sent:", stage4SuccessPayload);
            sendStageResult(stage4SuccessPayload);
            return; // <<< Return early on success
        } catch (stage4Error) {
             console.warn(`[Orchestrator Log] Stage 4 (Temp Tab + Content Script) Failed for ${url}: ${stage4Error.message}`);
             sendStageResult({ stage: 4, success: false, chatId: chatId, messageId: messageId, error: stage4Error.message });
        }

        // --- If we reach here, all stages failed --- 
        console.log("[Orchestrator Log] All stages failed.");

    // --- ADDED Finally block for cleanup --- 
    } finally { 
        console.log("[Orchestrator Cleanup] Attempting to close offscreen document after multi-stage scrape.");
        try {
            if (await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
                await chrome.offscreen.closeDocument();
                console.log("[Orchestrator Cleanup] Offscreen document closed successfully.");
            } else {
                 console.log("[Orchestrator Cleanup] No offscreen document found to close.");
            }
        } catch (error) {
            console.warn("[Orchestrator Cleanup] Error closing offscreen document:", error);
        }
    }
    // --- END Finally block ---
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Error setting side panel behavior:', error));
    console.log("Tab Agent background: Side panel behavior set (default open on click).");
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log("Cleaned up old detached states on install/update.");
            });
        }
    });
});

chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
        console.error("Action Clicked: Missing tab ID.");
        return;
    }
    const tabId = tab.id;
    console.log(`Action clicked for tab ${tabId}`);
    const existingPopupId = detachedPopups[tabId];
    if (existingPopupId) {
        console.log(`Popup ${existingPopupId} exists for tab ${tabId}. Attempting to close popup.`);
        try {
            await chrome.windows.remove(existingPopupId);
            console.log(`Closed popup window ${existingPopupId} via action click.`);
        } catch (error) {
            console.warn(`Failed to close popup ${existingPopupId} via action click, maybe already closed?`, error);
            if (popupIdToTabId[existingPopupId]) {
                 console.log(`Force cleaning maps and storage for tab ${tabId} after failed close.`);
                delete detachedPopups[tabId];
                delete popupIdToTabId[existingPopupId];
                try {
                     await chrome.storage.local.remove(`detachedState_${tabId}`);
                     await chrome.sidePanel.setOptions({ tabId: tabId, enabled: true });
                } catch (cleanupError) {
                     console.error("Error during defensive cleanup:", cleanupError);
                }
            }
        }
    } else {
        console.log(`No popup exists for tab ${tabId}. Default side panel opening behavior should trigger.`);
    }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
    console.log(`Window removed: ${windowId}`);
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        console.log(`Popup window ${windowId} for tab ${tabId} was closed.`);
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        try {
            await chrome.storage.local.remove(`detachedState_${tabId}`);
            console.log(`Removed detached state from storage for tab ${tabId}`);
            await chrome.sidePanel.setOptions({ tabId: tabId, enabled: true });
            console.log(`Re-enabled side panel for tab ${tabId} after popup closed.`);
        } catch (error) {
             console.error(`Error cleaning up storage or re-enabling side panel for tab ${tabId} on popup close:`, error);
        }
    } else {
         console.log(`Window ${windowId} closed, but it wasn't a tracked popup.`);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background: Received message:", message, "from sender:", sender);
    if (message.type === 'query') {
        const { text, model, tabId, chatId, messageId } = message;
        if (!chatId || !messageId) {
            console.error("Background: Received query without chatId or messageId.", message);
            if (messageId) {
                chrome.runtime.sendMessage({
                    type: 'error',
                    chatId: chatId || 'unknown',
                    messageId: messageId,
                    error: "Missing chat/message ID in query request"
                }).catch(e => console.warn("BG: Error sending missing ID error back:", e));
            }
            sendResponse({ success: false, error: "Missing chat/message ID in query" });
            return false;
        }
        console.log(`Background: Processing query "${text}" for model "${model}". ChatID: ${chatId}, MessageID: ${messageId}`);
        const isUrl = text && (text.startsWith('http://') || text.startsWith('https://'));
        if (isUrl) {
            console.log(`Background: Query is a URL, initiating scrape for ${text}`);
             (async () => {
                 await scrapeUrlMultiStage(text, chatId, messageId);
             })();
             sendResponse({ success: true, message: "URL query received, initiating scrape..." });
             return false;
        } else {
            console.log(`Background: Query is not a URL, using placeholder logic for "${text}"`);
            const placeholderResponse = `(Tab ${tabId || 'N/A'}) Background received non-URL: "${text}". Agent logic for ${model} not implemented.`;
            
            try {
                console.log(`Background: Sending immediate response for ${messageId}.`);
                chrome.runtime.sendMessage({ 
                    type: 'response',
                    chatId: chatId,
                    messageId: messageId,
                    text: placeholderResponse
                }).catch(e => console.warn(`BG: Could not send response for ${messageId}, context likely closed.`, e));
                console.log(`Background: Sent placeholder response for ${messageId}.`);
            } catch (error) {
                console.warn(`Background: Error sending placeholder response for ${messageId}`, error);
                 chrome.runtime.sendMessage({ 
                     type: 'error',
                     chatId: chatId,
                     messageId: messageId,
                     error: `Failed to send response: ${error.message}`
                 }).catch(e => console.warn(`BG: Could not send error message for ${messageId} after initial failure.`, e));
            }
            
            sendResponse({ success: true, message: "Non-URL query received, processing..." });
            return true;
        }
    } else if (message.type === 'getTabId') {
        if (sender.tab && sender.tab.id) {
            try {
                sendResponse({ type: 'tabIdResponse', tabId: sender.tab.id });
            } catch(e) { console.warn("BG: Could not send tabId response"); }
            return false;
        } else {
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
            return true;
        }
    } else if (message.type === 'popupCreated') {
         if (message.popupId && message.tabId) {
             detachedPopups[message.tabId] = message.popupId;
             popupIdToTabId[message.popupId] = message.tabId;
             console.log(`Background: Tracked popup ${message.popupId} for tab ${message.tabId}`);
         } else {
             console.error("Background: Invalid 'popupCreated' message:", message);
         }
         return false;
    } else if (message.type === 'getPopupForTab') {
        const popupId = detachedPopups[message.tabId];
        if (popupId) {
            sendResponse({ popupId });
        } else {
            sendResponse({ popupId: null });
        }
        return false;
    } else if (message.type === 'TEMP_SCRAPE_URL') {
        const urlToScrape = message.url;
        const { chatId, messageId } = message;
        const requesterTabId = message.tabId || (sender.tab ? sender.tab.id : null);
        if (!chatId || !messageId) {
             console.error("Background: Received TEMP_SCRAPE_URL without chatId or messageId.", message);
             return false;
        }
        console.log(`Background: Received TEMP_SCRAPE_URL for: ${urlToScrape}. ChatID: ${chatId}, MessageID: ${messageId}. Starting multi-stage scrape.`);
        (async () => {
            await scrapeUrlMultiStage(urlToScrape, chatId, messageId);
        })();
        sendResponse({ success: true, message: "Scrape request received." });
        return false;
    } else if (message.type === 'getDriveFileList') {
        const folderId = message.folderId || 'root';
        console.log(`Background: Received getDriveFileList for folder: ${folderId}`);
        (async () => {
            let files = null;
            let errorMsg = null;
            try {
                const token = await getDriveToken();
                files = await fetchDriveFileList(token, folderId);
            } catch (error) {
                console.error(`Background: Error handling getDriveFileList (Folder: ${folderId}):`, error);
                errorMsg = error.message || "Unknown error fetching file list.";
            }
            chrome.runtime.sendMessage({
                type: 'driveFileListResponse',
                success: !errorMsg,
                folderId: folderId,
                files: files,
                error: errorMsg
            }).catch(e => console.warn("Background: Failed to send driveFileListResponse", e));
        })();
        sendResponse({ success: true, message: "Request received, fetching file list..."});
        return true;
    } else if (message.type === 'fetchDriveFileContent') {
        const { fileId, fileName } = message;
        console.log(`Background: Received fetchDriveFileContent for ID: ${fileId}`);
        if (!fileId) {
             console.error("Background: fetchDriveFileContent missing fileId");
             return false;
        }
        (async () => {
             let content = null;
             let errorMsg = null;
             try {
                 const token = await getDriveToken();
                 content = await fetchDriveFileContent(token, fileId);
             } catch (error) {
                 console.error(`Background: Error handling fetchDriveFileContent for ${fileId}:`, error);
                 errorMsg = error.message || "Unknown error fetching file content.";
             }
             chrome.runtime.sendMessage({
                 type: 'driveFileContentResponse',
                 success: !errorMsg,
                 fileId: fileId,
                 fileName: fileName,
                 content: content,
                 error: errorMsg
             }).catch(e => console.warn("Background: Failed to send driveFileContentResponse", e));
        })();
         sendResponse({ success: true, message: "Request received, fetching file content..."});
         return true;
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
    } else {
        console.log("Background: Received unknown message type:", message.type);
        try {
            sendResponse({ type: 'error', error: 'Unknown message type received by background script.' });
        } catch (e) {
            console.warn("Background: Could not send error response for unknown message type.");
        }
        return false;
    }
});

console.log("Tab Agent background script loaded and listening for messages.");

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

async function fetchDriveFileList(token, folderId = 'root') {
    const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)";
    const query = `'${folderId}' in parents and trashed=false`;
    const pageSize = 100;
    const orderBy = 'folder,modifiedTime desc';
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
        if (response.status === 404) {
            throw new Error(`Folder with ID '${folderId}' not found or access denied.`);
        }
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }
    const data = await response.json();
    console.log(`Background: Drive API files.list success (Folder: ${folderId}). Found ${data.files?.length || 0} items.`);
    return data.files || [];
}

async function fetchDriveFileContent(token, fileId) {
    console.warn(`Background: fetchDriveFileContent not implemented yet for fileId: ${fileId}`);
    return `(Content fetch not implemented for ${fileId})`;
}