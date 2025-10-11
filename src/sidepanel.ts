// --- Imports ---
import './DB/db';
import browser from 'webextension-polyfill';
import { initializeNavigation } from './navigation';
import {
  initializeRenderer,
  setActiveSessionId as setRendererSessionId,
 
} from './Home/chatRenderer';
import { initializeOrchestrator } from './Home/messageOrchestrator';
// Old file handler imports removed - now using UnifiedAttachmentController
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
import { initializeIntegrationsController } from './Controllers/IntegrationsController';
import { initializeConnectorsController } from './Controllers/ConnectorsController';
import { initializeDriveController } from './Controllers/DriveController';
import { initializeUnifiedAttachmentController } from './Controllers/UnifiedAttachmentController';
import { HuggingFaceLoginDialog } from './Components/HuggingFaceLoginDialog';
import { initializeFooter } from './Components/FooterComponent';
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
import attachIcon from './assets/icons/attach.svg';
import closeCircleIcon from './assets/icons/close.svg';
import homeIcon from './assets/icons/home.svg';
import rocketIcon from './assets/icons/rocket.svg';
import myspaceIcon from './assets/icons/myspace.svg';
import libraryIcon from './assets/icons/library.svg';
import integrationsIcon from './assets/icons/Integration.png';
import connectorsIcon from './assets/icons/Connectors.png';
import browserIcon from './assets/icons/Browser.png';
import localServerIcon from './assets/icons/LocalServer.png';
import cloudServerIcon from './assets/icons/CloudServer.png';
import settingsIcon from './assets/icons/settings.svg';

// --- Constants ---
const LOG_QUEUE_MAX = 1000;

// Core logging flags
const LOG_ERROR = true;   // Critical errors (always enabled)
const LOG_WARN = false;   // Warnings and fallbacks
const LOG_GENERAL = false;  // App lifecycle (startup, page navigation)
const LOG_DEBUG = false;  // Detailed internal state (for deep debugging)

// Feature-specific logging - Enable individually to debug specific subsystems
const LOG_MANIFEST_GENERATION = false;  // Manifest creation → Enable to debug model manifest issues
const LOG_INFERENCE_SETTINGS = false;   // Settings loading → Enable to debug AI parameter issues
const LOG_WORKER_READY = true;  // Track WORKER_READY event and currentLoadedModel updates
const senderId = 'sidepanel-' + Math.random().toString(36).slice(2) + '-' + Date.now();

// --- Global State ---
let activeSessionId: string | null = null;
let isPopup: boolean = false;
let originalTabIdFromPopup: string | null = null;
let currentTabId: number | null = null;
let isDbReady: boolean = false;
let historyPopupController: any = null;
let logQueue: any[] = [];
let detachedOverlay: HTMLElement | null = null;

const prefix = '[Sidepanel]';

