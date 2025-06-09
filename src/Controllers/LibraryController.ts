import { DbGetStarredSessionsRequest,
      DbToggleStarRequest,
      DbDeleteSessionRequest,
      DbRenameSessionRequest,
      DbSessionUpdatedNotification
      } from '../DB/dbEvents';
import { renderHistoryItemComponent } from '../Components/HistoryItem';
import { initiateChatDownload } from '../Utilities/downloadUtils'; 
import { showNotification } from '../notifications'; 
import { debounce } from '../Utilities/generalUtils'; 
import { navigateTo } from '../navigation'; 
import { UIEventNames } from '../events/eventNames'; // Adjust path if necessary
import browser from 'webextension-polyfill';

let isInitialized = false;
let starredListElement: HTMLElement | null = null;
let librarySearchInput: HTMLInputElement | null = null;
let requestDbAndWaitFunc: any = null;
let currentStarredItems: any[] = [];
let currentSearchFilter: string = '';
let searchListenerAttached = false;
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_INFO = false;
const prefix = '[LibraryController]';

async function handleStarClick(sessionId: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, `Star clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
        showNotification("Star toggled", 'success');
    } catch (error) {
        const err = error as Error;
        if (LOG_ERROR) console.error(prefix, "Error toggling star:", err);
        showNotification(`Failed to toggle star: ${err.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, `Delete clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
        try {
            await requestDbAndWaitFunc(new DbDeleteSessionRequest(sessionId));
            showNotification("Chat deleted", 'success');
        } catch (error) {
            const err = error as Error;
            if (LOG_ERROR) console.error(prefix, "Error deleting chat:", err);
            showNotification(`Failed to delete chat: ${err.message}`, 'error');
        }
    }
}

async function handleRenameSubmit(sessionId: string, newName: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, `Rename submitted: ${sessionId} to "${newName}"`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new DbRenameSessionRequest(sessionId, newName));
        showNotification("Rename successful", 'success');
    } catch (error) {
        const err = error as Error;
        if (LOG_ERROR) console.error(prefix, "Error submitting rename:", err);
        showNotification(`Failed to rename chat: ${err.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId: string): Promise<void> {

    if (requestDbAndWaitFunc) {
        initiateChatDownload(sessionId, requestDbAndWaitFunc, (msg, type) => showNotification(msg, type as 'info' | 'success' | 'error'));
    } else {
        if (LOG_ERROR) console.error(prefix, "Cannot download: requestDbAndWaitFunc not available.");
        showNotification("Download failed: Internal setup error.", 'error');
    }
}

async function handleLoadClick(sessionId: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, `Load clicked: ${sessionId}`);
    try {
        await browser.storage.local.set({ lastSessionId: sessionId });
        navigateTo('page-home'); 
    } catch (error) {
        const err = error as Error;
        if (LOG_ERROR) console.error(prefix, "Error setting storage or navigating:", err);
        showNotification("Failed to load chat.", 'error');
        await browser.storage.local.remove('lastSessionId');
    }
}

function handleShareClick(sessionId: string): void {
    if (LOG_INFO) console.log(prefix, `Share clicked: ${sessionId}`);
    showNotification("Share functionality not yet implemented.", 'info');
}

function handlePreviewClick(sessionId: string, contentElement: HTMLElement): void {
    if (LOG_INFO) console.log(prefix, `Preview clicked: ${sessionId}`);
    showNotification("Preview functionality not yet implemented.", 'info');
    if (contentElement) {
        contentElement.innerHTML = 'Preview loading...';
        contentElement.classList.toggle('hidden');
    }
}



function handleNavigationChange(event: any): void {
    if (!isInitialized || event?.pageId !== 'page-library') {
        return; 
    }
    if (LOG_INFO) console.log(prefix, "Library page activated.");

    if (!searchListenerAttached) {
        librarySearchInput = document.getElementById('library-search') as HTMLInputElement | null;
        if (librarySearchInput) {
            librarySearchInput.addEventListener('input', handleSearchInput);
            searchListenerAttached = true;
            if (LOG_INFO) console.log(prefix, "Search input listener attached.");
        } else {
            if (LOG_WARN) console.warn(prefix, "Library search input (#library-search) still not found even when page is active.");
        }
    }
    
    fetchAndRenderLibrary(); 
}

async function fetchAndRenderLibrary(): Promise<void> {
    if (!isInitialized || !starredListElement || !requestDbAndWaitFunc) {
        if (LOG_ERROR) console.error(prefix, "Cannot fetch/render - not initialized or missing elements/functions.");
        return;
    }
    if (LOG_INFO) console.log(prefix, "Fetching starred items...");
    starredListElement.innerHTML = '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">Loading starred items...</p>';
    currentSearchFilter = librarySearchInput?.value.trim() || ''; 

    try {
        const responsePayload = await requestDbAndWaitFunc(new DbGetStarredSessionsRequest());
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []); 
        if (LOG_INFO) console.log(prefix, `Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter); 
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, "Error fetching starred items:", error);
        starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
    }
}

function handleSessionUpdate(notification: any): void {
    if (!isInitialized || !notification || !notification.payload || !notification.payload.session) {
        if (LOG_WARN) console.warn(prefix, "Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = updatedSessionData.id;

    if (!updatedSessionData) {
         if (LOG_WARN) console.warn(prefix, `Session update notification for ${sessionId} missing session data in payload.session.`, notification);
         return;
    }
    
    if (LOG_INFO) console.log(prefix, `Received session update for ${sessionId}. New starred status: ${updatedSessionData.isStarred}`);

    const itemIndex = currentStarredItems.findIndex(item => item.sessionId === sessionId); 

    if (updatedSessionData.isStarred) {
        if (itemIndex === -1) {
            if (LOG_INFO) console.log(prefix, `Session ${sessionId} is newly starred. Adding to list.`);

             const newItem = {
                 sessionId: sessionId,
                 name: updatedSessionData.title || 'Untitled', 
                 lastUpdated: updatedSessionData.timestamp || Date.now(), 
                 isStarred: true
             };
             currentStarredItems.push(newItem);
        } else {
            if (LOG_INFO) console.log(prefix, `Session ${sessionId} was already starred. Updating data.`);
            currentStarredItems[itemIndex] = {
                ...currentStarredItems[itemIndex], 
                name: updatedSessionData.title || currentStarredItems[itemIndex].name, 
                lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated, 
                isStarred: true
            };
        }
    } else {
        if (itemIndex !== -1) {
            if (LOG_INFO) console.log(prefix, `Session ${sessionId} is no longer starred. Removing from list.`);
            currentStarredItems.splice(itemIndex, 1);
        } else {
             if (LOG_INFO) console.log(prefix, `Session ${sessionId} is not starred and was not in the list.`);
        }
    }

    const libraryPage = document.getElementById('page-library');
    if (libraryPage && !libraryPage.classList.contains('hidden')) {
        if (LOG_INFO) console.log(prefix, "Library page is active, re-rendering list with filter.");
        currentSearchFilter = librarySearchInput?.value.trim() || '';
        renderLibraryList(currentSearchFilter);
    } else {
        if (LOG_INFO) console.log(prefix, "Library page not active, internal list updated passively.");
    }
}

document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handleNavigationChange((e as CustomEvent).detail));

function renderLibraryList(filter: string = ''): void {
    if (!isInitialized || !starredListElement) return;
    if (LOG_INFO) console.log(prefix, `Rendering with filter "${filter}"`);
    
    let itemsToRender = [...currentStarredItems];

    if (filter) {
        const searchTerm = filter.toLowerCase();
        itemsToRender = itemsToRender.filter(entry =>
            (entry.name || '').toLowerCase().includes(searchTerm)
        );
    }

    itemsToRender.sort((a, b) => b.lastUpdated - a.lastUpdated);

    starredListElement.innerHTML = ''; 

    if (itemsToRender.length === 0) {
        const message = filter
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items match "${filter}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items yet.</p>';
        starredListElement.innerHTML = message;
    } else {
        itemsToRender.forEach(entry => {
            const props = {
                entry: {
                    id: entry.sessionId,
                    name: entry.name,
                    title: entry.name,
                    timestamp: entry.lastUpdated,
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
            if (itemElement && starredListElement) {
                starredListElement.appendChild(itemElement);
            }
        });
    }
     if (LOG_INFO) console.log(prefix, `Rendered ${itemsToRender.length} items.`);
}

const handleSearchInput = debounce((event: any): void => {
    if (!isInitialized) return;
    currentSearchFilter = event.target.value.trim();
    if (LOG_INFO) console.log(prefix, `Search input changed: "${currentSearchFilter}"`);
    renderLibraryList(currentSearchFilter);
}, 300);

export function initializeLibraryController(elements: any, requestFunc: any): any {
    if (LOG_INFO) console.log(prefix, "Initializing...");
    if (!elements || !elements.listContainer || !requestFunc) { // Removed searchInput from mandatory checks here, handled in navigation
        if (LOG_ERROR) console.error(prefix, "Initialization failed: Missing required elements (listContainer) or request function.", { elements, requestFunc });
        return null;
    }

    starredListElement = elements.listContainer;
    requestDbAndWaitFunc = requestFunc;
    if (LOG_INFO) console.log(prefix, "Elements and request function assigned.");

    isInitialized = true;
    if (LOG_INFO) console.log(prefix, "Initialization successful. Library will render when activated.");

    // --- Add event listener for session updates ---
    document.addEventListener(DbSessionUpdatedNotification.type, (e) => handleSessionUpdate((e as CustomEvent).detail));

    return {

    };
} 