import {  UIEventNames, WorkerEventNames } from '../events/eventNames';
import {  DBEventNames } from '../DB/dbEvents';
import {  clearTemporaryMessages, renderTemporaryMessage } from './chatRenderer';
import browser from 'webextension-polyfill';
import { dbChannel } from '../DB/idbSchema';
import { DbStatusUpdatedNotification, DbMessagesUpdatedNotification } from '../DB/dbEvents';
import {  QuantStatus, getAllManifestEntries, QuantInfo, getFromIndexedDB, getManifestEntry } from '../DB/idbModel';


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
const LOG_ERROR = false;
const LOG_WARN = false;
const LOG_INFO = false;
const prefix = '[UIController]';
// Define available models (can be moved elsewhere later)
export const AVAILABLE_MODELS = {
    "onnx-community/Phi-3.5-mini-instruct-onnx-web": "Phi-3.5 Mini (Transformers.js)",
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "microsoft/Phi-3.5-mini-instruct-onnx": "Phi-3.5 Mini",   
    "HuggingFaceTB/SmolLM2-1.7B-Instruct": "SmolLM2-1.7B Instruct",
    "HuggingFaceTB/SmolLM3-3B-ONNX": "SmolLM3-3B ONNX",
    "microsoft/bitnet-b1.58-2B-4T-gguf": "Bitnet2B",
    "onnx-community/Qwen3-1.7B-ONNX": "Qwen3-1.7B",
    // Google models will be added dynamically after authentication
};