// Show overlay when chat is moved to popup
function showDetachedOverlay() {
  if (detachedOverlay) return; // Already shown
  
  detachedOverlay = document.createElement('div');
  detachedOverlay.id = 'detached-overlay';
  detachedOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(243, 244, 246, 0.98);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;
  
  detachedOverlay.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.7;">📤</div>
      <h2 style="margin: 0 0 0.75rem 0; font-size: 1.5rem; font-weight: 600; color: #1f2937;">Chat Moved to Popup</h2>
      <p style="margin: 0; color: #6b7280; font-size: 1rem; max-width: 320px; line-height: 1.5;">
        Your chat is now in a separate popup window.<br>
        You can close this side panel if you'd like.
      </p>
    </div>
  `;
  
  document.body.appendChild(detachedOverlay);
  if (LOG_DEBUG) console.log(`${prefix} Detached overlay shown`);
}

// Hide overlay when popup closes and restore full UI
function hideDetachedOverlay() {
  if (detachedOverlay && detachedOverlay.parentNode) {
    detachedOverlay.parentNode.removeChild(detachedOverlay);
    detachedOverlay = null;
    if (LOG_DEBUG) console.log(`${prefix} Detached overlay removed`);
  }
}

// Throttling for high-frequency debug logs
let sidepanelLogCount = 0;
const SIDEPANEL_LOG_THROTTLE_INTERVAL = 5; // Log every 5 operations

let currentModelIdInManager: string | null = null;
let modelManagerState: string = WorkerEventNames.UNINITIALIZED;
let isModelManagerEnvReady: boolean = false;
let isGenerating = false;

// Track the currently loaded model and quant (onnx variant)
let currentLoadedModel: { modelId: string | null, quant: string | null } = { modelId: null, quant: null };

// Define getModelSelectorOptions locally if not exported
function getModelSelectorOptions(): string[] {
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
  if (!modelSelector) return [];
  return Array.from(modelSelector.options).map(opt => opt.value).filter(Boolean);
}


(function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const contextParam = urlParams.get('context');
    const viewParam = urlParams.get('view');
    window.EXTENSION_CONTEXT =
      contextParam === 'popup'
        ? Contexts.MAIN_UI_POPUP
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
  if (LOG_DEBUG) console.log(`${prefix} updateSendButtonForGeneration called with isGenerating:`, isGenerating);
  updateGenerationState(isGenerating);
}

function handleStopGeneration() {
  if (LOG_DEBUG) console.log(`${prefix} handleStopGeneration called. isGenerating: ${isGenerating}`);
  if (isGenerating) {
    if (LOG_DEBUG) console.log(`${prefix} Sending stop generation request to background.`);
    sendToModelManager({ type: WorkerEventNames.STOP_GENERATION });
  } else {
    if (LOG_DEBUG) console.log(`${prefix} Cannot send stop request - not generating`);
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

async function handleModelManagerMessage(event: MessageEvent) {
  const { type, label, payload } = event.data || {};
  // console.log(`${prefix} Message from background: Type: ${type}`, payload);

  // For use in WORKER_READY case

  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;

  switch (type) {
      case WorkerEventNames.WORKER_SCRIPT_READY:
          modelManagerState = WorkerEventNames.WORKER_SCRIPT_READY;
          if (LOG_DEBUG) console.log(`${prefix} Background script is ready.`);
          break;
      case WorkerEventNames.WORKER_ENV_READY:
          isModelManagerEnvReady = true;
          if (LOG_DEBUG) console.log(`${prefix} Background environment is ready.`);
          break;
      case WorkerEventNames.LOADING_STATUS:
          modelManagerState = WorkerEventNames.LOADING_MODEL;
          if (LOG_DEBUG) console.log(`${prefix} Background loading status:`, payload);
          break;
      case WorkerEventNames.WORKER_READY: {
          const { modelId, dtype, task, fallback, executionProvider, warning } = payload;
          
          if (LOG_WORKER_READY) {
            const workerReadyInfo = `📋 [WORKER_READY] Model load complete:
      modelId: ${modelId}
      dtype: ${dtype}
      executionProvider: ${executionProvider}`;
            console.log(prefix, workerReadyInfo);
          }
          
          // Update local state immediately
          currentLoadedModel = { modelId, quant: dtype };
          currentModelIdInManager = modelId;
          modelManagerState = WorkerEventNames.MODEL_READY;
          
          // Button visibility handled by syncUIWithLoadedModel
          showDeviceBadge(executionProvider, warning);
          
          // Sync UI with loaded model (dropdowns + button)
          await syncUIWithLoadedModel();
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
          if (LOG_DEBUG) console.log(`${prefix} Background is ready with model: ${modelId}, quant: ${dtype}, fallback: ${fallback}, executionProvider: ${executionProvider}, warning: ${warning}`);
          
          // Hide progress bar now that loading is complete (just before showing success notification)
          const statusDiv = document.getElementById('model-load-status');
          if (statusDiv) statusDiv.style.display = 'none';
          
          // Show success notification
          const modelDisplayName = modelId.split('/').pop() || modelId;
          showNotification(`✅ Model ready! ${modelDisplayName} (${dtype}) loaded successfully on ${executionProvider}`, 'success', 4000);
          break;
      }
      case WorkerEventNames.ERROR: {
          modelManagerState = WorkerEventNames.ERROR;
          isModelManagerEnvReady = false;
          hideDeviceBadge();
          if (LOG_ERROR) console.error(`${prefix} Background reported an error:`, payload);
          utilShowError(`Background Error: ${payload}`);
          currentModelIdInManager = null;
          
          // Hide progress bar on error
          const statusDiv = document.getElementById('model-load-status');
          if (statusDiv) statusDiv.style.display = 'none';
          break;
      }
      case WorkerEventNames.RESET_COMPLETE:
          modelManagerState = WorkerEventNames.UNINITIALIZED;
          isModelManagerEnvReady = false;
          currentModelIdInManager = null;
          hideDeviceBadge();
          if (LOG_DEBUG) console.log(`${prefix} Background model reset complete.`);
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
      case WorkerEventNames.RESTORE_FROM_POPUP: {
          // Popup closed, remove overlay and restore full UI
          if (LOG_DEBUG) console.log(`${prefix} RESTORE_FROM_POPUP received`);
          hideDetachedOverlay();
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
          // Button visibility handled by user dropdown changes only
          break;
      case WorkerEventNames.REQUEST_MEMORY_STATS:
        if (performance && (performance as any).memory) {
          const mem = (performance as any).memory;
          browser.runtime.sendMessage({
            type: WorkerEventNames.MEMORY_STATS,
            payload: {
              usedJSHeapSize: mem.usedJSHeapSize,
              totalJSHeapSize: mem.totalJSHeapSize,
              jsHeapSizeLimit: mem.jsHeapSizeLimit
            }
          }).catch((error: any) => {
            if (LOG_ERROR) console.error(`${prefix} Failed to send memory stats:`, error);
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
      case WorkerEventNames.CACHE_CLEARED:
          // Cache cleared successfully - no action needed
          if (LOG_DEBUG) console.log(prefix, 'Model cache cleared successfully');
          break;
      default:
          if (LOG_WARN) console.warn(`${prefix} Unhandled message type from background: ${type}`, payload);
  }
}



async function initializeModelManager() {
  if (isModelManagerEnvReady) {
      if (LOG_DEBUG) console.log(`${prefix} Background model manager already ready.`);
      return; 
  }

  if (LOG_DEBUG) console.log(`${prefix} Checking if background is ready...`);
  try {
      const response = await browser.runtime.sendMessage({ 
        type: RuntimeMessageTypes.CHECK_BACKGROUND_READY 
      });
      
      if (response?.ready) {
        isModelManagerEnvReady = true;
        if (LOG_DEBUG) console.log(`${prefix} Background model manager is ready.`);
      } else {
        if (LOG_WARN) console.warn(`${prefix} Background not ready yet, will retry...`);
      }
  } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Failed to check background readiness:`, error);
      throw error;
  }
}

