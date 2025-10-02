// --- Imports ---
import './DB/db';
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
  updateGenerationState,
} from './Home/uiController';
import { getActiveTab, showError as utilShowError, debounce, showWarning as utilShowWarning } from './Utilities/generalUtils';
import { showNotification } from './notifications';
import { DbGetSessionRequest, DbAddLogRequest ,   DbInitializationCompleteNotification } from './DB/dbEvents';
import { autoEnsureDbInitialized, forwardDbRequest } from './DB/db';
import { initializeHistoryPopup } from './Controllers/HistoryPopupController';
import { initializeLibraryController } from './Controllers/LibraryController';
import { initializeDiscoverController } from './Controllers/DiscoverController';
import { initializeSettingsController } from './Controllers/SettingsController';
import { initializeSpacesController } from './Controllers/SpacesController';
import { initializeDriveController } from './Controllers/DriveController';
import { HuggingFaceLoginDialog } from './Components/HuggingFaceLoginDialog';
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
import { getManifestEntry, fetchRepoFiles, ManifestEntry,CURRENT_MANIFEST_VERSION, QuantStatus, addManifestEntry, getServerOnlySizeLimit, getBypassSizeLimitModels } from './DB/idbModel';

/**
 * Extract clean quantization type from file path (for legacy manifests)
 * @param filePath - File path like "onnx/model_q4f16.onnx" or "onnx/model.onnx"
 * @returns Clean dtype like "q4f16", "fp16", "fp32", etc.
 */
function extractCleanDtypeFromPath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') return 'fp32';
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || filePath;
    
    // Remove .onnx extension
    const nameWithoutExt = filename.replace(/\.onnx$/, '');
    
    // Extract quantization type from filename (check longer patterns first)
    if (nameWithoutExt.includes('q4f16')) return 'q4f16';
    if (nameWithoutExt.includes('uint8')) return 'uint8';  // Check uint8 before int8
    if (nameWithoutExt.includes('int8')) return 'int8';
    if (nameWithoutExt.includes('bnb4')) return 'bnb4';
    if (nameWithoutExt.includes('q4')) return 'q4';
    if (nameWithoutExt.includes('q8')) return 'q8';
    if (nameWithoutExt.includes('fp16')) return 'fp16';
    if (nameWithoutExt.includes('fp32')) return 'fp32';
    if (nameWithoutExt.includes('quantized')) return 'quantized';
    
    // Default to fp32 if no match (for "model.onnx" files)
    return 'fp32';
}
import { DbUpdateMessageRequest } from './DB/dbEvents';

import newChatIcon from './assets/icons/NewChat.png';
import historyIcon from './assets/icons/history.png';
import popupIcon from './assets/icons/popup.png';
import googleDriveIcon from './assets/icons/googledrive.png';
import attachIcon from './assets/icons/attach-svgrepo-com.svg';
import closeCircleIcon from './assets/icons/close-circle-svgrepo-com.svg';
import homeIcon from './assets/icons/home-svgrepo-com.svg';
import rocketIcon from './assets/icons/rocket-2-svgrepo-com.svg';
import myspaceIcon from './assets/icons/myspace-microsoft-svgrepo-com.svg';
import libraryIcon from './assets/icons/library-svgrepo-com.svg';
import settingsIcon from './assets/icons/settings-svgrepo-com.svg';

// --- Constants ---
const LOG_MANIFEST_GENERATION = true;
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const LOG_INFERENCE_SETTINGS = false;
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

const prefix = '[Sidepanel]';

let modelWorker: Worker | undefined = undefined;
let currentModelIdInWorker: string | null = null;
let modelWorkerState: string = WorkerEventNames.UNINITIALIZED;
let isModelWorkerEnvReady: boolean = false;
let isGenerating = false;

// Track the currently loaded model and quant (onnx variant)
let currentLoadedModel: { modelId: string | null, quant: string | null } = { modelId: null, quant: null };

// Define getModelSelectorOptions locally if not exported
function getModelSelectorOptions(): string[] {
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
  if (!modelSelector) return [];
  return Array.from(modelSelector.options).map(opt => opt.value).filter(Boolean);
}



