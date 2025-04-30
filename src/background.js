const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
const MODEL_WORKER_OFFSCREEN_PATH = 'offscreenWorker.html'; // New path for model worker offscreen doc

let detachedPopups = {};
let popupIdToTabId = {};

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

// ------------ Model Worker Offscreen Communication (New) ------------

// Possible states: 'uninitialized', 'creating_worker', 'worker_script_ready', 'loading_model', 'model_ready', 'generating', 'error'
let modelWorkerState = 'uninitialized';
let workerScriptReadyPromise = null; // Promise resolved when worker script is loaded
let workerScriptReadyResolver = null;
let workerScriptReadyRejecter = null;
let modelLoadPromise = null; // Promise resolved when model finishes loading
let modelLoadResolver = null;
let modelLoadRejecter = null;

// Keep track of active generation requests to route back responses
// Key: correlationId (e.g., messageId or chatId), Value: { sender, resolve, reject, ... }
let activeGenerations = {};

// Helper to check if the dedicated model worker offscreen document exists
async function hasModelWorkerOffscreenDocument() {
    const targetUrl = chrome.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [targetUrl]
    });
    return existingContexts.length > 0;
}

// Function to create the offscreen document for the model worker if it doesn't exist
async function setupModelWorkerOffscreenDocument() {
    if (await hasModelWorkerOffscreenDocument()) {
        console.log("Background: Model worker offscreen document already exists.");
        return;
    }
    console.log("Background: Creating model worker offscreen document...");
    await chrome.offscreen.createDocument({
        url: MODEL_WORKER_OFFSCREEN_PATH,
        reasons: [chrome.offscreen.Reason.WORKERS], // Specify reason for worker usage
        justification: 'Run model inference in a separate worker via offscreen document',
    });
    console.log("Background: Model worker offscreen document created.");
}

// Function to send a message to the model worker via the offscreen document
async function sendToModelWorkerOffscreen(message) {
    // Ensure the worker script is at least ready before sending operational messages like 'init' or 'generate'
    if (message.type !== 'init' && message.type !== 'generate' && message.type !== 'interrupt' && message.type !== 'reset') {
        // For other messages, just ensure the doc potentially exists
         if (modelWorkerState === 'uninitialized' || !(await hasModelWorkerOffscreenDocument())){
             console.log(`Background: Ensuring model worker offscreen doc potentially exists before sending ${message?.type}`);
             await setupModelWorkerOffscreenDocument();
        }
    } else {
        // For core operations, wait until the worker script is confirmed running
        console.log(`Background: Ensuring worker script is ready before sending ${message.type}...`);
        try {
            await ensureWorkerScriptIsReady(); // Wait for worker script to load
            console.log(`Background: Worker script confirmed ready. Proceeding to send ${message.type}.`);
        } catch (error) {
             console.error(`Background: Worker script failed to become ready. Cannot send ${message.type}. Error:`, error);
             modelWorkerState = 'error';
             throw new Error(`Worker script failed to initialize, cannot send ${message.type}.`);
        }
    }


    console.log(`Background: Sending message type '${message?.type}' to model worker offscreen doc`);
    try {
        // The message goes to the offscreen script, which forwards it to the worker
        // Use a more robust way to target the specific offscreen document if multiple exist
        const contexts = await chrome.runtime.getContexts({
             contextTypes: ['OFFSCREEN_DOCUMENT'],
             documentUrls: [chrome.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH)]
        });
        if (contexts.length > 0) {
             // Send the message generally; the listener in the target offscreen document will pick it up.
            chrome.runtime.sendMessage(message);
            // Fallback if direct contextId messaging isn't supported:
            // await chrome.runtime.sendMessage(message); // Original broadcast method
        console.log(`Background: Message type '${message?.type}' sent to offscreen.`);
        return { success: true };
        } else {
             console.error(`Background: Could not find target offscreen document context to send ${message?.type}.`);
             throw new Error(`Target offscreen document not found.`);
        }
    } catch (error) {
        console.error(`Background: Error sending message type '${message?.type}' to offscreen:`, error);
        // Don't close the document here, worker might still be recoverable or state handled via messages
        modelWorkerState = 'error'; // Mark state as error on send failure

        // Reject relevant promise if send fails
        if (message.type === 'init') {
            if(modelLoadRejecter) modelLoadRejecter(new Error(`Failed to send init message: ${error.message}`));
            modelLoadPromise = null;
        } else if (workerScriptReadyRejecter && (modelWorkerState === 'uninitialized' || modelWorkerState === 'creating_worker')) {
            // If sending fails very early, reject script ready promise
            workerScriptReadyRejecter(new Error(`Failed to send message early: ${error.message}`));
            workerScriptReadyPromise = null;
        }

        throw new Error(`Failed to send message to model worker offscreen: ${error.message}`);
    }
}

