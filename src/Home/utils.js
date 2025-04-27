// src/utils.js

// Why: Provides a consistent way to display temporary error notifications to the user.
export function showError(message) {
    console.error("UI Error:", message);
    const errorDiv = document.createElement('div');
    // Basic styling for visibility
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'red'; // Consider using CSS vars
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '1000'; // Ensure visibility
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Why: Limits the rate at which a function can fire, useful for event handlers like search input.
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Why: Provides a standard way to identify potential URLs in user input.
export const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

// Why: Encapsulates the Chrome API call to get the currently active tab details.
export function getActiveTab() {
    return new Promise((resolve, reject) => {
        // Ensure running in an extension context
        if (typeof chrome === 'undefined' || !chrome.tabs) {
             console.warn("Utils: Chrome tabs API not available. Cannot get active tab.");
             return resolve(null); // Resolve with null if not in extension context
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error("Utils: Error querying active tab:", chrome.runtime.lastError.message);
                // Don't reject, resolve with null to indicate failure to get tab
                return resolve(null);
            }
            if (tabs && tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                // No active tab found in the current window
                resolve(null);
            }
        });
    });
} 