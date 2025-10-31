import {  UIEventNames, WorkerEventNames, LoadingStatusTypes } from '../events/eventNames';
import {  DBEventNames } from '../DB/dbEvents';
import { clearTemporaryMessages, renderTemporaryMessage } from './chatRenderer';
import browser from 'webextension-polyfill';
import { dbChannel } from '../DB/idbSchema';
import { DbStatusUpdatedNotification, DbMessagesUpdatedNotification } from '../DB/dbEvents';
import { QuantStatus, getAllManifestEntries, QuantInfo, getFromIndexedDB, getManifestEntry, getModelQuantSettings, getInferenceSettings as dbGetInferenceSettings } from '../DB/idbModel';
import { getCurrentLoadedModel } from '../sidepanel';
import { getCurrentAttachments } from '../Controllers/UnifiedAttachmentController';
import { loadAndApplySettingsToUI } from '../Controllers/InferenceSettings';


let queryInput: HTMLTextAreaElement | null,
    sendButton: HTMLButtonElement | null,
    chatBody: HTMLElement | null,
    attachButton: HTMLButtonElement | null,
    fileInput: HTMLInputElement | null,
    loadingIndicatorElement: HTMLElement | null,
    newChatButton: HTMLButtonElement | null,
    modelLoadProgress: HTMLElement | null,
    modelSourceButtons: HTMLButtonElement[] | null = null;

let isInitialized = false;
let attachFileCallback: (() => void) | null | undefined = null;
let currentSessionId: string | null = null;
let modelSelectorDropdown: HTMLSelectElement | null = null;
let quantSelectorDropdown: HTMLSelectElement | null = null;

let loadModelButton: HTMLButtonElement | null = null;    

let isLoadingModel = false; 
let currentLoadId: string | null = null;
let lastSeenLoadId: string | null = null;
let currentModelSource: 'browser' | 'native' | 'api' = 'browser';
const LOG_GENERAL = false;  // Turn off general logs
const LOG_DEBUG = false;  // Turn off debug logs
const LOG_ERROR = true;  // Keep error logging
const LOG_WARN = false;  // Turn off warning logs
const LOG_INFO = false;  // Turn OFF to reduce noise for native debugging
const LOG_UI_UPDATES = false;  // Turn off UI updates logs
const LOG_QUANT_DROPDOWN = false;  // Turn off quant dropdown logs
const LOG_MODEL_LOADING = false;  // ✅ OFF - Settings working
const LOG_EVENTS = false;  // Turn off events logs
const LOG_PROGRESS_HANDLING = false;  // Turn off to avoid spam
const LOG_BUTTON_VISIBILITY = false;  // ✅ OFF - Load button fixed
const prefix = '[UIController]';
// Define available models (can be moved elsewhere later)
export const AVAILABLE_MODELS = {
    "onnx-community/Phi-3.5-mini-instruct-onnx-web": "Phi-3.5 Mini (Transformers.js)",
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "HuggingFaceTB/SmolLM2-1.7B-Instruct": "SmolLM2-1.7B Instruct",
    "HuggingFaceTB/SmolLM3-3B-ONNX": "SmolLM3-3B ONNX",
    "onnx-community/Qwen3-1.7B-ONNX": "Qwen3-1.7B",    
    
};

export const GOOGLE_MODELS = {
    // "google/gemma-3n-E4B-it-litert-lm": "Gemma 3B (MediaPipe)",
    // Add more Google models here as needed
};

document.addEventListener(DbStatusUpdatedNotification.type, (e: Event) => {
    const customEvent = e as CustomEvent;
    if (LOG_INFO) console.log(prefix, 'Received DbStatusUpdatedNotification: ', customEvent.detail);
    handleStatusUpdate(customEvent.detail);
  });

// Listen for user model updates from IntegrationsController
window.addEventListener('userModelsUpdated', () => {
    if (LOG_INFO) console.log(prefix, 'User models updated, refreshing dropdown');
    updateModelDropdown();
});

browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    const type = message?.type;
    // Only log non-progress messages to reduce spam
    const isProgressMessage = message.type === UIEventNames.MODEL_WORKER_LOADING_PROGRESS;
    if (LOG_INFO && !isProgressMessage) {
        console.log(prefix, 'browser.runtime.onMessage Received:', message.type, message.payload);
    }
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
    attachButton = document.getElementById('unified-attach-button') as HTMLButtonElement | null;
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
    // Attach button is now handled by UnifiedAttachmentController

    modelSelectorDropdown?.addEventListener('change', async () => {
        await _handleModelChange();
        await updateLoadButtonVisibility();
    });
    quantSelectorDropdown?.addEventListener('change', async () => {
        await _handleQuantizationChange();
        await updateLoadButtonVisibility();
    });
    loadModelButton?.addEventListener('click', _handleLoadModelButtonClick);
    
            // Expanded input listeners
            const expandButton = document.getElementById('expand-input-button');
            const minimizeButton = document.getElementById('minimize-expanded-input');
            const sendExpandedButton = document.getElementById('send-expanded-button');
            const expandedInput = document.getElementById('expanded-query-input') as HTMLTextAreaElement;
            
            expandButton?.addEventListener('click', expandInput);
            minimizeButton?.addEventListener('click', minimizeInput);
            sendExpandedButton?.addEventListener('click', sendFromExpandedView);
            
            // Auto-resize expanded textarea and sync with send button state
            expandedInput?.addEventListener('input', () => {
                const sendExpandedBtn = document.getElementById('send-expanded-button') as HTMLButtonElement;
                if (sendExpandedBtn) {
                    sendExpandedBtn.disabled = expandedInput.value.trim() === '';
                }
            });
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    // Attach button is now handled by UnifiedAttachmentController

    modelSelectorDropdown?.removeEventListener('change', _handleModelChange);
    quantSelectorDropdown?.removeEventListener('change', _handleQuantizationChange);
    loadModelButton?.removeEventListener('click', _handleLoadModelButtonClick);
    
    // Remove expanded input listeners
    const expandButton = document.getElementById('expand-input-button');
    const minimizeButton = document.getElementById('minimize-expanded-input');
    const sendExpandedButton = document.getElementById('send-expanded-button');
    const expandedInput = document.getElementById('expanded-query-input') as HTMLTextAreaElement;
    
    expandButton?.removeEventListener('click', expandInput);
    minimizeButton?.removeEventListener('click', minimizeInput);
    sendExpandedButton?.removeEventListener('click', sendFromExpandedView);
    
    // Remove the input listener for expanded textarea (we can't easily remove it since it's anonymous)
    // This is fine since it's just a simple state update
}

function handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const messageText = getInputValue();
        if (messageText && !queryInput!.disabled) {
            if (LOG_INFO) console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
            
            // Get current attachments before clearing
            const attachments = getCurrentAttachments();
            
            document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { 
                detail: { 
                    text: messageText,
                    attachments: attachments 
                } 
            }));
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
        
        // Get current attachments before clearing
        const attachments = getCurrentAttachments();
        
        document.dispatchEvent(new CustomEvent(UIEventNames.QUERY_SUBMITTED, { 
            detail: { 
                text: messageText,
                attachments: attachments 
            } 
        }));
        clearInput();
    } else {
        if (LOG_INFO) console.log(prefix, "Send button clicked, but input is empty or disabled.");
    }
}

// handleAttachClick removed - now handled by UnifiedAttachmentController

export function getModelSelectorOptions(): string[] {
    if (!modelSelectorDropdown) return [];
    return Array.from(modelSelectorDropdown.options).map(opt => opt.value).filter(Boolean); 
}
export function adjustTextareaHeight() {
    if (!queryInput) return;
    
    // Always calculate proper height based on content
    const currentHeight = queryInput.style.height;
    queryInput.style.height = 'auto';
    const maxHeight = 150;
    const scrollHeight = queryInput.scrollHeight;
    const newHeight = Math.max(40, Math.min(scrollHeight, maxHeight)); // Min 40px, max 150px
    
    // Always update height if different
    if (`${newHeight}px` !== currentHeight) {
        queryInput.style.height = `${newHeight}px`;
    }
    
    // Show expand button if content exceeds max height
    if (scrollHeight > maxHeight) {
        showExpandButton();
    } else {
        hideExpandButton();
    }
    
    if (sendButton) {
        sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
    }
}

function showExpandButton() {
    const expandButton = document.getElementById('expand-input-button');
    if (expandButton) {
        expandButton.classList.remove('hidden');
    }
}

function hideExpandButton() {
    const expandButton = document.getElementById('expand-input-button');
    if (expandButton) {
        expandButton.classList.add('hidden');
    }
}

function expandInput() {
    const overlay = document.getElementById('expanded-input-overlay');
    const expandedInput = document.getElementById('expanded-query-input') as HTMLTextAreaElement;
    const sendExpandedBtn = document.getElementById('send-expanded-button') as HTMLButtonElement;
    
    if (!overlay || !expandedInput || !queryInput) return;
    
    // Copy content to expanded textarea
    expandedInput.value = queryInput.value;
    
    // Enable/disable send button based on content
    if (sendExpandedBtn) {
        sendExpandedBtn.disabled = expandedInput.value.trim() === '';
    }
    
    // Show overlay
    overlay.classList.remove('hidden');
    
    // Focus on expanded textarea
    setTimeout(() => {
        expandedInput.focus();
    }, 100);
}

function minimizeInput() {
    const overlay = document.getElementById('expanded-input-overlay');
    const expandedInput = document.getElementById('expanded-query-input') as HTMLTextAreaElement;
    
    if (!overlay || !expandedInput || !queryInput) return;
    
    // Copy content back to normal textarea
    queryInput.value = expandedInput.value;
    
    // Hide overlay
    overlay.classList.add('hidden');
    
    // Adjust height and focus
    adjustTextareaHeight();
    queryInput.focus();
}

function sendFromExpandedView() {
    const expandedInput = document.getElementById('expanded-query-input') as HTMLTextAreaElement;
    const overlay = document.getElementById('expanded-input-overlay');
    
    if (!expandedInput || !overlay || !queryInput) return;
    
    const messageText = expandedInput.value.trim();
    if (!messageText) return;
    
    // Copy content back to normal textarea
    queryInput.value = messageText;
    
    // Send the message
    handleSendButtonClick();
    
    // Clear the expanded textarea
    expandedInput.value = '';
    
    // Hide overlay
    overlay.classList.add('hidden');
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
    handleModelManagerLoadingProgress((e as CustomEvent).detail);
});

document.addEventListener(UIEventNames.MODEL_ALREADY_LOADED, (e: Event) => {
    handleModelAlreadyLoaded((e as CustomEvent).detail);
});

// Listen for WORKER_READY to reset loading state
window.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};
    if (type === WorkerEventNames.WORKER_READY) {
        isLoadingModel = false;
        lastSeenLoadId = null;
        if (LOG_MODEL_LOADING) {
            console.log(prefix, `✅ RESET isLoadingModel = FALSE (WORKER_READY: ${payload?.modelId}:${payload?.dtype})`);
        }
    }
});

document.addEventListener(UIEventNames.MODEL_SELECTION_CHANGED, async () => {
    // This event is now dispatched by both model and quantization change handlers
    // The dropdown rebuilding is handled by the model change handler
    // The status updating is handled by both handlers
    // This listener is kept for any other components that need to respond to selection changes
});

