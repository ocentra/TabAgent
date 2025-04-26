// Main entry point for sidepanel logic

// Import initializers and shared functions
// Import all needed DB functions
import { 
    dbInitializationPromise, 
    loadAllChatHistory, 
    getChatSessionById, 
    toggleItemStarred, 
    deleteHistoryItem, 
    renameHistoryItem, 
    loadChatHistoryPaginated, // Import new DB function
    getChatHistoryCount,      // Import new DB function
    deleteChatSession,
    starChatSession,
    searchChatHistory
} from './db.js'; 
import { initializeNavigation, navigateTo } from './navigation.js'; // Import navigateTo
import { initializeHomePage, loadAndRenderChat, resetAndShowWelcomeMessage, resetChatUI } from './home.js'; // Import state/render
// --- Import Download functions --- 
import { formatChatToHtml, downloadHtmlFile } from './downloadFormatter.js';
import { showNotification } from './notifications.js'; // Import showNotification

// --- Global State ---
let currentTabId = null; 
let activeChatSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
const HISTORY_PAGE_SIZE = 10; // How many items to load per page
let currentHistorySkip = 0;    // How many items have been skipped so far
let totalHistoryCount = 0;     // Total number of items in the DB
let isLoadingHistory = false;  // Prevent multiple concurrent loads

// --- Global DOM Elements (Header/Popups) ---
let historyButton, historyPopup, closeHistoryButton, historySearch, historyList;
let detachButton; // Make detach button global too

