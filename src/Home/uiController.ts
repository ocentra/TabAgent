import {  UIEventNames } from '../events/eventNames';
import {  DBEventNames } from '../DB/dbEvents';
import {  clearTemporaryMessages } from './chatRenderer';
import browser from 'webextension-polyfill';
import { dbChannel } from '../DB/idbSchema';
import { DbStatusUpdatedNotification } from '../DB/dbEvents';


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
let onnxVariantSelectorDropdown: HTMLSelectElement | null = null;

let loadModelButton: HTMLButtonElement | null = null;    

// Define available models (can be moved elsewhere later)
const AVAILABLE_MODELS = {
    // Model ID (value) : Display Name
  //  "Xenova/Qwen1.5-1.8B-Chat": "Qwen 1.8B Chat (Quantized)",
   // "Xenova/Phi-3-mini-4k-instruct": "Phi-3 Mini Instruct (Quantized)",
    //"HuggingFaceTB/SmolLM-1.7B-Instruct": "SmolLM 1.7B Instruct",
    //"HuggingFaceTB/SmolLM2-1.7B": "SmolLM2 1.7B",
   // "google/gemma-3-4b-it-qat-q4_0-gguf": "Gemma 3 4B IT Q4 (GGUF)", 
   // "bubblspace/Bubbl-P4-multimodal-instruct": "Bubbl-P4 Instruct (Multimodal)", 
    //"microsoft/Phi-4-multimodal-instruct": "Phi-4 Instruct (Multimodal)", 
   // "microsoft/Phi-4-mini-instruct": "Phi-4 Mini Instruct",
    //"Qwen/Qwen3-4B": "Qwen/Qwen3-4B",
    //"google/gemma-3-1b-pt": "google/gemma-3-1b-pt",

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
    if (message.type === UIEventNames.MODEL_DOWNLOAD_PROGRESS || message.type === UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE) {
       
        handleDownLoadingProgress(message.payload);
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
    onnxVariantSelectorDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
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
    onnxVariantSelectorDropdown?.addEventListener('change', _handleModelOrVariantChange);
    loadModelButton?.addEventListener('click', _handleLoadModelButtonClick);
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);

    modelSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    onnxVariantSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
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

document.addEventListener(UIEventNames.MODEL_DOWNLOAD_PROGRESS, (e: Event) => {
    handleDownLoadingProgress((e as CustomEvent).detail);
});
function handleDownLoadingProgress(payload: any) {
   // console.log('[DEBUG][handleLoadingProgress] payload:', payload);
    if (!payload) return;
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');

    if (!statusDiv || !statusText || !progressBar || !progressInner) {
       // console.warn('[UIController] Model load progress bar not found.');
        return;
    }

    // Always show the status area while loading or on error
    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';
   // console.log('[DEBUG][handleLoadingProgress] Showing progress bar.');

    // Handle error
    if (payload.status === 'error' || payload.error) {
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; // red
        progressInner.style.width = '100%';
        return;
    }

    // Main progress bar (overall)
    let percent = payload.progress || payload.percent || 0;
    percent = Math.max(0, Math.min(100, percent));
   // console.log('[DEBUG][handleLoadingProgress] percent:', percent);
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green

    // Status text
    let text = '';
    function truncateFileName(name: string, maxLen = 32) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 3) + '...' : name;
    }
    if (payload.summary && payload.message) {
        text = payload.message;
    } else if (payload.status === 'progress' && payload.file) {
        const shortFile = truncateFileName(payload.file);
        text = `Downloading ${shortFile}`;
        if (payload.chunkIndex && payload.totalChunks) {
            text += ` (chunk ${payload.chunkIndex} of ${payload.totalChunks})`;
        }
        text += `... ${Math.round(percent)}%`;
    } else if (payload.status === 'done' && payload.file) {
        const shortFile = truncateFileName(payload.file);
        text = `${shortFile} downloaded. Preparing pipeline...`;
    } else {
        text = 'Loading...';
    }
    statusText.textContent = text;

    // Hide when done (but not on error)
    if ((percent >= 100 || payload.status === 'popupclosed'|| payload.status === 'done' || (payload.summary && percent >= 100)) && !(payload.status === 'error' || payload.error)) {
        //console.log('[DEBUG][handleLoadingProgress] Hiding progress bar in 1s');
       
        setTimeout(() => { statusDiv.style.display = 'none'; }, 150);
    }
}

document.addEventListener(UIEventNames.MODEL_WORKER_LOADING_PROGRESS, (e: Event) => {
    handleModelWorkerLoadingProgress((e as CustomEvent).detail);
});