// Function to ensure the worker SCRIPT is ready (doesn't wait for model)
function ensureWorkerScriptIsReady() {
    console.log(`[ensureWorkerScriptIsReady] Current state: ${modelWorkerState}`);
    if (modelWorkerState !== 'uninitialized' && modelWorkerState !== 'creating_worker') {
         // If it's loading_model, model_ready, generating, or error, the script *was* ready
         if(modelWorkerState === 'error' && !workerScriptReadyPromise) {
             return Promise.reject(new Error("Worker script initialization previously failed."));
         }
        return Promise.resolve(); // Script is already loaded or beyond that stage
    }
    if (workerScriptReadyPromise) {
        return workerScriptReadyPromise; // Return existing promise
    }

    console.log("[ensureWorkerScriptIsReady] Worker script not ready. Initializing and creating promise.");
    modelWorkerState = 'creating_worker'; // New state indicating setup is in progress
    workerScriptReadyPromise = new Promise((resolve, reject) => {
        workerScriptReadyResolver = resolve;
        workerScriptReadyRejecter = reject;

        setupModelWorkerOffscreenDocument().catch(err => {
             console.error("[ensureWorkerScriptIsReady] Error setting up offscreen doc:", err);
             modelWorkerState = 'error';
             if(workerScriptReadyRejecter) workerScriptReadyRejecter(err);
             workerScriptReadyPromise = null;
        });
        // Now we wait for the 'workerScriptReady' message from the worker itself
    });

    // Optional: Timeout for script loading itself (shorter than model load)
    const scriptLoadTimeout = 30000; // 30 seconds
    setTimeout(() => {
        if (modelWorkerState === 'creating_worker' && workerScriptReadyRejecter) {
            console.error(`[ensureWorkerScriptIsReady] Timeout (${scriptLoadTimeout}ms) waiting for workerScriptReady.`);
            workerScriptReadyRejecter(new Error('Timeout waiting for model worker script to load.'));
            modelWorkerState = 'error';
            workerScriptReadyPromise = null;
        }
    }, scriptLoadTimeout);


    return workerScriptReadyPromise;
}