function syncToggleLoadButton() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;
  if (!modelDropdown || !quantDropdown || !loadBtn) return;
  const selectedModelId = modelDropdown.value;
  const selectedQuant = quantDropdown.value;
  if (
    selectedModelId === currentLoadedModel.modelId &&
    selectedQuant === currentLoadedModel.quant &&
    selectedModelId && selectedQuant
  ) {
    loadBtn.style.display = 'none';
  } else {
    loadBtn.style.display = '';
  }
}

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
    if (LOG_ERROR) console.error(`${prefix} Error setting EXTENSION_CONTEXT:`, e);
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
          if (LOG_ERROR) console.error(`${prefix} hljs error:`, e);
        }
      } else if (window.hljs) {
        try {
          return window.hljs.highlightAuto(code).value;
        } catch (e) {
          if (LOG_ERROR) console.error(`${prefix} hljs auto error:`, e);
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
  if (LOG_DEBUG) console.log(`${prefix} Marked globally configured to use highlight.`);
} else {
  if (LOG_ERROR) console.error(`${prefix} Marked library (window.marked) not found.`);
}


function isDbRequest(type: string) {
  return typeof type === 'string' && type.endsWith('_REQUEST');
}

function isDbLocalContext() {
  return typeof forwardDbRequest === 'function';
}

async function sendDbRequestSmart(request: any) {
  if (LOG_DEBUG) console.log(`${prefix} sendDbRequestSmart called`, { request });
  let response;
  if (isDbLocalContext()) {
    response = await forwardDbRequest(request);
    if (LOG_DEBUG) console.log(`${prefix} sendDbRequestSmart got local response`, { response });
  } else {
    response = await browser.runtime.sendMessage(request);
    if (LOG_DEBUG) console.log(`${prefix} sendDbRequestSmart got remote response`, { response });
  }
  return response;
}


function sendDbRequestViaChannel(request: any) {
  dbChannel.postMessage(request);
}

function requestDbAndWait(requestEvent: any) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const result = await sendDbRequestSmart(requestEvent);
        if (LOG_DEBUG) console.log(`${prefix} requestDbAndWait: Raw result`, result);
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




function showDeviceBadge(executionProvider: string | null, providerNote?: string | null) {
  let badge = document.getElementById('device-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'device-badge';
    badge.style.display = 'inline-block';
    badge.style.marginLeft = '12px';
    badge.style.padding = '2px 10px';
    badge.style.border = '2px solid #888';
    badge.style.borderRadius = '8px';
    badge.style.fontWeight = 'bold';
    badge.style.fontSize = '0.95em';
    badge.style.background = '#f8f8f8';
    badge.style.color = executionProvider && executionProvider.includes('webgpu') ? '#1a7f37' : '#333';
    badge.style.borderColor = executionProvider && executionProvider.includes('webgpu') ? '#1a7f37' : '#888';
    badge.style.verticalAlign = 'middle';
    badge.style.transition = 'all 0.2s';
    const loadBtn = document.getElementById('load-model-button');
    if (loadBtn && loadBtn.parentNode) {
      loadBtn.parentNode.insertBefore(badge, loadBtn.nextSibling);
    } else {
      document.body.appendChild(badge);
    }
  }
  if (!executionProvider) {
    badge.textContent = 'Unknown';
  } else if (executionProvider.includes('webgpu')) {
    badge.textContent = 'GPU (WebGPU)';
  } else if (executionProvider.includes('wasm')) {
    badge.textContent = 'CPU (WASM)';
  } else {
    badge.textContent = executionProvider;
  }
  badge.style.display = '';
  badge.title = providerNote || '';
}

function hideDeviceBadge() {
  const badge = document.getElementById('device-badge');
  if (badge) badge.style.display = 'none';
}

function updateSendButtonForGeneration(isGenerating: boolean) {
  updateGenerationState(isGenerating);
}

function handleStopGeneration() {
  console.log(`${prefix} handleStopGeneration called. modelWorker: ${!!modelWorker}, isGenerating: ${isGenerating}`);
  if (modelWorker && isGenerating) {
    console.log(`${prefix} Sending stop generation request to worker.`);
    sendToModelWorker({ type: WorkerEventNames.STOP_GENERATION });
  } else {
    console.log(`${prefix} Cannot send stop request - modelWorker: ${!!modelWorker}, isGenerating: ${isGenerating}`);
  }
}

function handleSendButtonClick() {
  // This will be handled by the UI controller
  const queryInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
  if (queryInput && queryInput.value.trim() && !queryInput.disabled) {
    document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { 
      detail: { text: queryInput.value.trim() } 
    }));
    // Clear input after sending
    queryInput.value = '';
    // Adjust textarea height
    queryInput.style.height = 'auto';
  }
}

function handleModelWorkerMessage(event: MessageEvent) {
  const { type, label, payload } = event.data || {};
  // console.log(`${prefix} Message from model worker: Type: ${type}`, payload);

  // For use in WORKER_READY case

  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;

  switch (type) {
      case WorkerEventNames.WORKER_SCRIPT_READY:
          modelWorkerState = WorkerEventNames.WORKER_SCRIPT_READY;
          if (LOG_DEBUG) console.log(`${prefix} Model worker script is ready. 'init' message should have been sent.`);
          break;
      case WorkerEventNames.WORKER_ENV_READY:
          isModelWorkerEnvReady = true;
          if (LOG_DEBUG) console.log(`${prefix} Model worker environment is ready.`);
          break;
      case WorkerEventNames.LOADING_STATUS:
          modelWorkerState = WorkerEventNames.LOADING_MODEL;
          if (LOG_DEBUG) console.log(`${prefix} Worker loading status:`, payload);
          break;
      case WorkerEventNames.WORKER_READY: {
          const { modelId, dtype, task, fallback, executionProvider, warning } = payload;
          modelWorkerState = WorkerEventNames.MODEL_READY;
          currentModelIdInWorker = modelId;
          currentLoadedModel = {
            modelId: modelId,
            quant: dtype
          };
          syncToggleLoadButton();
          if (loadBtn) loadBtn.style.display = 'none';
          showDeviceBadge(executionProvider, warning);
          
          // Update dropdown to show current model status
          document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED));
          // Always show what quantization was actually loaded
          let quantMsg = `Model loaded with quantization: '${dtype}'.`;
          if (fallback) {
            quantMsg += ` Requested quantization '${payload.requestedQuant}' was not available, so fallback to '${dtype}' was used.`;
          }
          utilShowWarning(quantMsg);
          if (warning) {
            utilShowWarning(warning);
          }
          if (LOG_DEBUG) console.log(`${prefix} Model ${modelId} loaded successfully!`);
          if (LOG_DEBUG) console.log(`${prefix} Model worker is ready with model: ${modelId}, quant: ${dtype}, fallback: ${fallback}, executionProvider: ${executionProvider}, warning: ${warning}`);
          
          // Show success notification
          const modelDisplayName = modelId.split('/').pop() || modelId;
          showNotification(`✅ Model ready! ${modelDisplayName} (${dtype}) loaded successfully on ${executionProvider}`, 'success', 4000);
          break;
      }
      case WorkerEventNames.ERROR:
          modelWorkerState = WorkerEventNames.ERROR;
          isModelWorkerEnvReady = false;
          hideDeviceBadge();
          if (LOG_ERROR) console.error(`${prefix} Model worker reported an error:`, payload);
          utilShowError(`Worker Error: ${payload}`);
          currentModelIdInWorker = null; 
          break;
      case WorkerEventNames.RESET_COMPLETE:
          modelWorkerState = WorkerEventNames.UNINITIALIZED;
          isModelWorkerEnvReady = false;
          currentModelIdInWorker = null;
          hideDeviceBadge();
          if (LOG_DEBUG) console.log(`${prefix} Model worker reset complete.`);
          break;
      case UIEventNames.MODEL_WORKER_LOADING_PROGRESS:
          document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_WORKER_LOADING_PROGRESS, { detail: payload }));
          break;
      case WorkerEventNames.GENERATION_UPDATE:
          if (payload && payload.chatId && payload.messageId && typeof payload.token === 'string') {

              if (!isGenerating) {
                  isGenerating = true;
                  updateSendButtonForGeneration(true);
              }
              sendDbRequestSmart(new DbUpdateMessageRequest(payload.chatId, payload.messageId, {
                  isLoading: true,
                  sender: 'ai',
                  appendText: payload.token,
                  appendContent: payload.token
              }));
          }
          break;
      case WorkerEventNames.GENERATION_COMPLETE: {
          if (LOG_DEBUG) console.log(`${prefix} GENERATION_COMPLETE payload:`, payload);
          isGenerating = false;
          updateSendButtonForGeneration(false);
          if (payload.messageId && activeSessionId) {
              sendDbRequestSmart(new DbUpdateMessageRequest(activeSessionId, payload.messageId, {
                  isLoading: false,
                  sender: 'ai',
                  text: payload.generatedText,
                  content: payload.generatedText,
              }));
          }
          break;
      }
      case WorkerEventNames.GENERATION_STOPPED: {
          if (LOG_DEBUG) console.log(`${prefix} GENERATION_STOPPED payload:`, payload);
          isGenerating = false;
          updateSendButtonForGeneration(false);
          if (payload.messageId && activeSessionId) {
              sendDbRequestSmart(new DbUpdateMessageRequest(activeSessionId, payload.messageId, {
                  isLoading: false,
                  sender: 'ai',
                  text: payload.generatedText,
                  content: payload.generatedText,
              }));
          }
          break;
      }
      case WorkerEventNames.GENERATION_ERROR:
          isGenerating = false;
          updateSendButtonForGeneration(false);
          document.dispatchEvent(new CustomEvent(UIEventNames.BACKGROUND_ERROR_RECEIVED, {
              detail: {
                  chatId: payload.chatId,
                  messageId: payload.messageId,
                  error: payload.error
              }
          }));
          break;
      case WorkerEventNames.MANIFEST_UPDATED:
          document.dispatchEvent(new CustomEvent(WorkerEventNames.MANIFEST_UPDATED));
          break;
      case WorkerEventNames.REQUEST_MEMORY_STATS:
        if (performance && (performance as any).memory && modelWorker) {
          const mem = (performance as any).memory;
          (modelWorker as Worker).postMessage({
            type: WorkerEventNames.MEMORY_STATS,
            label,
            payload: {
              usedJSHeapSize: mem.usedJSHeapSize,
              totalJSHeapSize: mem.totalJSHeapSize,
              jsHeapSizeLimit: mem.jsHeapSizeLimit
            }
          });
        }
        break;
      case UIEventNames.SHOW_GOOGLE_TERMS_DIALOG:
          document.dispatchEvent(new CustomEvent(UIEventNames.SHOW_GOOGLE_TERMS_DIALOG, { detail: payload }));
          break;
      case UIEventNames.SHOW_MODEL_SOURCE_DIALOG:
          document.dispatchEvent(new CustomEvent(UIEventNames.SHOW_MODEL_SOURCE_DIALOG, { detail: payload }));
          break;
      case UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG:
          document.dispatchEvent(new CustomEvent(UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG, { detail: payload }));
          break;
      case UIEventNames.SHOW_KAGGLE_LOGIN_DIALOG:
          document.dispatchEvent(new CustomEvent(UIEventNames.SHOW_KAGGLE_LOGIN_DIALOG, { detail: payload }));
          break;
      case UIEventNames.SHOW_GOOGLE_LOGIN_DIALOG:
          document.dispatchEvent(new CustomEvent(UIEventNames.SHOW_GOOGLE_LOGIN_DIALOG, { detail: payload }));
          break;
      default:
          console.warn(`${prefix} Unhandled message type from model worker: ${type}`, payload);
  }
}

