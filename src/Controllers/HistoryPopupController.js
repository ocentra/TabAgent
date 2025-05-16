// src/Controllers/HistoryPopupController.js

import browser from 'webextension-polyfill';
import { 
    DbGetAllSessionsRequest, 
    DbToggleStarRequest, DbDeleteSessionRequest, DbRenameSessionRequest, DbGetSessionRequest,    
    DbSessionUpdatedNotification,
} from '../events/dbEvents.js';
import { renderHistoryItemComponent } from '../Components/HistoryItem.js';
import { debounce } from '../Utilities/generalUtils.js';
import { showNotification } from '../notifications.js';
import { navigateTo } from '../navigation.js';
import { initiateChatDownload } from '../Utilities/downloadUtils.js';



let isInitialized = false;
let historyPopupElement = null;
let historyListElement = null;
let historySearchElement = null;
let closeHistoryButtonElement = null;
let requestDbAndWaitFunc = null;

let currentHistoryItems = []; 
let currentSearchTerm = '';

function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.payload || !notification.payload.session) {
        console.warn("[HistoryPopupController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = updatedSessionData.id;
    const updateType = notification.payload.updateType || 'update'; 

    if (!updatedSessionData) {
        console.warn(`[HistoryPopupController] Session update notification for ${sessionId} missing session data.`, notification);
        return;
    }

    console.log(`[HistoryPopupController] Received session update for ${sessionId}. Type: ${updateType}, New starred: ${updatedSessionData.isStarred}`);

    const itemIndex = currentHistoryItems.findIndex(item => item.id === sessionId); 

    let listChanged = false;

    if (updateType === 'delete') {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Removing deleted session ${sessionId} from local list.`);
            currentHistoryItems.splice(itemIndex, 1);
            listChanged = true;
        }
    } else {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Updating session ${sessionId} in local list.`);
            currentHistoryItems[itemIndex] = { 
                ...currentHistoryItems[itemIndex], 
                ...updatedSessionData
            };
            listChanged = true; 
        } else {
            console.log(`[HistoryPopupController] Adding new/updated session ${sessionId} to local list.`);
            currentHistoryItems.push(updatedSessionData); 
            listChanged = true;
        }
    }

    if (listChanged && historyPopupElement && !historyPopupElement.classList.contains('hidden')) {
        console.log(`[HistoryPopupController] Popup visible and list changed, calling renderHistoryList()`);
        renderHistoryList(); 
    } else {
        console.log(`[HistoryPopupController] Popup not visible or list unchanged, skipping renderHistoryList()`);
    }
}

function renderHistoryList() {
    if (!isInitialized || !historyListElement) return;
    console.log(`[HistoryPopupController] Rendering history list (Search: "${currentSearchTerm}")...`);

    let filteredItems = currentHistoryItems;
    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        filteredItems = currentHistoryItems.filter(entry => 
            (entry.name || '').toLowerCase().includes(lowerCaseTerm)
        );
        console.log(`[HistoryPopupController] Filtered down to ${filteredItems.length} sessions.`);
    } else {
        console.log(`[HistoryPopupController] Rendering all ${filteredItems.length} sessions (no search term).`);
    }

    historyListElement.innerHTML = ''; 

    if (filteredItems.length === 0) {
        const message = currentSearchTerm
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No history items match "${currentSearchTerm}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No chat history yet.</p>';
        historyListElement.innerHTML = message;
    } else {
        filteredItems.forEach(entry => {
            const props = {
                entry: {
                    id: entry.id,
                    name: entry.title,
                    title: entry.title,
                    timestamp: entry.timestamp,
                    isStarred: entry.isStarred,
                    messages: [] 
                },
                onLoadClick: handleLoadClick,
                onStarClick: handleStarClick,
                onDeleteClick: handleDeleteClick,
                onRenameSubmit: handleRenameSubmit,
                onDownloadClick: handleDownloadClick,
                onShareClick: handleShareClick,
                onPreviewClick: handlePreviewClick
            };
            const itemElement = renderHistoryItemComponent(props);
            if (itemElement) {
                historyListElement.appendChild(itemElement);
            }
        });
    }
    console.log("[HistoryPopupController] History list rendered.");
}

