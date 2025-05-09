import browser from 'webextension-polyfill';
import { initializeNavigation, navigateTo } from './navigation.js';
import * as uiController from './Home/uiController.js';
import { initializeRenderer, setActiveSessionId as setRendererSessionId, scrollToBottom } from './Home/chatRenderer.js';
import { initializeOrchestrator } from './Home/messageOrchestrator.js';
import { initializeFileHandling, handleAttachClick, handleFileSelected } from './Home/fileHandler.js';
import { initializeUI, clearInput, focusInput, setActiveSession } from './Home/uiController.js';
import { getActiveTab, showError as utilShowError, debounce } from './Utilities/generalUtils.js';
import { showNotification } from './notifications.js';
import { eventBus } from './eventBus.js';
import { 
    DbGetSessionRequest,     
    DbInitializeRequest,    
    DbMessagesUpdatedNotification
} from './events/dbEvents.js';
import { initializeHistoryPopup } from './Controllers/HistoryPopupController.js';
import { initializeLibraryController } from './Controllers/LibraryController.js';
import { initializeDiscoverController } from './Controllers/DiscoverController.js';
import { initializeSettingsController } from './Controllers/SettingsController.js';
import { initializeSpacesController } from './Controllers/SpacesController.js';
import { initializeDriveController, handleDriveFileListResponse } from './Controllers/DriveController.js';
import { DBEventNames, UIEventNames, RuntimeMessageTypes } from './events/eventNames.js';


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
            const escapeHtml = (htmlStr) => {
                return htmlStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            };
            return escapeHtml(code);
        },
        langPrefix: 'language-',
        gfm: true,
        breaks: true
    });
    console.log('[Sidepanel] Marked.js globally configured to use highlight.js.');
} else {
    console.error("[Sidepanel] Marked.js library (window.marked) not found. Ensure it's loaded before this script.");
}

let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;