// --- Global Utility Functions ---
// Debounce function (can be shared)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Error display (can be shared)
function showError(message) {
    console.error("UI Error:", message); // Log error
    const errorDiv = document.createElement('div');
    // Simple styling for now, replace or enhance as needed
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'red'; // Consider using CSS vars
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '100';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// --- History Rename Logic ---

export function startEditing(historyItemElement) {
    if (!historyItemElement) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');

    if (!previewSpan || !renameInput) return;

    historyItemElement.classList.add('is-editing');
    previewSpan.style.display = 'none';
    renameInput.style.display = 'block'; // Use block or inline-block as appropriate
    renameInput.value = previewSpan.textContent; // Use textContent to get the displayed title
    renameInput.focus();
    renameInput.select(); // Select text for easy replacement
}

export async function finishEditing(historyItemElement, itemId, isCancel = false) {
    if (!historyItemElement || !itemId) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');

    if (!previewSpan || !renameInput) return;

    const newTitle = renameInput.value.trim();
    const originalTitle = previewSpan.textContent; // Get original from preview

    // Only save if not cancelled, title changed, and new title isn't empty
    if (!isCancel && newTitle && newTitle !== originalTitle) {
        try {
            console.log(`Attempting to rename item ${itemId} to "${newTitle}"`);
            await renameHistoryItem(itemId, newTitle);
            previewSpan.textContent = newTitle; // Update preview text
            previewSpan.title = newTitle; // Update tooltip title
            console.log(`Item ${itemId} renamed successfully in UI.`);
        } catch (error) {
            console.error(`Error renaming item ${itemId}:`, error);
            showError(`Failed to rename chat: ${error.message}`);
            // Optionally revert input value or leave it for user to retry
            // renameInput.value = originalTitle; // Revert on error
        }
    } else {
        // If cancelled or title didn't change, ensure input value resets visually if needed
        renameInput.value = previewSpan.textContent; // Ensure input matches preview if cancelled
    }

    // Revert UI state
    renameInput.style.display = 'none';
    previewSpan.style.display = 'block'; // Use block or inline-block as appropriate
    historyItemElement.classList.remove('is-editing');
}

// --- History Popup Logic (Moved to Global Scope) ---

// Function to render a single history item (extracted for reuse)
export function renderSingleHistoryItem(entry) {
    const item = document.createElement('div');
    // Added 'relative' for potential absolute positioning of preview close btn
    item.className = 'history-item group relative mb-2';
    item.dataset.id = entry.id;
    if (entry.isStarred) {
        item.classList.add('starred');
    }
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleString();
    const previewText = entry.title || (entry.messages && entry.messages.length > 0
        ? (entry.messages[0].text || '').substring(0, 50) + '...'
        : 'Empty chat');

    // Trash Icon SVG (Keep inline for hover effect)
    const trashIconSvg = `<svg class="w-4 h-4 action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.8798 20.1818C17.1169 21 15.8356 21 13.2731 21H10.7269C8.16438 21 6.8831 21 6.12019 20.1818C5.35728 19.3671 5.27811 18.0864 5.11973 15.5251L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.5 5.5L16.1733 3.57923C16.0596 2.8469 15.9989 2.48073 15.8184 2.21449C15.638 1.94825 15.362 1.75019 15.039 1.67153C14.7158 1.59286 14.3501 1.59286 13.6186 1.59286H10.3814C9.64993 1.59286 9.28419 1.59286 8.96099 1.67153C8.63796 1.75019 8.36201 1.94825 8.18156 2.21449C8.00111 2.48073 7.9404 2.8469 7.82672 3.57923L7.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    // Preview Icon SVG (Keep inline for icon swapping)
    const previewIconSvg = `<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`;

    item.innerHTML = `
        <div class="chat-card bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-3 flex flex-col justify-between min-h-[100px]">
            <div>
                <div class="card-header flex justify-between items-center mb-2">
                    <button data-action="toggle-star" class="action-button history-item-star-toggle ${entry.isStarred ? 'starred' : 'unstarred'}" title="Toggle Star">
                         <img src="icons/star-alt-svgrepo-com.svg" alt="Star" class="w-4 h-4 action-icon-img">
                    </button>
                    <div class="actions flex items-center space-x-1">
                         <button data-action="download-chat" class="action-button" title="Download">
                              <img src="icons/download-icon-template.svg" alt="Download" class="w-4 h-4 action-icon-img"> <!-- Placeholder: Create or find a download icon -->
                         </button>
                         <button data-action="share-chat" class="action-button" title="Share">
                              <img src="icons/broken-link-chain-svgrepo-com.svg" alt="Share" class="w-4 h-4 action-icon-img">
                         </button>
                         <button data-action="delete-chat" class="action-button text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" title="Delete">${trashIconSvg}</button>
                         <button data-action="preview-chat" class="action-button history-item-preview-btn" title="Preview">${previewIconSvg}</button>
                    </div>
                </div>
                <div class="card-body mb-1 cursor-pointer" data-action="load-chat-body">
                    <div class="history-item-preview font-semibold text-sm truncate" title="${previewText}">${previewText}</div>
                    <input type="text" class="history-item-rename-input w-full text-sm p-1 border rounded" value="${previewText}" style="display: none;"/>
                </div>
                <!-- Hidden Preview Content Area -->
                <div class="history-item-preview-content hidden mt-2 p-2 border-t border-gray-200 dark:border-gray-600 text-xs max-h-24 overflow-y-auto">
                    <!-- Preview messages will be injected here -->
                </div>
            </div>
            <div class="card-footer mt-auto">
                 <span class="history-item-date text-xs text-gray-500 dark:text-gray-400">${formattedDate}</span>
            </div>
        </div>
    `;

    // Add rename event listeners
    const previewSpan = item.querySelector('.history-item-preview');
    const renameInput = item.querySelector('.history-item-rename-input');
    if (previewSpan && renameInput) {
        previewSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation(); // Prevent card body click
            startEditing(item);
        });
        renameInput.addEventListener('blur', () => finishEditing(item, entry.id, false));
        renameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                finishEditing(item, entry.id, false);
            } else if (event.key === 'Escape') {
                 event.preventDefault();
                finishEditing(item, entry.id, true);
            }
        });
    }

    // Add listener to card body for loading chat
    const cardBody = item.querySelector('[data-action="load-chat-body"]');
    if (cardBody) {
        cardBody.addEventListener('click', async () => {
            // Only load if not currently renaming
            if (!item.classList.contains('is-editing')) {
                console.log(`Card Body: Load action clicked for ${itemId}`);
                // Delegate the loading logic (will be handled by the main listener)
                // We just need to ensure this click doesn't get stopped if it's not an action button
            }
        });
    }

    // Update star button appearance based on state
    const starButton = item.querySelector('[data-action="toggle-star"] img');
    if (starButton) {
         // Add logic here if you want to change opacity or filter for starred/unstarred state
         // For now, just using the single star icon provided.
         // Example: starButton.style.opacity = entry.isStarred ? '1' : '0.5';
         if (!entry.isStarred) {
            starButton.classList.add('icon-unstarred'); // Add class for potential CSS targeting
         }
    }

    return item;
}

// NEW: Function to load and append the next page of history
async function loadMoreHistoryItems() {
    if (isLoadingHistory) return; // Prevent concurrent loads
    
    const loadMoreButton = document.getElementById('load-more-history-btn');
    if (loadMoreButton) {
         loadMoreButton.textContent = 'Loading...'; // Indicate loading
         loadMoreButton.disabled = true;
    }
    isLoadingHistory = true;
    console.log(`Global: Loading more history items. Current skip: ${currentHistorySkip}`);

    try {
        // Calculate the correct skip count for the next page
        const nextSkip = historyList.querySelectorAll('.history-item').length;
        console.log(`Calculated next skip: ${nextSkip}`); 
        currentHistorySkip = nextSkip; // Update global skip state

        const historyPage = await loadChatHistoryPaginated(HISTORY_PAGE_SIZE, currentHistorySkip);
        
        if (!historyList) return;

        historyPage.forEach(entry => {
            const itemElement = renderSingleHistoryItem(entry);
            historyList.appendChild(itemElement); // Append new items
        });
        
        // Update "Load More" button visibility/state
        updateLoadMoreButtonState(historyPage.length); 

    } catch (error) {
        console.error('Global: Error loading more history items:', error);
        showError('Failed to load more history');
        // Remove button on error
        if (loadMoreButton) loadMoreButton.remove(); 
    } finally {
        isLoadingHistory = false;
        // Re-enable button ONLY if more items might exist (handled by updateLoadMoreButtonState)
        const updatedButton = document.getElementById('load-more-history-btn');
        if(updatedButton) {
             updatedButton.textContent = 'Load Older Chats';
             updatedButton.disabled = false; // Re-enable if it still exists
        }
    }
}

// NEW: Helper to manage the "Load More" button state
function updateLoadMoreButtonState(loadedCount) {
    const existingButton = document.getElementById('load-more-history-btn');
    if (existingButton) existingButton.remove(); // Remove previous button first

    const currentlyDisplayedCount = historyList.querySelectorAll('.history-item').length;
    
    console.log(`Updating Load More button: Loaded this page: ${loadedCount}, Displayed total: ${currentlyDisplayedCount}, DB total count: ${totalHistoryCount}`);

    // Show button only if we loaded a full page AND there are potentially more items based on total count
    if (loadedCount === HISTORY_PAGE_SIZE && currentlyDisplayedCount < totalHistoryCount) {
        const loadMoreButton = document.createElement('button');
        loadMoreButton.id = 'load-more-history-btn';
        loadMoreButton.textContent = 'Load Older Chats';
        loadMoreButton.className = 'load-more-button w-full text-center py-2 mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'; // Add styling classes
        loadMoreButton.addEventListener('click', loadMoreHistoryItems);
        // Append button within the popup structure, e.g., after the history list
        historyPopup.querySelector('.history-content').appendChild(loadMoreButton);
    } else {
        console.log("Load More button condition not met or all items loaded.");
    }
}

// MODIFIED: Render history list (handles initial load and search)
async function renderHistoryList(filter = '') {
    console.log(`Global: Rendering history list with filter: "${filter}"`);
    if (!historyList || isLoadingHistory) { 
        console.log("History list not found or already loading, skipping render.");
        return; 
    }

    isLoadingHistory = true; // Set loading flag
    const isSearch = filter.trim() !== '';
    const loadMoreButton = document.getElementById('load-more-history-btn');
    if (loadMoreButton) loadMoreButton.remove(); // Remove button during initial load/search

    historyList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>'; // Show loading indicator

    try {
        if (isSearch) {
            // --- Search Logic --- //
            console.log("Performing search...");
            currentHistorySkip = 0; // Reset skip for search context
            // Simple Search: Load ALL, then filter in memory.
            const allHistory = await loadAllChatHistory(); // Using the old function for search simplicity
            totalHistoryCount = allHistory.length; // Update total count for context

            const filteredHistory = allHistory.filter(entry => {
                const title = entry.title || '';
                const searchTerm = filter.toLowerCase();
                // Basic title search
                return title.toLowerCase().includes(searchTerm); 
                // TODO: Consider adding message content search later if needed
            });
            
            historyList.innerHTML = ''; // Clear loading indicator

            if (filteredHistory.length === 0) {
                 historyList.innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400">No results for "${filter}"</div>`;
            } else {
                console.log(`Displaying ${filteredHistory.length} search results.`);
                 // Display ALL filtered results (no pagination for search yet)
                 filteredHistory.forEach(entry => {
                     const itemElement = renderSingleHistoryItem(entry);
                     historyList.appendChild(itemElement);
                 });
                 // Do NOT show "Load More" for search results in this simple implementation
            }
            // --- End Search Logic --- //

        } else {
            // --- Initial Load / Load First Page --- //
            console.log("Performing initial history load.");
            currentHistorySkip = 0; // Reset skip count for initial load
            totalHistoryCount = await getChatHistoryCount(); // Get total count from DB
            const historyPage = await loadChatHistoryPaginated(HISTORY_PAGE_SIZE, currentHistorySkip);

            historyList.innerHTML = ''; // Clear loading indicator

            if (totalHistoryCount === 0) {
                 historyList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No chat history found</div>';
            } else {
                console.log(`Displaying first page: ${historyPage.length} of ${totalHistoryCount} items.`);
                 historyPage.forEach(entry => {
                     const itemElement = renderSingleHistoryItem(entry);
                     historyList.appendChild(itemElement);
                 });
                 // Add "Load More" button if needed based on total count
                 updateLoadMoreButtonState(historyPage.length); 
            }
            // --- End Initial Load Logic --- //
        }
    } catch (error) {
        console.error('Global: Error rendering history list:', error);
        historyList.innerHTML = '<div class="p-4 text-center text-red-500">Error loading chat history</div>';
        showError('Failed to render chat history');
    } finally {
         isLoadingHistory = false; // Clear loading flag
    }
}
const debouncedRenderHistoryList = debounce(renderHistoryList, 300);