// The MODEL_SELECTION_CHANGED event already handles both model and quant dropdown changes
// No need for additional event listeners here
async function handleModelManagerLoadingProgress(payload: any) {
    if (LOG_PROGRESS_HANDLING) console.log(prefix, 'Received model manager loading progress:', payload);
    if (!payload) return;
    
    // DEBUG: Always log the status to see what we're receiving
    if (LOG_MODEL_LOADING) {
        console.log(prefix, `📊 Loading Progress Status: "${payload.status}", loadId: ${payload.loadId}, isLoadingModel: ${isLoadingModel}`);
    }
    
    if (payload.loadId !== lastSeenLoadId) {
        progressLogCount++;
        if (LOG_WARN && (progressLogCount % PROGRESS_LOG_THROTTLE_INTERVAL === 0 || progressLogCount === 1)) {
            console.warn(prefix, 'New loadId detected in progress:', payload.loadId, `(progress update #${progressLogCount})`);
        }
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
        if (LOG_PROGRESS_HANDLING) console.log(prefix, 'Handling error progress:', payload.error || payload.status);
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; 
        progressInner.style.width = '100%';
        isLoadingModel = false;
        if (LOG_MODEL_LOADING) console.log(prefix, '❌ RESET isLoadingModel = FALSE (error)');
        

        
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
    
    // Reset loading flag based on status (BEFORE message handling!)
    if (payload.status === LoadingStatusTypes.DONE) {
        isLoadingModel = false;
        if (LOG_MODEL_LOADING) console.log(prefix, '✅ Model load DONE - isLoadingModel reset to false');
    } else if (payload.status === LoadingStatusTypes.READY) {
        isLoadingModel = false;
        if (LOG_MODEL_LOADING) console.log(prefix, '✅ Model load READY - isLoadingModel reset to false');
    }
    
    // Use custom message if provided, otherwise format based on status
    if (payload.message) {
        text = payload.message;
    } else {
        switch (payload.status) {
            case LoadingStatusTypes.INITIATE:
                text = `Starting download: ${shortFile}`;
                break;
            case LoadingStatusTypes.PROGRESS:
                text = `Downloading ${shortFile}`;
                if (typeof payload.loaded === 'number' && typeof payload.total === 'number') {
                    text += `... ${Math.round(percent)}% (${formatBytes(payload.loaded)} / ${formatBytes(payload.total)})`;
                } else {
                    text += `... ${Math.round(percent)}%`;
                }
                break;
            case LoadingStatusTypes.DONE:
                text = `${shortFile} downloaded. Preparing pipeline...`;
                break;
            case LoadingStatusTypes.CACHED:
                // Special status for cache hits
                text = `Loading from cache: ${shortFile}`;
                if (typeof payload.loaded === 'number') {
                    text += ` (${formatBytes(payload.loaded)})`;
                }
                break;
            case LoadingStatusTypes.READY:
                text = `Model ready!`;
                break;
            default:
                text = 'Loading...';
        }
    }
    statusText.textContent = text;

    // DON'T hide progress bar here - it will be hidden when WORKER_READY event shows the success notification
    // This prevents flickering when multiple files complete (each DONE event used to trigger hide)
    // The progress bar will stay visible throughout the entire loading process
}

async function handleModelAlreadyLoaded(payload: any) {
    if (!payload) return;
    
    // Reset loading state since the model is already loaded
    isLoadingModel = false;
    if (LOG_MODEL_LOADING) console.log(prefix, '✅ RESET isLoadingModel = FALSE (model already loaded)');
    

    
    enableInput();
    
    // Hide the loading status (model already loaded, no need to show progress)
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'none';
    
    // Reset load tracking
    lastSeenLoadId = null;
    
    if (LOG_GENERAL) console.log(prefix, `Model ${payload.modelId} (${payload.dtype}) is already loaded. UI state reset.`);
}

// Throttle UI updates to prevent spam
let lastUIUpdateTime = 0;
const UI_UPDATE_THROTTLE_MS = 2000; // Only update UI once every 2 seconds
let isUpdatingUI = false; // Prevent concurrent UI updates

// Throttling for high-frequency UI operations
let uiLogCount = 0;
const UI_LOG_THROTTLE_INTERVAL = 20; // Log every 20 operations

// Throttling for progress callback logs
let progressLogCount = 0;
const PROGRESS_LOG_THROTTLE_INTERVAL = 10; // Log every 10 progress updates

// Check IndexedDB status and update dropdown colors in real-time
async function updateQuantDropdownStatusFromDB() {
    const now = Date.now();
    if (now - lastUIUpdateTime < UI_UPDATE_THROTTLE_MS || isUpdatingUI) {
        return; // Skip this update to prevent spam or concurrent updates
    }
    
    isUpdatingUI = true;
    lastUIUpdateTime = now;
    
    try {
    
    if (LOG_QUANT_DROPDOWN) console.log('[UIController] updateQuantDropdownStatusFromDB called');
    const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
    const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    
    if (!modelDropdown || !quantDropdown) {
        if (LOG_QUANT_DROPDOWN) console.log('[UIController] Dropdowns not found');
        return;
    }
    
    const selectedModel = modelDropdown.value;
    if (LOG_QUANT_DROPDOWN) console.log('[UIController] Selected model:', selectedModel);
    if (!selectedModel || !repoQuantsCache[selectedModel]) {
        if (LOG_QUANT_DROPDOWN) console.log('[UIController] No model selected or not in cache');
        return;
    }
    
    const manifestEntry = repoQuantsCache[selectedModel];
    if (LOG_QUANT_DROPDOWN) console.log('[UIController] Manifest entry found, checking', Object.keys(manifestEntry.quants).length, 'quants');
    
    // Check each quant option's actual IndexedDB status
    const options = Array.from(quantDropdown.options);
    if (LOG_QUANT_DROPDOWN) console.log('[UIController] Found', options.length, 'quant options to check');
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const dtype = option.value;
        uiLogCount++;
        
        // Throttled logging for high-frequency operations
        if (LOG_QUANT_DROPDOWN && (uiLogCount % UI_LOG_THROTTLE_INTERVAL === 0 || uiLogCount === 1)) {
            console.log('[UIController] Checking quant option', i + 1, 'of', options.length, ':', dtype, '(operation #' + uiLogCount + ')');
        }
        
        const modelPath = Object.keys(manifestEntry.quants).find(path => {
            const quantInfo = manifestEntry.quants[path];
            const extractedDtype = quantInfo.dtype || extractCleanDtypeFromPath(path);
            return extractedDtype === dtype;
        });
        
        if (LOG_QUANT_DROPDOWN && (uiLogCount % UI_LOG_THROTTLE_INTERVAL === 0 || uiLogCount === 1)) {
            console.log('[UIController] Found modelPath for', dtype, ':', modelPath, '(operation #' + uiLogCount + ')');
        }
        
        if (modelPath) {
            const quantInfo = manifestEntry.quants[modelPath];
            
            // Check if files are actually in IndexedDB
            const isInIndexedDB = await checkQuantInIndexedDB(selectedModel, modelPath);
            if (LOG_QUANT_DROPDOWN && (uiLogCount % UI_LOG_THROTTLE_INTERVAL === 0 || uiLogCount === 1)) {
                console.log('[UIController] Quant', dtype, 'modelPath:', modelPath, 'isInIndexedDB:', isInIndexedDB, '(operation #' + uiLogCount + ')');
            }
            
            // Update the option's class and appearance
            option.className = ''; // Clear existing classes
            
            if (isInIndexedDB) {
                option.classList.add('quant-option-downloaded');
                // Update the text to show downloaded status
                const label = quantKeyToLabel(dtype);
                option.textContent = `${label} 💾 (Downloaded)`;
                if (LOG_QUANT_DROPDOWN && (uiLogCount % UI_LOG_THROTTLE_INTERVAL === 0 || uiLogCount === 1)) {
                    console.log('[UIController] Set', dtype, 'to downloaded status (operation #' + uiLogCount + ')');
                }
            } else {
                // Use the original status from manifest
                switch (quantInfo.status) {
                    case QuantStatus.Available:
                        option.classList.add('quant-option-available');
                        break;
                    case QuantStatus.Failed:
                        option.classList.add('quant-option-failed');
                        break;
                    case QuantStatus.ServerOnly:
                        option.classList.add('quant-option-server-only');
                        break;
                    case QuantStatus.Unavailable:
                        option.classList.add('quant-option-unavailable');
                        break;
                }
            }
            
            // Check if this is currently loaded
            const currentLoadedModel = getCurrentLoadedModel();
            if (currentLoadedModel && currentLoadedModel.modelId === selectedModel && currentLoadedModel.quant === dtype) {
                option.classList.add('quant-option-currently-loaded');
                const label = quantKeyToLabel(dtype);
                option.textContent = `${label} ▶️ (Currently Loaded)`;
            }
        } else {
            if (LOG_QUANT_DROPDOWN && (uiLogCount % UI_LOG_THROTTLE_INTERVAL === 0 || uiLogCount === 1)) {
                console.log('[UIController] No modelPath found for dtype:', dtype, '(operation #' + uiLogCount + ')');
            }
        }
    }
    
        if (LOG_QUANT_DROPDOWN) console.log('[UIController] Finished checking all quant options');
    } finally {
        isUpdatingUI = false;
    }
}

