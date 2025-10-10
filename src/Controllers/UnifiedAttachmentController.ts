// src/Controllers/UnifiedAttachmentController.ts
import browser from 'webextension-polyfill';
import { FileBrowserDisplay, FileItem, BreadcrumbItem } from './FileBrowserDisplay';
import { BaseAdapter } from './adapters/BaseAdapter';
import { AdapterRegistry } from './adapters/AdapterRegistry';
import { 
    ConnectorConfig, 
    getEnabledConnectors, 
    initializeConnectors,
    ConnectorType 
} from '../DB/idbConnectors';

// Logging constants
const LOG_GENERAL = true;
const LOG_DEBUG = true;  // ENABLED FOR DEBUGGING INSERT FLOW
const LOG_ERROR = true;
const LOG_WARN = true;
const prefix = '[UnifiedAttachmentController]';

let isInitialized = false;
let currentSource: string = 'google-drive';
let currentPath: string = 'root';
let currentConnector: ConnectorConfig | null = null;

// Dynamic connectors loaded from DB
let availableConnectors: ConnectorConfig[] = [];
let fileBrowserDisplay: FileBrowserDisplay | null = null;
let currentBreadcrumbs: BreadcrumbItem[] = [{ id: 'root', name: 'Root' }];
let currentFiles: FileItem[] = []; // Track currently displayed files
let allSelectedFiles: FileItem[] = []; // Global list of all selected files across folders

// Export function to clear attachments (called when message is sent)
export function clearAttachments(): void {
    if (LOG_DEBUG) console.log(`${prefix} Clearing attachments from Ask input`);
    
    const attachmentsContainer = document.getElementById('attachments-container');
    if (attachmentsContainer) {
        attachmentsContainer.remove();
        if (LOG_DEBUG) console.log(`${prefix} Attachments container removed`);
    }
}

// Export function to get current attachments (for sending with message)
export function getCurrentAttachments(): FileItem[] {
    const attachmentsContainer = document.getElementById('attachments-container');
    if (!attachmentsContainer) return [];
    
    const pills = attachmentsContainer.querySelectorAll('[data-file-id]');
    const fileIds = Array.from(pills).map(pill => (pill as HTMLElement).dataset.fileId).filter(Boolean) as string[];
    
    // Get FileItems from currentFiles
    const attachedFiles = currentFiles.filter(f => fileIds.includes(f.id));
    if (LOG_DEBUG) console.log(`${prefix} getCurrentAttachments returning ${attachedFiles.length} files`);
    
    return attachedFiles;
}

export async function initializeUnifiedAttachmentController(): Promise<any> {
    if (isInitialized) {
        if (LOG_DEBUG) console.log(`${prefix} Already initialized.`);
        return {};
    }
    if (LOG_DEBUG) console.log(`${prefix} Initializing...`);

    try {
        // Initialize connectors DB
        await initializeConnectors();
        
        // Load available connectors
        await loadAvailableConnectors();
        
        // Setup unified attach button
        setupUnifiedAttachButton();
        
        // Setup attachment popup
        setupAttachmentPopup();
        
        // Listen for connector updates
        setupConnectorEventListeners();

        isInitialized = true;
        if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
        return {};
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Initialization failed:`, error);
        // Don't throw - allow sidepanel to continue loading
        return {};
    }
}

async function loadAvailableConnectors(): Promise<void> {
    try {
        // Get only storage connectors that are enabled
        const allConnectors = await getEnabledConnectors();
        availableConnectors = allConnectors.filter(c => c.category === 'storage');
        
        if (LOG_DEBUG) console.log(`${prefix} Loaded ${availableConnectors.length} storage connectors`);
        
        // Set default source to first available connector
        if (availableConnectors.length > 0) {
            currentSource = availableConnectors[0].id;
            currentConnector = availableConnectors[0];
        }
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to load connectors:`, error);
    }
}

function setupConnectorEventListeners(): void {
    // Listen for connector updates from Connectors tab
    window.addEventListener('connectorUpdated', async (event: any) => {
        if (LOG_DEBUG) console.log(`${prefix} Connector updated:`, event.detail);
        
        // Reload available connectors
        await loadAvailableConnectors();
        
        // Refresh the dropdown if popup is open
        const popup = document.getElementById('unified-attachment-popup');
        if (popup && !popup.classList.contains('hidden')) {
            refreshSourceDropdown();
        }
    });
}

