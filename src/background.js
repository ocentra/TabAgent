import browser from 'webextension-polyfill';

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
const MODEL_WORKER_OFFSCREEN_PATH = 'offscreenWorker.html';

import * as logClient from './log-client.js';
import { eventBus } from './eventBus.js';
import { DbInitializeRequest } from './events/dbEvents.js';

logClient.init('Background');

let detachedPopups = {};
let popupIdToTabId = {};

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

let modelWorkerState = 'uninitialized';
let workerScriptReadyPromise = null;
let workerScriptReadyResolver = null;
let workerScriptReadyRejecter = null;
let modelLoadPromise = null;
let modelLoadResolver = null;
let modelLoadRejecter = null;

let activeGenerations = {};

let currentLogSessionId = null;
let previousLogSessionId = null;

let lastLoggedProgress = -10;

// Log Session Management
async function initializeSessionIds() {
    logClient.logInfo('Initializing log session IDs...');
    currentLogSessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    logClient.logInfo('Current log session ID:', currentLogSessionId);
    await browser.storage.local.set({ currentLogSessionId: currentLogSessionId });
    const { previousLogSessionId: storedPreviousId } = await browser.storage.local.get('previousLogSessionId');
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
        if (modelWorkerState === 'uninitialized' || !(await hasModelWorkerOffscreenDocument())) {
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
            modelWorkerState = 'error';
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
        modelWorkerState = 'error';
        if (message.type === 'init') {
            if (modelLoadRejecter) modelLoadRejecter(new Error(`Failed to send init message: ${error.message}`));
            modelLoadPromise = null;
        } else if (workerScriptReadyRejecter && (modelWorkerState === 'uninitialized' || modelWorkerState === 'creating_worker')) {
            workerScriptReadyRejecter(new Error(`Failed to send message early: ${error.message}`));
            workerScriptReadyPromise = null;
        }
        throw new Error(`Failed to send message to model worker offscreen: ${error.message}`);
    }
}

function ensureWorkerScriptIsReady() {
    logClient.logDebug(`[ensureWorkerScriptIsReady] Current state: ${modelWorkerState}`);
    if (modelWorkerState !== 'uninitialized' && modelWorkerState !== 'creating_worker') {
        if (modelWorkerState === 'error' && !workerScriptReadyPromise) {
            return Promise.reject(new Error("Worker script initialization previously failed."));
        }
        return Promise.resolve();
    }
    if (workerScriptReadyPromise) {
        return workerScriptReadyPromise;
    }

    logClient.logDebug("[ensureWorkerScriptIsReady] Worker script not ready. Initializing and creating promise.");
    modelWorkerState = 'creating_worker';
    workerScriptReadyPromise = new Promise((resolve, reject) => {
        workerScriptReadyResolver = resolve;
        workerScriptReadyRejecter = reject;

        setupModelWorkerOffscreenDocument().catch(err => {
            logClient.logError("[ensureWorkerScriptIsReady] Error setting up offscreen doc:", err);
            modelWorkerState = 'error';
            if (workerScriptReadyRejecter) workerScriptReadyRejecter(err);
            workerScriptReadyPromise = null;
        });
    });

    const scriptLoadTimeout = 30000;
    setTimeout(() => {
        if (modelWorkerState === 'creating_worker' && workerScriptReadyRejecter) {
            logClient.logError(`[ensureWorkerScriptIsReady] Timeout (${scriptLoadTimeout}ms) waiting for workerScriptReady.`);
            workerScriptReadyRejecter(new Error('Timeout waiting for model worker script to load.'));
            modelWorkerState = 'error';
            workerScriptReadyPromise = null;
        }
    }, scriptLoadTimeout);

    return workerScriptReadyPromise;
}

