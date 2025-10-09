// src/Controllers/ConnectorsController.ts
import browser from 'webextension-polyfill';

// Logging constants
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[ConnectorsController]';

let isInitialized = false;

// Helper to create a foldout section (matching other controllers style)
function createFoldoutSection({
    title,
    contentHTML,
    sectionClass = '',
    initiallyOpen = true
}: {
    title: string,
    contentHTML: string,
    sectionClass?: string,
    initiallyOpen?: boolean
}): HTMLElement {
    const section = document.createElement('div');
    section.className = `${sectionClass} mb-6`;
    section.innerHTML = `
        <div class="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button class="foldout-toggle w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg transition-colors min-h-0">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 leading-tight">${title}</h3>
                <span class="fold-icon transform transition-transform duration-200">▼</span>
            </button>
            <div class="foldout-content p-3 space-y-3${initiallyOpen ? '' : ' hidden'}">
                ${contentHTML}
            </div>
        </div>
    `;
    // Setup foldout toggle
    const toggle = section.querySelector('.foldout-toggle') as HTMLButtonElement;
    const content = section.querySelector('.foldout-content') as HTMLElement;
    const icon = toggle?.querySelector('.fold-icon') as HTMLElement;
    if (toggle && content && icon) {
        toggle.addEventListener('click', () => {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-180deg)';
        });
    }
    return section;
}

function createCloudStorageFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to cloud storage services to access and analyze your files using <strong>MCP</strong>.</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">G</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Google Drive</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access files from Google Drive via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">M</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Microsoft OneDrive</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access files from OneDrive via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-blue-400 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">D</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Dropbox</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access files from Dropbox via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 text-xs">
                        Connect
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-cloud-storage">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 dark:text-gray-300">Add Custom Cloud Storage</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Connect your own MCP cloud storage service</p>
                    </div>
                </div>
                <button class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                    Add
                </button>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Cloud Storage',
        contentHTML,
        sectionClass: 'cloud-storage-section',
        initiallyOpen: true
    });
}

function createEmailFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to email services to analyze messages and attachments.</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">G</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Gmail</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Gmail messages and attachments</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">O</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Outlook</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Outlook messages and attachments</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                        Connect
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-email-service">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 dark:text-gray-300">Add Custom Email Service</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Connect your own MCP email provider</p>
                    </div>
                </div>
                <button class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                    Add
                </button>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Email Services',
        contentHTML,
        sectionClass: 'email-services-section',
        initiallyOpen: true
    });
}

function createProductivityFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to productivity tools and document services using <strong>MCP (Model Context Protocol)</strong>.</p>
                <p class="mt-2 text-xs bg-blue-50 dark:bg-blue-900 p-2 rounded border-l-4 border-blue-400">
                    <strong>MCP:</strong> A standardized protocol for AI models to securely access external data sources and tools. 
                    Enables real-time integration with your productivity ecosystem.
                </p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">N</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Notion</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Notion pages and databases via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">C</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Confluence</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Confluence pages and spaces via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">A</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Airtable</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Airtable bases and records via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">M</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Microsoft Office 365</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Word, Excel, PowerPoint via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">G</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">Google Workspace</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access Docs, Sheets, Slides via MCP</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">
                        Connect
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-productivity-tool">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 dark:text-gray-300">Add Custom Productivity Tool</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Connect your own MCP document service</p>
                    </div>
                </div>
                <button class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                    Add
                </button>
            </div>
            <div class="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <p class="text-gray-600 dark:text-gray-400">
                    <strong>MCP Benefits:</strong> Secure authentication, real-time data access, standardized API, 
                    and seamless integration with AI models for intelligent document processing.
                </p>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Productivity Tools & Documents (MCP)',
        contentHTML,
        sectionClass: 'productivity-tools-section',
        initiallyOpen: true
    });
}

function createDeveloperToolsFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to developer platforms and repositories.</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                            <span class="text-white text-xs font-bold">🤗</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">HuggingFace</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Browse and add ONNX models from HuggingFace Hub</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="flex items-center space-x-2">
                        <div class="w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded flex items-center justify-center">
                            <span class="text-white dark:text-gray-800 text-xs font-bold">GH</span>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-800 dark:text-gray-200">GitHub</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Access repositories, issues, and code</p>
                        </div>
                    </div>
                    <button class="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Developer Tools',
        contentHTML,
        sectionClass: 'developer-tools-section',
        initiallyOpen: true
    });
}

function setupCustomConnectorButtons() {
    // Cloud Storage Add Button
    const addCloudStorageBtn = document.getElementById('add-cloud-storage');
    if (addCloudStorageBtn) {
        addCloudStorageBtn.addEventListener('click', () => {
            showCustomConnectorDialog('Cloud Storage', 'Enter the name of your custom cloud storage service');
        });
    }

    // Email Service Add Button
    const addEmailServiceBtn = document.getElementById('add-email-service');
    if (addEmailServiceBtn) {
        addEmailServiceBtn.addEventListener('click', () => {
            showCustomConnectorDialog('Email Service', 'Enter the name of your custom email service');
        });
    }

    // Productivity Tool Add Button
    const addProductivityToolBtn = document.getElementById('add-productivity-tool');
    if (addProductivityToolBtn) {
        addProductivityToolBtn.addEventListener('click', () => {
            showCustomConnectorDialog('Productivity Tool', 'Enter the name of your custom productivity tool');
        });
    }
}

function showCustomConnectorDialog(connectorType: string, placeholder: string) {
    const serviceName = prompt(`${placeholder}:`);
    if (serviceName && serviceName.trim()) {
        const trimmedName = serviceName.trim();
        
        // Show confirmation dialog
        const confirmMessage = `Add "${trimmedName}" as a custom ${connectorType.toLowerCase()}?\n\nThis will allow you to configure an MCP connection to this service.`;
        const confirmed = confirm(confirmMessage);
        
        if (confirmed) {
            // TODO: Implement actual MCP connector addition logic
            // For now, just show a success message
            alert(`Custom ${connectorType} "${trimmedName}" will be added.\n\nMCP connector configuration will be implemented in a future update.`);
            
            if (LOG_DEBUG) console.log(`${prefix} User added custom ${connectorType}: ${trimmedName}`);
        }
    }
}

export function initializeConnectorsController(): any {
    if (isInitialized) {
        if (LOG_DEBUG) console.log(`${prefix} Already initialized.`);
        return;
    }
    if (LOG_DEBUG) console.log(`${prefix} Initializing...`);

    const connectorsPageContainer = document.getElementById('page-connectors');
    if (!connectorsPageContainer) {
        console.warn("[ConnectorsController] Could not find #page-connectors container.");
        return;
    }

    // Remove placeholder content
    const placeholder = connectorsPageContainer.querySelector('p');
    if (placeholder) placeholder.remove();

    // Inject foldout sections
    const cloudStorageFoldout = createCloudStorageFoldout();
    connectorsPageContainer.appendChild(cloudStorageFoldout);

    const emailFoldout = createEmailFoldout();
    connectorsPageContainer.appendChild(emailFoldout);

    const productivityFoldout = createProductivityFoldout();
    connectorsPageContainer.appendChild(productivityFoldout);

    const developerToolsFoldout = createDeveloperToolsFoldout();
    connectorsPageContainer.appendChild(developerToolsFoldout);

    // Setup custom connector add buttons
    setupCustomConnectorButtons();

    isInitialized = true;
    if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
    return {}; 
}
