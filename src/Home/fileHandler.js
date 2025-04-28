import { showError } from '../Utilities/generalUtils.js';

let db = null;
let renderer = null;
let getActiveSessionIdFunc = null;
let ui = null;

export function initializeFileHandling(dependencies) {
    // db = dependencies.dbFunctions; // Remove dependency
    // renderer = dependencies.chatRenderer; // Remove dependency
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    ui = dependencies.uiController;

    // Adjust check
    if (/*!db || !renderer ||*/ !getActiveSessionIdFunc || !ui) {
        console.error("FileHandler: Missing getActiveSessionIdFunc or uiController dependency!");
    } else {
        console.log("[FileHandler] Initialized (Note: DB/Renderer interaction via events assumed).");
    }
}

export async function handleFileSelected(event) {
    // Adjust check
    if (/*!db || !renderer || */!getActiveSessionIdFunc) {
         console.error("FileHandler: Not initialized properly (missing getActiveSessionIdFunc).");
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
        event.target.value = '';
        return;
    }

    const fileMessage = {
        sender: 'system',
        text: `📎 Attached file: ${file.name}`,
        timestamp: Date.now(),
        isLoading: false,
        // TODO: Add file metadata if needed
    };

    try {
        // **** Replace direct DB/Renderer call with event publishing ****
        // await db.addMessageToChat(sessionId, fileMessage);
        // if (sessionId === getActiveSessionIdFunc()) {
        //     await renderer.renderChatSession(sessionId);
        // }
        // Publish an event for the orchestrator instead
        const request = new DbAddMessageRequest(sessionId, fileMessage);
        eventBus.publish(DbAddMessageRequest.name, request);
        console.log("[FileHandler] Published DbAddMessageRequest for file attachment.");

    } catch (error) {
         console.error("FileHandler: Error publishing file attachment message event:", error);
         showError("Failed to process file attachment.");
    } finally {
        event.target.value = ''; 
    }
}

export function handleAttachClick() {
    if (!ui) {
        console.error("FileHandler: UI Controller not available to trigger file input.");
        return;
    }
    console.log("FileHandler: Triggering file input click.");
    ui.triggerFileInputClick();
}