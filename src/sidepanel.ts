// --- Imports ---
import './DB/db';
import './modelAssetDownloader';
import browser from 'webextension-polyfill';
import { initializeNavigation } from './navigation';
import {
  initializeRenderer,
  setActiveSessionId as setRendererSessionId,
 
} from './Home/chatRenderer';
import { initializeOrchestrator } from './Home/messageOrchestrator';
import {
  initializeFileHandling,
  handleAttachClick,
  handleFileSelected,
} from './Home/fileHandler';
import {
  initializeUI,
  clearInput,
  focusInput,
  setActiveSession,
  setDownloadModelButtonState,
  setLoadModelButtonState,
  getCurrentlySelectedModel ,
  populateModelDropdown,      
  populateOnnxVariantDropdown,
  getModelSelectorOptions,  

} from './Home/uiController';
import { getActiveTab, showError as utilShowError, debounce } from './Utilities/generalUtils';
import { showNotification } from './notifications';
import { DbGetSessionRequest, DbAddLogRequest ,DbWorkerCreatedNotification, DbGetManifestRequest, DbGetAllModelFileManifestsRequest, DbInitializationCompleteNotification, DbCreateAllFileManifestsForRepoRequest, DbListModelFilesRequest, DbManifestUpdatedNotification, DbGetModelAssetChunkRequest } from './DB/dbEvents';
import { autoEnsureDbInitialized, forwardDbRequest } from './DB/db';
import { initializeHistoryPopup } from './Controllers/HistoryPopupController';
import { initializeLibraryController } from './Controllers/LibraryController';
import { initializeDiscoverController } from './Controllers/DiscoverController';
import { initializeSettingsController } from './Controllers/SettingsController';
import { initializeSpacesController } from './Controllers/SpacesController';
import { initializeDriveController } from './Controllers/DriveController';
import {
  UIEventNames,
  RuntimeMessageTypes,
  RawDirectMessageTypes,
  Contexts,
  InternalEventBusMessageTypes,
  WorkerEventNames,
} from './events/eventNames';

import { DBEventNames } from './DB/dbEvents';

import { llmChannel, logChannel } from './Utilities/dbChannels';
import { dbChannel } from './DB/idbSchema';
import { downloadModelAssets, updateRepoPopupState } from './modelAssetDownloader';
import { initializeONNXSelectionPopup } from './Controllers/ONNXSelectionPopupController';
import { fetchModelMetadataInternal, filterAndValidateFilesInternal } from './Utilities/modelMetadata';
import { ModelAssetManifest } from './DB/idbModelAsset';

// --- Constants ---
const LOG_QUEUE_MAX = 1000;
const senderId = 'sidepanel-' + Math.random().toString(36).slice(2) + '-' + Date.now();

// --- Global State ---
let activeSessionId: string | null = null;
let isPopup: boolean = false;
let originalTabIdFromPopup: string | null = null;
let currentTabId: number | null = null;
let isDbReady: boolean = false;
let historyPopupController: any = null;
let logQueue: any[] = [];
let currentModelId: string | null = null;
let onnxSelectionPopupController: any = null;
let allModelMetaFromDb: Record<string, any[]> = {};
let allManifests: ModelAssetManifest[] = [];
const prefix = '[Sidepanel]';

let modelWorker: Worker | null = null;
let currentModelIdInWorker: string | null = null;
let modelWorkerState: string = WorkerEventNames.UNINITIALIZED;
let isModelWorkerEnvReady: boolean = false;
// --- Global Setup ---
// Set EXTENSION_CONTEXT based on URL query string
(function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const contextParam = urlParams.get('context');
    const viewParam = urlParams.get('view');
    window.EXTENSION_CONTEXT =
      contextParam === 'popup'
        ? Contexts.POPUP
        : viewParam === 'logs'
        ? Contexts.OTHERS
        : Contexts.MAIN_UI;
  } catch (e) {
    window.EXTENSION_CONTEXT = Contexts.UNKNOWN;
    console.error('[Sidepanel] Error setting EXTENSION_CONTEXT:', e);
  }
})();

// Marked Setup
if (window.marked) {
  window.marked.setOptions({
    highlight: function (code: string, lang: string) {
      if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } catch (e) {
          console.error('hljs error:', e);
        }
      } else if (window.hljs) {
        try {
          return window.hljs.highlightAuto(code).value;
        } catch (e) {
          console.error('hljs auto error:', e);
        }
      }
      const escapeHtml = (htmlStr: string) =>
        htmlStr
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      return escapeHtml(code);
    },
    langPrefix: 'language-',
    gfm: true,
    breaks: true,
  });
  console.log('[Sidepanel] Marked globally configured to use highlight.');
} else {
  console.error('[Sidepanel] Marked library (window.marked) not found.');
}

// --- DB and Channel Utilities ---
function isDbRequest(type: string) {
  return typeof type === 'string' && type.endsWith('_REQUEST');
}

function isDbLocalContext() {
  return typeof forwardDbRequest === 'function';
}

async function sendDbRequestSmart(request: any) {
  console.log('[Sidepanel][DB][LOG] sendDbRequestSmart called', { request });
  let response;
  if (isDbLocalContext()) {
    response = await forwardDbRequest(request);
    console.log('[Sidepanel][DB][LOG] sendDbRequestSmart got local response', { response });
  } else {
    response = await browser.runtime.sendMessage(request);
    console.log('[Sidepanel][DB][LOG] sendDbRequestSmart got remote response', { response });
  }
  return response;
}

// Re-add: fire-and-forget DB request via channel (for logs)
function sendDbRequestViaChannel(request: any) {
  dbChannel.postMessage(request);
}

function requestDbAndWait(requestEvent: any) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const result = await sendDbRequestSmart(requestEvent);
        console.log(`${prefix} requestDbAndWait: Raw result`, result);
        const response = Array.isArray(result) ? result[0] : result;
        if (response && (response.success || response.error === undefined)) {
          resolve(response.data || response.payload);
        } else {
          reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
        }
      } catch (error) {
        reject(error);
      }
    })();
  });
}

// --- Logging ---
function bufferOrWriteLog(logPayload: any) {
  if (!isDbReady) {
    if (logQueue.length >= LOG_QUEUE_MAX) {
      logQueue.shift();
    }
    logQueue.push(logPayload);
  } else {
    const req = new DbAddLogRequest(logPayload);
    sendDbRequestViaChannel(req);
  }
}

logChannel.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'LOG_TO_DB' && payload) {
    bufferOrWriteLog(payload);
  }
};

// --- UI and Worker Utilities ---