// Function to initiate and wait for the MODEL to load (called after UI interaction)
async function loadModel(modelId) {
    console.log(`[loadModel] Request to load model: ${modelId}. Current state: ${modelWorkerState}`);

    // Ensure the worker script itself is ready and the offscreen doc exists
    try {
        await ensureWorkerScriptIsReady(); // Wait for the worker setup promise
        console.log(`[loadModel] Worker script confirmed ready (state: ${modelWorkerState}). Proceeding with model load.`);
    } catch (err) {
        console.error("[loadModel] Failed to ensure worker script readiness:", err);
        throw new Error(`Failed to ensure worker script readiness: ${err.message}`);
    }

    // Now check the state again, it *should* be ready, but double-check
    if (modelWorkerState !== 'worker_script_ready' && modelWorkerState !== 'idle' && modelWorkerState !== 'error') {
        const errorMsg = `Cannot load model '${modelId}'. Worker state is '${modelWorkerState}', expected 'worker_script_ready', 'idle', or 'error'.`;
        console.error("[loadModel] State check failed:", errorMsg);
        throw new Error(errorMsg);
    }

    if (!modelId) {
        return Promise.reject(new Error("Cannot load model: Model ID not provided."));
    }
    console.log(`[loadModel] Request to load model: ${modelId}. Current state: ${modelWorkerState}`);

    // Check if the *correct* model is already loaded or loading
    // (Requires tracking the currently loaded/loading model ID - TODO)
    // For now, we assume any 'model_ready' or 'loading_model' state is for the requested model
    // A more robust implementation would track the specific model ID.
    if (modelWorkerState === 'model_ready') {
        console.log(`[loadModel] Model appears ready. Assuming it's ${modelId}.`);
        return Promise.resolve();
    }
    if (modelWorkerState === 'loading_model' && modelLoadPromise) {
        console.log(`[loadModel] Model is already loading. Assuming it's ${modelId}.`);
        return modelLoadPromise;
    }
    if (modelWorkerState !== 'worker_script_ready') {
        console.error("[loadModel] Cannot load model. Worker script is not ready. State:", modelWorkerState);
        return Promise.reject(new Error(`Cannot load model, worker script not ready (state: ${modelWorkerState})`));
    }

    console.log(`[loadModel] Worker script ready. Initiating load for model: ${modelId}.`);
    modelWorkerState = 'loading_model';
    // TODO: Store the modelId being loaded
    modelLoadPromise = new Promise((resolve, reject) => {
        modelLoadResolver = resolve;
        modelLoadRejecter = reject;

        // Send the 'init' message with the specific modelId
        console.log(`[loadModel] Attempting to send 'init' message for model: ${modelId}`);
        sendToModelWorkerOffscreen({ type: 'init', payload: { modelId: modelId } })
            .catch(err => {
                console.error(`[loadModel] Failed to send 'init' message for ${modelId}:`, err);
                modelWorkerState = 'error'; // Set state back
                if (modelLoadRejecter) modelLoadRejecter(err);
                modelLoadPromise = null;
            });
    });

    // Optional: Timeout for the full model load
    const modelLoadTimeout = 300000; // 5 minutes
    setTimeout(() => {
        if (modelWorkerState === 'loading_model' && modelLoadRejecter) {
            console.error(`[loadModel] Timeout (${modelLoadTimeout}ms) waiting for model ${modelId} load completion.`);
            modelLoadRejecter(new Error(`Timeout waiting for model ${modelId} to load.`));
            modelWorkerState = 'error';
            modelLoadPromise = null;
        }
    }, modelLoadTimeout);

    return modelLoadPromise;
}

// ------------ End Model Worker Comms ------------

// --- DNR Rule Setup (Unchanged) ---
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

// --- Original Offscreen Document Setup (for scraping/parsing, keep if used) ---
// Make sure this uses OFFSCREEN_DOCUMENT_PATH, not MODEL_WORKER_OFFSCREEN_PATH
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

// --- Scraping Logic (Unchanged, uses original offscreen doc if needed) ---
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

// --- Lifecycle Listeners ---
chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed or updated:", details.reason);
    // Setup side panel
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Error setting side panel behavior:', error));
    console.log("Tab Agent background: Side panel behavior set (default open on click).");
    // Cleanup old storage
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log("Cleaned up old detached states on install/update.");
            });
        }
    });

    // Trigger initial worker SCRIPT readiness check (don't wait for model)
    ensureWorkerScriptIsReady().catch(err => {
        console.error("Initial worker script readiness check failed:", err);
    });
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Extension startup.");
    // Check worker script readiness on startup
    if (modelWorkerState === 'uninitialized') {
         ensureWorkerScriptIsReady().catch(err => {
             console.error("Initial worker script readiness check failed on startup:", err);
         });
    }
});

// --- Action/Window Listeners (Unchanged) ---
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

