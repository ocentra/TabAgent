import {  UIEventNames, WorkerEventNames } from '../events/eventNames';
import {  DBEventNames } from '../DB/dbEvents';
import {  clearTemporaryMessages } from './chatRenderer';
import browser from 'webextension-polyfill';
import { dbChannel } from '../DB/idbSchema';
import { DbStatusUpdatedNotification } from '../DB/dbEvents';
import {  QuantStatus, getAllManifestEntries, QuantInfo } from '../DB/idbModel';


let queryInput: HTMLTextAreaElement | null,
    sendButton: HTMLButtonElement | null,
    chatBody: HTMLElement | null,
    attachButton: HTMLButtonElement | null,
    fileInput: HTMLInputElement | null,
    loadingIndicatorElement: HTMLElement | null,
    newChatButton: HTMLButtonElement | null,
    modelLoadProgress: HTMLElement | null;

let isInitialized = false;
let attachFileCallback: (() => void) | null | undefined = null;
let currentSessionId: string | null = null;
let modelSelectorDropdown: HTMLSelectElement | null = null;
let quantSelectorDropdown: HTMLSelectElement | null = null;

let loadModelButton: HTMLButtonElement | null = null;    

let isLoadingModel = false; // Track loading state
let currentLoadId: string | null = null;
let lastSeenLoadId: string | null = null;

// Define available models (can be moved elsewhere later)
export const AVAILABLE_MODELS = {
    // Model ID (value) : Display Name
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "onnx-models/all-MiniLM-L6-v2-onnx": "MiniLM-L6-v2",
    // Add more models here as needed
};

document.addEventListener(DbStatusUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    console.log('[UIController] Received DbStatusUpdatedNotification: ', customEvent.detail);
    handleStatusUpdate(customEvent.detail);
  });

// Add this at the top level to ensure UI progress bar updates
browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    const type = message?.type;
    console.log('[UIController] browser.runtime.onMessage Received progress update: ', message.type, message.payload);
    if (message.type === DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }

    if (Object.values(DBEventNames).includes(type)) {
        return false;
    }
});

dbChannel.onmessage = (event) => {
    const message = event.data;
    const type = message?.type;
    console.log('[UIController] dbChannel.onmessage Received progress update: ', message.type, message.payload);
    if (type === DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
    // Add other notification types as needed
};

function selectElements() {
    queryInput = document.getElementById('query-input') as HTMLTextAreaElement | null;
    sendButton = document.getElementById('send-button') as HTMLButtonElement | null;
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button') as HTMLButtonElement | null;
    fileInput = document.getElementById('file-input') as HTMLInputElement | null;
    loadingIndicatorElement = document.getElementById('loading-indicator');
    modelLoadProgress = document.getElementById('model-load-progress') as HTMLElement | null;
    modelSelectorDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
    quantSelectorDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    loadModelButton = document.getElementById('load-model-button') as HTMLButtonElement | null;    

    if (!queryInput || !sendButton || !chatBody || !attachButton || !fileInput /*|| !sessionListElement*/) {
        console.error("UIController: One or more essential elements not found (excluding session list)!");
        return false;
    }
    return true;
}

function attachListeners() {
    queryInput?.addEventListener('input', adjustTextareaHeight);
    queryInput?.addEventListener('keydown', handleEnterKey);
    sendButton?.addEventListener('click', handleSendButtonClick);
    attachButton?.addEventListener('click', handleAttachClick);

    modelSelectorDropdown?.addEventListener('change', _handleModelOrVariantChange);
    quantSelectorDropdown?.addEventListener('change', _handleModelOrVariantChange);
    loadModelButton?.addEventListener('click', _handleLoadModelButtonClick);
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);

    modelSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    quantSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    loadModelButton?.removeEventListener('click', _handleLoadModelButtonClick);
}

function handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const messageText = getInputValue();
        if (messageText && !queryInput!.disabled) {
            console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
            document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
            clearInput();
        } else {
             console.log("[UIController] Enter key pressed, but input is empty or disabled.");
        }
    }
}

function handleSendButtonClick() {
    const messageText = getInputValue();
    if (messageText && !queryInput!.disabled) {
        console.log("[UIController] Send button clicked. Publishing ui:querySubmitted");
        document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
        clearInput();
    } else {
        console.log("[UIController] Send button clicked, but input is empty or disabled.");
    }
}

function handleAttachClick() {
    if (attachFileCallback) {
        attachFileCallback();
    }
}

