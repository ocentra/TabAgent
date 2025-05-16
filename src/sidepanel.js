// --- Imports ---
import './minimaldb.js';
import './modelAssetDownloader.js';
import browser from 'webextension-polyfill';
import { initializeNavigation } from './navigation.js';
import * as uiController from './Home/uiController.js';
import {
  initializeRenderer,
  setActiveSessionId as setRendererSessionId,
  scrollToBottom,
} from './Home/chatRenderer.js';
import { initializeOrchestrator } from './Home/messageOrchestrator.js';
import {
  initializeFileHandling,
  handleAttachClick,
  handleFileSelected,
} from './Home/fileHandler.js';
import {
  initializeUI,
  clearInput,
  focusInput,
  setActiveSession,
} from './Home/uiController.js';
import { getActiveTab, showError as utilShowError, debounce } from './Utilities/generalUtils.js';
import { showNotification } from './notifications.js';
import { DbGetSessionRequest, DbAddLogRequest } from './events/dbEvents.js';
import { autoEnsureDbInitialized, forwardDbRequest } from './minimaldb.js';
import { initializeHistoryPopup } from './Controllers/HistoryPopupController.js';
import { initializeLibraryController } from './Controllers/LibraryController.js';
import { initializeDiscoverController } from './Controllers/DiscoverController.js';
import { initializeSettingsController } from './Controllers/SettingsController.js';
import { initializeSpacesController } from './Controllers/SpacesController.js';
import { initializeDriveController } from './Controllers/DriveController.js';
import {
  UIEventNames,
  RuntimeMessageTypes,
  RawDirectMessageTypes,
  Contexts,
  DirectDBNames,
  DBEventNames,
  InternalEventBusMessageTypes,
  WorkerEventNames,
} from './events/eventNames.js';
import { dbChannel, llmChannel, logChannel } from './Utilities/dbChannels.js';

// --- Constants ---
const LOG_QUEUE_MAX = 1000;
const senderId = 'sidepanel-' + Math.random().toString(36).slice(2) + '-' + Date.now();

// --- Global State ---
let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;
let isDbReady = false;
let historyPopupController = null;
let logQueue = [];
const pendingDbRequests = new Map();

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
  }
})();

// Marked.js Setup
if (window.marked) {
  window.marked.setOptions({
    highlight: function (code, lang) {
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
      const escapeHtml = (htmlStr) =>
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
  console.log('[Sidepanel] Marked.js globally configured to use highlight.js.');
} else {
  console.error('[Sidepanel] Marked.js library (window.marked) not found.');
}

// --- DB and Channel Utilities ---
function isDbRequest(type) {
  return typeof type === 'string' && type.endsWith('_REQUEST');
}

function isDbLocalContext() {
  return typeof forwardDbRequest === 'function';
}

async function sendDbRequestViaChannel(request) {
  return new Promise((resolve) => {
    const responseType = request.type + '_RESPONSE_' + Math.random();
    const requestId = request.requestId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    function onResponse(event) {
      if (event.data?.type === responseType && event.data.requestId === requestId) {
        dbChannel.removeEventListener('message', onResponse);
        resolve(event.data.payload);
      }
    }
    dbChannel.addEventListener('message', onResponse);
    dbChannel.postMessage({ ...request, responseType, requestId });
  });
}

async function sendDbRequestSmart(request, timeoutMs = 5000) {
  if (isDbLocalContext()) {
    return await forwardDbRequest(request);
  }
  return await browser.runtime.sendMessage(request);
}

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await sendDbRequestSmart(requestEvent, timeoutMs);
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
  });
}