// Variable to track progress logging
let lastLoggedProgress = -10; // Initialize to ensure the first 0-10% update gets logged

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;
    let isResponseAsync = false;

    // Debugging: Log all incoming messages
    // console.log(`[DEBUG Background Listener] Raw message: `, message, ` from: `, sender);

    console.log(`[Background Listener] Received message type '${type}' from`, sender.tab ? `tab ${sender.tab.id}` : sender.url || sender.id);

    // --- Handle Messages FROM Model Worker (via Offscreen) ---
    // Identify messages likely from our offscreen worker
    const workerMessageTypes = [
        'workerScriptReady', // NEW: Worker script loaded, before model download
        'workerReady',       // OLD name, now means MODEL is loaded
        'loadingStatus',
        'generationStatus',
        'generationUpdate',
        'generationComplete',
        'generationError',
        'resetComplete',
        'error'
    ];

    if (workerMessageTypes.includes(type)) {
        console.log(`[Background Listener] Handling message from worker: ${type}`);
        switch (type) {
             case 'workerScriptReady': // Worker script is loaded, ready for 'init'
                 console.log("[Background] Worker SCRIPT is ready!");
                 modelWorkerState = 'worker_script_ready';
                 if (workerScriptReadyResolver) {
                     workerScriptReadyResolver();
                     workerScriptReadyPromise = null;
                 }
                 // Optional: Notify UI that the worker script is up, but model needs loading
                 chrome.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'script_ready' } }).catch(()=>{/*ignore*/});
                break;

            case 'workerReady': // Model finished loading successfully
                console.log("[Background] Worker MODEL is ready! Model:", payload?.model);
                modelWorkerState = 'model_ready'; // Final ready state
                if (modelLoadResolver) {
                    modelLoadResolver(); // Resolve the promise waiting for model load
                    modelLoadPromise = null; // Clear promise
                }
                 // Notify UI that the model is ready
                chrome.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'model_ready', model: payload?.model } }).catch(()=>{/*ignore*/});
                // Ensure script ready promise is also resolved if somehow missed
                 if (workerScriptReadyResolver) {
                    workerScriptReadyResolver();
                    workerScriptReadyPromise = null;
                 }
                 break;
            case 'loadingStatus':
                // Throttle progress logging
                if (payload?.status === 'progress' && payload?.progress) {
                    const currentProgress = Math.floor(payload.progress);
                    if (currentProgress >= lastLoggedProgress + 10) {
                        console.log("[Background] Worker loading status (progress):", payload);
                        lastLoggedProgress = currentProgress;
                    } // Else: Skip logging frequent progress updates
                } else {
                    // Log non-progress statuses or if progress data is missing
                    console.log("[Background] Worker loading status (other):", payload);
                    lastLoggedProgress = -10; // Reset for next progress sequence
                }

                // State should already be 'loading_model' if this message is received
                if (modelWorkerState !== 'loading_model') {
                     console.warn(`[Background] Received loadingStatus in unexpected state: ${modelWorkerState}`);
                     modelWorkerState = 'loading_model'; // Correct the state
                }
                // Forward to UI
                chrome.runtime.sendMessage({ type: 'uiLoadingStatusUpdate', payload: payload }).catch(err => {
                    if (err.message !== "Could not establish connection. Receiving end does not exist.") {
                         console.warn("[Background] Error sending loading status to UI:", err.message);
                    }
                });
                break;
             case 'generationStatus':
                 console.log(`[Background] Generation status: ${payload?.status}`);
                 if (payload?.status === 'generating') modelWorkerState = 'generating';
                 else if (payload?.status === 'interrupted') modelWorkerState = 'model_ready'; // Ready for next command
                 // Forward to UI
                 // forwardToSidePanel(payload.correlationId, { type: 'generationStatus', payload });
                 break;
            case 'generationUpdate':
                 // console.log("[Background] Generation update chunk received."); // Too noisy
                 if (modelWorkerState !== 'generating') {
                      console.warn(`[Background] Received generationUpdate in unexpected state: ${modelWorkerState}`);
                 }
                 modelWorkerState = 'generating'; // Ensure state is correct
                 // Forward chunk to specific chat in UI
                 // forwardToSidePanel(payload.correlationId, { type: 'generationUpdate', payload });
                 break;
            case 'generationComplete':
                 console.log("[Background] Generation complete.");
                 modelWorkerState = 'model_ready'; // Back to ready state
                 // Forward final result to UI
                 // forwardToSidePanel(payload.correlationId, { type: 'generationComplete', payload });
                 break;
            case 'generationError':
                 console.error("[Background] Generation error from worker:", payload);
                 modelWorkerState = 'error'; // Generation failed, go to error state
                 // Forward error to UI
                 // forwardToSidePanel(payload.correlationId, { type: 'generationError', payload });
                 break;
             case 'resetComplete':
                 console.log("[Background] Worker reset complete.");
                 // Reset should bring it back to a known good state
                 // If model was loaded, it should still be loaded unless reset clears it. Assume ready.
                 modelWorkerState = 'model_ready'; // Or 'worker_script_ready' if reset clears model? Assume 'model_ready'.
                 // Notify UI?
                 break;
             case 'error': // Generic error from worker/offscreen
                 console.error("[Background] Received generic error from worker/offscreen:", payload);
                 const previousState = modelWorkerState;
                 modelWorkerState = 'error'; // Go to error state
                 // Reject any pending promises based on when the error occurred
                 if (previousState === 'creating_worker' && workerScriptReadyRejecter) {
                     workerScriptReadyRejecter(new Error(payload || 'Generic error during script init'));
                     workerScriptReadyPromise = null;
                 } else if (previousState === 'loading_model' && modelLoadRejecter) {
                      modelLoadRejecter(new Error(payload || 'Generic error during model load'));
                      modelLoadPromise = null;
                 }
                 // Notify UI
                 chrome.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'error', error: payload } }).catch(()=>{/*ignore*/});
                 break;
        }
        // Ensure ALL messages identified as from the worker get forwarded
        forwardMessageToSidePanelOrPopup(message, sender);
        return false; // These are informational, background doesn't directly respond to worker
    }

    // --- Handle Messages FROM Side Panel / UI ---

    // NEW: Handle 'loadModel' request from UI
    if (type === 'loadModel') {
        console.log(`[Background Listener] Received 'loadModel' request from sender:`, sender);
        const modelId = payload?.modelId;
        console.log(`[Background] Received 'loadModel' request from UI for model: ${modelId}.`);
        if (!modelId) {
            console.error("[Background] 'loadModel' request missing modelId.");
            sendResponse({ success: false, error: "Model ID not provided in request." });
            return false; // Synchronous response
        }

        isResponseAsync = true; // Will respond after attempting load
        loadModel(modelId) // Pass the modelId here
           .then(() => {
                console.log(`[Background] loadModel(${modelId}) promise resolved successfully.`);
                sendResponse({ success: true, message: `Model loading initiated or already complete for ${modelId}.` });
                    })
                    .catch(error => {
                console.error(`[Background] loadModel(${modelId}) failed:`, error);
                        sendResponse({ success: false, error: error.message });
                    });
        return isResponseAsync;
    }

    // Example: Assuming side panel sends a message like { type: 'sendChatMessage', payload: { chatId: '...', messages: [...], options: {...} } }
    if (type === 'sendChatMessage') { // Replace with your actual message type from UI
        isResponseAsync = true;
        const { chatId, messages, options, messageId } = payload;
        const correlationId = messageId || chatId;

        // Ensure MODEL is ready before generating
        // **Important**: We need to know which model the UI *thinks* is loaded.
        // For now, assume the last requested model via loadModel() is the target.
        // A more robust solution might pass the expected modelId with the chat message.
        if (modelWorkerState !== 'model_ready') {
             console.error(`[Background] Cannot send chat message. Model state is ${modelWorkerState}, not 'model_ready'.`);
              sendResponse({ success: false, error: `Model not ready (state: ${modelWorkerState}). Please load a model first.` });
              return false; // Synchronous response
        }

        // Proceed only if model is ready
        console.log(`[Background] Model ready, sending generate request for ${correlationId}`);
        sendToModelWorkerOffscreen({
            type: 'generate',
            payload: {
                messages: messages,
                max_new_tokens: options?.max_new_tokens,
                temperature: options?.temperature,
                top_k: options?.top_k,
                correlationId: correlationId
            }
        })
        .then(sendResult => {
            if (!sendResult.success) throw new Error("Failed to send generate message initially.");
            console.log(`[Background] Generate request sent for ${correlationId}. Waiting for worker responses.`);
            sendResponse({ success: true, message: "Generation request forwarded to worker."});
        })
        .catch(error => {
            console.error(`[Background] Error processing sendChatMessage for ${correlationId}:`, error);
            if (modelWorkerState === 'generating') modelWorkerState = 'model_ready';
            sendResponse({ success: false, error: error.message });
        });

        return isResponseAsync;
    }

    // Example: Handle interrupt request from UI
    if (type === 'interruptGeneration') { // Replace with your actual message type
         console.log("[Background] Received interrupt request from UI.");
         // Should only require script to be ready, not necessarily the model (can interrupt loading? No, only generation)
         ensureWorkerScriptIsReady() // Check if worker script is running
            .then(() => sendToModelWorkerOffscreen({ type: 'interrupt' }))
                    .then(() => sendResponse({ success: true }))
                    .catch(err => sendResponse({ success: false, error: err.message }));
         isResponseAsync = true;
         return isResponseAsync;
    }

    // Example: Handle reset request from UI
     if (type === 'resetWorker') { // Replace with your actual message type
         console.log("[Background] Received reset request from UI.");
          ensureWorkerScriptIsReady() // Check if worker script is running
             .then(() => sendToModelWorkerOffscreen({ type: 'reset' }))
                    .then(() => sendResponse({ success: true }))
                    .catch(err => sendResponse({ success: false, error: err.message }));
         isResponseAsync = true;
         return isResponseAsync;
     }

    // --- Handle other message types (e.g., scraping, detach, etc.) ---
    // ... (existing logic) ...

    // If we haven't handled the message and aren't responding asynchronously, log it.
    if (!isResponseAsync) {
         console.warn(`[Background Listener] Unhandled message type: ${type}`);
    }
    return isResponseAsync; // Return true if any handler uses sendResponse asynchronously
});

