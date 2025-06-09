import {  UIEventNames, WorkerEventNames } from '../events/eventNames';
import {  DBEventNames } from '../DB/dbEvents';
import {  clearTemporaryMessages, renderTemporaryMessage } from './chatRenderer';
import browser from 'webextension-polyfill';
import { dbChannel } from '../DB/idbSchema';
import { DbStatusUpdatedNotification, DbMessagesUpdatedNotification } from '../DB/dbEvents';
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

let isLoadingModel = false; 
let currentLoadId: string | null = null;
let lastSeenLoadId: string | null = null;
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_INFO = false;
const prefix = '[UIController]';
// Define available models (can be moved elsewhere later)
export const AVAILABLE_MODELS = {
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "microsoft/Phi-3.5-mini-instruct-onnx": "Phi-3.5 Mini",
    "HuggingFaceTB/SmolLM2-1.7B-Instruct": "SmolLM2-1.7B Instruct",
    // Add more models here as needed
};

document.addEventListener(DbStatusUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    if (LOG_INFO) console.log(prefix, 'Received DbStatusUpdatedNotification: ', customEvent.detail);
    handleStatusUpdate(customEvent.detail);
  });

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    const type = message?.type;
    if (LOG_INFO) console.log(prefix, 'browser.runtime.onMessage Received progress update: ', message.type, message.payload);
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
};

document.addEventListener(DbMessagesUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    const messages = customEvent.detail?.payload?.messages;
    if (Array.isArray(messages) && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === 'ai' && !lastMsg.isLoading) {
            setInputStateInternal('ready');
        }
    }
});

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
        if (LOG_INFO) console.log(prefix, "Send button clicked. Publishing ui:querySubmitted");
        document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
        clearInput();
    } else {
        if (LOG_INFO) console.log(prefix, "Send button clicked, but input is empty or disabled.");
    }
}