async function showPopup() { 
    if (!isInitialized || !historyPopupElement || !requestDbAndWaitFunc) return;
    console.log("[Trace][HistoryPopupController] showPopup: Requesting all sessions...");
    try {
        const sessionsArray = await requestDbAndWaitFunc(new DbGetAllSessionsRequest());
        console.log("[Trace][HistoryPopupController] showPopup: Received sessionsArray:", sessionsArray);
        if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
             console.log("[Trace][HistoryPopupController] showPopup: First session item sample:", sessionsArray[0]);
        } else if (sessionsArray === null || sessionsArray === undefined) {
             console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is null or undefined.");
        } else {
             console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is empty or not an array:", typeof sessionsArray);
        }
        currentHistoryItems = sessionsArray || []; 
        console.log(`[Trace][HistoryPopupController] showPopup: Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
        renderHistoryList(); 
        historyPopupElement.classList.remove('hidden');
    } catch (error) {
        console.error("[Trace][HistoryPopupController] showPopup: Error fetching history list:", error);
        showNotification("Failed to load history.", 'error');
        if (historyListElement) {
            historyListElement.innerHTML = '<p class="p-4 text-center text-red-500 dark:text-red-400">Error loading history. Please try again.</p>';
        }
        historyPopupElement.classList.remove('hidden'); 
    }
}

function hidePopup() {
    if (!isInitialized || !historyPopupElement) return;
    console.log("[HistoryPopupController] Hiding popup.");
    historyPopupElement.classList.add('hidden');
}

function handleSearchInput(event) {
    if (!isInitialized) return;
    currentSearchTerm = event.target.value.trim();
    renderHistoryList(); 
}


async function handleLoadClick(sessionId) {
    console.log(`[HistoryPopupController] Load clicked: ${sessionId}`);
    if (!sessionId) return;
    try {
        await browser.storage.local.set({ lastSessionId: sessionId });
        navigateTo('page-home');
        hidePopup();
    } catch (error) {
        console.error("[HistoryPopupController] Error setting storage or navigating:", error);
        showNotification("Failed to load chat.", 'error');
    }
}

async function handleStarClick(sessionId) {
    if (!sessionId || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
    try {
        await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
        showNotification("Star toggled", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error toggling star:", error);
        showNotification(`Failed to toggle star: ${error.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId, itemElement) {
    if (!sessionId || !itemElement || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Delete confirmed inline for: ${sessionId}. Applying deleting state.`);
    
    itemElement.classList.add('is-deleting'); 
    itemElement.querySelectorAll('button').forEach(btn => btn.disabled = true);

    const footer = itemElement.querySelector('.card-footer');
    const existingMsg = footer?.querySelector('.deleting-message'); 
    if (footer && !existingMsg) { 
        const deletingMsg = document.createElement('span');
        deletingMsg.textContent = 'Deleting...';
        deletingMsg.className = 'text-xs text-red-500 ml-2 deleting-message';
        footer.appendChild(deletingMsg);
    }

    try {
        await requestDbAndWaitFunc(new DbDeleteSessionRequest(sessionId));
        showNotification("Chat deletion initiated...", 'info'); 
    } catch (error) {
        console.error("[HistoryPopupController] Error deleting chat:", error);
        showNotification(`Failed to delete chat: ${error.message}`, 'error');
        itemElement.classList.remove('is-deleting'); 
        itemElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        footer?.querySelector('.deleting-message')?.remove();
        const normalActionsContainer = itemElement.querySelector('[data-normal-container]');
        if(normalActionsContainer) normalActionsContainer.classList.remove('hidden');
        const confirmActionsContainer = itemElement.querySelector('[data-confirm-container]');
        if(confirmActionsContainer) confirmActionsContainer.classList.add('hidden');
    }
}

async function handleRenameSubmit(sessionId, newName) {
    if (!sessionId || !newName || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Rename submitted: ${sessionId} to "${newName}"`);
    try {
        await requestDbAndWaitFunc(new DbRenameSessionRequest(sessionId, newName));
        showNotification("Rename successful", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error submitting rename:", error);
        showNotification(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {
    if (requestDbAndWaitFunc) {
        initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotification);
    } else {
        console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
        showNotification("Download failed: Internal setup error.", 'error');
    }
}

function handleShareClick(sessionId) {
   
}

async function handlePreviewClick(sessionId, contentElement) {
    if (!sessionId || !contentElement || !requestDbAndWaitFunc) {
        console.error("[HistoryPopupController] Preview failed: Missing sessionId, contentElement, or requestDbAndWaitFunc.");
        return;
    }
    
    console.log(`[HistoryPopupController] Handling preview click for: ${sessionId}`);
    contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 italic text-xs">Loading preview...</span>'; 

    try {
        const sessionData = await requestDbAndWaitFunc(new DbGetSessionRequest(sessionId));
        
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">No messages in this chat.</span>';
            return;
        }

        const messagesToPreview = sessionData.messages.slice(0, 3);

        const previewHtml = messagesToPreview.map(msg => {
            const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
            const text = (msg.text || '')
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .substring(0, 100) + (msg.text && msg.text.length > 100 ? '...' : '');
            return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
        }).join('');

        contentElement.innerHTML = previewHtml; 

    } catch (error) {
        console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, error);
        contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${error.message}</span>`;
    }
}

document.addEventListener(DbSessionUpdatedNotification.type, (e) => handleSessionUpdate(e.detail));
export function initializeHistoryPopup(elements, requestFunc) {
    console.log("[HistoryPopupController] Entering initializeHistoryPopup...");

    if (!elements || !elements.popupContainer || !elements.listContainer || !elements.searchInput || !elements.closeButton || !requestFunc) {
        console.error("[HistoryPopupController] Initialization failed: Missing required elements or request function.", { elements, requestFunc });
        return null;
    }

    historyPopupElement = elements.popupContainer;
    historyListElement = elements.listContainer;
    historySearchElement = elements.searchInput;
    closeHistoryButtonElement = elements.closeButton;
    requestDbAndWaitFunc = requestFunc;
    console.log("[HistoryPopupController] Elements and request function assigned.");

    try {
        closeHistoryButtonElement.addEventListener('click', hidePopup);
        const debouncedSearchHandler = debounce(handleSearchInput, 300);
        historySearchElement.addEventListener('input', debouncedSearchHandler);
        
        isInitialized = true;
        console.log("[HistoryPopupController] Initialization successful. History will be rendered when popup is shown.");

        return {
            show: showPopup,
            hide: hidePopup
        };
    } catch (error) {
        console.error("[HistoryPopupController] Error during initialization listeners/subscriptions:", error);
        isInitialized = false;
        return null; 
    }
}