// --- Logging ---
function bufferOrWriteLog(logPayload) {
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
function sendUiEvent(type, payload) {
  browser.runtime.sendMessage({ type, payload });
}

function sendWorkerError(message) {
  browser.runtime.sendMessage({ type: UIEventNames.WORKER_ERROR, payload: message });
}

function getActiveChatSessionId() {
  return activeSessionId;
}

async function setActiveChatSessionId(newSessionId) {
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
  dbChannel.onmessage = async (event) => {
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
        payload: { success: false, error: err.message },
        requestId,
        senderId,
      });
    }
  };

  llmChannel.onmessage = async (event) => {
    const { type, payload, requestId, senderId } = event.data;
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
function handleMessage(message, sender, sendResponse) {
  const { type } = message;
  if (Object.values(DirectDBNames).includes(type) || Object.values(DBEventNames).includes(type)) {
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

async function handleSessionCreated(newSessionId) {
  console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
  await setActiveChatSessionId(newSessionId);
  try {
    const request = new DbGetSessionRequest(newSessionId);
    const sessionData = await requestDbAndWait(request);
    if (!sessionData?.messages) {
      console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}.`, sessionData);
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, error);
    utilShowError(`Failed to load initial messages for new chat: ${error.message}`);
  }
}

async function handleNewChat() {
  console.log('[Sidepanel] New Chat button clicked.');
  await setActiveChatSessionId(null);
  clearInput();
  focusInput();
}

async function handleChatSessionClick(event) {
  const sessionId = event.currentTarget.dataset.sessionId;
  if (!sessionId) {
    console.warn('[Sidepanel] Session list click event missing sessionId:', event.currentTarget);
    return;
  }
  if (sessionId === activeSessionId) {
    console.log(`[Sidepanel] Clicked already active session: ${sessionId}`);
    scrollToBottom();
  } else {
    console.log(`[Sidepanel] Session list item clicked: ${sessionId}`);
    await loadAndDisplaySession(sessionId);
  }
}

async function loadAndDisplaySession(sessionId) {
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
    if (!sessionData?.messages) {
      console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}.`);
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to load session ${sessionId}:`, error);
    utilShowError(`Failed to load chat: ${error.message}`);
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
    console.error('Error during detach:', error);
    utilShowError(`Error detaching chat: ${error.message}`);
  }
}

async function handlePageChange(event) {
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
      console.error('[Sidepanel] Error checking/loading session based on signal:', error);
      utilShowError('Failed to load session state.');
      await loadAndDisplaySession(null);
    }
  }
}

// --- Worker Status Broadcasting ---
function handleWorkerStatusEvent(event) {
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
  window.modelWorker.onmessage = (event) => {
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
      const logViewerModule = await import('./Controllers/LogViewerController.js');
      await logViewerModule.initializeLogViewerController();
      console.log('[Sidepanel] Log Viewer Controller initialized.');
    } catch (err) {
      console.error('Failed to load or initialize LogViewerController:', err);
      if (logViewerPage) {
        logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${err.message}</div>`;
      }
    }
    return;
  }

  // Standard Mode
  console.log('[Sidepanel] Initializing in Standard Mode.');
  document.getElementById('page-log-viewer')?.classList.add('hidden');

  // Initialize DB
  try {
    const result = await autoEnsureDbInitialized();
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
    console.error('[Sidepanel] DB Initialization failed:', error);
    utilShowError(`Initialization failed: ${error.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
    }
    return;
  }

  // Initialize UI and Core Components
  try {
    const { chatBody, newChatButton, chatInputElement, sendButton, fileInput } = initializeUI({
      onNewChat: handleNewChat,
      onSessionClick: handleChatSessionClick,
      onAttachFile: handleAttachClick,
    });
    console.log('[Sidepanel] UI Controller Initialized.');

    const chatBodyForRenderer = document.getElementById('chat-body');
    if (!chatBodyForRenderer) {
      console.error('[Sidepanel] CRITICAL: chatBodyForRenderer is null before initializeRenderer!');
    }
    initializeRenderer(chatBodyForRenderer, requestDbAndWait);
    console.log('[Sidepanel] Chat Renderer Initialized.');

    initializeNavigation();
    console.log('[Sidepanel] Navigation Initialized.');

    document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handlePageChange(e.detail));

    initializeFileHandling({
      uiController,
      getActiveSessionIdFunc: getActiveChatSessionId,
    });
    console.log('[Sidepanel] File Handler Initialized.');

    const fileInputForListener = document.getElementById('file-input');
    if (fileInputForListener) {
      fileInputForListener.addEventListener('change', handleFileSelected);
    } else {
      console.warn('[Sidepanel] File input element not found before adding listener.');
    }

    const activeTab = await getActiveTab();
    currentTabId = activeTab?.id;
    currentTab = activeTab;
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

    document.addEventListener(UIEventNames.REQUEST_MODEL_LOAD, (e) => {
      const { modelId } = e.detail || {};
      if (!modelId) {
        sendWorkerError('No model ID specified for loading.');
        return;
      }
      browser.runtime
        .sendMessage({ type: RuntimeMessageTypes.LOAD_MODEL, payload: { modelId } })
        .catch((err) => sendWorkerError(`Failed to send load request: ${err.message}`));
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

    console.log('[Sidepanel] Initialization complete.');
  } catch (error) {
    console.error('[Sidepanel] Initialization failed:', error);
    utilShowError(`Initialization failed: ${error.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
    }
  }
});

// --- Exports ---
export { sendDbRequestSmart };