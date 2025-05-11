import { WorkerEventNames, ModelLoaderMessageTypes } from './events/eventNames.js';
import browser from 'webextension-polyfill';
import { Contexts } from './events/eventNames.js';
window.EXTENSION_CONTEXT = Contexts.OTHERS;

let modelWorker = null;
let workerInitialized = false;

const allowedTypes = new Set(Object.values(ModelLoaderMessageTypes));

function initializeModelWorker() {
  if (!modelWorker && !workerInitialized) { 
    console.log("Modal Loader Creating Model Worker...");
    try {
      const wasmPath = browser.runtime.getURL('xenova/transformers/dist/');
      modelWorker = new globalThis.Worker(browser.runtime.getURL('model-worker.js'), { type: 'module' });
      console.log("Modal Loader Model Worker instance created.");

      modelWorker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type !== WorkerEventNames.GENERATION_UPDATE && type !== WorkerEventNames.LOADING_STATUS) { 
          console.log("Modal Loader Received message from Model Worker:", type);
        }

        const typesToForward = [
          WorkerEventNames.WORKER_SCRIPT_READY, 
          WorkerEventNames.WORKER_READY, WorkerEventNames.ERROR, WorkerEventNames.LOADING_STATUS,
          WorkerEventNames.GENERATION_STATUS, WorkerEventNames.GENERATION_UPDATE, WorkerEventNames.GENERATION_COMPLETE, WorkerEventNames.GENERATION_ERROR,
          WorkerEventNames.RESET_COMPLETE
        ];

        if (typesToForward.includes(type)) {
           if (type !== WorkerEventNames.GENERATION_UPDATE && type !== WorkerEventNames.LOADING_STATUS) { 
             console.log(`Modal Loader Forwarding \`${type}\` message to background.`);
           }
          browser.runtime.sendMessage({ type, payload }).catch(error => {
            console.error("Modal Loader Error sending message to background:", error);
          });
        } else {
          console.log(`Modal Loader Not forwarding message type \`${type}\` from worker. (Consider adding to eventNames.js)`);
        }

        if (type === WorkerEventNames.WORKER_SCRIPT_READY) {
          workerInitialized = true;
          console.log("Modal Loader Worker script initialized.");
        }
      };

      modelWorker.onerror = (errorEvent) => {
        console.error("Modal Loader Worker onerror EVENT:", errorEvent);
        const errorMessage = errorEvent.message || 'Unknown worker error';
        const errorDetails = `Error in worker: ${errorMessage} (File: ${errorEvent.filename}, Line: ${errorEvent.lineno})`;
        console.error("Modal Loader  Worker onerror DETAILS:", errorDetails);
        browser.runtime.sendMessage({ type: WorkerEventNames.ERROR, payload: errorDetails })
        .catch(err => console.error("Modal Loader Error sending worker error to background:", err));
        modelWorker = null; 
        workerInitialized = false; 
      };

    } catch (error) {
        console.error("Modal Loader  Failed to create Model Worker instance:", error);
        browser.runtime.sendMessage({ type: WorkerEventNames.ERROR, payload: `Failed to instantiate model worker: ${error.message}` })
         .catch(err => console.error("Modal Loader  sending instantiation error to background:", err));
        modelWorker = null;
    }
  }
  return modelWorker;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!allowedTypes.has(message.type)) {
    console.warn("Modal Loader Cannot handle message, message type is not in allowedTypes.");
    return false;
  }

  const workerInstance = initializeModelWorker();

  if (!workerInstance && message.type !== ModelLoaderMessageTypes.INIT) { 
      console.error("Modal Loader Cannot handle message, worker instance is not available and message is not 'init'.");
      sendResponse([{ success: false, error: "Model worker instance failed to initialize." }]);
      return false; 
  }

  if (allowedTypes.has(message.type)) {
      if (!workerInstance) {
          console.error("Modal Loader Cannot forward " + message.type + ", worker instance is still not available.");
          sendResponse([{ success: false, error: "Model worker instance unavailable for forwarding." }]);
          return false;
      }
      console.log(`Modal Loader Forwarding '${message.type}' message to actual model worker.`);
      try {
          const wasmPath = browser.runtime.getURL('xenova/transformers/dist/');
          const localModelPath = browser.runtime.getURL('models/');
          console.log(`[OffscreenWorker] Calculated WASM Path: ${wasmPath}`);
          console.log(`[OffscreenWorker] Calculated Local Model Path: ${localModelPath}`);

          workerInstance.postMessage({ type: message.type, payload: { ...message.payload, wasmPath, localModelPath } });
          sendResponse([{ success: true, message: `Command '${message.type}' forwarded to model worker.` }]);
      } catch (error) {
          console.error("Modal Loader Error posting message to actual model worker:", error);
          sendResponse([{ success: false, error: `Error posting message to model worker: ${error.message}` }]);
      }
  }
  return true;
});

console.log("Modal Loader Script loaded and ready.");
initializeModelWorker(); 