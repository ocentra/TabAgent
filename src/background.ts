import browser from 'webextension-polyfill';
import { WorkerEventNames,
    RuntimeMessageTypes,   
    ModelLoaderMessageTypes,
    RawDirectMessageTypes,
    UIEventNames } from './events/eventNames';

import { DBEventNames} from './DB/dbEvents';
import { loadModel, generate, stopGeneration, clearCache, resetModel, updateInferenceSettings, setUIConnectionActive, handleUIConnected, handleUIDisconnected, handleUIPong, getActiveUICount, initializePersistentState, restoreLastLoadedModel, getPersistentState, saveLastChatSession, saveLastLoadedModel, getModelState } from './backgroundModelManager';

const CONTEXT_PREFIX = '[Background]';

// Core logging flags
const LOG_ERROR = true;   // Critical errors (always enabled)
const LOG_WARN = false;   // Warnings and fallbacks
const LOG_GENERAL = false;  // App lifecycle (startup, initialization complete)
const LOG_DEBUG = false;  // Detailed internal state (for deep debugging)

// Feature-specific logging - Enable individually to debug specific subsystems
const LOG_SESSION = false;        // Session ID tracking → Enable to debug session persistence issues
const LOG_MODEL_LOADING = false;  // Model load operations → Enable to debug model loading failures
const LOG_MESSAGE_PASSING = false; // Message content (verbose) → Enable to see actual message payloads
const LOG_MESSAGE_HANDLERS = false; // Handler execution → Enable to see which message handlers run
const LOG_GENERATION_FLOW = false; // Generation lifecycle → Enable to track AI generation flow
const LOG_SCRAPING = false;       // Page extraction → Enable to debug web page scraping
const LOG_DRIVE = false;          // Drive file ops → Enable to debug Google Drive integration
const LOG_POPUP = false;          // Popup windows → Enable to debug detach/attach functionality

let detachedPopups: { [tabId: string]: number } = {}; // TabId to Popup WindowId
let popupIdToTabId: { [popupId: number]: string } = {}; // Popup WindowId to Original TabId

const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;

let currentLogSessionId: string | null = null;
let previousLogSessionId: string | null = null;

// Track model loading state
let isModelLoading = false;
let currentModelId: string | null = null;
let currentModelDtype: string | null = null;
let currentModelTask: string | null = null;

// Track background script readiness state
let isBackgroundScriptReady = false;

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
    if (LOG_SESSION) {
        console.log(CONTEXT_PREFIX + ' Current log session ID:', currentLogSessionId);
        console.log(CONTEXT_PREFIX + ' Previous log session ID:', previousLogSessionId);
    }
}

async function updateDeclarativeNetRequestRules() {
    try {
        const currentRules = await browser.declarativeNetRequest.getDynamicRules();
        const rulesToRemove = currentRules.filter((rule: any) => rule.id === DNR_RULE_ID_1).map((rule: any) => rule.id);
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
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Declarative Net Request rules updated successfully.');
    } catch (error: unknown) {
        if (LOG_ERROR) console.error(CONTEXT_PREFIX + " Error updating Declarative Net Request rules:", error);
    }
}

