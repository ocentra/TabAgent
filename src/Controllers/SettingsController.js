// src/Controllers/SettingsController.js

// No imports needed for current logic, but keep in mind for future additions

let isInitialized = false;

// Function to update theme toggle button text based on current theme
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

    // Check if button already exists (e.g., from HMR)
    let themeToggleButton = settingsPageContainer.querySelector('#theme-toggle-button');

    if (!themeToggleButton) {
        console.log("[SettingsController] Creating theme toggle button.");
        themeToggleButton = document.createElement('button');
        themeToggleButton.id = 'theme-toggle-button'; // Give it an ID
        themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-4'; // Standard styling

        themeToggleButton.onclick = () => {
            const htmlElement = document.documentElement;
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            console.log(`[SettingsToggle] Before toggle - isDark: ${isCurrentlyDark}`);

            // Toggle theme
            if (isCurrentlyDark) {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                console.log(`[SettingsToggle] Removed dark class, set localStorage to light`);
            } else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
            }
            updateThemeButtonText(themeToggleButton); // Update text after toggle
        };
        
        // Find a place to insert the button, e.g., after the placeholder paragraph
        const placeholderText = settingsPageContainer.querySelector('p');
        if (placeholderText) {
            placeholderText.insertAdjacentElement('afterend', themeToggleButton);
        } else {
            settingsPageContainer.appendChild(themeToggleButton); // Fallback append
        }
    } else {
        console.log("[SettingsController] Theme toggle button already exists.");
    }

    // Initial setup for the button text
    updateThemeButtonText(themeToggleButton);
}

// Helper function to connect a range slider to its value display span
function setupSlider(sliderId, valueSpanId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueSpanId);

    if (slider && valueSpan) {
        // Set initial value display
        valueSpan.textContent = slider.value;

        // Add event listener to update display on slider change
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
    
    // --- Setup Inference Setting Sliders --- 
    setupSlider('setting-temperature', 'setting-temperature-value');
    setupSlider('setting-repeat-penalty', 'setting-repeat-penalty-value');
    setupSlider('setting-top-p', 'setting-top-p-value');
    setupSlider('setting-min-p', 'setting-min-p-value');
    // --- End Setup Inference Setting Sliders ---

    // --- Setup Log Management Buttons ---
    const viewLogsButton = document.getElementById('viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            console.log('[SettingsController] View Logs button clicked. Opening log viewer popup...');
            try {
                // Open sidepanel.html with query param for log viewer context
                const viewerUrl = 'sidepanel.html?view=logs'; 
                
                // Use chrome.windows.create for a popup
                chrome.windows.create({
                     url: viewerUrl, // Use the modified relative path
                     type: 'popup',
                     width: 800, // Specify desired width
                     height: 600 // Specify desired height
                 });
            } catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);
                // Optionally show an error to the user in the sidepanel UI
            }
        });
        console.log('[SettingsController] Added listener to View Logs button.');
    } else {
        console.warn('[SettingsController] View Logs button (viewLogsButton) not found.');
    }
    // --- End Setup Log Management Buttons ---

    // Add other settings initialization here if needed

    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");

    return {}; // No public methods needed for now
} 