async function terminateModelManager() {
  if (LOG_DEBUG) console.log(`${prefix} Sending reset request to background...`);
  try {
    await browser.runtime.sendMessage({ 
      type: WorkerEventNames.RESET 
    });
    
    // Reset local state
    currentModelIdInManager = null;
    modelManagerState = WorkerEventNames.UNINITIALIZED;
    hideDeviceBadge();
    if (LOG_DEBUG) console.log(`${prefix} Model reset complete. Chat input would be disabled.`);
  } catch (error) {
    if (LOG_ERROR) console.error(`${prefix} Failed to reset model in background:`, error);
    // Reset local state anyway
    currentModelIdInManager = null;
    modelManagerState = WorkerEventNames.UNINITIALIZED;
    hideDeviceBadge();
  }
}

function sendToModelManager(message: any) {
  if (LOG_DEBUG) console.log(`${prefix} Sending message to background:`, message.type);
  try {
      browser.runtime.sendMessage(message).catch((error: any) => {
        if (LOG_ERROR) console.error(`${prefix} Error sending message to background:`, error, message);
        utilShowError(`Error communicating with background: ${error.message}`);
      });
  } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Error sending message to background:`, error, message);
      utilShowError(`Error communicating with background: ${(error as Error).message}`);
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
    
    // Also save to persistent state for background restoration
    try {
      await browser.runtime.sendMessage({
        type: 'saveLastChatSession',
        payload: { sessionId: newSessionId }
      });
      if (LOG_DEBUG) console.log(`${prefix} 💾 Saved session to persistent state: ${newSessionId}`);
    } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Failed to save session to persistent state:`, error);
    }
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

    // Handle ping from background - respond with pong
    if (type === WorkerEventNames.UI_PING) {
      if (LOG_DEBUG) console.log(`${prefix} 🏓 Received ping from background - sending pong`);
      llmChannel.postMessage({
        type: WorkerEventNames.UI_PONG,
        payload: { senderId, timestamp: Date.now() },
        senderId,
        timestamp: Date.now()
      });
      return;
    }

    if ([
        WorkerEventNames.WORKER_SCRIPT_READY, WorkerEventNames.WORKER_READY,
        WorkerEventNames.LOADING_STATUS, WorkerEventNames.ERROR, WorkerEventNames.RESET_COMPLETE
    ].includes(type)) {
        return;
    }

    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received SEND_CHAT_MESSAGE, forwarding to background.`);
        sendToModelManager({ type: 'generate', payload });
    } else if (type === RuntimeMessageTypes.INTERRUPT_GENERATION) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received INTERRUPT_GENERATION, forwarding to background.`);
        sendToModelManager({ type: 'interrupt', payload });
    } else if (type === RuntimeMessageTypes.RESET_WORKER) {
        if (LOG_DEBUG) console.log(`${prefix} llmChannel: Received RESET_WORKER. Resetting model in background.`);
        terminateModelManager();
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
            payload: { state: modelManagerState, modelId: currentModelIdInManager },
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
  
  // Messages from background - redirect to handleModelManagerMessage
  if (Object.values(WorkerEventNames).includes(type) || 
      type === UIEventNames.MODEL_WORKER_LOADING_PROGRESS ||
      type === UIEventNames.SHOW_GOOGLE_TERMS_DIALOG ||
      type === UIEventNames.SHOW_MODEL_SOURCE_DIALOG ||
      type === UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG ||
      type === UIEventNames.SHOW_KAGGLE_LOGIN_DIALOG ||
      type === UIEventNames.SHOW_GOOGLE_LOGIN_DIALOG) {
    // Convert message to event format and redirect
    handleModelManagerMessage({ data: message } as MessageEvent);
    return;
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
    type === InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST
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
  
  // Clear model cache for new chat session to prevent cross-chat contamination
  if (LOG_DEBUG) console.log(prefix, 'Sending CLEAR_CACHE message to background');
  sendToModelManager({ type: WorkerEventNames.CLEAR_CACHE });
  
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
  
  // Clear model cache for new chat to prevent cross-chat contamination
  if (LOG_DEBUG) console.log(prefix, 'Sending CLEAR_CACHE message to background (New Chat button)');
  sendToModelManager({ type: WorkerEventNames.CLEAR_CACHE });
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
  // In popup: Close popup and restore to sidepanel
  if (isPopup && originalTabIdFromPopup) {
    try {
      // Close this popup window
      window.close();
    } catch (error) {
      if (LOG_ERROR) console.error(`${prefix} Error closing popup:`, error);
      utilShowError('Error closing popup window');
    }
    return;
  }
  
  // In sidepanel: Move to popup
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
      // Popup already exists, just focus it
      await browser.windows.update(response.popupId, { focused: true });
      // Show detached overlay
      showDetachedOverlay();
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
      
      // Show detached overlay in sidepanel
      showDetachedOverlay();
    } else {
      throw new Error('Failed to create popup window.');
    }
  } catch (error) {
    const err = error as Error;
    if (LOG_ERROR) console.error(`${prefix} Error during detach:`, err);
    utilShowError(`Error detaching chat: ${err.message}`);
  }
}

