// src/Controllers/HistoryPopupController.js

import browser from 'webextension-polyfill';
import { eventBus } from '../eventBus.js';
import { 
    DbGetAllSessionsRequest, DbGetAllSessionsResponse,
    DbToggleStarRequest, DbDeleteSessionRequest, DbRenameSessionRequest, DbGetSessionRequest,
    DbSessionUpdatedNotification 
} from '../events/dbEvents.js';
import { renderHistoryItemComponent } from '../Components/HistoryItem.js';
import { debounce } from '../Utilities/generalUtils.js';
import { showNotification } from '../notifications.js';
import { navigateTo } from '../navigation.js';
import { initiateChatDownload } from '../Utilities/downloadUtils.js';

// --- Module State ---
let isInitialized = false;
let historyPopupElement = null;
let historyListElement = null;
let historySearchElement = null;
let closeHistoryButtonElement = null;
let requestDbAndWaitFunc = null;

let currentHistoryItems = []; // Store the full list locally
let currentSearchTerm = '';
// Add pagination state variables if needed (e.g., currentPage, totalItems)

// --- Private Functions ---

// Handles session updates (e.g., rename, star, delete) triggered by notifications
// Updated to handle single session data in payload
function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) {
        console.warn("[HistoryPopupController] Invalid session update notification received.", notification);
        return;
    }

    // Correctly access the single updated session data
    const updatedSessionData = notification.payload.session; 
    const sessionId = notification.sessionId;
    // Determine update type (optional but useful for future logic)
    const updateType = notification.payload.updateType || 'update'; 

    if (!updatedSessionData) {
        console.warn(`[HistoryPopupController] Session update notification for ${sessionId} missing session data.`, notification);
        return;
    }

    console.log(`[HistoryPopupController] Received session update for ${sessionId}. Type: ${updateType}, New starred: ${updatedSessionData.isStarred}`);

    const itemIndex = currentHistoryItems.findIndex(item => item.id === sessionId); // Find item in the local list

    let listChanged = false;

    if (updateType === 'delete') {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Removing deleted session ${sessionId} from local list.`);
            currentHistoryItems.splice(itemIndex, 1);
            listChanged = true;
        }
    } else {
        // Handle update/create (rename, star, etc.)
        if (itemIndex !== -1) {
            // Item exists, update it
            console.log(`[HistoryPopupController] Updating session ${sessionId} in local list.`);
            currentHistoryItems[itemIndex] = { 
                ...currentHistoryItems[itemIndex], // Preserve existing data
                ...updatedSessionData // Overwrite with new data
            };
            listChanged = true; // Assume data change might affect rendering
        } else {
            // Item doesn't exist locally, add it (e.g., could be a new session created elsewhere)
            console.log(`[HistoryPopupController] Adding new/updated session ${sessionId} to local list.`);
            currentHistoryItems.push(updatedSessionData); 
            listChanged = true;
        }
    }

    // Re-render only if the popup is currently visible AND the list actually changed
    if (listChanged && historyPopupElement && !historyPopupElement.classList.contains('hidden')) {
        console.log(`[HistoryPopupController] Popup visible and list changed, calling renderHistoryList()`);
        renderHistoryList(); // Re-render the list with updated data
    } else {
        console.log(`[HistoryPopupController] Popup not visible or list unchanged, skipping renderHistoryList()`);
    }
}

// NEW: Renders the list based on currentHistoryItems and currentSearchTerm
function renderHistoryList() {
    if (!isInitialized || !historyListElement) return;
    console.log(`[HistoryPopupController] Rendering history list (Search: "${currentSearchTerm}")...`);

    // --- Filtering ---
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

    // --- Rendering ---
    historyListElement.innerHTML = ''; // Clear previous items

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
                    messages: [] // Placeholder
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

// Make the function async to handle the await for DB request
async function showPopup() { 
    if (!isInitialized || !historyPopupElement || !requestDbAndWaitFunc) return;
    console.log("[HistoryPopupController] Showing popup. Fetching latest history...");

    try {
        const sessionsArray = await requestDbAndWaitFunc(new DbGetAllSessionsRequest());
        
        console.log("[HistoryPopupController:Debug] Fetched sessionsArray:", sessionsArray); 
        if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
             console.log("[HistoryPopupController:Debug] First session item sample:", sessionsArray[0]);
        } else if (sessionsArray === null || sessionsArray === undefined) {
             console.log("[HistoryPopupController:Debug] sessionsArray is null or undefined.");
        } else {
             console.log("[HistoryPopupController:Debug] sessionsArray is empty or not an array:", typeof sessionsArray);
        }

        currentHistoryItems = sessionsArray || []; 
        console.log(`[HistoryPopupController] Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
        
        renderHistoryList(); 
        historyPopupElement.classList.remove('hidden');
    } catch (error) {
        // Handle errors (e.g., timeout or DB failure)
        console.error("[HistoryPopupController] Error fetching history list:", error);
        showNotification("Failed to load history.", 'error');
        // Display error state in the list area
        if (historyListElement) {
            historyListElement.innerHTML = '<p class="p-4 text-center text-red-500 dark:text-red-400">Error loading history. Please try again.</p>';
        }
        // Still show the popup, but with the error message
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
    renderHistoryList(); // Re-render the list with the new filter
}

