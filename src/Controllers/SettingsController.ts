// src/Controllers/SettingsController.js
import browser from 'webextension-polyfill';
import { sendDbRequestSmart } from '../sidepanel';
import { DbResetDatabaseRequest } from '../DB/dbEvents';
import { setupInferenceSettings } from './InferenceSettings';
import { getAllCachedModels, deleteCachedModel, deleteAllCachedModels, CachedModelInfo } from '../DB/idbModel';

// Logging constants
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[SettingsController]';

let isInitialized = false;

// Helper to create a foldout section (matching Inference Settings style)
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

function createCommonSettingsFoldout(): HTMLElement {
    // Theme toggle button
    const themeToggleButton = document.createElement('button');
    themeToggleButton.id = 'theme-toggle-button';
    themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500';
    // Set initial text
    const isDarkMode = document.documentElement.classList.contains('dark');
    themeToggleButton.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    themeToggleButton.onclick = () => {
        const htmlElement = document.documentElement;
        const isCurrentlyDark = htmlElement.classList.contains('dark');
        if (isCurrentlyDark) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        themeToggleButton.textContent = htmlElement.classList.contains('dark') ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    };
    // Section content
    const contentHTML = `<div class="flex flex-col items-start">${themeToggleButton.outerHTML}</div>`;
    const section = createFoldoutSection({
        title: 'Common Settings',
        contentHTML,
        sectionClass: 'common-settings-section',
        initiallyOpen: true
    });
    // Replace placeholder with actual button element (to preserve event)
    const contentDiv = section.querySelector('.foldout-content .flex');
    if (contentDiv) {
        contentDiv.innerHTML = '';
        contentDiv.appendChild(themeToggleButton);
    }
    return section;
}

function createLogManagementFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="flex flex-wrap justify-center md:justify-start gap-2 pt-3">
                <button id="viewLogsButton" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">View Logs</button>
                <button id="resetDbButton" class="px-3 py-1 bg-red-200 dark:bg-red-600 hover:bg-red-300 dark:hover:bg-red-500 text-xs">Reset DB</button>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Log Management',
        contentHTML,
        sectionClass: 'log-management-section',
        initiallyOpen: false
    });
}

function createModelManagementFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-4 text-sm">
            <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-800 dark:text-gray-200">Cached Models</h4>
                <div class="flex gap-2">
                    <button id="refreshModelsButton" class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Refresh</button>
                    <button id="deleteAllModelsButton" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Delete All</button>
                </div>
            </div>
            
            <div id="modelsList" class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    Loading cached models...
                </div>
            </div>
            
            <div id="totalStorageInfo" class="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
                Total storage used: <span id="totalStorageValue">0 MB</span>
            </div>
            
            <div class="mt-4">
                <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Available Models</h5>
                <div id="availableModelsList" class="space-y-1 max-h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                    <div class="text-center py-2">Loading available models...</div>
                </div>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Model Management',
        contentHTML,
        sectionClass: 'model-management-section',
        initiallyOpen: true
    });
}

function createModelLoadingSettingsFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-4 text-sm">
            <div class="space-y-2">
                <label for="maxModelSize" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum Model Size (GB)
                </label>
                <div class="flex items-center space-x-2">
                    <input 
                        type="range" 
                        id="maxModelSize" 
                        min="1" 
                        max="8" 
                        step="0.1" 
                        value="2.1"
                        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    >
                    <span id="maxModelSizeValue" class="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[3rem]">2.1 GB</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    Models larger than this size will be marked as "Server Only". 
                    <br>⚠️ Increasing this may cause browser crashes on systems with limited RAM.
                </p>
            </div>
            
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bypass Size Limit for Specific Models
                </label>
                <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassSmolLM2" class="rounded border-gray-300">
                        <label for="bypassSmolLM2" class="text-sm text-gray-700 dark:text-gray-300">
                            SmolLM2-1.7B-Instruct
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassSmolLM3" class="rounded border-gray-300">
                        <label for="bypassSmolLM3" class="text-sm text-gray-700 dark:text-gray-300">
                            SmolLM3-3B-ONNX
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassPhi35" class="rounded border-gray-300">
                        <label for="bypassPhi35" class="text-sm text-gray-700 dark:text-gray-300">
                            Phi-3.5 Mini (ONNX)
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassPhi35Transformers" class="rounded border-gray-300">
                        <label for="bypassPhi35Transformers" class="text-sm text-gray-700 dark:text-gray-300">
                            Phi-3.5 Mini (Transformers.js)
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassBitnet2B" class="rounded border-gray-300">
                        <label for="bypassBitnet2B" class="text-sm text-gray-700 dark:text-gray-300">
                            Bitnet2B
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="bypassQwen3" class="rounded border-gray-300">
                        <label for="bypassQwen3" class="text-sm text-gray-700 dark:text-gray-300">
                            Qwen3-1.7B
                        </label>
                    </div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    These models will be allowed to exceed the size limit. Use with caution.
                </p>
            </div>
            
            <div class="pt-2">
                <button id="saveModelSettings" class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                    Save Settings
                </button>
                <button id="resetModelSettings" class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs ml-2">
                    Reset to Default
                </button>
                <button id="resetInferenceSettings" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs ml-2">
                    Reset AI Settings
                </button>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Model Loading Settings',
        contentHTML,
        sectionClass: 'model-loading-settings-section',
        initiallyOpen: false
    });
}

