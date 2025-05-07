import { e as eventBus, J as DbInitializationCompleteNotification, E as DbAddLogRequest, b as browser, C as DbInitializeRequest } from "./assets/dbEvents-BEUbKsMb.js";
const hasChromeRuntime = typeof chrome !== "undefined" && chrome.runtime;
let componentName = "unknown";
let mirrorToConsoleDefault = true;
let sendToDbDefault = true;
let isDbReadyForLogs = false;
const logBuffer = [];
async function flushLogBuffer() {
  if (!eventBus) return;
  while (logBuffer.length > 0) {
    const logEvent = logBuffer.shift();
    if (logEvent) {
      try {
        await eventBus.publish(logEvent.type, logEvent);
      } catch (error) {
        console.error(`LogClient (${componentName}): Error publishing buffered log. Error: ${error}. Event:`, logEvent);
      }
    }
  }
}
function init(compName, options = {}) {
  componentName = compName;
  mirrorToConsoleDefault = options.mirrorToConsole !== void 0 ? options.mirrorToConsole : true;
  sendToDbDefault = options.sendToDb !== void 0 ? options.sendToDb : true;
  if (eventBus) {
    eventBus.subscribe(DbInitializationCompleteNotification.name, (notification) => {
      if (notification.payload.success) {
        console.log(`[LogClient (${componentName})] Received DB Initialization Complete. Flushing buffer.`);
        isDbReadyForLogs = true;
        flushLogBuffer();
      } else {
        console.error(`[LogClient (${componentName})] Received DB Initialization FAILED notification. Logs will not be sent to DB. Error:`, notification.payload.error);
      }
    });
  } else {
    console.error(`LogClient (${componentName}): CRITICAL - eventBus not available during init. DB logging disabled.`);
    sendToDbDefault = false;
  }
  let logMode = "unknown";
  if (typeof eventBus !== "undefined") {
    logMode = "sendMessage logging (Standard)";
  } else {
    logMode = "console fallback";
    console.error(`LogClient (${componentName}): CRITICAL - No logging mechanism available. Falling back to console.`);
  }
  const initialLogMessage = `Log client initialized for component: ${componentName}. (${logMode}, Console Mirror: ${mirrorToConsoleDefault}, SendToDB: ${sendToDbDefault})`;
  _internalLogHelper("info", initialLogMessage, { mirrorToConsole: mirrorToConsoleDefault, sendToDb: sendToDbDefault, skipInitCheck: true });
}
async function _internalLogHelper(level, ...args) {
  var _a;
  const rawOptions = args.length > 0 && typeof args[args.length - 1] === "object" && !Array.isArray(args[args.length - 1]) ? args.pop() : {};
  const options = rawOptions || {};
  const mirrorThisCall = options.mirrorToConsole !== void 0 ? options.mirrorToConsole : mirrorToConsoleDefault;
  let sendThisCall = options.sendToDb !== void 0 ? options.sendToDb : sendToDbDefault;
  const skipInitCheck = options.skipInitCheck || false;
  if (sendThisCall && typeof eventBus === "undefined") {
    console.warn(`LogClient (${componentName}): Attempted DB log but eventBus is unavailable. Disabling DB log for this call.`);
    sendThisCall = false;
  }
  if (!componentName && !skipInitCheck) {
    console.error("LogClient: Attempted to log before init() was called. Message:", level, ...args);
    return;
  }
  if (mirrorThisCall || level.toLowerCase() === "error") {
    const consolePrefix = componentName ? `[${componentName}]` : `[LogClient]`;
    const consoleArgs = [consolePrefix, ...args];
    switch (level.toLowerCase()) {
      case "error":
        console.error(...consoleArgs);
        break;
      case "warn":
        if (mirrorThisCall) console.warn(...consoleArgs);
        break;
      case "debug":
        if (mirrorThisCall) console.debug(...consoleArgs);
        break;
      case "info":
      default:
        if (mirrorThisCall) console.log(...consoleArgs);
        break;
    }
  }
  if (!sendThisCall) return;
  const formattedMessage = args.map((arg) => {
    try {
      if (arg instanceof Error) {
        return `Error: ${arg.message}${arg.stack ? "\n" + arg.stack : ""}`;
      }
      if (typeof arg === "object" && arg !== null) {
        return "[Object]";
      }
      return String(arg);
    } catch (e) {
      return `[Unstringifiable Object: ${e.message}]`;
    }
  }).join(" ");
  const logPayload = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    component: componentName,
    level: level.toLowerCase(),
    message: formattedMessage
  };
  if (hasChromeRuntime && ((_a = chrome.storage) == null ? void 0 : _a.local)) {
    try {
      const { currentLogSessionId: currentLogSessionId2 } = await chrome.storage.local.get("currentLogSessionId");
      if (currentLogSessionId2) {
        logPayload.extensionSessionId = currentLogSessionId2;
      } else {
        console.warn(`LogClient (${componentName}): Could not retrieve currentLogSessionId from storage.`);
        logPayload.extensionSessionId = "unknown-session";
      }
    } catch (storageError) {
      console.error(`LogClient (${componentName}): Error retrieving session ID from storage:`, storageError);
      logPayload.extensionSessionId = "storage-error-session";
    }
  } else {
    logPayload.extensionSessionId = "no-storage-session";
  }
  const logEvent = new DbAddLogRequest(logPayload);
  if (isDbReadyForLogs) {
    try {
      await eventBus.publish(logEvent.type, logEvent);
    } catch (error) {
      console.error(`LogClient (${componentName}): Error during eventBus log submission. Error: ${error}. Original message:`, level, ...args);
    }
  } else {
    logBuffer.push(logEvent);
  }
}
function logDebug(...args) {
  _internalLogHelper("debug", ...args);
}
function logInfo(...args) {
  _internalLogHelper("info", ...args);
}
function logWarn(...args) {
  _internalLogHelper("warn", ...args);
}
function logError(...args) {
  _internalLogHelper("error", ...args);
}
const MODEL_WORKER_OFFSCREEN_PATH = "modelLoaderWorkerOffscreen.html";
init("Background");
let detachedPopups = {};
let popupIdToTabId = {};
const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;
let modelWorkerState = "uninitialized";
let workerScriptReadyPromise = null;
let workerScriptReadyResolver = null;
let workerScriptReadyRejecter = null;
let modelLoadPromise = null;
let modelLoadResolver = null;
let modelLoadRejecter = null;
let currentLogSessionId = null;
let previousLogSessionId = null;
let lastLoggedProgress = -10;
async function initializeSessionIds() {
  logInfo("Initializing log session IDs...");
  currentLogSessionId = Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  logInfo("Current log session ID:", currentLogSessionId);
  await browser.storage.local.set({ currentLogSessionId });
  const { previousLogSessionId: storedPreviousId } = await browser.storage.local.get("previousLogSessionId");
  previousLogSessionId = storedPreviousId || null;
  logInfo("Previous log session ID found in storage:", previousLogSessionId);
  await browser.storage.local.set({ previousLogSessionId: currentLogSessionId });
  logInfo("Stored new previousLogSessionId for next run.");
}
async function hasModelWorkerOffscreenDocument() {
  const targetUrl = browser.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH);
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [targetUrl]
  });
  return existingContexts.length > 0;
}
async function setupModelWorkerOffscreenDocument() {
  if (await hasModelWorkerOffscreenDocument()) {
    logInfo("Model worker offscreen document already exists.");
    return;
  }
  logInfo("Creating model worker offscreen document...");
  await browser.offscreen.createDocument({
    url: MODEL_WORKER_OFFSCREEN_PATH,
    reasons: [browser.offscreen.Reason.WORKERS],
    justification: "Run model inference in a separate worker via offscreen document"
  });
  logInfo("Model worker offscreen document created.");
}
async function sendToModelWorkerOffscreen(message) {
  if (message.type !== "init" && message.type !== "generate" && message.type !== "interrupt" && message.type !== "reset") {
    if (modelWorkerState === "uninitialized" || !await hasModelWorkerOffscreenDocument()) {
      logInfo(`Background: Ensuring model worker offscreen doc potentially exists before sending ${message == null ? void 0 : message.type}`);
      await setupModelWorkerOffscreenDocument();
    }
  } else {
    logDebug(`Background: Ensuring worker script is ready before sending ${message.type}...`);
    try {
      await ensureWorkerScriptIsReady();
      logDebug(`Background: Worker script confirmed ready. Proceeding to send ${message.type}.`);
    } catch (error) {
      logError(`Background: Worker script failed to become ready. Cannot send ${message.type}. Error:`, error);
      modelWorkerState = "error";
      throw new Error(`Worker script failed to initialize, cannot send ${message.type}.`);
    }
  }
  logDebug(`Background: Sending message type '${message == null ? void 0 : message.type}' to model worker offscreen doc`);
  try {
    const contexts = await browser.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [browser.runtime.getURL(MODEL_WORKER_OFFSCREEN_PATH)]
    });
    if (contexts.length > 0) {
      browser.runtime.sendMessage(message);
      logDebug(`Background: Message type '${message == null ? void 0 : message.type}' sent to offscreen.`);
      return { success: true };
    } else {
      logError(`Background: Could not find target offscreen document context to send ${message == null ? void 0 : message.type}.`);
      throw new Error(`Target offscreen document not found.`);
    }
  } catch (error) {
    logError(`Background: Error sending message type '${message == null ? void 0 : message.type}' to offscreen:`, error);
    modelWorkerState = "error";
    if (message.type === "init") {
      if (modelLoadRejecter) modelLoadRejecter(new Error(`Failed to send init message: ${error.message}`));
      modelLoadPromise = null;
    } else if (workerScriptReadyRejecter && (modelWorkerState === "uninitialized" || modelWorkerState === "creating_worker")) {
      workerScriptReadyRejecter(new Error(`Failed to send message early: ${error.message}`));
      workerScriptReadyPromise = null;
    }
    throw new Error(`Failed to send message to model worker offscreen: ${error.message}`);
  }
}
function ensureWorkerScriptIsReady() {
  logDebug(`[ensureWorkerScriptIsReady] Current state: ${modelWorkerState}`);
  if (modelWorkerState !== "uninitialized" && modelWorkerState !== "creating_worker") {
    if (modelWorkerState === "error" && !workerScriptReadyPromise) {
      return Promise.reject(new Error("Worker script initialization previously failed."));
    }
    return Promise.resolve();
  }
  if (workerScriptReadyPromise) {
    return workerScriptReadyPromise;
  }
  logDebug("[ensureWorkerScriptIsReady] Worker script not ready. Initializing and creating promise.");
  modelWorkerState = "creating_worker";
  workerScriptReadyPromise = new Promise((resolve, reject) => {
    workerScriptReadyResolver = resolve;
    workerScriptReadyRejecter = reject;
    setupModelWorkerOffscreenDocument().catch((err) => {
      logError("[ensureWorkerScriptIsReady] Error setting up offscreen doc:", err);
      modelWorkerState = "error";
      if (workerScriptReadyRejecter) workerScriptReadyRejecter(err);
      workerScriptReadyPromise = null;
    });
  });
  const scriptLoadTimeout = 3e4;
  setTimeout(() => {
    if (modelWorkerState === "creating_worker" && workerScriptReadyRejecter) {
      logError(`[ensureWorkerScriptIsReady] Timeout (${scriptLoadTimeout}ms) waiting for workerScriptReady.`);
      workerScriptReadyRejecter(new Error("Timeout waiting for model worker script to load."));
      modelWorkerState = "error";
      workerScriptReadyPromise = null;
    }
  }, scriptLoadTimeout);
  return workerScriptReadyPromise;
}
async function loadModel(modelId) {
  logInfo(`Request to load model: ${modelId}. Current state: ${modelWorkerState}`);
  try {
    await ensureWorkerScriptIsReady();
    logDebug(`Worker script confirmed ready (state: ${modelWorkerState}). Proceeding with model load.`);
  } catch (err) {
    logError("Failed to ensure worker script readiness:", err);
    throw new Error(`Failed to ensure worker script readiness: ${err.message}`);
  }
  if (modelWorkerState !== "worker_script_ready" && modelWorkerState !== "idle" && modelWorkerState !== "error") {
    const errorMsg = `Cannot load model '${modelId}'. Worker state is '${modelWorkerState}', expected 'worker_script_ready', 'idle', or 'error'.`;
    logError("State check failed loading model:", errorMsg);
    throw new Error(errorMsg);
  }
  if (!modelId) {
    return Promise.reject(new Error("Cannot load model: Model ID not provided."));
  }
  if (modelWorkerState === "model_ready") {
    logInfo(`Model appears ready. Assuming it's ${modelId}.`);
    return Promise.resolve();
  }
  if (modelWorkerState === "loading_model" && modelLoadPromise) {
    logInfo(`Model is already loading. Assuming it's ${modelId}.`);
    return modelLoadPromise;
  }
  if (modelWorkerState !== "worker_script_ready") {
    logError("Cannot load model. Worker script is not ready. State:", modelWorkerState);
    return Promise.reject(new Error(`Cannot load model, worker script not ready (state: ${modelWorkerState})`));
  }
  logInfo(`Worker script ready. Initiating load for model: ${modelId}.`);
  modelWorkerState = "loading_model";
  modelLoadPromise = new Promise((resolve, reject) => {
    modelLoadResolver = resolve;
    modelLoadRejecter = reject;
    logDebug(`Attempting to send 'init' message for model: ${modelId}`);
    sendToModelWorkerOffscreen({ type: "init", payload: { modelId } }).catch((err) => {
      logError(`Failed to send 'init' message for ${modelId}:`, err);
      modelWorkerState = "error";
      if (modelLoadRejecter) modelLoadRejecter(err);
      modelLoadPromise = null;
    });
  });
  const modelLoadTimeout = 3e5;
  setTimeout(() => {
    if (modelWorkerState === "loading_model" && modelLoadRejecter) {
      logError(`Timeout (${modelLoadTimeout}ms) waiting for model ${modelId} load completion.`);
      modelLoadRejecter(new Error(`Timeout waiting for model ${modelId} to load.`));
      modelWorkerState = "error";
      modelLoadPromise = null;
    }
  }, modelLoadTimeout);
  return modelLoadPromise;
}
async function updateDeclarativeNetRequestRules() {
  const currentRules = await browser.declarativeNetRequest.getDynamicRules();
  const currentRuleIds = currentRules.map((rule) => rule.id);
  const rulesToAdd = [
    {
      id: DNR_RULE_ID_1,
      priority: DNR_RULE_PRIORITY_1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "X-Frame-Options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
          { header: "Content-Security-Policy", operation: "remove" }
        ]
      },
      condition: {
        resourceTypes: ["main_frame"],
        urlFilter: "|http*://*/*|"
      }
    }
  ];
  const rulesToRemove = currentRuleIds.filter((id) => id === DNR_RULE_ID_1);
  try {
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rulesToRemove,
      addRules: rulesToAdd
    });
    logInfo("Declarative Net Request rules updated successfully.");
  } catch (error) {
    logError("Error updating Declarative Net Request rules:", error);
  }
}
updateDeclarativeNetRequestRules();
async function scrapeUrlWithTempTabExecuteScript(url) {
  logInfo(`[Stage 1 (ExecuteScript)] Attempting Temp Tab + executeScript: ${url}`);
  let tempTabId = null;
  const TEMP_TAB_LOAD_TIMEOUT = 3e4;
  return new Promise(async (resolve, reject) => {
    const cleanupAndReject = (errorMsg, errorObj = null) => {
      const finalError = errorObj ? errorObj : new Error(errorMsg);
      logWarn(`[Stage 1 (ExecuteScript)] Cleanup & Reject: ${errorMsg}`, errorObj);
      if (tempTabId) {
        browser.tabs.remove(tempTabId).catch((err) => logWarn(`[Stage 1 (ExecuteScript)] Error removing tab ${tempTabId}: ${err.message}`));
        tempTabId = null;
      }
      reject(finalError);
    };
    try {
      const tab = await browser.tabs.create({ url, active: false });
      tempTabId = tab.id;
      if (!tempTabId) {
        cleanupAndReject("[Stage 1 (ExecuteScript)] Failed to get temporary tab ID.");
        return;
      }
      logInfo(`[Stage 1 (ExecuteScript)] Created temp tab ${tempTabId}.`);
      let loadTimeoutId = null;
      const loadPromise = new Promise((resolveLoad, rejectLoad) => {
        const listener = (tabIdUpdated, changeInfo, updatedTab) => {
          if (tabIdUpdated === tempTabId && changeInfo.status === "complete") {
            logInfo(`[Stage 1 (ExecuteScript)] Tab ${tempTabId} loaded.`);
            if (loadTimeoutId) clearTimeout(loadTimeoutId);
            browser.tabs.onUpdated.removeListener(listener);
            resolveLoad();
          }
        };
        browser.tabs.onUpdated.addListener(listener);
        loadTimeoutId = setTimeout(() => {
          browser.tabs.onUpdated.removeListener(listener);
          rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1e3}s) waiting for page load in tab ${tempTabId}.`));
        }, TEMP_TAB_LOAD_TIMEOUT);
      });
      await loadPromise;
      logInfo(`[Stage 1 (ExecuteScript)] Page loaded. Injecting pageExtractor.js module into tab ${tempTabId}...`);
      await browser.scripting.executeScript({
        target: { tabId: tempTabId },
        files: ["pageExtractor.js"]
      });
      logInfo(`[Stage 1 (ExecuteScript)] pageExtractor.js module INJECTED successfully into tab ${tempTabId}.`);
      logInfo(`[Stage 1 (ExecuteScript)] Executing function to call window.TabAgentPageExtractor.extract in tab ${tempTabId}...`);
      const injectionResults = await browser.scripting.executeScript({
        target: { tabId: tempTabId },
        func: () => {
          if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === "function") {
            try {
              return window.TabAgentPageExtractor.extract(document);
            } catch (e) {
              console.error("[In-Tab] Error during execution of PageExtractor.extract:", e);
              return { error: `Error in PageExtractor.extract: ${e.message} (Stack: ${e.stack})` };
            }
          } else {
            console.error("[In-Tab] TabAgentPageExtractor or its extract function not found on window.");
            return { error: "TabAgentPageExtractor.extract function not found on window." };
          }
        }
      });
      logInfo("[Stage 1 (ExecuteScript)] Raw results from executeScript func:", injectionResults);
      if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
        cleanupAndReject("[Stage 1 (ExecuteScript)] No result returned from executeScript func.", injectionResults && injectionResults[0] ? injectionResults[0].error : null);
        return;
      }
      const scriptResult = injectionResults[0].result;
      if (scriptResult && scriptResult.error) {
        cleanupAndReject(`[Stage 1 (ExecuteScript)] Script execution reported an error: ${scriptResult.error}`, scriptResult);
        return;
      }
      if (scriptResult && typeof scriptResult === "object") {
        logInfo("[Stage 1 (ExecuteScript)] pageExtractor.js module execution succeeded (returned object).");
        resolve(scriptResult);
      } else {
        cleanupAndReject("[Stage 1 (ExecuteScript)] pageExtractor.js module returned unexpected non-object/error type.", scriptResult);
      }
    } catch (error) {
      cleanupAndReject(`[Stage 1 (ExecuteScript)] Error: ${error.message}`, error);
    } finally {
      if (tempTabId) {
        browser.tabs.remove(tempTabId).catch((err) => logWarn(`[Stage 1 (ExecuteScript)] Error removing tab ${tempTabId} in final catch: ${err.message}`));
      }
    }
  });
}
async function scrapeUrlMultiStage(url, chatId, messageId) {
  var _a;
  logInfo(`Scraping Orchestrator: Starting for ${url}. ChatID: ${chatId}, MessageID: ${messageId}`);
  const sendStageResult = (stageResult) => {
    logInfo(`[Orchestrator] Sending STAGE_SCRAPE_RESULT for Stage ${stageResult.stage}, ChatID: ${chatId}, Success: ${stageResult.success}`);
    browser.runtime.sendMessage({
      type: "STAGE_SCRAPE_RESULT",
      payload: stageResult
    }).catch((e) => logWarn(`[Orchestrator] Failed to send result for Stage ${stageResult.stage}:`, e));
  };
  try {
    try {
      const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url);
      logInfo(`[Orchestrator Log] Stage 1 (Temp Tab + executeScript) Succeeded for ${url}.`);
      const stage1SuccessPayload = {
        stage: 1,
        success: true,
        chatId,
        messageId,
        method: "tempTabExecuteScript",
        url,
        length: ((_a = executeScriptResult == null ? void 0 : executeScriptResult.text) == null ? void 0 : _a.length) || 0,
        ...executeScriptResult
      };
      sendStageResult(stage1SuccessPayload);
      return;
    } catch (stage1Error) {
      logWarn(`[Orchestrator Log] Stage 1 (Temp Tab + executeScript) Failed for ${url}: ${stage1Error.message}`);
      sendStageResult({ stage: 1, success: false, chatId, messageId, method: "tempTabExecuteScript", error: stage1Error.message });
      return;
    }
    logInfo("[Orchestrator Log] No successful scraping stage completed (should have exited after Stage 1 attempt).");
  } finally {
    logInfo(`[Scraping Orchestrator] Finished processing for ${url}.`);
  }
}
async function getDriveToken() {
  return new Promise((resolve, reject) => {
    browser.identity.getAuthToken({ interactive: true }, (token) => {
      if (browser.runtime.lastError) {
        reject(new Error(browser.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}
async function fetchDriveFileList(token, folderId = "root") {
  var _a;
  const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)";
  const query = `'${folderId}' in parents and trashed=false`;
  const pageSize = 100;
  const orderBy = "folder,modifiedTime desc";
  const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
    pageSize: pageSize.toString(),
    q: query,
    fields,
    orderBy
  })}`;
  logInfo(`Background: Fetching Drive list for folder '${folderId}': ${url}`);
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    const errorData = await response.text();
    logError(`Background: Drive API files.list error (Folder: ${folderId}):`, response.status, errorData);
    if (response.status === 404) {
      throw new Error(`Folder with ID '${folderId}' not found or access denied.`);
    }
    throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
  }
  const data = await response.json();
  logInfo(`Background: Drive API files.list success (Folder: ${folderId}). Found ${((_a = data.files) == null ? void 0 : _a.length) || 0} items.`);
  return data.files || [];
}
async function forwardMessageToSidePanelOrPopup(message, originalSender) {
  logInfo(`Attempting to forward message type '${message == null ? void 0 : message.type}' from worker.`);
  for (const tabId in detachedPopups) {
    const popupId = detachedPopups[tabId];
    logInfo(`Forwarding message to detached popup ID: ${popupId} (original tab: ${tabId})`);
    try {
      await browser.windows.get(popupId);
      browser.runtime.sendMessage(message);
    } catch (error) {
      logWarn(`Error sending to detached popup ID ${popupId}:`, error.message);
      if (error.message.includes("No window with id")) {
        delete detachedPopups[tabId];
        delete popupIdToTabId[popupId];
      }
    }
  }
  const tabs = await browser.tabs.query({ status: "complete" });
  for (const tab of tabs) {
    if (detachedPopups[tab.id]) continue;
    try {
      await browser.tabs.sendMessage(tab.id, message);
    } catch (error) {
      if (!error.message.includes("Could not establish connection") && !error.message.includes("Receiving end does not exist")) {
        logWarn(`Error forwarding message to tab ${tab.id}:`, error.message);
      }
    }
  }
}
browser.runtime.onInstalled.addListener(async (details) => {
  logInfo("onInstalled event fired. Reason:", details.reason);
  await initializeSessionIds();
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => logError("Error setting side panel behavior:", error));
  logInfo("Side panel behavior set.");
  browser.storage.local.get().then((items) => {
    const keysToRemove = Object.keys(items).filter((key) => key.startsWith("detachedState_"));
    if (keysToRemove.length > 0) {
      browser.storage.local.remove(keysToRemove).then(() => {
        logInfo("Cleaned up old storage keys on install/update.");
      }).catch((err) => {
        logError("Error removing old storage keys:", err);
      });
    }
  }).catch((err) => {
    logError("Error getting storage items for cleanup:", err);
  });
  logInfo("Triggering DB Initialization from onInstalled.");
  eventBus.publish(DbInitializeRequest.name, new DbInitializeRequest());
  ensureWorkerScriptIsReady().catch((err) => {
    logError("Initial worker script readiness check failed after install:", err);
  });
});
browser.runtime.onStartup.addListener(async () => {
  logInfo("onStartup event fired.");
  await initializeSessionIds();
  logInfo("Triggering DB Initialization from onStartup (may be redundant).");
  eventBus.publish(DbInitializeRequest.name, new DbInitializeRequest());
  if (modelWorkerState === "uninitialized") {
    ensureWorkerScriptIsReady().catch((err) => {
      logError("Worker script readiness check failed on startup:", err);
    });
  }
});
browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    logError("Action Clicked: Missing tab ID.");
    return;
  }
  const tabId = tab.id;
  logInfo(`Action clicked for tab ${tabId}`);
  const existingPopupId = detachedPopups[tabId];
  if (existingPopupId) {
    logInfo(`Popup ${existingPopupId} exists for tab ${tabId}. Attempting to close popup.`);
    try {
      await browser.windows.remove(existingPopupId);
      logInfo(`Closed popup window ${existingPopupId} via action click.`);
    } catch (error) {
      logWarn(`Failed to close popup ${existingPopupId} via action click, maybe already closed?`, error);
      if (popupIdToTabId[existingPopupId]) {
        logInfo(`Force cleaning maps and storage for tab ${tabId} after failed close.`);
        delete detachedPopups[tabId];
        delete popupIdToTabId[existingPopupId];
        try {
          await browser.storage.local.remove(`detachedState_${tabId}`);
          await browser.sidePanel.setOptions({ tabId, enabled: true });
        } catch (cleanupError) {
          logError("Error during defensive cleanup:", cleanupError);
        }
      }
    }
  } else {
    logInfo(`No popup exists for tab ${tabId}. Default side panel opening behavior should trigger.`);
  }
});
browser.windows.onRemoved.addListener(async (windowId) => {
  logInfo(`Window removed: ${windowId}`);
  const tabId = popupIdToTabId[windowId];
  if (tabId) {
    logInfo(`Popup window ${windowId} for tab ${tabId} was closed.`);
    delete detachedPopups[tabId];
    delete popupIdToTabId[windowId];
    try {
      await browser.storage.local.remove(`detachedState_${tabId}`);
      logInfo(`Removed detached state from storage for tab ${tabId}`);
      await browser.sidePanel.setOptions({ tabId, enabled: true });
      logInfo(`Re-enabled side panel for tab ${tabId} after popup closed.`);
    } catch (error) {
      logError(`Error cleaning up storage or re-enabling side panel for tab ${tabId} on popup close:`, error);
    }
  } else {
    logInfo(`Window ${windowId} closed, but it wasn't a tracked popup.`);
  }
});
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  var _a;
  const { type, payload } = message;
  let isResponseAsync = false;
  logInfo(`Received message type '${type}' from`, sender.tab ? `tab ${sender.tab.id}` : sender.url || sender.id);
  const workerMessageTypes = [
    "workerScriptReady",
    "workerReady",
    "loadingStatus",
    "generationStatus",
    "generationUpdate",
    "generationComplete",
    "generationError",
    "resetComplete",
    "error"
  ];
  if (workerMessageTypes.includes(type)) {
    logInfo(`Handling message from worker: ${type}`);
    let uiUpdatePayload = null;
    switch (type) {
      case "workerScriptReady":
        logInfo("[Background] Worker SCRIPT is ready!");
        modelWorkerState = "worker_script_ready";
        if (workerScriptReadyResolver) {
          workerScriptReadyResolver();
          workerScriptReadyPromise = null;
        }
        uiUpdatePayload = { modelStatus: "script_ready" };
        break;
      case "workerReady":
        logInfo("[Background] Worker MODEL is ready! Model:", payload == null ? void 0 : payload.model);
        modelWorkerState = "model_ready";
        if (modelLoadResolver) {
          modelLoadResolver();
          modelLoadPromise = null;
        }
        uiUpdatePayload = { modelStatus: "model_ready", model: payload == null ? void 0 : payload.model };
        if (workerScriptReadyResolver) {
          workerScriptReadyResolver();
          workerScriptReadyPromise = null;
        }
        break;
      case "loadingStatus":
        if ((payload == null ? void 0 : payload.status) === "progress" && (payload == null ? void 0 : payload.progress)) {
          const currentProgress = Math.floor(payload.progress);
          if (currentProgress >= lastLoggedProgress + 10) {
            logInfo("[Background] Worker loading status (progress):", payload);
            lastLoggedProgress = currentProgress;
          }
        } else {
          logInfo("[Background] Worker loading status (other):", payload);
          lastLoggedProgress = -10;
        }
        if (modelWorkerState !== "loading_model") {
          logWarn(`[Background] Received loadingStatus in unexpected state: ${modelWorkerState}`);
          modelWorkerState = "loading_model";
        }
        browser.runtime.sendMessage({ type: "uiLoadingStatusUpdate", payload }).catch((err) => {
          if (err.message !== "Could not establish connection. Receiving end does not exist.") {
            logWarn("[Background] Error sending loading status to UI:", err.message);
          }
        });
        break;
      case "generationStatus":
        logInfo(`[Background] Generation status: ${payload == null ? void 0 : payload.status}`);
        if ((payload == null ? void 0 : payload.status) === "generating") modelWorkerState = "generating";
        else if ((payload == null ? void 0 : payload.status) === "interrupted") modelWorkerState = "model_ready";
        break;
      case "generationUpdate":
        if (modelWorkerState !== "generating") {
          logWarn(`[Background] Received generationUpdate in unexpected state: ${modelWorkerState}`);
        }
        modelWorkerState = "generating";
        break;
      case "generationComplete":
        logInfo("[Background] Generation complete.");
        modelWorkerState = "model_ready";
        break;
      case "generationError":
        logError("[Background] Generation error from worker:", payload);
        modelWorkerState = "error";
        break;
      case "resetComplete":
        logInfo("[Background] Worker reset complete.");
        modelWorkerState = "model_ready";
        break;
      case "error":
        logError("[Background] Received generic error from worker/offscreen:", payload);
        const previousState = modelWorkerState;
        modelWorkerState = "error";
        if (previousState === "creating_worker" && workerScriptReadyRejecter) {
          workerScriptReadyRejecter(new Error(payload || "Generic error during script init"));
          workerScriptReadyPromise = null;
        } else if (previousState === "loading_model" && modelLoadRejecter) {
          modelLoadRejecter(new Error(payload || "Generic error during model load"));
          modelLoadPromise = null;
        }
        uiUpdatePayload = { modelStatus: "error", error: payload };
        break;
    }
    if (uiUpdatePayload) {
      logInfo(`[Background] Sending uiUpdate to tabs:`, uiUpdatePayload);
      browser.tabs.query({}).then((tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            browser.tabs.sendMessage(tab.id, { type: "uiUpdate", payload: uiUpdatePayload }).catch((err) => {
              if (!err.message.includes("Could not establish connection") && !err.message.includes("Receiving end does not exist")) {
                logWarn(`[Background] Error sending uiUpdate to tab ${tab.id}:`, err.message);
              }
            });
          }
        });
      }).catch((err) => {
        logError("[Background] Error querying tabs to send uiUpdate:", err);
      });
    }
    forwardMessageToSidePanelOrPopup(message);
    return false;
  }
  if (type === "loadModel") {
    logInfo(`Received 'loadModel' request from sender:`, sender);
    const modelId = payload == null ? void 0 : payload.modelId;
    logInfo(`Received 'loadModel' request from UI for model: ${modelId}.`);
    if (!modelId) {
      logError("[Background] 'loadModel' request missing modelId.");
      sendResponse({ success: false, error: "Model ID not provided in request." });
      return false;
    }
    isResponseAsync = true;
    loadModel(modelId).then(() => {
      logInfo(`loadModel(${modelId}) promise resolved successfully.`);
      sendResponse({ success: true, message: `Model loading initiated or already complete for ${modelId}.` });
    }).catch((error) => {
      logError(`loadModel(${modelId}) failed:`, error);
      sendResponse({ success: false, error: error.message });
    });
    return isResponseAsync;
  }
  if (type === "sendChatMessage") {
    isResponseAsync = true;
    const { chatId, messages, options, messageId } = payload;
    const correlationId = messageId || chatId;
    if (modelWorkerState !== "model_ready") {
      logError(`Cannot send chat message. Model state is ${modelWorkerState}, not 'model_ready'.`);
      sendResponse({ success: false, error: `Model not ready (state: ${modelWorkerState}). Please load a model first.` });
      return false;
    }
    logInfo(`Model ready, sending generate request for ${correlationId}`);
    sendToModelWorkerOffscreen({
      type: "generate",
      payload: {
        messages,
        max_new_tokens: options == null ? void 0 : options.max_new_tokens,
        temperature: options == null ? void 0 : options.temperature,
        top_k: options == null ? void 0 : options.top_k,
        correlationId
      }
    }).then((sendResult) => {
      if (!sendResult.success) throw new Error("Failed to send generate message initially.");
      logInfo(`Generate request sent for ${correlationId}. Waiting for worker responses.`);
      sendResponse({ success: true, message: "Generation request forwarded to worker." });
    }).catch((error) => {
      logError(`Error processing sendChatMessage for ${correlationId}:`, error);
      if (modelWorkerState === "generating") modelWorkerState = "model_ready";
      sendResponse({ success: false, error: error.message });
    });
    return isResponseAsync;
  }
  if (type === "interruptGeneration") {
    logInfo("[Background] Received interrupt request from UI.");
    ensureWorkerScriptIsReady().then(() => sendToModelWorkerOffscreen({ type: "interrupt" })).then(() => sendResponse({ success: true })).catch((err) => sendResponse({ success: false, error: err.message }));
    isResponseAsync = true;
    return isResponseAsync;
  }
  if (type === "resetWorker") {
    logInfo("[Background] Received reset request from UI.");
    ensureWorkerScriptIsReady().then(() => sendToModelWorkerOffscreen({ type: "reset" })).then(() => sendResponse({ success: true })).catch((err) => sendResponse({ success: false, error: err.message }));
    isResponseAsync = true;
    return isResponseAsync;
  }
  if (type === "getModelWorkerState") {
    logInfo(`Handling 'getModelWorkerState' request. Current state: ${modelWorkerState}`);
    sendResponse({ success: true, state: modelWorkerState });
    return false;
  }
  if (type === "scrapeRequest") {
    logInfo(`Handling 'scrapeRequest' request. Scraping URL: ${payload == null ? void 0 : payload.url}`);
    isResponseAsync = true;
    scrapeUrlMultiStage(payload == null ? void 0 : payload.url, payload == null ? void 0 : payload.chatId, payload == null ? void 0 : payload.messageId).then(() => {
      logInfo(`scrapeRequest(${payload == null ? void 0 : payload.url}) promise resolved successfully.`);
      sendResponse({ success: true, message: `Scraping orchestrator started for ${payload == null ? void 0 : payload.url}.` });
    }).catch((error) => {
      logError(`scrapeRequest(${payload == null ? void 0 : payload.url}) failed:`, error);
      sendResponse({ success: false, error: error.message });
    });
    return isResponseAsync;
  }
  if (type === "getDriveFileList") {
    const receivedFolderId = message.folderId;
    logInfo(`Handling 'getDriveFileList' for folder: ${receivedFolderId}`);
    isResponseAsync = true;
    (async () => {
      try {
        const token = await getDriveToken();
        const files = await fetchDriveFileList(token, receivedFolderId);
        logInfo(`Successfully fetched ${(files == null ? void 0 : files.length) || 0} files/folders.`);
        logInfo("[Background] Sending driveFileListData...");
        browser.runtime.sendMessage({
          type: "driveFileListData",
          success: true,
          files,
          folderId: receivedFolderId
        }).catch((err) => {
          logWarn("[Background] Failed to send driveFileListData:", err == null ? void 0 : err.message);
          browser.runtime.sendMessage({ type: "driveFileListData", success: false, error: `Failed to send data: ${err == null ? void 0 : err.message}`, folderId: receivedFolderId });
        });
        logInfo("[Background] sendResponse for driveFileListResponse skipped (using separate message).");
      } catch (error) {
        logError("Error handling getDriveFileList:", error);
        browser.runtime.sendMessage({
          type: "driveFileListData",
          success: false,
          error: error.message,
          folderId: receivedFolderId
        }).catch((err) => {
          logWarn("[Background] Failed to send driveFileListData error message:", err == null ? void 0 : err.message);
        });
        logInfo("[Background] sendResponse for driveFileListResponse error skipped (using separate message).");
      }
    })();
    return isResponseAsync;
  }
  if (type.startsWith("db:")) {
    logDebug(`Forwarding DB request of type '${type}' to event bus.`);
    eventBus.publish(type, message);
    return false;
  }
  if (type === "getLogSessions") {
    isResponseAsync = true;
    (async () => {
      try {
        const { logSessions: sessions } = await browser.storage.local.get("logSessions");
        sendResponse({ success: true, sessions: sessions || [] });
      } catch (err) {
        logError("Error fetching log sessions:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return isResponseAsync;
  }
  if (type === "getLogEntries") {
    isResponseAsync = true;
    (async () => {
      const sessionId = payload == null ? void 0 : payload.sessionId;
      if (!sessionId) {
        sendResponse({ success: false, error: "Session ID required" });
        return true;
      }
      try {
        const key = `logs_${sessionId}`;
        const result = await browser.storage.local.get(key);
        sendResponse({ success: true, entries: result[key] || [] });
      } catch (err) {
        logError(`Error fetching log entries for ${sessionId}:`, err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return isResponseAsync;
  }
  if (type === "detachSidePanel") {
    isResponseAsync = true;
    handleDetach((_a = sender.tab) == null ? void 0 : _a.id).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return isResponseAsync;
  }
  if (type === "getDetachedState") {
    isResponseAsync = true;
    (async () => {
      var _a2, _b;
      try {
        const { [`detachedState_${(_a2 = sender.tab) == null ? void 0 : _a2.id}`]: state } = await browser.storage.local.get(`detachedState_${(_b = sender.tab) == null ? void 0 : _b.id}`);
        sendResponse({ success: true, state });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return isResponseAsync;
  }
  logWarn(`Unhandled message type: ${type}`);
  return false;
});
logInfo("[Background-Simple] Script loaded and listening.");
//# sourceMappingURL=background.js.map
