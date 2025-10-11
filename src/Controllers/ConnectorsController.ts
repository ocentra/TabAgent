// src/Controllers/ConnectorsController.ts
import browser from 'webextension-polyfill';

// Logging constants
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[ConnectorsController]';

let isInitialized = false;

// Tab management for connectors
let currentTab: 'cloud' | 'email' | 'productivity' | 'developer' = 'cloud';
let tabButtons: HTMLButtonElement[] = [];

function initializeTabInterface(container: HTMLElement): void {
    // Create tab toggle
    const tabToggle = document.createElement('div');
    tabToggle.className = 'model-source-toggle bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex w-full mb-4';
    tabToggle.innerHTML = `
        <button id="tab-cloud" class="model-source-btn active px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Cloud
        </button>
        <button id="tab-email" class="model-source-btn px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Email
        </button>
        <button id="tab-productivity" class="model-source-btn px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Productivity
        </button>
        <button id="tab-developer" class="model-source-btn px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Developer
        </button>
    `;
    
    // Create tab content containers
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content-container';
    tabContent.innerHTML = `
        <div id="tab-content-cloud" class="tab-content active">
            ${createCloudContent()}
        </div>
        <div id="tab-content-email" class="tab-content hidden">
            ${createEmailContent()}
        </div>
        <div id="tab-content-productivity" class="tab-content hidden">
            ${createProductivityContent()}
        </div>
        <div id="tab-content-developer" class="tab-content hidden">
            ${createDeveloperContent()}
        </div>
    `;
    
    // Add to container
    container.appendChild(tabToggle);
    container.appendChild(tabContent);
    
    // Setup tab switching
    const buttons = tabToggle.querySelectorAll('.model-source-btn');
    tabButtons = Array.from(buttons) as HTMLButtonElement[];
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.id.replace('tab-', '') as 'cloud' | 'email' | 'productivity' | 'developer';
            switchTab(tabId);
        });
    });
}