function handleModelWorkerMessage(event: MessageEvent) {
  const { type, payload } = event.data;
  console.log(`${prefix} Message from model worker: Type: ${type}`, payload);

  // Update state based on worker messages
  switch (type) {
      case WorkerEventNames.WORKER_SCRIPT_READY:
          modelWorkerState = WorkerEventNames.WORKER_SCRIPT_READY;
          console.log(`${prefix} Model worker script is ready. 'init' message should have been sent.`);
          break;
      case WorkerEventNames.WORKER_ENV_READY:
          isModelWorkerEnvReady = true;
          console.log(`${prefix} Model worker environment is ready.`);
          updateModelActionButtons();
          break;
      case WorkerEventNames.LOADING_STATUS:
          modelWorkerState = WorkerEventNames.LOADING_MODEL;
          console.log(`${prefix} Worker loading status:`, payload);
          // In a LATER STEP, we'll call uiController.updateMainProgressBar here
          break;
      case WorkerEventNames.WORKER_READY:
          modelWorkerState = WorkerEventNames.MODEL_READY;
          currentModelIdInWorker = payload.model; // Worker confirms which model is ready
          console.log(`${prefix} Model worker is ready with model: ${payload.model}`);
          utilShowError(`Model ${payload.model} loaded successfully!`); // Temporary feedback
          // In a LATER STEP, we'll call uiController.setQueryInputState(true) and uiController.hideMainProgressBar()
          break;
      case WorkerEventNames.ERROR:
          modelWorkerState = WorkerEventNames.ERROR;
          isModelWorkerEnvReady = false;
          console.error(`${prefix} Model worker reported an error:`, payload);
          utilShowError(`Worker Error: ${payload}`);
          currentModelIdInWorker = null; // Clear model ID on error
          // In a LATER STEP, we'll update UI progress bar and input state
          break;
      case WorkerEventNames.RESET_COMPLETE:
          modelWorkerState = WorkerEventNames.UNINITIALIZED;
          isModelWorkerEnvReady = false;
          currentModelIdInWorker = null;
          console.log(`${prefix} Model worker reset complete.`);
          break;
      // GENERATION messages will be handled later when we integrate chat
      default:
          console.warn(`${prefix} Unhandled message type from model worker: ${type}`, payload);
  }
  updateModelActionButtons(); // Update button states based on worker's new state
}

function handleModelWorkerError(error: Event | string) {
  let errorMessage: string;
  if (error instanceof ErrorEvent) {
    errorMessage = error.message;
    console.error(`${prefix} Uncaught error in model worker:`, error.message, error.filename, error.lineno, error.colno, error.error);
  } else if (error instanceof Event && 'message' in error) {
    errorMessage = (error as any).message;
    console.error(`${prefix} Uncaught error in model worker:`, error);
  } else {
    errorMessage = String(error);
    console.error(`${prefix} Uncaught error in model worker:`, error);
  }
  modelWorkerState = WorkerEventNames.ERROR;
  currentModelIdInWorker = null;
  utilShowError(`Critical Worker Failure: ${errorMessage}`);
  updateModelActionButtons();
  if (modelWorker) {
      modelWorker.terminate();
      modelWorker = null;
  }
}

function initializeModelWorker() {
  if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR && modelWorkerState !== WorkerEventNames.UNINITIALIZED) {
      // If worker exists and is in a seemingly okay state, don't re-initialize unless forced
      // This check might need refinement based on desired behavior (e.g., if switching models)
      console.log(`${prefix} Model worker already exists and is not in an error/uninitialized state. State: ${modelWorkerState}`);
      return; // Or terminate and re-create if that's the desired logic for every init call
  }

  if (modelWorker) { // If it exists but is in error/uninitialized, or we want to force re-init
      console.log(`${prefix} Terminating existing model worker before creating a new one.`);
      modelWorker.terminate();
      modelWorker = null;
  }

  isModelWorkerEnvReady = false;
  console.log(`${prefix} Initializing model worker...`);
  try {
      const workerUrl = browser.runtime.getURL('modelworker.js');
      modelWorker = new Worker(workerUrl, { type: 'module' });
      modelWorkerState = WorkerEventNames.CREATING_WORKER;

      modelWorker.onmessage = handleModelWorkerMessage;
      modelWorker.onerror = handleModelWorkerError;

      console.log(`${prefix} Model worker instance created and listeners attached.`);
  } catch (error) {
      console.error(`${prefix} Failed to create model worker:`, error);
      modelWorkerState = WorkerEventNames.ERROR;
      utilShowError(`Failed to initialize model worker: ${(error as Error).message}`);
      updateModelActionButtons();
  }
}

function terminateModelWorker() {
  if (modelWorker) {
      console.log(`${prefix} Terminating model worker.`);
      modelWorker.terminate();
      modelWorker = null;
  }
  currentModelIdInWorker = null;
  modelWorkerState = WorkerEventNames.UNINITIALIZED;
  isModelWorkerEnvReady = false;
  updateModelActionButtons();
  // In a LATER STEP: uiController.setQueryInputState(false, "Model unloaded.");
  // In a LATER STEP: uiController.hideMainProgressBar();
  console.log(`${prefix} Model worker terminated. Chat input would be disabled.`);
}

function sendToModelWorker(message: any) {
  if (!modelWorker || modelWorkerState === WorkerEventNames.CREATING_WORKER && message.type !== 'init') {
      // If worker is still being created, only allow 'init' message.
      // Or, queue other messages if worker script isn't ready yet.
      // For now, if not ready for general messages, show error.
      console.warn(`${prefix} Model worker not ready to receive message type '${message.type}'. State: ${modelWorkerState}`);
      utilShowError("Model worker is not ready. Please wait or try reloading.");
      return;
  }
  try {
      modelWorker.postMessage(message);
  } catch (error) {
      console.error(`${prefix} Error posting message to model worker:`, error, message);
      utilShowError(`Error communicating with model worker: ${(error as Error).message}`);
  }
}

function sendUiEvent(type: string, payload: any) {
  browser.runtime.sendMessage({ type, payload });
}

function sendWorkerError(message: string) {
  browser.runtime.sendMessage({ type: UIEventNames.WORKER_ERROR, payload: message });
}

function getActiveChatSessionId(): string | null {
  return activeSessionId;
}

async function setActiveChatSessionId(newSessionId: string | null) {
  console.log(`${prefix} Setting active session ID to: ${newSessionId}`);
  activeSessionId = newSessionId;
  if (newSessionId) {
    await browser.storage.local.set({ lastSessionId: newSessionId });
  } else {
    await browser.storage.local.remove('lastSessionId');
  }
  setRendererSessionId(newSessionId);
  setActiveSession(newSessionId);
}