// Query background for accurate model loaded state
export async function isModelLoaded(): Promise<boolean> {
  const bgState = await queryBackgroundModelState();
  return bgState.isReady && !!bgState.modelId;
}

export function getCurrentLoadedModel() {
  return currentLoadedModel;
}

/**
 * Sync UI state with background loaded model
 * Queries background, updates dropdowns, and manages button visibility
 * Call this on: init, model load complete, or whenever state needs refresh
 */
export async function syncUIWithLoadedModel(): Promise<void> {
  if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] Starting UI sync...`);
  
  // Query background for actual model state
  const bgModelState = await queryBackgroundModelState();
  
  if (LOG_WORKER_READY) {
    const bgStateInfo = `📋 [syncUIWithLoadedModel] Background state:
      modelId: ${bgModelState.modelId}
      quant: ${bgModelState.quant}
      isReady: ${bgModelState.isReady}
      isLoading: ${bgModelState.isLoading}`;
    console.log(prefix, bgStateInfo);
  }
  
  // Update local state
  if (bgModelState.isReady && bgModelState.modelId) {
    currentLoadedModel = {
      modelId: bgModelState.modelId,
      quant: bgModelState.quant
    };
    currentModelIdInManager = bgModelState.modelId;
    modelManagerState = WorkerEventNames.MODEL_READY;
    
    if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] Updated currentLoadedModel:`, currentLoadedModel);
  } else {
    currentLoadedModel = { modelId: null, quant: null };
    currentModelIdInManager = null;
    
    if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] No model loaded - cleared state`);
  }
  
  // Update dropdowns to match loaded model
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement | null;
  
  if (bgModelState.isReady && bgModelState.modelId) {
    // Set model dropdown
    if (modelSelector && modelSelector.value !== bgModelState.modelId) {
      if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] Setting model dropdown: ${bgModelState.modelId}`);
      modelSelector.value = bgModelState.modelId;
      
      // Rebuild quant dropdown programmatically (don't trigger change event to avoid user listeners)
      const { onModelDropdownChange } = await import('./Home/uiController');
      await onModelDropdownChange();
    }
    
    // Set quant dropdown
    if (quantSelector && bgModelState.quant && quantSelector.value !== bgModelState.quant) {
      if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] Setting quant dropdown: ${bgModelState.quant}`);
      quantSelector.value = bgModelState.quant;
    }
    
    // Hide load button
    if (loadBtn) {
      if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] Hiding load button`);
      loadBtn.style.display = 'none';
    }
  }
  // If no model loaded, keep button hidden (default) - only user dropdown changes will show it
  
  // Trigger final UI update
  document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED));
  
  if (LOG_WORKER_READY) console.log(prefix, `📋 [syncUIWithLoadedModel] ✅ Sync complete`);
}

// Query background for actual loaded model state (for popup initialization)
export async function queryBackgroundModelState(): Promise<{ modelId: string | null, quant: string | null, isReady: boolean, isLoading: boolean }> {
  try {
    const response = await browser.runtime.sendMessage({
      type: RuntimeMessageTypes.GET_MODEL_WORKER_STATE
    });
    if (response?.state === WorkerEventNames.MODEL_READY && response?.modelId) {
      return { 
        modelId: response.modelId, 
        quant: response.dtype || null,
        isReady: true,
        isLoading: false
      };
    }
    if (response?.state === WorkerEventNames.LOADING_MODEL) {
      return { 
        modelId: response.modelId || null, 
        quant: response.dtype || null,
        isReady: false,
        isLoading: true
      };
    }
  } catch (error) {
    if (LOG_ERROR) console.error(`${prefix} Failed to query background model state:`, error);
  }
  return { modelId: null, quant: null, isReady: false, isLoading: false };
}

