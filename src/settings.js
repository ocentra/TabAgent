export function initializeSettingsPage() {
    console.log("Settings Page Initialized (Placeholder)");
    // TODO: Add settings controls (e.g., theme toggle, API keys?)
    const settingsContent = document.getElementById('page-settings')?.querySelector('p');
    if (settingsContent) {
        settingsContent.textContent = "Settings controls will be added here."; 

        // --- Theme Toggle Button --- 
        const themeToggleButton = document.createElement('button');
        themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-2'; // Added mt-2 for spacing

        // Function to update button text based on current theme
        const updateThemeButtonText = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            themeToggleButton.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        };

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
            updateThemeButtonText(); // Update text after toggle

            // --- DEBUG: Log computed styles AFTER toggle ---
            // Use setTimeout to allow styles to potentially apply after class change
            setTimeout(() => {
                const bodyStyles = window.getComputedStyle(document.body);
                const inputElement = document.getElementById('query-input');
                const inputStyles = inputElement ? window.getComputedStyle(inputElement) : null;
                const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

                console.log(`[ComputedStyles - ${currentTheme} mode] body bg: ${bodyStyles.getPropertyValue('background-color')}, body color: ${bodyStyles.getPropertyValue('color')}`);
                if (inputStyles) {
                    console.log(`[ComputedStyles - ${currentTheme} mode] #query-input bg: ${inputStyles.getPropertyValue('background-color')}, color: ${inputStyles.getPropertyValue('color')}`);
                }
            }, 0); // setTimeout with 0 delay to run after current execution stack
            // --- END DEBUG ---
        };

        // Initial setup
        settingsContent.parentNode.appendChild(themeToggleButton); // Add button to DOM
        updateThemeButtonText(); // Set initial button text
    }
} 