function handleAttachClick() {
    if (attachFileCallback) {
        attachFileCallback();
    }
}

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
    if (LOG_INFO) console.log(prefix, `setInputStateInternal called with status: ${status}`);
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
    if (LOG_INFO) console.log(prefix, `Input disabled state: ${queryInput.disabled}`);
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
    if (payload.loadId !== lastSeenLoadId) {
        if (LOG_WARN) console.warn(prefix, 'New loadId detected in progress:', payload.loadId);
        if (lastSeenLoadId) {
            if (LOG_ERROR) console.error(prefix, 'DOUBLE PROGRESS TRIGGER! Previous:', lastSeenLoadId, 'New:', payload.loadId);
        }
        lastSeenLoadId = payload.loadId;
    }
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');

    if (!statusDiv || !statusText || !progressBar || !progressInner) {
        if (LOG_WARN) console.warn(prefix, 'Model load progress bar not found.');
        return;
    }

    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';

    if (payload.status === 'error' || payload.error) {
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; 
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


export function getCurrentlySelectedModel(): { modelId: string | null; modelPath: string | null } {
    if (!modelSelectorDropdown || !quantSelectorDropdown) return { modelId: null, modelPath: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        modelPath: quantSelectorDropdown.value || null,
    };
}



export async function initializeUI(callbacks: { onAttachFile?: () => void; onNewChat?: () => void }) {
    if (LOG_INFO) console.log(prefix, "Initializing...");
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
    if (LOG_INFO) console.log(prefix, "Initialized successfully.");

    if (LOG_INFO) console.log(prefix, `Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);

    clearTemporaryMessages();


    disableInput("Download or load a model from dropdown to begin.");

    if (LOG_INFO) console.log(prefix, "Initializing UI elements...");

    if (LOG_INFO) console.log(prefix, "Attempting to find model selector...");
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    if (LOG_INFO) console.log(prefix, modelSelector ? "Model selector found." : "WARNING: Model selector NOT found!");
    if (modelSelector) {
        modelSelector.innerHTML = ''; // Clear existing options
        if (LOG_INFO) console.log(prefix, "Populating model selector. Available models:", AVAILABLE_MODELS);
        let hasModel = false;
        for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
            if (LOG_INFO) console.log(prefix, `Adding option: ${displayName} (${modelId})`);
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
        if (LOG_WARN) console.warn(prefix, "Model selector dropdown not found.");
        if (loadModelButton) (loadModelButton as HTMLButtonElement).style.display = 'none';
    }

    if (LOG_INFO) console.log(prefix, "UI Initialization complete.");
    return { chatBody, queryInput, sendButton, attachButton, fileInput };
}

export function setActiveSession(sessionId: string | null) {
    if (LOG_INFO) console.log(prefix, `Setting active session for UI state: ${sessionId}`);
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
    if (LOG_INFO) console.log(prefix, "Entering clearInput function.");
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
    const modelPath = quantSelectorDropdown.value;
    if (LOG_INFO) console.log(prefix, `Model or variant changed by user. Dispatching ${UIEventNames.MODEL_SELECTION_CHANGED}`, { modelId, modelPath });
    document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, modelPath } 
    }));

}

// Stub for native app detection
function isNativeAppAvailable(): boolean {
    // TODO: Implement real detection logic
    return false;
}

// Placeholder for future native app/server integration
function handleServerOnlyModelLoad(modelId: string, modelPath: string) {
    // TODO: Implement native app/server-side model loading logic here
    if (LOG_INFO) console.log(prefix, `handleServerOnlyModelLoad called for modelId: ${modelId}, modelPath: ${modelPath}`);
    // For now, just show the temporary chat message
    renderTemporaryMessage('system', 'This model is too large to load in the browser. Please download and run the TabAgent Server to use this model. [Learn more]');
}

function _handleLoadModelButtonClick() {
    if (!modelSelectorDropdown || !loadModelButton) return;
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        if (LOG_WARN) console.warn(prefix, "Load Model button clicked, but no model selected.");
        return;
    }
    if (isLoadingModel) return; 
    // Check for ServerOnly status
    const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    const modelPath = quantDropdown ? quantDropdown.value : '';
    const manifestEntry = repoQuantsCache[modelId];
    if (manifestEntry && manifestEntry.quants[modelPath] && manifestEntry.quants[modelPath].status === QuantStatus.ServerOnly) {
        handleServerOnlyModelLoad(modelId, modelPath);
        return;
    }
    isLoadingModel = true;
    currentLoadId = Date.now().toString() + Math.random().toString(36).slice(2);
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'block';
    disableInput("Loading model...");
    loadModelButton.disabled = true;
    setLoadModelButtonText('Loading...');
    const badge = document.getElementById('device-badge');
    if (badge) badge.style.display = 'none';
    const modelPathDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    const modelPathFinal = modelPathDropdown ? modelPathDropdown.value : '';
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId, modelPath: modelPathFinal, loadId: currentLoadId }
    }));
}

let repoQuantsCache: Record<string, any> = {};

export async function updateQuantDropdown() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  
  if (!modelDropdown || !quantDropdown) return;
  
  const allManifests = await getAllManifestEntries();
  const modelRepos = getModelSelectorOptions();
  
  repoQuantsCache = {};
  for (const repo of modelRepos) {
    const manifestEntry = allManifests.find(entry => entry.repo === repo);
    if (manifestEntry) {
      repoQuantsCache[repo] = manifestEntry;
    }
  }  
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
  const prevSelectedModelPath = quantDropdown.value;
  quantDropdown.innerHTML = '';  
  const unsupported = Object.values(manifestEntry.quants).some(q => (q as QuantInfo).status === QuantStatus.Unsupported);
  
  if (unsupported) {
    if (statusDiv) statusDiv.style.display = 'block';
    if (statusText) statusText.textContent = "This model's task is not supported by the current runtime.";
    if (loadModelButton) {
      loadModelButton.disabled = true;
      setLoadModelButtonText('Unsupported');
      loadModelButton.style.opacity = '0.5';
      loadModelButton.style.cursor = 'not-allowed';
    }
    if (quantDropdown) quantDropdown.disabled = true;
    return;
  } else {
    if (statusDiv) statusDiv.style.display = 'none';
    if (statusText) statusText.textContent = '';
    if (quantDropdown) quantDropdown.disabled = false;
    if (loadModelButton) {
      loadModelButton.disabled = false;
      setLoadModelButtonText('Load Model');
      loadModelButton.style.opacity = '';
      loadModelButton.style.cursor = '';
    }
  }
  
  for (const modelPath in manifestEntry.quants) {
    const option = document.createElement('option');
    option.value = modelPath;
    let label = quantKeyToLabel(modelPath);
    let dot = '⚪'; // default gray
    let statusLabel = '';
    switch (manifestEntry.quants[modelPath].status) {
      case QuantStatus.Downloaded: dot = '🟢'; break;
      case QuantStatus.Available: dot = '🟡'; break;
      case QuantStatus.Failed: dot = '⛔'; break;
      case QuantStatus.NotFound: dot = '❌'; break;
      case QuantStatus.Unavailable: dot = '🚫'; break;
      case QuantStatus.ServerOnly: dot = '🖥️'; statusLabel = ' (Requires Server)'; break;
    }
    option.textContent = `${label} ${dot}${statusLabel}`;
    if (manifestEntry.quants[modelPath].status === QuantStatus.ServerOnly) {
      option.disabled = false; // allow selection, but block load
      option.classList.add('server-only-quant');
    }
    quantDropdown.appendChild(option);
  }

  if (prevSelectedModelPath && manifestEntry.quants[prevSelectedModelPath]) {
    quantDropdown.value = prevSelectedModelPath;
  }
}
document.getElementById('model-selector')?.addEventListener('change', onModelDropdownChange);
export function onModelDropdownChange() {
  populateQuantDropdownForSelectedRepo();
}


window.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === WorkerEventNames.MANIFEST_UPDATED) {
    if (LOG_INFO) console.log(prefix, "Received MANIFEST_UPDATED event. Updating quant dropdown.");
    updateQuantDropdown();
  }
});

document.addEventListener(WorkerEventNames.MANIFEST_UPDATED, () => {
    if (LOG_INFO) console.log(prefix, "Received DOM MANIFEST_UPDATED event. Updating quant dropdown.");
    updateQuantDropdown();
  });

function setLoadModelButtonText(text: string) {
    if (loadModelButton) loadModelButton.textContent = text;
}

export function quantKeyToLabel(modelPath: string): string {
    if (!modelPath || typeof modelPath !== 'string') return String(modelPath);

    if (modelPath === 'model.onnx' || modelPath.toLowerCase() === 'onnx') {
        return 'FP32';
    }

    const pathParts = modelPath.split('/');
    let last = pathParts[pathParts.length - 1].toLowerCase();
    let parent = pathParts.length > 1 ? pathParts[pathParts.length - 2].toLowerCase() : '';

    let device = '';
    if (parent.includes('cpu')) device = 'CPU';
    else if (parent.includes('gpu')) device = 'GPU';
    else if (modelPath.toLowerCase().includes('cpu')) device = 'CPU';
    else if (modelPath.toLowerCase().includes('gpu')) device = 'GPU';

    let quant = '';
    let match;
    if ((match = parent.match(/fp(16|32)/))) quant = 'FP' + match[1];
    else if ((match = parent.match(/int(4|8)/))) quant = 'INT' + match[1];
    else if ((match = parent.match(/q4f16/))) quant = 'Q4F16';
    else if ((match = parent.match(/bnb4/))) quant = 'BNB4';
    else if ((match = parent.match(/q4/))) quant = 'Q4';
    else if ((match = parent.match(/uint8/))) quant = 'UINT8';
    else if ((match = parent.match(/quant/))) quant = 'QUANTIZED';
    else if ((match = last.match(/fp(16|32)/))) quant = 'FP' + match[1];
    else if ((match = last.match(/int(4|8)/))) quant = 'INT' + match[1];
    else if ((match = last.match(/q4f16/))) quant = 'Q4F16';
    else if ((match = last.match(/bnb4/))) quant = 'BNB4';
    else if ((match = last.match(/q4/))) quant = 'Q4';
    else if ((match = last.match(/uint8/))) quant = 'UINT8';
    else if ((match = last.match(/quant/))) quant = 'QUANTIZED';
    else if ((match = last.match(/onnx/))) quant = 'FP32';

    let label = '';
    if (device && quant) label = `${device} ${quant}`;
    else if (device) label = device;
    else if (quant) label = quant;
    else label = 'FP32';

    return label;
}