// In uiController.ts, add this new exported function:
export function getModelSelectorOptions(): string[] {
    if (!modelSelectorDropdown) return [];
    return Array.from(modelSelectorDropdown.options).map(opt => opt.value).filter(Boolean); 
}
export function adjustTextareaHeight() {
    if (!queryInput) return;
    queryInput.style.height = 'auto';
    const maxHeight = 150;
    const scrollHeight = queryInput.scrollHeight;
    queryInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    if (sendButton) {
        sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
    }
}

function setInputStateInternal(status: string) {
    console.log(`[UIController] setInputStateInternal called with status: ${status}`);
    if (!isInitialized || !queryInput || !sendButton) return;
    switch (status) {
        case 'processing':
            queryInput.disabled = true;
            sendButton.disabled = true;
            break;
        case 'error':
        case 'idle':
        case 'complete':
        default:
            queryInput.disabled = false;
            adjustTextareaHeight();
            break;
    }
    console.log(`[UIController] Input disabled state: ${queryInput.disabled}`);
}



function handleStatusUpdate(notification: any) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) return;
    if (notification.sessionId === currentSessionId) {
        setInputStateInternal(notification.payload.status || 'idle');
    }
}

document.addEventListener(UIEventNames.MODEL_WORKER_LOADING_PROGRESS, (e: Event) => {
    handleModelWorkerLoadingProgress((e as CustomEvent).detail);
});
function handleModelWorkerLoadingProgress(payload: any) {
    if (!payload) return;
    // Double progress trigger detection
    if (payload.loadId !== lastSeenLoadId) {
        console.warn('[UIController] New loadId detected in progress:', payload.loadId);
        if (lastSeenLoadId) {
            console.error('[UIController] DOUBLE PROGRESS TRIGGER! Previous:', lastSeenLoadId, 'New:', payload.loadId);
        }
        lastSeenLoadId = payload.loadId;
    }
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');

    if (!statusDiv || !statusText || !progressBar || !progressInner) {
        console.warn('[UIController] Model load progress bar not found.');
        return;
    }

    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';

    // Handle error
    if (payload.status === 'error' || payload.error) {
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; // red
        progressInner.style.width = '100%';
        isLoadingModel = false;
        if (loadModelButton) {
            loadModelButton.disabled = false;
            setLoadModelButtonText('Load Model');
        }
        enableInput();
        setTimeout(() => { statusDiv.style.display = 'none'; }, 1500);
        lastSeenLoadId = null;
        return;
    }

    let percent = payload.progress || payload.percent || 0;
    percent = Math.max(0, Math.min(100, percent));
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green

    function formatBytes(bytes: number) {
        if (!bytes && bytes !== 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function truncateFileName(name: string, maxLen = 32) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 3) + '...' : name;
    }

    let text = '';
    let shortFile = payload.file ? truncateFileName(payload.file) : '';
    switch (payload.status) {
        case 'initiate':
            text = `Starting download: ${shortFile}`;
            break;
        case 'progress':
            text = `Downloading ${shortFile}`;
            if (typeof payload.loaded === 'number' && typeof payload.total === 'number') {
                text += `... ${Math.round(percent)}% (${formatBytes(payload.loaded)} / ${formatBytes(payload.total)})`;
            } else {
                text += `... ${Math.round(percent)}%`;
            }
            break;
        case 'done':
            text = `${shortFile} downloaded. Preparing pipeline...`;
            break;
        case 'ready':
            text = `Model ready!`;
            break;
        default:
            text = 'Loading...';
    }
    statusText.textContent = text;

    if ((percent >= 100 || payload.status === 'done' || payload.status === 'ready') && !(payload.status === 'error' || payload.error)) {
        isLoadingModel = false;
        if (loadModelButton) {
            loadModelButton.disabled = false;
            setLoadModelButtonText('Load Model');
        }
        enableInput();
        setTimeout(() => { statusDiv.style.display = 'none'; }, 150);
        lastSeenLoadId = null;
    }
}


export function getCurrentlySelectedModel(): { modelId: string | null; quant: string | null } {
    if (!modelSelectorDropdown || !quantSelectorDropdown) return { modelId: null, quant: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        quant: quantSelectorDropdown.value || null,
    };
}



export function normalizeQuant(quantDisplay: string): string {
  // Remove emoji and non-alphanumeric characters (except underscore)
  const cleaned = quantDisplay.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const map: Record<string, string> = {
    'auto': 'auto',
    'fp32': 'fp32',
    'fp16': 'fp16',
    'int8': 'int8',
    'uint8': 'uint8',
    'q4': 'q4',
    'q4f16': 'q4f16',
    'bnb4': 'bnb4',
    'nf4': 'nf4',
  };
  return map[cleaned] || cleaned;
}