function setupModelLoadingSettings(container: HTMLElement) {
    // Load current settings
    const currentSettings = getModelLoadingSettings();
    
    // Setup slider
    const maxModelSizeSlider = container.querySelector('#maxModelSize') as HTMLInputElement;
    const maxModelSizeValue = container.querySelector('#maxModelSizeValue') as HTMLElement;
    
    if (maxModelSizeSlider && maxModelSizeValue) {
        maxModelSizeSlider.value = currentSettings.maxModelSize.toString();
        maxModelSizeValue.textContent = `${currentSettings.maxModelSize} GB`;
        
        maxModelSizeSlider.addEventListener('input', () => {
            const value = parseFloat(maxModelSizeSlider.value);
            maxModelSizeValue.textContent = `${value} GB`;
        });
    }
    
    // Setup checkboxes
    const bypassSmolLM2 = container.querySelector('#bypassSmolLM2') as HTMLInputElement;
    const bypassSmolLM3 = container.querySelector('#bypassSmolLM3') as HTMLInputElement;
    const bypassPhi35 = container.querySelector('#bypassPhi35') as HTMLInputElement;
    const bypassPhi35Transformers = container.querySelector('#bypassPhi35Transformers') as HTMLInputElement;
    const bypassBitnet2B = container.querySelector('#bypassBitnet2B') as HTMLInputElement;
    const bypassQwen3 = container.querySelector('#bypassQwen3') as HTMLInputElement;
    
    if (bypassSmolLM2) bypassSmolLM2.checked = currentSettings.bypassModels.has('HuggingFaceTB/SmolLM2-1.7B-Instruct');
    if (bypassSmolLM3) bypassSmolLM3.checked = currentSettings.bypassModels.has('HuggingFaceTB/SmolLM3-3B-ONNX');
    if (bypassPhi35) bypassPhi35.checked = currentSettings.bypassModels.has('microsoft/Phi-3.5-mini-instruct-onnx');
    if (bypassPhi35Transformers) bypassPhi35Transformers.checked = currentSettings.bypassModels.has('onnx-community/Phi-3.5-mini-instruct-onnx-web');
    if (bypassQwen3) bypassQwen3.checked = currentSettings.bypassModels.has('onnx-community/Qwen3-1.7B-ONNX');
    
    // Setup save button
    const saveButton = container.querySelector('#saveModelSettings') as HTMLButtonElement;
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (LOG_DEBUG) console.log(`${prefix} Save button clicked`);
            if (LOG_DEBUG) console.log(`${prefix} Current settings:`, currentSettings);
            if (LOG_DEBUG) console.log(`${prefix} Checkbox states:`, {
                bypassSmolLM2: bypassSmolLM2?.checked,
                bypassPhi35: bypassPhi35?.checked,
                bypassPhi35Transformers: bypassPhi35Transformers?.checked,
                bypassBitnet2B: bypassBitnet2B?.checked,
                bypassQwen3: bypassQwen3?.checked
            });
            
            // Preserve existing bypass models and only update the ones we're managing in the UI
            const newSettings = {
                maxModelSize: parseFloat(maxModelSizeSlider?.value || '2.1'),
                bypassModels: new Set<string>(Array.from(currentSettings.bypassModels) as string[]) // Copy existing bypass models
            };
            
            if (LOG_DEBUG) console.log(`${prefix} New settings before clearing:`, newSettings);
            
            // Clear the specific models we manage in this UI first
            newSettings.bypassModels.delete('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            newSettings.bypassModels.delete('HuggingFaceTB/SmolLM3-3B-ONNX');
            newSettings.bypassModels.delete('microsoft/Phi-3.5-mini-instruct-onnx');
            newSettings.bypassModels.delete('onnx-community/Phi-3.5-mini-instruct-onnx-web');
            newSettings.bypassModels.delete('onnx-community/Qwen3-1.7B-ONNX');
            
            if (LOG_DEBUG) console.log(`${prefix} After clearing managed models:`, newSettings);
            
            // Add back only the ones that are checked
            if (bypassSmolLM2?.checked) newSettings.bypassModels.add('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            if (bypassSmolLM3?.checked) newSettings.bypassModels.add('HuggingFaceTB/SmolLM3-3B-ONNX');
            if (bypassPhi35?.checked) newSettings.bypassModels.add('microsoft/Phi-3.5-mini-instruct-onnx');
            if (bypassPhi35Transformers?.checked) newSettings.bypassModels.add('onnx-community/Phi-3.5-mini-instruct-onnx-web');
            if (bypassQwen3?.checked) newSettings.bypassModels.add('onnx-community/Qwen3-1.7B-ONNX');
            
            if (LOG_DEBUG) console.log(`${prefix} Final new settings before saving:`, newSettings);
            
            saveModelLoadingSettings(newSettings);
            
            // Trigger manifest refresh to apply new settings
            try {
                // Dispatch event to refresh manifest
                document.dispatchEvent(new CustomEvent('MANIFEST_REFRESH_REQUESTED'));
                alert('Model loading settings saved! The model list will be refreshed automatically.');
            } catch (e) {
                alert('Model loading settings saved! You may need to refresh the model list for changes to take effect.');
            }
        });
    }
    
    // Setup reset button
    const resetButton = container.querySelector('#resetModelSettings') as HTMLButtonElement;
    if (resetButton) {
        resetButton.addEventListener('click', async () => {
            const defaultSettings = getDefaultModelLoadingSettings();
            saveModelLoadingSettings(defaultSettings);
            
            // Update UI
            if (maxModelSizeSlider) maxModelSizeSlider.value = defaultSettings.maxModelSize.toString();
            if (maxModelSizeValue) maxModelSizeValue.textContent = `${defaultSettings.maxModelSize} GB`;
            if (bypassSmolLM2) bypassSmolLM2.checked = defaultSettings.bypassModels.has('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            if (bypassSmolLM3) bypassSmolLM3.checked = defaultSettings.bypassModels.has('HuggingFaceTB/SmolLM3-3B-ONNX');
            if (bypassPhi35) bypassPhi35.checked = defaultSettings.bypassModels.has('microsoft/Phi-3.5-mini-instruct-onnx');
            if (bypassPhi35Transformers) bypassPhi35Transformers.checked = defaultSettings.bypassModels.has('onnx-community/Phi-3.5-mini-instruct-onnx-web');
            if (bypassBitnet2B) bypassBitnet2B.checked = defaultSettings.bypassModels.has('microsoft/bitnet-b1.58-2B-4T-gguf');
            if (bypassQwen3) bypassQwen3.checked = defaultSettings.bypassModels.has('onnx-community/Qwen3-1.7B-ONNX');
            
            // Also reset inference settings to fix generation quality
            try {
                const { DEFAULT_INFERENCE_SETTINGS } = await import('./InferenceSettings');
                const { saveInferenceSettings } = await import('../DB/idbModel');
                await saveInferenceSettings(DEFAULT_INFERENCE_SETTINGS);
                if (LOG_DEBUG) console.log(`${prefix} Inference settings also reset to default`);
            } catch (e) {
                if (LOG_ERROR) console.error(`${prefix} Failed to reset inference settings:`, e);
            }
            
            alert('Model loading settings and inference settings reset to default!');
        });
    }
    
    // Setup inference settings reset button
    const resetInferenceButton = container.querySelector('#resetInferenceSettings') as HTMLButtonElement;
    if (resetInferenceButton) {
        if (LOG_DEBUG) console.log(`${prefix} Found reset inference button, adding event listener`);
        resetInferenceButton.addEventListener('click', async () => {
            if (LOG_DEBUG) console.log(`${prefix} Reset inference button clicked`);
            try {
                // Show immediate feedback
                resetInferenceButton.textContent = 'Resetting...';
                resetInferenceButton.disabled = true;
                
                const { resetSettingsToDefault } = await import('./InferenceSettings');
                await resetSettingsToDefault();
                if (LOG_DEBUG) console.log(`${prefix} Inference settings reset to default`);
                alert('AI generation settings reset to default! This should fix poor response quality.');
            } catch (e) {
                if (LOG_ERROR) console.error(`${prefix} Failed to reset inference settings:`, e);
                alert('Failed to reset AI settings. Please try again.');
            } finally {
                // Reset button state
                resetInferenceButton.textContent = 'Reset AI Settings';
                resetInferenceButton.disabled = false;
            }
        });
    } else {
        if (LOG_ERROR) console.error(`${prefix} Could not find #resetInferenceSettings button`);
    }
}

