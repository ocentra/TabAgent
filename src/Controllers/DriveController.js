import { showNotification } from '../notifications.js'; // Assuming notifications is in root src
// import { debounce } from '../utils.js'; // Assuming debounce is in a utils file or passed in
import { DbCreateSessionRequest, DbAddMessageRequest } from '../events/dbEvents.js'; // Import necessary events

// --- Constants ---
const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

// --- Module State Variables ---
let driveButton;
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack;
let isDriveOpen = false;
let currentFolderId = 'root';
let currentFolderPath = [{ id: 'root', name: 'Root' }];
let driveFilesCache = {};
let selectedDriveFiles = {};
let isFetchingDriveList = false;
let driveSearchTerm = '';

// Dependencies passed during initialization
let requestDbAndWaitFunc = null; // Renamed from dbFunctionsDep
// let chatRendererDep = null; // Removed dependency
let getActiveChatSessionIdDep = null;
let setActiveChatSessionIdDep = null;
let showNotificationDep = showNotification; // Use imported one by default, can be overridden
let debounceDep = null; // Debounce needs to be passed or imported

// --- Drive Modal Logic ---
function showDriveViewerModal() {
    if (isDriveOpen) return;
    if (!driveViewerModal) {
        console.error("DriveViewerModal element not found.");
        return;
    }
    // TODO: Consider closing other popups like history if needed
    // if (isHistoryOpen) { hideHistoryPopup(); }
    console.log("DriveController: Showing Drive Viewer modal.");
    currentFolderId = 'root';
    currentFolderPath = [{ id: 'root', name: 'Root' }];
    selectedDriveFiles = {};
    driveFilesCache = {};
    driveSearchTerm = '';
    if (driveViewerSearch) driveViewerSearch.value = '';
    updateInsertButtonState();
    renderSelectedFiles();
    fetchAndDisplayViewerFolderContent('root');
    driveViewerModal.classList.remove('hidden');
    isDriveOpen = true;
}

