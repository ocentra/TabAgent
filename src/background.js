import browser from 'webextension-polyfill';
import {  WorkerEventNames, ModelWorkerStates, RuntimeMessageTypes, DBEventNames, ModelLoaderMessageTypes, DirectDBNames, RawDirectMessageTypes, UIEventNames } from './events/eventNames.js';

const CONTEXT_PREFIX = '[Background]';

let detachedPopups = {}; // TabId to Popup WindowId
let popupIdToTabId = {}; // Popup WindowId to Original TabId

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

let globalModelWorkerActiveState = ModelWorkerStates.UNINITIALIZED; // Conceptual state
let currentActiveModelIdInSidePanel = null; // Tracks modelId believed to be in sidepanel's worker

let currentLogSessionId = null;
let previousLogSessionId = null;

let background_lastLoggedProgress = -1; // For model pipeline loading progress

async function initializeSessionIds() {
    let { currentLogSessionId: storedCurrentId, previousLogSessionId: storedPreviousId } = await browser.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
    if (storedCurrentId) {
        currentLogSessionId = storedCurrentId;
        previousLogSessionId = storedPreviousId || null;
    } else {
        currentLogSessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        await browser.storage.local.set({ currentLogSessionId: currentLogSessionId });
        if (storedPreviousId) {
             previousLogSessionId = storedPreviousId;
        }
        await browser.storage.local.set({ previousLogSessionId: currentLogSessionId });
    }
    console.log(CONTEXT_PREFIX + ' Current log session ID:', currentLogSessionId);
    console.log(CONTEXT_PREFIX + ' Previous log session ID:', previousLogSessionId);
}

async function updateDeclarativeNetRequestRules() {
    try {
        const currentRules = await browser.declarativeNetRequest.getDynamicRules();
        const rulesToRemove = currentRules.filter(rule => rule.id === DNR_RULE_ID_1).map(rule => rule.id);
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
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rulesToRemove,
            addRules: rulesToAdd
        });
        console.log(CONTEXT_PREFIX + ' Declarative Net Request rules updated successfully.');
    } catch (error) {
        console.error("Error updating Declarative Net Request rules:", error);
    }
}

async function scrapeUrlWithTempTabExecuteScript(url, chatId, messageId) {
    console.log(CONTEXT_PREFIX + ' [BG-Scrape] Temp Tab + executeScript: ' + url);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise(async (resolve, reject) => {
        const cleanupAndReject = (errorMsg, errorObj = null) => {
            const finalError = errorObj ? errorObj : new Error(errorMsg);
            console.warn(CONTEXT_PREFIX +`[BG-Scrape] Cleanup & Reject: ${errorMsg}`, errorObj);
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId}: ${err.message}`));
                tempTabId = null;
            }
            reject(finalError);
        };

        try {
            const tab = await browser.tabs.create({ url: url, active: false });
            tempTabId = tab.id;
            if (!tempTabId) {
                cleanupAndReject('[BG-Scrape] Failed to get temporary tab ID.');
                return;
            }
            console.log(CONTEXT_PREFIX + ' [BG-Scrape] Created temp tab ' + tempTabId + '.');

            let loadTimeoutId = null;
            const loadPromise = new Promise((resolveLoad, rejectLoad) => {
                const listener = (tabIdUpdated, changeInfo) => {
                    if (tabIdUpdated === tempTabId && changeInfo.status === 'complete') {
                        console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tab ' + tempTabId + ' loaded.');
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
            console.log(CONTEXT_PREFIX + ' [BG-Scrape] Injecting pageExtractor.js into tab ' + tempTabId + '...');
            
            await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                files: ['pageExtractor.js']
            });
            console.log(CONTEXT_PREFIX + ' [BG-Scrape] pageExtractor.js INJECTED into tab ' + tempTabId + '.');
            
            const injectionResults = await browser.scripting.executeScript({
                target: { tabId: tempTabId },
                func: () => {
                    if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                        try { return window.TabAgentPageExtractor.extract(document); }
                        catch (e) { return { error: `Error in PageExtractor.extract: ${e.message} (Stack: ${e.stack})` }; }
                    } else { return { error: 'TabAgentPageExtractor.extract function not found on window.' }; }
                }
            });

            if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
                cleanupAndReject('[BG-Scrape] No result from executeScript.', injectionResults?.[0]?.error);
                return;
            }
            const scriptResult = injectionResults[0].result;
            console.log('[BG-Scrape] Extracted scriptResult:', scriptResult);
            if (scriptResult?.error) {
                cleanupAndReject(`[BG-Scrape] Script error: ${scriptResult.error}`, scriptResult);
                return;
            }
            // Update the placeholder message in the DB via forwardToSidePanel
            if (typeof forwardToSidePanel === 'function' && chatId && messageId) {
                // Add __type marker to the extraction object
                const extractionWithType = { ...scriptResult, __type: "PageExtractor" };
                const updateMsg = {
                    type: DBEventNames.DB_UPDATE_MESSAGE_REQUEST,
                    payload: {
                        sessionId: chatId,
                        messageId: messageId,
                        updates: {
                            text: "```json\n" + JSON.stringify(scriptResult, null, 2) + "\n```",
                            extraction: extractionWithType,
                            type: "code",
                            metadata: JSON.stringify({
                                language: "json",
                                isJson: true,
                                extractionType: "PageExtractor",
                                extraction: extractionWithType
                            })
                        }
                    }
                };
                forwardToSidePanel(updateMsg);
            }
            resolve(scriptResult);
        } catch (error) {
            cleanupAndReject(`[BG-Scrape] Error: ${error.message}`, error);
        } finally {
            if (tempTabId) {
                browser.tabs.remove(tempTabId).catch(err => console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId} in finally: ${err.message}`));
            }
        }
    });
}

