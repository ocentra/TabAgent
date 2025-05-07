let modelWorker = null;
let workerInitialized = false;
function initializeModelWorker() {
  if (!modelWorker && !workerInitialized) {
    console.log("[OffscreenWorker-Simple] Creating Model Worker...");
    try {
      const wasmPath = chrome.runtime.getURL("xenova/transformers/dist/");
      modelWorker = new globalThis.Worker(chrome.runtime.getURL("model-worker.js"), { type: "module" });
      console.log("[OffscreenWorker-Simple] Model Worker instance created.");
      modelWorker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type !== "generationUpdate" && type !== "loadingStatus") {
          console.log("[OffscreenWorker-Simple] Received message from Model Worker:", type);
        }
        const typesToForward = [
          "workerScriptReady",
          // Added script ready signal
          "workerReady",
          "error",
          "loadingStatus",
          "generationStatus",
          "generationUpdate",
          "generationComplete",
          "generationError",
          "resetComplete"
        ];
        if (typesToForward.includes(type)) {
          if (type !== "generationUpdate" && type !== "loadingStatus") {
            console.log(`[OffscreenWorker-Simple] Forwarding \`${type}\` message to background.`);
          }
          chrome.runtime.sendMessage({ type, payload }).catch((error) => {
            console.error("[OffscreenWorker-Simple] Error sending message to background:", error);
          });
        } else {
          console.log(`[OffscreenWorker-Simple] Not forwarding message type \`${type}\` from worker.`);
        }
        if (type === "workerScriptReady") {
          workerInitialized = true;
          console.log("[OffscreenWorker-Simple] Worker script initialized.");
        }
      };
      modelWorker.onerror = (errorEvent) => {
        console.error("[OffscreenWorker-Simple] Model Worker onerror EVENT:", errorEvent);
        const errorMessage = errorEvent.message || "Unknown worker error";
        const errorDetails = `Error in worker: ${errorMessage} (File: ${errorEvent.filename}, Line: ${errorEvent.lineno})`;
        console.error("[OffscreenWorker-Simple] Model Worker onerror DETAILS:", errorDetails);
        chrome.runtime.sendMessage({ type: "error", payload: errorDetails }).catch((err) => console.error("[OffscreenWorker-Simple] Error sending worker error to background:", err));
        modelWorker = null;
        workerInitialized = false;
      };
    } catch (error) {
      console.error("[OffscreenWorker-Simple] FATAL: Failed to create Model Worker instance:", error);
      chrome.runtime.sendMessage({ type: "error", payload: `Failed to instantiate model worker: ${error.message}` }).catch((err) => console.error("[OffscreenWorker-Simple] Error sending instantiation error to background:", err));
      modelWorker = null;
    }
  }
  return modelWorker;
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[OffscreenWorker] Received message from background:", message.type);
  const workerInstance = initializeModelWorker();
  if (!workerInstance && message.type !== "init") {
    console.error("[OffscreenWorker-Simple] Cannot handle message, worker instance is not available and message is not 'init'.");
    sendResponse({ success: false, error: "Model worker instance failed to initialize." });
    return false;
  }
  const modelWorkerForwardableTypes = ["init", "generate", "interrupt", "reset"];
  const knownIgnoredTypes = [
    "uiLoadingStatusUpdate",
    "scrapeRequest",
    "STAGE_SCRAPE_RESULT",
    "driveFileListData",
    "getDriveFileList",
    "db:log",
    "createIframe",
    "removeIframe"
  ];
  if (modelWorkerForwardableTypes.includes(message.type)) {
    if (!workerInstance) {
      console.error("[OffscreenWorker-Simple] Cannot forward " + message.type + ", worker instance is still not available.");
      sendResponse({ success: false, error: "Model worker instance unavailable for forwarding." });
      return false;
    }
    console.log(`[OffscreenWorker-Simple] Forwarding '${message.type}' message to actual model worker.`);
    try {
      const wasmPath = chrome.runtime.getURL("xenova/transformers/dist/");
      const localModelPath = chrome.runtime.getURL("models/");
      console.log(`[OffscreenWorker] Calculated WASM Path: ${wasmPath}`);
      console.log(`[OffscreenWorker] Calculated Local Model Path: ${localModelPath}`);
      workerInstance.postMessage({ type: message.type, payload: { ...message.payload, wasmPath, localModelPath } });
      sendResponse({ success: true, message: `Command '${message.type}' forwarded to model worker.` });
    } catch (error) {
      console.error("[OffscreenWorker-Simple] Error posting message to actual model worker:", error);
      sendResponse({ success: false, error: `Error posting message to model worker: ${error.message}` });
    }
  } else if (knownIgnoredTypes.includes(message.type)) {
    console.log(`[OffscreenWorker-Simple] Ignoring known message type not handled here: ${message.type}`);
  } else {
    console.warn("[OffscreenWorker-Simple] Received unhandled/unexpected message type:", message.type);
    sendResponse({ success: false, error: `Model worker offscreen document does not handle unexpected message type '${message.type}'.` });
  }
  return true;
});
console.log("[OffscreenWorker-Simple] Script loaded and ready.");
initializeModelWorker();
//# sourceMappingURL=modelLoaderWorkerOffscreen.js.map