// --- Detach Logic (Moved to Global Scope) ---
async function handleDetach() {
    if (!currentTabId) {
        console.error('Cannot detach: Missing tab ID');
        showError('Cannot detach: Missing tab ID');
        return;
    }

    // Check if popup already exists
    try {
        const response = await chrome.runtime.sendMessage({ 
            type: 'getPopupForTab', 
            tabId: currentTabId 
        });

        if (response && response.popupId) {
            await chrome.windows.update(response.popupId, { focused: true });
            return; 
        }

        // Save current chat (assuming homeChatMessages reflects current state)
        // TODO: Need a more robust way to get current chat if not on home page?
        // For now, assume we only detach from home
        // await saveCurrentChatToHistory(); // Save function is in db.js now

        // Save state for detached window
        const storageKey = `detachedState_${currentTabId}`;
        await chrome.storage.local.set({
            [storageKey]: JSON.stringify(homeChatMessages) // Use exported state
        });

        // Create popup
        const popup = await chrome.windows.create({
            url: chrome.runtime.getURL(`src/sidepanel.html?context=popup&originalTabId=${currentTabId}`),
            type: 'popup',
            width: 400,
            height: 600
        });

        // Notify background script about the new popup
        if (popup?.id) { 
            await chrome.runtime.sendMessage({ 
                type: 'popupCreated', 
                tabId: currentTabId,
                popupId: popup.id
            });
        } else {
             throw new Error("Failed to create popup window.");
        }

        // Optionally update UI
        // showError('Chat detached to popup window.');

    } catch (error) {
        console.error('Error during detach:', error);
        showError(`Error detaching chat: ${error.message}`); 
    }
}