async function loadModel(modelId) {
    logClient.logInfo(`Request to load model: ${modelId}. Current state: ${modelWorkerState}`);
    try {
        await ensureWorkerScriptIsReady();
        logClient.logDebug(`Worker script confirmed ready (state: ${modelWorkerState}). Proceeding with model load.`);
    } catch (err) {
        logClient.logError("Failed to ensure worker script readiness:", err);
        throw new Error(`Failed to ensure worker script readiness: ${err.message}`);
    }

    if (modelWorkerState !== 'worker_script_ready' && modelWorkerState !== 'idle' && modelWorkerState !== 'error') {
        const errorMsg = `Cannot load model '${modelId}'. Worker state is '${modelWorkerState}', expected 'worker_script_ready', 'idle', or 'error'.`;
        logClient.logError("State check failed loading model:", errorMsg);
        throw new Error(errorMsg);
    }

    if (!modelId) {
        return Promise.reject(new Error("Cannot load model: Model ID not provided."));
    }

    if (modelWorkerState === 'model_ready') {
        logClient.logInfo(`Model appears ready. Assuming it's ${modelId}.`);
        return Promise.resolve();
    }
    if (modelWorkerState === 'loading_model' && modelLoadPromise) {
        logClient.logInfo(`Model is already loading. Assuming it's ${modelId}.`);
        return modelLoadPromise;
    }
    if (modelWorkerState !== 'worker_script_ready') {
        logClient.logError("Cannot load model. Worker script is not ready. State:", modelWorkerState);
        return Promise.reject(new Error(`Cannot load model, worker script not ready (state: ${modelWorkerState})`));
    }

    logClient.logInfo(`Worker script ready. Initiating load for model: ${modelId}.`);
    modelWorkerState = 'loading_model';
    // TODO: Store the modelId being loaded
    modelLoadPromise = new Promise((resolve, reject) => {
        modelLoadResolver = resolve;
        modelLoadRejecter = reject;

        logClient.logDebug(`Attempting to send 'init' message for model: ${modelId}`);
        sendToModelWorkerOffscreen({ type: 'init', payload: { modelId: modelId } })
            .catch(err => {
                logClient.logError(`Failed to send 'init' message for ${modelId}:`, err);
                modelWorkerState = 'error';
                if (modelLoadRejecter) modelLoadRejecter(err);
                modelLoadPromise = null;
            });
    });

    const modelLoadTimeout = 300000;
    setTimeout(() => {
        if (modelWorkerState === 'loading_model' && modelLoadRejecter) {
            logClient.logError(`Timeout (${modelLoadTimeout}ms) waiting for model ${modelId} load completion.`);
            modelLoadRejecter(new Error(`Timeout waiting for model ${modelId} to load.`));
            modelWorkerState = 'error';
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

// Offscreen Document Management
async function hasOffscreenDocument(path) {
    const filename = path.split('/').pop();
    const targetUrl = browser.runtime.getURL(filename);
    const existingContexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [targetUrl]
    });
    return existingContexts.length > 0;
}

async function setupOffscreenDocument(path, reasons, justification) {
    if (await hasOffscreenDocument(path)) {
        logClient.logInfo(`Background: Offscreen document at ${path} already exists.`);
        return;
    }
    const filename = path.split('/').pop();
    logClient.logInfo(`Background: Creating offscreen document using filename: ${filename}...`);
    await browser.offscreen.createDocument({
        url: filename,
        reasons: reasons,
        justification: justification,
    });
    logClient.logInfo(`Background: Offscreen document created successfully using ${filename}.`);
}

// Scraping Logic
async function scrapeUrlWithOffscreenIframe(url) {
    logClient.logInfo(`[Stage 2] Attempting Offscreen + iframe: ${url}`);
    const DYNAMIC_SCRIPT_ID_PREFIX = 'offscreen-scrape-';
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult';
    const IFRAME_LOAD_TIMEOUT = 30000;
    let dynamicScripterId = null;

    const cleanup = async (scriptIdBase) => {
        logClient.logInfo(`[Stage 2 Cleanup] Starting cleanup for script ID base: ${scriptIdBase}`);
        if (scriptIdBase) {
            try {
                await browser.scripting.unregisterContentScripts({ ids: [scriptIdBase] });
                logClient.logInfo(`[Stage 2 Cleanup] Unregistered script: ${scriptIdBase}`);
            } catch (error) {
                logClient.logWarn(`[Stage 2 Cleanup] Failed to unregister script ${scriptIdBase}:`, error);
            }
        }
        try {
            await browser.runtime.sendMessage({ type: 'removeIframe', target: 'offscreen' });
            logClient.logInfo('[Stage 2 Cleanup] Sent removeIframe request to offscreen.');
        } catch (error) {
            logClient.logWarn('[Stage 2 Cleanup] Failed to send removeIframe request: ', error);
        }
    };

    try {
        await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH, ['DOM_PARSER', 'IFRAME_SCRIPTING'], 'Parse HTML content and manage scraping iframes');
        logClient.logInfo('[Stage 2] Sending createIframe request to offscreen...');
        const createResponse = await browser.runtime.sendMessage({
            type: 'createIframe',
            target: 'offscreen',
            url: url
        });
        if (!createResponse?.success) {
            throw new Error(`Failed to create iframe in offscreen: ${createResponse?.error || 'Unknown error'}`);
        }
        logClient.logInfo('[Stage 2] Iframe creation request successful. Waiting for load and script...');
        dynamicScripterId = `${DYNAMIC_SCRIPT_ID_PREFIX}${Date.now()}`;
        await browser.scripting.registerContentScripts([{
            id: dynamicScripterId,
            js: ['PageExtractor.js', 'stage2-helper.js'],
            matches: [url],
            runAt: 'document_idle',
            world: 'ISOLATED',
            allFrames: true,
            persistAcrossSessions: false
        }]);
        logClient.logInfo(`[Stage 2] Registered dynamic script(s): ${dynamicScripterId} (files: PageExtractor.js, stage2-helper.js)`);
        let messageListener = null;
        const scriptResponsePromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                logClient.logWarn(`[Stage 2] Timeout (${IFRAME_LOAD_TIMEOUT / 1000}s) waiting for response from dynamic script.`);
                if (messageListener) {
                    browser.runtime.onMessage.removeListener(messageListener);
                }
                reject(new Error('Timeout waiting for dynamic script response.'));
            }, IFRAME_LOAD_TIMEOUT);

            messageListener = (message, sender, sendResponse) => {
                if (message?.type === DYNAMIC_SCRIPT_MESSAGE_TYPE) {
                    logClient.logInfo('[Stage 2] Received response from dynamic script:', message.payload);
                    clearTimeout(timeoutId);
                    browser.runtime.onMessage.removeListener(messageListener);
                    if (message.payload?.success) {
                        resolve(message.payload);
                    } else {
                        reject(new Error(message.payload?.error || 'Dynamic script reported failure.'));
                    }
                    return false;
                }
                return false;
            };
            browser.runtime.onMessage.addListener(messageListener);
            logClient.logInfo('[Stage 2] Listener added for dynamic script response.');
        });
        const resultPayload = await scriptResponsePromise;
        await cleanup(dynamicScripterId);
        return resultPayload;
    } catch (error) {
        logClient.logError(`[Stage 2] Error during Offscreen + iframe process:`, error);
        await cleanup(dynamicScripterId);
        throw new Error(`Stage 2 (Offscreen + iframe) failed: ${error.message}`);
    }
}

