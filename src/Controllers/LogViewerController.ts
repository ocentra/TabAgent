// src/Controllers/LogViewerController.js


import { DbGetLogsRequest, DbGetUniqueLogValuesRequest } from '../DB/dbEvents';
import { sendDbRequestSmart } from '../sidepanel';
import browser from 'webextension-polyfill';

console.log('[LogViewerController] Script loaded.');

let currentlyDisplayedLogs: any[] = []; 

let logContainer: HTMLDivElement | null, sessionSelect: HTMLSelectElement | null, componentSelect: HTMLSelectElement | null, levelSelect: HTMLSelectElement | null, refreshButton: HTMLButtonElement | null, copyButton: HTMLButtonElement | null, downloadButton: HTMLButtonElement | null, clearButton: HTMLButtonElement | null;

/**
 * @param {object} log 
 * @returns {string}
 */
function formatLogEntryToHTML(log: any): string {
    const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : 'NO_TIMESTAMP';
    const session = log.extensionSessionId ? log.extensionSessionId.slice(-8) : 'NO_SESSION'; 
    const component = log.component || 'NO_COMPONENT';
    const level = (log.level || 'NO_LEVEL').toLowerCase();
    const message = log.message || '';
    const levelClass = `log-level-${level}`;
    const escapedMessage = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `<div class="log-line ${levelClass}">[${timestamp}][${session}][${component}][${level.toUpperCase()}] ${escapedMessage}</div>`;
}

/**
 * @param {Array<object>} logsArray 
 */
function displayLogs(logsArray: any[]): void {
    currentlyDisplayedLogs = logsArray || []; 
    logContainer = document.getElementById('log-viewer-display-area') as HTMLDivElement | null; 
    if (!logContainer) {
        console.error("[LogViewerController] Cannot find log display area #log-viewer-display-area");
        return;
    }

    if (!Array.isArray(logsArray) || logsArray.length === 0) {
        logContainer.innerHTML = '<div class="text-center p-4 text-gray-500 dark:text-gray-400">No logs match the current filters.</div>';
        return;
    }
    const logsHtml = logsArray.map(formatLogEntryToHTML).join('');
    logContainer.innerHTML = logsHtml;
    console.debug(`[LogViewerController] Displayed ${logsArray.length} log entries.`);
}

function getDbProxy(): any {
    // If sendDbRequestSmart is available, use it; otherwise fallback to browser.runtime.sendMessage
    return (typeof sendDbRequestSmart === 'function')
        ? (req: any) => sendDbRequestSmart(req)
        : (req: any) => browser.runtime.sendMessage(req);
}

/**
 * @param {string} selectElementId 
 * @param {string} fieldName 
 * @param {string} [defaultValue='all'] 
 */
async function populateViewerDropdown(selectElementId: string, fieldName: string, defaultValue: string = 'all'): Promise<void> {
    const selectElement = document.getElementById(selectElementId) as HTMLSelectElement | null;
    if (!selectElement) {
         console.error(`[LogViewerController] Dropdown element not found: #${selectElementId}`);
        return;
    }

    console.debug(`[LogViewerController] Populating viewer dropdown ${selectElementId} for ${fieldName}, default: ${defaultValue}`);
    try {
        const dbProxy = getDbProxy();
        const response = await dbProxy(new DbGetUniqueLogValuesRequest(fieldName));
        if (!response || !response.success) {
            throw new Error(response?.error || `Background script failed for ${fieldName}`);
        }
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        (response.data || []).forEach((value: any) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = (fieldName === 'extensionSessionId' && value && value.length > 10) ? `...${value.slice(-8)}` : value;
            selectElement.appendChild(option);
        });
        selectElement.value = defaultValue; 
    } catch (error: unknown) {
        console.error(`[LogViewerController] Error populating dropdown ${selectElementId} (field: ${fieldName}):`, error);
        let message = 'Unknown error';
        if (error instanceof Error) message = error.message;
        if(logContainer) logContainer.innerHTML += `<div class="log-line log-level-error">Error populating ${fieldName} filter: ${message}</div>`;
    }
}

async function fetchAndDisplayLogs(): Promise<void> {
    logContainer = document.getElementById('log-viewer-display-area') as HTMLDivElement | null;
    if (!logContainer) {
        console.error("[LogViewerController] Cannot fetch logs, display area not found.");
        return;
    }
    sessionSelect = document.getElementById('viewerSessionSelect') as HTMLSelectElement | null;
    componentSelect = document.getElementById('viewerComponentSelect') as HTMLSelectElement | null;
    levelSelect = document.getElementById('viewerLevelSelect') as HTMLSelectElement | null;
    refreshButton = document.getElementById('viewerRefreshButton') as HTMLButtonElement | null;
    if (!sessionSelect || !componentSelect || !levelSelect || !refreshButton) {
        console.error("[LogViewerController] One or more filter controls not found.");
        if (logContainer) logContainer.innerHTML = `<div class="log-line log-level-error">Error: Filter controls not found.</div>`;
        return;
    }
    const filters = {
        sessionIds: [sessionSelect.value || 'all'], 
        components: [componentSelect.value || 'all'],
        levels: [levelSelect.value || 'all']
    };
    console.info('[LogViewerController] Fetching logs with filters:', filters);
    logContainer.innerHTML = '<div class="text-center p-4 text-gray-500 dark:text-gray-400">Fetching logs...</div>';
    refreshButton.disabled = true;
    try {
        const dbProxy = getDbProxy();
        const response = await dbProxy(new DbGetLogsRequest(filters));
        if (!response || !response.success) {
            throw new Error(response?.error || 'Background script failed to fetch logs.');
        }
        displayLogs(response.data || []);
    } catch (error: unknown) {
        console.error('[LogViewerController] Error fetching or displaying logs:', error);
        displayLogs([]);
        let message = 'Unknown error';
        if (error instanceof Error) message = error.message;
        logContainer.innerHTML = `<div class="log-line log-level-error">Error fetching logs: ${message}</div>`;
    } finally {
         if (refreshButton) refreshButton.disabled = false;
    }
}