function setupUnifiedAttachButton(): void {
    // Button is now in HTML, just verify it exists
    const attachButton = document.getElementById('unified-attach-button');
    if (!attachButton) {
        if (LOG_WARN) console.warn(`${prefix} Unified attach button not found in HTML`);
        return;
    }
    
    if (LOG_GENERAL) console.log(`${prefix} Unified attach button found and ready`);
}

function setupAttachmentPopup(): void {
    // Popup is now in HTML, just get reference and populate
    const popup = document.getElementById('unified-attachment-popup');
    if (!popup) {
        if (LOG_WARN) console.warn(`${prefix} Unified attachment popup not found in HTML`);
        return;
    }
    
    // Populate source dropdown with available connectors
    refreshSourceDropdown();
    
    // Initialize file browser display
    fileBrowserDisplay = new FileBrowserDisplay(popup, {
        onFileSelect: handleFileSelect,
        onFolderNavigate: handleFolderNavigate,
        onBreadcrumbClick: handleBreadcrumbClick,
        onSearch: handleSearch
    });
    
    // Setup event listeners
    setupAttachmentPopupEvents();
    
    if (LOG_GENERAL) console.log(`${prefix} Attachment popup initialized`);
}

function setupAttachmentPopupEvents(): void {
    const popup = document.getElementById('unified-attachment-popup');
    const closeButton = document.getElementById('close-attachment-popup');
    const expandButton = document.getElementById('expand-attachment-popup');
    const cancelButton = document.getElementById('cancel-attachment-button');
    const insertButton = document.getElementById('insert-attachment-button');
    const clearButton = document.getElementById('clear-selection-button');
    const sourceSelect = document.getElementById('attachment-source-dropdown');
    const attachButton = document.getElementById('unified-attach-button');

    // Show popup
    attachButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Only show the popup, don't toggle
        if (popup?.classList.contains('hidden')) {
            popup.classList.remove('hidden');
            // Reset to root folder and initialize breadcrumbs
            currentPath = 'root';
            currentBreadcrumbs = [{ id: 'root', name: 'Root' }];
            
            // Clear any previous selections
            if (fileBrowserDisplay) {
                fileBrowserDisplay.clearSelection();
            }
            
            // Clear global selected files list
            allSelectedFiles = [];
            
            // Update selected count
            updateSelectedCount();
            
            loadFiles();
        }
    });

    closeButton?.addEventListener('click', hideAttachmentPopup);
    cancelButton?.addEventListener('click', hideAttachmentPopup);
    clearButton?.addEventListener('click', clearSelection);
    
    // Expand/collapse popup
    expandButton?.addEventListener('click', () => {
        popup?.classList.toggle('expanded');
        // Update button title based on state
        if (popup?.classList.contains('expanded')) {
            expandButton.setAttribute('title', 'Collapse to Normal Size');
        } else {
            expandButton.setAttribute('title', 'Expand to Full Screen');
        }
    });
    
    // Insert button
    insertButton?.addEventListener('click', handleInsertFiles);
    
    // Source change
    sourceSelect?.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        currentSource = target.value;
        
        // Find the connector
        currentConnector = availableConnectors.find(c => c.id === currentSource) || null;
        
        // Reset state
        currentPath = 'root';
        currentBreadcrumbs = [{ id: 'root', name: 'Root' }];
        
        if (fileBrowserDisplay) {
            fileBrowserDisplay.clearSelection();
        }
        
        loadFiles();
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', (event) => {
        if (popup && !popup.classList.contains('hidden') &&
            !attachButton?.contains(event.target as Node) &&
            !popup.contains(event.target as Node)) {
            hideAttachmentPopup();
        }
    });
    
    // Setup drag & drop
    setupDragAndDrop();
}