// --- NEW FUNCTION to set active session ID --- 
export function setActiveChatSessionId(sessionId) {
    console.log(`Sidepanel: Setting activeChatSessionId to ${sessionId}`);
    activeChatSessionId = sessionId;
}

// Function passed to home.js to update ID on creation
function updateActiveSessionId(newId) {
    console.log(`Sidepanel: Updating activeChatSessionId from null to ${newId}`);
    activeChatSessionId = newId;
    // Optionally: Update any UI elements in sidepanel that depend on the ID?
}

// Function to get active session ID
export function getActiveChatSessionId() {
    return activeChatSessionId;
}

// --- DOMContentLoaded --- 
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Sidepanel DOM Loaded. Initializing...");

    // --- Select Global Elements ---
    historyButton = document.getElementById('history-button');
    historyPopup = document.getElementById('history-popup');
    closeHistoryButton = document.getElementById('close-history');
    historySearch = document.getElementById('history-search');
    historyList = document.getElementById('history-list');
    detachButton = document.getElementById('detach-button');
    // Add other global elements if needed (e.g., settings button if moved from nav)

    // 1. Determine Context and Get Tab ID
    const urlParams = new URLSearchParams(window.location.search);
    // let initialMessages = []; // We no longer pass initialMessages directly

    if (urlParams.get('context') === 'popup' && urlParams.has('originalTabId')) {
        isPopup = true;
        originalTabIdFromPopup = parseInt(urlParams.get('originalTabId'), 10);
        currentTabId = originalTabIdFromPopup; 
        console.log(`Sidepanel: Running in POPUP mode for original tab ${currentTabId}`);
        detachButton.style.display = 'none'; // Hide detach in popup
        // TODO: Popups need to load based on session ID too. 
        // For now, popup loading might be broken until detach is refactored.
        // Attempt to load session ID instead of raw messages
        try {
            const storageKey = `detachedState_${currentTabId}`; // Key might need changing
            const result = await chrome.storage.local.get([storageKey]);
            if (result[storageKey]) {
                 console.log(`Sidepanel: Found detached state for popup (tab ${currentTabId})`);
                 // Assuming the stored state is now the sessionId
                 // activeChatSessionId = result[storageKey]; 
                 // OR if it's still messages, need to handle that transition
                 // For now, commenting out popup loading logic until detach is revisited
                 console.warn("Popup loading logic needs refactoring for session IDs.");
                 // initialMessages = JSON.parse(result[storageKey]); 
                 await chrome.storage.local.remove(storageKey); 
            }
        } catch (error) {
            console.error(`Sidepanel: Error loading detached state for popup:`, error);
        }

    } else {
        isPopup = false;
        console.log("Sidepanel: Running in SIDE PANEL mode.");
        try {
            const response = await chrome.runtime.sendMessage({ type: 'getTabId' });
            if (response?.tabId) {
                currentTabId = response.tabId;
                console.log(`Sidepanel: Received currentTabId = ${currentTabId}`);
                detachButton.disabled = false; // Enable detach
            } else {
                console.error("Sidepanel: Could not get tab ID from background.", response);
                detachButton.disabled = true;
            }
        } catch (error) {
            console.error("Sidepanel: Error requesting tab ID:", error);
             detachButton.disabled = true;
        }
    }

    // We no longer strictly need currentTabId for chat session logic, 
    // but keep it for potential future features or context.
    // console.log(`Sidepanel: Using context tab ID: ${currentTabId}`); 

    // --- Log initial HTML class --- 
    console.log(`[SidepanelInit] Initial documentElement className: "${document.documentElement.className}"`);
    // ------------------------------

    // 2. Wait for Database to be Ready
    try {
        console.log("Sidepanel: Waiting for DB initialization...");
        const dbReady = await dbInitializationPromise;
        if (!dbReady) {
            throw new Error("Database initialization failed.");
        }
        console.log("Sidepanel: DB is ready.");
    } catch (error) {
        console.error("Sidepanel: CRITICAL - Error during DB initialization wait:", error);
        showError("Failed to initialize database. History features disabled.");
        // Potentially disable UI elements requiring DB
        historyButton.disabled = true;
        // etc.
        return; // Stop initialization
    }
    
    // 3. Initialize Navigation
    initializeNavigation(); 

    // 4. Initialize the Home Page - PASS THE CALLBACK
    const newChatButton = document.getElementById('new-chat-button'); // Get button reference
    initializeHomePage(currentTabId, updateActiveSessionId); // Pass the function
    if (!activeChatSessionId) {
        resetAndShowWelcomeMessage(); 
    }
    // TODO: Add logic here to load the *last active* session ID from storage if desired.
    

    // 5. Setup Global Event Listeners (History, Detach, NEW CHAT)
    historyButton?.addEventListener('click', async () => {
        const isHidden = historyPopup?.classList.contains('hidden');
        if (isHidden) {
            console.log('Global: Showing history popup.');
            historySearch.value = ''; // Clear search on open
            try {
                // Call renderHistoryList WITHOUT filter for initial load
                await renderHistoryList(); 
                historyPopup?.classList.remove('hidden');
            } catch (error) { /* Error handled in renderHistoryList */ }
        } else {
            console.log('Global: Hiding history popup.');
            historyPopup?.classList.add('hidden');
        }
    });

    closeHistoryButton?.addEventListener('click', () => {
        console.log('Global: Close history button clicked.');
        historyPopup?.classList.add('hidden');
    });

    historySearch?.addEventListener('input', (e) => {
        // Trigger render with the filter value
        debouncedRenderHistoryList(e.target.value.trim());
    });

    detachButton?.addEventListener('click', handleDetach); 

    // --- ADD NEW CHAT BUTTON LISTENER HERE --- 
    newChatButton?.addEventListener('click', () => {
        console.log('Sidepanel: New Chat button clicked.');
        if (activeChatSessionId === null) {
            console.log('Sidepanel: Already in a new chat state.');
            return; // Avoid unnecessary resets if already null
        }
        activeChatSessionId = null; // Reset the active session ID
        resetAndShowWelcomeMessage(); // Call function from home.js to reset UI
        navigateTo('page-home'); // Ensure home page is visible
        console.log('Sidepanel: Active session ID reset to null, UI cleared.');
    });
    // --- END NEW CHAT BUTTON LISTENER --- 

    // Placeholder listeners (can stay here or move to specific page modules if relevant)
    // document.getElementById('drive-button')?.addEventListener('click', () => alert('Google Drive integration coming soon!')); // Handled in home.js now


    // 6. Setup Background Message Listener (Simplified)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Sidepanel received message from background:", message);

        // --- Route messages based on type --- 
        // REMOVE forwarding logic for types handled by home.js
        // Handle only global messages specific to sidepanel if needed
        if (message.type === 'some_other_global_message') {
            // handleGlobalMessage(message);
        } else {
            // Log unhandled messages but don't assume error
             if (message.type !== 'TEMP_SCRAPE_RESULT' && message.type !== 'response' && message.type !== 'error') {
                 console.log("Sidepanel: Received message not handled by sidepanel listener:", message.type);
             }
        }

        return false; // Assume sync handling for now
    });

    console.log("Sidepanel Initialization Complete.");

    // --- Event Listeners for History Actions --- //
    historyList.addEventListener('click', async (e) => {
        const target = e.target;
        // Find the closest BUTTON element first
        const clickedButton = target.closest('button'); 
        // Then check if the button itself OR its child img was clicked within an action button context
        const actionButton = clickedButton?.closest('[data-action]') || target.closest('[data-action]'); // More robust check
        
        const historyItem = target.closest('.history-item');

        if (!historyItem) return; // Clicked outside an item
        // If editing, only allow blur/enter/escape on input (handled elsewhere)
        if (historyItem.classList.contains('is-editing')) return;

        const itemId = historyItem.dataset.id;
        if (!itemId) return;

        const action = actionButton ? actionButton.dataset.action : null;
        
        // --- Handle Specific Actions --- 
        if (action === 'toggle-star') {
            e.stopPropagation();
            console.log(`History: Toggling star for item ${itemId}`);
            try {
                const updatedItem = await toggleItemStarred(itemId);
                historyItem.classList.toggle('starred', updatedItem.isStarred);
                // Update the star button's parent state if needed (e.g., for CSS)
                const starButtonElement = historyItem.querySelector('.history-item-star-toggle'); // Find the button
                if (starButtonElement) {
                     starButtonElement.classList.toggle('starred', updatedItem.isStarred);
                     starButtonElement.classList.toggle('unstarred', !updatedItem.isStarred);
                }
                showNotification(updatedItem.isStarred ? 'Chat starred.' : 'Chat unstarred.', 'success', 2000);
            } catch (error) {
                console.error("Star Toggle Error:", error);
                showNotification(`Error starring chat: ${error.message}`, 'error');
            }
            return; // Handled
        }
        else if (action === 'delete-chat') {
            e.stopPropagation();
            console.log(`History: Delete action clicked for ${itemId}`);
            if (confirm('Are you sure you want to delete this chat history item?')) {
                try {
                    await deleteHistoryItem(itemId);
                    historyItem.remove(); // Remove item from UI
                    totalHistoryCount--; // Decrement total count
                    showNotification('Chat deleted successfully.', 'success');
                    // Check if the list is empty now
                    if (historyList.children.length === 0 && totalHistoryCount === 0) {
                        historyList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">No chat history found</div>';
                    }
                    updateLoadMoreButtonState(0); // Pass 0 to force re-evaluation
                } catch (error) {
                    console.error(`Error deleting item ${itemId}:`, error);
                    showNotification(`Error deleting chat: ${error.message}`, 'error');
                }
            }
            return; // Handled
        }
        else if (action === 'share-chat') {
            e.stopPropagation();
            console.log(`History: Share action clicked for ${itemId}`);
            showNotification('Share functionality coming soon!', 'info', 2000); // Use notification
            return; // Handled
        }
        else if (action === 'download-chat') {
            e.stopPropagation();
            console.log(`History: Download action clicked for ${itemId}`);
            const downloadButton = actionButton; // Use the identified action button
            try {
                const imgElement = downloadButton.querySelector('img');
                const originalSrc = imgElement ? imgElement.src : null; // Store original img src if possible
                downloadButton.innerHTML = '...'; // Simple text loading indicator
                downloadButton.disabled = true;

                const sessionData = await getChatSessionById(itemId);
                if (!sessionData) throw new Error("Chat session not found.");
                const htmlContent = formatChatToHtml(sessionData);
                const safeTitle = (sessionData.title || 'Chat_Session').replace(/[^a-z0-9_\-\.]/gi, '_').replace(/_{2,}/g, '_');
                const filename = `${safeTitle}_${itemId.substring(0, 8)}.html`;
                
                downloadHtmlFile(htmlContent, filename, (errorMessage) => {
                    showNotification(errorMessage, 'error');
                    // Restore button content (check if original was img or svg)
                    if (originalSrc) {
                        downloadButton.innerHTML = `<img src="${originalSrc}" alt="Download" class="w-4 h-4 action-icon-img">`;
                    } else { // Fallback if img wasn't found (shouldn't happen)
                         downloadButton.innerHTML = '↓'; // Or original SVG if kept
                    }
                    downloadButton.disabled = false;
                });
            } catch (error) {
                console.error(`Error preparing download for ${itemId}:`, error);
                showNotification(`Failed to prepare download: ${error.message}`, 'error');
                // Restore button content on error
                const imgElement = downloadButton.querySelector('img'); // Re-find in case innerHTML was cleared
                const originalSrc = imgElement ? imgElement.getAttribute('data-original-src') : null; // Use a data attribute if needed
                // Simplified restore for now:
                 if (downloadButton) {
                      const originalSrcFromCatch = downloadButton.querySelector('img')?.getAttribute('src') || 'icons/download-icon-template.svg'; // Might need better way to store original
                      downloadButton.innerHTML = `<img src="${originalSrcFromCatch}" alt="Download" class="w-4 h-4 action-icon-img">`; // Restore with placeholder/last known src
                      downloadButton.disabled = false;
                 }
            }
            return; // Handled
        }
        else if (action === 'preview-chat') {
            e.stopPropagation();
            console.log(`History: Preview action clicked for ${itemId}`);
            const previewContentDiv = historyItem.querySelector('.history-item-preview-content');
            const previewButton = actionButton; // Use identified action button
            const previewButtonIconContainer = previewButton; // The button itself holds the SVG

            if (!previewContentDiv) return;

            const isPreviewVisible = !previewContentDiv.classList.contains('hidden');
            if (isPreviewVisible) {
                previewContentDiv.classList.add('hidden');
                previewContentDiv.innerHTML = ''; // Clear content
                historyItem.classList.remove('preview-active');
                // Restore original '...' icon
                previewButtonIconContainer.innerHTML = previewIconSvg; // Use the stored SVG string
            } else {
                // Hide other open previews
                 document.querySelectorAll('.history-item.preview-active').forEach(item => {
                     const otherPreviewDiv = item.querySelector('.history-item-preview-content');
                     const otherPreviewBtn = item.querySelector('[data-action="preview-chat"]');
                     if (otherPreviewDiv) otherPreviewDiv.classList.add('hidden');
                     item.classList.remove('preview-active');
                      if (otherPreviewBtn) otherPreviewBtn.innerHTML = previewIconSvg;
                 });

                // Show loading state in preview div
                previewContentDiv.innerHTML = '<span class="text-gray-500">Loading preview...</span>';
                previewContentDiv.classList.remove('hidden');
                historyItem.classList.add('preview-active');
                 // Change icon to a close 'X'
                 previewButtonIconContainer.innerHTML = '<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>';

                try {
                    const session = await getChatSessionById(itemId);
                    if (!session || !session.messages || session.messages.length === 0) {
                        previewContentDiv.innerHTML = '<span class="text-gray-500">No messages in this chat.</span>';
                        return;
                    }
                    const previewMessages = session.messages.slice(0, 3);
                    const previewHtml = previewMessages.map(msg => {
                        const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
                        const text = (msg.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 100) + (msg.text.length > 100 ? '...' : '');
                        return `<div class="preview-message"><span class="preview-sender">${sender}:</span><span>${text}</span></div>`;
                    }).join('');
                    previewContentDiv.innerHTML = previewHtml;
                } catch (error) {
                    console.error("Preview error:", error);
                    previewContentDiv.innerHTML = '<span class="text-red-500">Error loading preview.</span>';
                    previewButtonIconContainer.innerHTML = previewIconSvg; // Restore icon on error
                }
            }
            return; // Handled
        }
        // --- Click on Card Body (for loading chat) ---
        else if (action === 'load-chat-body' || !action) {
            // Ensure it wasn't a click on the rename input happening
             if (target.closest('.history-item-rename-input')) {
                 return;
             }
             console.log(`History: Item body clicked for ${itemId}, loading chat.`);
             if (itemId === activeChatSessionId) {
                 console.log(`Chat ${itemId} already active.`);
                 historyPopup?.classList.add('hidden');
                 return;
             }
             try {
                 setActiveChatSessionId(itemId);
                 await loadAndRenderChat(activeChatSessionId);
                 navigateTo('page-home');
                 historyPopup?.classList.add('hidden');
             } catch (error) {
                 console.error(`Error loading chat ${itemId} from history click:`, error);
                 showNotification(`Failed to load chat: ${error.message}`, 'error');
             }
        }
    });
});