// --- Google Drive Functions (Unchanged) ---
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

// --- Detach/Reattach Functions (Unchanged) ---
async function handleDetach(tabId) { /* ... existing code ... */ }
async function handleReattach(windowId) { /* ... existing code ... */ }

// Helper to forward worker messages (like progress) to the correct UI context
async function forwardMessageToSidePanelOrPopup(message, originalSender) { // Renamed sender param to avoid conflict
    console.log(`[Forwarder] Attempting to forward message type '${message?.type}' from worker.`);
    // Forward to any detached popups associated with the original tab if applicable
    // Note: The 'sender' here is the offscreen worker, which doesn't have a tab ID.
    // We need a way to know which UI instance initiated the load if multiple are open.
    // For now, broadcasting to all potential UIs (side panels/popups).

    // Option 1: Broadcast to all detached popups
    for (const tabId in detachedPopups) {
        const popupId = detachedPopups[tabId];
        console.log(`[Forwarder] Forwarding message to detached popup ID: ${popupId} (original tab: ${tabId})`); // Added log
        try {
            await chrome.windows.get(popupId); // Check if window still exists
            // Attempt to send directly to the popup context ID if possible
            // If not, sending to the popup window might work if it has a listener
            // chrome.runtime.sendMessage({ targetPopupId: popupId, ...message }); // Need a specific handler
            // Let's stick to a general broadcast for now if direct context messaging fails
            chrome.runtime.sendMessage(message); // Send generally, hoping popup listener catches it

        } catch (error) {
            console.warn(`[Forwarder] Error sending to detached popup ID ${popupId}:`, error.message);
            if (error.message.includes("No window with id")) {
                // Clean up stale entry
                delete detachedPopups[tabId];
                delete popupIdToTabId[popupId];
            }
        }
    }

    // Option 2: Try sending to the side panel of the tab that *might* have originated the request
    // This is less reliable if the message doesn't contain original context info.
    // Let's find *all* active side panels/tabs and send to them? Might be overkill.
    // For now, let's try sending to *all* tabs where the extension might be active.
    // This is broad, but necessary if we don't track the originator precisely.
    const tabs = await chrome.tabs.query({ status: 'complete' }); // Query only complete tabs
    for (const tab of tabs) {
        if (detachedPopups[tab.id]) continue; // Skip tabs with detached popups already handled
        try {
            // Check if side panel is enabled/open for this tab? chrome.sidePanel API needed.
            // For now, just try sending. Errors will be caught.
            await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            // Ignore errors like "Could not establish connection..." if the side panel isn't open
            if (!error.message.includes('Could not establish connection') && !error.message.includes('Receiving end does not exist')) {
                console.warn(`[Forwarder] Error forwarding message to tab ${tab.id}:`, error.message);
            }
        }
    }
}

console.log("[Background-Simple] Script loaded and listening.");