async function scrapeUrlMultiStage(url, chatId, messageId) {
    console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Starting for ' + url + '. ChatID: ' + chatId + ', MessageID: ' + messageId);
    const sendStageResult = (stageResult) => {
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Sending WORKER_SCRAPE_STAGE_RESULT Stage ' + stageResult.stage + ', Success: ' + stageResult.success);
        browser.runtime.sendMessage({ type: RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT, payload: stageResult })
            .catch(e => console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Failed to send result Stage ${stageResult.stage}:`, e));
    };

    try {
        const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url, chatId, messageId);
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Stage 1 Succeeded for ' + url + '.');
        sendStageResult({ stage: 1, success: true, chatId, messageId, method: 'tempTabExecuteScript', url, length: executeScriptResult?.text?.length || 0, ...executeScriptResult });
    } catch (stage1Error) {
        console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Stage 1 Failed for ${url}: ${stage1Error.message}`);
        sendStageResult({ stage: 1, success: false, chatId, messageId, method: 'tempTabExecuteScript', error: stage1Error.message });
    } finally {
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Finished for ' + url + '.');
    }
}

async function getDriveToken() {
    return new Promise((resolve, reject) => {
        browser.identity.getAuthToken({ interactive: true }, (token) => {
            if (browser.runtime.lastError) reject(new Error(browser.runtime.lastError.message));
            else resolve(token);
        });
    });
}