// --- Channel Handlers ---
if (window.EXTENSION_CONTEXT === Contexts.MAIN_UI) {
  dbChannel.onmessage = async (event: MessageEvent) => {
    const { type, payload, requestId, senderId: reqSenderId, responseType } = event.data;
    if (!isDbRequest(type)) return;
    try {
      const response = await browser.runtime.sendMessage({
        type,
        payload,
        requestId,
        senderId: reqSenderId,
      });
      const respType = responseType || type + '_RESPONSE';
      dbChannel.postMessage({ type: respType, payload: response, requestId, senderId });
    } catch (err) {
      const respType = responseType || type + '_RESPONSE';
      dbChannel.postMessage({
        type: respType,
        payload: { success: false, error: (err as Error).message },
        requestId,
        senderId,
      });
    }
  };

  llmChannel.onmessage = async (event: MessageEvent) => {
    const { type, payload, requestId, senderId: msgSenderId } = event.data;

    console.log('[Sidepanel][Channel][STORY] onmessage START', { type, requestId, payload, msgSenderId, timestamp: Date.now() });

    // --- Part 1: Handle asset requests FROM model-worker.js ---
    if (msgSenderId && msgSenderId.startsWith('worker-')) {
        console.log('[Sidepanel][Channel][STORY] From worker, checking type...', { type });
        if (type === DbListModelFilesRequest.type) {
            console.log('[Sidepanel][Channel][STORY] Matched DbListModelFilesRequest');
            try {
                if (payload && payload.fileName) {
                    // Manifest request for a specific file
                    console.log(`${prefix} llmChannel: Worker requests manifest:`, payload);
                    const manifestRequest = new DbListModelFilesRequest({ folder: payload.modelId, fileName: payload.fileName, returnObjects: true });
                    const dbResponse = await requestDbAndWait(manifestRequest);
                    const foundManifest = (dbResponse && Array.isArray(dbResponse) && dbResponse.length > 0) ? dbResponse[0] : null;

                    if (foundManifest) {
                        llmChannel.postMessage({ type: `${type}_RESPONSE`, payload: { success: true, manifest: foundManifest }, requestId, senderId });
                        console.log('[Sidepanel][Channel] Sending response to worker', { type: `${type}_RESPONSE`, requestId, payload: { success: true, manifest: foundManifest }, timestamp: Date.now() });
                    } else {
                        throw new Error(`Manifest not found for ${payload.modelId}/${payload.fileName}`);
                    }
                } else {
                    // List files request
                    console.log(`${prefix} llmChannel: Worker requests list model files:`, payload);
                    const dbListReq = new DbListModelFilesRequest({ folder: payload.modelId, returnObjects: true });
                    const dbListResp = await sendDbRequestSmart(dbListReq); // Or requestDbAndWait
                    const files = dbListResp.data || [];
                    llmChannel.postMessage({ type: `${type}_RESPONSE`, payload: { success: true, files: files }, requestId, senderId });
                }
            } catch (error) {
                console.error(`${prefix} Error handling DbListModelFilesRequest for worker:`, error);
                llmChannel.postMessage({ type: `${type}_RESPONSE`, payload: { success: false, error: (error as Error).message }, requestId, senderId });
                console.log('[Sidepanel][Channel] Sending response to worker', { type: `${type}_RESPONSE`, requestId, payload: { success: false, error: (error as Error).message }, timestamp: Date.now() });
            }
            console.log('[Sidepanel][Channel][STORY] End DbListModelFilesRequest block');
            return;
        } else if (type === DbGetModelAssetChunkRequest.type) {
            console.log('[Sidepanel][Channel][STORY] Matched DbGetModelAssetChunkRequest');
            try {
                console.log(`${prefix} llmChannel: Worker requests chunk:`, payload);
                // Use DbGetModelAssetChunkRequest to fetch a chunk
                const chunkRequest = new DbGetModelAssetChunkRequest({ folder: payload.folder, fileName: payload.fileName, chunkIndex: payload.chunkIndex });
                const chunkResponse = await requestDbAndWait(chunkRequest); // Response may be { data: ModelAssetChunk }
                const chunkObj = (chunkResponse && typeof chunkResponse === 'object' && 'data' in chunkResponse) ? chunkResponse.data : chunkResponse;

                let arrayBuffer: ArrayBuffer | null = null;
                if (chunkObj instanceof ArrayBuffer) {
                    arrayBuffer = chunkObj;
                } else if (chunkObj && typeof chunkObj === 'object' && 'data' in chunkObj && (chunkObj as any).data instanceof ArrayBuffer) {
                    arrayBuffer = (chunkObj as any).data;
                }

                if (arrayBuffer) {
                    llmChannel.postMessage({ type: `${type}_RESPONSE`, payload: { success: true, arrayBuffer }, requestId, senderId });
                    console.log('[Sidepanel][Channel] Sending response to worker', { type: `${type}_RESPONSE`, requestId, payload: { success: true, arrayBuffer }, timestamp: Date.now() });
                } else {
                    const folder = (chunkObj && typeof chunkObj === 'object' && 'folder' in chunkObj) ? (chunkObj as any).folder : payload.folder;
                    const fileName = (chunkObj && typeof chunkObj === 'object' && 'fileName' in chunkObj) ? (chunkObj as any).fileName : payload.fileName;
                    throw new Error(`Chunk ${payload.chunkIndex} not found for ${folder}/${fileName}`);
                }
            } catch (error) {
                console.error(`${prefix} Error fetching chunk for worker:`, error);
                llmChannel.postMessage({ type: `${type}_RESPONSE`, payload: { success: false, error: (error as Error).message }, requestId, senderId });
                console.log('[Sidepanel][Channel] Sending response to worker', { type: `${type}_RESPONSE`, requestId, payload: { success: false, error: (error as Error).message }, timestamp: Date.now() });
            }
            console.log('[Sidepanel][Channel][STORY] End DbGetModelAssetChunkRequest block');
            return;
        } else if (type === DbGetManifestRequest.type) {
            console.log('[Sidepanel][Channel][STORY] Matched DbGetManifestRequest');
            try {
                console.log('[Sidepanel][Channel] Handling DbGetManifestRequest', { requestId, payload });
                const manifestRequest = new DbGetManifestRequest(payload);
                const dbResponse = await requestDbAndWait(manifestRequest);
                console.log('[Sidepanel][Channel] DbGetManifestRequest DB response', { requestId, dbResponse });
                llmChannel.postMessage({
                    type: `${type}_RESPONSE`,
                    payload: { success: true, manifest: dbResponse ?? null },
                    requestId,
                    senderId
                });
                console.log('[Sidepanel][Channel] Sending response to worker', { type: `${type}_RESPONSE`, requestId, payload: { success: true, manifest: dbResponse ?? null }, timestamp: Date.now() });
            } catch (err) {
                llmChannel.postMessage({
                    type: `${type}_RESPONSE`,
                    payload: { success: false, error: err instanceof Error ? err.message : String(err), manifest: null },
                    requestId,
                    senderId
                });
                console.error('[Sidepanel][Channel] Error in DbGetManifestRequest handler', { requestId, error: err });
            }
            console.log('[Sidepanel][Channel][STORY] End DbGetManifestRequest block');
            return;
        }
        console.log('[Sidepanel][Channel][STORY] Unhandled worker message type', { type });
        return;
    }
    // --- Part 2: Handle messages for this sidepanel instance (e.g., from background, or legacy calls) ---
    if (msgSenderId && msgSenderId.startsWith('sidepanel-') && msgSenderId !== senderId) {
        console.log('[Sidepanel][Channel][STORY] Message from another sidepanel context, ignoring', { msgSenderId, senderId });
        return;
    }

    // Filter out worker status messages that are now handled by modelWorker.onmessage
    if ([
        WorkerEventNames.WORKER_SCRIPT_READY, WorkerEventNames.WORKER_READY,
        WorkerEventNames.LOADING_STATUS, WorkerEventNames.ERROR, WorkerEventNames.RESET_COMPLETE
    ].includes(type)) {
        // These are now directly handled by modelWorker.onmessage, no need to process here via llmChannel
        // unless this sidepanel instance itself posted them to llmChannel for broadcast.
        return;
    }

    // Re-route legacy commands or commands from other parts of UI to the new worker mechanism
    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        console.log(`${prefix} llmChannel: Received SEND_CHAT_MESSAGE, forwarding to model worker.`);
        sendToModelWorker({ type: 'generate', payload });
        // No direct response needed here for the llmChannel; worker will postMessage updates.
    } else if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        console.log(`${prefix} llmChannel: Received INTERRUPT_GENERATION, forwarding to model worker.`);
        sendToModelWorker({ type: 'interrupt', payload });
    } else if (type === RuntimeMessageTypes.RESET_WORKER) {
        console.log(`${prefix} llmChannel: Received RESET_WORKER. Terminating worker.`);
        terminateModelWorker();
        // Worker is reset. If a new model needs to be loaded, REQUEST_MODEL_EXECUTION will handle it.
        llmChannel.postMessage({ // Acknowledge the reset request
            type: RuntimeMessageTypes.RESET_WORKER + '_RESPONSE',
            payload: { success: true, message: "Worker reset." },
            requestId,
            senderId: 'sidepanel',
            timestamp: Date.now(),
        });
    } else if (type === RuntimeMessageTypes.LOAD_MODEL) {
        console.warn(`${prefix} llmChannel: Received legacy LOAD_MODEL. Use UIEventNames.REQUEST_MODEL_EXECUTION. Triggering load for:`, payload);
        const modelToLoad = payload.modelId || payload.model;
        const onnxToLoad = payload.onnxFile; // Assuming payload might have this
        if (modelToLoad && onnxToLoad && onnxToLoad !== 'all') {
            // Dispatch the event as if it came from the UI
            document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
                detail: { modelId: modelToLoad, onnxFile: onnxToLoad }
            }));
        } else {
            const errorMsg = `LOAD_MODEL received with invalid/missing modelId or onnxFile. Model: ${modelToLoad}, ONNX: ${onnxToLoad}`;
            console.error(`${prefix} ${errorMsg}`);
            llmChannel.postMessage({
                type: RuntimeMessageTypes.LOAD_MODEL + '_RESPONSE',
                payload: { success: false, error: errorMsg },
                requestId, senderId: 'sidepanel', timestamp: Date.now(),
            });
        }
    } else if (type === RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
        llmChannel.postMessage({
            type: RuntimeMessageTypes.GET_MODEL_WORKER_STATE + '_RESPONSE',
            payload: { state: modelWorkerState, modelId: currentModelIdInWorker },
            requestId,
            senderId: 'sidepanel',
            timestamp: Date.now(),
        });
    } else {
        console.log(`${prefix} llmChannel: Received unhandled message type for sidepanel: ${type}`, payload);
    }

    console.log('[Sidepanel][Channel][STORY] onmessage END', { type, requestId, payload, msgSenderId, timestamp: Date.now() });
  };
}