async function scrapeUrlWithTempTabExecuteScript(url) {
    logClient.logInfo(`[Stage 3] Attempting Temp Tab + executeScript (using window.scraper.extract): ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg) => {
            logClient.logWarn(`[Stage 3] Cleanup: ${errorMsg}`);
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 3] Error removing tab ${tempTabId}: ${err.message}`));
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };
        try {
            const tab = await browser.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
            logClient.logInfo(`[Stage 3] Created temp tab ${tempTabId} for executeScript.`);
        } catch (error) {
            return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }
        let loadTimeoutId = null;
        const loadPromise = new Promise((resolveLoad, rejectLoad) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                if (tabId === tempTabId && changeInfo.status === 'complete') {
                    logClient.logInfo(`[Stage 3] Tab ${tempTabId} loaded.`);
                    if (loadTimeoutId) clearTimeout(loadTimeoutId);
                    browser.tabs.onUpdated.removeListener(listener);
                    resolveLoad();
                }
            };
            browser.runtime.onUpdated.addListener(listener);
            loadTimeoutId = setTimeout(() => {
                browser.tabs.onUpdated.removeListener(listener);
                rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1000}s) waiting for page load.`));
            }, TEMP_TAB_LOAD_TIMEOUT);
        });
        try {
            await loadPromise;
        } catch (error) {
            return cleanupAndReject(`Load failed or timed out: ${error.message}`);
        }
        logClient.logInfo(`[Stage 3] Injecting PageExtractor.js and calling window.scraper.extract() in tab ${tempTabId}`);
        try {
            await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                files: ['PageExtractor.js']
            });
            const results = await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                func: () => window.scraper.extract(),
            });
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 3] Error removing tab ${tempTabId} post-execute: ${err.message}`));
                tempTabId = null;
            }
            if (results && results.length > 0 && results[0].result) {
                const scriptResult = results[0].result;
                if (scriptResult && typeof scriptResult === 'object') {
                    logClient.logInfo('[Stage 3] window.scraper.extract() succeeded.');
                    resolve(scriptResult);
                } else {
                    reject(new Error(scriptResult?.error || 'window.scraper.extract() failed or returned null.'));
                }
            } else {
                const lastError = browser.runtime.lastError ? browser.runtime.lastError.message : 'No result returned';
                reject(new Error(`executeScript failed: ${lastError}`));
            }
        } catch (error) {
            cleanupAndReject(`executeScript call failed: ${error.message}`);
        }
    });
}