function switchTab(tabId: 'cloud' | 'email' | 'productivity' | 'developer'): void {
    currentTab = tabId;
    
    // Update button states
    tabButtons.forEach(button => {
        const buttonTabId = button.id.replace('tab-', '');
        if (buttonTabId === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update content visibility
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        if (content.id === `tab-content-${tabId}`) {
            content.classList.remove('hidden');
            content.classList.add('active');
        } else {
            content.classList.add('hidden');
            content.classList.remove('active');
        }
    });
}

function createCloudContent(): string {
    return `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to cloud storage services to access and analyze your files using <strong>MCP</strong>.</p>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">G</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Google Drive</h4>
                    <button class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">M</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">OneDrive</h4>
                    <button class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-blue-400 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">D</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Dropbox</h4>
                    <button class="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-cloud-storage">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mb-2">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <h4 class="font-medium text-gray-700 dark:text-gray-300 text-xs text-center mb-1">Add Custom</h4>
                    <button class="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createEmailContent(): string {
    return `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to email services to analyze messages and attachments.</p>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-red-500 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">G</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Gmail</h4>
                    <button class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">O</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Outlook</h4>
                    <button class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-email-service">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mb-2">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <h4 class="font-medium text-gray-700 dark:text-gray-300 text-xs text-center mb-1">Add Custom</h4>
                    <button class="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createProductivityContent(): string {
    return `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to productivity tools and document services using <strong>MCP (Model Context Protocol)</strong>.</p>
                <p class="mt-2 text-xs bg-blue-50 dark:bg-blue-900 p-2 rounded border-l-4 border-blue-400">
                    <strong>MCP:</strong> A standardized protocol for AI models to securely access external data sources and tools. 
                    Enables real-time integration with your productivity ecosystem.
                </p>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-green-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">N</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Notion</h4>
                    <button class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">C</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Confluence</h4>
                    <button class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">A</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Airtable</h4>
                    <button class="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-purple-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">M</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Office 365</h4>
                    <button class="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-red-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">G</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Google Workspace</h4>
                    <button class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">🖥️</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">Native App</h4>
                    <button class="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-connector-type="native-app">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-productivity-tool">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mb-2">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <h4 class="font-medium text-gray-700 dark:text-gray-300 text-xs text-center mb-1">Add Custom</h4>
                    <button class="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                        Add
                    </button>
                </div>
            </div>
            <div class="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <p class="text-gray-600 dark:text-gray-400">
                    <strong>MCP Benefits:</strong> Secure authentication, real-time data access, standardized API, 
                    and seamless integration with AI models for intelligent document processing.
                </p>
            </div>
        </div>
    `;
}

function createDeveloperContent(): string {
    return `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to developer platforms and repositories.</p>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center mb-2">
                        <span class="text-white text-xs font-bold">🤗</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">HuggingFace</h4>
                    <button class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div class="w-8 h-8 bg-gray-800 dark:bg-gray-200 rounded flex items-center justify-center mb-2">
                        <span class="text-white dark:text-gray-800 text-xs font-bold">GH</span>
                    </div>
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 text-xs text-center mb-1">GitHub</h4>
                    <button class="px-2 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex flex-col items-center p-2 border border-dashed border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors cursor-pointer" id="add-developer-tool">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mb-2">
                        <span class="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                    </div>
                    <h4 class="font-medium text-gray-700 dark:text-gray-300 text-xs text-center mb-1">Add Custom</h4>
                    <button class="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs">
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
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

    // Native App Connector Button
    const connectorsPageContainer = document.getElementById('page-connectors');
    if (connectorsPageContainer) {
        connectorsPageContainer.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'BUTTON' && target.hasAttribute('data-connector-type')) {
                const connectorType = target.getAttribute('data-connector-type');
                if (connectorType === 'native-app') {
                    handleNativeAppConnector();
                }
            }
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

async function handleNativeAppConnector() {
    const HOST_NAME = 'com.tabagent.host';
    
    try {
        // Test if native messaging is available
        if (typeof (window as any).chrome === 'undefined' || !(window as any).chrome.runtime || !(window as any).chrome.runtime.sendNativeMessage) {
            alert('❌ Native messaging is not available.\n\nThis feature requires the extension to be loaded in Chrome/Edge.');
            return;
        }

        // Show loading message
        if (LOG_DEBUG) console.log(`${prefix} Testing native app connection...`);
        
        // Test connection with ping
        const pingPromise = new Promise((resolve, reject) => {
            (window as any).chrome.runtime.sendNativeMessage(
                HOST_NAME,
                { action: 'ping' },
                (response: any) => {
                    if ((window as any).chrome.runtime.lastError) {
                        reject((window as any).chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                }
            );
        });

        const pingResponse = await pingPromise as any;
        
        if (LOG_DEBUG) console.log(`${prefix} Native app ping response:`, pingResponse);

        // If ping successful, get system info
        const sysInfoPromise = new Promise((resolve, reject) => {
            (window as any).chrome.runtime.sendNativeMessage(
                HOST_NAME,
                { action: 'get_system_info' },
                (response: any) => {
                    if ((window as any).chrome.runtime.lastError) {
                        reject((window as any).chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                }
            );
        });

        const sysInfo = await sysInfoPromise as any;
        
        if (LOG_DEBUG) console.log(`${prefix} System info:`, sysInfo);

        // Show success dialog with details
        const message = `✅ Native App Connected Successfully!\n\n` +
            `Version: ${pingResponse.version || 'N/A'}\n` +
            `PID: ${pingResponse.pid || 'N/A'}\n` +
            `Platform: ${sysInfo.platform || 'N/A'} ${sysInfo.architecture || ''}\n` +
            `Python: ${sysInfo.python_version || 'N/A'}\n\n` +
            `The native messaging host is working correctly.`;
        
        alert(message);
        
    } catch (error: any) {
        console.error(`${prefix} Native app connection error:`, error);
        
        const errorMsg = error.message || String(error);
        
        // Provide helpful error messages
        if (errorMsg.includes('Specified native messaging host not found')) {
            alert('❌ Native Host Not Installed\n\n' +
                'The Tab Agent native host is not installed or registered.\n\n' +
                'To install:\n' +
                '1. Go to Server/ folder\n' +
                '2. Run register_host.bat (Windows) or register_host.sh (Mac/Linux)\n' +
                '3. Restart your browser');
        } else if (errorMsg.includes('Access')) {
            alert('❌ Permission Error\n\n' +
                'The native host is installed but cannot be accessed.\n\n' +
                'Make sure the executable has proper permissions.');
        } else {
            alert(`❌ Connection Failed\n\n${errorMsg}\n\n` +
                'Check the console for more details.');
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

    // Initialize tab interface
    initializeTabInterface(connectorsPageContainer);

    // Setup custom connector add buttons
    setupCustomConnectorButtons();

    isInitialized = true;
    if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
    return {}; 
}
