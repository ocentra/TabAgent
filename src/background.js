import browser from 'webextension-polyfill';
import './minimaldb.js'; // Static import for service worker compatibility
const MODEL_WORKER_OFFSCREEN_PATH = 'modelLoaderWorkerOffscreen.html';
import * as logClient from './log-client.js';
import { eventBus } from './eventBus.js';
import { UIEventNames, WorkerEventNames, ModelWorkerStates, RuntimeMessageTypes, DBEventNames, ModelLoaderMessageTypes, DirectDBNames } from './events/eventNames.js';
import { addModelAsset, getModelAsset, countModelAssetChunks, verifyModelAsset, listModelFiles } from './minimaldb.js';

logClient.init('Background');


let detachedPopups = {};
let popupIdToTabId = {};

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

let modelWorkerState = ModelWorkerStates.UNINITIALIZED;
let workerScriptReadyPromise = null;
let workerScriptReadyResolver = null;
let workerScriptReadyRejecter = null;
let modelLoadPromise = null;
let modelLoadResolver = null;
let modelLoadRejecter = null;

let activeGenerations = {};

let currentLogSessionId = null;
let previousLogSessionId = null;

let background_lastLoggedProgress = -1;


// Log Session Management
async function initializeSessionIds() {
    let { currentLogSessionId: storedCurrentId, previousLogSessionId: storedPreviousId } = await browser.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
    if (storedCurrentId) {
        // Already initialized for this session
        currentLogSessionId = storedCurrentId;
        previousLogSessionId = storedPreviousId || null;
        logClient.logInfo('Current log session ID (already set):', currentLogSessionId);
        logClient.logInfo('Previous log session ID (already set):', previousLogSessionId);
        return;
    }
    // Not set yet, so generate new
    currentLogSessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    logClient.logInfo('Current log session ID (new):', currentLogSessionId);
    await browser.storage.local.set({ currentLogSessionId: currentLogSessionId });
    previousLogSessionId = storedPreviousId || null;
    logClient.logInfo('Previous log session ID found in storage:', previousLogSessionId);
    await browser.storage.local.set({ previousLogSessionId: currentLogSessionId });
    logClient.logInfo('Stored new previousLogSessionId for next run.');
}

// Model Worker Offscreen Communication
async function hasModelWorkerOffscreenDocument() {
    const targetUrl = browser.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH);
    const existingContexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [targetUrl]
    });
    return existingContexts.length > 0;
}

async function setupModelWorkerOffscreenDocument() {
    if (await hasModelWorkerOffscreenDocument()) {
        logClient.logInfo("Model worker offscreen document already exists.");
        return;
    }
    logClient.logInfo("Creating model worker offscreen document...");
    await browser.offscreen.createDocument({
        url: MODEL_WORKER_OFFSCREEN_PATH,
        reasons: [browser.offscreen.Reason.WORKERS],
        justification: 'Run model inference in a separate worker via offscreen document',
    });
    logClient.logInfo("Model worker offscreen document created.");
}