// --- Event Handlers ---
function handleMessage(message: any, sender: any, sendResponse: any) {
  const { type } = message;
  if (Object.values(DBEventNames).includes(type)) {
    return false;
  }
  if (type === RawDirectMessageTypes.WORKER_GENERIC_RESPONSE) {
    sendUiEvent(UIEventNames.BACKGROUND_RESPONSE_RECEIVED, {
      chatId: message.chatId,
      messageId: message.messageId,
      text: message.text,
    });
  } else if (type === RawDirectMessageTypes.WORKER_GENERIC_ERROR) {
    sendUiEvent(UIEventNames.BACKGROUND_ERROR_RECEIVED, {
      chatId: message.chatId,
      messageId: message.messageId,
      error: message.error,
    });
    sendResponse({});
  } else if (type === RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT) {
    sendUiEvent(UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, message.payload);
    sendResponse({ status: 'received', type });
  } else if (type === RawDirectMessageTypes.WORKER_DIRECT_SCRAPE_RESULT) {
    sendUiEvent(UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, message.payload);
    sendResponse({});
  } else if (type === RawDirectMessageTypes.WORKER_UI_LOADING_STATUS_UPDATE) {
    sendUiEvent(UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE, message.payload);
  } else if (
    type === InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST ||
    type === UIEventNames.MODEL_DOWNLOAD_PROGRESS
  ) {
    // No action needed
  } else {
    console.warn('[Sidepanel] Received unknown message type from background:', type, message);
  }

}

async function handleSessionCreated(newSessionId: string) {
  console.log(`${prefix} Orchestrator reported new session created: ${newSessionId}`);
  console.log(`${prefix} handleSessionCreated callback received sessionId:`, newSessionId);
  await setActiveChatSessionId(newSessionId);
  try {
    const request = new DbGetSessionRequest(newSessionId);
    const sessionData = await requestDbAndWait(request);
    if (!(sessionData as any)?.messages) {
      console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}.`, sessionData);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, err);
    utilShowError(`Failed to load initial messages for new chat: ${err.message}`);
  }
}

async function handleNewChat() {
  console.log(`${prefix} New Chat button clicked.`);
  await setActiveChatSessionId(null);
  clearInput();
  focusInput();
}

async function loadAndDisplaySession(sessionId: string | null) {
  if (!sessionId) {
    console.log(`${prefix} No session ID to load, setting renderer to null.`);
    await setActiveChatSessionId(null);
    return;
  }
  console.log(`${prefix} Loading session data for: ${sessionId}`);
  try {
    const request = new DbGetSessionRequest(sessionId);
    const sessionData = await requestDbAndWait(request);
    console.log(`${prefix} Session data successfully loaded for ${sessionId}.`);
    await setActiveChatSessionId(sessionId);
    if (!(sessionData as any)?.messages) {
      console.warn(`${prefix} No messages found in loaded session data for ${sessionId}.`);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`${prefix} Failed to load session ${sessionId}:`, err);
    utilShowError(`Failed to load chat: ${err.message}`);
    await setActiveChatSessionId(null);
  }
}

async function handleDetach() {
  if (!currentTabId) {
    console.error('Cannot detach: Missing tab ID');
    utilShowError('Cannot detach: Missing tab ID');
    return;
  }
  const currentSessionId = getActiveChatSessionId();
  try {
    const response = await browser.runtime.sendMessage({
      type: 'getPopupForTab',
      tabId: currentTabId,
    });
    if (response?.popupId) {
      await browser.windows.update(response.popupId, { focused: true });
      return;
    }
    const storageKey = `detachedSessionId_${currentTabId}`;
    await browser.storage.local.set({ [storageKey]: currentSessionId });
    console.log(`${prefix} Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
    const popup = await browser.windows.create({
      url: browser.runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
      type: 'popup',
      width: 400,
      height: 600,
    });
    if (popup?.id) {
      await browser.runtime.sendMessage({
        type: 'popupCreated',
        tabId: currentTabId,
        popupId: popup.id,
      });
    } else {
      throw new Error('Failed to create popup window.');
    }
  } catch (error) {
    const err = error as Error;
    console.error('Error during detach:', err);
    utilShowError(`Error detaching chat: ${err.message}`);
  }
}