/**
 * @param {Array<object>} logsArray 
 * @returns {string} 
 */
function formatLogsToString(logsArray: any[]): string {
    if (!Array.isArray(logsArray)) return "No logs found or invalid data.";
    return logsArray.map(log => {
        const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : 'NO_TIMESTAMP';
        const session = log.extensionSessionId || 'NO_SESSION'; // Use correct field name
        const component = log.component || 'NO_COMPONENT';
        const level = (log.level || 'NO_LEVEL').toUpperCase();
        const message = log.message || '';
        return `[${timestamp}][${session}][${component}][${level}] ${message}`;
    }).join('\n');
}

export async function initializeLogViewerController(): Promise<void> {
    console.log('[LogViewerController] Initializing...');

    logContainer = document.getElementById('log-viewer-display-area') as HTMLDivElement | null;
    sessionSelect = document.getElementById('viewerSessionSelect') as HTMLSelectElement | null;
    componentSelect = document.getElementById('viewerComponentSelect') as HTMLSelectElement | null;
    levelSelect = document.getElementById('viewerLevelSelect') as HTMLSelectElement | null;
    refreshButton = document.getElementById('viewerRefreshButton') as HTMLButtonElement | null;
    copyButton = document.getElementById('viewerCopyButton') as HTMLButtonElement | null;
    downloadButton = document.getElementById('viewerDownloadButton') as HTMLButtonElement | null;
    clearButton = document.getElementById('viewerClearButton') as HTMLButtonElement | null; // Note: Clear button logic might need DB interaction later

    if (!logContainer || !sessionSelect || !componentSelect || !levelSelect || !refreshButton || !copyButton || !downloadButton || !clearButton) {
        console.error("[LogViewerController] Failed to find all required elements within #page-log-viewer. Initialization aborted.");
        if(logContainer) logContainer.textContent = 'Initialization Error: Could not find page elements.';
        else console.error("Log container itself (#log-viewer-display-area) not found.");
        return;
    }

    await Promise.all([
        populateViewerDropdown('viewerSessionSelect', 'extensionSessionId'),
        populateViewerDropdown('viewerComponentSelect', 'component'),
        populateViewerDropdown('viewerLevelSelect', 'level')
    ]);

    await fetchAndDisplayLogs();

    refreshButton.addEventListener('click', fetchAndDisplayLogs);
    sessionSelect.addEventListener('change', fetchAndDisplayLogs);
    componentSelect.addEventListener('change', fetchAndDisplayLogs);
    levelSelect.addEventListener('change', fetchAndDisplayLogs);

    copyButton.addEventListener('click', () => {
        console.info('[LogViewerController] Copy Logs button clicked.');
        const formattedText = formatLogsToString(currentlyDisplayedLogs);
        navigator.clipboard.writeText(formattedText).then(() => {
            console.info('[LogViewerController] Logs copied to clipboard.');
            if (!copyButton) return;
            const originalText = copyButton.innerHTML;
            copyButton.textContent = 'Copied!';
            setTimeout(() => { if (copyButton) copyButton.innerHTML = originalText; }, 1500); 
        }, (err) => {
            console.error('[LogViewerController] Failed to copy logs:', err);
            alert('Failed to copy logs to clipboard.');
        });
    });

    downloadButton.addEventListener('click', () => {
        console.info('[LogViewerController] Download Logs button clicked.');
        const filters = {
             sessionIds: [sessionSelect?.value || 'all'],
             components: [componentSelect?.value || 'all'],
             levels: [levelSelect?.value || 'all']
        };
        const formattedText = formatLogsToString(currentlyDisplayedLogs);
        const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const filename = `tabagent-logs-view-${filters.sessionIds[0]}-${filters.components[0]}-${filters.levels[0]}.txt`.replace(/[:\\/*?"<>|]/g, '_'); // Sanitize
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.info(`[LogViewerController] Log download triggered for ${filename}.`);
    });
    
    clearButton.addEventListener('click', () => {
         console.warn('[LogViewerController] Clear button clicked - currently only clears display, does not delete from DB.');
         displayLogs([]); // Just clear the current view
         // Future: Could send a 'clearLogsRequest' to db.js if desired
    });

    console.info("[LogViewerController] Initialized successfully.");
}

