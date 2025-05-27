// --- Imports ---
import './DB/db';
import './modelAssetDownloader';
import browser from 'webextension-polyfill';
import { initializeNavigation } from './navigation';
import * as uiController from './Home/uiController';
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
} from './Home/uiController';
import { getActiveTab, showError as utilShowError, debounce } from './Utilities/generalUtils';
import { showNotification } from './notifications';
import { DbGetSessionRequest, DbAddLogRequest ,DbWorkerCreatedNotification, DbGetManifestRequest, DbGetAllModelFileManifestsRequest, DbInitializationCompleteNotification, DbCreateAllFileManifestsForRepoRequest, DbListModelFilesRequest, DbManifestUpdatedNotification } from './DB/dbEvents';
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
import { downloadModelAssets } from './modelAssetDownloader';
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
  if (isDbLocalContext()) {
    return await forwardDbRequest(request);
  }
  return await browser.runtime.sendMessage(request);
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

  llmChannel.onmessage = async (event) => {
    const { type, payload, requestId, senderId: msgSenderId } = event.data;
    if (msgSenderId && msgSenderId !== senderId) return; // Only process messages for this context
    if (
      [
        WorkerEventNames.WORKER_SCRIPT_READY,
        WorkerEventNames.WORKER_READY,
        WorkerEventNames.LOADING_STATUS,
        WorkerEventNames.ERROR,
        WorkerEventNames.RESET_COMPLETE,
      ].includes(type)
    ) {
      return;
    }
    if (type === RuntimeMessageTypes.SEND_CHAT_MESSAGE && typeof window.sendChatMessage === 'function') {
      const result = await window.sendChatMessage(payload);
      llmChannel.postMessage({
        type: RuntimeMessageTypes.SEND_CHAT_MESSAGE + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (
      type === RuntimeMessageTypes.INTERRUPT_GENERATION &&
      typeof window.interruptGeneration === 'function'
    ) {
      const result = await window.interruptGeneration(payload);
      llmChannel.postMessage({
        type: RuntimeMessageTypes.INTERRUPT_GENERATION + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === RuntimeMessageTypes.RESET_WORKER && typeof window.resetWorker === 'function') {
      const result = await window.resetWorker(payload);
      llmChannel.postMessage({
        type: RuntimeMessageTypes.RESET_WORKER + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === RuntimeMessageTypes.LOAD_MODEL && typeof window.loadModel === 'function') {
      const result = await window.loadModel(payload);
      llmChannel.postMessage({
        type: RuntimeMessageTypes.LOAD_MODEL + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
      const state = window.currentModelWorkerState || 'UNINITIALIZED';
      const modelId = window.currentModelIdForWorker || null;
      llmChannel.postMessage({
        type: RuntimeMessageTypes.GET_MODEL_WORKER_STATE + '_RESPONSE',
        payload: { state, modelId },
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    }
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

// --- Worker Status Broadcasting ---
function handleWorkerStatusEvent(event: MessageEvent) {
  const { type, payload } = event.data;
  if (
    [
      WorkerEventNames.WORKER_SCRIPT_READY,
      WorkerEventNames.WORKER_READY,
      WorkerEventNames.LOADING_STATUS,
      WorkerEventNames.ERROR,
      WorkerEventNames.RESET_COMPLETE,
    ].includes(type)
  ) {
    llmChannel.postMessage({ type, payload, senderId: 'sidepanel', timestamp: Date.now() });
  }
}

if (window.modelWorker) {
  window.modelWorker.onmessage = (event: MessageEvent) => {
    handleWorkerStatusEvent(event);
  };
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
      uiController,
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

    document.addEventListener(UIEventNames.REQUEST_MODEL_LOAD, async (e: Event) => {
      const { modelId } = (e as CustomEvent).detail || {};
      if (!modelId) {
        sendWorkerError('No model ID specified for loading.');
        return;
      }
      try {
        // Get selected ONNX file from dropdown
        const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement;
        let selectedOnnxFile = quantSelector?.value || null;
        // Do NOT convert 'all' to null; pass 'all' as a string
        console.log(`${prefix} selectedOnnxFile:`, selectedOnnxFile);

        // Pass manifests for this modelId to the downloader
        const manifestsForModel = allManifests.filter(m => m.folder === modelId);
        const result = await downloadModelAssets(modelId, selectedOnnxFile, manifestsForModel);
        if (!result.success) {
          sendWorkerError(result.error || 'Unknown error during model download.');
        }
      } catch (err) {
        sendWorkerError(`Failed to download model: ${(err as Error).message}`);
      }
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

    // Track model selection
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        currentModelId = (e.target as HTMLSelectElement).value;
      });
      // Set initial value
      currentModelId = modelSelector.value;
    }

    // Ensure the model dropdown is populated before fetching metadata and initializing DB
    // Log the dropdown options
    const dropdownOptions = Array.from((document.getElementById('model-selector') as HTMLSelectElement).options).map(opt => opt.value);
    console.log(`${prefix} Model dropdown options before fetch:`, dropdownOptions);

    // Initialize DB
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

    // Expose to window for modelAssetDownloader.ts
    window.showOnnxSelectionPopup = (onnxFiles, downloadPlan, initialFileStates, nonOnnxProgress, nonOnnxStatus, requestFileDownloadCb) => {
      if (onnxSelectionPopupController) {
        onnxSelectionPopupController.show(
          onnxFiles,
          downloadPlan,
          initialFileStates,
          nonOnnxProgress,
          nonOnnxStatus,
          requestFileDownloadCb
        );
      }
    };

    // Listen for per-file progress events and update the popup
    document.addEventListener('MODEL_DOWNLOAD_PROGRESS', (e: any) => {
      const detail = e.detail || (e as CustomEvent).detail;
      if (detail && detail.currentFile) {
        // Only update ONNX file progress bar if it's an ONNX file
        if (detail.currentFile.endsWith('.onnx')) {
          // Normalize to base file name for ONNXSelectionPopupController
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
      // Also update main progress bar as before
      if (typeof detail.progress === 'number') {
        updateMainProgress(detail.progress, detail.message || '');
        if (detail.done || detail.error) {
          setTimeout(hideMainProgress, 1500);
        }
      }
    });

    // --- Main Model Load Progress Bar Wiring ---
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

  // On page load, hide both buttons
  const downloadBtn = document.getElementById('download-model-btn') as HTMLButtonElement;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement;
  if (downloadBtn) downloadBtn.style.display = 'none';
  if (loadBtn) loadBtn.style.display = 'none';

  // Add dropdown change listeners
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
  if (modelSelector) {
    modelSelector.addEventListener('change', async () => {
      await handleModelSelectorChange();
      updateModelActionButtons();
    });
  }
  const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement;
  if (quantSelector) {
    quantSelector.addEventListener('change', () => {
      updateModelActionButtons();
    });
  }
});

document.addEventListener(DbInitializationCompleteNotification.type, async (e: any) => {
  console.log(`${prefix} DbInitializationCompleteNotification received.`, e.detail);
  await handleModelSelectorChange();
  updateModelActionButtons();
  
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
  const repoIds = Array.from(modelSelector.options).map(opt => opt.value);
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
    // fallback: fetch from DB if not already loaded
    console.log(`${prefix} allManifests is empty. Fetching from DB.`);
    const req = new DbGetAllModelFileManifestsRequest();
    const response = await sendDbRequestSmart(req);
    if (!response.success) return;
    allManifests = response.data || [];
  }
  // Check again after fetch
  if (!allManifests.length) {
    console.warn(`${prefix} allManifests is still empty after DB fetch. Nothing to render.`);
    return;
  }
  console.log(`${prefix} allManifests fetched from DB:`, allManifests);
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
  const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement;
  if (!modelSelector || !quantSelector) return;
  // Store previous selection
  const prevSelectedRepo = modelSelector.value;

  // Populate main repo dropdown (unique folders)
  const uniqueRepos = Array.from(new Set(allManifests.map((m: any) => String(m.folder)))) as string[];
  modelSelector.innerHTML = '';
  uniqueRepos.forEach((repo) => {
    const option = document.createElement('option');
    option.value = repo;
    option.textContent = repo;
    modelSelector.appendChild(option);
  });

  // Try to restore previous selection if possible
  let selectedRepo: string = prevSelectedRepo && uniqueRepos.includes(prevSelectedRepo)
    ? prevSelectedRepo
    : uniqueRepos[0] || '';
  modelSelector.value = selectedRepo;

  // Populate quantization dropdown for selected repo (ONNX files)
  const repoManifests = allManifests.filter((m: any) => m.folder === selectedRepo && m.fileType === 'onnx');
  quantSelector.innerHTML = '';
  if (repoManifests.length > 1) {
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All (show popup)';
    quantSelector.appendChild(allOption);
  }
  repoManifests.forEach((manifest: any) => {
    const option = document.createElement('option');
    option.value = String(manifest.fileName);
    let statusIcon = '🟡'; // default: missing
    if (manifest.status === 'present' || manifest.status === 'complete') statusIcon = '🟢';
    if (manifest.status === 'corrupt') statusIcon = '🔴';
    option.textContent = `${manifest.fileName} ${statusIcon}`;
    quantSelector.appendChild(option);
  });

  updateModelActionButtons();
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
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
  const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement;
  const downloadBtn = document.getElementById('download-model-btn') as HTMLButtonElement;
  const loadBtn = document.getElementById('load-model-button') as HTMLButtonElement;

  if (!modelSelector || !quantSelector || !downloadBtn || !loadBtn) return;

  const selectedRepo = modelSelector.value;
  const selectedOnnx = quantSelector.value;

  // Hide both by default
  downloadBtn.style.display = 'none';
  loadBtn.style.display = 'none';

  if (!selectedRepo || !selectedOnnx) return;

  if (isModelReadyToLoad(selectedRepo, selectedOnnx)) {
    loadBtn.style.display = '';
    downloadBtn.style.display = 'none';
  } else {
    loadBtn.style.display = 'none';
    downloadBtn.style.display = '';
  }
}