import { showError } from '../Utilities/generalUtils';
import { DbAddMessageRequest } from '../DB/dbEvents';
declare const eventBus: any;
let getActiveSessionIdFunc: (() => string | null) | null = null;
let ui: { triggerFileInputClick: () => void } | null = null;

export function initializeFileHandling(dependencies: { getActiveSessionIdFunc: () => string | null; uiController: { triggerFileInputClick: () => void } }) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    ui = dependencies.uiController;

    if (!getActiveSessionIdFunc || !ui) {
        console.error("FileHandler: Missing getActiveSessionIdFunc or uiController dependency!");
    } else {
        console.log("[FileHandler] Initialized (Note: DB/Renderer interaction via events assumed).");
    }
}

export async function handleFileSelected(event: Event) {
    if (!getActiveSessionIdFunc) {
         console.error("FileHandler: Not initialized properly (missing getActiveSessionIdFunc).");
         return;
    }

    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
        console.log("FileHandler: No file selected.");
        return;
    }

    const file = files[0];
    console.log(`FileHandler: File selected - ${file.name}, Type: ${file.type}, Size: ${file.size}`);

    const sessionId = getActiveSessionIdFunc();
    if (!sessionId) {
        showError("Please start or select a chat before attaching a file.");
        input.value = '';
        return;
    }

    const fileMessage = {
        sender: 'system',
        text: `📎 Attached file: ${file.name}`,
        timestamp: Date.now(),
        isLoading: false,
    };

    try {
        const request = new DbAddMessageRequest(sessionId, fileMessage);
        eventBus.publish(DbAddMessageRequest.type, request);
        console.log("[FileHandler] Published DbAddMessageRequest for file attachment.");

    } catch (error) {
         console.error("FileHandler: Error publishing file attachment message event:", error);
         showError("Failed to process file attachment.");
    } finally {
        input.value = '';
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