// --- Action Handlers (Passed to HistoryItemComponent) ---

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
    
    // --- Apply visual feedback NOW --- 
    // (This logic assumes confirmation already happened via checkmark click)
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
    // --- End visual feedback ---

    try {
        // Proceed with DB deletion
        await requestDbAndWaitFunc(new DbDeleteSessionRequest(sessionId));
        showNotification("Chat deletion initiated...", 'info'); 
        // Item removal relies on DbSessionUpdatedNotification triggering re-render
    } catch (error) {
        console.error("[HistoryPopupController] Error deleting chat:", error);
        showNotification(`Failed to delete chat: ${error.message}`, 'error');
        // Revert UI on error
        itemElement.classList.remove('is-deleting'); 
        itemElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        footer?.querySelector('.deleting-message')?.remove();
        // Show normal actions again (find container or hardcode)
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
    // ... (share handler code) ...
}

async function handlePreviewClick(sessionId, contentElement) {
    if (!sessionId || !contentElement || !requestDbAndWaitFunc) {
        console.error("[HistoryPopupController] Preview failed: Missing sessionId, contentElement, or requestDbAndWaitFunc.");
        return;
    }

    // Check if already visible and loading/loaded (avoids re-fetch on close click)
    // The HistoryItem component itself handles the toggle visibility logic
    // This handler *only* fetches and renders the content when called.
    
    console.log(`[HistoryPopupController] Handling preview click for: ${sessionId}`);
    contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 italic text-xs">Loading preview...</span>'; // Show loading state

    try {
        const sessionData = await requestDbAndWaitFunc(new DbGetSessionRequest(sessionId));
        
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">No messages in this chat.</span>';
            return;
        }

        // Get first 3 messages (or fewer if chat is short)
        const messagesToPreview = sessionData.messages.slice(0, 3);

        // Format messages into simple HTML
        const previewHtml = messagesToPreview.map(msg => {
            const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
            // Basic escaping and truncation
            const text = (msg.text || '')
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .substring(0, 100) + (msg.text && msg.text.length > 100 ? '...' : '');
            return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
        }).join('');

        contentElement.innerHTML = previewHtml; // Inject formatted messages

    } catch (error) {
        console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, error);
        contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${error.message}</span>`;
    }
}

// --- Initialization Function ---

export function initializeHistoryPopup(elements, requestFunc) {
    console.log("[HistoryPopupController] Entering initializeHistoryPopup...");

    if (!elements || !elements.popupContainer || !elements.listContainer || !elements.searchInput || !elements.closeButton || !requestFunc) {
        console.error("[HistoryPopupController] Initialization failed: Missing required elements or request function.", { elements, requestFunc });
        return null;
    }

    // Assign elements and request function
    historyPopupElement = elements.popupContainer;
    historyListElement = elements.listContainer;
    historySearchElement = elements.searchInput;
    closeHistoryButtonElement = elements.closeButton;
    requestDbAndWaitFunc = requestFunc;
    console.log("[HistoryPopupController] Elements and request function assigned.");

    try {
        // Attach listeners
        closeHistoryButtonElement.addEventListener('click', hidePopup);
        const debouncedSearchHandler = debounce(handleSearchInput, 300);
        historySearchElement.addEventListener('input', debouncedSearchHandler);
        console.log("[HistoryPopupController] Event listeners attached.");

        // Subscribe to notifications to passively keep internal list updated
        eventBus.subscribe(DbSessionUpdatedNotification.name, handleSessionUpdate);
        console.log("[HistoryPopupController] Subscribed to DbSessionUpdatedNotification for passive updates.");
        
        isInitialized = true;
        console.log("[HistoryPopupController] Initialization successful. History will be rendered when popup is shown.");

        // Return the controller object with public methods
        return {
            show: showPopup,
            hide: hidePopup
            // No need for refresh if updates are passive and render happens on show
        };
    } catch (error) {
        console.error("[HistoryPopupController] Error during initialization listeners/subscriptions:", error);
        isInitialized = false;
        return null; 
    }
}