// Helper function to check if quant files are in IndexedDB
async function checkQuantInIndexedDB(modelId: string, modelPath: string): Promise<boolean> {
    try {
        // Check if the main model file exists in IndexedDB (for non-chunked files)
        const modelUrl = `https://huggingface.co/${modelId}/resolve/main/${modelPath}`;
        const cached = await getFromIndexedDB(modelUrl);
        if (cached) {
            return true;
        }
        
        // Check if the file is chunked (for large files)
        const manifestKey = `${modelId}/${modelPath}:manifest`;
        const manifest = await getFromIndexedDB(manifestKey);
        if (manifest) {
            const manifestData = await manifest.text();
            const manifestObj = JSON.parse(manifestData);
            if (manifestObj.type === 'manifest' && manifestObj.totalChunks > 0) {
                // Check if at least the first chunk exists
                const firstChunkKey = `${modelId}/${modelPath}_chunk_0`;
                const firstChunk = await getFromIndexedDB(firstChunkKey);
                return !!firstChunk;
            }
        }
        
        return false;
    } catch (error) {
        console.error('[UIController] Error checking quant in IndexedDB:', error);
        return false;
    }
}

export function getCurrentlySelectedModel(): { modelId: string | null; dtype: string | null } {
    if (!modelSelectorDropdown || !quantSelectorDropdown) return { modelId: null, dtype: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        dtype: quantSelectorDropdown.value || null,
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
    
    // Add user-added models
    try {
        const { getUserAddedModels } = await import('../DB/idbModel');
        const defaultModels = new Set(Object.keys(AVAILABLE_MODELS));
        const userModels = await getUserAddedModels(defaultModels);
        
        if (userModels.length > 0) {
            // Add separator if there are user models
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────';
            modelSelector.appendChild(separator);
            
            // Add user models
            for (const model of userModels) {
                const option = document.createElement('option');
                option.value = model.repo;
                option.textContent = `${model.repo.split('/').pop()} (Custom)`;
                modelSelector.appendChild(option);
            }
        }
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, 'Failed to load user-added models:', error);
    }
    
    // Add Google models (always visible and selectable)
    /*
    for (const [modelId, displayName] of Object.entries(GOOGLE_MODELS)) {
        const option = document.createElement('option');
        option.value = modelId;
        option.textContent = displayName as string;
        if (!isAuthenticated) {
            option.textContent += ' (Authentication Required)';
        }
        // Don't disable the option - let users select it to trigger auth
        modelSelector.appendChild(option);
    }
    */
    
    // Enable/disable based on available models
    const hasModels = modelSelector.children.length > 0;
    modelSelector.disabled = !hasModels;
    

}

