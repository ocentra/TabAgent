// src/Controllers/SettingsController.js
import browser from 'webextension-polyfill';
import { sendDbRequestSmart } from '../sidepanel';
import { DbResetDatabaseRequest } from '../DB/dbEvents';
import { setupInferenceSettings } from './InferenceSettings';

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
                        <input type="checkbox" id="bypassPhi35" class="rounded border-gray-300">
                        <label for="bypassPhi35" class="text-sm text-gray-700 dark:text-gray-300">
                            Phi-3.5 Mini
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
    const bypassPhi35 = container.querySelector('#bypassPhi35') as HTMLInputElement;
    const bypassBitnet2B = container.querySelector('#bypassBitnet2B') as HTMLInputElement;
    const bypassQwen3 = container.querySelector('#bypassQwen3') as HTMLInputElement;
    
    if (bypassSmolLM2) bypassSmolLM2.checked = currentSettings.bypassModels.has('HuggingFaceTB/SmolLM2-1.7B-Instruct');
    if (bypassPhi35) bypassPhi35.checked = currentSettings.bypassModels.has('microsoft/Phi-3.5-mini-instruct-onnx');
    if (bypassBitnet2B) bypassBitnet2B.checked = currentSettings.bypassModels.has('microsoft/bitnet-b1.58-2B-4T-gguf');
    if (bypassQwen3) bypassQwen3.checked = currentSettings.bypassModels.has('onnx-community/Qwen3-1.7B-ONNX');
    
    // Setup save button
    const saveButton = container.querySelector('#saveModelSettings') as HTMLButtonElement;
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            console.log('[SettingsController] Save button clicked');
            console.log('[SettingsController] Current settings:', currentSettings);
            console.log('[SettingsController] Checkbox states:', {
                bypassSmolLM2: bypassSmolLM2?.checked,
                bypassPhi35: bypassPhi35?.checked,
                bypassBitnet2B: bypassBitnet2B?.checked,
                bypassQwen3: bypassQwen3?.checked
            });
            
            // Preserve existing bypass models and only update the ones we're managing in the UI
            const newSettings = {
                maxModelSize: parseFloat(maxModelSizeSlider?.value || '2.1'),
                bypassModels: new Set<string>(Array.from(currentSettings.bypassModels) as string[]) // Copy existing bypass models
            };
            
            console.log('[SettingsController] New settings before clearing:', newSettings);
            
            // Clear the specific models we manage in this UI first
            newSettings.bypassModels.delete('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            newSettings.bypassModels.delete('microsoft/Phi-3.5-mini-instruct-onnx');
            newSettings.bypassModels.delete('microsoft/bitnet-b1.58-2B-4T-gguf');
            newSettings.bypassModels.delete('onnx-community/Qwen3-1.7B-ONNX');
            
            console.log('[SettingsController] After clearing managed models:', newSettings);
            
            // Add back only the ones that are checked
            if (bypassSmolLM2?.checked) newSettings.bypassModels.add('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            if (bypassPhi35?.checked) newSettings.bypassModels.add('microsoft/Phi-3.5-mini-instruct-onnx');
            if (bypassBitnet2B?.checked) newSettings.bypassModels.add('microsoft/bitnet-b1.58-2B-4T-gguf');
            if (bypassQwen3?.checked) newSettings.bypassModels.add('onnx-community/Qwen3-1.7B-ONNX');
            
            console.log('[SettingsController] Final new settings before saving:', newSettings);
            
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
        resetButton.addEventListener('click', () => {
            const defaultSettings = getDefaultModelLoadingSettings();
            saveModelLoadingSettings(defaultSettings);
            
            // Update UI
            if (maxModelSizeSlider) maxModelSizeSlider.value = defaultSettings.maxModelSize.toString();
            if (maxModelSizeValue) maxModelSizeValue.textContent = `${defaultSettings.maxModelSize} GB`;
            if (bypassSmolLM2) bypassSmolLM2.checked = defaultSettings.bypassModels.has('HuggingFaceTB/SmolLM2-1.7B-Instruct');
            if (bypassPhi35) bypassPhi35.checked = defaultSettings.bypassModels.has('microsoft/Phi-3.5-mini-instruct-onnx');
            if (bypassBitnet2B) bypassBitnet2B.checked = defaultSettings.bypassModels.has('microsoft/bitnet-b1.58-2B-4T-gguf');
            
            alert('Model loading settings reset to default!');
        });
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
    console.log('[SettingsController] saveModelLoadingSettings - bypassModels Set:', settings.bypassModels);
    console.log('[SettingsController] saveModelLoadingSettings - bypassModels Array:', bypassArray);
    console.log('[SettingsController] saveModelLoadingSettings - full settings to save:', {
        maxModelSize: settings.maxModelSize,
        bypassModels: bypassArray
    });
    
    const settingsToSave = {
        maxModelSize: settings.maxModelSize,
        bypassModels: bypassArray
    };
    
    localStorage.setItem('modelLoadingSettings', JSON.stringify(settingsToSave));
    console.log('[SettingsController] saveModelLoadingSettings - saved to localStorage:', localStorage.getItem('modelLoadingSettings'));
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
        console.log("[SettingsController] Already initialized.");
        return;
    }
    console.log("[SettingsController] Initializing...");

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

    // Inject Log Management foldout
    const logManagementFoldout = createLogManagementFoldout();
    settingsPageContainer.appendChild(logManagementFoldout);

    // Inject Model Loading Settings foldout
    const modelLoadingSettingsFoldout = createModelLoadingSettingsFoldout();
    settingsPageContainer.appendChild(modelLoadingSettingsFoldout);

    // Setup listeners for log management buttons
    const viewLogsButton = settingsPageContainer.querySelector('#viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            console.log('[SettingsController] View Logs button clicked. Opening log viewer popup...');
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
            console.log('[SettingsController] Reset DB button clicked.');
            try {
                const request = new DbResetDatabaseRequest();
                const result = await sendDbRequestSmart(request);
                if (result && result.success) {
                    alert('Database reset successfully!');
                } else {
                    alert('Database reset failed.');
                }
                console.log('[SettingsController] Reset DB result:', result);
            } catch (e: any) {
                alert('Failed to reset database: ' + (e.message || e));
                console.error('[SettingsController] Reset DB error:', e);
            }
        });
    }

    // Setup model loading settings
    setupModelLoadingSettings(settingsPageContainer);

    // Inject Inference Settings foldout (already styled)
    setupInferenceSettings();

    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");
    return {}; 
} 