function getModelLoadingSettings() {
    const stored = localStorage.getItem('modelLoadingSettings');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            return {
                maxModelSize: parsed.maxModelSize || 2.1,
                bypassModels: new Set(parsed.bypassModels || [])
            };
        } catch (e) {
            console.error('[SettingsController] Error parsing model loading settings:', e);
        }
    }
    return getDefaultModelLoadingSettings();
}

function getDefaultModelLoadingSettings() {
    return {
        maxModelSize: 2.1,
        bypassModels: new Set<string>()
    };
}

function saveModelLoadingSettings(settings: { maxModelSize: number; bypassModels: Set<string> }) {
    const bypassArray = Array.from(settings.bypassModels);
    if (LOG_DEBUG) console.log(`${prefix} saveModelLoadingSettings - bypassModels Set:`, settings.bypassModels);
    if (LOG_DEBUG) console.log(`${prefix} saveModelLoadingSettings - bypassModels Array:`, bypassArray);
    if (LOG_DEBUG) console.log(`${prefix} saveModelLoadingSettings - full settings to save:`, {
        maxModelSize: settings.maxModelSize,
        bypassModels: bypassArray
    });
    
    const settingsToSave = {
        maxModelSize: settings.maxModelSize,
        bypassModels: bypassArray
    };
    
    localStorage.setItem('modelLoadingSettings', JSON.stringify(settingsToSave));
    if (LOG_DEBUG) console.log(`${prefix} saveModelLoadingSettings - saved to localStorage:`, localStorage.getItem('modelLoadingSettings'));
}

// Export functions for use in other modules
export function getCurrentModelLoadingSettings() {
    return getModelLoadingSettings();
}

export function updateModelLoadingSettings(settings: { maxModelSize?: number; bypassModels?: Set<string> }) {
    const current = getModelLoadingSettings();
    const updated = {
        maxModelSize: settings.maxModelSize ?? current.maxModelSize,
        bypassModels: settings.bypassModels ?? current.bypassModels
    };
    saveModelLoadingSettings(updated as { maxModelSize: number; bypassModels: Set<string> });
}