function handleModelWorkerError(error: Event | string) {
  let errorMessage: string;
  if (error instanceof ErrorEvent) {
    errorMessage = error.message;
    if (LOG_ERROR) console.error(`${prefix} Uncaught error in model worker:`, error.message, error.filename, error.lineno, error.colno, error.error);
  } else if (error instanceof Event && 'message' in error) {
    errorMessage = (error as any).message;
    if (LOG_ERROR) console.error(`${prefix} Uncaught error in model worker:`, error);
  } else {
    errorMessage = String(error);
    if (LOG_ERROR) console.error(`${prefix} Uncaught error in model worker:`, error);
  }
  modelWorkerState = WorkerEventNames.ERROR;
  currentModelIdInWorker = null;
  utilShowError(`Critical Worker Failure: ${errorMessage}`);
  if (modelWorker) {
      modelWorker.terminate();
      modelWorker = undefined;
  }
}

function initializeModelWorker() {
  if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR && modelWorkerState !== WorkerEventNames.UNINITIALIZED) {
      if (LOG_DEBUG) console.log(`${prefix} Model worker already exists and is not in an error/uninitialized state. State: ${modelWorkerState}`);
      return; 
  }

  if (modelWorker) { 
      if (LOG_DEBUG) console.log(`${prefix} Terminating existing model worker before creating a new one.`);
      modelWorker.terminate();
      modelWorker = undefined;
  }

  isModelWorkerEnvReady = false;
  if (LOG_DEBUG) console.log(`${prefix} Initializing model worker...`);
  try {
      const workerUrl = browser.runtime.getURL('modelworker.js');
      modelWorker = new Worker(workerUrl, { type: 'module' });
      modelWorkerState = WorkerEventNames.CREATING_WORKER;

      modelWorker.onmessage = handleModelWorkerMessage;
      modelWorker.onerror = handleModelWorkerError;

      if (LOG_DEBUG) console.log(`${prefix} Model worker instance created and listeners attached.`);
  } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Failed to create model worker:`, error);
      modelWorkerState = WorkerEventNames.ERROR;
      utilShowError(`Failed to initialize model worker: ${(error as Error).message}`);
  }

    if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR) {
      const extensionBaseUrl = browser.runtime.getURL('');
      modelWorker.postMessage({ type: WorkerEventNames.SET_BASE_URL, baseUrl: extensionBaseUrl });
    }
}

function terminateModelWorker() {
  if (modelWorker) {
      if (LOG_DEBUG) console.log(`${prefix} Terminating model worker.`);
      modelWorker.terminate();
      modelWorker = undefined;
  }
  currentModelIdInWorker = null;
  modelWorkerState = WorkerEventNames.UNINITIALIZED;
  isModelWorkerEnvReady = false;
  hideDeviceBadge();
  if (LOG_DEBUG) console.log(`${prefix} Model worker terminated. Chat input would be disabled.`);
}

function sendToModelWorker(message: any) {
  if (!modelWorker || modelWorkerState === WorkerEventNames.CREATING_WORKER && message.type !== WorkerEventNames.INIT) {

      console.warn(`${prefix} Model worker not ready to receive message type '${message.type}'. State: ${modelWorkerState}`);
      utilShowError("Model worker is not ready. Please wait or try reloading.");
      return;
  }
  try {
      modelWorker.postMessage(message);
  } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Error posting message to model worker:`, error, message);
      utilShowError(`Error communicating with model worker: ${(error as Error).message}`);
  }
}