async function sendToModelWorkerOffscreen(message) {
    if (message.type !== 'init' && message.type !== 'generate' && message.type !== 'interrupt' && message.type !== 'reset') {
        if (modelWorkerState === ModelWorkerStates.UNINITIALIZED || !(await hasModelWorkerOffscreenDocument())) {
            logClient.logInfo(`Background: Ensuring model worker offscreen doc potentially exists before sending ${message?.type}`);
            await setupModelWorkerOffscreenDocument();
        }
    } else {
        logClient.logDebug(`Background: Ensuring worker script is ready before sending ${message.type}...`);
        try {
            await ensureWorkerScriptIsReady();
            logClient.logDebug(`Background: Worker script confirmed ready. Proceeding to send ${message.type}.`);
        } catch (error) {
            logClient.logError(`Background: Worker script failed to become ready. Cannot send ${message.type}. Error:`, error);
            modelWorkerState = ModelWorkerStates.ERROR;
            throw new Error(`Worker script failed to initialize, cannot send ${message.type}.`);
        }
    }

    logClient.logDebug(`Background: Sending message type '${message?.type}' to model worker offscreen doc`);
    try {
        const contexts = await browser.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [browser.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH)]
        });
        if (contexts.length > 0) {
            browser.runtime.sendMessage(message);
            logClient.logDebug(`Background: Message type '${message?.type}' sent to offscreen.`);
            return { success: true };
        } else {
            logClient.logError(`Background: Could not find target offscreen document context to send ${message?.type}.`);
            throw new Error(`Target offscreen document not found.`);
        }
    } catch (error) {
        logClient.logError(`Background: Error sending message type '${message?.type}' to offscreen:`, error);
        modelWorkerState = ModelWorkerStates.ERROR;
        if (message.type === 'init') {
            if (modelLoadRejecter) modelLoadRejecter(new Error(`Failed to send init message: ${error.message}`));
            modelLoadPromise = null;
        } else if (workerScriptReadyRejecter && (modelWorkerState === ModelWorkerStates.UNINITIALIZED || modelWorkerState === ModelWorkerStates.CREATING_WORKER)) {
            workerScriptReadyRejecter(new Error(`Failed to send message early: ${error.message}`));
            workerScriptReadyPromise = null;
        }
        throw new Error(`Failed to send message to model worker offscreen: ${error.message}`);
    }
}

function ensureWorkerScriptIsReady() {
    logClient.logDebug(`[ensureWorkerScriptIsReady] Current state: ${modelWorkerState}`);
    if (modelWorkerState !== ModelWorkerStates.UNINITIALIZED && modelWorkerState !== ModelWorkerStates.CREATING_WORKER) {
        if (modelWorkerState === ModelWorkerStates.ERROR && !workerScriptReadyPromise) {
            return Promise.reject(new Error("Worker script initialization previously failed."));
        }
        return Promise.resolve();
    }
    if (workerScriptReadyPromise) {
        return workerScriptReadyPromise;
    }

    logClient.logDebug("[ensureWorkerScriptIsReady] Worker script not ready. Initializing and creating promise.");
    modelWorkerState = ModelWorkerStates.CREATING_WORKER;
    workerScriptReadyPromise = new Promise((resolve, reject) => {
        workerScriptReadyResolver = resolve;
        workerScriptReadyRejecter = reject;

        setupModelWorkerOffscreenDocument().catch(err => {
            logClient.logError("[ensureWorkerScriptIsReady] Error setting up offscreen doc:", err);
            modelWorkerState = ModelWorkerStates.ERROR;
            if (workerScriptReadyRejecter) workerScriptReadyRejecter(err);
            workerScriptReadyPromise = null;
        });
    });

    const scriptLoadTimeout = 30000;
    setTimeout(() => {
        if (modelWorkerState === ModelWorkerStates.CREATING_WORKER && workerScriptReadyRejecter) {
            logClient.logError(`[ensureWorkerScriptIsReady] Timeout (${scriptLoadTimeout}ms) waiting for workerScriptReady.`);
            workerScriptReadyRejecter(new Error('Timeout waiting for model worker script to load.'));
            modelWorkerState = ModelWorkerStates.ERROR;
            workerScriptReadyPromise = null;
        }
    }, scriptLoadTimeout);

    return workerScriptReadyPromise;
}