async function scrapeUrlWithTempTabExecuteScript(url: string, chatId: string, messageId: string): Promise<any> {
    if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Temp Tab + executeScript: ' + url);
    let tempTabId: number | null = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;

    return new Promise((resolve, reject) => {
        (async () => {
            const cleanupAndReject = (errorMsg: string, errorObj: any = null) => {
                const finalError = errorObj ? errorObj : new Error(errorMsg);
                if (LOG_WARN) console.warn(CONTEXT_PREFIX +`[BG-Scrape] Cleanup & Reject: ${errorMsg}`, errorObj);
                if (tempTabId !== null) {
                    browser.tabs.remove(tempTabId).catch((err: any) => { if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId}: ${err.message}`); });
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
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Created temp tab ' + tempTabId + '.');

                let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;
                const loadPromise = new Promise<void>((resolveLoad, rejectLoad) => {
                    const listener = (tabIdUpdated: number, changeInfo: any) => {
                        if (tabIdUpdated === tempTabId && changeInfo.status === 'complete') {
                            if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tab ' + tempTabId + ' loaded.');
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
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Injecting pageExtractor.js into tab ' + tempTabId + '...');
                
                await browser.scripting.executeScript({
                    target: { tabId: tempTabId },
                    files: ['pageExtractor.js']
                });
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] pageExtractor.js INJECTED into tab ' + tempTabId + '.');
                
                const injectionResults = await browser.scripting.executeScript({
                    target: { tabId: tempTabId },
                    func: () => {
                        if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                            try { return window.TabAgentPageExtractor.extract(document); }
                            catch (e: unknown) {
                                const errMsg = e instanceof Error ? e.message : String(e);
                                const errStack = e instanceof Error ? e.stack : '';
                                return { error: `Error in PageExtractor.extract: ${errMsg} (Stack: ${errStack})` };
                            }
                        } else { return { error: 'TabAgentPageExtractor.extract function not found on window.' }; }
                    }
                });

                if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
                    cleanupAndReject('[BG-Scrape] No result from executeScript.', injectionResults?.[0]?.error);
                    return;
                }
                const scriptResult = injectionResults[0].result;
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Extracted scriptResult:', scriptResult);
                if (scriptResult?.error) {
                    cleanupAndReject(`[BG-Scrape] Script error: ${scriptResult.error}`, scriptResult);
                    return;
                }
                // Remove DB update logic; just resolve with the scrape result
                resolve(scriptResult);
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                cleanupAndReject(`[BG-Scrape] Error: ${errMsg}`, error);
            } finally {
                if (tempTabId !== null) {
                    browser.tabs.remove(tempTabId).catch((err: any) => { if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId} in finally: ${err.message}`); });
                }
            }
        })();
    });
}