async function handlePageChange(event: any) {
  if (!event?.pageId) return;
  console.log(`${prefix} Navigation changed to: ${event.pageId}`);
  if (!isDbReady) {
    console.log(`${prefix} DB not ready yet, skipping session load on initial navigation event.`);
    return;
  }
  if (event.pageId === 'page-home') {
    console.log(`${prefix} Navigated to home page, checking for specific session load signal...`);
    try {
      const { lastSessionId } = await browser.storage.local.get(['lastSessionId']);
      if (lastSessionId) {
        console.log(`${prefix} Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
        await loadAndDisplaySession(lastSessionId);
        await browser.storage.local.remove('lastSessionId');
      } else {
        console.log(`${prefix} No load signal found. Resetting to welcome state.`);
        await loadAndDisplaySession(null);
      }
    } catch (error) {
      const err = error as Error;
      console.error(`${prefix} Error checking/loading session based on signal:`, err);
      utilShowError('Failed to load session state.');
      await loadAndDisplaySession(null);
    }
  }
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  console.log(`${prefix} DOM Content Loaded.`);
  const urlParams = new URLSearchParams(window.location.search);
  const requestedView = urlParams.get('view');

  // Log Viewer Mode
  if (requestedView === 'logs') {
    console.log(`${prefix} Initializing in Log Viewer Mode.`);
    document.body.classList.add('log-viewer-mode');
    document.getElementById('header')?.classList.add('hidden');
    document.getElementById('bottom-nav')?.classList.add('hidden');
    document
      .querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
      .forEach((el) => el.classList.add('hidden'));
    const logViewerPage = document.getElementById('page-log-viewer');
    if (logViewerPage) {
      logViewerPage.classList.remove('hidden');
    } else {
      console.error('CRITICAL: #page-log-viewer element not found!');
      document.body.innerHTML =
        "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>";
      return;
    }
    try {
      const logViewerModule = await import('./Controllers/LogViewerController');
      await logViewerModule.initializeLogViewerController();
      console.log(`${prefix} Log Viewer Controller initialized.`);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to load or initialize LogViewerController:', error);
      if (logViewerPage) {
        logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${error.message}</div>`;
      }
    }
    return;
  }

  // Standard Mode
    console.log(`${prefix} Initializing in Standard Mode.`);
  document.getElementById('page-log-viewer')?.classList.add('hidden');

  // Initialize UI and Core Components
  try {
    const uiInitResult = await initializeUI({
      onNewChat: handleNewChat,
      onAttachFile: handleAttachClick,
    });
    if (!uiInitResult) throw new Error('UI initialization failed');
    const { chatBody, fileInput } = uiInitResult;
    console.log(`${prefix} UI Controller Initialized.`);

    if (!chatBody) {
      console.error('[Sidepanel] CRITICAL: chatBody is null before initializeRenderer!');
      throw new Error('chatBody is null');
    }
    initializeRenderer(chatBody, requestDbAndWait);
    console.log(`${prefix} Chat Renderer Initialized.`);

    initializeNavigation();
    console.log(`${prefix} Navigation Initialized.`);

    document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e: Event) => handlePageChange((e as CustomEvent).detail));

    initializeFileHandling({
      getActiveSessionIdFunc: getActiveChatSessionId,
    });
    console.log(`${prefix} File Handler Initialized.`);

    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelected);
    } else {
      console.warn(`${prefix} File input element not found before adding listener.`);
    }

    const activeTab = await getActiveTab();
    currentTabId = activeTab?.id;
    console.log(`${prefix} Current Tab ID: ${currentTabId}`);

    initializeOrchestrator({
      getActiveSessionIdFunc: getActiveChatSessionId,
      onSessionCreatedCallback: handleSessionCreated,
      getCurrentTabIdFunc: () => currentTabId,
    });
    console.log(`${prefix} Message Orchestrator Initialized.`);

    browser.runtime.onMessage.addListener(handleMessage);
    console.log(`${prefix} Background message listener added.`);

    // Initialize Controllers
    const historyPopupElement = document.getElementById('history-popup');
    const historyListElement = document.getElementById('history-list');
    const historySearchElement = document.getElementById('history-search');
    const closeHistoryButtonElement = document.getElementById('close-history');
    const historyButton = document.getElementById('history-button');
    const detachButton = document.getElementById('detach-button');

    if (historyPopupElement && historyListElement && historySearchElement && closeHistoryButtonElement) {
      historyPopupController = initializeHistoryPopup(
        {
          popupContainer: historyPopupElement,
          listContainer: historyListElement,
          searchInput: historySearchElement,
          closeButton: closeHistoryButtonElement,
        },
        requestDbAndWait
      );
      if (!historyPopupController) {
        console.error(`${prefix} History Popup Controller initialization failed.`);
      }
    } else {
      console.warn(`${prefix} Could not find all required elements for History Popup Controller.`);
    }

    if (historyButton && historyPopupController) {
      historyButton.addEventListener('click', () => historyPopupController.show());
    } else {
      console.warn(`${prefix} History button or controller not available for listener.`);
    }

    if (detachButton) {
      detachButton.addEventListener('click', handleDetach);
    } else {
      console.warn(`${prefix} Detach button not found.`);
    }

    const libraryListElement = document.getElementById('starred-list');
    if (libraryListElement) {
      initializeLibraryController({ listContainer: libraryListElement }, requestDbAndWait);
      console.log(`${prefix} Library Controller Initialized.`);
    } else {
      console.warn(`${prefix} Could not find #starred-list element for Library Controller.`);
    }


    document.addEventListener(UIEventNames.MODEL_SELECTION_CHANGED, async (e: Event) => {
      const { modelId, onnxFile } = (e as CustomEvent).detail;
      console.log(`${prefix} UIEvent: MODEL_SELECTION_CHANGED - Model: ${modelId}, ONNX: ${onnxFile}`);
      // This replaces the logic from the old modelSelector and quantSelector 'change' listeners
      currentModelId = modelId; // Update sidepanel's currentModelId if you still use it directly
      await handleModelSelectorChange(); // This fetches manifests for the new model if needed
                                        // and then calls renderDropdownsFromManifests
      updateModelActionButtons(); // Ensure buttons update based on new selection
    });

    document.addEventListener(UIEventNames.REQUEST_MODEL_DOWNLOAD_ACTION, async (e: Event) => {
      const { modelId, onnxFile } = (e as CustomEvent).detail;
      console.log(`${prefix} UIEvent: REQUEST_MODEL_DOWNLOAD_ACTION - Model: ${modelId}, ONNX: ${onnxFile}`);
      if (!modelId) {
          sendWorkerError('No model ID specified for downloading assets.'); // Or use utilShowError
          return;
      }
      try {
          // onnxFile can be 'all' or a specific file name
          const manifestsForModel = allManifests.filter(m => m.folder === modelId);
          const result = await downloadModelAssets(modelId, onnxFile, manifestsForModel); // downloadModelAssets needs to handle 'all'
          if (!result.success) {
              sendWorkerError(result.error || 'Unknown error during model asset download.');
          }
          // Progress is handled by MODEL_DOWNLOAD_PROGRESS event which updates uiController's progress bar
          // Button states will be updated via DbManifestUpdatedNotification -> renderDropdowns -> updateModelActionButtons
      } catch (err) {
          sendWorkerError(`Failed to download model assets: ${(err as Error).message}`);
      }
    });

    document.addEventListener(UIEventNames.REQUEST_MODEL_EXECUTION, async (e: Event) => {
      const { modelId, onnxFile } = (e as CustomEvent).detail; // onnxFile is passed but model-worker.js init currently only uses modelId
      console.log(`${prefix} UIEvent: REQUEST_MODEL_EXECUTION - Model: ${modelId}, Specific ONNX for context (if needed by worker): ${onnxFile}`);

      if (!modelId || !onnxFile || onnxFile === 'all') { // Ensure a specific ONNX file is selected for loading
          utilShowError('A specific model and ONNX file must be selected to load.');
          return;
      }

      // Terminate existing worker if loading a different model OR if the current worker is in an error state.
      if (modelWorker && (currentModelIdInWorker !== modelId || modelWorkerState === WorkerEventNames.ERROR)) {
          console.log(`${prefix} Terminating current worker before loading new model. Current: ${currentModelIdInWorker}, New: ${modelId}, State: ${modelWorkerState}`);
          terminateModelWorker();
      }
      
      // Initialize worker if it's not there (e.g., first load or after termination)
      if (!modelWorker) {
          initializeModelWorker();
      }

      // Check if worker was successfully created/retained
      if (!modelWorker) {
          utilShowError("Failed to create/initialize model worker. Cannot load model.");
          modelWorkerState = WorkerEventNames.ERROR;
          updateModelActionButtons(); // Reflect error state on buttons
          return;
      }
      
      console.log(`${prefix} Requesting model load in worker: ${modelId}`);
      modelWorkerState = WorkerEventNames.LOADING_MODEL;
      currentModelIdInWorker = modelId; // Tentatively set this. Worker will confirm with WORKER_READY.

      updateModelActionButtons(); // Update button states to "Loading..."
      // In a LATER STEP: uiController.updateMainProgressBar({ progress: 0, message: `Initializing worker for ${modelId}...` }, 'worker_load');
      console.log(`${prefix} UI would show: Initializing worker for ${modelId}...`);

      // Gather all manifests for this modelId (repo/folder)
      const repoManifests = allManifests.filter(m => m.folder === modelId);
      // Build a map: { [fileName]: manifest }
      const manifestMap: Record<string, any> = {};
      for (const m of repoManifests) {
          manifestMap[m.fileName] = m;
      }

      if (!manifestMap[onnxFile]) {
          utilShowError(`Manifest not found for model ${modelId} and ONNX file ${onnxFile}`);
          return;
      }

      // Build allowedOnnxFiles: selected ONNX file + any other ONNX files in the manifest for this model
      const allowedOnnxFiles = repoManifests
        .filter(m => m.fileType === 'onnx')
        .map(m => m.fileName);


      modelWorker.postMessage({
          type: 'init',
          payload: {
              modelId: modelId,
              manifest: manifestMap,
              onnxFile: onnxFile,
              allowedOnnxFiles: allowedOnnxFiles,

          }
      });
    }); 


    initializeDiscoverController();
    console.log(`${prefix} Discover Controller Initialized.`);

    initializeSettingsController();
    console.log(`${prefix} Settings Controller Initialized.`);

    initializeSpacesController();
    console.log(`${prefix} Spaces Controller Initialized.`);

    initializeDriveController({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification,
      debounce,
    });
    console.log(`${prefix} Drive Controller Initialized.`);

    // Handle Popup Context
    const popupContext = urlParams.get('context');
    originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
    isPopup = popupContext === 'popup';
    console.log(
      `${prefix} Context: ${isPopup ? 'Popup' : 'Sidepanel'}${
        isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''
      }`
    );

    if (isPopup && originalTabIdFromPopup) {
      const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
      const result = await browser.storage.local.get(storageKey);
      const detachedSessionId = result[storageKey];
      if (detachedSessionId) {
        console.log(`${prefix} Found detached session ID: ${detachedSessionId}. Loading...`);
        await loadAndDisplaySession(detachedSessionId);
      } else {
        console.log(`${prefix} No detached session ID found for key ${storageKey}. Starting fresh.`);
        await setActiveChatSessionId(null);
      }
    } else {
      console.log(`${prefix} Starting fresh. Loading empty/welcome state.`);
      await loadAndDisplaySession(null);
    }

    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        currentModelId = (e.target as HTMLSelectElement).value;
      });
      currentModelId = modelSelector.value;
    }


    const dropdownOptions = Array.from((document.getElementById('model-selector') as HTMLSelectElement).options).map(opt => opt.value);
    console.log(`${prefix} Model dropdown options before fetch:`, dropdownOptions);

    const dbInitSuccess = await initializeDatabase();
    if (!dbInitSuccess) return;

    const onnxModalEl = document.getElementById('onnx-selection-modal');
    const onnxFileListEl = document.getElementById('onnx-file-list');
    const dummyModelTitle = document.createElement('div');
    if (!onnxModalEl || !onnxFileListEl) {
      throw new Error('ONNX Selection modal or file list element not found');
    }
    onnxSelectionPopupController = initializeONNXSelectionPopup({
      modal: onnxModalEl as HTMLElement,
      fileList: onnxFileListEl as HTMLElement,
      modelTitle: dummyModelTitle as HTMLElement
    });
    const onnxCloseBtn = document.getElementById('onnx-selection-close');
    if (onnxCloseBtn && onnxSelectionPopupController) {
      onnxCloseBtn.addEventListener('click', () => onnxSelectionPopupController.hide());
    }

    window.showOnnxSelectionPopup = (modelId, onnxFiles, downloadPlan, initialFileStates, nonOnnxProgress, nonOnnxStatus, requestFileDownloadCb) => {
      if (onnxSelectionPopupController) {
        onnxSelectionPopupController.show(
          modelId,
          onnxFiles,
          downloadPlan,
          initialFileStates,
          nonOnnxProgress,
          nonOnnxStatus,
          requestFileDownloadCb
        );
      }
    };

    document.addEventListener(UIEventNames.MODEL_DOWNLOAD_PROGRESS, (e: any) => {
      const detail = e.detail || (e as CustomEvent).detail;
      if (detail && detail.currentFile) {
        if (detail.currentFile.endsWith('.onnx')) {
          const fileKey = detail.currentFile.split('/').pop();
          const percent = detail.currentFileSize ? Math.floor((detail.currentFileDownloaded / detail.currentFileSize) * 100) : 0;
          if (onnxSelectionPopupController) {
            onnxSelectionPopupController.updateFileProgress(fileKey, percent);
            if (percent >= 100 || detail.done) {
              onnxSelectionPopupController.setFileStatus(fileKey, 'loaded');
            }
          }
        }
      }
      if (typeof detail.progress === 'number') {
        updateMainProgress(detail.progress, detail.message || '');
        if (detail.done || detail.error) {
          setTimeout(hideMainProgress, 1500);
        }
      }
    });

    const modelLoadStatus = document.getElementById('model-load-status');
    const modelLoadStatusText = document.getElementById('model-load-status-text');
    const modelLoadProgressBar = document.getElementById('model-load-progress-bar');
    const modelLoadProgressInner = document.getElementById('model-load-progress-inner');

    function updateMainProgress(percent: number, text: string) {
      if (!modelLoadStatus || !modelLoadStatusText || !modelLoadProgressBar || !modelLoadProgressInner) return;
      modelLoadStatus.style.display = '';
      modelLoadStatusText.textContent = text;
      modelLoadProgressInner.style.width = `${percent}%`;
    }

    function hideMainProgress() {
      if (modelLoadStatus) modelLoadStatus.style.display = 'none';
      if (modelLoadProgressInner) modelLoadProgressInner.style.width = '0%';
      if (modelLoadStatusText) modelLoadStatusText.textContent = '';
    }

    console.log(`${prefix} Initialization complete.`);
  } catch (error) {
    const err = error as Error;
    console.error(`${prefix} Initialization failed:`, err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
        chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
  }


});

