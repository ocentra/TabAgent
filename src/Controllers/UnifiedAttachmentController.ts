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
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[UnifiedAttachmentController]';

let isInitialized = false;
let currentSource: string = 'google-drive';
let currentPath: string = 'root';
let currentConnector: ConnectorConfig | null = null;

// Dynamic connectors loaded from DB
let availableConnectors: ConnectorConfig[] = [];
let fileBrowserDisplay: FileBrowserDisplay | null = null;
let currentBreadcrumbs: BreadcrumbItem[] = [{ id: 'root', name: 'Root' }];

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
    const cancelButton = document.getElementById('cancel-attachment-button');
    const insertButton = document.getElementById('insert-attachment-button');
    const sourceSelect = document.getElementById('attachment-source-dropdown');
    const attachButton = document.getElementById('unified-attach-button');

    // Show/hide popup
    attachButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        popup?.classList.toggle('hidden');
        if (!popup?.classList.contains('hidden')) {
            loadFiles();
        }
    });

    closeButton?.addEventListener('click', hideAttachmentPopup);
    cancelButton?.addEventListener('click', hideAttachmentPopup);
    
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
    updateSelectedCount();
}

function handleFolderNavigate(folderId: string): void {
    if (!currentConnector) return;
    
    const adapter = AdapterRegistry.getAdapter(currentConnector.type);
    if (adapter) {
        currentPath = adapter.getFolderId({ id: folderId, name: '', type: 'folder', path: folderId });
        // Update breadcrumbs
        currentBreadcrumbs.push({ id: folderId, name: 'Folder' }); // TODO: Get actual folder name
        loadFiles();
    }
}

function handleBreadcrumbClick(folderId: string, index: number): void {
    currentBreadcrumbs = currentBreadcrumbs.slice(0, index + 1);
    currentPath = folderId;
    loadFiles();
}

function handleSearch(query: string): void {
    // Search is handled by FileBrowserDisplay
    if (LOG_DEBUG) console.log(`${prefix} Searching for:`, query);
}

function updateSelectedCount(): void {
    const count = fileBrowserDisplay ? fileBrowserDisplay.getSelectedFiles().length : 0;
    const countElement = document.getElementById('selected-count');
    const insertButton = document.getElementById('insert-attachment-button') as HTMLButtonElement;
    
    if (countElement) {
        countElement.textContent = count.toString();
    }
    
    if (insertButton) {
        insertButton.textContent = `Insert (${count})`;
        insertButton.disabled = count === 0;
    }
}

function handleInsertFiles(): void {
    if (!fileBrowserDisplay) return;
    
    const selectedFiles = fileBrowserDisplay.getSelectedFiles();
    if (selectedFiles.length === 0) return;
    
    // TODO: Implement file insertion logic
    if (LOG_GENERAL) console.log(`${prefix} Inserting files:`, selectedFiles);
    
    hideAttachmentPopup();
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