function sendUiEvent(type: string, payload: any) {
  document.dispatchEvent(new CustomEvent(type, { detail: payload }));
  browser.runtime.sendMessage({ type, payload });
}


function getActiveChatSessionId(): string | null {
  return activeSessionId;
}

async function setActiveChatSessionId(newSessionId: string | null) {
  if (LOG_DEBUG) console.log(`${prefix} Setting active session ID to: ${newSessionId}`);
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


    if (msgSenderId && msgSenderId.startsWith('sidepanel-') && msgSenderId !== senderId) {
        if (LOG_DEBUG) console.log(`${prefix} Message from another sidepanel context, ignoring`, { msgSenderId, senderId });
        return;
    }

    if ([
        WorkerEventNames.WORKER_SCRIPT_READY, WorkerEventNames.WORKER_READY,
        WorkerEventNames.LOADING_STATUS, WorkerEventNames.ERROR, WorkerEventNames.RESET_COMPLETE
    ].includes(type)) {
        return;
    }

    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received SEND_CHAT_MESSAGE, forwarding to model worker.`);
        sendToModelWorker({ type: 'generate', payload });
    } else if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received INTERRUPT_GENERATION, forwarding to model worker.`);
        sendToModelWorker({ type: 'interrupt', payload });
    } else if (type === RuntimeMessageTypes.RESET_WORKER) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received RESET_WORKER. Terminating worker.`);
        terminateModelWorker();
        llmChannel.postMessage({ // Acknowledge the reset request
            type: RuntimeMessageTypes.RESET_WORKER + '_RESPONSE',
            payload: { success: true, message: "Worker reset." },
            requestId,
            senderId: 'sidepanel',
            timestamp: Date.now(),
        });
    } else if (type === RuntimeMessageTypes.LOAD_MODEL) {
        if (LOG_WARN) console.warn(`${prefix} llmChannel: Received legacy LOAD_MODEL. Use UIEventNames.REQUEST_MODEL_EXECUTION. Triggering load for:`, payload);
        const modelToLoad = payload.modelId || payload.model;
        const onnxToLoad = payload.quant; 
        if (modelToLoad && onnxToLoad && onnxToLoad !== 'all') {
            document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
                detail: { modelId: modelToLoad, quant: onnxToLoad }
            }));
        } else {
            const errorMsg = `LOAD_MODEL received with invalid/missing modelId or quant. Model: ${modelToLoad}, Quant: ${onnxToLoad}`;
            if (LOG_ERROR) console.error(`${prefix} ${errorMsg}`);
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
        if (LOG_WARN) console.warn(`${prefix} llmChannel: Received unhandled message type for sidepanel: ${type}`, payload);
    }

    if (LOG_DEBUG) console.log(`${prefix} onmessage END`, { type, requestId, payload, msgSenderId, timestamp: Date.now() });
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
  } else if (
    type === InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST ||
    type === UIEventNames.MODEL_WORKER_LOADING_PROGRESS
  ) {
    // No action needed
  } else {
    if (LOG_WARN) console.warn(`${prefix} Received unknown message type from background:`, type, message);
  }

}

async function handleSessionCreated(newSessionId: string) {
  if (LOG_DEBUG) console.log(`${prefix} Orchestrator reported new session created: ${newSessionId}`);
  if (LOG_DEBUG) console.log(`${prefix} handleSessionCreated callback received sessionId:`, newSessionId);
  await setActiveChatSessionId(newSessionId);
  try {
    const request = new DbGetSessionRequest(newSessionId);
    const sessionData = await requestDbAndWait(request);
    if (!(sessionData as any)?.messages) {
      if (LOG_WARN) console.warn(`${prefix} No messages found in session data for new session ${newSessionId}.`, sessionData);
    }
  } catch (error) {
    const err = error as Error;
    if (LOG_ERROR) console.error(`${prefix} Failed to fetch messages for new session ${newSessionId}:`, err);
    utilShowError(`Failed to load initial messages for new chat: ${err.message}`);
  }
}

async function handleNewChat() {
  if (LOG_DEBUG) console.log(`${prefix} New Chat button clicked.`);
  await setActiveChatSessionId(null);
  clearInput();
  focusInput();
}

async function loadAndDisplaySession(sessionId: string | null) {
  if (!sessionId) {
    if (LOG_DEBUG) console.log(`${prefix} No session ID to load, setting renderer to null.`);
    await setActiveChatSessionId(null);
    return;
  }
  if (LOG_DEBUG) console.log(`${prefix} Loading session data for: ${sessionId}`);
  try {
    const request = new DbGetSessionRequest(sessionId);
    const sessionData = await requestDbAndWait(request);
    if (LOG_DEBUG) console.log(`${prefix} Session data successfully loaded for ${sessionId}.`);
    await setActiveChatSessionId(sessionId);
    if (!(sessionData as any)?.messages) {
      if (LOG_WARN) console.warn(`${prefix} No messages found in loaded session data for ${sessionId}.`);
    }
  } catch (error) {
    const err = error as Error;
    if (LOG_ERROR) console.error(`${prefix} Failed to load session ${sessionId}:`, err);
    utilShowError(`Failed to load chat: ${err.message}`);
    await setActiveChatSessionId(null);
  }
}

async function handleDetach() {
  if (!currentTabId) {
    if (LOG_ERROR) console.error('Cannot detach: Missing tab ID');
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
    if (LOG_DEBUG) console.log(`${prefix} Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
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
    if (LOG_ERROR) console.error(`${prefix} Error during detach:`, err);
    utilShowError(`Error detaching chat: ${err.message}`);
  }
}

export function isModelLoaded() {
  return modelWorkerState === WorkerEventNames.MODEL_READY && !!currentModelIdInWorker;
}

export function getCurrentLoadedModel() {
  return currentLoadedModel;
}

export function isGenerationActive() {
  return isGenerating;
}

export { sendDbRequestSmart, sendToModelWorker };

// Add listener for stop generation event
document.addEventListener('stopGeneration', () => {
  console.log(`${prefix} Received stopGeneration event from UI`);
  handleStopGeneration();
});

