import { showError } from '../Utilities/generalUtils';
import { DbAddMessageRequest } from '../DB/dbEvents';
import { triggerFileInputClick } from './uiController';

// Logging constants
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[FileHandler]';

declare const eventBus: any;
let getActiveSessionIdFunc: (() => string | null) | null = null;

export function initializeFileHandling(dependencies: { getActiveSessionIdFunc: () => string | null; }) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;

    if (!getActiveSessionIdFunc) {
        console.error("FileHandler: Missing getActiveSessionIdFunc dependency!");
    } else {
        if (LOG_DEBUG) console.log(`${prefix} Initialized (Note: DB/Renderer interaction via events assumed).`);
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
        if (LOG_DEBUG) console.log(`${prefix} Published DbAddMessageRequest for file attachment.`);

    } catch (error) {
         console.error("FileHandler: Error publishing file attachment message event:", error);
         showError("Failed to process file attachment.");
    } finally {
        input.value = '';
    }
}

export function handleAttachClick() {
    console.log("FileHandler: Triggering file input click.");
    triggerFileInputClick();
}