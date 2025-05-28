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
    downloadModelButton: HTMLButtonElement | null,
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
    downloadModelButton = document.getElementById('download-model-btn') as HTMLButtonElement | null; 
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
    downloadModelButton?.addEventListener('click', _handleDownloadModelButtonClick);
    loadModelButton?.addEventListener('click', _handleLoadModelButtonClick);
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);

    modelSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    onnxVariantSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    downloadModelButton?.removeEventListener('click', _handleDownloadModelButtonClick);
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
    console.log('[DEBUG][handleLoadingProgress] payload:', payload);
    if (!payload) return;
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');

    if (!statusDiv || !statusText || !progressBar || !progressInner) {
        console.warn('[UIController] Model load progress bar not found.');
        return;
    }

    // Always show the status area while loading or on error
    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';
    console.log('[DEBUG][handleLoadingProgress] Showing progress bar.');

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
    console.log('[DEBUG][handleLoadingProgress] percent:', percent);
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
        console.log('[DEBUG][handleLoadingProgress] Hiding progress bar in 1s');
       
        setTimeout(() => { statusDiv.style.display = 'none'; }, 150);
    }
}



const AVAILABLE_MODELS_STATIC_FALLBACK: Record<string, string> = {
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "onnx-models/all-MiniLM-L6-v2-onnx": "MiniLM-L6-v2",
    // Add more models here as needed from your original AVAILABLE_MODELS
};

export function populateModelDropdown(repoIds: string[], selectedRepoId: string | null) {
    if (!modelSelectorDropdown) return;
    const currentVal = modelSelectorDropdown.value;
    modelSelectorDropdown.innerHTML = ''; // Clear existing options

    if (!repoIds || repoIds.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No Models"; // Or "No Models Found"
        modelSelectorDropdown.appendChild(option);
        modelSelectorDropdown.disabled = true;
        populateOnnxVariantDropdown([], null, false); // Clear ONNX variants too
        return;
    }

    modelSelectorDropdown.disabled = false;
    repoIds.forEach(repoId => {
        if (!modelSelectorDropdown) return;
        const option = document.createElement('option');
        option.value = repoId;
        const friendlyName = AVAILABLE_MODELS_STATIC_FALLBACK[repoId] || repoId;
        option.textContent = friendlyName;
        modelSelectorDropdown.appendChild(option);
    });

    if (selectedRepoId && repoIds.includes(selectedRepoId)) {
        modelSelectorDropdown.value = selectedRepoId;
    } else if (currentVal && repoIds.includes(currentVal)) { // Try to preserve selection
        modelSelectorDropdown.value = currentVal;
    } else if (repoIds.length > 0) {
        modelSelectorDropdown.value = repoIds[0]; // Default to first
    }
}

export function populateOnnxVariantDropdown(
    onnxFiles: { fileName: string; status?: string }[],
    selectedFileName: string | null,
    multipleOnnxFilesExistForModel: boolean
) {
    if (!onnxVariantSelectorDropdown) return;
    const currentVal = onnxVariantSelectorDropdown.value;
    onnxVariantSelectorDropdown.innerHTML = '';

    if (!onnxFiles || onnxFiles.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "N/A";
        onnxVariantSelectorDropdown.appendChild(option);
        onnxVariantSelectorDropdown.disabled = true;
        return;
    }

    onnxVariantSelectorDropdown.disabled = false;
    if (multipleOnnxFilesExistForModel) {
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All (for download)';
        onnxVariantSelectorDropdown.appendChild(allOption);
    }

    onnxFiles.forEach(file => {
        if (!onnxVariantSelectorDropdown) return;
        const option = document.createElement('option');
        option.value = file.fileName;
        let statusIcon = '';
        if (file.status === 'present' || file.status === 'complete') statusIcon = '🟢';
        else if (file.status === 'corrupt') statusIcon = '🔴';
        option.textContent = `${file.fileName.split('/').pop()} ${statusIcon}`.trim();
        onnxVariantSelectorDropdown.appendChild(option);
    });

    if (selectedFileName && onnxFiles.some(f => f.fileName === selectedFileName)) {
        onnxVariantSelectorDropdown.value = selectedFileName;
    } else if (currentVal && onnxFiles.some(f => f.fileName === currentVal)) { // Try to preserve
        onnxVariantSelectorDropdown.value = currentVal;
    } else if (multipleOnnxFilesExistForModel) {
        onnxVariantSelectorDropdown.value = 'all';
    } else if (onnxFiles.length > 0) {
        onnxVariantSelectorDropdown.value = onnxFiles[0].fileName;
    }
}

export function getCurrentlySelectedModel(): { modelId: string | null; onnxFile: string | null } {
    if (!modelSelectorDropdown || !onnxVariantSelectorDropdown) return { modelId: null, onnxFile: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        onnxFile: onnxVariantSelectorDropdown.value || null,
    };
}

export function setDownloadModelButtonState(options: { visible: boolean; text?: string; disabled?: boolean }) {
    if (downloadModelButton) {
        downloadModelButton.style.display = options.visible ? '' : 'none';
        if (options.text) downloadModelButton.textContent = options.text;
        if (typeof options.disabled === 'boolean') downloadModelButton.disabled = options.disabled;
    }
}

export function setLoadModelButtonState(options: { visible: boolean; text?: string; disabled?: boolean }) {
    if (loadModelButton) {
        loadModelButton.style.display = options.visible ? '' : 'none';
        if (options.text) loadModelButton.textContent = options.text;
        if (typeof options.disabled === 'boolean') loadModelButton.disabled = options.disabled;
    }
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
    const modelSelector = document.getElementById('model-selector');
    console.log(modelSelector ? "[UIController] Model selector found." : "[UIController] WARNING: Model selector NOT found!");
    if (modelSelector) {
        modelSelector.innerHTML = ''; // Clear existing options
        console.log("[UIController] Populating model selector. Available models:", AVAILABLE_MODELS);
        for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
            console.log(`[UIController] Adding option: ${displayName} (${modelId})`);
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            modelSelector.appendChild(option);
        }

    } else {
        console.warn("[UIController] Model selector dropdown not found.");
    }

    if (downloadModelButton) downloadModelButton.style.display = 'none'; 
    if (loadModelButton) loadModelButton.style.display = 'none';       

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

function _handleDownloadModelButtonClick() { // Underscore for internal handler
    if (!modelSelectorDropdown || !onnxVariantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    const onnxFile = onnxVariantSelectorDropdown.value; // This can be 'all'
    if (!modelId) {
        console.warn("[UIController] Download Model button clicked, but no model selected.");
        // Sidepanel can show a notification if it listens for an error/warning event, or uiController can have its own simple notification
        return;
    }
    console.log(`[UIController] Download Model button clicked. Dispatching ${UIEventNames.REQUEST_MODEL_DOWNLOAD_ACTION}`, { modelId, onnxFile });
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_DOWNLOAD_ACTION, {
        detail: { modelId, onnxFile }
    }));
}

function _handleLoadModelButtonClick() { // Underscore for internal handler
    if (!modelSelectorDropdown || !onnxVariantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    const onnxFile = onnxVariantSelectorDropdown.value;
    if (!modelId || !onnxFile || onnxFile === 'all') { // Must be a specific ONNX file to load
        console.warn("[UIController] Load Model button clicked, but no model or specific ONNX file selected.");
        return;
    }
    console.log(`[UIController] Load Model button clicked. Dispatching ${UIEventNames.REQUEST_MODEL_EXECUTION}`, { modelId, onnxFile });
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId, onnxFile }
    }));
}