// Update load button visibility based on current selection
// SIMPLE RULE: Show button ONLY if user selected a different model+quant than what's loaded
async function updateLoadButtonVisibility() {
    console.log(prefix, '🔘 [updateLoadButtonVisibility] === CALLED ===');
    console.log(prefix, '🔘 Stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
    
    if (!loadModelButton) return;
    
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    const quantSelector = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    
    if (!modelSelector || !quantSelector) return;
    
    const selectedModel = modelSelector.value;
    const selectedQuant = quantSelector.value;
    const currentLoadedModel = getCurrentLoadedModel();
    
    // Check if selection matches loaded model
    const isAlreadyLoaded = currentLoadedModel && 
        currentLoadedModel.modelId === selectedModel && 
        currentLoadedModel.quant === selectedQuant;
    
    console.log(prefix, `🔘 State: selected=${selectedModel}/${selectedQuant}, loaded=${currentLoadedModel?.modelId}/${currentLoadedModel?.quant}, isAlreadyLoaded=${isAlreadyLoaded}`);
    
    const loadBtn = loadModelButton as HTMLButtonElement;
    
    // SIMPLE LOGIC: Hide if loaded, show if different
    if (isAlreadyLoaded) {
        console.log(prefix, '🔘 [updateLoadButtonVisibility] ✅ HIDING button - model already loaded');
        loadBtn.style.display = 'none';
    } else if (selectedModel && selectedQuant) {
        // Show button only if both model and quant are selected
        console.log(prefix, '🔘 [updateLoadButtonVisibility] 👁️ SHOWING button - different model selected');
        loadBtn.style.display = '';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Model';
    } else {
        // No valid selection - keep hidden
        console.log(prefix, '🔘 [updateLoadButtonVisibility] Keeping button HIDDEN - no valid selection');
        loadBtn.style.display = 'none';
    }
}

// Export function to refresh model dropdown (called after authentication)
export async function refreshModelDropdown() {
    await updateModelDropdown();
 
}

export async function initializeUI(callbacks: { onNewChat?: () => void }) {
    if (LOG_INFO) console.log(prefix, "Initializing...");
    if (isInitialized) {
        removeListeners();
    }
    if (!selectElements()) {
        isInitialized = false;
        return null;
    }
    // attachFileCallback removed - now handled by UnifiedAttachmentController
    
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

    if (LOG_INFO) console.log(prefix, "Initializing UI elements...");

    if (LOG_INFO) console.log(prefix, "Attempting to find model selector...");
    const modelSelector = document.getElementById('model-selector') as HTMLSelectElement | null;
    if (LOG_INFO) console.log(prefix, modelSelector ? "Model selector found." : "WARNING: Model selector NOT found!");
    if (modelSelector) {
        // Use the new updateModelDropdown function
        await updateModelDropdown();
        
        // Don't populate quant dropdown here - wait for MANIFEST_UPDATED event
        // The sidepanel is still processing manifests, so the cache will be empty
        

    } else {
        if (LOG_WARN) console.warn(prefix, "Model selector dropdown not found.");
        if (loadModelButton) (loadModelButton as HTMLButtonElement).style.display = 'none';
    }

    if (LOG_INFO) console.log(prefix, "UI Initialization complete.");
    
    // Initialize model source toggle
    initializeModelSourceToggle();

    // Check IndexedDB status for initial dropdown state
    setTimeout(async () => {
        await updateQuantDropdownStatusFromDB();
    }, 1000); // Wait 1 second for everything to be ready
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
    
    // Clear attachments
    const attachmentsContainer = document.getElementById('attachments-container');
    if (attachmentsContainer) {
        attachmentsContainer.remove();
        if (LOG_INFO) console.log(prefix, "Cleared attachments container");
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



// Handle model changes - rebuild dropdown and update status
async function _handleModelChange() { 
    if (!modelSelectorDropdown || !quantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    let dtype = quantSelectorDropdown.value;
    
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
                    dtype = webQuant;
                }
            }
        } catch (error) {
            if (LOG_WARN) console.warn(prefix, 'Error getting manifest for Google model:', error);
        }
    }
    
    if (LOG_INFO) console.log(prefix, `Model changed by user. Rebuilding dropdown and updating status.`, { modelId, dtype });
    
    // Rebuild dropdown for new model (options change)
    populateQuantDropdownForSelectedRepo();
    
    // Update status colors
    await updateQuantDropdownStatusFromDB();   

    
    // Check if this is a Google model that needs authentication
    if (modelId.toLowerCase().startsWith('google/')) {
        const isAuthenticated = await isHuggingFaceAuthenticated();
        if (!isAuthenticated) {
            // For Google models, check authentication on dropdown selection
            document.dispatchEvent(new CustomEvent('GOOGLE_MODEL_AUTHENTICATION', {
                detail: { modelId, dtype, loadId: Date.now().toString() + Math.random().toString(36).slice(2) }
            }));
            return;
        }
    }
    
    document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, dtype } 
    }));
}