export function initializeSettingsController(): any {
    if (isInitialized) {
        if (LOG_DEBUG) console.log(`${prefix} Already initialized.`);
        return;
    }
    if (LOG_DEBUG) console.log(`${prefix} Initializing...`);

    // Remove the old Settings heading if present
    const settingsPageContainer = document.getElementById('page-settings');
    if (!settingsPageContainer) {
        console.warn("[SettingsController] Could not find #page-settings container.");
        return;
    }
    const oldHeading = settingsPageContainer.querySelector('h2');
    if (oldHeading) oldHeading.remove();

    // Remove any old log management section (if present)
    const oldLogSection = settingsPageContainer.querySelector('.log-management-section');
    if (oldLogSection) oldLogSection.remove();

    // Remove any old theme toggle button (if present)
    const oldThemeBtn = settingsPageContainer.querySelector('#theme-toggle-button');
    if (oldThemeBtn) oldThemeBtn.remove();

    // Inject Common Settings foldout (theme toggle)
    const commonSettingsFoldout = createCommonSettingsFoldout();
    settingsPageContainer.appendChild(commonSettingsFoldout);

    // Inject Model Management foldout
    const modelManagementFoldout = createModelManagementFoldout();
    settingsPageContainer.appendChild(modelManagementFoldout);

    // Inject Log Management foldout
    const logManagementFoldout = createLogManagementFoldout();
    settingsPageContainer.appendChild(logManagementFoldout);

    // Inject Model Loading Settings foldout
    const modelLoadingSettingsFoldout = createModelLoadingSettingsFoldout();
    settingsPageContainer.appendChild(modelLoadingSettingsFoldout);

    // Setup model management functionality
    setupModelManagement(settingsPageContainer);

    // Setup listeners for log management buttons
    const viewLogsButton = settingsPageContainer.querySelector('#viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            if (LOG_DEBUG) console.log(`${prefix} View Logs button clicked. Opening log viewer popup...`);
            try {
                const viewerUrl = 'sidepanel.html?view=logs'; 
                browser.windows.create({
                    url: viewerUrl,
                    type: 'popup',
                    width: 800,
                    height: 600
                });
            } catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);
            }
        });
    }
    const resetDbButton = settingsPageContainer.querySelector('#resetDbButton');
    if (resetDbButton) {
        resetDbButton.addEventListener('click', async () => {
            if (LOG_DEBUG) console.log(`${prefix} Reset DB button clicked.`);
            try {
                const request = new DbResetDatabaseRequest();
                const result = await sendDbRequestSmart(request);
                if (result && result.success) {
                    alert('Database reset successfully!');
                } else {
                    alert('Database reset failed.');
                }
                if (LOG_DEBUG) console.log(`${prefix} Reset DB result:`, result);
            } catch (e: any) {
                alert('Failed to reset database: ' + (e.message || e));
                console.error('[SettingsController] Reset DB error:', e);
            }
        });
    }

    // Setup model loading settings
    setupModelLoadingSettings(settingsPageContainer);
    
    // Debug: Check if buttons exist
    if (LOG_DEBUG) {
        const resetBtn = settingsPageContainer.querySelector('#resetInferenceSettings');
        console.log(`${prefix} Reset inference button exists:`, !!resetBtn);
        if (resetBtn) {
            console.log(`${prefix} Reset inference button text:`, resetBtn.textContent);
        }
    }

    // Inject Inference Settings foldout (already styled)
    setupInferenceSettings();

    isInitialized = true;
    if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
    return {}; 
}