export function isGenerationActive() {
  return isGenerating;
}

export { sendDbRequestSmart, sendToModelManager };

// Add listener for stop generation event
document.addEventListener('stopGeneration', () => {
  if (LOG_DEBUG) console.log(`${prefix} Received stopGeneration event from UI`);
  handleStopGeneration();
});

// Add listener for generation starting event
document.addEventListener('generationStarting', () => {
  if (LOG_DEBUG) console.log(`${prefix} Received generationStarting event from orchestrator`);
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

    // initializeFileHandling removed - now using UnifiedAttachmentController
    if (LOG_DEBUG) console.log(`${prefix} File handling now managed by UnifiedAttachmentController.`);

    // Old file input handling removed - now using UnifiedAttachmentController

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
      
      // Check if the same model is already loaded (query background for accurate state)
      const bgState = await queryBackgroundModelState();
      const isAlreadyLoaded = bgState.isReady && bgState.modelId === modelId && bgState.quant === dtype;
      
      if (isAlreadyLoaded) {
          if (LOG_DEBUG) console.log(`${prefix} Model ${modelId} (${dtype}) is already loaded in background. Skipping reload.`);
          showNotification(`Model ${modelId} (${dtype}) is already loaded and ready to use!`, 'success', 3000);
          
          // Sync local state with background
          currentLoadedModel.modelId = bgState.modelId;
          currentLoadedModel.quant = bgState.quant;
          currentModelIdInManager = bgState.modelId;
          modelManagerState = WorkerEventNames.MODEL_READY;
          
          // Reset UI loading state since we're not actually loading
          document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_ALREADY_LOADED, { 
              detail: { modelId, dtype, loadId } 
          }));
          return;
      }
      
      // Reset model if switching to different model or if in error state
      // Check background state to determine if reset is needed
      const needsReset = (bgState.modelId && bgState.modelId !== modelId) || modelManagerState === WorkerEventNames.ERROR;
      
      if (needsReset) {
          if (LOG_DEBUG) console.log(`${prefix} Resetting model before loading new one. Current (BG): ${bgState.modelId}, New: ${modelId}, State: ${modelManagerState}`);
          await terminateModelManager();
      }
      
      // Check if background is ready
      try {
        await initializeModelManager();
      } catch (e) {
        const err = e as Error;
        utilShowError(err.message || "Background model manager failed to initialize.");
        return;
      }
      
      const waitForEnvReady = async (timeoutMs = 5000) => {
        if (isModelManagerEnvReady) return;
        if (LOG_DEBUG) console.log(`${prefix} Waiting for background to be ready...`);
        const start = Date.now();
        while (!isModelManagerEnvReady) {
          if (Date.now() - start > timeoutMs) {
            throw new Error("Timed out waiting for background to be ready.");
          }
          await new Promise(res => setTimeout(res, 50));
        }
        if (LOG_DEBUG) console.log(`${prefix} Background is now ready. Proceeding to load model.`);
      };
      try {
        await waitForEnvReady();
      } catch (e) {
        const err = e as Error;
        utilShowError(err.message || "Background model manager failed to initialize.");
        return;
      }
      
      // Get the task from the manifest
      const manifestEntry = await getManifestEntry(modelId);
      const task = manifestEntry && manifestEntry.task ? manifestEntry.task : 'text-generation';

      if (LOG_DEBUG) console.log(`${prefix} Sending model load request to background for ${modelId} with dtype: ${dtype}, task: ${task}...`);
      modelManagerState = WorkerEventNames.LOADING_MODEL;
      currentModelIdInManager = modelId;
      sendToModelManager({
          type: WorkerEventNames.INIT,
          payload: { modelId, dtype, task, loadId }
      });
    });

    // Handle model selection changes (when user changes dropdown)
    document.addEventListener(UIEventNames.MODEL_SELECTION_CHANGED, async (e) => {
      const { modelId, dtype } = (e as CustomEvent).detail || {};
      sidepanelLogCount++;
      if (LOG_DEBUG && (sidepanelLogCount % SIDEPANEL_LOG_THROTTLE_INTERVAL === 0 || sidepanelLogCount === 1)) {
        console.log(`${prefix} [DEBUG] Model selection changed:`, { modelId, dtype, currentLoadedModel }, `(operation #${sidepanelLogCount})`);
      }
      
      // This is just a selection change, not a load request
      // The UI controller will handle updating the dropdown status
      if (modelId && dtype) {
        if (LOG_DEBUG && (sidepanelLogCount % SIDEPANEL_LOG_THROTTLE_INTERVAL === 0 || sidepanelLogCount === 1)) {
          console.log(`${prefix} [DEBUG] Model selection updated to: ${modelId} (${dtype}) (operation #${sidepanelLogCount})`);
          console.log(`${prefix} [DEBUG] Current loaded model:`, currentLoadedModel);
        }
      }
    });

    // Dialog event handlers

    document.addEventListener(UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG, async (e) => {
      const { modelId, modelPath: dtype, task, loadId } = (e as CustomEvent).detail;
      const token = await huggingFaceLoginDialog.show(modelId);
      if (token) {
        // Send login event to background
        sendToModelManager({
          type: WorkerEventNames.HUGGINGFACE_LOGIN,
          payload: { modelId, modelPath: dtype, task, loadId, token }
        });
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

    initializeIntegrationsController();
    if (LOG_DEBUG) console.log(`${prefix} Integrations Controller Initialized.`);

    initializeConnectorsController();
    if (LOG_DEBUG) console.log(`${prefix} Connectors Controller Initialized.`);

    await initializeUnifiedAttachmentController();
    if (LOG_DEBUG) console.log(`${prefix} Unified Attachment Controller Initialized.`);

    initializeDriveController({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification,
      debounce,
    });
    if (LOG_DEBUG) console.log(`${prefix} Drive Controller Initialized.`);

    // Initialize Footer with version info and update checker
    initializeFooter();
    if (LOG_DEBUG) console.log(`${prefix} Footer Component Initialized.`);

    const popupContext = urlParams.get('context');
    originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
    isPopup = popupContext === 'popup';
    if (LOG_DEBUG) console.log(
      `${prefix} Context: ${isPopup ? 'Popup' : 'Sidepanel'}${
        isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''
      }`
    );

    // ========================================
    // PHASE 1: CRITICAL UI ELEMENTS (FAST - Must complete first for visual feedback)
    // ========================================
    
    if (LOG_DEBUG) console.log(`${prefix} Phase 1: Setting up critical UI elements...`);
    
    // Set icon srcs IMMEDIATELY - this prevents broken icon display
    const iconMap = [
      ['icon-new-chat', newChatIcon],
      ['icon-history', historyIcon],
      ['icon-popup', popupIcon],
      ['icon-googledrive', googleDriveIcon],
      ['icon-attach', attachIcon],
      ['icon-close-history', closeCircleIcon],
      ['icon-close-drive-viewer', closeCircleIcon],
      ['icon-close-attachment-popup', closeCircleIcon],
      ['icon-home', homeIcon],
      ['icon-rocket', rocketIcon],
      ['icon-myspace', myspaceIcon],
      ['icon-library', libraryIcon],
      ['icon-integrations', integrationsIcon],
      ['icon-connectors', connectorsIcon],
      ['icon-settings', settingsIcon],
    ];
    for (const [id, src] of iconMap) {
      const el = document.getElementById(id) as HTMLImageElement | null;
      if (el) el.src = src;
    }

    // Set model source toggle icons
    function setModelSourceToggleIcons() {
      const browserBtn = document.querySelector('#source-browser .model-source-icon') as HTMLImageElement;
      const nativeBtn = document.querySelector('#source-native .model-source-icon') as HTMLImageElement;
      const apiBtn = document.querySelector('#source-api .model-source-icon') as HTMLImageElement;
      
      if (browserBtn) {
        browserBtn.src = browserIcon;
        browserBtn.style.display = '';
      }
      if (nativeBtn) {
        nativeBtn.src = localServerIcon;
        nativeBtn.style.display = '';
      }
      if (apiBtn) {
        apiBtn.src = cloudServerIcon;
        apiBtn.style.display = '';
      }
    }
    
    setModelSourceToggleIcons();
    
    // Broadcast UI_CONNECTED early to notify background script
    const contextName = window.EXTENSION_CONTEXT || 'unknown';
    llmChannel.postMessage({
      type: WorkerEventNames.UI_CONNECTED,
      payload: { senderId, context: contextName },
      senderId,
      timestamp: Date.now()
    });
    if (LOG_DEBUG) console.log(`${prefix} Broadcast UI_CONNECTED (context: ${contextName}, senderId: ${senderId})`);

    // Setup model dropdown event listeners
    const modelDropdownEl = document.getElementById('model-selector');
    const quantDropdownEl = document.getElementById('onnx-variant-selector');
    if (modelDropdownEl) {
      modelDropdownEl.addEventListener('change', async () => {
        hideDeviceBadge();
        // Button visibility handled by uiController dropdown listeners
      });
    }
    if (quantDropdownEl) {
      quantDropdownEl.addEventListener('change', () => {
        hideDeviceBadge();
        // Button visibility handled by uiController dropdown listeners
      });
    }
    // Button starts hidden by default in HTML, only shown by user dropdown changes

    if (LOG_DEBUG) console.log(`${prefix} Phase 1 complete - UI elements ready`);
    
    // ========================================
    // PHASE 2: HEAVY OPERATIONS (DEFERRED - Runs after UI renders)
    // ========================================
    
    // Use setTimeout(0) to defer heavy operations until after the current call stack clears
    // This allows the browser to render the UI (icons, etc.) before blocking on heavy work
    setTimeout(async () => {
      try {
        if (LOG_DEBUG) console.log(`${prefix} Phase 2: Starting heavy operations (manifests, DB, model loading)...`);
        
        // Check if we have bypass settings that might affect manifest status
        const hasBypassSettings = getBypassSizeLimitModels().size > 0;
        await ensureManifestForDropdownRepos(hasBypassSettings);
        
        // CRITICAL: Initialize database BEFORE trying to load any sessions
        const dbInitSuccess = await initializeDatabase();
        if (!dbInitSuccess) return;

        // Now safe to load sessions (DB is ready)
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

        // Sync UI with background model state (handles both fresh start and model-in-VRAM scenarios)
        if (LOG_WORKER_READY) console.log(prefix, `📋 [INIT] Syncing UI with background model state...`);
        await syncUIWithLoadedModel();
        
        const bgModelState = await queryBackgroundModelState();
        if (bgModelState.isReady && bgModelState.modelId) {
          // Button visibility handled by syncUIWithLoadedModel
          // Show device badge if model is loaded
          // Note: executionProvider info is not available from query, will be set on next WORKER_READY
          
          // Model is already loaded, but we should still restore the last chat session
          try {
            const restoreResponse = await browser.runtime.sendMessage({
              type: RuntimeMessageTypes.RESTORE_LAST_STATE
            });
            
            if (restoreResponse?.success && restoreResponse.lastChatSession) {
              if (LOG_DEBUG) console.log(`${prefix} Restoring last chat session: ${restoreResponse.lastChatSession}`);
              
              // Verify the session exists before trying to load it
              try {
                const request = new DbGetSessionRequest(restoreResponse.lastChatSession);
                const sessionData = await requestDbAndWait(request);
                
                if (sessionData && (sessionData as any).id) {
                  await loadAndDisplaySession(restoreResponse.lastChatSession);
                  if (LOG_DEBUG) console.log(`${prefix} ✅ Successfully restored last chat session`);
                } else {
                  if (LOG_DEBUG) console.log(`${prefix} Last chat session not found in DB, starting fresh`);
                  await setActiveChatSessionId(null);
                }
              } catch (sessionError) {
                if (LOG_DEBUG) console.log(`${prefix} Failed to load last chat session, starting fresh:`, sessionError);
                await setActiveChatSessionId(null);
              }
            } else {
              if (LOG_DEBUG) console.log(`${prefix} No last chat session to restore`);
            }
          } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Error restoring last chat session:`, error);
          }
        }

        // Try to restore last state if no model is loaded
        else if (!bgModelState.isReady) {
          try {
            if (LOG_DEBUG) console.log(`${prefix} No model loaded, attempting to restore last state...`);
            
            const restoreResponse = await browser.runtime.sendMessage({
              type: RuntimeMessageTypes.RESTORE_LAST_STATE
            });
            
            if (restoreResponse?.success) {
              if (LOG_DEBUG) {
                console.log(`${prefix} State restoration response:`, {
                  modelRestored: restoreResponse.modelRestored,
                  lastModel: restoreResponse.lastModel,
                  lastChatSession: restoreResponse.lastChatSession,
                  currentModel: restoreResponse.currentModel
                });
                console.log(`${prefix} Restoration decision:`, {
                  modelRestored: restoreResponse.modelRestored,
                  currentModelReady: restoreResponse.currentModel?.ready,
                  willRestore: restoreResponse.modelRestored && restoreResponse.currentModel?.ready,
                  willLoadDefault: !(restoreResponse.modelRestored && restoreResponse.currentModel?.ready)
                });
              }
              
              if (restoreResponse.modelRestored && restoreResponse.currentModel?.ready) {
                // Model was successfully restored - update local state
                currentLoadedModel = {
                  modelId: restoreResponse.currentModel.id,
                  quant: restoreResponse.currentModel.dtype
                };
                currentModelIdInManager = restoreResponse.currentModel.id;
                modelManagerState = WorkerEventNames.MODEL_READY;
                // Button visibility handled by syncUIWithLoadedModel
                
                if (LOG_DEBUG) console.log(`${prefix} ✅ Successfully restored model: ${restoreResponse.currentModel.id}`);
                
                // If there's a last chat session, verify it exists before loading
                if (restoreResponse.lastChatSession) {
                  if (LOG_DEBUG) console.log(`${prefix} Restoring last chat session: ${restoreResponse.lastChatSession}`);
                  
                  try {
                    const request = new DbGetSessionRequest(restoreResponse.lastChatSession);
                    const sessionData = await requestDbAndWait(request);
                    
                    if (sessionData && (sessionData as any).id) {
                      await loadAndDisplaySession(restoreResponse.lastChatSession);
                      if (LOG_DEBUG) console.log(`${prefix} ✅ Successfully restored last chat session`);
                    } else {
                      if (LOG_DEBUG) console.log(`${prefix} Last chat session not found in DB, starting fresh`);
                      await setActiveChatSessionId(null);
                    }
                  } catch (sessionError) {
                    if (LOG_DEBUG) console.log(`${prefix} Failed to load last chat session, starting fresh:`, sessionError);
                    await setActiveChatSessionId(null);
                  }
                }
              } else {
                // No model to restore, load default model
                if (LOG_DEBUG) console.log(`${prefix} No model to restore, loading default model...`);
                const { loadDefaultModel } = await import('./Home/uiController');
                const defaultModelLoaded = await loadDefaultModel();
                if (defaultModelLoaded) {
                  if (LOG_DEBUG) console.log(`${prefix} Default model loading initiated.`);
                } else {
                  if (LOG_DEBUG) console.log(`${prefix} Default model loading failed or skipped.`);
                }
              }
            } else {
              if (LOG_ERROR) console.error(`${prefix} State restoration failed:`, restoreResponse?.error);
              
              // Fallback to default model
              const { loadDefaultModel } = await import('./Home/uiController');
              const defaultModelLoaded = await loadDefaultModel();
              if (defaultModelLoaded) {
                if (LOG_DEBUG) console.log(`${prefix} Default model loading initiated.`);
              }
            }
          } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Error during state restoration:`, error);
            
            // Fallback to default model
            try {
              const { loadDefaultModel } = await import('./Home/uiController');
              const defaultModelLoaded = await loadDefaultModel();
              if (defaultModelLoaded) {
                if (LOG_DEBUG) console.log(`${prefix} Default model loading initiated.`);
              }
            } catch (fallbackError) {
              if (LOG_ERROR) console.error(`${prefix} Error loading default model:`, fallbackError);
            }
          }
        } else {
          if (LOG_DEBUG) console.log(`${prefix} Skipping default model load - model already loaded in background`);
        }

        if (LOG_DEBUG) console.log(`${prefix} Phase 2 complete - All initialization finished`);
        
      } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Error in Phase 2 (heavy operations):`, error);
      }
    }, 0); // Defer to next tick to allow UI rendering
    
    if (LOG_DEBUG) console.log(`${prefix} UI initialization complete - heavy operations deferred`);
    if (LOG_DEBUG) console.log(`${prefix} ✅ Connected - background will ping every 2 minutes (senderId: ${senderId})`)

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
          if (LOG_MANIFEST_GENERATION) console.log(`${prefix} [ensureManifestForDropdownRepos] ${quantKey} hasExternalData: ${hasExternalData}`);
          
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

// Handle UI lifecycle for VRAM management
// Broadcast disconnect when window unloads or becomes hidden
window.addEventListener('beforeunload', () => {
  const contextName = window.EXTENSION_CONTEXT || 'unknown';
  llmChannel.postMessage({
    type: WorkerEventNames.UI_DISCONNECTED,
    payload: { senderId, context: contextName },
    senderId,
    timestamp: Date.now()
  });
  if (LOG_DEBUG) console.log(`${prefix} Broadcast UI_DISCONNECTED on beforeunload (context: ${contextName}, senderId: ${senderId})`);
});

// Handle visibility changes for popup/detached windows only
// Sidepanels should never disconnect - they stay open and connected
document.addEventListener('visibilitychange', () => {
  const contextName = window.EXTENSION_CONTEXT || 'unknown';
  
  // MainUI (sidepanel) and MainUIPopup (detached chat) should never disconnect - they're both chat interfaces
  if (contextName === 'MainUI' || contextName === 'MainUIPopup') {
    if (LOG_DEBUG) console.log(`${prefix} Chat UI ignores visibility changes - staying connected (context: ${contextName})`);
    return;
  }
  
  if (document.hidden) {
    llmChannel.postMessage({
      type: WorkerEventNames.UI_DISCONNECTED,
      payload: { senderId, context: contextName },
      senderId,
      timestamp: Date.now()
    });
    if (LOG_DEBUG) console.log(`${prefix} Broadcast UI_DISCONNECTED on visibility hidden (context: ${contextName}, senderId: ${senderId})`);
  } else {
    // Page became visible again - re-register
    llmChannel.postMessage({
      type: WorkerEventNames.UI_CONNECTED,
      payload: { senderId, context: contextName },
      senderId,
      timestamp: Date.now()
    });
    if (LOG_DEBUG) console.log(`${prefix} Broadcast UI_CONNECTED on visibility visible (context: ${contextName}, senderId: ${senderId})`);
  }
});