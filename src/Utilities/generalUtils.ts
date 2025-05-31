import browser from 'webextension-polyfill';

export function showError(message: string): void {
    const container = document.getElementById('ui-inline-messages');
    if (!container) return;
    const errorDiv = document.createElement('div');
    errorDiv.style.background = '#fff1f0';
    errorDiv.style.color = '#a8071a';
    errorDiv.style.border = '1px solid #ffa39e';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.padding = '4px 10px';
    errorDiv.style.margin = '2px 0';
    errorDiv.style.fontSize = '0.92em';
    errorDiv.style.display = 'inline-block';
    errorDiv.style.maxWidth = '100%';
    errorDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

export function showWarning(message: string): void {
    const container = document.getElementById('ui-inline-messages');
    if (!container) return;
    const warnDiv = document.createElement('div');
    warnDiv.style.background = '#fffbe6';
    warnDiv.style.color = '#856404';
    warnDiv.style.border = '1px solid #ffe58f';
    warnDiv.style.borderRadius = '4px';
    warnDiv.style.padding = '4px 10px';
    warnDiv.style.margin = '2px 0';
    warnDiv.style.fontSize = '0.92em';
    warnDiv.style.display = 'inline-block';
    warnDiv.style.maxWidth = '100%';
    warnDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
    warnDiv.textContent = message;
    container.appendChild(warnDiv);
    setTimeout(() => warnDiv.remove(), 5000);
}

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>): void {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

export function getActiveTab(): Promise<any | null> {
    if (typeof browser === 'undefined' || !browser.tabs) {
         console.warn("Utils: Browser context or tabs API not available. Cannot get active tab.");
         return Promise.resolve(null);
    }
    return browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs: any[]) => {
            if (tabs && tabs.length > 0) {
                return tabs[0];
            } else {
                return null;
            }
        })
        .catch((error: any) => {
            console.error("Utils: Error querying active tab:", error.message);
            return null;
        });
}

export function getActiveTabUrl(): Promise<string | null> {
    if (typeof browser === 'undefined' || !browser.tabs) {
        console.warn("Utils: Browser context or tabs API not available.");
        return Promise.resolve(null);
    }
    return browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs: any[]) => {
            if (tabs && tabs.length > 0 && tabs[0].url) {
                return tabs[0].url!;
            } else {
                return null;
            }
        })
        .catch((error: any) => {
            console.error("Utils: Error querying active tab URL:", error.message);
            return Promise.reject(error);
        });
} 