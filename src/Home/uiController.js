import {  UIEventNames, DirectDBNames, DBEventNames } from '../events/eventNames.js';
import {  clearTemporaryMessages } from './chatRenderer.js';
import browser from 'webextension-polyfill';
import { dbChannel } from '../Utilities/dbChannels.js';

let queryInput, sendButton, chatBody, attachButton, fileInput,  loadingIndicatorElement, 
    historyButton, historyPopup, historyList, closeHistoryButton, newChatButton, historySearchInput, 
    sessionListElement, driveButton, driveViewerModal, driveViewerClose, driveViewerBack, driveViewerContent, 
    driveViewerList, driveViewerSearch, driveViewerBreadcrumbs, driveViewerSelectedArea, driveViewerCancel, 
    driveViewerInsert, starredListElement, loadModelButton, modelLoadProgress;
let isInitialized = false;
let attachFileCallback = null;
let currentSessionId = null;
import { DbStatusUpdatedNotification } from '../events/dbEvents.js';

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

document.addEventListener(DbStatusUpdatedNotification.type, (e) => {
    console.log('[UIController] Received DbStatusUpdatedNotification: ', e.detail);
    handleStatusUpdate(e.detail);
  });

// Add this at the top level to ensure UI progress bar updates
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    console.log('[UIController] browser.runtime.onMessage Received progress update: ', message.type, message.payload);
    if (message.type === DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
    if (Object.values(DirectDBNames).includes(type)) {
        return false;
    }
    if (Object.values(DBEventNames).includes(type)) {
        return false;
    }
    if (message.type === UIEventNames.MODEL_DOWNLOAD_PROGRESS || message.type === UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE) {
       
        handleLoadingProgress(message.payload);
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
    queryInput = document.getElementById('query-input');
    sendButton = document.getElementById('send-button');
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button');
    fileInput = document.getElementById('file-input');
    loadingIndicatorElement = document.getElementById('loading-indicator');
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
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const messageText = getInputValue();
        if (messageText && !queryInput.disabled) {
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
    if (messageText && !queryInput.disabled) {
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

function setInputStateInternal(status) {
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

function showLoadingIndicatorInternal(message = '', showSpinner = true) {
    if (!isInitialized || !loadingIndicatorElement) return;

    const textElement = loadingIndicatorElement.querySelector('span');
    if (textElement) textElement.textContent = message;
    
    const spinner = loadingIndicatorElement.querySelector('svg');
    if (spinner) spinner.classList.toggle('hidden', !showSpinner);

    loadingIndicatorElement.classList.remove('hidden');

    if (message.startsWith('Downloading') || message.startsWith('Loading')) {
        setLoadButtonState('loading', message); 
    } 
}

function hideLoadingIndicatorInternal() {
    if (!isInitialized || !loadingIndicatorElement) return;
    loadingIndicatorElement.classList.add('hidden');
}

function handleStatusUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) return;
    if (notification.sessionId === currentSessionId) {
        setInputStateInternal(notification.payload.status || 'idle');
    }
}

function handleLoadingProgress(payload) {
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
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green

    // Status text
    let text = '';
    // Truncate file name for display
    function truncateFileName(name, maxLen = 32) {
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
    if ((percent >= 100 || payload.status === 'done' || (payload.summary && percent >= 100)) && !(payload.status === 'error' || payload.error)) {
        setTimeout(() => { statusDiv.style.display = 'none'; }, 1000);
    }
}




export async function initializeUI(callbacks) {
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
    
    const newChatButton = document.getElementById('new-chat-button');
    if (newChatButton && callbacks?.onNewChat) {
        newChatButton.addEventListener('click', callbacks.onNewChat);
    }

    isInitialized = true;
    setInputStateInternal('idle');
    adjustTextareaHeight();
    console.log("[UIController] Initialized successfully.");

    console.log(`[UIController] Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);

    clearTemporaryMessages();

    loadModelButton = document.getElementById('load-model-button');
    if (loadModelButton) {
        loadModelButton.addEventListener('click', handleLoadModelClick);
    } else {
        console.error("[UIController] Load Model button not found!");
    }

    disableInput("Model not loaded. Click 'Load'.");
    setLoadButtonState('idle');

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

    console.log("[UIController] UI Initialization complete.");
    return { chatBody, queryInput, sendButton, attachButton, fileInput };
}

export function setActiveSession(sessionId) {
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

function handleLoadModelClick() {
    if (!isInitialized) return;
    console.log("[UIController] Load Model button clicked.");

    const modelSelector = document.getElementById('model-selector');
    const selectedModelId = modelSelector?.value;

    if (!selectedModelId) {
        console.error("[UIController] Cannot load: No model selected or selector not found.");
        showNotification("Error: Please select a model.", "error");
        return;
    }

    console.log(`[UIController] Requesting load for model: ${selectedModelId}`);
    setLoadButtonState('loading'); 
    disableInput(`Loading ${AVAILABLE_MODELS[selectedModelId] || selectedModelId}...`); 
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_LOAD, { detail: { modelId: selectedModelId } }));
}

function setLoadButtonState(state, text = 'Load') {
    if (!isInitialized || !loadModelButton) return;

    switch (state) {
        case 'idle':
            loadModelButton.disabled = false;
            loadModelButton.textContent = text;
            loadModelButton.classList.replace('bg-yellow-500', 'bg-green-500');
            loadModelButton.classList.replace('bg-gray-500', 'bg-green-500');
            break;
        case 'loading':
            loadModelButton.disabled = true;
            loadModelButton.textContent = text === 'Load' ? 'Loading...' : text;
            loadModelButton.classList.replace('bg-green-500', 'bg-yellow-500');
             loadModelButton.classList.replace('bg-gray-500', 'bg-yellow-500');
            break;
        case 'loaded':
            loadModelButton.disabled = true;
            loadModelButton.textContent = 'Loaded';
            loadModelButton.classList.replace('bg-green-500', 'bg-gray-500'); 
            loadModelButton.classList.replace('bg-yellow-500', 'bg-gray-500');
            break;
        case 'error':
            loadModelButton.disabled = false;
            loadModelButton.textContent = 'Load Failed';
            loadModelButton.classList.replace('bg-yellow-500', 'bg-red-500');
            loadModelButton.classList.replace('bg-green-500', 'bg-red-500');
            loadModelButton.classList.replace('bg-gray-500', 'bg-red-500');
            break;
    }
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

document.addEventListener(UIEventNames.WORKER_READY, (e) => {
    const payload = e.detail;
    console.log("[UIController] Received worker:ready signal", payload);
    // Hide progress bar area
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'none';
    setLoadButtonState('loaded');
});

document.addEventListener(UIEventNames.WORKER_ERROR, (e) => {
    const payload = e.detail;
    console.error("[UIController] Received worker:error signal", payload);
    // Show error in progress bar area and keep it visible
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressInner = document.getElementById('model-load-progress-inner');
    if (statusDiv && statusText && progressInner) {
        statusDiv.style.display = 'block';
        statusText.textContent = payload?.error || 'Model load failed.';
        progressInner.style.background = '#f44336';
        progressInner.style.width = '100%';
    }
    setLoadButtonState('error');
    disableInput("Model load failed. Check logs.");
});