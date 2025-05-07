import browser from 'webextension-polyfill';

export function showError(message) {
    console.error("UI Error:", message);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '1000';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

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
}

export const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

export function getActiveTab() {
    if (typeof browser === 'undefined' || !browser.tabs) {
         console.warn("Utils: Browser context or tabs API not available. Cannot get active tab.");
         return Promise.resolve(null);
    }
    return browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            if (tabs && tabs.length > 0) {
                return tabs[0];
            } else {
                return null;
            }
        })
        .catch(error => {
            console.error("Utils: Error querying active tab:", error.message);
            return null;
        });
}

export function getActiveTabUrl() {
    if (typeof browser === 'undefined' || !browser.tabs) {
        console.warn("Utils: Browser context or tabs API not available.");
        return Promise.resolve(null);
    }
    return browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            if (tabs && tabs.length > 0 && tabs[0].url) {
                return tabs[0].url;
            } else {
                return null;
            }
        })
        .catch(error => {
            console.error("Utils: Error querying active tab URL:", error.message);
            return Promise.reject(error);
        });
} 