function setupDragAndDrop(): void {
    const fileBrowser = document.getElementById('attachment-file-browser');
    const dragOverlay = document.getElementById('drag-drop-overlay');
    const popup = document.getElementById('unified-attachment-popup');
    
    if (!fileBrowser || !dragOverlay || !popup) return;
    
    let dragCounter = 0;
    
    // Prevent default drag behaviors on the entire popup
    popup.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    popup.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Show overlay when dragging over the file browser
    fileBrowser.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        if (dragCounter === 1) {
            dragOverlay.classList.remove('hidden');
        }
    });
    
    fileBrowser.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            dragOverlay.classList.add('hidden');
        }
    });
    
    fileBrowser.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    fileBrowser.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        dragOverlay.classList.add('hidden');
        
        const items = e.dataTransfer?.items;
        if (!items) return;
        
        const droppedFiles: FileItem[] = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    droppedFiles.push({
                        id: `dropped-${Date.now()}-${i}`,
                        name: file.name,
                        type: 'file',
                        mimeType: file.type || 'application/octet-stream',
                        size: file.size,
                        modifiedTime: new Date(file.lastModified).toISOString(),
                        path: file.name
                    });
                }
            }
        }
        
        if (droppedFiles.length > 0 && fileBrowserDisplay) {
            // Display dropped files
            fileBrowserDisplay.renderFiles(droppedFiles);
            
            if (LOG_GENERAL) console.log(`${prefix} Dropped ${droppedFiles.length} files`);
        }
    });
}