document.addEventListener(DbInitializationCompleteNotification.type, async (e: any) => {
  console.log(`${prefix} DbInitializationCompleteNotification received.`, e.detail);
  await handleModelSelectorChange();
  updateModelActionButtons();
  initializeModelWorker();
  // Send environment setup to model worker (do not load model yet)
  if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR) {
    const transformersWasmPath = browser.runtime.getURL('transformers.js/');
    const llamaWasmPath = browser.runtime.getURL('wasm/llama_bitnet_inference.wasm');
    modelWorker.postMessage({ type: 'initWorker', payload: { transformersWasmPath, llamaWasmPath } });
  }
});

// Listen for manifest update notifications and refresh dropdowns
document.addEventListener(DbManifestUpdatedNotification.type, async (e: any) => {
  const updatedManifest = e.detail?.payload?.manifest;
  if (!updatedManifest) return;

  // Update or insert the manifest in allManifests
  const idx = allManifests.findIndex(m => m.id === updatedManifest.id);
  if (idx !== -1) {
    allManifests[idx] = updatedManifest;
  } else {
    allManifests.push(updatedManifest);
  }

  await renderDropdownsFromManifests();
  updateModelActionButtons();
});

async function handleModelSelectorChange() {
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
  if (!modelSelector) return;
  const repoIds = getModelSelectorOptions();
  const reposNeedingFetch: string[] = [];
  allManifests = [];

  console.log(`${prefix} repoIds:`, repoIds);
  
  for (const repo of repoIds) {
    const dbListReq = new DbListModelFilesRequest({ folder: repo, returnObjects: true });
    const dbListResp = await sendDbRequestSmart(dbListReq);
    console.log(`${prefix} dbListResp for repo '${repo}':`, dbListResp);
    const dbFiles = dbListResp.data || [];
    console.log(`${prefix} dbFiles for repo '${repo}':`, dbFiles, 'Type:', Array.isArray(dbFiles) ? 'array' : typeof dbFiles, 'Length:', dbFiles.length);

    if (!dbFiles.length) {
      console.log(`${prefix} Repo '${repo}' not found in DB or has no files. Will fetch and create manifests.`);
      reposNeedingFetch.push(repo);
    } else {
      const manifests = dbFiles.filter((m: any) => typeof m === 'object' && m.fileName);
      console.log(`${prefix} manifests after filter for repo '${repo}':`, manifests, 'Length:', manifests.length);
      allManifests.push(...manifests);
      console.log(`${prefix} allManifests after push for repo '${repo}':`, allManifests, 'Length:', allManifests.length);
      console.log(`${prefix} Repo '${repo}' already exists in DB with files. Skipping manifest creation.`);
    }
  }

  // Now fetch metadata and create manifests only for repos that need it
  for (const repo of reposNeedingFetch) {
    try {
      const baseRepoUrl = `https://huggingface.co/${repo}/resolve/main/`;
      console.log(`${prefix} Fetching metadata for repo: ${repo}`);
      const metadata = await fetchModelMetadataInternal(repo);
      console.log(`${prefix} Got metadata for repo: ${repo}`, metadata);
      const { neededFileEntries } = await filterAndValidateFilesInternal(metadata, repo, baseRepoUrl);
      const enriched = { repo, metadata: { ...metadata, manifests: neededFileEntries } };
      await sendDbRequestSmart(new DbCreateAllFileManifestsForRepoRequest(enriched.metadata.manifests));
      allManifests.push(...enriched.metadata.manifests);
      console.log(`${prefix} Repo '${repo}' manifests created in DB.`);
    } catch (e) {
      console.warn(`${prefix} Failed to fetch or create manifests for repo: ${repo}`, e);
    }
  }

  console.log(`${prefix} Before renderDropdownsFromManifests, allManifests:`, allManifests);
  await renderDropdownsFromManifests();
}