// Handle quantization changes - only update status, don't rebuild dropdown
async function _handleQuantizationChange() { 
    if (!modelSelectorDropdown || !quantSelectorDropdown) return;
    const modelId = modelSelectorDropdown.value;
    const dtype = quantSelectorDropdown.value;
    
    if (LOG_INFO) console.log(prefix, `Quantization changed by user. Updating status only.`, { modelId, dtype });
    
    // Only update status colors, don't rebuild dropdown (options are the same)
    await updateQuantDropdownStatusFromDB();   

    
    document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, dtype } 
    }));
}

// Stub for native app detection
function isNativeAppAvailable(): boolean {
    // TODO: Implement real detection logic
    return false;
}

// Placeholder for future native app/server integration
function handleServerOnlyModelLoad(modelId: string, dtype: string) {
    // TODO: Implement native app/server-side model loading logic here
    if (LOG_INFO) console.log(prefix, `handleServerOnlyModelLoad called for modelId: ${modelId}, dtype: ${dtype}`);
    // For now, just show the temporary chat message
    renderTemporaryMessage('system', 'This model is too large to load in the browser. Please download and run the TabAgent Server to use this model. [Learn more]');
}

async function _handleLoadModelButtonClick() {
    if (LOG_MODEL_LOADING) console.log(prefix, '🔘🔘🔘 LOAD BUTTON CLICKED!!!');
    if (LOG_MODEL_LOADING) console.log(prefix, 'Load Model button clicked');
    
    // Debug: Check all conditions
    if (LOG_MODEL_LOADING) {
        console.log(prefix, '🔍 Checking conditions:', {
            hasModelSelector: !!modelSelectorDropdown,
            hasLoadButton: !!loadModelButton,
            isLoadingModel: isLoadingModel
        });
    }
    
    if (!modelSelectorDropdown || !loadModelButton || isLoadingModel) {
        if (LOG_MODEL_LOADING) console.log(prefix, '❌ EARLY RETURN - Condition failed!');
        return;
    }
    
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        if (LOG_WARN) console.warn(prefix, "Load Model button clicked, but no model selected.");
        return;
    }

    const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
    let dtype = quantDropdown ? quantDropdown.value : '';
    if (!dtype) {
        if (LOG_WARN) console.warn(prefix, "Load Model button clicked, but no quantization selected.");
        return;
    }
    if (LOG_MODEL_LOADING) console.log(prefix, 'Loading model:', modelId, 'with dtype:', dtype);
    
    const manifestEntry = repoQuantsCache[modelId];
    if (manifestEntry && manifestEntry.quants[dtype] && manifestEntry.quants[dtype].status === QuantStatus.ServerOnly) {
        if (LOG_MODEL_LOADING) console.log(prefix, 'Handling server-only model');
        handleServerOnlyModelLoad(modelId, dtype);
        return;
    }
    
    // IMPORTANT: Load settings for this model+quant BEFORE starting the load
    // This ensures the UI shows the correct settings before the model loads
    if (LOG_MODEL_LOADING) console.log(prefix, `📋 Pre-loading settings for ${modelId}:${dtype} and updating UI...`);
    try {
        await loadAndApplySettingsToUI(modelId, dtype);
        if (LOG_MODEL_LOADING) console.log(prefix, `✅ Settings UI updated for ${modelId}:${dtype}`);
    } catch (e) {
        console.error(prefix, `❌ Failed to pre-load settings for ${modelId}:${dtype}:`, e);
        // Continue anyway - will use defaults
    }
    
    // Set loading state
    isLoadingModel = true;
    currentLoadId = Date.now().toString() + Math.random().toString(36).slice(2);
    if (LOG_MODEL_LOADING) console.log(prefix, '🚀 SET isLoadingModel = TRUE, loadId:', currentLoadId);
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'block';
    disableInput("Loading model...");
    loadModelButton.disabled = true;
    setLoadModelButtonText('Loading...');
    const badge = document.getElementById('device-badge');
    if (badge) badge.style.display = 'none';

    // Dispatch the request - the sidepanel will handle the "already loaded" check
    if (LOG_MODEL_LOADING) console.log(prefix, 'Dispatching REQUEST_MODEL_EXECUTION event');
    document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId, dtype, loadId: currentLoadId }
    }));
}

let repoQuantsCache: Record<string, any> = {};