function setupModelManagement(container: HTMLElement): void {
    const modelsList = container.querySelector('#modelsList') as HTMLElement;
    const availableModelsList = container.querySelector('#availableModelsList') as HTMLElement;
    const refreshButton = container.querySelector('#refreshModelsButton') as HTMLButtonElement;
    const deleteAllButton = container.querySelector('#deleteAllModelsButton') as HTMLButtonElement;
    const totalStorageValue = container.querySelector('#totalStorageValue') as HTMLElement;

    // Load models on initialization
    loadCachedModels();
    loadAvailableModels();

    // Refresh button
    refreshButton?.addEventListener('click', () => {
        loadCachedModels();
        loadAvailableModels();
    });

    // Delete all button
    deleteAllButton?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all cached models? This action cannot be undone.')) {
            try {
                await deleteAllCachedModels();
                loadCachedModels();
                if (LOG_GENERAL) console.log(`${prefix} All cached models deleted successfully.`);
            } catch (error) {
                if (LOG_ERROR) console.error(`${prefix} Failed to delete all models:`, error);
                alert('Failed to delete all models. Please try again.');
            }
        }
    });

    async function loadCachedModels(): Promise<void> {
        try {
            if (LOG_DEBUG) console.log(`${prefix} Loading cached models...`);
            
            modelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Loading cached models...</div>';
            
            const models = await getAllCachedModels();
            
            if (models.length === 0) {
                modelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">No cached models found.</div>';
                totalStorageValue.textContent = '0 MB';
                return;
            }

            // Calculate total storage
            const totalSize = models.reduce((sum, model) => sum + model.totalSize, 0);
            totalStorageValue.textContent = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

            // Render models
            modelsList.innerHTML = '';
            models.forEach(model => {
                const modelElement = createModelElement(model);
                modelsList.appendChild(modelElement);
            });

            if (LOG_DEBUG) console.log(`${prefix} Loaded ${models.length} cached models.`);
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to load cached models:`, error);
            modelsList.innerHTML = '<div class="text-center text-red-500 py-4">Failed to load cached models.</div>';
        }
    }

    function createModelElement(model: CachedModelInfo): HTMLElement {
        const div = document.createElement('div');
        div.className = 'border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700';
        
        const sizeInMB = (model.totalSize / (1024 * 1024)).toFixed(1);
        const sizeInGB = (model.totalSize / (1024 * 1024 * 1024)).toFixed(2);
        const displaySize = model.totalSize > 1024 * 1024 * 1024 ? `${sizeInGB} GB` : `${sizeInMB} MB`;
        
        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <h5 class="font-medium text-gray-800 dark:text-gray-200 truncate">${model.modelId}</h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${model.modelPath}</p>
                    <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>${displaySize}</span>
                        <span>${model.numChunks} chunks</span>
                        <span>${new Date(model.downloadDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs delete-model-btn" data-model-id="${model.modelId}" data-model-path="${model.modelPath}">
                    Delete
                </button>
            </div>
        `;

        // Add delete button event listener
        const deleteButton = div.querySelector('.delete-model-btn') as HTMLButtonElement;
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${model.modelId}? This action cannot be undone.`)) {
                try {
                    await deleteCachedModel(model);
                    loadCachedModels(); // Refresh the list
                    if (LOG_GENERAL) console.log(`${prefix} Model deleted: ${model.modelId}`);
                } catch (error) {
                    if (LOG_ERROR) console.error(`${prefix} Failed to delete model:`, error);
                    alert('Failed to delete model. Please try again.');
                }
            }
        });

        return div;
    }

    async function loadAvailableModels(): Promise<void> {
        try {
            if (LOG_DEBUG) console.log(`${prefix} Loading available models...`);
            
            availableModelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-2">Loading available models...</div>';
            
            // Import the manifest function
            const { getAllManifestEntries } = await import('../DB/idbModel');
            const manifests = await getAllManifestEntries();
            
            if (manifests.length === 0) {
                availableModelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-2">No models available.</div>';
                return;
            }

            // Render available models
            availableModelsList.innerHTML = '';
            manifests.forEach(manifest => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-800';
                
                const modelId = manifest.repo;
                const files = Object.keys(manifest.quants || {});
                const fileCount = files.length;
                
                div.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <span class="font-medium text-gray-800 dark:text-gray-200 truncate">${modelId}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">${fileCount} files</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Available</span>
                `;

                availableModelsList.appendChild(div);
            });

            if (LOG_DEBUG) console.log(`${prefix} Loaded ${manifests.length} available models.`);
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to load available models:`, error);
            availableModelsList.innerHTML = '<div class="text-center text-red-500 py-2">Failed to load available models.</div>';
        }
    }
} 