async function fetchDriveFileList(token, folderId = 'root') {
    const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)";
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ pageSize: '100', q: query, fields, orderBy: 'folder,modifiedTime desc' })}`;
    console.log(CONTEXT_PREFIX + ' [BG-Drive] Fetching list for folder ' + folderId);
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
    if (!response.ok) {
        const errorData = await response.text();
        console.error(CONTEXT_PREFIX + `[BG-Drive] API error (Folder: ${folderId}):`, response.status, errorData);
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }
    const data = await response.json();
    console.log(CONTEXT_PREFIX + ' [BG-Drive] API success (Folder: ' + folderId + '). Found ' + (data.files?.length || 0) + ' items.');
    return data.files || [];
}

async function forwardToSidePanel(message) {
    console.log(CONTEXT_PREFIX + ' Attempting to forward message type: ' + message?.type + ' to active side panel.');
    try {
        // This relies on sidepanel.js having an active onMessage listener.
        await browser.runtime.sendMessage(message);
        console.log(CONTEXT_PREFIX + ' Message type: ' + message?.type + ' forwarded (presumed to side panel).');
        return { success: true };
    } catch (error) {
        console.error( CONTEXT_PREFIX +` Error forwarding message type '${message?.type}' to side panel:`, error.message);
        return { success: false, error: `Side panel not available or error: ${error.message}` };
    }
}

browser.runtime.onInstalled.addListener(async (details) => {
    console.log(CONTEXT_PREFIX + ' onInstalled. Reason:', details.reason);
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Error setting side panel behavior:', error));
    browser.storage.local.get(null).then((items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) browser.storage.local.remove(keysToRemove);
    });
});

browser.runtime.onStartup.addListener(async () => {
    console.log(CONTEXT_PREFIX + ' onStartup event.');
    await initializeSessionIds();
});

browser.action.onClicked.addListener(async (tab) => {
    console.log(CONTEXT_PREFIX + ' Action clicked for tab ' + (tab.id || 'N/A'));

});

browser.windows.onRemoved.addListener(async (windowId) => {
    console.log(CONTEXT_PREFIX + ' Window removed: ' + windowId);
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        console.log(CONTEXT_PREFIX + ' Popup window ' + windowId + ' for tab ' + tabId + ' was closed.');
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        try { await browser.storage.local.remove(`detachedState_${tabId}`); }
        catch (error) { console.error(`Error cleaning storage for tab ${tabId} on popup close:`, error); }
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(CONTEXT_PREFIX + ` Received message type: '${message?.type}' from: ${sender.id}`,  message);
    if (!message || !message.type) {
        console.warn(CONTEXT_PREFIX + ' Received message without type:', message, 'From:', sender.id);
        return false;
    }
    const { type, payload } = message;
    let isResponseAsync = false;

    if (type === RuntimeMessageTypes.SCRAPE_REQUEST) {
        isResponseAsync = true;
        (async () => {
            try {
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] SCRAPE_REQUEST received. Payload:', payload);
                // Check if the URL is already open in any tab
                const tabs = await browser.tabs.query({ url: payload?.url });
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tabs found for URL', payload?.url, ':', tabs);
                if (tabs && tabs.length > 0) {
                    // Use the first matching tab
                    const tabId = tabs[0].id;
                    console.log(CONTEXT_PREFIX + ' [BG-Scrape] Found open tab (' + tabId + ') for URL: ' + payload?.url + '. Sending SCRAPE_PAGE to content script.');
                    try {
                        const response = await browser.tabs.sendMessage(tabId, { type: UIEventNames.SCRAPE_PAGE });
                        console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape response:', response);
                        if (response && response.success) {
                            console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape succeeded for tab ' + tabId + '.');
                            browser.runtime.sendMessage({
                                type: RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT,
                                payload: { stage: 1, success: true, chatId: payload?.chatId, messageId: payload?.messageId, method: 'contentScript', url: payload?.url, length: response?.text?.length || 0, ...response }
                            });
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (content script) started.` });
                        } else {
                            console.warn(CONTEXT_PREFIX + `[BG-Scrape] Content script scrape failed or returned error for tab ${tabId}. Falling back to temp tab scrape.`);
                            // Fallback to temp tab scrape
                            await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                        }
                    } catch (err) {
                        console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error sending SCRAPE_PAGE to content script in tab ${tabId}:`, err);
                        // Fallback to temp tab scrape
                        await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                        sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                    }
                } else {
                    console.log(CONTEXT_PREFIX + ' [BG-Scrape] No open tab found for URL:', payload?.url, '. Using temp tab scrape.');
                    // No open tab, use temp tab scrape
                    await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                    sendResponse({ success: true, message: `Scraping for ${payload?.url} (temp tab) started.` });
                }
            } catch (error) {
                console.error(CONTEXT_PREFIX + ' [BG-Scrape] Error in SCRAPE_REQUEST handler:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.GET_DRIVE_FILE_LIST) {
        isResponseAsync = true;
        (async () => {
            try {
                const token = await getDriveToken();
                const files = await fetchDriveFileList(token, message.folderId);
                sendResponse({ success: true, files: files, folderId: message.folderId });
            } catch (error) {
                sendResponse({ success: false, error: error.message, folderId: message.folderId });
            }
        })();
        return isResponseAsync;
    }
    
    if (type === 'popupCreated') {
        const { tabId, popupId } = payload;
        detachedPopups[tabId] = popupId;
        popupIdToTabId[popupId] = tabId;
        console.log(CONTEXT_PREFIX + ' Popup ' + popupId + ' registered for tab ' + tabId + '.');
        sendResponse({ success: true });
        return false;
    }
    if (type === 'getPopupForTab') {
        const existingPopupId = detachedPopups[payload.tabId];
        sendResponse({ popupId: existingPopupId || null });
        return false;
    }

    if (Object.values(DBEventNames).includes(type)) {

        return false;
    }

    if (
        !Object.values(ModelLoaderMessageTypes).includes(type) &&
        !Object.values(DirectDBNames).includes(type) &&
        !Object.values(WorkerEventNames).includes(type) &&
        !Object.values(RuntimeMessageTypes).includes(type) &&
        !Object.values(DBEventNames).includes(type) &&
        type !== 'popupCreated' && type !== 'getPopupForTab'
    ) {
        return false;
    }
    return false;
});

(async () => {
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    console.log(CONTEXT_PREFIX + ' Initialized.');
})();