// --- Helper: Render dropdowns from manifests ---
async function renderDropdownsFromManifests() {
  if (!allManifests.length) {
      console.log(`${prefix} allManifests is empty. Fetching from DB.`);
      const req = new DbGetAllModelFileManifestsRequest();
      const response = await sendDbRequestSmart(req);
      if (!response.success) {
          populateModelDropdown([], null); // Use the new function
          populateOnnxVariantDropdown([], null, false); // Use the new function
          return;
      }
      allManifests = response.data || [];
  }
  if (!allManifests.length) {
      console.warn(`${prefix} allManifests is still empty after DB fetch. Nothing to render.`);
      populateModelDropdown([], null);
      populateOnnxVariantDropdown([], null, false);
      return;
  }
  console.log(`${prefix} allManifests for dropdown rendering:`, allManifests);

  const { modelId: prevSelectedRepoInUI, onnxFile: prevSelectedOnnxInUI } = getCurrentlySelectedModel();

  const uniqueRepos = Array.from(new Set(allManifests.map((m: any) => String(m.folder)))) as string[];
  populateModelDropdown(uniqueRepos, prevSelectedRepoInUI);

  // Get the *actual* current selection from UI after population, as it might have defaulted
  const { modelId: currentSelectedRepoInUI } = getCurrentlySelectedModel();

  if (currentSelectedRepoInUI) {
      const repoManifests = allManifests.filter((m: any) => m.folder === currentSelectedRepoInUI && m.fileType === 'onnx');
      const onnxFilesForDropdown = repoManifests.map(m => ({ fileName: String(m.fileName), status: m.status }));
      const multipleOnnx = repoManifests.length > 1;
      populateOnnxVariantDropdown(onnxFilesForDropdown, prevSelectedOnnxInUI, multipleOnnx);
  } else {
      populateOnnxVariantDropdown([], null, false); // No repo selected, clear ONNX
  }

  updateModelActionButtons(); // This function will be updated next

  // --- Update ONNX popup if open --- (This part remains the same for now)
  const modal = document.getElementById('onnx-selection-modal');
  if (modal && !modal.classList.contains('hidden') && currentSelectedRepoInUI) {
      updateRepoPopupState(currentSelectedRepoInUI);
  }
}