export async function updateQuantDropdown() {
  const modelDropdown = document.getElementById('model-selector') as HTMLSelectElement | null;
  const quantDropdown = document.getElementById('onnx-variant-selector') as HTMLSelectElement | null;
  
  if (!modelDropdown || !quantDropdown) return;
  
  if (LOG_INFO) console.log(prefix, "📋 updateQuantDropdown: Refreshing manifest cache from IndexedDB...");
  
  const allManifests = await getAllManifestEntries();
  const modelRepos = getModelSelectorOptions();
  
  // Clear the cache completely
  repoQuantsCache = {};
  
  if (LOG_INFO) console.log(prefix, `📋 updateQuantDropdown: Found ${allManifests.length} manifests in IndexedDB`);
  
  for (const repo of modelRepos) {
    const manifestEntry = allManifests.find(entry => entry.repo === repo);
    if (manifestEntry) {
      repoQuantsCache[repo] = manifestEntry;
      
      // Log each quant and its status for debugging
      if (LOG_INFO) {
        const quantDetails = Object.entries(manifestEntry.quants || {})
          .map(([path, info]: [string, any]) => `${path} (${info.dtype}) → ${info.status}`)
          .join(', ');
        const manifestInfo = `📋 updateQuantDropdown: Cached manifest for ${repo}:
        Quants: ${Object.keys(manifestEntry.quants || {}).length}
        Details: ${quantDetails}`;
        console.log(prefix, manifestInfo);
      }
    }
  }  
  populateQuantDropdownForSelectedRepo();
  // Update status after populating dropdown
  await updateQuantDropdownStatusFromDB();
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

  quantDropdown.style.display = 'block';
  
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
  
  // Deduplicate by dtype to avoid showing multiple options for same quantization
  const seenDtypes = new Set<string>();
  
  for (const modelPath in manifestEntry.quants) {
    const quantInfo = manifestEntry.quants[modelPath];
    
    // Handle legacy manifests that don't have dtype field
    const dtype = quantInfo.dtype || extractCleanDtypeFromPath(modelPath);
    
    // Skip if we've already processed this dtype
    if (seenDtypes.has(dtype)) {
      if (LOG_INFO) console.log(prefix, `📋 populateQuantDropdown: Skipping duplicate dtype "${dtype}" for modelPath "${modelPath}"`);
      continue;
    }
    seenDtypes.add(dtype);
    
    const option = document.createElement('option');
    if (LOG_QUANT_DROPDOWN) console.log('[populateQuantDropdown] modelPath:', modelPath, 'quantInfo.dtype:', quantInfo.dtype, 'extracted dtype:', dtype);
    option.value = dtype; // Use clean dtype instead of modelPath
    let label = quantKeyToLabel(dtype);
    let dot = '⚪'; // default gray
    let statusLabel = '';
    const status = quantInfo.status;
    
    if (LOG_INFO) {
      const quantStatusInfo = `📋 populateQuantDropdown: Processing quant for ${selectedRepo}:
      modelPath: ${modelPath}
      dtype: ${dtype}
      status: ${status}`;
      console.log(prefix, quantStatusInfo);
    }
    
    switch (status) {
      case QuantStatus.Downloaded: 
        dot = '💾'; // Downloaded to IndexedDB
        option.classList.add('quant-option-downloaded');
        break;
      case QuantStatus.Available: 
        dot = '🟡'; 
        option.classList.add('quant-option-available');
        break;
      case QuantStatus.Failed: 
        dot = '⛔'; 
        option.classList.add('quant-option-failed');
        break;
      case QuantStatus.NotFound: 
        dot = '❌'; 
        option.classList.add('quant-option-unavailable');
        break;
      case QuantStatus.Unavailable: 
        dot = '🚫'; 
        option.classList.add('quant-option-unavailable');
        break;
      case QuantStatus.ServerOnly: 
        dot = '🖥️'; 
        statusLabel = ' (Requires Server)';
        option.classList.add('quant-option-server-only');
        break;
    }
    
    // Check if this is the currently loaded model
    const currentLoadedModel = getCurrentLoadedModel();
    if (currentLoadedModel && currentLoadedModel.modelId === selectedRepo && currentLoadedModel.quant === dtype) {
      option.classList.add('quant-option-currently-loaded');
      // Override the status label to show it's loaded
      statusLabel = ' (Currently Loaded)';
      dot = '▶️'; // Use play button for loaded models (active in memory)
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
  
  // Update status after populating dropdown
  setTimeout(async () => {
    await updateQuantDropdownStatusFromDB();
  }, 100); // Small delay to ensure DOM is updated
}
document.getElementById('model-selector')?.addEventListener('change', onModelDropdownChange);

export async function onModelDropdownChange() {
  // Just populate the dropdown with current cached data - updateQuantDropdown() should have already refreshed it
  populateQuantDropdownForSelectedRepo();
  // Update status after populating dropdown
  await updateQuantDropdownStatusFromDB();
}


window.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === WorkerEventNames.MANIFEST_UPDATED) {
    if (LOG_INFO) console.log(prefix, "Received MANIFEST_UPDATED event. Updating quant dropdown.");
    updateQuantDropdown();
  }
});

document.addEventListener(WorkerEventNames.MANIFEST_UPDATED, async () => {
    if (LOG_INFO) console.log(prefix, "📢 Received DOM MANIFEST_UPDATED event. Updating quant dropdown.");
    await updateQuantDropdown();
    // Don't call _handleModelChange here - it triggers MODEL_SELECTION_CHANGED which can show button
  });

function setLoadModelButtonText(text: string) {
    if (loadModelButton) loadModelButton.textContent = text;
}

/**
 * Extract clean quantization type from file path (for legacy manifests)
 * @param filePath - File path like "onnx/model_q4f16.onnx" or "onnx/model.onnx"
 * @returns Clean dtype like "q4f16", "fp16", "fp32", etc.
 */
function extractCleanDtypeFromPath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') return 'fp32';
    
    // Extract filename from path
    const filename = filePath.split('/').pop() || filePath;
    
    // Remove .onnx extension
    const nameWithoutExt = filename.replace(/\.onnx$/, '');
    
    // Extract quantization type from filename (check longer patterns first)
    if (nameWithoutExt.includes('q4f16')) return 'q4f16';
    if (nameWithoutExt.includes('uint8')) return 'uint8';  // Check uint8 before int8
    if (nameWithoutExt.includes('int8')) return 'int8';
    if (nameWithoutExt.includes('bnb4')) return 'bnb4';
    if (nameWithoutExt.includes('q4')) return 'q4';
    if (nameWithoutExt.includes('q8')) return 'q8';
    if (nameWithoutExt.includes('fp16')) return 'fp16';
    if (nameWithoutExt.includes('fp32')) return 'fp32';
    if (nameWithoutExt.includes('quantized')) return 'quantized';
    
    // Default to fp32 if no match (for "model.onnx" files)
    return 'fp32';
}

export function quantKeyToLabel(dtype: string): string {
    if (!dtype || typeof dtype !== 'string') return String(dtype);

    // Now we work with clean dtypes like "q4f16", "fp16", etc.
    const cleanDtype = dtype.toLowerCase();
    
    switch (cleanDtype) {
        case 'q4f16': return 'Q4F16';
        case 'q4': return 'Q4';
        case 'q8': return 'Q8';
        case 'bnb4': return 'BNB4';
        case 'int8': return 'INT8';
        case 'uint8': return 'UINT8';
        case 'fp16': return 'FP16';
        case 'fp32': return 'FP32';
        case 'quantized': return 'QUANTIZED';
        default: return 'FP32';
    }
}