export const GOOGLE_MODELS = {
    "google/gemma-3n-E4B-it-litert-lm": "Gemma 3B (MediaPipe)",
    // Add more Google models here as needed
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
    if (LOG_INFO) console.log('[UIController] dbChannel.onmessage Received progress update: ', message.type, message.payload);
    if (type === DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
};

document.addEventListener(DbMessagesUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    const messages = customEvent.detail?.payload?.messages;
    if (Array.isArray(messages) && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if ((lastMsg.sender === 'ai' || lastMsg.sender === 'system') && !lastMsg.isLoading) {
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
            if (LOG_INFO) console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
            document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
            clearInput();
        } else {
             if (LOG_INFO) console.log("[UIController] Enter key pressed, but input is empty or disabled.");
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



// Check if user is authenticated with HuggingFace
async function isHuggingFaceAuthenticated(): Promise<boolean> {
    try {
        const tokenBlob = await getFromIndexedDB('huggingface_token');
        const token = tokenBlob ? await tokenBlob.text() : null;
        return !!(token && token.startsWith('hf_'));
    } catch (error) {
        if (LOG_WARN) console.warn(prefix, 'Error checking HF authentication:', error);
        return false;
    }
}

// Update model dropdown with available models based on authentication
async function updateModelDropdown() {
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    if (!modelSelector) return;
    
    const isAuthenticated = await isHuggingFaceAuthenticated();
    
    // Clear existing options
    modelSelector.innerHTML = '';
    
    // Add regular models
    for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = displayName;
        modelSelector.appendChild(option);
    }
    
    // Add Google models (always visible and selectable)
    for (const [modelId, displayName] of Object.entries(GOOGLE_MODELS)) {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = displayName;
        if (!isAuthenticated) {
            option.textContent += ' (Authentication Required)';
        }
        // Don't disable the option - let users select it to trigger auth
        modelSelector.appendChild(option);
    }
    
    // Enable/disable based on available models
    const hasModels = modelSelector.children.length > 0;
    modelSelector.disabled = !hasModels;
    
    // Update load button and quant dropdown based on selection
    updateLoadButtonAndQuantDropdown();
}

// Update load button and quant dropdown based on current selection
async function updateLoadButtonAndQuantDropdown() {
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    
    if (!modelSelector || !loadModelButton) return;
    
    const selectedModel = modelSelector.value;
    const isGoogleModel = selectedModel.toLowerCase().startsWith('google/');
    const isAuthenticated = await isHuggingFaceAuthenticated();
    
    if (loadModelButton) {
        const loadBtn = loadModelButton as HTMLButtonElement;
        if (selectedModel && (!isGoogleModel || isAuthenticated)) {
            loadBtn.style.display = '';
            loadBtn.disabled = false;
            loadBtn.textContent = 'Load Model';
        } else {
            loadBtn.style.display = '';
            loadBtn.disabled = true;
            if (isGoogleModel && !isAuthenticated) {
                loadBtn.textContent = 'Authentication Required';
            } else {
                loadBtn.textContent = 'Load Model';
            }
        }
    }
    
    // Show/hide quant dropdown based on model type and auth
    if (quantSelector) {
        if (isGoogleModel && !isAuthenticated) {
            quantSelector.style.display = 'none';
        } else {
            quantSelector.style.display = '';
        }
    }
}

// Export function to refresh model dropdown (called after authentication)
export async function refreshModelDropdown() {
    await updateModelDropdown();
    await updateLoadButtonAndQuantDropdown();
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
        // Use the new updateModelDropdown function
        await updateModelDropdown();
        
        if (loadModelButton) {
            modelSelector.addEventListener('change', async () => {
                await updateLoadButtonAndQuantDropdown();
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
    if (!isInitialized || !queryInput) return;
    queryInput.focus();
}

export function updateGenerationState(isGenerating: boolean) {
    if (!isInitialized || !sendButton) {
        if (LOG_INFO) console.log('[UIController] updateGenerationState called but not initialized or no sendButton');
        return;
    }
    
    if (LOG_INFO) console.log('[UIController] updateGenerationState called with isGenerating:', isGenerating);
    
    if (isGenerating) {
        // Change to stop button - red background, enabled
        sendButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
            </svg>
        `;
        sendButton.title = 'Stop Generation';
        sendButton.onclick = handleStopGeneration;
        sendButton.disabled = false; // Ensure stop button is enabled
        sendButton.className = 'absolute bottom-2.5 right-2.5 p-1 rounded bg-red-500 hover:bg-red-600 text-white';
        
        // Add direct click listener for debugging
        sendButton.addEventListener('click', (e) => {
            if (LOG_INFO) console.log('[UIController] Direct click event detected on stop button');
            if (LOG_INFO) console.log('[UIController] Event target:', e.target);
            if (LOG_INFO) console.log('[UIController] Event currentTarget:', e.currentTarget);
        });
        
        // Add mousedown and mouseup listeners to see if any mouse events are being detected
        sendButton.addEventListener('mousedown', (e) => {
            if (LOG_INFO) console.log('[UIController] Mouse down detected on stop button');
        });
        
        sendButton.addEventListener('mouseup', (e) => {
            if (LOG_INFO) console.log('[UIController] Mouse up detected on stop button');
        });
        
        // Log button position and size for debugging
        const rect = sendButton.getBoundingClientRect();
        if (LOG_INFO) console.log('[UIController] Stop button position:', rect);
        if (LOG_INFO) console.log('[UIController] Stop button computed style:', window.getComputedStyle(sendButton));
        if (LOG_INFO) console.log('[UIController] Updated to stop button - disabled:', sendButton.disabled, 'onclick set:', !!sendButton.onclick, 'className:', sendButton.className);
    } else {
        // Change back to send button - blue background, check if should be enabled
        sendButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
        `;
        sendButton.title = 'Send';
        sendButton.onclick = handleSendButtonClick;
        sendButton.className = 'absolute bottom-2.5 right-2.5 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed';
        // Re-evaluate if send button should be enabled based on input state
        if (queryInput) {
            sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
        }
    }
}

function handleStopGeneration() {
    // Dispatch event to stop generation
    if (LOG_INFO) console.log('[UIController] handleStopGeneration function called');
    if (LOG_INFO) console.log('[UIController] Stop generation button clicked, dispatching stopGeneration event');
    if (LOG_INFO) console.log('[UIController] Button state - disabled:', sendButton?.disabled, 'innerHTML length:', sendButton?.innerHTML.length);
    document.dispatchEvent(new CustomEvent('stopGeneration'));
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



async function _handleModelOrVariantChange() { 
    if (!modelSelectorDropdown || !quantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    let modelPath = quantSelectorDropdown.value;
    
    // For Google models, set the correct quant path (always use the "web" file)
    if (modelId.toLowerCase().startsWith('google/')) {
        // For Google models, we always need to set the quant path to the "web" file
        // The manifest should have the "web" file available
        try {
            const manifest = await getManifestEntry(modelId);
            if (manifest && manifest.quants) {
                // Find the web quant (should be the only one for Google models)
                const webQuant = Object.keys(manifest.quants).find(quant => quant.includes('Web'));
                if (webQuant) {
                    modelPath = webQuant;
                }
            }
        } catch (error) {
            if (LOG_WARN) console.warn(prefix, 'Error getting manifest for Google model:', error);
        }
    }
    
    if (LOG_INFO) console.log(prefix, `Model or variant changed by user. Dispatching ${UIEventNames.MODEL_SELECTION_CHANGED}`, { modelId, modelPath });
    
    // Update UI elements based on selection
    await updateLoadButtonAndQuantDropdown();
    
    // Check if this is a Google model that needs authentication
    if (modelId.toLowerCase().startsWith('google/')) {
        const isAuthenticated = await isHuggingFaceAuthenticated();
        if (!isAuthenticated) {
            // For Google models, check authentication on dropdown selection
            document.dispatchEvent(new CustomEvent('GOOGLE_MODEL_AUTHENTICATION', {
                detail: { modelId, modelPath, loadId: Date.now().toString() + Math.random().toString(36).slice(2) }
            }));
            return;
        }
    }
    
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

async function _handleLoadModelButtonClick() {
    if (!modelSelectorDropdown || !loadModelButton) return;
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        if (LOG_WARN) console.warn(prefix, "Load Model button clicked, but no model selected.");
        return;
    }
    if (isLoadingModel) return;
    
    // Check if this is a Google model that needs authentication
    if (modelId.toLowerCase().startsWith('google/')) {
        const isAuthenticated = await isHuggingFaceAuthenticated();
        if (!isAuthenticated) {
            // Show authentication dialog
            document.dispatchEvent(new CustomEvent('GOOGLE_MODEL_AUTHENTICATION', {
                detail: { modelId, modelPath: '', loadId: Date.now().toString() + Math.random().toString(36).slice(2) }
            }));
            return;
        }
    }
    
    // Check for ServerOnly status
    const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    let modelPath = quantDropdown ? quantDropdown.value : '';
    
    // For Google models, set the correct quant path (always use the "web" file)
    if (modelId.toLowerCase().startsWith('google/')) {
        try {
            const manifest = await getManifestEntry(modelId);
            if (manifest && manifest.quants) {
                // Find the web quant (should be the only one for Google models)
                const webQuant = Object.keys(manifest.quants).find(quant => quant.includes('Web'));
                if (webQuant) {
                    modelPath = webQuant;
                }
            }
        } catch (error) {
            if (LOG_WARN) console.warn(prefix, 'Error getting manifest for Google model:', error);
        }
    }
    
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
  
  if (LOG_INFO) console.log(prefix, "updateQuantDropdown: Refreshing manifest cache...");
  
  const allManifests = await getAllManifestEntries();
  const modelRepos = getModelSelectorOptions();
  
  // Clear the cache completely
  repoQuantsCache = {};
  
  if (LOG_INFO) console.log(prefix, "updateQuantDropdown: Found manifests:", allManifests.length);
  
  for (const repo of modelRepos) {
    const manifestEntry = allManifests.find(entry => entry.repo === repo);
    if (manifestEntry) {
      repoQuantsCache[repo] = manifestEntry;
      if (LOG_INFO) console.log(prefix, `updateQuantDropdown: Cached manifest for ${repo}:`, Object.keys(manifestEntry.quants || {}));
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

  // For Google models, show the quant dropdown with the "web" option
  if (selectedRepo.startsWith('google/')) {
    quantDropdown.innerHTML = '';
    quantDropdown.disabled = false;
    quantDropdown.style.display = 'block';
    
    // Add the "web" quant option for Google models
    const manifestEntry = repoQuantsCache[selectedRepo];
    if (manifestEntry && manifestEntry.quants) {
      const webQuant = Object.keys(manifestEntry.quants).find(quant => quant.includes('Web'));
      if (webQuant) {
        const option = document.createElement('option');
        option.value = webQuant;
        option.textContent = 'Web (MediaPipe)';
        quantDropdown.appendChild(option);
      }
    }
    return;
  } else {
    quantDropdown.style.display = 'block';
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
    const status = manifestEntry.quants[modelPath].status;
    
    if (LOG_INFO) console.log(prefix, `populateQuantDropdown: ${modelPath} status:`, status);
    
    switch (status) {
      case QuantStatus.Downloaded: dot = '🟢'; break;
      case QuantStatus.Available: dot = '🟡'; break;
      case QuantStatus.Failed: dot = '⛔'; break;
      case QuantStatus.NotFound: dot = '❌'; break;
      case QuantStatus.Unavailable: dot = '🚫'; break;
      case QuantStatus.ServerOnly: dot = '🖥️'; statusLabel = ' (Requires Server)'; break;
    }
    option.textContent = `${label} ${dot}${statusLabel}`;
    if (status === QuantStatus.ServerOnly) {
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
  // Just populate the dropdown with current cached data - updateQuantDropdown() should have already refreshed it
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

    if (modelPath.endsWith('.gguf')) return 'GGUF';

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