async function scrapeUrlMultiStage(url: string, chatId: string, messageId: string): Promise<void> {
    if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Starting for ' + url + '. ChatID: ' + chatId + ', MessageID: ' + messageId);
    const sendStageResult = (stageResult: any) => {
        if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Sending WORKER_SCRAPE_STAGE_RESULT Stage ' + stageResult.stage + ', Success: ' + stageResult.success);
        browser.runtime.sendMessage({ type: RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT, payload: stageResult })
            .catch((e: any) => { if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Failed to send result Stage ${stageResult.stage}:`, e); });
    };

    try {
        const executeScriptResult: any = await scrapeUrlWithTempTabExecuteScript(url, chatId, messageId);
        if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Stage 1 Succeeded for ' + url + '.');
        sendStageResult({ stage: 1, success: true, chatId, messageId, method: 'tempTabExecuteScript', url, length: executeScriptResult?.text?.length || 0, ...executeScriptResult });
    } catch (stage1Error: unknown) {
        const errMsg = stage1Error instanceof Error ? stage1Error.message : String(stage1Error);
        if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Stage 1 Failed for ${url}: ${errMsg}`);
        sendStageResult({ stage: 1, success: false, chatId, messageId, method: 'tempTabExecuteScript', error: errMsg });
    } finally {
        if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Finished for ' + url + '.');
    }
}

async function getDriveToken(): Promise<any> {
    return new Promise((resolve, reject) => {
        browser.identity.getAuthToken({ interactive: true }, (token: any) => {
            if (browser.runtime.lastError) reject(new Error(browser.runtime.lastError.message));
            else resolve(token);
        });
    });
}

async function fetchDriveFileList(token: string, folderId: string = 'root'): Promise<any[]> {
    const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)";
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ pageSize: '100', q: query, fields, orderBy: 'folder,modifiedTime desc' })}`;
    if (LOG_DRIVE) console.log(CONTEXT_PREFIX + ' [BG-Drive] Fetching list for folder ' + folderId);
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
    if (!response.ok) {
        const errorData = await response.text();
        if (LOG_ERROR) console.error(CONTEXT_PREFIX + `[BG-Drive] API error (Folder: ${folderId}):`, response.status, errorData);
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }
    const data = await response.json();
    if (LOG_DRIVE) console.log(CONTEXT_PREFIX + ' [BG-Drive] API success (Folder: ' + folderId + '). Found ' + (data.files?.length || 0) + ' items.');
    return data.files || [];
}

// Handle model loading progress messages by forwarding them to the sidepanel
function handleModelLoadingProgress(data: any) {
    if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Sending model loading progress to sidepanel:', data);
    browser.runtime.sendMessage({
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS,
        payload: data
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send progress message to sidepanel:', error);
    });
}

// Handle worker ready messages by forwarding them to the sidepanel
function handleWorkerReady(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.WORKER_READY,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send worker ready message to sidepanel:', error);
    });
}

// Handle generation update messages by forwarding them to the sidepanel
function handleGenerationUpdate(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.GENERATION_UPDATE,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send generation update to sidepanel:', error);
    });
}

// Handle generation complete messages by forwarding them to the sidepanel
function handleGenerationComplete(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.GENERATION_COMPLETE,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send generation complete to sidepanel:', error);
    });
}

// Handle generation stopped messages by forwarding them to the sidepanel
function handleGenerationStopped(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.GENERATION_STOPPED,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send generation stopped to sidepanel:', error);
    });
}

// Handle generation error messages by forwarding them to the sidepanel
function handleGenerationError(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.GENERATION_ERROR,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send generation error to sidepanel:', error);
    });
}

// Handle error messages by forwarding them to the sidepanel
function handleError(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.ERROR,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send error to sidepanel:', error);
    });
}

// Handle manifest updated messages by forwarding them to the sidepanel
function handleManifestUpdated() {
    browser.runtime.sendMessage({
        type: WorkerEventNames.MANIFEST_UPDATED
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send manifest updated to sidepanel:', error);
    });
}

// Handle env config messages by forwarding them to the sidepanel
function handleEnvConfig(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.SET_ENV_CONFIG,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send env config to sidepanel:', error);
    });
}

// Handle model source selection messages by forwarding them to the sidepanel
function handleModelSourceSelection(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.MODEL_SOURCE_SELECTION,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send model source selection to sidepanel:', error);
    });
}

// Handle memory stats request messages by forwarding them to the sidepanel
function handleRequestMemoryStats(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.REQUEST_MEMORY_STATS,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send memory stats request to sidepanel:', error);
    });
}

// Handle media pipe module ready messages by forwarding them to the sidepanel
function handleMediaPipeModuleReady(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.MEDIA_PIPE_MODULE_READY,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send media pipe module ready to sidepanel:', error);
    });
}

// Handle google terms accepted messages by forwarding them to the sidepanel
function handleGoogleTermsAccepted(payload: any) {
    browser.runtime.sendMessage({
        type: WorkerEventNames.GOOGLE_TERMS_ACCEPTED,
        payload: payload
    }).catch((error: any) => {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send google terms accepted to sidepanel:', error);
    });
}

browser.runtime.onInstalled.addListener(async (details: any) => {
    if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' onInstalled. Reason:', details.reason);
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error: any) => console.error('Error setting side panel behavior:', error));
    browser.storage.local.get(null).then((items: any) => {
        const keysToRemove = Object.keys(items).filter((key: string) => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0) browser.storage.local.remove(keysToRemove);
    });
});

browser.runtime.onStartup.addListener(async () => {
    if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' onStartup event.');
    await initializeSessionIds();
});

browser.action.onClicked.addListener(async (tab: any) => {
    if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' Action clicked for tab ' + (tab.id || 'N/A'));

});

browser.windows.onRemoved.addListener(async (windowId: number) => {
    if (LOG_POPUP) console.log(CONTEXT_PREFIX + ' Window removed: ' + windowId);
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        if (LOG_POPUP) console.log(CONTEXT_PREFIX + ' Popup window ' + windowId + ' for tab ' + tabId + ' was closed.');
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        
        // Tell sidepanel to restore from detached state
        try {
            browser.runtime.sendMessage({
                type: WorkerEventNames.RESTORE_FROM_POPUP,
                payload: { tabId }
            }).catch((error: any) => {
                // Sidepanel might not be open, that's okay
                if (LOG_POPUP) console.log(CONTEXT_PREFIX + ` Sidepanel not available for tab ${tabId}:`, error.message);
            });
            
            await browser.storage.local.remove(`detachedSessionId_${tabId}`);
        } catch (error) {
            if (LOG_ERROR) console.error(CONTEXT_PREFIX + ` Error restoring sidepanel for tab ${tabId}:`, error);
        }
    }
});

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response: any) => void) => {
    if (LOG_MESSAGE_PASSING) console.log(CONTEXT_PREFIX + ` Received message type: '${message?.type}' from: ${sender.id}`,  message);
    if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ` Background received message:`, message);
    if (!message || !message.type) {
        if (LOG_WARN) console.warn(CONTEXT_PREFIX + ' Received message without type:', message, 'From:', sender.id);
        return false;
    }
    
    // Mark UI as active when we receive any message from it
    // TODO: Move to proper port-based connection tracking to handle multiple UI instances
    setUIConnectionActive(true);
    
    const { type, payload } = message;
    let isResponseAsync = false;

    if (type === RuntimeMessageTypes.SCRAPE_REQUEST) {
        isResponseAsync = true;
        (async () => {
            try {
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] SCRAPE_REQUEST received. Payload:', payload);
                // Check if the URL is already open in any tab
                const tabs = await browser.tabs.query({ url: payload?.url });
                if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tabs found for URL', payload?.url, ':', tabs);
                if (tabs && tabs.length > 0) {
                    // Use the first matching tab
                    const tabId = tabs[0].id;
                    if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Found open tab (' + tabId + ') for URL: ' + payload?.url + '. Sending SCRAPE_PAGE to content script.');
                    try {
                        const response = await browser.tabs.sendMessage(tabId, { type: UIEventNames.SCRAPE_PAGE });
                        if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape response:', response);
                        if (response && response.success) {
                            if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape succeeded for tab ' + tabId + '.');
                            browser.runtime.sendMessage({
                                type: RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT,
                                payload: { stage: 1, success: true, chatId: payload?.chatId, messageId: payload?.messageId, method: 'contentScript', url: payload?.url, length: response?.text?.length || 0, ...response }
                            });
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (content script) started.` });
                        } else {
                            if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-Scrape] Content script scrape failed or returned error for tab ${tabId}. Falling back to temp tab scrape.`);
                            // Fallback to temp tab scrape
                            await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                        }
                    } catch (err) {
                        if (LOG_WARN) console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error sending SCRAPE_PAGE to content script in tab ${tabId}:`, err);
                        // Fallback to temp tab scrape
                        await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                        sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                    }
                } else {
                    if (LOG_SCRAPING) console.log(CONTEXT_PREFIX + ' [BG-Scrape] No open tab found for URL:', payload?.url, '. Using temp tab scrape.');
                    // No open tab, use temp tab scrape
                    await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                    sendResponse({ success: true, message: `Scraping for ${payload?.url} (temp tab) started.` });
                }
            } catch (error: unknown) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' [BG-Scrape] Error in SCRAPE_REQUEST handler:', error);
                const errMsg = error instanceof Error ? error.message : String(error);
                sendResponse({ success: false, error: errMsg });
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
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                sendResponse({ success: false, error: errMsg, folderId: message.folderId });
            }
        })();
        return isResponseAsync;
    }
    
    if (type === 'popupCreated') {
        // Data is at message root level, not in payload
        const { tabId, popupId } = message;
        detachedPopups[tabId] = popupId;
        popupIdToTabId[popupId] = tabId;
        if (LOG_POPUP) console.log(CONTEXT_PREFIX + ' Popup ' + popupId + ' registered for tab ' + tabId + '.');
        sendResponse({ success: true });
        return false;
    }
    if (type === 'getPopupForTab') {
        // Data is at message root level, not in payload
        const existingPopupId = detachedPopups[message.tabId];
        sendResponse({ popupId: existingPopupId || null });
        return false;
    }
    
    if (type === RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
        // Return current model state from background
        let state: string = WorkerEventNames.UNINITIALIZED;
        if (isModelLoading) {
            state = WorkerEventNames.LOADING_MODEL;
        } else {
            // Check actual model state (not just if we went through loading)
            const modelState = getModelState();
            if (modelState.isReady && modelState.repoId) {
                state = WorkerEventNames.MODEL_READY;
            }
        }
        
        sendResponse({ 
            state: state,
            modelId: currentModelId,
            dtype: currentModelDtype
        });
        return false;
    }

    if (type === RuntimeMessageTypes.RESTORE_LAST_STATE) {
        // Restore last loaded model and session
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Received RESTORE_LAST_STATE request');
        isResponseAsync = true;
        (async () => {
            try {
                // First initialize persistent state if not already done
                await initializePersistentState();
                
                // Get persistent state info
                const persistentState = getPersistentState();
                
                // Try to restore the last loaded model
                const modelRestored = await restoreLastLoadedModel();
                
                // Get actual model state from backgroundModelManager (not local variables)
                const modelState = getModelState();
                
                // Update local background variables to match the restored model
                if (modelRestored && modelState.isReady) {
                    currentModelId = modelState.repoId;
                    currentModelDtype = modelState.quantPath;
                    if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' Updated local model state after restoration:', { currentModelId, currentModelDtype });
                }
                
                sendResponse({
                    success: true,
                    modelRestored,
                    lastModel: persistentState.lastLoadedModel,
                    lastChatSession: persistentState.lastChatSessionId,
                    currentModel: {
                        id: modelState.repoId,
                        dtype: modelState.quantPath,
                        ready: modelState.isReady
                    }
                });
            } catch (error) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Error restoring last state:', error);
                sendResponse({ 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        })();
        return true; // MUST return true to keep the message channel open for async response
    }

    if (type === 'saveLastChatSession') {
        // Save session ID to persistent state (called from sidepanel when session changes)
        if (payload?.sessionId) {
            saveLastChatSession(payload.sessionId);
            if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' 💾 Saved session to persistent state:', payload.sessionId);
        }
        return false;
    }

    if (type === DBEventNames.DB_CREATE_SESSION_RESPONSE) {
        // Save the newly created session ID to persistent state
        if (payload?.sessionId) {
            saveLastChatSession(payload.sessionId);
            if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' Saved new session to persistent state:', payload.sessionId);
        }
        return false;
    }

    if (Object.values(DBEventNames).includes(type)) {
        return false;
    }

    // Handle WorkerEventNames messages - these are the messages that were previously handled by the Web Worker
    if (type === WorkerEventNames.INIT) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Received WorkerEventNames.INIT message:', payload);
        isResponseAsync = true;
        (async () => {
            try {
                if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Handling INIT request for model:', payload.modelId);
                
                // Save model info immediately when we receive the load request
                if (payload.modelId && payload.dtype) {
                    saveLastLoadedModel(payload.modelId, payload.dtype);
                    if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' 💾 Saved model info for restoration:', payload.modelId, payload.dtype);
                }
                
                isModelLoading = true;
                currentModelId = payload.modelId;
                currentModelDtype = payload.dtype;
                currentModelTask = payload.task || null;
                
                if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Calling loadModel with payload:', payload);
                await loadModel(payload, (data: any) => {
                    // Forward progress updates to the sidepanel
                    if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Forwarding model loading progress to sidepanel:', data);
                    handleModelLoadingProgress(data);
                });
                
                if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Model loaded successfully, sending WORKER_READY');
                isModelLoading = false;
                
                // Send WORKER_READY message to sidepanel
                handleWorkerReady({
                    modelId: payload.modelId,
                    dtype: payload.dtype,
                    task: payload.task,
                    executionProvider: 'webgpu' // TODO: Get actual execution provider
                });
                sendResponse({ success: true });
            } catch (error: any) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Model loading failed:', error);
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Error stack:', error.stack);
                isModelLoading = false;
                handleError(`Failed to load model ${payload.dtype}: ${error.message || error}`);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return isResponseAsync;
    }

    if (type === WorkerEventNames.GENERATE) {
        isResponseAsync = true;
        (async () => {
            try {
                if (LOG_GENERATION_FLOW) {
                    console.log(CONTEXT_PREFIX + ' 📨 Received GENERATE request:', {
                        chatId: payload.chatId,
                        messageId: payload.messageId,
                        messagesCount: payload.messages?.length
                    });
                }
                await generate(payload.messages, (data: any) => {
                    // Forward generation updates to the sidepanel based on status
                    if (data.status === 'generating') {
                        handleGenerationUpdate({
                            chatId: payload.chatId,
                            messageId: payload.messageId,
                            token: data.output,
                            message: data.message
                        });
                    } else if (data.status === 'complete') {
                        handleGenerationComplete({
                            chatId: payload.chatId,
                            messageId: payload.messageId,
                            generatedText: data.output,
                            output: data.output
                        });
                    } else if (data.status === 'stopped') {
                        handleGenerationStopped({
                            chatId: payload.chatId,
                            messageId: payload.messageId,
                            generatedText: data.output,
                            output: data.output
                        });
                    } else if (data.status === 'error') {
                        handleGenerationError({
                            chatId: payload.chatId,
                            messageId: payload.messageId,
                            error: data.error
                        });
                    }
                });
                sendResponse({ success: true });
            } catch (error: any) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Generation failed:', error);
                handleGenerationError({
                    chatId: payload.chatId,
                    messageId: payload.messageId,
                    error: error instanceof Error ? error.message : String(error)
                });
                sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
            }
        })();
        return isResponseAsync;
    }

    if (type === WorkerEventNames.STOP_GENERATION) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling STOP_GENERATION request');
        stopGeneration();
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.RESET) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling RESET request');
        resetModel();
        // Send reset complete message
        browser.runtime.sendMessage({
            type: WorkerEventNames.RESET_COMPLETE
        }).catch((error: any) => {
            if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send reset complete to sidepanel:', error);
        });
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.INFERENCE_SETTINGS_UPDATE) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling INFERENCE_SETTINGS_UPDATE request');
        updateInferenceSettings().catch((error: any) => {
            console.error(CONTEXT_PREFIX + ' Failed to update inference settings:', error);
        });
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.SET_BASE_URL) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling SET_BASE_URL request');
        // For now, just acknowledge - actual base URL handling would be implemented separately
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.HUGGINGFACE_LOGIN) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling HUGGINGFACE_LOGIN request');
        // For now, just acknowledge - actual login handling would be implemented separately
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.HUGGINGFACE_LOGOUT) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling HUGGINGFACE_LOGOUT request');
        // For now, just acknowledge - actual logout handling would be implemented separately
        sendResponse({ success: true });
        return false;
    }

    // Handle CHECK_BACKGROUND_READY message from sidepanel
    if (type === RuntimeMessageTypes.CHECK_BACKGROUND_READY) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Received CHECK_BACKGROUND_READY request from sidepanel, ready:', isBackgroundScriptReady);
        sendResponse({ 
            success: true, 
            ready: isBackgroundScriptReady,
            message: isBackgroundScriptReady ? 'Background script is ready' : 'Background script is initializing'
        });
        return false;
    }

    if (type === WorkerEventNames.CLEAR_CACHE) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling CLEAR_CACHE request');
        // Clear cache and interrupt generation if active
        clearCache();
        // Send cache cleared message
        browser.runtime.sendMessage({
            type: WorkerEventNames.CACHE_CLEARED
        }).catch((error: any) => {
            if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Failed to send cache cleared to sidepanel:', error);
        });
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.MANIFEST_UPDATED) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling MANIFEST_UPDATED request');
        handleManifestUpdated();
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.SET_ENV_CONFIG) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling SET_ENV_CONFIG request');
        handleEnvConfig(payload);
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.MODEL_SOURCE_SELECTION) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling MODEL_SOURCE_SELECTION request');
        handleModelSourceSelection(payload);
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.REQUEST_MEMORY_STATS) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling REQUEST_MEMORY_STATS request');
        handleRequestMemoryStats(payload);
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.MEDIA_PIPE_MODULE_READY) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling MEDIA_PIPE_MODULE_READY request');
        handleMediaPipeModuleReady(payload);
        sendResponse({ success: true });
        return false;
    }

    if (type === WorkerEventNames.GOOGLE_TERMS_ACCEPTED) {
        if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling GOOGLE_TERMS_ACCEPTED request');
        handleGoogleTermsAccepted(payload);
        sendResponse({ success: true });
        return false;
    }

    // Handle ML operations from worker (legacy messages)
    if (type === RuntimeMessageTypes.LOAD_MODEL) {
        isResponseAsync = true;
        (async () => {
            try {
                if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling LOAD_MODEL request');
                await loadModel(payload, (data: any) => {
                    browser.runtime.sendMessage({
                        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS,
                        payload: data
                    });
                });
                if (LOG_MODEL_LOADING) console.log(CONTEXT_PREFIX + ' Model loaded successfully');
                browser.runtime.sendMessage({ type: WorkerEventNames.WORKER_READY });
                sendResponse({ success: true });
            } catch (error: any) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Model loading failed:', error);
                browser.runtime.sendMessage({
                    type: WorkerEventNames.ERROR,
                    payload: { error: error instanceof Error ? error.message : String(error) }
                });
                sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        isResponseAsync = true;
        (async () => {
            try {
                if (LOG_MESSAGE_HANDLERS) console.log(CONTEXT_PREFIX + ' Handling GENERATE request');
                await generate(payload.messages, (data: any) => {
                    browser.runtime.sendMessage({
                        type: WorkerEventNames.GENERATION_UPDATE,
                        data: data
                    });
                });
                sendResponse({ success: true });
            } catch (error: any) {
                if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Generation failed:', error);
                browser.runtime.sendMessage({
                    type: WorkerEventNames.GENERATION_ERROR,
                    error: error instanceof Error ? error.message : String(error)
                });
                sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
            }
        })();
        return isResponseAsync;
    }

    if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        stopGeneration();
        sendResponse({ success: true });
        return false;
    }

    if (type === RuntimeMessageTypes.RESET_WORKER) {
        resetModel();
        sendResponse({ success: true });
        return false;
    }

    if (
        !Object.values(ModelLoaderMessageTypes).includes(type) &&
        !Object.values(WorkerEventNames).includes(type) &&
        !Object.values(RuntimeMessageTypes).includes(type) &&
        !Object.values(DBEventNames).includes(type) &&
        type !== 'popupCreated' && type !== 'getPopupForTab'
    ) {
        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Message type not recognized, returning false:', type);
        return false;
    }
    if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Message handler completed for type:', type);
    return false;
});