async function loadModel(modelId) {
    await ensureWorkerScriptIsReady();
    logClient.logInfo('Worker script ready, requesting asset download from offscreen');

    let fileMap = null;
    try {
        // Send message to offscreen document to download assets
        fileMap = await browser.runtime.sendMessage({
            type: ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS,
            payload: { modelId }
        }).then(response => {
            if (!response || !response.success) {
                throw new Error(response && response.error ? response.error : 'Unknown error from offscreen asset download');
            }
            return response.fileMap;
        });
    } catch (err) {
        logClient.logError('[Background] Error in offscreen downloadModelAssets:', err, JSON.stringify(err));
        throw err;
    }
    logClient.logInfo('Model asset download complete for', modelId);

    modelWorkerState = ModelWorkerStates.LOADING_MODEL;
    modelLoadPromise = new Promise((resolve, reject) => {
        modelLoadResolver = resolve;
        modelLoadRejecter = reject;
        sendToModelWorkerOffscreen({ type: 'init', payload: { modelId: modelId, localAssets: fileMap } })
            .catch(err => {
                logClient.logError('Failed to send init message for', modelId, err);
                modelWorkerState = ModelWorkerStates.ERROR;
                if (modelLoadRejecter) modelLoadRejecter(err);
                modelLoadPromise = null;
            });
    });
    const modelLoadTimeout = 300000;
    setTimeout(() => {
        if (modelWorkerState === ModelWorkerStates.LOADING_MODEL && modelLoadRejecter) {
            logClient.logError('Timeout (' + modelLoadTimeout + 'ms) waiting for model', modelId, 'load completion.');
            modelLoadRejecter(new Error('Timeout waiting for model ' + modelId + ' to load.'));
            modelWorkerState = ModelWorkerStates.ERROR;
            modelLoadPromise = null;
        }
    }, modelLoadTimeout);
    return modelLoadPromise;
}

// Declarative Net Request Management
async function updateDeclarativeNetRequestRules() {
    const currentRules = await browser.declarativeNetRequest.getDynamicRules();
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
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rulesToRemove,
            addRules: rulesToAdd
        });
        logClient.logInfo("Declarative Net Request rules updated successfully.");
    } catch (error) {
        logClient.logError("Error updating Declarative Net Request rules:", error);
    }
}
updateDeclarativeNetRequestRules();






