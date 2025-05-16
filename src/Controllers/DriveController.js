import browser from 'webextension-polyfill'; 
import { showNotification } from '../notifications.js';
import { RuntimeMessageTypes } from '../events/eventNames.js';


const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

let driveButton;
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack;
let isDriveOpen = false;
let currentFolderId = 'root';
let currentFolderPath = [{ id: 'root', name: 'Root' }];
let driveFilesCache = {};
let selectedDriveFiles = {};
let isFetchingDriveList = false;
let driveSearchTerm = '';
let showNotificationDep = showNotification; 
let debounceDep = null; 

function showDriveViewerModal() {
    console.log("Attempting to show Drive modal...");
    if (isDriveOpen) return;
    if (!driveViewerModal) {
        console.error("DriveViewerModal element not found.");
        return;
    }

    console.log("DriveController: Showing Drive Viewer modal.");
    currentFolderId = 'root';
    currentFolderPath = [{ id: 'root', name: 'Root' }];
    selectedDriveFiles = {};
    driveFilesCache = {};
    driveSearchTerm = '';
    if (driveViewerSearch) driveViewerSearch.value = '';
    updateInsertButtonState();
    renderSelectedFiles();
    console.log("Fetching root content and making modal visible.");
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


function getFallbackIcon(mimeType) {
    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
}

function renderDriveViewerItems(items) {
    console.log(`[DriveController:Render] renderDriveViewerItems called with ${items?.length ?? 0} items.`); // Log entry
    if (!driveViewerList) return;
    driveViewerList.innerHTML = ''; 

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
        itemElement.dataset.iconLink = item.iconLink || ''; 

        const iconDiv = document.createElement('div');
        iconDiv.className = 'flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center';
        if (item.iconLink) {
            iconDiv.innerHTML = `<img src="${item.iconLink}" alt="${isFolder ? 'Folder' : 'File'}" class="w-5 h-5">`;
        } else {
            iconDiv.innerHTML = getFallbackIcon(item.mimeType); 
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'flex-grow truncate';
        nameSpan.textContent = item.name;
        nameSpan.title = item.name; 

        itemElement.appendChild(iconDiv);
        itemElement.appendChild(nameSpan);

        if (selectedDriveFiles[item.id]) {
            itemElement.classList.add('selected'); 
        }

        itemElement.addEventListener('click', handleDriveItemClick);

        driveViewerList.appendChild(itemElement);
    });
}

function fetchAndDisplayViewerFolderContent(folderId) {
    if (!driveViewerList || isFetchingDriveList) {
        return;
    }

    isFetchingDriveList = true;
    console.log(`DriveController: Fetching Drive content for folder: ${folderId}`);
    updateBreadcrumbs(); 
    updateHeaderState(); 

    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;

    if (driveFilesCache[folderId]) {
        console.log(`DriveController: Using cached content for folder: ${folderId}`);
        renderDriveViewerItems(driveFilesCache[folderId]);
        isFetchingDriveList = false;
        return;
    }

    browser.runtime.sendMessage({
        type: RuntimeMessageTypes.GET_DRIVE_FILE_LIST,
        folderId: folderId
    })
    .then((response) => {
        isFetchingDriveList = false;
        if (response && response.success && response.files) {
            console.log(`[DriveController] Success! Caching and rendering ${response.files.length} files.`);
            driveFilesCache[folderId] = response.files;
            renderDriveViewerItems(response.files);
        } else {
            const errorMsg = response?.error || 'Unknown error fetching files.';
            console.error(`[DriveController] Drive file list error for ${folderId}: ${errorMsg}`);
            showNotificationDep(`Error fetching folder content: ${errorMsg}`, 'error');
            if (driveViewerList) {
                driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
            }
        }
    })
    .catch((error) => {
        isFetchingDriveList = false;
        console.error("[DriveController] Error sending getDriveFileList message:", error?.message || error);
        showNotificationDep(`Error contacting background script: ${error?.message || 'Unknown error'}`, 'error');
        if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
    });
}

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
        console.log(`DriveController: Navigating into folder: ${itemName} (${itemId})`);
        currentFolderId = itemId;
        currentFolderPath.push({ id: itemId, name: itemName }); 
        driveSearchTerm = ''; 
        if (driveViewerSearch) driveViewerSearch.value = '';
        fetchAndDisplayViewerFolderContent(itemId);
    } else {
        console.log(`DriveController: Toggling selection for file: ${itemName} (${itemId})`);
        toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType: mimeType, iconLink: iconLink });
    }
}

function updateBreadcrumbs() {
    if (!driveViewerBreadcrumbsContainer) return;
    driveViewerBreadcrumbsContainer.innerHTML = '';
    currentFolderPath.forEach((folder, index) => {
        const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? 'span' : 'button');
        crumbElement.textContent = folder.name;
        crumbElement.dataset.id = folder.id; 
        crumbElement.dataset.index = index; 
        if (index < currentFolderPath.length - 1) {
            crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer'; 
            crumbElement.addEventListener('click', handleBreadcrumbClick);
            const separator = document.createElement('span');
            separator.textContent = ' / ';
            separator.className = 'mx-1 text-gray-400';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
            driveViewerBreadcrumbsContainer.appendChild(separator);
        } else {
            crumbElement.className = 'font-semibold';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
        }
    });
}