// --- Helper: Database Initialization ---
async function initializeDatabase(): Promise<boolean> {
  try {
    const result = await autoEnsureDbInitialized();
    if (result?.success) {
      console.log(`${prefix} DB initialized directly.`);
      isDbReady = true;
      for (const logPayload of logQueue) {
        const req = new DbAddLogRequest(logPayload);
        sendDbRequestViaChannel(req);
      }
      logQueue = [];
      return true;
    } else {
      throw new Error(`Database initialization failed: ${result?.error || 'Unknown error'}`);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`${prefix} DB Initialization failed:`, err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
    return false;
  }
}

// --- Exports ---
export { sendDbRequestSmart };

function isModelReadyToLoad(selectedRepo: string, selectedOnnx: string) {
  // 1. Check ONNX file
  const onnxManifest = allManifests.find(
    m => m.folder === selectedRepo && m.fileName === selectedOnnx
  );
  const onnxReady = onnxManifest && (onnxManifest.status === 'present' || onnxManifest.status === 'complete');

  // 2. Check all supporting files
  const supportingFiles = allManifests.filter(
    m => m.folder === selectedRepo && m.fileType !== 'onnx'
  );
  const allSupportingReady = supportingFiles.length > 0 && supportingFiles.every(
    m => m.status === 'present' || m.status === 'complete'
  );

  // 3. Both must be true
  return onnxReady && allSupportingReady;
}

function updateModelActionButtons() {
    const { modelId: selectedRepoInUI, onnxFile: selectedOnnxInUI } = getCurrentlySelectedModel();

    let dlBtnVisible = false;
    let dlBtnText = "Download Model";
    let dlBtnDisabled = true; // Default to disabled

    let loadBtnVisible = false;
    let loadBtnText = "Load Model";
    let loadBtnDisabled = true; // Default to disabled

    if (!selectedRepoInUI || !selectedOnnxInUI) {
        // No model or ONNX variant selected in UI - keep buttons hidden/disabled
        setDownloadModelButtonState({ visible: false, text: dlBtnText, disabled: true });
        setLoadModelButtonState({ visible: false, text: loadBtnText, disabled: true });
        return;
    }

    const assetsReady = isModelReadyToLoad(selectedRepoInUI, selectedOnnxInUI);

    // Fallback for isDownloadingAssets if not defined
    let isDownloadingAssets = false;
    if (typeof window !== 'undefined' && typeof (window as any).isDownloadingAssets === 'boolean') {
        isDownloadingAssets = (window as any).isDownloadingAssets;
    } else if (typeof isDownloadingAssets !== 'undefined') {
        // If defined elsewhere in the module
    } else {
        isDownloadingAssets = false;
    }

    if (!assetsReady) {
        dlBtnVisible = true;
        dlBtnDisabled = isDownloadingAssets; // Disable if any asset download is in progress
        dlBtnText = isDownloadingAssets ? "Downloading..." : "Download Model";
    } else {
        // Assets are ready for the selected model/ONNX
        loadBtnVisible = true; // "Load Model" button is relevant
        dlBtnVisible = false; // "Download Model" button is not needed

        if (!isModelWorkerEnvReady) {
            loadBtnText = "Initializing...";
            loadBtnDisabled = true;
        } else if (selectedOnnxInUI === 'all') { // Cannot load 'all' variants
            loadBtnText = "Select ONNX";
            loadBtnDisabled = true;
        } else if (currentModelIdInWorker === selectedRepoInUI && modelWorkerState === WorkerEventNames.MODEL_READY) {
            loadBtnText = "Loaded";
            loadBtnDisabled = true;
        } else if (currentModelIdInWorker === selectedRepoInUI && modelWorkerState === WorkerEventNames.LOADING_MODEL) {
            loadBtnText = "Loading...";
            loadBtnDisabled = true;
        } else if (modelWorkerState === WorkerEventNames.ERROR && currentModelIdInWorker === selectedRepoInUI) {
            loadBtnText = "Load Failed"; // Or "Retry Load"
            loadBtnDisabled = false; // Allow retry
        } else {
            // Ready to load this model, or a different model is loaded, or worker is uninitialized/error for other model
            loadBtnText = "Load Model";
            loadBtnDisabled = false;
        }
    }

    // If any model is currently being loaded into the worker, disable asset downloads
    if (modelWorkerState === WorkerEventNames.LOADING_MODEL) {
        dlBtnDisabled = true;
    }

    setDownloadModelButtonState({ visible: dlBtnVisible, text: dlBtnText, disabled: dlBtnDisabled });
    setLoadModelButtonState({ visible: loadBtnVisible, text: loadBtnText, disabled: loadBtnDisabled });
}

// --- Debug: Expose manifest fetch test in sidepanel context ---
(window as any).testManifestFetchFromSidepanel = async function() {
    const testModel = "onnx-models/all-MiniLM-L6-v2-onnx";
    const testFile = "tokenizer.json";
    const req = new DbGetManifestRequest({ folder: testModel, fileName: testFile });
    console.log("[Sidepanel][TEST] Requesting manifest for", testModel, testFile, req);
    const t0 = performance.now();
    try {
        const manifest = await requestDbAndWait(req);
        const t1 = performance.now();
        console.log(`[Sidepanel][TEST] Got manifest in ${(t1 - t0).toFixed(2)} ms:`, manifest);

        // Print preview of manifest (first 10 keys/lines)
        if (manifest && typeof manifest === "object") {
            const manifestObj = manifest as Record<string, any>;
            const keys = Object.keys(manifestObj);
            console.log(`[Sidepanel][TEST] Manifest keys:`, keys.slice(0, 10));
            if (manifestObj.data && typeof manifestObj.data === "object") {
                const dataObj = manifestObj.data as Record<string, any>;
                const dataKeys = Object.keys(dataObj);
                console.log(`[Sidepanel][TEST] Manifest.data keys:`, dataKeys.slice(0, 10));
                if (Array.isArray(dataObj)) {
                    console.log(`[Sidepanel][TEST] Manifest.data (first 10 items):`, dataObj.slice(0, 10));
                } else {
                    const preview: Record<string, any> = {};
                    for (const k of dataKeys.slice(0, 10)) preview[k] = dataObj[k];
                    console.log(`[Sidepanel][TEST] Manifest.data preview:`, preview);
                }
            }
        }
        return manifest;
    } catch (e) {
        const t1 = performance.now();
        console.error(`[Sidepanel][TEST] Manifest fetch error after ${(t1 - t0).toFixed(2)} ms:`, e);
        throw e;
    }
};