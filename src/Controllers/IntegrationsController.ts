// src/Controllers/IntegrationsController.ts
// Main controller that coordinates the three integration tabs

import { createBrowserContent, setupBrowserTab } from './IntegrationsBrowserTab';
import { createNativeContent, setupNativeTab } from './IntegrationsNativeTab';
import { createAPIContent, setupAPITab } from './IntegrationsAPITab';

// Logging constants
const LOG_DEBUG = false;
const prefix = '[IntegrationsController]';

let isInitialized = false;

// Tab management for integrations
let currentTab: 'browser' | 'native' | 'api' = 'browser';
let tabButtons: HTMLButtonElement[] = [];

function initializeTabInterface(container: HTMLElement): void {
    // Create tab toggle
    const tabToggle = document.createElement('div');
    tabToggle.className = 'model-source-toggle bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex w-full mb-4';
    tabToggle.innerHTML = `
        <button id="tab-browser" class="model-source-btn active px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Browser
        </button>
        <button id="tab-native" class="model-source-btn px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            Native
        </button>
        <button id="tab-api" class="model-source-btn px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 flex-1">
            API
        </button>
    `;
    
    // Create tab content containers
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content-container';
    tabContent.innerHTML = `
        <div id="tab-content-browser" class="tab-content active">
            ${createBrowserContent()}
        </div>
        <div id="tab-content-native" class="tab-content hidden">
            ${createNativeContent()}
        </div>
        <div id="tab-content-api" class="tab-content hidden">
            ${createAPIContent()}
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
            const tabId = button.id.replace('tab-', '') as 'browser' | 'native' | 'api';
            switchTab(tabId);
        });
    });
}

function switchTab(tabId: 'browser' | 'native' | 'api'): void {
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

export function initializeIntegrationsController(): any {
    if (isInitialized) {
        if (LOG_DEBUG) console.log(`${prefix} Already initialized.`);
        return;
    }
    if (LOG_DEBUG) console.log(`${prefix} Initializing...`);

    const integrationsPageContainer = document.getElementById('page-integrations');
    if (!integrationsPageContainer) {
        console.warn("[IntegrationsController] Could not find #page-integrations container.");
        return;
    }

    // Remove placeholder content
    const placeholder = integrationsPageContainer.querySelector('p');
    if (placeholder) placeholder.remove();

    // Initialize tab interface
    initializeTabInterface(integrationsPageContainer);

    // Setup each tab
    setupBrowserTab(integrationsPageContainer);
    setupNativeTab(integrationsPageContainer);
    setupAPITab(integrationsPageContainer);

    isInitialized = true;
    if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
    return {}; 
}
