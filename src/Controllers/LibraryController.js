import { DbGetStarredSessionsRequest, DbGetStarredSessionsResponse, DbSessionUpdatedNotification, DbToggleStarRequest, DbDeleteSessionRequest, DbRenameSessionRequest, DbGetSessionRequest } from '../events/dbEvents.js';
import { renderHistoryItemComponent } from '../Components/HistoryItem.js';
import { initiateChatDownload } from '../Utilities/downloadUtils.js'; 
import { showNotification } from '../notifications.js'; 
import { debounce } from '../Utilities/generalUtils.js'; 
import { navigateTo } from '../navigation.js'; 
import { UIEventNames } from '../events/eventNames.js'; // Adjust path if necessary

let isInitialized = false;
let starredListElement = null;
let librarySearchInput = null; 
let requestDbAndWaitFunc = null; 
let currentStarredItems = [];
let currentSearchFilter = ''; 
let searchListenerAttached = false; 


async function handleStarClick(sessionId) {
    console.log(`[LibraryController] Star clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
        showNotification("Star toggled", 'success');
    } catch (error) {
        console.error("[LibraryController] Error toggling star:", error);
        showNotification(`Failed to toggle star: ${error.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId) {
    console.log(`[LibraryController] Delete clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
        try {
            await requestDbAndWaitFunc(new DbDeleteSessionRequest(sessionId));
            showNotification("Chat deleted", 'success');
        } catch (error) {
            console.error("[LibraryController] Error deleting chat:", error);
            showNotification(`Failed to delete chat: ${error.message}`, 'error');
        }
    }
}

async function handleRenameSubmit(sessionId, newName) {
    console.log(`[LibraryController] Rename submitted: ${sessionId} to "${newName}"`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new DbRenameSessionRequest(sessionId, newName));
        showNotification("Rename successful", 'success');
    } catch (error) {
        console.error("[LibraryController] Error submitting rename:", error);
        showNotification(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {

    if (requestDbAndWaitFunc) {
        initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotification);
    } else {
        console.error("[LibraryController] Cannot download: requestDbAndWaitFunc not available.");
        showNotification("Download failed: Internal setup error.", 'error');
    }
}

async function handleLoadClick(sessionId) {
    console.log(`[LibraryController] Load clicked: ${sessionId}`);
    try {
        await chrome.storage.local.set({ lastSessionId: sessionId });
        navigateTo('page-home'); 
    } catch (error) {
        console.error("[LibraryController] Error setting storage or navigating:", error);
        showNotification("Failed to load chat.", 'error');
        await chrome.storage.local.remove('lastSessionId');
    }
}

function handleShareClick(sessionId) {
    console.log(`[LibraryController] Share clicked: ${sessionId}`);
    showNotification("Share functionality not yet implemented.", 'info');
}

function handlePreviewClick(sessionId, contentElement) {
    console.log(`[LibraryController] Preview clicked: ${sessionId}`);
    showNotification("Preview functionality not yet implemented.", 'info');
    if (contentElement) {
        contentElement.innerHTML = 'Preview loading...';
        contentElement.classList.toggle('hidden');
    }
}



function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-library') {
        return; 
    }
    console.log("[LibraryController] Library page activated.");

    if (!searchListenerAttached) {
        librarySearchInput = document.getElementById('library-search');
        if (librarySearchInput) {
            librarySearchInput.addEventListener('input', handleSearchInput);
            searchListenerAttached = true;
            console.log("[LibraryController] Search input listener attached.");
        } else {
            console.warn("[LibraryController] Library search input (#library-search) still not found even when page is active.");
        }
    }
    
    fetchAndRenderLibrary(); 
}

async function fetchAndRenderLibrary() {
    if (!isInitialized || !starredListElement || !requestDbAndWaitFunc) {
        console.error("[LibraryController] Cannot fetch/render - not initialized or missing elements/functions.");
        return;
    }
    console.log("[LibraryController] Fetching starred items...");
    starredListElement.innerHTML = '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">Loading starred items...</p>';
    currentSearchFilter = librarySearchInput?.value.trim() || ''; 

    try {
        const responsePayload = await requestDbAndWaitFunc(new DbGetStarredSessionsRequest());
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []); 
        console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter); 
    } catch (error) {
        console.error("[LibraryController] Error fetching starred items:", error);
        starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
    }
}

function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.payload || !notification.payload.session) {
        console.warn("[LibraryController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = updatedSessionData.id;

    if (!updatedSessionData) {
         console.warn(`[LibraryController] Session update notification for ${sessionId} missing session data in payload.session.`, notification);
         return;
    }
    
    console.log(`[LibraryController] Received session update for ${sessionId}. New starred status: ${updatedSessionData.isStarred}`);

    const itemIndex = currentStarredItems.findIndex(item => item.sessionId === sessionId); 

    if (updatedSessionData.isStarred) {
        if (itemIndex === -1) {
            console.log(`[LibraryController] Session ${sessionId} is newly starred. Adding to list.`);

             const newItem = {
                 sessionId: sessionId,
                 name: updatedSessionData.title || 'Untitled', 
                 lastUpdated: updatedSessionData.timestamp || Date.now(), 
                 isStarred: true
             };
             currentStarredItems.push(newItem);
        } else {
            console.log(`[LibraryController] Session ${sessionId} was already starred. Updating data.`);
            currentStarredItems[itemIndex] = {
                ...currentStarredItems[itemIndex], 
                name: updatedSessionData.title || currentStarredItems[itemIndex].name, 
                lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated, 
                isStarred: true
            };
        }
    } else {
        if (itemIndex !== -1) {
            console.log(`[LibraryController] Session ${sessionId} is no longer starred. Removing from list.`);
            currentStarredItems.splice(itemIndex, 1);
        } else {
             console.log(`[LibraryController] Session ${sessionId} is not starred and was not in the list.`);
        }
    }

    const libraryPage = document.getElementById('page-library');
    if (libraryPage && !libraryPage.classList.contains('hidden')) {
        console.log("[LibraryController] Library page is active, re-rendering list with filter.");
        currentSearchFilter = librarySearchInput?.value.trim() || '';
        renderLibraryList(currentSearchFilter);
    } else {
        console.log("[LibraryController] Library page not active, internal list updated passively.");
    }
}

document.addEventListener(UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handleNavigationChange(e.detail));

function renderLibraryList(filter = '') {
    if (!isInitialized || !starredListElement) return;
    console.log(`[LibraryController] Rendering with filter "${filter}"`);
    
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
            if (itemElement) {
                starredListElement.appendChild(itemElement);
            }
        });
    }
     console.log(`[LibraryController] Rendered ${itemsToRender.length} items.`);
}

const handleSearchInput = debounce((event) => {
    if (!isInitialized) return;
    currentSearchFilter = event.target.value.trim();
    console.log(`[LibraryController] Search input changed: "${currentSearchFilter}"`);
    renderLibraryList(currentSearchFilter);
}, 300);

export function initializeLibraryController(elements, requestFunc) {
    console.log("[LibraryController] Initializing...");
    if (!elements || !elements.listContainer || !requestFunc) { // Removed searchInput from mandatory checks here, handled in navigation
        console.error("[LibraryController] Initialization failed: Missing required elements (listContainer) or request function.", { elements, requestFunc });
        return null;
    }

    starredListElement = elements.listContainer;
    requestDbAndWaitFunc = requestFunc;
    console.log("[LibraryController] Elements and request function assigned.");

    isInitialized = true;
    console.log("[LibraryController] Initialization successful. Library will render when activated.");

    return {

    };
} 