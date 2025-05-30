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
  getCurrentlySelectedModel,
  normalizeQuant,
} from './Home/uiController';
import { getActiveTab, showError as utilShowError, debounce } from './Utilities/generalUtils';
import { showNotification } from './notifications';
import { DbGetSessionRequest, DbAddLogRequest ,   DbInitializationCompleteNotification } from './DB/dbEvents';
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

const prefix = '[Sidepanel]';

let modelWorker: Worker | null = null;
let currentModelIdInWorker: string | null = null;
let modelWorkerState: string = WorkerEventNames.UNINITIALIZED;
let isModelWorkerEnvReady: boolean = false;

// Track the currently loaded model and quant (onnx variant)
let currentLoadedModel: { modelId: string | null, onnxFile: string | null } = { modelId: null, onnxFile: null };

function syncToggleLoadButton() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;
  if (!modelDropdown || !quantDropdown || !loadBtn) return;
  const selectedModelId = modelDropdown.value;
  const selectedQuant = quantDropdown.value;
  if (
    selectedModelId === currentLoadedModel.modelId &&
    selectedQuant === currentLoadedModel.onnxFile &&
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
    console.error(`${prefix} Error setting EXTENSION_CONTEXT:`, e);
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
          console.error(`${prefix} hljs error:`, e);
        }
      } else if (window.hljs) {
        try {
          return window.hljs.highlightAuto(code).value;
        } catch (e) {
          console.error(`${prefix} hljs auto error:`, e);
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
  console.log(`${prefix} Marked globally configured to use highlight.`);
} else {
  console.error(`${prefix} Marked library (window.marked) not found.`);
}


function isDbRequest(type: string) {
  return typeof type === 'string' && type.endsWith('_REQUEST');
}

function isDbLocalContext() {
  return typeof forwardDbRequest === 'function';
}

async function sendDbRequestSmart(request: any) {
  console.log(`${prefix} sendDbRequestSmart called`, { request });
  let response;
  if (isDbLocalContext()) {
    response = await forwardDbRequest(request);
    console.log(`${prefix} sendDbRequestSmart got local response`, { response });
  } else {
    response = await browser.runtime.sendMessage(request);
    console.log(`${prefix} sendDbRequestSmart got remote response`, { response });
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

function handleModelWorkerMessage(event: MessageEvent) {
  const { type, payload } = event.data;
 // console.log(`${prefix} Message from model worker: Type: ${type}`, payload);

  // For use in WORKER_READY case
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;

  switch (type) {
      case WorkerEventNames.WORKER_SCRIPT_READY:
          modelWorkerState = WorkerEventNames.WORKER_SCRIPT_READY;
          console.log(`${prefix} Model worker script is ready. 'init' message should have been sent.`);
          break;
      case WorkerEventNames.WORKER_ENV_READY:
          isModelWorkerEnvReady = true;
          console.log(`${prefix} Model worker environment is ready.`);
          break;
      case WorkerEventNames.LOADING_STATUS:
          modelWorkerState = WorkerEventNames.LOADING_MODEL;
          console.log(`${prefix} Worker loading status:`, payload);
          break;
      case WorkerEventNames.WORKER_READY:
          modelWorkerState = WorkerEventNames.MODEL_READY;
          currentModelIdInWorker = payload.modelId;
          currentLoadedModel = {
            modelId: payload.modelId,
            onnxFile: payload.onnxFile || (quantDropdown ? quantDropdown.value : null)
          };
          syncToggleLoadButton();
          if (loadBtn) loadBtn.style.display = 'none';
          showDeviceBadge(payload.executionProvider, payload.providerNote);
          if (payload.providerNote) {
            utilShowError(payload.providerNote);
          }
          if (payload.fallback) {
            let msg = `Requested quantization '${payload.requestedQuant}' not available. Loaded with '${payload.onnxFile}' instead.`;
            utilShowError(msg);
          } else {
            console.log(`${prefix} Model ${payload.modelId} loaded successfully!`);
          }
          console.log(`${prefix} Model worker is ready with model: ${payload.modelId}, quant: ${payload.onnxFile}, fallback: ${payload.fallback}, executionProvider: ${payload.executionProvider}, providerNote: ${payload.providerNote}`);
          break;
      case WorkerEventNames.ERROR:
          modelWorkerState = WorkerEventNames.ERROR;
          isModelWorkerEnvReady = false;
          hideDeviceBadge();
          console.error(`${prefix} Model worker reported an error:`, payload);
          utilShowError(`Worker Error: ${payload}`);
          currentModelIdInWorker = null; 
          break;
      case WorkerEventNames.RESET_COMPLETE:
          modelWorkerState = WorkerEventNames.UNINITIALIZED;
          isModelWorkerEnvReady = false;
          currentModelIdInWorker = null;
          hideDeviceBadge();
          console.log(`${prefix} Model worker reset complete.`);
          break;
      case UIEventNames.MODEL_WORKER_LOADING_PROGRESS:
          document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_WORKER_LOADING_PROGRESS, { detail: payload }));
          break;
      case WorkerEventNames.GENERATION_COMPLETE: {
          console.log(`${prefix} GENERATION_COMPLETE payload:`, payload);
          let aiReply = '';
          if (Array.isArray(payload.text)) {
              const assistantMsg = payload.text.find((m: any) => m.role === 'assistant');
              aiReply = assistantMsg ? assistantMsg.content : JSON.stringify(payload.text);
          } else if (typeof payload.text === 'string') {
              aiReply = payload.text;
          } else {
              aiReply = JSON.stringify(payload.text);
          }
          document.dispatchEvent(new CustomEvent(UIEventNames.BACKGROUND_RESPONSE_RECEIVED, {
              detail: {
                  chatId: payload.chatId,
                  messageId: payload.messageId,
                  text: aiReply
              }
          }));
          break;
      }
      case WorkerEventNames.GENERATION_ERROR:
          document.dispatchEvent(new CustomEvent(UIEventNames.BACKGROUND_ERROR_RECEIVED, {
              detail: {
                  chatId: payload.chatId,
                  messageId: payload.messageId,
                  error: payload.error
              }
          }));
          break;
      default:
          console.warn(`${prefix} Unhandled message type from model worker: ${type}`, payload);
  }
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
  if (modelWorker) {
      modelWorker.terminate();
      modelWorker = null;
  }
}

function initializeModelWorker() {
  if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR && modelWorkerState !== WorkerEventNames.UNINITIALIZED) {
      console.log(`${prefix} Model worker already exists and is not in an error/uninitialized state. State: ${modelWorkerState}`);
      return; 
  }

  if (modelWorker) { 
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
  }

    if (modelWorker && modelWorkerState !== WorkerEventNames.ERROR) {
      const extensionBaseUrl = browser.runtime.getURL('');
      modelWorker.postMessage({ type: WorkerEventNames.SET_BASE_URL, baseUrl: extensionBaseUrl });
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
  hideDeviceBadge();
  console.log(`${prefix} Model worker terminated. Chat input would be disabled.`);
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
      console.error(`${prefix} Error posting message to model worker:`, error, message);
      utilShowError(`Error communicating with model worker: ${(error as Error).message}`);
  }
}