async function scrapeUrlWithTempTabExecuteScript(url) {
    logClient.logInfo(`[Stage 1 (ExecuteScript)] Attempting Temp Tab + executeScript: ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg, errorObj = null) => {
            const finalError = errorObj ? errorObj : new Error(errorMsg);
            logClient.logWarn(`[Stage 1 (ExecuteScript)] Cleanup & Reject: ${errorMsg}`, errorObj);
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 1 (ExecuteScript)] Error removing tab ${tempTabId}: ${err.message}`));
                tempTabId = null;
            }
            reject(finalError);
        };

        try {
            const tab = await browser.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) {
                cleanupAndReject('[Stage 1 (ExecuteScript)] Failed to get temporary tab ID.');
                return;
            }
            logClient.logInfo(`[Stage 1 (ExecuteScript)] Created temp tab ${tempTabId}.`);

            // Wait for the tab to load
            let loadTimeoutId = null;
            const loadPromise = new Promise((resolveLoad, rejectLoad) => {
                const listener = (tabIdUpdated, changeInfo, updatedTab) => {
                    if (tabIdUpdated === tempTabId && changeInfo.status === 'complete') {
                        logClient.logInfo(`[Stage 1 (ExecuteScript)] Tab ${tempTabId} loaded.`);
                        if (loadTimeoutId) clearTimeout(loadTimeoutId);
                        browser.tabs.onUpdated.removeListener(listener);
                        resolveLoad();
                    }
                };
                browser.tabs.onUpdated.addListener(listener);
                loadTimeoutId = setTimeout(() => {
                    browser.tabs.onUpdated.removeListener(listener);
                    rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1000}s) waiting for page load in tab ${tempTabId}.`));
                }, TEMP_TAB_LOAD_TIMEOUT);
            });

            await loadPromise;
            logClient.logInfo(`[Stage 1 (ExecuteScript)] Page loaded. Injecting pageExtractor.js module into tab ${tempTabId}...`);

            // 1. Inject the PageExtractor.js script
            await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                files: ['pageExtractor.js'] 
            });
            logClient.logInfo(`[Stage 1 (ExecuteScript)] pageExtractor.js module INJECTED successfully into tab ${tempTabId}.`);

            // 2. Execute a function that calls the globally exposed extract method
            logClient.logInfo(`[Stage 1 (ExecuteScript)] Executing function to call window.TabAgentPageExtractor.extract in tab ${tempTabId}...`);
            const injectionResults = await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                func: () => { // Arrow function for lexical this, though not strictly needed here
                    if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                        try {
                            return window.TabAgentPageExtractor.extract(document);
                        } catch (e) {
                            console.error('[In-Tab] Error during execution of PageExtractor.extract:', e);
                            return { error: `Error in PageExtractor.extract: ${e.message} (Stack: ${e.stack})` };
                        }
                    } else {
                        console.error('[In-Tab] TabAgentPageExtractor or its extract function not found on window.');
                        return { error: 'TabAgentPageExtractor.extract function not found on window.' };
                    }
                }
            });

            logClient.logInfo('[Stage 1 (ExecuteScript)] Raw results from executeScript func:', injectionResults);

            if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
                cleanupAndReject('[Stage 1 (ExecuteScript)] No result returned from executeScript func.', injectionResults && injectionResults[0] ? injectionResults[0].error : null);
                return;
            }

            const scriptResult = injectionResults[0].result;

            if (scriptResult && scriptResult.error) {
                cleanupAndReject(`[Stage 1 (ExecuteScript)] Script execution reported an error: ${scriptResult.error}`, scriptResult);
                return;
            }
            
            if (scriptResult && typeof scriptResult === 'object') {
                logClient.logInfo('[Stage 1 (ExecuteScript)] pageExtractor.js module execution succeeded (returned object).');
                resolve(scriptResult);
            } else {
                cleanupAndReject('[Stage 1 (ExecuteScript)] pageExtractor.js module returned unexpected non-object/error type.', scriptResult);
            }

        } catch (error) {
            cleanupAndReject(`[Stage 1 (ExecuteScript)] Error: ${error.message}`, error);
        } finally {
            if (tempTabId) { // Ensure tab is closed if something went wrong before explicit resolve/reject
                browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 1 (ExecuteScript)] Error removing tab ${tempTabId} in final catch: ${err.message}`));
            }
        }
    });
}


async function scrapeUrlMultiStage(url, chatId, messageId) {
    logClient.logInfo(`Scraping Orchestrator: Starting for ${url}. ChatID: ${chatId}, MessageID: ${messageId}`);
    const sendStageResult = (stageResult) => {
        logClient.logInfo(`[Orchestrator] Sending STAGE_SCRAPE_RESULT for Stage ${stageResult.stage}, ChatID: ${chatId}, Success: ${stageResult.success}`);
        browser.runtime.sendMessage({
            type: 'STAGE_SCRAPE_RESULT',
            payload: stageResult
        }).catch(e => logClient.logWarn(`[Orchestrator] Failed to send result for Stage ${stageResult.stage}:`, e));
    };


    try {
        try {
            const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url);
            logClient.logInfo(`[Orchestrator Log] Stage 1 (Temp Tab + executeScript) Succeeded for ${url}.`);
            const stage1SuccessPayload = {
                stage: 1, success: true, chatId: chatId, messageId: messageId,
                method: 'tempTabExecuteScript', url: url,
                length: executeScriptResult?.text?.length || 0,
                ...executeScriptResult
            };
            sendStageResult(stage1SuccessPayload);
            return; 
        } catch (stage1Error) {
            logClient.logWarn(`[Orchestrator Log] Stage 1 (Temp Tab + executeScript) Failed for ${url}: ${stage1Error.message}`);
            sendStageResult({ stage: 1, success: false, chatId: chatId, messageId: messageId, method: 'tempTabExecuteScript', error: stage1Error.message });
            return; 
        }


    } finally {
        logClient.logInfo(`[Scraping Orchestrator] Finished processing for ${url}.`);
    }
}