// Add listener for generation starting event
document.addEventListener('generationStarting', () => {
  console.log(`${prefix} Received generationStarting event from orchestrator`);
  isGenerating = true;
  updateSendButtonForGeneration(true);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  if (LOG_DEBUG) console.log(`${prefix} DOM Content Loaded.`);
  const urlParams = new URLSearchParams(window.location.search);
  const requestedView = urlParams.get('view');

  // Log Viewer Mode
  if (requestedView === 'logs') {
    if (LOG_DEBUG) console.log(`${prefix} Initializing in Log Viewer Mode.`);
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
      if (LOG_ERROR) console.error(`${prefix} CRITICAL: #page-log-viewer element not found!`);
      document.body.innerHTML =
        "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>";
      return;
    }
    try {
      const logViewerModule = await import('./Controllers/LogViewerController');
      await logViewerModule.initializeLogViewerController();
      if (LOG_DEBUG) console.log(`${prefix} Log Viewer Controller initialized.`);
    } catch (err) {
      const error = err as Error;
      if (LOG_ERROR) console.error(`${prefix} Failed to load or initialize LogViewerController:`, error);
      if (logViewerPage) {
        logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${error.message}</div>`;
      }
    }
    return;
  }

  // Standard Mode
  if (LOG_DEBUG) console.log(`${prefix} Initializing in Standard Mode.`);
  document.getElementById('page-log-viewer')?.classList.add('hidden');

  // Initialize UI and Core Components
  try {
    const uiInitResult = await initializeUI({
      onNewChat: handleNewChat,
      onAttachFile: handleAttachClick,
    });
    if (!uiInitResult) throw new Error('UI initialization failed');
    const { chatBody, fileInput } = uiInitResult;
    if (LOG_DEBUG) console.log(`${prefix} UI Controller Initialized.`);

    if (!chatBody) {
      if (LOG_ERROR) console.error(`${prefix} CRITICAL: chatBody is null before initializeRenderer!`);
      throw new Error('chatBody is null');
    }
    initializeRenderer(chatBody, requestDbAndWait);
    if (LOG_DEBUG) console.log(`${prefix} Chat Renderer Initialized.`);

    initializeNavigation();
    if (LOG_DEBUG) console.log(`${prefix} Navigation Initialized.`);

    document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e: Event) => handlePageChange((e as CustomEvent).detail));

    // Initialize dialog instances
    const huggingFaceLoginDialog = new HuggingFaceLoginDialog();

    initializeFileHandling({
      getActiveSessionIdFunc: getActiveChatSessionId,
    });
    if (LOG_DEBUG) console.log(`${prefix} File Handler Initialized.`);

    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelected);
    } else {
      if (LOG_WARN) console.warn(`${prefix} File input element not found before adding listener.`);
    }

    const activeTab = await getActiveTab();
    currentTabId = activeTab?.id;
    if (LOG_DEBUG) console.log(`${prefix} Current Tab ID: ${currentTabId}`);

    initializeOrchestrator({
      getActiveSessionIdFunc: getActiveChatSessionId,
      onSessionCreatedCallback: handleSessionCreated,
      getCurrentTabIdFunc: () => currentTabId,
    });
    if (LOG_DEBUG) console.log(`${prefix} Message Orchestrator Initialized.`);

    browser.runtime.onMessage.addListener(handleMessage);
    if (LOG_DEBUG) console.log(`${prefix} Background message listener added.`);

    // Initialize Controllers
    const historyPopupElement = document.getElementById('history-popup');
    const historyListElement = document.getElementById('history-list');
    const historySearchElement = document.getElementById('history-search');
    const closeHistoryButtonElement = document.getElementById('close-history');
    const historyButton = document.getElementById('history-button');
    const detachButton = document.getElementById('detach-button');
    const newChatButton = document.getElementById('new-chat-button');

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
        if (LOG_ERROR) console.error(`${prefix} History Popup Controller initialization failed.`);
      }
    } else {
      if (LOG_WARN) console.warn(`${prefix} Could not find all required elements for History Popup Controller.`);
    }

    if (historyButton && historyPopupController) {
      historyButton.addEventListener('click', () => historyPopupController.show());
    } else {
      if (LOG_WARN) console.warn(`${prefix} History button or controller not available for listener.`);
    }

    if (newChatButton) {
      newChatButton.addEventListener('click', handleNewChat);
    }
    // Detach button is allowed in all contexts where present
    if (detachButton) {
      detachButton.addEventListener('click', handleDetach);
    } else {
      if (LOG_WARN) console.warn(`${prefix} Detach button not found.`);
    }

    const libraryListElement = document.getElementById('starred-list');
    if (libraryListElement) {
      initializeLibraryController({ listContainer: libraryListElement }, requestDbAndWait);
      if (LOG_DEBUG) console.log(`${prefix} Library Controller Initialized.`);
    } else {
      if (LOG_WARN) console.warn(`${prefix} Could not find #starred-list element for Library Controller.`);
    }

    document.addEventListener(UIEventNames.REQUEST_MODEL_EXECUTION, async (e) => {
      const { modelId, dtype, loadId } = (e as CustomEvent).detail;
      if (!modelId) {
          utilShowError('No model selected.');
          return;
      }
      
      // Check if the same model is already loaded
      if (currentLoadedModel.modelId === modelId && currentLoadedModel.quant === dtype && modelWorkerState === WorkerEventNames.MODEL_READY) {
          if (LOG_DEBUG) console.log(`${prefix} Model ${modelId} (${dtype}) is already loaded. Skipping reload.`);
          showNotification(`Model ${modelId} (${dtype}) is already loaded and ready to use!`, 'success', 3000);
          
          // Reset UI loading state since we're not actually loading
          document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_ALREADY_LOADED, { 
              detail: { modelId, dtype, loadId } 
          }));
          return;
      }
      
      if (modelWorker && (currentModelIdInWorker !== modelId || modelWorkerState === WorkerEventNames.ERROR)) {
          if (LOG_DEBUG) console.log(`${prefix} Terminating current worker before loading new model. Current: ${currentModelIdInWorker}, New: ${modelId}, State: ${modelWorkerState}`);
          terminateModelWorker();
      }
      if (!modelWorker) {
          initializeModelWorker();
      }
      if (!modelWorker) {
          utilShowError("Failed to create/initialize model worker. Cannot load model.");
          modelWorkerState = WorkerEventNames.ERROR;
          return;
      }
      const waitForEnvReady = async (timeoutMs = 5000) => {
        if (isModelWorkerEnvReady) return;
        if (LOG_DEBUG) console.log(`${prefix} Waiting for model worker environment to be ready...`);
        const start = Date.now();
        while (!isModelWorkerEnvReady) {
          if (Date.now() - start > timeoutMs) {
            throw new Error("Timed out waiting for model worker environment to be ready.");
          }
          await new Promise(res => setTimeout(res, 50));
        }
        if (LOG_DEBUG) console.log(`${prefix} Model worker environment is now ready. Proceeding to load model.`);
      };
      try {
        await waitForEnvReady();
      } catch (e) {
        const err = e as Error;
        utilShowError(err.message || "Model worker failed to initialize.");
        return;
      }
      // Get the task from the manifest
      const manifestEntry = await getManifestEntry(modelId);
      const task = manifestEntry && manifestEntry.task ? manifestEntry.task : 'text-generation';

      if (LOG_DEBUG) console.log(`${prefix} UI would show: Initializing worker for ${modelId} with dtype: ${dtype}, task: ${task}...`);
      modelWorkerState = WorkerEventNames.LOADING_MODEL;
      currentModelIdInWorker = modelId;
      modelWorker.postMessage({
          type: WorkerEventNames.INIT,
          payload: { modelId, dtype, task, loadId }
      });
    });

    // Handle model selection changes (when user changes dropdown)
    document.addEventListener(UIEventNames.MODEL_SELECTION_CHANGED, async (e) => {
      const { modelId, dtype } = (e as CustomEvent).detail || {};
      console.log(`${prefix} [DEBUG] Model selection changed:`, { modelId, dtype, currentLoadedModel });
      
      // This is just a selection change, not a load request
      // The UI controller will handle updating the dropdown status
      if (modelId && dtype) {
        console.log(`${prefix} [DEBUG] Model selection updated to: ${modelId} (${dtype})`);
        console.log(`${prefix} [DEBUG] Current loaded model:`, currentLoadedModel);
      }
    });

    // Dialog event handlers

    document.addEventListener(UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG, async (e) => {
      const { modelId, modelPath: dtype, task, loadId } = (e as CustomEvent).detail;
      const token = await huggingFaceLoginDialog.show(modelId);
      if (token) {
        // Send login event to model worker
        if (modelWorker) {
          modelWorker.postMessage({
            type: WorkerEventNames.HUGGINGFACE_LOGIN,
            payload: { modelId, modelPath: dtype, task, loadId, token }
          });
        }
      } else {
        utilShowError('HuggingFace authentication cancelled. Cannot load model.');
      }
    });

    initializeDiscoverController();
    if (LOG_DEBUG) console.log(`${prefix} Discover Controller Initialized.`);

    initializeSettingsController();
    if (LOG_DEBUG) console.log(`${prefix} Settings Controller Initialized.`);

    initializeSpacesController();
    if (LOG_DEBUG) console.log(`${prefix} Spaces Controller Initialized.`);

    initializeDriveController({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification,
      debounce,
    });
    if (LOG_DEBUG) console.log(`${prefix} Drive Controller Initialized.`);

    const popupContext = urlParams.get('context');
    originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
    isPopup = popupContext === 'popup';
    if (LOG_DEBUG) console.log(
      `${prefix} Context: ${isPopup ? 'Popup' : 'Sidepanel'}${
        isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''
      }`
    );

    if (isPopup && originalTabIdFromPopup) {
      const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
      const result = await browser.storage.local.get(storageKey);
      const detachedSessionId = result[storageKey];
      if (detachedSessionId) {
        if (LOG_DEBUG) console.log(`${prefix} Found detached session ID: ${detachedSessionId}. Loading...`);
        await loadAndDisplaySession(detachedSessionId);
      } else {
        if (LOG_DEBUG) console.log(`${prefix} No detached session ID found for key ${storageKey}. Starting fresh.`);
        await setActiveChatSessionId(null);
      }
    } else {
      if (LOG_DEBUG) console.log(`${prefix} Starting fresh. Loading empty/welcome state.`);
      await loadAndDisplaySession(null);
    }

    // Check if we have bypass settings that might affect manifest status
    const hasBypassSettings = getBypassSizeLimitModels().size > 0;
    await ensureManifestForDropdownRepos(hasBypassSettings);
    
    const dbInitSuccess = await initializeDatabase();
    if (!dbInitSuccess) return;

    if (LOG_DEBUG) console.log(`${prefix} Initialization complete.`);

    const modelDropdownEl = document.getElementById('model-selector');
    const quantDropdownEl = document.getElementById('onnx-variant-selector');
    if (modelDropdownEl) {
      modelDropdownEl.addEventListener('change', async () => {
        hideDeviceBadge();
        syncToggleLoadButton();
      });
    }
    if (quantDropdownEl) {
      quantDropdownEl.addEventListener('change', () => {
        hideDeviceBadge();
        syncToggleLoadButton();
      });
    }
    // Initial toggle
    syncToggleLoadButton();

    if (modelWorker) {
      const originalOnMessage = modelWorker.onmessage;
      modelWorker.onmessage = function(event) {
        if (event.data && event.data.type === WorkerEventNames.MANIFEST_UPDATED) {
          syncToggleLoadButton();
        }
        if (typeof originalOnMessage === 'function') {
          originalOnMessage.call(this, event);
        }
      };
    }

    // Set icon srcs via imports
    const iconMap = [
      ['icon-new-chat', newChatIcon],
      ['icon-history', historyIcon],
      ['icon-popup', popupIcon],
      ['icon-googledrive', googleDriveIcon],
      ['icon-attach', attachIcon],
      ['icon-close-history', closeCircleIcon],
      ['icon-close-drive-viewer', closeCircleIcon],
      ['icon-home', homeIcon],
      ['icon-rocket', rocketIcon],
      ['icon-myspace', myspaceIcon],
      ['icon-library', libraryIcon],
      ['icon-settings', settingsIcon],
    ];
    for (const [id, src] of iconMap) {
      const el = document.getElementById(id) as HTMLImageElement | null;
      if (el) el.src = src;
    }

  } catch (error) {
    const err = error as Error;
    if (LOG_ERROR) console.error(`${prefix} Initialization failed:`, err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
        chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
  }
});

