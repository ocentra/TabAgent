import { eventBus } from '../eventBus.js';
import { DbGetStarredSessionsRequest, DbGetStarredSessionsResponse, DbSessionUpdatedNotification, DbToggleStarRequest, DbDeleteSessionRequest, DbRenameSessionRequest, DbGetSessionRequest } from '../events/dbEvents.js';
import { renderHistoryItemComponent } from '../Components/HistoryItem.js'; // Assuming library uses the same component
import { formatChatToHtml, downloadHtmlFile } from '../downloadFormatter.js'; // REMOVE THIS
import { initiateChatDownload } from '../Utilities/downloadUtils.js'; // Path updated to Utilities
import { showNotification } from '../notifications.js'; // Ensure this is imported
import { debounce } from '../Utilities/generalUtils.js'; // Path updated to Utilities
import { navigateTo } from '../navigation.js'; // Added

let isInitialized = false;
let starredListElement = null;
let librarySearchInput = null; // Added
let requestDbAndWaitFunc = null; // Function passed from sidepanel
let currentStarredItems = [];
let currentSearchFilter = ''; // Added
let searchListenerAttached = false; // Flag to attach listener only once

// --- Action Handlers (Migrated from library.js) ---

async function handleStarClick(sessionId) {
    console.log(`[LibraryController] Star clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
        showNotification("Star toggled", 'success');
        // DB event will trigger re-render
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
            // DB event will trigger re-render
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
        // DB event will trigger re-render
    } catch (error) {
        console.error("[LibraryController] Error submitting rename:", error);
        showNotification(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {
    // Delegate the entire logic to the utility function
    // Make sure requestDbAndWaitFunc and showNotification are accessible in this scope
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

// --- Core Logic ---

function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-library') {
        return; // Only act when library page becomes active
    }
    console.log("[LibraryController] Library page activated.");

    // Find search input and attach listener ONCE when page is activated
    if (!searchListenerAttached) {
        librarySearchInput = document.getElementById('library-search');
        if (librarySearchInput) {
            librarySearchInput.addEventListener('input', handleSearchInput);
            searchListenerAttached = true;
            console.log("[LibraryController] Search input listener attached.");
        } else {
            // Log warning if still not found when page is active
            console.warn("[LibraryController] Library search input (#library-search) still not found even when page is active.");
        }
    }
    
    // Fetch fresh data on navigation
    fetchAndRenderLibrary(); 
}

async function fetchAndRenderLibrary() {
    if (!isInitialized || !starredListElement || !requestDbAndWaitFunc) {
        console.error("[LibraryController] Cannot fetch/render - not initialized or missing elements/functions.");
        return;
    }
    console.log("[LibraryController] Fetching starred items...");
    starredListElement.innerHTML = '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">Loading starred items...</p>';
    currentSearchFilter = librarySearchInput?.value.trim() || ''; // Get current filter before fetching

    try {
        const responsePayload = await requestDbAndWaitFunc(new DbGetStarredSessionsRequest());
        // The response *should* just be the array of starred sessions
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []); 
        console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter); // Render with current filter
    } catch (error) {
        console.error("[LibraryController] Error fetching starred items:", error);
        starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
    }
}

// Modified handleSessionUpdate to correctly process DbSessionUpdatedNotification
function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) {
        console.warn("[LibraryController] Invalid session update notification received.", notification);
        return;
    }

    // *** CORRECTED PAYLOAD ACCESS: Use notification.payload.session ***
    const updatedSessionData = notification.payload.session; 
    const sessionId = notification.sessionId;

    if (!updatedSessionData) {
        // This warning should no longer appear if the payload structure is correct now
         console.warn(`[LibraryController] Session update notification for ${sessionId} missing session data in payload.session.`, notification);
         return;
    }
    
    console.log(`[LibraryController] Received session update for ${sessionId}. New starred status: ${updatedSessionData.isStarred}`);

    const itemIndex = currentStarredItems.findIndex(item => item.sessionId === sessionId); // Match using sessionId

    if (updatedSessionData.isStarred) {
        if (itemIndex === -1) {
            // Item is now starred but wasn't in our list, add it (fetch required info)
            console.log(`[LibraryController] Session ${sessionId} is newly starred. Adding to list.`);
             // We only get basic info from the update notification.
             // For consistency, we might need to structure the entry properly.
             // Using the available data for now. A fetch might be better long-term.
             const newItem = {
                 sessionId: sessionId,
                 name: updatedSessionData.title || 'Untitled', // Use title from update if available
                 lastUpdated: updatedSessionData.timestamp || Date.now(), // Use timestamp from update
                 isStarred: true
             };
             currentStarredItems.push(newItem);
        } else {
            // Item was already starred, update its data (e.g., name/timestamp if changed)
            console.log(`[LibraryController] Session ${sessionId} was already starred. Updating data.`);
            currentStarredItems[itemIndex] = {
                ...currentStarredItems[itemIndex], // Keep existing data
                name: updatedSessionData.title || currentStarredItems[itemIndex].name, // Update name if available
                lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated, // Update timestamp
                isStarred: true
            };
        }
    } else {
        // Item is no longer starred
        if (itemIndex !== -1) {
            // Remove it from the list
            console.log(`[LibraryController] Session ${sessionId} is no longer starred. Removing from list.`);
            currentStarredItems.splice(itemIndex, 1);
        } else {
             // Item wasn't starred and isn't in the list anyway. Do nothing.
             console.log(`[LibraryController] Session ${sessionId} is not starred and was not in the list.`);
        }
    }

    // Re-render only if the library page is currently active
    const libraryPage = document.getElementById('page-library');
    if (libraryPage && !libraryPage.classList.contains('hidden')) {
        console.log("[LibraryController] Library page is active, re-rendering list with filter.");
        currentSearchFilter = librarySearchInput?.value.trim() || '';
        renderLibraryList(currentSearchFilter);
    } else {
        console.log("[LibraryController] Library page not active, internal list updated passively.");
    }
}

// Modified to accept filter and pass action handlers
function renderLibraryList(filter = '') {
    if (!isInitialized || !starredListElement) return;
    console.log(`[LibraryController] Rendering with filter "${filter}"`);
    
    let itemsToRender = [...currentStarredItems];

    // Apply filter
    if (filter) {
        const searchTerm = filter.toLowerCase();
        itemsToRender = itemsToRender.filter(entry =>
            (entry.name || '').toLowerCase().includes(searchTerm)
        );
    }

    // Sort (most recent first)
    itemsToRender.sort((a, b) => b.lastUpdated - a.lastUpdated);

    starredListElement.innerHTML = ''; // Clear previous

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
                // Pass migrated action handlers
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

// Added debounced search handler
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

    // Subscribe to navigation changes to know when the page is active
    eventBus.subscribe('navigation:pageChanged', handleNavigationChange);
    console.log("[LibraryController] Subscribed to navigation:pageChanged.");

    // *** ADDED: Subscribe to session updates for passive list maintenance ***
    eventBus.subscribe(DbSessionUpdatedNotification.name, handleSessionUpdate);
    console.log("[LibraryController] Subscribed to DbSessionUpdatedNotification.");

    isInitialized = true;
    console.log("[LibraryController] Initialization successful. Library will render when activated.");

    // No initial fetch here, handled by handleNavigationChange when page activates
    return {
        // Expose methods if needed, e.g., manual refresh?
        // refresh: fetchAndRenderLibrary
    };
} 