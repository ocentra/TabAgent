// src/Controllers/HistoryPopupController.js

import browser from 'webextension-polyfill';
import { 
    DbGetAllSessionsRequest, 
    DbToggleStarRequest, DbDeleteSessionRequest, DbRenameSessionRequest, DbGetSessionRequest,    
    DbSessionUpdatedNotification,
} from '../DB/dbEvents';
import { renderHistoryItemComponent } from '../Components/HistoryItem';
import { debounce } from '../Utilities/generalUtils';
import { showNotification } from '../notifications';
import { navigateTo } from '../navigation';
import { initiateChatDownload } from '../Utilities/downloadUtils';



let isInitialized = false;
let historyPopupElement: HTMLElement | null = null;
let historyListElement: HTMLElement | null = null;
let historySearchElement: HTMLInputElement | null = null;
let closeHistoryButtonElement: HTMLElement | null = null;
let requestDbAndWaitFunc: any = null;

let currentHistoryItems: any[] = [];
let currentSearchTerm: string = '';

function handleSessionUpdate(notification: any): void {
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

function renderHistoryList(): void {
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
            if (itemElement && historyListElement) {
                historyListElement.appendChild(itemElement);
            }
        });
    }
    console.log("[HistoryPopupController] History list rendered.");
}

async function showPopup(): Promise<void> { 
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

function hidePopup(): void {
    if (!isInitialized || !historyPopupElement) return;
    console.log("[HistoryPopupController] Hiding popup.");
    historyPopupElement.classList.add('hidden');
}

function handleSearchInput(event: any): void {
    if (!isInitialized) return;
    currentSearchTerm = event.target.value.trim();
    renderHistoryList(); 
}


async function handleLoadClick(sessionId: string): Promise<void> {
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

async function handleStarClick(sessionId: string): Promise<void> {
    if (!sessionId || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
    try {
        await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
        showNotification("Star toggled", 'success');
    } catch (error) {
        const err = error as Error;
        console.error("[HistoryPopupController] Error toggling star:", err);
        showNotification(`Failed to toggle star: ${err.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId: string, itemElement: HTMLElement): Promise<void> {
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
        const err = error as Error;
        console.error("[HistoryPopupController] Error deleting chat:", err);
        showNotification(`Failed to delete chat: ${err.message}`, 'error');
        itemElement.classList.remove('is-deleting'); 
        itemElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        footer?.querySelector('.deleting-message')?.remove();
        const normalActionsContainer = itemElement.querySelector('[data-normal-container]');
        if(normalActionsContainer) normalActionsContainer.classList.remove('hidden');
        const confirmActionsContainer = itemElement.querySelector('[data-confirm-container]');
        if(confirmActionsContainer) confirmActionsContainer.classList.add('hidden');
    }
}

async function handleRenameSubmit(sessionId: string, newName: string): Promise<void> {
    if (!sessionId || !newName || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Rename submitted: ${sessionId} to "${newName}"`);
    try {
        await requestDbAndWaitFunc(new DbRenameSessionRequest(sessionId, newName));
        showNotification("Rename successful", 'success');
    } catch (error) {
        const err = error as Error;
        console.error("[HistoryPopupController] Error submitting rename:", err);
        showNotification(`Failed to rename chat: ${err.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId: string): Promise<void> {
    if (requestDbAndWaitFunc) {
        initiateChatDownload(sessionId, requestDbAndWaitFunc, (msg, type) => showNotification(msg, type as 'info' | 'success' | 'error'));
    } else {
        console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
        showNotification("Download failed: Internal setup error.", 'error');
    }
}

function handleShareClick(sessionId: string): void {
    console.log(`[HistoryPopupController] Share clicked: ${sessionId}`);
}

async function handlePreviewClick(sessionId: string, contentElement: HTMLElement): Promise<void> {
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

        const previewHtml = messagesToPreview.map((msg: any) => {
            const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
            const text = (msg.text || '')
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .substring(0, 100) + (msg.text && msg.text.length > 100 ? '...' : '');
            return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
        }).join('');

        contentElement.innerHTML = previewHtml; 

    } catch (error) {
        const err = error as Error;
        console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, err);
        contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${err.message}</span>`;
    }
}

document.addEventListener(DbSessionUpdatedNotification.type, (e) => handleSessionUpdate((e as CustomEvent).detail));
export function initializeHistoryPopup(elements: any, requestFunc: any): any {
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
        if (closeHistoryButtonElement) closeHistoryButtonElement.addEventListener('click', hidePopup);
        const debouncedSearchHandler = debounce(handleSearchInput, 300);
        if (historySearchElement) historySearchElement.addEventListener('input', debouncedSearchHandler);
        
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