function hideAttachmentPopup(): void {
    const popup = document.getElementById('unified-attachment-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

async function loadFiles(): Promise<void> {
    if (!fileBrowserDisplay || !currentConnector) return;
    
    fileBrowserDisplay.setLoading(true);
    
    try {
        // Get adapter for current connector type
        const adapter = AdapterRegistry.getAdapter(currentConnector.type);
        
        if (!adapter) {
            throw new Error(`No adapter available for connector type: ${currentConnector.type}`);
        }
        
        const files = await adapter.fetchFiles(currentPath);
        currentFiles = files; // Store files for later reference
        
        fileBrowserDisplay.renderFiles(files);
        fileBrowserDisplay.setBreadcrumbs(currentBreadcrumbs);
        
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Error loading files:`, error);
        fileBrowserDisplay.setError(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Callback functions for FileBrowserDisplay
function handleFileSelect(fileId: string, selected: boolean): void {
    if (fileBrowserDisplay) {
        fileBrowserDisplay.selectFile(fileId, selected);
    }
    
    // Update global selected files list
    if (selected) {
        // Add to global list if not already there
        const fileItem = currentFiles.find(f => f.id === fileId);
        if (fileItem && !allSelectedFiles.find(f => f.id === fileId)) {
            allSelectedFiles.push(fileItem);
        }
    } else {
        // Remove from global list
        allSelectedFiles = allSelectedFiles.filter(f => f.id !== fileId);
    }
    
    updateSelectedCount();
}

async function handleFolderNavigate(folderId: string): Promise<void> {
    if (!currentConnector) return;
    
    // Check if this is the file picker trigger for local files
    if (folderId === 'select-files' && currentConnector.type === 'local') {
        await openLocalFilePicker();
        return;
    }
    
    // Find the folder name from current files
    const folderName = currentFiles.find(f => f.id === folderId)?.name || 'Folder';
    
    // Update current path and breadcrumbs
    currentPath = folderId;
    currentBreadcrumbs.push({ id: folderId, name: folderName });
    
    // Update breadcrumbs in UI
    if (fileBrowserDisplay) {
        fileBrowserDisplay.setBreadcrumbs(currentBreadcrumbs);
    }
    
    // Load files in the new folder
    await loadFiles();
}

async function openLocalFilePicker(): Promise<void> {
    try {
        if (LOG_DEBUG) console.log(`${prefix} Opening local file picker...`);
        
        const adapter = AdapterRegistry.getAdapter('local') as any;
        if (adapter && adapter.openFilePicker) {
            const files = await adapter.openFilePicker();
            if (LOG_DEBUG) console.log(`${prefix} File picker returned ${files?.length || 0} files`);
            
            if (files && files.length > 0) {
                // Get FileItems from selected files
                const fileItems = await adapter.getSelectedFiles();
                currentFiles = fileItems; // Store for insert
                
                if (LOG_DEBUG) console.log(`${prefix} Got ${fileItems.length} FileItems:`, fileItems);
                
                if (fileBrowserDisplay) {
                    fileBrowserDisplay.renderFiles(fileItems);
                    if (LOG_GENERAL) console.log(`${prefix} Rendered ${fileItems.length} local files`);
                }
            }
        }
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to open file picker:`, error);
        alert('Failed to open file picker. Please try again.');
    }
}

function handleBreadcrumbClick(folderId: string, index: number): void {
    // Trim breadcrumbs to the clicked level
    currentBreadcrumbs = currentBreadcrumbs.slice(0, index + 1);
    currentPath = folderId;
    
    // Update breadcrumbs in UI
    if (fileBrowserDisplay) {
        fileBrowserDisplay.setBreadcrumbs(currentBreadcrumbs);
    }
    
    // Load files in the selected folder
    loadFiles();
}

function handleSearch(query: string): void {
    // Search is handled by FileBrowserDisplay
    if (LOG_DEBUG) console.log(`${prefix} Searching for:`, query);
}

function updateSelectedCount(): void {
    const count = allSelectedFiles.length; // Use global list instead of current folder selection
    const countElement = document.getElementById('selected-count');
    const insertButton = document.getElementById('insert-attachment-button') as HTMLButtonElement;
    const clearButton = document.getElementById('clear-selection-button') as HTMLButtonElement;
    
    if (countElement) {
        countElement.textContent = count.toString();
    }
    
    if (insertButton) {
        insertButton.textContent = `Insert (${count})`;
        insertButton.disabled = count === 0;
    }
    
    if (clearButton) {
        clearButton.disabled = count === 0;
    }
    
    // Update selected files display
    updateSelectedFilesDisplay();
}

function clearSelection(): void {
    if (!fileBrowserDisplay) return;
    
    // Clear both the current folder selection and global list
    fileBrowserDisplay.clearSelection();
    allSelectedFiles = [];
    
    updateSelectedCount();
}

function updateSelectedFilesDisplay(): void {
    const displayContainer = document.getElementById('selected-files-display');
    const filesList = document.getElementById('selected-files-list');
    
    if (!displayContainer || !filesList) return;
    
    if (allSelectedFiles.length === 0) {
        displayContainer.classList.add('hidden');
        return;
    }
    
    displayContainer.classList.remove('hidden');
    filesList.innerHTML = '';
    
    // Use the global selected files list
    const selectedFileItems = allSelectedFiles;
    
    selectedFileItems.forEach(file => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center gap-1 px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs';
        
        // Truncate long filenames
        const truncateName = (name: string, maxLength: number = 12) => {
            if (name.length <= maxLength) return name;
            const ext = name.split('.').pop() || '';
            const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
            const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
            return ext ? `${truncated}.${ext}` : truncated;
        };
        
        const icon = file.mimeType?.startsWith('image/') ? '🖼️' : 
                     file.mimeType?.includes('pdf') ? '📄' : 
                     file.mimeType?.includes('text') ? '📝' : '📎';
        
        pill.innerHTML = `
            <span class="flex items-center gap-1">
                <span class="text-xs">${icon}</span>
                <span class="text-xs" title="${file.name}">${truncateName(file.name)}</span>
            </span>
            <button class="remove-selected-file text-gray-400 hover:text-red-600 ml-1" data-file-id="${file.id}" title="Remove ${file.name}">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        // Add remove handler
        const removeBtn = pill.querySelector('.remove-selected-file');
        removeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            // Remove from global list
            allSelectedFiles = allSelectedFiles.filter(f => f.id !== file.id);
            
            // Also remove from current folder selection if file is currently displayed
            if (fileBrowserDisplay && currentFiles.find(f => f.id === file.id)) {
                fileBrowserDisplay.selectFile(file.id, false);
            }
            
            updateSelectedCount();
        });
        
        filesList.appendChild(pill);
    });
}

function handleInsertFiles(): void {
    if (LOG_DEBUG) console.log(`${prefix} handleInsertFiles called`);
    
    if (!fileBrowserDisplay) {
        if (LOG_ERROR) console.error(`${prefix} fileBrowserDisplay is null!`);
        return;
    }
    
    if (allSelectedFiles.length === 0) {
        if (LOG_WARN) console.warn(`${prefix} No files selected`);
        return;
    }
    
    // Use the global selected files list
    const selectedFileItems = allSelectedFiles;
    if (LOG_DEBUG) console.log(`${prefix} Selected FileItems:`, selectedFileItems);
    
    // Dispatch custom event with selected files
    const event = new CustomEvent('attachmentFilesSelected', {
        detail: {
            files: selectedFileItems,
            source: currentConnector?.name || 'Unknown'
        }
    });
    
    if (LOG_DEBUG) console.log(`${prefix} Dispatching attachmentFilesSelected event with ${selectedFileItems.length} files`);
    document.dispatchEvent(event);
    
    // Also try to add to the Ask input area visually
    addFilesToAskInput(selectedFileItems);
    
    hideAttachmentPopup();
}

function addFilesToAskInput(files: FileItem[]): void {
    if (LOG_DEBUG) console.log(`${prefix} Adding ${files.length} files to Ask input`);
    
    // Find the Ask input area
    const inputArea = document.getElementById('input-area');
    if (!inputArea) {
        if (LOG_ERROR) console.error(`${prefix} input-area not found!`);
        return;
    }
    
    // Check if we already have an attachments container
    let attachmentsContainer = document.getElementById('attachments-container');
    if (!attachmentsContainer) {
        if (LOG_DEBUG) console.log(`${prefix} Creating attachments container`);
        attachmentsContainer = document.createElement('div');
        attachmentsContainer.id = 'attachments-container';
        attachmentsContainer.className = 'flex flex-wrap gap-1.5 mb-2 p-1.5 border-t border-gray-200 dark:border-gray-600 overflow-y-auto';
        attachmentsContainer.style.maxHeight = '100px'; // Scroll if too many files
        
        // Insert before the textarea
        const queryInput = document.getElementById('query-input');
        if (queryInput && queryInput.parentElement) {
            queryInput.parentElement.insertBefore(attachmentsContainer, queryInput.parentElement.firstChild);
        } else {
            if (LOG_ERROR) console.error(`${prefix} Could not find query-input or its parent`);
            return;
        }
    }
    
    // Add file pills (check for duplicates first)
    files.forEach(file => {
        // Check if file is already attached
        const existingPill = attachmentsContainer.querySelector(`[data-file-id="${file.id}"]`);
        if (existingPill) {
            // Silently skip duplicates
            return;
        }
        
        if (LOG_DEBUG) console.log(`${prefix} Adding file pill for: ${file.name}`);
        
        // Truncate long filenames
        const truncateName = (name: string, maxLength: number = 15) => {
            if (name.length <= maxLength) return name;
            const ext = name.split('.').pop() || '';
            const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
            const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
            return ext ? `${truncated}.${ext}` : truncated;
        };
        
        const pill = document.createElement('div');
        pill.className = 'flex items-center gap-1 px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs';
        pill.dataset.fileId = file.id;
        
        // File icon based on type
        const icon = file.mimeType?.startsWith('image/') ? '🖼️' : 
                     file.mimeType?.includes('pdf') ? '📄' : 
                     file.mimeType?.includes('text') ? '📝' : '📎';
        
        const displayName = truncateName(file.name);
        
        pill.innerHTML = `
            <span class="flex items-center gap-1">
                <span class="text-xs">${icon}</span>
                <span class="text-xs" title="${file.name}">${displayName}</span>
            </span>
            <button class="remove-attachment text-gray-400 hover:text-red-600 ml-1" data-file-id="${file.id}" title="Remove ${file.name}">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        // Add remove handler
        const removeBtn = pill.querySelector('.remove-attachment');
        removeBtn?.addEventListener('click', () => {
            if (LOG_DEBUG) console.log(`${prefix} Removing attachment: ${file.name}`);
            pill.remove();
            
            // If no more attachments, remove container
            if (attachmentsContainer && attachmentsContainer.children.length === 0) {
                attachmentsContainer.remove();
            }
        });
        
        attachmentsContainer.appendChild(pill);
    });
    
    if (LOG_GENERAL) console.log(`${prefix} Successfully added ${files.length} files to Ask input`);
}

function refreshSourceDropdown(): void {
    const sourceSelect = document.getElementById('attachment-source-dropdown') as HTMLSelectElement;
    if (!sourceSelect) return;
    
    const currentValue = sourceSelect.value;
    
    // Rebuild options
    sourceSelect.innerHTML = availableConnectors.map(connector => `
        <option value="${connector.id}">
            ${connector.icon} ${connector.name}
        </option>
    `).join('');
    
    // Restore selection if still available
    if (availableConnectors.find(c => c.id === currentValue)) {
        sourceSelect.value = currentValue;
    } else if (availableConnectors.length > 0) {
        // Select first available
        sourceSelect.value = availableConnectors[0].id;
        currentSource = availableConnectors[0].id;
        currentConnector = availableConnectors[0];
    }
    
    if (LOG_DEBUG) console.log(`${prefix} Source dropdown refreshed`);
}