async function scrapeUrlWithTempTab_ContentScript(url) {
    logClient.logInfo(`[Stage 4] Attempting Temp Tab + Content Script: ${url}`);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg) => {
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 4] Error removing tab ${tempTabId} during cleanup: ${err.message}`));
                tempTabId = null;
            }
            reject(new Error(errorMsg));
        };
        try {
            const tab = await browser.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) throw new Error('Failed to get temporary tab ID.');
            logClient.logInfo(`[Stage 4] Created temp tab ${tempTabId}`);
        } catch (error) {
            return reject(new Error(`Failed to create temp tab: ${error.message}`));
        }
        let loadTimeoutId = null;
        const loadPromise = new Promise((resolveLoad, rejectLoad) => {
            const listener = (tabId, changeInfo, updatedTab) => {
                if (tabId === tempTabId && changeInfo.status === 'complete') {
                    logClient.logInfo(`[Stage 4] Tab ${tempTabId} loaded.`);
                    if (loadTimeoutId) clearTimeout(loadTimeoutId);
                    browser.tabs.onUpdated.removeListener(listener);
                    resolveLoad();
                }
            };
            browser.tabs.onUpdated.addListener(listener);
            loadTimeoutId = setTimeout(() => {
                browser.tabs.onUpdated.removeListener(listener);
                rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1000}s) waiting for page load.`));
            }, TEMP_TAB_LOAD_TIMEOUT);
        });
        try {
            await loadPromise;
        } catch (error) {
            return cleanupAndReject(error.message);
        }
        logClient.logInfo(`[Stage 4] Sending SCRAPE_PAGE to content script in tab ${tempTabId}`);
        try {
            const response = await browser.tabs.sendMessage(tempTabId, { type: 'SCRAPE_PAGE' });
            if (tempTabId) browser.tabs.remove(tempTabId).catch(err => logClient.logWarn(`[Stage 4] Error removing tab ${tempTabId} post-message: ${err.message}`));
            tempTabId = null;
            if (response?.success) {
                logClient.logInfo(`[Stage 4] Success from content script.`);
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
            const iframeResult = await scrapeUrlWithOffscreenIframe(url);
            logClient.logInfo(`[Orchestrator Log] Stage 2 (Offscreen + iframe) Succeeded for ${url}.`);
            const stage2SuccessPayload = {
                stage: 2, success: true, chatId: chatId, messageId: messageId,
                method: 'offscreenIframe', url: url,
                length: iframeResult?.text?.length || 0,
                ...iframeResult
            };
            sendStageResult(stage2SuccessPayload);
            return;
        } catch (stage2Error) {
            logClient.logWarn(`[Orchestrator Log] Stage 2 (Offscreen + iframe) Failed for ${url}: ${stage2Error.message}`);
            sendStageResult({ stage: 2, success: false, chatId: chatId, messageId: messageId, error: stage2Error.message });
        }

        try {
            const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url);
            logClient.logInfo(`[Orchestrator Log] Stage 3 (Temp Tab + executeScript) Succeeded for ${url}.`);
            const stage3SuccessPayload = {
                stage: 3, success: true, chatId: chatId, messageId: messageId,
                method: 'tempTabExecuteScript', url: url,
                length: executeScriptResult?.text?.length || 0,
                ...executeScriptResult
            };
            sendStageResult(stage3SuccessPayload);
            return;
        } catch (stage3Error) {
            logClient.logWarn(`[Orchestrator Log] Stage 3 (Temp Tab + executeScript) Failed for ${url}: ${stage3Error.message}`);
            sendStageResult({ stage: 3, success: false, chatId: chatId, messageId: messageId, error: stage3Error.message });
        }

        try {
            const tempTabResult = await scrapeUrlWithTempTab_ContentScript(url);
            logClient.logInfo(`[Orchestrator Log] Stage 4 (Temp Tab + Content Script) Succeeded for ${url}.`);
            const stage4SuccessPayload = {
                stage: 4, success: true, chatId: chatId, messageId: messageId,
                method: 'tempTabContentScript', url: url,
                length: tempTabResult?.text?.length || 0,
                ...tempTabResult
            };
            logClient.logInfo("[Orchestrator Log] Stage 4 Payload being sent:", stage4SuccessPayload);
            sendStageResult(stage4SuccessPayload);
            return;
        } catch (stage4Error) {
            logClient.logWarn(`[Orchestrator Log] Stage 4 (Temp Tab + Content Script) Failed for ${url}: ${stage4Error.message}`);
            sendStageResult({ stage: 4, success: false, chatId: chatId, messageId: messageId, error: stage4Error.message });
        }

        logClient.logInfo("[Orchestrator Log] All stages failed.");
    } finally {
        logClient.logInfo("[Orchestrator Cleanup] Attempting to close offscreen document after multi-stage scrape.");
        try {
            if (await hasOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)) {
                await browser.offscreen.closeDocument();
                logClient.logInfo("[Orchestrator Cleanup] Offscreen document closed successfully.");
            } else {
                logClient.logInfo("[Orchestrator Cleanup] No offscreen document found to close.");
            }
        } catch (error) {
            logClient.logWarn("[Orchestrator Cleanup] Error closing offscreen document:", error);
        }
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