// Google Drive Integration
async function getDriveToken() {
    return new Promise((resolve, reject) => {
        browser.identity.getAuthToken({ interactive: true }, (token) => {
            if (browser.runtime.lastError) {
                reject(new Error(browser.runtime.lastError.message));
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
    logClient.logInfo(`Background: Fetching Drive list for folder '${folderId}': ${url}`);
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        const errorData = await response.text();
        logClient.logError(`Background: Drive API files.list error (Folder: ${folderId}):`, response.status, errorData);
        if (response.status === 404) {
            throw new Error(`Folder with ID '${folderId}' not found or access denied.`);
        }
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }
    const data = await response.json();
    logClient.logInfo(`Background: Drive API files.list success (Folder: ${folderId}). Found ${data.files?.length || 0} items.`);
    return data.files || [];
}



async function forwardMessageToSidePanelOrPopup(message, originalSender) {
    logClient.logInfo(`Attempting to forward message type '${message?.type}' from worker.`);
    for (const tabId in detachedPopups) {
        const popupId = detachedPopups[tabId];
        logClient.logInfo(`Forwarding message to detached popup ID: ${popupId} (original tab: ${tabId})`);
        try {
            await browser.windows.get(popupId);
            browser.runtime.sendMessage(message);
        } catch (error) {
            logClient.logWarn(`Error sending to detached popup ID ${popupId}:`, error.message);
            if (error.message.includes("No window with id")) {
                delete detachedPopups[tabId];
                delete popupIdToTabId[popupId];
            }
        }
    }

    const tabs = await browser.tabs.query({ status: 'complete' });
    for (const tab of tabs) {
        if (detachedPopups[tab.id]) continue;
        try {
            await browser.tabs.sendMessage(tab.id, message);
        } catch (error) {
            if (!error.message.includes('Could not establish connection') && !error.message.includes('Receiving end does not exist')) {
                logClient.logWarn(`Error forwarding message to tab ${tab.id}:`, error.message);
            }
        }
    }
}

browser.runtime.onInstalled.addListener(async (details) => {
    logClient.logInfo('onInstalled event fired. Reason:', details.reason);
    await initializeSessionIds();
    await eventBus.autoEnsureDbInitialized();
    browser.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => logClient.logError('Error setting side panel behavior:', error));
    logClient.logInfo('Side panel behavior set.');
    browser.storage.local.get().then((items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) {
            browser.storage.local.remove(keysToRemove).then(() => {
                logClient.logInfo('Cleaned up old storage keys on install/update.');
            }).catch(err => {
                logClient.logError('Error removing old storage keys:', err);
            });
        }
    }).catch(err => {
         logClient.logError('Error getting storage items for cleanup:', err);
    });
    ensureWorkerScriptIsReady().catch(err => {
        logClient.logError("Initial worker script readiness check failed after install:", err);
    });
});

browser.runtime.onStartup.addListener(async () => {
    logClient.logInfo('onStartup event fired.');
    await initializeSessionIds();
    await eventBus.autoEnsureDbInitialized();
    if (modelWorkerState === ModelWorkerStates.UNINITIALIZED) {
        ensureWorkerScriptIsReady().catch(err => {
            logClient.logError("Worker script readiness check failed on startup:", err);
        });
    }
});

browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
        logClient.logError("Action Clicked: Missing tab ID.");
        return;
    }
    const tabId = tab.id;
    logClient.logInfo(`Action clicked for tab ${tabId}`);
    const existingPopupId = detachedPopups[tabId];
    if (existingPopupId) {
        logClient.logInfo(`Popup ${existingPopupId} exists for tab ${tabId}. Attempting to close popup.`);
        try {
            await browser.windows.remove(existingPopupId);
            logClient.logInfo(`Closed popup window ${existingPopupId} via action click.`);
        } catch (error) {
            logClient.logWarn(`Failed to close popup ${existingPopupId} via action click, maybe already closed?`, error);
            if (popupIdToTabId[existingPopupId]) {
                logClient.logInfo(`Force cleaning maps and storage for tab ${tabId} after failed close.`);
                delete detachedPopups[tabId];
                delete popupIdToTabId[existingPopupId];
                try {
                    await browser.storage.local.remove(`detachedState_${tabId}`);
                    await browser.sidePanel.setOptions({ tabId: tabId, enabled: true });
                } catch (cleanupError) {
                    logClient.logError("Error during defensive cleanup:", cleanupError);
                }
            }
        }
    } else {
        logClient.logInfo(`No popup exists for tab ${tabId}. Default side panel opening behavior should trigger.`);
    }
});

