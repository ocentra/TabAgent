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
    DbGetSessionRequest, DbGetSessionResponse,
    DbGetAllSessionsRequest, DbGetAllSessionsResponse,
    DbStatusUpdatedNotification, DbSessionUpdatedNotification,
    DbInitializeRequest,
    DbInitializationCompleteNotification,
    DbMessagesUpdatedNotification
} from './events/dbEvents.js';
import { initializeHistoryPopup } from './Controllers/HistoryPopupController.js';
import './db.js';
import { initializeLibraryController } from './Controllers/LibraryController.js';
import { initializeDiscoverController } from './Controllers/DiscoverController.js';
import { initializeSettingsController } from './Controllers/SettingsController.js';
import { initializeSpacesController } from './Controllers/SpacesController.js';
import { initializeDriveController, handleDriveFileListResponse } from './Controllers/DriveController.js';

let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;

let historyPopupController = null;
let isDbReady = false;

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const { requestId, type: requestType } = requestEvent;
        // Get the response event name from the static property of the request class
        const responseEventType = requestEvent.constructor.responseEventName; 

        // Add a check to ensure the response event type was found
        if (!responseEventType) {
            const errorMsg = `[requestDbAndWait] Cannot determine response event type for request: ${requestType}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
            return; // Stop execution
        }

        const responseHandler = (responseEvent) => {
            console.log(`[requestDbAndWait] Received event for ${responseEventType}, ReqID ${responseEvent?.requestId}, Waiting for ${requestId}`);
            console.log('[requestDbAndWait] RAW Received Event Object:', responseEvent);

            if (responseEvent && responseEvent.requestId === requestId) {
                console.log(`[requestDbAndWait] MATCH FOUND for ReqID ${requestId}. Event Payload:`, responseEvent);
                clearTimeout(timeoutId);
                eventBus.unsubscribe(responseEventType, responseHandler);
                pendingDbRequests.delete(requestId);
                if (responseEvent.error === null || typeof responseEvent.error === 'undefined') {
                   console.log(`[requestDbAndWait] Success assumed (no error property) for ReqID ${requestId}. Resolving promise.`);
                   resolve(responseEvent.data || responseEvent.payload);
    } else {
                   console.error(`[requestDbAndWait] Error property found for ReqID ${requestId}. responseEvent.error was: ${responseEvent.error}. Rejecting promise.`);
                   reject(new Error(responseEvent.error || `DB operation ${requestType} failed`));
                }
            }
        };

        const timeoutId = setTimeout(() => {
            console.error(`[Sidepanel] DB request timed out for ${requestType} (Req ID: ${requestId})`);
            eventBus.unsubscribe(responseEventType, responseHandler);
            pendingDbRequests.delete(requestId);
            reject(new Error(`DB request timed out for ${requestType}`));
        }, timeoutMs);

        pendingDbRequests.set(requestId, { handler: responseHandler, timeoutId });
        eventBus.subscribe(responseEventType, responseHandler);
        eventBus.publish(requestEvent.type, requestEvent);
    });
}

function getActiveChatSessionId() {
    return activeSessionId;
}

// New function to centralize setting the active session ID
async function setActiveChatSessionId(newSessionId) {
    console.log(`[Sidepanel] Setting active session ID to: ${newSessionId}`);
    activeSessionId = newSessionId;
    if (newSessionId) {
        await browser.storage.local.set({ lastSessionId: newSessionId });
    } else {
        await browser.storage.local.remove('lastSessionId');
    }
    // Notify other components
    setRendererSessionId(newSessionId); // From chatRenderer import
    setActiveSession(newSessionId);     // From uiController import
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Sidepanel] DOM Content Loaded.");

    // --- Context Detection --- 
    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get('view');

    if (requestedView === 'logs') {
        console.log("[Sidepanel] Initializing in Log Viewer Mode.");
        document.body.classList.add('log-viewer-mode'); // Optional: for specific CSS overrides
        
        // Hide main UI elements immediately
        document.getElementById('header')?.classList.add('hidden');
        document.getElementById('bottom-nav')?.classList.add('hidden');
        // Ensure all standard page containers are hidden (except log viewer)
        document.querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
            .forEach(el => el.classList.add('hidden'));
        // Show the log viewer page
        const logViewerPage = document.getElementById('page-log-viewer');
        if (logViewerPage) {
            logViewerPage.classList.remove('hidden');
        } else {
            console.error("CRITICAL: #page-log-viewer element not found!");
            document.body.innerHTML = "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>"; // Show error
            return; // Stop further execution
        }

        // Dynamically import and initialize the Log Viewer Controller
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
        
        // Stop here, don't initialize the rest of the sidepanel UI
        return; 
    }
    // --- End Context Detection ---
    
    // --- Regular Sidepanel Initialization (only runs if not view=logs) ---
    console.log("[Sidepanel] Initializing in Standard Mode.");
    
    // Ensure log viewer page is hidden in standard mode
    document.getElementById('page-log-viewer')?.classList.add('hidden'); 

    // Proceed with existing initialization...
    let dbInitializationComplete = false;
    const dbReadyPromise = new Promise((resolve, reject) => {
        const TIMEOUT_MS = 10000;

        const timeoutId = setTimeout(() => {
            if (!dbInitializationComplete) {
                console.error("[Sidepanel] DB Initialization timed out!");
                reject(new Error("Database initialization timed out."));
            }
        }, TIMEOUT_MS);

        const dbInitHandler = (notification) => {
            dbInitializationComplete = true;
            clearTimeout(timeoutId);
            eventBus.unsubscribe(DbInitializationCompleteNotification.name, dbInitHandler);
            if (notification && notification.payload && notification.payload.success) {
                console.log("[Sidepanel] Received DB Initialization Complete notification (Success).");
                resolve(true);
            } else {
                const errorMsg = notification?.payload?.error || "Unknown DB initialization error";
                console.error(`[Sidepanel] Received DB Initialization Complete notification (Failure): ${errorMsg}`);
                reject(new Error(`Database initialization failed: ${errorMsg}`));
            }
        };

        eventBus.subscribe(DbInitializationCompleteNotification.name, dbInitHandler);
        console.log("[Sidepanel] Subscribed to DbInitializationCompleteNotification. Publishing DbInitializeRequest...");
        eventBus.publish(DbInitializeRequest.name, new DbInitializeRequest());
    });

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

        // Re-fetch chatBody just before passing it
        const chatBodyForRenderer = document.getElementById('chat-body');
        if (!chatBodyForRenderer) {
            console.error("[Sidepanel] CRITICAL: chatBodyForRenderer is null right before calling initializeRenderer!");
        }
        initializeRenderer(chatBodyForRenderer, requestDbAndWait);
        console.log("[Sidepanel] Chat Renderer Initialized.");

        initializeNavigation();
        console.log("[Sidepanel] Navigation Initialized.");

        // Add listener for navigation changes AFTER navigation is initialized
        eventBus.subscribe('navigation:pageChanged', handlePageChange);
        
        // Pass the uiController module object as expected by fileHandler
        initializeFileHandling({ 
             uiController: uiController, 
             getActiveSessionIdFunc: getActiveChatSessionId 
        });
        console.log("[Sidepanel] File Handler Initialized.");
        
        // Re-fetch fileInput just before adding listener
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
        


        // Initialize Library Controller
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

        // Listen for request from UI controller to load the model
        eventBus.subscribe('ui:requestModelLoad', (payload) => {
            const modelId = payload?.modelId;
            if (!modelId) {
                 console.error("[Sidepanel] Received 'ui:requestModelLoad' but missing modelId.");
                 eventBus.publish('worker:error', 'No model ID specified for loading.');
                 return;
            }
            console.log(`[Sidepanel] Received 'ui:requestModelLoad' for ${modelId}. Sending 'loadModel' to background.`);
            browser.runtime.sendMessage({ type: 'loadModel', payload: { modelId: modelId } }).catch(err => {
                 console.error(`[Sidepanel] Error sending 'loadModel' message for ${modelId}:`, err);
                 // Optionally inform UI of the error
                 eventBus.publish('worker:error', `Failed to send load request: ${err.message}`);
            });
        });

        // Initialize Discover Controller
        initializeDiscoverController();
        console.log("[Sidepanel] Discover Controller Initialized call attempted.");

        // Initialize Settings Controller
        initializeSettingsController();
        console.log("[Sidepanel] Settings Controller Initialized call attempted.");
        
        // Initialize Spaces Controller
        initializeSpacesController();
        console.log("[Sidepanel] Spaces Controller Initialized call attempted.");

        // Initialize Drive Controller
        initializeDriveController({
            requestDbAndWaitFunc: requestDbAndWait,
            getActiveChatSessionId: getActiveChatSessionId,
            setActiveChatSessionId: setActiveChatSessionId,
            showNotification,
            debounce,
            eventBus
        });
        console.log("[Sidepanel] Drive Controller Initialized.");

        // Wait for DB Initialization AFTER setting up listeners/controllers
        console.log("[Sidepanel] Waiting for DB initialization to complete...");
        isDbReady = await dbReadyPromise; // Wait for the DB promise to resolve/reject
        console.log("[Sidepanel] DB initialization confirmed complete.");

        // Now check if we need to load a specific session (e.g., from detach)
        // Extract context determination logic
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
                // Optionally remove the key after loading
                // await browser.storage.local.remove(storageKey);
            } else {
                 console.log(`[Sidepanel-Popup] No detached session ID found for key ${storageKey}. Starting fresh.`);
                 await setActiveChatSessionId(null);
            }
        } else {
            // If not a popup, load last known session or start fresh
            const { lastSessionId } = await browser.storage.local.get(['lastSessionId']);
            if (lastSessionId) {
                 console.log(`[Sidepanel] Loading last active session: ${lastSessionId}`);
                 await loadAndDisplaySession(lastSessionId);
             } else {
                 console.log("[Sidepanel] No last session ID found, starting fresh.");
                 await setActiveChatSessionId(null);
             }
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
        eventBus.publish('background:responseReceived', payload);
    } else if (message.type === 'error') {
        const payload = { chatId: message.chatId, messageId: message.messageId, error: message.error };
        eventBus.publish('background:errorReceived', payload);
    } else if (message.type === 'STAGE_SCRAPE_RESULT') {
        eventBus.publish('background:scrapeStageResult', message.payload);
    } else if (message.type === 'DIRECT_SCRAPE_RESULT') {
        eventBus.publish('background:scrapeResultReceived', message.payload);
    } else if (message.type === 'uiLoadingStatusUpdate') {
        // Forward loading status updates from background onto the local event bus
        console.log('[Sidepanel] Forwarding uiLoadingStatusUpdate to eventBus.');
        eventBus.publish('ui:loadingStatusUpdate', message.payload);
    } else if (message.type === 'driveFileListData') {
        console.log('[Sidepanel] Received driveFileListData, calling DriveController handler directly.');
        handleDriveFileListResponse(message);
    } else {
        console.warn('[Sidepanel] Received unknown message type from background:', message.type, message);
    }
}

async function handleSessionCreated(newSessionId) {
    console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
    // Use the centralized function now
    await setActiveChatSessionId(newSessionId);

    // Explicitly fetch and render messages for the new session
    console.log(`[Sidepanel] Explicitly fetching messages for new session ${newSessionId}`);
    try {
        const request = new DbGetSessionRequest(newSessionId);
        const sessionData = await requestDbAndWait(request);
        if (sessionData && sessionData.messages) {
            eventBus.publish(DbMessagesUpdatedNotification.name,
               new DbMessagesUpdatedNotification(newSessionId, sessionData.messages)
            );
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
    // Use the centralized function to clear the active session
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
    let sessionData = null; // Variable to hold the fetched session data

    try {
        const request = new DbGetSessionRequest(sessionId);
        // Store the result from the DB request
        sessionData = await requestDbAndWait(request); 

        console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
        // Set the session ID as active
        await setActiveChatSessionId(sessionId);

        // --- Manually trigger message rendering --- 
        if (sessionData && sessionData.messages) {
            console.log(`[Sidepanel] Manually triggering message render for loaded session ${sessionId}.`);
            eventBus.publish(DbMessagesUpdatedNotification.name,
               new DbMessagesUpdatedNotification(sessionId, sessionData.messages)
            );
        } else {
            console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}. Displaying empty chat.`);
            // Optionally ensure renderer clears messages if sessionData is unexpectedly empty
             eventBus.publish(DbMessagesUpdatedNotification.name,
                 new DbMessagesUpdatedNotification(sessionId, { messages: [] })
             );
        }
        // --- End Manual Trigger ---

    } catch (error) {
        console.error(`[Sidepanel] Failed to load session ${sessionId}:`, error);
        utilShowError(`Failed to load chat: ${error.message}`);
        // Reset to welcome screen on error
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

// --- New Event Handler for Navigation ---

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
            await loadAndDisplaySession(null); // Fallback to welcome screen on error
        }
    }
    // Add else if blocks here if other pages need specific actions on navigation
}