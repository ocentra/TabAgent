// src/uiController.js

let queryInput, sendButton, chatBody, attachButton, fileInput;
let isInitialized = false;
let sendMessageCallback = null;
let attachFileCallback = null;

//  Selects and stores references to key UI elements upon initialization.
function selectElements() {
    queryInput = document.getElementById('query-input');
    sendButton = document.getElementById('send-button');
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button');
    fileInput = document.getElementById('file-input');

    if (!queryInput || !sendButton || !chatBody || !attachButton || !fileInput) {
        console.error("UIController: One or more essential elements not found!");
        return false;
    }
    return true;
}


function attachListeners() {
    queryInput?.addEventListener('input', adjustTextareaHeight);
    queryInput?.addEventListener('keydown', handleEnterKey);
    sendButton?.addEventListener('click', handleSendButtonClick);
    attachButton?.addEventListener('click', handleAttachClick);
    // Note: The fileInput 'change' listener is handled separately (e.g., in fileHandler or main init)
    // fileInput?.addEventListener('change', handleFileChange); <--- Not here usually
}

//  Removes event listeners to prevent memory leaks when the UI is re-initialized or destroyed.
function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);
}

//  Handles Enter key press in the textarea to trigger sending the message.
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (sendMessageCallback) {
            sendMessageCallback(); // Call the provided callback
        }
    }
}

//  Handles the click event on the send button to trigger sending the message.
function handleSendButtonClick() {
    if (sendMessageCallback) {
        sendMessageCallback(); // Call the provided callback
    }
}

//  Handles the click event on the attach button, delegating to the provided callback.
function handleAttachClick() {
    if (attachFileCallback) {
        attachFileCallback(); // Call the provided callback (likely triggers file input)
    }
}

//  Dynamically adjusts the height of the input textarea based on its content.
export function adjustTextareaHeight() {
    if (!queryInput) return;
    queryInput.style.height = 'auto';
    const maxHeight = 150; // Consider making this configurable
    const scrollHeight = queryInput.scrollHeight;
    queryInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    // Update send button state based on input value and disabled state
    if (sendButton) {
        sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
    }
}

// --- Public API ---

//  Sets up the UI controller, selects elements, and attaches listeners. Accepts callbacks for actions.
export function initializeUI(callbacks) {
    console.log("[UIController] Initializing...");
    if (isInitialized) {
        console.warn("[UIController] Already initialized. Removing old listeners.");
        removeListeners(); // Clean up previous listeners if re-initializing
    }

    if (!selectElements()) {
        isInitialized = false;
        return null; // Return null or throw error if elements are missing
    }

    // Store callbacks provided by the main script
    sendMessageCallback = callbacks?.onSendMessage; // Expects a function
    attachFileCallback = callbacks?.onAttachFile;   // Expects a function

    attachListeners();
    adjustTextareaHeight(); // Set initial height and button state
    isInitialized = true;
    console.log("[UIController] Initialized successfully.");

    // Return references to elements that might be needed externally (e.g., chatBody for renderer)
    return { queryInput, sendButton, chatBody, attachButton, fileInput };
}

//  Checks if the UI controller has been successfully initialized.
export function checkInitialized() {
    return isInitialized;
}

//  Provides controlled access to the current value of the query input.
export function getInputValue() {
    // Return trimmed value or empty string if input doesn't exist
    return queryInput?.value.trim() || '';
}

//  Clears the content of the query input.
export function clearInput() {
    console.log("[UIController] Entering clearInput function.");
    if (queryInput) {
        queryInput.value = '';
        adjustTextareaHeight(); // Re-adjust height and button state after clearing
    }
}

//  Disables the query input and send button, typically during processing.
export function disableInput() {
    console.log("[UIController] Entering disableInput function.");
    if (queryInput) queryInput.disabled = true;
    if (sendButton) sendButton.disabled = true; // Always disable send when input is disabled
}

//  Re-enables the input field and send button.
export function enableInput() {
    if (!checkInitialized()) return;
    queryInput.disabled = false;
    adjustTextareaHeight(); // Recalculate button state based on content
}

//  Sets focus to the query input element.
export function focusInput() {
    queryInput?.focus();
}

//  Programmatically clicks the hidden file input element.
export function triggerFileInputClick() {
    fileInput?.click();
} 