// src/fileHandler.js

import { showError } from './utils.js'; // For user feedback

// --- Module State ---
let db = null;
let renderer = null;
let getActiveSessionIdFunc = null;
let ui = null; // Need uiController to trigger file input click

//  Stores dependencies needed for file handling.
export function initializeFileHandling(dependencies) {
    db = dependencies.dbFunctions;
    renderer = dependencies.chatRenderer;
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    ui = dependencies.uiController; // Store uiController reference

    if (!db || !renderer || !getActiveSessionIdFunc || !ui) {
        console.error("FileHandler: Missing one or more dependencies during initialization!");
    } else {
        console.log("[FileHandler] Initialized.");
        // Attach listener via uiController if it provides the file input element
        // Or assume fileInput is passed directly if needed:
        // dependencies.fileInputElement?.addEventListener('change', handleFileSelected);
    }
     // The actual 'change' listener is added in sidepanel.js during initialization.
     // This module just provides the *handler* function.
}

//  Processes the file selected by the user, adding a notification message to the chat.
export async function handleFileSelected(event) {
    if (!db || !renderer || !getActiveSessionIdFunc) {
         console.error("FileHandler: Not initialized properly.");
         return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
        console.log("FileHandler: No file selected.");
        return;
    }

    const file = files[0];
    console.log(`FileHandler: File selected - ${file.name}, Type: ${file.type}, Size: ${file.size}`);

    const sessionId = getActiveSessionIdFunc();
    if (!sessionId) {
        showError("Please start or select a chat before attaching a file.");
        event.target.value = ''; // Clear the input
        return;
    }

    // Create a system message indicating file attachment
    const fileMessage = {
        // messageId: db.generateMessageId(sessionId), // Generate ID if needed immediately
        sender: 'system',
        text: `📎 Attached file: ${file.name}`, // Placeholder text
        timestamp: Date.now(),
        isLoading: false,
        // metadata: { // Optional: Add file metadata if needed later
        //     fileName: file.name,
        //     fileType: file.type,
        //     fileSize: file.size
        // }
    };

    try {
        await db.addMessageToChat(sessionId, fileMessage);
        // Re-render the chat if it's the active one
        if (sessionId === getActiveSessionIdFunc()) {
            await renderer.renderChatSession(sessionId); // Full render to show new message
        }
    } catch (error) {
         console.error("FileHandler: Error adding file attachment message:", error);
         showError("Failed to add file attachment message.");
    } finally {
        // Clear the file input value so the same file can be selected again
        event.target.value = '';
    }

    // TODO: Implement actual file processing/upload logic here
    // e.g., read file content, send to background script, etc.
}

//  Triggers the hidden file input when the attach button is clicked.
export function handleAttachClick() {
    if (!ui) {
        console.error("FileHandler: UI Controller not available to trigger file input.");
        return;
    }
    console.log("FileHandler: Triggering file input click.");
    ui.triggerFileInputClick(); // Use uiController to click the input
} 