function handleBreadcrumbClick(event) {
    const targetIndex = parseInt(event.currentTarget.dataset.index, 10);
    const targetFolderId = event.currentTarget.dataset.id;

    if (isNaN(targetIndex) || !targetFolderId) {
        console.error("DriveController: Invalid breadcrumb data.");
        return;
    }
    if (targetFolderId === currentFolderId) return;

    console.log(`DriveController: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
    currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
    currentFolderId = targetFolderId; 
    driveSearchTerm = ''; 
    if (driveViewerSearch) driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(targetFolderId);
}

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

function renderSelectedFiles() {
    if (!driveViewerSelectedArea) return;

    const selectedIds = Object.keys(selectedDriveFiles);
    const pillContainer = driveViewerSelectedArea; 

    if (!pillContainer) {
         console.error("Selected area container not found");
         return;
    }

    const pillInnerContainer = pillContainer.querySelector('.flex-wrap') || pillContainer; 
    pillInnerContainer.innerHTML = ''; 

    if (selectedIds.length === 0) {
        pillContainer.classList.add('hidden'); 
    } else {
        pillContainer.classList.remove('hidden');
        selectedIds.forEach(id => {
            const file = selectedDriveFiles[id];
            const pill = document.createElement('span');
            pill.className = 'selected-file-item'; 

            const iconHtml = file.iconLink ? `<img src="${file.iconLink}" alt="" class="w-3 h-3 mr-1.5">` : '';
            const removeBtnHtml = `<button class="selected-file-remove" data-id="${id}">&times;</button>`;

            pill.innerHTML = `${iconHtml}${file.name} ${removeBtnHtml}`;
            pillInnerContainer.appendChild(pill);

            const removeBtn = pill.querySelector('.selected-file-remove');
            removeBtn?.addEventListener('click', handleRemoveSelectedFile);
        });
    }
}


function handleRemoveSelectedFile(event) {
    const fileId = event.currentTarget.dataset.id;
    if (fileId && selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        renderSelectedFiles();
        updateInsertButtonState();
        const listItem = driveViewerList?.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
        listItem?.classList.remove('selected');
    }
}

function updateInsertButtonState() {
    if (!driveViewerInsert) return;
    const count = Object.keys(selectedDriveFiles).length;
    driveViewerInsert.disabled = count === 0;
    driveViewerInsert.textContent = `Insert (${count})`;
}

let debouncedDriveSearchHandler = null;
function handleDriveSearchInput(event) {
    driveSearchTerm = event.target.value.trim();
    console.log(`DriveController: Filtering Drive items by term: "${driveSearchTerm}"`);
    if (driveFilesCache[currentFolderId]) {
        renderDriveViewerItems(driveFilesCache[currentFolderId]);
    } else {
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not loaded or empty.</div>`;
    }
}

function handleDriveBackButtonClick() {
    if (currentFolderPath.length <= 1) return; 

    const parentFolder = currentFolderPath[currentFolderPath.length - 2]; 
    currentFolderPath.pop();
    currentFolderId = parentFolder.id; 
    console.log(`DriveController: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
    driveSearchTerm = ''; 
    if (driveViewerSearch) driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(parentFolder.id);
}

function updateHeaderState() {
    if (!driveViewerBack) return;
    if (currentFolderPath.length > 1) {
        driveViewerBack.classList.remove('hidden');
    } else {
        driveViewerBack.classList.add('hidden');
    }
}

export function initializeDriveController(dependencies) {
    console.log("Initializing DriveController...");

    if (!dependencies || !dependencies.showNotification || !dependencies.debounce) {
        console.error("DriveController requires dependencies: showNotification, debounce!");
        return; 
    }
    showNotificationDep = dependencies.showNotification;
    debounceDep = dependencies.debounce;
    driveButton = document.getElementById('drive-button');
    driveViewerModal = document.getElementById('drive-viewer-modal');
    driveViewerClose = document.getElementById('drive-viewer-close');
    driveViewerList = document.getElementById('drive-viewer-list');
    driveViewerCancel = document.getElementById('drive-viewer-cancel');
    driveViewerInsert = document.getElementById('drive-viewer-insert');
    driveViewerSearch = document.getElementById('drive-viewer-search');
    driveViewerSelectedArea = document.getElementById('drive-viewer-selected');
    driveViewerBreadcrumbsContainer = document.getElementById('drive-viewer-breadcrumbs');
    driveViewerBack = document.getElementById('drive-viewer-back');

    if (!driveViewerModal || !driveViewerList) {
        console.error("DriveController: Essential modal elements (#drive-viewer-modal, #drive-viewer-list) not found!");
        return; 
    }

    if (driveButton) {
        driveButton.addEventListener('click', handleDriveButtonClick);
    }
    if (driveViewerClose) {
        driveViewerClose.addEventListener('click', hideDriveViewerModal);
    }
    if (driveViewerCancel) {
        driveViewerCancel.addEventListener('click', hideDriveViewerModal);
    }
    if (driveViewerInsert) {
        driveViewerInsert.addEventListener('click', () => {
            console.warn("Insert button functionality not yet implemented.");
            // Placeholder: Insert selected files into chat
            // You'll need access to the chat input/send mechanism here
            hideDriveViewerModal();
        });
    }
    if (driveViewerSearch && debounceDep) {
         driveViewerSearch.addEventListener('input', debounceDep(handleDriveSearchInput, 300));
     } else if (driveViewerSearch) {
         console.warn("Debounce dependency missing, search will trigger on every keypress.");
         driveViewerSearch.addEventListener('input', handleDriveSearchInput);
     }
    if (driveViewerBack) {
        driveViewerBack.addEventListener('click', handleDriveBackButtonClick);
    }

    console.log("DriveController Initialized successfully.");
}


const handleDriveButtonClick = (event) => {
    console.log("Drive button clicked!");
    event.stopPropagation(); 
    showDriveViewerModal();
};