let historyPopupController = null;
let isDbReady = false;

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        const { requestId, type: requestType } = requestEvent;
        let timeoutId;
        try {
            timeoutId = setTimeout(() => {
                console.error(`[Sidepanel] DB request timed out for ${requestType} (Req ID: ${requestId})`);
                reject(new Error(`DB request timed out for ${requestType}`));
            }, timeoutMs);
            const result = await eventBus.publish(requestEvent.type, requestEvent);
            clearTimeout(timeoutId);
            if (result && (result.success || result.error === undefined)) {
                resolve(result.data || result.payload);
            } else {
                reject(new Error(result?.error || `DB operation ${requestType} failed`));
            }
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Sidepanel] DOM Content Loaded.");

    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get('view');

    if (requestedView === 'logs') {
        console.log("[Sidepanel] Initializing in Log Viewer Mode.");
        document.body.classList.add('log-viewer-mode'); 
        
        document.getElementById('header')?.classList.add('hidden');
        document.getElementById('bottom-nav')?.classList.add('hidden');
        document.querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
            .forEach(el => el.classList.add('hidden'));
        const logViewerPage = document.getElementById('page-log-viewer');
        if (logViewerPage) {
            logViewerPage.classList.remove('hidden');
        } else {
            console.error("CRITICAL: #page-log-viewer element not found!");
            document.body.innerHTML = "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>"; // Show error
            return; 
        }

        try {
            const logViewerModule = await import('./Controllers/LogViewerController.js');
            await logViewerModule.initializeLogViewerController();
            console.log("[Sidepanel] Log Viewer Controller initialized.");
        } catch (err) {
            console.error("Failed to load or initialize LogViewerController:", err);
            if (logViewerPage) {
                logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${err.message}</div>`;
            }
        }
        
        return; 
    }

    console.log("[Sidepanel] Initializing in Standard Mode.");
    

    document.getElementById('page-log-viewer')?.classList.add('hidden'); 

    let isDbReady = false;
    const TIMEOUT_MS = 10000;
    try {
        const dbInitPromise = eventBus.publish(DBEventNames.INITIALIZE_REQUEST, new DbInitializeRequest());
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database initialization timed out.")), TIMEOUT_MS));
        const resultArr = await Promise.race([dbInitPromise, timeoutPromise]);
        const result = Array.isArray(resultArr) ? resultArr[0] : resultArr;
        if (result && result.success) {
            console.log("[Sidepanel] DB initialization confirmed complete.");
            isDbReady = true;
        } else {
            const errorMsg = result?.error || "Unknown DB initialization error";
            throw new Error(`Database initialization failed: ${errorMsg}`);
        }
    } catch (error) {
        console.error("[Sidepanel] DB Initialization failed:", error);
        utilShowError(`Initialization failed: ${error.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class=\"p-4 text-red-500\">Critical Error: ${error.message}. Please reload the extension.</div>`;
        }
        return;
    }

    try {
        const { 
            chatBody, 
            newChatButton, 
            chatInputElement, 
            sendButton, 
            fileInput
        } = initializeUI({
            onNewChat: handleNewChat,
            onSessionClick: handleChatSessionClick,
            onAttachFile: handleAttachClick
        });
        console.log("[Sidepanel] UI Controller Initialized.");

        const chatBodyForRenderer = document.getElementById('chat-body');
        if (!chatBodyForRenderer) {
            console.error("[Sidepanel] CRITICAL: chatBodyForRenderer is null right before calling initializeRenderer!");
        }
        initializeRenderer(chatBodyForRenderer, requestDbAndWait);
        console.log("[Sidepanel] Chat Renderer Initialized.");

        initializeNavigation();
        console.log("[Sidepanel] Navigation Initialized.");

        eventBus.subscribe(UIEventNames.NAVIGATION_PAGE_CHANGED, handlePageChange);
        
        initializeFileHandling({ 
             uiController: uiController, 
             getActiveSessionIdFunc: getActiveChatSessionId 
        });
        console.log("[Sidepanel] File Handler Initialized.");
        

        const fileInputForListener = document.getElementById('file-input');
        if (fileInputForListener) {
            fileInputForListener.addEventListener('change', handleFileSelected);
            } else {
            console.warn("[Sidepanel] File input element (re-fetched) not found before adding listener.");
        }

        const activeTab = await getActiveTab();
        currentTabId = activeTab?.id;
        currentTab = activeTab;
        console.log(`[Sidepanel] Current Tab ID: ${currentTabId}`);

        initializeOrchestrator({
            getActiveSessionIdFunc: getActiveChatSessionId,
            onSessionCreatedCallback: handleSessionCreated,
            getCurrentTabIdFunc: () => currentTabId
        });
        console.log("[Sidepanel] Message Orchestrator Initialized.");

        browser.runtime.onMessage.addListener(handleBackgroundMessage);
        console.log("[Sidepanel] Background message listener added.");

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
                    closeButton: closeHistoryButtonElement
                },
                requestDbAndWait
            );
            if (!historyPopupController) {
                 console.error("[Sidepanel] History Popup Controller initialization failed.");
            }
        } else {
            console.warn("[Sidepanel] Could not find all required elements for History Popup Controller.");
        }

        if (historyButton && historyPopupController) {
            historyButton.addEventListener('click', () => {
                 historyPopupController.show();
            });
        } else {
             console.warn("[Sidepanel] History button or controller not available for listener.");
        }

        if (detachButton) {
             detachButton.addEventListener('click', handleDetach);
        } else {
             console.warn("[Sidepanel] Detach button not found.");
        }
        
        const libraryListElement = document.getElementById('starred-list');
        if (libraryListElement) {
             initializeLibraryController(
                 { listContainer: libraryListElement },
                 requestDbAndWait
             );
             console.log("[Sidepanel] Library Controller Initialized.");
            } else {
            console.warn("[Sidepanel] Could not find #starred-list element for Library Controller.");
        }

        eventBus.subscribe(UIEventNames.REQUEST_MODEL_LOAD, (payload) => {
            const modelId = payload?.modelId;
            if (!modelId) {
                console.error("[Sidepanel] Received 'ui:requestModelLoad' but missing modelId.");
                eventBus.publish(UIEventNames.WORKER_ERROR, 'No model ID specified for loading.');
                return;
            }
            console.log(`[Sidepanel] Received 'ui:requestModelLoad' for ${modelId}. Sending 'loadModel' to background.`);
            browser.runtime.sendMessage({ type: RuntimeMessageTypes.LOAD_MODEL, payload: { modelId: modelId } }).catch(err => {
                console.error(`[Sidepanel] Error sending 'loadModel' message for ${modelId}:`, err);
                eventBus.publish(UIEventNames.WORKER_ERROR, `Failed to send load request: ${err.message}`);
            });
        });


        initializeDiscoverController();
        console.log("[Sidepanel] Discover Controller Initialized call attempted.");


        initializeSettingsController();
        console.log("[Sidepanel] Settings Controller Initialized call attempted.");
        

        initializeSpacesController();
        console.log("[Sidepanel] Spaces Controller Initialized call attempted.");


        initializeDriveController({
            requestDbAndWaitFunc: requestDbAndWait,
            getActiveChatSessionId: getActiveChatSessionId,
            setActiveChatSessionId: setActiveChatSessionId,
            showNotification,
            debounce,
            eventBus
        });
        console.log("[Sidepanel] Drive Controller Initialized.");


        const popupContext = urlParams.get('context');
        originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
        isPopup = popupContext === 'popup';
        console.log(`[Sidepanel] Context: ${isPopup ? 'Popup' : 'Sidepanel'}${isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''}`);

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

            console.log("[Sidepanel] Always starting fresh. Loading empty/welcome state.");
            await loadAndDisplaySession(null);
        }
        
        console.log("[Sidepanel] Initialization complete (after DB ready).");

    } catch (error) {
        console.error('[Sidepanel] Initialization failed:', error);
        utilShowError(`Initialization failed: ${error.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
        }
    }
});

function handleBackgroundMessage(message, sender, sendResponse) {
    console.log('[Sidepanel] Received message from background:', message);
    if (message.type === 'response') {
        const payload = { chatId: message.chatId, messageId: message.messageId, text: message.text };
        eventBus.publish(UIEventNames.BACKGROUND_RESPONSE_RECEIVED, payload);
    } else if (message.type === 'error') {
        const payload = { chatId: message.chatId, messageId: message.messageId, error: message.error };
        eventBus.publish(UIEventNames.BACKGROUND_ERROR_RECEIVED, payload);
        sendResponse({}); 
    } else if (message.type === 'STAGE_SCRAPE_RESULT') {
        eventBus.publish(UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, message.payload);
        sendResponse({status: "received", type: message.type}); 
    } else if (message.type === 'DIRECT_SCRAPE_RESULT') {
        eventBus.publish(UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, message.payload);
        sendResponse({}); 
    } else if (message.type === 'uiLoadingStatusUpdate') {
        console.log('[Sidepanel] Forwarding uiLoadingStatusUpdate to eventBus.');
        eventBus.publish(UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE, message.payload);
    } else if (message.type === 'driveFileListData') {
        console.log('[Sidepanel] Received driveFileListData, calling DriveController handler directly.');
        handleDriveFileListResponse(message);
    } else {
        console.warn('[Sidepanel] Received unknown message type from background:', message.type, message);
    }
}

async function handleSessionCreated(newSessionId) {
    console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
    await setActiveChatSessionId(newSessionId);

    console.log(`[Sidepanel] Explicitly fetching messages for new session ${newSessionId}`);
    try {
        const request = new DbGetSessionRequest(newSessionId);
        const sessionData = await requestDbAndWait(request);
        if (sessionData && sessionData.messages) {
            eventBus.publish(DBEventNames.MESSAGES_UPDATED_NOTIFICATION, new DbMessagesUpdatedNotification(newSessionId, sessionData.messages));
            console.log(`[Sidepanel] Manually triggered message render for new session ${newSessionId}`);
        } else {
            console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}. Response data:`, sessionData);
        }
    } catch (error) {
        console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, error);
        utilShowError(`Failed to load initial messages for new chat: ${error.message}`);
    }
}

