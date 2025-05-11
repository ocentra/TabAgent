// src/Controllers/SettingsController.js
import browser from 'webextension-polyfill';


let isInitialized = false;

const updateThemeButtonText = (button) => {
    if (!button) return;
    const isDarkMode = document.documentElement.classList.contains('dark');
    button.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
};

function setupThemeToggle() {
    const settingsPageContainer = document.getElementById('page-settings');
    if (!settingsPageContainer) {
        console.warn("[SettingsController] Could not find #page-settings container.");
        return;
    }

    let themeToggleButton = settingsPageContainer.querySelector('#theme-toggle-button');

    if (!themeToggleButton) {
        console.log("[SettingsController] Creating theme toggle button.");
        themeToggleButton = document.createElement('button');
        themeToggleButton.id = 'theme-toggle-button';
        themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-4'; // Standard styling

        themeToggleButton.onclick = () => {
            const htmlElement = document.documentElement;
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            console.log(`[SettingsToggle] Before toggle - isDark: ${isCurrentlyDark}`);

            if (isCurrentlyDark) {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                console.log(`[SettingsToggle] Removed dark class, set localStorage to light`);
            } else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
            }
            updateThemeButtonText(themeToggleButton); 
        };
        
        const placeholderText = settingsPageContainer.querySelector('p');
        if (placeholderText) {
            placeholderText.insertAdjacentElement('afterend', themeToggleButton);
        } else {
            settingsPageContainer.appendChild(themeToggleButton);
        }
    } else {
        console.log("[SettingsController] Theme toggle button already exists.");
    }

    updateThemeButtonText(themeToggleButton);
}

function setupSlider(sliderId, valueSpanId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueSpanId);

    if (slider && valueSpan) {
        valueSpan.textContent = slider.value;
        slider.addEventListener('input', (event) => {
            valueSpan.textContent = event.target.value;
        });
        console.log(`[SettingsController] Setup slider ${sliderId} with value display ${valueSpanId}`);
    } else {
        if (!slider) console.warn(`[SettingsController] Slider element not found: #${sliderId}`);
        if (!valueSpan) console.warn(`[SettingsController] Value span element not found: #${valueSpanId}`);
    }
}

export function initializeSettingsController() {
    if (isInitialized) {
        console.log("[SettingsController] Already initialized.");
        return;
    }
    console.log("[SettingsController] Initializing...");

    setupThemeToggle();
    
    setupSlider('setting-temperature', 'setting-temperature-value');
    setupSlider('setting-repeat-penalty', 'setting-repeat-penalty-value');
    setupSlider('setting-top-p', 'setting-top-p-value');
    setupSlider('setting-min-p', 'setting-min-p-value');

    const viewLogsButton = document.getElementById('viewLogsButton');
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
        console.log('[SettingsController] Added listener to View Logs button.');
    } else {
        console.warn('[SettingsController] View Logs button (viewLogsButton) not found.');
    }


    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");

    return {}; 
} 