function sendUiEvent(type: string, payload: any) {
  browser.runtime.sendMessage({ type, payload });
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


    if (msgSenderId && msgSenderId.startsWith('sidepanel-') && msgSenderId !== senderId) {
        console.log(`${prefix} Message from another sidepanel context, ignoring`, { msgSenderId, senderId });
        return;
    }

    if ([
        WorkerEventNames.WORKER_SCRIPT_READY, WorkerEventNames.WORKER_READY,
        WorkerEventNames.LOADING_STATUS, WorkerEventNames.ERROR, WorkerEventNames.RESET_COMPLETE
    ].includes(type)) {
        return;
    }

    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        console.log(`${prefix} llmChannel: Received SEND_CHAT_MESSAGE, forwarding to model worker.`);
        sendToModelWorker({ type: 'generate', payload });
    } else if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        console.log(`${prefix} llmChannel: Received INTERRUPT_GENERATION, forwarding to model worker.`);
        sendToModelWorker({ type: 'interrupt', payload });
    } else if (type === RuntimeMessageTypes.RESET_WORKER) {
        console.log(`${prefix} llmChannel: Received RESET_WORKER. Terminating worker.`);
        terminateModelWorker();
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
        const onnxToLoad = payload.onnxFile; 
        if (modelToLoad && onnxToLoad && onnxToLoad !== 'all') {
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

    console.log(`${prefix} onmessage END`, { type, requestId, payload, msgSenderId, timestamp: Date.now() });
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
    console.warn(`${prefix} Received unknown message type from background:`, type, message);
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
      console.warn(`${prefix} No messages found in session data for new session ${newSessionId}.`, sessionData);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`${prefix} Failed to fetch messages for new session ${newSessionId}:`, err);
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
    console.error(`${prefix} Error during detach:`, err);
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
      console.error(`${prefix} CRITICAL: #page-log-viewer element not found!`);
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
      console.error(`${prefix} Failed to load or initialize LogViewerController:`, error);
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
      console.error(`${prefix} CRITICAL: chatBody is null before initializeRenderer!`);
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


    document.addEventListener(UIEventNames.REQUEST_MODEL_EXECUTION, async () => {
      const { modelId, onnxFile } = getCurrentlySelectedModel();
      if (!modelId) {
          utilShowError('No model selected.');
          return;
      }
      if (modelWorker && (currentModelIdInWorker !== modelId || modelWorkerState === WorkerEventNames.ERROR)) {
          console.log(`${prefix} Terminating current worker before loading new model. Current: ${currentModelIdInWorker}, New: ${modelId}, State: ${modelWorkerState}`);
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
        console.log(`${prefix} Waiting for model worker environment to be ready...`);
        const start = Date.now();
        while (!isModelWorkerEnvReady) {
          if (Date.now() - start > timeoutMs) {
            throw new Error("Timed out waiting for model worker environment to be ready.");
          }
          await new Promise(res => setTimeout(res, 50));
        }
        console.log(`${prefix} Model worker environment is now ready. Proceeding to load model.`);
      };
      try {
        await waitForEnvReady();
      } catch (e) {
        const err = e as Error;
        utilShowError(err.message || "Model worker failed to initialize.");
        return;
      }
      // Normalize quantization value before sending INIT
      const quant = normalizeQuant(onnxFile || '');
      console.log(`${prefix} UI would show: Initializing worker for ${modelId} with quant: ${quant}...`);
      modelWorkerState = WorkerEventNames.LOADING_MODEL;
      currentModelIdInWorker = modelId;
      modelWorker.postMessage({
          type: WorkerEventNames.INIT,
          payload: { modelId, onnxFile: quant }
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

    const dbInitSuccess = await initializeDatabase();
    if (!dbInitSuccess) return;

    console.log(`${prefix} Initialization complete.`);

    // Add listeners to dropdowns to toggle load button
    const modelDropdownEl = document.getElementById('model-selector');
    const quantDropdownEl = document.getElementById('onnx-variant-selector');
    if (modelDropdownEl) {
      modelDropdownEl.addEventListener('change', () => {
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

});


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
export { sendDbRequestSmart, sendToModelWorker };