async function handlePageChange(event: any) {
  if (!event?.pageId) return;
  if (LOG_DEBUG) console.log(`${prefix} Navigation changed to: ${event.pageId}`);
  if (!isDbReady) {
    if (LOG_DEBUG) console.log(`${prefix} DB not ready yet, skipping session load on initial navigation event.`);
    return;
  }
  if (event.pageId === 'page-home') {
    if (LOG_DEBUG) console.log(`${prefix} Navigated to home page, checking for specific session load signal...`);
    try {
      const { lastSessionId } = await browser.storage.local.get(['lastSessionId']);
      if (lastSessionId) {
        if (LOG_DEBUG) console.log(`${prefix} Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
        await loadAndDisplaySession(lastSessionId);
        await browser.storage.local.remove('lastSessionId');
      } else {
        if (LOG_DEBUG) console.log(`${prefix} No load signal found. Resetting to welcome state.`);
        await loadAndDisplaySession(null);
      }
    } catch (error) {
      const err = error as Error;
      if (LOG_ERROR) console.error(`${prefix} Error checking/loading session based on signal:`, err);
      utilShowError('Failed to load session state.');
      await loadAndDisplaySession(null);
    }
  }
}

async function initializeDatabase(): Promise<boolean> {
  try {
    const result = await autoEnsureDbInitialized();
    if (result?.success) {
      if (LOG_DEBUG) console.log(`${prefix} DB initialized directly.`);
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
    if (LOG_ERROR) console.error(`${prefix} DB Initialization failed:`, err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
    return false;
  }
}

export async function ensureManifestForDropdownRepos(forceRebuild: boolean = false) {
  if (typeof document === 'undefined') return;

  const dropdownRepos = getModelSelectorOptions(); 
  if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] Dropdown repos to check/update:`, dropdownRepos);

  const SUPPORTING_FILE_REGEX = /\.(onnx(\.data)?|onnx_data|json|bin|pt|txt|model)$/i;

  const processedRepos: string[] = [];
  const skippedRepos: string[] = [];
  const errorRepos: string[] = [];

  for (const repo of dropdownRepos) {
    if (!forceRebuild) {
      const existingManifest = await getManifestEntry(repo);
      if (existingManifest) {
        if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] Manifest for ${repo} already exists. Skipping fetch/build.`);
        processedRepos.push(repo);
        continue;
      }
    } else {
      if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] Force rebuild requested for ${repo}. Will update/create manifest.`);
    }

    let oldManifest: ManifestEntry | null = null;
    try {
      oldManifest = await getManifestEntry(repo);
      if (oldManifest && oldManifest.manifestVersion !== CURRENT_MANIFEST_VERSION) {
        if (LOG_WARN) console.warn(`${prefix} [ensureManifestForDropdownRepos] Manifest version mismatch for ${repo}: found ${oldManifest.manifestVersion}, expected ${CURRENT_MANIFEST_VERSION}. Will re-create.`);
        oldManifest = null; // Force re-creation
      }
    } catch (e) {
      if (LOG_WARN) console.warn(`${prefix} [ensureManifestForDropdownRepos] Error fetching existing manifest for ${repo}, will create anew if possible.`, e);
    }

    try {
      const { siblings, task } = await fetchRepoFiles(repo);
      if (!siblings || siblings.length === 0) {
        if (LOG_WARN) console.warn(`${prefix} [ensureManifestForDropdownRepos] No files (siblings) found for repo: ${repo}. Skipping manifest update for this repo.`);
        skippedRepos.push(repo);
        continue;
      }

      const allFileNamesInRepo = new Set(siblings.map(f => f.rfilename));
      if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] All files in repo ${repo}:`, allFileNamesInRepo);

      const quantMap: Record<string, any> = {};

      for (const file of siblings) {
        if (file.rfilename && file.rfilename.endsWith('.onnx')) {
          const quantKey = file.rfilename; 
          if (!allFileNamesInRepo.has(quantKey)) {
            if (LOG_WARN) console.warn(`${prefix} [ensureManifestForDropdownRepos] Quant model file missing for quantKey: ${quantKey} in repo ${repo}. Skipping this quant.`);
            continue;
          }
          if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] Found quant file (quantKey): ${quantKey} in repo ${repo}`);

          const currentQuantRequiredFiles = new Set<string>();
          currentQuantRequiredFiles.add(quantKey); 

          const quantDir = quantKey.includes('/') ? quantKey.substring(0, quantKey.lastIndexOf('/')) : '';

          // Add all subfolder files matching the pattern
          for (const sibling of siblings) {
            if (sibling.rfilename === quantKey) continue;
            if (SUPPORTING_FILE_REGEX.test(sibling.rfilename) && quantDir && sibling.rfilename.startsWith(quantDir + '/')) {
              currentQuantRequiredFiles.add(sibling.rfilename);
            }
          }

          // Add root-level files matching the pattern only if not already present
          for (const sibling of siblings) {
            if (sibling.rfilename === quantKey) continue;
            if (SUPPORTING_FILE_REGEX.test(sibling.rfilename) && !sibling.rfilename.includes('/')) {
              const fileName = sibling.rfilename;
              if (quantDir) {
                const subfolderVersion = `${quantDir}/${fileName}`;
                if (!currentQuantRequiredFiles.has(subfolderVersion)) {
                  currentQuantRequiredFiles.add(fileName);
                }
              } else {
                currentQuantRequiredFiles.add(fileName);
              }
            }
          }

          // Determine serverOnly status based on quant type and associated data file
          let isServerOnly = false;
          const serverOnlySizeLimit = getServerOnlySizeLimit();
          const bypassModels = getBypassSizeLimitModels();
          
          if (LOG_MANIFEST_GENERATION) {
            console.log(`${prefix} [ensureManifestForDropdownRepos] Processing ${quantKey} for ${repo}:`);
            console.log(`${prefix} [ensureManifestForDropdownRepos] Size limit: ${serverOnlySizeLimit / (1024*1024*1024)} GB`);
            console.log(`${prefix} [ensureManifestForDropdownRepos] Bypass models:`, Array.from(bypassModels));
            console.log(`${prefix} [ensureManifestForDropdownRepos] Required files for ${quantKey}:`, Array.from(currentQuantRequiredFiles));
          }
          
          if (quantKey.endsWith('.onnx')) {
            // For any .onnx, check for .onnx_data or .onnx.data file of the same quant family
            const baseName = quantKey.replace(/\.onnx$/, '');
            const dataFile = siblings.find(f => f.rfilename === `${baseName}.onnx_data` || f.rfilename === `${baseName}.onnx.data`);
            if (dataFile && typeof dataFile.size === 'number') {
              const dataFileSizeGB = dataFile.size / (1024 * 1024 * 1024);
              const limitGB = serverOnlySizeLimit / (1024 * 1024 * 1024);
              const isOverLimit = dataFile.size > serverOnlySizeLimit;
              
              if (LOG_MANIFEST_GENERATION) {
                console.log(`${prefix} [ensureManifestForDropdownRepos] ${quantKey} size check:`);
                console.log(`${prefix} [ensureManifestForDropdownRepos] - Data file: ${dataFile.rfilename}`);
                console.log(`${prefix} [ensureManifestForDropdownRepos] - Data file size: ${dataFile.size} bytes (${dataFileSizeGB.toFixed(2)} GB)`);
                console.log(`${prefix} [ensureManifestForDropdownRepos] - Size limit: ${serverOnlySizeLimit} bytes (${limitGB.toFixed(2)} GB)`);
                console.log(`${prefix} [ensureManifestForDropdownRepos] - Is over limit: ${isOverLimit}`);
                console.log(`${prefix} [ensureManifestForDropdownRepos] - Is in bypass: ${bypassModels.has(repo)}`);
              }
              
              if (isOverLimit) {
                // Check if this model is in the bypass list
                if (!bypassModels.has(repo)) {
                  isServerOnly = true;
                  if (LOG_MANIFEST_GENERATION) {
                    console.log(`${prefix} [ensureManifestForDropdownRepos] - Setting server_only=true (over limit and not bypassed)`);
                  }
                } else {
                  if (LOG_MANIFEST_GENERATION) {
                    console.log(`${prefix} [ensureManifestForDropdownRepos] - NOT setting server_only (over limit but bypassed)`);
                  }
                }
              } else {
                if (LOG_MANIFEST_GENERATION) {
                  console.log(`${prefix} [ensureManifestForDropdownRepos] - NOT setting server_only (under limit)`);
                }
              }
            }
          }
          
          const oldStatus = oldManifest?.quants[quantKey]?.status;
          const status = isServerOnly ? QuantStatus.ServerOnly : QuantStatus.Available;
          
          if (LOG_MANIFEST_GENERATION) {
            console.log(`${prefix} [ensureManifestForDropdownRepos] Status calculation for ${quantKey}:`);
            console.log(`${prefix} [ensureManifestForDropdownRepos] - isServerOnly: ${isServerOnly}`);
            console.log(`${prefix} [ensureManifestForDropdownRepos] - oldStatus: ${oldStatus}`);
            console.log(`${prefix} [ensureManifestForDropdownRepos] - final status: ${status}`);
          }
          // Build fileSizes info
          const fileSizes: Record<string, number> = {};
          for (const fname of currentQuantRequiredFiles) {
            let size: number | undefined = undefined;
            const entry = siblings.find(f => f.rfilename === fname);
            if (entry && typeof entry.size === 'number' && entry.size > 0) {
              size = entry.size;
            }
            if (typeof size === 'number' && size > 0) {
              fileSizes[fname] = size;
            }
          }
          // Check if external data file exists for this quant
          const hasExternalData = allFileNamesInRepo.has(`${quantKey}_data`);
          console.log(`[ensureManifestForDropdownRepos] ${quantKey} hasExternalData: ${hasExternalData}`);
          
          quantMap[quantKey] = {
            files: Array.from(currentQuantRequiredFiles).sort(),
            status,
            fileSizes,
            dtype: extractCleanDtypeFromPath(quantKey),
            hasExternalData
          };
          if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] For quantKey ${quantKey}, required files:`, quantMap[quantKey].files, `Status: ${status}`, `fileSizes:`, fileSizes);
        }
      }

      if (Object.keys(quantMap).length === 0) {
        if (LOG_WARN) console.warn(`${prefix} [ensureManifestForDropdownRepos] No .onnx models found for repo ${repo}. Skipping manifest creation/update for this repo.`);
        skippedRepos.push(repo);
        continue; 
      }

      const newManifestEntry: ManifestEntry = { 
        repo, 
        quants: quantMap, 
        task,
        manifestVersion: CURRENT_MANIFEST_VERSION 
      };
      await addManifestEntry(repo, newManifestEntry);
      processedRepos.push(repo);
      if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] Successfully created/updated manifest for repo: ${repo}`, newManifestEntry);

    } catch (e) {
      if (LOG_ERROR) console.error(`${prefix} [ensureManifestForDropdownRepos] Failed to fetch repo files or process manifest for repo: ${repo}`, e);
      errorRepos.push(repo);
    }
  }
  if (LOG_MANIFEST_GENERATION) {
    console.log(`${prefix} [ensureManifestForDropdownRepos] Finished processing all dropdown repos.`);
    console.log(`${prefix} [ensureManifestForDropdownRepos] Processed repos:`, processedRepos);
    if (skippedRepos.length > 0) console.warn(`${prefix} [ensureManifestForDropdownRepos] Skipped repos (no models or missing files):`, skippedRepos);
    if (errorRepos.length > 0) console.error(`${prefix} [ensureManifestForDropdownRepos] Repos with errors:`, errorRepos);
  }

  document.dispatchEvent(new CustomEvent(WorkerEventNames.MANIFEST_UPDATED));
}

// Listen for manifest refresh requests from settings
document.addEventListener('MANIFEST_REFRESH_REQUESTED', async () => {
  if (LOG_GENERAL) console.log('[Sidepanel] Manifest refresh requested from settings');
  try {
    // Always rebuild all manifests when settings change to apply new bypass settings
    await ensureManifestForDropdownRepos(true); // Pass true to force rebuild
    if (LOG_GENERAL) console.log('[Sidepanel] Manifest refreshed successfully');
    
    // Dispatch MANIFEST_UPDATED event AFTER the manifest update is complete
    document.dispatchEvent(new CustomEvent(WorkerEventNames.MANIFEST_UPDATED));
  } catch (e) {
    console.error('[Sidepanel] Error refreshing manifest:', e);
  }
});