export async function initializeUI(callbacks: { onAttachFile?: () => void; onNewChat?: () => void }) {
    console.log("[UIController] Initializing...");
    if (isInitialized) {
        removeListeners();
    }
    if (!selectElements()) {
        isInitialized = false;
        return null;
    }
    attachFileCallback = callbacks?.onAttachFile;
    
    attachListeners();
    
    newChatButton = document.getElementById('new-chat-button') as HTMLButtonElement | null;
    if (newChatButton && callbacks?.onNewChat) {
        newChatButton.addEventListener('click', callbacks.onNewChat);
    }

    isInitialized = true;
    setInputStateInternal('idle');
    adjustTextareaHeight();
    console.log("[UIController] Initialized successfully.");

    console.log(`[UIController] Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);

    clearTemporaryMessages();


    disableInput("Download or load a model from dropdown to begin.");

    console.log("[UIController] Initializing UI elements...");

    console.log("[UIController] Attempting to find model selector...");
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    console.log(modelSelector ? "[UIController] Model selector found." : "[UIController] WARNING: Model selector NOT found!");
    if (modelSelector) {
        modelSelector.innerHTML = ''; // Clear existing options
        console.log("[UIController] Populating model selector. Available models:", AVAILABLE_MODELS);
        let hasModel = false;
        for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
            console.log(`[UIController] Adding option: ${displayName} (${modelId})`);
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            modelSelector.appendChild(option);
            hasModel = true;
        }
        if (!hasModel) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            option.selected = true;
            modelSelector.appendChild(option);
        }
        modelSelector.disabled = !hasModel;
        if (loadModelButton) {
            const loadBtn = loadModelButton as HTMLButtonElement;
            if (hasModel && modelSelector.value) {
                loadBtn.style.display = '';
                loadBtn.disabled = false;
            } else {
                loadBtn.style.display = 'none';
                loadBtn.disabled = true;
            }
            modelSelector.addEventListener('change', () => {
                if (loadModelButton) {
                    const loadBtn = loadModelButton as HTMLButtonElement;
                    if (modelSelector.value) {
                        loadBtn.style.display = '';
                        loadBtn.disabled = false;
                    } else {
                        loadBtn.style.display = 'none';
                        loadBtn.disabled = true;
                    }
                }
            });
        }
    } else {
        console.warn("[UIController] Model selector dropdown not found.");
        if (loadModelButton) (loadModelButton as HTMLButtonElement).style.display = 'none';
    }

    console.log("[UIController] UI Initialization complete.");
    return { chatBody, queryInput, sendButton, attachButton, fileInput };
}

export function setActiveSession(sessionId: string | null) {
    console.log(`[UIController] Setting active session for UI state: ${sessionId}`);
    currentSessionId = sessionId;
    if (!sessionId) {
        setInputStateInternal('idle'); 
    } 
}

export function checkInitialized() {
    return isInitialized;
}

export function getInputValue() {
    return queryInput?.value.trim() || '';
}

export function clearInput() {
    console.log("[UIController] Entering clearInput function.");
    if (queryInput) {
        queryInput.value = '';
        adjustTextareaHeight();
    }
}

export function focusInput() {
    queryInput?.focus();
}

export function triggerFileInputClick() {
    fileInput?.click();
}


function disableInput(reason = "Processing...") {
    if (!isInitialized || !queryInput || !sendButton) return;
    queryInput.disabled = true;
    queryInput.placeholder = reason;
    sendButton.disabled = true;
}

function enableInput() {
    if (!isInitialized || !queryInput || !sendButton) return;
    queryInput.disabled = false; 
    queryInput.placeholder = "Ask Tab Agent...";
    sendButton.disabled = queryInput.value.trim() === '';
}



function _handleModelOrVariantChange() { 
    if (!modelSelectorDropdown || !quantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    const quant = quantSelectorDropdown.value;
    console.log(`[UIController] Model or variant changed by user. Dispatching ${UIEventNames.MODEL_SELECTION_CHANGED}`, { modelId, quant });
    document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, quant } 
    }));

}

function _handleLoadModelButtonClick() {
    if (!modelSelectorDropdown || !loadModelButton) return;
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        console.warn("[UIController] Load Model button clicked, but no model selected.");
        return;
    }
    if (isLoadingModel) return; 
    isLoadingModel = true;
    currentLoadId = Date.now().toString() + Math.random().toString(36).slice(2);
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'block';
    disableInput("Loading model...");
    loadModelButton.disabled = true;
    setLoadModelButtonText('Loading...');
    const badge = document.getElementById('device-badge');
    if (badge) badge.style.display = 'none';
    const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    const quant = quantDropdown ? quantDropdown.value : '';
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId, quant, loadId: currentLoadId }
    }));
}

let repoQuantsCache: Record<string, any> = {};

export async function updateQuantDropdown() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  
  if (!modelDropdown || !quantDropdown) return;
  
  // Get all manifest entries in one call
  const allManifests = await getAllManifestEntries();
  const modelRepos = getModelSelectorOptions();
  
  // Build the cache dictionary: repo → manifest data
  repoQuantsCache = {};
  for (const repo of modelRepos) {
    const manifestEntry = allManifests.find(entry => entry.repo === repo);
    if (manifestEntry) {
      repoQuantsCache[repo] = manifestEntry;
    }
  }
  
  // Now populate the quant dropdown based on currently selected repo
  populateQuantDropdownForSelectedRepo();
}

function populateQuantDropdownForSelectedRepo() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  const loadModelButton = document.getElementById('load-model-button') as HTMLButtonElement | null;
  const statusDiv = document.getElementById('model-load-status');
  const statusText = document.getElementById('model-load-status-text');
  
  if (!modelDropdown || !quantDropdown) return;
  
  const selectedRepo = modelDropdown.value;
  if (!selectedRepo || !repoQuantsCache[selectedRepo]) {
    quantDropdown.innerHTML = '';
    quantDropdown.disabled = true;
    return;
  }
  
  const manifestEntry = repoQuantsCache[selectedRepo];
  
  // --- Save current selection ---
  const prevSelectedQuant = quantDropdown.value;

  // Clear the dropdown
  quantDropdown.innerHTML = '';
  
  // Check if any quant is unsupported
  const unsupported = Object.values(manifestEntry.quants).some(q => (q as QuantInfo).status === QuantStatus.Unsupported);
  
  if (unsupported) {
    // Show error message in status area
    if (statusDiv && statusText) {
      statusDiv.style.display = 'block';
      statusText.textContent = "This model's task is not supported by the current runtime.";
    }
    // Disable load button
    if (loadModelButton) {
      loadModelButton.disabled = true;
      setLoadModelButtonText('Unsupported');
      loadModelButton.style.opacity = '0.5';
      loadModelButton.style.cursor = 'not-allowed';
    }
    // Disable quant dropdown
    quantDropdown.disabled = true;
    return;
  } else {
    // Hide error if previously shown
    if (statusDiv && statusText) {
      statusDiv.style.display = 'none';
      statusText.textContent = '';
    }
    // Enable controls
    quantDropdown.disabled = false;
    if (loadModelButton) {
      loadModelButton.disabled = false;
      setLoadModelButtonText('Load Model');
      loadModelButton.style.opacity = '';
      loadModelButton.style.cursor = '';
    }
  }
  
  // Populate quant dropdown with options for selected repo
  for (const quant in manifestEntry.quants) {
    const option = document.createElement('option');
    option.value = quant;
    
    // Set status indicator
    let dot = '⚪'; // default gray
    switch (manifestEntry.quants[quant].status) {
      case QuantStatus.Downloaded: dot = '🟢'; break;
      case QuantStatus.Available: dot = '🟡'; break;
      case QuantStatus.Failed: dot = '🔴'; break;
      case QuantStatus.NotFound:
      case QuantStatus.Unavailable: dot = '⚪'; break;
    }
    
    option.textContent = `${quant} ${dot}`;
    quantDropdown.appendChild(option);
  }

  // --- Restore previous selection if possible ---
  if (prevSelectedQuant && manifestEntry.quants[prevSelectedQuant]) {
    quantDropdown.value = prevSelectedQuant;
  }
}
document.getElementById('model-selector')?.addEventListener('change', onModelDropdownChange);
// Call this when model dropdown changes
export function onModelDropdownChange() {
  populateQuantDropdownForSelectedRepo();
}


window.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === WorkerEventNames.MANIFEST_UPDATED) {
    console.log(`[UIController] Received MANIFEST_UPDATED event. Updating quant dropdown.`);
    updateQuantDropdown();
  }
});

document.addEventListener(WorkerEventNames.MANIFEST_UPDATED, () => {
    console.log(`[UIController] Received DOM MANIFEST_UPDATED event. Updating quant dropdown.`);
    updateQuantDropdown();
  });

// Add this helper near the top, after loadModelButton is defined
function setLoadModelButtonText(text: string) {
    if (loadModelButton) loadModelButton.textContent = text;
}