function hideDriveViewerModal() {
    if (!isDriveOpen) return;
    if (!driveViewerModal) return;
    console.log("DriveController: Hiding Drive Viewer modal.");
    driveViewerModal.classList.add('hidden');
    isDriveOpen = false;
    if (driveViewerList) {
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`; // Reset list content on close
    }
}

// --- Drive Item Rendering Logic ---
function getFallbackIcon(mimeType) {
    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
    }
    // Default file icon
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
}

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
        itemElement.className = 'drive-viewer-item flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer'; // Tailwind classes from old code
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
            itemElement.classList.add('selected'); // Add selected style (defined in sidepanel.css)
        }

        // Attach click listener
        itemElement.addEventListener('click', handleDriveItemClick);

        driveViewerList.appendChild(itemElement);
    });
}

// Fetch folder content (includes caching)
function fetchAndDisplayViewerFolderContent(folderId) {
    if (!driveViewerList || isFetchingDriveList) return;

    isFetchingDriveList = true;
    console.log(`DriveController: Fetching Drive content for folder: ${folderId}`);
    updateBreadcrumbs(); // Update breadcrumbs before fetch
    updateHeaderState(); // Update back button state

    // Show loading indicator in list area
    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;

    // Check cache first
    if (driveFilesCache[folderId]) {
        console.log(`DriveController: Using cached content for folder: ${folderId}`);
        renderDriveViewerItems(driveFilesCache[folderId]);
        isFetchingDriveList = false;
        return;
    }

    // If not cached, request from background script
    chrome.runtime.sendMessage({
        type: 'getDriveFileList',
        folderId: folderId
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("DriveController: Error sending getDriveFileList message:", chrome.runtime.lastError.message);
            showNotificationDep(`Error fetching folder content: ${chrome.runtime.lastError.message}`, 'error');
            if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
            isFetchingDriveList = false; // Ensure flag is reset on send error
        } else {
            // Response handled by the main message listener
            console.log(`DriveController: Sent getDriveFileList request for ${folderId}. Waiting for response...`);
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
        console.error("DriveController: Clicked Drive item missing ID or mimeType.");
        return;
    }

    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        // Navigate into folder
        console.log(`DriveController: Navigating into folder: ${itemName} (${itemId})`);
        currentFolderId = itemId;
        currentFolderPath.push({ id: itemId, name: itemName }); // Add to path
        driveSearchTerm = ''; // Clear search term when navigating into folder
        if (driveViewerSearch) driveViewerSearch.value = '';
        fetchAndDisplayViewerFolderContent(itemId);
    } else {
        // Toggle file selection
        console.log(`DriveController: Toggling selection for file: ${itemName} (${itemId})`);
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
        console.error("DriveController: Invalid breadcrumb data.");
        return;
    }
    // Prevent navigating to the current folder via breadcrumb
    if (targetFolderId === currentFolderId) return;

    console.log(`DriveController: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
    // Slice the path array up to and including the clicked index
    currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
    currentFolderId = targetFolderId; // Update current folder ID
    driveSearchTerm = ''; // Clear search term when navigating via breadcrumb
    if (driveViewerSearch) driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(targetFolderId);
}

// Toggle file selection state and UI
function toggleFileSelection(fileId, element, fileData) {
    if (selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        element?.classList.remove('selected');
    } else {
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
    // Find or create the container (assuming it exists per HTML)
    const pillContainer = driveViewerSelectedArea; //.querySelector('.flex-wrap'); // Use the area directly if it has flex-wrap

    if (!pillContainer) {
         console.error("Selected area container not found");
         return;
    }

    // Clear previous pills, but keep the "Selected:" text if it's separate
    // Let's assume the HTML has: <div id="drive-viewer-selected-area"><span>Selected:</span><div class="flex flex-wrap gap-1"></div></div>
    // Target the inner div for pills
    const pillInnerContainer = pillContainer.querySelector('.flex-wrap') || pillContainer; // Adapt selector if needed
    pillInnerContainer.innerHTML = ''; // Clear only pills

    if (selectedIds.length === 0) {
        pillContainer.classList.add('hidden'); // Hide whole area if empty
    } else {
        pillContainer.classList.remove('hidden'); // Show if not empty
        selectedIds.forEach(id => {
            const file = selectedDriveFiles[id];
            const pill = document.createElement('span');
            // Use styling from sidepanel.css (assuming .selected-file-item targets this)
            pill.className = 'selected-file-item'; // Let CSS handle styling

            const iconHtml = file.iconLink ? `<img src="${file.iconLink}" alt="" class="w-3 h-3 mr-1.5">` : '';
            const removeBtnHtml = `<button class="selected-file-remove" data-id="${id}">&times;</button>`;

            pill.innerHTML = `${iconHtml}${file.name} ${removeBtnHtml}`;
            pillInnerContainer.appendChild(pill);

            // Add listener to the remove button *after* appending
            const removeBtn = pill.querySelector('.selected-file-remove');
            removeBtn?.addEventListener('click', handleRemoveSelectedFile);
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
    if (!driveViewerInsert) return;
    const count = Object.keys(selectedDriveFiles).length;
    driveViewerInsert.disabled = count === 0;
    driveViewerInsert.textContent = `Insert (${count})`;
}

// Search Handler (debounced)
let debouncedDriveSearchHandler = null; // Will be set in initialize
function handleDriveSearchInput(event) {
    driveSearchTerm = event.target.value.trim();
    console.log(`DriveController: Filtering Drive items by term: "${driveSearchTerm}"`);
    // Re-render the *currently cached* items with the filter applied
    if (driveFilesCache[currentFolderId]) {
        renderDriveViewerItems(driveFilesCache[currentFolderId]);
    } else {
        // If cache is empty, maybe show specific message
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not loaded or empty.</div>`;
    }
}

// Back button handler
function handleDriveBackButtonClick() {
    if (currentFolderPath.length <= 1) return; // Already at root

    const parentFolder = currentFolderPath[currentFolderPath.length - 2]; // Get the second to last item
    currentFolderPath.pop();
    currentFolderId = parentFolder.id; // Update current folder ID
    console.log(`DriveController: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
    driveSearchTerm = ''; // Clear search term when navigating back
    if (driveViewerSearch) driveViewerSearch.value = '';
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

// --- Background Message Handler ---
function handleBackgroundMessages(message, sender, sendResponse) {
    if (message.type === 'driveFileListResponse') {
        console.log(`DriveController: Handling driveFileListResponse for folder: ${message.folderId}`);
        isFetchingDriveList = false;

        // Check if the modal is still open and focused on the correct folder
        if (!isDriveOpen || message.folderId !== currentFolderId) {
            console.warn(`DriveController: Ignoring driveFileListResponse for folder ${message.folderId}. Current: ${currentFolderId}, IsOpen: ${isDriveOpen}`);
            return false;
        }

        if (message.success && message.files) {
            driveFilesCache[message.folderId] = message.files;
            renderDriveViewerItems(message.files);
        } else {
            const errorMsg = message.error || 'Unknown error fetching files.';
            console.error(`DriveController: Drive file list error for ${message.folderId}: ${errorMsg}`);
            showNotificationDep(`Error fetching folder content: ${errorMsg}`, 'error');
            if (driveViewerList) {
                driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
            }
        }
        return false; // Indicate synchronous handling
    }
    // Return true if other async listeners might handle the message
    return false; // Explicitly return false if not handled here
}

// --- Initialization Function ---
export function initializeDriveController(dependencies) {
    console.log("Initializing DriveController...");

    // Store dependencies
    requestDbAndWaitFunc = dependencies.requestDbAndWaitFunc; // Store the request function
    // chatRendererDep = dependencies.chatRenderer; // Removed dependency
    getActiveChatSessionIdDep = dependencies.getActiveChatSessionId;
    setActiveChatSessionIdDep = dependencies.setActiveChatSessionId;
    if (dependencies.showNotification) showNotificationDep = dependencies.showNotification;
    debounceDep = dependencies.debounce;

    if (!debounceDep) {
        console.error("DriveController requires a debounce function dependency.");
        // Fallback to no debounce?
        debouncedDriveSearchHandler = handleDriveSearchInput;
    } else {
        debouncedDriveSearchHandler = debounceDep(handleDriveSearchInput, 300);
    }


    // --- Select DOM Elements ---
    driveButton = document.getElementById('drive-button');
    driveViewerModal = document.getElementById('drive-viewer-modal');
    driveViewerClose = document.getElementById('drive-viewer-close');
    driveViewerList = document.getElementById('drive-viewer-list');
    driveViewerCancel = document.getElementById('drive-viewer-cancel');
    driveViewerInsert = document.getElementById('drive-viewer-insert');
    driveViewerSearch = document.getElementById('drive-viewer-search');
    driveViewerSelectedArea = document.getElementById('drive-viewer-selected-area'); // Make sure this ID matches HTML
    driveViewerBreadcrumbsContainer = document.getElementById('drive-viewer-breadcrumbs');
    driveViewerBack = document.getElementById('drive-viewer-back');

    // --- Add Event Listeners ---
    const handleDriveButtonClick = (event) => {
        event.stopPropagation(); // Stop the event from bubbling to the document listener that closes popups
        showDriveViewerModal();
    };
    driveButton?.removeEventListener('click', handleDriveButtonClick); // Ensure no duplicates
    driveButton?.addEventListener('click', handleDriveButtonClick);

    driveViewerClose?.addEventListener('click', hideDriveViewerModal);
    driveViewerCancel?.addEventListener('click', hideDriveViewerModal);

    driveViewerInsert?.addEventListener('click', async () => {
        const selectedFilesArray = Object.values(selectedDriveFiles);
        if (selectedFilesArray.length === 0) return;

        let currentSessionId = getActiveChatSessionIdDep();
        let isNewSession = false;

        console.log(`DriveController: Inserting ${selectedFilesArray.length} Drive files. Current session: ${currentSessionId}`);

        const fileNames = selectedFilesArray.map(f => f.name).join(', ');
        const messageText = `📎 Attached Drive files: ${fileNames}`;
        const attachmentMetadata = {
            type: 'drive_attachments',
            files: selectedFilesArray.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, iconLink: f.iconLink }))
        };

        try {
            if (!currentSessionId) {
                isNewSession = true;
                const firstMessage = {
                    sender: 'system', text: messageText, timestamp: Date.now(), isLoading: false, metadata: attachmentMetadata
                };
                 // Use requestDbAndWaitFunc to create the session
                 if (!requestDbAndWaitFunc) {
                     throw new Error("requestDbAndWaitFunc function not provided.");
                 }
                 const createSessionRequest = new DbCreateSessionRequest(firstMessage);
                 const createSessionResponse = await requestDbAndWaitFunc(createSessionRequest);
                 console.log('[DriveController] Received createSessionResponse:', JSON.stringify(createSessionResponse));
                 // *** FIXED how sessionId is extracted - access directly from resolved data object ***
                 currentSessionId = createSessionResponse?.newSessionId;
                 console.log('[DriveController] Extracted currentSessionId:', currentSessionId);
                 if (!currentSessionId) {
                     throw new Error("Failed to create session or get sessionId from response.");
                 }

                 if (setActiveChatSessionIdDep) {
                     setActiveChatSessionIdDep(currentSessionId); // Update global state via callback
                 } else {
                     console.warn("setActiveChatSessionIdDep not provided to DriveController.");
                 }
                console.log(`DriveController: New session ${currentSessionId} created.`);
                // TODO: Trigger history list update if necessary? Maybe via eventBus?
            } else {
                const attachmentMessage = {
                    // messageId is likely generated by the DB worker now, removed from here
                    sender: 'system', text: messageText, timestamp: Date.now(), isLoading: false, metadata: attachmentMetadata
                };
                 // Use requestDbAndWaitFunc to add the message
                 if (!requestDbAndWaitFunc) {
                    throw new Error("requestDbAndWaitFunc function not provided.");
                }
                 const addMessageRequest = new DbAddMessageRequest(currentSessionId, attachmentMessage);
                 await requestDbAndWaitFunc(addMessageRequest); // Pass the request object directly
            }

            // Re-render and cleanup
            // The chatRenderer should update automatically based on DbMessagesUpdatedNotification
            // if (!chatRendererDep?.renderChatSession) {
            //     throw new Error("chatRenderer.renderChatSession not provided.");
            // }
            // await chatRendererDep.renderChatSession(currentSessionId); // Removed explicit render call

            selectedDriveFiles = {};
            renderSelectedFiles();
            updateInsertButtonState();
            hideDriveViewerModal();

        } catch (error) {
            console.error("DriveController: Error adding Drive attachment message:", error);
            showNotificationDep(`Failed to add Drive attachment: ${error.message}`, 'error');
        }
    });

    driveViewerSearch?.addEventListener('input', debouncedDriveSearchHandler); // Use the debounced handler
    driveViewerBack?.addEventListener('click', handleDriveBackButtonClick);

     // Add listener for clicking outside the modal to close it
    document.addEventListener('click', (event) => {
        if (isDriveOpen && driveViewerModal && !driveViewerModal.contains(event.target) && driveButton && !driveButton.contains(event.target)) {
            hideDriveViewerModal();
        }
    });

    // --- Setup Background Message Listener ---
    // Remove previous listener if controller is re-initialized?
    // chrome.runtime.onMessage.removeListener(handleBackgroundMessages); // Might cause issues if other listeners exist
    chrome.runtime.onMessage.addListener(handleBackgroundMessages);

    console.log("DriveController Initialization Complete.");
} 