async function fetchDriveFileContent(token, fileId) {
    logClient.logWarn(`Background: fetchDriveFileContent not implemented yet for fileId: ${fileId}`);
    return `(Content fetch not implemented for ${fileId})`;
}

// Message Forwarding
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

// Extension Lifecycle Listeners
browser.runtime.onInstalled.addListener(async (details) => {
    logClient.logInfo('onInstalled event fired. Reason:', details.reason);
    await initializeSessionIds();

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

    logClient.logInfo('Triggering DB Initialization from onInstalled.');
    eventBus.publish(DbInitializeRequest.name, new DbInitializeRequest());

    ensureWorkerScriptIsReady().catch(err => {
        logClient.logError("Initial worker script readiness check failed after install:", err);
    });
});

browser.runtime.onStartup.addListener(async () => {
    logClient.logInfo('onStartup event fired.');
    await initializeSessionIds();

    logClient.logInfo('Triggering DB Initialization from onStartup (may be redundant).');
    eventBus.publish(DbInitializeRequest.name, new DbInitializeRequest());

    if (modelWorkerState === 'uninitialized') {
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
    const { type, payload } = message;
    let isResponseAsync = false;

    logClient.logInfo(`Received message type '${type}' from`, sender.tab ? `tab ${sender.tab.id}` : sender.url || sender.id);

    const workerMessageTypes = [
        'workerScriptReady',
        'workerReady',
        'loadingStatus',
        'generationStatus',
        'generationUpdate',
        'generationComplete',
        'generationError',
        'resetComplete',
        'error'
    ];

    if (workerMessageTypes.includes(type)) {
        logClient.logInfo(`Handling message from worker: ${type}`);
        switch (type) {
            case 'workerScriptReady':
                logClient.logInfo("[Background] Worker SCRIPT is ready!");
                modelWorkerState = 'worker_script_ready';
                if (workerScriptReadyResolver) {
                    workerScriptReadyResolver();
                    workerScriptReadyPromise = null;
                }
                browser.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'script_ready' } }).catch(() => {});
                break;
            case 'workerReady':
                logClient.logInfo("[Background] Worker MODEL is ready! Model:", payload?.model);
                modelWorkerState = 'model_ready';
                if (modelLoadResolver) {
                    modelLoadResolver();
                    modelLoadPromise = null;
                }
                browser.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'model_ready', model: payload?.model } }).catch(() => {});
                if (workerScriptReadyResolver) {
                    workerScriptReadyResolver();
                    workerScriptReadyPromise = null;
                }
                break;
            case 'loadingStatus':
                if (payload?.status === 'progress' && payload?.progress) {
                    const currentProgress = Math.floor(payload.progress);
                    if (currentProgress >= lastLoggedProgress + 10) {
                        logClient.logInfo("[Background] Worker loading status (progress):", payload);
                        lastLoggedProgress = currentProgress;
                    }
                } else {
                    logClient.logInfo("[Background] Worker loading status (other):", payload);
                    lastLoggedProgress = -10;
                }
                if (modelWorkerState !== 'loading_model') {
                    logClient.logWarn(`[Background] Received loadingStatus in unexpected state: ${modelWorkerState}`);
                    modelWorkerState = 'loading_model';
                }
                browser.runtime.sendMessage({ type: 'uiLoadingStatusUpdate', payload: payload }).catch(err => {
                    if (err.message !== "Could not establish connection. Receiving end does not exist.") {
                        logClient.logWarn("[Background] Error sending loading status to UI:", err.message);
                    }
                });
                break;
            case 'generationStatus':
                logClient.logInfo(`[Background] Generation status: ${payload?.status}`);
                if (payload?.status === 'generating') modelWorkerState = 'generating';
                else if (payload?.status === 'interrupted') modelWorkerState = 'model_ready';
                break;
            case 'generationUpdate':
                if (modelWorkerState !== 'generating') {
                    logClient.logWarn(`[Background] Received generationUpdate in unexpected state: ${modelWorkerState}`);
                }
                modelWorkerState = 'generating';
                break;
            case 'generationComplete':
                logClient.logInfo("[Background] Generation complete.");
                modelWorkerState = 'model_ready';
                break;
            case 'generationError':
                logClient.logError("[Background] Generation error from worker:", payload);
                modelWorkerState = 'error';
                break;
            case 'resetComplete':
                logClient.logInfo("[Background] Worker reset complete.");
                modelWorkerState = 'model_ready';
                break;
            case 'error':
                logClient.logError("[Background] Received generic error from worker/offscreen:", payload);
                const previousState = modelWorkerState;
                modelWorkerState = 'error';
                if (previousState === 'creating_worker' && workerScriptReadyRejecter) {
                    workerScriptReadyRejecter(new Error(payload || 'Generic error during script init'));
                    workerScriptReadyPromise = null;
                } else if (previousState === 'loading_model' && modelLoadRejecter) {
                    modelLoadRejecter(new Error(payload || 'Generic error during model load'));
                    modelLoadPromise = null;
                }
                browser.runtime.sendMessage({ type: 'uiUpdate', payload: { modelStatus: 'error', error: payload } }).catch(() => {});
                break;
        }
        forwardMessageToSidePanelOrPopup(message, sender);
        return false;
    }

    if (type === 'loadModel') {
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

    if (type === 'sendChatMessage') {
        isResponseAsync = true;
        const { chatId, messages, options, messageId } = payload;
        const correlationId = messageId || chatId;

        if (modelWorkerState !== 'model_ready') {
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
            if (modelWorkerState === 'generating') modelWorkerState = 'model_ready';
            sendResponse({ success: false, error: error.message });
        });

        return isResponseAsync;
    }

    if (type === 'interruptGeneration') {
        logClient.logInfo("[Background] Received interrupt request from UI.");
        ensureWorkerScriptIsReady()
            .then(() => sendToModelWorkerOffscreen({ type: 'interrupt' }))
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        isResponseAsync = true;
        return isResponseAsync;
    }

    if (type === 'resetWorker') {
        logClient.logInfo("[Background] Received reset request from UI.");
        ensureWorkerScriptIsReady()
            .then(() => sendToModelWorkerOffscreen({ type: 'reset' }))
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        isResponseAsync = true;
        return isResponseAsync;
    }

    if (type === 'getModelWorkerState') {
        logClient.logInfo(`Handling 'getModelWorkerState' request. Current state: ${modelWorkerState}`);
        sendResponse({ success: true, state: modelWorkerState });
        return false;
    }

    if (type === 'scrapeRequest') {
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

    if (type === 'getDriveFileList') {
        const receivedFolderId = message.folderId;
        logClient.logInfo(`Handling 'getDriveFileList' for folder: ${receivedFolderId}`);
        isResponseAsync = true;
        (async () => {
            try {
                const token = await getDriveToken();
                const files = await fetchDriveFileList(token, receivedFolderId);
                logClient.logInfo(`Successfully fetched ${files?.length || 0} files/folders.`);

                // Send file list via separate sendMessage
                logClient.logInfo('[Background] Sending driveFileListData...');
                browser.runtime.sendMessage({
                    type: 'driveFileListData',
                    success: true,
                    files: files,
                    folderId: receivedFolderId
                }).catch(err => {
                     logClient.logWarn('[Background] Failed to send driveFileListData:', err?.message);
                     browser.runtime.sendMessage({ type: 'driveFileListData', success: false, error: `Failed to send data: ${err?.message}` , folderId: receivedFolderId });
                });

                logClient.logInfo('[Background] sendResponse for driveFileListResponse skipped (using separate message).');

            } catch (error) {
                logClient.logError("Error handling getDriveFileList:", error);
                // Send error via separate message too
                browser.runtime.sendMessage({
                     type: 'driveFileListData',
                     success: false,
                     error: error.message,
                     folderId: receivedFolderId
                 }).catch(err => {
                     logClient.logWarn('[Background] Failed to send driveFileListData error message:', err?.message);
                 });
                 logClient.logInfo('[Background] sendResponse for driveFileListResponse error skipped (using separate message).');
            }
        })();
        return isResponseAsync;
    }

    if (type.startsWith('db:')) {
        logClient.logDebug(`Forwarding DB request of type '${type}' to event bus.`);
        eventBus.publish(type, message);
        return false;
    }

    if (type === 'getLogSessions') {
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

    if (type === 'getLogEntries') {
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

    if (type === 'detachSidePanel') {
        isResponseAsync = true;
        handleDetach(sender.tab?.id).then(result => {
            sendResponse(result);
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return isResponseAsync;
    }

    if (type === 'getDetachedState') {
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

    logClient.logWarn(`Unhandled message type: ${type}`);
    return false;
});

logClient.logInfo("[Background-Simple] Script loaded and listening.");