/**
 * Load the default model (first model from AVAILABLE_MODELS) automatically
 */
export async function loadDefaultModel(): Promise<boolean> {
    if (LOG_INFO) console.log(prefix, "Loading default model...");
    
    try {
        // Check if a model is already loaded or loading
        const { getCurrentLoadedModel, queryBackgroundModelState } = await import('../sidepanel');
        const currentLoadedModel = getCurrentLoadedModel();
        if (currentLoadedModel && currentLoadedModel.modelId) {
            if (LOG_INFO) console.log(prefix, `Model already loaded: ${currentLoadedModel.modelId}, skipping default model loading`);
            return true;
        }
        
        // Also check if background is currently loading a model
        const bgModelState = await queryBackgroundModelState();
        if (bgModelState.isLoading) {
            if (LOG_INFO) console.log(prefix, `Model is currently loading in background, skipping default model loading`);
            return true;
        }
        if (bgModelState.isReady && bgModelState.modelId) {
            if (LOG_INFO) console.log(prefix, `Background has model ready: ${bgModelState.modelId}, skipping default model loading`);
            return true;
        }
        
        // Get the first model from AVAILABLE_MODELS
        const defaultModelId = Object.keys(AVAILABLE_MODELS)[0];
        if (!defaultModelId) {
            if (LOG_WARN) console.warn(prefix, "No models available in AVAILABLE_MODELS");
            return false;
        }
        
        if (LOG_INFO) console.log(prefix, `Default model selected: ${defaultModelId}`);
        
        // Set the model in the dropdown
        if (modelSelectorDropdown) {
            modelSelectorDropdown.value = defaultModelId;
            if (LOG_INFO) console.log(prefix, "Set model selector to default model");
        }
        
        // Wait for manifests to be loaded and quant dropdown to be populated
        await updateQuantDropdown();
        
        // Get the best available quantization for this model
        const manifestEntry = repoQuantsCache[defaultModelId];
        if (!manifestEntry || !manifestEntry.quants) {
            if (LOG_WARN) console.warn(prefix, "No manifest entry found for default model, waiting for manifests...");
            // Wait a bit more for manifests to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            return false;
        }
        
        // Find the best quantization (prefer q4f16, then q4, then first available)
        const quants = Object.entries(manifestEntry.quants);
        let bestQuant = null;
        
        // Look for q4f16 first
        for (const [modelPath, quantInfo] of quants) {
            if ((quantInfo as any).dtype === 'q4f16') {
                bestQuant = (quantInfo as any).dtype;
                break;
            }
        }
        
        // If no q4f16, look for q4
        if (!bestQuant) {
            for (const [modelPath, quantInfo] of quants) {
                if ((quantInfo as any).dtype === 'q4') {
                    bestQuant = (quantInfo as any).dtype;
                    break;
                }
            }
        }
        
        // If still no quant found, use the first available
        if (!bestQuant && quants.length > 0) {
            bestQuant = (quants[0][1] as any).dtype || 'fp32';
        }
        
        if (!bestQuant) {
            if (LOG_WARN) console.warn(prefix, "No quantization found for default model");
            return false;
        }
        
        if (LOG_INFO) console.log(prefix, `Best quantization for default model: ${bestQuant}`);
        
        // Set the quantization in the dropdown
        if (quantSelectorDropdown) {
            quantSelectorDropdown.value = bestQuant;
            if (LOG_INFO) console.log(prefix, "Set quant selector to best quantization");
        }
                
        // Show loading message
        disableInput("Loading default model...");
        
        // Trigger model loading
        const loadId = Date.now().toString() + Math.random().toString(36).slice(2);
        if (LOG_INFO) console.log(prefix, `Dispatching model load request for ${defaultModelId} with ${bestQuant}`);
        
        document.dispatchEvent(new CustomEvent(UIEventNames.REQUEST_MODEL_EXECUTION, {
            detail: { modelId: defaultModelId, dtype: bestQuant, loadId }
        }));
        
        return true;
        
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, "Error loading default model:", error);
        return false;
    }
}

// Model Source Toggle Functions
function initializeModelSourceToggle() {
    const buttons = document.querySelectorAll('.model-source-btn');
    modelSourceButtons = Array.from(buttons) as HTMLButtonElement[];
    
    if (!modelSourceButtons || modelSourceButtons.length === 0) {
        if (LOG_WARN) console.warn(prefix, "Model source toggle buttons not found");
        return;
    }

    // Add click listeners to all toggle buttons
    modelSourceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const source = button.id.replace('source-', '') as 'browser' | 'native' | 'api';
            setModelSource(source);
        });
    });

    // Set initial state
    setModelSource('browser');
    
    if (LOG_INFO) console.log(prefix, "Model source toggle initialized");
}

function setModelSource(source: 'browser' | 'native' | 'api') {
    if (!modelSourceButtons) return;

    // Update active button
    modelSourceButtons.forEach(button => {
        const buttonSource = button.id.replace('source-', '');
        if (buttonSource === source) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update global state
    currentModelSource = source;
    
    // TODO: Update model dropdown based on source
    // For now, just log the change
    if (LOG_INFO) console.log(prefix, `Model source changed to: ${source}`);
    
    // Dispatch custom event for other components to listen
    document.dispatchEvent(new CustomEvent('modelSourceChanged', { 
        detail: { source: currentModelSource } 
    }));
}

export function getCurrentModelSource(): 'browser' | 'native' | 'api' {
    return currentModelSource;
}

