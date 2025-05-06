let modelWorker = null;
let workerInitialized = false;

function initializeModelWorker() {
  if (!modelWorker && !workerInitialized) { // Prevent re-entry if already initializing
    console.log("[OffscreenWorker-Simple] Creating Model Worker...");
    try {
      const wasmPath = chrome.runtime.getURL('xenova/transformers/dist/');
      modelWorker = new globalThis.Worker(chrome.runtime.getURL('model-worker.js'), { type: 'module' });
      console.log("[OffscreenWorker-Simple] Model Worker instance created.");

      modelWorker.onmessage = (event) => {
        const { type, payload } = event.data;
        // Shorten log for frequent updates
        if (type !== 'generationUpdate' && type !== 'loadingStatus') { // Also quiet loadingStatus
          console.log("[OffscreenWorker-Simple] Received message from Model Worker:", type);
        }

        // Define message types to forward back to background
        const typesToForward = [
          'workerScriptReady', // Added script ready signal
          'workerReady', 'error', 'loadingStatus',
          'generationStatus', 'generationUpdate', 'generationComplete', 'generationError',
          'resetComplete'
        ];

        if (typesToForward.includes(type)) {
          // Shorten log for frequent updates
           if (type !== 'generationUpdate' && type !== 'loadingStatus') { // Also quiet loadingStatus
             console.log(`[OffscreenWorker-Simple] Forwarding \`${type}\` message to background.`);
           }
          chrome.runtime.sendMessage({ type, payload }).catch(error => {
            console.error("[OffscreenWorker-Simple] Error sending message to background:", error);
          });
        } else {
          console.log(`[OffscreenWorker-Simple] Not forwarding message type \`${type}\` from worker.`);
        }

        // Mark worker as initialized *after* receiving the SCRIPT ready signal
        if (type === 'workerScriptReady') {
          workerInitialized = true;
          console.log("[OffscreenWorker-Simple] Worker script initialized.");
        }
      };

      modelWorker.onerror = (errorEvent) => {
        console.error("[OffscreenWorker-Simple] Model Worker onerror EVENT:", errorEvent);
        const errorMessage = errorEvent.message || 'Unknown worker error';
        const errorDetails = `Error in worker: ${errorMessage} (File: ${errorEvent.filename}, Line: ${errorEvent.lineno})`;
        console.error("[OffscreenWorker-Simple] Model Worker onerror DETAILS:", errorDetails);
        chrome.runtime.sendMessage({ type: 'error', payload: errorDetails })
        .catch(err => console.error("[OffscreenWorker-Simple] Error sending worker error to background:", err));
        modelWorker = null; // Reset on error
        workerInitialized = false; // Reset init flag
      };

    } catch (error) {
        console.error("[OffscreenWorker-Simple] FATAL: Failed to create Model Worker instance:", error);
        chrome.runtime.sendMessage({ type: 'error', payload: `Failed to instantiate model worker: ${error.message}` })
         .catch(err => console.error("[OffscreenWorker-Simple] Error sending instantiation error to background:", err));
        modelWorker = null;
    }
  }
  return modelWorker;
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[OffscreenWorker-Simple] Received message from background:", message?.type);
  const { type, payload } = message;

  // Ensure worker exists or is created (handles initial creation)
  const workerInstance = initializeModelWorker();

  if (!workerInstance) {
      console.error("[OffscreenWorker-Simple] Cannot handle message, worker instance is not available.");
      // Respond immediately if worker failed to init
      sendResponse({ success: false, error: "Model worker instance failed to initialize." });
      return false; // Indicate sync response
  }

  // Define message types the background can send to the worker
  const forwardableTypes = ['init', 'generate', 'interrupt', 'reset']; // Added 'init'

  if (forwardableTypes.includes(type)) {
      console.log(`[OffscreenWorker-Simple] Forwarding \`${type}\` message to actual worker.`);
      try {
          // Calculate paths here, where chrome API is available
          const wasmPath = chrome.runtime.getURL('xenova/transformers/dist/');
          const localModelPath = chrome.runtime.getURL('models/'); // Base path for models
          console.log(`[OffscreenWorker] Calculated WASM Path: ${wasmPath}`);
          console.log(`[OffscreenWorker] Calculated Local Model Path: ${localModelPath}`);

          // Add calculated paths to the payload
          workerInstance.postMessage({ type, payload: { ...payload, wasmPath, localModelPath } });
          // Acknowledge forwarding - background will wait for worker responses
          sendResponse({ success: true, message: `Command '${type}' forwarded to worker.` });
      } catch (error) {
          console.error("[OffscreenWorker-Simple] Error posting message to actual worker:", error);
          sendResponse({ success: false, error: `Error posting message to worker: ${error.message}` });
      }
  } else {
      // Ignore the harmless uiLoadingStatusUpdate messages broadcast by background
      if (type !== 'uiLoadingStatusUpdate') {
          console.warn("[OffscreenWorker-Simple] Received unforwardable message type from background:", type);
      }
      sendResponse({ success: false, error: `Offscreen document does not handle message type '${type}'.` });
  }

  // Important: Return false for most messages to indicate we might respond asynchronously
  // via messages sent from the worker back through chrome.runtime.sendMessage.
  // Only return true if you intend to use the sendResponse callback directly for the final response.
  return false;
});

console.log("[OffscreenWorker-Simple] Script loaded and ready.");
initializeModelWorker(); // Attempt to initialize worker eagerly 