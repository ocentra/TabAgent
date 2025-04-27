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
    searchChatHistory,
    // Add DB functions needed by handlers
    createChatSession,
    addMessageToChat,
    updateMessageInChat,
    generateMessageId,
    deleteMessageFromChat
} from './db.js'; 
import { initializeNavigation, navigateTo } from './navigation.js'; // Import navigateTo
// REMOVE old home.js import
// import { initializeHomePage, loadAndRenderChat, resetAndShowWelcomeMessage } from './home.js'; 
// --- Import Download functions --- 
import { formatChatToHtml, downloadHtmlFile } from './downloadFormatter.js';
import { showNotification } from './notifications.js'; // Import showNotification

// +++ Import New Modules +++
import * as uiController from './Home/uiController.js';
import * as chatRenderer from './Home/chatRenderer.js';
import * as messageHandler from './Home/messageHandler.js';
import * as fileHandler from './Home/fileHandler.js';
// +++ END Import New Modules +++

// --- Global State ---
let currentTabId = null; 
let activeChatSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;

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

// --- History Rename Logic (Restored) ---

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

// --- END History Rename Logic ---

// --- Moved SVG definition here, outside renderSingleHistoryItem ---
const previewIconSvg = `<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`;
const trashIconSvg = `<svg class="w-4 h-4 action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.8798 20.1818C17.1169 21 15.8356 21 13.2731 21H10.7269C8.16438 21 6.8831 21 6.12019 20.1818C5.35728 19.3671 5.27811 18.0864 5.11973 15.5251L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.5 5.5L16.1733 3.57923C16.0596 2.8469 15.9989 2.48073 15.8184 2.21449C15.638 1.94825 15.362 1.75019 15.039 1.67153C14.7158 1.59286 14.3501 1.59286 13.6186 1.59286H10.3814C9.64993 1.59286 9.28419 1.59286 8.96099 1.67153C8.63796 1.75019 8.36201 1.94825 8.18156 2.21449C8.00111 2.48073 7.9404 2.8469 7.82672 3.57923L7.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
// --- End SVG definitions ---

// Function to render a single history item (extracted for reuse)
export function renderSingleHistoryItem(entry, hidePopupFunc) {
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

    // --- Determine correct star icon source ---
    const starIconSrc = entry.isStarred ? 'icons/StarFilled.png' : 'icons/StarHollow.png';
    // ----------------------------------------

    item.innerHTML = `
        <div class="chat-card bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-3 flex flex-col justify-between min-h-[100px]">
            <div>
                <div class="card-header flex justify-between items-center mb-2">
                    <button data-action="toggle-star" class="action-button history-item-star-toggle ${entry.isStarred ? 'starred' : 'unstarred'}" title="Toggle Star">
                         <!-- Use dynamic src -->
                         <img src="${starIconSrc}" alt="Star" class="w-4 h-4 action-icon-img">
                    </button>
                    <div class="actions flex items-center space-x-1">
                         <button data-action="download-chat" class="action-button" title="Download">
                              <!-- <img src="icons/download-icon-template.svg" alt="Download" class="w-4 h-4 action-icon-img"> Placeholder: Create or find a download icon -->
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 action-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> <!-- Using a fallback SVG icon -->
                         </button>
                         <button data-action="share-chat" class="action-button" title="Share">
                              <img src="icons/broken-link-chain-svgrepo-com.svg" alt="Share" class="w-4 h-4 action-icon-img">
                         </button>
                         <button data-action="delete-chat" class="action-button text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" title="Delete">${trashIconSvg}</button>
                         <button data-action="preview-chat" class="action-button history-item-preview-btn" title="Preview">${previewIconSvg}</button>
                    </div>
                </div>
                <div class="card-body mb-1" data-action="load-chat-body">
                    <div class="history-item-preview font-semibold text-sm truncate" title="${previewText}">${previewText}</div>
                    <input type="text" class="history-item-rename-input w-full text-sm p-1 border rounded" value="${previewText}" style="display: none;"/>
                </div>
                <!-- Hidden Preview Content Area -->
                <div class="history-item-preview-content hidden mt-2 p-2 border-t border-gray-200 dark:border-gray-600 text-xs max-h-24 overflow-y-auto">
                    <!-- Preview messages will be injected here -->
                </div>
            </div>
            <div class="card-footer mt-auto flex justify-between items-center">
                 <span class="history-item-date text-xs text-gray-500 dark:text-gray-400">${formattedDate}</span>
                 <button class="history-item-load-btn text-xs p-0.5 rounded" data-action="load-chat" title="Load Chat"> <!-- Removed hover:bg-* classes -->
                    <img src="icons/Load.png" alt="Load" class="h-6 w-auto"> <!-- Changed h-4 to h-6 -->
                 </button>
            </div>
        </div>
    `;

    // Add rename event listeners (Double-click)
    const previewSpan = item.querySelector('.history-item-preview');
    const renameInput = item.querySelector('.history-item-rename-input');
    if (previewSpan && renameInput) {
        previewSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation(); // Prevent any potential parent handlers
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

    // Add listener specifically to the Load button
    const loadButton = item.querySelector('.history-item-load-btn');
    if (loadButton) {
        loadButton.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent triggering other potential card clicks
            const itemId = item.dataset.id;
            console.log(`Load Button: Load action clicked for ${itemId}`);
            setActiveChatSessionId(itemId); // Set the active session
            await chatRenderer.renderChatSession(itemId);
            if (typeof hidePopupFunc === 'function') {
                hidePopupFunc(); // Call the passed function
            } else {
                console.warn("hidePopupFunc not provided to renderSingleHistoryItem");
            }
        });
    }

    // Update star button appearance based on state
    const starButton = item.querySelector('[data-action="toggle-star"] img');
    if (starButton) {
         // Add logic here if you want to change opacity or filter for starred/unstarred state
         // For now, just using the single star icon provided.
         if (!entry.isStarred) {
            starButton.classList.add('icon-unstarred'); // Add class for potential CSS targeting
         }
    }

    return item;
}

// --- MOVED History Load/Render Logic - Needs state passed or defined inside DOMContentLoaded ---
// REMOVED COMMENTED OUT FUNCTIONS FROM HERE
// ---------------------------------------------------------------------------------------------

// --- Detach Logic (Moved to Global Scope - OK as it uses global activeChatSessionId/currentTabId) ---
async function handleDetach() {
    if (!currentTabId) {
        console.error('Cannot detach: Missing tab ID');
        showError('Cannot detach: Missing tab ID');
        return;
    }
    // --- REMOVED Check for active session --- 
    // Allow detaching even if no session is active (will show welcome in popup)
    const currentSessionId = getActiveChatSessionId(); // Get current session ID (might be null)

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

        // --- MODIFIED: Save Session ID (or null) instead of messages ---
        const storageKey = `detachedSessionId_${currentTabId}`; // Use new key name
        await chrome.storage.local.set({
            [storageKey]: currentSessionId // Save the active session ID (or null)
        });
        console.log(`Sidepanel: Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
        // --- END MODIFICATION ---

        // Create popup
        const popup = await chrome.windows.create({
            url: chrome.runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
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

// --- Session ID Getters/Setters (OK as they use global activeChatSessionId) ---
export function setActiveChatSessionId(sessionId) {
    console.log(`Sidepanel: Setting activeChatSessionId to ${sessionId}`);
    activeChatSessionId = sessionId;
}

function updateActiveSessionId(newId) {
    console.log(`Sidepanel: Updating activeChatSessionId from null to ${newId}`);
    activeChatSessionId = newId;
}

// Ensure this function is defined globally and exported
export function getActiveChatSessionId() {
    return activeChatSessionId; // Access the global variable
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
    const driveButton = document.getElementById('drive-button'); // <<< SELECT driveButton HERE
    // Add other global elements if needed (e.g., settings button if moved from nav)

    // --- ADD: Select Drive Modal Elements Here --- 
    const driveViewerModal = document.getElementById('drive-viewer-modal');
    const driveViewerList = document.getElementById('drive-viewer-list');
    const driveViewerClose = document.getElementById('drive-viewer-close');
    const driveViewerCancel = document.getElementById('drive-viewer-cancel');
    const driveViewerSearch = document.getElementById('drive-viewer-search');
    const driveViewerSelectedArea = document.getElementById('drive-viewer-selected-area');
    const driveViewerBreadcrumbsContainer = document.getElementById('drive-viewer-breadcrumbs');
    const driveViewerBack = document.getElementById('drive-viewer-back');

    // --- State Variables DECLARED INSIDE DOMContentLoaded ---
    let isDriveOpen = false;
    let isHistoryOpen = false;
    const HISTORY_PAGE_SIZE = 10; 
    let currentHistorySkip = 0;    
    let totalHistoryCount = 0;     
    let isLoadingHistory = false;  
    let currentFolderId = 'root'; 
    let currentFolderPath = [{ id: 'root', name: 'Root' }]; 
    let driveFilesCache = {}; 
    let selectedDriveFiles = {}; 
    let isFetchingDriveList = false;
    let driveSearchTerm = ''; 
    // ------------------------------------------------------

    // --- Functions DEFINED INSIDE DOMContentLoaded (can access above state) ---
    
    // --- Drive Modal Logic ---
    function showDriveViewerModal() {
        if (isDriveOpen) return;
        if (!driveViewerModal) return;
        if (isHistoryOpen) { hideHistoryPopup(); }
        console.log("Sidepanel: Showing Drive Viewer modal."); // Changed log prefix
        currentFolderId = 'root';
        currentFolderPath = [{ id: 'root', name: 'Root' }];
        selectedDriveFiles = {};
        driveFilesCache = {};
        driveSearchTerm = '';
        if(driveViewerSearch) driveViewerSearch.value = '';
        updateInsertButtonState(); // Added from home.js logic
        renderSelectedFiles();    // Added from home.js logic
        fetchAndDisplayViewerFolderContent('root');
        driveViewerModal.classList.remove('hidden');
        isDriveOpen = true;
    }

    function hideDriveViewerModal() {
        if (!isDriveOpen) return;
        if (!driveViewerModal) return;
        console.log("Sidepanel: Hiding Drive Viewer modal."); // Changed log prefix
        driveViewerModal.classList.add('hidden');
        isDriveOpen = false;
        if (driveViewerList) {
             driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`; // Reset list content on close
        }
    }

    // --- MOVED Drive Item Rendering Logic ---
    const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'; // Define constant here

    // Render folder items
    function renderDriveViewerItems(items) {
        if (!driveViewerList) return;
        driveViewerList.innerHTML = ''; // Clear previous items

        const searchTermLower = driveSearchTerm.toLowerCase();
        const filteredItems = driveSearchTerm
            ? items.filter(item => item.name.toLowerCase().includes(searchTermLower))
            : items;

        if (!filteredItems || filteredItems.length === 0) {
            driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">${driveSearchTerm ? 'No results found.' : 'Folder is empty.'}</div>`;
            return;
        }

        filteredItems.forEach(item => {
            const isFolder = item.mimeType === GOOGLE_FOLDER_MIME_TYPE;
            const itemElement = document.createElement('div');
            itemElement.className = 'drive-viewer-item flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer';
            itemElement.dataset.id = item.id;
            itemElement.dataset.name = item.name;
            itemElement.dataset.mimeType = item.mimeType;
            itemElement.dataset.iconLink = item.iconLink || ''; // Store icon link

            const iconDiv = document.createElement('div');
            iconDiv.className = 'flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center';
            if (item.iconLink) {
                iconDiv.innerHTML = `<img src="${item.iconLink}" alt="${isFolder ? 'Folder' : 'File'}" class="w-5 h-5">`;
            } else {
                iconDiv.innerHTML = getFallbackIcon(item.mimeType); // Use fallback function
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'flex-grow truncate';
            nameSpan.textContent = item.name;
            nameSpan.title = item.name; // Tooltip for long names

            itemElement.appendChild(iconDiv);
            itemElement.appendChild(nameSpan);

            // Check if the item is selected
            if (selectedDriveFiles[item.id]) {
                itemElement.classList.add('selected'); // Add selected style
            }

            // Attach click listener
            itemElement.addEventListener('click', handleDriveItemClick);

            driveViewerList.appendChild(itemElement);
        });
    }
    // --- END MOVED Drive Item Rendering Logic ---

    // Fetch folder content (includes caching)
    function fetchAndDisplayViewerFolderContent(folderId) {
        if (!driveViewerList || isFetchingDriveList) return;

        isFetchingDriveList = true;
        console.log(`Sidepanel: Fetching Drive content for folder: ${folderId}`);
        updateBreadcrumbs(); // Update breadcrumbs before fetch
        updateHeaderState(); // Update back button state

        // Show loading indicator in list area
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;

        // Check cache first
        if (driveFilesCache[folderId]) {
            console.log(`Sidepanel: Using cached content for folder: ${folderId}`);
            renderDriveViewerItems(driveFilesCache[folderId]);
            isFetchingDriveList = false;
            return;
        }

        // If not cached, request from background script
        chrome.runtime.sendMessage({
            type: 'getDriveFileList',
            folderId: folderId
        }, (response) => {
            // Note: The response handling is now done in the main message listener setup later
            // This function just initiates the request.
            if (chrome.runtime.lastError) {
                console.error("Sidepanel: Error sending getDriveFileList message:", chrome.runtime.lastError.message);
                showError(`Error fetching folder content: ${chrome.runtime.lastError.message}`);
                 if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
                 isFetchingDriveList = false; // Ensure flag is reset on send error
            } else {
                // No immediate processing here, wait for 'driveFileListResponse' message
                console.log(`Sidepanel: Sent getDriveFileList request for ${folderId}. Waiting for response...`);
            }
        });
    }


    // Handle click on folder or file
    function handleDriveItemClick(event) {
        event.stopPropagation(); 
        const itemElement = event.currentTarget;
        const itemId = itemElement.dataset.id;
        const itemName = itemElement.dataset.name;
        const mimeType = itemElement.dataset.mimeType;
        const iconLink = itemElement.dataset.iconLink; 

        if (!itemId || !mimeType) {
            console.error("Sidepanel: Clicked Drive item missing ID or mimeType.");
            return;
        }

        if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
            // Navigate into folder
            console.log(`Sidepanel: Navigating into folder: ${itemName} (${itemId})`);
            currentFolderId = itemId;
            currentFolderPath.push({ id: itemId, name: itemName }); // Add to path
            fetchAndDisplayViewerFolderContent(itemId);
        } else {
            // Toggle file selection
            console.log(`Sidepanel: Toggling selection for file: ${itemName} (${itemId})`);
            toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType: mimeType, iconLink: iconLink });
        }
    }

    // Update breadcrumbs display
    function updateBreadcrumbs() {
        if (!driveViewerBreadcrumbsContainer) return;
        driveViewerBreadcrumbsContainer.innerHTML = '';
        currentFolderPath.forEach((folder, index) => {
            const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? 'span' : 'button');
            crumbElement.textContent = folder.name;
            crumbElement.dataset.id = folder.id; // Store ID for navigation
            crumbElement.dataset.index = index; // Store index for navigation
            if (index < currentFolderPath.length - 1) {
                // Apply button styling and add listener for navigation
                crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer'; // Consider CSS variables
                crumbElement.addEventListener('click', handleBreadcrumbClick);
                const separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.className = 'mx-1 text-gray-400';
                driveViewerBreadcrumbsContainer.appendChild(crumbElement);
                driveViewerBreadcrumbsContainer.appendChild(separator);
            } else {
                // Last element is just text (current folder)
                crumbElement.className = 'font-semibold';
                driveViewerBreadcrumbsContainer.appendChild(crumbElement);
            }
        });
    }

    // Handle clicks on breadcrumb links
    function handleBreadcrumbClick(event) {
        const targetIndex = parseInt(event.currentTarget.dataset.index, 10);
        const targetFolderId = event.currentTarget.dataset.id;

        if (isNaN(targetIndex) || !targetFolderId) {
            console.error("Sidepanel: Invalid breadcrumb data.");
            return;
        }
        // Prevent navigating to the current folder via breadcrumb
        if (targetFolderId === currentFolderId) return;

        console.log(`Sidepanel: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
        // Slice the path array up to and including the clicked index
        currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
        currentFolderId = targetFolderId; // Update current folder ID
        fetchAndDisplayViewerFolderContent(targetFolderId);
    }

    // Toggle file selection state and UI
    function toggleFileSelection(fileId, element, fileData) {
        if (selectedDriveFiles[fileId]) {
            delete selectedDriveFiles[fileId];
            element?.classList.remove('selected');
        } else {
            // Simple selection: just add the file
            selectedDriveFiles[fileId] = fileData;
            element?.classList.add('selected');
        }
        renderSelectedFiles();
        updateInsertButtonState();
    }

    // Render the selected file pills
    function renderSelectedFiles() {
         if (!driveViewerSelectedArea) return;

         const selectedIds = Object.keys(selectedDriveFiles);
         const pillContainer = driveViewerSelectedArea.querySelector('.flex-wrap') || driveViewerSelectedArea; // Use or create container
         pillContainer.innerHTML = ''; // Clear previous pills

         if (selectedIds.length === 0) {
             // Optionally hide the area or show a placeholder text
             driveViewerSelectedArea.classList.add('hidden'); // Hide if empty
         } else {
             driveViewerSelectedArea.classList.remove('hidden'); // Show if not empty
             selectedIds.forEach(id => {
                 const file = selectedDriveFiles[id];
                 const pill = document.createElement('span');
                 // Match styling from home.js diff
                 pill.className = 'selected-file-item inline-flex items-center bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs font-medium mr-2 mb-1 px-2.5 py-0.5 rounded-full';
                 // Add icon if available
                 if (file.iconLink) {
                      pill.innerHTML = `<img src="${file.iconLink}" alt="" class="w-3 h-3 mr-1.5"> ${file.name} `;
                 } else {
                     pill.textContent = file.name + ' '; // Add space before button
                 }

                 const removeBtn = document.createElement('button');
                 removeBtn.className = 'selected-file-remove ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 dark:bg-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600 focus:outline-none';
                 removeBtn.innerHTML = '&times;'; // Simple 'x'
                 removeBtn.dataset.id = id;
                 removeBtn.addEventListener('click', handleRemoveSelectedFile);

                 pill.appendChild(removeBtn);
                 pillContainer.appendChild(pill);
             });
         }
    }

    // Handle removing a selected file via its pill
    function handleRemoveSelectedFile(event) {
        const fileId = event.currentTarget.dataset.id;
        if (fileId && selectedDriveFiles[fileId]) {
            delete selectedDriveFiles[fileId];
            renderSelectedFiles();
            updateInsertButtonState();
            // Deselect in the list if visible
            const listItem = driveViewerList?.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
            listItem?.classList.remove('selected');
        }
    }

    // Update the Insert button state (enabled/disabled, count)
    function updateInsertButtonState() {
         const driveViewerInsert = document.getElementById('drive-viewer-insert'); // Get button inside function
         if (!driveViewerInsert) return;
         const count = Object.keys(selectedDriveFiles).length;
         driveViewerInsert.disabled = count === 0;
         driveViewerInsert.textContent = `Insert (${count})`;
    }

    // Search Handler (debounced)
    const handleDriveSearchInput = debounce((event) => {
        driveSearchTerm = event.target.value.trim();
        console.log(`Sidepanel: Filtering Drive items by term: "${driveSearchTerm}"`);
        // Re-render the *currently cached* items with the filter applied
        if (driveFilesCache[currentFolderId]) {
            renderDriveViewerItems(driveFilesCache[currentFolderId]);
        } else {
            // If cache is empty for current folder (shouldn't normally happen if already loaded)
            // maybe trigger a fetch? Or just show 'loading...'
             driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Enter search term...</div>`;
        }
    }, 300); // 300ms debounce

    // Back button handler
    function handleDriveBackButtonClick() {
        if (currentFolderPath.length <= 1) return; // Already at root

        const parentFolder = currentFolderPath[currentFolderPath.length - 2]; // Get the second to last item
        // Update the path state *before* fetching
        currentFolderPath.pop();
        currentFolderId = parentFolder.id; // Update current folder ID
        console.log(`Sidepanel: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
        fetchAndDisplayViewerFolderContent(parentFolder.id);
    }

    // Update Header State (Back button visibility)
    function updateHeaderState() {
        if (!driveViewerBack) return;
        if (currentFolderPath.length > 1) {
            driveViewerBack.classList.remove('hidden');
        } else {
            driveViewerBack.classList.add('hidden');
        }
    }

    // Generate fallback icon SVG based on mime type
    function getFallbackIcon(mimeType) {
        // Simple fallback logic (copied from home.js diff)
         if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
             return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
         } // TODO: Add more specific mime types (Docs, Sheets, Slides, PDF, Image etc.)
         // Default file icon
         return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
    }

    // --- History Popup Logic (Moved to Global Scope - OK as it uses global vars/funcs defined here or passed in later) ---

    function hideHistoryPopup() {
        if (!isHistoryOpen) return;
        if (!historyPopup) return;
        console.log("Hiding History popup.");
        historyPopup.classList.add('hidden');
        isHistoryOpen = false;
    }
    
    // Function to load and append the next page of history
    async function loadMoreHistoryItems() {
        if (isLoadingHistory) return; // Prevent concurrent loads

        const loadMoreButton = document.getElementById('load-more-history-btn');
        if (loadMoreButton) {
             loadMoreButton.textContent = 'Loading...'; // Indicate loading
             loadMoreButton.disabled = true;
        }
        isLoadingHistory = true;
        console.log(`Sidepanel: Loading more history items. Current skip: ${currentHistorySkip}`);

        try {
            // Calculate the correct skip count for the next page
            // const nextSkip = historyList.querySelectorAll('.history-item').length; // Original calculation
            // Use currentHistorySkip directly as it should represent the count already loaded
             const nextSkip = currentHistorySkip; 
            console.log(`Calculated next skip: ${nextSkip}`); 
            // currentHistorySkip = nextSkip; // Update global skip state - Now updated AFTER successful load

            const historyPage = await loadChatHistoryPaginated(HISTORY_PAGE_SIZE, nextSkip);
            
            if (!historyList) { // Check if historyList exists
                 isLoadingHistory = false;
                 return;
            }

            historyPage.forEach(entry => {
                const itemElement = renderSingleHistoryItem(entry, hideHistoryPopup); // <<< Pass hideHistoryPopup
                historyList.appendChild(itemElement); // Append new items
            });
            
            // Update skip count ONLY after successful load and render
            currentHistorySkip += historyPage.length;
            console.log(`Sidepanel: Updated history skip to: ${currentHistorySkip}`);

            // Update "Load More" button visibility/state
            updateLoadMoreButtonState(historyPage.length); 

        } catch (error) {
            console.error('Sidepanel: Error loading more history items:', error);
            showError('Failed to load more history');
            // Remove button on error
            if (loadMoreButton) loadMoreButton.remove(); 
        } finally {
            isLoadingHistory = false;
            // Re-enable button ONLY if more items might exist (handled by updateLoadMoreButtonState)
            const updatedButton = document.getElementById('load-more-history-btn');
            if(updatedButton) {
                 updatedButton.textContent = 'Load Older Chats';
                 // Disable state is managed by updateLoadMoreButtonState
                 // updatedButton.disabled = false; 
            }
        }
    }

    // Helper to manage the "Load More" button state
    function updateLoadMoreButtonState(loadedCount) {
        const existingButton = document.getElementById('load-more-history-btn');
        if (existingButton) existingButton.remove(); // Remove previous button first

        const currentlyDisplayedCount = historyList?.querySelectorAll('.history-item').length || 0; // Add safe access
        
        console.log(`Updating Load More button: Loaded this page: ${loadedCount}, Displayed total: ${currentlyDisplayedCount}, DB total count: ${totalHistoryCount}`);

        // Show button only if there are potentially more items based on total count
        if (currentlyDisplayedCount < totalHistoryCount) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.id = 'load-more-history-btn';
            loadMoreButton.textContent = 'Load Older Chats';
            loadMoreButton.className = 'load-more-button w-full text-center py-2 mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'; // Add styling classes
            loadMoreButton.addEventListener('click', loadMoreHistoryItems);
            // Append button within the popup structure, e.g., after the history list
            // Ensure history content div exists
            const historyContentDiv = historyPopup?.querySelector('.history-content');
            if (historyContentDiv) {
                 historyContentDiv.appendChild(loadMoreButton);
            } else {
                 console.warn("Could not find .history-content to append load more button.");
            }
        } else {
            console.log("Load More button condition not met or all items loaded.");
        }
    }

    // Render history list (handles initial load and search)
    async function renderHistoryList(filter = '') {
        console.log(`Sidepanel: Rendering history list with filter: "${filter}"`);
        // Ensure historyList is selected and available
        if (!historyList) { 
            console.error("History list element not found, cannot render.");
            return; 
        }
        // Don't block if already loading, just log it
        if (isLoadingHistory) {
            console.log("History is already loading, skipping concurrent render request.");
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
                console.log("Performing history search...");
                currentHistorySkip = 0; // Reset skip for search context
                
                // Perform search using DB function
                const filteredHistory = await searchChatHistory(filter);
                totalHistoryCount = filteredHistory.length; // Update total count based on search results
                
                historyList.innerHTML = ''; // Clear loading indicator

                if (filteredHistory.length === 0) {
                     historyList.innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400">No results for "${filter}"</div>`;
                } else {
                    console.log(`Displaying ${filteredHistory.length} search results.`);
                     // Display ALL filtered results (no pagination for search yet)
                     filteredHistory.forEach(entry => {
                         const itemElement = renderSingleHistoryItem(entry, hideHistoryPopup); // <<< Pass hideHistoryPopup
                         historyList.appendChild(itemElement);
                     });
                     // Do NOT show "Load More" for search results in this implementation
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
                         const itemElement = renderSingleHistoryItem(entry, hideHistoryPopup); // <<< Pass hideHistoryPopup
                         historyList.appendChild(itemElement);
                     });
                     // Update skip count after initial load
                     currentHistorySkip = historyPage.length;
                      console.log(`Sidepanel: Updated history skip after initial load to: ${currentHistorySkip}`);
                     // Add "Load More" button if needed based on total count
                     updateLoadMoreButtonState(historyPage.length); 
                }
                // --- End Initial Load Logic --- //
            }
        } catch (error) {
            console.error('Sidepanel: Error rendering history list:', error);
            historyList.innerHTML = '<div class="p-4 text-center text-red-500">Error loading chat history</div>';
            showError('Failed to render chat history');
        } finally {
             isLoadingHistory = false; // Clear loading flag
        }
    }
    // Other history helpers (loadMoreHistoryItems, updateLoadMoreButtonState) NEED TO BE MOVED/DEFINED HERE
    // const debouncedRenderHistoryList = debounce(renderHistoryList, 300); // Define debounced version here
    const debouncedRenderHistoryList = debounce(renderHistoryList, 300); // Uses the globally defined debounce

    // --- END FUNCTION DEFINITIONS ---


    // 1. Determine Context and Get Tab ID
    const urlParams = new URLSearchParams(window.location.search);
    // let initialMessages = []; // We no longer pass initialMessages directly

    if (urlParams.get('context') === 'popup' && urlParams.has('originalTabId')) {
        isPopup = true;
        originalTabIdFromPopup = parseInt(urlParams.get('originalTabId'), 10);
        currentTabId = originalTabIdFromPopup; 
        console.log(`Sidepanel: Running in POPUP mode for original tab ${currentTabId}`);
        detachButton.style.display = 'none'; // Hide detach in popup
        
        // --- MODIFIED: Load Session ID for Popup --- 
        try {
            const storageKey = `detachedSessionId_${currentTabId}`; // Use the key set during detach
            const result = await chrome.storage.local.get([storageKey]);
            if (result[storageKey]) {
                 const restoredSessionId = result[storageKey];
                 console.log(`Sidepanel: Found detached session ID ${restoredSessionId} for popup (tab ${currentTabId})`);
                 activeChatSessionId = restoredSessionId; // <<< SET the active session ID
                 await chrome.storage.local.remove(storageKey); // Clean up storage
            } else {
                 console.warn(`Sidepanel: No detached session ID found in storage for key ${storageKey}. Popup might not load correctly.`);
                 // Keep activeChatSessionId as null/undefined, maybe show welcome?
            }
        } catch (error) {
            console.error(`Sidepanel: Error loading detached session state for popup:`, error);
        }
        // --- END MODIFICATION ---

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

    // --- MODIFIED: Initialize UI and Handlers using new modules ---
    const dbFunctions = { // Pass DB functions needed by handlers/renderer
        createChatSession,
        addMessageToChat,
        updateMessageInChat,
        generateMessageId,
        deleteMessageFromChat,
        getChatSessionById // Needed by renderer
    };

    const uiElements = uiController.initializeUI({
        onSendMessage: () => {
            const messageText = uiController.getInputValue();
            if (messageText) {
                // Pass the text directly to the message handler
                messageHandler.handleSendMessage(messageText); 
            }
        },
        onAttachFile: () => {
            fileHandler.handleAttachClick(); // Delegate to fileHandler
        }
    });

    if (!uiElements) {
        showError("Failed to initialize UI components.");
        return; // Stop if UI failed
    }

    // Initialize other modules that depend on UI elements or callbacks
    chatRenderer.initializeRenderer(uiElements.chatBody);

    messageHandler.initializeMessageHandler({
        dbFunctions,
        uiController, // Pass the whole module
        chatRenderer, // Pass the whole module
        getActiveSessionIdFunc: getActiveChatSessionId,
        onSessionCreatedCallback: renderHistoryList,
        getCurrentTabIdFunc: () => currentTabId
    });

    fileHandler.initializeFileHandling({
        dbFunctions, // Pass necessary DB functions
        chatRenderer: chatRenderer, // <<< NEW WAY: Pass with correct key
        getActiveSessionIdFunc: getActiveChatSessionId,
        uiController // Pass the UI controller for triggering input click
    });

    // Attach the file input listener directly
    if (uiElements.fileInput) {
         uiElements.fileInput.addEventListener('change', fileHandler.handleFileSelected);
    } else {
         console.warn("File input element not found after UI initialization.");
    }
    
    // Start listening for messages from background/content scripts
    messageHandler.setupBackgroundListeners();
    // --- END Initialize UI and Handlers ---


    // --- Query Selectors (Specific to Sidepanel Structure) ---

    // 4. Initialize the Home Page - PASS THE CALLBACK
    const newChatButton = document.getElementById('new-chat-button'); // Get button reference
    // initializeHomePage(currentTabId, updateActiveSessionId); // REMOVE THIS LINE - Functionality moved to module initializers
    
    // --- MODIFIED: Load correct chat based on activeChatSessionId --- 
    if (activeChatSessionId) {
        console.log(`Sidepanel: Loading initial chat session: ${activeChatSessionId}`);
        // --- MODIFIED: Use new renderer function ---
        await chatRenderer.renderChatSession(activeChatSessionId); 
    } else if (!isPopup) {
        // Only show welcome in side panel if no session ID is active
        // Popups without a session ID might indicate an error or cleared storage
        console.log("Sidepanel: No active session ID found, showing welcome message.");
        // --- MODIFIED: Use new renderer/UI functions ---
        chatRenderer.displayWelcomeMessage();
        if (uiController.checkInitialized()) {
            uiController.enableInput(); // Ensure input is enabled on welcome
            uiController.focusInput();
        }
        // --- END MODIFICATION ---
    } else {
        // If it IS a popup and no session ID was found, log a warning
        console.warn("Sidepanel: Popup context loaded without an active session ID. Showing welcome/error state.");
        // You might want a specific error display here instead of just welcome
        // --- MODIFIED: Use new renderer/UI functions ---
        chatRenderer.displayWelcomeMessage(); 
        if (uiController.checkInitialized()) {
            uiController.enableInput(); 
            uiController.focusInput();
        }
        // --- END MODIFICATION ---
    }
    // --- END MODIFICATION ---

    // 5. Setup Global Event Listeners (using functions defined above)
    historyButton?.addEventListener('click', async () => {
        console.log(`[HistoryBtn] Clicked. isHistoryOpen: ${isHistoryOpen}, isDriveOpen: ${isDriveOpen}`); // Log initial state
        // Use state variable to check if hidden
        if (!isHistoryOpen) {
            // **CORRECTED**: Close Drive if open
            if (isDriveOpen) { 
                console.log("[HistoryBtn] Drive is open, attempting to hide."); // Log before hide call
                hideDriveViewerModal();
            }
            // Show History
            console.log('[HistoryBtn] Proceeding to show history.'); // Log before show
            historySearch.value = ''; // Clear search on open
            try {
                await renderHistoryList(); 
                console.log("[HistoryBtn] Removing hidden class from historyPopup."); // Log before class remove
                historyPopup?.classList.remove('hidden');
                isHistoryOpen = true; // Set state AFTER showing
                console.log(`[HistoryBtn] State set. isHistoryOpen: ${isHistoryOpen}`); // Log state change
            } catch (error) { /* Error handled in renderHistoryList */ }
        } else {
            // Hide History
            console.log("[HistoryBtn] History is open, hiding."); // Log hide action
            hideHistoryPopup();
        }
    });

    closeHistoryButton?.addEventListener('click', () => {
        // Use the dedicated hide function
        hideHistoryPopup();
    });

    // --- MOVED: Listener for clicking outside popups INSIDE DOMContentLoaded ---
    document.addEventListener('click', (event) => {
        // Use optional chaining and check state variables
        if (isHistoryOpen && historyPopup && !historyPopup.contains(event.target) && historyButton && !historyButton.contains(event.target)) {
            hideHistoryPopup();
        }
        // Use optional chaining and check state variables
        if (isDriveOpen && driveViewerModal && !driveViewerModal.contains(event.target) && driveButton && !driveButton.contains(event.target)) {
             hideDriveViewerModal();
        }
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
        // --- MODIFIED: Use new renderer/UI functions ---
        chatRenderer.displayWelcomeMessage();
        if (uiController.checkInitialized()) {
            uiController.clearInput();
            uiController.enableInput();
            uiController.focusInput();
        }
        // --- END MODIFICATION ---
        navigateTo('page-home'); // Ensure home page is visible
        console.log('Sidepanel: Active session ID reset to null, UI cleared.');
    });
    // --- END NEW CHAT BUTTON LISTENER --- 

    // --- ADD Listeners for File Attachment --- 
    // ... (file attachment listeners) ...

    // --- Google Drive Button Listener --- 
    // Ensure this listener calls showDriveViewerModal
    driveButton?.removeEventListener('click', showDriveViewerModal); // Remove previous direct listener if any
    
    // Use an inline function to call showDriveViewerModal AND stop propagation
    const handleDriveButtonClick = (event) => {
        event.stopPropagation(); // <<< Stop the event from bubbling to the document
        showDriveViewerModal(); 
    };
    driveButton?.removeEventListener('click', handleDriveButtonClick); // Remove if already added
    driveButton?.addEventListener('click', handleDriveButtonClick);

    // Add listeners for Drive Modal's internal close/cancel buttons
    driveViewerClose?.addEventListener('click', hideDriveViewerModal);
    driveViewerCancel?.addEventListener('click', hideDriveViewerModal);

    // --- ADD Drive Insert Button Listener ---
    const driveViewerInsert = document.getElementById('drive-viewer-insert');
    driveViewerInsert?.addEventListener('click', async () => {
        const selectedFiles = Object.values(selectedDriveFiles); // Get array of selected file data
        if (selectedFiles.length === 0) {
            console.warn("Drive Insert clicked, but no files selected.");
            return; // Nothing to insert
        }

        let currentSessionId = getActiveChatSessionId(); // Use let as it might change
        let isNewSession = false;

        console.log(`Inserting ${selectedFiles.length} Drive files. Current session: ${currentSessionId}`);

        // Placeholder message construction
        const fileNames = selectedFiles.map(f => f.name).join(', ');
        const messageText = `📎 Attached Drive files: ${fileNames}`; // Simple text for now
        const attachmentMetadata = {
            type: 'drive_attachments',
            files: selectedFiles.map(f => ({ 
                id: f.id, 
                name: f.name, 
                mimeType: f.mimeType, 
                iconLink: f.iconLink 
            }))
        };

        try {
            // --- Logic to handle new session creation --- 
            if (!currentSessionId) {
                isNewSession = true;
                console.log("No active session, creating a new one for Drive attachment.");
                // Create the first message (the attachment notification itself)
                const firstMessage = {
                    // No messageId needed here, createChatSession might assign one or use its own logic
                    sender: 'system',
                    text: messageText,
                    timestamp: Date.now(),
                    isLoading: false,
                    metadata: attachmentMetadata
                };
                currentSessionId = await dbFunctions.createChatSession(firstMessage);
                setActiveChatSessionId(currentSessionId); // Update global state
                // Ensure renderHistoryList is available in this scope or passed correctly
                if (typeof renderHistoryList === 'function') { 
                    await renderHistoryList(); // Update history list UI
                } else {
                    console.warn('renderHistoryList function not found when creating session from Drive insert.');
                }
                console.log(`New session ${currentSessionId} created.`);
            } else {
                // --- Logic for existing session --- 
                console.log(`Adding attachment message to existing session ${currentSessionId}`);
                const attachmentMessage = {
                    messageId: dbFunctions.generateMessageId(currentSessionId),
                    sender: 'system', 
                    text: messageText,
                    timestamp: Date.now(),
                    isLoading: false,
                    metadata: attachmentMetadata
                };
                await dbFunctions.addMessageToChat(currentSessionId, attachmentMessage);
            }

            // --- Common logic: Re-render and cleanup --- 
            await chatRenderer.renderChatSession(currentSessionId); // Re-render the session (new or existing)

            selectedDriveFiles = {}; // Reset selection state
            renderSelectedFiles();   // Update UI (remove pills)
            updateInsertButtonState(); // Update button (disable, set count to 0)
            hideDriveViewerModal();    // Close the modal

        } catch (error) {
            console.error("Error adding Drive attachment message:", error);
            showError("Failed to add Drive attachment message.");
        }
    });
    // --- END Drive Insert Button Listener ---


    // --- ADD Drive Search/Back Listeners ---
    driveViewerSearch?.addEventListener('input', handleDriveSearchInput); // Use the defined handler
    driveViewerBack?.addEventListener('click', handleDriveBackButtonClick); // Use the defined handler
    // ---------------------------------------

    // 6. Setup Background Message Listener (Needs access to local state/functions)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Sidepanel received message from background:", message);

        if (message.type === 'driveFileListResponse') {
            console.log(`Sidepanel: Handling driveFileListResponse for folder: ${message.folderId}`);
            isFetchingDriveList = false; // <<< Now correctly updates local state

             // Check if the modal is still open and focused on the correct folder
            if (!isDriveOpen || message.folderId !== currentFolderId) {
                console.warn(`Sidepanel: Ignoring driveFileListResponse for folder ${message.folderId}. Current: ${currentFolderId}, IsOpen: ${isDriveOpen}`);
                return false; // Indicate sync handling, no response needed
            }

            if (message.success && message.files) {
                driveFilesCache[message.folderId] = message.files;
                // Call the render function which is now defined in this scope
                renderDriveViewerItems(message.files);
            } else {
                // Show error in the list area
                const errorMsg = message.error || 'Unknown error fetching files.';
                console.error(`Sidepanel: Drive file list error for ${message.folderId}: ${errorMsg}`);
                showError(`Error fetching folder content: ${errorMsg}`); // Show notification
                if (driveViewerList) { // Update UI to show error
                    driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
                }
            }
        }
        // ... (other message types) ...
        return false; // Indicate synchronous handling or no response needed
    });

    console.log("Sidepanel Initialization Complete.");

    // --- Load PrismJS Scripts --- 
    try {
        const prismCore = document.createElement('script');
        prismCore.src = 'assets/prism.js';
        prismCore.onload = () => {
            console.log('Prism Core loaded.');
            // Load JSON component *after* core is loaded
            const prismJson = document.createElement('script');
            prismJson.src = 'assets/prism-json.min.js';
            prismJson.onload = () => console.log('Prism JSON component loaded.');
            prismJson.onerror = () => console.error('Failed to load Prism JSON component.');
            document.body.appendChild(prismJson);
        };
        prismCore.onerror = () => console.error('Failed to load Prism Core.');
        document.body.appendChild(prismCore);
    } catch (e) {
        console.error('Error loading Prism scripts:', e);
    }
    // --------------------------

    // --- Event Listeners for History Actions --- //
    historyList.addEventListener('click', async (e) => {
        const target = e.target;
        // Find the closest BUTTON element first
        const clickedButton = target.closest('button');
        // Then check if the button itself OR its child img was clicked within an action button context
        const actionButton = clickedButton?.closest('[data-action]') || target.closest('[data-action]'); // More robust check

        const historyItem = target.closest('.history-item');

        if (!historyItem) return; // Clicked outside an item

        // --- Prevent actions if already confirming delete, unless it's a confirm/cancel click ---
        const isConfirming = historyItem.classList.contains('is-confirming-delete');
        const action = actionButton ? actionButton.dataset.action : null;
        if (isConfirming && action !== 'confirm-delete' && action !== 'cancel-delete') {
            console.log("Ignoring action while delete confirmation is active.");
            return;
        }
        // -----------------------------------------------------------------------------------

        // If editing, only allow blur/enter/escape on input (handled elsewhere)
        if (historyItem.classList.contains('is-editing')) return;

        const itemId = historyItem.dataset.id;
        if (!itemId) return;

        // const action = actionButton ? actionButton.dataset.action : null; // Moved action definition up

        // --- Handle Specific Actions ---

        // +++ ADD: Handle Confirm Delete Action +++
        if (action === 'confirm-delete') {
            e.stopPropagation();
            console.log(`History: Confirm Delete action clicked for ${itemId}`);
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
                // Optionally restore UI if delete fails? For now, just shows error.
                // Find actions div and restore original buttons might be complex here.
            }
            return; // Handled
        }
        // +++ END: Handle Confirm Delete Action +++

        // +++ ADD: Handle Cancel Delete Action +++
        else if (action === 'cancel-delete') {
            e.stopPropagation();
            console.log(`History: Cancel Delete action clicked for ${itemId}`);
            const actionsDiv = historyItem.querySelector('.actions');
            if (actionsDiv) {
                 // Reconstruct original buttons HTML (ensure SVG vars are accessible)
                 const originalActionsHtml = `
                    <button data-action="download-chat" class="action-button" title="Download">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 action-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    </button>
                    <button data-action="share-chat" class="action-button" title="Share">
                        <img src="icons/broken-link-chain-svgrepo-com.svg" alt="Share" class="w-4 h-4 action-icon-img">
                    </button>
                    <button data-action="delete-chat" class="action-button text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" title="Delete">${trashIconSvg}</button>
                    <button data-action="preview-chat" class="action-button history-item-preview-btn" title="Preview">${previewIconSvg}</button>
                 `;
                 actionsDiv.innerHTML = originalActionsHtml;
            }
            historyItem.classList.remove('is-confirming-delete');
            return; // Handled
        }
        // +++ END: Handle Cancel Delete Action +++

        else if (action === 'toggle-star') {
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
                     // --- ADD: Update image source ---
                     const starImage = starButtonElement.querySelector('img');
                     if (starImage) {
                        starImage.src = updatedItem.isStarred ? 'icons/StarFilled.png' : 'icons/StarHollow.png';
                     }
                     // -----------------------------
                }
                showNotification(updatedItem.isStarred ? 'Chat starred.' : 'Chat unstarred.', 'success', 2000);
            } catch (error) {
                console.error("Star Toggle Error:", error);
                showNotification(`Error starring chat: ${error.message}`, 'error');
            }
            return; // Handled
        }
        // --- MODIFIED: Delete Chat Action ---
        else if (action === 'delete-chat') {
            e.stopPropagation();
            console.log(`History: Delete action clicked for ${itemId}, showing inline confirmation.`);
            // --- REMOVED confirm() call ---
            // if (confirm('Are you sure you want to delete this chat history item?')) { ... }

            // --- ADD Inline Confirmation UI ---
            const actionsDiv = historyItem.querySelector('.actions');
            if (actionsDiv) {
                // Use SVG icons for Yes/No
                actionsDiv.innerHTML = `
                    <!-- Removed <span class='text-xs text-red-600 dark:text-red-400 mr-2 font-semibold flex-grow text-right'>Delete?</span> -->
                    <button data-action='confirm-delete' title="Confirm Delete" class='action-button p-1 rounded bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 ml-auto'> <!-- Added ml-auto -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button data-action='cancel-delete' title="Cancel Delete" class='action-button p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 ml-1'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                `;
            }
            historyItem.classList.add('is-confirming-delete');
            // --- END Inline Confirmation UI ---

            // --- MOVED the actual deletion logic to 'confirm-delete' handler ---
            return; // Handled (shows confirmation)
        }
        // --- END MODIFIED Delete Chat Action ---
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
            // const previewButtonIconContainer = previewButton; // The button itself holds the SVG

            if (!previewContentDiv || !previewButton) return;

            const isPreviewVisible = !previewContentDiv.classList.contains('hidden');
            if (isPreviewVisible) {
                previewContentDiv.classList.add('hidden');
                previewContentDiv.innerHTML = ''; // Clear content
                historyItem.classList.remove('preview-active');
                // Restore original '...' icon using the global variable
                previewButton.innerHTML = previewIconSvg; // <<< FIX: Use the variable
            } else {
                // Hide other open previews
                 document.querySelectorAll('.history-item.preview-active').forEach(item => {
                     const otherPreviewDiv = item.querySelector('.history-item-preview-content');
                     const otherPreviewBtn = item.querySelector('[data-action="preview-chat"]');
                     if (otherPreviewDiv) otherPreviewDiv.classList.add('hidden');
                     item.classList.remove('preview-active');
                      if (otherPreviewBtn) otherPreviewBtn.innerHTML = previewIconSvg; // <<< FIX: Use the variable here too
                 });

                // Show loading state in preview div
                previewContentDiv.innerHTML = '<span class="text-gray-500">Loading preview...</span>';
                previewContentDiv.classList.remove('hidden');
                historyItem.classList.add('preview-active');
                 // Change icon to a close 'X'
                 previewButton.innerHTML = '<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>';

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
                    previewButton.innerHTML = previewIconSvg; // Restore icon on error
                }
            }
            return; // Handled
        }
    });
});