import { eventBus } from '../eventBus.js';
import { DbStatusUpdatedNotification, DbSessionUpdatedNotification } from '../events/dbEvents.js';

let queryInput, sendButton, chatBody, attachButton, fileInput, /*sessionListElement,*/ loadingIndicatorElement;
let isInitialized = false;
let attachFileCallback = null;
let currentSessionId = null;

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
            eventBus.publish('ui:querySubmitted', { text: messageText });
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
        eventBus.publish('ui:querySubmitted', { text: messageText });
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

function showLoadingIndicatorInternal(message = 'Loading...') {
    if (loadingIndicatorElement) {
        loadingIndicatorElement.textContent = message;
        loadingIndicatorElement.classList.remove('hidden');
    }
}

function hideLoadingIndicatorInternal() {
    if (loadingIndicatorElement) {
        loadingIndicatorElement.classList.add('hidden');
    }
}

function handleStatusUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) return;
    if (notification.sessionId === currentSessionId) {
        setInputStateInternal(notification.payload.status || 'idle');
    }
}

export async function initializeUI(callbacks) {
    console.log("[UIController] Initializing...");
    if (isInitialized) {
        console.warn("[UIController] Already initialized. Removing old listeners and subscriptions.");
        removeListeners();
        eventBus.unsubscribe(DbStatusUpdatedNotification.name, handleStatusUpdate);
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

    eventBus.subscribe(DbStatusUpdatedNotification.name, handleStatusUpdate);
    console.log("[UIController] Subscribed to DB Status notifications.");

    isInitialized = true;
    setInputStateInternal('idle');
    adjustTextareaHeight();
    console.log("[UIController] Initialized successfully.");

    console.log(`[UIController] Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);
    return { chatBody, queryInput, sendButton, attachButton, fileInput };
}

export function setActiveSession(sessionId) {
    console.log(`[UIController] Setting active session for UI state: ${sessionId}`);
    currentSessionId = sessionId;
    // Still update input state based on active session
    if (!sessionId) {
        setInputStateInternal('idle'); 
    } 
    // We might still want to trigger setInputStateInternal(status) if we load an existing session
    // but that should happen based on DbStatusUpdatedNotification for the loaded session.
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