async function handleNewChat() {
    console.log("[Sidepanel] New Chat button clicked.");
    await setActiveChatSessionId(null);
    clearInput();
    focusInput();
}

async function handleChatSessionClick(event) {
    const sessionId = event.currentTarget.dataset.sessionId;
    if (sessionId && sessionId !== activeSessionId) {
        console.log(`[Sidepanel] Session list item clicked: ${sessionId}`);
        await loadAndDisplaySession(sessionId);
    } else if (sessionId === activeSessionId) {
        console.log(`[Sidepanel] Clicked already active session: ${sessionId}`);
        scrollToBottom();
                } else {
        console.warn("[Sidepanel] Session list click event missing sessionId:", event.currentTarget);
    }
}

async function loadAndDisplaySession(sessionId) {
    if (!sessionId) {
        console.log("[Sidepanel] No session ID to load, setting renderer to null.");
        await setActiveChatSessionId(null);
        return; 
    }

    console.log(`[Sidepanel] Loading session data for: ${sessionId}`);
    let sessionData = null; 

    try {
        const request = new DbGetSessionRequest(sessionId);
        sessionData = await requestDbAndWait(request); 

        console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
        await setActiveChatSessionId(sessionId);

        if (sessionData && sessionData.messages) {
            console.log(`[Sidepanel] Manually triggering message render for loaded session ${sessionId}.`);
            eventBus.publish(DBEventNames.MESSAGES_UPDATED_NOTIFICATION, new DbMessagesUpdatedNotification(sessionId, sessionData.messages));
        } else {
            console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}. Displaying empty chat.`);
             eventBus.publish(DBEventNames.MESSAGES_UPDATED_NOTIFICATION,
                 new DbMessagesUpdatedNotification(sessionId, { messages: [] })
             );
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
            tabId: currentTabId 
        });

        if (response && response.popupId) {
            await browser.windows.update(response.popupId, { focused: true });
            return; 
        }

        const storageKey = `detachedSessionId_${currentTabId}`;
        await browser.storage.local.set({
            [storageKey]: currentSessionId
        });
        console.log(`Sidepanel: Saved session ID ${currentSessionId} for detach key ${storageKey}.`);

        const popup = await browser.windows.create({
            url: browser.runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
            type: 'popup',
            width: 400,
            height: 600
        });

        if (popup?.id) { 
            await browser.runtime.sendMessage({ 
                type: 'popupCreated', 
                tabId: currentTabId,
                popupId: popup.id
            });
            } else {
             throw new Error("Failed to create popup window.");
        }

                } catch (error) {
        console.error('Error during detach:', error);
        utilShowError(`Error detaching chat: ${error.message}`); 
                }
            }



async function handlePageChange(event) {
    if (!event || !event.pageId) return;
    console.log(`[Sidepanel] Navigation changed to: ${event.pageId}`);

    if (!isDbReady) {
        console.log("[Sidepanel] DB not ready yet, skipping session load on initial navigation event.");
        return; 
    }

    if (event.pageId === 'page-home') {
        console.log("[Sidepanel] Navigated to home page, checking for specific session load signal...");
        try {
            const { lastSessionId } = await browser.storage.local.get(['lastSessionId']);
            if (lastSessionId) {
                console.log(`[Sidepanel] Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
                await loadAndDisplaySession(lastSessionId);
                await browser.storage.local.remove('lastSessionId'); 
            } else {
                console.log("[Sidepanel] No load signal found. Resetting to welcome state.");
                await loadAndDisplaySession(null); 
            }
        } catch (error) {
            console.error("[Sidepanel] Error checking/loading session based on signal:", error);
            utilShowError("Failed to load session state."); 
            await loadAndDisplaySession(null); 
        }
    }
}