function handleModelWorkerLoadingProgress(payload: any) {
    if (!payload) return;
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
        return;
    }

    let percent = payload.progress || payload.percent || 0;
    percent = Math.max(0, Math.min(100, percent));
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green;

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

    if ((percent >= 100 || payload.status === 'popupclosed'|| payload.status === 'done' || payload.status === 'ready' || (payload.summary && percent >= 100)) && !(payload.status === 'error' || payload.error)) {
        setTimeout(() => { statusDiv.style.display = 'none'; }, 150);
    }
}


export function getCurrentlySelectedModel(): { modelId: string | null; onnxFile: string | null } {
    if (!modelSelectorDropdown || !onnxVariantSelectorDropdown) return { modelId: null, onnxFile: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        onnxFile: onnxVariantSelectorDropdown.value || null,
    };
}

// Known quantization/precision formats for transformers.js/ONNX:
// fp32, float32, fp16, float16, int8, q8, q4, q4f16, bnb4, uint8, int4, nf4, q6_k

const QUANT_OPTIONS = [
  { value: 'auto', label: 'Auto (Let backend decide)' },
  { value: 'fp32', label: 'FP32 (Full Precision)' },
  { value: 'float32', label: 'FLOAT32 (Full Precision)' },
  { value: 'fp16', label: 'FP16 (Half Precision)' },
  { value: 'float16', label: 'FLOAT16 (Half Precision)' },
  { value: 'int8', label: 'INT8 (8-bit Quantized)' },
  { value: 'q8', label: 'Q8 (8-bit Quantized)' },
  { value: 'uint8', label: 'UINT8 (8-bit Quantized, Unsigned)' },
  { value: 'q4', label: 'Q4 (4-bit Quantized)' },
  { value: 'int4', label: 'INT4 (4-bit Quantized)' },
  { value: 'q4f16', label: 'Q4F16 (4-bit Quantized, F16)' },
  { value: 'bnb4', label: 'BNB4 (4-bit Quantized, BNB)' },
  { value: 'nf4', label: 'NF4 (4-bit Quantized, NormalFloat4)' },
  { value: 'q6_k', label: 'Q6_K (6-bit Quantized, K)' }
];

export function normalizeQuant(quantDisplay: string): string {
  const map: Record<string, string> = {
    'auto': 'auto',
    'fp32': 'fp32',
    'float32': 'fp32',
    'fp16': 'fp16',
    'float16': 'fp16',
    'int8': 'int8',
    'q8': 'int8',
    'uint8': 'uint8',
    'q4': 'q4',
    'int4': 'q4',
    'q4f16': 'q4f16',
    'bnb4': 'bnb4',
    'nf4': 'nf4',
    'q6_k': 'q6_k',
  };
  // Try direct match
  if (map[quantDisplay.toLowerCase()]) return map[quantDisplay.toLowerCase()];
  // Try to extract value from label (e.g., "FP32 (Full Precision)")
  const key = quantDisplay.toLowerCase().split(' ')[0].replace(/[^a-z0-9_]/g, '');
  return map[key] || key;
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

    // Populate model selector
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
        // If no models, add a disabled option
        if (!hasModel) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            option.selected = true;
            modelSelector.appendChild(option);
        }
        // Enable/disable dropdown based on model availability
        modelSelector.disabled = !hasModel;
        // Show/hide load button based on model selection
        if (loadModelButton) {
            const loadBtn = loadModelButton as HTMLButtonElement;
            if (hasModel && modelSelector.value) {
                loadBtn.style.display = '';
                loadBtn.disabled = false;
            } else {
                loadBtn.style.display = 'none';
                loadBtn.disabled = true;
            }
            // Add event listener to update button on dropdown change
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

    // Populate ONNX variant selector statically
    if (onnxVariantSelectorDropdown) {
        onnxVariantSelectorDropdown.innerHTML = '';
        for (const opt of QUANT_OPTIONS) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            onnxVariantSelectorDropdown.appendChild(option);
        }
        onnxVariantSelectorDropdown.disabled = false;
        onnxVariantSelectorDropdown.selectedIndex = 0;
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

// Add these new functions inside uiController.ts

function _handleModelOrVariantChange() { // Underscore to indicate it's an internal handler for a listener
    if (!modelSelectorDropdown || !onnxVariantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    const onnxFile = onnxVariantSelectorDropdown.value;
    console.log(`[UIController] Model or variant changed by user. Dispatching ${UIEventNames.MODEL_SELECTION_CHANGED}`, { modelId, onnxFile });
    document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, onnxFile } // Pass the selected values
    }));
    // DO NOT call sidepanel's updateModelActionButtons directly here.
    // sidepanel will listen to MODEL_SELECTION_CHANGED and then decide to update buttons.
}

function _handleLoadModelButtonClick() {
    if (!modelSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        console.warn("[UIController] Load Model button clicked, but no model selected.");
        return;
    }
    console.log(`[UIController] Load Model button clicked. Dispatching ${UIEventNames.REQUEST_MODEL_EXECUTION}`, { modelId });
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId }
    }));
}



