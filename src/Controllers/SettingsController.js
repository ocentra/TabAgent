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

export function initializeSettingsController() {
    if (isInitialized) {
        console.log("[SettingsController] Already initialized.");
        return;
    }
    console.log("[SettingsController] Initializing...");

    setupThemeToggle();
    
    // Add other settings initialization here if needed

    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");

    return {}; // No public methods needed for now
} 