// Listen to llmChannel for UI connection lifecycle events
// This allows tracking multiple UI instances (sidepanel, popup, detached) across all contexts
(async () => {
    try {
        const { llmChannel } = await import('./Utilities/dbChannels');
        
        llmChannel.onmessage = (event: MessageEvent) => {
            const { type, payload } = event.data;
            
            switch (type) {
                case WorkerEventNames.UI_CONNECTED:
                    if (payload?.senderId && payload?.context) {
                        handleUIConnected(payload.senderId, payload.context);
                    }
                    break;
                    
                case WorkerEventNames.UI_DISCONNECTED:
                    if (payload?.senderId && payload?.context) {
                        handleUIDisconnected(payload.senderId, payload.context);
                    }
                    break;
                    
                case WorkerEventNames.UI_PONG:
                    if (payload?.senderId) {
                        if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' 🏓 Received pong from:', payload.senderId);
                        handleUIPong(payload.senderId);
                    }
                    break;
                    
                default:
                    // Other llmChannel messages are handled by sidepanel
                    break;
            }
        };
        
        if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' llmChannel listener established for UI lifecycle tracking');
    } catch (error) {
        if (LOG_ERROR) console.error(CONTEXT_PREFIX + ' Failed to setup llmChannel listener:', error);
    }
})();

(async () => {
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ' Initialized.');
    
    // Set the background script readiness state
    isBackgroundScriptReady = true;
    if (LOG_GENERAL) console.log(CONTEXT_PREFIX + ' Background script is now ready');
    
    // Log initial UI connection count
    if (LOG_DEBUG) console.log(CONTEXT_PREFIX + ` Initial UI connections: ${getActiveUICount()}`);
})();
