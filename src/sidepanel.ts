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
import { DbGetSessionRequest, DbAddLogRequest ,DbWorkerCreatedNotification, DbGetManifestRequest, DbGetAllModelFileManifestsRequest } from './DB/dbEvents';
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
        console.log('[Trace][sidepanel] requestDbAndWait: Raw result', result);
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
  console.log(`[Sidepanel] Setting active session ID to: ${newSessionId}`);
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
  console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
  console.log('[Sidepanel] handleSessionCreated callback received sessionId:', newSessionId);
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
  console.log('[Sidepanel] New Chat button clicked.');
  await setActiveChatSessionId(null);
  clearInput();
  focusInput();
}



async function loadAndDisplaySession(sessionId: string | null) {
  if (!sessionId) {
    console.log('[Sidepanel] No session ID to load, setting renderer to null.');
    await setActiveChatSessionId(null);
    return;
  }
  console.log(`[Sidepanel] Loading session data for: ${sessionId}`);
  try {
    const request = new DbGetSessionRequest(sessionId);
    const sessionData = await requestDbAndWait(request);
    console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
    await setActiveChatSessionId(sessionId);
    if (!(sessionData as any)?.messages) {
      console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}.`);
    }
  } catch (error) {
    const err = error as Error;
    console.error(`[Sidepanel] Failed to load session ${sessionId}:`, err);
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
    console.log(`Sidepanel: Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
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
  console.log(`[Sidepanel] Navigation changed to: ${event.pageId}`);
  if (!isDbReady) {
    console.log('[Sidepanel] DB not ready yet, skipping session load on initial navigation event.');
    return;
  }
  if (event.pageId === 'page-home') {
    console.log('[Sidepanel] Navigated to home page, checking for specific session load signal...');
    try {
      const { lastSessionId } = await browser.storage.local.get(['lastSessionId']);
      if (lastSessionId) {
        console.log(`[Sidepanel] Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
        await loadAndDisplaySession(lastSessionId);
        await browser.storage.local.remove('lastSessionId');
      } else {
        console.log('[Sidepanel] No load signal found. Resetting to welcome state.');
        await loadAndDisplaySession(null);
      }
    } catch (error) {
      const err = error as Error;
      console.error('[Sidepanel] Error checking/loading session based on signal:', err);
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
  console.log('[Sidepanel] DOM Content Loaded.');
  const urlParams = new URLSearchParams(window.location.search);
  const requestedView = urlParams.get('view');

  // Log Viewer Mode
  if (requestedView === 'logs') {
    console.log('[Sidepanel] Initializing in Log Viewer Mode.');
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
      console.log('[Sidepanel] Log Viewer Controller initialized.');
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
  console.log('[Sidepanel] Initializing in Standard Mode.');
  document.getElementById('page-log-viewer')?.classList.add('hidden');



  // Initialize UI and Core Components
  try {
    const uiInitResult = await initializeUI({
      onNewChat: handleNewChat,
      onAttachFile: handleAttachClick,
    });
    if (!uiInitResult) throw new Error('UI initialization failed');
    const { chatBody, fileInput } = uiInitResult;
    console.log('[Sidepanel] UI Controller Initialized.');

    if (!chatBody) {
      console.error('[Sidepanel] CRITICAL: chatBody is null before initializeRenderer!');
      throw new Error('chatBody is null');
    }
    initializeRenderer(chatBody, requestDbAndWait);
    console.log('[Sidepanel] Chat Renderer Initialized.');

    initializeNavigation();
    console.log('[Sidepanel] Navigation Initialized.');

    document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e: Event) => handlePageChange((e as CustomEvent).detail));

    initializeFileHandling({
      uiController,
      getActiveSessionIdFunc: getActiveChatSessionId,
    });
    console.log('[Sidepanel] File Handler Initialized.');

    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelected);
    } else {
      console.warn('[Sidepanel] File input element not found before adding listener.');
    }

    const activeTab = await getActiveTab();
    currentTabId = activeTab?.id;
    console.log(`[Sidepanel] Current Tab ID: ${currentTabId}`);

    initializeOrchestrator({
      getActiveSessionIdFunc: getActiveChatSessionId,
      onSessionCreatedCallback: handleSessionCreated,
      getCurrentTabIdFunc: () => currentTabId,
    });
    console.log('[Sidepanel] Message Orchestrator Initialized.');

    browser.runtime.onMessage.addListener(handleMessage);
    console.log('[Sidepanel] Background message listener added.');

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
        console.error('[Sidepanel] History Popup Controller initialization failed.');
      }
    } else {
      console.warn('[Sidepanel] Could not find all required elements for History Popup Controller.');
    }

    if (historyButton && historyPopupController) {
      historyButton.addEventListener('click', () => historyPopupController.show());
    } else {
      console.warn('[Sidepanel] History button or controller not available for listener.');
    }

    if (detachButton) {
      detachButton.addEventListener('click', handleDetach);
    } else {
      console.warn('[Sidepanel] Detach button not found.');
    }

    const libraryListElement = document.getElementById('starred-list');
    if (libraryListElement) {
      initializeLibraryController({ listContainer: libraryListElement }, requestDbAndWait);
      console.log('[Sidepanel] Library Controller Initialized.');
    } else {
      console.warn('[Sidepanel] Could not find #starred-list element for Library Controller.');
    }

    document.addEventListener(UIEventNames.REQUEST_MODEL_LOAD, async (e: Event) => {
      const { modelId } = (e as CustomEvent).detail || {};
      if (!modelId) {
        sendWorkerError('No model ID specified for loading.');
        return;
      }
      try {
        const result = await downloadModelAssets(modelId);
        if (!result.success) {
          sendWorkerError(result.error || 'Unknown error during model download.');
        }
      } catch (err) {
        sendWorkerError(`Failed to download model: ${(err as Error).message}`);
      }
    });

    initializeDiscoverController();
    console.log('[Sidepanel] Discover Controller Initialized.');

    initializeSettingsController();
    console.log('[Sidepanel] Settings Controller Initialized.');

    initializeSpacesController();
    console.log('[Sidepanel] Spaces Controller Initialized.');

    initializeDriveController({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification,
      debounce,
    });
    console.log('[Sidepanel] Drive Controller Initialized.');

    // Handle Popup Context
    const popupContext = urlParams.get('context');
    originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
    isPopup = popupContext === 'popup';
    console.log(
      `[Sidepanel] Context: ${isPopup ? 'Popup' : 'Sidepanel'}${
        isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''
      }`
    );

    if (isPopup && originalTabIdFromPopup) {
      const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
      const result = await browser.storage.local.get(storageKey);
      const detachedSessionId = result[storageKey];
      if (detachedSessionId) {
        console.log(`[Sidepanel-Popup] Found detached session ID: ${detachedSessionId}. Loading...`);
        await loadAndDisplaySession(detachedSessionId);
      } else {
        console.log(`[Sidepanel-Popup] No detached session ID found for key ${storageKey}. Starting fresh.`);
        await setActiveChatSessionId(null);
      }
    } else {
      console.log('[Sidepanel] Starting fresh. Loading empty/welcome state.');
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
    console.log('[Sidepanel] Model dropdown options before fetch:', dropdownOptions);

      // Initialize DB
  try {
    // Pre-fetch metadata for all dropdown repos
    const preFetchedRepoMetadata = await fetchAllDropdownRepoMetadata();
    console.log('[Sidepanel] preFetchedRepoMetadata to pass to autoEnsureDbInitialized:', preFetchedRepoMetadata);

    // Enrich each repo's metadata with manifest info (sizes, etc.)
    const enrichedRepoMetadata = [];
    for (const { repo, metadata } of preFetchedRepoMetadata) {
      const baseRepoUrl = `https://huggingface.co/${repo}/resolve/main/`;
      const { neededFileEntries } = await filterAndValidateFilesInternal(metadata, repo, baseRepoUrl);
      enrichedRepoMetadata.push({ repo, metadata: { ...metadata, manifests: neededFileEntries } });
    }

    const result = await autoEnsureDbInitialized({ preFetchedRepoMetadata: enrichedRepoMetadata });
    if (result?.success) {
      console.log('[Sidepanel] DB initialized directly.');
      isDbReady = true;
      for (const logPayload of logQueue) {
        const req = new DbAddLogRequest(logPayload);
        sendDbRequestViaChannel(req);
      }
      logQueue = [];
    } else {
      throw new Error(`Database initialization failed: ${result?.error || 'Unknown error'}`);
    }
  } catch (error) {
    const err = error as Error;
    console.error('[Sidepanel] DB Initialization failed:', err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
    return;
  }

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

    console.log('[Sidepanel] Initialization complete.');
  } catch (error) {
    const err = error as Error;
    console.error('[Sidepanel] Initialization failed:', err);
    utilShowError(`Initialization failed: ${err.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
    }
  }


});

// Listen for DbWorkerCreatedNotification

document.addEventListener(DbWorkerCreatedNotification.type, (e: any) => {
  console.log('[Sidepanel] DbWorkerCreatedNotification event triggered:', e);
  const detail = e.detail || (e as CustomEvent).detail;
  console.log('[Sidepanel] Event detail:', detail);
  if (!detail || !detail.payload) {
    console.log('[Sidepanel] No payload in DbWorkerCreatedNotification.');
    return;
  }
  console.log('[Sidepanel] DbWorkerCreatedNotification payload:', detail.payload);
  allModelMetaFromDb = detail.payload;

  // Flatten all manifests from all repos
  const allManifests: any[] = Object.values(allModelMetaFromDb).flat();
  renderDropdownsFromManifests(allManifests);
});

const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
if (modelSelector) {
  modelSelector.addEventListener('change', async () => {
    await populateQuantizationDropdownFromDb();
  });
}


async function populateQuantizationDropdownFromDb() {
  const req = new DbGetAllModelFileManifestsRequest();
  const response = await sendDbRequestSmart(req);
  if (!response.success) return;
  const allManifests = response.data || [];
  renderDropdownsFromManifests(allManifests);
}
// --- Helper: Render dropdowns from manifests ---
function renderDropdownsFromManifests(allManifests: any[]) {
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
}



async function fetchAllDropdownRepoMetadata() {
  const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
  if (!modelSelector) return [];
  const repoIds = Array.from(modelSelector.options).map(opt => opt.value);
  const results = [];
  console.log('[Sidepanel] Starting fetchAllDropdownRepoMetadata for repos:', repoIds);
  for (const repoId of repoIds) {
    try {
      console.log(`[Sidepanel] Fetching metadata for repo: ${repoId}`);
      const metadata = await fetchModelMetadataInternal(repoId);
      console.log(`[Sidepanel] Got metadata for repo: ${repoId}`, metadata);
      results.push({ repo: repoId, metadata });
    } catch (e) {
      console.warn('[Sidepanel] Failed to fetch metadata for', repoId, e);
    }
  }
  console.log('[Sidepanel] fetchAllDropdownRepoMetadata results:', results);
  return results;
}

// --- Exports ---
export { sendDbRequestSmart };