browser.windows.onRemoved.addListener(async (windowId) => {
    logClient.logInfo(`Window removed: ${windowId}`);
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        logClient.logInfo(`Popup window ${windowId} for tab ${tabId} was closed.`);
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        try {
            await browser.storage.local.remove(`detachedState_${tabId}`);
            logClient.logInfo(`Removed detached state from storage for tab ${tabId}`);
            await browser.sidePanel.setOptions({ tabId: tabId, enabled: true });
            logClient.logInfo(`Re-enabled side panel for tab ${tabId} after popup closed.`);
        } catch (error) {
            logClient.logError(`Error cleaning up storage or re-enabling side panel for tab ${tabId} on popup close:`, error);
        }
    } else {
        logClient.logInfo(`Window ${windowId} closed, but it wasn't a tracked popup.`);
    }
});

// Message Handling
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {


    logClient.logInfo('[Background] Received message: type:', message?.type);

    const { type, payload } = message;
    let isResponseAsync = false;

    logClient.logInfo(`Received message type '${type}' from`, sender.tab ? `tab ${sender.tab.id}` : sender.url || sender.id);

    if (Object.values(WorkerEventNames).includes(type)) {
        logClient.logInfo(`[Background][ModelLoader] Handling message from worker: ${type}`);
        let uiUpdatePayload = null;
        switch (type) {
            case WorkerEventNames.WORKER_SCRIPT_READY:
                logClient.logInfo("[Background][ModelLoader] Worker SCRIPT is ready!");
                modelWorkerState = ModelWorkerStates.WORKER_SCRIPT_READY;
                if (workerScriptReadyResolver) {
                    workerScriptReadyResolver();
                    workerScriptReadyPromise = null;
                }
                uiUpdatePayload = { modelStatus: 'script_ready' };
                break;
            case WorkerEventNames.WORKER_READY:
                logClient.logInfo(`[Background][ModelLoader] Worker MODEL is ready! Model: ${payload?.model}`);
                modelWorkerState = ModelWorkerStates.MODEL_READY;
                if (modelLoadResolver) {
                    modelLoadResolver();
                    modelLoadPromise = null;
                }
                uiUpdatePayload = { modelStatus: 'model_ready', model: payload?.model };
                if (workerScriptReadyResolver) {
                    workerScriptReadyResolver();
                    workerScriptReadyPromise = null;
                }
                break;
            case WorkerEventNames.LOADING_STATUS:
                // Only log at 1% increments
                if (payload && typeof payload.progress === 'number') {
                    if (!background_lastLoggedProgress || Math.floor(payload.progress) > background_lastLoggedProgress) {
                        background_lastLoggedProgress = Math.floor(payload.progress);
                        logClient.logInfo(`[Background][ModelLoader] Progress: ${payload.file || ''} ${background_lastLoggedProgress}%`);
                    }
                } else {
                    logClient.logInfo(`[Background][ModelLoader] Worker loading status (other):`, payload);
                }
                // Forward to UI
                browser.runtime.sendMessage({
                    type: UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE,
                    payload: payload
                });
                break;
            case WorkerEventNames.ERROR:
                logClient.logError(`[Background][ModelLoader] Worker error:`, payload);
                break;
            default:
                logClient.logInfo(`[Background][ModelLoader] Worker event: ${type}`, payload);
                break;
        }
        if (uiUpdatePayload) {
            browser.runtime.sendMessage({
                type: UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE,
                payload: uiUpdatePayload
            });
        }
        return false;
    }

    if (type === RuntimeMessageTypes.LOAD_MODEL) {
        logClient.logInfo(`Received 'loadModel' request from sender:`, sender);
        const modelId = payload?.modelId;
        logClient.logInfo(`Received 'loadModel' request from UI for model: ${modelId}.`);
        if (!modelId) {
            logClient.logError("[Background] 'loadModel' request missing modelId.");
            sendResponse({ success: false, error: "Model ID not provided in request." });
            return false;
        }

        isResponseAsync = true;
        loadModel(modelId)
            .then(() => {
                logClient.logInfo(`loadModel(${modelId}) promise resolved successfully.`);
                sendResponse({ success: true, message: `Model loading initiated or already complete for ${modelId}.` });
            })
            .catch(error => {
                logClient.logError(`loadModel(${modelId}) failed:`, error);
                sendResponse({ success: false, error: error.message });
            });
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        isResponseAsync = true;
        const { chatId, messages, options, messageId } = payload;
        const correlationId = messageId || chatId;

        if (modelWorkerState !== ModelWorkerStates.MODEL_READY) {
            logClient.logError(`Cannot send chat message. Model state is ${modelWorkerState}, not 'model_ready'.`);
            sendResponse({ success: false, error: `Model not ready (state: ${modelWorkerState}). Please load a model first.` });
            return false;
        }

        logClient.logInfo(`Model ready, sending generate request for ${correlationId}`);
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
            logClient.logInfo(`Generate request sent for ${correlationId}. Waiting for worker responses.`);
            sendResponse({ success: true, message: "Generation request forwarded to worker."});
        })
        .catch(error => {
            logClient.logError(`Error processing sendChatMessage for ${correlationId}:`, error);
            if (modelWorkerState === ModelWorkerStates.GENERATING) modelWorkerState = ModelWorkerStates.MODEL_READY;
            sendResponse({ success: false, error: error.message });
        });

        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        logClient.logInfo("[Background] Received interrupt request from UI.");
        ensureWorkerScriptIsReady()
            .then(() => sendToModelWorkerOffscreen({ type: 'interrupt' }))
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        isResponseAsync = true;
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.RESET_WORKER) {
        logClient.logInfo("[Background] Received reset request from UI.");
        ensureWorkerScriptIsReady()
            .then(() => sendToModelWorkerOffscreen({ type: 'reset' }))
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        isResponseAsync = true;
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
        logClient.logInfo(`Handling 'getModelWorkerState' request. Current state: ${modelWorkerState}`);
        sendResponse({ success: true, state: modelWorkerState });
        return false;
    }

    if (type === RuntimeMessageTypes.SCRAPE_REQUEST) {
        logClient.logInfo(`Handling 'scrapeRequest' request. Scraping URL: ${payload?.url}`);
        isResponseAsync = true;
        scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId)
            .then(() => {
                logClient.logInfo(`scrapeRequest(${payload?.url}) promise resolved successfully.`);
                sendResponse({ success: true, message: `Scraping orchestrator started for ${payload?.url}.` });
            })
            .catch(error => {
                logClient.logError(`scrapeRequest(${payload?.url}) failed:`, error);
                sendResponse({ success: false, error: error.message });
            });
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_DRIVE_FILE_LIST) {
        const receivedFolderId = message.folderId;
        logClient.logInfo(`Handling 'getDriveFileList' for folder: ${receivedFolderId}`);
        isResponseAsync = true;
        (async () => {
            try {
                const token = await getDriveToken();
                const files = await fetchDriveFileList(token, receivedFolderId);
                logClient.logInfo(`Successfully fetched ${files?.length || 0} files/folders.`);
                sendResponse({
                    success: true,
                    files: files,
                    folderId: receivedFolderId
                });
            } catch (error) {
                logClient.logError("Error handling getDriveFileList:", error);
                sendResponse({
                    success: false,
                    error: error.message,
                    folderId: receivedFolderId
                });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_LOG_SESSIONS) {
        isResponseAsync = true;
        (async () => {
            try {
                const { logSessions: sessions } = await browser.storage.local.get('logSessions');
                sendResponse({ success: true, sessions: sessions || [] });
            } catch (err) {
                logClient.logError("Error fetching log sessions:", err);
                sendResponse({ success: false, error: err.message });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_LOG_ENTRIES) {
        isResponseAsync = true;
        (async () => {
            const sessionId = payload?.sessionId;
            if (!sessionId) {
                sendResponse({ success: false, error: 'Session ID required' });
                return true;
            }
            try {
                const key = `logs_${sessionId}`;
                const result = await browser.storage.local.get(key);
                sendResponse({ success: true, entries: result[key] || [] });
            } catch (err) {
                logClient.logError(`Error fetching log entries for ${sessionId}:`, err);
                sendResponse({ success: false, error: err.message });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.DETACH_SIDE_PANEL) {
        isResponseAsync = true;
        handleDetach(sender.tab?.id).then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_DETACHED_STATE) {
        isResponseAsync = true;
        (async () => {
            try {
                const { [`detachedState_${sender.tab?.id}`]: state } = await browser.storage.local.get(`detachedState_${sender.tab?.id}`);
                sendResponse({ success: true, state: state });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_DB_READY_STATE) {
        sendResponse({ ready: isDbReady() });
        return false;
    }

    if (type === UIEventNames.MODEL_DOWNLOAD_PROGRESS || type === UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE) {
        // Prevent forwarding to event bus or re-broadcasting; UI handles this directly
        return false;
    }


    if (Object.values(DBEventNames).includes(type)) {
       
        return false;
    }

    if (type === DirectDBNames.ADD_MODEL_ASSET) {
        (async () => {
            try {
                const { modelId, fileName, fileType, data, chunkIndex = 0, totalChunks = 1, chunkGroupId = '', binarySize = null, totalFileSize = null } = payload;
                let assetData = data;
                if (Array.isArray(data)) {
                    assetData = new Uint8Array(data).buffer;
                }
                const result = await addModelAsset(modelId, fileName, fileType, assetData, chunkIndex, totalChunks, chunkGroupId, binarySize, totalFileSize);
                sendResponse({ success: true, result });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    if (type === DirectDBNames.GET_MODEL_ASSET) {
        (async () => {
            try {
                const { modelId, fileName } = payload;
                const asset = await getModelAsset(modelId, fileName);
                let assetToSend = asset;
                if (asset && asset.data && asset.data instanceof ArrayBuffer) {
                    assetToSend = { ...asset, data: Array.from(new Uint8Array(asset.data)) };
                }
                sendResponse({ success: !!asset, asset: assetToSend });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    if (type === DirectDBNames.VERIFY_MODEL_ASSET) {
        (async () => {
            try {
                const { modelId, fileName, expectedSize } = payload;
                const result = await verifyModelAsset(modelId, fileName, expectedSize);
                sendResponse(result);
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    if (type === DirectDBNames.COUNT_MODEL_ASSET_CHUNKS) {
        (async () => {
            try {
                const { modelId, fileName } = payload;
                const count = await countModelAssetChunks(modelId, fileName);
                sendResponse({ success: true, count });
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    // Add handler for offscreen worker file list requests
    if (type === ModelLoaderMessageTypes.LIST_MODEL_FILES) {
        (async () => {
            try {
                const { modelId } = payload || {};
                if (!modelId) {
                    sendResponse({ success: false, error: 'No modelId provided' });
                    return;
                }
                const files = await listModelFiles(modelId);
                sendResponse({ success: true, files });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true;
    }

    logClient.logWarn(`Unhandled message type: ${type}`);
    return false;
});

logClient.logInfo("[Background-Simple] Script loaded and listening.");