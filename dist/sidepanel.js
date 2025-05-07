var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _hashFn, _keyMap, _unpack, _options, _root, _local, _operators, _iteratees, _yieldedValues, _getNext, _a, _source, _predicate, _projection, _options2, _operators2, _result, _buffer, _compiled, _options3, _condition;
import { b as browser, e as eventBus$1, D as DB_MESSAGES_UPDATED_NOTIFICATION, a as DB_SESSION_UPDATED_NOTIFICATION, c as DbGetSessionRequest, d as DbStatusUpdatedNotification, f as DbCreateSessionRequest, g as DbAddMessageRequest$1, h as DbUpdateStatusRequest, i as DbUpdateMessageRequest, j as DB_CREATE_SESSION_REQUEST, k as DB_CREATE_SESSION_RESPONSE, l as DB_ADD_MESSAGE_REQUEST, m as DB_ADD_MESSAGE_RESPONSE, n as DB_GET_SESSION_REQUEST, o as DB_GET_SESSION_RESPONSE, p as DB_UPDATE_MESSAGE_REQUEST, q as DB_UPDATE_MESSAGE_RESPONSE, r as DB_DELETE_MESSAGE_REQUEST, s as DB_DELETE_MESSAGE_RESPONSE, t as DB_UPDATE_STATUS_REQUEST, u as DB_UPDATE_STATUS_RESPONSE, v as DB_TOGGLE_STAR_REQUEST, w as DB_TOGGLE_STAR_RESPONSE, x as DB_GET_ALL_SESSIONS_REQUEST, y as DB_GET_ALL_SESSIONS_RESPONSE, z as DB_GET_STARRED_SESSIONS_REQUEST, A as DB_GET_STARRED_SESSIONS_RESPONSE, B as DB_DELETE_SESSION_REQUEST, C as DB_DELETE_SESSION_RESPONSE, E as DB_RENAME_SESSION_REQUEST, F as DB_RENAME_SESSION_RESPONSE, G as DbSessionUpdatedNotification, H as DbGetAllSessionsRequest, I as DbToggleStarRequest, J as DbDeleteSessionRequest, K as DbRenameSessionRequest, L as commonjsGlobal, M as getDefaultExportFromCjs, N as DB_INITIALIZE_REQUEST, O as DB_ADD_LOG_REQUEST, P as DB_GET_LOGS_REQUEST, Q as DB_GET_UNIQUE_LOG_VALUES_REQUEST, R as DB_CLEAR_LOGS_REQUEST, S as DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST, T as DB_INITIALIZATION_COMPLETE_NOTIFICATION, U as DbInitializationCompleteNotification, V as DbMessagesUpdatedNotification, W as DB_STATUS_UPDATED_NOTIFICATION, X as DbCreateSessionResponse, Y as DbGetSessionResponse, Z as DbAddMessageResponse, _ as DbUpdateMessageResponse, $ as DbDeleteMessageResponse, a0 as DbUpdateStatusResponse, a1 as DbToggleStarResponse, a2 as DbGetAllSessionsResponse, a3 as DbGetStarredSessionsResponse, a4 as DbDeleteSessionResponse, a5 as DbRenameSessionResponse, a6 as DbGetLogsResponse, a7 as DbGetUniqueLogValuesResponse, a8 as DbClearLogsResponse, a9 as DbGetCurrentAndLastLogSessionIdsResponse, aa as DbGetStarredSessionsRequest, ab as DbInitializeRequest } from "./assets/dbEvents-DGCiIYDG.js";
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled2 = function(promises) {
      return Promise.all(
        promises.map(
          (p) => Promise.resolve(p).then(
            (value) => ({ status: "fulfilled", value }),
            (reason) => ({ status: "rejected", reason })
          )
        )
      );
    };
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = allSettled2(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
let pageContainers = [];
let navButtons = [];
let mainHeaderTitle = null;
const pageTitles = {
  "page-home": "Tab Agent",
  "page-spaces": "Spaces",
  "page-library": "Library",
  "page-settings": "Settings"
};
async function navigateTo(pageId) {
  console.log(`Navigating to ${pageId}`);
  pageContainers.forEach((container) => {
    container.classList.add("hidden");
    container.classList.remove("active-page");
  });
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove("hidden");
    targetPage.classList.add("active-page");
  } else {
    console.error(`Navigation error: Page with ID ${pageId} not found. Showing home.`);
    const homePage = document.getElementById("page-home");
    if (homePage) {
      homePage.classList.remove("hidden");
      homePage.classList.add("active-page");
    }
    pageId = "page-home";
  }
  if (mainHeaderTitle && pageTitles[pageId]) {
    mainHeaderTitle.textContent = pageTitles[pageId];
  } else if (mainHeaderTitle) {
    mainHeaderTitle.textContent = "Tab Agent";
  }
  navButtons.forEach((button) => {
    if (button.dataset.page === pageId) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
  const { eventBus: eventBus2 } = await __vitePreload(async () => {
    const { eventBus: eventBus3 } = await import("./assets/dbEvents-DGCiIYDG.js").then((n) => n.ad);
    return { eventBus: eventBus3 };
  }, true ? [] : void 0);
  eventBus2.publish("navigation:pageChanged", { pageId });
  console.log(`[Navigation] Published navigation:pageChanged event for ${pageId}`);
  const queryInput2 = document.getElementById("query-input");
  if (pageId === "page-home" && queryInput2) {
    queryInput2.focus();
  }
}
function initializeNavigation() {
  console.log("Initializing navigation...");
  pageContainers = document.querySelectorAll(".page-container");
  navButtons = document.querySelectorAll(".nav-button");
  mainHeaderTitle = document.querySelector("#header h1");
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.page;
      if (pageId) {
        navigateTo(pageId);
      }
    });
  });
  navigateTo("page-home");
  console.log("Navigation initialized.");
}
function showNotification$1(message, type2 = "info", duration = 3e3) {
  console.log(`[Notification] ${type2.toUpperCase()}: ${message} (Duration: ${duration}ms)`);
}
function showError(message) {
  console.error("UI Error:", message);
  const errorDiv = document.createElement("div");
  errorDiv.style.position = "fixed";
  errorDiv.style.bottom = "10px";
  errorDiv.style.left = "10px";
  errorDiv.style.backgroundColor = "red";
  errorDiv.style.color = "white";
  errorDiv.style.padding = "10px";
  errorDiv.style.borderRadius = "5px";
  errorDiv.style.zIndex = "1000";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3e3);
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
function getActiveTab() {
  if (typeof browser === "undefined" || !browser.tabs) {
    console.warn("Utils: Browser context or tabs API not available. Cannot get active tab.");
    return Promise.resolve(null);
  }
  return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs && tabs.length > 0) {
      return tabs[0];
    } else {
      return null;
    }
  }).catch((error) => {
    console.error("Utils: Error querying active tab:", error.message);
    return null;
  });
}
let chatBodyElement = null;
let currentSessionId$1 = null;
let requestDbAndWaitFunc$2 = null;
let observer = null;
const TEMP_MESSAGE_CLASS = "temp-status-message";
function initializeRenderer(chatBody2, requestDbFunc) {
  if (!chatBody2) {
    console.error("[ChatRenderer] chatBody element is required for initialization.");
    return;
  }
  if (!requestDbFunc) {
    console.error("[ChatRenderer] requestDbAndWait function is required for initialization.");
    return;
  }
  chatBodyElement = chatBody2;
  requestDbAndWaitFunc$2 = requestDbFunc;
  console.log("[ChatRenderer] Initialized with chat body element and DB request function.");
  eventBus$1.subscribe(DB_MESSAGES_UPDATED_NOTIFICATION, handleMessagesUpdate);
  console.log("[ChatRenderer] Subscribed to DbMessagesUpdatedNotification.");
  eventBus$1.subscribe(DB_SESSION_UPDATED_NOTIFICATION, handleSessionMetadataUpdate);
  console.log("[ChatRenderer] Subscribed to DbSessionUpdatedNotification.");
  initializeObserver();
}
function setActiveSessionId(sessionId) {
  console.log(`[ChatRenderer] Setting active session ID to: ${sessionId}`);
  currentSessionId$1 = sessionId;
  if (chatBodyElement) {
    chatBodyElement.innerHTML = "";
  }
  if (!sessionId) {
    displayWelcomeMessage();
  } else {
    console.log(`[ChatRenderer] Proactively loading messages for new session: ${sessionId}`);
    loadAndRenderMessages(sessionId);
  }
}
function displayWelcomeMessage() {
  if (!chatBodyElement) return;
  chatBodyElement.innerHTML = "";
  const welcomeMsg = {
    messageId: "welcome-msg",
    sender: "system",
    text: "Welcome to Tab Agent! Ask me anything or paste a URL to scrape.",
    timestamp: Date.now(),
    isLoading: false
  };
  renderSingleMessage(welcomeMsg);
}
function scrollToBottom() {
  if (chatBodyElement) {
    requestAnimationFrame(() => {
      chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
    });
  }
}
async function loadAndRenderMessages(sessionId) {
  if (!requestDbAndWaitFunc$2) {
    console.error("[ChatRenderer] Cannot load messages: requestDbAndWait function not available.");
    if (chatBodyElement) chatBodyElement.innerHTML = '<div class="p-4 text-red-500">Error: Cannot load chat messages.</div>';
    return;
  }
  if (!sessionId) {
    console.warn("[ChatRenderer] loadAndRenderMessages called with null sessionId. Displaying welcome.");
    displayWelcomeMessage();
    return;
  }
  console.log(`[ChatRenderer] Requesting messages for session ${sessionId}...`);
  try {
    const request = new DbGetSessionRequest(sessionId);
    const sessionData = await requestDbAndWaitFunc$2(request);
    if (sessionData && sessionData.messages) {
      console.log(`[ChatRenderer] Received ${sessionData.messages.length} messages for ${sessionId}. Rendering.`);
      if (chatBodyElement) chatBodyElement.innerHTML = "";
      if (sessionData.messages.length === 0) {
        displayWelcomeMessage();
      } else {
        sessionData.messages.forEach((msg) => renderSingleMessage(msg));
        scrollToBottom();
      }
    } else {
      console.warn(`[ChatRenderer] No messages found in session data for ${sessionId}. Displaying welcome.`, sessionData);
      displayWelcomeMessage();
    }
  } catch (error) {
    console.error(`[ChatRenderer] Failed to load messages for session ${sessionId}:`, error);
    showError(`Failed to load chat: ${error.message}`);
    if (chatBodyElement) chatBodyElement.innerHTML = `<div class="p-4 text-red-500">Failed to load chat: ${error.message}</div>`;
  }
}
function handleMessagesUpdate(notification) {
  if (!notification || !notification.sessionId || !notification.payload) return;
  if (notification.sessionId === currentSessionId$1) {
    console.log(`[ChatRenderer] Received message update notification for active session ${currentSessionId$1}. Rendering.`);
    let messages = notification.payload.messages;
    if (!Array.isArray(messages)) {
      if (Array.isArray(notification.payload)) {
        console.warn("[ChatRenderer] Payload did not have .messages, using payload directly as array.");
        messages = notification.payload;
      } else {
        console.error(`[ChatRenderer] Invalid messages structure: Expected array, got:`, notification.payload);
        return;
      }
    }
    console.log(`[ChatRenderer] Messages array received:`, JSON.stringify(messages));
    if (!chatBodyElement) return;
    chatBodyElement.innerHTML = "";
    if (messages.length === 0) {
      console.log(`[ChatRenderer] Active session ${currentSessionId$1} has no messages. Displaying welcome.`);
      displayWelcomeMessage();
    } else {
      messages.forEach((msg) => renderSingleMessage(msg));
      scrollToBottom();
    }
  }
}
function handleSessionMetadataUpdate(notification) {
  var _a2;
  if (!notification || !notification.sessionId || !((_a2 = notification.payload) == null ? void 0 : _a2.session)) return;
  if (notification.sessionId === currentSessionId$1) {
    const updatedSessionData = notification.payload.session;
    console.log(`[ChatRenderer] Received metadata update for active session ${currentSessionId$1}. New Title: ${updatedSessionData.title}, Starred: ${updatedSessionData.isStarred}`);
    updateChatHeader(updatedSessionData);
  }
}
function updateChatHeader(sessionData) {
  if (!sessionData) {
    console.log("[ChatRenderer] Clearing chat header (no active session).");
  } else {
    console.log(`[ChatRenderer] Updating chat header for ${sessionData.id}. Title: ${sessionData.title}, Starred: ${sessionData.isStarred}`);
  }
}
function renderSingleMessage(msg) {
  var _a2, _b;
  if (!chatBodyElement) return;
  console.log("[ChatRenderer] renderSingleMessage: msg object:", JSON.parse(JSON.stringify(msg)));
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("flex", "mb-2");
  messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("rounded-lg", "break-words", "relative", "group", "p-2", "min-w-0");
  if (msg.sender !== "user") {
    bubbleDiv.classList.add("max-w-4xl");
  }
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "actions-container absolute top-1 right-1 transition-opacity flex space-x-1 z-10";
  const copyButton = document.createElement("button");
  copyButton.innerHTML = '<img src="icons/copy.svg" alt="Copy" class="w-4 h-4">';
  copyButton.title = "Copy message text";
  copyButton.onclick = () => {
    var _a3;
    let textToCopy = msg.text;
    if (((_a3 = msg.metadata) == null ? void 0 : _a3.type) === "scrape_result_full" && msg.metadata.scrapeData) {
      textToCopy = JSON.stringify(msg.metadata.scrapeData, null, 2);
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (window.originalUITooltipController) {
        window.originalUITooltipController.showTooltip(copyButton, "Copied!");
      }
    }).catch((err) => console.error("Failed to copy text: ", err));
  };
  actionsContainer.appendChild(copyButton);
  if (((_a2 = msg.metadata) == null ? void 0 : _a2.type) === "scrape_result_full" && msg.metadata.scrapeData) {
    const downloadButton = document.createElement("button");
    downloadButton.innerHTML = '<img src="icons/download.svg" alt="Download" class="w-4 h-4">';
    downloadButton.title = "Download scrape data as JSON";
    downloadButton.onclick = () => {
      console.log("Download clicked for:", msg.metadata.scrapeData);
      if (window.originalUITooltipController) {
        window.originalUITooltipController.showTooltip(downloadButton, "Download (placeholder)");
      }
    };
    actionsContainer.appendChild(downloadButton);
  }
  let contentToParse = msg.text || "";
  let specialHeaderHTML = "";
  if (((_b = msg.metadata) == null ? void 0 : _b.type) === "scrape_result_full" && msg.metadata.scrapeData) {
    specialHeaderHTML = `<div class="scrape-header p-2 rounded-t-md bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 mb-1"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Scraped Content:</h4><p class="text-xs text-gray-500 dark:text-gray-400 break-all">URL: ${msg.metadata.scrapeData.url || "N/A"}</p></div>`;
    const dataForMd = typeof msg.metadata.scrapeData === "string" ? msg.metadata.scrapeData : JSON.stringify(msg.metadata.scrapeData, null, 2);
    contentToParse = "```json\n" + dataForMd + "\n```";
    console.log("[ChatRenderer] Preparing to parse scrape_result_full. Input to marked:", contentToParse);
  } else if (msg.text) {
    console.log("[ChatRenderer] Preparing to parse regular message. Input to marked:", contentToParse);
  }
  console.log(`[ChatRenderer] Before style application: msg.sender = ${msg.sender}`);
  if (msg.isLoading) {
    messageDiv.classList.add("justify-start");
    bubbleDiv.classList.add("bg-gray-100", "dark:bg-gray-700", "text-gray-500", "dark:text-gray-400", "italic", "border", "border-gray-300", "dark:border-gray-500");
  } else if (msg.sender === "user") {
    messageDiv.classList.add("justify-end", "min-w-0");
    bubbleDiv.classList.add(
      "bg-[rgba(236,253,245,0.51)]",
      // very subtle green tint
      "dark:bg-[rgba(20,83,45,0.12)]",
      // subtle dark green tint for dark mode
      "text-green-900",
      "dark:text-green-100",
      "border",
      "border-green-100",
      "dark:border-green-900"
    );
  } else if (msg.sender === "error") {
    messageDiv.classList.add("justify-start");
    bubbleDiv.classList.add(
      "bg-[rgba(254,226,226,0.37)]",
      // subtle red tint (light)
      "dark:bg-[rgba(120,20,20,0.12)]",
      // subtle red tint (dark)
      "text-red-700",
      "dark:text-red-200",
      "border",
      "border-red-200",
      "dark:border-red-700"
    );
  } else if (msg.sender === "system") {
    messageDiv.classList.add("justify-start");
    bubbleDiv.classList.add(
      "bg-[rgba(219,234,254,0.5)]",
      // subtle blue tint
      "dark:bg-[rgba(30,41,59,0.2)]",
      // subtle dark blue/gray for dark mode
      "text-blue-900",
      "dark:text-blue-100",
      "border",
      "border-blue-100",
      "dark:border-blue-900"
    );
  } else {
    messageDiv.classList.add("justify-start");
    bubbleDiv.classList.add("bg-gray-100", "dark:bg-gray-700", "text-gray-900", "dark:text-gray-100", "border", "border-gray-300", "dark:border-gray-600");
  }
  console.log("[ChatRenderer] messageDiv classes:", messageDiv.className);
  console.log("[ChatRenderer] bubbleDiv classes:", bubbleDiv.className);
  const headerBar = document.createElement("div");
  headerBar.className = "bubble-header flex items-center justify-between px-2 py-0.5 min-w-[300px] w-full bg-[rgba(200,200,200,0.18)] dark:bg-[rgba(50,50,50,0.28)] rounded-t-lg border-b border-gray-200 dark:border-gray-700 transition-all duration-150 group";
  headerBar.onmouseenter = () => headerBar.classList.add("bg-[rgba(200,200,200,0.28)]", "dark:bg-[rgba(50,50,50,0.38)]");
  headerBar.onmouseleave = () => headerBar.classList.remove("bg-[rgba(200,200,200,0.28)]", "dark:bg-[rgba(50,50,50,0.38)]");
  const foldoutBtn = document.createElement("button");
  foldoutBtn.className = "toggle-foldout mr-2 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer";
  foldoutBtn.title = "Expand/collapse message";
  foldoutBtn.innerHTML = `<svg class="chevron-icon transition-transform duration-150" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  headerBar.appendChild(foldoutBtn);
  actionsContainer.classList.add("ml-auto", "flex", "items-center", "space-x-1");
  headerBar.appendChild(actionsContainer);
  const mainContentDiv = document.createElement("div");
  mainContentDiv.className = "message-main-content";
  if (window.marked && window.marked.parse) {
    try {
      const localRenderer = new window.marked.Renderer();
      const escapeHtmlEntities = (str) => {
        if (typeof str !== "string") return "";
        return str.replace(/[&<>"'\/]/g, function(match) {
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
            "/": "&#x2F;"
          }[match];
        });
      };
      localRenderer.code = (tokenOrCode, languageInfoString, isEscaped) => {
        console.log(
          "[ChatRenderer Custom Code] Received arguments:",
          {
            tokenOrCode_type: typeof tokenOrCode,
            tokenOrCode_value: JSON.parse(JSON.stringify(tokenOrCode)),
            // Deep copy for logging
            languageInfoString_type: typeof languageInfoString,
            languageInfoString_value: languageInfoString,
            isEscaped_value: isEscaped
          }
        );
        let actualCodeString = "";
        let actualLanguageString = languageInfoString || "";
        if (typeof tokenOrCode === "object" && tokenOrCode !== null && typeof tokenOrCode.text === "string") {
          actualCodeString = tokenOrCode.text;
          actualLanguageString = tokenOrCode.lang || actualLanguageString;
          console.log("[ChatRenderer Custom Code] Interpreted as token object. Using token.text and token.lang.");
        } else if (typeof tokenOrCode === "string") {
          actualCodeString = tokenOrCode;
          console.log("[ChatRenderer Custom Code] Interpreted as direct code string.");
        } else {
          console.warn("[ChatRenderer Custom Code] Received unexpected type for code argument:", tokenOrCode);
          actualCodeString = "[Error: Unexpected code content type]";
        }
        let languageHint = actualLanguageString.trim();
        let safeLanguage = escapeHtmlEntities(languageHint || "plaintext");
        let langClass = `language-${safeLanguage}`;
        const copyIcon = '<img src="icons/copy.svg" alt="Copy code" class="w-4 h-4">';
        const downloadIcon = '<img src="icons/download.svg" alt="Download code" class="w-4 h-4">';
        const encodedCodeForAttr = encodeURIComponent(actualCodeString);
        let highlightedCodeForDisplay = "";
        if (window.hljs) {
          if (actualLanguageString && window.hljs.getLanguage(actualLanguageString)) {
            try {
              highlightedCodeForDisplay = window.hljs.highlight(actualCodeString, { language: actualLanguageString, ignoreIllegals: true }).value;
              console.log("[ChatRenderer Custom Code] Highlighted with specified language:", actualLanguageString);
            } catch (e) {
              console.error("[ChatRenderer Custom Code] hljs.highlight error:", e);
              highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
            }
          } else {
            try {
              const autoResult = window.hljs.highlightAuto(actualCodeString);
              highlightedCodeForDisplay = autoResult.value;
              const detectedLang = autoResult.language;
              console.log("[ChatRenderer Custom Code] Highlighted with auto-detection. Detected:", detectedLang);
              if (detectedLang) {
                safeLanguage = escapeHtmlEntities(detectedLang);
                langClass = `language-${safeLanguage}`;
              }
            } catch (e) {
              console.error("[ChatRenderer Custom Code] hljs.highlightAuto error:", e);
              highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
            }
          }
        } else {
          console.warn("[ChatRenderer Custom Code] window.hljs not found. Falling back to escaped code.");
          highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
        }
        return `
<div class="code-block-wrapper bg-gray-800 dark:bg-gray-900 rounded-md shadow-md my-2 text-sm">
    <div class="code-block-header flex justify-between items-center px-3 py-1.5 bg-gray-700 dark:bg-gray-800 rounded-t-md border-b border-gray-600 dark:border-gray-700">
        <span class="code-language text-xs text-gray-300 dark:text-gray-400 font-semibold">${safeLanguage}</span>
        <div class="code-actions flex space-x-2">
            <button class="code-action-copy-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Copy code" data-code="${encodedCodeForAttr}">
                ${copyIcon}
            </button>
            <button class="code-action-download-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Download ${safeLanguage} snippet" data-code="${encodedCodeForAttr}" data-lang="${safeLanguage}">
                ${downloadIcon}
            </button>
        </div>
    </div>
    <pre class="p-3 overflow-x-auto"><code class="${langClass}">${highlightedCodeForDisplay}</code></pre>
</div>`;
      };
      const parsedContent = window.marked.parse(contentToParse || "", {
        renderer: localRenderer,
        // Use the renderer with only .code overridden
        gfm: true,
        breaks: true
      });
      console.log("[ChatRenderer Minimal Custom Marked.parse() output:]", parsedContent);
      mainContentDiv.innerHTML = parsedContent;
      if (window.hljs) {
        console.log("[ChatRenderer] Content set. highlight.js should have processed via Marked.js config.");
      }
    } catch (e) {
      console.error("Error during marked.parse:", e);
      mainContentDiv.textContent = contentToParse || "";
    }
  } else {
    console.warn("Marked.js not available. Falling back to textContent.");
    mainContentDiv.textContent = contentToParse || "";
  }
  let expanded = true;
  foldoutBtn.onclick = () => {
    expanded = !expanded;
    mainContentDiv.style.display = expanded ? "" : "none";
    const svg = foldoutBtn.querySelector(".chevron-icon");
    if (svg) svg.style.transform = expanded ? "rotate(0deg)" : "rotate(-90deg)";
  };
  mainContentDiv.style.display = "";
  bubbleDiv.innerHTML = "";
  bubbleDiv.appendChild(headerBar);
  if (specialHeaderHTML) {
    const headerDiv = document.createElement("div");
    headerDiv.innerHTML = specialHeaderHTML;
    bubbleDiv.appendChild(headerDiv);
  }
  bubbleDiv.appendChild(mainContentDiv);
  bubbleDiv.appendChild(actionsContainer);
  messageDiv.appendChild(bubbleDiv);
  chatBodyElement.appendChild(messageDiv);
  scrollToBottom();
  return messageDiv;
}
function renderTemporaryMessage(type2, text) {
  if (!chatBodyElement) return;
  if (type2 !== "system") {
    console.log(`[ChatRenderer] Rendering temporary message (${type2}): ${text}`);
  }
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", `message-${type2}`, TEMP_MESSAGE_CLASS);
  messageDiv.style.padding = "8px 12px";
  messageDiv.style.borderRadius = "8px";
  messageDiv.style.marginBottom = "10px";
  messageDiv.style.maxWidth = "90%";
  messageDiv.style.alignSelf = "center";
  messageDiv.style.backgroundColor = type2 === "error" ? "#fee2e2" : type2 === "success" ? "#dcfce7" : "#f3f4f6";
  messageDiv.style.color = type2 === "error" ? "#b91c1c" : type2 === "success" ? "#166534" : "#374151";
  if (document.documentElement.classList.contains("dark")) {
    messageDiv.style.backgroundColor = type2 === "error" ? "#450a0a" : type2 === "success" ? "#14532d" : "#374151";
    messageDiv.style.color = type2 === "error" ? "#fca5a5" : type2 === "success" ? "#bbf7d0" : "#d1d5db";
  }
  messageDiv.textContent = text;
  chatBodyElement.appendChild(messageDiv);
  scrollToBottom();
}
function clearTemporaryMessages() {
  if (!chatBodyElement) return;
  console.log("[ChatRenderer] Clearing temporary status messages.");
  const tempMessages = chatBodyElement.querySelectorAll(`.${TEMP_MESSAGE_CLASS}`);
  tempMessages.forEach((msg) => msg.remove());
}
function initializeObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) ;
        });
      }
    });
  });
  if (chatBodyElement) {
    observer.observe(chatBodyElement, { childList: true, subtree: true });
    console.log("[ChatRenderer] MutationObserver initialized and observing chat body.");
    chatBodyElement.addEventListener("click", async (event) => {
      const target = event.target.closest("button");
      if (!target) return;
      if (target.classList.contains("code-action-copy-snippet")) {
        const codeToCopy = target.dataset.code;
        if (codeToCopy) {
          try {
            await navigator.clipboard.writeText(decodeURIComponent(codeToCopy));
            if (window.originalUITooltipController) {
              window.originalUITooltipController.showTooltip(target, "Code Copied!");
            } else {
              showNotification$1("Code snippet copied!", "success", 1500);
            }
          } catch (err) {
            console.error("Failed to copy code snippet:", err);
            showError("Failed to copy code snippet.");
          }
        }
      } else if (target.classList.contains("code-action-download-snippet")) {
        const codeToDownload = target.dataset.code;
        const lang = target.dataset.lang || "txt";
        const filename = `snippet.${lang}`;
        if (codeToDownload) {
          try {
            downloadFile(filename, decodeURIComponent(codeToDownload), getMimeType(lang));
            if (window.originalUITooltipController) {
              window.originalUITooltipController.showTooltip(target, "Downloading...");
            }
          } catch (err) {
            console.error("Failed to download code snippet:", err);
            showError("Failed to download code snippet.");
          }
        }
      }
    });
    console.log("[ChatRenderer] Event listeners for code block actions (copy/download) added to chatBody.");
  } else {
    console.error("[ChatRenderer] Cannot initialize MutationObserver or event listeners: chatBody is null.");
  }
}
function getMimeType(lang) {
  const mimeTypes = {
    json: "application/json",
    javascript: "application/javascript",
    js: "application/javascript",
    html: "text/html",
    css: "text/css",
    xml: "application/xml",
    python: "text/x-python",
    py: "text/x-python",
    java: "text/x-java-source",
    c: "text/x-csrc",
    cpp: "text/x-c++src",
    cs: "text/x-csharp",
    go: "text/x-go",
    rb: "text/x-ruby",
    php: "application/x-httpd-php",
    swift: "text/x-swift",
    kt: "text/x-kotlin",
    rs: "text/rust",
    sql: "application/sql",
    sh: "application/x-sh",
    bash: "application/x-sh",
    // Add more as needed
    txt: "text/plain",
    plaintext: "text/plain"
  };
  return mimeTypes[lang.toLowerCase()] || "text/plain";
}
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
let queryInput, sendButton, chatBody, attachButton, fileInput, loadModelButton;
let isInitialized$5 = false;
let attachFileCallback = null;
let currentSessionId = null;
const AVAILABLE_MODELS = {
  // Model ID (value) : Display Name
  "Xenova/Qwen1.5-1.8B-Chat": "Qwen 1.8B Chat (Quantized)",
  "Xenova/Phi-3-mini-4k-instruct": "Phi-3 Mini Instruct (Quantized)",
  "HuggingFaceTB/SmolLM-1.7B-Instruct": "SmolLM 1.7B Instruct",
  "HuggingFaceTB/SmolLM2-1.7B": "SmolLM2 1.7B",
  "google/gemma-3-4b-it-qat-q4_0-gguf": "Gemma 3 4B IT Q4 (GGUF)",
  "bubblspace/Bubbl-P4-multimodal-instruct": "Bubbl-P4 Instruct (Multimodal)",
  // Experimental Multimodal
  "microsoft/Phi-4-multimodal-instruct": "Phi-4 Instruct (Multimodal)",
  // Experimental Multimodal
  "microsoft/Phi-4-mini-instruct": "Phi-4 Mini Instruct",
  "Qwen/Qwen3-4B": "Qwen/Qwen3-4B",
  "google/gemma-3-1b-pt": "google/gemma-3-1b-pt",
  "HuggingFaceTB/SmolLM2-360M": "HuggingFaceTB/SmolLM2-360M"
  // Add more models here as needed
};
function selectElements() {
  queryInput = document.getElementById("query-input");
  sendButton = document.getElementById("send-button");
  chatBody = document.getElementById("chat-body");
  attachButton = document.getElementById("attach-button");
  fileInput = document.getElementById("file-input");
  document.getElementById("loading-indicator");
  if (!queryInput || !sendButton || !chatBody || !attachButton || !fileInput) {
    console.error("UIController: One or more essential elements not found (excluding session list)!");
    return false;
  }
  return true;
}
function attachListeners() {
  queryInput == null ? void 0 : queryInput.addEventListener("input", adjustTextareaHeight);
  queryInput == null ? void 0 : queryInput.addEventListener("keydown", handleEnterKey);
  sendButton == null ? void 0 : sendButton.addEventListener("click", handleSendButtonClick);
  attachButton == null ? void 0 : attachButton.addEventListener("click", handleAttachClick$1);
}
function removeListeners() {
  queryInput == null ? void 0 : queryInput.removeEventListener("input", adjustTextareaHeight);
  queryInput == null ? void 0 : queryInput.removeEventListener("keydown", handleEnterKey);
  sendButton == null ? void 0 : sendButton.removeEventListener("click", handleSendButtonClick);
  attachButton == null ? void 0 : attachButton.removeEventListener("click", handleAttachClick$1);
}
function handleEnterKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const messageText = getInputValue();
    if (messageText && !queryInput.disabled) {
      console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
      eventBus$1.publish("ui:querySubmitted", { text: messageText });
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
    eventBus$1.publish("ui:querySubmitted", { text: messageText });
    clearInput();
  } else {
    console.log("[UIController] Send button clicked, but input is empty or disabled.");
  }
}
function handleAttachClick$1() {
  if (attachFileCallback) {
    attachFileCallback();
  }
}
function adjustTextareaHeight() {
  if (!queryInput) return;
  queryInput.style.height = "auto";
  const maxHeight = 150;
  const scrollHeight = queryInput.scrollHeight;
  queryInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  if (sendButton) {
    sendButton.disabled = queryInput.value.trim() === "" || queryInput.disabled;
  }
}
function setInputStateInternal(status) {
  console.log(`[UIController] setInputStateInternal called with status: ${status}`);
  if (!isInitialized$5 || !queryInput || !sendButton) return;
  switch (status) {
    case "processing":
      queryInput.disabled = true;
      sendButton.disabled = true;
      break;
    case "error":
    case "idle":
    case "complete":
    default:
      queryInput.disabled = false;
      adjustTextareaHeight();
      break;
  }
  console.log(`[UIController] Input disabled state: ${queryInput.disabled}`);
}
function handleStatusUpdate(notification) {
  if (!isInitialized$5 || !notification || !notification.sessionId || !notification.payload) return;
  if (notification.sessionId === currentSessionId) {
    setInputStateInternal(notification.payload.status || "idle");
  }
}
function handleLoadingProgress(payload) {
  if (!isInitialized$5 || !payload) return;
  {
    console.warn("[UIController] Model load progress bar not found.");
  }
  const { status, file, progress, model } = payload;
  let message = status;
  if (status === "progress") {
    message = `Downloading ${file}... ${Math.round(progress)}%`;
    renderTemporaryMessage("system", message);
    setLoadButtonState("loading", `Down: ${Math.round(progress)}%`);
  } else if (status === "download" || status === "ready") {
    message = `Loading ${file}...`;
    renderTemporaryMessage("system", message);
    setLoadButtonState("loading", `Loading ${file}`);
  } else if (status === "done") {
    message = `${file} loaded. Preparing pipeline...`;
    renderTemporaryMessage("system", message);
    setLoadButtonState("loading", "Preparing...");
  } else {
    renderTemporaryMessage("system", message);
    setLoadButtonState("loading", status);
  }
}
async function initializeUI(callbacks) {
  console.log("[UIController] Initializing...");
  if (isInitialized$5) {
    console.warn("[UIController] Already initialized. Removing old listeners and subscriptions.");
    removeListeners();
    eventBus$1.unsubscribe(DbStatusUpdatedNotification.name, handleStatusUpdate);
    eventBus$1.unsubscribe("ui:loadingStatusUpdate", handleLoadingProgress);
  }
  if (!selectElements()) {
    isInitialized$5 = false;
    return null;
  }
  attachFileCallback = callbacks == null ? void 0 : callbacks.onAttachFile;
  attachListeners();
  const newChatButton = document.getElementById("new-chat-button");
  if (newChatButton && (callbacks == null ? void 0 : callbacks.onNewChat)) {
    newChatButton.addEventListener("click", callbacks.onNewChat);
  }
  eventBus$1.subscribe(DbStatusUpdatedNotification.name, handleStatusUpdate);
  eventBus$1.subscribe("ui:loadingStatusUpdate", handleLoadingProgress);
  console.log("[UIController] Subscribed to DB Status & Loading Status notifications.");
  isInitialized$5 = true;
  setInputStateInternal("idle");
  adjustTextareaHeight();
  console.log("[UIController] Initialized successfully.");
  console.log(`[UIController] Returning elements: chatBody is ${chatBody ? "found" : "NULL"}, fileInput is ${fileInput ? "found" : "NULL"}`);
  clearTemporaryMessages();
  loadModelButton = document.getElementById("load-model-button");
  if (loadModelButton) {
    loadModelButton.addEventListener("click", handleLoadModelClick);
  } else {
    console.error("[UIController] Load Model button not found!");
  }
  disableInput("Model not loaded. Click 'Load'.");
  setLoadButtonState("idle");
  console.log("[UIController] Initializing UI elements...");
  console.log("[UIController] Attempting to find model selector...");
  const modelSelector = document.getElementById("model-selector");
  console.log(modelSelector ? "[UIController] Model selector found." : "[UIController] WARNING: Model selector NOT found!");
  if (modelSelector) {
    modelSelector.innerHTML = "";
    console.log("[UIController] Populating model selector. Available models:", AVAILABLE_MODELS);
    for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
      console.log(`[UIController] Adding option: ${displayName} (${modelId})`);
      const option = document.createElement("option");
      option.value = modelId;
      option.textContent = displayName;
      modelSelector.appendChild(option);
    }
  } else {
    console.warn("[UIController] Model selector dropdown not found.");
  }
  console.log("[UIController] UI Initialization complete.");
  return { chatBody, queryInput, sendButton, attachButton, fileInput };
}
function setActiveSession(sessionId) {
  console.log(`[UIController] Setting active session for UI state: ${sessionId}`);
  currentSessionId = sessionId;
  if (!sessionId) {
    setInputStateInternal("idle");
  }
}
function checkInitialized() {
  return isInitialized$5;
}
function getInputValue() {
  return (queryInput == null ? void 0 : queryInput.value.trim()) || "";
}
function clearInput() {
  console.log("[UIController] Entering clearInput function.");
  if (queryInput) {
    queryInput.value = "";
    adjustTextareaHeight();
  }
}
function focusInput() {
  queryInput == null ? void 0 : queryInput.focus();
}
function triggerFileInputClick() {
  fileInput == null ? void 0 : fileInput.click();
}
function handleLoadModelClick() {
  if (!isInitialized$5) return;
  console.log("[UIController] Load Model button clicked.");
  const modelSelector = document.getElementById("model-selector");
  const selectedModelId = modelSelector == null ? void 0 : modelSelector.value;
  if (!selectedModelId) {
    console.error("[UIController] Cannot load: No model selected or selector not found.");
    showNotification("Error: Please select a model.", "error");
    return;
  }
  console.log(`[UIController] Requesting load for model: ${selectedModelId}`);
  setLoadButtonState("loading");
  disableInput(`Loading ${AVAILABLE_MODELS[selectedModelId] || selectedModelId}...`);
  eventBus$1.publish("ui:requestModelLoad", { modelId: selectedModelId });
}
function setLoadButtonState(state, text = "Load") {
  if (!isInitialized$5 || !loadModelButton) return;
  switch (state) {
    case "idle":
      loadModelButton.disabled = false;
      loadModelButton.textContent = text;
      loadModelButton.classList.replace("bg-yellow-500", "bg-green-500");
      loadModelButton.classList.replace("bg-gray-500", "bg-green-500");
      break;
    case "loading":
      loadModelButton.disabled = true;
      loadModelButton.textContent = text === "Load" ? "Loading..." : text;
      loadModelButton.classList.replace("bg-green-500", "bg-yellow-500");
      loadModelButton.classList.replace("bg-gray-500", "bg-yellow-500");
      break;
    case "loaded":
      loadModelButton.disabled = true;
      loadModelButton.textContent = "Loaded";
      loadModelButton.classList.replace("bg-green-500", "bg-gray-500");
      loadModelButton.classList.replace("bg-yellow-500", "bg-gray-500");
      break;
    case "error":
      loadModelButton.disabled = false;
      loadModelButton.textContent = "Load Failed";
      loadModelButton.classList.replace("bg-yellow-500", "bg-red-500");
      loadModelButton.classList.replace("bg-green-500", "bg-red-500");
      loadModelButton.classList.replace("bg-gray-500", "bg-red-500");
      break;
  }
}
function disableInput(reason = "Processing...") {
  if (!isInitialized$5 || !queryInput || !sendButton) return;
  queryInput.disabled = true;
  queryInput.placeholder = reason;
  sendButton.disabled = true;
}
function enableInput() {
  if (!isInitialized$5 || !queryInput || !sendButton) return;
  queryInput.disabled = false;
  queryInput.placeholder = "Ask Tab Agent...";
  sendButton.disabled = queryInput.value.trim() === "";
}
eventBus$1.subscribe("worker:ready", (payload) => {
  console.log("[UIController] Received worker:ready signal", payload);
  clearTemporaryMessages();
  renderTemporaryMessage("success", `Model ${(payload == null ? void 0 : payload.model) || ""} ready.`);
  enableInput();
  setLoadButtonState("loaded");
});
eventBus$1.subscribe("worker:error", (payload) => {
  console.error("[UIController] Received worker:error signal", payload);
  clearTemporaryMessages();
  renderTemporaryMessage("error", `Model load failed: ${payload}`);
  setLoadButtonState("error");
  disableInput("Model load failed. Check logs.");
});
const uiController = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  adjustTextareaHeight,
  checkInitialized,
  clearInput,
  focusInput,
  getInputValue,
  initializeUI,
  setActiveSession,
  triggerFileInputClick
}, Symbol.toStringTag, { value: "Module" }));
let getActiveSessionIdFunc$1 = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false;
const pendingDbRequests$1 = /* @__PURE__ */ new Map();
function requestDbAndWait$1(requestEvent, timeoutMs = 5e3) {
  return new Promise((resolve2, reject) => {
    const { requestId, type: requestType } = requestEvent;
    const responseHandler = (responseEvent) => {
      if (responseEvent && responseEvent.requestId === requestId) {
        console.log(`[Orchestrator] Received DB response for ${requestType} (Req ID: ${requestId})`);
        console.log(`[Orchestrator] RAW Received Response Event Object (Req ID: ${requestId}):`, JSON.stringify(responseEvent));
        eventBus$1.unsubscribe(responseEventType, responseHandler);
        pendingDbRequests$1.delete(requestId);
        clearTimeout(timeoutId);
        if (responseEvent.success) {
          resolve2(responseEvent.data);
        } else {
          reject(new Error(responseEvent.error || `DB operation ${requestType} failed`));
        }
      }
    };
    const timeoutId = setTimeout(() => {
      console.error(`[Orchestrator] DB request timed out for ${requestType} (Req ID: ${requestId})`);
      eventBus$1.unsubscribe(responseEventType, responseHandler);
      pendingDbRequests$1.delete(requestId);
      reject(new Error(`DB request timed out for ${requestType}`));
    }, timeoutMs);
    let responseEventType;
    if (requestType === DB_CREATE_SESSION_REQUEST) {
      responseEventType = DB_CREATE_SESSION_RESPONSE;
    } else if (requestType === DB_ADD_MESSAGE_REQUEST) {
      responseEventType = DB_ADD_MESSAGE_RESPONSE;
    } else if (requestType === DB_GET_SESSION_REQUEST) {
      responseEventType = DB_GET_SESSION_RESPONSE;
    } else if (requestType === DB_UPDATE_MESSAGE_REQUEST) {
      responseEventType = DB_UPDATE_MESSAGE_RESPONSE;
    } else if (requestType === DB_DELETE_MESSAGE_REQUEST) {
      responseEventType = DB_DELETE_MESSAGE_RESPONSE;
    } else if (requestType === DB_UPDATE_STATUS_REQUEST) {
      responseEventType = DB_UPDATE_STATUS_RESPONSE;
    } else if (requestType === DB_TOGGLE_STAR_REQUEST) {
      responseEventType = DB_TOGGLE_STAR_RESPONSE;
    } else if (requestType === DB_GET_ALL_SESSIONS_REQUEST) {
      responseEventType = DB_GET_ALL_SESSIONS_RESPONSE;
    } else if (requestType === DB_GET_STARRED_SESSIONS_REQUEST) {
      responseEventType = DB_GET_STARRED_SESSIONS_RESPONSE;
    } else if (requestType === DB_DELETE_SESSION_REQUEST) {
      responseEventType = DB_DELETE_SESSION_RESPONSE;
    } else if (requestType === DB_RENAME_SESSION_REQUEST) {
      responseEventType = DB_RENAME_SESSION_RESPONSE;
    } else {
      console.error(`[Orchestrator] Unknown request type for response mapping: ${requestType}`);
      responseEventType = requestType.replace("Request", "Response");
      if (responseEventType === requestType) {
        reject(new Error(`Cannot determine response event type for request: ${requestType}`));
        return;
      }
    }
    console.log(`[Orchestrator] Subscribing responseHandler for ReqID ${requestId} to event type: ${responseEventType}`);
    eventBus$1.subscribe(responseEventType, responseHandler);
    pendingDbRequests$1.set(requestId, { handler: responseHandler, timeoutId });
    eventBus$1.publish(requestEvent.type, requestEvent);
  });
}
function initializeOrchestrator(dependencies) {
  getActiveSessionIdFunc$1 = dependencies.getActiveSessionIdFunc;
  onSessionCreatedCallback = dependencies.onSessionCreatedCallback;
  getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;
  if (!getActiveSessionIdFunc$1 || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
    console.error("Orchestrator: Missing one or more dependencies during initialization!");
    return;
  }
  console.log("[Orchestrator] Initializing and subscribing to application events...");
  eventBus$1.subscribe("ui:querySubmitted", handleQuerySubmit);
  eventBus$1.subscribe("background:responseReceived", handleBackgroundMsgResponse);
  eventBus$1.subscribe("background:errorReceived", handleBackgroundMsgError);
  eventBus$1.subscribe("background:scrapeStageResult", handleBackgroundScrapeStage);
  eventBus$1.subscribe("background:scrapeResultReceived", handleBackgroundDirectScrapeResult);
  console.log("[Orchestrator] Event subscriptions complete.");
}
async function handleQuerySubmit(data) {
  const { text } = data;
  console.log(`Orchestrator: handleQuerySubmit received event with text: "${text}"`);
  if (isSendingMessage) {
    console.warn("Orchestrator: Already processing a previous submission.");
    return;
  }
  isSendingMessage = true;
  let sessionId = getActiveSessionIdFunc$1();
  getCurrentTabIdFunc();
  let placeholderMessageId = null;
  console.log(`Orchestrator: Processing submission. Text: "${text}". Session: ${sessionId}`);
  const isURL = URL_REGEX.test(text);
  try {
    clearTemporaryMessages();
    const userMessage = { sender: "user", text, timestamp: Date.now(), isLoading: false };
    if (!sessionId) {
      console.log("Orchestrator: No active session, creating new one via event.");
      const createRequest = new DbCreateSessionRequest(userMessage);
      const createResponse = await requestDbAndWait$1(createRequest);
      sessionId = createResponse.newSessionId;
      if (onSessionCreatedCallback) {
        onSessionCreatedCallback(sessionId);
      } else {
        console.error("Orchestrator: onSessionCreatedCallback is missing!");
        throw new Error("Configuration error: Cannot notify about new session.");
      }
    } else {
      console.log(`Orchestrator: Adding user message to existing session ${sessionId} via event.`);
      clearTemporaryMessages();
      const addRequest = new DbAddMessageRequest$1(sessionId, userMessage);
      await requestDbAndWait$1(addRequest);
    }
    console.log(`[Orchestrator] Setting session ${sessionId} status to 'processing' via event`);
    const statusRequest = new DbUpdateStatusRequest(sessionId, "processing");
    await requestDbAndWait$1(statusRequest);
    let placeholder;
    if (isURL) {
      const activeTab = await getActiveTab();
      const activeTabUrl = activeTab == null ? void 0 : activeTab.url;
      const normalizeUrl = (u) => u ? u.replace("/$", "") : null;
      const inputUrlNormalized = normalizeUrl(text);
      const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
      const placeholderText = activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized ? `⏳ Scraping active tab: ${text}...` : `⏳ Scraping ${text}...`;
      placeholder = { sender: "system", text: placeholderText, timestamp: Date.now(), isLoading: true };
    } else {
      placeholder = { sender: "ai", text: "Thinking...", timestamp: Date.now(), isLoading: true };
    }
    console.log(`[Orchestrator] Adding placeholder to session ${sessionId} via event.`);
    const addPlaceholderRequest = new DbAddMessageRequest$1(sessionId, placeholder);
    const placeholderResponse = await requestDbAndWait$1(addPlaceholderRequest);
    placeholderMessageId = placeholderResponse.newMessageId;
    if (isURL) {
      const activeTab = await getActiveTab();
      const activeTabUrl = activeTab == null ? void 0 : activeTab.url;
      const normalizeUrl = (u) => u ? u.replace("/$", "") : null;
      const inputUrlNormalized = normalizeUrl(text);
      const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
      if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
        console.log("Orchestrator: Triggering content script scrape.");
        browser.tabs.sendMessage(activeTab.id, { type: "SCRAPE_ACTIVE_TAB" }, (response) => {
          if (browser.runtime.lastError) {
            console.error("Orchestrator: Error sending SCRAPE_ACTIVE_TAB:", browser.runtime.lastError.message);
            const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, {
              isLoading: false,
              sender: "error",
              text: `Failed to send scrape request: ${browser.runtime.lastError.message}`
            });
            requestDbAndWait$1(errorUpdateRequest).catch((e) => console.error("Failed to update placeholder on send error:", e));
            requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error")).catch((e) => console.error("Failed to set session status on send error:", e));
            isSendingMessage = false;
          } else {
            console.log("Orchestrator: SCRAPE_ACTIVE_TAB message sent.");
          }
        });
      } else {
        console.log("Orchestrator: Triggering background scrape via scrapeRequest.");
        try {
          const response = await browser.runtime.sendMessage({
            type: "scrapeRequest",
            payload: {
              url: text,
              chatId: sessionId,
              messageId: placeholderMessageId
            }
          });
          console.log("Orchestrator: scrapeRequest message sent successfully.", response);
        } catch (error) {
          console.error("Orchestrator: Error sending scrapeRequest:", error.message);
          const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, {
            isLoading: false,
            sender: "error",
            text: `Failed to initiate scrape: ${error.message}`
          });
          requestDbAndWait$1(errorUpdateRequest).catch((e) => console.error("Failed to update placeholder on send error:", e));
          requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error")).catch((e) => console.error("Failed to set session status on send error:", e));
          isSendingMessage = false;
        }
      }
    } else {
      console.log("Orchestrator: Sending query to background for AI response.");
      const messagePayload = {
        type: "sendChatMessage",
        payload: {
          chatId: sessionId,
          messages: [{ role: "user", content: text }],
          options: {
            /* model, temp, etc */
          },
          messageId: placeholderMessageId
        }
      };
      try {
        const response = await browser.runtime.sendMessage(messagePayload);
        if (response && response.success) {
          console.log("Orchestrator: Background acknowledged forwarding sendChatMessage. Actual AI response will follow separately.", response);
        } else {
          console.error("Orchestrator: Background reported an error while attempting to forward sendChatMessage:", response == null ? void 0 : response.error);
          const errorPayload = { isLoading: false, sender: "error", text: `Error forwarding query: ${(response == null ? void 0 : response.error) || "Unknown error"}` };
          const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
          await requestDbAndWait$1(errorUpdateRequest);
          await requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error"));
          isSendingMessage = false;
        }
      } catch (error) {
        console.error("Orchestrator: Error sending query to background or processing its direct ack:", error);
        const errorText = error && typeof error.message === "string" ? error.message : "Unknown error during send/ack";
        const errorPayload = { isLoading: false, sender: "error", text: `Failed to send query: ${errorText}` };
        const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
        requestDbAndWait$1(errorUpdateRequest).catch((e) => console.error("Failed to update placeholder on send error (within catch):", e));
        requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error")).catch((e) => console.error("Failed to set session status on send error (within catch):", e));
        isSendingMessage = false;
      }
    }
  } catch (error) {
    console.error("Orchestrator: Error processing query submission:", error);
    showError(`Error: ${error.message || error}`);
    if (sessionId) {
      console.log(`[Orchestrator] Setting session ${sessionId} status to 'error' due to processing failure via event`);
      requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error")).catch((e) => console.error("Failed to set session status on processing error:", e));
    } else {
      console.error("Orchestrator: Error occurred before session ID was established.");
    }
    isSendingMessage = false;
  }
}
async function handleBackgroundMsgResponse(message) {
  const { chatId, messageId, text } = message;
  console.log(`Orchestrator: handleBackgroundMsgResponse for chat ${chatId}, placeholder ${messageId}`);
  try {
    const updatePayload = { isLoading: false, sender: "ai", text: text || "Received empty response." };
    const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
    await requestDbAndWait$1(updateRequest);
    console.log(`[Orchestrator] Setting session ${chatId} status to 'idle' after response via event`);
    const statusRequest = new DbUpdateStatusRequest(chatId, "idle");
    await requestDbAndWait$1(statusRequest);
  } catch (error) {
    console.error(`Orchestrator: Error handling background response for chat ${chatId}:`, error);
    showError(`Failed to update chat with response: ${error.message || error}`);
    const statusRequest = new DbUpdateStatusRequest(chatId, "error");
    requestDbAndWait$1(statusRequest).catch((e) => console.error("Failed to set session status on response processing error:", e));
  } finally {
    isSendingMessage = false;
  }
}
async function handleBackgroundMsgError(message) {
  console.error(`Orchestrator: Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
  showError(`Error processing request: ${message.error}`);
  const sessionId = getActiveSessionIdFunc$1();
  if (sessionId && message.chatId === sessionId && message.messageId) {
    console.log(`Orchestrator: Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
    const errorPayload = { isLoading: false, sender: "error", text: `Error: ${message.error}` };
    const errorUpdateRequest = new DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
    const statusRequest = new DbUpdateStatusRequest(sessionId, "error");
    try {
      await requestDbAndWait$1(errorUpdateRequest);
      console.log(`Orchestrator: Error message update successful for session ${sessionId}.`);
      await requestDbAndWait$1(statusRequest);
      console.log(`Orchestrator: Session ${sessionId} status set to 'error'.`);
    } catch (dbError) {
      console.error("Orchestrator: Error updating chat/status on background error:", dbError);
      showError(`Failed to update chat with error status: ${dbError.message}`);
      try {
        await requestDbAndWait$1(new DbUpdateStatusRequest(sessionId, "error"));
      } catch (statusError) {
        console.error("Failed to set session status on error handling error:", statusError);
      }
    }
  } else {
    console.warn(`Orchestrator: Received error, but no active session ID (${sessionId}) or message ID (${message.messageId}) matches the error context (${message.chatId}). Not updating DB.`);
  }
  isSendingMessage = false;
}
async function handleBackgroundScrapeStage(payload) {
  const { stage, success, chatId, messageId, error, ...rest } = payload;
  console.log(`Orchestrator: handleBackgroundScrapeStage Stage ${stage}, chatId: ${chatId}, Success: ${success}`);
  let updatePayload = {};
  let finalStatus = "idle";
  if (success) {
    console.log(`Orchestrator: Scrape stage ${stage} succeeded for chat ${chatId}.`);
    const successText = `Full Scrape Result: ${rest.title || "No Title"}`;
    updatePayload = {
      isLoading: false,
      sender: "system",
      text: successText,
      // Main text shown outside bubble if needed
      metadata: {
        type: "scrape_result_full",
        scrapeData: rest
        // Put the full data here for the renderer
      }
    };
    finalStatus = "idle";
  } else {
    const errorText = error || `Scraping failed (Stage ${stage}). Unknown error.`;
    console.error(`Orchestrator: Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
    updatePayload = { isLoading: false, sender: "error", text: `Scraping failed (Stage ${stage}): ${errorText}` };
    finalStatus = "error";
  }
  try {
    console.log(`Orchestrator: Updating message ${messageId} for stage ${stage} result.`);
    const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
    await requestDbAndWait$1(updateRequest);
    console.log(`Orchestrator: Updated placeholder ${messageId} with stage ${stage} result.`);
    console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
    const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
    await requestDbAndWait$1(statusRequest);
  } catch (dbError) {
    console.error(`Orchestrator: Failed to update DB after stage ${stage} result:`, dbError);
    showError(`Failed to update chat with scrape result: ${dbError.message || dbError}`);
    if (finalStatus !== "error") {
      try {
        const fallbackStatusRequest = new DbUpdateStatusRequest(chatId, "error");
        await requestDbAndWait$1(fallbackStatusRequest);
      } catch (fallbackError) {
        console.error("Failed to set fallback error status:", fallbackError);
      }
    }
  } finally {
    isSendingMessage = false;
    console.log("Orchestrator: Resetting isSendingMessage after processing scrape stage result.");
  }
}
async function handleBackgroundDirectScrapeResult(message) {
  const { chatId, messageId, success, error, ...scrapeData } = message;
  console.log(`Orchestrator: handleBackgroundDirectScrapeResult for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
  const updatePayload = { isLoading: false };
  if (success) {
    updatePayload.sender = "system";
    updatePayload.text = `Full Scrape Result: ${scrapeData.title || "Scraped Content"}`;
    updatePayload.metadata = {
      type: "scrape_result_full",
      scrapeData
    };
  } else {
    updatePayload.sender = "error";
    updatePayload.text = `Scraping failed: ${error || "Unknown error."}`;
  }
  try {
    const updateRequest = new DbUpdateMessageRequest(chatId, messageId, updatePayload);
    await requestDbAndWait$1(updateRequest);
    const finalStatus = success ? "idle" : "error";
    console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
    const statusRequest = new DbUpdateStatusRequest(chatId, finalStatus);
    await requestDbAndWait$1(statusRequest);
  } catch (error2) {
    console.error(`Orchestrator: Error handling direct scrape result for chat ${chatId}:`, error2);
    showError(`Failed to update chat with direct scrape result: ${error2.message || error2}`);
    const statusRequest = new DbUpdateStatusRequest(chatId, "error");
    requestDbAndWait$1(statusRequest).catch((e) => console.error("Failed to set session status on direct scrape processing error:", e));
  } finally {
    isSendingMessage = false;
  }
}
let getActiveSessionIdFunc = null;
let ui = null;
function initializeFileHandling(dependencies) {
  getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
  ui = dependencies.uiController;
  if (
    /*!db || !renderer ||*/
    !getActiveSessionIdFunc || !ui
  ) {
    console.error("FileHandler: Missing getActiveSessionIdFunc or uiController dependency!");
  } else {
    console.log("[FileHandler] Initialized (Note: DB/Renderer interaction via events assumed).");
  }
}
async function handleFileSelected(event) {
  if (
    /*!db || !renderer || */
    !getActiveSessionIdFunc
  ) {
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
    event.target.value = "";
    return;
  }
  const fileMessage = {
    sender: "system",
    text: `📎 Attached file: ${file.name}`,
    timestamp: Date.now(),
    isLoading: false
    // TODO: Add file metadata if needed
  };
  try {
    const request = new DbAddMessageRequest(sessionId, fileMessage);
    eventBus.publish(DbAddMessageRequest.name, request);
    console.log("[FileHandler] Published DbAddMessageRequest for file attachment.");
  } catch (error) {
    console.error("FileHandler: Error publishing file attachment message event:", error);
    showError("Failed to process file attachment.");
  } finally {
    event.target.value = "";
  }
}
function handleAttachClick() {
  if (!ui) {
    console.error("FileHandler: UI Controller not available to trigger file input.");
    return;
  }
  console.log("FileHandler: Triggering file input click.");
  ui.triggerFileInputClick();
}
const previewIconSvg = `<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`;
const trashIconSvg = `<svg class="w-4 h-4 action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.8798 20.1818C17.1169 21 15.8356 21 13.2731 21H10.7269C8.16438 21 6.8831 21 6.12019 20.1818C5.35728 19.3671 5.27811 18.0864 5.11973 15.5251L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.5 5.5L16.1733 3.57923C16.0596 2.8469 15.9989 2.48073 15.8184 2.21449C15.638 1.94825 15.362 1.75019 15.039 1.67153C14.7158 1.59286 14.3501 1.59286 13.6186 1.59286H10.3814C9.64993 1.59286 9.28419 1.59286 8.96099 1.67153C8.63796 1.75019 8.36201 1.94825 8.18156 2.21449C8.00111 2.48073 7.9404 2.8469 7.82672 3.57923L7.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 action-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>`;
const shareIconSvg = `<img src="icons/broken-link-chain-svgrepo-com.svg" alt="Share" class="w-4 h-4 action-icon-img">`;
function startEditing(historyItemElement) {
  if (!historyItemElement) return;
  const previewSpan = historyItemElement.querySelector(".history-item-preview");
  const renameInput = historyItemElement.querySelector(".history-item-rename-input");
  if (!previewSpan || !renameInput) return;
  historyItemElement.classList.add("is-editing");
  previewSpan.style.display = "none";
  renameInput.style.display = "block";
  renameInput.value = previewSpan.textContent;
  renameInput.focus();
  renameInput.select();
}
function cancelEditing(historyItemElement) {
  if (!historyItemElement) return;
  const previewSpan = historyItemElement.querySelector(".history-item-preview");
  const renameInput = historyItemElement.querySelector(".history-item-rename-input");
  if (!previewSpan || !renameInput) return;
  renameInput.style.display = "none";
  previewSpan.style.display = "block";
  historyItemElement.classList.remove("is-editing");
}
function renderHistoryItemComponent(props) {
  const {
    entry,
    onStarClick = () => {
    },
    onDownloadClick = () => {
    },
    onDeleteClick = () => {
    },
    onLoadClick = () => {
    },
    onRenameSubmit = () => {
    },
    onShareClick = () => {
    },
    onPreviewClick = () => {
    }
  } = props;
  if (!entry || !entry.id) {
    console.error("renderHistoryItemComponent: Invalid entry data provided", entry);
    return null;
  }
  const item = document.createElement("div");
  item.className = "history-item group relative mb-2";
  item.dataset.id = entry.id;
  if (entry.isStarred) {
    item.classList.add("starred");
  }
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleString();
  const previewText = entry.title || (entry.messages && entry.messages.length > 0 ? (entry.messages[0].text || "").substring(0, 50) + "..." : "Empty chat");
  const starIconSrc = entry.isStarred ? "icons/StarFilled.png" : "icons/StarHollow.png";
  const starToggleClass = entry.isStarred ? "starred" : "unstarred";
  item.innerHTML = `
        <div class="chat-card bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-3 flex flex-col justify-between min-h-[100px]">
            <div>
                <div class="card-header flex justify-between items-center mb-2">
                    <button data-action="toggle-star" class="action-button history-item-star-toggle ${starToggleClass}" title="Toggle Star">
                         <img src="${starIconSrc}" alt="Star" class="w-4 h-4 action-icon-img ${entry.isStarred ? "" : "icon-unstarred"}">
                    </button>
                    <div class="actions flex items-center space-x-1">
                        <!-- Normal Actions (initially visible) -->
                        <div class="normal-actions flex items-center space-x-1" data-normal-container>
                             <button data-action="download-chat" class="action-button" title="Download">${downloadIconSvg}</button>
                             <button data-action="share-chat" class="action-button" title="Share">${shareIconSvg}</button>
                             <button data-action="delete-chat" class="action-button text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" title="Delete">${trashIconSvg}</button>
                             <button data-action="preview-chat" class="action-button history-item-preview-btn" title="Preview">${previewIconSvg}</button>
                        </div>
                        <!-- Confirm Delete Actions (initially hidden) -->
                        <div class="confirm-delete-actions hidden flex items-center space-x-1" data-confirm-container>
                            <span class="text-xs text-red-600 dark:text-red-400 mr-1">Confirm?</span>
                            <button data-action="confirm-delete" class="action-button text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title="Confirm Delete">
                                <svg class="w-4 h-4 action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <!-- Checkmark -->
                            </button>
                            <button data-action="cancel-delete" class="action-button text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Cancel Delete">
                                <svg class="w-4 h-4 action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> <!-- X mark -->
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body mb-1">
                    <div class="history-item-preview font-semibold text-sm truncate" title="${previewText}">${previewText}</div>
                    <input type="text" class="history-item-rename-input w-full text-sm p-1 border rounded" value="${previewText}" style="display: none;"/>
                </div>
                <div class="history-item-preview-content hidden mt-2 p-2 border-t border-gray-200 dark:border-gray-600 text-xs max-h-24 overflow-y-auto">
                     <!-- Preview content will be loaded here -->
                </div>
            </div>
            <div class="card-footer mt-auto flex justify-between items-center">
                 <span class="history-item-date text-xs text-gray-500 dark:text-gray-400">${formattedDate}</span>
                 <button class="history-item-load-btn text-xs p-0.5 rounded" data-action="load-chat" title="Load Chat">
                    <img src="icons/Load.png" alt="Load" class="h-6 w-auto">
                 </button>
            </div>
        </div>
    `;
  const previewSpan = item.querySelector(".history-item-preview");
  const renameInput = item.querySelector(".history-item-rename-input");
  if (previewSpan && renameInput) {
    previewSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startEditing(item);
    });
    renameInput.addEventListener("blur", () => {
      const newTitle = renameInput.value.trim();
      const originalTitle = previewSpan.textContent;
      if (newTitle && newTitle !== originalTitle) {
        onRenameSubmit(entry.id, newTitle);
        previewSpan.textContent = newTitle;
        previewSpan.title = newTitle;
        cancelEditing(item);
      } else {
        cancelEditing(item);
      }
    });
    renameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const newTitle = renameInput.value.trim();
        const originalTitle = previewSpan.textContent;
        if (newTitle && newTitle !== originalTitle) {
          onRenameSubmit(entry.id, newTitle);
        } else {
          cancelEditing(item);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing(item);
      }
    });
  }
  const starButton = item.querySelector('[data-action="toggle-star"]');
  if (starButton) starButton.addEventListener("click", (e) => {
    e.stopPropagation();
    onStarClick(entry.id);
  });
  const downloadButton = item.querySelector('[data-action="download-chat"]');
  if (downloadButton) downloadButton.addEventListener("click", (e) => {
    e.stopPropagation();
    onDownloadClick(entry.id);
  });
  const shareButton = item.querySelector('[data-action="share-chat"]');
  if (shareButton) shareButton.addEventListener("click", (e) => {
    e.stopPropagation();
    onShareClick(entry.id);
  });
  const deleteButton = item.querySelector('[data-action="delete-chat"]');
  const normalActionsContainer = item.querySelector("[data-normal-container]");
  const confirmActionsContainer = item.querySelector("[data-confirm-container]");
  const confirmDeleteButton = item.querySelector('[data-action="confirm-delete"]');
  const cancelDeleteButton = item.querySelector('[data-action="cancel-delete"]');
  if (deleteButton && normalActionsContainer && confirmActionsContainer) {
    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (item.classList.contains("is-editing")) {
        cancelEditing(item);
      }
      item.classList.add("is-confirming-delete");
      normalActionsContainer.classList.add("hidden");
      confirmActionsContainer.classList.remove("hidden");
    });
  }
  if (cancelDeleteButton && normalActionsContainer && confirmActionsContainer) {
    cancelDeleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.remove("is-confirming-delete");
      normalActionsContainer.classList.remove("hidden");
      confirmActionsContainer.classList.add("hidden");
    });
  }
  if (confirmDeleteButton && normalActionsContainer && confirmActionsContainer) {
    confirmDeleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.remove("is-confirming-delete");
      onDeleteClick(entry.id, item);
    });
  }
  const previewButton = item.querySelector('[data-action="preview-chat"]');
  const previewContentDiv = item.querySelector(".history-item-preview-content");
  if (previewButton && previewContentDiv) {
    previewButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isPreviewVisible = !previewContentDiv.classList.contains("hidden");
      if (isPreviewVisible) {
        previewContentDiv.classList.add("hidden");
        previewContentDiv.innerHTML = "";
        item.classList.remove("preview-active");
        previewButton.innerHTML = previewIconSvg;
        console.log(`HistoryItem: Hiding preview for ${entry.id}`);
      } else {
        document.querySelectorAll(".history-item.preview-active").forEach((activeItem) => {
          if (activeItem !== item) {
            const otherPreviewDiv = activeItem.querySelector(".history-item-preview-content");
            const otherPreviewBtn = activeItem.querySelector('[data-action="preview-chat"]');
            if (otherPreviewDiv) {
              otherPreviewDiv.classList.add("hidden");
              otherPreviewDiv.innerHTML = "";
            }
            activeItem.classList.remove("preview-active");
            if (otherPreviewBtn) otherPreviewBtn.innerHTML = previewIconSvg;
          }
        });
        item.classList.add("preview-active");
        previewButton.innerHTML = '<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>';
        previewContentDiv.classList.remove("hidden");
        console.log(`HistoryItem: Requesting preview for ${entry.id}`);
        onPreviewClick(entry.id, previewContentDiv);
      }
    });
  }
  const loadButton = item.querySelector('[data-action="load-chat"]');
  if (loadButton) loadButton.addEventListener("click", (e) => {
    e.stopPropagation();
    onLoadClick(entry.id);
  });
  item.querySelector(".card-body");
  return item;
}
function formatChatToHtml(sessionData) {
  if (!sessionData) return "";
  const title = sessionData.title || "Chat Session";
  const messagesHtml = (sessionData.messages || []).map((msg) => {
    const senderClass = msg.sender === "user" ? "user-message" : "other-message";
    const senderLabel = msg.sender === "user" ? "You" : msg.sender === "ai" ? "Agent" : "System";
    const escapedText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const formattedText = escapedText.replace(/\n/g, "<br>");
    return `
            <div class="message-row ${senderClass === "user-message" ? "row-user" : "row-other"}">
                <div class="message-bubble ${senderClass}">
                    <span class="sender-label">${senderLabel}:</span>
                    <div class="message-text">${formattedText}</div>
                </div>
            </div>
        `;
  }).join("\n");
  const css = `
        body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #212529; }
        .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 0; }
        .chat-body { margin-top: 20px; }
        .message-row { margin-bottom: 15px; overflow: hidden; /* Clear floats */ }
        .row-user { text-align: right; }
        .row-other { text-align: left; }
        .message-bubble { display: inline-block; padding: 10px 15px; border-radius: 15px; max-width: 75%; word-wrap: break-word; }
        .user-message { background-color: #007bff; color: white; margin-left: auto; /* Align right */ }
        .other-message { background-color: #e9ecef; color: #343a40; margin-right: auto; /* Align left */ }
        .sender-label { font-weight: bold; display: block; margin-bottom: 5px; font-size: 0.9em; color: inherit; }
        .message-text { margin-top: 5px; }
    `;
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <h1>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
                <div class="chat-body">
                    ${messagesHtml}
                </div>
            </div>
        </body>
        </html>
    `;
}
function downloadHtmlFile(htmlContent, filename, onError) {
  try {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    console.log(`Initiating download for: ${filename} (prompting user)`);
    chrome.downloads.download({
      url,
      filename,
      saveAs: true
    }, (downloadId) => {
      const lastError = chrome.runtime.lastError;
      setTimeout(() => URL.revokeObjectURL(url), 100);
      if (lastError) {
        const message = lastError.message;
        console.error("Download API error:", message);
        if (!message || !message.toLowerCase().includes("cancel")) {
          if (onError) {
            onError(`Download failed: ${message || "Unknown error"}`);
          } else {
            console.error("No error handler provided for download failure.");
            alert(`Download failed: ${message || "Unknown error"}. Ensure extension has permissions.`);
          }
        } else {
          console.log("Download cancelled by user.");
        }
      } else if (downloadId) {
        console.log(`Download initiated (or dialog opened) with ID: ${downloadId}`);
      } else {
        console.log("Download cancelled by user (no downloadId assigned).");
      }
    });
  } catch (error) {
    console.error("Error creating blob or initiating download:", error);
    if (onError) {
      onError("An error occurred while preparing the download.");
    } else {
      console.error("No error handler provided for download preparation error.");
      alert("An error occurred while preparing the download.");
    }
  }
}
async function initiateChatDownload(sessionId, requestDbAndWaitFunc2, showNotificationFunc) {
  if (!sessionId || !requestDbAndWaitFunc2 || !showNotificationFunc) {
    console.error("[initiateChatDownload] Failed: Missing sessionId, requestDbAndWaitFunc, or showNotificationFunc.");
    if (showNotificationFunc) showNotificationFunc("Download failed due to internal error.", "error");
    return;
  }
  console.log(`[initiateChatDownload] Preparing download for: ${sessionId}`);
  showNotificationFunc("Preparing download...", "info");
  try {
    const sessionData = await requestDbAndWaitFunc2(new DbGetSessionRequest(sessionId));
    if (!sessionData) {
      throw new Error("Chat session data not found.");
    }
    const htmlContent = formatChatToHtml(sessionData);
    const safeTitle = (sessionData.title || sessionData.name || "Chat_Session").replace(/[^a-z0-9_\-\.]/gi, "_").replace(/_{2,}/g, "_");
    const filename = `${safeTitle}_${sessionId.substring(0, 8)}.html`;
    downloadHtmlFile(htmlContent, filename, (errorMessage) => {
      showNotificationFunc(errorMessage, "error");
    });
  } catch (error) {
    console.error(`[initiateChatDownload] Error preparing download for ${sessionId}:`, error);
    showNotificationFunc(`Failed to prepare download: ${error.message}`, "error");
  }
}
let isInitialized$4 = false;
let historyPopupElement = null;
let historyListElement = null;
let historySearchElement = null;
let closeHistoryButtonElement = null;
let requestDbAndWaitFunc$1 = null;
let currentHistoryItems = [];
let currentSearchTerm = "";
function handleSessionUpdate$1(notification) {
  if (!isInitialized$4 || !notification || !notification.sessionId || !notification.payload) {
    console.warn("[HistoryPopupController] Invalid session update notification received.", notification);
    return;
  }
  const updatedSessionData = notification.payload.session;
  const sessionId = notification.sessionId;
  const updateType = notification.payload.updateType || "update";
  if (!updatedSessionData) {
    console.warn(`[HistoryPopupController] Session update notification for ${sessionId} missing session data.`, notification);
    return;
  }
  console.log(`[HistoryPopupController] Received session update for ${sessionId}. Type: ${updateType}, New starred: ${updatedSessionData.isStarred}`);
  const itemIndex = currentHistoryItems.findIndex((item) => item.id === sessionId);
  let listChanged = false;
  if (updateType === "delete") {
    if (itemIndex !== -1) {
      console.log(`[HistoryPopupController] Removing deleted session ${sessionId} from local list.`);
      currentHistoryItems.splice(itemIndex, 1);
      listChanged = true;
    }
  } else {
    if (itemIndex !== -1) {
      console.log(`[HistoryPopupController] Updating session ${sessionId} in local list.`);
      currentHistoryItems[itemIndex] = {
        ...currentHistoryItems[itemIndex],
        // Preserve existing data
        ...updatedSessionData
        // Overwrite with new data
      };
      listChanged = true;
    } else {
      console.log(`[HistoryPopupController] Adding new/updated session ${sessionId} to local list.`);
      currentHistoryItems.push(updatedSessionData);
      listChanged = true;
    }
  }
  if (listChanged && historyPopupElement && !historyPopupElement.classList.contains("hidden")) {
    console.log(`[HistoryPopupController] Popup visible and list changed, calling renderHistoryList()`);
    renderHistoryList();
  } else {
    console.log(`[HistoryPopupController] Popup not visible or list unchanged, skipping renderHistoryList()`);
  }
}
function renderHistoryList() {
  if (!isInitialized$4 || !historyListElement) return;
  console.log(`[HistoryPopupController] Rendering history list (Search: "${currentSearchTerm}")...`);
  let filteredItems = currentHistoryItems;
  if (currentSearchTerm) {
    const lowerCaseTerm = currentSearchTerm.toLowerCase();
    filteredItems = currentHistoryItems.filter(
      (entry) => (entry.name || "").toLowerCase().includes(lowerCaseTerm)
    );
    console.log(`[HistoryPopupController] Filtered down to ${filteredItems.length} sessions.`);
  } else {
    console.log(`[HistoryPopupController] Rendering all ${filteredItems.length} sessions (no search term).`);
  }
  historyListElement.innerHTML = "";
  if (filteredItems.length === 0) {
    const message = currentSearchTerm ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No history items match "${currentSearchTerm}".</p>` : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No chat history yet.</p>';
    historyListElement.innerHTML = message;
  } else {
    filteredItems.forEach((entry) => {
      const props = {
        entry: {
          id: entry.id,
          name: entry.title,
          title: entry.title,
          timestamp: entry.timestamp,
          isStarred: entry.isStarred,
          messages: []
          // Placeholder
        },
        onLoadClick: handleLoadClick$1,
        onStarClick: handleStarClick$1,
        onDeleteClick: handleDeleteClick$1,
        onRenameSubmit: handleRenameSubmit$1,
        onDownloadClick: handleDownloadClick$1,
        onShareClick: handleShareClick$1,
        onPreviewClick: handlePreviewClick$1
      };
      const itemElement = renderHistoryItemComponent(props);
      if (itemElement) {
        historyListElement.appendChild(itemElement);
      }
    });
  }
  console.log("[HistoryPopupController] History list rendered.");
}
async function showPopup() {
  if (!isInitialized$4 || !historyPopupElement || !requestDbAndWaitFunc$1) return;
  console.log("[HistoryPopupController] Showing popup. Fetching latest history...");
  try {
    const sessionsArray = await requestDbAndWaitFunc$1(new DbGetAllSessionsRequest());
    console.log("[HistoryPopupController:Debug] Fetched sessionsArray:", sessionsArray);
    if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
      console.log("[HistoryPopupController:Debug] First session item sample:", sessionsArray[0]);
    } else if (sessionsArray === null || sessionsArray === void 0) {
      console.log("[HistoryPopupController:Debug] sessionsArray is null or undefined.");
    } else {
      console.log("[HistoryPopupController:Debug] sessionsArray is empty or not an array:", typeof sessionsArray);
    }
    currentHistoryItems = sessionsArray || [];
    console.log(`[HistoryPopupController] Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
    renderHistoryList();
    historyPopupElement.classList.remove("hidden");
  } catch (error) {
    console.error("[HistoryPopupController] Error fetching history list:", error);
    showNotification$1("Failed to load history.", "error");
    if (historyListElement) {
      historyListElement.innerHTML = '<p class="p-4 text-center text-red-500 dark:text-red-400">Error loading history. Please try again.</p>';
    }
    historyPopupElement.classList.remove("hidden");
  }
}
function hidePopup() {
  if (!isInitialized$4 || !historyPopupElement) return;
  console.log("[HistoryPopupController] Hiding popup.");
  historyPopupElement.classList.add("hidden");
}
function handleSearchInput$1(event) {
  if (!isInitialized$4) return;
  currentSearchTerm = event.target.value.trim();
  renderHistoryList();
}
async function handleLoadClick$1(sessionId) {
  console.log(`[HistoryPopupController] Load clicked: ${sessionId}`);
  if (!sessionId) return;
  try {
    await browser.storage.local.set({ lastSessionId: sessionId });
    navigateTo("page-home");
    hidePopup();
  } catch (error) {
    console.error("[HistoryPopupController] Error setting storage or navigating:", error);
    showNotification$1("Failed to load chat.", "error");
  }
}
async function handleStarClick$1(sessionId) {
  if (!sessionId || !requestDbAndWaitFunc$1) return;
  console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
  try {
    await requestDbAndWaitFunc$1(new DbToggleStarRequest(sessionId));
    showNotification$1("Star toggled", "success");
  } catch (error) {
    console.error("[HistoryPopupController] Error toggling star:", error);
    showNotification$1(`Failed to toggle star: ${error.message}`, "error");
  }
}
async function handleDeleteClick$1(sessionId, itemElement) {
  var _a2;
  if (!sessionId || !itemElement || !requestDbAndWaitFunc$1) return;
  console.log(`[HistoryPopupController] Delete confirmed inline for: ${sessionId}. Applying deleting state.`);
  itemElement.classList.add("is-deleting");
  itemElement.querySelectorAll("button").forEach((btn) => btn.disabled = true);
  const footer = itemElement.querySelector(".card-footer");
  const existingMsg = footer == null ? void 0 : footer.querySelector(".deleting-message");
  if (footer && !existingMsg) {
    const deletingMsg = document.createElement("span");
    deletingMsg.textContent = "Deleting...";
    deletingMsg.className = "text-xs text-red-500 ml-2 deleting-message";
    footer.appendChild(deletingMsg);
  }
  try {
    await requestDbAndWaitFunc$1(new DbDeleteSessionRequest(sessionId));
    showNotification$1("Chat deletion initiated...", "info");
  } catch (error) {
    console.error("[HistoryPopupController] Error deleting chat:", error);
    showNotification$1(`Failed to delete chat: ${error.message}`, "error");
    itemElement.classList.remove("is-deleting");
    itemElement.querySelectorAll("button").forEach((btn) => btn.disabled = false);
    (_a2 = footer == null ? void 0 : footer.querySelector(".deleting-message")) == null ? void 0 : _a2.remove();
    const normalActionsContainer = itemElement.querySelector("[data-normal-container]");
    if (normalActionsContainer) normalActionsContainer.classList.remove("hidden");
    const confirmActionsContainer = itemElement.querySelector("[data-confirm-container]");
    if (confirmActionsContainer) confirmActionsContainer.classList.add("hidden");
  }
}
async function handleRenameSubmit$1(sessionId, newName) {
  if (!sessionId || !newName || !requestDbAndWaitFunc$1) return;
  console.log(`[HistoryPopupController] Rename submitted: ${sessionId} to "${newName}"`);
  try {
    await requestDbAndWaitFunc$1(new DbRenameSessionRequest(sessionId, newName));
    showNotification$1("Rename successful", "success");
  } catch (error) {
    console.error("[HistoryPopupController] Error submitting rename:", error);
    showNotification$1(`Failed to rename chat: ${error.message}`, "error");
  }
}
async function handleDownloadClick$1(sessionId) {
  if (requestDbAndWaitFunc$1) {
    initiateChatDownload(sessionId, requestDbAndWaitFunc$1, showNotification$1);
  } else {
    console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
    showNotification$1("Download failed: Internal setup error.", "error");
  }
}
function handleShareClick$1(sessionId) {
}
async function handlePreviewClick$1(sessionId, contentElement) {
  if (!sessionId || !contentElement || !requestDbAndWaitFunc$1) {
    console.error("[HistoryPopupController] Preview failed: Missing sessionId, contentElement, or requestDbAndWaitFunc.");
    return;
  }
  console.log(`[HistoryPopupController] Handling preview click for: ${sessionId}`);
  contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 italic text-xs">Loading preview...</span>';
  try {
    const sessionData = await requestDbAndWaitFunc$1(new DbGetSessionRequest(sessionId));
    if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
      contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">No messages in this chat.</span>';
      return;
    }
    const messagesToPreview = sessionData.messages.slice(0, 3);
    const previewHtml = messagesToPreview.map((msg) => {
      const sender = msg.sender === "user" ? "You" : msg.sender === "ai" ? "Agent" : "System";
      const text = (msg.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 100) + (msg.text && msg.text.length > 100 ? "..." : "");
      return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
    }).join("");
    contentElement.innerHTML = previewHtml;
  } catch (error) {
    console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, error);
    contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${error.message}</span>`;
  }
}
function initializeHistoryPopup(elements, requestFunc) {
  console.log("[HistoryPopupController] Entering initializeHistoryPopup...");
  if (!elements || !elements.popupContainer || !elements.listContainer || !elements.searchInput || !elements.closeButton || !requestFunc) {
    console.error("[HistoryPopupController] Initialization failed: Missing required elements or request function.", { elements, requestFunc });
    return null;
  }
  historyPopupElement = elements.popupContainer;
  historyListElement = elements.listContainer;
  historySearchElement = elements.searchInput;
  closeHistoryButtonElement = elements.closeButton;
  requestDbAndWaitFunc$1 = requestFunc;
  console.log("[HistoryPopupController] Elements and request function assigned.");
  try {
    closeHistoryButtonElement.addEventListener("click", hidePopup);
    const debouncedSearchHandler = debounce(handleSearchInput$1, 300);
    historySearchElement.addEventListener("input", debouncedSearchHandler);
    console.log("[HistoryPopupController] Event listeners attached.");
    eventBus$1.subscribe(DbSessionUpdatedNotification.name, handleSessionUpdate$1);
    console.log("[HistoryPopupController] Subscribed to DbSessionUpdatedNotification for passive updates.");
    isInitialized$4 = true;
    console.log("[HistoryPopupController] Initialization successful. History will be rendered when popup is shown.");
    return {
      show: showPopup,
      hide: hidePopup
      // No need for refresh if updates are passive and render happens on show
    };
  } catch (error) {
    console.error("[HistoryPopupController] Error during initialization listeners/subscriptions:", error);
    isInitialized$4 = false;
    return null;
  }
}
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t);
}
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
    writable: false
  }), e;
}
function lastOfArray$1(ar) {
  return ar[ar.length - 1];
}
function toArray(input) {
  return Array.isArray(input) ? input.slice(0) : [input];
}
function batchArray(array, batchSize) {
  array = array.slice(0);
  var ret = [];
  while (array.length) {
    var batch = array.splice(0, batchSize);
    ret.push(batch);
  }
  return ret;
}
function isMaybeReadonlyArray(x) {
  return Array.isArray(x);
}
function countUntilNotMatching(ar, matchingFn) {
  var count = 0;
  var idx = -1;
  for (var item of ar) {
    idx = idx + 1;
    var matching = matchingFn(item, idx);
    if (matching) {
      count = count + 1;
    } else {
      break;
    }
  }
  return count;
}
function appendToArray(ar, add2) {
  var addSize = add2.length;
  if (addSize === 0) {
    return;
  }
  var baseSize = ar.length;
  ar.length = baseSize + add2.length;
  for (var i = 0; i < addSize; ++i) {
    ar[baseSize + i] = add2[i];
  }
}
function uniqueArray(arrArg) {
  return arrArg.filter(function(elem, pos, arr) {
    return arr.indexOf(elem) === pos;
  });
}
function getHeightOfRevision(revision) {
  var useChars = "";
  for (var index = 0; index < revision.length; index++) {
    var char = revision[index];
    if (char === "-") {
      return parseInt(useChars, 10);
    }
    useChars += char;
  }
  throw new Error("malformatted revision: " + revision);
}
function createRevision(databaseInstanceToken, previousDocData) {
  var newRevisionHeight = !previousDocData ? 1 : getHeightOfRevision(previousDocData._rev) + 1;
  return newRevisionHeight + "-" + databaseInstanceToken;
}
function objectPathMonad(objectPath) {
  var split = objectPath.split(".");
  var splitLength = split.length;
  if (splitLength === 1) {
    return (obj) => obj[objectPath];
  }
  return (obj) => {
    var currentVal = obj;
    for (var i = 0; i < splitLength; ++i) {
      var subPath = split[i];
      currentVal = currentVal[subPath];
      if (typeof currentVal === "undefined") {
        return currentVal;
      }
    }
    return currentVal;
  };
}
function flatClone(obj) {
  return Object.assign({}, obj);
}
function firstPropertyNameOfObject(obj) {
  return Object.keys(obj)[0];
}
function sortObject(obj, noArraySort = false) {
  if (!obj) return obj;
  if (!noArraySort && Array.isArray(obj)) {
    return obj.sort((a, b) => {
      if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
      if (typeof a === "object") return 1;
      else return -1;
    }).map((i) => sortObject(i, noArraySort));
  }
  if (typeof obj === "object" && !Array.isArray(obj)) {
    var out = {};
    Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach((key) => {
      out[key] = sortObject(obj[key], noArraySort);
    });
    return out;
  }
  return obj;
}
function deepClone(src) {
  if (!src) {
    return src;
  }
  if (src === null || typeof src !== "object") {
    return src;
  }
  if (Array.isArray(src)) {
    var ret = new Array(src.length);
    var i = ret.length;
    while (i--) {
      ret[i] = deepClone(src[i]);
    }
    return ret;
  }
  var dest = {};
  for (var key in src) {
    dest[key] = deepClone(src[key]);
  }
  return dest;
}
var clone$1 = deepClone;
function overwriteGetterForCaching(obj, getterName, value) {
  Object.defineProperty(obj, getterName, {
    get: function() {
      return value;
    }
  });
  return value;
}
var RX_META_LWT_MINIMUM = 1;
function getDefaultRxDocumentMeta() {
  return {
    /**
     * Set this to 1 to not waste performance
     * while calling new Date()..
     * The storage wrappers will anyway update
     * the lastWrite time while calling transformDocumentDataFromRxDBToRxStorage()
     */
    lwt: RX_META_LWT_MINIMUM
  };
}
function getDefaultRevision() {
  return "";
}
function stripMetaDataFromDocument(docData) {
  return Object.assign({}, docData, {
    _meta: void 0,
    _deleted: void 0,
    _rev: void 0
  });
}
function areRxDocumentArraysEqual(primaryPath, ar1, ar2) {
  if (ar1.length !== ar2.length) {
    return false;
  }
  var i = 0;
  var len = ar1.length;
  while (i < len) {
    var row1 = ar1[i];
    var row2 = ar2[i];
    i++;
    if (row1._rev !== row2._rev || row1[primaryPath] !== row2[primaryPath]) {
      return false;
    }
  }
  return true;
}
async function nativeSha256(input) {
  var data = new TextEncoder().encode(input);
  var hashBuffer = await crypto.subtle.digest("SHA-256", data);
  var hash = Array.prototype.map.call(new Uint8Array(hashBuffer), (x) => ("00" + x.toString(16)).slice(-2)).join("");
  return hash;
}
var defaultHashSha256 = nativeSha256;
function nextTick() {
  return new Promise((res) => setTimeout(res, 0));
}
function promiseWait(ms = 0) {
  return new Promise((res) => setTimeout(res, ms));
}
function toPromise(maybePromise) {
  if (maybePromise && typeof maybePromise.then === "function") {
    return maybePromise;
  } else {
    return Promise.resolve(maybePromise);
  }
}
var PROMISE_RESOLVE_TRUE = Promise.resolve(true);
var PROMISE_RESOLVE_FALSE = Promise.resolve(false);
var PROMISE_RESOLVE_NULL = Promise.resolve(null);
var PROMISE_RESOLVE_VOID = Promise.resolve();
function requestIdlePromiseNoQueue(timeout = 1e4) {
  if (typeof requestIdleCallback === "function") {
    return new Promise((res) => {
      requestIdleCallback(() => res(), {
        timeout
      });
    });
  } else {
    return promiseWait(0);
  }
}
var idlePromiseQueue = PROMISE_RESOLVE_VOID;
function requestIdlePromise(timeout = void 0) {
  idlePromiseQueue = idlePromiseQueue.then(() => {
    return requestIdlePromiseNoQueue(timeout);
  });
  return idlePromiseQueue;
}
function promiseSeries(tasks, initial) {
  return tasks.reduce((current, next) => current.then(next), Promise.resolve(initial));
}
var REGEX_ALL_DOTS = /\./g;
var COUCH_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz";
function randomToken$1(length = 10) {
  var text = "";
  for (var i = 0; i < length; i++) {
    text += COUCH_NAME_CHARS.charAt(Math.floor(Math.random() * COUCH_NAME_CHARS.length));
  }
  return text;
}
function ucfirst(str) {
  str += "";
  var f = str.charAt(0).toUpperCase();
  return f + str.substr(1);
}
function trimDots(str) {
  while (str.charAt(0) === ".") {
    str = str.substr(1);
  }
  while (str.slice(-1) === ".") {
    str = str.slice(0, -1);
  }
  return str;
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;
    var length;
    var i;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0; ) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
    var keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    for (i = length; i-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    for (i = length; i-- !== 0; ) {
      var key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return a !== a && b !== b;
}
var isObject$3 = (value) => {
  var type2 = typeof value;
  return value !== null && (type2 === "object" || type2 === "function");
};
var disallowedKeys = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
var digits = new Set("0123456789");
function getPathSegments(path) {
  var parts = [];
  var currentSegment = "";
  var currentPart = "start";
  var isIgnoring = false;
  for (var character of path) {
    switch (character) {
      case "\\": {
        if (currentPart === "index") {
          throw new Error("Invalid character in an index");
        }
        if (currentPart === "indexEnd") {
          throw new Error("Invalid character after an index");
        }
        if (isIgnoring) {
          currentSegment += character;
        }
        currentPart = "property";
        isIgnoring = !isIgnoring;
        break;
      }
      case ".": {
        if (currentPart === "index") {
          throw new Error("Invalid character in an index");
        }
        if (currentPart === "indexEnd") {
          currentPart = "property";
          break;
        }
        if (isIgnoring) {
          isIgnoring = false;
          currentSegment += character;
          break;
        }
        if (disallowedKeys.has(currentSegment)) {
          return [];
        }
        parts.push(currentSegment);
        currentSegment = "";
        currentPart = "property";
        break;
      }
      case "[": {
        if (currentPart === "index") {
          throw new Error("Invalid character in an index");
        }
        if (currentPart === "indexEnd") {
          currentPart = "index";
          break;
        }
        if (isIgnoring) {
          isIgnoring = false;
          currentSegment += character;
          break;
        }
        if (currentPart === "property") {
          if (disallowedKeys.has(currentSegment)) {
            return [];
          }
          parts.push(currentSegment);
          currentSegment = "";
        }
        currentPart = "index";
        break;
      }
      case "]": {
        if (currentPart === "index") {
          parts.push(Number.parseInt(currentSegment, 10));
          currentSegment = "";
          currentPart = "indexEnd";
          break;
        }
        if (currentPart === "indexEnd") {
          throw new Error("Invalid character after an index");
        }
      }
      default: {
        if (currentPart === "index" && !digits.has(character)) {
          throw new Error("Invalid character in an index");
        }
        if (currentPart === "indexEnd") {
          throw new Error("Invalid character after an index");
        }
        if (currentPart === "start") {
          currentPart = "property";
        }
        if (isIgnoring) {
          isIgnoring = false;
          currentSegment += "\\";
        }
        currentSegment += character;
      }
    }
  }
  if (isIgnoring) {
    currentSegment += "\\";
  }
  switch (currentPart) {
    case "property": {
      if (disallowedKeys.has(currentSegment)) {
        return [];
      }
      parts.push(currentSegment);
      break;
    }
    case "index": {
      throw new Error("Index was not closed");
    }
    case "start": {
      parts.push("");
      break;
    }
  }
  return parts;
}
function isStringIndex$1(object, key) {
  if (typeof key !== "number" && Array.isArray(object)) {
    var index = Number.parseInt(key, 10);
    return Number.isInteger(index) && object[index] === object[key];
  }
  return false;
}
function assertNotStringIndex(object, key) {
  if (isStringIndex$1(object, key)) {
    throw new Error("Cannot use string index");
  }
}
function getProperty$1(object, path, value) {
  if (Array.isArray(path)) {
    path = path.join(".");
  }
  if (!path.includes(".") && !path.includes("[")) {
    return object[path];
  }
  if (!isObject$3(object) || typeof path !== "string") {
    return value === void 0 ? object : value;
  }
  var pathArray = getPathSegments(path);
  if (pathArray.length === 0) {
    return value;
  }
  for (var index = 0; index < pathArray.length; index++) {
    var key = pathArray[index];
    if (isStringIndex$1(object, key)) {
      object = index === pathArray.length - 1 ? void 0 : null;
    } else {
      object = object[key];
    }
    if (object === void 0 || object === null) {
      if (index !== pathArray.length - 1) {
        return value;
      }
      break;
    }
  }
  return object === void 0 ? value : object;
}
function setProperty(object, path, value) {
  if (Array.isArray(path)) {
    path = path.join(".");
  }
  if (!isObject$3(object) || typeof path !== "string") {
    return object;
  }
  var root = object;
  var pathArray = getPathSegments(path);
  for (var index = 0; index < pathArray.length; index++) {
    var key = pathArray[index];
    assertNotStringIndex(object, key);
    if (index === pathArray.length - 1) {
      object[key] = value;
    } else if (!isObject$3(object[key])) {
      object[key] = typeof pathArray[index + 1] === "number" ? [] : {};
    }
    object = object[key];
  }
  return root;
}
function getFromMapOrThrow(map2, key) {
  var val = map2.get(key);
  if (typeof val === "undefined") {
    throw new Error("missing value from map " + key);
  }
  return val;
}
function getFromMapOrCreate(map2, index, creator, ifWasThere) {
  var value = map2.get(index);
  if (typeof value === "undefined") {
    value = creator();
    map2.set(index, value);
  }
  return value;
}
function pluginMissing(pluginKey) {
  var keyParts = pluginKey.split("-");
  var pluginName = "RxDB";
  keyParts.forEach((part) => {
    pluginName += ucfirst(part);
  });
  pluginName += "Plugin";
  return new Error("You are using a function which must be overwritten by a plugin.\n        You should either prevent the usage of this function or add the plugin via:\n            import { " + pluginName + " } from 'rxdb/plugins/" + pluginKey + "';\n            addRxPlugin(" + pluginName + ");\n        ");
}
function errorToPlainJson(err) {
  var ret = {
    name: err.name,
    message: err.message,
    rxdb: err.rxdb,
    parameters: err.parameters,
    extensions: err.extensions,
    code: err.code,
    url: err.url,
    /**
     * stack must be last to make it easier to read the json in a console.
     * Also we ensure that each linebreak is spaced so that the chrome devtools
     * shows urls to the source code that can be clicked to inspect
     * the correct place in the code.
     */
    stack: !err.stack ? void 0 : err.stack.replace(/\n/g, " \n ")
  };
  return ret;
}
var _lastNow = 0;
function now$1() {
  var ret = Date.now();
  ret = ret + 0.01;
  if (ret <= _lastNow) {
    ret = _lastNow + 0.01;
  }
  var twoDecimals = parseFloat(ret.toFixed(2));
  _lastNow = twoDecimals;
  return twoDecimals;
}
function ensureNotFalsy(obj, message) {
  if (!obj) {
    if (!message) {
      message = "";
    }
    throw new Error("ensureNotFalsy() is falsy: " + message);
  }
  return obj;
}
var RXJS_SHARE_REPLAY_DEFAULTS = {
  bufferSize: 1,
  refCount: true
};
var RXDB_VERSION = "16.11.0";
var RXDB_UTILS_GLOBAL = {};
var PREMIUM_FLAG_HASH = "6da4936d1425ff3a5c44c02342c6daf791d266be3ae8479b8ec59e261df41b93";
var NON_PREMIUM_COLLECTION_LIMIT = 16;
var hasPremiumPromise = PROMISE_RESOLVE_FALSE;
var premiumChecked = false;
async function hasPremiumFlag() {
  if (premiumChecked) {
    return hasPremiumPromise;
  }
  premiumChecked = true;
  hasPremiumPromise = (async () => {
    if (RXDB_UTILS_GLOBAL.premium && typeof RXDB_UTILS_GLOBAL.premium === "string" && await defaultHashSha256(RXDB_UTILS_GLOBAL.premium) === PREMIUM_FLAG_HASH) {
      return true;
    } else {
      return false;
    }
  })();
  return hasPremiumPromise;
}
function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t2, e2) {
    return t2.__proto__ = e2, t2;
  }, _setPrototypeOf(t, e);
}
function _inheritsLoose(t, o) {
  t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
}
function _getPrototypeOf(t) {
  return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t2) {
    return t2.__proto__ || Object.getPrototypeOf(t2);
  }, _getPrototypeOf(t);
}
function _isNativeFunction(t) {
  try {
    return -1 !== Function.toString.call(t).indexOf("[native code]");
  } catch (n) {
    return "function" == typeof t;
  }
}
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t2) {
  }
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
    return !!t;
  })();
}
function _construct(t, e, r) {
  if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
  var o = [null];
  o.push.apply(o, e);
  var p = new (t.bind.apply(t, o))();
  return r && _setPrototypeOf(p, r.prototype), p;
}
function _wrapNativeSuper(t) {
  var r = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
  return _wrapNativeSuper = function _wrapNativeSuper2(t2) {
    if (null === t2 || !_isNativeFunction(t2)) return t2;
    if ("function" != typeof t2) throw new TypeError("Super expression must either be null or a function");
    if (void 0 !== r) {
      if (r.has(t2)) return r.get(t2);
      r.set(t2, Wrapper);
    }
    function Wrapper() {
      return _construct(t2, arguments, _getPrototypeOf(this).constructor);
    }
    return Wrapper.prototype = Object.create(t2.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    }), _setPrototypeOf(Wrapper, t2);
  }, _wrapNativeSuper(t);
}
var overwritable = {
  /**
   * if this method is overwritten with one
   * that returns true, we do additional checks
   * which help the developer but have bad performance
   */
  isDevMode() {
    return false;
  },
  /**
   * Deep freezes and object when in dev-mode.
   * Deep-Freezing has the same performance as deep-cloning, so we only do that in dev-mode.
   * Also, we can ensure the readonly state via typescript
   * @link https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
   */
  deepFreezeWhenDevMode(obj) {
    return obj;
  },
  /**
   * overwritten to map error-codes to text-messages
   */
  tunnelErrorMessage(message) {
    return "\n        RxDB Error-Code: " + message + ".\n        Hint: Error messages are not included in RxDB core to reduce build size.\n        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,\n        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error\n        ";
  }
};
function parametersToString(parameters) {
  var ret = "";
  if (Object.keys(parameters).length === 0) return ret;
  ret += "-".repeat(20) + "\n";
  ret += "Parameters:\n";
  ret += Object.keys(parameters).map((k) => {
    var paramStr = "[object Object]";
    try {
      if (k === "errors") {
        paramStr = parameters[k].map((err) => JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } else {
        paramStr = JSON.stringify(parameters[k], function(_k, v) {
          return v === void 0 ? null : v;
        }, 2);
      }
    } catch (e) {
    }
    return k + ": " + paramStr;
  }).join("\n");
  ret += "\n";
  return ret;
}
function messageForError(message, code, parameters) {
  return "\n" + message + "\n" + parametersToString(parameters);
}
var RxError = /* @__PURE__ */ function(_Error) {
  function RxError2(code, message, parameters = {}) {
    var _this;
    var mes = messageForError(message, code, parameters);
    _this = _Error.call(this, mes) || this;
    _this.code = code;
    _this.message = mes;
    _this.url = getErrorUrl(code);
    _this.parameters = parameters;
    _this.rxdb = true;
    return _this;
  }
  _inheritsLoose(RxError2, _Error);
  var _proto = RxError2.prototype;
  _proto.toString = function toString() {
    return this.message;
  };
  return _createClass(RxError2, [{
    key: "name",
    get: function() {
      return "RxError (" + this.code + ")";
    }
  }, {
    key: "typeError",
    get: function() {
      return false;
    }
  }]);
}(/* @__PURE__ */ _wrapNativeSuper(Error));
var RxTypeError = /* @__PURE__ */ function(_TypeError) {
  function RxTypeError2(code, message, parameters = {}) {
    var _this2;
    var mes = messageForError(message, code, parameters);
    _this2 = _TypeError.call(this, mes) || this;
    _this2.code = code;
    _this2.message = mes;
    _this2.url = getErrorUrl(code);
    _this2.parameters = parameters;
    _this2.rxdb = true;
    return _this2;
  }
  _inheritsLoose(RxTypeError2, _TypeError);
  var _proto2 = RxTypeError2.prototype;
  _proto2.toString = function toString() {
    return this.message;
  };
  return _createClass(RxTypeError2, [{
    key: "name",
    get: function() {
      return "RxTypeError (" + this.code + ")";
    }
  }, {
    key: "typeError",
    get: function() {
      return true;
    }
  }]);
}(/* @__PURE__ */ _wrapNativeSuper(TypeError));
function getErrorUrl(code) {
  return "https://rxdb.info/errors.html?console=errors#" + code;
}
function errorUrlHint(code) {
  return "\nFind out more about this error here: " + getErrorUrl(code) + " \n";
}
function newRxError(code, parameters) {
  return new RxError(code, overwritable.tunnelErrorMessage(code) + errorUrlHint(code), parameters);
}
function newRxTypeError(code, parameters) {
  return new RxTypeError(code, overwritable.tunnelErrorMessage(code) + errorUrlHint(code), parameters);
}
function isBulkWriteConflictError(err) {
  if (err && err.status === 409) {
    return err;
  } else {
    return false;
  }
}
var STORAGE_WRITE_ERROR_CODE_TO_MESSAGE = {
  409: "document write conflict",
  422: "schema validation error",
  510: "attachment data missing"
};
function rxStorageWriteErrorToRxError(err) {
  return newRxError("COL20", {
    name: STORAGE_WRITE_ERROR_CODE_TO_MESSAGE[err.status],
    document: err.documentId,
    writeError: err
  });
}
var HOOKS = {
  /**
   * Runs before a plugin is added.
   * Use this to block the usage of non-compatible plugins.
   */
  preAddRxPlugin: [],
  /**
   * functions that run before the database is created
   */
  preCreateRxDatabase: [],
  /**
   * runs after the database is created and prepared
   * but before the instance is returned to the user
   * @async
   */
  createRxDatabase: [],
  preCreateRxCollection: [],
  createRxCollection: [],
  createRxState: [],
  /**
  * runs at the end of the close-process of a collection
  * @async
  */
  postCloseRxCollection: [],
  /**
   * Runs after a collection is removed.
   * @async
   */
  postRemoveRxCollection: [],
  /**
    * functions that get the json-schema as input
    * to do additionally checks/manipulation
    */
  preCreateRxSchema: [],
  /**
   * functions that run after the RxSchema is created
   * gets RxSchema as attribute
   */
  createRxSchema: [],
  prePrepareRxQuery: [],
  preCreateRxQuery: [],
  /**
   * Runs before a query is send to the
   * prepareQuery function of the storage engine.
   */
  prePrepareQuery: [],
  createRxDocument: [],
  /**
   * runs after a RxDocument is created,
   * cannot be async
   */
  postCreateRxDocument: [],
  /**
   * Runs before a RxStorageInstance is created
   * gets the params of createStorageInstance()
   * as attribute so you can manipulate them.
   * Notice that you have to clone stuff before mutating the inputs.
   */
  preCreateRxStorageInstance: [],
  preStorageWrite: [],
  /**
   * runs on the document-data before the document is migrated
   * {
   *   doc: Object, // original doc-data
   *   migrated: // migrated doc-data after run through migration-strategies
   * }
   */
  preMigrateDocument: [],
  /**
   * runs after the migration of a document has been done
   */
  postMigrateDocument: [],
  /**
   * runs at the beginning of the close-process of a database
   */
  preCloseRxDatabase: [],
  /**
   * runs after a database has been removed
   * @async
   */
  postRemoveRxDatabase: [],
  postCleanup: [],
  /**
   * runs before the replication writes the rows to master
   * but before the rows have been modified
   * @async
   */
  preReplicationMasterWrite: [],
  /**
   * runs after the replication has been sent to the server
   * but before the new documents have been handled
   * @async
   */
  preReplicationMasterWriteDocumentsHandle: []
};
function runPluginHooks(hookKey, obj) {
  if (HOOKS[hookKey].length > 0) {
    HOOKS[hookKey].forEach((fun) => fun(obj));
  }
}
async function runAsyncPluginHooks(hookKey, obj) {
  for (var fn of HOOKS[hookKey]) {
    await fn(obj);
  }
}
function getSchemaByObjectPath(rxJsonSchema, path) {
  var usePath = path;
  usePath = usePath.replace(REGEX_ALL_DOTS, ".properties.");
  usePath = "properties." + usePath;
  usePath = trimDots(usePath);
  var ret = getProperty$1(rxJsonSchema, usePath);
  return ret;
}
function fillPrimaryKey(primaryPath, jsonSchema, documentData) {
  if (typeof jsonSchema.primaryKey === "string") {
    return documentData;
  }
  var newPrimary = getComposedPrimaryKeyOfDocumentData(jsonSchema, documentData);
  var existingPrimary = documentData[primaryPath];
  if (existingPrimary && existingPrimary !== newPrimary) {
    throw newRxError("DOC19", {
      args: {
        documentData,
        existingPrimary,
        newPrimary
      },
      schema: jsonSchema
    });
  }
  documentData[primaryPath] = newPrimary;
  return documentData;
}
function getPrimaryFieldOfPrimaryKey(primaryKey) {
  if (typeof primaryKey === "string") {
    return primaryKey;
  } else {
    return primaryKey.key;
  }
}
function getLengthOfPrimaryKey(schema) {
  var primaryPath = getPrimaryFieldOfPrimaryKey(schema.primaryKey);
  var schemaPart = getSchemaByObjectPath(schema, primaryPath);
  return ensureNotFalsy(schemaPart.maxLength);
}
function getComposedPrimaryKeyOfDocumentData(jsonSchema, documentData) {
  if (typeof jsonSchema.primaryKey === "string") {
    return documentData[jsonSchema.primaryKey];
  }
  var compositePrimary = jsonSchema.primaryKey;
  return compositePrimary.fields.map((field) => {
    var value = getProperty$1(documentData, field);
    if (typeof value === "undefined") {
      throw newRxError("DOC18", {
        args: {
          field,
          documentData
        }
      });
    }
    return value;
  }).join(compositePrimary.separator);
}
function normalizeRxJsonSchema(jsonSchema) {
  var normalizedSchema = sortObject(jsonSchema, true);
  return normalizedSchema;
}
function getDefaultIndex(primaryPath) {
  return ["_deleted", primaryPath];
}
function fillWithDefaultSettings(schemaObj) {
  schemaObj = flatClone(schemaObj);
  var primaryPath = getPrimaryFieldOfPrimaryKey(schemaObj.primaryKey);
  schemaObj.properties = flatClone(schemaObj.properties);
  schemaObj.additionalProperties = false;
  if (!Object.prototype.hasOwnProperty.call(schemaObj, "keyCompression")) {
    schemaObj.keyCompression = false;
  }
  schemaObj.indexes = schemaObj.indexes ? schemaObj.indexes.slice(0) : [];
  schemaObj.required = schemaObj.required ? schemaObj.required.slice(0) : [];
  schemaObj.encrypted = schemaObj.encrypted ? schemaObj.encrypted.slice(0) : [];
  schemaObj.properties._rev = {
    type: "string",
    minLength: 1
  };
  schemaObj.properties._attachments = {
    type: "object"
  };
  schemaObj.properties._deleted = {
    type: "boolean"
  };
  schemaObj.properties._meta = RX_META_SCHEMA;
  schemaObj.required = schemaObj.required ? schemaObj.required.slice(0) : [];
  schemaObj.required.push("_deleted");
  schemaObj.required.push("_rev");
  schemaObj.required.push("_meta");
  schemaObj.required.push("_attachments");
  var finalFields = getFinalFields(schemaObj);
  appendToArray(schemaObj.required, finalFields);
  schemaObj.required = schemaObj.required.filter((field) => !field.includes(".")).filter((elem, pos, arr) => arr.indexOf(elem) === pos);
  schemaObj.version = schemaObj.version || 0;
  var useIndexes = schemaObj.indexes.map((index) => {
    var arIndex = isMaybeReadonlyArray(index) ? index.slice(0) : [index];
    if (!arIndex.includes(primaryPath)) {
      arIndex.push(primaryPath);
    }
    if (arIndex[0] !== "_deleted") {
      arIndex.unshift("_deleted");
    }
    return arIndex;
  });
  if (useIndexes.length === 0) {
    useIndexes.push(getDefaultIndex(primaryPath));
  }
  useIndexes.push(["_meta.lwt", primaryPath]);
  if (schemaObj.internalIndexes) {
    schemaObj.internalIndexes.map((idx) => {
      useIndexes.push(idx);
    });
  }
  var hasIndex = /* @__PURE__ */ new Set();
  useIndexes.filter((index) => {
    var indexStr = index.join(",");
    if (hasIndex.has(indexStr)) {
      return false;
    } else {
      hasIndex.add(indexStr);
      return true;
    }
  });
  schemaObj.indexes = useIndexes;
  return schemaObj;
}
var RX_META_SCHEMA = {
  type: "object",
  properties: {
    /**
     * The last-write time.
     * Unix time in milliseconds.
     */
    lwt: {
      type: "number",
      /**
       * We use 1 as minimum so that the value is never falsy.
       */
      minimum: RX_META_LWT_MINIMUM,
      maximum: 1e15,
      multipleOf: 0.01
    }
  },
  /**
   * Additional properties are allowed
   * and can be used by plugins to set various flags.
   */
  additionalProperties: true,
  required: ["lwt"]
};
function getFinalFields(jsonSchema) {
  var ret = Object.keys(jsonSchema.properties).filter((key) => jsonSchema.properties[key].final);
  var primaryPath = getPrimaryFieldOfPrimaryKey(jsonSchema.primaryKey);
  ret.push(primaryPath);
  if (typeof jsonSchema.primaryKey !== "string") {
    jsonSchema.primaryKey.fields.forEach((field) => ret.push(field));
  }
  return ret;
}
function fillObjectWithDefaults(rxSchema, obj) {
  var defaultKeys = Object.keys(rxSchema.defaultValues);
  for (var i = 0; i < defaultKeys.length; ++i) {
    var key = defaultKeys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] === "undefined") {
      obj[key] = rxSchema.defaultValues[key];
    }
  }
  return obj;
}
var RxSchema = /* @__PURE__ */ function() {
  function RxSchema2(jsonSchema, hashFunction) {
    this.jsonSchema = jsonSchema;
    this.hashFunction = hashFunction;
    this.indexes = getIndexes(this.jsonSchema);
    this.primaryPath = getPrimaryFieldOfPrimaryKey(this.jsonSchema.primaryKey);
    if (!jsonSchema.properties[this.primaryPath].maxLength) {
      throw newRxError("SC39", {
        schema: jsonSchema
      });
    }
    this.finalFields = getFinalFields(this.jsonSchema);
  }
  var _proto = RxSchema2.prototype;
  _proto.validateChange = function validateChange(dataBefore, dataAfter) {
    this.finalFields.forEach((fieldName) => {
      if (!deepEqual(dataBefore[fieldName], dataAfter[fieldName])) {
        throw newRxError("DOC9", {
          dataBefore,
          dataAfter,
          fieldName,
          schema: this.jsonSchema
        });
      }
    });
  };
  _proto.getDocumentPrototype = function getDocumentPrototype2() {
    var proto = {};
    var pathProperties = getSchemaByObjectPath(this.jsonSchema, "");
    Object.keys(pathProperties).forEach((key) => {
      var fullPath = key;
      proto.__defineGetter__(key, function() {
        if (!this.get || typeof this.get !== "function") {
          return void 0;
        }
        var ret = this.get(fullPath);
        return ret;
      });
      Object.defineProperty(proto, key + "$", {
        get: function() {
          return this.get$(fullPath);
        },
        enumerable: false,
        configurable: false
      });
      Object.defineProperty(proto, key + "$$", {
        get: function() {
          return this.get$$(fullPath);
        },
        enumerable: false,
        configurable: false
      });
      Object.defineProperty(proto, key + "_", {
        get: function() {
          return this.populate(fullPath);
        },
        enumerable: false,
        configurable: false
      });
    });
    overwriteGetterForCaching(this, "getDocumentPrototype", () => proto);
    return proto;
  };
  _proto.getPrimaryOfDocumentData = function getPrimaryOfDocumentData(documentData) {
    return getComposedPrimaryKeyOfDocumentData(this.jsonSchema, documentData);
  };
  return _createClass(RxSchema2, [{
    key: "version",
    get: function() {
      return this.jsonSchema.version;
    }
  }, {
    key: "defaultValues",
    get: function() {
      var values = {};
      Object.entries(this.jsonSchema.properties).filter(([, v]) => Object.prototype.hasOwnProperty.call(v, "default")).forEach(([k, v]) => values[k] = v.default);
      return overwriteGetterForCaching(this, "defaultValues", values);
    }
    /**
     * @overrides itself on the first call
     */
  }, {
    key: "hash",
    get: function() {
      return overwriteGetterForCaching(this, "hash", this.hashFunction(JSON.stringify(this.jsonSchema)));
    }
  }]);
}();
function getIndexes(jsonSchema) {
  return (jsonSchema.indexes || []).map((index) => isMaybeReadonlyArray(index) ? index : [index]);
}
function getPreviousVersions(schema) {
  var version = schema.version ? schema.version : 0;
  var c = 0;
  return new Array(version).fill(0).map(() => c++);
}
function createRxSchema(jsonSchema, hashFunction, runPreCreateHooks = true) {
  if (runPreCreateHooks) {
    runPluginHooks("preCreateRxSchema", jsonSchema);
  }
  var useJsonSchema = fillWithDefaultSettings(jsonSchema);
  useJsonSchema = normalizeRxJsonSchema(useJsonSchema);
  overwritable.deepFreezeWhenDevMode(useJsonSchema);
  var schema = new RxSchema(useJsonSchema, hashFunction);
  runPluginHooks("createRxSchema", schema);
  return schema;
}
function isFunction$1(value) {
  return typeof value === "function";
}
function hasLift(source) {
  return isFunction$1(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
  return function(source) {
    if (hasLift(source)) {
      return source.lift(function(liftedSource) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from2, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from2.length, ar; i < l; i++) {
    if (ar || !(i in from2)) {
      if (!ar) ar = Array.prototype.slice.call(from2, 0, i);
      ar[i] = from2[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from2));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function awaitReturn(f) {
    return function(v) {
      return Promise.resolve(v).then(f, reject);
    };
  }
  function verb(n, f) {
    if (g[n]) {
      i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
      if (f) i[n] = f(i[n]);
    }
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve2, reject) {
        v = o[n](v), settle(resolve2, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve2, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve2({ value: v2, done: d });
    }, reject);
  }
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
var isArrayLike = function(x) {
  return x && typeof x.length === "number" && typeof x !== "function";
};
function isPromise$1(value) {
  return isFunction$1(value === null || value === void 0 ? void 0 : value.then);
}
function createErrorClass(createImpl) {
  var _super = function(instance) {
    Error.call(instance);
    instance.stack = new Error().stack;
  };
  var ctorFunc = createImpl(_super);
  ctorFunc.prototype = Object.create(Error.prototype);
  ctorFunc.prototype.constructor = ctorFunc;
  return ctorFunc;
}
var UnsubscriptionError = createErrorClass(function(_super) {
  return function UnsubscriptionErrorImpl(errors) {
    _super(this);
    this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
      return i + 1 + ") " + err.toString();
    }).join("\n  ") : "";
    this.name = "UnsubscriptionError";
    this.errors = errors;
  };
});
function arrRemove(arr, item) {
  if (arr) {
    var index = arr.indexOf(item);
    0 <= index && arr.splice(index, 1);
  }
}
var Subscription = function() {
  function Subscription2(initialTeardown) {
    this.initialTeardown = initialTeardown;
    this.closed = false;
    this._parentage = null;
    this._finalizers = null;
  }
  Subscription2.prototype.unsubscribe = function() {
    var e_1, _a2, e_2, _b;
    var errors;
    if (!this.closed) {
      this.closed = true;
      var _parentage = this._parentage;
      if (_parentage) {
        this._parentage = null;
        if (Array.isArray(_parentage)) {
          try {
            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
              var parent_1 = _parentage_1_1.value;
              parent_1.remove(this);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_parentage_1_1 && !_parentage_1_1.done && (_a2 = _parentage_1.return)) _a2.call(_parentage_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        } else {
          _parentage.remove(this);
        }
      }
      var initialFinalizer = this.initialTeardown;
      if (isFunction$1(initialFinalizer)) {
        try {
          initialFinalizer();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      }
      var _finalizers = this._finalizers;
      if (_finalizers) {
        this._finalizers = null;
        try {
          for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
            var finalizer = _finalizers_1_1.value;
            try {
              execFinalizer(finalizer);
            } catch (err) {
              errors = errors !== null && errors !== void 0 ? errors : [];
              if (err instanceof UnsubscriptionError) {
                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
              } else {
                errors.push(err);
              }
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
      }
      if (errors) {
        throw new UnsubscriptionError(errors);
      }
    }
  };
  Subscription2.prototype.add = function(teardown) {
    var _a2;
    if (teardown && teardown !== this) {
      if (this.closed) {
        execFinalizer(teardown);
      } else {
        if (teardown instanceof Subscription2) {
          if (teardown.closed || teardown._hasParent(this)) {
            return;
          }
          teardown._addParent(this);
        }
        (this._finalizers = (_a2 = this._finalizers) !== null && _a2 !== void 0 ? _a2 : []).push(teardown);
      }
    }
  };
  Subscription2.prototype._hasParent = function(parent) {
    var _parentage = this._parentage;
    return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
  };
  Subscription2.prototype._addParent = function(parent) {
    var _parentage = this._parentage;
    this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
  };
  Subscription2.prototype._removeParent = function(parent) {
    var _parentage = this._parentage;
    if (_parentage === parent) {
      this._parentage = null;
    } else if (Array.isArray(_parentage)) {
      arrRemove(_parentage, parent);
    }
  };
  Subscription2.prototype.remove = function(teardown) {
    var _finalizers = this._finalizers;
    _finalizers && arrRemove(_finalizers, teardown);
    if (teardown instanceof Subscription2) {
      teardown._removeParent(this);
    }
  };
  Subscription2.EMPTY = function() {
    var empty = new Subscription2();
    empty.closed = true;
    return empty;
  }();
  return Subscription2;
}();
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
  return value instanceof Subscription || value && "closed" in value && isFunction$1(value.remove) && isFunction$1(value.add) && isFunction$1(value.unsubscribe);
}
function execFinalizer(finalizer) {
  if (isFunction$1(finalizer)) {
    finalizer();
  } else {
    finalizer.unsubscribe();
  }
}
var config = {
  Promise: void 0
};
var timeoutProvider = {
  setTimeout: function(handler, timeout) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      args[_i - 2] = arguments[_i];
    }
    return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
  },
  clearTimeout: function(handle) {
    return clearTimeout(handle);
  },
  delegate: void 0
};
function reportUnhandledError(err) {
  timeoutProvider.setTimeout(function() {
    {
      throw err;
    }
  });
}
function noop() {
}
function errorContext(cb) {
  {
    cb();
  }
}
var Subscriber = function(_super) {
  __extends(Subscriber2, _super);
  function Subscriber2(destination) {
    var _this = _super.call(this) || this;
    _this.isStopped = false;
    if (destination) {
      _this.destination = destination;
      if (isSubscription(destination)) {
        destination.add(_this);
      }
    } else {
      _this.destination = EMPTY_OBSERVER;
    }
    return _this;
  }
  Subscriber2.create = function(next, error, complete) {
    return new SafeSubscriber(next, error, complete);
  };
  Subscriber2.prototype.next = function(value) {
    if (this.isStopped) ;
    else {
      this._next(value);
    }
  };
  Subscriber2.prototype.error = function(err) {
    if (this.isStopped) ;
    else {
      this.isStopped = true;
      this._error(err);
    }
  };
  Subscriber2.prototype.complete = function() {
    if (this.isStopped) ;
    else {
      this.isStopped = true;
      this._complete();
    }
  };
  Subscriber2.prototype.unsubscribe = function() {
    if (!this.closed) {
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
      this.destination = null;
    }
  };
  Subscriber2.prototype._next = function(value) {
    this.destination.next(value);
  };
  Subscriber2.prototype._error = function(err) {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  };
  Subscriber2.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  };
  return Subscriber2;
}(Subscription);
var ConsumerObserver = function() {
  function ConsumerObserver2(partialObserver) {
    this.partialObserver = partialObserver;
  }
  ConsumerObserver2.prototype.next = function(value) {
    var partialObserver = this.partialObserver;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  ConsumerObserver2.prototype.error = function(err) {
    var partialObserver = this.partialObserver;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        handleUnhandledError(error);
      }
    } else {
      handleUnhandledError(err);
    }
  };
  ConsumerObserver2.prototype.complete = function() {
    var partialObserver = this.partialObserver;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  return ConsumerObserver2;
}();
var SafeSubscriber = function(_super) {
  __extends(SafeSubscriber2, _super);
  function SafeSubscriber2(observerOrNext, error, complete) {
    var _this = _super.call(this) || this;
    var partialObserver;
    if (isFunction$1(observerOrNext) || !observerOrNext) {
      partialObserver = {
        next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
        error: error !== null && error !== void 0 ? error : void 0,
        complete: complete !== null && complete !== void 0 ? complete : void 0
      };
    } else {
      {
        partialObserver = observerOrNext;
      }
    }
    _this.destination = new ConsumerObserver(partialObserver);
    return _this;
  }
  return SafeSubscriber2;
}(Subscriber);
function handleUnhandledError(error) {
  {
    reportUnhandledError(error);
  }
}
function defaultErrorHandler(err) {
  throw err;
}
var EMPTY_OBSERVER = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop
};
var observable = function() {
  return typeof Symbol === "function" && Symbol.observable || "@@observable";
}();
function identity(x) {
  return x;
}
function pipeFromArray(fns) {
  if (fns.length === 0) {
    return identity;
  }
  if (fns.length === 1) {
    return fns[0];
  }
  return function piped(input) {
    return fns.reduce(function(prev, fn) {
      return fn(prev);
    }, input);
  };
}
var Observable = function() {
  function Observable2(subscribe) {
    if (subscribe) {
      this._subscribe = subscribe;
    }
  }
  Observable2.prototype.lift = function(operator) {
    var observable2 = new Observable2();
    observable2.source = this;
    observable2.operator = operator;
    return observable2;
  };
  Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
    var _this = this;
    var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
    errorContext(function() {
      var _a2 = _this, operator = _a2.operator, source = _a2.source;
      subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
    });
    return subscriber;
  };
  Observable2.prototype._trySubscribe = function(sink) {
    try {
      return this._subscribe(sink);
    } catch (err) {
      sink.error(err);
    }
  };
  Observable2.prototype.forEach = function(next, promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve2, reject) {
      var subscriber = new SafeSubscriber({
        next: function(value) {
          try {
            next(value);
          } catch (err) {
            reject(err);
            subscriber.unsubscribe();
          }
        },
        error: reject,
        complete: resolve2
      });
      _this.subscribe(subscriber);
    });
  };
  Observable2.prototype._subscribe = function(subscriber) {
    var _a2;
    return (_a2 = this.source) === null || _a2 === void 0 ? void 0 : _a2.subscribe(subscriber);
  };
  Observable2.prototype[observable] = function() {
    return this;
  };
  Observable2.prototype.pipe = function() {
    var operations = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      operations[_i] = arguments[_i];
    }
    return pipeFromArray(operations)(this);
  };
  Observable2.prototype.toPromise = function(promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve2, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve2(value);
      });
    });
  };
  Observable2.create = function(subscribe) {
    return new Observable2(subscribe);
  };
  return Observable2;
}();
function getPromiseCtor(promiseCtor) {
  var _a2;
  return (_a2 = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a2 !== void 0 ? _a2 : Promise;
}
function isObserver(value) {
  return value && isFunction$1(value.next) && isFunction$1(value.error) && isFunction$1(value.complete);
}
function isSubscriber(value) {
  return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
}
function isInteropObservable(input) {
  return isFunction$1(input[observable]);
}
function isAsyncIterable(obj) {
  return Symbol.asyncIterator && isFunction$1(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
function createInvalidObservableTypeError(input) {
  return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function getSymbolIterator() {
  if (typeof Symbol !== "function" || !Symbol.iterator) {
    return "@@iterator";
  }
  return Symbol.iterator;
}
var iterator = getSymbolIterator();
function isIterable(input) {
  return isFunction$1(input === null || input === void 0 ? void 0 : input[iterator]);
}
function readableStreamLikeToAsyncGenerator(readableStream) {
  return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
    var reader, _a2, value, done;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          reader = readableStream.getReader();
          _b.label = 1;
        case 1:
          _b.trys.push([1, , 9, 10]);
          _b.label = 2;
        case 2:
          return [4, __await(reader.read())];
        case 3:
          _a2 = _b.sent(), value = _a2.value, done = _a2.done;
          if (!done) return [3, 5];
          return [4, __await(void 0)];
        case 4:
          return [2, _b.sent()];
        case 5:
          return [4, __await(value)];
        case 6:
          return [4, _b.sent()];
        case 7:
          _b.sent();
          return [3, 2];
        case 8:
          return [3, 10];
        case 9:
          reader.releaseLock();
          return [7];
        case 10:
          return [2];
      }
    });
  });
}
function isReadableStreamLike(obj) {
  return isFunction$1(obj === null || obj === void 0 ? void 0 : obj.getReader);
}
function innerFrom(input) {
  if (input instanceof Observable) {
    return input;
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input);
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input);
    }
    if (isPromise$1(input)) {
      return fromPromise(input);
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input);
    }
    if (isIterable(input)) {
      return fromIterable(input);
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input);
    }
  }
  throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
  return new Observable(function(subscriber) {
    var obs = obj[observable]();
    if (isFunction$1(obs.subscribe)) {
      return obs.subscribe(subscriber);
    }
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function fromArrayLike(array) {
  return new Observable(function(subscriber) {
    for (var i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i]);
    }
    subscriber.complete();
  });
}
function fromPromise(promise) {
  return new Observable(function(subscriber) {
    promise.then(function(value) {
      if (!subscriber.closed) {
        subscriber.next(value);
        subscriber.complete();
      }
    }, function(err) {
      return subscriber.error(err);
    }).then(null, reportUnhandledError);
  });
}
function fromIterable(iterable) {
  return new Observable(function(subscriber) {
    var e_1, _a2;
    try {
      for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
        var value = iterable_1_1.value;
        subscriber.next(value);
        if (subscriber.closed) {
          return;
        }
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (iterable_1_1 && !iterable_1_1.done && (_a2 = iterable_1.return)) _a2.call(iterable_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
    subscriber.complete();
  });
}
function fromAsyncIterable(asyncIterable) {
  return new Observable(function(subscriber) {
    process$1(asyncIterable, subscriber).catch(function(err) {
      return subscriber.error(err);
    });
  });
}
function fromReadableStreamLike(readableStream) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process$1(asyncIterable, subscriber) {
  var asyncIterable_1, asyncIterable_1_1;
  var e_2, _a2;
  return __awaiter(this, void 0, void 0, function() {
    var value, e_2_1;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 5, 6, 11]);
          asyncIterable_1 = __asyncValues(asyncIterable);
          _b.label = 1;
        case 1:
          return [4, asyncIterable_1.next()];
        case 2:
          if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
          value = asyncIterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return [2];
          }
          _b.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          e_2_1 = _b.sent();
          e_2 = { error: e_2_1 };
          return [3, 11];
        case 6:
          _b.trys.push([6, , 9, 10]);
          if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a2 = asyncIterable_1.return))) return [3, 8];
          return [4, _a2.call(asyncIterable_1)];
        case 7:
          _b.sent();
          _b.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (e_2) throw e_2.error;
          return [7];
        case 10:
          return [7];
        case 11:
          subscriber.complete();
          return [2];
      }
    });
  });
}
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = function(_super) {
  __extends(OperatorSubscriber2, _super);
  function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
    var _this = _super.call(this, destination) || this;
    _this.onFinalize = onFinalize;
    _this.shouldUnsubscribe = shouldUnsubscribe;
    _this._next = onNext ? function(value) {
      try {
        onNext(value);
      } catch (err) {
        destination.error(err);
      }
    } : _super.prototype._next;
    _this._error = onError ? function(err) {
      try {
        onError(err);
      } catch (err2) {
        destination.error(err2);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._error;
    _this._complete = onComplete ? function() {
      try {
        onComplete();
      } catch (err) {
        destination.error(err);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._complete;
    return _this;
  }
  OperatorSubscriber2.prototype.unsubscribe = function() {
    var _a2;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var closed_1 = this.closed;
      _super.prototype.unsubscribe.call(this);
      !closed_1 && ((_a2 = this.onFinalize) === null || _a2 === void 0 ? void 0 : _a2.call(this));
    }
  };
  return OperatorSubscriber2;
}(Subscriber);
var dateTimestampProvider = {
  now: function() {
    return (dateTimestampProvider.delegate || Date).now();
  },
  delegate: void 0
};
function isScheduler(value) {
  return value && isFunction$1(value.schedule);
}
function last(arr) {
  return arr[arr.length - 1];
}
function popResultSelector(args) {
  return isFunction$1(last(args)) ? args.pop() : void 0;
}
function popScheduler(args) {
  return isScheduler(last(args)) ? args.pop() : void 0;
}
function popNumber(args, defaultValue) {
  return typeof last(args) === "number" ? args.pop() : defaultValue;
}
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
  if (delay === void 0) {
    delay = 0;
  }
  if (repeat === void 0) {
    repeat = false;
  }
  var scheduleSubscription = scheduler.schedule(function() {
    work();
    if (repeat) {
      parentSubscription.add(this.schedule(null, delay));
    } else {
      this.unsubscribe();
    }
  }, delay);
  parentSubscription.add(scheduleSubscription);
  if (!repeat) {
    return scheduleSubscription;
  }
}
var isArray$2 = Array.isArray;
var getPrototypeOf = Object.getPrototypeOf, objectProto = Object.prototype, getKeys = Object.keys;
function argsArgArrayOrObject(args) {
  if (args.length === 1) {
    var first_1 = args[0];
    if (isArray$2(first_1)) {
      return { args: first_1, keys: null };
    }
    if (isPOJO(first_1)) {
      var keys = getKeys(first_1);
      return {
        args: keys.map(function(key) {
          return first_1[key];
        }),
        keys
      };
    }
  }
  return { args, keys: null };
}
function isPOJO(obj) {
  return obj && typeof obj === "object" && getPrototypeOf(obj) === objectProto;
}
function observeOn(scheduler, delay) {
  if (delay === void 0) {
    delay = 0;
  }
  return operate(function(source, subscriber) {
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.next(value);
      }, delay);
    }, function() {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.complete();
      }, delay);
    }, function(err) {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.error(err);
      }, delay);
    }));
  });
}
function subscribeOn(scheduler, delay) {
  if (delay === void 0) {
    delay = 0;
  }
  return operate(function(source, subscriber) {
    subscriber.add(scheduler.schedule(function() {
      return source.subscribe(subscriber);
    }, delay));
  });
}
function scheduleObservable(input, scheduler) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
function schedulePromise(input, scheduler) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
function scheduleArray(input, scheduler) {
  return new Observable(function(subscriber) {
    var i = 0;
    return scheduler.schedule(function() {
      if (i === input.length) {
        subscriber.complete();
      } else {
        subscriber.next(input[i++]);
        if (!subscriber.closed) {
          this.schedule();
        }
      }
    });
  });
}
function scheduleIterable(input, scheduler) {
  return new Observable(function(subscriber) {
    var iterator$1;
    executeSchedule(subscriber, scheduler, function() {
      iterator$1 = input[iterator]();
      executeSchedule(subscriber, scheduler, function() {
        var _a2;
        var value;
        var done;
        try {
          _a2 = iterator$1.next(), value = _a2.value, done = _a2.done;
        } catch (err) {
          subscriber.error(err);
          return;
        }
        if (done) {
          subscriber.complete();
        } else {
          subscriber.next(value);
        }
      }, 0, true);
    });
    return function() {
      return isFunction$1(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return();
    };
  });
}
function scheduleAsyncIterable(input, scheduler) {
  if (!input) {
    throw new Error("Iterable cannot be null");
  }
  return new Observable(function(subscriber) {
    executeSchedule(subscriber, scheduler, function() {
      var iterator2 = input[Symbol.asyncIterator]();
      executeSchedule(subscriber, scheduler, function() {
        iterator2.next().then(function(result) {
          if (result.done) {
            subscriber.complete();
          } else {
            subscriber.next(result.value);
          }
        });
      }, 0, true);
    });
  });
}
function scheduleReadableStreamLike(input, scheduler) {
  return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}
function scheduled(input, scheduler) {
  if (input != null) {
    if (isInteropObservable(input)) {
      return scheduleObservable(input, scheduler);
    }
    if (isArrayLike(input)) {
      return scheduleArray(input, scheduler);
    }
    if (isPromise$1(input)) {
      return schedulePromise(input, scheduler);
    }
    if (isAsyncIterable(input)) {
      return scheduleAsyncIterable(input, scheduler);
    }
    if (isIterable(input)) {
      return scheduleIterable(input, scheduler);
    }
    if (isReadableStreamLike(input)) {
      return scheduleReadableStreamLike(input, scheduler);
    }
  }
  throw createInvalidObservableTypeError(input);
}
function from(input, scheduler) {
  return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}
function map(project, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      subscriber.next(project.call(thisArg, value, index++));
    }));
  });
}
var isArray$1 = Array.isArray;
function callOrApply(fn, args) {
  return isArray$1(args) ? fn.apply(void 0, __spreadArray([], __read(args))) : fn(args);
}
function mapOneOrManyArgs(fn) {
  return map(function(args) {
    return callOrApply(fn, args);
  });
}
function createObject(keys, values) {
  return keys.reduce(function(result, key, i) {
    return result[key] = values[i], result;
  }, {});
}
function combineLatest() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var scheduler = popScheduler(args);
  var resultSelector = popResultSelector(args);
  var _a2 = argsArgArrayOrObject(args), observables = _a2.args, keys = _a2.keys;
  if (observables.length === 0) {
    return from([], scheduler);
  }
  var result = new Observable(combineLatestInit(observables, scheduler, keys ? function(values) {
    return createObject(keys, values);
  } : identity));
  return resultSelector ? result.pipe(mapOneOrManyArgs(resultSelector)) : result;
}
function combineLatestInit(observables, scheduler, valueTransform) {
  if (valueTransform === void 0) {
    valueTransform = identity;
  }
  return function(subscriber) {
    maybeSchedule(scheduler, function() {
      var length = observables.length;
      var values = new Array(length);
      var active = length;
      var remainingFirstValues = length;
      var _loop_1 = function(i2) {
        maybeSchedule(scheduler, function() {
          var source = from(observables[i2], scheduler);
          var hasFirstValue = false;
          source.subscribe(createOperatorSubscriber(subscriber, function(value) {
            values[i2] = value;
            if (!hasFirstValue) {
              hasFirstValue = true;
              remainingFirstValues--;
            }
            if (!remainingFirstValues) {
              subscriber.next(valueTransform(values.slice()));
            }
          }, function() {
            if (!--active) {
              subscriber.complete();
            }
          }));
        }, subscriber);
      };
      for (var i = 0; i < length; i++) {
        _loop_1(i);
      }
    }, subscriber);
  };
}
function maybeSchedule(scheduler, execute, subscription) {
  if (scheduler) {
    executeSchedule(subscription, scheduler, execute);
  } else {
    execute();
  }
}
function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
  var buffer = [];
  var active = 0;
  var index = 0;
  var isComplete = false;
  var checkComplete = function() {
    if (isComplete && !buffer.length && !active) {
      subscriber.complete();
    }
  };
  var outerNext = function(value) {
    return active < concurrent ? doInnerSub(value) : buffer.push(value);
  };
  var doInnerSub = function(value) {
    active++;
    var innerComplete = false;
    innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function(innerValue) {
      {
        subscriber.next(innerValue);
      }
    }, function() {
      innerComplete = true;
    }, void 0, function() {
      if (innerComplete) {
        try {
          active--;
          var _loop_1 = function() {
            var bufferedValue = buffer.shift();
            if (innerSubScheduler) ;
            else {
              doInnerSub(bufferedValue);
            }
          };
          while (buffer.length && active < concurrent) {
            _loop_1();
          }
          checkComplete();
        } catch (err) {
          subscriber.error(err);
        }
      }
    }));
  };
  source.subscribe(createOperatorSubscriber(subscriber, outerNext, function() {
    isComplete = true;
    checkComplete();
  }));
  return function() {
  };
}
function mergeMap(project, resultSelector, concurrent) {
  if (concurrent === void 0) {
    concurrent = Infinity;
  }
  if (isFunction$1(resultSelector)) {
    return mergeMap(function(a, i) {
      return map(function(b, ii) {
        return resultSelector(a, b, i, ii);
      })(innerFrom(project(a, i)));
    }, concurrent);
  } else if (typeof resultSelector === "number") {
    concurrent = resultSelector;
  }
  return operate(function(source, subscriber) {
    return mergeInternals(source, subscriber, project, concurrent);
  });
}
function mergeAll(concurrent) {
  if (concurrent === void 0) {
    concurrent = Infinity;
  }
  return mergeMap(identity, concurrent);
}
function concatAll() {
  return mergeAll(1);
}
var ObjectUnsubscribedError = createErrorClass(function(_super) {
  return function ObjectUnsubscribedErrorImpl() {
    _super(this);
    this.name = "ObjectUnsubscribedError";
    this.message = "object unsubscribed";
  };
});
var Subject = function(_super) {
  __extends(Subject2, _super);
  function Subject2() {
    var _this = _super.call(this) || this;
    _this.closed = false;
    _this.currentObservers = null;
    _this.observers = [];
    _this.isStopped = false;
    _this.hasError = false;
    _this.thrownError = null;
    return _this;
  }
  Subject2.prototype.lift = function(operator) {
    var subject = new AnonymousSubject(this, this);
    subject.operator = operator;
    return subject;
  };
  Subject2.prototype._throwIfClosed = function() {
    if (this.closed) {
      throw new ObjectUnsubscribedError();
    }
  };
  Subject2.prototype.next = function(value) {
    var _this = this;
    errorContext(function() {
      var e_1, _a2;
      _this._throwIfClosed();
      if (!_this.isStopped) {
        if (!_this.currentObservers) {
          _this.currentObservers = Array.from(_this.observers);
        }
        try {
          for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
            var observer2 = _c.value;
            observer2.next(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a2 = _b.return)) _a2.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
      }
    });
  };
  Subject2.prototype.error = function(err) {
    var _this = this;
    errorContext(function() {
      _this._throwIfClosed();
      if (!_this.isStopped) {
        _this.hasError = _this.isStopped = true;
        _this.thrownError = err;
        var observers = _this.observers;
        while (observers.length) {
          observers.shift().error(err);
        }
      }
    });
  };
  Subject2.prototype.complete = function() {
    var _this = this;
    errorContext(function() {
      _this._throwIfClosed();
      if (!_this.isStopped) {
        _this.isStopped = true;
        var observers = _this.observers;
        while (observers.length) {
          observers.shift().complete();
        }
      }
    });
  };
  Subject2.prototype.unsubscribe = function() {
    this.isStopped = this.closed = true;
    this.observers = this.currentObservers = null;
  };
  Object.defineProperty(Subject2.prototype, "observed", {
    get: function() {
      var _a2;
      return ((_a2 = this.observers) === null || _a2 === void 0 ? void 0 : _a2.length) > 0;
    },
    enumerable: false,
    configurable: true
  });
  Subject2.prototype._trySubscribe = function(subscriber) {
    this._throwIfClosed();
    return _super.prototype._trySubscribe.call(this, subscriber);
  };
  Subject2.prototype._subscribe = function(subscriber) {
    this._throwIfClosed();
    this._checkFinalizedStatuses(subscriber);
    return this._innerSubscribe(subscriber);
  };
  Subject2.prototype._innerSubscribe = function(subscriber) {
    var _this = this;
    var _a2 = this, hasError = _a2.hasError, isStopped = _a2.isStopped, observers = _a2.observers;
    if (hasError || isStopped) {
      return EMPTY_SUBSCRIPTION;
    }
    this.currentObservers = null;
    observers.push(subscriber);
    return new Subscription(function() {
      _this.currentObservers = null;
      arrRemove(observers, subscriber);
    });
  };
  Subject2.prototype._checkFinalizedStatuses = function(subscriber) {
    var _a2 = this, hasError = _a2.hasError, thrownError = _a2.thrownError, isStopped = _a2.isStopped;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (isStopped) {
      subscriber.complete();
    }
  };
  Subject2.prototype.asObservable = function() {
    var observable2 = new Observable();
    observable2.source = this;
    return observable2;
  };
  Subject2.create = function(destination, source) {
    return new AnonymousSubject(destination, source);
  };
  return Subject2;
}(Observable);
var AnonymousSubject = function(_super) {
  __extends(AnonymousSubject2, _super);
  function AnonymousSubject2(destination, source) {
    var _this = _super.call(this) || this;
    _this.destination = destination;
    _this.source = source;
    return _this;
  }
  AnonymousSubject2.prototype.next = function(value) {
    var _a2, _b;
    (_b = (_a2 = this.destination) === null || _a2 === void 0 ? void 0 : _a2.next) === null || _b === void 0 ? void 0 : _b.call(_a2, value);
  };
  AnonymousSubject2.prototype.error = function(err) {
    var _a2, _b;
    (_b = (_a2 = this.destination) === null || _a2 === void 0 ? void 0 : _a2.error) === null || _b === void 0 ? void 0 : _b.call(_a2, err);
  };
  AnonymousSubject2.prototype.complete = function() {
    var _a2, _b;
    (_b = (_a2 = this.destination) === null || _a2 === void 0 ? void 0 : _a2.complete) === null || _b === void 0 ? void 0 : _b.call(_a2);
  };
  AnonymousSubject2.prototype._subscribe = function(subscriber) {
    var _a2, _b;
    return (_b = (_a2 = this.source) === null || _a2 === void 0 ? void 0 : _a2.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
  };
  return AnonymousSubject2;
}(Subject);
function concat$1() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return concatAll()(from(args, popScheduler(args)));
}
var EMPTY = new Observable(function(subscriber) {
  return subscriber.complete();
});
function distinctUntilChanged(comparator, keySelector) {
  if (keySelector === void 0) {
    keySelector = identity;
  }
  comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
  return operate(function(source, subscriber) {
    var previousKey;
    var first = true;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      var currentKey = keySelector(value);
      if (first || !comparator(previousKey, currentKey)) {
        first = false;
        previousKey = currentKey;
        subscriber.next(value);
      }
    }));
  });
}
function defaultCompare(a, b) {
  return a === b;
}
function filter(predicate, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return predicate.call(thisArg, value, index++) && subscriber.next(value);
    }));
  });
}
var EmptyError = createErrorClass(function(_super) {
  return function EmptyErrorImpl() {
    _super(this);
    this.name = "EmptyError";
    this.message = "no elements in sequence";
  };
});
function merge$3() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var scheduler = popScheduler(args);
  var concurrent = popNumber(args, Infinity);
  return operate(function(source, subscriber) {
    mergeAll(concurrent)(from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
  });
}
function mergeWith() {
  var otherSources = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    otherSources[_i] = arguments[_i];
  }
  return merge$3.apply(void 0, __spreadArray([], __read(otherSources)));
}
var BehaviorSubject = function(_super) {
  __extends(BehaviorSubject2, _super);
  function BehaviorSubject2(_value) {
    var _this = _super.call(this) || this;
    _this._value = _value;
    return _this;
  }
  Object.defineProperty(BehaviorSubject2.prototype, "value", {
    get: function() {
      return this.getValue();
    },
    enumerable: false,
    configurable: true
  });
  BehaviorSubject2.prototype._subscribe = function(subscriber) {
    var subscription = _super.prototype._subscribe.call(this, subscriber);
    !subscription.closed && subscriber.next(this._value);
    return subscription;
  };
  BehaviorSubject2.prototype.getValue = function() {
    var _a2 = this, hasError = _a2.hasError, thrownError = _a2.thrownError, _value = _a2._value;
    if (hasError) {
      throw thrownError;
    }
    this._throwIfClosed();
    return _value;
  };
  BehaviorSubject2.prototype.next = function(value) {
    _super.prototype.next.call(this, this._value = value);
  };
  return BehaviorSubject2;
}(Subject);
var ReplaySubject = function(_super) {
  __extends(ReplaySubject2, _super);
  function ReplaySubject2(_bufferSize, _windowTime, _timestampProvider) {
    if (_bufferSize === void 0) {
      _bufferSize = Infinity;
    }
    if (_windowTime === void 0) {
      _windowTime = Infinity;
    }
    if (_timestampProvider === void 0) {
      _timestampProvider = dateTimestampProvider;
    }
    var _this = _super.call(this) || this;
    _this._bufferSize = _bufferSize;
    _this._windowTime = _windowTime;
    _this._timestampProvider = _timestampProvider;
    _this._buffer = [];
    _this._infiniteTimeWindow = true;
    _this._infiniteTimeWindow = _windowTime === Infinity;
    _this._bufferSize = Math.max(1, _bufferSize);
    _this._windowTime = Math.max(1, _windowTime);
    return _this;
  }
  ReplaySubject2.prototype.next = function(value) {
    var _a2 = this, isStopped = _a2.isStopped, _buffer2 = _a2._buffer, _infiniteTimeWindow = _a2._infiniteTimeWindow, _timestampProvider = _a2._timestampProvider, _windowTime = _a2._windowTime;
    if (!isStopped) {
      _buffer2.push(value);
      !_infiniteTimeWindow && _buffer2.push(_timestampProvider.now() + _windowTime);
    }
    this._trimBuffer();
    _super.prototype.next.call(this, value);
  };
  ReplaySubject2.prototype._subscribe = function(subscriber) {
    this._throwIfClosed();
    this._trimBuffer();
    var subscription = this._innerSubscribe(subscriber);
    var _a2 = this, _infiniteTimeWindow = _a2._infiniteTimeWindow, _buffer2 = _a2._buffer;
    var copy = _buffer2.slice();
    for (var i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
      subscriber.next(copy[i]);
    }
    this._checkFinalizedStatuses(subscriber);
    return subscription;
  };
  ReplaySubject2.prototype._trimBuffer = function() {
    var _a2 = this, _bufferSize = _a2._bufferSize, _timestampProvider = _a2._timestampProvider, _buffer2 = _a2._buffer, _infiniteTimeWindow = _a2._infiniteTimeWindow;
    var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
    _bufferSize < Infinity && adjustedBufferSize < _buffer2.length && _buffer2.splice(0, _buffer2.length - adjustedBufferSize);
    if (!_infiniteTimeWindow) {
      var now2 = _timestampProvider.now();
      var last2 = 0;
      for (var i = 1; i < _buffer2.length && _buffer2[i] <= now2; i += 2) {
        last2 = i;
      }
      last2 && _buffer2.splice(0, last2 + 1);
    }
  };
  return ReplaySubject2;
}(Subject);
function share(options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.connector, connector = _a2 === void 0 ? function() {
    return new Subject();
  } : _a2, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
  return function(wrapperSource) {
    var connection;
    var resetConnection;
    var subject;
    var refCount = 0;
    var hasCompleted = false;
    var hasErrored = false;
    var cancelReset = function() {
      resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
      resetConnection = void 0;
    };
    var reset = function() {
      cancelReset();
      connection = subject = void 0;
      hasCompleted = hasErrored = false;
    };
    var resetAndUnsubscribe = function() {
      var conn = connection;
      reset();
      conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
    };
    return operate(function(source, subscriber) {
      refCount++;
      if (!hasErrored && !hasCompleted) {
        cancelReset();
      }
      var dest = subject = subject !== null && subject !== void 0 ? subject : connector();
      subscriber.add(function() {
        refCount--;
        if (refCount === 0 && !hasErrored && !hasCompleted) {
          resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
        }
      });
      dest.subscribe(subscriber);
      if (!connection && refCount > 0) {
        connection = new SafeSubscriber({
          next: function(value) {
            return dest.next(value);
          },
          error: function(err) {
            hasErrored = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnError, err);
            dest.error(err);
          },
          complete: function() {
            hasCompleted = true;
            cancelReset();
            resetConnection = handleReset(reset, resetOnComplete);
            dest.complete();
          }
        });
        innerFrom(source).subscribe(connection);
      }
    })(wrapperSource);
  };
}
function handleReset(reset, on) {
  var args = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    args[_i - 2] = arguments[_i];
  }
  if (on === true) {
    reset();
    return;
  }
  if (on === false) {
    return;
  }
  var onSubscriber = new SafeSubscriber({
    next: function() {
      onSubscriber.unsubscribe();
      reset();
    }
  });
  return innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
}
function shareReplay(configOrBufferSize, windowTime, scheduler) {
  var _a2, _b, _c;
  var bufferSize;
  var refCount = false;
  if (configOrBufferSize && typeof configOrBufferSize === "object") {
    _a2 = configOrBufferSize.bufferSize, bufferSize = _a2 === void 0 ? Infinity : _a2, _b = configOrBufferSize.windowTime, windowTime = _b === void 0 ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === void 0 ? false : _c, scheduler = configOrBufferSize.scheduler;
  } else {
    bufferSize = configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity;
  }
  return share({
    connector: function() {
      return new ReplaySubject(bufferSize, windowTime, scheduler);
    },
    resetOnError: true,
    resetOnComplete: false,
    resetOnRefCountZero: refCount
  });
}
function startWith() {
  var values = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    values[_i] = arguments[_i];
  }
  var scheduler = popScheduler(values);
  return operate(function(source, subscriber) {
    (scheduler ? concat$1(values, source, scheduler) : concat$1(values, source)).subscribe(subscriber);
  });
}
function switchMap(project, resultSelector) {
  return operate(function(source, subscriber) {
    var innerSubscriber = null;
    var index = 0;
    var isComplete = false;
    var checkComplete = function() {
      return isComplete && !innerSubscriber && subscriber.complete();
    };
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
      var innerIndex = 0;
      var outerIndex = index++;
      innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = createOperatorSubscriber(subscriber, function(innerValue) {
        return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
      }, function() {
        innerSubscriber = null;
        checkComplete();
      }));
    }, function() {
      isComplete = true;
      checkComplete();
    }));
  });
}
function getDocumentDataOfRxChangeEvent(rxChangeEvent) {
  if (rxChangeEvent.documentData) {
    return rxChangeEvent.documentData;
  } else {
    return rxChangeEvent.previousDocumentData;
  }
}
function rxChangeEventToEventReduceChangeEvent(rxChangeEvent) {
  switch (rxChangeEvent.operation) {
    case "INSERT":
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: rxChangeEvent.documentData,
        previous: null
      };
    case "UPDATE":
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: overwritable.deepFreezeWhenDevMode(rxChangeEvent.documentData),
        previous: rxChangeEvent.previousDocumentData ? rxChangeEvent.previousDocumentData : "UNKNOWN"
      };
    case "DELETE":
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: null,
        previous: rxChangeEvent.previousDocumentData
      };
  }
}
var EVENT_BULK_CACHE = /* @__PURE__ */ new Map();
function rxChangeEventBulkToRxChangeEvents(eventBulk) {
  return getFromMapOrCreate(EVENT_BULK_CACHE, eventBulk, () => {
    var events = new Array(eventBulk.events.length);
    var rawEvents = eventBulk.events;
    var collectionName = eventBulk.collectionName;
    var isLocal = eventBulk.isLocal;
    var deepFreezeWhenDevMode = overwritable.deepFreezeWhenDevMode;
    for (var index = 0; index < rawEvents.length; index++) {
      var event = rawEvents[index];
      events[index] = {
        documentId: event.documentId,
        collectionName,
        isLocal,
        operation: event.operation,
        documentData: deepFreezeWhenDevMode(event.documentData),
        previousDocumentData: deepFreezeWhenDevMode(event.previousDocumentData)
      };
    }
    return events;
  });
}
function firstValueFrom(source, config2) {
  return new Promise(function(resolve2, reject) {
    var subscriber = new SafeSubscriber({
      next: function(value) {
        resolve2(value);
        subscriber.unsubscribe();
      },
      error: reject,
      complete: function() {
        {
          reject(new EmptyError());
        }
      }
    });
    source.subscribe(subscriber);
  });
}
function merge$2() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var scheduler = popScheduler(args);
  var concurrent = popNumber(args, Infinity);
  var sources = args;
  return !sources.length ? EMPTY : sources.length === 1 ? innerFrom(sources[0]) : mergeAll(concurrent)(from(sources, scheduler));
}
var INDEX_MAX = String.fromCharCode(65535);
var INDEX_MIN = Number.MIN_SAFE_INTEGER;
function getQueryPlan(schema, query) {
  var selector = query.selector;
  var indexes = schema.indexes ? schema.indexes.slice(0) : [];
  if (query.index) {
    indexes = [query.index];
  }
  var hasDescSorting = !!query.sort.find((sortField) => Object.values(sortField)[0] === "desc");
  var sortIrrelevevantFields = /* @__PURE__ */ new Set();
  Object.keys(selector).forEach((fieldName) => {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    if (schemaPart && schemaPart.type === "boolean" && Object.prototype.hasOwnProperty.call(selector[fieldName], "$eq")) {
      sortIrrelevevantFields.add(fieldName);
    }
  });
  var optimalSortIndex = query.sort.map((sortField) => Object.keys(sortField)[0]);
  var optimalSortIndexCompareString = optimalSortIndex.filter((f) => !sortIrrelevevantFields.has(f)).join(",");
  var currentBestQuality = -1;
  var currentBestQueryPlan;
  indexes.forEach((index) => {
    var inclusiveEnd = true;
    var inclusiveStart = true;
    var opts = index.map((indexField) => {
      var matcher = selector[indexField];
      var operators = matcher ? Object.keys(matcher) : [];
      var matcherOpts = {};
      if (!matcher || !operators.length) {
        var startKey = inclusiveStart ? INDEX_MIN : INDEX_MAX;
        matcherOpts = {
          startKey,
          endKey: inclusiveEnd ? INDEX_MAX : INDEX_MIN,
          inclusiveStart: true,
          inclusiveEnd: true
        };
      } else {
        operators.forEach((operator) => {
          if (LOGICAL_OPERATORS.has(operator)) {
            var operatorValue = matcher[operator];
            var partialOpts = getMatcherQueryOpts(operator, operatorValue);
            matcherOpts = Object.assign(matcherOpts, partialOpts);
          }
        });
      }
      if (typeof matcherOpts.startKey === "undefined") {
        matcherOpts.startKey = INDEX_MIN;
      }
      if (typeof matcherOpts.endKey === "undefined") {
        matcherOpts.endKey = INDEX_MAX;
      }
      if (typeof matcherOpts.inclusiveStart === "undefined") {
        matcherOpts.inclusiveStart = true;
      }
      if (typeof matcherOpts.inclusiveEnd === "undefined") {
        matcherOpts.inclusiveEnd = true;
      }
      if (inclusiveStart && !matcherOpts.inclusiveStart) {
        inclusiveStart = false;
      }
      if (inclusiveEnd && !matcherOpts.inclusiveEnd) {
        inclusiveEnd = false;
      }
      return matcherOpts;
    });
    var startKeys = opts.map((opt) => opt.startKey);
    var endKeys = opts.map((opt) => opt.endKey);
    var queryPlan = {
      index,
      startKeys,
      endKeys,
      inclusiveEnd,
      inclusiveStart,
      sortSatisfiedByIndex: !hasDescSorting && optimalSortIndexCompareString === index.filter((f) => !sortIrrelevevantFields.has(f)).join(","),
      selectorSatisfiedByIndex: isSelectorSatisfiedByIndex(index, query.selector, startKeys, endKeys)
    };
    var quality = rateQueryPlan(schema, query, queryPlan);
    if (quality >= currentBestQuality || query.index) {
      currentBestQuality = quality;
      currentBestQueryPlan = queryPlan;
    }
  });
  if (!currentBestQueryPlan) {
    throw newRxError("SNH", {
      query
    });
  }
  return currentBestQueryPlan;
}
var LOGICAL_OPERATORS = /* @__PURE__ */ new Set(["$eq", "$gt", "$gte", "$lt", "$lte"]);
var LOWER_BOUND_LOGICAL_OPERATORS = /* @__PURE__ */ new Set(["$eq", "$gt", "$gte"]);
var UPPER_BOUND_LOGICAL_OPERATORS = /* @__PURE__ */ new Set(["$eq", "$lt", "$lte"]);
function isSelectorSatisfiedByIndex(index, selector, startKeys, endKeys) {
  var selectorEntries = Object.entries(selector);
  var hasNonMatchingOperator = selectorEntries.find(([fieldName2, operation2]) => {
    if (!index.includes(fieldName2)) {
      return true;
    }
    var hasNonLogicOperator = Object.entries(operation2).find(([op, _value]) => !LOGICAL_OPERATORS.has(op));
    return hasNonLogicOperator;
  });
  if (hasNonMatchingOperator) {
    return false;
  }
  if (selector.$and || selector.$or) {
    return false;
  }
  var satisfieldLowerBound = [];
  var lowerOperatorFieldNames = /* @__PURE__ */ new Set();
  for (var [fieldName, operation] of Object.entries(selector)) {
    if (!index.includes(fieldName)) {
      return false;
    }
    var lowerLogicOps = Object.keys(operation).filter((key) => LOWER_BOUND_LOGICAL_OPERATORS.has(key));
    if (lowerLogicOps.length > 1) {
      return false;
    }
    var hasLowerLogicOp = lowerLogicOps[0];
    if (hasLowerLogicOp) {
      lowerOperatorFieldNames.add(fieldName);
    }
    if (hasLowerLogicOp !== "$eq") {
      if (satisfieldLowerBound.length > 0) {
        return false;
      } else {
        satisfieldLowerBound.push(hasLowerLogicOp);
      }
    }
  }
  var satisfieldUpperBound = [];
  var upperOperatorFieldNames = /* @__PURE__ */ new Set();
  for (var [_fieldName, _operation] of Object.entries(selector)) {
    if (!index.includes(_fieldName)) {
      return false;
    }
    var upperLogicOps = Object.keys(_operation).filter((key) => UPPER_BOUND_LOGICAL_OPERATORS.has(key));
    if (upperLogicOps.length > 1) {
      return false;
    }
    var hasUperLogicOp = upperLogicOps[0];
    if (hasUperLogicOp) {
      upperOperatorFieldNames.add(_fieldName);
    }
    if (hasUperLogicOp !== "$eq") {
      if (satisfieldUpperBound.length > 0) {
        return false;
      } else {
        satisfieldUpperBound.push(hasUperLogicOp);
      }
    }
  }
  var i = 0;
  for (var _fieldName2 of index) {
    for (var set of [lowerOperatorFieldNames, upperOperatorFieldNames]) {
      if (!set.has(_fieldName2) && set.size > 0) {
        return false;
      }
      set.delete(_fieldName2);
    }
    var startKey = startKeys[i];
    var endKey = endKeys[i];
    if (startKey !== endKey && lowerOperatorFieldNames.size > 0 && upperOperatorFieldNames.size > 0) {
      return false;
    }
    i++;
  }
  return true;
}
function getMatcherQueryOpts(operator, operatorValue) {
  switch (operator) {
    case "$eq":
      return {
        startKey: operatorValue,
        endKey: operatorValue,
        inclusiveEnd: true,
        inclusiveStart: true
      };
    case "$lte":
      return {
        endKey: operatorValue,
        inclusiveEnd: true
      };
    case "$gte":
      return {
        startKey: operatorValue,
        inclusiveStart: true
      };
    case "$lt":
      return {
        endKey: operatorValue,
        inclusiveEnd: false
      };
    case "$gt":
      return {
        startKey: operatorValue,
        inclusiveStart: false
      };
    default:
      throw new Error("SNH");
  }
}
function rateQueryPlan(schema, query, queryPlan) {
  var quality = 0;
  var addQuality = (value) => {
    if (value > 0) {
      quality = quality + value;
    }
  };
  var pointsPerMatchingKey = 10;
  var nonMinKeyCount = countUntilNotMatching(queryPlan.startKeys, (keyValue) => keyValue !== INDEX_MIN && keyValue !== INDEX_MAX);
  addQuality(nonMinKeyCount * pointsPerMatchingKey);
  var nonMaxKeyCount = countUntilNotMatching(queryPlan.startKeys, (keyValue) => keyValue !== INDEX_MAX && keyValue !== INDEX_MIN);
  addQuality(nonMaxKeyCount * pointsPerMatchingKey);
  var equalKeyCount = countUntilNotMatching(queryPlan.startKeys, (keyValue, idx) => {
    if (keyValue === queryPlan.endKeys[idx]) {
      return true;
    } else {
      return false;
    }
  });
  addQuality(equalKeyCount * pointsPerMatchingKey * 1.5);
  var pointsIfNoReSortMustBeDone = queryPlan.sortSatisfiedByIndex ? 5 : 0;
  addQuality(pointsIfNoReSortMustBeDone);
  return quality;
}
class MingoError extends Error {
}
const MISSING = Symbol("missing");
const CYCLE_FOUND_ERROR = Object.freeze(
  new Error("mingo: cycle detected while processing object/array")
);
const DEFAULT_HASH_FUNCTION = (value) => {
  const s = stringify(value);
  let hash = 0;
  let i = s.length;
  while (i) hash = (hash << 5) - hash ^ s.charCodeAt(--i);
  return hash >>> 0;
};
const isPrimitive = (v) => typeof v !== "object" && typeof v !== "function" || v === null;
const isScalar = (v) => isPrimitive(v) || isDate(v) || isRegExp(v);
const SORT_ORDER = {
  undefined: 1,
  null: 2,
  number: 3,
  string: 4,
  symbol: 5,
  object: 6,
  array: 7,
  arraybuffer: 8,
  boolean: 9,
  date: 10,
  regexp: 11,
  function: 12
};
const compare$1 = (a, b) => {
  if (a === MISSING) a = void 0;
  if (b === MISSING) b = void 0;
  const [u, v] = [a, b].map((n) => SORT_ORDER[typeOf(n)] || 0);
  if (u !== v) return u - v;
  if (isEqual(a, b)) return 0;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};
const _ValueMap = class _ValueMap extends Map {
  constructor() {
    super();
    // The hash function
    __privateAdd(this, _hashFn, DEFAULT_HASH_FUNCTION);
    // maps the hashcode to key set
    __privateAdd(this, _keyMap, /* @__PURE__ */ new Map());
    // returns a tuple of [<masterKey>, <hash>]. Expects an object key.
    __privateAdd(this, _unpack, (key) => {
      const hash = __privateGet(this, _hashFn).call(this, key);
      return [(__privateGet(this, _keyMap).get(hash) || []).find((k) => isEqual(k, key)), hash];
    });
  }
  /**
   * Returns a new {@link ValueMap} object.
   * @param fn An optional custom hash function
   */
  static init(fn) {
    const m = new _ValueMap();
    if (fn) __privateSet(m, _hashFn, fn);
    return m;
  }
  clear() {
    super.clear();
    __privateGet(this, _keyMap).clear();
  }
  /**
   * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  delete(key) {
    if (isPrimitive(key)) return super.delete(key);
    const [masterKey, hash] = __privateGet(this, _unpack).call(this, key);
    if (!super.delete(masterKey)) return false;
    __privateGet(this, _keyMap).set(
      hash,
      __privateGet(this, _keyMap).get(hash).filter((k) => !isEqual(k, masterKey))
    );
    return true;
  }
  /**
   * Returns a specified element from the Map object. If the value that is associated to the provided key is an object, then you will get a reference to that object and any change made to that object will effectively modify it inside the Map.
   * @returns Returns the element associated with the specified key. If no element is associated with the specified key, undefined is returned.
   */
  get(key) {
    if (isPrimitive(key)) return super.get(key);
    const [masterKey, _] = __privateGet(this, _unpack).call(this, key);
    return super.get(masterKey);
  }
  /**
   * @returns boolean indicating whether an element with the specified key exists or not.
   */
  has(key) {
    if (isPrimitive(key)) return super.has(key);
    const [masterKey, _] = __privateGet(this, _unpack).call(this, key);
    return super.has(masterKey);
  }
  /**
   * Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated.
   */
  set(key, value) {
    if (isPrimitive(key)) return super.set(key, value);
    const [masterKey, hash] = __privateGet(this, _unpack).call(this, key);
    if (super.has(masterKey)) {
      super.set(masterKey, value);
    } else {
      super.set(key, value);
      const keys = __privateGet(this, _keyMap).get(hash) || [];
      keys.push(key);
      __privateGet(this, _keyMap).set(hash, keys);
    }
    return this;
  }
  /**
   * @returns the number of elements in the Map.
   */
  get size() {
    return super.size;
  }
};
_hashFn = new WeakMap();
_keyMap = new WeakMap();
_unpack = new WeakMap();
let ValueMap = _ValueMap;
function assert(condition, message) {
  if (!condition) throw new MingoError(message);
}
const STRING_REP = Object.keys(SORT_ORDER).reduce(
  (memo, k) => {
    memo["[object " + k[0].toUpperCase() + k.substring(1) + "]"] = k;
    return memo;
  },
  {}
);
function typeOf(v) {
  var _a2, _b;
  const s = Object.prototype.toString.call(v);
  return s === "[object Object]" ? ((_b = (_a2 = v == null ? void 0 : v.constructor) == null ? void 0 : _a2.name) == null ? void 0 : _b.toLowerCase()) || "object" : STRING_REP[s] || s.substring(8, s.length - 1).toLowerCase();
}
const isBoolean = (v) => typeof v === "boolean";
const isString = (v) => typeof v === "string";
const isSymbol = (v) => typeof v === "symbol";
const isNumber = (v) => !isNaN(v) && typeof v === "number";
const isArray = Array.isArray;
function isObject$2(v) {
  if (!v) return false;
  const p = Object.getPrototypeOf(v);
  return (p === Object.prototype || p === null) && typeOf(v) === "object";
}
const isObjectLike = (v) => !isPrimitive(v);
const isDate = (v) => v instanceof Date;
const isRegExp = (v) => v instanceof RegExp;
const isFunction = (v) => typeof v === "function";
const isNil = (v) => v === null || v === void 0;
const truthy = (arg, strict = true) => !!arg || strict && arg === "";
const isEmpty = (x) => isNil(x) || isString(x) && !x || isArray(x) && x.length === 0 || isObject$2(x) && Object.keys(x).length === 0;
const ensureArray = (x) => isArray(x) ? x : [x];
const has = (obj, prop) => !!obj && Object.prototype.hasOwnProperty.call(obj, prop);
const isTypedArray = (v) => typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v);
const cloneDeep = (v, refs) => {
  if (isNil(v) || isBoolean(v) || isNumber(v) || isString(v)) return v;
  if (isDate(v)) return new Date(v);
  if (isRegExp(v)) return new RegExp(v);
  if (isTypedArray(v)) {
    const ctor = v.constructor;
    return new ctor(v);
  }
  if (!(refs instanceof Set)) refs = /* @__PURE__ */ new Set();
  if (refs.has(v)) throw CYCLE_FOUND_ERROR;
  refs.add(v);
  try {
    if (isArray(v)) {
      const arr = new Array(v.length);
      for (let i = 0; i < v.length; i++) arr[i] = cloneDeep(v[i], refs);
      return arr;
    }
    if (isObject$2(v)) {
      const obj = {};
      for (const k of Object.keys(v)) obj[k] = cloneDeep(v[k], refs);
      return obj;
    }
  } finally {
    refs.delete(v);
  }
  return v;
};
const isMissing = (v) => v === MISSING;
function merge$1(target, input) {
  if (isMissing(target) || isNil(target)) return input;
  if (isMissing(input) || isNil(input)) return target;
  if (isPrimitive(target) || isPrimitive(input)) return input;
  if (isArray(target) && isArray(input)) {
    assert(
      target.length === input.length,
      "arrays must be of equal length to merge."
    );
  }
  for (const k of Object.keys(input)) {
    target[k] = merge$1(target[k], input[k]);
  }
  return target;
}
function intersection(input, hashFunction = DEFAULT_HASH_FUNCTION) {
  const vmaps = [ValueMap.init(hashFunction), ValueMap.init(hashFunction)];
  if (input.length === 0) return [];
  if (input.some((arr) => arr.length === 0)) return [];
  if (input.length === 1) return [...input];
  input[input.length - 1].forEach((v) => vmaps[0].set(v, true));
  for (let i = input.length - 2; i > -1; i--) {
    input[i].forEach((v) => {
      if (vmaps[0].has(v)) vmaps[1].set(v, true);
    });
    if (vmaps[1].size === 0) return [];
    vmaps.reverse();
    vmaps[1].clear();
  }
  return Array.from(vmaps[0].keys());
}
function flatten(xs, depth = 1) {
  const arr = new Array();
  function flatten2(ys, n) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (n > 0 || n < 0)) {
        flatten2(ys[i], Math.max(-1, n - 1));
      } else {
        arr.push(ys[i]);
      }
    }
  }
  flatten2(xs, depth);
  return arr;
}
function getMembersOf(o) {
  const props = {};
  while (o) {
    for (const k of Object.getOwnPropertyNames(o))
      if (!(k in props)) props[k] = o[k];
    o = Object.getPrototypeOf(o);
  }
  return props;
}
function hasCustomString(o) {
  while (o) {
    if (Object.getOwnPropertyNames(o).includes("toString"))
      return o["toString"] !== Object.prototype.toString;
    o = Object.getPrototypeOf(o);
  }
  return false;
}
function isEqual(a, b) {
  if (a === b || Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (a.constructor !== b.constructor) return false;
  if (a instanceof Date) return +a === +b;
  if (a instanceof RegExp) return a.toString() === b.toString();
  const ctor = a.constructor;
  if (ctor === Array || ctor === Object) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0, k = aKeys[i]; i < aKeys.length; k = aKeys[++i]) {
      if (k !== bKeys[i] || !isEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return hasCustomString(a) && a.toString() === b.toString();
}
function unique(input, hashFunction = DEFAULT_HASH_FUNCTION) {
  const m = ValueMap.init(hashFunction);
  input.forEach((v) => m.set(v, true));
  return Array.from(m.keys());
}
const stringify = (v, refs) => {
  if (v === null) return "null";
  if (v === void 0) return "undefined";
  if (isString(v) || isNumber(v) || isBoolean(v)) return JSON.stringify(v);
  if (isDate(v)) return v.toISOString();
  if (isRegExp(v) || isSymbol(v) || isFunction(v))
    return v.toString();
  if (!(refs instanceof Set)) refs = /* @__PURE__ */ new Set();
  if (refs.has(v)) throw CYCLE_FOUND_ERROR;
  try {
    refs.add(v);
    if (isArray(v)) return "[" + v.map((s2) => stringify(s2, refs)).join(",") + "]";
    if (isObject$2(v)) {
      const keys = Object.keys(v).sort();
      return "{" + keys.map((k) => `${k}:${stringify(v[k], refs)}`).join() + "}";
    }
    const s = hasCustomString(v) ? v.toString() : stringify(getMembersOf(v), refs);
    return typeOf(v) + "(" + s + ")";
  } finally {
    refs.delete(v);
  }
};
function hashCode(value, hashFunction) {
  if (isNil(value)) return null;
  hashFunction = hashFunction || DEFAULT_HASH_FUNCTION;
  return hashFunction(value);
}
function groupBy(collection, keyFn, hashFunction = DEFAULT_HASH_FUNCTION) {
  if (collection.length < 1) return /* @__PURE__ */ new Map();
  const lookup = /* @__PURE__ */ new Map();
  const result = /* @__PURE__ */ new Map();
  for (let i = 0; i < collection.length; i++) {
    const obj = collection[i];
    const key = keyFn(obj, i);
    const hash = hashCode(key, hashFunction);
    if (hash === null) {
      if (result.has(null)) {
        result.get(null).push(obj);
      } else {
        result.set(null, [obj]);
      }
    } else {
      const existingKey = lookup.has(hash) ? lookup.get(hash).find((k) => isEqual(k, key)) : null;
      if (isNil(existingKey)) {
        result.set(key, [obj]);
        if (lookup.has(hash)) {
          lookup.get(hash).push(key);
        } else {
          lookup.set(hash, [key]);
        }
      } else {
        result.get(existingKey).push(obj);
      }
    }
  }
  return result;
}
function getValue(obj, key) {
  return isObjectLike(obj) ? obj[key] : void 0;
}
function unwrap(arr, depth) {
  if (depth < 1) return arr;
  while (depth-- && arr.length === 1) arr = arr[0];
  return arr;
}
function resolve(obj, selector, options) {
  let depth = 0;
  function resolve2(o, path) {
    let value = o;
    for (let i = 0; i < path.length; i++) {
      const field = path[i];
      const isText = /^\d+$/.exec(field) === null;
      if (isText && isArray(value)) {
        if (i === 0 && depth > 0) break;
        depth += 1;
        const subpath = path.slice(i);
        value = value.reduce((acc, item) => {
          const v = resolve2(item, subpath);
          if (v !== void 0) acc.push(v);
          return acc;
        }, []);
        break;
      } else {
        value = getValue(value, field);
      }
      if (value === void 0) break;
    }
    return value;
  }
  const res = isScalar(obj) ? obj : resolve2(obj, selector.split("."));
  return isArray(res) && (options == null ? void 0 : options.unwrapArray) ? unwrap(res, depth) : res;
}
function resolveGraph(obj, selector, options) {
  const sep = selector.indexOf(".");
  const key = sep == -1 ? selector : selector.substring(0, sep);
  const next = selector.substring(sep + 1);
  const hasNext = sep != -1;
  if (isArray(obj)) {
    const isIndex = /^\d+$/.test(key);
    const arr = isIndex && (options == null ? void 0 : options.preserveIndex) ? [...obj] : [];
    if (isIndex) {
      const index = parseInt(key);
      let value2 = getValue(obj, index);
      if (hasNext) {
        value2 = resolveGraph(value2, next, options);
      }
      if (options == null ? void 0 : options.preserveIndex) {
        arr[index] = value2;
      } else {
        arr.push(value2);
      }
    } else {
      for (const item of obj) {
        const value2 = resolveGraph(item, selector, options);
        if (options == null ? void 0 : options.preserveMissing) {
          arr.push(value2 == void 0 ? MISSING : value2);
        } else if (value2 != void 0 || (options == null ? void 0 : options.preserveIndex)) {
          arr.push(value2);
        }
      }
    }
    return arr;
  }
  const res = (options == null ? void 0 : options.preserveKeys) ? { ...obj } : {};
  let value = getValue(obj, key);
  if (hasNext) {
    value = resolveGraph(value, next, options);
  }
  if (value === void 0) return void 0;
  res[key] = value;
  return res;
}
function filterMissing(obj) {
  if (isArray(obj)) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (obj[i] === MISSING) {
        obj.splice(i, 1);
      } else {
        filterMissing(obj[i]);
      }
    }
  } else if (isObject$2(obj)) {
    for (const k in obj) {
      if (has(obj, k)) {
        filterMissing(obj[k]);
      }
    }
  }
}
const NUMBER_RE = /^\d+$/;
function walk(obj, selector, fn, options) {
  const names = selector.split(".");
  const key = names[0];
  const next = names.slice(1).join(".");
  if (names.length === 1) {
    if (isObject$2(obj) || isArray(obj) && NUMBER_RE.test(key)) {
      fn(obj, key);
    }
  } else {
    if ((options == null ? void 0 : options.buildGraph) && isNil(obj[key])) {
      obj[key] = {};
    }
    const item = obj[key];
    if (!item) return;
    const isNextArrayIndex = !!(names.length > 1 && NUMBER_RE.test(names[1]));
    if (isArray(item) && (options == null ? void 0 : options.descendArray) && !isNextArrayIndex) {
      item.forEach((e) => walk(e, next, fn, options));
    } else {
      walk(item, next, fn, options);
    }
  }
}
function setValue(obj, selector, value) {
  walk(
    obj,
    selector,
    (item, key) => {
      item[key] = isFunction(value) ? value(item[key]) : value;
    },
    { buildGraph: true }
  );
}
function removeValue(obj, selector, options) {
  walk(
    obj,
    selector,
    (item, key) => {
      if (isArray(item)) {
        if (/^\d+$/.test(key)) {
          item.splice(parseInt(key), 1);
        } else if (options && options.descendArray) {
          for (const elem of item) {
            if (isObject$2(elem)) {
              delete elem[key];
            }
          }
        }
      } else if (isObject$2(item)) {
        delete item[key];
      }
    },
    options
  );
}
const OPERATOR_NAME_PATTERN = /^\$[a-zA-Z0-9_]+$/;
function isOperator(name) {
  return OPERATOR_NAME_PATTERN.test(name);
}
function normalize(expr) {
  if (isScalar(expr)) {
    return isRegExp(expr) ? { $regex: expr } : { $eq: expr };
  }
  if (isObjectLike(expr)) {
    if (!Object.keys(expr).some(isOperator)) return { $eq: expr };
    if (has(expr, "$regex")) {
      const newExpr = { ...expr };
      newExpr["$regex"] = new RegExp(
        expr["$regex"],
        expr["$options"]
      );
      delete newExpr["$options"];
      return newExpr;
    }
  }
  return expr;
}
var ProcessingMode = /* @__PURE__ */ ((ProcessingMode2) => {
  ProcessingMode2[ProcessingMode2["CLONE_OFF"] = 0] = "CLONE_OFF";
  ProcessingMode2[ProcessingMode2["CLONE_INPUT"] = 1] = "CLONE_INPUT";
  ProcessingMode2[ProcessingMode2["CLONE_OUTPUT"] = 2] = "CLONE_OUTPUT";
  ProcessingMode2[ProcessingMode2["CLONE_ALL"] = 3] = "CLONE_ALL";
  return ProcessingMode2;
})(ProcessingMode || {});
const _ComputeOptions = class _ComputeOptions {
  constructor(options, root, local) {
    __privateAdd(this, _options);
    /** Reference to the root object when processing subgraphs of the object. */
    __privateAdd(this, _root);
    __privateAdd(this, _local);
    __privateSet(this, _options, options);
    this.update(root, local);
  }
  /**
   * Initialize new ComputeOptions.
   * @returns {ComputeOptions}
   */
  static init(options, root, local) {
    var _a2;
    return !(options instanceof _ComputeOptions) ? new _ComputeOptions(options, root, local) : new _ComputeOptions(__privateGet(options, _options), options.root ?? root, {
      ...__privateGet(options, _local),
      ...local,
      variables: Object.assign(
        {},
        (_a2 = __privateGet(options, _local)) == null ? void 0 : _a2.variables,
        local == null ? void 0 : local.variables
      )
    });
  }
  /**
   * Updates the internal state.
   *
   * @param root The new root context for this object.
   * @param local The new local state to merge into current if it exists.
   * @returns
   */
  update(root, local) {
    var _a2;
    __privateSet(this, _root, root);
    const variables = Object.assign(
      {},
      (_a2 = __privateGet(this, _local)) == null ? void 0 : _a2.variables,
      local == null ? void 0 : local.variables
    );
    if (Object.keys(variables).length) {
      __privateSet(this, _local, { ...local, variables });
    } else {
      __privateSet(this, _local, local ?? {});
    }
    return this;
  }
  getOptions() {
    return Object.freeze({
      ...__privateGet(this, _options),
      context: Context.from(__privateGet(this, _options).context)
    });
  }
  get root() {
    return __privateGet(this, _root);
  }
  get local() {
    return __privateGet(this, _local);
  }
  get idKey() {
    return __privateGet(this, _options).idKey;
  }
  get collation() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.collation;
  }
  get processingMode() {
    var _a2;
    return ((_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.processingMode) || 0;
  }
  get useStrictMode() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.useStrictMode;
  }
  get scriptEnabled() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.scriptEnabled;
  }
  get useGlobalContext() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.useGlobalContext;
  }
  get hashFunction() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.hashFunction;
  }
  get collectionResolver() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.collectionResolver;
  }
  get jsonSchemaValidator() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.jsonSchemaValidator;
  }
  get variables() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.variables;
  }
  get context() {
    var _a2;
    return (_a2 = __privateGet(this, _options)) == null ? void 0 : _a2.context;
  }
};
_options = new WeakMap();
_root = new WeakMap();
_local = new WeakMap();
let ComputeOptions = _ComputeOptions;
function initOptions(options) {
  return options instanceof ComputeOptions ? options.getOptions() : Object.freeze({
    idKey: "_id",
    scriptEnabled: true,
    useStrictMode: true,
    useGlobalContext: true,
    processingMode: 0,
    ...options,
    context: (options == null ? void 0 : options.context) ? Context.from(options == null ? void 0 : options.context) : Context.init()
  });
}
var OperatorType = /* @__PURE__ */ ((OperatorType2) => {
  OperatorType2["ACCUMULATOR"] = "accumulator";
  OperatorType2["EXPRESSION"] = "expression";
  OperatorType2["PIPELINE"] = "pipeline";
  OperatorType2["PROJECTION"] = "projection";
  OperatorType2["QUERY"] = "query";
  OperatorType2["WINDOW"] = "window";
  return OperatorType2;
})(OperatorType || {});
const _Context = class _Context {
  constructor() {
    __privateAdd(this, _operators, /* @__PURE__ */ new Map());
  }
  static init() {
    return new _Context();
  }
  static from(ctx) {
    const instance = _Context.init();
    if (isNil(ctx)) return instance;
    __privateGet(ctx, _operators).forEach((v, k) => instance.addOperators(k, v));
    return instance;
  }
  addOperators(type2, operators) {
    if (!__privateGet(this, _operators).has(type2)) __privateGet(this, _operators).set(type2, {});
    for (const [name, fn] of Object.entries(operators)) {
      if (!this.getOperator(type2, name)) {
        __privateGet(this, _operators).get(type2)[name] = fn;
      }
    }
    return this;
  }
  getOperator(type2, name) {
    const ops = __privateGet(this, _operators).get(type2) ?? {};
    return ops[name] ?? null;
  }
  addAccumulatorOps(ops) {
    return this.addOperators("accumulator", ops);
  }
  addExpressionOps(ops) {
    return this.addOperators("expression", ops);
  }
  addQueryOps(ops) {
    return this.addOperators("query", ops);
  }
  addPipelineOps(ops) {
    return this.addOperators("pipeline", ops);
  }
  addProjectionOps(ops) {
    return this.addOperators("projection", ops);
  }
  addWindowOps(ops) {
    return this.addOperators("window", ops);
  }
};
_operators = new WeakMap();
let Context = _Context;
const GLOBAL_CONTEXT = Context.init();
function useOperators(type2, operators) {
  for (const [name, fn] of Object.entries(operators)) {
    assert(
      isFunction(fn) && isOperator(name),
      `'${name}' is not a valid operator`
    );
    const currentFn = getOperator(type2, name, null);
    assert(
      !currentFn || fn === currentFn,
      `${name} already exists for '${type2}' operators. Cannot change operator function once registered.`
    );
  }
  switch (type2) {
    case "accumulator":
      GLOBAL_CONTEXT.addAccumulatorOps(operators);
      break;
    case "expression":
      GLOBAL_CONTEXT.addExpressionOps(operators);
      break;
    case "pipeline":
      GLOBAL_CONTEXT.addPipelineOps(operators);
      break;
    case "projection":
      GLOBAL_CONTEXT.addProjectionOps(operators);
      break;
    case "query":
      GLOBAL_CONTEXT.addQueryOps(operators);
      break;
    case "window":
      GLOBAL_CONTEXT.addWindowOps(operators);
      break;
  }
}
function getOperator(type2, name, options) {
  const { context: ctx, useGlobalContext: fallback } = options || {};
  const fn = ctx ? ctx.getOperator(type2, name) : null;
  return !fn && fallback ? GLOBAL_CONTEXT.getOperator(type2, name) : fn;
}
function computeValue(obj, expr, operator, options) {
  const copts = ComputeOptions.init(options, obj);
  return !!operator && isOperator(operator) ? computeOperator(obj, expr, operator, copts) : computeExpression(obj, expr, copts);
}
const SYSTEM_VARS = ["$$ROOT", "$$CURRENT", "$$REMOVE", "$$NOW"];
function computeExpression(obj, expr, options) {
  var _a2;
  if (isString(expr) && expr.length > 0 && expr[0] === "$") {
    if (REDACT_ACTIONS.includes(expr)) return expr;
    let ctx = options.root;
    const arr = expr.split(".");
    if (SYSTEM_VARS.includes(arr[0])) {
      switch (arr[0]) {
        case "$$ROOT":
          break;
        case "$$CURRENT":
          ctx = obj;
          break;
        case "$$REMOVE":
          ctx = void 0;
          break;
        case "$$NOW":
          ctx = /* @__PURE__ */ new Date();
          break;
      }
      expr = expr.slice(arr[0].length + 1);
    } else if (arr[0].slice(0, 2) === "$$") {
      ctx = Object.assign(
        {},
        // global vars
        options.variables,
        // current item is added before local variables because the binding may be changed.
        { this: obj },
        // local vars
        (_a2 = options == null ? void 0 : options.local) == null ? void 0 : _a2.variables
      );
      const name = arr[0].slice(2);
      assert(has(ctx, name), `Use of undefined variable: ${name}`);
      expr = expr.slice(2);
    } else {
      expr = expr.slice(1);
    }
    return expr === "" ? ctx : resolve(ctx, expr);
  }
  if (isArray(expr)) {
    return expr.map((item) => computeExpression(obj, item, options));
  }
  if (isObject$2(expr)) {
    const result = {};
    const elems = Object.entries(expr);
    for (const [key, val] of elems) {
      if (isOperator(key)) {
        assert(elems.length == 1, "expression must have single operator.");
        return computeOperator(obj, val, key, options);
      }
      result[key] = computeExpression(obj, val, options);
    }
    return result;
  }
  return expr;
}
function computeOperator(obj, expr, operator, options) {
  const callExpression = getOperator(
    "expression",
    operator,
    options
  );
  if (callExpression) return callExpression(obj, expr, options);
  const callAccumulator = getOperator(
    "accumulator",
    operator,
    options
  );
  assert(!!callAccumulator, `accumulator '${operator}' is not registered.`);
  if (!isArray(obj)) {
    obj = computeExpression(obj, expr, options);
    expr = null;
  }
  assert(isArray(obj), `arguments must resolve to array for ${operator}.`);
  return callAccumulator(obj, expr, options);
}
const REDACT_ACTIONS = ["$$KEEP", "$$PRUNE", "$$DESCEND"];
function Lazy(source) {
  return source instanceof Iterator$1 ? source : new Iterator$1(source);
}
function concat(...iterators) {
  let index = 0;
  return Lazy(() => {
    while (index < iterators.length) {
      const o = iterators[index].next();
      if (!o.done) return o;
      index++;
    }
    return { done: true };
  });
}
function isGenerator(o) {
  return !!o && typeof o === "object" && (o == null ? void 0 : o.next) instanceof Function;
}
function dropItem(array, i) {
  const rest = array.slice(i + 1);
  array.splice(i);
  Array.prototype.push.apply(array, rest);
}
const DONE = new Error();
function createCallback(nextFn, iteratees, buffer) {
  let done = false;
  let index = -1;
  let bufferIndex = 0;
  return function(storeResult) {
    try {
      outer: while (!done) {
        let o = nextFn();
        index++;
        let i = -1;
        const size = iteratees.length;
        let innerDone = false;
        while (++i < size) {
          const r = iteratees[i];
          switch (r.action) {
            case 0:
              o = r.func(o, index);
              break;
            case 1:
              if (!r.func(o, index)) continue outer;
              break;
            case 2:
              --r.count;
              if (!r.count) innerDone = true;
              break;
            case 3:
              --r.count;
              if (!r.count) dropItem(iteratees, i);
              continue outer;
            default:
              break outer;
          }
        }
        done = innerDone;
        if (storeResult) {
          buffer[bufferIndex++] = o;
        } else {
          return { value: o, done: false };
        }
      }
    } catch (e) {
      if (e !== DONE) throw e;
    }
    done = true;
    return { done };
  };
}
let Iterator$1 = (_a = class {
  /**
   * @param {*} source An iterable object or function.
   *    Array - return one element per cycle
   *    Object{next:Function} - call next() for the next value (this also handles generator functions)
   *    Function - call to return the next value
   * @param {Function} fn An optional transformation function
   */
  constructor(source) {
    __privateAdd(this, _iteratees);
    __privateAdd(this, _yieldedValues);
    __privateAdd(this, _getNext);
    __privateSet(this, _iteratees, []);
    __privateSet(this, _yieldedValues, []);
    this.isDone = false;
    let nextVal;
    if (source instanceof Function) {
      source = { next: source };
    }
    if (isGenerator(source)) {
      const src = source;
      nextVal = () => {
        const o = src.next();
        if (o.done) throw DONE;
        return o.value;
      };
    } else if (isArray(source)) {
      const data = source;
      const size = data.length;
      let index = 0;
      nextVal = () => {
        if (index < size) return data[index++];
        throw DONE;
      };
    } else if (!(source instanceof Function)) {
      throw new MingoError(
        `Lazy must be initialized with an array, generator, or function.`
      );
    }
    __privateSet(this, _getNext, createCallback(
      nextVal,
      __privateGet(this, _iteratees),
      __privateGet(this, _yieldedValues)
    ));
  }
  /**
   * Add an iteratee to this lazy sequence
   */
  push(action, value) {
    if (typeof value === "function") {
      __privateGet(this, _iteratees).push({ action, func: value });
    } else if (typeof value === "number") {
      __privateGet(this, _iteratees).push({ action, count: value });
    }
    return this;
  }
  next() {
    return __privateGet(this, _getNext).call(this);
  }
  // Iteratees methods
  /**
   * Transform each item in the sequence to a new value
   * @param {Function} f
   */
  map(f) {
    return this.push(0, f);
  }
  /**
   * Select only items matching the given predicate
   * @param {Function} pred
   */
  filter(predicate) {
    return this.push(1, predicate);
  }
  /**
   * Take given numbe for values from sequence
   * @param {Number} n A number greater than 0
   */
  take(n) {
    return n > 0 ? this.push(2, n) : this;
  }
  /**
   * Drop a number of values from the sequence
   * @param {Number} n Number of items to drop greater than 0
   */
  drop(n) {
    return n > 0 ? this.push(3, n) : this;
  }
  // Transformations
  /**
   * Returns a new lazy object with results of the transformation
   * The entire sequence is realized.
   *
   * @param {Callback<Source, Any[]>} fn Tranform function of type (Array) => (Any)
   */
  transform(fn) {
    const self2 = this;
    let iter;
    return Lazy(() => {
      if (!iter) {
        iter = Lazy(fn(self2.value()));
      }
      return iter.next();
    });
  }
  // Terminal methods
  /**
   * Returns the fully realized values of the iterators.
   * The return value will be an array unless `lazy.first()` was used.
   * The realized values are cached for subsequent calls.
   */
  value() {
    if (!this.isDone) {
      this.isDone = __privateGet(this, _getNext).call(this, true).done;
    }
    return __privateGet(this, _yieldedValues);
  }
  /**
   * Execute the funcion for each value. Will stop when an execution returns false.
   * @param {Function} f
   * @returns {Boolean} false iff `f` return false for AnyVal execution, otherwise true
   */
  each(f) {
    for (; ; ) {
      const o = this.next();
      if (o.done) break;
      if (f(o.value) === false) return false;
    }
    return true;
  }
  /**
   * Returns the reduction of sequence according the reducing function
   *
   * @param {*} f a reducing function
   * @param {*} initialValue
   */
  reduce(f, initialValue) {
    let o = this.next();
    if (initialValue === void 0 && !o.done) {
      initialValue = o.value;
      o = this.next();
    }
    while (!o.done) {
      initialValue = f(initialValue, o.value);
      o = this.next();
    }
    return initialValue;
  }
  /**
   * Returns the number of matched items in the sequence
   */
  size() {
    return this.reduce(
      (acc, _) => ++acc,
      0
    );
  }
  [Symbol.iterator]() {
    return this;
  }
}, _iteratees = new WeakMap(), _yieldedValues = new WeakMap(), _getNext = new WeakMap(), _a);
const $limit = (collection, expr, _options4) => collection.take(expr);
const $project = (collection, expr, options) => {
  if (isEmpty(expr)) return collection;
  validateExpression(expr, options);
  return collection.map(createHandler(expr, ComputeOptions.init(options)));
};
function createHandler(expr, options, isRoot = true) {
  const idKey = options.idKey;
  const expressionKeys = Object.keys(expr);
  const excludedKeys = new Array();
  const includedKeys = new Array();
  const handlers = {};
  for (const key of expressionKeys) {
    const subExpr = expr[key];
    if (isNumber(subExpr) || isBoolean(subExpr)) {
      if (subExpr) {
        includedKeys.push(key);
      } else {
        excludedKeys.push(key);
      }
    } else if (isArray(subExpr)) {
      handlers[key] = (o) => subExpr.map((v) => computeValue(o, v, null, options.update(o)) ?? null);
    } else if (isObject$2(subExpr)) {
      const subExprKeys = Object.keys(subExpr);
      const operator = subExprKeys.length == 1 ? subExprKeys[0] : "";
      const projectFn = getOperator(
        "projection",
        operator,
        options
      );
      if (projectFn) {
        const foundSlice = operator === "$slice";
        if (foundSlice && !ensureArray(subExpr[operator]).every(isNumber)) {
          handlers[key] = (o) => computeValue(o, subExpr, key, options.update(o));
        } else {
          handlers[key] = (o) => projectFn(o, subExpr[operator], key, options.update(o));
        }
      } else if (isOperator(operator)) {
        handlers[key] = (o) => computeValue(o, subExpr[operator], operator, options);
      } else {
        validateExpression(subExpr, options);
        handlers[key] = (o) => {
          if (!has(o, key)) return computeValue(o, subExpr, null, options);
          if (isRoot) options.update(o);
          const target = resolve(o, key);
          const fn = createHandler(subExpr, options, false);
          if (isArray(target)) return target.map(fn);
          if (isObject$2(target)) return fn(target);
          return fn(o);
        };
      }
    } else {
      handlers[key] = isString(subExpr) && subExpr[0] === "$" ? (o) => computeValue(o, subExpr, key, options) : (_) => subExpr;
    }
  }
  const handlerKeys = Object.keys(handlers);
  const idKeyExcluded = excludedKeys.includes(idKey);
  const idKeyOnlyExcluded = isRoot && idKeyExcluded && excludedKeys.length === 1 && !includedKeys.length && !handlerKeys.length;
  if (idKeyOnlyExcluded) {
    return (o) => {
      const newObj = { ...o };
      delete newObj[idKey];
      return newObj;
    };
  }
  const idKeyImplicit = isRoot && !idKeyExcluded && !includedKeys.includes(idKey);
  const opts = {
    preserveMissing: true
  };
  return (o) => {
    const newObj = {};
    if (excludedKeys.length && !includedKeys.length) {
      merge$1(newObj, o);
      for (const k of excludedKeys) {
        removeValue(newObj, k, { descendArray: true });
      }
    }
    for (const k of includedKeys) {
      const pathObj = resolveGraph(o, k, opts) ?? {};
      merge$1(newObj, pathObj);
    }
    if (includedKeys.length) filterMissing(newObj);
    for (const k of handlerKeys) {
      const value = handlers[k](o);
      if (value === void 0) {
        removeValue(newObj, k, { descendArray: true });
      } else {
        setValue(newObj, k, value);
      }
    }
    if (idKeyImplicit && has(o, idKey)) {
      newObj[idKey] = resolve(o, idKey);
    }
    return newObj;
  };
}
function validateExpression(expr, options) {
  let exclusions = false;
  let inclusions = false;
  for (const [k, v] of Object.entries(expr)) {
    assert(!k.startsWith("$"), "Field names may not start with '$'.");
    assert(
      !k.endsWith(".$"),
      "Positional projection operator '$' is not supported."
    );
    if (k === (options == null ? void 0 : options.idKey)) continue;
    if (v === 0 || v === false) {
      exclusions = true;
    } else if (v === 1 || v === true) {
      inclusions = true;
    }
    assert(
      !(exclusions && inclusions),
      "Projection cannot have a mix of inclusion and exclusion."
    );
  }
}
const $skip = (collection, expr, _options4) => {
  return collection.drop(expr);
};
const $sort = (collection, sortKeys, options) => {
  if (isEmpty(sortKeys) || !isObject$2(sortKeys)) return collection;
  let cmp2 = compare$1;
  const collationSpec = options.collation;
  if (isObject$2(collationSpec) && isString(collationSpec.locale)) {
    cmp2 = collationComparator(collationSpec);
  }
  return collection.transform((coll) => {
    const modifiers = Object.keys(sortKeys);
    for (const key of modifiers.reverse()) {
      const groups = groupBy(
        coll,
        (obj) => resolve(obj, key),
        options.hashFunction
      );
      const sortedKeys = Array.from(groups.keys()).sort(cmp2);
      if (sortKeys[key] === -1) sortedKeys.reverse();
      let i = 0;
      for (const k of sortedKeys) for (const v of groups.get(k)) coll[i++] = v;
      assert(i == coll.length, "bug: counter must match collection size.");
    }
    return coll;
  });
};
const COLLATION_STRENGTH = {
  // Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A.
  1: "base",
  //  Only strings that differ in base letters or accents and other diacritic marks compare as unequal.
  // Examples: a ≠ b, a ≠ á, a = A.
  2: "accent",
  // Strings that differ in base letters, accents and other diacritic marks, or case compare as unequal.
  // Other differences may also be taken into consideration. Examples: a ≠ b, a ≠ á, a ≠ A
  3: "variant"
  // case - Only strings that differ in base letters or case compare as unequal. Examples: a ≠ b, a = á, a ≠ A.
};
function collationComparator(spec) {
  const localeOpt = {
    sensitivity: COLLATION_STRENGTH[spec.strength || 3],
    caseFirst: spec.caseFirst === "off" ? "false" : spec.caseFirst || "false",
    numeric: spec.numericOrdering || false,
    ignorePunctuation: spec.alternate === "shifted"
  };
  if ((spec.caseLevel || false) === true) {
    if (localeOpt.sensitivity === "base") localeOpt.sensitivity = "case";
    if (localeOpt.sensitivity === "accent") localeOpt.sensitivity = "variant";
  }
  const collator = new Intl.Collator(spec.locale, localeOpt);
  return (a, b) => {
    if (!isString(a) || !isString(b)) return compare$1(a, b);
    const i = collator.compare(a, b);
    if (i < 0) return -1;
    if (i > 0) return 1;
    return 0;
  };
}
const OPERATORS = { $sort, $skip, $limit };
class Cursor {
  constructor(source, predicate, projection, options) {
    __privateAdd(this, _source);
    __privateAdd(this, _predicate);
    __privateAdd(this, _projection);
    __privateAdd(this, _options2);
    __privateAdd(this, _operators2, {});
    __privateAdd(this, _result, null);
    __privateAdd(this, _buffer, []);
    __privateSet(this, _source, source);
    __privateSet(this, _predicate, predicate);
    __privateSet(this, _projection, projection);
    __privateSet(this, _options2, options);
  }
  /** Returns the iterator from running the query */
  fetch() {
    if (__privateGet(this, _result)) return __privateGet(this, _result);
    __privateSet(this, _result, Lazy(__privateGet(this, _source)).filter(__privateGet(this, _predicate)));
    const mode = __privateGet(this, _options2).processingMode;
    if (mode & ProcessingMode.CLONE_INPUT) __privateGet(this, _result).map(cloneDeep);
    for (const op of ["$sort", "$skip", "$limit"]) {
      if (has(__privateGet(this, _operators2), op)) {
        __privateSet(this, _result, OPERATORS[op](
          __privateGet(this, _result),
          __privateGet(this, _operators2)[op],
          __privateGet(this, _options2)
        ));
      }
    }
    if (Object.keys(__privateGet(this, _projection)).length) {
      __privateSet(this, _result, $project(__privateGet(this, _result), __privateGet(this, _projection), __privateGet(this, _options2)));
    }
    if (mode & ProcessingMode.CLONE_OUTPUT) __privateGet(this, _result).map(cloneDeep);
    return __privateGet(this, _result);
  }
  /** Returns an iterator with the buffered data included */
  fetchAll() {
    const buffered = Lazy([...__privateGet(this, _buffer)]);
    __privateSet(this, _buffer, []);
    return concat(buffered, this.fetch());
  }
  /**
   * Return remaining objects in the cursor as an array. This method exhausts the cursor
   * @returns {Array}
   */
  all() {
    return this.fetchAll().value();
  }
  /**
   * Returns the number of objects return in the cursor. This method exhausts the cursor
   * @returns {Number}
   */
  count() {
    return this.all().length;
  }
  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip(n) {
    __privateGet(this, _operators2)["$skip"] = n;
    return this;
  }
  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  limit(n) {
    __privateGet(this, _operators2)["$limit"] = n;
    return this;
  }
  /**
   * Returns results ordered according to a sort specification.
   * @param {AnyObject} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  sort(modifier) {
    __privateGet(this, _operators2)["$sort"] = modifier;
    return this;
  }
  /**
   * Specifies the collation for the cursor returned by the `mingo.Query.find`
   * @param {*} spec
   */
  collation(spec) {
    __privateSet(this, _options2, { ...__privateGet(this, _options2), collation: spec });
    return this;
  }
  /**
   * Returns the next document in a cursor.
   * @returns {AnyObject | Boolean}
   */
  next() {
    if (__privateGet(this, _buffer).length > 0) {
      return __privateGet(this, _buffer).pop();
    }
    const o = this.fetch().next();
    if (o.done) return;
    return o.value;
  }
  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext() {
    if (__privateGet(this, _buffer).length > 0) return true;
    const o = this.fetch().next();
    if (o.done) return false;
    __privateGet(this, _buffer).push(o.value);
    return true;
  }
  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param fn
   * @returns {Array}
   */
  map(fn) {
    return this.all().map(fn);
  }
  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param fn
   */
  forEach(fn) {
    this.all().forEach(fn);
  }
  [Symbol.iterator]() {
    return this.fetchAll();
  }
}
_source = new WeakMap();
_predicate = new WeakMap();
_projection = new WeakMap();
_options2 = new WeakMap();
_operators2 = new WeakMap();
_result = new WeakMap();
_buffer = new WeakMap();
const TOP_LEVEL_OPS = new Set(
  Array.from(["$and", "$or", "$nor", "$expr", "$jsonSchema"])
);
class Query {
  constructor(condition, options) {
    __privateAdd(this, _compiled);
    __privateAdd(this, _options3);
    __privateAdd(this, _condition);
    __privateSet(this, _condition, cloneDeep(condition));
    __privateSet(this, _options3, initOptions(options));
    __privateSet(this, _compiled, []);
    this.compile();
  }
  compile() {
    assert(
      isObject$2(__privateGet(this, _condition)),
      `query criteria must be an object: ${JSON.stringify(__privateGet(this, _condition))}`
    );
    const whereOperator = {};
    for (const [field, expr] of Object.entries(__privateGet(this, _condition))) {
      if ("$where" === field) {
        assert(
          __privateGet(this, _options3).scriptEnabled,
          "$where operator requires 'scriptEnabled' option to be true."
        );
        Object.assign(whereOperator, { field, expr });
      } else if (TOP_LEVEL_OPS.has(field)) {
        this.processOperator(field, field, expr);
      } else {
        assert(!isOperator(field), `unknown top level operator: ${field}`);
        for (const [operator, val] of Object.entries(
          normalize(expr)
        )) {
          this.processOperator(field, operator, val);
        }
      }
      if (whereOperator.field) {
        this.processOperator(
          whereOperator.field,
          whereOperator.field,
          whereOperator.expr
        );
      }
    }
  }
  processOperator(field, operator, value) {
    const call = getOperator("query", operator, __privateGet(this, _options3));
    assert(!!call, `unknown query operator ${operator}`);
    __privateGet(this, _compiled).push(call(field, value, __privateGet(this, _options3)));
  }
  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   *
   * @param obj The object to test
   * @returns {boolean}
   */
  test(obj) {
    return __privateGet(this, _compiled).every((p) => p(obj));
  }
  /**
   * Returns a cursor to select matching documents from the input source.
   *
   * @param source A source providing a sequence of documents
   * @param projection An optional projection criteria
   * @returns {Cursor} A Cursor for iterating over the results
   */
  find(collection, projection) {
    return new Cursor(
      collection,
      (o) => this.test(o),
      projection || {},
      __privateGet(this, _options3)
    );
  }
  /**
   * Remove matched documents from the collection returning the remainder
   *
   * @param collection An array of documents
   * @returns {Array} A new array with matching elements removed
   */
  remove(collection) {
    return collection.reduce((acc, obj) => {
      if (!this.test(obj)) acc.push(obj);
      return acc;
    }, []);
  }
}
_compiled = new WeakMap();
_options3 = new WeakMap();
_condition = new WeakMap();
const DAYS_OF_WEEK = [
  "monday",
  "mon",
  "tuesday",
  "tue",
  "wednesday",
  "wed",
  "thursday",
  "thu",
  "friday",
  "fri",
  "saturday",
  "sat",
  "sunday",
  "sun"
];
new Set(DAYS_OF_WEEK);
function createQueryOperator(predicate) {
  const f = (selector, value, options) => {
    const opts = { unwrapArray: true };
    const depth = Math.max(1, selector.split(".").length - 1);
    return (obj) => {
      const lhs = resolve(obj, selector, opts);
      return predicate(lhs, value, { ...options, depth });
    };
  };
  return f;
}
function createExpressionOperator(predicate) {
  return (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return predicate(...args);
  };
}
function $eq$2(a, b, options) {
  if (isEqual(a, b)) return true;
  if (isNil(a) && isNil(b)) return true;
  if (isArray(a)) {
    return a.some((v) => isEqual(v, b)) || flatten(a, options == null ? void 0 : options.depth).some((v) => isEqual(v, b));
  }
  return false;
}
function $ne$2(a, b, options) {
  return !$eq$2(a, b, options);
}
function $in$1(a, b, options) {
  if (isNil(a)) return b.some((v) => v === null);
  return intersection([ensureArray(a), b], options == null ? void 0 : options.hashFunction).length > 0;
}
function $nin$1(a, b, options) {
  return !$in$1(a, b, options);
}
function $lt$2(a, b, _options4) {
  return compare(a, b, (x, y) => compare$1(x, y) < 0);
}
function $lte$2(a, b, _options4) {
  return compare(a, b, (x, y) => compare$1(x, y) <= 0);
}
function $gt$2(a, b, _options4) {
  return compare(a, b, (x, y) => compare$1(x, y) > 0);
}
function $gte$2(a, b, _options4) {
  return compare(a, b, (x, y) => compare$1(x, y) >= 0);
}
function $mod$1(a, b, _options4) {
  return ensureArray(a).some(
    (x) => b.length === 2 && x % b[0] === b[1]
  );
}
function $regex$1(a, b, options) {
  const lhs = ensureArray(a);
  const match = (x) => isString(x) && truthy(b.exec(x), options == null ? void 0 : options.useStrictMode);
  return lhs.some(match) || flatten(lhs, 1).some(match);
}
function $all$1(values, queries, options) {
  if (!isArray(values) || !isArray(queries) || !values.length || !queries.length) {
    return false;
  }
  let matched = true;
  for (const query of queries) {
    if (!matched) break;
    if (isObject$2(query) && Object.keys(query).includes("$elemMatch")) {
      matched = $elemMatch$1(values, query["$elemMatch"], options);
    } else if (isRegExp(query)) {
      matched = values.some((s) => typeof s === "string" && query.test(s));
    } else {
      matched = values.some((v) => isEqual(query, v));
    }
  }
  return matched;
}
function $size$1(a, b, _options4) {
  return Array.isArray(a) && a.length === b;
}
function isNonBooleanOperator(name) {
  return isOperator(name) && ["$and", "$or", "$nor"].indexOf(name) === -1;
}
function $elemMatch$1(a, b, options) {
  if (isArray(a) && !isEmpty(a)) {
    let format = (x) => x;
    let criteria = b;
    if (Object.keys(b).every(isNonBooleanOperator)) {
      criteria = { temp: b };
      format = (x) => ({ temp: x });
    }
    const query = new Query(criteria, options);
    for (let i = 0, len = a.length; i < len; i++) {
      if (query.test(format(a[i]))) {
        return true;
      }
    }
  }
  return false;
}
const isNull = (a) => a === null;
const compareFuncs = {
  array: isArray,
  boolean: isBoolean,
  bool: isBoolean,
  date: isDate,
  number: isNumber,
  int: isNumber,
  long: isNumber,
  double: isNumber,
  decimal: isNumber,
  null: isNull,
  object: isObject$2,
  regexp: isRegExp,
  regex: isRegExp,
  string: isString,
  // added for completeness
  undefined: isNil,
  // deprecated
  function: (_) => {
    throw new MingoError("unsupported type key `function`.");
  },
  // Mongo identifiers
  1: isNumber,
  //double
  2: isString,
  3: isObject$2,
  4: isArray,
  6: isNil,
  // deprecated
  8: isBoolean,
  9: isDate,
  10: isNull,
  11: isRegExp,
  16: isNumber,
  //int
  18: isNumber,
  //long
  19: isNumber
  //decimal
};
function compareType(a, b, _) {
  const f = compareFuncs[b];
  return f ? f(a) : false;
}
function $type$1(a, b, options) {
  return isArray(b) ? b.findIndex((t) => compareType(a, t)) >= 0 : compareType(a, b);
}
function compare(a, b, f) {
  return ensureArray(a).some((x) => typeOf(x) === typeOf(b) && f(x, b));
}
const $and$1 = (obj, expr, options) => {
  const value = computeValue(obj, expr, null, options);
  return truthy(value, options.useStrictMode) && value.every((v) => truthy(v, options.useStrictMode));
};
const $not$1 = (obj, expr, options) => {
  const booleanExpr = ensureArray(expr);
  if (booleanExpr.length == 0) return false;
  assert(booleanExpr.length == 1, "Expression $not takes exactly 1 argument");
  return !computeValue(obj, booleanExpr[0], null, options);
};
const $or$1 = (obj, expr, options) => {
  const value = computeValue(obj, expr, null, options);
  const strict = options.useStrictMode;
  return truthy(value, strict) && value.some((v) => truthy(v, strict));
};
const booleanOperators = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  $and: $and$1,
  $not: $not$1,
  $or: $or$1
}, Symbol.toStringTag, { value: "Module" }));
const $cmp = (obj, expr, options) => {
  const args = computeValue(obj, expr, null, options);
  assert(
    isArray(args) && args.length == 2,
    "$cmp: expression must resolve to array of size 2."
  );
  return compare$1(args[0], args[1]);
};
const $eq$1 = createExpressionOperator($eq$2);
const $gt$1 = createExpressionOperator($gt$2);
const $gte$1 = createExpressionOperator($gte$2);
const $lt$1 = createExpressionOperator($lt$2);
const $lte$1 = createExpressionOperator($lte$2);
const $ne$1 = createExpressionOperator($ne$2);
const comparisonOperators = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  $cmp,
  $eq: $eq$1,
  $gt: $gt$1,
  $gte: $gte$1,
  $lt: $lt$1,
  $lte: $lte$1,
  $ne: $ne$1
}, Symbol.toStringTag, { value: "Module" }));
const buildMap = (letters, sign) => {
  const h = {};
  letters.split("").forEach((v, i) => h[v] = sign * (i + 1));
  return h;
};
({
  ...buildMap("ABCDEFGHIKLM", 1),
  ...buildMap("NOPQRSTUVWXY", -1)
});
const FIXED_POINTS = {
  undefined: null,
  null: null,
  NaN: NaN,
  Infinity: new Error(),
  "-Infinity": new Error()
};
function createTrignometryOperator(f, fixedPoints = FIXED_POINTS) {
  const fp = Object.assign({}, FIXED_POINTS, fixedPoints);
  const keySet = new Set(Object.keys(fp));
  return (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (keySet.has(`${n}`)) {
      const res = fp[`${n}`];
      if (res instanceof Error) {
        throw new MingoError(
          `cannot apply $${f.name} to -inf, value must in (-inf,inf)`
        );
      }
      return res;
    }
    return f(n);
  };
}
createTrignometryOperator(Math.acos, {
  Infinity: Infinity,
  0: new Error()
});
createTrignometryOperator(Math.acosh, {
  Infinity: Infinity,
  0: new Error()
});
createTrignometryOperator(Math.asin);
createTrignometryOperator(Math.asinh, {
  Infinity: Infinity,
  "-Infinity": -Infinity
});
createTrignometryOperator(Math.atan);
createTrignometryOperator(Math.atanh, {
  1: Infinity,
  "-1": -Infinity
});
createTrignometryOperator(Math.cos);
createTrignometryOperator(Math.cosh, {
  "-Infinity": Infinity,
  Infinity: Infinity
});
const RADIANS_FACTOR = Math.PI / 180;
createTrignometryOperator(
  (n) => n * RADIANS_FACTOR,
  {
    Infinity: Infinity,
    "-Infinity": Infinity
  }
);
const DEGREES_FACTOR = 180 / Math.PI;
createTrignometryOperator(
  (n) => n * DEGREES_FACTOR,
  {
    Infinity: Infinity,
    "-Infinity": -Infinity
  }
);
createTrignometryOperator(Math.sin);
createTrignometryOperator(Math.sinh, {
  "-Infinity": -Infinity,
  Infinity: Infinity
});
createTrignometryOperator(Math.tan);
const $and = (_, rhs, options) => {
  assert(
    isArray(rhs),
    "Invalid expression: $and expects value to be an Array."
  );
  const queries = rhs.map((expr) => new Query(expr, options));
  return (obj) => queries.every((q) => q.test(obj));
};
const $or = (_, rhs, options) => {
  assert(isArray(rhs), "Invalid expression. $or expects value to be an Array");
  const queries = rhs.map((expr) => new Query(expr, options));
  return (obj) => queries.some((q) => q.test(obj));
};
const $nor = (_, rhs, options) => {
  assert(
    isArray(rhs),
    "Invalid expression. $nor expects value to be an array."
  );
  const f = $or("$or", rhs, options);
  return (obj) => !f(obj);
};
const $not = (selector, rhs, options) => {
  const criteria = {};
  criteria[selector] = normalize(rhs);
  const query = new Query(criteria, options);
  return (obj) => !query.test(obj);
};
const $eq = createQueryOperator($eq$2);
const $gt = createQueryOperator($gt$2);
const $gte = createQueryOperator($gte$2);
const $in = createQueryOperator($in$1);
const $lt = createQueryOperator($lt$2);
const $lte = createQueryOperator($lte$2);
const $ne = createQueryOperator($ne$2);
const $nin = createQueryOperator($nin$1);
function $expr(_, rhs, options) {
  return (obj) => computeValue(obj, rhs, null, options);
}
function $jsonSchema(_, schema, options) {
  if (!(options == null ? void 0 : options.jsonSchemaValidator)) {
    throw new MingoError(
      "Missing option 'jsonSchemaValidator'. Configure to use '$jsonSchema' operator."
    );
  }
  const validate = options == null ? void 0 : options.jsonSchemaValidator(schema);
  return (obj) => validate(obj);
}
const $mod = createQueryOperator($mod$1);
const $regex = createQueryOperator($regex$1);
function $where(_, rhs, options) {
  assert(
    options.scriptEnabled,
    "$where operator requires 'scriptEnabled' option to be true"
  );
  const f = rhs;
  assert(isFunction(f), "$where only accepts a Function object");
  return (obj) => truthy(f.call(obj), options == null ? void 0 : options.useStrictMode);
}
const $all = createQueryOperator($all$1);
const $elemMatch = createQueryOperator($elemMatch$1);
const $size = createQueryOperator($size$1);
const $exists = (selector, value, _options4) => {
  const nested = selector.includes(".");
  const b = !!value;
  if (!nested || selector.match(/\.\d+$/)) {
    return (o) => resolve(o, selector) !== void 0 === b;
  }
  return (o) => {
    const path = resolveGraph(o, selector, { preserveIndex: true });
    const val = resolve(path, selector.substring(0, selector.lastIndexOf(".")));
    return isArray(val) ? val.some((v) => v !== void 0) === b : val !== void 0 === b;
  };
};
const $type = createQueryOperator($type$1);
var mingoInitDone = false;
function getMingoQuery(selector) {
  if (!mingoInitDone) {
    useOperators(OperatorType.PIPELINE, {
      $sort,
      $project
    });
    useOperators(OperatorType.QUERY, {
      $and,
      $eq,
      $elemMatch,
      $exists,
      $gt,
      $gte,
      $in,
      $lt,
      $lte,
      $ne,
      $nin,
      $mod,
      $nor,
      $not,
      $or,
      $regex,
      $size,
      $type
    });
    mingoInitDone = true;
  }
  return new Query(selector);
}
function normalizeMangoQuery(schema, mangoQuery) {
  var primaryKey = getPrimaryFieldOfPrimaryKey(schema.primaryKey);
  mangoQuery = flatClone(mangoQuery);
  var normalizedMangoQuery = clone$1(mangoQuery);
  if (typeof normalizedMangoQuery.skip !== "number") {
    normalizedMangoQuery.skip = 0;
  }
  if (!normalizedMangoQuery.selector) {
    normalizedMangoQuery.selector = {};
  } else {
    normalizedMangoQuery.selector = normalizedMangoQuery.selector;
    Object.entries(normalizedMangoQuery.selector).forEach(([field, matcher]) => {
      if (typeof matcher !== "object" || matcher === null) {
        normalizedMangoQuery.selector[field] = {
          $eq: matcher
        };
      }
    });
  }
  if (normalizedMangoQuery.index) {
    var indexAr = toArray(normalizedMangoQuery.index);
    if (!indexAr.includes(primaryKey)) {
      indexAr.push(primaryKey);
    }
    normalizedMangoQuery.index = indexAr;
  }
  if (!normalizedMangoQuery.sort) {
    if (normalizedMangoQuery.index) {
      normalizedMangoQuery.sort = normalizedMangoQuery.index.map((field) => {
        return {
          [field]: "asc"
        };
      });
    } else {
      if (schema.indexes) {
        var fieldsWithLogicalOperator = /* @__PURE__ */ new Set();
        Object.entries(normalizedMangoQuery.selector).forEach(([field, matcher]) => {
          var hasLogical = false;
          if (typeof matcher === "object" && matcher !== null) {
            hasLogical = !!Object.keys(matcher).find((operator) => LOGICAL_OPERATORS.has(operator));
          } else {
            hasLogical = true;
          }
          if (hasLogical) {
            fieldsWithLogicalOperator.add(field);
          }
        });
        var currentFieldsAmount = -1;
        var currentBestIndexForSort;
        schema.indexes.forEach((index) => {
          var useIndex2 = isMaybeReadonlyArray(index) ? index : [index];
          var firstWrongIndex = useIndex2.findIndex((indexField) => !fieldsWithLogicalOperator.has(indexField));
          if (firstWrongIndex > 0 && firstWrongIndex > currentFieldsAmount) {
            currentFieldsAmount = firstWrongIndex;
            currentBestIndexForSort = useIndex2;
          }
        });
        if (currentBestIndexForSort) {
          normalizedMangoQuery.sort = currentBestIndexForSort.map((field) => {
            return {
              [field]: "asc"
            };
          });
        }
      }
      if (!normalizedMangoQuery.sort) {
        if (schema.indexes && schema.indexes.length > 0) {
          var firstIndex = schema.indexes[0];
          var useIndex = isMaybeReadonlyArray(firstIndex) ? firstIndex : [firstIndex];
          normalizedMangoQuery.sort = useIndex.map((field) => ({
            [field]: "asc"
          }));
        } else {
          normalizedMangoQuery.sort = [{
            [primaryKey]: "asc"
          }];
        }
      }
    }
  } else {
    var isPrimaryInSort = normalizedMangoQuery.sort.find((p) => firstPropertyNameOfObject(p) === primaryKey);
    if (!isPrimaryInSort) {
      normalizedMangoQuery.sort = normalizedMangoQuery.sort.slice(0);
      normalizedMangoQuery.sort.push({
        [primaryKey]: "asc"
      });
    }
  }
  return normalizedMangoQuery;
}
function getSortComparator(schema, query) {
  if (!query.sort) {
    throw newRxError("SNH", {
      query
    });
  }
  var sortParts = [];
  query.sort.forEach((sortBlock) => {
    var key = Object.keys(sortBlock)[0];
    var direction = Object.values(sortBlock)[0];
    sortParts.push({
      key,
      direction,
      getValueFn: objectPathMonad(key)
    });
  });
  var fun = (a, b) => {
    for (var i = 0; i < sortParts.length; ++i) {
      var sortPart = sortParts[i];
      var valueA = sortPart.getValueFn(a);
      var valueB = sortPart.getValueFn(b);
      if (valueA !== valueB) {
        var ret = sortPart.direction === "asc" ? compare$1(valueA, valueB) : compare$1(valueB, valueA);
        return ret;
      }
    }
  };
  return fun;
}
function getQueryMatcher(_schema, query) {
  if (!query.sort) {
    throw newRxError("SNH", {
      query
    });
  }
  var mingoQuery = getMingoQuery(query.selector);
  var fun = (doc) => {
    return mingoQuery.test(doc);
  };
  return fun;
}
async function runQueryUpdateFunction(rxQuery, fn) {
  var docs = await rxQuery.exec();
  if (!docs) {
    return null;
  }
  if (Array.isArray(docs)) {
    return Promise.all(docs.map((doc) => fn(doc)));
  } else if (docs instanceof Map) {
    return Promise.all([...docs.values()].map((doc) => fn(doc)));
  } else {
    var result = await fn(docs);
    return result;
  }
}
function prepareQuery(schema, mutateableQuery) {
  if (!mutateableQuery.sort) {
    throw newRxError("SNH", {
      query: mutateableQuery
    });
  }
  var queryPlan = getQueryPlan(schema, mutateableQuery);
  return {
    query: mutateableQuery,
    queryPlan
  };
}
var INTERNAL_STORAGE_NAME = "_rxdb_internal";
async function getSingleDocument(storageInstance, documentId) {
  var results = await storageInstance.findDocumentsById([documentId], false);
  var doc = results[0];
  if (doc) {
    return doc;
  } else {
    return void 0;
  }
}
async function writeSingle(instance, writeRow, context) {
  var writeResult = await instance.bulkWrite([writeRow], context);
  if (writeResult.error.length > 0) {
    var error = writeResult.error[0];
    throw error;
  } else {
    var primaryPath = getPrimaryFieldOfPrimaryKey(instance.schema.primaryKey);
    var success = getWrittenDocumentsFromBulkWriteResponse(primaryPath, [writeRow], writeResult);
    var ret = success[0];
    return ret;
  }
}
function observeSingle(storageInstance, documentId) {
  var firstFindPromise = getSingleDocument(storageInstance, documentId);
  var ret = storageInstance.changeStream().pipe(map((evBulk) => evBulk.events.find((ev) => ev.documentId === documentId)), filter((ev) => !!ev), map((ev) => Promise.resolve(ensureNotFalsy(ev).documentData)), startWith(firstFindPromise), switchMap((v) => v), filter((v) => !!v));
  return ret;
}
function stackCheckpoints(checkpoints) {
  return Object.assign({}, ...checkpoints);
}
function throwIfIsStorageWriteError(collection, documentId, writeData, error) {
  if (error) {
    if (error.status === 409) {
      throw newRxError("CONFLICT", {
        collection: collection.name,
        id: documentId,
        writeError: error,
        data: writeData
      });
    } else if (error.status === 422) {
      throw newRxError("VD2", {
        collection: collection.name,
        id: documentId,
        writeError: error,
        data: writeData
      });
    } else {
      throw error;
    }
  }
}
function categorizeBulkWriteRows(storageInstance, primaryPath, docsInDb, bulkWriteRows, context, onInsert, onUpdate) {
  var hasAttachments = !!storageInstance.schema.attachments;
  var bulkInsertDocs = [];
  var bulkUpdateDocs = [];
  var errors = [];
  var eventBulkId = randomToken$1(10);
  var eventBulk = {
    id: eventBulkId,
    events: [],
    checkpoint: null,
    context
  };
  var eventBulkEvents = eventBulk.events;
  var attachmentsAdd = [];
  var attachmentsRemove = [];
  var attachmentsUpdate = [];
  var hasDocsInDb = docsInDb.size > 0;
  var newestRow;
  var rowAmount = bulkWriteRows.length;
  var _loop = function() {
    var writeRow = bulkWriteRows[rowId];
    var document2 = writeRow.document;
    var previous = writeRow.previous;
    var docId = document2[primaryPath];
    var documentDeleted = document2._deleted;
    var previousDeleted = previous && previous._deleted;
    var documentInDb = void 0;
    if (hasDocsInDb) {
      documentInDb = docsInDb.get(docId);
    }
    var attachmentError;
    if (!documentInDb) {
      var insertedIsDeleted = documentDeleted ? true : false;
      if (hasAttachments) {
        Object.entries(document2._attachments).forEach(([attachmentId, attachmentData]) => {
          if (!attachmentData.data) {
            attachmentError = {
              documentId: docId,
              isError: true,
              status: 510,
              writeRow,
              attachmentId
            };
            errors.push(attachmentError);
          } else {
            attachmentsAdd.push({
              documentId: docId,
              attachmentId,
              attachmentData,
              digest: attachmentData.digest
            });
          }
        });
      }
      if (!attachmentError) {
        if (hasAttachments) {
          bulkInsertDocs.push(stripAttachmentsDataFromRow(writeRow));
        } else {
          bulkInsertDocs.push(writeRow);
        }
        newestRow = writeRow;
      }
      if (!insertedIsDeleted) {
        var event = {
          documentId: docId,
          operation: "INSERT",
          documentData: hasAttachments ? stripAttachmentsDataFromDocument(document2) : document2,
          previousDocumentData: hasAttachments && previous ? stripAttachmentsDataFromDocument(previous) : previous
        };
        eventBulkEvents.push(event);
      }
    } else {
      var revInDb = documentInDb._rev;
      if (!previous || !!previous && revInDb !== previous._rev) {
        var err = {
          isError: true,
          status: 409,
          documentId: docId,
          writeRow,
          documentInDb
        };
        errors.push(err);
        return 1;
      }
      var updatedRow = hasAttachments ? stripAttachmentsDataFromRow(writeRow) : writeRow;
      if (hasAttachments) {
        if (documentDeleted) {
          if (previous) {
            Object.keys(previous._attachments).forEach((attachmentId) => {
              attachmentsRemove.push({
                documentId: docId,
                attachmentId,
                digest: ensureNotFalsy(previous)._attachments[attachmentId].digest
              });
            });
          }
        } else {
          Object.entries(document2._attachments).find(([attachmentId, attachmentData]) => {
            var previousAttachmentData = previous ? previous._attachments[attachmentId] : void 0;
            if (!previousAttachmentData && !attachmentData.data) {
              attachmentError = {
                documentId: docId,
                documentInDb,
                isError: true,
                status: 510,
                writeRow,
                attachmentId
              };
            }
            return true;
          });
          if (!attachmentError) {
            Object.entries(document2._attachments).forEach(([attachmentId, attachmentData]) => {
              var previousAttachmentData = previous ? previous._attachments[attachmentId] : void 0;
              if (!previousAttachmentData) {
                attachmentsAdd.push({
                  documentId: docId,
                  attachmentId,
                  attachmentData,
                  digest: attachmentData.digest
                });
              } else {
                var newDigest = updatedRow.document._attachments[attachmentId].digest;
                if (attachmentData.data && /**
                 * Performance shortcut,
                 * do not update the attachment data if it did not change.
                 */
                previousAttachmentData.digest !== newDigest) {
                  attachmentsUpdate.push({
                    documentId: docId,
                    attachmentId,
                    attachmentData,
                    digest: attachmentData.digest
                  });
                }
              }
            });
          }
        }
      }
      if (attachmentError) {
        errors.push(attachmentError);
      } else {
        if (hasAttachments) {
          bulkUpdateDocs.push(stripAttachmentsDataFromRow(updatedRow));
        } else {
          bulkUpdateDocs.push(updatedRow);
        }
        newestRow = updatedRow;
      }
      var eventDocumentData = null;
      var previousEventDocumentData = null;
      var operation = null;
      if (previousDeleted && !documentDeleted) {
        operation = "INSERT";
        eventDocumentData = hasAttachments ? stripAttachmentsDataFromDocument(document2) : document2;
      } else if (previous && !previousDeleted && !documentDeleted) {
        operation = "UPDATE";
        eventDocumentData = hasAttachments ? stripAttachmentsDataFromDocument(document2) : document2;
        previousEventDocumentData = previous;
      } else if (documentDeleted) {
        operation = "DELETE";
        eventDocumentData = ensureNotFalsy(document2);
        previousEventDocumentData = previous;
      } else {
        throw newRxError("SNH", {
          args: {
            writeRow
          }
        });
      }
      var _event = {
        documentId: docId,
        documentData: eventDocumentData,
        previousDocumentData: previousEventDocumentData,
        operation
      };
      eventBulkEvents.push(_event);
    }
  };
  for (var rowId = 0; rowId < rowAmount; rowId++) {
    if (_loop()) continue;
  }
  return {
    bulkInsertDocs,
    bulkUpdateDocs,
    newestRow,
    errors,
    eventBulk,
    attachmentsAdd,
    attachmentsRemove,
    attachmentsUpdate
  };
}
function stripAttachmentsDataFromRow(writeRow) {
  return {
    previous: writeRow.previous,
    document: stripAttachmentsDataFromDocument(writeRow.document)
  };
}
function getAttachmentSize(attachmentBase64String) {
  return atob(attachmentBase64String).length;
}
function attachmentWriteDataToNormalData(writeData) {
  var data = writeData.data;
  if (!data) {
    return writeData;
  }
  var ret = {
    length: getAttachmentSize(data),
    digest: writeData.digest,
    type: writeData.type
  };
  return ret;
}
function stripAttachmentsDataFromDocument(doc) {
  if (!doc._attachments || Object.keys(doc._attachments).length === 0) {
    return doc;
  }
  var useDoc = flatClone(doc);
  useDoc._attachments = {};
  Object.entries(doc._attachments).forEach(([attachmentId, attachmentData]) => {
    useDoc._attachments[attachmentId] = attachmentWriteDataToNormalData(attachmentData);
  });
  return useDoc;
}
function flatCloneDocWithMeta(doc) {
  return Object.assign({}, doc, {
    _meta: flatClone(doc._meta)
  });
}
function getWrappedStorageInstance(database, storageInstance, rxJsonSchema) {
  overwritable.deepFreezeWhenDevMode(rxJsonSchema);
  var primaryPath = getPrimaryFieldOfPrimaryKey(storageInstance.schema.primaryKey);
  var ret = {
    originalStorageInstance: storageInstance,
    schema: storageInstance.schema,
    internals: storageInstance.internals,
    collectionName: storageInstance.collectionName,
    databaseName: storageInstance.databaseName,
    options: storageInstance.options,
    async bulkWrite(rows, context) {
      var databaseToken = database.token;
      var toStorageWriteRows = new Array(rows.length);
      var time = now$1();
      for (var index = 0; index < rows.length; index++) {
        var writeRow = rows[index];
        var document2 = flatCloneDocWithMeta(writeRow.document);
        document2._meta.lwt = time;
        var previous = writeRow.previous;
        document2._rev = createRevision(databaseToken, previous);
        toStorageWriteRows[index] = {
          document: document2,
          previous
        };
      }
      runPluginHooks("preStorageWrite", {
        storageInstance: this.originalStorageInstance,
        rows: toStorageWriteRows
      });
      var writeResult = await database.lockedRun(() => storageInstance.bulkWrite(toStorageWriteRows, context));
      var useWriteResult = {
        error: []
      };
      BULK_WRITE_ROWS_BY_RESPONSE.set(useWriteResult, toStorageWriteRows);
      var reInsertErrors = writeResult.error.length === 0 ? [] : writeResult.error.filter((error) => {
        if (error.status === 409 && !error.writeRow.previous && !error.writeRow.document._deleted && ensureNotFalsy(error.documentInDb)._deleted) {
          return true;
        }
        useWriteResult.error.push(error);
        return false;
      });
      if (reInsertErrors.length > 0) {
        var reInsertIds = /* @__PURE__ */ new Set();
        var reInserts = reInsertErrors.map((error) => {
          reInsertIds.add(error.documentId);
          return {
            previous: error.documentInDb,
            document: Object.assign({}, error.writeRow.document, {
              _rev: createRevision(database.token, error.documentInDb)
            })
          };
        });
        var subResult = await database.lockedRun(() => storageInstance.bulkWrite(reInserts, context));
        appendToArray(useWriteResult.error, subResult.error);
        var successArray = getWrittenDocumentsFromBulkWriteResponse(primaryPath, toStorageWriteRows, useWriteResult, reInsertIds);
        var subSuccess = getWrittenDocumentsFromBulkWriteResponse(primaryPath, reInserts, subResult);
        appendToArray(successArray, subSuccess);
        return useWriteResult;
      }
      return useWriteResult;
    },
    query(preparedQuery) {
      return database.lockedRun(() => storageInstance.query(preparedQuery));
    },
    count(preparedQuery) {
      return database.lockedRun(() => storageInstance.count(preparedQuery));
    },
    findDocumentsById(ids, deleted) {
      return database.lockedRun(() => storageInstance.findDocumentsById(ids, deleted));
    },
    getAttachmentData(documentId, attachmentId, digest) {
      return database.lockedRun(() => storageInstance.getAttachmentData(documentId, attachmentId, digest));
    },
    getChangedDocumentsSince: !storageInstance.getChangedDocumentsSince ? void 0 : (limit, checkpoint) => {
      return database.lockedRun(() => storageInstance.getChangedDocumentsSince(ensureNotFalsy(limit), checkpoint));
    },
    cleanup(minDeletedTime) {
      return database.lockedRun(() => storageInstance.cleanup(minDeletedTime));
    },
    remove() {
      database.storageInstances.delete(ret);
      return database.lockedRun(() => storageInstance.remove());
    },
    close() {
      database.storageInstances.delete(ret);
      return database.lockedRun(() => storageInstance.close());
    },
    changeStream() {
      return storageInstance.changeStream();
    }
  };
  database.storageInstances.add(ret);
  return ret;
}
function ensureRxStorageInstanceParamsAreCorrect(params) {
  if (params.schema.keyCompression) {
    throw newRxError("UT5", {
      args: {
        params
      }
    });
  }
  if (hasEncryption(params.schema)) {
    throw newRxError("UT6", {
      args: {
        params
      }
    });
  }
  if (params.schema.attachments && params.schema.attachments.compression) {
    throw newRxError("UT7", {
      args: {
        params
      }
    });
  }
}
function hasEncryption(jsonSchema) {
  if (!!jsonSchema.encrypted && jsonSchema.encrypted.length > 0 || jsonSchema.attachments && jsonSchema.attachments.encrypted) {
    return true;
  } else {
    return false;
  }
}
function getChangedDocumentsSinceQuery(storageInstance, limit, checkpoint) {
  var primaryPath = getPrimaryFieldOfPrimaryKey(storageInstance.schema.primaryKey);
  var sinceLwt = checkpoint ? checkpoint.lwt : RX_META_LWT_MINIMUM;
  var sinceId = checkpoint ? checkpoint.id : "";
  return normalizeMangoQuery(storageInstance.schema, {
    selector: {
      $or: [{
        "_meta.lwt": {
          $gt: sinceLwt
        }
      }, {
        "_meta.lwt": {
          $eq: sinceLwt
        },
        [primaryPath]: {
          $gt: checkpoint ? sinceId : ""
        }
      }],
      // add this hint for better index usage
      "_meta.lwt": {
        $gte: sinceLwt
      }
    },
    sort: [{
      "_meta.lwt": "asc"
    }, {
      [primaryPath]: "asc"
    }],
    skip: 0,
    limit
    /**
     * DO NOT SET A SPECIFIC INDEX HERE!
     * The query might be modified by some plugin
     * before sending it to the storage.
     * We can be sure that in the end the query planner
     * will find the best index.
     */
    // index: ['_meta.lwt', primaryPath]
  });
}
async function getChangedDocumentsSince(storageInstance, limit, checkpoint) {
  if (storageInstance.getChangedDocumentsSince) {
    return storageInstance.getChangedDocumentsSince(limit, checkpoint);
  }
  var primaryPath = getPrimaryFieldOfPrimaryKey(storageInstance.schema.primaryKey);
  var query = prepareQuery(storageInstance.schema, getChangedDocumentsSinceQuery(storageInstance, limit, checkpoint));
  var result = await storageInstance.query(query);
  var documents = result.documents;
  var lastDoc = lastOfArray$1(documents);
  return {
    documents,
    checkpoint: lastDoc ? {
      id: lastDoc[primaryPath],
      lwt: lastDoc._meta.lwt
    } : checkpoint ? checkpoint : {
      id: "",
      lwt: 0
    }
  };
}
var BULK_WRITE_ROWS_BY_RESPONSE = /* @__PURE__ */ new WeakMap();
var BULK_WRITE_SUCCESS_MAP = /* @__PURE__ */ new WeakMap();
function getWrittenDocumentsFromBulkWriteResponse(primaryPath, writeRows, response, reInsertIds) {
  return getFromMapOrCreate(BULK_WRITE_SUCCESS_MAP, response, () => {
    var ret = [];
    var realWriteRows = BULK_WRITE_ROWS_BY_RESPONSE.get(response);
    if (!realWriteRows) {
      realWriteRows = writeRows;
    }
    if (response.error.length > 0 || reInsertIds) {
      var errorIds = reInsertIds ? reInsertIds : /* @__PURE__ */ new Set();
      for (var index = 0; index < response.error.length; index++) {
        var error = response.error[index];
        errorIds.add(error.documentId);
      }
      for (var _index = 0; _index < realWriteRows.length; _index++) {
        var doc = realWriteRows[_index].document;
        if (!errorIds.has(doc[primaryPath])) {
          ret.push(stripAttachmentsDataFromDocument(doc));
        }
      }
    } else {
      ret.length = writeRows.length - response.error.length;
      for (var _index2 = 0; _index2 < realWriteRows.length; _index2++) {
        var _doc = realWriteRows[_index2].document;
        ret[_index2] = stripAttachmentsDataFromDocument(_doc);
      }
    }
    return ret;
  });
}
var IncrementalWriteQueue = /* @__PURE__ */ function() {
  function IncrementalWriteQueue2(storageInstance, primaryPath, preWrite, postWrite) {
    this.queueByDocId = /* @__PURE__ */ new Map();
    this.isRunning = false;
    this.storageInstance = storageInstance;
    this.primaryPath = primaryPath;
    this.preWrite = preWrite;
    this.postWrite = postWrite;
  }
  var _proto = IncrementalWriteQueue2.prototype;
  _proto.addWrite = function addWrite(lastKnownDocumentState, modifier) {
    var docId = lastKnownDocumentState[this.primaryPath];
    var ar = getFromMapOrCreate(this.queueByDocId, docId, () => []);
    var ret = new Promise((resolve2, reject) => {
      var item = {
        lastKnownDocumentState,
        modifier,
        resolve: resolve2,
        reject
      };
      ensureNotFalsy(ar).push(item);
      this.triggerRun();
    });
    return ret;
  };
  _proto.triggerRun = async function triggerRun() {
    if (this.isRunning === true || this.queueByDocId.size === 0) {
      return;
    }
    this.isRunning = true;
    var writeRows = [];
    var itemsById = this.queueByDocId;
    this.queueByDocId = /* @__PURE__ */ new Map();
    await Promise.all(Array.from(itemsById.entries()).map(async ([_docId, items]) => {
      var oldData = findNewestOfDocumentStates(items.map((i) => i.lastKnownDocumentState));
      var newData = oldData;
      for (var item of items) {
        try {
          newData = await item.modifier(
            /**
             * We have to clone() each time because the modifier
             * might throw while it already changed some properties
             * of the document.
             */
            clone$1(newData)
          );
        } catch (err) {
          item.reject(err);
          item.reject = () => {
          };
          item.resolve = () => {
          };
        }
      }
      try {
        await this.preWrite(newData, oldData);
      } catch (err) {
        items.forEach((item2) => item2.reject(err));
        return;
      }
      writeRows.push({
        previous: oldData,
        document: newData
      });
    }));
    var writeResult = writeRows.length > 0 ? await this.storageInstance.bulkWrite(writeRows, "incremental-write") : {
      error: []
    };
    await Promise.all(getWrittenDocumentsFromBulkWriteResponse(this.primaryPath, writeRows, writeResult).map((result) => {
      var docId = result[this.primaryPath];
      this.postWrite(result);
      var items = getFromMapOrThrow(itemsById, docId);
      items.forEach((item) => item.resolve(result));
    }));
    writeResult.error.forEach((error) => {
      var docId = error.documentId;
      var items = getFromMapOrThrow(itemsById, docId);
      var isConflict = isBulkWriteConflictError(error);
      if (isConflict) {
        var ar = getFromMapOrCreate(this.queueByDocId, docId, () => []);
        items.reverse().forEach((item) => {
          item.lastKnownDocumentState = ensureNotFalsy(isConflict.documentInDb);
          ensureNotFalsy(ar).unshift(item);
        });
      } else {
        var rxError = rxStorageWriteErrorToRxError(error);
        items.forEach((item) => item.reject(rxError));
      }
    });
    this.isRunning = false;
    return this.triggerRun();
  };
  return IncrementalWriteQueue2;
}();
function modifierFromPublicToInternal(publicModifier) {
  var ret = async (docData) => {
    var withoutMeta = stripMetaDataFromDocument(docData);
    withoutMeta._deleted = docData._deleted;
    var modified = await publicModifier(withoutMeta);
    var reattachedMeta = Object.assign({}, modified, {
      _meta: docData._meta,
      _attachments: docData._attachments,
      _rev: docData._rev,
      _deleted: typeof modified._deleted !== "undefined" ? modified._deleted : docData._deleted
    });
    if (typeof reattachedMeta._deleted === "undefined") {
      reattachedMeta._deleted = false;
    }
    return reattachedMeta;
  };
  return ret;
}
function findNewestOfDocumentStates(docs) {
  var newest = docs[0];
  var newestRevisionHeight = getHeightOfRevision(newest._rev);
  docs.forEach((doc) => {
    var height = getHeightOfRevision(doc._rev);
    if (height > newestRevisionHeight) {
      newest = doc;
      newestRevisionHeight = height;
    }
  });
  return newest;
}
var basePrototype = {
  get primaryPath() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return void 0;
    }
    return _this.collection.schema.primaryPath;
  },
  get primary() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return void 0;
    }
    return _this._data[_this.primaryPath];
  },
  get revision() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return void 0;
    }
    return _this._data._rev;
  },
  get deleted$() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return void 0;
    }
    return _this.$.pipe(map((d) => d._data._deleted));
  },
  get deleted$$() {
    var _this = this;
    var reactivity = _this.collection.database.getReactivityFactory();
    return reactivity.fromObservable(_this.deleted$, _this.getLatest().deleted, _this.collection.database);
  },
  get deleted() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return void 0;
    }
    return _this._data._deleted;
  },
  getLatest() {
    var latestDocData = this.collection._docCache.getLatestDocumentData(this.primary);
    return this.collection._docCache.getCachedRxDocument(latestDocData);
  },
  /**
   * returns the observable which emits the plain-data of this document
   */
  get $() {
    var _this = this;
    var id = this.primary;
    return _this.collection.eventBulks$.pipe(filter((bulk) => !bulk.isLocal), map((bulk) => bulk.events.find((ev) => ev.documentId === id)), filter((event) => !!event), map((changeEvent) => getDocumentDataOfRxChangeEvent(ensureNotFalsy(changeEvent))), startWith(_this.collection._docCache.getLatestDocumentData(id)), distinctUntilChanged((prev, curr) => prev._rev === curr._rev), map((docData) => this.collection._docCache.getCachedRxDocument(docData)), shareReplay(RXJS_SHARE_REPLAY_DEFAULTS));
  },
  get $$() {
    var _this = this;
    var reactivity = _this.collection.database.getReactivityFactory();
    return reactivity.fromObservable(_this.$, _this.getLatest()._data, _this.collection.database);
  },
  /**
   * returns observable of the value of the given path
   */
  get$(path) {
    if (overwritable.isDevMode()) {
      if (path.includes(".item.")) {
        throw newRxError("DOC1", {
          path
        });
      }
      if (path === this.primaryPath) {
        throw newRxError("DOC2");
      }
      if (this.collection.schema.finalFields.includes(path)) {
        throw newRxError("DOC3", {
          path
        });
      }
      var schemaObj = getSchemaByObjectPath(this.collection.schema.jsonSchema, path);
      if (!schemaObj) {
        throw newRxError("DOC4", {
          path
        });
      }
    }
    return this.$.pipe(map((data) => getProperty$1(data, path)), distinctUntilChanged());
  },
  get$$(path) {
    var obs = this.get$(path);
    var reactivity = this.collection.database.getReactivityFactory();
    return reactivity.fromObservable(obs, this.getLatest().get(path), this.collection.database);
  },
  /**
   * populate the given path
   */
  populate(path) {
    var schemaObj = getSchemaByObjectPath(this.collection.schema.jsonSchema, path);
    var value = this.get(path);
    if (!value) {
      return PROMISE_RESOLVE_NULL;
    }
    if (!schemaObj) {
      throw newRxError("DOC5", {
        path
      });
    }
    if (!schemaObj.ref) {
      throw newRxError("DOC6", {
        path,
        schemaObj
      });
    }
    var refCollection = this.collection.database.collections[schemaObj.ref];
    if (!refCollection) {
      throw newRxError("DOC7", {
        ref: schemaObj.ref,
        path,
        schemaObj
      });
    }
    if (schemaObj.type === "array") {
      return refCollection.findByIds(value).exec().then((res) => {
        var valuesIterator = res.values();
        return Array.from(valuesIterator);
      });
    } else {
      return refCollection.findOne(value).exec();
    }
  },
  /**
   * get data by objectPath
   * @hotPath Performance here is really important,
   * run some tests before changing anything.
   */
  get(objPath) {
    return getDocumentProperty(this, objPath);
  },
  toJSON(withMetaFields = false) {
    if (!withMetaFields) {
      var data = flatClone(this._data);
      delete data._rev;
      delete data._attachments;
      delete data._deleted;
      delete data._meta;
      return overwritable.deepFreezeWhenDevMode(data);
    } else {
      return overwritable.deepFreezeWhenDevMode(this._data);
    }
  },
  toMutableJSON(withMetaFields = false) {
    return clone$1(this.toJSON(withMetaFields));
  },
  /**
   * updates document
   * @overwritten by plugin (optional)
   * @param updateObj mongodb-like syntax
   */
  update(_updateObj) {
    throw pluginMissing("update");
  },
  incrementalUpdate(_updateObj) {
    throw pluginMissing("update");
  },
  updateCRDT(_updateObj) {
    throw pluginMissing("crdt");
  },
  putAttachment() {
    throw pluginMissing("attachments");
  },
  getAttachment() {
    throw pluginMissing("attachments");
  },
  allAttachments() {
    throw pluginMissing("attachments");
  },
  get allAttachments$() {
    throw pluginMissing("attachments");
  },
  async modify(mutationFunction, _context) {
    var oldData = this._data;
    var newData = await modifierFromPublicToInternal(mutationFunction)(oldData);
    return this._saveData(newData, oldData);
  },
  /**
   * runs an incremental update over the document
   * @param function that takes the document-data and returns a new data-object
   */
  incrementalModify(mutationFunction, _context) {
    return this.collection.incrementalWriteQueue.addWrite(this._data, modifierFromPublicToInternal(mutationFunction)).then((result) => this.collection._docCache.getCachedRxDocument(result));
  },
  patch(patch) {
    var oldData = this._data;
    var newData = clone$1(oldData);
    Object.entries(patch).forEach(([k, v]) => {
      newData[k] = v;
    });
    return this._saveData(newData, oldData);
  },
  /**
   * patches the given properties
   */
  incrementalPatch(patch) {
    return this.incrementalModify((docData) => {
      Object.entries(patch).forEach(([k, v]) => {
        docData[k] = v;
      });
      return docData;
    });
  },
  /**
   * saves the new document-data
   * and handles the events
   */
  async _saveData(newData, oldData) {
    newData = flatClone(newData);
    if (this._data._deleted) {
      throw newRxError("DOC11", {
        id: this.primary,
        document: this
      });
    }
    await beforeDocumentUpdateWrite(this.collection, newData, oldData);
    var writeRows = [{
      previous: oldData,
      document: newData
    }];
    var writeResult = await this.collection.storageInstance.bulkWrite(writeRows, "rx-document-save-data");
    var isError = writeResult.error[0];
    throwIfIsStorageWriteError(this.collection, this.primary, newData, isError);
    await this.collection._runHooks("post", "save", newData, this);
    return this.collection._docCache.getCachedRxDocument(getWrittenDocumentsFromBulkWriteResponse(this.collection.schema.primaryPath, writeRows, writeResult)[0]);
  },
  /**
   * Remove the document.
   * Notice that there is no hard delete,
   * instead deleted documents get flagged with _deleted=true.
   */
  async remove() {
    if (this.deleted) {
      return Promise.reject(newRxError("DOC13", {
        document: this,
        id: this.primary
      }));
    }
    var removeResult = await this.collection.bulkRemove([this]);
    if (removeResult.error.length > 0) {
      var error = removeResult.error[0];
      throwIfIsStorageWriteError(this.collection, this.primary, this._data, error);
    }
    return removeResult.success[0];
  },
  incrementalRemove() {
    return this.incrementalModify(async (docData) => {
      await this.collection._runHooks("pre", "remove", docData, this);
      docData._deleted = true;
      return docData;
    }).then(async (newDoc) => {
      await this.collection._runHooks("post", "remove", newDoc._data, newDoc);
      return newDoc;
    });
  },
  close() {
    throw newRxError("DOC14");
  }
};
function createRxDocumentConstructor(proto = basePrototype) {
  var constructor = function RxDocumentConstructor(collection, docData) {
    this.collection = collection;
    this._data = docData;
    this._propertyCache = /* @__PURE__ */ new Map();
    this.isInstanceOfRxDocument = true;
  };
  constructor.prototype = proto;
  return constructor;
}
function createWithConstructor(constructor, collection, jsonData) {
  var doc = new constructor(collection, jsonData);
  runPluginHooks("createRxDocument", doc);
  return doc;
}
function beforeDocumentUpdateWrite(collection, newData, oldData) {
  newData._meta = Object.assign({}, oldData._meta, newData._meta);
  if (overwritable.isDevMode()) {
    collection.schema.validateChange(oldData, newData);
  }
  return collection._runHooks("pre", "save", newData, oldData);
}
function getDocumentProperty(doc, objPath) {
  return getFromMapOrCreate(doc._propertyCache, objPath, () => {
    var valueObj = getProperty$1(doc._data, objPath);
    if (typeof valueObj !== "object" || valueObj === null || Array.isArray(valueObj)) {
      return overwritable.deepFreezeWhenDevMode(valueObj);
    }
    var proxy = new Proxy(
      /**
       * In dev-mode, the _data is deep-frozen
       * so we have to flat clone here so that
       * the proxy can work.
       */
      flatClone(valueObj),
      {
        /**
         * @performance is really important here
         * because people access nested properties very often
         * and might not be aware that this is internally using a Proxy
         */
        get(target, property) {
          if (typeof property !== "string") {
            return target[property];
          }
          var lastChar = property.charAt(property.length - 1);
          if (lastChar === "$") {
            if (property.endsWith("$$")) {
              var key = property.slice(0, -2);
              return doc.get$$(trimDots(objPath + "." + key));
            } else {
              var _key = property.slice(0, -1);
              return doc.get$(trimDots(objPath + "." + _key));
            }
          } else if (lastChar === "_") {
            var _key2 = property.slice(0, -1);
            return doc.populate(trimDots(objPath + "." + _key2));
          } else {
            var plainValue = target[property];
            if (typeof plainValue === "number" || typeof plainValue === "string" || typeof plainValue === "boolean") {
              return plainValue;
            }
            return getDocumentProperty(doc, trimDots(objPath + "." + property));
          }
        }
      }
    );
    return proxy;
  });
}
function lastOfArray(ar) {
  return ar[ar.length - 1];
}
function isObject$1(value) {
  const type2 = typeof value;
  return value !== null && (type2 === "object" || type2 === "function");
}
function getProperty(object, path, value) {
  if (Array.isArray(path)) {
    path = path.join(".");
  }
  if (!isObject$1(object) || typeof path !== "string") {
    return object;
  }
  const pathArray = path.split(".");
  if (pathArray.length === 0) {
    return value;
  }
  for (let index = 0; index < pathArray.length; index++) {
    const key = pathArray[index];
    if (isStringIndex(object, key)) {
      object = index === pathArray.length - 1 ? void 0 : null;
    } else {
      object = object[key];
    }
    if (object === void 0 || object === null) {
      if (index !== pathArray.length - 1) {
        return value;
      }
      break;
    }
  }
  return object === void 0 ? value : object;
}
function isStringIndex(object, key) {
  if (typeof key !== "number" && Array.isArray(object)) {
    const index = Number.parseInt(key, 10);
    return Number.isInteger(index) && object[index] === object[key];
  }
  return false;
}
const hasLimit = (input) => {
  return !!input.queryParams.limit;
};
const isFindOne = (input) => {
  return input.queryParams.limit === 1;
};
const hasSkip = (input) => {
  if (input.queryParams.skip && input.queryParams.skip > 0) {
    return true;
  } else {
    return false;
  }
};
const isDelete = (input) => {
  return input.changeEvent.operation === "DELETE";
};
const isInsert = (input) => {
  return input.changeEvent.operation === "INSERT";
};
const isUpdate = (input) => {
  return input.changeEvent.operation === "UPDATE";
};
const wasLimitReached = (input) => {
  return hasLimit(input) && input.previousResults.length >= input.queryParams.limit;
};
const sortParamsChanged = (input) => {
  const sortFields = input.queryParams.sortFields;
  const prev = input.changeEvent.previous;
  const doc = input.changeEvent.doc;
  if (!doc) {
    return false;
  }
  if (!prev) {
    return true;
  }
  for (let i = 0; i < sortFields.length; i++) {
    const field = sortFields[i];
    const beforeData = getProperty(prev, field);
    const afterData = getProperty(doc, field);
    if (beforeData !== afterData) {
      return true;
    }
  }
  return false;
};
const wasInResult = (input) => {
  const id = input.changeEvent.id;
  if (input.keyDocumentMap) {
    const has2 = input.keyDocumentMap.has(id);
    return has2;
  } else {
    const primary = input.queryParams.primaryKey;
    const results = input.previousResults;
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (item[primary] === id) {
        return true;
      }
    }
    return false;
  }
};
const wasFirst = (input) => {
  const first = input.previousResults[0];
  if (first && first[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  } else {
    return false;
  }
};
const wasLast = (input) => {
  const last2 = lastOfArray(input.previousResults);
  if (last2 && last2[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  } else {
    return false;
  }
};
const wasSortedBeforeFirst = (input) => {
  const prev = input.changeEvent.previous;
  if (!prev) {
    return false;
  }
  const first = input.previousResults[0];
  if (!first) {
    return false;
  }
  if (first[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  }
  const comp = input.queryParams.sortComparator(prev, first);
  return comp < 0;
};
const wasSortedAfterLast = (input) => {
  const prev = input.changeEvent.previous;
  if (!prev) {
    return false;
  }
  const last2 = lastOfArray(input.previousResults);
  if (!last2) {
    return false;
  }
  if (last2[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  }
  const comp = input.queryParams.sortComparator(prev, last2);
  return comp > 0;
};
const isSortedBeforeFirst = (input) => {
  const doc = input.changeEvent.doc;
  if (!doc) {
    return false;
  }
  const first = input.previousResults[0];
  if (!first) {
    return false;
  }
  if (first[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  }
  const comp = input.queryParams.sortComparator(doc, first);
  return comp < 0;
};
const isSortedAfterLast = (input) => {
  const doc = input.changeEvent.doc;
  if (!doc) {
    return false;
  }
  const last2 = lastOfArray(input.previousResults);
  if (!last2) {
    return false;
  }
  if (last2[input.queryParams.primaryKey] === input.changeEvent.id) {
    return true;
  }
  const comp = input.queryParams.sortComparator(doc, last2);
  return comp > 0;
};
const wasMatching = (input) => {
  const prev = input.changeEvent.previous;
  if (!prev) {
    return false;
  }
  return input.queryParams.queryMatcher(prev);
};
const doesMatchNow = (input) => {
  const doc = input.changeEvent.doc;
  if (!doc) {
    return false;
  }
  const ret = input.queryParams.queryMatcher(doc);
  return ret;
};
const wasResultsEmpty = (input) => {
  return input.previousResults.length === 0;
};
const stateResolveFunctionByIndex = {
  0: isInsert,
  1: isUpdate,
  2: isDelete,
  3: hasLimit,
  4: isFindOne,
  5: hasSkip,
  6: wasResultsEmpty,
  7: wasLimitReached,
  8: wasFirst,
  9: wasLast,
  10: sortParamsChanged,
  11: wasInResult,
  12: wasSortedBeforeFirst,
  13: wasSortedAfterLast,
  14: isSortedBeforeFirst,
  15: isSortedAfterLast,
  16: wasMatching,
  17: doesMatchNow
};
function pushAtSortPosition(array, item, compareFunction, low) {
  var length = array.length;
  var high = length - 1;
  var mid = 0;
  if (length === 0) {
    array.push(item);
    return 0;
  }
  var lastMidDoc;
  while (low <= high) {
    mid = low + (high - low >> 1);
    lastMidDoc = array[mid];
    if (compareFunction(lastMidDoc, item) <= 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  if (compareFunction(lastMidDoc, item) <= 0) {
    mid++;
  }
  array.splice(mid, 0, item);
  return mid;
}
const doNothing = (_input) => {
};
const insertFirst = (input) => {
  input.previousResults.unshift(input.changeEvent.doc);
  if (input.keyDocumentMap) {
    input.keyDocumentMap.set(input.changeEvent.id, input.changeEvent.doc);
  }
};
const insertLast = (input) => {
  input.previousResults.push(input.changeEvent.doc);
  if (input.keyDocumentMap) {
    input.keyDocumentMap.set(input.changeEvent.id, input.changeEvent.doc);
  }
};
const removeFirstItem = (input) => {
  const first = input.previousResults.shift();
  if (input.keyDocumentMap && first) {
    input.keyDocumentMap.delete(first[input.queryParams.primaryKey]);
  }
};
const removeLastItem = (input) => {
  const last2 = input.previousResults.pop();
  if (input.keyDocumentMap && last2) {
    input.keyDocumentMap.delete(last2[input.queryParams.primaryKey]);
  }
};
const removeFirstInsertLast = (input) => {
  removeFirstItem(input);
  insertLast(input);
};
const removeLastInsertFirst = (input) => {
  removeLastItem(input);
  insertFirst(input);
};
const removeFirstInsertFirst = (input) => {
  removeFirstItem(input);
  insertFirst(input);
};
const removeLastInsertLast = (input) => {
  removeLastItem(input);
  insertLast(input);
};
const removeExisting = (input) => {
  if (input.keyDocumentMap) {
    input.keyDocumentMap.delete(input.changeEvent.id);
  }
  const primary = input.queryParams.primaryKey;
  const results = input.previousResults;
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item[primary] === input.changeEvent.id) {
      results.splice(i, 1);
      break;
    }
  }
};
const replaceExisting = (input) => {
  const doc = input.changeEvent.doc;
  const primary = input.queryParams.primaryKey;
  const results = input.previousResults;
  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    if (item[primary] === input.changeEvent.id) {
      results[i] = doc;
      if (input.keyDocumentMap) {
        input.keyDocumentMap.set(input.changeEvent.id, doc);
      }
      break;
    }
  }
};
const alwaysWrong = (input) => {
  const wrongHuman = {
    _id: "wrongHuman" + (/* @__PURE__ */ new Date()).getTime()
  };
  input.previousResults.length = 0;
  input.previousResults.push(wrongHuman);
  if (input.keyDocumentMap) {
    input.keyDocumentMap.clear();
    input.keyDocumentMap.set(wrongHuman._id, wrongHuman);
  }
};
const insertAtSortPosition = (input) => {
  const docId = input.changeEvent.id;
  const doc = input.changeEvent.doc;
  if (input.keyDocumentMap) {
    if (input.keyDocumentMap.has(docId)) {
      return;
    }
    input.keyDocumentMap.set(docId, doc);
  } else {
    const isDocInResults = input.previousResults.find((d) => d[input.queryParams.primaryKey] === docId);
    if (isDocInResults) {
      return;
    }
  }
  pushAtSortPosition(input.previousResults, doc, input.queryParams.sortComparator, 0);
};
const removeExistingAndInsertAtSortPosition = (input) => {
  removeExisting(input);
  insertAtSortPosition(input);
};
const runFullQueryAgain = (_input) => {
  throw new Error("Action runFullQueryAgain must be implemented by yourself");
};
const unknownAction = (_input) => {
  throw new Error("Action unknownAction should never be called");
};
const orderedActionList = [
  "doNothing",
  "insertFirst",
  "insertLast",
  "removeFirstItem",
  "removeLastItem",
  "removeFirstInsertLast",
  "removeLastInsertFirst",
  "removeFirstInsertFirst",
  "removeLastInsertLast",
  "removeExisting",
  "replaceExisting",
  "alwaysWrong",
  "insertAtSortPosition",
  "removeExistingAndInsertAtSortPosition",
  "runFullQueryAgain",
  "unknownAction"
];
const actionFunctions = {
  doNothing,
  insertFirst,
  insertLast,
  removeFirstItem,
  removeLastItem,
  removeFirstInsertLast,
  removeLastInsertFirst,
  removeFirstInsertFirst,
  removeLastInsertLast,
  removeExisting,
  replaceExisting,
  alwaysWrong,
  insertAtSortPosition,
  removeExistingAndInsertAtSortPosition,
  runFullQueryAgain,
  unknownAction
};
const CHAR_CODE_OFFSET = 40;
function getNumberOfChar(char) {
  const charCode = char.charCodeAt(0);
  return charCode - CHAR_CODE_OFFSET;
}
function booleanToBooleanString(b) {
  if (b) {
    return "1";
  } else {
    return "0";
  }
}
function splitStringToChunks(str, chunkSize) {
  const chunks = [];
  for (let i = 0, charsLength = str.length; i < charsLength; i += chunkSize) {
    chunks.push(str.substring(i, i + chunkSize));
  }
  return chunks;
}
function minimalStringToSimpleBdd(str) {
  const nodesById = /* @__PURE__ */ new Map();
  const leafNodeAmount = parseInt(str.charAt(0) + str.charAt(1), 10);
  const lastLeafNodeChar = 2 + leafNodeAmount * 2;
  const leafNodeChars = str.substring(2, lastLeafNodeChar);
  const leafNodeChunks = splitStringToChunks(leafNodeChars, 2);
  for (let i = 0; i < leafNodeChunks.length; i++) {
    const chunk = leafNodeChunks[i];
    const id = chunk.charAt(0);
    const value = getNumberOfChar(chunk.charAt(1));
    nodesById.set(id, value);
  }
  const internalNodeChars = str.substring(lastLeafNodeChar, str.length - 3);
  const internalNodeChunks = splitStringToChunks(internalNodeChars, 4);
  for (let i = 0; i < internalNodeChunks.length; i++) {
    const chunk = internalNodeChunks[i];
    const id = chunk.charAt(0);
    const idOf0Branch = chunk.charAt(1);
    const idOf1Branch = chunk.charAt(2);
    const level = getNumberOfChar(chunk.charAt(3));
    if (!nodesById.has(idOf0Branch)) {
      throw new Error("missing node with id " + idOf0Branch);
    }
    if (!nodesById.has(idOf1Branch)) {
      throw new Error("missing node with id " + idOf1Branch);
    }
    const node0 = nodesById.get(idOf0Branch);
    const node1 = nodesById.get(idOf1Branch);
    const node = {
      l: level,
      // level is first for prettier json output
      0: node0,
      1: node1
    };
    nodesById.set(id, node);
  }
  const last3 = str.slice(-3);
  const idOf0 = last3.charAt(0);
  const idOf1 = last3.charAt(1);
  const levelOfRoot = getNumberOfChar(last3.charAt(2));
  const nodeOf0 = nodesById.get(idOf0);
  const nodeOf1 = nodesById.get(idOf1);
  const rootNode = {
    l: levelOfRoot,
    0: nodeOf0,
    1: nodeOf1
  };
  return rootNode;
}
function resolveWithSimpleBdd(simpleBdd2, fns, input) {
  let currentNode = simpleBdd2;
  let currentLevel = simpleBdd2.l;
  while (true) {
    const booleanResult = fns[currentLevel](input);
    const branchKey = booleanToBooleanString(booleanResult);
    currentNode = currentNode[branchKey];
    if (typeof currentNode === "number" || typeof currentNode === "string") {
      return currentNode;
    } else {
      currentLevel = currentNode.l;
    }
  }
}
const minimalBddString = "14a1b,c+d2e5f0g/h.i4j*k-l)m(n6oeh6pnm6qen6ril6snh6tin6ubo9vce9wmh9xns9yne9zmi9{cm9|ad9}cp9~aq9ae9¡bf9¢bq9£cg9¤ck9¥cn9¦nd9§np9¨nq9©nf9ªng9«nm9¬nk9­mr9®ms9¯mt9°mj9±mk9²ml9³mn9´mc8µ³{8¶¯}8·°¤8¸³§8¹mn8º³«8»³m8¼m´4½z²4¾³w4¿zµ4À¯¶4Á°·4Â³º4Ã³¸4Äm¹4Åv¤7Æyn7ÇÀÁ7È~7É¥¤7ÊÃÄ7Ë¨n7Ìº¹7Í­°7Î®m7Ï¯°7Ð±m7Ñ³m7Ò¼m5ÓÄm5Ô¹m5Õ½°5Ö¾m5×¿°5ØÇÏ5ÙÂm5ÚÊÑ5Û±m5Üºm5ÝÌÑ5ÞÕÍ2ß|2à¡u2á£Å2âÖÎ2ã¦Æ2ä©x2åªÆ2æ×Ø2ç|È2è¡¢2é£É2ê¤¥2ëÙÚ2ì¦Ë2í©n2îªn2ïÛÐ2ðÜÝ2ñ¬n2òÒÓ/óan/ôbn/õcn/öÞâ/÷ßã/øàä/ùáå/úæë/ûçì/üèí/ýéî/þÍÎ/ÿÏÑ/ĀòÔ,ācn,Ăöï,ă¤ñ,Ąúð,ąêñ,ĆþÐ,ćÿÑ,Ĉac0ĉbc0Ċóõ0ċôā0Čßá0čà¤0Ďçé0ďèê0Đ÷ù0đøă0Ēûý0ēüą0ĔmÒ-ĕmĀ-ĖÞæ-ėČĎ-Ęčď-ęĂĄ-ĚĐĒ-ěđē-Ĝ²»-ĝÍÏ-ĞĆć-ğ²³-ĠĔĈ3ġĕĊ3ĢĖė3ģęĚ3ĤĢĝ(ĥĜğ(ĦģĞ(ħĠġ+Ĩĉċ+ĩĤĦ+ĪĘě+īħĨ1ĬĩĪ1ĭĬī*Įĥm*ĭĮ.";
let simpleBdd;
function getSimpleBdd() {
  if (!simpleBdd) {
    simpleBdd = minimalStringToSimpleBdd(minimalBddString);
  }
  return simpleBdd;
}
const resolveInput = (input) => {
  return resolveWithSimpleBdd(getSimpleBdd(), stateResolveFunctionByIndex, input);
};
function calculateActionName(input) {
  const resolvedActionId = resolveInput(input);
  return orderedActionList[resolvedActionId];
}
function runAction(action, queryParams, changeEvent, previousResults, keyDocumentMap) {
  const fn = actionFunctions[action];
  fn({
    queryParams,
    changeEvent,
    previousResults,
    keyDocumentMap
  });
  return previousResults;
}
function getSortFieldsOfQuery(primaryKey, query) {
  if (!query.sort || query.sort.length === 0) {
    return [primaryKey];
  } else {
    return query.sort.map((part) => Object.keys(part)[0]);
  }
}
var RXQUERY_QUERY_PARAMS_CACHE = /* @__PURE__ */ new WeakMap();
function getQueryParams(rxQuery) {
  return getFromMapOrCreate(RXQUERY_QUERY_PARAMS_CACHE, rxQuery, () => {
    var collection = rxQuery.collection;
    var normalizedMangoQuery = normalizeMangoQuery(collection.storageInstance.schema, clone$1(rxQuery.mangoQuery));
    var primaryKey = collection.schema.primaryPath;
    var sortComparator = getSortComparator(collection.schema.jsonSchema, normalizedMangoQuery);
    var useSortComparator = (docA, docB) => {
      var sortComparatorData = {
        docA,
        docB
      };
      return sortComparator(sortComparatorData.docA, sortComparatorData.docB);
    };
    var queryMatcher = getQueryMatcher(collection.schema.jsonSchema, normalizedMangoQuery);
    var useQueryMatcher = (doc) => {
      var queryMatcherData = {
        doc
      };
      return queryMatcher(queryMatcherData.doc);
    };
    var ret = {
      primaryKey: rxQuery.collection.schema.primaryPath,
      skip: normalizedMangoQuery.skip,
      limit: normalizedMangoQuery.limit,
      sortFields: getSortFieldsOfQuery(primaryKey, normalizedMangoQuery),
      sortComparator: useSortComparator,
      queryMatcher: useQueryMatcher
    };
    return ret;
  });
}
function calculateNewResults(rxQuery, rxChangeEvents) {
  if (!rxQuery.collection.database.eventReduce) {
    return {
      runFullQueryAgain: true
    };
  }
  var queryParams = getQueryParams(rxQuery);
  var previousResults = ensureNotFalsy(rxQuery._result).docsData.slice(0);
  var previousResultsMap = ensureNotFalsy(rxQuery._result).docsDataMap;
  var changed = false;
  var eventReduceEvents = [];
  for (var index = 0; index < rxChangeEvents.length; index++) {
    var cE = rxChangeEvents[index];
    var eventReduceEvent = rxChangeEventToEventReduceChangeEvent(cE);
    if (eventReduceEvent) {
      eventReduceEvents.push(eventReduceEvent);
    }
  }
  var foundNonOptimizeable = eventReduceEvents.find((eventReduceEvent2) => {
    var stateResolveFunctionInput = {
      queryParams,
      changeEvent: eventReduceEvent2,
      previousResults,
      keyDocumentMap: previousResultsMap
    };
    var actionName = calculateActionName(stateResolveFunctionInput);
    if (actionName === "runFullQueryAgain") {
      return true;
    } else if (actionName !== "doNothing") {
      changed = true;
      runAction(actionName, queryParams, eventReduceEvent2, previousResults, previousResultsMap);
      return false;
    }
  });
  if (foundNonOptimizeable) {
    return {
      runFullQueryAgain: true
    };
  } else {
    return {
      runFullQueryAgain: false,
      changed,
      newResults: previousResults
    };
  }
}
var QueryCache = /* @__PURE__ */ function() {
  function QueryCache2() {
    this._map = /* @__PURE__ */ new Map();
  }
  var _proto = QueryCache2.prototype;
  _proto.getByQuery = function getByQuery(rxQuery) {
    var stringRep = rxQuery.toString();
    var ret = getFromMapOrCreate(this._map, stringRep, () => rxQuery);
    return ret;
  };
  return QueryCache2;
}();
function createQueryCache() {
  return new QueryCache();
}
function uncacheRxQuery(queryCache, rxQuery) {
  rxQuery.uncached = true;
  var stringRep = rxQuery.toString();
  queryCache._map.delete(stringRep);
}
function countRxQuerySubscribers(rxQuery) {
  return rxQuery.refCount$.observers.length;
}
var DEFAULT_TRY_TO_KEEP_MAX = 100;
var DEFAULT_UNEXECUTED_LIFETIME = 30 * 1e3;
var defaultCacheReplacementPolicyMonad = (tryToKeepMax, unExecutedLifetime) => (_collection, queryCache) => {
  if (queryCache._map.size < tryToKeepMax) {
    return;
  }
  var minUnExecutedLifetime = now$1() - unExecutedLifetime;
  var maybeUncache = [];
  var queriesInCache = Array.from(queryCache._map.values());
  for (var rxQuery of queriesInCache) {
    if (countRxQuerySubscribers(rxQuery) > 0) {
      continue;
    }
    if (rxQuery._lastEnsureEqual === 0 && rxQuery._creationTime < minUnExecutedLifetime) {
      uncacheRxQuery(queryCache, rxQuery);
      continue;
    }
    maybeUncache.push(rxQuery);
  }
  var mustUncache = maybeUncache.length - tryToKeepMax;
  if (mustUncache <= 0) {
    return;
  }
  var sortedByLastUsage = maybeUncache.sort((a, b) => a._lastEnsureEqual - b._lastEnsureEqual);
  var toRemove = sortedByLastUsage.slice(0, mustUncache);
  toRemove.forEach((rxQuery2) => uncacheRxQuery(queryCache, rxQuery2));
};
var defaultCacheReplacementPolicy = defaultCacheReplacementPolicyMonad(DEFAULT_TRY_TO_KEEP_MAX, DEFAULT_UNEXECUTED_LIFETIME);
var COLLECTIONS_WITH_RUNNING_CLEANUP = /* @__PURE__ */ new WeakSet();
function triggerCacheReplacement(rxCollection) {
  if (COLLECTIONS_WITH_RUNNING_CLEANUP.has(rxCollection)) {
    return;
  }
  COLLECTIONS_WITH_RUNNING_CLEANUP.add(rxCollection);
  nextTick().then(() => requestIdlePromise(200)).then(() => {
    if (!rxCollection.closed) {
      rxCollection.cacheReplacementPolicy(rxCollection, rxCollection._queryCache);
    }
    COLLECTIONS_WITH_RUNNING_CLEANUP.delete(rxCollection);
  });
}
var DocumentCache = /* @__PURE__ */ function() {
  function DocumentCache2(primaryPath, changes$, documentCreator) {
    this.cacheItemByDocId = /* @__PURE__ */ new Map();
    this.tasks = /* @__PURE__ */ new Set();
    this.registry = typeof FinalizationRegistry === "function" ? new FinalizationRegistry((docMeta) => {
      var docId = docMeta.docId;
      var cacheItem = this.cacheItemByDocId.get(docId);
      if (cacheItem) {
        cacheItem[0].delete(docMeta.revisionHeight);
        if (cacheItem[0].size === 0) {
          this.cacheItemByDocId.delete(docId);
        }
      }
    }) : void 0;
    this.primaryPath = primaryPath;
    this.changes$ = changes$;
    this.documentCreator = documentCreator;
    changes$.subscribe((events) => {
      this.tasks.add(() => {
        var cacheItemByDocId = this.cacheItemByDocId;
        for (var index = 0; index < events.length; index++) {
          var event = events[index];
          var cacheItem = cacheItemByDocId.get(event.documentId);
          if (cacheItem) {
            var documentData = event.documentData;
            if (!documentData) {
              documentData = event.previousDocumentData;
            }
            cacheItem[1] = documentData;
          }
        }
      });
      if (this.tasks.size <= 1) {
        requestIdlePromiseNoQueue().then(() => {
          this.processTasks();
        });
      }
    });
  }
  var _proto = DocumentCache2.prototype;
  _proto.processTasks = function processTasks() {
    if (this.tasks.size === 0) {
      return;
    }
    var tasks = Array.from(this.tasks);
    tasks.forEach((task) => task());
    this.tasks.clear();
  };
  _proto.getLatestDocumentData = function getLatestDocumentData(docId) {
    this.processTasks();
    var cacheItem = getFromMapOrThrow(this.cacheItemByDocId, docId);
    return cacheItem[1];
  };
  _proto.getLatestDocumentDataIfExists = function getLatestDocumentDataIfExists(docId) {
    this.processTasks();
    var cacheItem = this.cacheItemByDocId.get(docId);
    if (cacheItem) {
      return cacheItem[1];
    }
  };
  return _createClass(DocumentCache2, [{
    key: "getCachedRxDocuments",
    get: function() {
      var fn = getCachedRxDocumentMonad(this);
      return overwriteGetterForCaching(this, "getCachedRxDocuments", fn);
    }
  }, {
    key: "getCachedRxDocument",
    get: function() {
      var fn = getCachedRxDocumentMonad(this);
      return overwriteGetterForCaching(this, "getCachedRxDocument", (doc) => fn([doc])[0]);
    }
  }]);
}();
function getCachedRxDocumentMonad(docCache) {
  var primaryPath = docCache.primaryPath;
  var cacheItemByDocId = docCache.cacheItemByDocId;
  var registry = docCache.registry;
  var deepFreezeWhenDevMode = overwritable.deepFreezeWhenDevMode;
  var documentCreator = docCache.documentCreator;
  var fn = (docsData) => {
    var ret = new Array(docsData.length);
    var registryTasks = [];
    for (var index = 0; index < docsData.length; index++) {
      var docData = docsData[index];
      var docId = docData[primaryPath];
      var revisionHeight = getHeightOfRevision(docData._rev);
      var byRev = void 0;
      var cachedRxDocumentWeakRef = void 0;
      var cacheItem = cacheItemByDocId.get(docId);
      if (!cacheItem) {
        byRev = /* @__PURE__ */ new Map();
        cacheItem = [byRev, docData];
        cacheItemByDocId.set(docId, cacheItem);
      } else {
        byRev = cacheItem[0];
        cachedRxDocumentWeakRef = byRev.get(revisionHeight);
      }
      var cachedRxDocument = cachedRxDocumentWeakRef ? cachedRxDocumentWeakRef.deref() : void 0;
      if (!cachedRxDocument) {
        docData = deepFreezeWhenDevMode(docData);
        cachedRxDocument = documentCreator(docData);
        byRev.set(revisionHeight, createWeakRefWithFallback(cachedRxDocument));
        if (registry) {
          registryTasks.push(cachedRxDocument);
        }
      }
      ret[index] = cachedRxDocument;
    }
    if (registryTasks.length > 0 && registry) {
      docCache.tasks.add(() => {
        for (var _index = 0; _index < registryTasks.length; _index++) {
          var doc = registryTasks[_index];
          registry.register(doc, {
            docId: doc.primary,
            revisionHeight: getHeightOfRevision(doc.revision)
          });
        }
      });
      if (docCache.tasks.size <= 1) {
        requestIdlePromiseNoQueue().then(() => {
          docCache.processTasks();
        });
      }
    }
    return ret;
  };
  return fn;
}
function mapDocumentsDataToCacheDocs(docCache, docsData) {
  var getCachedRxDocuments = docCache.getCachedRxDocuments;
  return getCachedRxDocuments(docsData);
}
var HAS_WEAK_REF = typeof WeakRef === "function";
var createWeakRefWithFallback = HAS_WEAK_REF ? createWeakRef : createWeakRefFallback;
function createWeakRef(obj) {
  return new WeakRef(obj);
}
function createWeakRefFallback(obj) {
  return {
    deref() {
      return obj;
    }
  };
}
var RxQuerySingleResult = /* @__PURE__ */ function() {
  function RxQuerySingleResult2(query, docsDataFromStorageInstance, count) {
    this.time = now$1();
    this.query = query;
    this.count = count;
    this.documents = mapDocumentsDataToCacheDocs(this.query.collection._docCache, docsDataFromStorageInstance);
  }
  var _proto = RxQuerySingleResult2.prototype;
  _proto.getValue = function getValue2(throwIfMissing) {
    var op = this.query.op;
    if (op === "count") {
      return this.count;
    } else if (op === "findOne") {
      var doc = this.documents.length === 0 ? null : this.documents[0];
      if (!doc && throwIfMissing) {
        throw newRxError("QU10", {
          collection: this.query.collection.name,
          query: this.query.mangoQuery,
          op
        });
      } else {
        return doc;
      }
    } else if (op === "findByIds") {
      return this.docsMap;
    } else {
      return this.documents.slice(0);
    }
  };
  return _createClass(RxQuerySingleResult2, [{
    key: "docsData",
    get: function() {
      return overwriteGetterForCaching(this, "docsData", this.documents.map((d) => d._data));
    }
    // A key->document map, used in the event reduce optimization.
  }, {
    key: "docsDataMap",
    get: function() {
      var map2 = /* @__PURE__ */ new Map();
      this.documents.forEach((d) => {
        map2.set(d.primary, d._data);
      });
      return overwriteGetterForCaching(this, "docsDataMap", map2);
    }
  }, {
    key: "docsMap",
    get: function() {
      var map2 = /* @__PURE__ */ new Map();
      var documents = this.documents;
      for (var i = 0; i < documents.length; i++) {
        var doc = documents[i];
        map2.set(doc.primary, doc);
      }
      return overwriteGetterForCaching(this, "docsMap", map2);
    }
  }]);
}();
var _queryCount = 0;
var newQueryID = function() {
  return ++_queryCount;
};
var RxQueryBase = /* @__PURE__ */ function() {
  function RxQueryBase2(op, mangoQuery, collection, other = {}) {
    this.id = newQueryID();
    this._execOverDatabaseCount = 0;
    this._creationTime = now$1();
    this._lastEnsureEqual = 0;
    this.uncached = false;
    this.refCount$ = new BehaviorSubject(null);
    this._result = null;
    this._latestChangeEvent = -1;
    this._ensureEqualQueue = PROMISE_RESOLVE_FALSE;
    this.op = op;
    this.mangoQuery = mangoQuery;
    this.collection = collection;
    this.other = other;
    if (!mangoQuery) {
      this.mangoQuery = _getDefaultQuery();
    }
    this.isFindOneByIdQuery = isFindOneByIdQuery(this.collection.schema.primaryPath, mangoQuery);
  }
  var _proto = RxQueryBase2.prototype;
  _proto._setResultData = function _setResultData(newResultData) {
    if (typeof newResultData === "undefined") {
      throw newRxError("QU18", {
        database: this.collection.database.name,
        collection: this.collection.name
      });
    }
    if (typeof newResultData === "number") {
      this._result = new RxQuerySingleResult(this, [], newResultData);
      return;
    } else if (newResultData instanceof Map) {
      newResultData = Array.from(newResultData.values());
    }
    var newQueryResult = new RxQuerySingleResult(this, newResultData, newResultData.length);
    this._result = newQueryResult;
  };
  _proto._execOverDatabase = async function _execOverDatabase() {
    this._execOverDatabaseCount = this._execOverDatabaseCount + 1;
    if (this.op === "count") {
      var preparedQuery = this.getPreparedQuery();
      var result = await this.collection.storageInstance.count(preparedQuery);
      if (result.mode === "slow" && !this.collection.database.allowSlowCount) {
        throw newRxError("QU14", {
          collection: this.collection,
          queryObj: this.mangoQuery
        });
      } else {
        return result.count;
      }
    }
    if (this.op === "findByIds") {
      var ids = ensureNotFalsy(this.mangoQuery.selector)[this.collection.schema.primaryPath].$in;
      var ret = /* @__PURE__ */ new Map();
      var mustBeQueried = [];
      ids.forEach((id) => {
        var docData = this.collection._docCache.getLatestDocumentDataIfExists(id);
        if (docData) {
          if (!docData._deleted) {
            var doc = this.collection._docCache.getCachedRxDocument(docData);
            ret.set(id, doc);
          }
        } else {
          mustBeQueried.push(id);
        }
      });
      if (mustBeQueried.length > 0) {
        var docs = await this.collection.storageInstance.findDocumentsById(mustBeQueried, false);
        docs.forEach((docData) => {
          var doc = this.collection._docCache.getCachedRxDocument(docData);
          ret.set(doc.primary, doc);
        });
      }
      return ret;
    }
    var docsPromise = queryCollection(this);
    return docsPromise.then((docs2) => {
      return docs2;
    });
  };
  _proto.exec = async function exec(throwIfMissing) {
    if (throwIfMissing && this.op !== "findOne") {
      throw newRxError("QU9", {
        collection: this.collection.name,
        query: this.mangoQuery,
        op: this.op
      });
    }
    await _ensureEqual(this);
    var useResult = ensureNotFalsy(this._result);
    return useResult.getValue(throwIfMissing);
  };
  _proto.toString = function toString() {
    var stringObj = sortObject({
      op: this.op,
      query: normalizeMangoQuery(this.collection.schema.jsonSchema, this.mangoQuery),
      other: this.other
    }, true);
    var value = JSON.stringify(stringObj);
    this.toString = () => value;
    return value;
  };
  _proto.getPreparedQuery = function getPreparedQuery() {
    var hookInput = {
      rxQuery: this,
      // can be mutated by the hooks so we have to deep clone first.
      mangoQuery: normalizeMangoQuery(this.collection.schema.jsonSchema, this.mangoQuery)
    };
    hookInput.mangoQuery.selector._deleted = {
      $eq: false
    };
    if (hookInput.mangoQuery.index) {
      hookInput.mangoQuery.index.unshift("_deleted");
    }
    runPluginHooks("prePrepareQuery", hookInput);
    var value = prepareQuery(this.collection.schema.jsonSchema, hookInput.mangoQuery);
    this.getPreparedQuery = () => value;
    return value;
  };
  _proto.doesDocumentDataMatch = function doesDocumentDataMatch(docData) {
    if (docData._deleted) {
      return false;
    }
    return this.queryMatcher(docData);
  };
  _proto.remove = async function remove2() {
    var docs = await this.exec();
    if (Array.isArray(docs)) {
      var result = await this.collection.bulkRemove(docs);
      if (result.error.length > 0) {
        throw rxStorageWriteErrorToRxError(result.error[0]);
      } else {
        return result.success;
      }
    } else {
      return docs.remove();
    }
  };
  _proto.incrementalRemove = function incrementalRemove() {
    return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.incrementalRemove());
  };
  _proto.update = function update2(_updateObj) {
    throw pluginMissing("update");
  };
  _proto.patch = function patch(_patch) {
    return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.patch(_patch));
  };
  _proto.incrementalPatch = function incrementalPatch(patch) {
    return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.incrementalPatch(patch));
  };
  _proto.modify = function modify(mutationFunction) {
    return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.modify(mutationFunction));
  };
  _proto.incrementalModify = function incrementalModify(mutationFunction) {
    return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.incrementalModify(mutationFunction));
  };
  _proto.where = function where(_queryObj) {
    throw pluginMissing("query-builder");
  };
  _proto.sort = function sort(_params) {
    throw pluginMissing("query-builder");
  };
  _proto.skip = function skip(_amount) {
    throw pluginMissing("query-builder");
  };
  _proto.limit = function limit(_amount) {
    throw pluginMissing("query-builder");
  };
  return _createClass(RxQueryBase2, [{
    key: "$",
    get: function() {
      if (!this._$) {
        var results$ = this.collection.eventBulks$.pipe(
          /**
           * Performance shortcut.
           * Changes to local documents are not relevant for the query.
           */
          filter((bulk) => !bulk.isLocal),
          /**
           * Start once to ensure the querying also starts
           * when there where no changes.
           */
          startWith(null),
          // ensure query results are up to date.
          mergeMap(() => _ensureEqual(this)),
          // use the current result set, written by _ensureEqual().
          map(() => this._result),
          // do not run stuff above for each new subscriber, only once.
          shareReplay(RXJS_SHARE_REPLAY_DEFAULTS),
          // do not proceed if result set has not changed.
          distinctUntilChanged((prev, curr) => {
            if (prev && prev.time === ensureNotFalsy(curr).time) {
              return true;
            } else {
              return false;
            }
          }),
          filter((result) => !!result),
          /**
           * Map the result set to a single RxDocument or an array,
           * depending on query type
           */
          map((result) => {
            return ensureNotFalsy(result).getValue();
          })
        );
        this._$ = merge$2(
          results$,
          /**
           * Also add the refCount$ to the query observable
           * to allow us to count the amount of subscribers.
           */
          this.refCount$.pipe(filter(() => false))
        );
      }
      return this._$;
    }
  }, {
    key: "$$",
    get: function() {
      var reactivity = this.collection.database.getReactivityFactory();
      return reactivity.fromObservable(this.$, void 0, this.collection.database);
    }
    // stores the changeEvent-number of the last handled change-event
    /**
     * ensures that the exec-runs
     * are not run in parallel
     */
  }, {
    key: "queryMatcher",
    get: function() {
      var schema = this.collection.schema.jsonSchema;
      var normalizedQuery = normalizeMangoQuery(this.collection.schema.jsonSchema, this.mangoQuery);
      return overwriteGetterForCaching(this, "queryMatcher", getQueryMatcher(schema, normalizedQuery));
    }
  }, {
    key: "asRxQuery",
    get: function() {
      return this;
    }
  }]);
}();
function _getDefaultQuery() {
  return {
    selector: {}
  };
}
function tunnelQueryCache(rxQuery) {
  return rxQuery.collection._queryCache.getByQuery(rxQuery);
}
function createRxQuery(op, queryObj, collection, other) {
  runPluginHooks("preCreateRxQuery", {
    op,
    queryObj,
    collection,
    other
  });
  var ret = new RxQueryBase(op, queryObj, collection, other);
  ret = tunnelQueryCache(ret);
  triggerCacheReplacement(collection);
  return ret;
}
function _isResultsInSync(rxQuery) {
  var currentLatestEventNumber = rxQuery.asRxQuery.collection._changeEventBuffer.getCounter();
  if (rxQuery._latestChangeEvent >= currentLatestEventNumber) {
    return true;
  } else {
    return false;
  }
}
async function _ensureEqual(rxQuery) {
  if (rxQuery.collection.awaitBeforeReads.size > 0) {
    await Promise.all(Array.from(rxQuery.collection.awaitBeforeReads).map((fn) => fn()));
  }
  if (rxQuery.collection.database.closed || _isResultsInSync(rxQuery)) {
    return false;
  }
  rxQuery._ensureEqualQueue = rxQuery._ensureEqualQueue.then(() => __ensureEqual(rxQuery));
  return rxQuery._ensureEqualQueue;
}
function __ensureEqual(rxQuery) {
  rxQuery._lastEnsureEqual = now$1();
  if (
    // db is closed
    rxQuery.collection.database.closed || // nothing happened since last run
    _isResultsInSync(rxQuery)
  ) {
    return PROMISE_RESOLVE_FALSE;
  }
  var ret = false;
  var mustReExec = false;
  if (rxQuery._latestChangeEvent === -1) {
    mustReExec = true;
  }
  if (!mustReExec) {
    var missedChangeEvents = rxQuery.asRxQuery.collection._changeEventBuffer.getFrom(rxQuery._latestChangeEvent + 1);
    if (missedChangeEvents === null) {
      mustReExec = true;
    } else {
      rxQuery._latestChangeEvent = rxQuery.asRxQuery.collection._changeEventBuffer.getCounter();
      var runChangeEvents = rxQuery.asRxQuery.collection._changeEventBuffer.reduceByLastOfDoc(missedChangeEvents);
      if (rxQuery.op === "count") {
        var previousCount = ensureNotFalsy(rxQuery._result).count;
        var newCount = previousCount;
        runChangeEvents.forEach((cE) => {
          var didMatchBefore = cE.previousDocumentData && rxQuery.doesDocumentDataMatch(cE.previousDocumentData);
          var doesMatchNow2 = rxQuery.doesDocumentDataMatch(cE.documentData);
          if (!didMatchBefore && doesMatchNow2) {
            newCount++;
          }
          if (didMatchBefore && !doesMatchNow2) {
            newCount--;
          }
        });
        if (newCount !== previousCount) {
          ret = true;
          rxQuery._setResultData(newCount);
        }
      } else {
        var eventReduceResult = calculateNewResults(rxQuery, runChangeEvents);
        if (eventReduceResult.runFullQueryAgain) {
          mustReExec = true;
        } else if (eventReduceResult.changed) {
          ret = true;
          rxQuery._setResultData(eventReduceResult.newResults);
        }
      }
    }
  }
  if (mustReExec) {
    return rxQuery._execOverDatabase().then((newResultData) => {
      rxQuery._latestChangeEvent = rxQuery.collection._changeEventBuffer.getCounter();
      if (typeof newResultData === "number") {
        if (!rxQuery._result || newResultData !== rxQuery._result.count) {
          ret = true;
          rxQuery._setResultData(newResultData);
        }
        return ret;
      }
      if (!rxQuery._result || !areRxDocumentArraysEqual(rxQuery.collection.schema.primaryPath, newResultData, rxQuery._result.docsData)) {
        ret = true;
        rxQuery._setResultData(newResultData);
      }
      return ret;
    });
  }
  return Promise.resolve(ret);
}
async function queryCollection(rxQuery) {
  var docs = [];
  var collection = rxQuery.collection;
  if (rxQuery.isFindOneByIdQuery) {
    if (Array.isArray(rxQuery.isFindOneByIdQuery)) {
      var docIds = rxQuery.isFindOneByIdQuery;
      docIds = docIds.filter((docId2) => {
        var docData2 = rxQuery.collection._docCache.getLatestDocumentDataIfExists(docId2);
        if (docData2) {
          if (!docData2._deleted) {
            docs.push(docData2);
          }
          return false;
        } else {
          return true;
        }
      });
      if (docIds.length > 0) {
        var docsFromStorage = await collection.storageInstance.findDocumentsById(docIds, false);
        appendToArray(docs, docsFromStorage);
      }
    } else {
      var docId = rxQuery.isFindOneByIdQuery;
      var docData = rxQuery.collection._docCache.getLatestDocumentDataIfExists(docId);
      if (!docData) {
        var fromStorageList = await collection.storageInstance.findDocumentsById([docId], false);
        if (fromStorageList[0]) {
          docData = fromStorageList[0];
        }
      }
      if (docData && !docData._deleted) {
        docs.push(docData);
      }
    }
  } else {
    var preparedQuery = rxQuery.getPreparedQuery();
    var queryResult = await collection.storageInstance.query(preparedQuery);
    docs = queryResult.documents;
  }
  return docs;
}
function isFindOneByIdQuery(primaryPath, query) {
  if (!query.skip && query.selector && Object.keys(query.selector).length === 1 && query.selector[primaryPath]) {
    var value = query.selector[primaryPath];
    if (typeof value === "string") {
      return value;
    } else if (Object.keys(value).length === 1 && typeof value.$eq === "string") {
      return value.$eq;
    }
    if (Object.keys(value).length === 1 && Array.isArray(value.$eq) && // must only contain strings
    !value.$eq.find((r) => typeof r !== "string")) {
      return value.$eq;
    }
  }
  return false;
}
var INTERNAL_CONTEXT_COLLECTION = "collection";
var INTERNAL_CONTEXT_STORAGE_TOKEN = "storage-token";
var INTERNAL_CONTEXT_MIGRATION_STATUS = "rx-migration-status";
var INTERNAL_CONTEXT_PIPELINE_CHECKPOINT = "rx-pipeline-checkpoint";
var INTERNAL_STORE_SCHEMA_TITLE = "RxInternalDocument";
var INTERNAL_STORE_SCHEMA = fillWithDefaultSettings({
  version: 0,
  title: INTERNAL_STORE_SCHEMA_TITLE,
  primaryKey: {
    key: "id",
    fields: ["context", "key"],
    separator: "|"
  },
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 200
    },
    key: {
      type: "string"
    },
    context: {
      type: "string",
      enum: [INTERNAL_CONTEXT_COLLECTION, INTERNAL_CONTEXT_STORAGE_TOKEN, INTERNAL_CONTEXT_MIGRATION_STATUS, INTERNAL_CONTEXT_PIPELINE_CHECKPOINT, "OTHER"]
    },
    data: {
      type: "object",
      additionalProperties: true
    }
  },
  indexes: [],
  required: ["key", "context", "data"],
  additionalProperties: false,
  /**
   * If the sharding plugin is used,
   * it must not shard on the internal RxStorageInstance
   * because that one anyway has only a small amount of documents
   * and also its creation is in the hot path of the initial page load,
   * so we should spend less time creating multiple RxStorageInstances.
   */
  sharding: {
    shards: 1,
    mode: "collection"
  }
});
function getPrimaryKeyOfInternalDocument(key, context) {
  return getComposedPrimaryKeyOfDocumentData(INTERNAL_STORE_SCHEMA, {
    key,
    context
  });
}
async function getAllCollectionDocuments(storageInstance) {
  var getAllQueryPrepared = prepareQuery(storageInstance.schema, {
    selector: {
      context: INTERNAL_CONTEXT_COLLECTION,
      _deleted: {
        $eq: false
      }
    },
    sort: [{
      id: "asc"
    }],
    skip: 0
  });
  var queryResult = await storageInstance.query(getAllQueryPrepared);
  var allDocs = queryResult.documents;
  return allDocs;
}
var STORAGE_TOKEN_DOCUMENT_KEY = "storageToken";
var STORAGE_TOKEN_DOCUMENT_ID = getPrimaryKeyOfInternalDocument(STORAGE_TOKEN_DOCUMENT_KEY, INTERNAL_CONTEXT_STORAGE_TOKEN);
async function ensureStorageTokenDocumentExists(rxDatabase) {
  var storageToken = randomToken$1(10);
  var passwordHash = rxDatabase.password ? await rxDatabase.hashFunction(JSON.stringify(rxDatabase.password)) : void 0;
  var docData = {
    id: STORAGE_TOKEN_DOCUMENT_ID,
    context: INTERNAL_CONTEXT_STORAGE_TOKEN,
    key: STORAGE_TOKEN_DOCUMENT_KEY,
    data: {
      rxdbVersion: rxDatabase.rxdbVersion,
      token: storageToken,
      /**
       * We add the instance token here
       * to be able to detect if a given RxDatabase instance
       * is the first instance that was ever created
       * or if databases have existed earlier on that storage
       * with the same database name.
       */
      instanceToken: rxDatabase.token,
      passwordHash
    },
    _deleted: false,
    _meta: getDefaultRxDocumentMeta(),
    _rev: getDefaultRevision(),
    _attachments: {}
  };
  var writeRows = [{
    document: docData
  }];
  var writeResult = await rxDatabase.internalStore.bulkWrite(writeRows, "internal-add-storage-token");
  if (!writeResult.error[0]) {
    return getWrittenDocumentsFromBulkWriteResponse("id", writeRows, writeResult)[0];
  }
  var error = ensureNotFalsy(writeResult.error[0]);
  if (error.isError && isBulkWriteConflictError(error)) {
    var conflictError = error;
    if (!isDatabaseStateVersionCompatibleWithDatabaseCode(conflictError.documentInDb.data.rxdbVersion, rxDatabase.rxdbVersion)) {
      throw newRxError("DM5", {
        args: {
          database: rxDatabase.name,
          databaseStateVersion: conflictError.documentInDb.data.rxdbVersion,
          codeVersion: rxDatabase.rxdbVersion
        }
      });
    }
    if (passwordHash && passwordHash !== conflictError.documentInDb.data.passwordHash) {
      throw newRxError("DB1", {
        passwordHash,
        existingPasswordHash: conflictError.documentInDb.data.passwordHash
      });
    }
    var storageTokenDocInDb = conflictError.documentInDb;
    return ensureNotFalsy(storageTokenDocInDb);
  }
  throw error;
}
function isDatabaseStateVersionCompatibleWithDatabaseCode(databaseStateVersion, codeVersion) {
  if (!databaseStateVersion) {
    return false;
  }
  var stateMajor = databaseStateVersion.split(".")[0];
  var codeMajor = codeVersion.split(".")[0];
  if (stateMajor === "15" && codeMajor === "16") {
    return true;
  }
  if (stateMajor !== codeMajor) {
    return false;
  }
  return true;
}
async function addConnectedStorageToCollection(collection, storageCollectionName, schema) {
  if (collection.schema.version !== schema.version) {
    throw newRxError("SNH", {
      schema,
      version: collection.schema.version,
      name: collection.name,
      collection,
      args: {
        storageCollectionName
      }
    });
  }
  var collectionNameWithVersion = _collectionNamePrimary(collection.name, collection.schema.jsonSchema);
  var collectionDocId = getPrimaryKeyOfInternalDocument(collectionNameWithVersion, INTERNAL_CONTEXT_COLLECTION);
  while (true) {
    var collectionDoc = await getSingleDocument(collection.database.internalStore, collectionDocId);
    var saveData = clone$1(ensureNotFalsy(collectionDoc));
    var alreadyThere = saveData.data.connectedStorages.find((row) => row.collectionName === storageCollectionName && row.schema.version === schema.version);
    if (alreadyThere) {
      return;
    }
    saveData.data.connectedStorages.push({
      collectionName: storageCollectionName,
      schema
    });
    try {
      await writeSingle(collection.database.internalStore, {
        previous: ensureNotFalsy(collectionDoc),
        document: saveData
      }, "add-connected-storage-to-collection");
    } catch (err) {
      if (!isBulkWriteConflictError(err)) {
        throw err;
      }
    }
  }
}
function _collectionNamePrimary(name, schema) {
  return name + "-" + schema.version;
}
function fillObjectDataBeforeInsert(schema, data) {
  data = flatClone(data);
  data = fillObjectWithDefaults(schema, data);
  if (typeof schema.jsonSchema.primaryKey !== "string") {
    data = fillPrimaryKey(schema.primaryPath, schema.jsonSchema, data);
  }
  data._meta = getDefaultRxDocumentMeta();
  if (!Object.prototype.hasOwnProperty.call(data, "_deleted")) {
    data._deleted = false;
  }
  if (!Object.prototype.hasOwnProperty.call(data, "_attachments")) {
    data._attachments = {};
  }
  if (!Object.prototype.hasOwnProperty.call(data, "_rev")) {
    data._rev = getDefaultRevision();
  }
  return data;
}
async function createRxCollectionStorageInstance(rxDatabase, storageInstanceCreationParams) {
  storageInstanceCreationParams.multiInstance = rxDatabase.multiInstance;
  var storageInstance = await rxDatabase.storage.createStorageInstance(storageInstanceCreationParams);
  return storageInstance;
}
async function removeCollectionStorages(storage, databaseInternalStorage, databaseInstanceToken, databaseName, collectionName, multiInstance, password, hashFunction) {
  var allCollectionMetaDocs = await getAllCollectionDocuments(databaseInternalStorage);
  var relevantCollectionMetaDocs = allCollectionMetaDocs.filter((metaDoc) => metaDoc.data.name === collectionName);
  var removeStorages = [];
  relevantCollectionMetaDocs.forEach((metaDoc) => {
    removeStorages.push({
      collectionName: metaDoc.data.name,
      schema: metaDoc.data.schema,
      isCollection: true
    });
    metaDoc.data.connectedStorages.forEach((row) => removeStorages.push({
      collectionName: row.collectionName,
      isCollection: false,
      schema: row.schema
    }));
  });
  var alreadyAdded = /* @__PURE__ */ new Set();
  removeStorages = removeStorages.filter((row) => {
    var key = row.collectionName + "||" + row.schema.version;
    if (alreadyAdded.has(key)) {
      return false;
    } else {
      alreadyAdded.add(key);
      return true;
    }
  });
  await Promise.all(removeStorages.map(async (row) => {
    var storageInstance = await storage.createStorageInstance({
      collectionName: row.collectionName,
      databaseInstanceToken,
      databaseName,
      /**
       * multiInstance must be set to true if multiInstance
       * was true on the database
       * so that the storageInstance can inform other
       * instances about being removed.
       */
      multiInstance,
      options: {},
      schema: row.schema,
      password,
      devMode: overwritable.isDevMode()
    });
    await storageInstance.remove();
    if (row.isCollection) {
      await runAsyncPluginHooks("postRemoveRxCollection", {
        storage,
        databaseName,
        collectionName
      });
    }
  }));
  if (hashFunction) {
    var writeRows = relevantCollectionMetaDocs.map((doc) => {
      var writeDoc = flatCloneDocWithMeta(doc);
      writeDoc._deleted = true;
      writeDoc._meta.lwt = now$1();
      writeDoc._rev = createRevision(databaseInstanceToken, doc);
      return {
        previous: doc,
        document: writeDoc
      };
    });
    await databaseInternalStorage.bulkWrite(writeRows, "rx-database-remove-collection-all");
  }
}
function ensureRxCollectionIsNotClosed(collection) {
  if (collection.closed) {
    throw newRxError("COL21", {
      collection: collection.name,
      version: collection.schema.version
    });
  }
}
var ChangeEventBuffer = /* @__PURE__ */ function() {
  function ChangeEventBuffer2(collection) {
    this.subs = [];
    this.counter = 0;
    this.eventCounterMap = /* @__PURE__ */ new WeakMap();
    this.buffer = [];
    this.limit = 100;
    this.tasks = /* @__PURE__ */ new Set();
    this.collection = collection;
    this.subs.push(this.collection.eventBulks$.pipe(filter((bulk) => !bulk.isLocal)).subscribe((eventBulk) => {
      this.tasks.add(() => this._handleChangeEvents(eventBulk.events));
      if (this.tasks.size <= 1) {
        requestIdlePromiseNoQueue().then(() => {
          this.processTasks();
        });
      }
    }));
  }
  var _proto = ChangeEventBuffer2.prototype;
  _proto.processTasks = function processTasks() {
    if (this.tasks.size === 0) {
      return;
    }
    var tasks = Array.from(this.tasks);
    tasks.forEach((task) => task());
    this.tasks.clear();
  };
  _proto._handleChangeEvents = function _handleChangeEvents(events) {
    var counterBefore = this.counter;
    this.counter = this.counter + events.length;
    if (events.length > this.limit) {
      this.buffer = events.slice(events.length * -1);
    } else {
      appendToArray(this.buffer, events);
      this.buffer = this.buffer.slice(this.limit * -1);
    }
    var counterBase = counterBefore + 1;
    var eventCounterMap = this.eventCounterMap;
    for (var index = 0; index < events.length; index++) {
      var event = events[index];
      eventCounterMap.set(event, counterBase + index);
    }
  };
  _proto.getCounter = function getCounter() {
    this.processTasks();
    return this.counter;
  };
  _proto.getBuffer = function getBuffer() {
    this.processTasks();
    return this.buffer;
  };
  _proto.getArrayIndexByPointer = function getArrayIndexByPointer(pointer) {
    this.processTasks();
    var oldestEvent = this.buffer[0];
    var oldestCounter = this.eventCounterMap.get(oldestEvent);
    if (pointer < oldestCounter) return null;
    var rest = pointer - oldestCounter;
    return rest;
  };
  _proto.getFrom = function getFrom(pointer) {
    this.processTasks();
    var ret = [];
    var currentIndex = this.getArrayIndexByPointer(pointer);
    if (currentIndex === null)
      return null;
    while (true) {
      var nextEvent = this.buffer[currentIndex];
      currentIndex++;
      if (!nextEvent) {
        return ret;
      } else {
        ret.push(nextEvent);
      }
    }
  };
  _proto.runFrom = function runFrom(pointer, fn) {
    this.processTasks();
    var ret = this.getFrom(pointer);
    if (ret === null) {
      throw new Error("out of bounds");
    } else {
      ret.forEach((cE) => fn(cE));
    }
  };
  _proto.reduceByLastOfDoc = function reduceByLastOfDoc(changeEvents) {
    this.processTasks();
    return changeEvents.slice(0);
  };
  _proto.close = function close3() {
    this.tasks.clear();
    this.subs.forEach((sub) => sub.unsubscribe());
  };
  return ChangeEventBuffer2;
}();
function createChangeEventBuffer(collection) {
  return new ChangeEventBuffer(collection);
}
var constructorForCollection = /* @__PURE__ */ new WeakMap();
function getDocumentPrototype(rxCollection) {
  var schemaProto = rxCollection.schema.getDocumentPrototype();
  var ormProto = getDocumentOrmPrototype(rxCollection);
  var baseProto = basePrototype;
  var proto = {};
  [schemaProto, ormProto, baseProto].forEach((obj) => {
    var props = Object.getOwnPropertyNames(obj);
    props.forEach((key) => {
      var desc = Object.getOwnPropertyDescriptor(obj, key);
      var enumerable = true;
      if (key.startsWith("_") || key.endsWith("_") || key.startsWith("$") || key.endsWith("$")) enumerable = false;
      if (typeof desc.value === "function") {
        Object.defineProperty(proto, key, {
          get() {
            return desc.value.bind(this);
          },
          enumerable,
          configurable: false
        });
      } else {
        desc.enumerable = enumerable;
        desc.configurable = false;
        if (desc.writable) desc.writable = false;
        Object.defineProperty(proto, key, desc);
      }
    });
  });
  return proto;
}
function getRxDocumentConstructor(rxCollection) {
  return getFromMapOrCreate(constructorForCollection, rxCollection, () => createRxDocumentConstructor(getDocumentPrototype(rxCollection)));
}
function createNewRxDocument(rxCollection, documentConstructor, docData) {
  var doc = createWithConstructor(documentConstructor, rxCollection, overwritable.deepFreezeWhenDevMode(docData));
  rxCollection._runHooksSync("post", "create", docData, doc);
  runPluginHooks("postCreateRxDocument", doc);
  return doc;
}
function getDocumentOrmPrototype(rxCollection) {
  var proto = {};
  Object.entries(rxCollection.methods).forEach(([k, v]) => {
    proto[k] = v;
  });
  return proto;
}
var defaultConflictHandler = {
  isEqual(a, b) {
    return deepEqual(stripAttachmentsDataFromDocument(a), stripAttachmentsDataFromDocument(b));
  },
  resolve(i) {
    return i.realMasterState;
  }
};
var HOOKS_WHEN = ["pre", "post"];
var HOOKS_KEYS = ["insert", "save", "remove", "create"];
var hooksApplied = false;
var OPEN_COLLECTIONS = /* @__PURE__ */ new Set();
var RxCollectionBase = /* @__PURE__ */ function() {
  function RxCollectionBase2(database, name, schema, internalStorageInstance, instanceCreationOptions = {}, migrationStrategies = {}, methods = {}, attachments = {}, options = {}, cacheReplacementPolicy = defaultCacheReplacementPolicy, statics = {}, conflictHandler = defaultConflictHandler) {
    this.storageInstance = {};
    this.timeouts = /* @__PURE__ */ new Set();
    this.incrementalWriteQueue = {};
    this.awaitBeforeReads = /* @__PURE__ */ new Set();
    this._incrementalUpsertQueues = /* @__PURE__ */ new Map();
    this.synced = false;
    this.hooks = {};
    this._subs = [];
    this._docCache = {};
    this._queryCache = createQueryCache();
    this.$ = {};
    this.checkpoint$ = {};
    this._changeEventBuffer = {};
    this.eventBulks$ = {};
    this.onClose = [];
    this.closed = false;
    this.onRemove = [];
    this.database = database;
    this.name = name;
    this.schema = schema;
    this.internalStorageInstance = internalStorageInstance;
    this.instanceCreationOptions = instanceCreationOptions;
    this.migrationStrategies = migrationStrategies;
    this.methods = methods;
    this.attachments = attachments;
    this.options = options;
    this.cacheReplacementPolicy = cacheReplacementPolicy;
    this.statics = statics;
    this.conflictHandler = conflictHandler;
    _applyHookFunctions(this.asRxCollection);
    if (database) {
      this.eventBulks$ = database.eventBulks$.pipe(filter((changeEventBulk) => changeEventBulk.collectionName === this.name));
    }
    if (this.database) {
      OPEN_COLLECTIONS.add(this);
    }
  }
  var _proto = RxCollectionBase2.prototype;
  _proto.prepare = async function prepare() {
    if (!await hasPremiumFlag()) {
      var count = 0;
      while (count < 10 && OPEN_COLLECTIONS.size > NON_PREMIUM_COLLECTION_LIMIT) {
        count++;
        await this.promiseWait(30);
      }
      if (OPEN_COLLECTIONS.size > NON_PREMIUM_COLLECTION_LIMIT) {
        throw newRxError("COL23", {
          database: this.database.name,
          collection: this.name,
          args: {
            existing: Array.from(OPEN_COLLECTIONS.values()).map((c) => ({
              db: c.database ? c.database.name : "",
              c: c.name
            }))
          }
        });
      }
    }
    this.storageInstance = getWrappedStorageInstance(this.database, this.internalStorageInstance, this.schema.jsonSchema);
    this.incrementalWriteQueue = new IncrementalWriteQueue(this.storageInstance, this.schema.primaryPath, (newData, oldData) => beforeDocumentUpdateWrite(this, newData, oldData), (result) => this._runHooks("post", "save", result));
    this.$ = this.eventBulks$.pipe(mergeMap((changeEventBulk) => rxChangeEventBulkToRxChangeEvents(changeEventBulk)));
    this.checkpoint$ = this.eventBulks$.pipe(map((changeEventBulk) => changeEventBulk.checkpoint));
    this._changeEventBuffer = createChangeEventBuffer(this.asRxCollection);
    var documentConstructor;
    this._docCache = new DocumentCache(this.schema.primaryPath, this.eventBulks$.pipe(filter((bulk) => !bulk.isLocal), map((bulk) => bulk.events)), (docData) => {
      if (!documentConstructor) {
        documentConstructor = getRxDocumentConstructor(this.asRxCollection);
      }
      return createNewRxDocument(this.asRxCollection, documentConstructor, docData);
    });
    var listenToRemoveSub = this.database.internalStore.changeStream().pipe(filter((bulk) => {
      var key = this.name + "-" + this.schema.version;
      var found = bulk.events.find((event) => {
        return event.documentData.context === "collection" && event.documentData.key === key && event.operation === "DELETE";
      });
      return !!found;
    })).subscribe(async () => {
      await this.close();
      await Promise.all(this.onRemove.map((fn) => fn()));
    });
    this._subs.push(listenToRemoveSub);
    var databaseStorageToken = await this.database.storageToken;
    var subDocs = this.storageInstance.changeStream().subscribe((eventBulk) => {
      var changeEventBulk = {
        id: eventBulk.id,
        isLocal: false,
        internal: false,
        collectionName: this.name,
        storageToken: databaseStorageToken,
        events: eventBulk.events,
        databaseToken: this.database.token,
        checkpoint: eventBulk.checkpoint,
        context: eventBulk.context
      };
      this.database.$emit(changeEventBulk);
    });
    this._subs.push(subDocs);
    return PROMISE_RESOLVE_VOID;
  };
  _proto.cleanup = function cleanup(_minimumDeletedTime) {
    ensureRxCollectionIsNotClosed(this);
    throw pluginMissing("cleanup");
  };
  _proto.migrationNeeded = function migrationNeeded() {
    throw pluginMissing("migration-schema");
  };
  _proto.getMigrationState = function getMigrationState() {
    throw pluginMissing("migration-schema");
  };
  _proto.startMigration = function startMigration(batchSize = 10) {
    ensureRxCollectionIsNotClosed(this);
    return this.getMigrationState().startMigration(batchSize);
  };
  _proto.migratePromise = function migratePromise(batchSize = 10) {
    return this.getMigrationState().migratePromise(batchSize);
  };
  _proto.insert = async function insert(json) {
    ensureRxCollectionIsNotClosed(this);
    var writeResult = await this.bulkInsert([json]);
    var isError = writeResult.error[0];
    throwIfIsStorageWriteError(this, json[this.schema.primaryPath], json, isError);
    var insertResult = ensureNotFalsy(writeResult.success[0]);
    return insertResult;
  };
  _proto.insertIfNotExists = async function insertIfNotExists(json) {
    var writeResult = await this.bulkInsert([json]);
    if (writeResult.error.length > 0) {
      var error = writeResult.error[0];
      if (error.status === 409) {
        var conflictDocData = error.documentInDb;
        return mapDocumentsDataToCacheDocs(this._docCache, [conflictDocData])[0];
      } else {
        throw error;
      }
    }
    return writeResult.success[0];
  };
  _proto.bulkInsert = async function bulkInsert(docsData) {
    ensureRxCollectionIsNotClosed(this);
    if (docsData.length === 0) {
      return {
        success: [],
        error: []
      };
    }
    var primaryPath = this.schema.primaryPath;
    var ids = /* @__PURE__ */ new Set();
    var insertRows;
    if (this.hasHooks("pre", "insert")) {
      insertRows = await Promise.all(docsData.map((docData2) => {
        var useDocData2 = fillObjectDataBeforeInsert(this.schema, docData2);
        return this._runHooks("pre", "insert", useDocData2).then(() => {
          ids.add(useDocData2[primaryPath]);
          return {
            document: useDocData2
          };
        });
      }));
    } else {
      insertRows = new Array(docsData.length);
      var _schema = this.schema;
      for (var index = 0; index < docsData.length; index++) {
        var docData = docsData[index];
        var useDocData = fillObjectDataBeforeInsert(_schema, docData);
        ids.add(useDocData[primaryPath]);
        insertRows[index] = {
          document: useDocData
        };
      }
    }
    if (ids.size !== docsData.length) {
      throw newRxError("COL22", {
        collection: this.name,
        args: {
          documents: docsData
        }
      });
    }
    var results = await this.storageInstance.bulkWrite(insertRows, "rx-collection-bulk-insert");
    var rxDocuments;
    var collection = this;
    var ret = {
      get success() {
        if (!rxDocuments) {
          var success = getWrittenDocumentsFromBulkWriteResponse(collection.schema.primaryPath, insertRows, results);
          rxDocuments = mapDocumentsDataToCacheDocs(collection._docCache, success);
        }
        return rxDocuments;
      },
      error: results.error
    };
    if (this.hasHooks("post", "insert")) {
      var docsMap = /* @__PURE__ */ new Map();
      insertRows.forEach((row) => {
        var doc = row.document;
        docsMap.set(doc[primaryPath], doc);
      });
      await Promise.all(ret.success.map((doc) => {
        return this._runHooks("post", "insert", docsMap.get(doc.primary), doc);
      }));
    }
    return ret;
  };
  _proto.bulkRemove = async function bulkRemove(idsOrDocs) {
    ensureRxCollectionIsNotClosed(this);
    var primaryPath = this.schema.primaryPath;
    if (idsOrDocs.length === 0) {
      return {
        success: [],
        error: []
      };
    }
    var rxDocumentMap;
    if (typeof idsOrDocs[0] === "string") {
      rxDocumentMap = await this.findByIds(idsOrDocs).exec();
    } else {
      rxDocumentMap = /* @__PURE__ */ new Map();
      idsOrDocs.forEach((d) => rxDocumentMap.set(d.primary, d));
    }
    var docsData = [];
    var docsMap = /* @__PURE__ */ new Map();
    Array.from(rxDocumentMap.values()).forEach((rxDocument) => {
      var data = rxDocument.toMutableJSON(true);
      docsData.push(data);
      docsMap.set(rxDocument.primary, data);
    });
    await Promise.all(docsData.map((doc) => {
      var primary = doc[this.schema.primaryPath];
      return this._runHooks("pre", "remove", doc, rxDocumentMap.get(primary));
    }));
    var removeDocs = docsData.map((doc) => {
      var writeDoc = flatClone(doc);
      writeDoc._deleted = true;
      return {
        previous: doc,
        document: writeDoc
      };
    });
    var results = await this.storageInstance.bulkWrite(removeDocs, "rx-collection-bulk-remove");
    var success = getWrittenDocumentsFromBulkWriteResponse(this.schema.primaryPath, removeDocs, results);
    var deletedRxDocuments = [];
    var successIds = success.map((d) => {
      var id = d[primaryPath];
      var doc = this._docCache.getCachedRxDocument(d);
      deletedRxDocuments.push(doc);
      return id;
    });
    await Promise.all(successIds.map((id) => {
      return this._runHooks("post", "remove", docsMap.get(id), rxDocumentMap.get(id));
    }));
    return {
      success: deletedRxDocuments,
      error: results.error
    };
  };
  _proto.bulkUpsert = async function bulkUpsert(docsData) {
    ensureRxCollectionIsNotClosed(this);
    var insertData = [];
    var useJsonByDocId = /* @__PURE__ */ new Map();
    docsData.forEach((docData) => {
      var useJson = fillObjectDataBeforeInsert(this.schema, docData);
      var primary = useJson[this.schema.primaryPath];
      if (!primary) {
        throw newRxError("COL3", {
          primaryPath: this.schema.primaryPath,
          data: useJson,
          schema: this.schema.jsonSchema
        });
      }
      useJsonByDocId.set(primary, useJson);
      insertData.push(useJson);
    });
    var insertResult = await this.bulkInsert(insertData);
    var success = insertResult.success.slice(0);
    var error = [];
    await Promise.all(insertResult.error.map(async (err) => {
      if (err.status !== 409) {
        error.push(err);
      } else {
        var id = err.documentId;
        var writeData = getFromMapOrThrow(useJsonByDocId, id);
        var docDataInDb = ensureNotFalsy(err.documentInDb);
        var doc = this._docCache.getCachedRxDocuments([docDataInDb])[0];
        var newDoc = await doc.incrementalModify(() => writeData);
        success.push(newDoc);
      }
    }));
    return {
      error,
      success
    };
  };
  _proto.upsert = async function upsert(json) {
    ensureRxCollectionIsNotClosed(this);
    var bulkResult = await this.bulkUpsert([json]);
    throwIfIsStorageWriteError(this.asRxCollection, json[this.schema.primaryPath], json, bulkResult.error[0]);
    return bulkResult.success[0];
  };
  _proto.incrementalUpsert = function incrementalUpsert(json) {
    ensureRxCollectionIsNotClosed(this);
    var useJson = fillObjectDataBeforeInsert(this.schema, json);
    var primary = useJson[this.schema.primaryPath];
    if (!primary) {
      throw newRxError("COL4", {
        data: json
      });
    }
    var queue = this._incrementalUpsertQueues.get(primary);
    if (!queue) {
      queue = PROMISE_RESOLVE_VOID;
    }
    queue = queue.then(() => _incrementalUpsertEnsureRxDocumentExists(this, primary, useJson)).then((wasInserted) => {
      if (!wasInserted.inserted) {
        return _incrementalUpsertUpdate(wasInserted.doc, useJson);
      } else {
        return wasInserted.doc;
      }
    });
    this._incrementalUpsertQueues.set(primary, queue);
    return queue;
  };
  _proto.find = function find(queryObj) {
    ensureRxCollectionIsNotClosed(this);
    runPluginHooks("prePrepareRxQuery", {
      op: "find",
      queryObj,
      collection: this
    });
    if (!queryObj) {
      queryObj = _getDefaultQuery();
    }
    var query = createRxQuery("find", queryObj, this);
    return query;
  };
  _proto.findOne = function findOne(queryObj) {
    ensureRxCollectionIsNotClosed(this);
    runPluginHooks("prePrepareRxQuery", {
      op: "findOne",
      queryObj,
      collection: this
    });
    var query;
    if (typeof queryObj === "string") {
      query = createRxQuery("findOne", {
        selector: {
          [this.schema.primaryPath]: queryObj
        },
        limit: 1
      }, this);
    } else {
      if (!queryObj) {
        queryObj = _getDefaultQuery();
      }
      if (queryObj.limit) {
        throw newRxError("QU6");
      }
      queryObj = flatClone(queryObj);
      queryObj.limit = 1;
      query = createRxQuery("findOne", queryObj, this);
    }
    return query;
  };
  _proto.count = function count(queryObj) {
    ensureRxCollectionIsNotClosed(this);
    if (!queryObj) {
      queryObj = _getDefaultQuery();
    }
    var query = createRxQuery("count", queryObj, this);
    return query;
  };
  _proto.findByIds = function findByIds(ids) {
    ensureRxCollectionIsNotClosed(this);
    var mangoQuery = {
      selector: {
        [this.schema.primaryPath]: {
          $in: ids.slice(0)
        }
      }
    };
    var query = createRxQuery("findByIds", mangoQuery, this);
    return query;
  };
  _proto.exportJSON = function exportJSON() {
    throw pluginMissing("json-dump");
  };
  _proto.importJSON = function importJSON(_exportedJSON) {
    throw pluginMissing("json-dump");
  };
  _proto.insertCRDT = function insertCRDT(_updateObj) {
    throw pluginMissing("crdt");
  };
  _proto.addPipeline = function addPipeline(_options4) {
    throw pluginMissing("pipeline");
  };
  _proto.addHook = function addHook(when, key, fun, parallel = false) {
    if (typeof fun !== "function") {
      throw newRxTypeError("COL7", {
        key,
        when
      });
    }
    if (!HOOKS_WHEN.includes(when)) {
      throw newRxTypeError("COL8", {
        key,
        when
      });
    }
    if (!HOOKS_KEYS.includes(key)) {
      throw newRxError("COL9", {
        key
      });
    }
    if (when === "post" && key === "create" && parallel === true) {
      throw newRxError("COL10", {
        when,
        key,
        parallel
      });
    }
    var boundFun = fun.bind(this);
    var runName = parallel ? "parallel" : "series";
    this.hooks[key] = this.hooks[key] || {};
    this.hooks[key][when] = this.hooks[key][when] || {
      series: [],
      parallel: []
    };
    this.hooks[key][when][runName].push(boundFun);
  };
  _proto.getHooks = function getHooks(when, key) {
    if (!this.hooks[key] || !this.hooks[key][when]) {
      return {
        series: [],
        parallel: []
      };
    }
    return this.hooks[key][when];
  };
  _proto.hasHooks = function hasHooks(when, key) {
    if (!this.hooks[key] || !this.hooks[key][when]) {
      return false;
    }
    var hooks = this.getHooks(when, key);
    if (!hooks) {
      return false;
    }
    return hooks.series.length > 0 || hooks.parallel.length > 0;
  };
  _proto._runHooks = function _runHooks(when, key, data, instance) {
    var hooks = this.getHooks(when, key);
    if (!hooks) {
      return PROMISE_RESOLVE_VOID;
    }
    var tasks = hooks.series.map((hook) => () => hook(data, instance));
    return promiseSeries(tasks).then(() => Promise.all(hooks.parallel.map((hook) => hook(data, instance))));
  };
  _proto._runHooksSync = function _runHooksSync(when, key, data, instance) {
    if (!this.hasHooks(when, key)) {
      return;
    }
    var hooks = this.getHooks(when, key);
    if (!hooks) return;
    hooks.series.forEach((hook) => hook(data, instance));
  };
  _proto.promiseWait = function promiseWait2(time) {
    var ret = new Promise((res) => {
      var timeout = setTimeout(() => {
        this.timeouts.delete(timeout);
        res();
      }, time);
      this.timeouts.add(timeout);
    });
    return ret;
  };
  _proto.close = async function close3() {
    if (this.closed) {
      return PROMISE_RESOLVE_FALSE;
    }
    OPEN_COLLECTIONS.delete(this);
    await Promise.all(this.onClose.map((fn) => fn()));
    this.closed = true;
    Array.from(this.timeouts).forEach((timeout) => clearTimeout(timeout));
    if (this._changeEventBuffer) {
      this._changeEventBuffer.close();
    }
    return this.database.requestIdlePromise().then(() => this.storageInstance.close()).then(() => {
      this._subs.forEach((sub) => sub.unsubscribe());
      delete this.database.collections[this.name];
      return runAsyncPluginHooks("postCloseRxCollection", this).then(() => true);
    });
  };
  _proto.remove = async function remove2() {
    await this.close();
    await Promise.all(this.onRemove.map((fn) => fn()));
    await removeCollectionStorages(this.database.storage, this.database.internalStore, this.database.token, this.database.name, this.name, this.database.multiInstance, this.database.password, this.database.hashFunction);
  };
  return _createClass(RxCollectionBase2, [{
    key: "insert$",
    get: function() {
      return this.$.pipe(filter((cE) => cE.operation === "INSERT"));
    }
  }, {
    key: "update$",
    get: function() {
      return this.$.pipe(filter((cE) => cE.operation === "UPDATE"));
    }
  }, {
    key: "remove$",
    get: function() {
      return this.$.pipe(filter((cE) => cE.operation === "DELETE"));
    }
    // defaults
    /**
     * Internally only use eventBulks$
     * Do not use .$ or .observable$ because that has to transform
     * the events which decreases performance.
     */
    /**
     * When the collection is closed,
     * these functions will be called an awaited.
     * Used to automatically clean up stuff that
     * belongs to this collection.
    */
  }, {
    key: "asRxCollection",
    get: function() {
      return this;
    }
  }]);
}();
function _applyHookFunctions(collection) {
  if (hooksApplied) return;
  hooksApplied = true;
  var colProto = Object.getPrototypeOf(collection);
  HOOKS_KEYS.forEach((key) => {
    HOOKS_WHEN.map((when) => {
      var fnName = when + ucfirst(key);
      colProto[fnName] = function(fun, parallel) {
        return this.addHook(when, key, fun, parallel);
      };
    });
  });
}
function _incrementalUpsertUpdate(doc, json) {
  return doc.incrementalModify((_innerDoc) => {
    return json;
  });
}
function _incrementalUpsertEnsureRxDocumentExists(rxCollection, primary, json) {
  var docDataFromCache = rxCollection._docCache.getLatestDocumentDataIfExists(primary);
  if (docDataFromCache) {
    return Promise.resolve({
      doc: rxCollection._docCache.getCachedRxDocuments([docDataFromCache])[0],
      inserted: false
    });
  }
  return rxCollection.findOne(primary).exec().then((doc) => {
    if (!doc) {
      return rxCollection.insert(json).then((newDoc) => ({
        doc: newDoc,
        inserted: true
      }));
    } else {
      return {
        doc,
        inserted: false
      };
    }
  });
}
function createRxCollection({
  database,
  name,
  schema,
  instanceCreationOptions = {},
  migrationStrategies = {},
  autoMigrate = true,
  statics = {},
  methods = {},
  attachments = {},
  options = {},
  localDocuments = false,
  cacheReplacementPolicy = defaultCacheReplacementPolicy,
  conflictHandler = defaultConflictHandler
}) {
  var storageInstanceCreationParams = {
    databaseInstanceToken: database.token,
    databaseName: database.name,
    collectionName: name,
    schema: schema.jsonSchema,
    options: instanceCreationOptions,
    multiInstance: database.multiInstance,
    password: database.password,
    devMode: overwritable.isDevMode()
  };
  runPluginHooks("preCreateRxStorageInstance", storageInstanceCreationParams);
  return createRxCollectionStorageInstance(database, storageInstanceCreationParams).then((storageInstance) => {
    var collection = new RxCollectionBase(database, name, schema, storageInstance, instanceCreationOptions, migrationStrategies, methods, attachments, options, cacheReplacementPolicy, statics, conflictHandler);
    return collection.prepare().then(() => {
      Object.entries(statics).forEach(([funName, fun]) => {
        Object.defineProperty(collection, funName, {
          get: () => fun.bind(collection)
        });
      });
      var ret = PROMISE_RESOLVE_VOID;
      if (autoMigrate && collection.schema.version !== 0) {
        ret = collection.migratePromise();
      }
      return ret;
    }).then(() => {
      runPluginHooks("createRxCollection", {
        collection,
        creator: {
          name,
          schema,
          storageInstance,
          instanceCreationOptions,
          migrationStrategies,
          methods,
          attachments,
          options,
          cacheReplacementPolicy,
          localDocuments,
          statics
        }
      });
      return collection;
    }).catch((err) => {
      OPEN_COLLECTIONS.delete(collection);
      return storageInstance.close().then(() => Promise.reject(err));
    });
  });
}
var IdleQueue = function IdleQueue2() {
  var parallels = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
  this._parallels = parallels || 1;
  this._qC = 0;
  this._iC = /* @__PURE__ */ new Set();
  this._lHN = 0;
  this._hPM = /* @__PURE__ */ new Map();
  this._pHM = /* @__PURE__ */ new Map();
};
IdleQueue.prototype = {
  isIdle: function isIdle() {
    return this._qC < this._parallels;
  },
  /**
   * creates a lock in the queue
   * and returns an unlock-function to remove the lock from the queue
   * @return {function} unlock function than must be called afterwards
   */
  lock: function lock() {
    this._qC++;
  },
  unlock: function unlock() {
    this._qC--;
    _tryIdleCall(this);
  },
  /**
   * wraps a function with lock/unlock and runs it
   * @param  {function}  fun
   * @return {Promise<any>}
   */
  wrapCall: function wrapCall(fun) {
    var _this = this;
    this.lock();
    var maybePromise;
    try {
      maybePromise = fun();
    } catch (err) {
      this.unlock();
      throw err;
    }
    if (!maybePromise.then || typeof maybePromise.then !== "function") {
      this.unlock();
      return maybePromise;
    } else {
      return maybePromise.then(function(ret) {
        _this.unlock();
        return ret;
      })["catch"](function(err) {
        _this.unlock();
        throw err;
      });
    }
  },
  /**
   * does the same as requestIdleCallback() but uses promises instead of the callback
   * @param {{timeout?: number}} options like timeout
   * @return {Promise<void>} promise that resolves when the database is in idle-mode
   */
  requestIdlePromise: function requestIdlePromise2(options) {
    var _this2 = this;
    options = options || {};
    var resolve2;
    var prom = new Promise(function(res) {
      return resolve2 = res;
    });
    var resolveFromOutside = function resolveFromOutside2() {
      _removeIdlePromise(_this2, prom);
      resolve2();
    };
    prom._manRes = resolveFromOutside;
    if (options.timeout) {
      var timeoutObj = setTimeout(function() {
        prom._manRes();
      }, options.timeout);
      prom._timeoutObj = timeoutObj;
    }
    this._iC.add(prom);
    _tryIdleCall(this);
    return prom;
  },
  /**
   * remove the promise so it will never be resolved
   * @param  {Promise} promise from requestIdlePromise()
   * @return {void}
   */
  cancelIdlePromise: function cancelIdlePromise(promise) {
    _removeIdlePromise(this, promise);
  },
  /**
   * api equal to
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
   * @param  {Function} callback
   * @param  {options}   options  [description]
   * @return {number} handle which can be used with cancelIdleCallback()
   */
  requestIdleCallback: function requestIdleCallback2(callback, options) {
    var handle = this._lHN++;
    var promise = this.requestIdlePromise(options);
    this._hPM.set(handle, promise);
    this._pHM.set(promise, handle);
    promise.then(function() {
      return callback();
    });
    return handle;
  },
  /**
   * API equal to
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback
   * @param  {number} handle returned from requestIdleCallback()
   * @return {void}
   */
  cancelIdleCallback: function cancelIdleCallback(handle) {
    var promise = this._hPM.get(handle);
    this.cancelIdlePromise(promise);
  },
  /**
   * clears and resets everything
   * @return {void}
   */
  clear: function clear() {
    var _this3 = this;
    this._iC.forEach(function(promise) {
      return _removeIdlePromise(_this3, promise);
    });
    this._qC = 0;
    this._iC.clear();
    this._hPM = /* @__PURE__ */ new Map();
    this._pHM = /* @__PURE__ */ new Map();
  }
};
function _resolveOneIdleCall(idleQueue) {
  if (idleQueue._iC.size === 0) return;
  var iterator2 = idleQueue._iC.values();
  var oldestPromise = iterator2.next().value;
  oldestPromise._manRes();
  setTimeout(function() {
    return _tryIdleCall(idleQueue);
  }, 0);
}
function _removeIdlePromise(idleQueue, promise) {
  if (!promise) return;
  if (promise._timeoutObj) clearTimeout(promise._timeoutObj);
  if (idleQueue._pHM.has(promise)) {
    var handle = idleQueue._pHM.get(promise);
    idleQueue._hPM["delete"](handle);
    idleQueue._pHM["delete"](promise);
  }
  idleQueue._iC["delete"](promise);
}
function _tryIdleCall(idleQueue) {
  if (idleQueue._tryIR || idleQueue._iC.size === 0) return;
  idleQueue._tryIR = true;
  setTimeout(function() {
    if (!idleQueue.isIdle()) {
      idleQueue._tryIR = false;
      return;
    }
    setTimeout(function() {
      if (!idleQueue.isIdle()) {
        idleQueue._tryIR = false;
        return;
      }
      _resolveOneIdleCall(idleQueue);
      idleQueue._tryIR = false;
    }, 0);
  }, 0);
}
class ObliviousSet {
  constructor(ttl) {
    __publicField(this, "ttl");
    __publicField(this, "map", /* @__PURE__ */ new Map());
    /**
     * Creating calls to setTimeout() is expensive,
     * so we only do that if there is not timeout already open.
     */
    __publicField(this, "_to", false);
    this.ttl = ttl;
  }
  has(value) {
    return this.map.has(value);
  }
  add(value) {
    this.map.set(value, now());
    if (!this._to) {
      this._to = true;
      setTimeout(() => {
        this._to = false;
        removeTooOldValues(this);
      }, 0);
    }
  }
  clear() {
    this.map.clear();
  }
}
function removeTooOldValues(obliviousSet) {
  const olderThen = now() - obliviousSet.ttl;
  const iterator2 = obliviousSet.map[Symbol.iterator]();
  while (true) {
    const next = iterator2.next().value;
    if (!next) {
      return;
    }
    const value = next[0];
    const time = next[1];
    if (time < olderThen) {
      obliviousSet.map.delete(value);
    } else {
      return;
    }
  }
}
function now() {
  return Date.now();
}
var USED_DATABASE_NAMES = /* @__PURE__ */ new Set();
var DATABASE_UNCLOSED_INSTANCE_PROMISE_MAP = /* @__PURE__ */ new Map();
var RxDatabaseBase = /* @__PURE__ */ function() {
  function RxDatabaseBase2(name, token, storage, instanceCreationOptions, password, multiInstance, eventReduce = false, options = {}, internalStore, hashFunction, cleanupPolicy, allowSlowCount, reactivity, onClosed) {
    this.idleQueue = new IdleQueue();
    this.rxdbVersion = RXDB_VERSION;
    this.storageInstances = /* @__PURE__ */ new Set();
    this._subs = [];
    this.startupErrors = [];
    this.onClose = [];
    this.closed = false;
    this.collections = {};
    this.states = {};
    this.eventBulks$ = new Subject();
    this.closePromise = null;
    this.observable$ = this.eventBulks$.pipe(mergeMap((changeEventBulk) => rxChangeEventBulkToRxChangeEvents(changeEventBulk)));
    this.storageToken = PROMISE_RESOLVE_FALSE;
    this.storageTokenDocument = PROMISE_RESOLVE_FALSE;
    this.emittedEventBulkIds = new ObliviousSet(60 * 1e3);
    this.name = name;
    this.token = token;
    this.storage = storage;
    this.instanceCreationOptions = instanceCreationOptions;
    this.password = password;
    this.multiInstance = multiInstance;
    this.eventReduce = eventReduce;
    this.options = options;
    this.internalStore = internalStore;
    this.hashFunction = hashFunction;
    this.cleanupPolicy = cleanupPolicy;
    this.allowSlowCount = allowSlowCount;
    this.reactivity = reactivity;
    this.onClosed = onClosed;
    if (this.name !== "pseudoInstance") {
      this.internalStore = getWrappedStorageInstance(this.asRxDatabase, internalStore, INTERNAL_STORE_SCHEMA);
      this.storageTokenDocument = ensureStorageTokenDocumentExists(this.asRxDatabase).catch((err) => this.startupErrors.push(err));
      this.storageToken = this.storageTokenDocument.then((doc) => doc.data.token).catch((err) => this.startupErrors.push(err));
    }
  }
  var _proto = RxDatabaseBase2.prototype;
  _proto.getReactivityFactory = function getReactivityFactory() {
    if (!this.reactivity) {
      throw newRxError("DB14", {
        database: this.name
      });
    }
    return this.reactivity;
  };
  _proto.$emit = function $emit(changeEventBulk) {
    if (this.emittedEventBulkIds.has(changeEventBulk.id)) {
      return;
    }
    this.emittedEventBulkIds.add(changeEventBulk.id);
    this.eventBulks$.next(changeEventBulk);
  };
  _proto.removeCollectionDoc = async function removeCollectionDoc(name, schema) {
    var doc = await getSingleDocument(this.internalStore, getPrimaryKeyOfInternalDocument(_collectionNamePrimary(name, schema), INTERNAL_CONTEXT_COLLECTION));
    if (!doc) {
      throw newRxError("SNH", {
        name,
        schema
      });
    }
    var writeDoc = flatCloneDocWithMeta(doc);
    writeDoc._deleted = true;
    await this.internalStore.bulkWrite([{
      document: writeDoc,
      previous: doc
    }], "rx-database-remove-collection");
  };
  _proto.addCollections = async function addCollections(collectionCreators) {
    var jsonSchemas = {};
    var schemas = {};
    var bulkPutDocs = [];
    var useArgsByCollectionName = {};
    await Promise.all(Object.entries(collectionCreators).map(async ([name, args]) => {
      var collectionName = name;
      var rxJsonSchema = args.schema;
      jsonSchemas[collectionName] = rxJsonSchema;
      var schema = createRxSchema(rxJsonSchema, this.hashFunction);
      schemas[collectionName] = schema;
      if (this.collections[name]) {
        throw newRxError("DB3", {
          name
        });
      }
      var collectionNameWithVersion = _collectionNamePrimary(name, rxJsonSchema);
      var collectionDocData = {
        id: getPrimaryKeyOfInternalDocument(collectionNameWithVersion, INTERNAL_CONTEXT_COLLECTION),
        key: collectionNameWithVersion,
        context: INTERNAL_CONTEXT_COLLECTION,
        data: {
          name: collectionName,
          schemaHash: await schema.hash,
          schema: schema.jsonSchema,
          version: schema.version,
          connectedStorages: []
        },
        _deleted: false,
        _meta: getDefaultRxDocumentMeta(),
        _rev: getDefaultRevision(),
        _attachments: {}
      };
      bulkPutDocs.push({
        document: collectionDocData
      });
      var useArgs = Object.assign({}, args, {
        name: collectionName,
        schema,
        database: this
      });
      var hookData = flatClone(args);
      hookData.database = this;
      hookData.name = name;
      runPluginHooks("preCreateRxCollection", hookData);
      useArgs.conflictHandler = hookData.conflictHandler;
      useArgsByCollectionName[collectionName] = useArgs;
    }));
    var putDocsResult = await this.internalStore.bulkWrite(bulkPutDocs, "rx-database-add-collection");
    await ensureNoStartupErrors(this);
    await Promise.all(putDocsResult.error.map(async (error) => {
      if (error.status !== 409) {
        throw newRxError("DB12", {
          database: this.name,
          writeError: error
        });
      }
      var docInDb = ensureNotFalsy(error.documentInDb);
      var collectionName = docInDb.data.name;
      var schema = schemas[collectionName];
      if (docInDb.data.schemaHash !== await schema.hash) {
        throw newRxError("DB6", {
          database: this.name,
          collection: collectionName,
          previousSchemaHash: docInDb.data.schemaHash,
          schemaHash: await schema.hash,
          previousSchema: docInDb.data.schema,
          schema: ensureNotFalsy(jsonSchemas[collectionName])
        });
      }
    }));
    var ret = {};
    await Promise.all(Object.keys(collectionCreators).map(async (collectionName) => {
      var useArgs = useArgsByCollectionName[collectionName];
      var collection = await createRxCollection(useArgs);
      ret[collectionName] = collection;
      this.collections[collectionName] = collection;
      if (!this[collectionName]) {
        Object.defineProperty(this, collectionName, {
          get: () => this.collections[collectionName]
        });
      }
    }));
    return ret;
  };
  _proto.lockedRun = function lockedRun(fn) {
    return this.idleQueue.wrapCall(fn);
  };
  _proto.requestIdlePromise = function requestIdlePromise3() {
    return this.idleQueue.requestIdlePromise();
  };
  _proto.exportJSON = function exportJSON(_collections) {
    throw pluginMissing("json-dump");
  };
  _proto.addState = function addState(_name) {
    throw pluginMissing("state");
  };
  _proto.importJSON = function importJSON(_exportedJSON) {
    throw pluginMissing("json-dump");
  };
  _proto.backup = function backup(_options4) {
    throw pluginMissing("backup");
  };
  _proto.leaderElector = function leaderElector() {
    throw pluginMissing("leader-election");
  };
  _proto.isLeader = function isLeader() {
    throw pluginMissing("leader-election");
  };
  _proto.waitForLeadership = function waitForLeadership() {
    throw pluginMissing("leader-election");
  };
  _proto.migrationStates = function migrationStates() {
    throw pluginMissing("migration-schema");
  };
  _proto.close = function close3() {
    if (this.closePromise) {
      return this.closePromise;
    }
    var {
      promise,
      resolve: resolve2
    } = createPromiseWithResolvers();
    var resolveClosePromise = (result) => {
      if (this.onClosed) {
        this.onClosed();
      }
      this.closed = true;
      resolve2(result);
    };
    this.closePromise = promise;
    (async () => {
      await runAsyncPluginHooks("preCloseRxDatabase", this);
      this.eventBulks$.complete();
      this._subs.map((sub) => sub.unsubscribe());
      if (this.name === "pseudoInstance") {
        resolveClosePromise(false);
        return;
      }
      return this.requestIdlePromise().then(() => Promise.all(this.onClose.map((fn) => fn()))).then(() => Promise.all(Object.keys(this.collections).map((key) => this.collections[key]).map((col) => col.close()))).then(() => this.internalStore.close()).then(() => resolveClosePromise(true));
    })();
    return promise;
  };
  _proto.remove = function remove2() {
    return this.close().then(() => removeRxDatabase(this.name, this.storage, this.multiInstance, this.password));
  };
  return _createClass(RxDatabaseBase2, [{
    key: "$",
    get: function() {
      return this.observable$;
    }
  }, {
    key: "asRxDatabase",
    get: function() {
      return this;
    }
  }]);
}();
function throwIfDatabaseNameUsed(name, storage) {
  if (USED_DATABASE_NAMES.has(getDatabaseNameKey(name, storage))) {
    throw newRxError("DB8", {
      name,
      storage: storage.name,
      link: "https://rxdb.info/rx-database.html#ignoreduplicate"
    });
  }
}
function createPromiseWithResolvers() {
  var resolve2;
  var reject;
  var promise = new Promise((res, rej) => {
    resolve2 = res;
    reject = rej;
  });
  return {
    promise,
    resolve: resolve2,
    reject
  };
}
function getDatabaseNameKey(name, storage) {
  return storage.name + "|" + name;
}
async function createRxDatabaseStorageInstance(databaseInstanceToken, storage, databaseName, options, multiInstance, password) {
  var internalStore = await storage.createStorageInstance({
    databaseInstanceToken,
    databaseName,
    collectionName: INTERNAL_STORAGE_NAME,
    schema: INTERNAL_STORE_SCHEMA,
    options,
    multiInstance,
    password,
    devMode: overwritable.isDevMode()
  });
  return internalStore;
}
function createRxDatabase({
  storage,
  instanceCreationOptions,
  name,
  password,
  multiInstance = true,
  eventReduce = true,
  ignoreDuplicate = false,
  options = {},
  cleanupPolicy,
  closeDuplicates = false,
  allowSlowCount = false,
  localDocuments = false,
  hashFunction = defaultHashSha256,
  reactivity
}) {
  runPluginHooks("preCreateRxDatabase", {
    storage,
    instanceCreationOptions,
    name,
    password,
    multiInstance,
    eventReduce,
    ignoreDuplicate,
    options,
    localDocuments
  });
  var databaseNameKey = getDatabaseNameKey(name, storage);
  var databaseNameKeyUnclosedInstancesSet = DATABASE_UNCLOSED_INSTANCE_PROMISE_MAP.get(databaseNameKey) || /* @__PURE__ */ new Set();
  var instancePromiseWithResolvers = createPromiseWithResolvers();
  var closeDuplicatesPromises = Array.from(databaseNameKeyUnclosedInstancesSet);
  var onInstanceClosed = () => {
    databaseNameKeyUnclosedInstancesSet.delete(instancePromiseWithResolvers.promise);
    USED_DATABASE_NAMES.delete(databaseNameKey);
  };
  databaseNameKeyUnclosedInstancesSet.add(instancePromiseWithResolvers.promise);
  DATABASE_UNCLOSED_INSTANCE_PROMISE_MAP.set(databaseNameKey, databaseNameKeyUnclosedInstancesSet);
  (async () => {
    if (closeDuplicates) {
      await Promise.all(closeDuplicatesPromises.map((unclosedInstancePromise) => unclosedInstancePromise.catch(() => null).then((instance) => instance && instance.close())));
    }
    if (ignoreDuplicate) {
      if (!overwritable.isDevMode()) {
        throw newRxError("DB9", {
          database: name
        });
      }
    } else {
      throwIfDatabaseNameUsed(name, storage);
    }
    USED_DATABASE_NAMES.add(databaseNameKey);
    var databaseInstanceToken = randomToken$1(10);
    var storageInstance = await createRxDatabaseStorageInstance(databaseInstanceToken, storage, name, instanceCreationOptions, multiInstance, password);
    var rxDatabase = new RxDatabaseBase(name, databaseInstanceToken, storage, instanceCreationOptions, password, multiInstance, eventReduce, options, storageInstance, hashFunction, cleanupPolicy, allowSlowCount, reactivity, onInstanceClosed);
    await runAsyncPluginHooks("createRxDatabase", {
      database: rxDatabase,
      creator: {
        storage,
        instanceCreationOptions,
        name,
        password,
        multiInstance,
        eventReduce,
        ignoreDuplicate,
        options,
        localDocuments
      }
    });
    return rxDatabase;
  })().then((rxDatabase) => {
    instancePromiseWithResolvers.resolve(rxDatabase);
  }).catch((err) => {
    instancePromiseWithResolvers.reject(err);
    onInstanceClosed();
  });
  return instancePromiseWithResolvers.promise;
}
async function removeRxDatabase(databaseName, storage, multiInstance = true, password) {
  var databaseInstanceToken = randomToken$1(10);
  var dbInternalsStorageInstance = await createRxDatabaseStorageInstance(databaseInstanceToken, storage, databaseName, {}, multiInstance, password);
  var collectionDocs = await getAllCollectionDocuments(dbInternalsStorageInstance);
  var collectionNames = /* @__PURE__ */ new Set();
  collectionDocs.forEach((doc) => collectionNames.add(doc.data.name));
  var removedCollectionNames = Array.from(collectionNames);
  await Promise.all(removedCollectionNames.map((collectionName) => removeCollectionStorages(storage, dbInternalsStorageInstance, databaseInstanceToken, databaseName, collectionName, multiInstance, password)));
  await runAsyncPluginHooks("postRemoveRxDatabase", {
    databaseName,
    storage
  });
  await dbInternalsStorageInstance.remove();
  return removedCollectionNames;
}
function isRxDatabase(obj) {
  return obj instanceof RxDatabaseBase;
}
async function ensureNoStartupErrors(rxDatabase) {
  await rxDatabase.storageToken;
  if (rxDatabase.startupErrors[0]) {
    throw rxDatabase.startupErrors[0];
  }
}
var PROTOTYPES = {
  RxSchema: RxSchema.prototype,
  RxDocument: basePrototype,
  RxQuery: RxQueryBase.prototype,
  RxCollection: RxCollectionBase.prototype,
  RxDatabase: RxDatabaseBase.prototype
};
var ADDED_PLUGINS = /* @__PURE__ */ new Set();
var ADDED_PLUGIN_NAMES = /* @__PURE__ */ new Set();
function addRxPlugin(plugin) {
  runPluginHooks("preAddRxPlugin", {
    plugin,
    plugins: ADDED_PLUGINS
  });
  if (ADDED_PLUGINS.has(plugin)) {
    return;
  } else {
    if (ADDED_PLUGIN_NAMES.has(plugin.name)) {
      throw newRxError("PL3", {
        name: plugin.name,
        plugin
      });
    }
    ADDED_PLUGINS.add(plugin);
    ADDED_PLUGIN_NAMES.add(plugin.name);
  }
  if (!plugin.rxdb) {
    throw newRxTypeError("PL1", {
      plugin
    });
  }
  if (plugin.init) {
    plugin.init();
  }
  if (plugin.prototypes) {
    Object.entries(plugin.prototypes).forEach(([name, fun]) => {
      return fun(PROTOTYPES[name]);
    });
  }
  if (plugin.overwritable) {
    Object.assign(overwritable, plugin.overwritable);
  }
  if (plugin.hooks) {
    Object.entries(plugin.hooks).forEach(([name, hooksObj]) => {
      if (hooksObj.after) {
        HOOKS[name].push(hooksObj.after);
      }
      if (hooksObj.before) {
        HOOKS[name].unshift(hooksObj.before);
      }
    });
  }
}
async function getLastCheckpointDoc(state, direction) {
  var checkpointDocId = getComposedPrimaryKeyOfDocumentData(state.input.metaInstance.schema, {
    isCheckpoint: "1",
    itemId: direction
  });
  var checkpointResult = await state.input.metaInstance.findDocumentsById([checkpointDocId], false);
  var checkpointDoc = checkpointResult[0];
  state.lastCheckpointDoc[direction] = checkpointDoc;
  if (checkpointDoc) {
    return checkpointDoc.checkpointData;
  } else {
    return void 0;
  }
}
async function setCheckpoint(state, direction, checkpoint) {
  state.checkpointQueue = state.checkpointQueue.then(async () => {
    var previousCheckpointDoc = state.lastCheckpointDoc[direction];
    if (checkpoint && /**
     * If the replication is already canceled,
     * we do not write a checkpoint
     * because that could mean we write a checkpoint
     * for data that has been fetched from the master
     * but not been written to the child.
     */
    !state.events.canceled.getValue() && /**
     * Only write checkpoint if it is different from before
     * to have less writes to the storage.
     */
    (!previousCheckpointDoc || JSON.stringify(previousCheckpointDoc.checkpointData) !== JSON.stringify(checkpoint))) {
      var newDoc = {
        id: "",
        isCheckpoint: "1",
        itemId: direction,
        _deleted: false,
        _attachments: {},
        checkpointData: checkpoint,
        _meta: getDefaultRxDocumentMeta(),
        _rev: getDefaultRevision()
      };
      newDoc.id = getComposedPrimaryKeyOfDocumentData(state.input.metaInstance.schema, newDoc);
      while (!state.events.canceled.getValue()) {
        if (previousCheckpointDoc) {
          newDoc.checkpointData = stackCheckpoints([previousCheckpointDoc.checkpointData, newDoc.checkpointData]);
        }
        newDoc._meta.lwt = now$1();
        newDoc._rev = createRevision(await state.checkpointKey, previousCheckpointDoc);
        if (state.events.canceled.getValue()) {
          return;
        }
        var writeRows = [{
          previous: previousCheckpointDoc,
          document: newDoc
        }];
        var result = await state.input.metaInstance.bulkWrite(writeRows, "replication-set-checkpoint");
        var successDoc = getWrittenDocumentsFromBulkWriteResponse(state.primaryPath, writeRows, result)[0];
        if (successDoc) {
          state.lastCheckpointDoc[direction] = successDoc;
          return;
        } else {
          var error = result.error[0];
          if (error.status !== 409) {
            throw error;
          } else {
            previousCheckpointDoc = ensureNotFalsy(error.documentInDb);
            newDoc._rev = createRevision(await state.checkpointKey, previousCheckpointDoc);
          }
        }
      }
    }
  });
  await state.checkpointQueue;
}
async function getCheckpointKey(input) {
  var hash = await input.hashFunction([input.identifier, input.forkInstance.databaseName, input.forkInstance.collectionName].join("||"));
  return "rx_storage_replication_" + hash;
}
function docStateToWriteDoc(databaseInstanceToken, hasAttachments, keepMeta, docState, previous) {
  var docData = Object.assign({}, docState, {
    _attachments: hasAttachments && docState._attachments ? docState._attachments : {},
    _meta: keepMeta ? docState._meta : Object.assign({}, previous ? previous._meta : {}, {
      lwt: now$1()
    }),
    _rev: keepMeta ? docState._rev : getDefaultRevision()
  });
  if (!docData._rev) {
    docData._rev = createRevision(databaseInstanceToken, previous);
  }
  return docData;
}
function writeDocToDocState(writeDoc, keepAttachments, keepMeta) {
  var ret = flatClone(writeDoc);
  if (!keepAttachments) {
    delete ret._attachments;
  }
  if (!keepMeta) {
    delete ret._meta;
    delete ret._rev;
  }
  return ret;
}
function stripAttachmentsDataFromMetaWriteRows(state, rows) {
  if (!state.hasAttachments) {
    return rows;
  }
  return rows.map((row) => {
    var document2 = clone$1(row.document);
    document2.docData = stripAttachmentsDataFromDocument(document2.docData);
    return {
      document: document2,
      previous: row.previous
    };
  });
}
function getUnderlyingPersistentStorage(instance) {
  while (true) {
    if (instance.underlyingPersistentStorage) {
      instance = instance.underlyingPersistentStorage;
    } else {
      return instance;
    }
  }
}
var META_INSTANCE_SCHEMA_TITLE = "RxReplicationProtocolMetaData";
function getRxReplicationMetaInstanceSchema(replicatedDocumentsSchema, encrypted) {
  var parentPrimaryKeyLength = getLengthOfPrimaryKey(replicatedDocumentsSchema);
  var baseSchema = {
    title: META_INSTANCE_SCHEMA_TITLE,
    primaryKey: {
      key: "id",
      fields: ["itemId", "isCheckpoint"],
      separator: "|"
    },
    type: "object",
    version: replicatedDocumentsSchema.version,
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
        minLength: 1,
        // add +1 for the '|' and +1 for the 'isCheckpoint' flag
        maxLength: parentPrimaryKeyLength + 2
      },
      isCheckpoint: {
        type: "string",
        enum: ["0", "1"],
        minLength: 1,
        maxLength: 1
      },
      itemId: {
        type: "string",
        /**
         * ensure that all values of RxStorageReplicationDirection ('DOWN' has 4 chars) fit into it
         * because checkpoints use the itemId field for that.
         */
        maxLength: parentPrimaryKeyLength > 4 ? parentPrimaryKeyLength : 4
      },
      checkpointData: {
        type: "object",
        additionalProperties: true
      },
      docData: {
        type: "object",
        properties: replicatedDocumentsSchema.properties
      },
      isResolvedConflict: {
        type: "string"
      }
    },
    keyCompression: replicatedDocumentsSchema.keyCompression,
    required: ["id", "isCheckpoint", "itemId"]
  };
  if (encrypted) {
    baseSchema.encrypted = ["docData"];
  }
  var metaInstanceSchema = fillWithDefaultSettings(baseSchema);
  return metaInstanceSchema;
}
function getAssumedMasterState(state, docIds) {
  return state.input.metaInstance.findDocumentsById(docIds.map((docId) => {
    var useId = getComposedPrimaryKeyOfDocumentData(state.input.metaInstance.schema, {
      itemId: docId,
      isCheckpoint: "0"
    });
    return useId;
  }), true).then((metaDocs) => {
    var ret = {};
    Object.values(metaDocs).forEach((metaDoc) => {
      ret[metaDoc.itemId] = {
        docData: metaDoc.docData,
        metaDocument: metaDoc
      };
    });
    return ret;
  });
}
async function getMetaWriteRow(state, newMasterDocState, previous, isResolvedConflict) {
  var docId = newMasterDocState[state.primaryPath];
  var newMeta = previous ? flatCloneDocWithMeta(previous) : {
    id: "",
    isCheckpoint: "0",
    itemId: docId,
    docData: newMasterDocState,
    _attachments: {},
    _deleted: false,
    _rev: getDefaultRevision(),
    _meta: {
      lwt: 0
    }
  };
  newMeta.docData = newMasterDocState;
  if (isResolvedConflict) {
    newMeta.isResolvedConflict = isResolvedConflict;
  }
  newMeta._meta.lwt = now$1();
  newMeta.id = getComposedPrimaryKeyOfDocumentData(state.input.metaInstance.schema, newMeta);
  newMeta._rev = createRevision(await state.checkpointKey, previous);
  var ret = {
    previous,
    document: newMeta
  };
  return ret;
}
async function startReplicationDownstream(state) {
  if (state.input.initialCheckpoint && state.input.initialCheckpoint.downstream) {
    var checkpointDoc = await getLastCheckpointDoc(state, "down");
    if (!checkpointDoc) {
      await setCheckpoint(state, "down", state.input.initialCheckpoint.downstream);
    }
  }
  var identifierHash = await state.input.hashFunction(state.input.identifier);
  var replicationHandler = state.input.replicationHandler;
  var timer = 0;
  var openTasks = [];
  function addNewTask(task) {
    state.stats.down.addNewTask = state.stats.down.addNewTask + 1;
    var taskWithTime = {
      time: timer++,
      task
    };
    openTasks.push(taskWithTime);
    state.streamQueue.down = state.streamQueue.down.then(() => {
      var useTasks = [];
      while (openTasks.length > 0) {
        state.events.active.down.next(true);
        var innerTaskWithTime = ensureNotFalsy(openTasks.shift());
        if (innerTaskWithTime.time < lastTimeMasterChangesRequested) {
          continue;
        }
        if (innerTaskWithTime.task === "RESYNC") {
          if (useTasks.length === 0) {
            useTasks.push(innerTaskWithTime.task);
            break;
          } else {
            break;
          }
        }
        useTasks.push(innerTaskWithTime.task);
      }
      if (useTasks.length === 0) {
        return;
      }
      if (useTasks[0] === "RESYNC") {
        return downstreamResyncOnce();
      } else {
        return downstreamProcessChanges(useTasks);
      }
    }).then(() => {
      state.events.active.down.next(false);
      if (!state.firstSyncDone.down.getValue() && !state.events.canceled.getValue()) {
        state.firstSyncDone.down.next(true);
      }
    });
  }
  addNewTask("RESYNC");
  if (!state.events.canceled.getValue()) {
    var sub = replicationHandler.masterChangeStream$.pipe(mergeMap(async (ev) => {
      await firstValueFrom(state.events.active.up.pipe(filter((s) => !s)));
      return ev;
    })).subscribe((task) => {
      state.stats.down.masterChangeStreamEmit = state.stats.down.masterChangeStreamEmit + 1;
      addNewTask(task);
    });
    firstValueFrom(state.events.canceled.pipe(filter((canceled) => !!canceled))).then(() => sub.unsubscribe());
  }
  var lastTimeMasterChangesRequested = -1;
  async function downstreamResyncOnce() {
    state.stats.down.downstreamResyncOnce = state.stats.down.downstreamResyncOnce + 1;
    if (state.events.canceled.getValue()) {
      return;
    }
    state.checkpointQueue = state.checkpointQueue.then(() => getLastCheckpointDoc(state, "down"));
    var lastCheckpoint = await state.checkpointQueue;
    var promises = [];
    while (!state.events.canceled.getValue()) {
      lastTimeMasterChangesRequested = timer++;
      var downResult = await replicationHandler.masterChangesSince(lastCheckpoint, state.input.pullBatchSize);
      if (downResult.documents.length === 0) {
        break;
      }
      lastCheckpoint = stackCheckpoints([lastCheckpoint, downResult.checkpoint]);
      promises.push(persistFromMaster(downResult.documents, lastCheckpoint));
      if (downResult.documents.length < state.input.pullBatchSize) {
        break;
      }
    }
    await Promise.all(promises);
  }
  function downstreamProcessChanges(tasks) {
    state.stats.down.downstreamProcessChanges = state.stats.down.downstreamProcessChanges + 1;
    var docsOfAllTasks = [];
    var lastCheckpoint = null;
    tasks.forEach((task) => {
      if (task === "RESYNC") {
        throw new Error("SNH");
      }
      appendToArray(docsOfAllTasks, task.documents);
      lastCheckpoint = stackCheckpoints([lastCheckpoint, task.checkpoint]);
    });
    return persistFromMaster(docsOfAllTasks, ensureNotFalsy(lastCheckpoint));
  }
  var persistenceQueue = PROMISE_RESOLVE_VOID;
  var nonPersistedFromMaster = {
    docs: {}
  };
  function persistFromMaster(docs, checkpoint) {
    var primaryPath = state.primaryPath;
    state.stats.down.persistFromMaster = state.stats.down.persistFromMaster + 1;
    docs.forEach((docData) => {
      var docId = docData[primaryPath];
      nonPersistedFromMaster.docs[docId] = docData;
    });
    nonPersistedFromMaster.checkpoint = checkpoint;
    persistenceQueue = persistenceQueue.then(() => {
      var downDocsById = nonPersistedFromMaster.docs;
      nonPersistedFromMaster.docs = {};
      var useCheckpoint = nonPersistedFromMaster.checkpoint;
      var docIds = Object.keys(downDocsById);
      if (state.events.canceled.getValue() || docIds.length === 0) {
        return PROMISE_RESOLVE_VOID;
      }
      var writeRowsToFork = [];
      var writeRowsToForkById = {};
      var writeRowsToMeta = {};
      var useMetaWriteRows = [];
      return Promise.all([state.input.forkInstance.findDocumentsById(docIds, true), getAssumedMasterState(state, docIds)]).then(([currentForkStateList, assumedMasterState]) => {
        var currentForkState = /* @__PURE__ */ new Map();
        currentForkStateList.forEach((doc) => currentForkState.set(doc[primaryPath], doc));
        return Promise.all(docIds.map(async (docId) => {
          var forkStateFullDoc = currentForkState.get(docId);
          var forkStateDocData = forkStateFullDoc ? writeDocToDocState(forkStateFullDoc, state.hasAttachments, false) : void 0;
          var masterState = downDocsById[docId];
          var assumedMaster = assumedMasterState[docId];
          if (assumedMaster && forkStateFullDoc && assumedMaster.metaDocument.isResolvedConflict === forkStateFullDoc._rev) {
            await state.streamQueue.up;
          }
          var isAssumedMasterEqualToForkState = !assumedMaster || !forkStateDocData ? false : state.input.conflictHandler.isEqual(assumedMaster.docData, forkStateDocData, "downstream-check-if-equal-0");
          if (!isAssumedMasterEqualToForkState && assumedMaster && assumedMaster.docData._rev && forkStateFullDoc && forkStateFullDoc._meta[state.input.identifier] && getHeightOfRevision(forkStateFullDoc._rev) === forkStateFullDoc._meta[state.input.identifier]) {
            isAssumedMasterEqualToForkState = true;
          }
          if (forkStateFullDoc && assumedMaster && isAssumedMasterEqualToForkState === false || forkStateFullDoc && !assumedMaster) {
            return PROMISE_RESOLVE_VOID;
          }
          var areStatesExactlyEqual = !forkStateDocData ? false : state.input.conflictHandler.isEqual(masterState, forkStateDocData, "downstream-check-if-equal-1");
          if (forkStateDocData && areStatesExactlyEqual) {
            if (!assumedMaster || isAssumedMasterEqualToForkState === false) {
              useMetaWriteRows.push(await getMetaWriteRow(state, forkStateDocData, assumedMaster ? assumedMaster.metaDocument : void 0));
            }
            return PROMISE_RESOLVE_VOID;
          }
          var newForkState = Object.assign({}, masterState, forkStateFullDoc ? {
            _meta: flatClone(forkStateFullDoc._meta),
            _attachments: state.hasAttachments && masterState._attachments ? masterState._attachments : {},
            _rev: getDefaultRevision()
          } : {
            _meta: {
              lwt: now$1()
            },
            _rev: getDefaultRevision(),
            _attachments: state.hasAttachments && masterState._attachments ? masterState._attachments : {}
          });
          if (masterState._rev) {
            var nextRevisionHeight = !forkStateFullDoc ? 1 : getHeightOfRevision(forkStateFullDoc._rev) + 1;
            newForkState._meta[state.input.identifier] = nextRevisionHeight;
            if (state.input.keepMeta) {
              newForkState._rev = masterState._rev;
            }
          }
          if (state.input.keepMeta && masterState._meta) {
            newForkState._meta = masterState._meta;
          }
          var forkWriteRow = {
            previous: forkStateFullDoc,
            document: newForkState
          };
          forkWriteRow.document._rev = forkWriteRow.document._rev ? forkWriteRow.document._rev : createRevision(identifierHash, forkWriteRow.previous);
          writeRowsToFork.push(forkWriteRow);
          writeRowsToForkById[docId] = forkWriteRow;
          writeRowsToMeta[docId] = await getMetaWriteRow(state, masterState, assumedMaster ? assumedMaster.metaDocument : void 0);
        }));
      }).then(async () => {
        if (writeRowsToFork.length > 0) {
          return state.input.forkInstance.bulkWrite(writeRowsToFork, await state.downstreamBulkWriteFlag).then((forkWriteResult) => {
            var success = getWrittenDocumentsFromBulkWriteResponse(state.primaryPath, writeRowsToFork, forkWriteResult);
            success.forEach((doc) => {
              var docId = doc[primaryPath];
              state.events.processed.down.next(writeRowsToForkById[docId]);
              useMetaWriteRows.push(writeRowsToMeta[docId]);
            });
            var mustThrow;
            forkWriteResult.error.forEach((error) => {
              if (error.status === 409) {
                return;
              }
              var throwMe = newRxError("RC_PULL", {
                writeError: error
              });
              state.events.error.next(throwMe);
              mustThrow = throwMe;
            });
            if (mustThrow) {
              throw mustThrow;
            }
          });
        }
      }).then(() => {
        if (useMetaWriteRows.length > 0) {
          return state.input.metaInstance.bulkWrite(stripAttachmentsDataFromMetaWriteRows(state, useMetaWriteRows), "replication-down-write-meta").then((metaWriteResult) => {
            metaWriteResult.error.forEach((writeError) => {
              state.events.error.next(newRxError("RC_PULL", {
                id: writeError.documentId,
                writeError
              }));
            });
          });
        }
      }).then(() => {
        setCheckpoint(state, "down", useCheckpoint);
      });
    }).catch((unhandledError) => state.events.error.next(unhandledError));
    return persistenceQueue;
  }
}
async function resolveConflictError(state, input, forkState) {
  var conflictHandler = state.input.conflictHandler;
  var isEqual2 = conflictHandler.isEqual(input.realMasterState, input.newDocumentState, "replication-resolve-conflict");
  if (isEqual2) {
    return void 0;
  } else {
    var resolved = await conflictHandler.resolve(input, "replication-resolve-conflict");
    var resolvedDoc = Object.assign({}, resolved, {
      /**
       * Because the resolved conflict is written to the fork,
       * we have to keep/update the forks _meta data, not the masters.
       */
      _meta: flatClone(forkState._meta),
      _rev: getDefaultRevision(),
      _attachments: flatClone(forkState._attachments)
    });
    resolvedDoc._meta.lwt = now$1();
    resolvedDoc._rev = createRevision(await state.checkpointKey, forkState);
    return resolvedDoc;
  }
}
async function fillWriteDataForAttachmentsChange(primaryPath, storageInstance, newDocument, originalDocument) {
  if (!newDocument._attachments || originalDocument && !originalDocument._attachments) {
    throw new Error("_attachments missing");
  }
  var docId = newDocument[primaryPath];
  var originalAttachmentsIds = new Set(originalDocument && originalDocument._attachments ? Object.keys(originalDocument._attachments) : []);
  await Promise.all(Object.entries(newDocument._attachments).map(async ([key, value]) => {
    if ((!originalAttachmentsIds.has(key) || originalDocument && ensureNotFalsy(originalDocument._attachments)[key].digest !== value.digest) && !value.data) {
      var attachmentDataString = await storageInstance.getAttachmentData(docId, key, value.digest);
      value.data = attachmentDataString;
    }
  }));
  return newDocument;
}
async function startReplicationUpstream(state) {
  if (state.input.initialCheckpoint && state.input.initialCheckpoint.upstream) {
    var checkpointDoc = await getLastCheckpointDoc(state, "up");
    if (!checkpointDoc) {
      await setCheckpoint(state, "up", state.input.initialCheckpoint.upstream);
    }
  }
  var replicationHandler = state.input.replicationHandler;
  state.streamQueue.up = state.streamQueue.up.then(() => {
    return upstreamInitialSync().then(() => {
      return processTasks();
    });
  });
  var timer = 0;
  var initialSyncStartTime = -1;
  var openTasks = [];
  var persistenceQueue = PROMISE_RESOLVE_FALSE;
  var nonPersistedFromMaster = {
    docs: {}
  };
  var sub = state.input.forkInstance.changeStream().subscribe((eventBulk) => {
    if (state.events.paused.getValue()) {
      return;
    }
    state.stats.up.forkChangeStreamEmit = state.stats.up.forkChangeStreamEmit + 1;
    openTasks.push({
      task: eventBulk,
      time: timer++
    });
    if (!state.events.active.up.getValue()) {
      state.events.active.up.next(true);
    }
    if (state.input.waitBeforePersist) {
      return state.input.waitBeforePersist().then(() => processTasks());
    } else {
      return processTasks();
    }
  });
  var subResync = replicationHandler.masterChangeStream$.pipe(filter((ev) => ev === "RESYNC")).subscribe(() => {
    openTasks.push({
      task: "RESYNC",
      time: timer++
    });
    processTasks();
  });
  firstValueFrom(state.events.canceled.pipe(filter((canceled) => !!canceled))).then(() => {
    sub.unsubscribe();
    subResync.unsubscribe();
  });
  async function upstreamInitialSync() {
    state.stats.up.upstreamInitialSync = state.stats.up.upstreamInitialSync + 1;
    if (state.events.canceled.getValue()) {
      return;
    }
    state.checkpointQueue = state.checkpointQueue.then(() => getLastCheckpointDoc(state, "up"));
    var lastCheckpoint = await state.checkpointQueue;
    var promises = /* @__PURE__ */ new Set();
    var _loop = async function() {
      initialSyncStartTime = timer++;
      if (promises.size > 3) {
        await Promise.race(Array.from(promises));
      }
      var upResult = await getChangedDocumentsSince(state.input.forkInstance, state.input.pushBatchSize, lastCheckpoint);
      if (upResult.documents.length === 0) {
        return 1;
      }
      lastCheckpoint = stackCheckpoints([lastCheckpoint, upResult.checkpoint]);
      var promise = persistToMaster(upResult.documents, ensureNotFalsy(lastCheckpoint));
      promises.add(promise);
      promise.catch().then(() => promises.delete(promise));
    };
    while (!state.events.canceled.getValue()) {
      if (await _loop()) break;
    }
    var resolvedPromises = await Promise.all(promises);
    var hadConflicts = resolvedPromises.find((r) => !!r);
    if (hadConflicts) {
      await upstreamInitialSync();
    } else if (!state.firstSyncDone.up.getValue() && !state.events.canceled.getValue()) {
      state.firstSyncDone.up.next(true);
    }
  }
  function processTasks() {
    if (state.events.canceled.getValue() || openTasks.length === 0) {
      state.events.active.up.next(false);
      return;
    }
    state.stats.up.processTasks = state.stats.up.processTasks + 1;
    state.events.active.up.next(true);
    state.streamQueue.up = state.streamQueue.up.then(async () => {
      var docs = [];
      var checkpoint = {};
      while (openTasks.length > 0) {
        var taskWithTime = ensureNotFalsy(openTasks.shift());
        if (taskWithTime.time < initialSyncStartTime) {
          continue;
        }
        if (taskWithTime.task === "RESYNC") {
          state.events.active.up.next(false);
          await upstreamInitialSync();
          return;
        }
        if (taskWithTime.task.context !== await state.downstreamBulkWriteFlag) {
          appendToArray(docs, taskWithTime.task.events.map((r) => {
            return r.documentData;
          }));
        }
        checkpoint = stackCheckpoints([checkpoint, taskWithTime.task.checkpoint]);
      }
      await persistToMaster(docs, checkpoint);
      if (openTasks.length === 0) {
        state.events.active.up.next(false);
      } else {
        return processTasks();
      }
    });
  }
  function persistToMaster(docs, checkpoint) {
    state.stats.up.persistToMaster = state.stats.up.persistToMaster + 1;
    docs.forEach((docData) => {
      var docId = docData[state.primaryPath];
      nonPersistedFromMaster.docs[docId] = docData;
    });
    nonPersistedFromMaster.checkpoint = checkpoint;
    persistenceQueue = persistenceQueue.then(async () => {
      if (state.events.canceled.getValue()) {
        return false;
      }
      var upDocsById = nonPersistedFromMaster.docs;
      nonPersistedFromMaster.docs = {};
      var useCheckpoint = nonPersistedFromMaster.checkpoint;
      var docIds = Object.keys(upDocsById);
      function rememberCheckpointBeforeReturn() {
        return setCheckpoint(state, "up", useCheckpoint);
      }
      if (docIds.length === 0) {
        rememberCheckpointBeforeReturn();
        return false;
      }
      var assumedMasterState = await getAssumedMasterState(state, docIds);
      var writeRowsToMaster = {};
      var writeRowsToMasterIds = [];
      var writeRowsToMeta = {};
      var forkStateById = {};
      await Promise.all(docIds.map(async (docId) => {
        var fullDocData = upDocsById[docId];
        forkStateById[docId] = fullDocData;
        var docData = writeDocToDocState(fullDocData, state.hasAttachments, !!state.input.keepMeta);
        var assumedMasterDoc = assumedMasterState[docId];
        if (assumedMasterDoc && // if the isResolvedConflict is correct, we do not have to compare the documents.
        assumedMasterDoc.metaDocument.isResolvedConflict !== fullDocData._rev && state.input.conflictHandler.isEqual(assumedMasterDoc.docData, docData, "upstream-check-if-equal") || /**
         * If the master works with _rev fields,
         * we use that to check if our current doc state
         * is different from the assumedMasterDoc.
         */
        assumedMasterDoc && assumedMasterDoc.docData._rev && getHeightOfRevision(fullDocData._rev) === fullDocData._meta[state.input.identifier]) {
          return;
        }
        writeRowsToMasterIds.push(docId);
        writeRowsToMaster[docId] = {
          assumedMasterState: assumedMasterDoc ? assumedMasterDoc.docData : void 0,
          newDocumentState: docData
        };
        writeRowsToMeta[docId] = await getMetaWriteRow(state, docData, assumedMasterDoc ? assumedMasterDoc.metaDocument : void 0);
      }));
      if (writeRowsToMasterIds.length === 0) {
        rememberCheckpointBeforeReturn();
        return false;
      }
      var writeRowsArray = Object.values(writeRowsToMaster);
      var conflictIds = /* @__PURE__ */ new Set();
      var conflictsById = {};
      var writeBatches = batchArray(writeRowsArray, state.input.pushBatchSize);
      await Promise.all(writeBatches.map(async (writeBatch) => {
        if (state.hasAttachments) {
          await Promise.all(writeBatch.map(async (row) => {
            row.newDocumentState = await fillWriteDataForAttachmentsChange(state.primaryPath, state.input.forkInstance, clone$1(row.newDocumentState), row.assumedMasterState);
          }));
        }
        var masterWriteResult = await replicationHandler.masterWrite(writeBatch);
        masterWriteResult.forEach((conflictDoc) => {
          var id = conflictDoc[state.primaryPath];
          conflictIds.add(id);
          conflictsById[id] = conflictDoc;
        });
      }));
      var useWriteRowsToMeta = [];
      writeRowsToMasterIds.forEach((docId) => {
        if (!conflictIds.has(docId)) {
          state.events.processed.up.next(writeRowsToMaster[docId]);
          useWriteRowsToMeta.push(writeRowsToMeta[docId]);
        }
      });
      if (state.events.canceled.getValue()) {
        return false;
      }
      if (useWriteRowsToMeta.length > 0) {
        await state.input.metaInstance.bulkWrite(stripAttachmentsDataFromMetaWriteRows(state, useWriteRowsToMeta), "replication-up-write-meta");
      }
      var hadConflictWrites = false;
      if (conflictIds.size > 0) {
        state.stats.up.persistToMasterHadConflicts = state.stats.up.persistToMasterHadConflicts + 1;
        var conflictWriteFork = [];
        var conflictWriteMeta = {};
        await Promise.all(Object.entries(conflictsById).map(([docId, realMasterState]) => {
          var writeToMasterRow = writeRowsToMaster[docId];
          var input = {
            newDocumentState: writeToMasterRow.newDocumentState,
            assumedMasterState: writeToMasterRow.assumedMasterState,
            realMasterState
          };
          return resolveConflictError(state, input, forkStateById[docId]).then(async (resolved) => {
            if (resolved) {
              state.events.resolvedConflicts.next({
                input,
                output: resolved
              });
              conflictWriteFork.push({
                previous: forkStateById[docId],
                document: resolved
              });
              var assumedMasterDoc = assumedMasterState[docId];
              conflictWriteMeta[docId] = await getMetaWriteRow(state, ensureNotFalsy(realMasterState), assumedMasterDoc ? assumedMasterDoc.metaDocument : void 0, resolved._rev);
            }
          });
        }));
        if (conflictWriteFork.length > 0) {
          hadConflictWrites = true;
          state.stats.up.persistToMasterConflictWrites = state.stats.up.persistToMasterConflictWrites + 1;
          var forkWriteResult = await state.input.forkInstance.bulkWrite(conflictWriteFork, "replication-up-write-conflict");
          var mustThrow;
          forkWriteResult.error.forEach((error) => {
            if (error.status === 409) {
              return;
            }
            var throwMe = newRxError("RC_PUSH", {
              writeError: error
            });
            state.events.error.next(throwMe);
            mustThrow = throwMe;
          });
          if (mustThrow) {
            throw mustThrow;
          }
          var useMetaWrites = [];
          var success = getWrittenDocumentsFromBulkWriteResponse(state.primaryPath, conflictWriteFork, forkWriteResult);
          success.forEach((docData) => {
            var docId = docData[state.primaryPath];
            useMetaWrites.push(conflictWriteMeta[docId]);
          });
          if (useMetaWrites.length > 0) {
            await state.input.metaInstance.bulkWrite(stripAttachmentsDataFromMetaWriteRows(state, useMetaWrites), "replication-up-write-conflict-meta");
          }
        }
      }
      rememberCheckpointBeforeReturn();
      return hadConflictWrites;
    }).catch((unhandledError) => {
      state.events.error.next(unhandledError);
      return false;
    });
    return persistenceQueue;
  }
}
function replicateRxStorageInstance(input) {
  input = flatClone(input);
  input.forkInstance = getUnderlyingPersistentStorage(input.forkInstance);
  input.metaInstance = getUnderlyingPersistentStorage(input.metaInstance);
  var checkpointKeyPromise = getCheckpointKey(input);
  var state = {
    primaryPath: getPrimaryFieldOfPrimaryKey(input.forkInstance.schema.primaryKey),
    hasAttachments: !!input.forkInstance.schema.attachments,
    input,
    checkpointKey: checkpointKeyPromise,
    downstreamBulkWriteFlag: checkpointKeyPromise.then((checkpointKey) => "replication-downstream-" + checkpointKey),
    events: {
      canceled: new BehaviorSubject(false),
      paused: new BehaviorSubject(false),
      active: {
        down: new BehaviorSubject(true),
        up: new BehaviorSubject(true)
      },
      processed: {
        down: new Subject(),
        up: new Subject()
      },
      resolvedConflicts: new Subject(),
      error: new Subject()
    },
    stats: {
      down: {
        addNewTask: 0,
        downstreamProcessChanges: 0,
        downstreamResyncOnce: 0,
        masterChangeStreamEmit: 0,
        persistFromMaster: 0
      },
      up: {
        forkChangeStreamEmit: 0,
        persistToMaster: 0,
        persistToMasterConflictWrites: 0,
        persistToMasterHadConflicts: 0,
        processTasks: 0,
        upstreamInitialSync: 0
      }
    },
    firstSyncDone: {
      down: new BehaviorSubject(false),
      up: new BehaviorSubject(false)
    },
    streamQueue: {
      down: PROMISE_RESOLVE_VOID,
      up: PROMISE_RESOLVE_VOID
    },
    checkpointQueue: PROMISE_RESOLVE_VOID,
    lastCheckpointDoc: {}
  };
  startReplicationDownstream(state);
  startReplicationUpstream(state);
  return state;
}
function awaitRxStorageReplicationFirstInSync(state) {
  return firstValueFrom(combineLatest([state.firstSyncDone.down.pipe(filter((v) => !!v)), state.firstSyncDone.up.pipe(filter((v) => !!v))])).then(() => {
  });
}
function awaitRxStorageReplicationInSync(replicationState) {
  return Promise.all([replicationState.streamQueue.up, replicationState.streamQueue.down, replicationState.checkpointQueue]);
}
function rxStorageInstanceToReplicationHandler(instance, conflictHandler, databaseInstanceToken, keepMeta = false) {
  instance = getUnderlyingPersistentStorage(instance);
  var hasAttachments = !!instance.schema.attachments;
  var primaryPath = getPrimaryFieldOfPrimaryKey(instance.schema.primaryKey);
  var replicationHandler = {
    masterChangeStream$: instance.changeStream().pipe(mergeMap(async (eventBulk) => {
      var ret = {
        checkpoint: eventBulk.checkpoint,
        documents: await Promise.all(eventBulk.events.map(async (event) => {
          var docData = writeDocToDocState(event.documentData, hasAttachments, keepMeta);
          if (hasAttachments) {
            docData = await fillWriteDataForAttachmentsChange(
              primaryPath,
              instance,
              clone$1(docData),
              /**
               * Notice that the master never knows
               * the client state of the document.
               * Therefore we always send all attachments data.
               */
              void 0
            );
          }
          return docData;
        }))
      };
      return ret;
    })),
    masterChangesSince(checkpoint, batchSize) {
      return getChangedDocumentsSince(instance, batchSize, checkpoint).then(async (result) => {
        return {
          checkpoint: result.documents.length > 0 ? result.checkpoint : checkpoint,
          documents: await Promise.all(result.documents.map(async (plainDocumentData) => {
            var docData = writeDocToDocState(plainDocumentData, hasAttachments, keepMeta);
            if (hasAttachments) {
              docData = await fillWriteDataForAttachmentsChange(
                primaryPath,
                instance,
                clone$1(docData),
                /**
                 * Notice the the master never knows
                 * the client state of the document.
                 * Therefore we always send all attachments data.
                 */
                void 0
              );
            }
            return docData;
          }))
        };
      });
    },
    async masterWrite(rows) {
      var rowById = {};
      rows.forEach((row) => {
        var docId = row.newDocumentState[primaryPath];
        rowById[docId] = row;
      });
      var ids = Object.keys(rowById);
      var masterDocsStateList = await instance.findDocumentsById(ids, true);
      var masterDocsState = /* @__PURE__ */ new Map();
      masterDocsStateList.forEach((doc) => masterDocsState.set(doc[primaryPath], doc));
      var conflicts = [];
      var writeRows = [];
      await Promise.all(Object.entries(rowById).map(([id, row]) => {
        var masterState = masterDocsState.get(id);
        if (!masterState) {
          writeRows.push({
            document: docStateToWriteDoc(databaseInstanceToken, hasAttachments, keepMeta, row.newDocumentState)
          });
        } else if (masterState && !row.assumedMasterState) {
          conflicts.push(writeDocToDocState(masterState, hasAttachments, keepMeta));
        } else if (conflictHandler.isEqual(writeDocToDocState(masterState, hasAttachments, keepMeta), ensureNotFalsy(row.assumedMasterState), "rxStorageInstanceToReplicationHandler-masterWrite") === true) {
          writeRows.push({
            previous: masterState,
            document: docStateToWriteDoc(databaseInstanceToken, hasAttachments, keepMeta, row.newDocumentState, masterState)
          });
        } else {
          conflicts.push(writeDocToDocState(masterState, hasAttachments, keepMeta));
        }
      }));
      if (writeRows.length > 0) {
        var result = await instance.bulkWrite(writeRows, "replication-master-write");
        result.error.forEach((err) => {
          if (err.status !== 409) {
            throw newRxError("SNH", {
              name: "non conflict error",
              error: err
            });
          } else {
            conflicts.push(writeDocToDocState(ensureNotFalsy(err.documentInDb), hasAttachments, keepMeta));
          }
        });
      }
      return conflicts;
    }
  };
  return replicationHandler;
}
async function cancelRxStorageReplication(replicationState) {
  replicationState.events.canceled.next(true);
  replicationState.events.active.up.complete();
  replicationState.events.active.down.complete();
  replicationState.events.processed.up.complete();
  replicationState.events.processed.down.complete();
  replicationState.events.resolvedConflicts.complete();
  replicationState.events.canceled.complete();
  await replicationState.checkpointQueue;
}
function isPromise(obj) {
  return obj && typeof obj.then === "function";
}
Promise.resolve(false);
var PROMISE_RESOLVED_TRUE = Promise.resolve(true);
var PROMISE_RESOLVED_VOID = Promise.resolve();
function sleep(time, resolveWith) {
  if (!time) time = 0;
  return new Promise(function(res) {
    return setTimeout(function() {
      return res(resolveWith);
    }, time);
  });
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function randomToken() {
  return Math.random().toString(36).substring(2);
}
var lastMs = 0;
function microSeconds$4() {
  var ret = Date.now() * 1e3;
  if (ret <= lastMs) {
    ret = lastMs + 1;
  }
  lastMs = ret;
  return ret;
}
function supportsWebLockAPI() {
  if (typeof navigator !== "undefined" && typeof navigator.locks !== "undefined" && typeof navigator.locks.request === "function") {
    return true;
  } else {
    return false;
  }
}
var microSeconds$3 = microSeconds$4;
var type$3 = "native";
function create$3(channelName) {
  var state = {
    time: microSeconds$4(),
    messagesCallback: null,
    bc: new BroadcastChannel(channelName),
    subFns: []
    // subscriberFunctions
  };
  state.bc.onmessage = function(msgEvent) {
    if (state.messagesCallback) {
      state.messagesCallback(msgEvent.data);
    }
  };
  return state;
}
function close$3(channelState) {
  channelState.bc.close();
  channelState.subFns = [];
}
function postMessage$3(channelState, messageJson) {
  try {
    channelState.bc.postMessage(messageJson, false);
    return PROMISE_RESOLVED_VOID;
  } catch (err) {
    return Promise.reject(err);
  }
}
function onMessage$3(channelState, fn) {
  channelState.messagesCallback = fn;
}
function canBeUsed$3() {
  if (typeof globalThis !== "undefined" && globalThis.Deno && globalThis.Deno.args) {
    return true;
  }
  if ((typeof window !== "undefined" || typeof self !== "undefined") && typeof BroadcastChannel === "function") {
    if (BroadcastChannel._pubkey) {
      throw new Error("BroadcastChannel: Do not overwrite window.BroadcastChannel with this module, this is not a polyfill");
    }
    return true;
  } else {
    return false;
  }
}
function averageResponseTime$3() {
  return 150;
}
var NativeMethod = {
  create: create$3,
  close: close$3,
  onMessage: onMessage$3,
  postMessage: postMessage$3,
  canBeUsed: canBeUsed$3,
  type: type$3,
  averageResponseTime: averageResponseTime$3,
  microSeconds: microSeconds$3
};
function fillOptionsWithDefaults$1() {
  var originalOptions = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  var options = JSON.parse(JSON.stringify(originalOptions));
  if (typeof options.webWorkerSupport === "undefined") options.webWorkerSupport = true;
  if (!options.idb) options.idb = {};
  if (!options.idb.ttl) options.idb.ttl = 1e3 * 45;
  if (!options.idb.fallbackInterval) options.idb.fallbackInterval = 150;
  if (originalOptions.idb && typeof originalOptions.idb.onclose === "function") options.idb.onclose = originalOptions.idb.onclose;
  if (!options.localstorage) options.localstorage = {};
  if (!options.localstorage.removeTimeout) options.localstorage.removeTimeout = 1e3 * 60;
  if (originalOptions.methods) options.methods = originalOptions.methods;
  if (!options.node) options.node = {};
  if (!options.node.ttl) options.node.ttl = 1e3 * 60 * 2;
  if (!options.node.maxParallelWrites) options.node.maxParallelWrites = 2048;
  if (typeof options.node.useFastPath === "undefined") options.node.useFastPath = true;
  return options;
}
var microSeconds$2 = microSeconds$4;
var DB_PREFIX = "pubkey.broadcast-channel-0-";
var OBJECT_STORE_ID = "messages";
var TRANSACTION_SETTINGS = {
  durability: "relaxed"
};
var type$2 = "idb";
function getIdb() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  if (typeof window !== "undefined") {
    if (typeof window.mozIndexedDB !== "undefined") return window.mozIndexedDB;
    if (typeof window.webkitIndexedDB !== "undefined") return window.webkitIndexedDB;
    if (typeof window.msIndexedDB !== "undefined") return window.msIndexedDB;
  }
  return false;
}
function commitIndexedDBTransaction(tx) {
  if (tx.commit) {
    tx.commit();
  }
}
function createDatabase(channelName) {
  var IndexedDB = getIdb();
  var dbName = DB_PREFIX + channelName;
  var openRequest = IndexedDB.open(dbName);
  openRequest.onupgradeneeded = function(ev) {
    var db2 = ev.target.result;
    db2.createObjectStore(OBJECT_STORE_ID, {
      keyPath: "id",
      autoIncrement: true
    });
  };
  return new Promise(function(res, rej) {
    openRequest.onerror = function(ev) {
      return rej(ev);
    };
    openRequest.onsuccess = function() {
      res(openRequest.result);
    };
  });
}
function writeMessage(db2, readerUuid, messageJson) {
  var time = Date.now();
  var writeObject = {
    uuid: readerUuid,
    time,
    data: messageJson
  };
  var tx = db2.transaction([OBJECT_STORE_ID], "readwrite", TRANSACTION_SETTINGS);
  return new Promise(function(res, rej) {
    tx.oncomplete = function() {
      return res();
    };
    tx.onerror = function(ev) {
      return rej(ev);
    };
    var objectStore = tx.objectStore(OBJECT_STORE_ID);
    objectStore.add(writeObject);
    commitIndexedDBTransaction(tx);
  });
}
function getMessagesHigherThan(db2, lastCursorId) {
  var tx = db2.transaction(OBJECT_STORE_ID, "readonly", TRANSACTION_SETTINGS);
  var objectStore = tx.objectStore(OBJECT_STORE_ID);
  var ret = [];
  var keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
  if (objectStore.getAll) {
    var getAllRequest = objectStore.getAll(keyRangeValue);
    return new Promise(function(res, rej) {
      getAllRequest.onerror = function(err) {
        return rej(err);
      };
      getAllRequest.onsuccess = function(e) {
        res(e.target.result);
      };
    });
  }
  function openCursor() {
    try {
      keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
      return objectStore.openCursor(keyRangeValue);
    } catch (e) {
      return objectStore.openCursor();
    }
  }
  return new Promise(function(res, rej) {
    var openCursorRequest = openCursor();
    openCursorRequest.onerror = function(err) {
      return rej(err);
    };
    openCursorRequest.onsuccess = function(ev) {
      var cursor = ev.target.result;
      if (cursor) {
        if (cursor.value.id < lastCursorId + 1) {
          cursor["continue"](lastCursorId + 1);
        } else {
          ret.push(cursor.value);
          cursor["continue"]();
        }
      } else {
        commitIndexedDBTransaction(tx);
        res(ret);
      }
    };
  });
}
function removeMessagesById(channelState, ids) {
  if (channelState.closed) {
    return Promise.resolve([]);
  }
  var tx = channelState.db.transaction(OBJECT_STORE_ID, "readwrite", TRANSACTION_SETTINGS);
  var objectStore = tx.objectStore(OBJECT_STORE_ID);
  return Promise.all(ids.map(function(id) {
    var deleteRequest = objectStore["delete"](id);
    return new Promise(function(res) {
      deleteRequest.onsuccess = function() {
        return res();
      };
    });
  }));
}
function getOldMessages(db2, ttl) {
  var olderThen = Date.now() - ttl;
  var tx = db2.transaction(OBJECT_STORE_ID, "readonly", TRANSACTION_SETTINGS);
  var objectStore = tx.objectStore(OBJECT_STORE_ID);
  var ret = [];
  return new Promise(function(res) {
    objectStore.openCursor().onsuccess = function(ev) {
      var cursor = ev.target.result;
      if (cursor) {
        var msgObk = cursor.value;
        if (msgObk.time < olderThen) {
          ret.push(msgObk);
          cursor["continue"]();
        } else {
          commitIndexedDBTransaction(tx);
          res(ret);
        }
      } else {
        res(ret);
      }
    };
  });
}
function cleanOldMessages(channelState) {
  return getOldMessages(channelState.db, channelState.options.idb.ttl).then(function(tooOld) {
    return removeMessagesById(channelState, tooOld.map(function(msg) {
      return msg.id;
    }));
  });
}
function create$2(channelName, options) {
  options = fillOptionsWithDefaults$1(options);
  return createDatabase(channelName).then(function(db2) {
    var state = {
      closed: false,
      lastCursorId: 0,
      channelName,
      options,
      uuid: randomToken(),
      /**
       * emittedMessagesIds
       * contains all messages that have been emitted before
       * @type {ObliviousSet}
       */
      eMIs: new ObliviousSet(options.idb.ttl * 2),
      // ensures we do not read messages in parallel
      writeBlockPromise: PROMISE_RESOLVED_VOID,
      messagesCallback: null,
      readQueuePromises: [],
      db: db2
    };
    db2.onclose = function() {
      state.closed = true;
      if (options.idb.onclose) options.idb.onclose();
    };
    _readLoop(state);
    return state;
  });
}
function _readLoop(state) {
  if (state.closed) return;
  readNewMessages(state).then(function() {
    return sleep(state.options.idb.fallbackInterval);
  }).then(function() {
    return _readLoop(state);
  });
}
function _filterMessage(msgObj, state) {
  if (msgObj.uuid === state.uuid) return false;
  if (state.eMIs.has(msgObj.id)) return false;
  if (msgObj.data.time < state.messagesCallbackTime) return false;
  return true;
}
function readNewMessages(state) {
  if (state.closed) return PROMISE_RESOLVED_VOID;
  if (!state.messagesCallback) return PROMISE_RESOLVED_VOID;
  return getMessagesHigherThan(state.db, state.lastCursorId).then(function(newerMessages) {
    var useMessages = newerMessages.filter(function(msgObj) {
      return !!msgObj;
    }).map(function(msgObj) {
      if (msgObj.id > state.lastCursorId) {
        state.lastCursorId = msgObj.id;
      }
      return msgObj;
    }).filter(function(msgObj) {
      return _filterMessage(msgObj, state);
    }).sort(function(msgObjA, msgObjB) {
      return msgObjA.time - msgObjB.time;
    });
    useMessages.forEach(function(msgObj) {
      if (state.messagesCallback) {
        state.eMIs.add(msgObj.id);
        state.messagesCallback(msgObj.data);
      }
    });
    return PROMISE_RESOLVED_VOID;
  });
}
function close$2(channelState) {
  channelState.closed = true;
  channelState.db.close();
}
function postMessage$2(channelState, messageJson) {
  channelState.writeBlockPromise = channelState.writeBlockPromise.then(function() {
    return writeMessage(channelState.db, channelState.uuid, messageJson);
  }).then(function() {
    if (randomInt(0, 10) === 0) {
      cleanOldMessages(channelState);
    }
  });
  return channelState.writeBlockPromise;
}
function onMessage$2(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
  readNewMessages(channelState);
}
function canBeUsed$2() {
  return !!getIdb();
}
function averageResponseTime$2(options) {
  return options.idb.fallbackInterval * 2;
}
var IndexedDBMethod = {
  create: create$2,
  close: close$2,
  onMessage: onMessage$2,
  postMessage: postMessage$2,
  canBeUsed: canBeUsed$2,
  type: type$2,
  averageResponseTime: averageResponseTime$2,
  microSeconds: microSeconds$2
};
var microSeconds$1 = microSeconds$4;
var KEY_PREFIX = "pubkey.broadcastChannel-";
var type$1 = "localstorage";
function getLocalStorage() {
  var localStorage2;
  if (typeof window === "undefined") return null;
  try {
    localStorage2 = window.localStorage;
    localStorage2 = window["ie8-eventlistener/storage"] || window.localStorage;
  } catch (e) {
  }
  return localStorage2;
}
function storageKey(channelName) {
  return KEY_PREFIX + channelName;
}
function postMessage$1(channelState, messageJson) {
  return new Promise(function(res) {
    sleep().then(function() {
      var key = storageKey(channelState.channelName);
      var writeObj = {
        token: randomToken(),
        time: Date.now(),
        data: messageJson,
        uuid: channelState.uuid
      };
      var value = JSON.stringify(writeObj);
      getLocalStorage().setItem(key, value);
      var ev = document.createEvent("Event");
      ev.initEvent("storage", true, true);
      ev.key = key;
      ev.newValue = value;
      window.dispatchEvent(ev);
      res();
    });
  });
}
function addStorageEventListener(channelName, fn) {
  var key = storageKey(channelName);
  var listener = function listener2(ev) {
    if (ev.key === key) {
      fn(JSON.parse(ev.newValue));
    }
  };
  window.addEventListener("storage", listener);
  return listener;
}
function removeStorageEventListener(listener) {
  window.removeEventListener("storage", listener);
}
function create$1(channelName, options) {
  options = fillOptionsWithDefaults$1(options);
  if (!canBeUsed$1()) {
    throw new Error("BroadcastChannel: localstorage cannot be used");
  }
  var uuid = randomToken();
  var eMIs = new ObliviousSet(options.localstorage.removeTimeout);
  var state = {
    channelName,
    uuid,
    eMIs
    // emittedMessagesIds
  };
  state.listener = addStorageEventListener(channelName, function(msgObj) {
    if (!state.messagesCallback) return;
    if (msgObj.uuid === uuid) return;
    if (!msgObj.token || eMIs.has(msgObj.token)) return;
    if (msgObj.data.time && msgObj.data.time < state.messagesCallbackTime) return;
    eMIs.add(msgObj.token);
    state.messagesCallback(msgObj.data);
  });
  return state;
}
function close$1(channelState) {
  removeStorageEventListener(channelState.listener);
}
function onMessage$1(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
}
function canBeUsed$1() {
  var ls = getLocalStorage();
  if (!ls) return false;
  try {
    var key = "__broadcastchannel_check";
    ls.setItem(key, "works");
    ls.removeItem(key);
  } catch (e) {
    return false;
  }
  return true;
}
function averageResponseTime$1() {
  var defaultTime = 120;
  var userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    return defaultTime * 2;
  }
  return defaultTime;
}
var LocalstorageMethod = {
  create: create$1,
  close: close$1,
  onMessage: onMessage$1,
  postMessage: postMessage$1,
  canBeUsed: canBeUsed$1,
  type: type$1,
  averageResponseTime: averageResponseTime$1,
  microSeconds: microSeconds$1
};
var microSeconds = microSeconds$4;
var type = "simulate";
var SIMULATE_CHANNELS = /* @__PURE__ */ new Set();
function create(channelName) {
  var state = {
    time: microSeconds(),
    name: channelName,
    messagesCallback: null
  };
  SIMULATE_CHANNELS.add(state);
  return state;
}
function close(channelState) {
  SIMULATE_CHANNELS["delete"](channelState);
}
var SIMULATE_DELAY_TIME = 5;
function postMessage(channelState, messageJson) {
  return new Promise(function(res) {
    return setTimeout(function() {
      var channelArray = Array.from(SIMULATE_CHANNELS);
      channelArray.forEach(function(channel) {
        if (channel.name === channelState.name && // has same name
        channel !== channelState && // not own channel
        !!channel.messagesCallback && // has subscribers
        channel.time < messageJson.time) {
          channel.messagesCallback(messageJson);
        }
      });
      res();
    }, SIMULATE_DELAY_TIME);
  });
}
function onMessage(channelState, fn) {
  channelState.messagesCallback = fn;
}
function canBeUsed() {
  return true;
}
function averageResponseTime() {
  return SIMULATE_DELAY_TIME;
}
var SimulateMethod = {
  create,
  close,
  onMessage,
  postMessage,
  canBeUsed,
  type,
  averageResponseTime,
  microSeconds
};
var METHODS = [
  NativeMethod,
  // fastest
  IndexedDBMethod,
  LocalstorageMethod
];
function chooseMethod(options) {
  var chooseMethods = [].concat(options.methods, METHODS).filter(Boolean);
  if (options.type) {
    if (options.type === "simulate") {
      return SimulateMethod;
    }
    var ret = chooseMethods.find(function(m) {
      return m.type === options.type;
    });
    if (!ret) throw new Error("method-type " + options.type + " not found");
    else return ret;
  }
  if (!options.webWorkerSupport) {
    chooseMethods = chooseMethods.filter(function(m) {
      return m.type !== "idb";
    });
  }
  var useMethod = chooseMethods.find(function(method) {
    return method.canBeUsed();
  });
  if (!useMethod) {
    throw new Error("No usable method found in " + JSON.stringify(METHODS.map(function(m) {
      return m.type;
    })));
  } else {
    return useMethod;
  }
}
var OPEN_BROADCAST_CHANNELS = /* @__PURE__ */ new Set();
var lastId = 0;
var BroadcastChannel$1 = function BroadcastChannel2(name, options) {
  this.id = lastId++;
  OPEN_BROADCAST_CHANNELS.add(this);
  this.name = name;
  this.options = fillOptionsWithDefaults$1(options);
  this.method = chooseMethod(this.options);
  this._iL = false;
  this._onML = null;
  this._addEL = {
    message: [],
    internal: []
  };
  this._uMP = /* @__PURE__ */ new Set();
  this._befC = [];
  this._prepP = null;
  _prepareChannel(this);
};
BroadcastChannel$1._pubkey = true;
BroadcastChannel$1.prototype = {
  postMessage: function postMessage2(msg) {
    if (this.closed) {
      throw new Error("BroadcastChannel.postMessage(): Cannot post message after channel has closed " + /**
       * In the past when this error appeared, it was really hard to debug.
       * So now we log the msg together with the error so it at least
       * gives some clue about where in your application this happens.
       */
      JSON.stringify(msg));
    }
    return _post(this, "message", msg);
  },
  postInternal: function postInternal(msg) {
    return _post(this, "internal", msg);
  },
  set onmessage(fn) {
    var time = this.method.microSeconds();
    var listenObj = {
      time,
      fn
    };
    _removeListenerObject(this, "message", this._onML);
    if (fn && typeof fn === "function") {
      this._onML = listenObj;
      _addListenerObject(this, "message", listenObj);
    } else {
      this._onML = null;
    }
  },
  addEventListener: function addEventListener2(type2, fn) {
    var time = this.method.microSeconds();
    var listenObj = {
      time,
      fn
    };
    _addListenerObject(this, type2, listenObj);
  },
  removeEventListener: function removeEventListener(type2, fn) {
    var obj = this._addEL[type2].find(function(obj2) {
      return obj2.fn === fn;
    });
    _removeListenerObject(this, type2, obj);
  },
  close: function close2() {
    var _this = this;
    if (this.closed) {
      return;
    }
    OPEN_BROADCAST_CHANNELS["delete"](this);
    this.closed = true;
    var awaitPrepare = this._prepP ? this._prepP : PROMISE_RESOLVED_VOID;
    this._onML = null;
    this._addEL.message = [];
    return awaitPrepare.then(function() {
      return Promise.all(Array.from(_this._uMP));
    }).then(function() {
      return Promise.all(_this._befC.map(function(fn) {
        return fn();
      }));
    }).then(function() {
      return _this.method.close(_this._state);
    });
  },
  get type() {
    return this.method.type;
  },
  get isClosed() {
    return this.closed;
  }
};
function _post(broadcastChannel, type2, msg) {
  var time = broadcastChannel.method.microSeconds();
  var msgObj = {
    time,
    type: type2,
    data: msg
  };
  var awaitPrepare = broadcastChannel._prepP ? broadcastChannel._prepP : PROMISE_RESOLVED_VOID;
  return awaitPrepare.then(function() {
    var sendPromise = broadcastChannel.method.postMessage(broadcastChannel._state, msgObj);
    broadcastChannel._uMP.add(sendPromise);
    sendPromise["catch"]().then(function() {
      return broadcastChannel._uMP["delete"](sendPromise);
    });
    return sendPromise;
  });
}
function _prepareChannel(channel) {
  var maybePromise = channel.method.create(channel.name, channel.options);
  if (isPromise(maybePromise)) {
    channel._prepP = maybePromise;
    maybePromise.then(function(s) {
      channel._state = s;
    });
  } else {
    channel._state = maybePromise;
  }
}
function _hasMessageListeners(channel) {
  if (channel._addEL.message.length > 0) return true;
  if (channel._addEL.internal.length > 0) return true;
  return false;
}
function _addListenerObject(channel, type2, obj) {
  channel._addEL[type2].push(obj);
  _startListening(channel);
}
function _removeListenerObject(channel, type2, obj) {
  channel._addEL[type2] = channel._addEL[type2].filter(function(o) {
    return o !== obj;
  });
  _stopListening(channel);
}
function _startListening(channel) {
  if (!channel._iL && _hasMessageListeners(channel)) {
    var listenerFn = function listenerFn2(msgObj) {
      channel._addEL[msgObj.type].forEach(function(listenerObject) {
        if (msgObj.time >= listenerObject.time) {
          listenerObject.fn(msgObj.data);
        }
      });
    };
    var time = channel.method.microSeconds();
    if (channel._prepP) {
      channel._prepP.then(function() {
        channel._iL = true;
        channel.method.onMessage(channel._state, listenerFn, time);
      });
    } else {
      channel._iL = true;
      channel.method.onMessage(channel._state, listenerFn, time);
    }
  }
}
function _stopListening(channel) {
  if (channel._iL && !_hasMessageListeners(channel)) {
    channel._iL = false;
    var time = channel.method.microSeconds();
    channel.method.onMessage(channel._state, null, time);
  }
}
function addBrowser(fn) {
  if (typeof WorkerGlobalScope === "function" && self instanceof WorkerGlobalScope) {
    var oldClose = self.close.bind(self);
    self.close = function() {
      fn();
      return oldClose();
    };
  } else {
    if (typeof window.addEventListener !== "function") {
      return;
    }
    window.addEventListener("beforeunload", function() {
      fn();
    }, true);
    window.addEventListener("unload", function() {
      fn();
    }, true);
  }
}
function addNode(fn) {
  process.on("exit", function() {
    return fn();
  });
  process.on("beforeExit", function() {
    return fn().then(function() {
      return process.exit();
    });
  });
  process.on("SIGINT", function() {
    return fn().then(function() {
      return process.exit();
    });
  });
  process.on("uncaughtException", function(err) {
    return fn().then(function() {
      console.trace(err);
      process.exit(101);
    });
  });
}
var isNode = Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
var USE_METHOD = isNode ? addNode : addBrowser;
var LISTENERS = /* @__PURE__ */ new Set();
var startedListening = false;
function startListening() {
  if (startedListening) {
    return;
  }
  startedListening = true;
  USE_METHOD(runAll);
}
function add$1(fn) {
  startListening();
  if (typeof fn !== "function") {
    throw new Error("Listener is no function");
  }
  LISTENERS.add(fn);
  var addReturn = {
    remove: function remove2() {
      return LISTENERS["delete"](fn);
    },
    run: function run() {
      LISTENERS["delete"](fn);
      return fn();
    }
  };
  return addReturn;
}
function runAll() {
  var promises = [];
  LISTENERS.forEach(function(fn) {
    promises.push(fn());
    LISTENERS["delete"](fn);
  });
  return Promise.all(promises);
}
function sendLeaderMessage(leaderElector, action) {
  var msgJson = {
    context: "leader",
    action,
    token: leaderElector.token
  };
  return leaderElector.broadcastChannel.postInternal(msgJson);
}
function beLeader(leaderElector) {
  leaderElector.isLeader = true;
  leaderElector._hasLeader = true;
  var unloadFn = add$1(function() {
    return leaderElector.die();
  });
  leaderElector._unl.push(unloadFn);
  var isLeaderListener = function isLeaderListener2(msg) {
    if (msg.context === "leader" && msg.action === "apply") {
      sendLeaderMessage(leaderElector, "tell");
    }
    if (msg.context === "leader" && msg.action === "tell" && !leaderElector._dpLC) {
      leaderElector._dpLC = true;
      leaderElector._dpL();
      sendLeaderMessage(leaderElector, "tell");
    }
  };
  leaderElector.broadcastChannel.addEventListener("internal", isLeaderListener);
  leaderElector._lstns.push(isLeaderListener);
  return sendLeaderMessage(leaderElector, "tell");
}
var LeaderElectionWebLock = function LeaderElectionWebLock2(broadcastChannel, options) {
  var _this = this;
  this.broadcastChannel = broadcastChannel;
  broadcastChannel._befC.push(function() {
    return _this.die();
  });
  this._options = options;
  this.isLeader = false;
  this.isDead = false;
  this.token = randomToken();
  this._lstns = [];
  this._unl = [];
  this._dpL = function() {
  };
  this._dpLC = false;
  this._wKMC = {};
  this.lN = "pubkey-bc||" + broadcastChannel.method.type + "||" + broadcastChannel.name;
};
LeaderElectionWebLock.prototype = {
  hasLeader: function hasLeader() {
    var _this2 = this;
    return navigator.locks.query().then(function(locks) {
      var relevantLocks = locks.held ? locks.held.filter(function(lock2) {
        return lock2.name === _this2.lN;
      }) : [];
      if (relevantLocks && relevantLocks.length > 0) {
        return true;
      } else {
        return false;
      }
    });
  },
  awaitLeadership: function awaitLeadership() {
    var _this3 = this;
    if (!this._wLMP) {
      this._wKMC.c = new AbortController();
      var returnPromise = new Promise(function(res, rej) {
        _this3._wKMC.res = res;
        _this3._wKMC.rej = rej;
      });
      this._wLMP = new Promise(function(res) {
        navigator.locks.request(_this3.lN, {
          signal: _this3._wKMC.c.signal
        }, function() {
          _this3._wKMC.c = void 0;
          beLeader(_this3);
          res();
          return returnPromise;
        })["catch"](function() {
        });
      });
    }
    return this._wLMP;
  },
  set onduplicate(_fn) {
  },
  die: function die() {
    var _this4 = this;
    this._lstns.forEach(function(listener) {
      return _this4.broadcastChannel.removeEventListener("internal", listener);
    });
    this._lstns = [];
    this._unl.forEach(function(uFn) {
      return uFn.remove();
    });
    this._unl = [];
    if (this.isLeader) {
      this.isLeader = false;
    }
    this.isDead = true;
    if (this._wKMC.res) {
      this._wKMC.res();
    }
    if (this._wKMC.c) {
      this._wKMC.c.abort("LeaderElectionWebLock.die() called");
    }
    return sendLeaderMessage(this, "death");
  }
};
var LeaderElection = function LeaderElection2(broadcastChannel, options) {
  var _this = this;
  this.broadcastChannel = broadcastChannel;
  this._options = options;
  this.isLeader = false;
  this._hasLeader = false;
  this.isDead = false;
  this.token = randomToken();
  this._aplQ = PROMISE_RESOLVED_VOID;
  this._aplQC = 0;
  this._unl = [];
  this._lstns = [];
  this._dpL = function() {
  };
  this._dpLC = false;
  var hasLeaderListener = function hasLeaderListener2(msg) {
    if (msg.context === "leader") {
      if (msg.action === "death") {
        _this._hasLeader = false;
      }
      if (msg.action === "tell") {
        _this._hasLeader = true;
      }
    }
  };
  this.broadcastChannel.addEventListener("internal", hasLeaderListener);
  this._lstns.push(hasLeaderListener);
};
LeaderElection.prototype = {
  hasLeader: function hasLeader2() {
    return Promise.resolve(this._hasLeader);
  },
  /**
   * Returns true if the instance is leader,
   * false if not.
   * @async
   */
  applyOnce: function applyOnce(isFromFallbackInterval) {
    var _this2 = this;
    if (this.isLeader) {
      return sleep(0, true);
    }
    if (this.isDead) {
      return sleep(0, false);
    }
    if (this._aplQC > 1) {
      return this._aplQ;
    }
    var applyRun = function applyRun2() {
      if (_this2.isLeader) {
        return PROMISE_RESOLVED_TRUE;
      }
      var stopCriteria = false;
      var stopCriteriaPromiseResolve;
      var stopCriteriaPromise = new Promise(function(res) {
        stopCriteriaPromiseResolve = function stopCriteriaPromiseResolve2() {
          stopCriteria = true;
          res();
        };
      });
      var handleMessage = function handleMessage2(msg) {
        if (msg.context === "leader" && msg.token != _this2.token) {
          if (msg.action === "apply") {
            if (msg.token > _this2.token) {
              stopCriteriaPromiseResolve();
            }
          }
          if (msg.action === "tell") {
            stopCriteriaPromiseResolve();
            _this2._hasLeader = true;
          }
        }
      };
      _this2.broadcastChannel.addEventListener("internal", handleMessage);
      var waitForAnswerTime = isFromFallbackInterval ? _this2._options.responseTime * 4 : _this2._options.responseTime;
      return sendLeaderMessage(_this2, "apply").then(function() {
        return Promise.race([sleep(waitForAnswerTime), stopCriteriaPromise.then(function() {
          return Promise.reject(new Error());
        })]);
      }).then(function() {
        return sendLeaderMessage(_this2, "apply");
      }).then(function() {
        return Promise.race([sleep(waitForAnswerTime), stopCriteriaPromise.then(function() {
          return Promise.reject(new Error());
        })]);
      })["catch"](function() {
      }).then(function() {
        _this2.broadcastChannel.removeEventListener("internal", handleMessage);
        if (!stopCriteria) {
          return beLeader(_this2).then(function() {
            return true;
          });
        } else {
          return false;
        }
      });
    };
    this._aplQC = this._aplQC + 1;
    this._aplQ = this._aplQ.then(function() {
      return applyRun();
    }).then(function() {
      _this2._aplQC = _this2._aplQC - 1;
    });
    return this._aplQ.then(function() {
      return _this2.isLeader;
    });
  },
  awaitLeadership: function awaitLeadership2() {
    if (
      /* _awaitLeadershipPromise */
      !this._aLP
    ) {
      this._aLP = _awaitLeadershipOnce(this);
    }
    return this._aLP;
  },
  set onduplicate(fn) {
    this._dpL = fn;
  },
  die: function die2() {
    var _this3 = this;
    this._lstns.forEach(function(listener) {
      return _this3.broadcastChannel.removeEventListener("internal", listener);
    });
    this._lstns = [];
    this._unl.forEach(function(uFn) {
      return uFn.remove();
    });
    this._unl = [];
    if (this.isLeader) {
      this._hasLeader = false;
      this.isLeader = false;
    }
    this.isDead = true;
    return sendLeaderMessage(this, "death");
  }
};
function _awaitLeadershipOnce(leaderElector) {
  if (leaderElector.isLeader) {
    return PROMISE_RESOLVED_VOID;
  }
  return new Promise(function(res) {
    var resolved = false;
    function finish() {
      if (resolved) {
        return;
      }
      resolved = true;
      leaderElector.broadcastChannel.removeEventListener("internal", whenDeathListener);
      res(true);
    }
    leaderElector.applyOnce().then(function() {
      if (leaderElector.isLeader) {
        finish();
      }
    });
    var _tryOnFallBack = function tryOnFallBack() {
      return sleep(leaderElector._options.fallbackInterval).then(function() {
        if (leaderElector.isDead || resolved) {
          return;
        }
        if (leaderElector.isLeader) {
          finish();
        } else {
          return leaderElector.applyOnce(true).then(function() {
            if (leaderElector.isLeader) {
              finish();
            } else {
              _tryOnFallBack();
            }
          });
        }
      });
    };
    _tryOnFallBack();
    var whenDeathListener = function whenDeathListener2(msg) {
      if (msg.context === "leader" && msg.action === "death") {
        leaderElector._hasLeader = false;
        leaderElector.applyOnce().then(function() {
          if (leaderElector.isLeader) {
            finish();
          }
        });
      }
    };
    leaderElector.broadcastChannel.addEventListener("internal", whenDeathListener);
    leaderElector._lstns.push(whenDeathListener);
  });
}
function fillOptionsWithDefaults(options, channel) {
  if (!options) options = {};
  options = JSON.parse(JSON.stringify(options));
  if (!options.fallbackInterval) {
    options.fallbackInterval = 3e3;
  }
  if (!options.responseTime) {
    options.responseTime = channel.method.averageResponseTime(channel.options);
  }
  return options;
}
function createLeaderElection(channel, options) {
  if (channel._leaderElector) {
    throw new Error("BroadcastChannel already has a leader-elector");
  }
  options = fillOptionsWithDefaults(options, channel);
  var elector = supportsWebLockAPI() ? new LeaderElectionWebLock(channel, options) : new LeaderElection(channel, options);
  channel._befC.push(function() {
    return elector.die();
  });
  channel._leaderElector = elector;
  return elector;
}
var BROADCAST_CHANNEL_BY_TOKEN = /* @__PURE__ */ new Map();
function getBroadcastChannelReference(storageName, databaseInstanceToken, databaseName, refObject) {
  var state = BROADCAST_CHANNEL_BY_TOKEN.get(databaseInstanceToken);
  if (!state) {
    state = {
      /**
       * We have to use the databaseName instead of the databaseInstanceToken
       * in the BroadcastChannel name because different instances must end with the same
       * channel name to be able to broadcast messages between each other.
       */
      bc: new BroadcastChannel$1(["RxDB:", storageName, databaseName].join("|")),
      refs: /* @__PURE__ */ new Set()
    };
    BROADCAST_CHANNEL_BY_TOKEN.set(databaseInstanceToken, state);
  }
  state.refs.add(refObject);
  return state.bc;
}
function removeBroadcastChannelReference(databaseInstanceToken, refObject) {
  var state = BROADCAST_CHANNEL_BY_TOKEN.get(databaseInstanceToken);
  if (!state) {
    return;
  }
  state.refs.delete(refObject);
  if (state.refs.size === 0) {
    BROADCAST_CHANNEL_BY_TOKEN.delete(databaseInstanceToken);
    return state.bc.close();
  }
}
function addRxStorageMultiInstanceSupport(storageName, instanceCreationParams, instance, providedBroadcastChannel) {
  if (!instanceCreationParams.multiInstance) {
    return;
  }
  var broadcastChannel = getBroadcastChannelReference(storageName, instanceCreationParams.databaseInstanceToken, instance.databaseName, instance);
  var changesFromOtherInstances$ = new Subject();
  var eventListener = (msg) => {
    if (msg.storageName === storageName && msg.databaseName === instanceCreationParams.databaseName && msg.collectionName === instanceCreationParams.collectionName && msg.version === instanceCreationParams.schema.version) {
      changesFromOtherInstances$.next(msg.eventBulk);
    }
  };
  broadcastChannel.addEventListener("message", eventListener);
  var oldChangestream$ = instance.changeStream();
  var closed = false;
  var sub = oldChangestream$.subscribe((eventBulk) => {
    if (closed) {
      return;
    }
    broadcastChannel.postMessage({
      storageName,
      databaseName: instanceCreationParams.databaseName,
      collectionName: instanceCreationParams.collectionName,
      version: instanceCreationParams.schema.version,
      eventBulk
    });
  });
  instance.changeStream = function() {
    return changesFromOtherInstances$.asObservable().pipe(mergeWith(oldChangestream$));
  };
  var oldClose = instance.close.bind(instance);
  instance.close = async function() {
    closed = true;
    sub.unsubscribe();
    broadcastChannel.removeEventListener("message", eventListener);
    {
      await removeBroadcastChannelReference(instanceCreationParams.databaseInstanceToken, instance);
    }
    return oldClose();
  };
  var oldRemove = instance.remove.bind(instance);
  instance.remove = async function() {
    closed = true;
    sub.unsubscribe();
    broadcastChannel.removeEventListener("message", eventListener);
    {
      await removeBroadcastChannelReference(instanceCreationParams.databaseInstanceToken, instance);
    }
    return oldRemove();
  };
}
var dexie_min$1 = { exports: {} };
var dexie_min = dexie_min$1.exports;
var hasRequiredDexie_min;
function requireDexie_min() {
  if (hasRequiredDexie_min) return dexie_min$1.exports;
  hasRequiredDexie_min = 1;
  (function(module, exports) {
    (function(e, t) {
      module.exports = t();
    })(dexie_min, function() {
      var s = function(e2, t2) {
        return (s = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e3, t3) {
          e3.__proto__ = t3;
        } || function(e3, t3) {
          for (var n2 in t3) Object.prototype.hasOwnProperty.call(t3, n2) && (e3[n2] = t3[n2]);
        })(e2, t2);
      };
      var _ = function() {
        return (_ = Object.assign || function(e2) {
          for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var i2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, i2) && (e2[i2] = t2[i2]);
          return e2;
        }).apply(this, arguments);
      };
      function i(e2, t2, n2) {
        for (var r2, i2 = 0, o2 = t2.length; i2 < o2; i2++) !r2 && i2 in t2 || ((r2 = r2 || Array.prototype.slice.call(t2, 0, i2))[i2] = t2[i2]);
        return e2.concat(r2 || Array.prototype.slice.call(t2));
      }
      var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : commonjsGlobal, x = Object.keys, k = Array.isArray;
      function a(t2, n2) {
        return "object" != typeof n2 || x(n2).forEach(function(e2) {
          t2[e2] = n2[e2];
        }), t2;
      }
      "undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
      var c = Object.getPrototypeOf, n = {}.hasOwnProperty;
      function m(e2, t2) {
        return n.call(e2, t2);
      }
      function r(t2, n2) {
        "function" == typeof n2 && (n2 = n2(c(t2))), ("undefined" == typeof Reflect ? x : Reflect.ownKeys)(n2).forEach(function(e2) {
          l(t2, e2, n2[e2]);
        });
      }
      var u = Object.defineProperty;
      function l(e2, t2, n2, r2) {
        u(e2, t2, a(n2 && m(n2, "get") && "function" == typeof n2.get ? { get: n2.get, set: n2.set, configurable: true } : { value: n2, configurable: true, writable: true }, r2));
      }
      function o(t2) {
        return { from: function(e2) {
          return t2.prototype = Object.create(e2.prototype), l(t2.prototype, "constructor", t2), { extend: r.bind(null, t2.prototype) };
        } };
      }
      var h = Object.getOwnPropertyDescriptor;
      var d = [].slice;
      function b(e2, t2, n2) {
        return d.call(e2, t2, n2);
      }
      function p(e2, t2) {
        return t2(e2);
      }
      function y(e2) {
        if (!e2) throw new Error("Assertion Failed");
      }
      function v(e2) {
        f.setImmediate ? setImmediate(e2) : setTimeout(e2, 0);
      }
      function O(e2, t2) {
        if ("string" == typeof t2 && m(e2, t2)) return e2[t2];
        if (!t2) return e2;
        if ("string" != typeof t2) {
          for (var n2 = [], r2 = 0, i2 = t2.length; r2 < i2; ++r2) {
            var o2 = O(e2, t2[r2]);
            n2.push(o2);
          }
          return n2;
        }
        var a2 = t2.indexOf(".");
        if (-1 !== a2) {
          var u2 = e2[t2.substr(0, a2)];
          return null == u2 ? void 0 : O(u2, t2.substr(a2 + 1));
        }
      }
      function P(e2, t2, n2) {
        if (e2 && void 0 !== t2 && !("isFrozen" in Object && Object.isFrozen(e2))) if ("string" != typeof t2 && "length" in t2) {
          y("string" != typeof n2 && "length" in n2);
          for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) P(e2, t2[r2], n2[r2]);
        } else {
          var o2, a2, u2 = t2.indexOf(".");
          -1 !== u2 ? (o2 = t2.substr(0, u2), "" === (a2 = t2.substr(u2 + 1)) ? void 0 === n2 ? k(e2) && !isNaN(parseInt(o2)) ? e2.splice(o2, 1) : delete e2[o2] : e2[o2] = n2 : P(u2 = !(u2 = e2[o2]) || !m(e2, o2) ? e2[o2] = {} : u2, a2, n2)) : void 0 === n2 ? k(e2) && !isNaN(parseInt(t2)) ? e2.splice(t2, 1) : delete e2[t2] : e2[t2] = n2;
        }
      }
      function g(e2) {
        var t2, n2 = {};
        for (t2 in e2) m(e2, t2) && (n2[t2] = e2[t2]);
        return n2;
      }
      var t = [].concat;
      function w(e2) {
        return t.apply([], e2);
      }
      var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(w([8, 16, 32, 64].map(function(t2) {
        return ["Int", "Uint", "Float"].map(function(e2) {
          return e2 + t2 + "Array";
        });
      }))).filter(function(e2) {
        return f[e2];
      }), K = new Set(e.map(function(e2) {
        return f[e2];
      }));
      var E = null;
      function S(e2) {
        E = /* @__PURE__ */ new WeakMap();
        e2 = function e3(t2) {
          if (!t2 || "object" != typeof t2) return t2;
          var n2 = E.get(t2);
          if (n2) return n2;
          if (k(t2)) {
            n2 = [], E.set(t2, n2);
            for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) n2.push(e3(t2[r2]));
          } else if (K.has(t2.constructor)) n2 = t2;
          else {
            var o2, a2 = c(t2);
            for (o2 in n2 = a2 === Object.prototype ? {} : Object.create(a2), E.set(t2, n2), t2) m(t2, o2) && (n2[o2] = e3(t2[o2]));
          }
          return n2;
        }(e2);
        return E = null, e2;
      }
      var j = {}.toString;
      function A(e2) {
        return j.call(e2).slice(8, -1);
      }
      var C = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", T = "symbol" == typeof C ? function(e2) {
        var t2;
        return null != e2 && (t2 = e2[C]) && t2.apply(e2);
      } : function() {
        return null;
      };
      function q(e2, t2) {
        t2 = e2.indexOf(t2);
        return 0 <= t2 && e2.splice(t2, 1), 0 <= t2;
      }
      var D = {};
      function I(e2) {
        var t2, n2, r2, i2;
        if (1 === arguments.length) {
          if (k(e2)) return e2.slice();
          if (this === D && "string" == typeof e2) return [e2];
          if (i2 = T(e2)) {
            for (n2 = []; !(r2 = i2.next()).done; ) n2.push(r2.value);
            return n2;
          }
          if (null == e2) return [e2];
          if ("number" != typeof (t2 = e2.length)) return [e2];
          for (n2 = new Array(t2); t2--; ) n2[t2] = e2[t2];
          return n2;
        }
        for (t2 = arguments.length, n2 = new Array(t2); t2--; ) n2[t2] = arguments[t2];
        return n2;
      }
      var B = "undefined" != typeof Symbol ? function(e2) {
        return "AsyncFunction" === e2[Symbol.toStringTag];
      } : function() {
        return false;
      }, R = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], M = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(R), F = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
      function N(e2, t2) {
        this.name = e2, this.message = t2;
      }
      function L(e2, t2) {
        return e2 + ". Errors: " + Object.keys(t2).map(function(e3) {
          return t2[e3].toString();
        }).filter(function(e3, t3, n2) {
          return n2.indexOf(e3) === t3;
        }).join("\n");
      }
      function U(e2, t2, n2, r2) {
        this.failures = t2, this.failedKeys = r2, this.successCount = n2, this.message = L(e2, t2);
      }
      function V(e2, t2) {
        this.name = "BulkError", this.failures = Object.keys(t2).map(function(e3) {
          return t2[e3];
        }), this.failuresByPos = t2, this.message = L(e2, this.failures);
      }
      o(N).from(Error).extend({ toString: function() {
        return this.name + ": " + this.message;
      } }), o(U).from(N), o(V).from(N);
      var z = M.reduce(function(e2, t2) {
        return e2[t2] = t2 + "Error", e2;
      }, {}), W = N, Y = M.reduce(function(e2, n2) {
        var r2 = n2 + "Error";
        function t2(e3, t3) {
          this.name = r2, e3 ? "string" == typeof e3 ? (this.message = "".concat(e3).concat(t3 ? "\n " + t3 : ""), this.inner = t3 || null) : "object" == typeof e3 && (this.message = "".concat(e3.name, " ").concat(e3.message), this.inner = e3) : (this.message = F[n2] || r2, this.inner = null);
        }
        return o(t2).from(W), e2[n2] = t2, e2;
      }, {});
      Y.Syntax = SyntaxError, Y.Type = TypeError, Y.Range = RangeError;
      var $ = R.reduce(function(e2, t2) {
        return e2[t2 + "Error"] = Y[t2], e2;
      }, {});
      var Q = M.reduce(function(e2, t2) {
        return -1 === ["Syntax", "Type", "Range"].indexOf(t2) && (e2[t2 + "Error"] = Y[t2]), e2;
      }, {});
      function G() {
      }
      function X(e2) {
        return e2;
      }
      function H(t2, n2) {
        return null == t2 || t2 === X ? n2 : function(e2) {
          return n2(t2(e2));
        };
      }
      function J(e2, t2) {
        return function() {
          e2.apply(this, arguments), t2.apply(this, arguments);
        };
      }
      function Z(i2, o2) {
        return i2 === G ? o2 : function() {
          var e2 = i2.apply(this, arguments);
          void 0 !== e2 && (arguments[0] = e2);
          var t2 = this.onsuccess, n2 = this.onerror;
          this.onsuccess = null, this.onerror = null;
          var r2 = o2.apply(this, arguments);
          return t2 && (this.onsuccess = this.onsuccess ? J(t2, this.onsuccess) : t2), n2 && (this.onerror = this.onerror ? J(n2, this.onerror) : n2), void 0 !== r2 ? r2 : e2;
        };
      }
      function ee(n2, r2) {
        return n2 === G ? r2 : function() {
          n2.apply(this, arguments);
          var e2 = this.onsuccess, t2 = this.onerror;
          this.onsuccess = this.onerror = null, r2.apply(this, arguments), e2 && (this.onsuccess = this.onsuccess ? J(e2, this.onsuccess) : e2), t2 && (this.onerror = this.onerror ? J(t2, this.onerror) : t2);
        };
      }
      function te(i2, o2) {
        return i2 === G ? o2 : function(e2) {
          var t2 = i2.apply(this, arguments);
          a(e2, t2);
          var n2 = this.onsuccess, r2 = this.onerror;
          this.onsuccess = null, this.onerror = null;
          e2 = o2.apply(this, arguments);
          return n2 && (this.onsuccess = this.onsuccess ? J(n2, this.onsuccess) : n2), r2 && (this.onerror = this.onerror ? J(r2, this.onerror) : r2), void 0 === t2 ? void 0 === e2 ? void 0 : e2 : a(t2, e2);
        };
      }
      function ne(e2, t2) {
        return e2 === G ? t2 : function() {
          return false !== t2.apply(this, arguments) && e2.apply(this, arguments);
        };
      }
      function re(i2, o2) {
        return i2 === G ? o2 : function() {
          var e2 = i2.apply(this, arguments);
          if (e2 && "function" == typeof e2.then) {
            for (var t2 = this, n2 = arguments.length, r2 = new Array(n2); n2--; ) r2[n2] = arguments[n2];
            return e2.then(function() {
              return o2.apply(t2, r2);
            });
          }
          return o2.apply(this, arguments);
        };
      }
      Q.ModifyError = U, Q.DexieError = N, Q.BulkError = V;
      var ie = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
      function oe(e2) {
        ie = e2;
      }
      var ae = {}, ue = 100, e = "undefined" == typeof Promise ? [] : function() {
        var e2 = Promise.resolve();
        if ("undefined" == typeof crypto || !crypto.subtle) return [e2, c(e2), e2];
        var t2 = crypto.subtle.digest("SHA-512", new Uint8Array([0]));
        return [t2, c(t2), e2];
      }(), R = e[0], M = e[1], e = e[2], M = M && M.then, se = R && R.constructor, ce = !!e;
      var le = function(e2, t2) {
        be.push([e2, t2]), he && (queueMicrotask(Se), he = false);
      }, fe = true, he = true, de = [], pe = [], ye = X, ve = { id: "global", global: true, ref: 0, unhandleds: [], onunhandled: G, pgp: false, env: {}, finalize: G }, me = ve, be = [], ge = 0, we = [];
      function _e(e2) {
        if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
        this._listeners = [], this._lib = false;
        var t2 = this._PSD = me;
        if ("function" != typeof e2) {
          if (e2 !== ae) throw new TypeError("Not a function");
          return this._state = arguments[1], this._value = arguments[2], void (false === this._state && Oe(this, this._value));
        }
        this._state = null, this._value = null, ++t2.ref, function t3(r2, e3) {
          try {
            e3(function(n2) {
              if (null === r2._state) {
                if (n2 === r2) throw new TypeError("A promise cannot be resolved with itself.");
                var e4 = r2._lib && je();
                n2 && "function" == typeof n2.then ? t3(r2, function(e5, t4) {
                  n2 instanceof _e ? n2._then(e5, t4) : n2.then(e5, t4);
                }) : (r2._state = true, r2._value = n2, Pe(r2)), e4 && Ae();
              }
            }, Oe.bind(null, r2));
          } catch (e4) {
            Oe(r2, e4);
          }
        }(this, e2);
      }
      var xe = { get: function() {
        var u2 = me, t2 = Me;
        function e2(n2, r2) {
          var i2 = this, o2 = !u2.global && (u2 !== me || t2 !== Me), a2 = o2 && !Ue(), e3 = new _e(function(e4, t3) {
            Ke(i2, new ke(Qe(n2, u2, o2, a2), Qe(r2, u2, o2, a2), e4, t3, u2));
          });
          return this._consoleTask && (e3._consoleTask = this._consoleTask), e3;
        }
        return e2.prototype = ae, e2;
      }, set: function(e2) {
        l(this, "then", e2 && e2.prototype === ae ? xe : { get: function() {
          return e2;
        }, set: xe.set });
      } };
      function ke(e2, t2, n2, r2, i2) {
        this.onFulfilled = "function" == typeof e2 ? e2 : null, this.onRejected = "function" == typeof t2 ? t2 : null, this.resolve = n2, this.reject = r2, this.psd = i2;
      }
      function Oe(e2, t2) {
        var n2, r2;
        pe.push(t2), null === e2._state && (n2 = e2._lib && je(), t2 = ye(t2), e2._state = false, e2._value = t2, r2 = e2, de.some(function(e3) {
          return e3._value === r2._value;
        }) || de.push(r2), Pe(e2), n2 && Ae());
      }
      function Pe(e2) {
        var t2 = e2._listeners;
        e2._listeners = [];
        for (var n2 = 0, r2 = t2.length; n2 < r2; ++n2) Ke(e2, t2[n2]);
        var i2 = e2._PSD;
        --i2.ref || i2.finalize(), 0 === ge && (++ge, le(function() {
          0 == --ge && Ce();
        }, []));
      }
      function Ke(e2, t2) {
        if (null !== e2._state) {
          var n2 = e2._state ? t2.onFulfilled : t2.onRejected;
          if (null === n2) return (e2._state ? t2.resolve : t2.reject)(e2._value);
          ++t2.psd.ref, ++ge, le(Ee, [n2, e2, t2]);
        } else e2._listeners.push(t2);
      }
      function Ee(e2, t2, n2) {
        try {
          var r2, i2 = t2._value;
          !t2._state && pe.length && (pe = []), r2 = ie && t2._consoleTask ? t2._consoleTask.run(function() {
            return e2(i2);
          }) : e2(i2), t2._state || -1 !== pe.indexOf(i2) || function(e3) {
            var t3 = de.length;
            for (; t3; ) if (de[--t3]._value === e3._value) return de.splice(t3, 1);
          }(t2), n2.resolve(r2);
        } catch (e3) {
          n2.reject(e3);
        } finally {
          0 == --ge && Ce(), --n2.psd.ref || n2.psd.finalize();
        }
      }
      function Se() {
        $e(ve, function() {
          je() && Ae();
        });
      }
      function je() {
        var e2 = fe;
        return he = fe = false, e2;
      }
      function Ae() {
        var e2, t2, n2;
        do {
          for (; 0 < be.length; ) for (e2 = be, be = [], n2 = e2.length, t2 = 0; t2 < n2; ++t2) {
            var r2 = e2[t2];
            r2[0].apply(null, r2[1]);
          }
        } while (0 < be.length);
        he = fe = true;
      }
      function Ce() {
        var e2 = de;
        de = [], e2.forEach(function(e3) {
          e3._PSD.onunhandled.call(null, e3._value, e3);
        });
        for (var t2 = we.slice(0), n2 = t2.length; n2; ) t2[--n2]();
      }
      function Te(e2) {
        return new _e(ae, false, e2);
      }
      function qe(n2, r2) {
        var i2 = me;
        return function() {
          var e2 = je(), t2 = me;
          try {
            return We(i2, true), n2.apply(this, arguments);
          } catch (e3) {
            r2 && r2(e3);
          } finally {
            We(t2, false), e2 && Ae();
          }
        };
      }
      r(_e.prototype, { then: xe, _then: function(e2, t2) {
        Ke(this, new ke(null, null, e2, t2, me));
      }, catch: function(e2) {
        if (1 === arguments.length) return this.then(null, e2);
        var t2 = e2, n2 = arguments[1];
        return "function" == typeof t2 ? this.then(null, function(e3) {
          return (e3 instanceof t2 ? n2 : Te)(e3);
        }) : this.then(null, function(e3) {
          return (e3 && e3.name === t2 ? n2 : Te)(e3);
        });
      }, finally: function(t2) {
        return this.then(function(e2) {
          return _e.resolve(t2()).then(function() {
            return e2;
          });
        }, function(e2) {
          return _e.resolve(t2()).then(function() {
            return Te(e2);
          });
        });
      }, timeout: function(r2, i2) {
        var o2 = this;
        return r2 < 1 / 0 ? new _e(function(e2, t2) {
          var n2 = setTimeout(function() {
            return t2(new Y.Timeout(i2));
          }, r2);
          o2.then(e2, t2).finally(clearTimeout.bind(null, n2));
        }) : this;
      } }), "undefined" != typeof Symbol && Symbol.toStringTag && l(_e.prototype, Symbol.toStringTag, "Dexie.Promise"), ve.env = Ye(), r(_e, { all: function() {
        var o2 = I.apply(null, arguments).map(Ve);
        return new _e(function(n2, r2) {
          0 === o2.length && n2([]);
          var i2 = o2.length;
          o2.forEach(function(e2, t2) {
            return _e.resolve(e2).then(function(e3) {
              o2[t2] = e3, --i2 || n2(o2);
            }, r2);
          });
        });
      }, resolve: function(n2) {
        return n2 instanceof _e ? n2 : n2 && "function" == typeof n2.then ? new _e(function(e2, t2) {
          n2.then(e2, t2);
        }) : new _e(ae, true, n2);
      }, reject: Te, race: function() {
        var e2 = I.apply(null, arguments).map(Ve);
        return new _e(function(t2, n2) {
          e2.map(function(e3) {
            return _e.resolve(e3).then(t2, n2);
          });
        });
      }, PSD: { get: function() {
        return me;
      }, set: function(e2) {
        return me = e2;
      } }, totalEchoes: { get: function() {
        return Me;
      } }, newPSD: Ne, usePSD: $e, scheduler: { get: function() {
        return le;
      }, set: function(e2) {
        le = e2;
      } }, rejectionMapper: { get: function() {
        return ye;
      }, set: function(e2) {
        ye = e2;
      } }, follow: function(i2, n2) {
        return new _e(function(e2, t2) {
          return Ne(function(n3, r2) {
            var e3 = me;
            e3.unhandleds = [], e3.onunhandled = r2, e3.finalize = J(function() {
              var t3, e4 = this;
              t3 = function() {
                0 === e4.unhandleds.length ? n3() : r2(e4.unhandleds[0]);
              }, we.push(function e5() {
                t3(), we.splice(we.indexOf(e5), 1);
              }), ++ge, le(function() {
                0 == --ge && Ce();
              }, []);
            }, e3.finalize), i2();
          }, n2, e2, t2);
        });
      } }), se && (se.allSettled && l(_e, "allSettled", function() {
        var e2 = I.apply(null, arguments).map(Ve);
        return new _e(function(n2) {
          0 === e2.length && n2([]);
          var r2 = e2.length, i2 = new Array(r2);
          e2.forEach(function(e3, t2) {
            return _e.resolve(e3).then(function(e4) {
              return i2[t2] = { status: "fulfilled", value: e4 };
            }, function(e4) {
              return i2[t2] = { status: "rejected", reason: e4 };
            }).then(function() {
              return --r2 || n2(i2);
            });
          });
        });
      }), se.any && "undefined" != typeof AggregateError && l(_e, "any", function() {
        var e2 = I.apply(null, arguments).map(Ve);
        return new _e(function(n2, r2) {
          0 === e2.length && r2(new AggregateError([]));
          var i2 = e2.length, o2 = new Array(i2);
          e2.forEach(function(e3, t2) {
            return _e.resolve(e3).then(function(e4) {
              return n2(e4);
            }, function(e4) {
              o2[t2] = e4, --i2 || r2(new AggregateError(o2));
            });
          });
        });
      }), se.withResolvers && (_e.withResolvers = se.withResolvers));
      var De = { awaits: 0, echoes: 0, id: 0 }, Ie = 0, Be = [], Re = 0, Me = 0, Fe = 0;
      function Ne(e2, t2, n2, r2) {
        var i2 = me, o2 = Object.create(i2);
        o2.parent = i2, o2.ref = 0, o2.global = false, o2.id = ++Fe, ve.env, o2.env = ce ? { Promise: _e, PromiseProp: { value: _e, configurable: true, writable: true }, all: _e.all, race: _e.race, allSettled: _e.allSettled, any: _e.any, resolve: _e.resolve, reject: _e.reject } : {}, t2 && a(o2, t2), ++i2.ref, o2.finalize = function() {
          --this.parent.ref || this.parent.finalize();
        };
        r2 = $e(o2, e2, n2, r2);
        return 0 === o2.ref && o2.finalize(), r2;
      }
      function Le() {
        return De.id || (De.id = ++Ie), ++De.awaits, De.echoes += ue, De.id;
      }
      function Ue() {
        return !!De.awaits && (0 == --De.awaits && (De.id = 0), De.echoes = De.awaits * ue, true);
      }
      function Ve(e2) {
        return De.echoes && e2 && e2.constructor === se ? (Le(), e2.then(function(e3) {
          return Ue(), e3;
        }, function(e3) {
          return Ue(), Xe(e3);
        })) : e2;
      }
      function ze() {
        var e2 = Be[Be.length - 1];
        Be.pop(), We(e2, false);
      }
      function We(e2, t2) {
        var n2, r2 = me;
        (t2 ? !De.echoes || Re++ && e2 === me : !Re || --Re && e2 === me) || queueMicrotask(t2 ? (function(e3) {
          ++Me, De.echoes && 0 != --De.echoes || (De.echoes = De.awaits = De.id = 0), Be.push(me), We(e3, true);
        }).bind(null, e2) : ze), e2 !== me && (me = e2, r2 === ve && (ve.env = Ye()), ce && (n2 = ve.env.Promise, t2 = e2.env, (r2.global || e2.global) && (Object.defineProperty(f, "Promise", t2.PromiseProp), n2.all = t2.all, n2.race = t2.race, n2.resolve = t2.resolve, n2.reject = t2.reject, t2.allSettled && (n2.allSettled = t2.allSettled), t2.any && (n2.any = t2.any))));
      }
      function Ye() {
        var e2 = f.Promise;
        return ce ? { Promise: e2, PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"), all: e2.all, race: e2.race, allSettled: e2.allSettled, any: e2.any, resolve: e2.resolve, reject: e2.reject } : {};
      }
      function $e(e2, t2, n2, r2, i2) {
        var o2 = me;
        try {
          return We(e2, true), t2(n2, r2, i2);
        } finally {
          We(o2, false);
        }
      }
      function Qe(t2, n2, r2, i2) {
        return "function" != typeof t2 ? t2 : function() {
          var e2 = me;
          r2 && Le(), We(n2, true);
          try {
            return t2.apply(this, arguments);
          } finally {
            We(e2, false), i2 && queueMicrotask(Ue);
          }
        };
      }
      function Ge(e2) {
        Promise === se && 0 === De.echoes ? 0 === Re ? e2() : enqueueNativeMicroTask(e2) : setTimeout(e2, 0);
      }
      -1 === ("" + M).indexOf("[native code]") && (Le = Ue = G);
      var Xe = _e.reject;
      var He = String.fromCharCode(65535), Je = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", Ze = "String expected.", et = [], tt = "__dbnames", nt = "readonly", rt = "readwrite";
      function it(e2, t2) {
        return e2 ? t2 ? function() {
          return e2.apply(this, arguments) && t2.apply(this, arguments);
        } : e2 : t2;
      }
      var ot = { type: 3, lower: -1 / 0, lowerOpen: false, upper: [[]], upperOpen: false };
      function at(t2) {
        return "string" != typeof t2 || /\./.test(t2) ? function(e2) {
          return e2;
        } : function(e2) {
          return void 0 === e2[t2] && t2 in e2 && delete (e2 = S(e2))[t2], e2;
        };
      }
      function ut() {
        throw Y.Type();
      }
      function st(e2, t2) {
        try {
          var n2 = ct(e2), r2 = ct(t2);
          if (n2 !== r2) return "Array" === n2 ? 1 : "Array" === r2 ? -1 : "binary" === n2 ? 1 : "binary" === r2 ? -1 : "string" === n2 ? 1 : "string" === r2 ? -1 : "Date" === n2 ? 1 : "Date" !== r2 ? NaN : -1;
          switch (n2) {
            case "number":
            case "Date":
            case "string":
              return t2 < e2 ? 1 : e2 < t2 ? -1 : 0;
            case "binary":
              return function(e3, t3) {
                for (var n3 = e3.length, r3 = t3.length, i2 = n3 < r3 ? n3 : r3, o2 = 0; o2 < i2; ++o2) if (e3[o2] !== t3[o2]) return e3[o2] < t3[o2] ? -1 : 1;
                return n3 === r3 ? 0 : n3 < r3 ? -1 : 1;
              }(lt(e2), lt(t2));
            case "Array":
              return function(e3, t3) {
                for (var n3 = e3.length, r3 = t3.length, i2 = n3 < r3 ? n3 : r3, o2 = 0; o2 < i2; ++o2) {
                  var a2 = st(e3[o2], t3[o2]);
                  if (0 !== a2) return a2;
                }
                return n3 === r3 ? 0 : n3 < r3 ? -1 : 1;
              }(e2, t2);
          }
        } catch (e3) {
        }
        return NaN;
      }
      function ct(e2) {
        var t2 = typeof e2;
        if ("object" != t2) return t2;
        if (ArrayBuffer.isView(e2)) return "binary";
        e2 = A(e2);
        return "ArrayBuffer" === e2 ? "binary" : e2;
      }
      function lt(e2) {
        return e2 instanceof Uint8Array ? e2 : ArrayBuffer.isView(e2) ? new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : new Uint8Array(e2);
      }
      var ft = (ht.prototype._trans = function(e2, r2, t2) {
        var n2 = this._tx || me.trans, i2 = this.name, o2 = ie && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e2 ? "read" : "write", " ").concat(this.name));
        function a2(e3, t3, n3) {
          if (!n3.schema[i2]) throw new Y.NotFound("Table " + i2 + " not part of transaction");
          return r2(n3.idbtrans, n3);
        }
        var u2 = je();
        try {
          var s2 = n2 && n2.db._novip === this.db._novip ? n2 === me.trans ? n2._promise(e2, a2, t2) : Ne(function() {
            return n2._promise(e2, a2, t2);
          }, { trans: n2, transless: me.transless || me }) : function t3(n3, r3, i3, o3) {
            if (n3.idbdb && (n3._state.openComplete || me.letThrough || n3._vip)) {
              var a3 = n3._createTransaction(r3, i3, n3._dbSchema);
              try {
                a3.create(), n3._state.PR1398_maxLoop = 3;
              } catch (e3) {
                return e3.name === z.InvalidState && n3.isOpen() && 0 < --n3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n3.close({ disableAutoOpen: false }), n3.open().then(function() {
                  return t3(n3, r3, i3, o3);
                })) : Xe(e3);
              }
              return a3._promise(r3, function(e3, t4) {
                return Ne(function() {
                  return me.trans = a3, o3(e3, t4, a3);
                });
              }).then(function(e3) {
                if ("readwrite" === r3) try {
                  a3.idbtrans.commit();
                } catch (e4) {
                }
                return "readonly" === r3 ? e3 : a3._completion.then(function() {
                  return e3;
                });
              });
            }
            if (n3._state.openComplete) return Xe(new Y.DatabaseClosed(n3._state.dbOpenError));
            if (!n3._state.isBeingOpened) {
              if (!n3._state.autoOpen) return Xe(new Y.DatabaseClosed());
              n3.open().catch(G);
            }
            return n3._state.dbReadyPromise.then(function() {
              return t3(n3, r3, i3, o3);
            });
          }(this.db, e2, [this.name], a2);
          return o2 && (s2._consoleTask = o2, s2 = s2.catch(function(e3) {
            return console.trace(e3), Xe(e3);
          })), s2;
        } finally {
          u2 && Ae();
        }
      }, ht.prototype.get = function(t2, e2) {
        var n2 = this;
        return t2 && t2.constructor === Object ? this.where(t2).first(e2) : null == t2 ? Xe(new Y.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e3) {
          return n2.core.get({ trans: e3, key: t2 }).then(function(e4) {
            return n2.hook.reading.fire(e4);
          });
        }).then(e2);
      }, ht.prototype.where = function(o2) {
        if ("string" == typeof o2) return new this.db.WhereClause(this, o2);
        if (k(o2)) return new this.db.WhereClause(this, "[".concat(o2.join("+"), "]"));
        var n2 = x(o2);
        if (1 === n2.length) return this.where(n2[0]).equals(o2[n2[0]]);
        var e2 = this.schema.indexes.concat(this.schema.primKey).filter(function(t3) {
          if (t3.compound && n2.every(function(e4) {
            return 0 <= t3.keyPath.indexOf(e4);
          })) {
            for (var e3 = 0; e3 < n2.length; ++e3) if (-1 === n2.indexOf(t3.keyPath[e3])) return false;
            return true;
          }
          return false;
        }).sort(function(e3, t3) {
          return e3.keyPath.length - t3.keyPath.length;
        })[0];
        if (e2 && this.db._maxKey !== He) {
          var t2 = e2.keyPath.slice(0, n2.length);
          return this.where(t2).equals(t2.map(function(e3) {
            return o2[e3];
          }));
        }
        !e2 && ie && console.warn("The query ".concat(JSON.stringify(o2), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n2.join("+"), "]"));
        var a2 = this.schema.idxByName;
        function u2(e3, t3) {
          return 0 === st(e3, t3);
        }
        var r2 = n2.reduce(function(e3, t3) {
          var n3 = e3[0], r3 = e3[1], e3 = a2[t3], i2 = o2[t3];
          return [n3 || e3, n3 || !e3 ? it(r3, e3 && e3.multi ? function(e4) {
            e4 = O(e4, t3);
            return k(e4) && e4.some(function(e5) {
              return u2(i2, e5);
            });
          } : function(e4) {
            return u2(i2, O(e4, t3));
          }) : r3];
        }, [null, null]), t2 = r2[0], r2 = r2[1];
        return t2 ? this.where(t2.name).equals(o2[t2.keyPath]).filter(r2) : e2 ? this.filter(r2) : this.where(n2).equals("");
      }, ht.prototype.filter = function(e2) {
        return this.toCollection().and(e2);
      }, ht.prototype.count = function(e2) {
        return this.toCollection().count(e2);
      }, ht.prototype.offset = function(e2) {
        return this.toCollection().offset(e2);
      }, ht.prototype.limit = function(e2) {
        return this.toCollection().limit(e2);
      }, ht.prototype.each = function(e2) {
        return this.toCollection().each(e2);
      }, ht.prototype.toArray = function(e2) {
        return this.toCollection().toArray(e2);
      }, ht.prototype.toCollection = function() {
        return new this.db.Collection(new this.db.WhereClause(this));
      }, ht.prototype.orderBy = function(e2) {
        return new this.db.Collection(new this.db.WhereClause(this, k(e2) ? "[".concat(e2.join("+"), "]") : e2));
      }, ht.prototype.reverse = function() {
        return this.toCollection().reverse();
      }, ht.prototype.mapToClass = function(r2) {
        var e2, t2 = this.db, n2 = this.name;
        function i2() {
          return null !== e2 && e2.apply(this, arguments) || this;
        }
        (this.schema.mappedClass = r2).prototype instanceof ut && (function(e3, t3) {
          if ("function" != typeof t3 && null !== t3) throw new TypeError("Class extends value " + String(t3) + " is not a constructor or null");
          function n3() {
            this.constructor = e3;
          }
          s(e3, t3), e3.prototype = null === t3 ? Object.create(t3) : (n3.prototype = t3.prototype, new n3());
        }(i2, e2 = r2), Object.defineProperty(i2.prototype, "db", { get: function() {
          return t2;
        }, enumerable: false, configurable: true }), i2.prototype.table = function() {
          return n2;
        }, r2 = i2);
        for (var o2 = /* @__PURE__ */ new Set(), a2 = r2.prototype; a2; a2 = c(a2)) Object.getOwnPropertyNames(a2).forEach(function(e3) {
          return o2.add(e3);
        });
        function u2(e3) {
          if (!e3) return e3;
          var t3, n3 = Object.create(r2.prototype);
          for (t3 in e3) if (!o2.has(t3)) try {
            n3[t3] = e3[t3];
          } catch (e4) {
          }
          return n3;
        }
        return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = u2, this.hook("reading", u2), r2;
      }, ht.prototype.defineClass = function() {
        return this.mapToClass(function(e2) {
          a(this, e2);
        });
      }, ht.prototype.add = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
        return o2 && i2 && (a2 = at(o2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "add", keys: null != n2 ? [n2] : null, values: [a2] });
        }).then(function(e3) {
          return e3.numFailures ? _e.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (o2) try {
            P(t2, o2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, ht.prototype.update = function(e2, t2) {
        if ("object" != typeof e2 || k(e2)) return this.where(":id").equals(e2).modify(t2);
        e2 = O(e2, this.schema.primKey.keyPath);
        return void 0 === e2 ? Xe(new Y.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e2).modify(t2);
      }, ht.prototype.put = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
        return o2 && i2 && (a2 = at(o2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "put", values: [a2], keys: null != n2 ? [n2] : null });
        }).then(function(e3) {
          return e3.numFailures ? _e.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (o2) try {
            P(t2, o2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, ht.prototype.delete = function(t2) {
        var n2 = this;
        return this._trans("readwrite", function(e2) {
          return n2.core.mutate({ trans: e2, type: "delete", keys: [t2] });
        }).then(function(e2) {
          return e2.numFailures ? _e.reject(e2.failures[0]) : void 0;
        });
      }, ht.prototype.clear = function() {
        var t2 = this;
        return this._trans("readwrite", function(e2) {
          return t2.core.mutate({ trans: e2, type: "deleteRange", range: ot });
        }).then(function(e2) {
          return e2.numFailures ? _e.reject(e2.failures[0]) : void 0;
        });
      }, ht.prototype.bulkGet = function(t2) {
        var n2 = this;
        return this._trans("readonly", function(e2) {
          return n2.core.getMany({ keys: t2, trans: e2 }).then(function(e3) {
            return e3.map(function(e4) {
              return n2.hook.reading.fire(e4);
            });
          });
        });
      }, ht.prototype.bulkAdd = function(r2, e2, t2) {
        var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new Y.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== r2.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
          var i2 = r2.length, t3 = t3 && n2 ? r2.map(at(t3)) : r2;
          return o2.core.mutate({ trans: e3, type: "add", keys: a2, values: t3, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.results, r3 = e4.lastResult, e4 = e4.failures;
            if (0 === t4) return u2 ? n3 : r3;
            throw new V("".concat(o2.name, ".bulkAdd(): ").concat(t4, " of ").concat(i2, " operations failed"), e4);
          });
        });
      }, ht.prototype.bulkPut = function(r2, e2, t2) {
        var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new Y.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== r2.length) throw new Y.InvalidArgument("Arguments objects and keys must have the same length");
          var i2 = r2.length, t3 = t3 && n2 ? r2.map(at(t3)) : r2;
          return o2.core.mutate({ trans: e3, type: "put", keys: a2, values: t3, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.results, r3 = e4.lastResult, e4 = e4.failures;
            if (0 === t4) return u2 ? n3 : r3;
            throw new V("".concat(o2.name, ".bulkPut(): ").concat(t4, " of ").concat(i2, " operations failed"), e4);
          });
        });
      }, ht.prototype.bulkUpdate = function(t2) {
        var h2 = this, n2 = this.core, r2 = t2.map(function(e2) {
          return e2.key;
        }), i2 = t2.map(function(e2) {
          return e2.changes;
        }), d2 = [];
        return this._trans("readwrite", function(e2) {
          return n2.getMany({ trans: e2, keys: r2, cache: "clone" }).then(function(c2) {
            var l2 = [], f2 = [];
            t2.forEach(function(e3, t3) {
              var n3 = e3.key, r3 = e3.changes, i3 = c2[t3];
              if (i3) {
                for (var o2 = 0, a2 = Object.keys(r3); o2 < a2.length; o2++) {
                  var u2 = a2[o2], s3 = r3[u2];
                  if (u2 === h2.schema.primKey.keyPath) {
                    if (0 !== st(s3, n3)) throw new Y.Constraint("Cannot update primary key in bulkUpdate()");
                  } else P(i3, u2, s3);
                }
                d2.push(t3), l2.push(n3), f2.push(i3);
              }
            });
            var s2 = l2.length;
            return n2.mutate({ trans: e2, type: "put", keys: l2, values: f2, updates: { keys: r2, changeSpecs: i2 } }).then(function(e3) {
              var t3 = e3.numFailures, n3 = e3.failures;
              if (0 === t3) return s2;
              for (var r3 = 0, i3 = Object.keys(n3); r3 < i3.length; r3++) {
                var o2, a2 = i3[r3], u2 = d2[Number(a2)];
                null != u2 && (o2 = n3[a2], delete n3[a2], n3[u2] = o2);
              }
              throw new V("".concat(h2.name, ".bulkUpdate(): ").concat(t3, " of ").concat(s2, " operations failed"), n3);
            });
          });
        });
      }, ht.prototype.bulkDelete = function(t2) {
        var r2 = this, i2 = t2.length;
        return this._trans("readwrite", function(e2) {
          return r2.core.mutate({ trans: e2, type: "delete", keys: t2 });
        }).then(function(e2) {
          var t3 = e2.numFailures, n2 = e2.lastResult, e2 = e2.failures;
          if (0 === t3) return n2;
          throw new V("".concat(r2.name, ".bulkDelete(): ").concat(t3, " of ").concat(i2, " operations failed"), e2);
        });
      }, ht);
      function ht() {
      }
      function dt(i2) {
        function t2(e3, t3) {
          if (t3) {
            for (var n3 = arguments.length, r2 = new Array(n3 - 1); --n3; ) r2[n3 - 1] = arguments[n3];
            return a2[e3].subscribe.apply(null, r2), i2;
          }
          if ("string" == typeof e3) return a2[e3];
        }
        var a2 = {};
        t2.addEventType = u2;
        for (var e2 = 1, n2 = arguments.length; e2 < n2; ++e2) u2(arguments[e2]);
        return t2;
        function u2(e3, n3, r2) {
          if ("object" != typeof e3) {
            var i3;
            n3 = n3 || ne;
            var o2 = { subscribers: [], fire: r2 = r2 || G, subscribe: function(e4) {
              -1 === o2.subscribers.indexOf(e4) && (o2.subscribers.push(e4), o2.fire = n3(o2.fire, e4));
            }, unsubscribe: function(t3) {
              o2.subscribers = o2.subscribers.filter(function(e4) {
                return e4 !== t3;
              }), o2.fire = o2.subscribers.reduce(n3, r2);
            } };
            return a2[e3] = t2[e3] = o2;
          }
          x(i3 = e3).forEach(function(e4) {
            var t3 = i3[e4];
            if (k(t3)) u2(e4, i3[e4][0], i3[e4][1]);
            else {
              if ("asap" !== t3) throw new Y.InvalidArgument("Invalid event config");
              var n4 = u2(e4, X, function() {
                for (var e5 = arguments.length, t4 = new Array(e5); e5--; ) t4[e5] = arguments[e5];
                n4.subscribers.forEach(function(e6) {
                  v(function() {
                    e6.apply(null, t4);
                  });
                });
              });
            }
          });
        }
      }
      function pt(e2, t2) {
        return o(t2).from({ prototype: e2 }), t2;
      }
      function yt(e2, t2) {
        return !(e2.filter || e2.algorithm || e2.or) && (t2 ? e2.justLimit : !e2.replayFilter);
      }
      function vt(e2, t2) {
        e2.filter = it(e2.filter, t2);
      }
      function mt(e2, t2, n2) {
        var r2 = e2.replayFilter;
        e2.replayFilter = r2 ? function() {
          return it(r2(), t2());
        } : t2, e2.justLimit = n2 && !r2;
      }
      function bt(e2, t2) {
        if (e2.isPrimKey) return t2.primaryKey;
        var n2 = t2.getIndexByKeyPath(e2.index);
        if (!n2) throw new Y.Schema("KeyPath " + e2.index + " on object store " + t2.name + " is not indexed");
        return n2;
      }
      function gt(e2, t2, n2) {
        var r2 = bt(e2, t2.schema);
        return t2.openCursor({ trans: n2, values: !e2.keysOnly, reverse: "prev" === e2.dir, unique: !!e2.unique, query: { index: r2, range: e2.range } });
      }
      function wt(e2, o2, t2, n2) {
        var a2 = e2.replayFilter ? it(e2.filter, e2.replayFilter()) : e2.filter;
        if (e2.or) {
          var u2 = {}, r2 = function(e3, t3, n3) {
            var r3, i2;
            a2 && !a2(t3, n3, function(e4) {
              return t3.stop(e4);
            }, function(e4) {
              return t3.fail(e4);
            }) || ("[object ArrayBuffer]" === (i2 = "" + (r3 = t3.primaryKey)) && (i2 = "" + new Uint8Array(r3)), m(u2, i2) || (u2[i2] = true, o2(e3, t3, n3)));
          };
          return Promise.all([e2.or._iterate(r2, t2), _t(gt(e2, n2, t2), e2.algorithm, r2, !e2.keysOnly && e2.valueMapper)]);
        }
        return _t(gt(e2, n2, t2), it(e2.algorithm, a2), o2, !e2.keysOnly && e2.valueMapper);
      }
      function _t(e2, r2, i2, o2) {
        var a2 = qe(o2 ? function(e3, t2, n2) {
          return i2(o2(e3), t2, n2);
        } : i2);
        return e2.then(function(n2) {
          if (n2) return n2.start(function() {
            var t2 = function() {
              return n2.continue();
            };
            r2 && !r2(n2, function(e3) {
              return t2 = e3;
            }, function(e3) {
              n2.stop(e3), t2 = G;
            }, function(e3) {
              n2.fail(e3), t2 = G;
            }) || a2(n2.value, n2, function(e3) {
              return t2 = e3;
            }), t2();
          });
        });
      }
      var e = Symbol(), xt = (kt.prototype.execute = function(e2) {
        if (void 0 !== this.add) {
          var t2 = this.add;
          if (k(t2)) return i(i([], k(e2) ? e2 : [], true), t2).sort();
          if ("number" == typeof t2) return (Number(e2) || 0) + t2;
          if ("bigint" == typeof t2) try {
            return BigInt(e2) + t2;
          } catch (e3) {
            return BigInt(0) + t2;
          }
          throw new TypeError("Invalid term ".concat(t2));
        }
        if (void 0 !== this.remove) {
          var n2 = this.remove;
          if (k(n2)) return k(e2) ? e2.filter(function(e3) {
            return !n2.includes(e3);
          }).sort() : [];
          if ("number" == typeof n2) return Number(e2) - n2;
          if ("bigint" == typeof n2) try {
            return BigInt(e2) - n2;
          } catch (e3) {
            return BigInt(0) - n2;
          }
          throw new TypeError("Invalid subtrahend ".concat(n2));
        }
        t2 = null === (t2 = this.replacePrefix) || void 0 === t2 ? void 0 : t2[0];
        return t2 && "string" == typeof e2 && e2.startsWith(t2) ? this.replacePrefix[1] + e2.substring(t2.length) : e2;
      }, kt);
      function kt(e2) {
        Object.assign(this, e2);
      }
      var Ot = (Pt.prototype._read = function(e2, t2) {
        var n2 = this._ctx;
        return n2.error ? n2.table._trans(null, Xe.bind(null, n2.error)) : n2.table._trans("readonly", e2).then(t2);
      }, Pt.prototype._write = function(e2) {
        var t2 = this._ctx;
        return t2.error ? t2.table._trans(null, Xe.bind(null, t2.error)) : t2.table._trans("readwrite", e2, "locked");
      }, Pt.prototype._addAlgorithm = function(e2) {
        var t2 = this._ctx;
        t2.algorithm = it(t2.algorithm, e2);
      }, Pt.prototype._iterate = function(e2, t2) {
        return wt(this._ctx, e2, t2, this._ctx.table.core);
      }, Pt.prototype.clone = function(e2) {
        var t2 = Object.create(this.constructor.prototype), n2 = Object.create(this._ctx);
        return e2 && a(n2, e2), t2._ctx = n2, t2;
      }, Pt.prototype.raw = function() {
        return this._ctx.valueMapper = null, this;
      }, Pt.prototype.each = function(t2) {
        var n2 = this._ctx;
        return this._read(function(e2) {
          return wt(n2, t2, e2, n2.table.core);
        });
      }, Pt.prototype.count = function(e2) {
        var i2 = this;
        return this._read(function(e3) {
          var t2 = i2._ctx, n2 = t2.table.core;
          if (yt(t2, true)) return n2.count({ trans: e3, query: { index: bt(t2, n2.schema), range: t2.range } }).then(function(e4) {
            return Math.min(e4, t2.limit);
          });
          var r2 = 0;
          return wt(t2, function() {
            return ++r2, false;
          }, e3, n2).then(function() {
            return r2;
          });
        }).then(e2);
      }, Pt.prototype.sortBy = function(e2, t2) {
        var n2 = e2.split(".").reverse(), r2 = n2[0], i2 = n2.length - 1;
        function o2(e3, t3) {
          return t3 ? o2(e3[n2[t3]], t3 - 1) : e3[r2];
        }
        var a2 = "next" === this._ctx.dir ? 1 : -1;
        function u2(e3, t3) {
          return st(o2(e3, i2), o2(t3, i2)) * a2;
        }
        return this.toArray(function(e3) {
          return e3.sort(u2);
        }).then(t2);
      }, Pt.prototype.toArray = function(e2) {
        var o2 = this;
        return this._read(function(e3) {
          var t2 = o2._ctx;
          if ("next" === t2.dir && yt(t2, true) && 0 < t2.limit) {
            var n2 = t2.valueMapper, r2 = bt(t2, t2.table.core.schema);
            return t2.table.core.query({ trans: e3, limit: t2.limit, values: true, query: { index: r2, range: t2.range } }).then(function(e4) {
              e4 = e4.result;
              return n2 ? e4.map(n2) : e4;
            });
          }
          var i2 = [];
          return wt(t2, function(e4) {
            return i2.push(e4);
          }, e3, t2.table.core).then(function() {
            return i2;
          });
        }, e2);
      }, Pt.prototype.offset = function(t2) {
        var e2 = this._ctx;
        return t2 <= 0 || (e2.offset += t2, yt(e2) ? mt(e2, function() {
          var n2 = t2;
          return function(e3, t3) {
            return 0 === n2 || (1 === n2 ? --n2 : t3(function() {
              e3.advance(n2), n2 = 0;
            }), false);
          };
        }) : mt(e2, function() {
          var e3 = t2;
          return function() {
            return --e3 < 0;
          };
        })), this;
      }, Pt.prototype.limit = function(e2) {
        return this._ctx.limit = Math.min(this._ctx.limit, e2), mt(this._ctx, function() {
          var r2 = e2;
          return function(e3, t2, n2) {
            return --r2 <= 0 && t2(n2), 0 <= r2;
          };
        }, true), this;
      }, Pt.prototype.until = function(r2, i2) {
        return vt(this._ctx, function(e2, t2, n2) {
          return !r2(e2.value) || (t2(n2), i2);
        }), this;
      }, Pt.prototype.first = function(e2) {
        return this.limit(1).toArray(function(e3) {
          return e3[0];
        }).then(e2);
      }, Pt.prototype.last = function(e2) {
        return this.reverse().first(e2);
      }, Pt.prototype.filter = function(t2) {
        var e2;
        return vt(this._ctx, function(e3) {
          return t2(e3.value);
        }), (e2 = this._ctx).isMatch = it(e2.isMatch, t2), this;
      }, Pt.prototype.and = function(e2) {
        return this.filter(e2);
      }, Pt.prototype.or = function(e2) {
        return new this.db.WhereClause(this._ctx.table, e2, this);
      }, Pt.prototype.reverse = function() {
        return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
      }, Pt.prototype.desc = function() {
        return this.reverse();
      }, Pt.prototype.eachKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.key, t2);
        });
      }, Pt.prototype.eachUniqueKey = function(e2) {
        return this._ctx.unique = "unique", this.eachKey(e2);
      }, Pt.prototype.eachPrimaryKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.primaryKey, t2);
        });
      }, Pt.prototype.keys = function(e2) {
        var t2 = this._ctx;
        t2.keysOnly = !t2.isMatch;
        var n2 = [];
        return this.each(function(e3, t3) {
          n2.push(t3.key);
        }).then(function() {
          return n2;
        }).then(e2);
      }, Pt.prototype.primaryKeys = function(e2) {
        var n2 = this._ctx;
        if ("next" === n2.dir && yt(n2, true) && 0 < n2.limit) return this._read(function(e3) {
          var t2 = bt(n2, n2.table.core.schema);
          return n2.table.core.query({ trans: e3, values: false, limit: n2.limit, query: { index: t2, range: n2.range } });
        }).then(function(e3) {
          return e3.result;
        }).then(e2);
        n2.keysOnly = !n2.isMatch;
        var r2 = [];
        return this.each(function(e3, t2) {
          r2.push(t2.primaryKey);
        }).then(function() {
          return r2;
        }).then(e2);
      }, Pt.prototype.uniqueKeys = function(e2) {
        return this._ctx.unique = "unique", this.keys(e2);
      }, Pt.prototype.firstKey = function(e2) {
        return this.limit(1).keys(function(e3) {
          return e3[0];
        }).then(e2);
      }, Pt.prototype.lastKey = function(e2) {
        return this.reverse().firstKey(e2);
      }, Pt.prototype.distinct = function() {
        var e2 = this._ctx, e2 = e2.index && e2.table.schema.idxByName[e2.index];
        if (!e2 || !e2.multi) return this;
        var n2 = {};
        return vt(this._ctx, function(e3) {
          var t2 = e3.primaryKey.toString(), e3 = m(n2, t2);
          return n2[t2] = true, !e3;
        }), this;
      }, Pt.prototype.modify = function(w2) {
        var n2 = this, r2 = this._ctx;
        return this._write(function(d2) {
          var a2, u2, p2;
          p2 = "function" == typeof w2 ? w2 : (a2 = x(w2), u2 = a2.length, function(e3) {
            for (var t3 = false, n3 = 0; n3 < u2; ++n3) {
              var r3 = a2[n3], i2 = w2[r3], o2 = O(e3, r3);
              i2 instanceof xt ? (P(e3, r3, i2.execute(o2)), t3 = true) : o2 !== i2 && (P(e3, r3, i2), t3 = true);
            }
            return t3;
          });
          var y2 = r2.table.core, e2 = y2.schema.primaryKey, v2 = e2.outbound, m2 = e2.extractKey, b2 = 200, e2 = n2.db._options.modifyChunkSize;
          e2 && (b2 = "object" == typeof e2 ? e2[y2.name] || e2["*"] || 200 : e2);
          function g2(e3, t3) {
            var n3 = t3.failures, t3 = t3.numFailures;
            c2 += e3 - t3;
            for (var r3 = 0, i2 = x(n3); r3 < i2.length; r3++) {
              var o2 = i2[r3];
              s2.push(n3[o2]);
            }
          }
          var s2 = [], c2 = 0, t2 = [];
          return n2.clone().primaryKeys().then(function(l2) {
            function f2(s3) {
              var c3 = Math.min(b2, l2.length - s3);
              return y2.getMany({ trans: d2, keys: l2.slice(s3, s3 + c3), cache: "immutable" }).then(function(e3) {
                for (var n3 = [], t3 = [], r3 = v2 ? [] : null, i2 = [], o2 = 0; o2 < c3; ++o2) {
                  var a3 = e3[o2], u3 = { value: S(a3), primKey: l2[s3 + o2] };
                  false !== p2.call(u3, u3.value, u3) && (null == u3.value ? i2.push(l2[s3 + o2]) : v2 || 0 === st(m2(a3), m2(u3.value)) ? (t3.push(u3.value), v2 && r3.push(l2[s3 + o2])) : (i2.push(l2[s3 + o2]), n3.push(u3.value)));
                }
                return Promise.resolve(0 < n3.length && y2.mutate({ trans: d2, type: "add", values: n3 }).then(function(e4) {
                  for (var t4 in e4.failures) i2.splice(parseInt(t4), 1);
                  g2(n3.length, e4);
                })).then(function() {
                  return (0 < t3.length || h2 && "object" == typeof w2) && y2.mutate({ trans: d2, type: "put", keys: r3, values: t3, criteria: h2, changeSpec: "function" != typeof w2 && w2, isAdditionalChunk: 0 < s3 }).then(function(e4) {
                    return g2(t3.length, e4);
                  });
                }).then(function() {
                  return (0 < i2.length || h2 && w2 === Kt) && y2.mutate({ trans: d2, type: "delete", keys: i2, criteria: h2, isAdditionalChunk: 0 < s3 }).then(function(e4) {
                    return g2(i2.length, e4);
                  });
                }).then(function() {
                  return l2.length > s3 + c3 && f2(s3 + b2);
                });
              });
            }
            var h2 = yt(r2) && r2.limit === 1 / 0 && ("function" != typeof w2 || w2 === Kt) && { index: r2.index, range: r2.range };
            return f2(0).then(function() {
              if (0 < s2.length) throw new U("Error modifying one or more objects", s2, c2, t2);
              return l2.length;
            });
          });
        });
      }, Pt.prototype.delete = function() {
        var i2 = this._ctx, n2 = i2.range;
        return yt(i2) && (i2.isPrimKey || 3 === n2.type) ? this._write(function(e2) {
          var t2 = i2.table.core.schema.primaryKey, r2 = n2;
          return i2.table.core.count({ trans: e2, query: { index: t2, range: r2 } }).then(function(n3) {
            return i2.table.core.mutate({ trans: e2, type: "deleteRange", range: r2 }).then(function(e3) {
              var t3 = e3.failures;
              e3.lastResult, e3.results;
              e3 = e3.numFailures;
              if (e3) throw new U("Could not delete some values", Object.keys(t3).map(function(e4) {
                return t3[e4];
              }), n3 - e3);
              return n3 - e3;
            });
          });
        }) : this.modify(Kt);
      }, Pt);
      function Pt() {
      }
      var Kt = function(e2, t2) {
        return t2.value = null;
      };
      function Et(e2, t2) {
        return e2 < t2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function St(e2, t2) {
        return t2 < e2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function jt(e2, t2, n2) {
        e2 = e2 instanceof Dt ? new e2.Collection(e2) : e2;
        return e2._ctx.error = new (n2 || TypeError)(t2), e2;
      }
      function At(e2) {
        return new e2.Collection(e2, function() {
          return qt("");
        }).limit(0);
      }
      function Ct(e2, s2, n2, r2) {
        var i2, c2, l2, f2, h2, d2, p2, y2 = n2.length;
        if (!n2.every(function(e3) {
          return "string" == typeof e3;
        })) return jt(e2, Ze);
        function t2(e3) {
          i2 = "next" === e3 ? function(e4) {
            return e4.toUpperCase();
          } : function(e4) {
            return e4.toLowerCase();
          }, c2 = "next" === e3 ? function(e4) {
            return e4.toLowerCase();
          } : function(e4) {
            return e4.toUpperCase();
          }, l2 = "next" === e3 ? Et : St;
          var t3 = n2.map(function(e4) {
            return { lower: c2(e4), upper: i2(e4) };
          }).sort(function(e4, t4) {
            return l2(e4.lower, t4.lower);
          });
          f2 = t3.map(function(e4) {
            return e4.upper;
          }), h2 = t3.map(function(e4) {
            return e4.lower;
          }), p2 = "next" === (d2 = e3) ? "" : r2;
        }
        t2("next");
        e2 = new e2.Collection(e2, function() {
          return Tt(f2[0], h2[y2 - 1] + r2);
        });
        e2._ondirectionchange = function(e3) {
          t2(e3);
        };
        var v2 = 0;
        return e2._addAlgorithm(function(e3, t3, n3) {
          var r3 = e3.key;
          if ("string" != typeof r3) return false;
          var i3 = c2(r3);
          if (s2(i3, h2, v2)) return true;
          for (var o2 = null, a2 = v2; a2 < y2; ++a2) {
            var u2 = function(e4, t4, n4, r4, i4, o3) {
              for (var a3 = Math.min(e4.length, r4.length), u3 = -1, s3 = 0; s3 < a3; ++s3) {
                var c3 = t4[s3];
                if (c3 !== r4[s3]) return i4(e4[s3], n4[s3]) < 0 ? e4.substr(0, s3) + n4[s3] + n4.substr(s3 + 1) : i4(e4[s3], r4[s3]) < 0 ? e4.substr(0, s3) + r4[s3] + n4.substr(s3 + 1) : 0 <= u3 ? e4.substr(0, u3) + t4[u3] + n4.substr(u3 + 1) : null;
                i4(e4[s3], c3) < 0 && (u3 = s3);
              }
              return a3 < r4.length && "next" === o3 ? e4 + n4.substr(e4.length) : a3 < e4.length && "prev" === o3 ? e4.substr(0, n4.length) : u3 < 0 ? null : e4.substr(0, u3) + r4[u3] + n4.substr(u3 + 1);
            }(r3, i3, f2[a2], h2[a2], l2, d2);
            null === u2 && null === o2 ? v2 = a2 + 1 : (null === o2 || 0 < l2(o2, u2)) && (o2 = u2);
          }
          return t3(null !== o2 ? function() {
            e3.continue(o2 + p2);
          } : n3), false;
        }), e2;
      }
      function Tt(e2, t2, n2, r2) {
        return { type: 2, lower: e2, upper: t2, lowerOpen: n2, upperOpen: r2 };
      }
      function qt(e2) {
        return { type: 1, lower: e2, upper: e2 };
      }
      var Dt = (Object.defineProperty(It.prototype, "Collection", { get: function() {
        return this._ctx.table.db.Collection;
      }, enumerable: false, configurable: true }), It.prototype.between = function(e2, t2, n2, r2) {
        n2 = false !== n2, r2 = true === r2;
        try {
          return 0 < this._cmp(e2, t2) || 0 === this._cmp(e2, t2) && (n2 || r2) && (!n2 || !r2) ? At(this) : new this.Collection(this, function() {
            return Tt(e2, t2, !n2, !r2);
          });
        } catch (e3) {
          return jt(this, Je);
        }
      }, It.prototype.equals = function(e2) {
        return null == e2 ? jt(this, Je) : new this.Collection(this, function() {
          return qt(e2);
        });
      }, It.prototype.above = function(e2) {
        return null == e2 ? jt(this, Je) : new this.Collection(this, function() {
          return Tt(e2, void 0, true);
        });
      }, It.prototype.aboveOrEqual = function(e2) {
        return null == e2 ? jt(this, Je) : new this.Collection(this, function() {
          return Tt(e2, void 0, false);
        });
      }, It.prototype.below = function(e2) {
        return null == e2 ? jt(this, Je) : new this.Collection(this, function() {
          return Tt(void 0, e2, false, true);
        });
      }, It.prototype.belowOrEqual = function(e2) {
        return null == e2 ? jt(this, Je) : new this.Collection(this, function() {
          return Tt(void 0, e2);
        });
      }, It.prototype.startsWith = function(e2) {
        return "string" != typeof e2 ? jt(this, Ze) : this.between(e2, e2 + He, true, true);
      }, It.prototype.startsWithIgnoreCase = function(e2) {
        return "" === e2 ? this.startsWith(e2) : Ct(this, function(e3, t2) {
          return 0 === e3.indexOf(t2[0]);
        }, [e2], He);
      }, It.prototype.equalsIgnoreCase = function(e2) {
        return Ct(this, function(e3, t2) {
          return e3 === t2[0];
        }, [e2], "");
      }, It.prototype.anyOfIgnoreCase = function() {
        var e2 = I.apply(D, arguments);
        return 0 === e2.length ? At(this) : Ct(this, function(e3, t2) {
          return -1 !== t2.indexOf(e3);
        }, e2, "");
      }, It.prototype.startsWithAnyOfIgnoreCase = function() {
        var e2 = I.apply(D, arguments);
        return 0 === e2.length ? At(this) : Ct(this, function(t2, e3) {
          return e3.some(function(e4) {
            return 0 === t2.indexOf(e4);
          });
        }, e2, He);
      }, It.prototype.anyOf = function() {
        var t2 = this, i2 = I.apply(D, arguments), o2 = this._cmp;
        try {
          i2.sort(o2);
        } catch (e3) {
          return jt(this, Je);
        }
        if (0 === i2.length) return At(this);
        var e2 = new this.Collection(this, function() {
          return Tt(i2[0], i2[i2.length - 1]);
        });
        e2._ondirectionchange = function(e3) {
          o2 = "next" === e3 ? t2._ascending : t2._descending, i2.sort(o2);
        };
        var a2 = 0;
        return e2._addAlgorithm(function(e3, t3, n2) {
          for (var r2 = e3.key; 0 < o2(r2, i2[a2]); ) if (++a2 === i2.length) return t3(n2), false;
          return 0 === o2(r2, i2[a2]) || (t3(function() {
            e3.continue(i2[a2]);
          }), false);
        }), e2;
      }, It.prototype.notEqual = function(e2) {
        return this.inAnyRange([[-1 / 0, e2], [e2, this.db._maxKey]], { includeLowers: false, includeUppers: false });
      }, It.prototype.noneOf = function() {
        var e2 = I.apply(D, arguments);
        if (0 === e2.length) return new this.Collection(this);
        try {
          e2.sort(this._ascending);
        } catch (e3) {
          return jt(this, Je);
        }
        var t2 = e2.reduce(function(e3, t3) {
          return e3 ? e3.concat([[e3[e3.length - 1][1], t3]]) : [[-1 / 0, t3]];
        }, null);
        return t2.push([e2[e2.length - 1], this.db._maxKey]), this.inAnyRange(t2, { includeLowers: false, includeUppers: false });
      }, It.prototype.inAnyRange = function(e2, t2) {
        var o2 = this, a2 = this._cmp, u2 = this._ascending, n2 = this._descending, s2 = this._min, c2 = this._max;
        if (0 === e2.length) return At(this);
        if (!e2.every(function(e3) {
          return void 0 !== e3[0] && void 0 !== e3[1] && u2(e3[0], e3[1]) <= 0;
        })) return jt(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", Y.InvalidArgument);
        var r2 = !t2 || false !== t2.includeLowers, i2 = t2 && true === t2.includeUppers;
        var l2, f2 = u2;
        function h2(e3, t3) {
          return f2(e3[0], t3[0]);
        }
        try {
          (l2 = e2.reduce(function(e3, t3) {
            for (var n3 = 0, r3 = e3.length; n3 < r3; ++n3) {
              var i3 = e3[n3];
              if (a2(t3[0], i3[1]) < 0 && 0 < a2(t3[1], i3[0])) {
                i3[0] = s2(i3[0], t3[0]), i3[1] = c2(i3[1], t3[1]);
                break;
              }
            }
            return n3 === r3 && e3.push(t3), e3;
          }, [])).sort(h2);
        } catch (e3) {
          return jt(this, Je);
        }
        var d2 = 0, p2 = i2 ? function(e3) {
          return 0 < u2(e3, l2[d2][1]);
        } : function(e3) {
          return 0 <= u2(e3, l2[d2][1]);
        }, y2 = r2 ? function(e3) {
          return 0 < n2(e3, l2[d2][0]);
        } : function(e3) {
          return 0 <= n2(e3, l2[d2][0]);
        };
        var v2 = p2, e2 = new this.Collection(this, function() {
          return Tt(l2[0][0], l2[l2.length - 1][1], !r2, !i2);
        });
        return e2._ondirectionchange = function(e3) {
          f2 = "next" === e3 ? (v2 = p2, u2) : (v2 = y2, n2), l2.sort(h2);
        }, e2._addAlgorithm(function(e3, t3, n3) {
          for (var r3, i3 = e3.key; v2(i3); ) if (++d2 === l2.length) return t3(n3), false;
          return !p2(r3 = i3) && !y2(r3) || (0 === o2._cmp(i3, l2[d2][1]) || 0 === o2._cmp(i3, l2[d2][0]) || t3(function() {
            f2 === u2 ? e3.continue(l2[d2][0]) : e3.continue(l2[d2][1]);
          }), false);
        }), e2;
      }, It.prototype.startsWithAnyOf = function() {
        var e2 = I.apply(D, arguments);
        return e2.every(function(e3) {
          return "string" == typeof e3;
        }) ? 0 === e2.length ? At(this) : this.inAnyRange(e2.map(function(e3) {
          return [e3, e3 + He];
        })) : jt(this, "startsWithAnyOf() only works with strings");
      }, It);
      function It() {
      }
      function Bt(t2) {
        return qe(function(e2) {
          return Rt(e2), t2(e2.target.error), false;
        });
      }
      function Rt(e2) {
        e2.stopPropagation && e2.stopPropagation(), e2.preventDefault && e2.preventDefault();
      }
      var Mt = "storagemutated", Ft = "x-storagemutated-1", Nt = dt(null, Mt), Lt = (Ut.prototype._lock = function() {
        return y(!me.global), ++this._reculock, 1 !== this._reculock || me.global || (me.lockOwnerFor = this), this;
      }, Ut.prototype._unlock = function() {
        if (y(!me.global), 0 == --this._reculock) for (me.global || (me.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
          var e2 = this._blockedFuncs.shift();
          try {
            $e(e2[1], e2[0]);
          } catch (e3) {
          }
        }
        return this;
      }, Ut.prototype._locked = function() {
        return this._reculock && me.lockOwnerFor !== this;
      }, Ut.prototype.create = function(t2) {
        var n2 = this;
        if (!this.mode) return this;
        var e2 = this.db.idbdb, r2 = this.db._state.dbOpenError;
        if (y(!this.idbtrans), !t2 && !e2) switch (r2 && r2.name) {
          case "DatabaseClosedError":
            throw new Y.DatabaseClosed(r2);
          case "MissingAPIError":
            throw new Y.MissingAPI(r2.message, r2);
          default:
            throw new Y.OpenFailed(r2);
        }
        if (!this.active) throw new Y.TransactionInactive();
        return y(null === this._completion._state), (t2 = this.idbtrans = t2 || (this.db.core || e2).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = qe(function(e3) {
          Rt(e3), n2._reject(t2.error);
        }), t2.onabort = qe(function(e3) {
          Rt(e3), n2.active && n2._reject(new Y.Abort(t2.error)), n2.active = false, n2.on("abort").fire(e3);
        }), t2.oncomplete = qe(function() {
          n2.active = false, n2._resolve(), "mutatedParts" in t2 && Nt.storagemutated.fire(t2.mutatedParts);
        }), this;
      }, Ut.prototype._promise = function(n2, r2, i2) {
        var o2 = this;
        if ("readwrite" === n2 && "readwrite" !== this.mode) return Xe(new Y.ReadOnly("Transaction is readonly"));
        if (!this.active) return Xe(new Y.TransactionInactive());
        if (this._locked()) return new _e(function(e3, t2) {
          o2._blockedFuncs.push([function() {
            o2._promise(n2, r2, i2).then(e3, t2);
          }, me]);
        });
        if (i2) return Ne(function() {
          var e3 = new _e(function(e4, t2) {
            o2._lock();
            var n3 = r2(e4, t2, o2);
            n3 && n3.then && n3.then(e4, t2);
          });
          return e3.finally(function() {
            return o2._unlock();
          }), e3._lib = true, e3;
        });
        var e2 = new _e(function(e3, t2) {
          var n3 = r2(e3, t2, o2);
          n3 && n3.then && n3.then(e3, t2);
        });
        return e2._lib = true, e2;
      }, Ut.prototype._root = function() {
        return this.parent ? this.parent._root() : this;
      }, Ut.prototype.waitFor = function(e2) {
        var t2, r2 = this._root(), i2 = _e.resolve(e2);
        r2._waitingFor ? r2._waitingFor = r2._waitingFor.then(function() {
          return i2;
        }) : (r2._waitingFor = i2, r2._waitingQueue = [], t2 = r2.idbtrans.objectStore(r2.storeNames[0]), function e3() {
          for (++r2._spinCount; r2._waitingQueue.length; ) r2._waitingQueue.shift()();
          r2._waitingFor && (t2.get(-1 / 0).onsuccess = e3);
        }());
        var o2 = r2._waitingFor;
        return new _e(function(t3, n2) {
          i2.then(function(e3) {
            return r2._waitingQueue.push(qe(t3.bind(null, e3)));
          }, function(e3) {
            return r2._waitingQueue.push(qe(n2.bind(null, e3)));
          }).finally(function() {
            r2._waitingFor === o2 && (r2._waitingFor = null);
          });
        });
      }, Ut.prototype.abort = function() {
        this.active && (this.active = false, this.idbtrans && this.idbtrans.abort(), this._reject(new Y.Abort()));
      }, Ut.prototype.table = function(e2) {
        var t2 = this._memoizedTables || (this._memoizedTables = {});
        if (m(t2, e2)) return t2[e2];
        var n2 = this.schema[e2];
        if (!n2) throw new Y.NotFound("Table " + e2 + " not part of transaction");
        n2 = new this.db.Table(e2, n2, this);
        return n2.core = this.db.core.table(e2), t2[e2] = n2;
      }, Ut);
      function Ut() {
      }
      function Vt(e2, t2, n2, r2, i2, o2, a2) {
        return { name: e2, keyPath: t2, unique: n2, multi: r2, auto: i2, compound: o2, src: (n2 && !a2 ? "&" : "") + (r2 ? "*" : "") + (i2 ? "++" : "") + zt(t2) };
      }
      function zt(e2) {
        return "string" == typeof e2 ? e2 : e2 ? "[" + [].join.call(e2, "+") + "]" : "";
      }
      function Wt(e2, t2, n2) {
        return { name: e2, primKey: t2, indexes: n2, mappedClass: null, idxByName: (r2 = function(e3) {
          return [e3.name, e3];
        }, n2.reduce(function(e3, t3, n3) {
          n3 = r2(t3, n3);
          return n3 && (e3[n3[0]] = n3[1]), e3;
        }, {})) };
        var r2;
      }
      var Yt = function(e2) {
        try {
          return e2.only([[]]), Yt = function() {
            return [[]];
          }, [[]];
        } catch (e3) {
          return Yt = function() {
            return He;
          }, He;
        }
      };
      function $t(t2) {
        return null == t2 ? function() {
        } : "string" == typeof t2 ? 1 === (n2 = t2).split(".").length ? function(e2) {
          return e2[n2];
        } : function(e2) {
          return O(e2, n2);
        } : function(e2) {
          return O(e2, t2);
        };
        var n2;
      }
      function Qt(e2) {
        return [].slice.call(e2);
      }
      var Gt = 0;
      function Xt(e2) {
        return null == e2 ? ":id" : "string" == typeof e2 ? e2 : "[".concat(e2.join("+"), "]");
      }
      function Ht(e2, i2, t2) {
        function _2(e3) {
          if (3 === e3.type) return null;
          if (4 === e3.type) throw new Error("Cannot convert never type to IDBKeyRange");
          var t3 = e3.lower, n3 = e3.upper, r3 = e3.lowerOpen, e3 = e3.upperOpen;
          return void 0 === t3 ? void 0 === n3 ? null : i2.upperBound(n3, !!e3) : void 0 === n3 ? i2.lowerBound(t3, !!r3) : i2.bound(t3, n3, !!r3, !!e3);
        }
        function n2(e3) {
          var h2, w2 = e3.name;
          return { name: w2, schema: e3, mutate: function(e4) {
            var y2 = e4.trans, v2 = e4.type, m2 = e4.keys, b2 = e4.values, g2 = e4.range;
            return new Promise(function(t3, e5) {
              t3 = qe(t3);
              var n3 = y2.objectStore(w2), r3 = null == n3.keyPath, i3 = "put" === v2 || "add" === v2;
              if (!i3 && "delete" !== v2 && "deleteRange" !== v2) throw new Error("Invalid operation type: " + v2);
              var o3, a3 = (m2 || b2 || { length: 1 }).length;
              if (m2 && b2 && m2.length !== b2.length) throw new Error("Given keys array must have same length as given values array.");
              if (0 === a3) return t3({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
              function u3(e6) {
                ++l2, Rt(e6);
              }
              var s3 = [], c3 = [], l2 = 0;
              if ("deleteRange" === v2) {
                if (4 === g2.type) return t3({ numFailures: l2, failures: c3, results: [], lastResult: void 0 });
                3 === g2.type ? s3.push(o3 = n3.clear()) : s3.push(o3 = n3.delete(_2(g2)));
              } else {
                var r3 = i3 ? r3 ? [b2, m2] : [b2, null] : [m2, null], f2 = r3[0], h3 = r3[1];
                if (i3) for (var d2 = 0; d2 < a3; ++d2) s3.push(o3 = h3 && void 0 !== h3[d2] ? n3[v2](f2[d2], h3[d2]) : n3[v2](f2[d2])), o3.onerror = u3;
                else for (d2 = 0; d2 < a3; ++d2) s3.push(o3 = n3[v2](f2[d2])), o3.onerror = u3;
              }
              function p2(e6) {
                e6 = e6.target.result, s3.forEach(function(e7, t4) {
                  return null != e7.error && (c3[t4] = e7.error);
                }), t3({ numFailures: l2, failures: c3, results: "delete" === v2 ? m2 : s3.map(function(e7) {
                  return e7.result;
                }), lastResult: e6 });
              }
              o3.onerror = function(e6) {
                u3(e6), p2(e6);
              }, o3.onsuccess = p2;
            });
          }, getMany: function(e4) {
            var f2 = e4.trans, h3 = e4.keys;
            return new Promise(function(t3, e5) {
              t3 = qe(t3);
              for (var n3, r3 = f2.objectStore(w2), i3 = h3.length, o3 = new Array(i3), a3 = 0, u3 = 0, s3 = function(e6) {
                e6 = e6.target;
                o3[e6._pos] = e6.result, ++u3 === a3 && t3(o3);
              }, c3 = Bt(e5), l2 = 0; l2 < i3; ++l2) null != h3[l2] && ((n3 = r3.get(h3[l2]))._pos = l2, n3.onsuccess = s3, n3.onerror = c3, ++a3);
              0 === a3 && t3(o3);
            });
          }, get: function(e4) {
            var r3 = e4.trans, i3 = e4.key;
            return new Promise(function(t3, e5) {
              t3 = qe(t3);
              var n3 = r3.objectStore(w2).get(i3);
              n3.onsuccess = function(e6) {
                return t3(e6.target.result);
              }, n3.onerror = Bt(e5);
            });
          }, query: (h2 = s2, function(f2) {
            return new Promise(function(n3, e4) {
              n3 = qe(n3);
              var r3, i3, o3, t3 = f2.trans, a3 = f2.values, u3 = f2.limit, s3 = f2.query, c3 = u3 === 1 / 0 ? void 0 : u3, l2 = s3.index, s3 = s3.range, t3 = t3.objectStore(w2), l2 = l2.isPrimaryKey ? t3 : t3.index(l2.name), s3 = _2(s3);
              if (0 === u3) return n3({ result: [] });
              h2 ? ((c3 = a3 ? l2.getAll(s3, c3) : l2.getAllKeys(s3, c3)).onsuccess = function(e5) {
                return n3({ result: e5.target.result });
              }, c3.onerror = Bt(e4)) : (r3 = 0, i3 = !a3 && "openKeyCursor" in l2 ? l2.openKeyCursor(s3) : l2.openCursor(s3), o3 = [], i3.onsuccess = function(e5) {
                var t4 = i3.result;
                return t4 ? (o3.push(a3 ? t4.value : t4.primaryKey), ++r3 === u3 ? n3({ result: o3 }) : void t4.continue()) : n3({ result: o3 });
              }, i3.onerror = Bt(e4));
            });
          }), openCursor: function(e4) {
            var c3 = e4.trans, o3 = e4.values, a3 = e4.query, u3 = e4.reverse, l2 = e4.unique;
            return new Promise(function(t3, n3) {
              t3 = qe(t3);
              var e5 = a3.index, r3 = a3.range, i3 = c3.objectStore(w2), i3 = e5.isPrimaryKey ? i3 : i3.index(e5.name), e5 = u3 ? l2 ? "prevunique" : "prev" : l2 ? "nextunique" : "next", s3 = !o3 && "openKeyCursor" in i3 ? i3.openKeyCursor(_2(r3), e5) : i3.openCursor(_2(r3), e5);
              s3.onerror = Bt(n3), s3.onsuccess = qe(function(e6) {
                var r4, i4, o4, a4, u4 = s3.result;
                u4 ? (u4.___id = ++Gt, u4.done = false, r4 = u4.continue.bind(u4), i4 = (i4 = u4.continuePrimaryKey) && i4.bind(u4), o4 = u4.advance.bind(u4), a4 = function() {
                  throw new Error("Cursor not stopped");
                }, u4.trans = c3, u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = function() {
                  throw new Error("Cursor not started");
                }, u4.fail = qe(n3), u4.next = function() {
                  var e7 = this, t4 = 1;
                  return this.start(function() {
                    return t4-- ? e7.continue() : e7.stop();
                  }).then(function() {
                    return e7;
                  });
                }, u4.start = function(e7) {
                  function t4() {
                    if (s3.result) try {
                      e7();
                    } catch (e8) {
                      u4.fail(e8);
                    }
                    else u4.done = true, u4.start = function() {
                      throw new Error("Cursor behind last entry");
                    }, u4.stop();
                  }
                  var n4 = new Promise(function(t5, e8) {
                    t5 = qe(t5), s3.onerror = Bt(e8), u4.fail = e8, u4.stop = function(e9) {
                      u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = a4, t5(e9);
                    };
                  });
                  return s3.onsuccess = qe(function(e8) {
                    s3.onsuccess = t4, t4();
                  }), u4.continue = r4, u4.continuePrimaryKey = i4, u4.advance = o4, t4(), n4;
                }, t3(u4)) : t3(null);
              }, n3);
            });
          }, count: function(e4) {
            var t3 = e4.query, i3 = e4.trans, o3 = t3.index, a3 = t3.range;
            return new Promise(function(t4, e5) {
              var n3 = i3.objectStore(w2), r3 = o3.isPrimaryKey ? n3 : n3.index(o3.name), n3 = _2(a3), r3 = n3 ? r3.count(n3) : r3.count();
              r3.onsuccess = qe(function(e6) {
                return t4(e6.target.result);
              }), r3.onerror = Bt(e5);
            });
          } };
        }
        var r2, o2, a2, u2 = (o2 = t2, a2 = Qt((r2 = e2).objectStoreNames), { schema: { name: r2.name, tables: a2.map(function(e3) {
          return o2.objectStore(e3);
        }).map(function(t3) {
          var e3 = t3.keyPath, n3 = t3.autoIncrement, r3 = k(e3), i3 = {}, n3 = { name: t3.name, primaryKey: { name: null, isPrimaryKey: true, outbound: null == e3, compound: r3, keyPath: e3, autoIncrement: n3, unique: true, extractKey: $t(e3) }, indexes: Qt(t3.indexNames).map(function(e4) {
            return t3.index(e4);
          }).map(function(e4) {
            var t4 = e4.name, n4 = e4.unique, r4 = e4.multiEntry, e4 = e4.keyPath, r4 = { name: t4, compound: k(e4), keyPath: e4, unique: n4, multiEntry: r4, extractKey: $t(e4) };
            return i3[Xt(e4)] = r4;
          }), getIndexByKeyPath: function(e4) {
            return i3[Xt(e4)];
          } };
          return i3[":id"] = n3.primaryKey, null != e3 && (i3[Xt(e3)] = n3.primaryKey), n3;
        }) }, hasGetAll: 0 < a2.length && "getAll" in o2.objectStore(a2[0]) && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) }), t2 = u2.schema, s2 = u2.hasGetAll, u2 = t2.tables.map(n2), c2 = {};
        return u2.forEach(function(e3) {
          return c2[e3.name] = e3;
        }), { stack: "dbcore", transaction: e2.transaction.bind(e2), table: function(e3) {
          if (!c2[e3]) throw new Error("Table '".concat(e3, "' not found"));
          return c2[e3];
        }, MIN_KEY: -1 / 0, MAX_KEY: Yt(i2), schema: t2 };
      }
      function Jt(e2, t2, n2, r2) {
        var i2 = n2.IDBKeyRange;
        return n2.indexedDB, { dbcore: (r2 = Ht(t2, i2, r2), e2.dbcore.reduce(function(e3, t3) {
          t3 = t3.create;
          return _(_({}, e3), t3(e3));
        }, r2)) };
      }
      function Zt(n2, e2) {
        var t2 = e2.db, e2 = Jt(n2._middlewares, t2, n2._deps, e2);
        n2.core = e2.dbcore, n2.tables.forEach(function(e3) {
          var t3 = e3.name;
          n2.core.schema.tables.some(function(e4) {
            return e4.name === t3;
          }) && (e3.core = n2.core.table(t3), n2[t3] instanceof n2.Table && (n2[t3].core = e3.core));
        });
      }
      function en(i2, e2, t2, o2) {
        t2.forEach(function(n2) {
          var r2 = o2[n2];
          e2.forEach(function(e3) {
            var t3 = function e4(t4, n3) {
              return h(t4, n3) || (t4 = c(t4)) && e4(t4, n3);
            }(e3, n2);
            (!t3 || "value" in t3 && void 0 === t3.value) && (e3 === i2.Transaction.prototype || e3 instanceof i2.Transaction ? l(e3, n2, { get: function() {
              return this.table(n2);
            }, set: function(e4) {
              u(this, n2, { value: e4, writable: true, configurable: true, enumerable: true });
            } }) : e3[n2] = new i2.Table(n2, r2));
          });
        });
      }
      function tn(n2, e2) {
        e2.forEach(function(e3) {
          for (var t2 in e3) e3[t2] instanceof n2.Table && delete e3[t2];
        });
      }
      function nn(e2, t2) {
        return e2._cfg.version - t2._cfg.version;
      }
      function rn(n2, r2, i2, e2) {
        var o2 = n2._dbSchema;
        i2.objectStoreNames.contains("$meta") && !o2.$meta && (o2.$meta = Wt("$meta", hn("")[0], []), n2._storeNames.push("$meta"));
        var a2 = n2._createTransaction("readwrite", n2._storeNames, o2);
        a2.create(i2), a2._completion.catch(e2);
        var u2 = a2._reject.bind(a2), s2 = me.transless || me;
        Ne(function() {
          return me.trans = a2, me.transless = s2, 0 !== r2 ? (Zt(n2, i2), t2 = r2, ((e3 = a2).storeNames.includes("$meta") ? e3.table("$meta").get("version").then(function(e4) {
            return null != e4 ? e4 : t2;
          }) : _e.resolve(t2)).then(function(e4) {
            return c2 = e4, l2 = a2, f2 = i2, t3 = [], e4 = (s3 = n2)._versions, h2 = s3._dbSchema = ln(0, s3.idbdb, f2), 0 !== (e4 = e4.filter(function(e5) {
              return e5._cfg.version >= c2;
            })).length ? (e4.forEach(function(u3) {
              t3.push(function() {
                var t4 = h2, e5 = u3._cfg.dbschema;
                fn(s3, t4, f2), fn(s3, e5, f2), h2 = s3._dbSchema = e5;
                var n3 = an(t4, e5);
                n3.add.forEach(function(e6) {
                  un(f2, e6[0], e6[1].primKey, e6[1].indexes);
                }), n3.change.forEach(function(e6) {
                  if (e6.recreate) throw new Y.Upgrade("Not yet support for changing primary key");
                  var t5 = f2.objectStore(e6.name);
                  e6.add.forEach(function(e7) {
                    return cn(t5, e7);
                  }), e6.change.forEach(function(e7) {
                    t5.deleteIndex(e7.name), cn(t5, e7);
                  }), e6.del.forEach(function(e7) {
                    return t5.deleteIndex(e7);
                  });
                });
                var r3 = u3._cfg.contentUpgrade;
                if (r3 && u3._cfg.version > c2) {
                  Zt(s3, f2), l2._memoizedTables = {};
                  var i3 = g(e5);
                  n3.del.forEach(function(e6) {
                    i3[e6] = t4[e6];
                  }), tn(s3, [s3.Transaction.prototype]), en(s3, [s3.Transaction.prototype], x(i3), i3), l2.schema = i3;
                  var o3, a3 = B(r3);
                  a3 && Le();
                  n3 = _e.follow(function() {
                    var e6;
                    (o3 = r3(l2)) && a3 && (e6 = Ue.bind(null, null), o3.then(e6, e6));
                  });
                  return o3 && "function" == typeof o3.then ? _e.resolve(o3) : n3.then(function() {
                    return o3;
                  });
                }
              }), t3.push(function(e5) {
                var t4, n3, r3 = u3._cfg.dbschema;
                t4 = r3, n3 = e5, [].slice.call(n3.db.objectStoreNames).forEach(function(e6) {
                  return null == t4[e6] && n3.db.deleteObjectStore(e6);
                }), tn(s3, [s3.Transaction.prototype]), en(s3, [s3.Transaction.prototype], s3._storeNames, s3._dbSchema), l2.schema = s3._dbSchema;
              }), t3.push(function(e5) {
                s3.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s3.idbdb.version / 10) === u3._cfg.version ? (s3.idbdb.deleteObjectStore("$meta"), delete s3._dbSchema.$meta, s3._storeNames = s3._storeNames.filter(function(e6) {
                  return "$meta" !== e6;
                })) : e5.objectStore("$meta").put(u3._cfg.version, "version"));
              });
            }), function e5() {
              return t3.length ? _e.resolve(t3.shift()(l2.idbtrans)).then(e5) : _e.resolve();
            }().then(function() {
              sn(h2, f2);
            })) : _e.resolve();
            var s3, c2, l2, f2, t3, h2;
          }).catch(u2)) : (x(o2).forEach(function(e4) {
            un(i2, e4, o2[e4].primKey, o2[e4].indexes);
          }), Zt(n2, i2), void _e.follow(function() {
            return n2.on.populate.fire(a2);
          }).catch(u2));
          var e3, t2;
        });
      }
      function on(e2, r2) {
        sn(e2._dbSchema, r2), r2.db.version % 10 != 0 || r2.objectStoreNames.contains("$meta") || r2.db.createObjectStore("$meta").add(Math.ceil(r2.db.version / 10 - 1), "version");
        var t2 = ln(0, e2.idbdb, r2);
        fn(e2, e2._dbSchema, r2);
        for (var n2 = 0, i2 = an(t2, e2._dbSchema).change; n2 < i2.length; n2++) {
          var o2 = function(t3) {
            if (t3.change.length || t3.recreate) return console.warn("Unable to patch indexes of table ".concat(t3.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
            var n3 = r2.objectStore(t3.name);
            t3.add.forEach(function(e3) {
              ie && console.debug("Dexie upgrade patch: Creating missing index ".concat(t3.name, ".").concat(e3.src)), cn(n3, e3);
            });
          }(i2[n2]);
          if ("object" == typeof o2) return o2.value;
        }
      }
      function an(e2, t2) {
        var n2, r2 = { del: [], add: [], change: [] };
        for (n2 in e2) t2[n2] || r2.del.push(n2);
        for (n2 in t2) {
          var i2 = e2[n2], o2 = t2[n2];
          if (i2) {
            var a2 = { name: n2, def: o2, recreate: false, del: [], add: [], change: [] };
            if ("" + (i2.primKey.keyPath || "") != "" + (o2.primKey.keyPath || "") || i2.primKey.auto !== o2.primKey.auto) a2.recreate = true, r2.change.push(a2);
            else {
              var u2 = i2.idxByName, s2 = o2.idxByName, c2 = void 0;
              for (c2 in u2) s2[c2] || a2.del.push(c2);
              for (c2 in s2) {
                var l2 = u2[c2], f2 = s2[c2];
                l2 ? l2.src !== f2.src && a2.change.push(f2) : a2.add.push(f2);
              }
              (0 < a2.del.length || 0 < a2.add.length || 0 < a2.change.length) && r2.change.push(a2);
            }
          } else r2.add.push([n2, o2]);
        }
        return r2;
      }
      function un(e2, t2, n2, r2) {
        var i2 = e2.db.createObjectStore(t2, n2.keyPath ? { keyPath: n2.keyPath, autoIncrement: n2.auto } : { autoIncrement: n2.auto });
        return r2.forEach(function(e3) {
          return cn(i2, e3);
        }), i2;
      }
      function sn(t2, n2) {
        x(t2).forEach(function(e2) {
          n2.db.objectStoreNames.contains(e2) || (ie && console.debug("Dexie: Creating missing table", e2), un(n2, e2, t2[e2].primKey, t2[e2].indexes));
        });
      }
      function cn(e2, t2) {
        e2.createIndex(t2.name, t2.keyPath, { unique: t2.unique, multiEntry: t2.multi });
      }
      function ln(e2, t2, u2) {
        var s2 = {};
        return b(t2.objectStoreNames, 0).forEach(function(e3) {
          for (var t3 = u2.objectStore(e3), n2 = Vt(zt(a2 = t3.keyPath), a2 || "", true, false, !!t3.autoIncrement, a2 && "string" != typeof a2, true), r2 = [], i2 = 0; i2 < t3.indexNames.length; ++i2) {
            var o2 = t3.index(t3.indexNames[i2]), a2 = o2.keyPath, o2 = Vt(o2.name, a2, !!o2.unique, !!o2.multiEntry, false, a2 && "string" != typeof a2, false);
            r2.push(o2);
          }
          s2[e3] = Wt(e3, n2, r2);
        }), s2;
      }
      function fn(e2, t2, n2) {
        for (var r2 = n2.db.objectStoreNames, i2 = 0; i2 < r2.length; ++i2) {
          var o2 = r2[i2], a2 = n2.objectStore(o2);
          e2._hasGetAll = "getAll" in a2;
          for (var u2 = 0; u2 < a2.indexNames.length; ++u2) {
            var s2 = a2.indexNames[u2], c2 = a2.index(s2).keyPath, l2 = "string" == typeof c2 ? c2 : "[" + b(c2).join("+") + "]";
            !t2[o2] || (c2 = t2[o2].idxByName[l2]) && (c2.name = s2, delete t2[o2].idxByName[l2], t2[o2].idxByName[s2] = c2);
          }
        }
        "undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e2._hasGetAll = false);
      }
      function hn(e2) {
        return e2.split(",").map(function(e3, t2) {
          var n2 = (e3 = e3.trim()).replace(/([&*]|\+\+)/g, ""), r2 = /^\[/.test(n2) ? n2.match(/^\[(.*)\]$/)[1].split("+") : n2;
          return Vt(n2, r2 || null, /\&/.test(e3), /\*/.test(e3), /\+\+/.test(e3), k(r2), 0 === t2);
        });
      }
      var dn = (pn.prototype._parseStoresSpec = function(r2, i2) {
        x(r2).forEach(function(e2) {
          if (null !== r2[e2]) {
            var t2 = hn(r2[e2]), n2 = t2.shift();
            if (n2.unique = true, n2.multi) throw new Y.Schema("Primary key cannot be multi-valued");
            t2.forEach(function(e3) {
              if (e3.auto) throw new Y.Schema("Only primary key can be marked as autoIncrement (++)");
              if (!e3.keyPath) throw new Y.Schema("Index must have a name and cannot be an empty string");
            }), i2[e2] = Wt(e2, n2, t2);
          }
        });
      }, pn.prototype.stores = function(e2) {
        var t2 = this.db;
        this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e2) : e2;
        var e2 = t2._versions, n2 = {}, r2 = {};
        return e2.forEach(function(e3) {
          a(n2, e3._cfg.storesSource), r2 = e3._cfg.dbschema = {}, e3._parseStoresSpec(n2, r2);
        }), t2._dbSchema = r2, tn(t2, [t2._allTables, t2, t2.Transaction.prototype]), en(t2, [t2._allTables, t2, t2.Transaction.prototype, this._cfg.tables], x(r2), r2), t2._storeNames = x(r2), this;
      }, pn.prototype.upgrade = function(e2) {
        return this._cfg.contentUpgrade = re(this._cfg.contentUpgrade || G, e2), this;
      }, pn);
      function pn() {
      }
      function yn(e2, t2) {
        var n2 = e2._dbNamesDB;
        return n2 || (n2 = e2._dbNamesDB = new er(tt, { addons: [], indexedDB: e2, IDBKeyRange: t2 })).version(1).stores({ dbnames: "name" }), n2.table("dbnames");
      }
      function vn(e2) {
        return e2 && "function" == typeof e2.databases;
      }
      function mn(e2) {
        return Ne(function() {
          return me.letThrough = true, e2();
        });
      }
      function bn(e2) {
        return !("from" in e2);
      }
      var gn = function(e2, t2) {
        if (!this) {
          var n2 = new gn();
          return e2 && "d" in e2 && a(n2, e2), n2;
        }
        a(this, arguments.length ? { d: 1, from: e2, to: 1 < arguments.length ? t2 : e2 } : { d: 0 });
      };
      function wn(e2, t2, n2) {
        var r2 = st(t2, n2);
        if (!isNaN(r2)) {
          if (0 < r2) throw RangeError();
          if (bn(e2)) return a(e2, { from: t2, to: n2, d: 1 });
          var i2 = e2.l, r2 = e2.r;
          if (st(n2, e2.from) < 0) return i2 ? wn(i2, t2, n2) : e2.l = { from: t2, to: n2, d: 1, l: null, r: null }, On(e2);
          if (0 < st(t2, e2.to)) return r2 ? wn(r2, t2, n2) : e2.r = { from: t2, to: n2, d: 1, l: null, r: null }, On(e2);
          st(t2, e2.from) < 0 && (e2.from = t2, e2.l = null, e2.d = r2 ? r2.d + 1 : 1), 0 < st(n2, e2.to) && (e2.to = n2, e2.r = null, e2.d = e2.l ? e2.l.d + 1 : 1);
          n2 = !e2.r;
          i2 && !e2.l && _n(e2, i2), r2 && n2 && _n(e2, r2);
        }
      }
      function _n(e2, t2) {
        bn(t2) || function e3(t3, n2) {
          var r2 = n2.from, i2 = n2.to, o2 = n2.l, n2 = n2.r;
          wn(t3, r2, i2), o2 && e3(t3, o2), n2 && e3(t3, n2);
        }(e2, t2);
      }
      function xn(e2, t2) {
        var n2 = kn(t2), r2 = n2.next();
        if (r2.done) return false;
        for (var i2 = r2.value, o2 = kn(e2), a2 = o2.next(i2.from), u2 = a2.value; !r2.done && !a2.done; ) {
          if (st(u2.from, i2.to) <= 0 && 0 <= st(u2.to, i2.from)) return true;
          st(i2.from, u2.from) < 0 ? i2 = (r2 = n2.next(u2.from)).value : u2 = (a2 = o2.next(i2.from)).value;
        }
        return false;
      }
      function kn(e2) {
        var n2 = bn(e2) ? null : { s: 0, n: e2 };
        return { next: function(e3) {
          for (var t2 = 0 < arguments.length; n2; ) switch (n2.s) {
            case 0:
              if (n2.s = 1, t2) for (; n2.n.l && st(e3, n2.n.from) < 0; ) n2 = { up: n2, n: n2.n.l, s: 1 };
              else for (; n2.n.l; ) n2 = { up: n2, n: n2.n.l, s: 1 };
            case 1:
              if (n2.s = 2, !t2 || st(e3, n2.n.to) <= 0) return { value: n2.n, done: false };
            case 2:
              if (n2.n.r) {
                n2.s = 3, n2 = { up: n2, n: n2.n.r, s: 0 };
                continue;
              }
            case 3:
              n2 = n2.up;
          }
          return { done: true };
        } };
      }
      function On(e2) {
        var t2, n2, r2 = ((null === (t2 = e2.r) || void 0 === t2 ? void 0 : t2.d) || 0) - ((null === (n2 = e2.l) || void 0 === n2 ? void 0 : n2.d) || 0), i2 = 1 < r2 ? "r" : r2 < -1 ? "l" : "";
        i2 && (t2 = "r" == i2 ? "l" : "r", n2 = _({}, e2), r2 = e2[i2], e2.from = r2.from, e2.to = r2.to, e2[i2] = r2[i2], n2[i2] = r2[t2], (e2[t2] = n2).d = Pn(n2)), e2.d = Pn(e2);
      }
      function Pn(e2) {
        var t2 = e2.r, e2 = e2.l;
        return (t2 ? e2 ? Math.max(t2.d, e2.d) : t2.d : e2 ? e2.d : 0) + 1;
      }
      function Kn(t2, n2) {
        return x(n2).forEach(function(e2) {
          t2[e2] ? _n(t2[e2], n2[e2]) : t2[e2] = function e3(t3) {
            var n3, r2, i2 = {};
            for (n3 in t3) m(t3, n3) && (r2 = t3[n3], i2[n3] = !r2 || "object" != typeof r2 || K.has(r2.constructor) ? r2 : e3(r2));
            return i2;
          }(n2[e2]);
        }), t2;
      }
      function En(t2, n2) {
        return t2.all || n2.all || Object.keys(t2).some(function(e2) {
          return n2[e2] && xn(n2[e2], t2[e2]);
        });
      }
      r(gn.prototype, ((M = { add: function(e2) {
        return _n(this, e2), this;
      }, addKey: function(e2) {
        return wn(this, e2, e2), this;
      }, addKeys: function(e2) {
        var t2 = this;
        return e2.forEach(function(e3) {
          return wn(t2, e3, e3);
        }), this;
      }, hasKey: function(e2) {
        var t2 = kn(this).next(e2).value;
        return t2 && st(t2.from, e2) <= 0 && 0 <= st(t2.to, e2);
      } })[C] = function() {
        return kn(this);
      }, M));
      var Sn = {}, jn = {}, An = false;
      function Cn(e2) {
        Kn(jn, e2), An || (An = true, setTimeout(function() {
          An = false, Tn(jn, !(jn = {}));
        }, 0));
      }
      function Tn(e2, t2) {
        void 0 === t2 && (t2 = false);
        var n2 = /* @__PURE__ */ new Set();
        if (e2.all) for (var r2 = 0, i2 = Object.values(Sn); r2 < i2.length; r2++) qn(a2 = i2[r2], e2, n2, t2);
        else for (var o2 in e2) {
          var a2, u2 = /^idb\:\/\/(.*)\/(.*)\//.exec(o2);
          u2 && (o2 = u2[1], u2 = u2[2], (a2 = Sn["idb://".concat(o2, "/").concat(u2)]) && qn(a2, e2, n2, t2));
        }
        n2.forEach(function(e3) {
          return e3();
        });
      }
      function qn(e2, t2, n2, r2) {
        for (var i2 = [], o2 = 0, a2 = Object.entries(e2.queries.query); o2 < a2.length; o2++) {
          for (var u2 = a2[o2], s2 = u2[0], c2 = [], l2 = 0, f2 = u2[1]; l2 < f2.length; l2++) {
            var h2 = f2[l2];
            En(t2, h2.obsSet) ? h2.subscribers.forEach(function(e3) {
              return n2.add(e3);
            }) : r2 && c2.push(h2);
          }
          r2 && i2.push([s2, c2]);
        }
        if (r2) for (var d2 = 0, p2 = i2; d2 < p2.length; d2++) {
          var y2 = p2[d2], s2 = y2[0], c2 = y2[1];
          e2.queries.query[s2] = c2;
        }
      }
      function Dn(f2) {
        var h2 = f2._state, r2 = f2._deps.indexedDB;
        if (h2.isBeingOpened || f2.idbdb) return h2.dbReadyPromise.then(function() {
          return h2.dbOpenError ? Xe(h2.dbOpenError) : f2;
        });
        h2.isBeingOpened = true, h2.dbOpenError = null, h2.openComplete = false;
        var t2 = h2.openCanceller, d2 = Math.round(10 * f2.verno), p2 = false;
        function e2() {
          if (h2.openCanceller !== t2) throw new Y.DatabaseClosed("db.open() was cancelled");
        }
        function y2() {
          return new _e(function(s2, n3) {
            if (e2(), !r2) throw new Y.MissingAPI();
            var c2 = f2.name, l2 = h2.autoSchema || !d2 ? r2.open(c2) : r2.open(c2, d2);
            if (!l2) throw new Y.MissingAPI();
            l2.onerror = Bt(n3), l2.onblocked = qe(f2._fireOnBlocked), l2.onupgradeneeded = qe(function(e3) {
              var t3;
              v2 = l2.transaction, h2.autoSchema && !f2._options.allowEmptyDB ? (l2.onerror = Rt, v2.abort(), l2.result.close(), (t3 = r2.deleteDatabase(c2)).onsuccess = t3.onerror = qe(function() {
                n3(new Y.NoSuchDatabase("Database ".concat(c2, " doesnt exist")));
              })) : (v2.onerror = Bt(n3), e3 = e3.oldVersion > Math.pow(2, 62) ? 0 : e3.oldVersion, m2 = e3 < 1, f2.idbdb = l2.result, p2 && on(f2, v2), rn(f2, e3 / 10, v2, n3));
            }, n3), l2.onsuccess = qe(function() {
              v2 = null;
              var e3, t3, n4, r3, i3, o2 = f2.idbdb = l2.result, a2 = b(o2.objectStoreNames);
              if (0 < a2.length) try {
                var u2 = o2.transaction(1 === (r3 = a2).length ? r3[0] : r3, "readonly");
                if (h2.autoSchema) t3 = o2, n4 = u2, (e3 = f2).verno = t3.version / 10, n4 = e3._dbSchema = ln(0, t3, n4), e3._storeNames = b(t3.objectStoreNames, 0), en(e3, [e3._allTables], x(n4), n4);
                else if (fn(f2, f2._dbSchema, u2), ((i3 = an(ln(0, (i3 = f2).idbdb, u2), i3._dbSchema)).add.length || i3.change.some(function(e4) {
                  return e4.add.length || e4.change.length;
                })) && !p2) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), o2.close(), d2 = o2.version + 1, p2 = true, s2(y2());
                Zt(f2, u2);
              } catch (e4) {
              }
              et.push(f2), o2.onversionchange = qe(function(e4) {
                h2.vcFired = true, f2.on("versionchange").fire(e4);
              }), o2.onclose = qe(function(e4) {
                f2.on("close").fire(e4);
              }), m2 && (i3 = f2._deps, u2 = c2, o2 = i3.indexedDB, i3 = i3.IDBKeyRange, vn(o2) || u2 === tt || yn(o2, i3).put({ name: u2 }).catch(G)), s2();
            }, n3);
          }).catch(function(e3) {
            switch (null == e3 ? void 0 : e3.name) {
              case "UnknownError":
                if (0 < h2.PR1398_maxLoop) return h2.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), y2();
                break;
              case "VersionError":
                if (0 < d2) return d2 = 0, y2();
            }
            return _e.reject(e3);
          });
        }
        var n2, i2 = h2.dbReadyResolve, v2 = null, m2 = false;
        return _e.race([t2, ("undefined" == typeof navigator ? _e.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e3) {
          function t3() {
            return indexedDB.databases().finally(e3);
          }
          n2 = setInterval(t3, 100), t3();
        }).finally(function() {
          return clearInterval(n2);
        }) : Promise.resolve()).then(y2)]).then(function() {
          return e2(), h2.onReadyBeingFired = [], _e.resolve(mn(function() {
            return f2.on.ready.fire(f2.vip);
          })).then(function e3() {
            if (0 < h2.onReadyBeingFired.length) {
              var t3 = h2.onReadyBeingFired.reduce(re, G);
              return h2.onReadyBeingFired = [], _e.resolve(mn(function() {
                return t3(f2.vip);
              })).then(e3);
            }
          });
        }).finally(function() {
          h2.openCanceller === t2 && (h2.onReadyBeingFired = null, h2.isBeingOpened = false);
        }).catch(function(e3) {
          h2.dbOpenError = e3;
          try {
            v2 && v2.abort();
          } catch (e4) {
          }
          return t2 === h2.openCanceller && f2._close(), Xe(e3);
        }).finally(function() {
          h2.openComplete = true, i2();
        }).then(function() {
          var n3;
          return m2 && (n3 = {}, f2.tables.forEach(function(t3) {
            t3.schema.indexes.forEach(function(e3) {
              e3.name && (n3["idb://".concat(f2.name, "/").concat(t3.name, "/").concat(e3.name)] = new gn(-1 / 0, [[[]]]));
            }), n3["idb://".concat(f2.name, "/").concat(t3.name, "/")] = n3["idb://".concat(f2.name, "/").concat(t3.name, "/:dels")] = new gn(-1 / 0, [[[]]]);
          }), Nt(Mt).fire(n3), Tn(n3, true)), f2;
        });
      }
      function In(t2) {
        function e2(e3) {
          return t2.next(e3);
        }
        var r2 = n2(e2), i2 = n2(function(e3) {
          return t2.throw(e3);
        });
        function n2(n3) {
          return function(e3) {
            var t3 = n3(e3), e3 = t3.value;
            return t3.done ? e3 : e3 && "function" == typeof e3.then ? e3.then(r2, i2) : k(e3) ? Promise.all(e3).then(r2, i2) : r2(e3);
          };
        }
        return n2(e2)();
      }
      function Bn(e2, t2, n2) {
        for (var r2 = k(e2) ? e2.slice() : [e2], i2 = 0; i2 < n2; ++i2) r2.push(t2);
        return r2;
      }
      var Rn = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: function(f2) {
        return _(_({}, f2), { table: function(e2) {
          var a2 = f2.table(e2), t2 = a2.schema, u2 = {}, s2 = [];
          function c2(e3, t3, n3) {
            var r3 = Xt(e3), i3 = u2[r3] = u2[r3] || [], o2 = null == e3 ? 0 : "string" == typeof e3 ? 1 : e3.length, a3 = 0 < t3, a3 = _(_({}, n3), { name: a3 ? "".concat(r3, "(virtual-from:").concat(n3.name, ")") : n3.name, lowLevelIndex: n3, isVirtual: a3, keyTail: t3, keyLength: o2, extractKey: $t(e3), unique: !a3 && n3.unique });
            return i3.push(a3), a3.isPrimaryKey || s2.push(a3), 1 < o2 && c2(2 === o2 ? e3[0] : e3.slice(0, o2 - 1), t3 + 1, n3), i3.sort(function(e4, t4) {
              return e4.keyTail - t4.keyTail;
            }), a3;
          }
          e2 = c2(t2.primaryKey.keyPath, 0, t2.primaryKey);
          u2[":id"] = [e2];
          for (var n2 = 0, r2 = t2.indexes; n2 < r2.length; n2++) {
            var i2 = r2[n2];
            c2(i2.keyPath, 0, i2);
          }
          function l2(e3) {
            var t3, n3 = e3.query.index;
            return n3.isVirtual ? _(_({}, e3), { query: { index: n3.lowLevelIndex, range: (t3 = e3.query.range, n3 = n3.keyTail, { type: 1 === t3.type ? 2 : t3.type, lower: Bn(t3.lower, t3.lowerOpen ? f2.MAX_KEY : f2.MIN_KEY, n3), lowerOpen: true, upper: Bn(t3.upper, t3.upperOpen ? f2.MIN_KEY : f2.MAX_KEY, n3), upperOpen: true }) } }) : e3;
          }
          return _(_({}, a2), { schema: _(_({}, t2), { primaryKey: e2, indexes: s2, getIndexByKeyPath: function(e3) {
            return (e3 = u2[Xt(e3)]) && e3[0];
          } }), count: function(e3) {
            return a2.count(l2(e3));
          }, query: function(e3) {
            return a2.query(l2(e3));
          }, openCursor: function(t3) {
            var e3 = t3.query.index, r3 = e3.keyTail, n3 = e3.isVirtual, i3 = e3.keyLength;
            return n3 ? a2.openCursor(l2(t3)).then(function(e4) {
              return e4 && o2(e4);
            }) : a2.openCursor(t3);
            function o2(n4) {
              return Object.create(n4, { continue: { value: function(e4) {
                null != e4 ? n4.continue(Bn(e4, t3.reverse ? f2.MAX_KEY : f2.MIN_KEY, r3)) : t3.unique ? n4.continue(n4.key.slice(0, i3).concat(t3.reverse ? f2.MIN_KEY : f2.MAX_KEY, r3)) : n4.continue();
              } }, continuePrimaryKey: { value: function(e4, t4) {
                n4.continuePrimaryKey(Bn(e4, f2.MAX_KEY, r3), t4);
              } }, primaryKey: { get: function() {
                return n4.primaryKey;
              } }, key: { get: function() {
                var e4 = n4.key;
                return 1 === i3 ? e4[0] : e4.slice(0, i3);
              } }, value: { get: function() {
                return n4.value;
              } } });
            }
          } });
        } });
      } };
      function Mn(i2, o2, a2, u2) {
        return a2 = a2 || {}, u2 = u2 || "", x(i2).forEach(function(e2) {
          var t2, n2, r2;
          m(o2, e2) ? (t2 = i2[e2], n2 = o2[e2], "object" == typeof t2 && "object" == typeof n2 && t2 && n2 ? (r2 = A(t2)) !== A(n2) ? a2[u2 + e2] = o2[e2] : "Object" === r2 ? Mn(t2, n2, a2, u2 + e2 + ".") : t2 !== n2 && (a2[u2 + e2] = o2[e2]) : t2 !== n2 && (a2[u2 + e2] = o2[e2])) : a2[u2 + e2] = void 0;
        }), x(o2).forEach(function(e2) {
          m(i2, e2) || (a2[u2 + e2] = o2[e2]);
        }), a2;
      }
      function Fn(e2, t2) {
        return "delete" === t2.type ? t2.keys : t2.keys || t2.values.map(e2.extractKey);
      }
      var Nn = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: function(e2) {
        return _(_({}, e2), { table: function(r2) {
          var y2 = e2.table(r2), v2 = y2.schema.primaryKey;
          return _(_({}, y2), { mutate: function(e3) {
            var t2 = me.trans, n2 = t2.table(r2).hook, h2 = n2.deleting, d2 = n2.creating, p2 = n2.updating;
            switch (e3.type) {
              case "add":
                if (d2.fire === G) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "put":
                if (d2.fire === G && p2.fire === G) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "delete":
                if (h2.fire === G) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "deleteRange":
                if (h2.fire === G) break;
                return t2._promise("readwrite", function() {
                  return function n3(r3, i2, o2) {
                    return y2.query({ trans: r3, values: false, query: { index: v2, range: i2 }, limit: o2 }).then(function(e4) {
                      var t3 = e4.result;
                      return a2({ type: "delete", keys: t3, trans: r3 }).then(function(e5) {
                        return 0 < e5.numFailures ? Promise.reject(e5.failures[0]) : t3.length < o2 ? { failures: [], numFailures: 0, lastResult: void 0 } : n3(r3, _(_({}, i2), { lower: t3[t3.length - 1], lowerOpen: true }), o2);
                      });
                    });
                  }(e3.trans, e3.range, 1e4);
                }, true);
            }
            return y2.mutate(e3);
            function a2(c2) {
              var e4, t3, n3, l2 = me.trans, f2 = c2.keys || Fn(v2, c2);
              if (!f2) throw new Error("Keys missing");
              return "delete" !== (c2 = "add" === c2.type || "put" === c2.type ? _(_({}, c2), { keys: f2 }) : _({}, c2)).type && (c2.values = i([], c2.values)), c2.keys && (c2.keys = i([], c2.keys)), e4 = y2, n3 = f2, ("add" === (t3 = c2).type ? Promise.resolve([]) : e4.getMany({ trans: t3.trans, keys: n3, cache: "immutable" })).then(function(u2) {
                var s2 = f2.map(function(e5, t4) {
                  var n4, r3, i2, o2 = u2[t4], a3 = { onerror: null, onsuccess: null };
                  return "delete" === c2.type ? h2.fire.call(a3, e5, o2, l2) : "add" === c2.type || void 0 === o2 ? (n4 = d2.fire.call(a3, e5, c2.values[t4], l2), null == e5 && null != n4 && (c2.keys[t4] = e5 = n4, v2.outbound || P(c2.values[t4], v2.keyPath, e5))) : (n4 = Mn(o2, c2.values[t4]), (r3 = p2.fire.call(a3, n4, e5, o2, l2)) && (i2 = c2.values[t4], Object.keys(r3).forEach(function(e6) {
                    m(i2, e6) ? i2[e6] = r3[e6] : P(i2, e6, r3[e6]);
                  }))), a3;
                });
                return y2.mutate(c2).then(function(e5) {
                  for (var t4 = e5.failures, n4 = e5.results, r3 = e5.numFailures, e5 = e5.lastResult, i2 = 0; i2 < f2.length; ++i2) {
                    var o2 = (n4 || f2)[i2], a3 = s2[i2];
                    null == o2 ? a3.onerror && a3.onerror(t4[i2]) : a3.onsuccess && a3.onsuccess("put" === c2.type && u2[i2] ? c2.values[i2] : o2);
                  }
                  return { failures: t4, results: n4, numFailures: r3, lastResult: e5 };
                }).catch(function(t4) {
                  return s2.forEach(function(e5) {
                    return e5.onerror && e5.onerror(t4);
                  }), Promise.reject(t4);
                });
              });
            }
          } });
        } });
      } };
      function Ln(e2, t2, n2) {
        try {
          if (!t2) return null;
          if (t2.keys.length < e2.length) return null;
          for (var r2 = [], i2 = 0, o2 = 0; i2 < t2.keys.length && o2 < e2.length; ++i2) 0 === st(t2.keys[i2], e2[o2]) && (r2.push(n2 ? S(t2.values[i2]) : t2.values[i2]), ++o2);
          return r2.length === e2.length ? r2 : null;
        } catch (e3) {
          return null;
        }
      }
      var Un = { stack: "dbcore", level: -1, create: function(t2) {
        return { table: function(e2) {
          var n2 = t2.table(e2);
          return _(_({}, n2), { getMany: function(t3) {
            if (!t3.cache) return n2.getMany(t3);
            var e3 = Ln(t3.keys, t3.trans._cache, "clone" === t3.cache);
            return e3 ? _e.resolve(e3) : n2.getMany(t3).then(function(e4) {
              return t3.trans._cache = { keys: t3.keys, values: "clone" === t3.cache ? S(e4) : e4 }, e4;
            });
          }, mutate: function(e3) {
            return "add" !== e3.type && (e3.trans._cache = null), n2.mutate(e3);
          } });
        } };
      } };
      function Vn(e2, t2) {
        return "readonly" === e2.trans.mode && !!e2.subscr && !e2.trans.explicit && "disabled" !== e2.trans.db._options.cache && !t2.schema.primaryKey.outbound;
      }
      function zn(e2, t2) {
        switch (e2) {
          case "query":
            return t2.values && !t2.unique;
          case "get":
          case "getMany":
          case "count":
          case "openCursor":
            return false;
        }
      }
      var Wn = { stack: "dbcore", level: 0, name: "Observability", create: function(b2) {
        var g2 = b2.schema.name, w2 = new gn(b2.MIN_KEY, b2.MAX_KEY);
        return _(_({}, b2), { transaction: function(e2, t2, n2) {
          if (me.subscr && "readonly" !== t2) throw new Y.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(me.querier));
          return b2.transaction(e2, t2, n2);
        }, table: function(d2) {
          var p2 = b2.table(d2), y2 = p2.schema, v2 = y2.primaryKey, e2 = y2.indexes, c2 = v2.extractKey, l2 = v2.outbound, m2 = v2.autoIncrement && e2.filter(function(e3) {
            return e3.compound && e3.keyPath.includes(v2.keyPath);
          }), t2 = _(_({}, p2), { mutate: function(a2) {
            function u2(e4) {
              return e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4), n2[e4] || (n2[e4] = new gn());
            }
            var e3, o2, s2, t3 = a2.trans, n2 = a2.mutatedParts || (a2.mutatedParts = {}), r2 = u2(""), i2 = u2(":dels"), c3 = a2.type, l3 = "deleteRange" === a2.type ? [a2.range] : "delete" === a2.type ? [a2.keys] : a2.values.length < 50 ? [Fn(v2, a2).filter(function(e4) {
              return e4;
            }), a2.values] : [], f3 = l3[0], h2 = l3[1], l3 = a2.trans._cache;
            return k(f3) ? (r2.addKeys(f3), (l3 = "delete" === c3 || f3.length === h2.length ? Ln(f3, l3) : null) || i2.addKeys(f3), (l3 || h2) && (e3 = u2, o2 = l3, s2 = h2, y2.indexes.forEach(function(t4) {
              var n3 = e3(t4.name || "");
              function r3(e4) {
                return null != e4 ? t4.extractKey(e4) : null;
              }
              function i3(e4) {
                return t4.multiEntry && k(e4) ? e4.forEach(function(e5) {
                  return n3.addKey(e5);
                }) : n3.addKey(e4);
              }
              (o2 || s2).forEach(function(e4, t5) {
                var n4 = o2 && r3(o2[t5]), t5 = s2 && r3(s2[t5]);
                0 !== st(n4, t5) && (null != n4 && i3(n4), null != t5 && i3(t5));
              });
            }))) : f3 ? (h2 = { from: null !== (h2 = f3.lower) && void 0 !== h2 ? h2 : b2.MIN_KEY, to: null !== (h2 = f3.upper) && void 0 !== h2 ? h2 : b2.MAX_KEY }, i2.add(h2), r2.add(h2)) : (r2.add(w2), i2.add(w2), y2.indexes.forEach(function(e4) {
              return u2(e4.name).add(w2);
            })), p2.mutate(a2).then(function(o3) {
              return !f3 || "add" !== a2.type && "put" !== a2.type || (r2.addKeys(o3.results), m2 && m2.forEach(function(t4) {
                for (var e4 = a2.values.map(function(e5) {
                  return t4.extractKey(e5);
                }), n3 = t4.keyPath.findIndex(function(e5) {
                  return e5 === v2.keyPath;
                }), r3 = 0, i3 = o3.results.length; r3 < i3; ++r3) e4[r3][n3] = o3.results[r3];
                u2(t4.name).addKeys(e4);
              })), t3.mutatedParts = Kn(t3.mutatedParts || {}, n2), o3;
            });
          } }), e2 = function(e3) {
            var t3 = e3.query, e3 = t3.index, t3 = t3.range;
            return [e3, new gn(null !== (e3 = t3.lower) && void 0 !== e3 ? e3 : b2.MIN_KEY, null !== (t3 = t3.upper) && void 0 !== t3 ? t3 : b2.MAX_KEY)];
          }, f2 = { get: function(e3) {
            return [v2, new gn(e3.key)];
          }, getMany: function(e3) {
            return [v2, new gn().addKeys(e3.keys)];
          }, count: e2, query: e2, openCursor: e2 };
          return x(f2).forEach(function(s2) {
            t2[s2] = function(i2) {
              var e3 = me.subscr, t3 = !!e3, n2 = Vn(me, p2) && zn(s2, i2) ? i2.obsSet = {} : e3;
              if (t3) {
                var r2 = function(e4) {
                  e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4);
                  return n2[e4] || (n2[e4] = new gn());
                }, o2 = r2(""), a2 = r2(":dels"), e3 = f2[s2](i2), t3 = e3[0], e3 = e3[1];
                if (("query" === s2 && t3.isPrimaryKey && !i2.values ? a2 : r2(t3.name || "")).add(e3), !t3.isPrimaryKey) {
                  if ("count" !== s2) {
                    var u2 = "query" === s2 && l2 && i2.values && p2.query(_(_({}, i2), { values: false }));
                    return p2[s2].apply(this, arguments).then(function(t4) {
                      if ("query" === s2) {
                        if (l2 && i2.values) return u2.then(function(e5) {
                          e5 = e5.result;
                          return o2.addKeys(e5), t4;
                        });
                        var e4 = i2.values ? t4.result.map(c2) : t4.result;
                        (i2.values ? o2 : a2).addKeys(e4);
                      } else if ("openCursor" === s2) {
                        var n3 = t4, r3 = i2.values;
                        return n3 && Object.create(n3, { key: { get: function() {
                          return a2.addKey(n3.primaryKey), n3.key;
                        } }, primaryKey: { get: function() {
                          var e5 = n3.primaryKey;
                          return a2.addKey(e5), e5;
                        } }, value: { get: function() {
                          return r3 && o2.addKey(n3.primaryKey), n3.value;
                        } } });
                      }
                      return t4;
                    });
                  }
                  a2.add(w2);
                }
              }
              return p2[s2].apply(this, arguments);
            };
          }), t2;
        } });
      } };
      function Yn(e2, t2, n2) {
        if (0 === n2.numFailures) return t2;
        if ("deleteRange" === t2.type) return null;
        var r2 = t2.keys ? t2.keys.length : "values" in t2 && t2.values ? t2.values.length : 1;
        if (n2.numFailures === r2) return null;
        t2 = _({}, t2);
        return k(t2.keys) && (t2.keys = t2.keys.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), "values" in t2 && k(t2.values) && (t2.values = t2.values.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), t2;
      }
      function $n(e2, t2) {
        return n2 = e2, (void 0 === (r2 = t2).lower || (r2.lowerOpen ? 0 < st(n2, r2.lower) : 0 <= st(n2, r2.lower))) && (e2 = e2, void 0 === (t2 = t2).upper || (t2.upperOpen ? st(e2, t2.upper) < 0 : st(e2, t2.upper) <= 0));
        var n2, r2;
      }
      function Qn(e2, d2, t2, n2, r2, i2) {
        if (!t2 || 0 === t2.length) return e2;
        var o2 = d2.query.index, p2 = o2.multiEntry, y2 = d2.query.range, v2 = n2.schema.primaryKey.extractKey, m2 = o2.extractKey, a2 = (o2.lowLevelIndex || o2).extractKey, t2 = t2.reduce(function(e3, t3) {
          var n3 = e3, r3 = [];
          if ("add" === t3.type || "put" === t3.type) for (var i3 = new gn(), o3 = t3.values.length - 1; 0 <= o3; --o3) {
            var a3, u2 = t3.values[o3], s2 = v2(u2);
            i3.hasKey(s2) || (a3 = m2(u2), (p2 && k(a3) ? a3.some(function(e4) {
              return $n(e4, y2);
            }) : $n(a3, y2)) && (i3.addKey(s2), r3.push(u2)));
          }
          switch (t3.type) {
            case "add":
              var c2 = new gn().addKeys(d2.values ? e3.map(function(e4) {
                return v2(e4);
              }) : e3), n3 = e3.concat(d2.values ? r3.filter(function(e4) {
                e4 = v2(e4);
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }) : r3.map(function(e4) {
                return v2(e4);
              }).filter(function(e4) {
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }));
              break;
            case "put":
              var l2 = new gn().addKeys(t3.values.map(function(e4) {
                return v2(e4);
              }));
              n3 = e3.filter(function(e4) {
                return !l2.hasKey(d2.values ? v2(e4) : e4);
              }).concat(d2.values ? r3 : r3.map(function(e4) {
                return v2(e4);
              }));
              break;
            case "delete":
              var f2 = new gn().addKeys(t3.keys);
              n3 = e3.filter(function(e4) {
                return !f2.hasKey(d2.values ? v2(e4) : e4);
              });
              break;
            case "deleteRange":
              var h2 = t3.range;
              n3 = e3.filter(function(e4) {
                return !$n(v2(e4), h2);
              });
          }
          return n3;
        }, e2);
        return t2 === e2 ? e2 : (t2.sort(function(e3, t3) {
          return st(a2(e3), a2(t3)) || st(v2(e3), v2(t3));
        }), d2.limit && d2.limit < 1 / 0 && (t2.length > d2.limit ? t2.length = d2.limit : e2.length === d2.limit && t2.length < d2.limit && (r2.dirty = true)), i2 ? Object.freeze(t2) : t2);
      }
      function Gn(e2, t2) {
        return 0 === st(e2.lower, t2.lower) && 0 === st(e2.upper, t2.upper) && !!e2.lowerOpen == !!t2.lowerOpen && !!e2.upperOpen == !!t2.upperOpen;
      }
      function Xn(e2, t2) {
        return function(e3, t3, n2, r2) {
          if (void 0 === e3) return void 0 !== t3 ? -1 : 0;
          if (void 0 === t3) return 1;
          if (0 === (t3 = st(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return 1;
            if (r2) return -1;
          }
          return t3;
        }(e2.lower, t2.lower, e2.lowerOpen, t2.lowerOpen) <= 0 && 0 <= function(e3, t3, n2, r2) {
          if (void 0 === e3) return void 0 !== t3 ? 1 : 0;
          if (void 0 === t3) return -1;
          if (0 === (t3 = st(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return -1;
            if (r2) return 1;
          }
          return t3;
        }(e2.upper, t2.upper, e2.upperOpen, t2.upperOpen);
      }
      function Hn(n2, r2, i2, e2) {
        n2.subscribers.add(i2), e2.addEventListener("abort", function() {
          var e3, t2;
          n2.subscribers.delete(i2), 0 === n2.subscribers.size && (e3 = n2, t2 = r2, setTimeout(function() {
            0 === e3.subscribers.size && q(t2, e3);
          }, 3e3));
        });
      }
      var Jn = { stack: "dbcore", level: 0, name: "Cache", create: function(k2) {
        var O2 = k2.schema.name;
        return _(_({}, k2), { transaction: function(g2, w2, e2) {
          var _2, t2, x2 = k2.transaction(g2, w2, e2);
          return "readwrite" === w2 && (t2 = (_2 = new AbortController()).signal, e2 = function(b2) {
            return function() {
              if (_2.abort(), "readwrite" === w2) {
                for (var t3 = /* @__PURE__ */ new Set(), e3 = 0, n2 = g2; e3 < n2.length; e3++) {
                  var r2 = n2[e3], i2 = Sn["idb://".concat(O2, "/").concat(r2)];
                  if (i2) {
                    var o2 = k2.table(r2), a2 = i2.optimisticOps.filter(function(e4) {
                      return e4.trans === x2;
                    });
                    if (x2._explicit && b2 && x2.mutatedParts) for (var u2 = 0, s2 = Object.values(i2.queries.query); u2 < s2.length; u2++) for (var c2 = 0, l2 = (d2 = s2[u2]).slice(); c2 < l2.length; c2++) En((p2 = l2[c2]).obsSet, x2.mutatedParts) && (q(d2, p2), p2.subscribers.forEach(function(e4) {
                      return t3.add(e4);
                    }));
                    else if (0 < a2.length) {
                      i2.optimisticOps = i2.optimisticOps.filter(function(e4) {
                        return e4.trans !== x2;
                      });
                      for (var f2 = 0, h2 = Object.values(i2.queries.query); f2 < h2.length; f2++) for (var d2, p2, y2, v2 = 0, m2 = (d2 = h2[f2]).slice(); v2 < m2.length; v2++) null != (p2 = m2[v2]).res && x2.mutatedParts && (b2 && !p2.dirty ? (y2 = Object.isFrozen(p2.res), y2 = Qn(p2.res, p2.req, a2, o2, p2, y2), p2.dirty ? (q(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })) : y2 !== p2.res && (p2.res = y2, p2.promise = _e.resolve({ result: y2 }))) : (p2.dirty && q(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })));
                    }
                  }
                }
                t3.forEach(function(e4) {
                  return e4();
                });
              }
            };
          }, x2.addEventListener("abort", e2(false), { signal: t2 }), x2.addEventListener("error", e2(false), { signal: t2 }), x2.addEventListener("complete", e2(true), { signal: t2 })), x2;
        }, table: function(c2) {
          var l2 = k2.table(c2), i2 = l2.schema.primaryKey;
          return _(_({}, l2), { mutate: function(t2) {
            var e2 = me.trans;
            if (i2.outbound || "disabled" === e2.db._options.cache || e2.explicit || "readwrite" !== e2.idbtrans.mode) return l2.mutate(t2);
            var n2 = Sn["idb://".concat(O2, "/").concat(c2)];
            if (!n2) return l2.mutate(t2);
            e2 = l2.mutate(t2);
            return "add" !== t2.type && "put" !== t2.type || !(50 <= t2.values.length || Fn(i2, t2).some(function(e3) {
              return null == e3;
            })) ? (n2.optimisticOps.push(t2), t2.mutatedParts && Cn(t2.mutatedParts), e2.then(function(e3) {
              0 < e3.numFailures && (q(n2.optimisticOps, t2), (e3 = Yn(0, t2, e3)) && n2.optimisticOps.push(e3), t2.mutatedParts && Cn(t2.mutatedParts));
            }), e2.catch(function() {
              q(n2.optimisticOps, t2), t2.mutatedParts && Cn(t2.mutatedParts);
            })) : e2.then(function(r2) {
              var e3 = Yn(0, _(_({}, t2), { values: t2.values.map(function(e4, t3) {
                var n3;
                if (r2.failures[t3]) return e4;
                e4 = null !== (n3 = i2.keyPath) && void 0 !== n3 && n3.includes(".") ? S(e4) : _({}, e4);
                return P(e4, i2.keyPath, r2.results[t3]), e4;
              }) }), r2);
              n2.optimisticOps.push(e3), queueMicrotask(function() {
                return t2.mutatedParts && Cn(t2.mutatedParts);
              });
            }), e2;
          }, query: function(t2) {
            if (!Vn(me, l2) || !zn("query", t2)) return l2.query(t2);
            var i3 = "immutable" === (null === (o2 = me.trans) || void 0 === o2 ? void 0 : o2.db._options.cache), e2 = me, n2 = e2.requery, r2 = e2.signal, o2 = function(e3, t3, n3, r3) {
              var i4 = Sn["idb://".concat(e3, "/").concat(t3)];
              if (!i4) return [];
              if (!(t3 = i4.queries[n3])) return [null, false, i4, null];
              var o3 = t3[(r3.query ? r3.query.index.name : null) || ""];
              if (!o3) return [null, false, i4, null];
              switch (n3) {
                case "query":
                  var a3 = o3.find(function(e4) {
                    return e4.req.limit === r3.limit && e4.req.values === r3.values && Gn(e4.req.query.range, r3.query.range);
                  });
                  return a3 ? [a3, true, i4, o3] : [o3.find(function(e4) {
                    return ("limit" in e4.req ? e4.req.limit : 1 / 0) >= r3.limit && (!r3.values || e4.req.values) && Xn(e4.req.query.range, r3.query.range);
                  }), false, i4, o3];
                case "count":
                  a3 = o3.find(function(e4) {
                    return Gn(e4.req.query.range, r3.query.range);
                  });
                  return [a3, !!a3, i4, o3];
              }
            }(O2, c2, "query", t2), a2 = o2[0], e2 = o2[1], u2 = o2[2], s2 = o2[3];
            return a2 && e2 ? a2.obsSet = t2.obsSet : (e2 = l2.query(t2).then(function(e3) {
              var t3 = e3.result;
              if (a2 && (a2.res = t3), i3) {
                for (var n3 = 0, r3 = t3.length; n3 < r3; ++n3) Object.freeze(t3[n3]);
                Object.freeze(t3);
              } else e3.result = S(t3);
              return e3;
            }).catch(function(e3) {
              return s2 && a2 && q(s2, a2), Promise.reject(e3);
            }), a2 = { obsSet: t2.obsSet, promise: e2, subscribers: /* @__PURE__ */ new Set(), type: "query", req: t2, dirty: false }, s2 ? s2.push(a2) : (s2 = [a2], (u2 = u2 || (Sn["idb://".concat(O2, "/").concat(c2)] = { queries: { query: {}, count: {} }, objs: /* @__PURE__ */ new Map(), optimisticOps: [], unsignaledParts: {} })).queries.query[t2.query.index.name || ""] = s2)), Hn(a2, s2, n2, r2), a2.promise.then(function(e3) {
              return { result: Qn(e3.result, t2, null == u2 ? void 0 : u2.optimisticOps, l2, a2, i3) };
            });
          } });
        } });
      } };
      function Zn(e2, r2) {
        return new Proxy(e2, { get: function(e3, t2, n2) {
          return "db" === t2 ? r2 : Reflect.get(e3, t2, n2);
        } });
      }
      var er = (tr.prototype.version = function(t2) {
        if (isNaN(t2) || t2 < 0.1) throw new Y.Type("Given version is not a positive number");
        if (t2 = Math.round(10 * t2) / 10, this.idbdb || this._state.isBeingOpened) throw new Y.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, t2);
        var e2 = this._versions, n2 = e2.filter(function(e3) {
          return e3._cfg.version === t2;
        })[0];
        return n2 || (n2 = new this.Version(t2), e2.push(n2), e2.sort(nn), n2.stores({}), this._state.autoSchema = false, n2);
      }, tr.prototype._whenReady = function(e2) {
        var n2 = this;
        return this.idbdb && (this._state.openComplete || me.letThrough || this._vip) ? e2() : new _e(function(e3, t2) {
          if (n2._state.openComplete) return t2(new Y.DatabaseClosed(n2._state.dbOpenError));
          if (!n2._state.isBeingOpened) {
            if (!n2._state.autoOpen) return void t2(new Y.DatabaseClosed());
            n2.open().catch(G);
          }
          n2._state.dbReadyPromise.then(e3, t2);
        }).then(e2);
      }, tr.prototype.use = function(e2) {
        var t2 = e2.stack, n2 = e2.create, r2 = e2.level, i2 = e2.name;
        i2 && this.unuse({ stack: t2, name: i2 });
        e2 = this._middlewares[t2] || (this._middlewares[t2] = []);
        return e2.push({ stack: t2, create: n2, level: null == r2 ? 10 : r2, name: i2 }), e2.sort(function(e3, t3) {
          return e3.level - t3.level;
        }), this;
      }, tr.prototype.unuse = function(e2) {
        var t2 = e2.stack, n2 = e2.name, r2 = e2.create;
        return t2 && this._middlewares[t2] && (this._middlewares[t2] = this._middlewares[t2].filter(function(e3) {
          return r2 ? e3.create !== r2 : !!n2 && e3.name !== n2;
        })), this;
      }, tr.prototype.open = function() {
        var e2 = this;
        return $e(ve, function() {
          return Dn(e2);
        });
      }, tr.prototype._close = function() {
        var n2 = this._state, e2 = et.indexOf(this);
        if (0 <= e2 && et.splice(e2, 1), this.idbdb) {
          try {
            this.idbdb.close();
          } catch (e3) {
          }
          this.idbdb = null;
        }
        n2.isBeingOpened || (n2.dbReadyPromise = new _e(function(e3) {
          n2.dbReadyResolve = e3;
        }), n2.openCanceller = new _e(function(e3, t2) {
          n2.cancelOpen = t2;
        }));
      }, tr.prototype.close = function(e2) {
        var t2 = (void 0 === e2 ? { disableAutoOpen: true } : e2).disableAutoOpen, e2 = this._state;
        t2 ? (e2.isBeingOpened && e2.cancelOpen(new Y.DatabaseClosed()), this._close(), e2.autoOpen = false, e2.dbOpenError = new Y.DatabaseClosed()) : (this._close(), e2.autoOpen = this._options.autoOpen || e2.isBeingOpened, e2.openComplete = false, e2.dbOpenError = null);
      }, tr.prototype.delete = function(n2) {
        var i2 = this;
        void 0 === n2 && (n2 = { disableAutoOpen: true });
        var o2 = 0 < arguments.length && "object" != typeof arguments[0], a2 = this._state;
        return new _e(function(r2, t2) {
          function e2() {
            i2.close(n2);
            var e3 = i2._deps.indexedDB.deleteDatabase(i2.name);
            e3.onsuccess = qe(function() {
              var e4, t3, n3;
              e4 = i2._deps, t3 = i2.name, n3 = e4.indexedDB, e4 = e4.IDBKeyRange, vn(n3) || t3 === tt || yn(n3, e4).delete(t3).catch(G), r2();
            }), e3.onerror = Bt(t2), e3.onblocked = i2._fireOnBlocked;
          }
          if (o2) throw new Y.InvalidArgument("Invalid closeOptions argument to db.delete()");
          a2.isBeingOpened ? a2.dbReadyPromise.then(e2) : e2();
        });
      }, tr.prototype.backendDB = function() {
        return this.idbdb;
      }, tr.prototype.isOpen = function() {
        return null !== this.idbdb;
      }, tr.prototype.hasBeenClosed = function() {
        var e2 = this._state.dbOpenError;
        return e2 && "DatabaseClosed" === e2.name;
      }, tr.prototype.hasFailed = function() {
        return null !== this._state.dbOpenError;
      }, tr.prototype.dynamicallyOpened = function() {
        return this._state.autoSchema;
      }, Object.defineProperty(tr.prototype, "tables", { get: function() {
        var t2 = this;
        return x(this._allTables).map(function(e2) {
          return t2._allTables[e2];
        });
      }, enumerable: false, configurable: true }), tr.prototype.transaction = function() {
        var e2 = (function(e3, t2, n2) {
          var r2 = arguments.length;
          if (r2 < 2) throw new Y.InvalidArgument("Too few arguments");
          for (var i2 = new Array(r2 - 1); --r2; ) i2[r2 - 1] = arguments[r2];
          return n2 = i2.pop(), [e3, w(i2), n2];
        }).apply(this, arguments);
        return this._transaction.apply(this, e2);
      }, tr.prototype._transaction = function(e2, t2, n2) {
        var r2 = this, i2 = me.trans;
        i2 && i2.db === this && -1 === e2.indexOf("!") || (i2 = null);
        var o2, a2, u2 = -1 !== e2.indexOf("?");
        e2 = e2.replace("!", "").replace("?", "");
        try {
          if (a2 = t2.map(function(e3) {
            e3 = e3 instanceof r2.Table ? e3.name : e3;
            if ("string" != typeof e3) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
            return e3;
          }), "r" == e2 || e2 === nt) o2 = nt;
          else {
            if ("rw" != e2 && e2 != rt) throw new Y.InvalidArgument("Invalid transaction mode: " + e2);
            o2 = rt;
          }
          if (i2) {
            if (i2.mode === nt && o2 === rt) {
              if (!u2) throw new Y.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
              i2 = null;
            }
            i2 && a2.forEach(function(e3) {
              if (i2 && -1 === i2.storeNames.indexOf(e3)) {
                if (!u2) throw new Y.SubTransaction("Table " + e3 + " not included in parent transaction.");
                i2 = null;
              }
            }), u2 && i2 && !i2.active && (i2 = null);
          }
        } catch (n3) {
          return i2 ? i2._promise(null, function(e3, t3) {
            t3(n3);
          }) : Xe(n3);
        }
        var s2 = (function i3(o3, a3, u3, s3, c2) {
          return _e.resolve().then(function() {
            var e3 = me.transless || me, t3 = o3._createTransaction(a3, u3, o3._dbSchema, s3);
            if (t3.explicit = true, e3 = { trans: t3, transless: e3 }, s3) t3.idbtrans = s3.idbtrans;
            else try {
              t3.create(), t3.idbtrans._explicit = true, o3._state.PR1398_maxLoop = 3;
            } catch (e4) {
              return e4.name === z.InvalidState && o3.isOpen() && 0 < --o3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o3.close({ disableAutoOpen: false }), o3.open().then(function() {
                return i3(o3, a3, u3, null, c2);
              })) : Xe(e4);
            }
            var n3, r3 = B(c2);
            return r3 && Le(), e3 = _e.follow(function() {
              var e4;
              (n3 = c2.call(t3, t3)) && (r3 ? (e4 = Ue.bind(null, null), n3.then(e4, e4)) : "function" == typeof n3.next && "function" == typeof n3.throw && (n3 = In(n3)));
            }, e3), (n3 && "function" == typeof n3.then ? _e.resolve(n3).then(function(e4) {
              return t3.active ? e4 : Xe(new Y.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
            }) : e3.then(function() {
              return n3;
            })).then(function(e4) {
              return s3 && t3._resolve(), t3._completion.then(function() {
                return e4;
              });
            }).catch(function(e4) {
              return t3._reject(e4), Xe(e4);
            });
          });
        }).bind(null, this, o2, a2, i2, n2);
        return i2 ? i2._promise(o2, s2, "lock") : me.trans ? $e(me.transless, function() {
          return r2._whenReady(s2);
        }) : this._whenReady(s2);
      }, tr.prototype.table = function(e2) {
        if (!m(this._allTables, e2)) throw new Y.InvalidTable("Table ".concat(e2, " does not exist"));
        return this._allTables[e2];
      }, tr);
      function tr(e2, t2) {
        var o2 = this;
        this._middlewares = {}, this.verno = 0;
        var n2 = tr.dependencies;
        this._options = t2 = _({ addons: tr.addons, autoOpen: true, indexedDB: n2.indexedDB, IDBKeyRange: n2.IDBKeyRange, cache: "cloned" }, t2), this._deps = { indexedDB: t2.indexedDB, IDBKeyRange: t2.IDBKeyRange };
        n2 = t2.addons;
        this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this;
        var a2, r2, u2, i2, s2, c2 = { dbOpenError: null, isBeingOpened: false, onReadyBeingFired: null, openComplete: false, dbReadyResolve: G, dbReadyPromise: null, cancelOpen: G, openCanceller: null, autoSchema: true, PR1398_maxLoop: 3, autoOpen: t2.autoOpen };
        c2.dbReadyPromise = new _e(function(e3) {
          c2.dbReadyResolve = e3;
        }), c2.openCanceller = new _e(function(e3, t3) {
          c2.cancelOpen = t3;
        }), this._state = c2, this.name = e2, this.on = dt(this, "populate", "blocked", "versionchange", "close", { ready: [re, G] }), this.on.ready.subscribe = p(this.on.ready.subscribe, function(i3) {
          return function(n3, r3) {
            tr.vip(function() {
              var t3, e3 = o2._state;
              e3.openComplete ? (e3.dbOpenError || _e.resolve().then(n3), r3 && i3(n3)) : e3.onReadyBeingFired ? (e3.onReadyBeingFired.push(n3), r3 && i3(n3)) : (i3(n3), t3 = o2, r3 || i3(function e4() {
                t3.on.ready.unsubscribe(n3), t3.on.ready.unsubscribe(e4);
              }));
            });
          };
        }), this.Collection = (a2 = this, pt(Ot.prototype, function(e3, t3) {
          this.db = a2;
          var n3 = ot, r3 = null;
          if (t3) try {
            n3 = t3();
          } catch (e4) {
            r3 = e4;
          }
          var i3 = e3._ctx, t3 = i3.table, e3 = t3.hook.reading.fire;
          this._ctx = { table: t3, index: i3.index, isPrimKey: !i3.index || t3.schema.primKey.keyPath && i3.index === t3.schema.primKey.name, range: n3, keysOnly: false, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: true, isMatch: null, offset: 0, limit: 1 / 0, error: r3, or: i3.or, valueMapper: e3 !== X ? e3 : null };
        })), this.Table = (r2 = this, pt(ft.prototype, function(e3, t3, n3) {
          this.db = r2, this._tx = n3, this.name = e3, this.schema = t3, this.hook = r2._allTables[e3] ? r2._allTables[e3].hook : dt(null, { creating: [Z, G], reading: [H, X], updating: [te, G], deleting: [ee, G] });
        })), this.Transaction = (u2 = this, pt(Lt.prototype, function(e3, t3, n3, r3, i3) {
          var o3 = this;
          this.db = u2, this.mode = e3, this.storeNames = t3, this.schema = n3, this.chromeTransactionDurability = r3, this.idbtrans = null, this.on = dt(this, "complete", "error", "abort"), this.parent = i3 || null, this.active = true, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new _e(function(e4, t4) {
            o3._resolve = e4, o3._reject = t4;
          }), this._completion.then(function() {
            o3.active = false, o3.on.complete.fire();
          }, function(e4) {
            var t4 = o3.active;
            return o3.active = false, o3.on.error.fire(e4), o3.parent ? o3.parent._reject(e4) : t4 && o3.idbtrans && o3.idbtrans.abort(), Xe(e4);
          });
        })), this.Version = (i2 = this, pt(dn.prototype, function(e3) {
          this.db = i2, this._cfg = { version: e3, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
        })), this.WhereClause = (s2 = this, pt(Dt.prototype, function(e3, t3, n3) {
          if (this.db = s2, this._ctx = { table: e3, index: ":id" === t3 ? null : t3, or: n3 }, this._cmp = this._ascending = st, this._descending = function(e4, t4) {
            return st(t4, e4);
          }, this._max = function(e4, t4) {
            return 0 < st(e4, t4) ? e4 : t4;
          }, this._min = function(e4, t4) {
            return st(e4, t4) < 0 ? e4 : t4;
          }, this._IDBKeyRange = s2._deps.IDBKeyRange, !this._IDBKeyRange) throw new Y.MissingAPI();
        })), this.on("versionchange", function(e3) {
          0 < e3.newVersion ? console.warn("Another connection wants to upgrade database '".concat(o2.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(o2.name, "'. Closing db now to resume the delete request.")), o2.close({ disableAutoOpen: false });
        }), this.on("blocked", function(e3) {
          !e3.newVersion || e3.newVersion < e3.oldVersion ? console.warn("Dexie.delete('".concat(o2.name, "') was blocked")) : console.warn("Upgrade '".concat(o2.name, "' blocked by other connection holding version ").concat(e3.oldVersion / 10));
        }), this._maxKey = Yt(t2.IDBKeyRange), this._createTransaction = function(e3, t3, n3, r3) {
          return new o2.Transaction(e3, t3, n3, o2._options.chromeTransactionDurability, r3);
        }, this._fireOnBlocked = function(t3) {
          o2.on("blocked").fire(t3), et.filter(function(e3) {
            return e3.name === o2.name && e3 !== o2 && !e3._state.vcFired;
          }).map(function(e3) {
            return e3.on("versionchange").fire(t3);
          });
        }, this.use(Un), this.use(Jn), this.use(Wn), this.use(Rn), this.use(Nn);
        var l2 = new Proxy(this, { get: function(e3, t3, n3) {
          if ("_vip" === t3) return true;
          if ("table" === t3) return function(e4) {
            return Zn(o2.table(e4), l2);
          };
          var r3 = Reflect.get(e3, t3, n3);
          return r3 instanceof ft ? Zn(r3, l2) : "tables" === t3 ? r3.map(function(e4) {
            return Zn(e4, l2);
          }) : "_createTransaction" === t3 ? function() {
            return Zn(r3.apply(this, arguments), l2);
          } : r3;
        } });
        this.vip = l2, n2.forEach(function(e3) {
          return e3(o2);
        });
      }
      var nr, M = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", rr = (ir.prototype.subscribe = function(e2, t2, n2) {
        return this._subscribe(e2 && "function" != typeof e2 ? e2 : { next: e2, error: t2, complete: n2 });
      }, ir.prototype[M] = function() {
        return this;
      }, ir);
      function ir(e2) {
        this._subscribe = e2;
      }
      try {
        nr = { indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB, IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange };
      } catch (e2) {
        nr = { indexedDB: null, IDBKeyRange: null };
      }
      function or(h2) {
        var d2, p2 = false, e2 = new rr(function(r2) {
          var i2 = B(h2);
          var o2, a2 = false, u2 = {}, s2 = {}, e3 = { get closed() {
            return a2;
          }, unsubscribe: function() {
            a2 || (a2 = true, o2 && o2.abort(), c2 && Nt.storagemutated.unsubscribe(f2));
          } };
          r2.start && r2.start(e3);
          var c2 = false, l2 = function() {
            return Ge(t2);
          };
          var f2 = function(e4) {
            Kn(u2, e4), En(s2, u2) && l2();
          }, t2 = function() {
            var t3, n2, e4;
            !a2 && nr.indexedDB && (u2 = {}, t3 = {}, o2 && o2.abort(), o2 = new AbortController(), e4 = function(e5) {
              var t4 = je();
              try {
                i2 && Le();
                var n3 = Ne(h2, e5);
                return n3 = i2 ? n3.finally(Ue) : n3;
              } finally {
                t4 && Ae();
              }
            }(n2 = { subscr: t3, signal: o2.signal, requery: l2, querier: h2, trans: null }), Promise.resolve(e4).then(function(e5) {
              p2 = true, d2 = e5, a2 || n2.signal.aborted || (u2 = {}, function(e6) {
                for (var t4 in e6) if (m(e6, t4)) return;
                return 1;
              }(s2 = t3) || c2 || (Nt(Mt, f2), c2 = true), Ge(function() {
                return !a2 && r2.next && r2.next(e5);
              }));
            }, function(e5) {
              p2 = false, ["DatabaseClosedError", "AbortError"].includes(null == e5 ? void 0 : e5.name) || a2 || Ge(function() {
                a2 || r2.error && r2.error(e5);
              });
            }));
          };
          return setTimeout(l2, 0), e3;
        });
        return e2.hasValue = function() {
          return p2;
        }, e2.getValue = function() {
          return d2;
        }, e2;
      }
      var ar = er;
      function ur(e2) {
        var t2 = cr;
        try {
          cr = true, Nt.storagemutated.fire(e2), Tn(e2, true);
        } finally {
          cr = t2;
        }
      }
      r(ar, _(_({}, Q), { delete: function(e2) {
        return new ar(e2, { addons: [] }).delete();
      }, exists: function(e2) {
        return new ar(e2, { addons: [] }).open().then(function(e3) {
          return e3.close(), true;
        }).catch("NoSuchDatabaseError", function() {
          return false;
        });
      }, getDatabaseNames: function(e2) {
        try {
          return t2 = ar.dependencies, n2 = t2.indexedDB, t2 = t2.IDBKeyRange, (vn(n2) ? Promise.resolve(n2.databases()).then(function(e3) {
            return e3.map(function(e4) {
              return e4.name;
            }).filter(function(e4) {
              return e4 !== tt;
            });
          }) : yn(n2, t2).toCollection().primaryKeys()).then(e2);
        } catch (e3) {
          return Xe(new Y.MissingAPI());
        }
        var t2, n2;
      }, defineClass: function() {
        return function(e2) {
          a(this, e2);
        };
      }, ignoreTransaction: function(e2) {
        return me.trans ? $e(me.transless, e2) : e2();
      }, vip: mn, async: function(t2) {
        return function() {
          try {
            var e2 = In(t2.apply(this, arguments));
            return e2 && "function" == typeof e2.then ? e2 : _e.resolve(e2);
          } catch (e3) {
            return Xe(e3);
          }
        };
      }, spawn: function(e2, t2, n2) {
        try {
          var r2 = In(e2.apply(n2, t2 || []));
          return r2 && "function" == typeof r2.then ? r2 : _e.resolve(r2);
        } catch (e3) {
          return Xe(e3);
        }
      }, currentTransaction: { get: function() {
        return me.trans || null;
      } }, waitFor: function(e2, t2) {
        t2 = _e.resolve("function" == typeof e2 ? ar.ignoreTransaction(e2) : e2).timeout(t2 || 6e4);
        return me.trans ? me.trans.waitFor(t2) : t2;
      }, Promise: _e, debug: { get: function() {
        return ie;
      }, set: function(e2) {
        oe(e2);
      } }, derive: o, extend: a, props: r, override: p, Events: dt, on: Nt, liveQuery: or, extendObservabilitySet: Kn, getByKeyPath: O, setByKeyPath: P, delByKeyPath: function(t2, e2) {
        "string" == typeof e2 ? P(t2, e2, void 0) : "length" in e2 && [].map.call(e2, function(e3) {
          P(t2, e3, void 0);
        });
      }, shallowClone: g, deepClone: S, getObjectDiff: Mn, cmp: st, asap: v, minKey: -1 / 0, addons: [], connections: et, errnames: z, dependencies: nr, cache: Sn, semVer: "4.0.10", version: "4.0.10".split(".").map(function(e2) {
        return parseInt(e2);
      }).reduce(function(e2, t2, n2) {
        return e2 + t2 / Math.pow(10, 2 * n2);
      }) })), ar.maxKey = Yt(ar.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Nt(Mt, function(e2) {
        cr || (e2 = new CustomEvent(Ft, { detail: e2 }), cr = true, dispatchEvent(e2), cr = false);
      }), addEventListener(Ft, function(e2) {
        e2 = e2.detail;
        cr || ur(e2);
      }));
      var sr, cr = false, lr = function() {
      };
      return "undefined" != typeof BroadcastChannel && ((lr = function() {
        (sr = new BroadcastChannel(Ft)).onmessage = function(e2) {
          return e2.data && ur(e2.data);
        };
      })(), "function" == typeof sr.unref && sr.unref(), Nt(Mt, function(e2) {
        cr || sr.postMessage(e2);
      })), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e2) {
        if (!er.disableBfCache && e2.persisted) {
          ie && console.debug("Dexie: handling persisted pagehide"), null != sr && sr.close();
          for (var t2 = 0, n2 = et; t2 < n2.length; t2++) n2[t2].close({ disableAutoOpen: false });
        }
      }), addEventListener("pageshow", function(e2) {
        !er.disableBfCache && e2.persisted && (ie && console.debug("Dexie: handling persisted pageshow"), lr(), ur({ all: new gn(-1 / 0, [[]]) }));
      })), _e.rejectionMapper = function(e2, t2) {
        return !e2 || e2 instanceof N || e2 instanceof TypeError || e2 instanceof SyntaxError || !e2.name || !$[e2.name] ? e2 : (t2 = new $[e2.name](t2 || e2.message, e2), "stack" in e2 && l(t2, "stack", { get: function() {
          return this.inner.stack;
        } }), t2);
      }, oe(ie), _(er, Object.freeze({ __proto__: null, Dexie: er, liveQuery: or, Entity: ut, cmp: st, PropModSymbol: e, PropModification: xt, replacePrefix: function(e2, t2) {
        return new xt({ replacePrefix: [e2, t2] });
      }, add: function(e2) {
        return new xt({ add: e2 });
      }, remove: function(e2) {
        return new xt({ remove: e2 });
      }, default: er, RangeSet: gn, mergeRanges: _n, rangesOverlap: xn }), { default: er }), er;
    });
  })(dexie_min$1);
  return dexie_min$1.exports;
}
var dexie_minExports = requireDexie_min();
const _Dexie = /* @__PURE__ */ getDefaultExportFromCjs(dexie_minExports);
const DexieSymbol = Symbol.for("Dexie");
const Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = _Dexie);
if (_Dexie.semVer !== Dexie.semVer) {
  throw new Error(`Two different versions of Dexie loaded in the same app: ${_Dexie.semVer} and ${Dexie.semVer}`);
}
const {
  liveQuery,
  mergeRanges,
  rangesOverlap,
  RangeSet,
  cmp,
  Entity,
  PropModSymbol,
  PropModification,
  replacePrefix,
  add,
  remove
} = Dexie;
var DEXIE_DOCS_TABLE_NAME = "docs";
var DEXIE_CHANGES_TABLE_NAME = "changes";
var DEXIE_ATTACHMENTS_TABLE_NAME = "attachments";
var RX_STORAGE_NAME_DEXIE = "dexie";
var DEXIE_STATE_DB_BY_NAME = /* @__PURE__ */ new Map();
var REF_COUNT_PER_DEXIE_DB = /* @__PURE__ */ new Map();
function getDexieDbWithTables(databaseName, collectionName, settings, schema) {
  var dexieDbName = "rxdb-dexie-" + databaseName + "--" + schema.version + "--" + collectionName;
  var state = getFromMapOrCreate(DEXIE_STATE_DB_BY_NAME, dexieDbName, () => {
    var value = (async () => {
      var useSettings = flatClone(settings);
      useSettings.autoOpen = false;
      var dexieDb = new Dexie(dexieDbName, useSettings);
      if (settings.onCreate) {
        await settings.onCreate(dexieDb, dexieDbName);
      }
      var dexieStoresSettings = {
        [DEXIE_DOCS_TABLE_NAME]: getDexieStoreSchema(schema),
        [DEXIE_CHANGES_TABLE_NAME]: "++sequence, id",
        [DEXIE_ATTACHMENTS_TABLE_NAME]: "id"
      };
      dexieDb.version(1).stores(dexieStoresSettings);
      await dexieDb.open();
      return {
        dexieDb,
        dexieTable: dexieDb[DEXIE_DOCS_TABLE_NAME],
        dexieAttachmentsTable: dexieDb[DEXIE_ATTACHMENTS_TABLE_NAME],
        booleanIndexes: getBooleanIndexes(schema)
      };
    })();
    DEXIE_STATE_DB_BY_NAME.set(dexieDbName, state);
    REF_COUNT_PER_DEXIE_DB.set(state, 0);
    return value;
  });
  return state;
}
async function closeDexieDb(statePromise) {
  var state = await statePromise;
  var prevCount = REF_COUNT_PER_DEXIE_DB.get(statePromise);
  var newCount = prevCount - 1;
  if (newCount === 0) {
    state.dexieDb.close();
    REF_COUNT_PER_DEXIE_DB.delete(statePromise);
  } else {
    REF_COUNT_PER_DEXIE_DB.set(statePromise, newCount);
  }
}
var DEXIE_PIPE_SUBSTITUTE = "__";
function dexieReplaceIfStartsWithPipe(str) {
  var split = str.split(".");
  if (split.length > 1) {
    return split.map((part) => dexieReplaceIfStartsWithPipe(part)).join(".");
  }
  if (str.startsWith("|")) {
    var withoutFirst = str.substring(1);
    return DEXIE_PIPE_SUBSTITUTE + withoutFirst;
  } else {
    return str;
  }
}
function dexieReplaceIfStartsWithPipeRevert(str) {
  var split = str.split(".");
  if (split.length > 1) {
    return split.map((part) => dexieReplaceIfStartsWithPipeRevert(part)).join(".");
  }
  if (str.startsWith(DEXIE_PIPE_SUBSTITUTE)) {
    var withoutFirst = str.substring(DEXIE_PIPE_SUBSTITUTE.length);
    return "|" + withoutFirst;
  } else {
    return str;
  }
}
function fromStorageToDexie(booleanIndexes, inputDoc) {
  if (!inputDoc) {
    return inputDoc;
  }
  var d = flatClone(inputDoc);
  d = fromStorageToDexieField(d);
  booleanIndexes.forEach((idx) => {
    var val = getProperty$1(inputDoc, idx);
    var newVal = val ? "1" : "0";
    var useIndex = dexieReplaceIfStartsWithPipe(idx);
    setProperty(d, useIndex, newVal);
  });
  return d;
}
function fromDexieToStorage(booleanIndexes, d) {
  if (!d) {
    return d;
  }
  d = flatClone(d);
  d = fromDexieToStorageField(d);
  booleanIndexes.forEach((idx) => {
    var val = getProperty$1(d, idx);
    var newVal = val === "1" ? true : false;
    setProperty(d, idx, newVal);
  });
  return d;
}
function fromStorageToDexieField(documentData) {
  if (!documentData || typeof documentData === "string" || typeof documentData === "number" || typeof documentData === "boolean") {
    return documentData;
  } else if (Array.isArray(documentData)) {
    return documentData.map((row) => fromStorageToDexieField(row));
  } else if (typeof documentData === "object") {
    var ret = {};
    Object.entries(documentData).forEach(([key, value]) => {
      if (typeof value === "object") {
        value = fromStorageToDexieField(value);
      }
      ret[dexieReplaceIfStartsWithPipe(key)] = value;
    });
    return ret;
  }
}
function fromDexieToStorageField(documentData) {
  if (!documentData || typeof documentData === "string" || typeof documentData === "number" || typeof documentData === "boolean") {
    return documentData;
  } else if (Array.isArray(documentData)) {
    return documentData.map((row) => fromDexieToStorageField(row));
  } else if (typeof documentData === "object") {
    var ret = {};
    Object.entries(documentData).forEach(([key, value]) => {
      if (typeof value === "object" || Array.isArray(documentData)) {
        value = fromDexieToStorageField(value);
      }
      ret[dexieReplaceIfStartsWithPipeRevert(key)] = value;
    });
    return ret;
  }
}
function getDexieStoreSchema(rxJsonSchema) {
  var parts = [];
  var primaryKey = getPrimaryFieldOfPrimaryKey(rxJsonSchema.primaryKey);
  parts.push([primaryKey]);
  parts.push(["_deleted", primaryKey]);
  if (rxJsonSchema.indexes) {
    rxJsonSchema.indexes.forEach((index) => {
      var arIndex = toArray(index);
      parts.push(arIndex);
    });
  }
  parts.push(["_meta.lwt", primaryKey]);
  parts.push(["_meta.lwt"]);
  parts = parts.map((part) => {
    return part.map((str) => dexieReplaceIfStartsWithPipe(str));
  });
  var dexieSchemaRows = parts.map((part) => {
    if (part.length === 1) {
      return part[0];
    } else {
      return "[" + part.join("+") + "]";
    }
  });
  dexieSchemaRows = dexieSchemaRows.filter((elem, pos, arr) => arr.indexOf(elem) === pos);
  var dexieSchema = dexieSchemaRows.join(", ");
  return dexieSchema;
}
async function getDocsInDb(internals, docIds) {
  var state = await internals;
  var docsInDb = await state.dexieTable.bulkGet(docIds);
  return docsInDb.map((d) => fromDexieToStorage(state.booleanIndexes, d));
}
function attachmentObjectId(documentId, attachmentId) {
  return documentId + "||" + attachmentId;
}
function getBooleanIndexes(schema) {
  var checkedFields = /* @__PURE__ */ new Set();
  var ret = [];
  if (!schema.indexes) {
    return ret;
  }
  schema.indexes.forEach((index) => {
    var fields = toArray(index);
    fields.forEach((field) => {
      if (checkedFields.has(field)) {
        return;
      }
      checkedFields.add(field);
      var schemaObj = getSchemaByObjectPath(schema, field);
      if (schemaObj.type === "boolean") {
        ret.push(field);
      }
    });
  });
  ret.push("_deleted");
  return uniqueArray(ret);
}
function mapKeyForKeyRange(k) {
  if (k === INDEX_MIN) {
    return -Infinity;
  } else {
    return k;
  }
}
function rangeFieldToBooleanSubstitute(booleanIndexes, fieldName, value) {
  if (booleanIndexes.includes(fieldName)) {
    var newValue = value === INDEX_MAX || value === true ? "1" : "0";
    return newValue;
  } else {
    return value;
  }
}
function getKeyRangeByQueryPlan(booleanIndexes, queryPlan, IDBKeyRange2) {
  if (!IDBKeyRange2) {
    if (typeof window === "undefined") {
      throw new Error("IDBKeyRange missing");
    } else {
      IDBKeyRange2 = window.IDBKeyRange;
    }
  }
  var startKeys = queryPlan.startKeys.map((v, i) => {
    var fieldName = queryPlan.index[i];
    return rangeFieldToBooleanSubstitute(booleanIndexes, fieldName, v);
  }).map(mapKeyForKeyRange);
  var endKeys = queryPlan.endKeys.map((v, i) => {
    var fieldName = queryPlan.index[i];
    return rangeFieldToBooleanSubstitute(booleanIndexes, fieldName, v);
  }).map(mapKeyForKeyRange);
  var keyRange = IDBKeyRange2.bound(startKeys, endKeys, !queryPlan.inclusiveStart, !queryPlan.inclusiveEnd);
  return keyRange;
}
async function dexieQuery(instance, preparedQuery) {
  var state = await instance.internals;
  var query = preparedQuery.query;
  var skip = query.skip ? query.skip : 0;
  var limit = query.limit ? query.limit : Infinity;
  var skipPlusLimit = skip + limit;
  var queryPlan = preparedQuery.queryPlan;
  var queryMatcher = false;
  if (!queryPlan.selectorSatisfiedByIndex) {
    queryMatcher = getQueryMatcher(instance.schema, preparedQuery.query);
  }
  var keyRange = getKeyRangeByQueryPlan(state.booleanIndexes, queryPlan, state.dexieDb._options.IDBKeyRange);
  var queryPlanFields = queryPlan.index;
  var rows = [];
  await state.dexieDb.transaction("r", state.dexieTable, async (dexieTx) => {
    var tx = dexieTx.idbtrans;
    var store = tx.objectStore(DEXIE_DOCS_TABLE_NAME);
    var index;
    var indexName;
    indexName = "[" + queryPlanFields.map((field) => dexieReplaceIfStartsWithPipe(field)).join("+") + "]";
    index = store.index(indexName);
    var cursorReq = index.openCursor(keyRange);
    await new Promise((res) => {
      cursorReq.onsuccess = function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var docData = fromDexieToStorage(state.booleanIndexes, cursor.value);
          if (!queryMatcher || queryMatcher(docData)) {
            rows.push(docData);
          }
          if (queryPlan.sortSatisfiedByIndex && rows.length === skipPlusLimit) {
            res();
          } else {
            cursor.continue();
          }
        } else {
          res();
        }
      };
    });
  });
  if (!queryPlan.sortSatisfiedByIndex) {
    var sortComparator = getSortComparator(instance.schema, preparedQuery.query);
    rows = rows.sort(sortComparator);
  }
  rows = rows.slice(skip, skipPlusLimit);
  return {
    documents: rows
  };
}
async function dexieCount(instance, preparedQuery) {
  var state = await instance.internals;
  var queryPlan = preparedQuery.queryPlan;
  var queryPlanFields = queryPlan.index;
  var keyRange = getKeyRangeByQueryPlan(state.booleanIndexes, queryPlan, state.dexieDb._options.IDBKeyRange);
  var count = -1;
  await state.dexieDb.transaction("r", state.dexieTable, async (dexieTx) => {
    var tx = dexieTx.idbtrans;
    var store = tx.objectStore(DEXIE_DOCS_TABLE_NAME);
    var index;
    var indexName;
    indexName = "[" + queryPlanFields.map((field) => dexieReplaceIfStartsWithPipe(field)).join("+") + "]";
    index = store.index(indexName);
    var request = index.count(keyRange);
    count = await new Promise((res, rej) => {
      request.onsuccess = function() {
        res(request.result);
      };
      request.onerror = (err) => rej(err);
    });
  });
  return count;
}
var instanceId = now$1();
var shownNonPremiumLog = false;
var RxStorageInstanceDexie = /* @__PURE__ */ function() {
  function RxStorageInstanceDexie2(storage, databaseName, collectionName, schema, internals, options, settings, devMode) {
    this.changes$ = new Subject();
    this.instanceId = instanceId++;
    this.storage = storage;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.schema = schema;
    this.internals = internals;
    this.options = options;
    this.settings = settings;
    this.devMode = devMode;
    this.primaryPath = getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }
  var _proto = RxStorageInstanceDexie2.prototype;
  _proto.bulkWrite = async function bulkWrite(documentWrites, context) {
    ensureNotClosed(this);
    if (!shownNonPremiumLog && !await hasPremiumFlag()) {
      console.warn(["-------------- RxDB Open Core RxStorage -------------------------------", "You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie ", "While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.", "For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.", " https://rxdb.info/premium/?console=dexie ", "If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.", "---------------------------------------------------------------------"].join("\n"));
      shownNonPremiumLog = true;
    } else {
      shownNonPremiumLog = true;
    }
    documentWrites.forEach((row) => {
      if (!row.document._rev || row.previous && !row.previous._rev) {
        throw newRxError("SNH", {
          args: {
            row
          }
        });
      }
    });
    var state = await this.internals;
    var ret = {
      error: []
    };
    if (this.devMode) {
      documentWrites = documentWrites.map((row) => {
        var doc = flatCloneDocWithMeta(row.document);
        return {
          previous: row.previous,
          document: doc
        };
      });
    }
    var documentKeys = documentWrites.map((writeRow) => writeRow.document[this.primaryPath]);
    var categorized;
    await state.dexieDb.transaction("rw", state.dexieTable, state.dexieAttachmentsTable, async () => {
      var docsInDbMap = /* @__PURE__ */ new Map();
      var docsInDbWithInternals = await getDocsInDb(this.internals, documentKeys);
      docsInDbWithInternals.forEach((docWithDexieInternals) => {
        var doc = docWithDexieInternals;
        if (doc) {
          docsInDbMap.set(doc[this.primaryPath], doc);
        }
        return doc;
      });
      categorized = categorizeBulkWriteRows(this, this.primaryPath, docsInDbMap, documentWrites, context);
      ret.error = categorized.errors;
      var bulkPutDocs = [];
      categorized.bulkInsertDocs.forEach((row) => {
        bulkPutDocs.push(row.document);
      });
      categorized.bulkUpdateDocs.forEach((row) => {
        bulkPutDocs.push(row.document);
      });
      bulkPutDocs = bulkPutDocs.map((d) => fromStorageToDexie(state.booleanIndexes, d));
      if (bulkPutDocs.length > 0) {
        await state.dexieTable.bulkPut(bulkPutDocs);
      }
      var putAttachments = [];
      categorized.attachmentsAdd.forEach((attachment) => {
        putAttachments.push({
          id: attachmentObjectId(attachment.documentId, attachment.attachmentId),
          data: attachment.attachmentData.data
        });
      });
      categorized.attachmentsUpdate.forEach((attachment) => {
        putAttachments.push({
          id: attachmentObjectId(attachment.documentId, attachment.attachmentId),
          data: attachment.attachmentData.data
        });
      });
      await state.dexieAttachmentsTable.bulkPut(putAttachments);
      await state.dexieAttachmentsTable.bulkDelete(categorized.attachmentsRemove.map((attachment) => attachmentObjectId(attachment.documentId, attachment.attachmentId)));
    });
    categorized = ensureNotFalsy(categorized);
    if (categorized.eventBulk.events.length > 0) {
      var lastState = ensureNotFalsy(categorized.newestRow).document;
      categorized.eventBulk.checkpoint = {
        id: lastState[this.primaryPath],
        lwt: lastState._meta.lwt
      };
      this.changes$.next(categorized.eventBulk);
    }
    return ret;
  };
  _proto.findDocumentsById = async function findDocumentsById(ids, deleted) {
    ensureNotClosed(this);
    var state = await this.internals;
    var ret = [];
    await state.dexieDb.transaction("r", state.dexieTable, async () => {
      var docsInDb = await getDocsInDb(this.internals, ids);
      docsInDb.forEach((documentInDb) => {
        if (documentInDb && (!documentInDb._deleted || deleted)) {
          ret.push(documentInDb);
        }
      });
    });
    return ret;
  };
  _proto.query = function query(preparedQuery) {
    ensureNotClosed(this);
    return dexieQuery(this, preparedQuery);
  };
  _proto.count = async function count(preparedQuery) {
    if (preparedQuery.queryPlan.selectorSatisfiedByIndex) {
      var result = await dexieCount(this, preparedQuery);
      return {
        count: result,
        mode: "fast"
      };
    } else {
      var _result2 = await dexieQuery(this, preparedQuery);
      return {
        count: _result2.documents.length,
        mode: "slow"
      };
    }
  };
  _proto.changeStream = function changeStream() {
    ensureNotClosed(this);
    return this.changes$.asObservable();
  };
  _proto.cleanup = async function cleanup(minimumDeletedTime) {
    ensureNotClosed(this);
    var state = await this.internals;
    await state.dexieDb.transaction("rw", state.dexieTable, async () => {
      var maxDeletionTime = now$1() - minimumDeletedTime;
      var toRemove = await state.dexieTable.where("_meta.lwt").below(maxDeletionTime).toArray();
      var removeIds = [];
      toRemove.forEach((doc) => {
        if (doc._deleted === "1") {
          removeIds.push(doc[this.primaryPath]);
        }
      });
      await state.dexieTable.bulkDelete(removeIds);
    });
    return true;
  };
  _proto.getAttachmentData = async function getAttachmentData(documentId, attachmentId, _digest) {
    ensureNotClosed(this);
    var state = await this.internals;
    var id = attachmentObjectId(documentId, attachmentId);
    return await state.dexieDb.transaction("r", state.dexieAttachmentsTable, async () => {
      var attachment = await state.dexieAttachmentsTable.get(id);
      if (attachment) {
        return attachment.data;
      } else {
        throw new Error("attachment missing documentId: " + documentId + " attachmentId: " + attachmentId);
      }
    });
  };
  _proto.remove = async function remove2() {
    ensureNotClosed(this);
    var state = await this.internals;
    await state.dexieTable.clear();
    return this.close();
  };
  _proto.close = function close3() {
    if (this.closed) {
      return this.closed;
    }
    this.closed = (async () => {
      this.changes$.complete();
      await closeDexieDb(this.internals);
    })();
    return this.closed;
  };
  return RxStorageInstanceDexie2;
}();
async function createDexieStorageInstance(storage, params, settings) {
  var internals = getDexieDbWithTables(params.databaseName, params.collectionName, settings, params.schema);
  var instance = new RxStorageInstanceDexie(storage, params.databaseName, params.collectionName, params.schema, internals, params.options, settings, params.devMode);
  await addRxStorageMultiInstanceSupport(RX_STORAGE_NAME_DEXIE, params, instance);
  return Promise.resolve(instance);
}
function ensureNotClosed(instance) {
  if (instance.closed) {
    throw new Error("RxStorageInstanceDexie is closed " + instance.databaseName + "-" + instance.collectionName);
  }
}
var RxStorageDexie = /* @__PURE__ */ function() {
  function RxStorageDexie2(settings) {
    this.name = RX_STORAGE_NAME_DEXIE;
    this.rxdbVersion = RXDB_VERSION;
    this.settings = settings;
  }
  var _proto = RxStorageDexie2.prototype;
  _proto.createStorageInstance = function createStorageInstance(params) {
    ensureRxStorageInstanceParamsAreCorrect(params);
    if (params.schema.indexes) {
      var indexFields = params.schema.indexes.flat();
      indexFields.filter((indexField) => !indexField.includes(".")).forEach((indexField) => {
        if (!params.schema.required || !params.schema.required.includes(indexField)) {
          throw newRxError("DXE1", {
            field: indexField,
            schema: params.schema
          });
        }
      });
    }
    return createDexieStorageInstance(this, params, this.settings);
  };
  return RxStorageDexie2;
}();
function getRxStorageDexie(settings = {}) {
  var storage = new RxStorageDexie(settings);
  return storage;
}
var SPECIAL_PROPERTIES = ["__proto__", "constructor", "prototype"];
function merge(to, from2) {
  Object.keys(from2).forEach((key) => {
    if (SPECIAL_PROPERTIES.includes(key)) {
      return;
    }
    if (typeof to[key] === "undefined") {
      to[key] = from2[key];
    } else {
      if (isObject(from2[key])) merge(to[key], from2[key]);
      else to[key] = from2[key];
    }
  });
}
function isObject(arg) {
  return "[object Object]" === arg.toString();
}
var NoSqlQueryBuilderClass = /* @__PURE__ */ function() {
  function NoSqlQueryBuilderClass2(mangoQuery, _path) {
    this.options = {};
    this._conditions = {};
    this._fields = {};
    this._path = _path;
    if (mangoQuery) {
      var queryBuilder = this;
      if (mangoQuery.selector) {
        queryBuilder.find(mangoQuery.selector);
      }
      if (mangoQuery.limit) {
        queryBuilder.limit(mangoQuery.limit);
      }
      if (mangoQuery.skip) {
        queryBuilder.skip(mangoQuery.skip);
      }
      if (mangoQuery.sort) {
        mangoQuery.sort.forEach((s) => queryBuilder.sort(s));
      }
    }
  }
  var _proto = NoSqlQueryBuilderClass2.prototype;
  _proto.where = function where(_path, _val) {
    if (!arguments.length) return this;
    var type2 = typeof arguments[0];
    if ("string" === type2) {
      this._path = arguments[0];
      if (2 === arguments.length) {
        this._conditions[this._path] = arguments[1];
      }
      return this;
    }
    if ("object" === type2 && !Array.isArray(arguments[0])) {
      return this.merge(arguments[0]);
    }
    throw newRxTypeError("MQ1", {
      path: arguments[0]
    });
  };
  _proto.equals = function equals(val) {
    this._ensurePath("equals");
    var path = this._path;
    this._conditions[path] = val;
    return this;
  };
  _proto.eq = function eq(val) {
    this._ensurePath("eq");
    var path = this._path;
    this._conditions[path] = val;
    return this;
  };
  _proto.or = function or(array) {
    var or2 = this._conditions.$or || (this._conditions.$or = []);
    if (!Array.isArray(array)) array = [array];
    or2.push.apply(or2, array);
    return this;
  };
  _proto.nor = function nor(array) {
    var nor2 = this._conditions.$nor || (this._conditions.$nor = []);
    if (!Array.isArray(array)) array = [array];
    nor2.push.apply(nor2, array);
    return this;
  };
  _proto.and = function and(array) {
    var and2 = this._conditions.$and || (this._conditions.$and = []);
    if (!Array.isArray(array)) array = [array];
    and2.push.apply(and2, array);
    return this;
  };
  _proto.mod = function mod(_path, _val) {
    var val;
    var path;
    if (1 === arguments.length) {
      this._ensurePath("mod");
      val = arguments[0];
      path = this._path;
    } else if (2 === arguments.length && !Array.isArray(arguments[1])) {
      this._ensurePath("mod");
      val = arguments.slice();
      path = this._path;
    } else if (3 === arguments.length) {
      val = arguments.slice(1);
      path = arguments[0];
    } else {
      val = arguments[1];
      path = arguments[0];
    }
    var conds = this._conditions[path] || (this._conditions[path] = {});
    conds.$mod = val;
    return this;
  };
  _proto.exists = function exists(_path, _val) {
    var path;
    var val;
    if (0 === arguments.length) {
      this._ensurePath("exists");
      path = this._path;
      val = true;
    } else if (1 === arguments.length) {
      if ("boolean" === typeof arguments[0]) {
        this._ensurePath("exists");
        path = this._path;
        val = arguments[0];
      } else {
        path = arguments[0];
        val = true;
      }
    } else if (2 === arguments.length) {
      path = arguments[0];
      val = arguments[1];
    }
    var conds = this._conditions[path] || (this._conditions[path] = {});
    conds.$exists = val;
    return this;
  };
  _proto.elemMatch = function elemMatch(_path, _criteria) {
    if (null === arguments[0]) throw newRxTypeError("MQ2");
    var fn;
    var path;
    var criteria;
    if ("function" === typeof arguments[0]) {
      this._ensurePath("elemMatch");
      path = this._path;
      fn = arguments[0];
    } else if (isObject(arguments[0])) {
      this._ensurePath("elemMatch");
      path = this._path;
      criteria = arguments[0];
    } else if ("function" === typeof arguments[1]) {
      path = arguments[0];
      fn = arguments[1];
    } else if (arguments[1] && isObject(arguments[1])) {
      path = arguments[0];
      criteria = arguments[1];
    } else throw newRxTypeError("MQ2");
    if (fn) {
      criteria = new NoSqlQueryBuilderClass2();
      fn(criteria);
      criteria = criteria._conditions;
    }
    var conds = this._conditions[path] || (this._conditions[path] = {});
    conds.$elemMatch = criteria;
    return this;
  };
  _proto.sort = function sort(arg) {
    if (!arg) return this;
    var len;
    var type2 = typeof arg;
    if (Array.isArray(arg)) {
      len = arg.length;
      for (var i = 0; i < arg.length; ++i) {
        _pushArr(this.options, arg[i][0], arg[i][1]);
      }
      return this;
    }
    if (1 === arguments.length && "string" === type2) {
      arg = arg.split(/\s+/);
      len = arg.length;
      for (var _i = 0; _i < len; ++_i) {
        var field = arg[_i];
        if (!field) continue;
        var ascend = "-" === field[0] ? -1 : 1;
        if (ascend === -1) field = field.substring(1);
        push(this.options, field, ascend);
      }
      return this;
    }
    if (isObject(arg)) {
      var keys = Object.keys(arg);
      keys.forEach((field2) => push(this.options, field2, arg[field2]));
      return this;
    }
    throw newRxTypeError("MQ3", {
      args: arguments
    });
  };
  _proto.merge = function merge$12(source) {
    if (!source) {
      return this;
    }
    if (!canMerge(source)) {
      throw newRxTypeError("MQ4", {
        source
      });
    }
    if (source instanceof NoSqlQueryBuilderClass2) {
      if (source._conditions) merge(this._conditions, source._conditions);
      if (source._fields) {
        if (!this._fields) this._fields = {};
        merge(this._fields, source._fields);
      }
      if (source.options) {
        if (!this.options) this.options = {};
        merge(this.options, source.options);
      }
      if (source._distinct) this._distinct = source._distinct;
      return this;
    }
    merge(this._conditions, source);
    return this;
  };
  _proto.find = function find(criteria) {
    if (canMerge(criteria)) {
      this.merge(criteria);
    }
    return this;
  };
  _proto._ensurePath = function _ensurePath(method) {
    if (!this._path) {
      throw newRxError("MQ5", {
        method
      });
    }
  };
  _proto.toJSON = function toJSON() {
    var query = {
      selector: this._conditions
    };
    if (this.options.skip) {
      query.skip = this.options.skip;
    }
    if (this.options.limit) {
      query.limit = this.options.limit;
    }
    if (this.options.sort) {
      query.sort = mQuerySortToRxDBSort(this.options.sort);
    }
    return {
      query,
      path: this._path
    };
  };
  return NoSqlQueryBuilderClass2;
}();
function mQuerySortToRxDBSort(sort) {
  return Object.entries(sort).map(([k, v]) => {
    var direction = v === 1 ? "asc" : "desc";
    var part = {
      [k]: direction
    };
    return part;
  });
}
var OTHER_MANGO_ATTRIBUTES = ["limit", "skip", "maxScan", "batchSize", "comment"];
OTHER_MANGO_ATTRIBUTES.forEach(function(method) {
  NoSqlQueryBuilderClass.prototype[method] = function(v) {
    this.options[method] = v;
    return this;
  };
});
var OTHER_MANGO_OPERATORS = ["gt", "gte", "lt", "lte", "ne", "in", "nin", "all", "regex", "size"];
OTHER_MANGO_OPERATORS.forEach(function($conditional) {
  NoSqlQueryBuilderClass.prototype[$conditional] = function() {
    var path;
    var val;
    if (1 === arguments.length) {
      this._ensurePath($conditional);
      val = arguments[0];
      path = this._path;
    } else {
      val = arguments[1];
      path = arguments[0];
    }
    var conds = this._conditions[path] === null || typeof this._conditions[path] === "object" ? this._conditions[path] : this._conditions[path] = {};
    if ($conditional === "regex") {
      if (val instanceof RegExp) {
        throw newRxError("QU16", {
          field: path,
          query: this._conditions
        });
      }
      if (typeof val === "string") {
        conds["$" + $conditional] = val;
      } else {
        conds["$" + $conditional] = val.$regex;
        if (val.$options) {
          conds.$options = val.$options;
        }
      }
    } else {
      conds["$" + $conditional] = val;
    }
    return this;
  };
});
function push(opts, field, value) {
  if (Array.isArray(opts.sort)) {
    throw newRxTypeError("MQ6", {
      opts,
      field,
      value
    });
  }
  if (value && value.$meta) {
    var sort = opts.sort || (opts.sort = {});
    sort[field] = {
      $meta: value.$meta
    };
    return;
  }
  var val = String(value || 1).toLowerCase();
  if (!/^(?:ascending|asc|descending|desc|1|-1)$/.test(val)) {
    if (Array.isArray(value)) value = "[" + value + "]";
    throw newRxTypeError("MQ7", {
      field,
      value
    });
  }
  var s = opts.sort || (opts.sort = {});
  var valueStr = value.toString().replace("asc", "1").replace("ascending", "1").replace("desc", "-1").replace("descending", "-1");
  s[field] = parseInt(valueStr, 10);
}
function _pushArr(opts, field, value) {
  opts.sort = opts.sort || [];
  if (!Array.isArray(opts.sort)) {
    throw newRxTypeError("MQ8", {
      opts,
      field,
      value
    });
  }
  opts.sort.push([field, value]);
}
function canMerge(conds) {
  return conds instanceof NoSqlQueryBuilderClass || isObject(conds);
}
function createQueryBuilder(query, path) {
  return new NoSqlQueryBuilderClass(query, path);
}
var RXQUERY_OTHER_FLAG = "queryBuilderPath";
function runBuildingStep(rxQuery, functionName, value) {
  var queryBuilder = createQueryBuilder(clone$1(rxQuery.mangoQuery), rxQuery.other[RXQUERY_OTHER_FLAG]);
  queryBuilder[functionName](value);
  var queryBuilderJson = queryBuilder.toJSON();
  return createRxQuery(rxQuery.op, queryBuilderJson.query, rxQuery.collection, {
    ...rxQuery.other,
    [RXQUERY_OTHER_FLAG]: queryBuilderJson.path
  });
}
function applyBuildingStep(proto, functionName) {
  proto[functionName] = function(value) {
    if (overwritable.isDevMode() && this.op === "findByIds") {
      throw newRxError("QU17", {
        collection: this.collection.name,
        query: this.mangoQuery
      });
    }
    return runBuildingStep(this, functionName, value);
  };
}
var RxDBQueryBuilderPlugin = {
  name: "query-builder",
  rxdb: true,
  prototypes: {
    RxQuery(proto) {
      ["where", "equals", "eq", "or", "nor", "and", "mod", "exists", "elemMatch", "sort"].forEach((attribute) => {
        applyBuildingStep(proto, attribute);
      });
      OTHER_MANGO_ATTRIBUTES.forEach((attribute) => {
        applyBuildingStep(proto, attribute);
      });
      OTHER_MANGO_OPERATORS.forEach((operator) => {
        applyBuildingStep(proto, operator);
      });
    }
  }
};
async function getOldCollectionMeta(migrationState) {
  var collectionDocKeys = getPreviousVersions(migrationState.collection.schema.jsonSchema).map((version) => migrationState.collection.name + "-" + version);
  var found = await migrationState.database.internalStore.findDocumentsById(collectionDocKeys.map((key) => getPrimaryKeyOfInternalDocument(key, INTERNAL_CONTEXT_COLLECTION)), false);
  if (found.length > 1) {
    throw new Error("more than one old collection meta found");
  }
  return found[0];
}
function migrateDocumentData(collection, docSchemaVersion, docData) {
  var attachmentsBefore = flatClone(docData._attachments);
  var mutateableDocData = clone$1(docData);
  var meta = mutateableDocData._meta;
  delete mutateableDocData._meta;
  mutateableDocData._attachments = attachmentsBefore;
  var nextVersion = docSchemaVersion + 1;
  var currentPromise = Promise.resolve(mutateableDocData);
  var _loop = function() {
    var version = nextVersion;
    currentPromise = currentPromise.then((docOrNull) => runStrategyIfNotNull(collection, version, docOrNull));
    nextVersion++;
  };
  while (nextVersion <= collection.schema.version) {
    _loop();
  }
  return currentPromise.then((doc) => {
    if (doc === null) {
      return PROMISE_RESOLVE_NULL;
    }
    doc._meta = meta;
    return doc;
  });
}
function runStrategyIfNotNull(collection, version, docOrNull) {
  if (docOrNull === null) {
    return PROMISE_RESOLVE_NULL;
  } else {
    var ret = collection.migrationStrategies[version](docOrNull, collection);
    var retPromise = toPromise(ret);
    return retPromise;
  }
}
async function mustMigrate(migrationState) {
  if (migrationState.collection.schema.version === 0) {
    return PROMISE_RESOLVE_FALSE;
  }
  var oldColDoc = await getOldCollectionMeta(migrationState);
  return !!oldColDoc;
}
var MIGRATION_DEFAULT_BATCH_SIZE = 200;
var DATA_MIGRATION_STATE_SUBJECT_BY_DATABASE = /* @__PURE__ */ new WeakMap();
function addMigrationStateToDatabase(migrationState) {
  var allSubject = getMigrationStateByDatabase(migrationState.database);
  var allList = allSubject.getValue().slice(0);
  allList.push(migrationState);
  allSubject.next(allList);
}
function getMigrationStateByDatabase(database) {
  return getFromMapOrCreate(DATA_MIGRATION_STATE_SUBJECT_BY_DATABASE, database, () => new BehaviorSubject([]));
}
function onDatabaseClose(database) {
  var subject = DATA_MIGRATION_STATE_SUBJECT_BY_DATABASE.get(database);
  if (subject) {
    subject.complete();
  }
}
var RxMigrationState = /* @__PURE__ */ function() {
  function RxMigrationState2(collection, migrationStrategies, statusDocKey = [collection.name, "v", collection.schema.version].join("-")) {
    this.started = false;
    this.updateStatusHandlers = [];
    this.updateStatusQueue = PROMISE_RESOLVE_TRUE;
    this.collection = collection;
    this.migrationStrategies = migrationStrategies;
    this.statusDocKey = statusDocKey;
    this.database = collection.database;
    this.oldCollectionMeta = getOldCollectionMeta(this);
    this.mustMigrate = mustMigrate(this);
    this.statusDocId = getPrimaryKeyOfInternalDocument(this.statusDocKey, INTERNAL_CONTEXT_MIGRATION_STATUS);
    addMigrationStateToDatabase(this);
    this.$ = observeSingle(this.database.internalStore, this.statusDocId).pipe(filter((d) => !!d), map((d) => ensureNotFalsy(d).data), shareReplay(RXJS_SHARE_REPLAY_DEFAULTS));
  }
  var _proto = RxMigrationState2.prototype;
  _proto.getStatus = function getStatus() {
    return firstValueFrom(this.$);
  };
  _proto.startMigration = async function startMigration(batchSize = MIGRATION_DEFAULT_BATCH_SIZE) {
    var must = await this.mustMigrate;
    if (!must) {
      return;
    }
    if (this.started) {
      throw newRxError("DM1");
    }
    this.started = true;
    var broadcastChannel = void 0;
    if (this.database.multiInstance) {
      broadcastChannel = new BroadcastChannel$1(["rx-migration-state", this.database.name, this.collection.name, this.collection.schema.version].join("|"));
      var leaderElector = createLeaderElection(broadcastChannel);
      await leaderElector.awaitLeadership();
    }
    var oldCollectionMeta = await this.oldCollectionMeta;
    var oldStorageInstance = await this.database.storage.createStorageInstance({
      databaseName: this.database.name,
      collectionName: this.collection.name,
      databaseInstanceToken: this.database.token,
      multiInstance: this.database.multiInstance,
      options: {},
      schema: oldCollectionMeta.data.schema,
      password: this.database.password,
      devMode: overwritable.isDevMode()
    });
    var connectedInstances = await this.getConnectedStorageInstances();
    var totalCount = await this.countAllDoucments([oldStorageInstance].concat(connectedInstances.map((r) => r.oldStorage)));
    await this.updateStatus((s) => {
      s.count.total = totalCount;
      return s;
    });
    try {
      await Promise.all(connectedInstances.map(async (connectedInstance) => {
        await addConnectedStorageToCollection(this.collection, connectedInstance.newStorage.collectionName, connectedInstance.newStorage.schema);
        await this.migrateStorage(connectedInstance.oldStorage, connectedInstance.newStorage, batchSize);
        await connectedInstance.newStorage.close();
      }));
      await this.migrateStorage(
        oldStorageInstance,
        /**
         * Use the originalStorageInstance here
         * so that the _meta.lwt time keeps the same
         * and our replication checkpoints still point to the
         * correct checkpoint.
         */
        this.collection.storageInstance.originalStorageInstance,
        batchSize
      );
    } catch (err) {
      await oldStorageInstance.close();
      await this.updateStatus((s) => {
        s.status = "ERROR";
        s.error = errorToPlainJson(err);
        return s;
      });
      return;
    }
    await writeSingle(this.database.internalStore, {
      previous: oldCollectionMeta,
      document: Object.assign({}, oldCollectionMeta, {
        _deleted: true
      })
    }, "rx-migration-remove-collection-meta");
    await this.updateStatus((s) => {
      s.status = "DONE";
      return s;
    });
    if (broadcastChannel) {
      await broadcastChannel.close();
    }
  };
  _proto.updateStatus = function updateStatus(handler) {
    this.updateStatusHandlers.push(handler);
    this.updateStatusQueue = this.updateStatusQueue.then(async () => {
      if (this.updateStatusHandlers.length === 0) {
        return;
      }
      var useHandlers = this.updateStatusHandlers;
      this.updateStatusHandlers = [];
      while (true) {
        var previous = await getSingleDocument(this.database.internalStore, this.statusDocId);
        var newDoc = clone$1(previous);
        if (!previous) {
          newDoc = {
            id: this.statusDocId,
            key: this.statusDocKey,
            context: INTERNAL_CONTEXT_MIGRATION_STATUS,
            data: {
              collectionName: this.collection.name,
              status: "RUNNING",
              count: {
                total: 0,
                handled: 0,
                percent: 0
              }
            },
            _deleted: false,
            _meta: getDefaultRxDocumentMeta(),
            _rev: getDefaultRevision(),
            _attachments: {}
          };
        }
        var status = ensureNotFalsy(newDoc).data;
        for (var oneHandler of useHandlers) {
          status = oneHandler(status);
        }
        status.count.percent = Math.round(status.count.handled / status.count.total * 100);
        if (newDoc && previous && deepEqual(newDoc.data, previous.data)) {
          break;
        }
        try {
          await writeSingle(this.database.internalStore, {
            previous,
            document: ensureNotFalsy(newDoc)
          }, INTERNAL_CONTEXT_MIGRATION_STATUS);
          break;
        } catch (err) {
          if (!isBulkWriteConflictError(err)) {
            throw err;
          }
        }
      }
    });
    return this.updateStatusQueue;
  };
  _proto.migrateStorage = async function migrateStorage(oldStorage, newStorage, batchSize) {
    var replicationMetaStorageInstance = await this.database.storage.createStorageInstance({
      databaseName: this.database.name,
      collectionName: "rx-migration-state-meta-" + oldStorage.collectionName + "-" + oldStorage.schema.version,
      databaseInstanceToken: this.database.token,
      multiInstance: this.database.multiInstance,
      options: {},
      schema: getRxReplicationMetaInstanceSchema(oldStorage.schema, hasEncryption(oldStorage.schema)),
      password: this.database.password,
      devMode: overwritable.isDevMode()
    });
    var replicationHandlerBase = rxStorageInstanceToReplicationHandler(
      newStorage,
      /**
       * Ignore push-conflicts.
       * If this happens we drop the 'old' document state.
       */
      defaultConflictHandler,
      this.database.token,
      true
    );
    var replicationState = replicateRxStorageInstance({
      keepMeta: true,
      identifier: ["rx-migration-state", oldStorage.collectionName, oldStorage.schema.version, this.collection.schema.version].join("-"),
      replicationHandler: {
        masterChangesSince() {
          return Promise.resolve({
            checkpoint: null,
            documents: []
          });
        },
        masterWrite: async (rows) => {
          rows = await Promise.all(rows.map(async (row) => {
            var newDocData = row.newDocumentState;
            if (newStorage.schema.title === META_INSTANCE_SCHEMA_TITLE) {
              newDocData = row.newDocumentState.docData;
              if (row.newDocumentState.isCheckpoint === "1") {
                return {
                  assumedMasterState: void 0,
                  newDocumentState: row.newDocumentState
                };
              }
            }
            var migratedDocData = await migrateDocumentData(this.collection, oldStorage.schema.version, newDocData);
            var newRow = {
              // drop the assumed master state, we do not have to care about conflicts here.
              assumedMasterState: void 0,
              newDocumentState: newStorage.schema.title === META_INSTANCE_SCHEMA_TITLE ? Object.assign({}, row.newDocumentState, {
                docData: migratedDocData
              }) : migratedDocData
            };
            return newRow;
          }));
          rows = rows.filter((row) => !!row.newDocumentState);
          var result = await replicationHandlerBase.masterWrite(rows);
          return result;
        },
        masterChangeStream$: new Subject().asObservable()
      },
      forkInstance: oldStorage,
      metaInstance: replicationMetaStorageInstance,
      pushBatchSize: batchSize,
      pullBatchSize: 0,
      conflictHandler: defaultConflictHandler,
      hashFunction: this.database.hashFunction
    });
    var hasError = false;
    replicationState.events.error.subscribe((err) => hasError = err);
    replicationState.events.processed.up.subscribe(() => {
      this.updateStatus((status) => {
        status.count.handled = status.count.handled + 1;
        return status;
      });
    });
    await awaitRxStorageReplicationFirstInSync(replicationState);
    await awaitRxStorageReplicationInSync(replicationState);
    await cancelRxStorageReplication(replicationState);
    await this.updateStatusQueue;
    if (hasError) {
      await replicationMetaStorageInstance.close();
      throw hasError;
    }
    await Promise.all([oldStorage.remove(), replicationMetaStorageInstance.remove()]);
  };
  _proto.countAllDoucments = async function countAllDoucments(storageInstances) {
    var ret = 0;
    await Promise.all(storageInstances.map(async (instance) => {
      var preparedQuery = prepareQuery(instance.schema, normalizeMangoQuery(instance.schema, {
        selector: {}
      }));
      var countResult = await instance.count(preparedQuery);
      ret += countResult.count;
    }));
    return ret;
  };
  _proto.getConnectedStorageInstances = async function getConnectedStorageInstances() {
    var oldCollectionMeta = await this.oldCollectionMeta;
    var ret = [];
    await Promise.all(await Promise.all(oldCollectionMeta.data.connectedStorages.map(async (connectedStorage) => {
      if (connectedStorage.schema.title !== META_INSTANCE_SCHEMA_TITLE) {
        throw new Error("unknown migration handling for schema");
      }
      var newSchema = getRxReplicationMetaInstanceSchema(clone$1(this.collection.schema.jsonSchema), hasEncryption(connectedStorage.schema));
      newSchema.version = this.collection.schema.version;
      var [oldStorage, newStorage] = await Promise.all([this.database.storage.createStorageInstance({
        databaseInstanceToken: this.database.token,
        databaseName: this.database.name,
        devMode: overwritable.isDevMode(),
        multiInstance: this.database.multiInstance,
        options: {},
        schema: connectedStorage.schema,
        password: this.database.password,
        collectionName: connectedStorage.collectionName
      }), this.database.storage.createStorageInstance({
        databaseInstanceToken: this.database.token,
        databaseName: this.database.name,
        devMode: overwritable.isDevMode(),
        multiInstance: this.database.multiInstance,
        options: {},
        schema: newSchema,
        password: this.database.password,
        collectionName: connectedStorage.collectionName
      })]);
      ret.push({
        oldStorage,
        newStorage
      });
    })));
    return ret;
  };
  _proto.migratePromise = async function migratePromise(batchSize) {
    this.startMigration(batchSize);
    var must = await this.mustMigrate;
    if (!must) {
      return {
        status: "DONE",
        collectionName: this.collection.name,
        count: {
          handled: 0,
          percent: 0,
          total: 0
        }
      };
    }
    var result = await Promise.race([firstValueFrom(this.$.pipe(filter((d) => d.status === "DONE"))), firstValueFrom(this.$.pipe(filter((d) => d.status === "ERROR")))]);
    if (result.status === "ERROR") {
      throw newRxError("DM4", {
        collection: this.collection.name,
        error: result.error
      });
    } else {
      return result;
    }
  };
  return RxMigrationState2;
}();
var RxDocumentParent = createRxDocumentConstructor();
var RxLocalDocumentClass = /* @__PURE__ */ function(_RxDocumentParent) {
  function RxLocalDocumentClass2(id, jsonData, parent) {
    var _this2;
    _this2 = _RxDocumentParent.call(this, null, jsonData) || this;
    _this2.id = id;
    _this2.parent = parent;
    return _this2;
  }
  _inheritsLoose(RxLocalDocumentClass2, _RxDocumentParent);
  return RxLocalDocumentClass2;
}(RxDocumentParent);
var RxLocalDocumentPrototype = {
  get isLocal() {
    return true;
  },
  //
  // overwrites
  //
  get allAttachments$() {
    throw newRxError("LD1", {
      document: this
    });
  },
  get primaryPath() {
    return "id";
  },
  get primary() {
    return this.id;
  },
  get $() {
    var _this = this;
    var state = getFromMapOrThrow(LOCAL_DOC_STATE_BY_PARENT_RESOLVED, this.parent);
    var id = this.primary;
    return _this.parent.eventBulks$.pipe(filter((bulk) => !!bulk.isLocal), map((bulk) => bulk.events.find((ev) => ev.documentId === id)), filter((event) => !!event), map((changeEvent) => getDocumentDataOfRxChangeEvent(ensureNotFalsy(changeEvent))), startWith(state.docCache.getLatestDocumentData(this.primary)), distinctUntilChanged((prev, curr) => prev._rev === curr._rev), map((docData) => state.docCache.getCachedRxDocument(docData)), shareReplay(RXJS_SHARE_REPLAY_DEFAULTS));
  },
  get $$() {
    var _this = this;
    var db2 = getRxDatabaseFromLocalDocument(_this);
    var reactivity = db2.getReactivityFactory();
    return reactivity.fromObservable(_this.$, _this.getLatest()._data, db2);
  },
  get deleted$$() {
    var _this = this;
    var db2 = getRxDatabaseFromLocalDocument(_this);
    var reactivity = db2.getReactivityFactory();
    return reactivity.fromObservable(_this.deleted$, _this.getLatest().deleted, db2);
  },
  getLatest() {
    var state = getFromMapOrThrow(LOCAL_DOC_STATE_BY_PARENT_RESOLVED, this.parent);
    var latestDocData = state.docCache.getLatestDocumentData(this.primary);
    return state.docCache.getCachedRxDocument(latestDocData);
  },
  get(objPath) {
    objPath = "data." + objPath;
    if (!this._data) {
      return void 0;
    }
    if (typeof objPath !== "string") {
      throw newRxTypeError("LD2", {
        objPath
      });
    }
    var valueObj = getProperty$1(this._data, objPath);
    valueObj = overwritable.deepFreezeWhenDevMode(valueObj);
    return valueObj;
  },
  get$(objPath) {
    objPath = "data." + objPath;
    if (overwritable.isDevMode()) {
      if (objPath.includes(".item.")) {
        throw newRxError("LD3", {
          objPath
        });
      }
      if (objPath === this.primaryPath) {
        throw newRxError("LD4");
      }
    }
    return this.$.pipe(map((localDocument) => localDocument._data), map((data) => getProperty$1(data, objPath)), distinctUntilChanged());
  },
  get$$(objPath) {
    var db2 = getRxDatabaseFromLocalDocument(this);
    var reactivity = db2.getReactivityFactory();
    return reactivity.fromObservable(this.get$(objPath), this.getLatest().get(objPath), db2);
  },
  async incrementalModify(mutationFunction) {
    var state = await getLocalDocStateByParent(this.parent);
    return state.incrementalWriteQueue.addWrite(this._data, async (docData) => {
      docData.data = await mutationFunction(docData.data, this);
      return docData;
    }).then((result) => state.docCache.getCachedRxDocument(result));
  },
  incrementalPatch(patch) {
    return this.incrementalModify((docData) => {
      Object.entries(patch).forEach(([k, v]) => {
        docData[k] = v;
      });
      return docData;
    });
  },
  async _saveData(newData) {
    var state = await getLocalDocStateByParent(this.parent);
    var oldData = this._data;
    newData.id = this.id;
    var writeRows = [{
      previous: oldData,
      document: newData
    }];
    return state.storageInstance.bulkWrite(writeRows, "local-document-save-data").then((res) => {
      if (res.error[0]) {
        throw res.error[0];
      }
      var success = getWrittenDocumentsFromBulkWriteResponse(this.collection.schema.primaryPath, writeRows, res)[0];
      newData = flatClone(newData);
      newData._rev = success._rev;
    });
  },
  async remove() {
    var state = await getLocalDocStateByParent(this.parent);
    var writeData = flatClone(this._data);
    writeData._deleted = true;
    return writeSingle(state.storageInstance, {
      previous: this._data,
      document: writeData
    }, "local-document-remove").then((writeResult) => state.docCache.getCachedRxDocument(writeResult));
  }
};
var INIT_DONE = false;
var _init = () => {
  if (INIT_DONE) return;
  else INIT_DONE = true;
  var docBaseProto = basePrototype;
  var props = Object.getOwnPropertyNames(docBaseProto);
  props.forEach((key) => {
    var exists = Object.getOwnPropertyDescriptor(RxLocalDocumentPrototype, key);
    if (exists) return;
    var desc = Object.getOwnPropertyDescriptor(docBaseProto, key);
    Object.defineProperty(RxLocalDocumentPrototype, key, desc);
  });
  var getThrowingFun = (k) => () => {
    throw newRxError("LD6", {
      functionName: k
    });
  };
  ["populate", "update", "putAttachment", "getAttachment", "allAttachments"].forEach((k) => RxLocalDocumentPrototype[k] = getThrowingFun(k));
};
function createRxLocalDocument(data, parent) {
  _init();
  var newDoc = new RxLocalDocumentClass(data.id, data, parent);
  Object.setPrototypeOf(newDoc, RxLocalDocumentPrototype);
  newDoc.prototype = RxLocalDocumentPrototype;
  return newDoc;
}
function getRxDatabaseFromLocalDocument(doc) {
  var parent = doc.parent;
  if (isRxDatabase(parent)) {
    return parent;
  } else {
    return parent.database;
  }
}
var LOCAL_DOC_STATE_BY_PARENT = /* @__PURE__ */ new WeakMap();
var LOCAL_DOC_STATE_BY_PARENT_RESOLVED = /* @__PURE__ */ new WeakMap();
function createLocalDocStateByParent(parent) {
  var database = parent.database ? parent.database : parent;
  var collectionName = parent.database ? parent.name : "";
  var statePromise = (async () => {
    var storageInstance = await createLocalDocumentStorageInstance(database.token, database.storage, database.name, collectionName, database.instanceCreationOptions, database.multiInstance);
    storageInstance = getWrappedStorageInstance(database, storageInstance, RX_LOCAL_DOCUMENT_SCHEMA);
    var docCache = new DocumentCache("id", database.eventBulks$.pipe(filter((changeEventBulk) => {
      var ret = false;
      if (
        // parent is database
        collectionName === "" && !changeEventBulk.collectionName || // parent is collection
        collectionName !== "" && changeEventBulk.collectionName === collectionName
      ) {
        ret = true;
      }
      return ret && changeEventBulk.isLocal;
    }), map((b) => b.events)), (docData) => createRxLocalDocument(docData, parent));
    var incrementalWriteQueue = new IncrementalWriteQueue(storageInstance, "id", () => {
    }, () => {
    });
    var databaseStorageToken = await database.storageToken;
    var subLocalDocs = storageInstance.changeStream().subscribe((eventBulk) => {
      var events = new Array(eventBulk.events.length);
      var rawEvents = eventBulk.events;
      var collectionName2 = parent.database ? parent.name : void 0;
      for (var index = 0; index < rawEvents.length; index++) {
        var event = rawEvents[index];
        events[index] = {
          documentId: event.documentId,
          collectionName: collectionName2,
          isLocal: true,
          operation: event.operation,
          documentData: overwritable.deepFreezeWhenDevMode(event.documentData),
          previousDocumentData: overwritable.deepFreezeWhenDevMode(event.previousDocumentData)
        };
      }
      var changeEventBulk = {
        id: eventBulk.id,
        isLocal: true,
        internal: false,
        collectionName: parent.database ? parent.name : void 0,
        storageToken: databaseStorageToken,
        events,
        databaseToken: database.token,
        checkpoint: eventBulk.checkpoint,
        context: eventBulk.context
      };
      database.$emit(changeEventBulk);
    });
    parent._subs.push(subLocalDocs);
    var state = {
      database,
      parent,
      storageInstance,
      docCache,
      incrementalWriteQueue
    };
    LOCAL_DOC_STATE_BY_PARENT_RESOLVED.set(parent, state);
    return state;
  })();
  LOCAL_DOC_STATE_BY_PARENT.set(parent, statePromise);
}
function getLocalDocStateByParent(parent) {
  var statePromise = LOCAL_DOC_STATE_BY_PARENT.get(parent);
  if (!statePromise) {
    var database = parent.database ? parent.database : parent;
    var collectionName = parent.database ? parent.name : "";
    throw newRxError("LD8", {
      database: database.name,
      collection: collectionName
    });
  }
  return statePromise;
}
function createLocalDocumentStorageInstance(databaseInstanceToken, storage, databaseName, collectionName, instanceCreationOptions, multiInstance) {
  return storage.createStorageInstance({
    databaseInstanceToken,
    databaseName,
    /**
     * Use a different collection name for the local documents instance
     * so that the local docs can be kept while deleting the normal instance
     * after migration.
     */
    collectionName: getCollectionLocalInstanceName(collectionName),
    schema: RX_LOCAL_DOCUMENT_SCHEMA,
    options: instanceCreationOptions,
    multiInstance,
    devMode: overwritable.isDevMode()
  });
}
function closeStateByParent(parent) {
  var statePromise = LOCAL_DOC_STATE_BY_PARENT.get(parent);
  if (statePromise) {
    LOCAL_DOC_STATE_BY_PARENT.delete(parent);
    return statePromise.then((state) => state.storageInstance.close());
  }
}
async function removeLocalDocumentsStorageInstance(storage, databaseName, collectionName) {
  var databaseInstanceToken = randomToken$1(10);
  var storageInstance = await createLocalDocumentStorageInstance(databaseInstanceToken, storage, databaseName, collectionName, {}, false);
  await storageInstance.remove();
}
function getCollectionLocalInstanceName(collectionName) {
  return "plugin-local-documents-" + collectionName;
}
var RX_LOCAL_DOCUMENT_SCHEMA = fillWithDefaultSettings({
  title: "RxLocalDocument",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 128
    },
    data: {
      type: "object",
      additionalProperties: true
    }
  },
  required: ["id", "data"]
});
async function insertLocal(id, data) {
  var state = await getLocalDocStateByParent(this);
  var docData = {
    id,
    data,
    _deleted: false,
    _meta: getDefaultRxDocumentMeta(),
    _rev: getDefaultRevision(),
    _attachments: {}
  };
  return writeSingle(state.storageInstance, {
    document: docData
  }, "local-document-insert").then((newDocData) => state.docCache.getCachedRxDocument(newDocData));
}
function upsertLocal(id, data) {
  return this.getLocal(id).then((existing) => {
    if (!existing) {
      var docPromise = this.insertLocal(id, data);
      return docPromise;
    } else {
      return existing.incrementalModify(() => {
        return data;
      });
    }
  });
}
async function getLocal(id) {
  var state = await getLocalDocStateByParent(this);
  var docCache = state.docCache;
  var found = docCache.getLatestDocumentDataIfExists(id);
  if (found) {
    return Promise.resolve(docCache.getCachedRxDocument(found));
  }
  return getSingleDocument(state.storageInstance, id).then((docData) => {
    if (!docData) {
      return null;
    }
    return state.docCache.getCachedRxDocument(docData);
  });
}
function getLocal$(id) {
  return this.$.pipe(startWith(null), mergeMap(async (cE) => {
    if (cE) {
      return {
        changeEvent: cE
      };
    } else {
      var doc = await this.getLocal(id);
      return {
        doc
      };
    }
  }), mergeMap(async (changeEventOrDoc) => {
    if (changeEventOrDoc.changeEvent) {
      var cE = changeEventOrDoc.changeEvent;
      if (!cE.isLocal || cE.documentId !== id) {
        return {
          use: false
        };
      } else {
        var doc = await this.getLocal(id);
        return {
          use: true,
          doc
        };
      }
    } else {
      return {
        use: true,
        doc: changeEventOrDoc.doc
      };
    }
  }), filter((filterFlagged) => filterFlagged.use), map((filterFlagged) => {
    return filterFlagged.doc;
  }));
}
var RxDBLocalDocumentsPlugin = {
  name: "local-documents",
  rxdb: true,
  prototypes: {
    RxCollection: (proto) => {
      proto.insertLocal = insertLocal;
      proto.upsertLocal = upsertLocal;
      proto.getLocal = getLocal;
      proto.getLocal$ = getLocal$;
    },
    RxDatabase: (proto) => {
      proto.insertLocal = insertLocal;
      proto.upsertLocal = upsertLocal;
      proto.getLocal = getLocal;
      proto.getLocal$ = getLocal$;
    }
  },
  hooks: {
    createRxDatabase: {
      before: (args) => {
        if (args.creator.localDocuments) {
          createLocalDocStateByParent(args.database);
        }
      }
    },
    createRxCollection: {
      before: (args) => {
        if (args.creator.localDocuments) {
          createLocalDocStateByParent(args.collection);
        }
      }
    },
    preCloseRxDatabase: {
      after: (db2) => {
        return closeStateByParent(db2);
      }
    },
    postCloseRxCollection: {
      after: (collection) => closeStateByParent(collection)
    },
    postRemoveRxDatabase: {
      after: (args) => {
        return removeLocalDocumentsStorageInstance(args.storage, args.databaseName, "");
      }
    },
    postRemoveRxCollection: {
      after: (args) => {
        return removeLocalDocumentsStorageInstance(args.storage, args.databaseName, args.collectionName);
      }
    }
  },
  overwritable: {}
};
var DATA_MIGRATOR_BY_COLLECTION = /* @__PURE__ */ new WeakMap();
var RxDBMigrationPlugin = {
  name: "migration-schema",
  rxdb: true,
  init() {
    addRxPlugin(RxDBLocalDocumentsPlugin);
  },
  hooks: {
    preCloseRxDatabase: {
      after: onDatabaseClose
    }
  },
  prototypes: {
    RxDatabase: (proto) => {
      proto.migrationStates = function() {
        return getMigrationStateByDatabase(this).pipe(shareReplay(RXJS_SHARE_REPLAY_DEFAULTS));
      };
    },
    RxCollection: (proto) => {
      proto.getMigrationState = function() {
        return getFromMapOrCreate(DATA_MIGRATOR_BY_COLLECTION, this, () => new RxMigrationState(this.asRxCollection, this.migrationStrategies));
      };
      proto.migrationNeeded = function() {
        if (this.schema.version === 0) {
          return PROMISE_RESOLVE_FALSE;
        }
        return mustMigrate(this.getMigrationState());
      };
    }
  }
};
var RxDBMigrationSchemaPlugin = RxDBMigrationPlugin;
const createBitwiseOperator = (predicate) => {
  return createQueryOperator(
    (value, mask, _options4) => {
      let b = 0;
      if (isArray(mask)) {
        for (const n of mask) b = b | 1 << n;
      } else {
        b = mask;
      }
      return predicate(value & b, b);
    }
  );
};
const $bitsAllClear = createBitwiseOperator((result, _) => result == 0);
const $bitsAllSet = createBitwiseOperator(
  (result, mask) => result == mask
);
const $bitsAnyClear = createBitwiseOperator(
  (result, mask) => result < mask
);
const $bitsAnySet = createBitwiseOperator((result, _) => result > 0);
const queryOperators = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  $all,
  $and,
  $bitsAllClear,
  $bitsAllSet,
  $bitsAnyClear,
  $bitsAnySet,
  $elemMatch,
  $eq,
  $exists,
  $expr,
  $gt,
  $gte,
  $in,
  $jsonSchema,
  $lt,
  $lte,
  $mod,
  $ne,
  $nin,
  $nor,
  $not,
  $or,
  $regex,
  $size,
  $type,
  $where
}, Symbol.toStringTag, { value: "Module" }));
const UPDATE_OPTIONS = {
  cloneMode: "copy",
  queryOptions: initOptions({
    context: Context.init().addQueryOps(queryOperators).addExpressionOps(booleanOperators).addExpressionOps(comparisonOperators)
  })
};
const clone = (mode, val) => {
  switch (mode) {
    case "deep":
      return cloneDeep(val);
    case "copy": {
      if (isDate(val)) return new Date(val);
      if (isArray(val)) return [...val];
      if (isObject$2(val)) return { ...val };
      if (isRegExp(val)) return new RegExp(val);
      return val;
    }
    default:
      return val;
  }
};
const FILTER_IDENT_RE = /^[a-z]+[a-zA-Z0-9]*$/;
function tokenizePath(selector) {
  if (!selector.includes(".$")) {
    return [{ parent: selector, selector }, []];
  }
  const begin = selector.indexOf(".$");
  const end = selector.indexOf("]");
  const parent = selector.substring(0, begin);
  const child = selector.substring(begin + 3, end);
  assert(
    child === "" || FILTER_IDENT_RE.test(child),
    "The filter <identifier> must begin with a lowercase letter and contain only alphanumeric characters."
  );
  const rest = selector.substring(end + 2);
  const [next, elems] = rest ? tokenizePath(rest) : [];
  return [
    { selector, parent, child: child || "$", next },
    [child, ...elems || []].filter(Boolean)
  ];
}
const applyUpdate = (o, n, q, f, opts) => {
  const { parent, child: c, next } = n;
  if (!c) {
    let b = false;
    const g = (u, k) => b = Boolean(f(u, k)) || b;
    walk(o, parent, g, opts);
    return b;
  }
  const t = resolve(o, parent);
  if (!isArray(t)) return false;
  return t.map((e, i) => {
    if (q[c] && !q[c].test({ [c]: e })) return false;
    return next ? applyUpdate(e, next, q, f, opts) : f(t, i);
  }).some(Boolean);
};
function walkExpression(expr, arrayFilter, options, callback) {
  const res = [];
  for (const [selector, val] of Object.entries(expr)) {
    const [node, vars] = tokenizePath(selector);
    if (!vars.length) {
      if (callback(val, node, {})) res.push(node.parent);
    } else {
      const conditions = {};
      arrayFilter.forEach((o) => {
        Object.keys(o).forEach((k) => {
          vars.forEach((w) => {
            if (k === w || k.startsWith(w + ".")) {
              conditions[w] = conditions[w] || {};
              Object.assign(conditions[w], { [k]: o[k] });
            }
          });
        });
      });
      const queries = {};
      for (const [k, condition] of Object.entries(conditions)) {
        queries[k] = new Query(condition, options.queryOptions);
      }
      if (callback(val, node, queries)) res.push(node.parent);
    }
  }
  return res;
}
const $addToSet = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    const args = { $each: [val] };
    if (isObject$2(val) && has(val, "$each")) {
      Object.assign(args, val);
    }
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        const prev = o[k] || (o[k] = []);
        const common = intersection([prev, args.$each]);
        if (common.length === args.$each.length) return false;
        o[k] = clone(options.cloneMode, unique(prev.concat(args.$each)));
        return true;
      },
      { buildGraph: true }
    );
  });
};
const BIT_OPS = /* @__PURE__ */ new Set(["and", "or", "xor"]);
const $bit = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    const op = Object.keys(val);
    assert(
      op.length === 1 && BIT_OPS.has(op[0]),
      `Invalid bit operator '${op[0]}'. Must be one of 'and', 'or', or 'xor'.`
    );
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        let n = o[k];
        const v = val[op[0]];
        if (n !== void 0 && !(isNumber(n) && isNumber(v))) return false;
        n = n || 0;
        switch (op[0]) {
          case "and":
            o[k] = n & v;
            break;
          case "or":
            o[k] = n | v;
            break;
          case "xor":
            o[k] = n ^ v;
            break;
        }
        return o[k] !== n;
      },
      { buildGraph: true }
    );
  });
};
const $currentDate = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  const now2 = Date.now();
  return walkExpression(expr, arrayFilters, options, (_, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        o[k] = now2;
        return true;
      },
      { buildGraph: true }
    );
  });
};
const $inc = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    if (!node.child) {
      const n = resolve(obj, node.parent);
      assert(
        n === void 0 || isNumber(n),
        `cannot apply $inc to a value of non-numeric type`
      );
    }
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        o[k] = (o[k] || (o[k] = 0)) + val;
        return true;
      },
      { buildGraph: true }
    );
  });
};
const $max = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        if (o[k] !== void 0 && compare$1(o[k], val) > -1) return false;
        o[k] = val;
        return true;
      },
      { buildGraph: true }
    );
  });
};
const $min = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        if (o[k] !== void 0 && compare$1(o[k], val) < 1) return false;
        o[k] = val;
        return true;
      },
      { buildGraph: true }
    );
  });
};
const $mul = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        const prev = o[k];
        o[k] = o[k] === void 0 ? 0 : o[k] * val;
        return o[k] !== prev;
      },
      { buildGraph: true }
    );
  });
};
const $pop = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(obj, node, queries, (o, k) => {
      const arr = o[k];
      assert(
        isArray(arr),
        `path '${node.selector}' contains an element of non-array type.`
      );
      if (!arr.length) return false;
      if (val === -1) {
        arr.splice(0, 1);
      } else {
        arr.pop();
      }
      return true;
    });
  });
};
const $pull = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    const wrap = !isObject$2(val) || Object.keys(val).some(isOperator);
    const query = new Query(
      wrap ? { k: val } : val,
      options.queryOptions
    );
    const pred = wrap ? (v) => query.test({ k: v }) : (v) => query.test(v);
    return applyUpdate(obj, node, queries, (o, k) => {
      const prev = o[k];
      const curr = new Array();
      const found = prev.map((v) => {
        const b = pred(v);
        if (!b) curr.push(v);
        return b;
      }).some(Boolean);
      if (!found) return false;
      o[k] = curr;
      return true;
    });
  });
};
const $pullAll = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  const pullExpr = {};
  Object.entries(expr).forEach(([k, v]) => {
    pullExpr[k] = { $in: v };
  });
  return $pull(obj, pullExpr, arrayFilters, options);
};
const OPERATOR_MODIFIERS = Object.freeze([
  "$each",
  "$slice",
  "$sort",
  "$position"
]);
const $push = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    const args = {
      $each: [val]
    };
    if (isObject$2(val) && OPERATOR_MODIFIERS.some((m) => has(val, m))) {
      Object.assign(args, val);
    }
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        const arr = o[k] || (o[k] = []);
        const prev = arr.slice(0, args.$slice || arr.length);
        const oldsize = arr.length;
        const pos = isNumber(args.$position) ? args.$position : arr.length;
        arr.splice(pos, 0, ...clone(options.cloneMode, args.$each));
        if (args.$sort) {
          const sortKey = isObject$2(args.$sort) ? Object.keys(args.$sort || {}).pop() : "";
          const order = !sortKey ? args.$sort : args.$sort[sortKey];
          const f = !sortKey ? (a) => a : (a) => resolve(a, sortKey);
          arr.sort((a, b) => order * compare$1(f(a), f(b)));
        }
        if (isNumber(args.$slice)) {
          if (args.$slice < 0) arr.splice(0, arr.length + args.$slice);
          else arr.splice(args.$slice);
        }
        return oldsize != arr.length || !isEqual(prev, arr);
      },
      { descendArray: true, buildGraph: true }
    );
  });
};
const $set = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o, k) => {
        if (isEqual(o[k], val)) return false;
        o[k] = clone(options.cloneMode, val);
        return true;
      },
      { buildGraph: true }
    );
  });
};
const $rename = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  const res = [];
  const changed = walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    return applyUpdate(obj, node, queries, (o, k) => {
      if (!has(o, k)) return false;
      res.push(...$set(obj, { [val]: o[k] }, arrayFilters, options));
      delete o[k];
      return true;
    });
  });
  return Array.from(new Set(changed.concat(res)));
};
const $unset = (obj, expr, arrayFilters = [], options = UPDATE_OPTIONS) => {
  return walkExpression(expr, arrayFilters, options, (_, node, queries) => {
    return applyUpdate(obj, node, queries, (o, k) => {
      if (!has(o, k)) return false;
      if (isArray(o)) {
        o[k] = null;
      } else {
        delete o[k];
      }
      return true;
    });
  });
};
const UPDATE_OPERATORS = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  $addToSet,
  $bit,
  $currentDate,
  $inc,
  $max,
  $min,
  $mul,
  $pop,
  $pull,
  $pullAll,
  $push,
  $rename,
  $set,
  $unset
}, Symbol.toStringTag, { value: "Module" }));
function createUpdater(defaultOptions) {
  defaultOptions = defaultOptions ?? UPDATE_OPTIONS;
  return (obj, expr, arrayFilters = [], condition = {}, options = defaultOptions) => {
    const entry = Object.entries(expr);
    assert(
      entry.length === 1,
      "Update expression must contain only one operator."
    );
    const [op, args] = entry[0];
    assert(
      has(UPDATE_OPERATORS, op),
      `Update operator '${op}' is not supported.`
    );
    const mutate = UPDATE_OPERATORS[op];
    if (Object.keys(condition).length) {
      const q = new Query(condition, options.queryOptions);
      if (!q.test(obj)) return [];
    }
    return mutate(obj, args, arrayFilters, options);
  };
}
createUpdater();
var updater;
function mingoUpdater(d, op) {
  if (!updater) {
    var updateObject = createUpdater({
      cloneMode: "none"
    });
    updater = (d2, op2) => {
      var cloned = clone$1(d2);
      updateObject(cloned, op2);
      return cloned;
    };
  }
  return updater(d, op);
}
function incrementalUpdate(updateObj) {
  return this.incrementalModify((docData) => {
    var newDocData = mingoUpdater(docData, updateObj);
    return newDocData;
  });
}
function update(updateObj) {
  var oldDocData = this._data;
  var newDocData = mingoUpdater(oldDocData, updateObj);
  return this._saveData(newDocData, oldDocData);
}
async function RxQueryUpdate(updateObj) {
  return runQueryUpdateFunction(this.asRxQuery, (doc) => doc.update(updateObj));
}
var RxDBUpdatePlugin = {
  name: "update",
  rxdb: true,
  prototypes: {
    RxDocument: (proto) => {
      proto.update = update;
      proto.incrementalUpdate = incrementalUpdate;
    },
    RxQuery: (proto) => {
      proto.update = RxQueryUpdate;
    }
  }
};
const LOG_LEVELS = {
  OFF: 0,
  ERROR: 1,
  INFO: 2,
  DEBUG: 3
};
class Logger {
  constructor(module, defaultLevel = "debug") {
    this.module = module;
    this.level = LOG_LEVELS[defaultLevel.toUpperCase()];
  }
  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(`[DB:${this.module}] ${message}`, { ...meta, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[DB:${this.module}] ${message}`, { ...meta, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  error(message, meta = {}) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[DB:${this.module}] ${message}`, { ...meta, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  setLevel(level) {
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.OFF;
  }
}
class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new AppError("TIMEOUT", errorMessage)), ms));
  return Promise.race([promise, timeout]);
}
const logger = new Logger("Main");
let db = null;
let chatHistoryCollection = null;
let logDbInstance = null;
let logsCollection = null;
let isDbInitialized = false;
let isLogDbInitialized = false;
let dbReadyResolve;
const dbReadyPromise = new Promise((resolve2) => {
  dbReadyResolve = resolve2;
});
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;
const chatHistorySchema = {
  title: "chat history schema",
  version: 0,
  description: "Stores chat sessions",
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    tabId: { type: "number" },
    timestamp: { type: "number" },
    title: { type: "string", maxLength: 100 },
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          messageId: { type: "string", maxLength: 100 },
          sender: { type: "string" },
          text: { type: "string" },
          timestamp: { type: "number" },
          isLoading: { type: "boolean", default: false }
        },
        required: ["messageId", "sender", "text", "timestamp"]
      }
    },
    isStarred: { type: "boolean", default: false },
    status: { type: "string", default: "idle" }
  },
  required: ["id", "timestamp", "messages"],
  indexes: [["timestamp"]]
};
const logSchema = {
  title: "log schema",
  version: 0,
  description: "Stores application log entries",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      final: true
    },
    timestamp: {
      type: "number",
      index: true
    },
    level: {
      type: "string",
      enum: ["error", "warn", "info", "debug"],
      index: true
    },
    message: {
      type: "string"
    },
    component: {
      type: "string",
      index: true
    },
    extensionSessionId: {
      type: "string",
      index: true
    },
    chatSessionId: {
      type: ["string", "null"],
      index: true,
      default: null
    }
  },
  required: ["id", "timestamp", "level", "component", "extensionSessionId", "message"]
};
async function ensureDbReady(type2 = "chat") {
  const isReady = await withTimeout(dbReadyPromise, 5e3, "Database initialization timeout");
  if (!isReady) {
    throw new AppError("DB_NOT_READY", "Main Database systems not initialized");
  }
  if (type2 === "chat") {
    if (!chatHistoryCollection) throw new AppError("COLLECTION_NOT_READY", "Chat history collection not initialized");
    return chatHistoryCollection;
  } else if (type2 === "log") {
    if (!logsCollection) throw new AppError("COLLECTION_NOT_READY", "Logs collection not initialized");
    return logsCollection;
  } else {
    throw new AppError("INVALID_INPUT", `Unknown DB type requested: ${type2}`);
  }
}
async function resetDatabase() {
  const resetLogger = new Logger("Reset");
  resetLogger.info("Resetting databases due to initialization failure");
  try {
    if (db) {
      await db.destroy();
      resetLogger.debug("Main database instance destroyed");
    }
    if (logDbInstance) {
      await logDbInstance.destroy();
      resetLogger.debug("Log database instance destroyed");
    }
    db = null;
    chatHistoryCollection = null;
    isDbInitialized = false;
    logDbInstance = null;
    logsCollection = null;
    isLogDbInitialized = false;
    try {
      const mainStorage = getRxStorageDexie("tabagentdb");
      if (mainStorage && typeof mainStorage.remove === "function") {
        await mainStorage.remove();
        resetLogger.info("Removed tabagentdb storage");
      } else {
        resetLogger.warn("Could not get main storage or remove method.");
      }
    } catch (e) {
      resetLogger.warn("Could not remove tabagentdb storage (might not exist)", { error: e == null ? void 0 : e.message });
    }
    try {
      const logStorage = getRxStorageDexie("tabagent_logs_db");
      if (logStorage && typeof logStorage.remove === "function") {
        await logStorage.remove();
        resetLogger.info("Removed tabagent_logs_db storage");
      } else {
        resetLogger.warn("Could not get log storage or remove method.");
      }
    } catch (e) {
      resetLogger.warn("Could not remove tabagent_logs_db storage (might not exist)", { error: e == null ? void 0 : e.message });
    }
    dbReadyResolve(false);
  } catch (error) {
    console.error("[DB:Reset] CAUGHT RAW ERROR during reset:", error);
    resetLogger.error("Failed to reset databases", { error });
    throw new AppError("RESET_FAILED", "Could not reset databases", { originalError: error });
  }
}
async function handleInitializeRequest(event) {
  var _a2;
  const initLogger = new Logger("Initialize");
  initLogger.info("Handling initialize request");
  try {
    const ids = await chrome.storage.local.get(["currentLogSessionId", "previousLogSessionId"]);
    currentExtensionSessionId = ids.currentLogSessionId || null;
    previousExtensionSessionId = ids.previousLogSessionId || null;
    if (!currentExtensionSessionId) {
      initLogger.error("CRITICAL: currentLogSessionId not found in storage during DB init!");
    }
    initLogger.info("Retrieved log session IDs", { current: currentExtensionSessionId, previous: previousExtensionSessionId });
  } catch (storageError) {
    initLogger.error("Failed to retrieve log session IDs from storage", { error: storageError });
  }
  if (isDbInitialized && isLogDbInitialized) {
    initLogger.info("Both databases already initialized, skipping");
    return;
  }
  try {
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBMigrationSchemaPlugin);
    addRxPlugin(RxDBUpdatePlugin);
    if (!isDbInitialized) {
      db = await withTimeout(createRxDatabase({
        name: "tabagentdb",
        storage: getRxStorageDexie()
      }), 1e4);
      initLogger.debug("Main database instance created", { name: db.name });
      const chatCollections = await db.addCollections({
        chatHistory: {
          schema: chatHistorySchema
        }
      });
      chatHistoryCollection = chatCollections.chatHistory;
      initLogger.debug("Chat history collection initialized");
      isDbInitialized = true;
    } else {
      initLogger.info("Main database already initialized");
    }
    if (!isLogDbInitialized) {
      logDbInstance = await withTimeout(createRxDatabase({
        name: "tabagent_logs_db",
        storage: getRxStorageDexie()
      }), 1e4);
      initLogger.debug("Log database instance created", { name: logDbInstance.name });
      const logCollections = await logDbInstance.addCollections({
        logs: {
          schema: logSchema
        }
      });
      logsCollection = logCollections.logs;
      initLogger.debug("Logs collection initialized");
      isLogDbInitialized = true;
    } else {
      initLogger.info("Log database already initialized");
    }
    if (isDbInitialized && isLogDbInitialized) {
      const currentSubscriptions = typeof ((_a2 = eventBus$1) == null ? void 0 : _a2.getSubscriptions) === "function" ? eventBus$1.getSubscriptions() : {};
      const chatEventNames = [
        DB_CREATE_SESSION_REQUEST,
        DB_GET_SESSION_REQUEST,
        DB_ADD_MESSAGE_REQUEST,
        DB_UPDATE_MESSAGE_REQUEST,
        DB_DELETE_MESSAGE_REQUEST,
        DB_UPDATE_STATUS_REQUEST,
        DB_TOGGLE_STAR_REQUEST,
        DB_GET_ALL_SESSIONS_REQUEST,
        DB_GET_STARRED_SESSIONS_REQUEST,
        DB_DELETE_SESSION_REQUEST,
        DB_RENAME_SESSION_REQUEST
      ];
      const needChatSubscription = chatEventNames.some((name) => !currentSubscriptions[name]);
      if (needChatSubscription) {
        const chatSubscriptions = [
          { event: DB_CREATE_SESSION_REQUEST, handler: handleDbCreateSessionRequest },
          { event: DB_GET_SESSION_REQUEST, handler: handleDbGetSessionRequest },
          { event: DB_ADD_MESSAGE_REQUEST, handler: handleDbAddMessageRequest },
          { event: DB_UPDATE_MESSAGE_REQUEST, handler: handleDbUpdateMessageRequest },
          { event: DB_DELETE_MESSAGE_REQUEST, handler: handleDbDeleteMessageRequest },
          { event: DB_UPDATE_STATUS_REQUEST, handler: handleDbUpdateStatusRequest },
          { event: DB_TOGGLE_STAR_REQUEST, handler: handleDbToggleStarRequest },
          { event: DB_GET_ALL_SESSIONS_REQUEST, handler: handleDbGetAllSessionsRequest },
          { event: DB_GET_STARRED_SESSIONS_REQUEST, handler: handleDbGetStarredSessionsRequest },
          { event: DB_DELETE_SESSION_REQUEST, handler: handleDbDeleteSessionRequest },
          { event: DB_RENAME_SESSION_REQUEST, handler: handleDbRenameSessionRequest }
        ];
        chatSubscriptions.forEach(({ event: event2, handler }) => eventBus$1.subscribe(event2, handler));
        initLogger.debug("Chat event bus subscriptions complete", { count: chatSubscriptions.length });
      } else {
        initLogger.debug("Chat event bus subscriptions already exist.");
      }
      const logEventNames = [
        DB_ADD_LOG_REQUEST,
        DB_GET_LOGS_REQUEST,
        DB_GET_UNIQUE_LOG_VALUES_REQUEST,
        DB_CLEAR_LOGS_REQUEST,
        DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST
      ];
      const needLogSubscription = logEventNames.some((name) => !currentSubscriptions[name]);
      if (needLogSubscription) {
        const logSubscriptions = [
          { event: DB_ADD_LOG_REQUEST, handler: handleDbAddLogRequest },
          { event: DB_GET_LOGS_REQUEST, handler: handleDbGetLogsRequest },
          { event: DB_GET_UNIQUE_LOG_VALUES_REQUEST, handler: handleDbGetUniqueLogValuesRequest },
          { event: DB_CLEAR_LOGS_REQUEST, handler: handleDbClearLogsRequest },
          { event: DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST, handler: handleDbGetCurrentAndLastLogSessionIdsRequest }
        ];
        logSubscriptions.forEach(({ event: event2, handler }) => eventBus$1.subscribe(event2, handler));
        initLogger.info("Subscribed to Log Database events", { count: logSubscriptions.length });
      } else {
        initLogger.info("Log Database event subscriptions already exist.");
      }
      dbReadyResolve(true);
      initLogger.info("Initialization complete for both databases");
      await eventBus$1.publish(DB_INITIALIZATION_COMPLETE_NOTIFICATION, new DbInitializationCompleteNotification({ success: true }));
    } else {
      initLogger.warn("Initialization partially complete, something went wrong.");
    }
    if (isDbInitialized && isLogDbInitialized) {
      setTimeout(async () => {
        initLogger.info("Running startup log pruning (delayed)...");
        initLogger.debug("Current/Previous IDs for pruning", { current: currentExtensionSessionId, previous: previousExtensionSessionId });
        try {
          const currentId = currentExtensionSessionId;
          const previousId = previousExtensionSessionId;
          if (!currentId) {
            initLogger.warn("Cannot prune logs, currentExtensionSessionId is not set!");
          } else {
            initLogger.debug("Attempting to get all unique log session IDs...");
            const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
            initLogger.debug("Found unique log session IDs in DB", { ids: allLogSessionIds });
            const sessionsToKeep = /* @__PURE__ */ new Set();
            sessionsToKeep.add(currentId);
            if (previousId) sessionsToKeep.add(previousId);
            initLogger.debug("Session IDs to keep", { ids: Array.from(sessionsToKeep) });
            const sessionIdsToDelete = Array.from(allLogSessionIds).filter((id) => !sessionsToKeep.has(id));
            initLogger.debug("Session IDs to delete", { ids: sessionIdsToDelete });
            if (sessionIdsToDelete.length > 0) {
              initLogger.info(`Attempting to clear logs for ${sessionIdsToDelete.length} old session(s).`);
              const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
              initLogger.info(`Startup pruning removed ${deletedCount} logs from old session(s).`);
            } else {
              initLogger.info("No old log sessions found to prune during startup.");
            }
          }
        } catch (pruneError) {
          console.error("[DB:Initialize] Error during startup log pruning:", pruneError);
        }
      }, 100);
    }
  } catch (error) {
    console.error("[DB:Initialize] Entered CATCH block for init error.");
    console.error("[DB:Initialize] Raw Error Name:", error == null ? void 0 : error.name);
    console.error("[DB:Initialize] Raw Error Message:", error == null ? void 0 : error.message);
    console.error("[DB:Initialize] CAUGHT RAW ERROR OBJECT during init:", error);
    const appError = error instanceof AppError ? error : new AppError("INIT_FAILED", "Database initialization failed", { originalError: error });
    initLogger.error("Initialization failed", { error: appError, details: error });
    {
      try {
        await resetDatabase();
        initLogger.info("Attempting reinitialization after reset");
        await handleInitializeRequest(event);
        return;
      } catch (resetError) {
        initLogger.error("Reinitialization after reset failed", { error: resetError });
      }
    }
    isDbInitialized = false;
    isLogDbInitialized = false;
    dbReadyResolve(false);
    await eventBus$1.publish(DB_INITIALIZATION_COMPLETE_NOTIFICATION, new DbInitializationCompleteNotification({ success: false, error: appError }));
  }
}
function generateMessageId(chatId) {
  if (!chatId || typeof chatId !== "string") {
    throw new AppError("INVALID_INPUT", "Chat ID must be a non-empty string");
  }
  return `${chatId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input.replace(/[<>]/g, "");
}
async function createChatSessionInternal(initialMessage) {
  const opLogger = new Logger("CreateSession");
  opLogger.debug("Creating new chat session", { initialMessage });
  const collection = await ensureDbReady();
  if (!initialMessage || !initialMessage.text) {
    throw new AppError("INVALID_INPUT", "Initial message with text is required");
  }
  const timestamp = Date.now();
  const sessionId = crypto.randomUUID();
  const message = {
    ...initialMessage,
    text: sanitizeInput(initialMessage.text),
    messageId: generateMessageId(sessionId),
    timestamp: initialMessage.timestamp || timestamp,
    sender: initialMessage.sender || "user"
  };
  const sessionData = {
    id: sessionId,
    tabId: null,
    timestamp,
    title: sanitizeInput(message.text.substring(0, 30)) + "...",
    messages: [message],
    isStarred: false,
    status: "idle"
  };
  opLogger.debug("Inserting session", { sessionId });
  const newSessionDoc = await withTimeout(collection.insert(sessionData), 3e3);
  opLogger.info("Session created", { sessionId });
  await publishSessionUpdateNotificationInternal(sessionId);
  return newSessionDoc;
}
async function getChatSessionByIdInternal(sessionId) {
  const opLogger = new Logger("GetSession");
  opLogger.debug("Getting session", { sessionId });
  if (!sessionId) {
    throw new AppError("INVALID_INPUT", "Session ID is required");
  }
  const collection = await ensureDbReady();
  const doc = await withTimeout(collection.findOne(sessionId).exec(), 3e3);
  if (!doc) {
    opLogger.info("Session not found", { sessionId });
    return null;
  }
  opLogger.debug("Session retrieved", { sessionId });
  return doc;
}
async function addMessageToChatInternal(chatId, messageObject) {
  const opLogger = new Logger("AddMessage");
  opLogger.debug("Adding message", { chatId });
  if (!chatId || !messageObject || !messageObject.text) {
    throw new AppError("INVALID_INPUT", "Chat ID and message with text are required");
  }
  const collection = await ensureDbReady();
  const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3e3);
  if (!chatDoc) {
    throw new AppError("NOT_FOUND", `Chat session ${chatId} not found`);
  }
  const newMessage = {
    ...messageObject,
    text: sanitizeInput(messageObject.text),
    messageId: messageObject.messageId || generateMessageId(chatId),
    timestamp: messageObject.timestamp || Date.now(),
    isLoading: messageObject.isLoading ?? false
  };
  const updatedDoc = await withTimeout(
    chatDoc.incrementalPatch({ messages: [...chatDoc.messages, newMessage] }),
    3e3
  );
  opLogger.info("Message added", { chatId, messageId: newMessage.messageId });
  return { updatedDoc, newMessageId: newMessage.messageId };
}
async function updateMessageInChatInternal(chatId, messageId, updates) {
  const opLogger = new Logger("UpdateMessage");
  opLogger.debug("Updating message", { chatId, messageId });
  if (!chatId || !messageId || !updates || !updates.text) {
    throw new AppError("INVALID_INPUT", "Chat ID, message ID, and updates with text are required");
  }
  const collection = await ensureDbReady();
  const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3e3);
  if (!chatDoc) {
    throw new AppError("NOT_FOUND", `Chat session ${chatId} not found`);
  }
  let messageFound = false;
  const updatedDoc = await withTimeout(
    chatDoc.incrementalModify((docData) => {
      const messageIndex = docData.messages.findIndex((m) => m.messageId === messageId);
      if (messageIndex === -1) return docData;
      messageFound = true;
      const currentMessage = docData.messages[messageIndex];
      docData.messages[messageIndex] = {
        ...currentMessage,
        ...updates,
        text: sanitizeInput(updates.text),
        messageId: currentMessage.messageId
      };
      return docData;
    }),
    3e3
  );
  if (!messageFound) {
    throw new AppError("NOT_FOUND", `Message ${messageId} not found in chat ${chatId}`);
  }
  opLogger.info("Message updated", { chatId, messageId });
  await publishSessionUpdateNotificationInternal(chatId);
  return updatedDoc;
}
async function deleteMessageFromChatInternal(sessionId, messageId) {
  const opLogger = new Logger("DeleteMessage");
  opLogger.debug("Deleting message", { sessionId, messageId });
  if (!sessionId || !messageId) {
    throw new AppError("INVALID_INPUT", "Session ID and message ID are required");
  }
  const collection = await ensureDbReady();
  const sessionDoc = await withTimeout(collection.findOne(sessionId).exec(), 3e3);
  if (!sessionDoc) {
    throw new AppError("NOT_FOUND", `Session ${sessionId} not found`);
  }
  const initialLength = sessionDoc.messages.length;
  const updatedMessages = sessionDoc.messages.filter((msg) => msg.messageId !== messageId);
  if (updatedMessages.length === initialLength) {
    opLogger.info("Message not found", { sessionId, messageId });
    return { updatedDoc: sessionDoc, deleted: false };
  }
  const updatedDoc = await withTimeout(
    sessionDoc.incrementalPatch({ messages: updatedMessages }),
    3e3
  );
  opLogger.info("Message deleted", { sessionId, messageId });
  await publishSessionUpdateNotificationInternal(sessionId);
  return { updatedDoc, deleted: true };
}
async function updateSessionStatusInternal(sessionId, newStatus) {
  const opLogger = new Logger("UpdateStatus");
  opLogger.debug("Updating status", { sessionId, newStatus });
  const validStatuses = ["idle", "processing", "complete", "error"];
  if (!sessionId || !validStatuses.includes(newStatus)) {
    throw new AppError("INVALID_INPUT", `Invalid session ID or status: ${newStatus}`);
  }
  const collection = await ensureDbReady();
  const chatDoc = await withTimeout(collection.findOne(sessionId).exec(), 3e3);
  if (!chatDoc) {
    throw new AppError("NOT_FOUND", `Session ${sessionId} not found`);
  }
  const updatedDoc = await withTimeout(
    chatDoc.incrementalPatch({ status: newStatus }),
    3e3
  );
  opLogger.info("Status updated", { sessionId, newStatus });
  await publishSessionUpdateNotificationInternal(sessionId);
  return updatedDoc;
}
async function toggleItemStarredInternal(itemId) {
  const opLogger = new Logger("ToggleStar");
  opLogger.debug("Toggling starred status", { itemId });
  if (!itemId) {
    throw new AppError("INVALID_INPUT", "Item ID is required");
  }
  const collection = await ensureDbReady();
  const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3e3);
  if (!entryDoc) {
    throw new AppError("NOT_FOUND", `Item ${itemId} not found`);
  }
  const currentStarredStatus = entryDoc.get("isStarred") || false;
  const updatedDoc = await withTimeout(
    entryDoc.incrementalPatch({ isStarred: !currentStarredStatus }),
    3e3
  );
  opLogger.info("Starred status toggled", { itemId, isStarred: !currentStarredStatus });
  await publishSessionUpdateNotificationInternal(itemId);
  return updatedDoc;
}
async function deleteHistoryItemInternal(itemId) {
  const opLogger = new Logger("DeleteHistory");
  opLogger.debug("Deleting history item", { itemId });
  if (!itemId) {
    throw new AppError("INVALID_INPUT", "Item ID is required");
  }
  const collection = await ensureDbReady();
  const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3e3);
  if (!entryDoc) {
    opLogger.info("Item not found", { itemId });
    return false;
  }
  await withTimeout(entryDoc.remove(), 3e3);
  opLogger.info("Item deleted", { itemId });
  await publishSessionUpdateNotificationInternal(itemId);
  return true;
}
async function renameHistoryItemInternal(itemId, newTitle) {
  const opLogger = new Logger("RenameHistory");
  opLogger.debug("Renaming history item", { itemId, newTitle });
  if (!itemId || !newTitle) {
    throw new AppError("INVALID_INPUT", "Item ID and new title are required");
  }
  const collection = await ensureDbReady();
  const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3e3);
  if (!entryDoc) {
    throw new AppError("NOT_FOUND", `Item ${itemId} not found`);
  }
  const updatedDoc = await withTimeout(
    entryDoc.incrementalPatch({ title: sanitizeInput(newTitle) }),
    3e3
  );
  opLogger.info("Item renamed", { itemId, newTitle });
  await publishSessionUpdateNotificationInternal(itemId);
  return updatedDoc;
}
async function getAllSessionsInternal() {
  const opLogger = new Logger("GetAllSessions");
  opLogger.debug("Getting all sessions");
  const collection = await ensureDbReady();
  const sessionsDocs = await withTimeout(
    collection.find().sort({ timestamp: "desc" }).exec(),
    5e3
  );
  const plainSessions = sessionsDocs.map((doc) => doc.toJSON());
  opLogger.info("Retrieved sessions", { count: plainSessions.length });
  return plainSessions;
}
async function getStarredSessionsInternal() {
  const opLogger = new Logger("GetStarredSessions");
  opLogger.debug("Getting starred sessions");
  const collection = await ensureDbReady();
  const sessions = await withTimeout(
    collection.find({ selector: { isStarred: true } }).sort({ timestamp: "desc" }).exec(),
    5e3
  );
  opLogger.info("Retrieved starred sessions", { count: sessions.length });
  return sessions;
}
async function publishSessionUpdateNotificationInternal(sessionId, updateType = "update") {
  const opLogger = new Logger("SessionUpdate");
  opLogger.debug(`Attempting to publish session update for ${sessionId}, type: ${updateType}`);
  try {
    await ensureDbReady();
    const updatedSessionDoc = await getChatSessionByIdInternal(sessionId);
    if (!updatedSessionDoc) {
      opLogger.error("Session not found after update, cannot publish notification", { sessionId });
      return;
    }
    const updatedSessionData = updatedSessionDoc.toJSON ? updatedSessionDoc.toJSON() : updatedSessionDoc;
    opLogger.info(`Publishing session update notification for ${sessionId}`);
    await eventBus$1.publish(
      DB_SESSION_UPDATED_NOTIFICATION,
      new DbSessionUpdatedNotification(sessionId, updatedSessionData, updateType)
    );
    opLogger.debug("Session update published", { sessionId, updateType });
  } catch (error) {
    opLogger.error("Failed to publish session update", { sessionId, error });
  }
}
async function handleDbCreateSessionRequest(event) {
  var _a2;
  const opLogger = new Logger("CreateSessionHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling session creation", { requestId });
  try {
    if (!(event == null ? void 0 : event.requestId) || !((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.initialMessage) || !event.payload.initialMessage.text) {
      throw new AppError("INVALID_INPUT", "Missing requestId, initialMessage, or message text");
    }
    const newSessionDoc = await withTimeout(createChatSessionInternal(event.payload.initialMessage), 5e3);
    if (!(newSessionDoc == null ? void 0 : newSessionDoc.id)) {
      throw new AppError("INVALID_DOCUMENT", "Invalid session document returned");
    }
    await withTimeout(Promise.all([
      eventBus$1.publish(
        DB_MESSAGES_UPDATED_NOTIFICATION,
        new DbMessagesUpdatedNotification(newSessionDoc.id, newSessionDoc.messages)
      ),
      eventBus$1.publish(
        DB_STATUS_UPDATED_NOTIFICATION,
        new DbStatusUpdatedNotification(newSessionDoc.id, newSessionDoc.status)
      )
    ]), 3e3);
    const response = new DbCreateSessionResponse(requestId, true, newSessionDoc.id);
    console.log(`[DB:${opLogger.module}] PRE-PUBLISH Check (Success Path): ReqID ${requestId}, Response Success: ${response == null ? void 0 : response.success}, Response Type: ${response == null ? void 0 : response.type}`);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Session created successfully", { requestId, sessionId: newSessionDoc.id });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to create session", { originalError: error });
    const response = new DbCreateSessionResponse(requestId, false, null, appError);
    console.log(`[DB:${opLogger.module}] PRE-PUBLISH Check (Error Path): ReqID ${requestId}, Response Success: ${response == null ? void 0 : response.success}, Response Type: ${response == null ? void 0 : response.type}`);
    try {
      await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    } catch (publishError) {
      opLogger.error("FATAL: Failed even to publish error response!", { requestId, publishError });
    }
    opLogger.error("Session creation failed", { requestId, error: appError });
  }
}
async function handleDbGetSessionRequest(event) {
  var _a2;
  const opLogger = new Logger("GetSessionHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling get session", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId)) {
      throw new AppError("INVALID_INPUT", "Session ID is required");
    }
    const doc = await withTimeout(getChatSessionByIdInternal(event.payload.sessionId), 5e3);
    const response = new DbGetSessionResponse(requestId, true, doc ? doc.toJSON() : null);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Session retrieved", { requestId, sessionId: event.payload.sessionId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to get session", { originalError: error });
    const response = new DbGetSessionResponse(requestId, false, null, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Get session failed", { requestId, error: appError });
  }
}
async function handleDbAddMessageRequest(event) {
  var _a2, _b;
  const opLogger = new Logger("AddMessageHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling add message", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId) || !((_b = event == null ? void 0 : event.payload) == null ? void 0 : _b.messageObject) || !event.payload.messageObject.text) {
      throw new AppError("INVALID_INPUT", "Session ID and message with text are required");
    }
    const { updatedDoc, newMessageId } = await withTimeout(
      addMessageToChatInternal(event.payload.sessionId, event.payload.messageObject),
      5e3
    );
    const plainMessages = updatedDoc.messages.map((m) => m.toJSON ? m.toJSON() : m);
    await withTimeout(
      eventBus$1.publish(
        DB_MESSAGES_UPDATED_NOTIFICATION,
        new DbMessagesUpdatedNotification(updatedDoc.id, plainMessages)
      ),
      3e3
    );
    const response = new DbAddMessageResponse(requestId, true, newMessageId);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Message added", { requestId, sessionId: event.payload.sessionId, messageId: newMessageId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to add message", { originalError: error });
    const response = new DbAddMessageResponse(requestId, false, null, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Add message failed", { requestId, error: appError });
  }
}
async function handleDbUpdateMessageRequest(event) {
  var _a2, _b, _c;
  const opLogger = new Logger("UpdateMessageHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling update message", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId) || !((_b = event == null ? void 0 : event.payload) == null ? void 0 : _b.messageId) || !((_c = event == null ? void 0 : event.payload) == null ? void 0 : _c.updates) || !event.payload.updates.text) {
      throw new AppError("INVALID_INPUT", "Session ID, message ID, and updates with text are required");
    }
    const updatedDoc = await withTimeout(
      updateMessageInChatInternal(event.payload.sessionId, event.payload.messageId, event.payload.updates),
      5e3
    );
    await withTimeout(
      eventBus$1.publish(
        DB_MESSAGES_UPDATED_NOTIFICATION,
        new DbMessagesUpdatedNotification(updatedDoc.id, updatedDoc.messages)
      ),
      3e3
    );
    const response = new DbUpdateMessageResponse(requestId, true);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Message updated", { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to update message", { originalError: error });
    const response = new DbUpdateMessageResponse(requestId, false, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Update message failed", { requestId, error: appError });
  }
}
async function handleDbDeleteMessageRequest(event) {
  var _a2, _b;
  const opLogger = new Logger("DeleteMessageHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling delete message", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId) || !((_b = event == null ? void 0 : event.payload) == null ? void 0 : _b.messageId)) {
      throw new AppError("INVALID_INPUT", "Session ID and message ID are required");
    }
    const { updatedDoc, deleted } = await withTimeout(
      deleteMessageFromChatInternal(event.payload.sessionId, event.payload.messageId),
      5e3
    );
    if (deleted) {
      await withTimeout(
        eventBus$1.publish(
          DB_MESSAGES_UPDATED_NOTIFICATION,
          new DbMessagesUpdatedNotification(updatedDoc.id, updatedDoc.messages)
        ),
        3e3
      );
    }
    const response = new DbDeleteMessageResponse(requestId, true);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Message deleted", { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to delete message", { originalError: error });
    const response = new DbDeleteMessageResponse(requestId, false, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Delete message failed", { requestId, error: appError });
  }
}
async function handleDbUpdateStatusRequest(event) {
  var _a2, _b;
  const opLogger = new Logger("UpdateStatusHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling update status", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId) || !((_b = event == null ? void 0 : event.payload) == null ? void 0 : _b.status)) {
      throw new AppError("INVALID_INPUT", "Session ID and status are required");
    }
    const updatedDoc = await withTimeout(
      updateSessionStatusInternal(event.payload.sessionId, event.payload.status),
      5e3
    );
    await withTimeout(
      eventBus$1.publish(
        DB_STATUS_UPDATED_NOTIFICATION,
        new DbStatusUpdatedNotification(updatedDoc.id, updatedDoc.status)
      ),
      3e3
    );
    const response = new DbUpdateStatusResponse(requestId, true);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Status updated", { requestId, sessionId: event.payload.sessionId, status: event.payload.status });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to update status", { originalError: error });
    const response = new DbUpdateStatusResponse(requestId, false, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Update status failed", { requestId, error: appError });
    try {
      await withTimeout(
        eventBus$1.publish(
          DB_STATUS_UPDATED_NOTIFICATION,
          new DbStatusUpdatedNotification(event.payload.sessionId, "error")
        ),
        3e3
      );
    } catch (notificationError) {
      opLogger.error("Failed to publish error status notification", { requestId, error: notificationError });
    }
  }
}
async function handleDbToggleStarRequest(event) {
  var _a2;
  const opLogger = new Logger("ToggleStarHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling toggle star", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId)) {
      throw new AppError("INVALID_INPUT", "Session ID is required");
    }
    const updatedDoc = await withTimeout(toggleItemStarredInternal(event.payload.sessionId), 5e3);
    const response = new DbToggleStarResponse(requestId, true, updatedDoc.toJSON());
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Star toggled", { requestId, sessionId: event.payload.sessionId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to toggle star", { originalError: error });
    const response = new DbToggleStarResponse(requestId, false, null, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Toggle star failed", { requestId, error: appError });
  }
}
async function handleDbGetAllSessionsRequest(event) {
  const opLogger = new Logger("GetAllSessionsHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling get all sessions", { requestId });
  try {
    const sessionsRaw = await withTimeout(getAllSessionsInternal(), 5e3);
    const sortedSessions = sessionsRaw.sort((a, b) => b.timestamp - a.timestamp);
    opLogger.debug("Using plain sessions directly", { count: sortedSessions.length });
    const response = new DbGetAllSessionsResponse(requestId, true, sortedSessions);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Sessions retrieved", { requestId, count: sortedSessions.length });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to get all sessions", { originalError: error });
    const response = new DbGetAllSessionsResponse(requestId, false, null, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Get all sessions failed", { requestId, error: appError });
  }
}
async function handleDbGetStarredSessionsRequest(event) {
  const opLogger = new Logger("GetStarredSessionsHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling get starred sessions", { requestId });
  try {
    const sessionsRaw = await withTimeout(getStarredSessionsInternal(), 5e3);
    const starredSessions = sessionsRaw.map((s) => ({
      sessionId: s.id,
      name: s.title,
      lastUpdated: s.timestamp,
      isStarred: s.isStarred
    })).sort((a, b) => b.lastUpdated - a.lastUpdated);
    opLogger.debug("Retrieved starred sessions", { count: starredSessions.length });
    const response = new DbGetStarredSessionsResponse(requestId, true, starredSessions);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Starred sessions retrieved", { requestId, count: starredSessions.length });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to get starred sessions", { originalError: error });
    const response = new DbGetStarredSessionsResponse(requestId, false, null, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Get starred sessions failed", { requestId, error: appError });
  }
}
async function handleDbDeleteSessionRequest(event) {
  var _a2;
  const opLogger = new Logger("DeleteSessionHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling delete session", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId)) {
      throw new AppError("INVALID_INPUT", "Session ID is required");
    }
    const deleted = await withTimeout(deleteHistoryItemInternal(event.payload.sessionId), 5e3);
    const response = new DbDeleteSessionResponse(requestId, true);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Session deleted", { requestId, sessionId: event.payload.sessionId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to delete session", { originalError: error });
    const response = new DbDeleteSessionResponse(requestId, false, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Delete session failed", { requestId, error: appError });
  }
}
async function handleDbRenameSessionRequest(event) {
  var _a2, _b;
  const opLogger = new Logger("RenameSessionHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  opLogger.info("Handling rename session", { requestId });
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.sessionId) || !((_b = event == null ? void 0 : event.payload) == null ? void 0 : _b.newName)) {
      throw new AppError("INVALID_INPUT", "Session ID and new name are required");
    }
    const updatedDoc = await withTimeout(
      renameHistoryItemInternal(event.payload.sessionId, event.payload.newName),
      5e3
    );
    const response = new DbRenameSessionResponse(requestId, true);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.info("Session renamed", { requestId, sessionId: event.payload.sessionId });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to rename session", { originalError: error });
    const response = new DbRenameSessionResponse(requestId, false, appError);
    await withTimeout(eventBus$1.publish(response.type, response), 3e3);
    opLogger.error("Rename session failed", { requestId, error: appError });
  }
}
async function handleDbAddLogRequest(event) {
  var _a2;
  const opLogger = new Logger("AddLogHandler");
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.logEntryData)) {
      throw new AppError("INVALID_INPUT", "Missing logEntryData in payload");
    }
    const collection = await ensureDbReady("log");
    await withTimeout(collection.insert(event.payload.logEntryData), 3e3);
    opLogger.debug("Log entry added successfully", { logId: event.payload.logEntryData.id });
  } catch (error) {
    opLogger.error("Failed to handle add log request", { requestId: event == null ? void 0 : event.requestId, error });
  }
}
async function handleDbGetLogsRequest(event) {
  var _a2;
  const opLogger = new Logger("GetLogsHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.filters)) {
      throw new AppError("INVALID_INPUT", "Missing filters in payload");
    }
    const logs = await getLogsInternal(event.payload.filters);
    const response = new DbGetLogsResponse(requestId, true, logs);
    await eventBus$1.publish(response.type, response);
    opLogger.info("Log retrieval successful", { requestId, count: logs.length });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to get logs", { originalError: error });
    const response = new DbGetLogsResponse(requestId, false, null, appError);
    await eventBus$1.publish(response.type, response);
    opLogger.error("Get logs failed", { requestId, error: appError });
  }
}
async function handleDbGetUniqueLogValuesRequest(event) {
  var _a2;
  const opLogger = new Logger("GetUniqueLogValuesHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  try {
    if (!((_a2 = event == null ? void 0 : event.payload) == null ? void 0 : _a2.fieldName)) {
      throw new AppError("INVALID_INPUT", "Missing fieldName in payload");
    }
    const values = await getUniqueLogValuesInternal(event.payload.fieldName);
    const response = new DbGetUniqueLogValuesResponse(requestId, true, values);
    await eventBus$1.publish(response.type, response);
    opLogger.info("Unique value retrieval successful", { requestId, field: event.payload.fieldName, count: values.length });
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to get unique log values", { originalError: error });
    const response = new DbGetUniqueLogValuesResponse(requestId, false, null, appError);
    await eventBus$1.publish(response.type, response);
    opLogger.error("Get unique log values failed", { requestId, error: appError });
  }
}
async function handleDbClearLogsRequest(event) {
  const opLogger = new Logger("ClearLogsHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  try {
    opLogger.info("ClearLogs request received. Performing pruning of non-current/last sessions.");
    const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
    const sessionsToKeep = /* @__PURE__ */ new Set();
    if (currentExtensionSessionId) sessionsToKeep.add(currentExtensionSessionId);
    if (previousExtensionSessionId) sessionsToKeep.add(previousExtensionSessionId);
    const sessionIdsToDelete = Array.from(allLogSessionIds).filter((id) => !sessionsToKeep.has(id));
    if (sessionIdsToDelete.length > 0) {
      const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
      opLogger.info(`ClearLogs request resulted in pruning ${deletedCount} logs from old sessions.`);
    } else {
      opLogger.info("ClearLogs request found no old sessions to prune.");
    }
    const response = new DbClearLogsResponse(requestId, true);
    await eventBus$1.publish(response.type, response);
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError("UNKNOWN", "Failed to clear logs", { originalError: error });
    const response = new DbClearLogsResponse(requestId, false, appError);
    await eventBus$1.publish(response.type, response);
    opLogger.error("Clear logs failed", { requestId, error: appError });
  }
}
async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
  const opLogger = new Logger("GetCurrentAndLastIdsHandler");
  const requestId = (event == null ? void 0 : event.requestId) || crypto.randomUUID();
  try {
    const ids = {
      currentLogSessionId: currentExtensionSessionId,
      previousLogSessionId: previousExtensionSessionId
      // This might be null if it's the first run
    };
    const response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, true, ids);
    await eventBus$1.publish(response.type, response);
    opLogger.info("Current/Last session ID retrieval successful", { requestId });
  } catch (error) {
    const appError = new AppError("UNKNOWN", "Failed to get current/last log session IDs", { originalError: error });
    const response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, false, null, appError);
    await eventBus$1.publish(response.type, response);
    opLogger.error("Get current/last log session IDs failed", { requestId, error: appError });
  }
}
eventBus$1.subscribe(DB_INITIALIZE_REQUEST, handleInitializeRequest);
logger.info("Subscribed to DbInitializeRequest");
async function getAllUniqueLogSessionIdsInternal() {
  const opLogger = new Logger("GetUniqueLogSessionIds");
  opLogger.debug("Starting retrieval of unique session IDs...");
  const collection = await ensureDbReady("log");
  opLogger.debug("Log collection ensured ready.");
  try {
    opLogger.debug("Executing find().select(extensionSessionId).exec()...");
    const results = await collection.find().exec();
    opLogger.debug(`Found ${results.length} log documents.`);
    const uniqueIds = new Set(results.map((doc) => doc.get("extensionSessionId")));
    opLogger.debug("Unique session IDs calculated", { count: uniqueIds.size });
    return uniqueIds;
  } catch (error) {
    opLogger.error("Error during find().select().exec() for unique session IDs", { error });
    throw new AppError("DB_QUERY_FAILED", "Failed to retrieve unique log session IDs", { originalError: error });
  }
}
async function clearLogsInternal(sessionIdsToDelete) {
  const opLogger = new Logger("ClearLogs");
  opLogger.info("ClearLogs request received. Performing pruning of non-current/last sessions.");
  const collection = await ensureDbReady("log");
  opLogger.debug("Log collection ensured ready.");
  const results = await collection.find().exec();
  opLogger.debug(`Found ${results.length} log documents.`);
  const filteredResults = results.filter((doc) => {
    const sessionId = doc.get("extensionSessionId");
    return sessionId && !sessionIdsToDelete.includes(sessionId);
  });
  opLogger.debug(`Filtered results count: ${filteredResults.length}`);
  const deletedCount = filteredResults.length;
  await withTimeout(collection.bulkRemove(filteredResults), 3e3);
  opLogger.info(`ClearLogs request resulted in pruning ${deletedCount} logs from old sessions.`);
  return { deletedCount };
}
let isInitialized$3 = false;
let starredListElement = null;
let librarySearchInput = null;
let requestDbAndWaitFunc = null;
let currentStarredItems = [];
let currentSearchFilter = "";
let searchListenerAttached = false;
async function handleStarClick(sessionId) {
  console.log(`[LibraryController] Star clicked: ${sessionId}`);
  if (!requestDbAndWaitFunc) return;
  try {
    await requestDbAndWaitFunc(new DbToggleStarRequest(sessionId));
    showNotification$1("Star toggled", "success");
  } catch (error) {
    console.error("[LibraryController] Error toggling star:", error);
    showNotification$1(`Failed to toggle star: ${error.message}`, "error");
  }
}
async function handleDeleteClick(sessionId) {
  console.log(`[LibraryController] Delete clicked: ${sessionId}`);
  if (!requestDbAndWaitFunc) return;
  if (confirm("Are you sure you want to delete this chat history item? This cannot be undone.")) {
    try {
      await requestDbAndWaitFunc(new DbDeleteSessionRequest(sessionId));
      showNotification$1("Chat deleted", "success");
    } catch (error) {
      console.error("[LibraryController] Error deleting chat:", error);
      showNotification$1(`Failed to delete chat: ${error.message}`, "error");
    }
  }
}
async function handleRenameSubmit(sessionId, newName) {
  console.log(`[LibraryController] Rename submitted: ${sessionId} to "${newName}"`);
  if (!requestDbAndWaitFunc) return;
  try {
    await requestDbAndWaitFunc(new DbRenameSessionRequest(sessionId, newName));
    showNotification$1("Rename successful", "success");
  } catch (error) {
    console.error("[LibraryController] Error submitting rename:", error);
    showNotification$1(`Failed to rename chat: ${error.message}`, "error");
  }
}
async function handleDownloadClick(sessionId) {
  if (requestDbAndWaitFunc) {
    initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotification$1);
  } else {
    console.error("[LibraryController] Cannot download: requestDbAndWaitFunc not available.");
    showNotification$1("Download failed: Internal setup error.", "error");
  }
}
async function handleLoadClick(sessionId) {
  console.log(`[LibraryController] Load clicked: ${sessionId}`);
  try {
    await chrome.storage.local.set({ lastSessionId: sessionId });
    navigateTo("page-home");
  } catch (error) {
    console.error("[LibraryController] Error setting storage or navigating:", error);
    showNotification$1("Failed to load chat.", "error");
    await chrome.storage.local.remove("lastSessionId");
  }
}
function handleShareClick(sessionId) {
  console.log(`[LibraryController] Share clicked: ${sessionId}`);
  showNotification$1("Share functionality not yet implemented.", "info");
}
function handlePreviewClick(sessionId, contentElement) {
  console.log(`[LibraryController] Preview clicked: ${sessionId}`);
  showNotification$1("Preview functionality not yet implemented.", "info");
  if (contentElement) {
    contentElement.innerHTML = "Preview loading...";
    contentElement.classList.toggle("hidden");
  }
}
function handleNavigationChange(event) {
  if (!isInitialized$3 || (event == null ? void 0 : event.pageId) !== "page-library") {
    return;
  }
  console.log("[LibraryController] Library page activated.");
  if (!searchListenerAttached) {
    librarySearchInput = document.getElementById("library-search");
    if (librarySearchInput) {
      librarySearchInput.addEventListener("input", handleSearchInput);
      searchListenerAttached = true;
      console.log("[LibraryController] Search input listener attached.");
    } else {
      console.warn("[LibraryController] Library search input (#library-search) still not found even when page is active.");
    }
  }
  fetchAndRenderLibrary();
}
async function fetchAndRenderLibrary() {
  if (!isInitialized$3 || !starredListElement || !requestDbAndWaitFunc) {
    console.error("[LibraryController] Cannot fetch/render - not initialized or missing elements/functions.");
    return;
  }
  console.log("[LibraryController] Fetching starred items...");
  starredListElement.innerHTML = '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">Loading starred items...</p>';
  currentSearchFilter = (librarySearchInput == null ? void 0 : librarySearchInput.value.trim()) || "";
  try {
    const responsePayload = await requestDbAndWaitFunc(new DbGetStarredSessionsRequest());
    currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload == null ? void 0 : responsePayload.sessions) || [];
    console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
    renderLibraryList(currentSearchFilter);
  } catch (error) {
    console.error("[LibraryController] Error fetching starred items:", error);
    starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
  }
}
function handleSessionUpdate(notification) {
  if (!isInitialized$3 || !notification || !notification.sessionId || !notification.payload) {
    console.warn("[LibraryController] Invalid session update notification received.", notification);
    return;
  }
  const updatedSessionData = notification.payload.session;
  const sessionId = notification.sessionId;
  if (!updatedSessionData) {
    console.warn(`[LibraryController] Session update notification for ${sessionId} missing session data in payload.session.`, notification);
    return;
  }
  console.log(`[LibraryController] Received session update for ${sessionId}. New starred status: ${updatedSessionData.isStarred}`);
  const itemIndex = currentStarredItems.findIndex((item) => item.sessionId === sessionId);
  if (updatedSessionData.isStarred) {
    if (itemIndex === -1) {
      console.log(`[LibraryController] Session ${sessionId} is newly starred. Adding to list.`);
      const newItem = {
        sessionId,
        name: updatedSessionData.title || "Untitled",
        // Use title from update if available
        lastUpdated: updatedSessionData.timestamp || Date.now(),
        // Use timestamp from update
        isStarred: true
      };
      currentStarredItems.push(newItem);
    } else {
      console.log(`[LibraryController] Session ${sessionId} was already starred. Updating data.`);
      currentStarredItems[itemIndex] = {
        ...currentStarredItems[itemIndex],
        // Keep existing data
        name: updatedSessionData.title || currentStarredItems[itemIndex].name,
        // Update name if available
        lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated,
        // Update timestamp
        isStarred: true
      };
    }
  } else {
    if (itemIndex !== -1) {
      console.log(`[LibraryController] Session ${sessionId} is no longer starred. Removing from list.`);
      currentStarredItems.splice(itemIndex, 1);
    } else {
      console.log(`[LibraryController] Session ${sessionId} is not starred and was not in the list.`);
    }
  }
  const libraryPage = document.getElementById("page-library");
  if (libraryPage && !libraryPage.classList.contains("hidden")) {
    console.log("[LibraryController] Library page is active, re-rendering list with filter.");
    currentSearchFilter = (librarySearchInput == null ? void 0 : librarySearchInput.value.trim()) || "";
    renderLibraryList(currentSearchFilter);
  } else {
    console.log("[LibraryController] Library page not active, internal list updated passively.");
  }
}
function renderLibraryList(filter2 = "") {
  if (!isInitialized$3 || !starredListElement) return;
  console.log(`[LibraryController] Rendering with filter "${filter2}"`);
  let itemsToRender = [...currentStarredItems];
  if (filter2) {
    const searchTerm = filter2.toLowerCase();
    itemsToRender = itemsToRender.filter(
      (entry) => (entry.name || "").toLowerCase().includes(searchTerm)
    );
  }
  itemsToRender.sort((a, b) => b.lastUpdated - a.lastUpdated);
  starredListElement.innerHTML = "";
  if (itemsToRender.length === 0) {
    const message = filter2 ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items match "${filter2}".</p>` : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items yet.</p>';
    starredListElement.innerHTML = message;
  } else {
    itemsToRender.forEach((entry) => {
      const props = {
        entry: {
          id: entry.sessionId,
          name: entry.name,
          title: entry.name,
          timestamp: entry.lastUpdated,
          isStarred: entry.isStarred,
          messages: []
        },
        // Pass migrated action handlers
        onLoadClick: handleLoadClick,
        onStarClick: handleStarClick,
        onDeleteClick: handleDeleteClick,
        onRenameSubmit: handleRenameSubmit,
        onDownloadClick: handleDownloadClick,
        onShareClick: handleShareClick,
        onPreviewClick: handlePreviewClick
      };
      const itemElement = renderHistoryItemComponent(props);
      if (itemElement) {
        starredListElement.appendChild(itemElement);
      }
    });
  }
  console.log(`[LibraryController] Rendered ${itemsToRender.length} items.`);
}
const handleSearchInput = debounce((event) => {
  if (!isInitialized$3) return;
  currentSearchFilter = event.target.value.trim();
  console.log(`[LibraryController] Search input changed: "${currentSearchFilter}"`);
  renderLibraryList(currentSearchFilter);
}, 300);
function initializeLibraryController(elements, requestFunc) {
  console.log("[LibraryController] Initializing...");
  if (!elements || !elements.listContainer || !requestFunc) {
    console.error("[LibraryController] Initialization failed: Missing required elements (listContainer) or request function.", { elements, requestFunc });
    return null;
  }
  starredListElement = elements.listContainer;
  requestDbAndWaitFunc = requestFunc;
  console.log("[LibraryController] Elements and request function assigned.");
  eventBus$1.subscribe("navigation:pageChanged", handleNavigationChange);
  console.log("[LibraryController] Subscribed to navigation:pageChanged.");
  eventBus$1.subscribe(DbSessionUpdatedNotification.name, handleSessionUpdate);
  console.log("[LibraryController] Subscribed to DbSessionUpdatedNotification.");
  isInitialized$3 = true;
  console.log("[LibraryController] Initialization successful. Library will render when activated.");
  return {
    // Expose methods if needed, e.g., manual refresh?
    // refresh: fetchAndRenderLibrary
  };
}
let isInitialized$2 = false;
function initializeDiscoverController() {
  if (isInitialized$2) {
    console.log("[DiscoverController] Already initialized.");
    return;
  }
  console.log("[DiscoverController] Initializing...");
  isInitialized$2 = true;
  console.log("[DiscoverController] Initialized successfully.");
  return {};
}
let isInitialized$1 = false;
const updateThemeButtonText = (button) => {
  if (!button) return;
  const isDarkMode = document.documentElement.classList.contains("dark");
  button.textContent = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
};
function setupThemeToggle() {
  const settingsPageContainer = document.getElementById("page-settings");
  if (!settingsPageContainer) {
    console.warn("[SettingsController] Could not find #page-settings container.");
    return;
  }
  let themeToggleButton = settingsPageContainer.querySelector("#theme-toggle-button");
  if (!themeToggleButton) {
    console.log("[SettingsController] Creating theme toggle button.");
    themeToggleButton = document.createElement("button");
    themeToggleButton.id = "theme-toggle-button";
    themeToggleButton.className = "p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-4";
    themeToggleButton.onclick = () => {
      const htmlElement = document.documentElement;
      const isCurrentlyDark = htmlElement.classList.contains("dark");
      console.log(`[SettingsToggle] Before toggle - isDark: ${isCurrentlyDark}`);
      if (isCurrentlyDark) {
        htmlElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        console.log(`[SettingsToggle] Removed dark class, set localStorage to light`);
      } else {
        htmlElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
      }
      updateThemeButtonText(themeToggleButton);
    };
    const placeholderText = settingsPageContainer.querySelector("p");
    if (placeholderText) {
      placeholderText.insertAdjacentElement("afterend", themeToggleButton);
    } else {
      settingsPageContainer.appendChild(themeToggleButton);
    }
  } else {
    console.log("[SettingsController] Theme toggle button already exists.");
  }
  updateThemeButtonText(themeToggleButton);
}
function setupSlider(sliderId, valueSpanId) {
  const slider = document.getElementById(sliderId);
  const valueSpan = document.getElementById(valueSpanId);
  if (slider && valueSpan) {
    valueSpan.textContent = slider.value;
    slider.addEventListener("input", (event) => {
      valueSpan.textContent = event.target.value;
    });
    console.log(`[SettingsController] Setup slider ${sliderId} with value display ${valueSpanId}`);
  } else {
    if (!slider) console.warn(`[SettingsController] Slider element not found: #${sliderId}`);
    if (!valueSpan) console.warn(`[SettingsController] Value span element not found: #${valueSpanId}`);
  }
}
function initializeSettingsController() {
  if (isInitialized$1) {
    console.log("[SettingsController] Already initialized.");
    return;
  }
  console.log("[SettingsController] Initializing...");
  setupThemeToggle();
  setupSlider("setting-temperature", "setting-temperature-value");
  setupSlider("setting-repeat-penalty", "setting-repeat-penalty-value");
  setupSlider("setting-top-p", "setting-top-p-value");
  setupSlider("setting-min-p", "setting-min-p-value");
  const viewLogsButton = document.getElementById("viewLogsButton");
  if (viewLogsButton) {
    viewLogsButton.addEventListener("click", () => {
      console.log("[SettingsController] View Logs button clicked. Opening log viewer popup...");
      try {
        const viewerUrl = "sidepanel.html?view=logs";
        chrome.windows.create({
          url: viewerUrl,
          // Use the modified relative path
          type: "popup",
          width: 800,
          // Specify desired width
          height: 600
          // Specify desired height
        });
      } catch (error) {
        console.error("[SettingsController] Error opening log viewer popup:", error);
      }
    });
    console.log("[SettingsController] Added listener to View Logs button.");
  } else {
    console.warn("[SettingsController] View Logs button (viewLogsButton) not found.");
  }
  isInitialized$1 = true;
  console.log("[SettingsController] Initialized successfully.");
  return {};
}
let isInitialized = false;
function initializeSpacesController() {
  if (isInitialized) {
    console.log("[SpacesController] Already initialized.");
    return;
  }
  console.log("[SpacesController] Initializing...");
  isInitialized = true;
  console.log("[SpacesController] Initialized successfully.");
  return {};
}
const GOOGLE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
let driveButton;
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack;
let isDriveOpen = false;
let currentFolderId = "root";
let currentFolderPath = [{ id: "root", name: "Root" }];
let driveFilesCache = {};
let selectedDriveFiles = {};
let isFetchingDriveList = false;
let driveSearchTerm = "";
let showNotificationDep = showNotification$1;
let debounceDep = null;
function showDriveViewerModal() {
  console.log("Attempting to show Drive modal...");
  if (isDriveOpen) return;
  if (!driveViewerModal) {
    console.error("DriveViewerModal element not found.");
    return;
  }
  console.log("DriveController: Showing Drive Viewer modal.");
  currentFolderId = "root";
  currentFolderPath = [{ id: "root", name: "Root" }];
  selectedDriveFiles = {};
  driveFilesCache = {};
  driveSearchTerm = "";
  if (driveViewerSearch) driveViewerSearch.value = "";
  updateInsertButtonState();
  renderSelectedFiles();
  console.log("Fetching root content and making modal visible.");
  fetchAndDisplayViewerFolderContent("root");
  driveViewerModal.classList.remove("hidden");
  isDriveOpen = true;
}
function hideDriveViewerModal() {
  if (!isDriveOpen) return;
  if (!driveViewerModal) return;
  console.log("DriveController: Hiding Drive Viewer modal.");
  driveViewerModal.classList.add("hidden");
  isDriveOpen = false;
  if (driveViewerList) {
    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;
  }
}
function getFallbackIcon(mimeType) {
  if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
}
function renderDriveViewerItems(items) {
  console.log(`[DriveController:Render] renderDriveViewerItems called with ${(items == null ? void 0 : items.length) ?? 0} items.`);
  if (!driveViewerList) return;
  driveViewerList.innerHTML = "";
  const searchTermLower = driveSearchTerm.toLowerCase();
  const filteredItems = driveSearchTerm ? items.filter((item) => item.name.toLowerCase().includes(searchTermLower)) : items;
  if (!filteredItems || filteredItems.length === 0) {
    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">${driveSearchTerm ? "No results found." : "Folder is empty."}</div>`;
    return;
  }
  filteredItems.forEach((item) => {
    const isFolder = item.mimeType === GOOGLE_FOLDER_MIME_TYPE;
    const itemElement = document.createElement("div");
    itemElement.className = "drive-viewer-item flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer";
    itemElement.dataset.id = item.id;
    itemElement.dataset.name = item.name;
    itemElement.dataset.mimeType = item.mimeType;
    itemElement.dataset.iconLink = item.iconLink || "";
    const iconDiv = document.createElement("div");
    iconDiv.className = "flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center";
    if (item.iconLink) {
      iconDiv.innerHTML = `<img src="${item.iconLink}" alt="${isFolder ? "Folder" : "File"}" class="w-5 h-5">`;
    } else {
      iconDiv.innerHTML = getFallbackIcon(item.mimeType);
    }
    const nameSpan = document.createElement("span");
    nameSpan.className = "flex-grow truncate";
    nameSpan.textContent = item.name;
    nameSpan.title = item.name;
    itemElement.appendChild(iconDiv);
    itemElement.appendChild(nameSpan);
    if (selectedDriveFiles[item.id]) {
      itemElement.classList.add("selected");
    }
    itemElement.addEventListener("click", handleDriveItemClick);
    driveViewerList.appendChild(itemElement);
  });
}
function fetchAndDisplayViewerFolderContent(folderId) {
  if (!driveViewerList || isFetchingDriveList) {
    return;
  }
  isFetchingDriveList = true;
  console.log(`DriveController: Fetching Drive content for folder: ${folderId}`);
  updateBreadcrumbs();
  updateHeaderState();
  driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;
  if (driveFilesCache[folderId]) {
    console.log(`DriveController: Using cached content for folder: ${folderId}`);
    renderDriveViewerItems(driveFilesCache[folderId]);
    isFetchingDriveList = false;
    return;
  }
  browser.runtime.sendMessage({
    type: "getDriveFileList",
    folderId
  }).then(() => {
    console.log(`DriveController: Sent getDriveFileList request for ${folderId}. Waiting for response...`);
  }).catch((error) => {
    console.error("DriveController: Error *sending* getDriveFileList message:", (error == null ? void 0 : error.message) || error);
    showNotificationDep(`Error contacting background script: ${(error == null ? void 0 : error.message) || "Unknown error"}`, "error");
    if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
    isFetchingDriveList = false;
  });
}
function handleDriveItemClick(event) {
  event.stopPropagation();
  const itemElement = event.currentTarget;
  const itemId = itemElement.dataset.id;
  const itemName = itemElement.dataset.name;
  const mimeType = itemElement.dataset.mimeType;
  const iconLink = itemElement.dataset.iconLink;
  if (!itemId || !mimeType) {
    console.error("DriveController: Clicked Drive item missing ID or mimeType.");
    return;
  }
  if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
    console.log(`DriveController: Navigating into folder: ${itemName} (${itemId})`);
    currentFolderId = itemId;
    currentFolderPath.push({ id: itemId, name: itemName });
    driveSearchTerm = "";
    if (driveViewerSearch) driveViewerSearch.value = "";
    fetchAndDisplayViewerFolderContent(itemId);
  } else {
    console.log(`DriveController: Toggling selection for file: ${itemName} (${itemId})`);
    toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType, iconLink });
  }
}
function updateBreadcrumbs() {
  if (!driveViewerBreadcrumbsContainer) return;
  driveViewerBreadcrumbsContainer.innerHTML = "";
  currentFolderPath.forEach((folder, index) => {
    const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? "span" : "button");
    crumbElement.textContent = folder.name;
    crumbElement.dataset.id = folder.id;
    crumbElement.dataset.index = index;
    if (index < currentFolderPath.length - 1) {
      crumbElement.className = "text-blue-600 hover:underline dark:text-blue-400 cursor-pointer";
      crumbElement.addEventListener("click", handleBreadcrumbClick);
      const separator = document.createElement("span");
      separator.textContent = " / ";
      separator.className = "mx-1 text-gray-400";
      driveViewerBreadcrumbsContainer.appendChild(crumbElement);
      driveViewerBreadcrumbsContainer.appendChild(separator);
    } else {
      crumbElement.className = "font-semibold";
      driveViewerBreadcrumbsContainer.appendChild(crumbElement);
    }
  });
}
function handleBreadcrumbClick(event) {
  const targetIndex = parseInt(event.currentTarget.dataset.index, 10);
  const targetFolderId = event.currentTarget.dataset.id;
  if (isNaN(targetIndex) || !targetFolderId) {
    console.error("DriveController: Invalid breadcrumb data.");
    return;
  }
  if (targetFolderId === currentFolderId) return;
  console.log(`DriveController: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
  currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
  currentFolderId = targetFolderId;
  driveSearchTerm = "";
  if (driveViewerSearch) driveViewerSearch.value = "";
  fetchAndDisplayViewerFolderContent(targetFolderId);
}
function toggleFileSelection(fileId, element, fileData) {
  if (selectedDriveFiles[fileId]) {
    delete selectedDriveFiles[fileId];
    element == null ? void 0 : element.classList.remove("selected");
  } else {
    selectedDriveFiles[fileId] = fileData;
    element == null ? void 0 : element.classList.add("selected");
  }
  renderSelectedFiles();
  updateInsertButtonState();
}
function renderSelectedFiles() {
  if (!driveViewerSelectedArea) return;
  const selectedIds = Object.keys(selectedDriveFiles);
  const pillContainer = driveViewerSelectedArea;
  if (!pillContainer) {
    console.error("Selected area container not found");
    return;
  }
  const pillInnerContainer = pillContainer.querySelector(".flex-wrap") || pillContainer;
  pillInnerContainer.innerHTML = "";
  if (selectedIds.length === 0) {
    pillContainer.classList.add("hidden");
  } else {
    pillContainer.classList.remove("hidden");
    selectedIds.forEach((id) => {
      const file = selectedDriveFiles[id];
      const pill = document.createElement("span");
      pill.className = "selected-file-item";
      const iconHtml = file.iconLink ? `<img src="${file.iconLink}" alt="" class="w-3 h-3 mr-1.5">` : "";
      const removeBtnHtml = `<button class="selected-file-remove" data-id="${id}">&times;</button>`;
      pill.innerHTML = `${iconHtml}${file.name} ${removeBtnHtml}`;
      pillInnerContainer.appendChild(pill);
      const removeBtn = pill.querySelector(".selected-file-remove");
      removeBtn == null ? void 0 : removeBtn.addEventListener("click", handleRemoveSelectedFile);
    });
  }
}
function handleRemoveSelectedFile(event) {
  const fileId = event.currentTarget.dataset.id;
  if (fileId && selectedDriveFiles[fileId]) {
    delete selectedDriveFiles[fileId];
    renderSelectedFiles();
    updateInsertButtonState();
    const listItem = driveViewerList == null ? void 0 : driveViewerList.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
    listItem == null ? void 0 : listItem.classList.remove("selected");
  }
}
function updateInsertButtonState() {
  if (!driveViewerInsert) return;
  const count = Object.keys(selectedDriveFiles).length;
  driveViewerInsert.disabled = count === 0;
  driveViewerInsert.textContent = `Insert (${count})`;
}
function handleDriveSearchInput(event) {
  driveSearchTerm = event.target.value.trim();
  console.log(`DriveController: Filtering Drive items by term: "${driveSearchTerm}"`);
  if (driveFilesCache[currentFolderId]) {
    renderDriveViewerItems(driveFilesCache[currentFolderId]);
  } else {
    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not loaded or empty.</div>`;
  }
}
function handleDriveBackButtonClick() {
  if (currentFolderPath.length <= 1) return;
  const parentFolder = currentFolderPath[currentFolderPath.length - 2];
  currentFolderPath.pop();
  currentFolderId = parentFolder.id;
  console.log(`DriveController: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
  driveSearchTerm = "";
  if (driveViewerSearch) driveViewerSearch.value = "";
  fetchAndDisplayViewerFolderContent(parentFolder.id);
}
function updateHeaderState() {
  if (!driveViewerBack) return;
  if (currentFolderPath.length > 1) {
    driveViewerBack.classList.remove("hidden");
  } else {
    driveViewerBack.classList.add("hidden");
  }
}
function handleDriveFileListResponse(message) {
  console.log(`[DriveController:Handler] Received file list data. Message type: ${message == null ? void 0 : message.type}`);
  if (message.type === "driveFileListData") {
    const folderId = message.folderId;
    console.log(`DriveController: Handling driveFileListData for folder: ${folderId}`);
    isFetchingDriveList = false;
    console.log(`[DriveController:Handler] Check: isDriveOpen=${isDriveOpen}, message.folderId=${folderId}, currentFolderId=${currentFolderId}`);
    if (!isDriveOpen || folderId !== currentFolderId) {
      console.warn(`DriveController: Ignoring driveFileListData for folder ${folderId}. Current: ${currentFolderId}, IsOpen: ${isDriveOpen}`);
      return;
    }
    if (message.success && message.files) {
      console.log(`[DriveController:Handler] Success! Caching and calling renderDriveViewerItems for ${message.files.length} files.`);
      driveFilesCache[folderId] = message.files;
      renderDriveViewerItems(message.files);
      console.log(`[DriveController:Handler] renderDriveViewerItems completed.`);
    } else {
      const errorMsg = message.error || "Unknown error fetching files.";
      console.error(`DriveController: Drive file list error for ${folderId}: ${errorMsg}`);
      showNotificationDep(`Error fetching folder content: ${errorMsg}`, "error");
      if (driveViewerList) {
        driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
      }
    }
  } else {
    console.warn(`[DriveController:Handler] Received unexpected message type: ${message == null ? void 0 : message.type}`);
  }
}
function initializeDriveController(dependencies) {
  console.log("Initializing DriveController...");
  if (!dependencies || !dependencies.requestDbAndWaitFunc || !dependencies.getActiveChatSessionId || !dependencies.setActiveChatSessionId || !dependencies.showNotification || !dependencies.debounce || !dependencies.eventBus) {
    console.error("DriveController requires dependencies: requestDbAndWaitFunc, getActiveChatSessionId, setActiveChatSessionId, showNotification, debounce, eventBus!");
    return;
  }
  showNotificationDep = dependencies.showNotification;
  debounceDep = dependencies.debounce;
  driveButton = document.getElementById("drive-button");
  driveViewerModal = document.getElementById("drive-viewer-modal");
  driveViewerClose = document.getElementById("drive-viewer-close");
  driveViewerList = document.getElementById("drive-viewer-list");
  driveViewerCancel = document.getElementById("drive-viewer-cancel");
  driveViewerInsert = document.getElementById("drive-viewer-insert");
  driveViewerSearch = document.getElementById("drive-viewer-search");
  driveViewerSelectedArea = document.getElementById("drive-viewer-selected");
  driveViewerBreadcrumbsContainer = document.getElementById("drive-viewer-breadcrumbs");
  driveViewerBack = document.getElementById("drive-viewer-back");
  if (!driveViewerModal || !driveViewerList) {
    console.error("DriveController: Essential modal elements (#drive-viewer-modal, #drive-viewer-list) not found!");
    return;
  }
  if (driveButton) {
    driveButton.addEventListener("click", handleDriveButtonClick);
  }
  if (driveViewerClose) {
    driveViewerClose.addEventListener("click", hideDriveViewerModal);
  }
  if (driveViewerCancel) {
    driveViewerCancel.addEventListener("click", hideDriveViewerModal);
  }
  if (driveViewerInsert) {
    driveViewerInsert.addEventListener("click", () => {
      console.warn("Insert button functionality not yet implemented.");
      hideDriveViewerModal();
    });
  }
  if (driveViewerSearch && debounceDep) {
    driveViewerSearch.addEventListener("input", debounceDep(handleDriveSearchInput, 300));
  } else if (driveViewerSearch) {
    console.warn("Debounce dependency missing, search will trigger on every keypress.");
    driveViewerSearch.addEventListener("input", handleDriveSearchInput);
  }
  if (driveViewerBack) {
    driveViewerBack.addEventListener("click", handleDriveBackButtonClick);
  }
  console.log("DriveController Initialized successfully.");
}
const handleDriveButtonClick = (event) => {
  console.log("Drive button clicked!");
  event.stopPropagation();
  showDriveViewerModal();
};
if (window.marked) {
  window.marked.setOptions({
    highlight: function(code, lang) {
      if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } catch (e) {
          console.error("hljs error:", e);
        }
      } else if (window.hljs) {
        try {
          return window.hljs.highlightAuto(code).value;
        } catch (e) {
          console.error("hljs auto error:", e);
        }
      }
      const escapeHtml = (htmlStr) => {
        return htmlStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      };
      return escapeHtml(code);
    },
    langPrefix: "language-",
    gfm: true,
    breaks: true
  });
  console.log("[Sidepanel] Marked.js globally configured to use highlight.js.");
} else {
  console.error("[Sidepanel] Marked.js library (window.marked) not found. Ensure it's loaded before this script.");
}
let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;
let historyPopupController = null;
let isDbReady = false;
const pendingDbRequests = /* @__PURE__ */ new Map();
function requestDbAndWait(requestEvent, timeoutMs = 5e3) {
  return new Promise((resolve2, reject) => {
    const { requestId, type: requestType } = requestEvent;
    const responseEventType = requestEvent.constructor.responseEventName;
    if (!responseEventType) {
      const errorMsg = `[requestDbAndWait] Cannot determine response event type for request: ${requestType}`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
      return;
    }
    const responseHandler = (responseEvent) => {
      console.log(`[requestDbAndWait] Received event for ${responseEventType}, ReqID ${responseEvent == null ? void 0 : responseEvent.requestId}, Waiting for ${requestId}`);
      console.log("[requestDbAndWait] RAW Received Event Object:", responseEvent);
      if (responseEvent && responseEvent.requestId === requestId) {
        console.log(`[requestDbAndWait] MATCH FOUND for ReqID ${requestId}. Event Payload:`, responseEvent);
        clearTimeout(timeoutId);
        eventBus$1.unsubscribe(responseEventType, responseHandler);
        pendingDbRequests.delete(requestId);
        if (responseEvent.error === null || typeof responseEvent.error === "undefined") {
          console.log(`[requestDbAndWait] Success assumed (no error property) for ReqID ${requestId}. Resolving promise.`);
          resolve2(responseEvent.data || responseEvent.payload);
        } else {
          console.error(`[requestDbAndWait] Error property found for ReqID ${requestId}. responseEvent.error was: ${responseEvent.error}. Rejecting promise.`);
          reject(new Error(responseEvent.error || `DB operation ${requestType} failed`));
        }
      }
    };
    const timeoutId = setTimeout(() => {
      console.error(`[Sidepanel] DB request timed out for ${requestType} (Req ID: ${requestId})`);
      eventBus$1.unsubscribe(responseEventType, responseHandler);
      pendingDbRequests.delete(requestId);
      reject(new Error(`DB request timed out for ${requestType}`));
    }, timeoutMs);
    pendingDbRequests.set(requestId, { handler: responseHandler, timeoutId });
    eventBus$1.subscribe(responseEventType, responseHandler);
    eventBus$1.publish(requestEvent.type, requestEvent);
  });
}
function getActiveChatSessionId() {
  return activeSessionId;
}
async function setActiveChatSessionId(newSessionId) {
  console.log(`[Sidepanel] Setting active session ID to: ${newSessionId}`);
  activeSessionId = newSessionId;
  if (newSessionId) {
    await browser.storage.local.set({ lastSessionId: newSessionId });
  } else {
    await browser.storage.local.remove("lastSessionId");
  }
  setActiveSessionId(newSessionId);
  setActiveSession(newSessionId);
}
document.addEventListener("DOMContentLoaded", async () => {
  var _a2, _b, _c;
  console.log("[Sidepanel] DOM Content Loaded.");
  const urlParams = new URLSearchParams(window.location.search);
  const requestedView = urlParams.get("view");
  if (requestedView === "logs") {
    console.log("[Sidepanel] Initializing in Log Viewer Mode.");
    document.body.classList.add("log-viewer-mode");
    (_a2 = document.getElementById("header")) == null ? void 0 : _a2.classList.add("hidden");
    (_b = document.getElementById("bottom-nav")) == null ? void 0 : _b.classList.add("hidden");
    document.querySelectorAll("#main-content > .page-container:not(#page-log-viewer)").forEach((el) => el.classList.add("hidden"));
    const logViewerPage = document.getElementById("page-log-viewer");
    if (logViewerPage) {
      logViewerPage.classList.remove("hidden");
    } else {
      console.error("CRITICAL: #page-log-viewer element not found!");
      document.body.innerHTML = "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>";
      return;
    }
    try {
      const logViewerModule = await __vitePreload(() => import("./assets/LogViewerController-BjGpsg6G.js"), true ? [] : void 0);
      await logViewerModule.initializeLogViewerController();
      console.log("[Sidepanel] Log Viewer Controller initialized.");
    } catch (err) {
      console.error("Failed to load or initialize LogViewerController:", err);
      if (logViewerPage) {
        logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${err.message}</div>`;
      }
    }
    return;
  }
  console.log("[Sidepanel] Initializing in Standard Mode.");
  (_c = document.getElementById("page-log-viewer")) == null ? void 0 : _c.classList.add("hidden");
  let dbInitializationComplete = false;
  const dbReadyPromise2 = new Promise((resolve2, reject) => {
    const TIMEOUT_MS = 1e4;
    const timeoutId = setTimeout(() => {
      if (!dbInitializationComplete) {
        console.error("[Sidepanel] DB Initialization timed out!");
        reject(new Error("Database initialization timed out."));
      }
    }, TIMEOUT_MS);
    const dbInitHandler = (notification) => {
      var _a3;
      dbInitializationComplete = true;
      clearTimeout(timeoutId);
      eventBus$1.unsubscribe(DbInitializationCompleteNotification.name, dbInitHandler);
      if (notification && notification.payload && notification.payload.success) {
        console.log("[Sidepanel] Received DB Initialization Complete notification (Success).");
        resolve2(true);
      } else {
        const errorMsg = ((_a3 = notification == null ? void 0 : notification.payload) == null ? void 0 : _a3.error) || "Unknown DB initialization error";
        console.error(`[Sidepanel] Received DB Initialization Complete notification (Failure): ${errorMsg}`);
        reject(new Error(`Database initialization failed: ${errorMsg}`));
      }
    };
    eventBus$1.subscribe(DbInitializationCompleteNotification.name, dbInitHandler);
    console.log("[Sidepanel] Subscribed to DbInitializationCompleteNotification. Publishing DbInitializeRequest...");
    eventBus$1.publish(DbInitializeRequest.name, new DbInitializeRequest());
  });
  try {
    const {
      chatBody: chatBody2,
      newChatButton,
      chatInputElement,
      sendButton: sendButton2,
      fileInput: fileInput2
    } = initializeUI({
      onNewChat: handleNewChat,
      onSessionClick: handleChatSessionClick,
      onAttachFile: handleAttachClick
    });
    console.log("[Sidepanel] UI Controller Initialized.");
    const chatBodyForRenderer = document.getElementById("chat-body");
    if (!chatBodyForRenderer) {
      console.error("[Sidepanel] CRITICAL: chatBodyForRenderer is null right before calling initializeRenderer!");
    }
    initializeRenderer(chatBodyForRenderer, requestDbAndWait);
    console.log("[Sidepanel] Chat Renderer Initialized.");
    initializeNavigation();
    console.log("[Sidepanel] Navigation Initialized.");
    eventBus$1.subscribe("navigation:pageChanged", handlePageChange);
    initializeFileHandling({
      uiController,
      getActiveSessionIdFunc: getActiveChatSessionId
    });
    console.log("[Sidepanel] File Handler Initialized.");
    const fileInputForListener = document.getElementById("file-input");
    if (fileInputForListener) {
      fileInputForListener.addEventListener("change", handleFileSelected);
    } else {
      console.warn("[Sidepanel] File input element (re-fetched) not found before adding listener.");
    }
    const activeTab = await getActiveTab();
    currentTabId = activeTab == null ? void 0 : activeTab.id;
    currentTab = activeTab;
    console.log(`[Sidepanel] Current Tab ID: ${currentTabId}`);
    initializeOrchestrator({
      getActiveSessionIdFunc: getActiveChatSessionId,
      onSessionCreatedCallback: handleSessionCreated,
      getCurrentTabIdFunc: () => currentTabId
    });
    console.log("[Sidepanel] Message Orchestrator Initialized.");
    browser.runtime.onMessage.addListener(handleBackgroundMessage);
    console.log("[Sidepanel] Background message listener added.");
    const historyPopupElement2 = document.getElementById("history-popup");
    const historyListElement2 = document.getElementById("history-list");
    const historySearchElement2 = document.getElementById("history-search");
    const closeHistoryButtonElement2 = document.getElementById("close-history");
    const historyButton = document.getElementById("history-button");
    const detachButton = document.getElementById("detach-button");
    if (historyPopupElement2 && historyListElement2 && historySearchElement2 && closeHistoryButtonElement2) {
      historyPopupController = initializeHistoryPopup(
        {
          popupContainer: historyPopupElement2,
          listContainer: historyListElement2,
          searchInput: historySearchElement2,
          closeButton: closeHistoryButtonElement2
        },
        requestDbAndWait
      );
      if (!historyPopupController) {
        console.error("[Sidepanel] History Popup Controller initialization failed.");
      }
    } else {
      console.warn("[Sidepanel] Could not find all required elements for History Popup Controller.");
    }
    if (historyButton && historyPopupController) {
      historyButton.addEventListener("click", () => {
        historyPopupController.show();
      });
    } else {
      console.warn("[Sidepanel] History button or controller not available for listener.");
    }
    if (detachButton) {
      detachButton.addEventListener("click", handleDetach);
    } else {
      console.warn("[Sidepanel] Detach button not found.");
    }
    const libraryListElement = document.getElementById("starred-list");
    if (libraryListElement) {
      initializeLibraryController(
        { listContainer: libraryListElement },
        requestDbAndWait
      );
      console.log("[Sidepanel] Library Controller Initialized.");
    } else {
      console.warn("[Sidepanel] Could not find #starred-list element for Library Controller.");
    }
    eventBus$1.subscribe("ui:requestModelLoad", (payload) => {
      const modelId = payload == null ? void 0 : payload.modelId;
      if (!modelId) {
        console.error("[Sidepanel] Received 'ui:requestModelLoad' but missing modelId.");
        eventBus$1.publish("worker:error", "No model ID specified for loading.");
        return;
      }
      console.log(`[Sidepanel] Received 'ui:requestModelLoad' for ${modelId}. Sending 'loadModel' to background.`);
      browser.runtime.sendMessage({ type: "loadModel", payload: { modelId } }).catch((err) => {
        console.error(`[Sidepanel] Error sending 'loadModel' message for ${modelId}:`, err);
        eventBus$1.publish("worker:error", `Failed to send load request: ${err.message}`);
      });
    });
    initializeDiscoverController();
    console.log("[Sidepanel] Discover Controller Initialized call attempted.");
    initializeSettingsController();
    console.log("[Sidepanel] Settings Controller Initialized call attempted.");
    initializeSpacesController();
    console.log("[Sidepanel] Spaces Controller Initialized call attempted.");
    initializeDriveController({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification: showNotification$1,
      debounce,
      eventBus: eventBus$1
    });
    console.log("[Sidepanel] Drive Controller Initialized.");
    console.log("[Sidepanel] Waiting for DB initialization to complete...");
    isDbReady = await dbReadyPromise2;
    console.log("[Sidepanel] DB initialization confirmed complete.");
    const popupContext = urlParams.get("context");
    originalTabIdFromPopup = popupContext === "popup" ? urlParams.get("originalTabId") : null;
    isPopup = popupContext === "popup";
    console.log(`[Sidepanel] Context: ${isPopup ? "Popup" : "Sidepanel"}${isPopup ? ", Original Tab: " + originalTabIdFromPopup : ""}`);
    if (isPopup && originalTabIdFromPopup) {
      const storageKey2 = `detachedSessionId_${originalTabIdFromPopup}`;
      const result = await browser.storage.local.get(storageKey2);
      const detachedSessionId = result[storageKey2];
      if (detachedSessionId) {
        console.log(`[Sidepanel-Popup] Found detached session ID: ${detachedSessionId}. Loading...`);
        await loadAndDisplaySession(detachedSessionId);
      } else {
        console.log(`[Sidepanel-Popup] No detached session ID found for key ${storageKey2}. Starting fresh.`);
        await setActiveChatSessionId(null);
      }
    } else {
      console.log("[Sidepanel] Always starting fresh. Loading empty/welcome state.");
      await loadAndDisplaySession(null);
    }
    console.log("[Sidepanel] Initialization complete (after DB ready).");
  } catch (error) {
    console.error("[Sidepanel] Initialization failed:", error);
    showError(`Initialization failed: ${error.message}. Please try reloading.`);
    const chatBody2 = document.getElementById("chat-body");
    if (chatBody2) {
      chatBody2.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
    }
  }
});
function handleBackgroundMessage(message, sender, sendResponse) {
  console.log("[Sidepanel] Received message from background:", message);
  if (message.type === "response") {
    const payload = { chatId: message.chatId, messageId: message.messageId, text: message.text };
    eventBus$1.publish("background:responseReceived", payload);
  } else if (message.type === "error") {
    const payload = { chatId: message.chatId, messageId: message.messageId, error: message.error };
    eventBus$1.publish("background:errorReceived", payload);
    sendResponse({});
  } else if (message.type === "STAGE_SCRAPE_RESULT") {
    eventBus$1.publish("background:scrapeStageResult", message.payload);
    sendResponse({ status: "received", type: message.type });
  } else if (message.type === "DIRECT_SCRAPE_RESULT") {
    eventBus$1.publish("background:scrapeResultReceived", message.payload);
    sendResponse({});
  } else if (message.type === "uiLoadingStatusUpdate") {
    console.log("[Sidepanel] Forwarding uiLoadingStatusUpdate to eventBus.");
    eventBus$1.publish("ui:loadingStatusUpdate", message.payload);
  } else if (message.type === "driveFileListData") {
    console.log("[Sidepanel] Received driveFileListData, calling DriveController handler directly.");
    handleDriveFileListResponse(message);
  } else {
    console.warn("[Sidepanel] Received unknown message type from background:", message.type, message);
  }
}
async function handleSessionCreated(newSessionId) {
  console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
  await setActiveChatSessionId(newSessionId);
  console.log(`[Sidepanel] Explicitly fetching messages for new session ${newSessionId}`);
  try {
    const request = new DbGetSessionRequest(newSessionId);
    const sessionData = await requestDbAndWait(request);
    if (sessionData && sessionData.messages) {
      eventBus$1.publish(
        DbMessagesUpdatedNotification.name,
        new DbMessagesUpdatedNotification(newSessionId, sessionData.messages)
      );
      console.log(`[Sidepanel] Manually triggered message render for new session ${newSessionId}`);
    } else {
      console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}. Response data:`, sessionData);
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, error);
    showError(`Failed to load initial messages for new chat: ${error.message}`);
  }
}
async function handleNewChat() {
  console.log("[Sidepanel] New Chat button clicked.");
  await setActiveChatSessionId(null);
  clearInput();
  focusInput();
}
async function handleChatSessionClick(event) {
  const sessionId = event.currentTarget.dataset.sessionId;
  if (sessionId && sessionId !== activeSessionId) {
    console.log(`[Sidepanel] Session list item clicked: ${sessionId}`);
    await loadAndDisplaySession(sessionId);
  } else if (sessionId === activeSessionId) {
    console.log(`[Sidepanel] Clicked already active session: ${sessionId}`);
    scrollToBottom();
  } else {
    console.warn("[Sidepanel] Session list click event missing sessionId:", event.currentTarget);
  }
}
async function loadAndDisplaySession(sessionId) {
  if (!sessionId) {
    console.log("[Sidepanel] No session ID to load, setting renderer to null.");
    await setActiveChatSessionId(null);
    return;
  }
  console.log(`[Sidepanel] Loading session data for: ${sessionId}`);
  let sessionData = null;
  try {
    const request = new DbGetSessionRequest(sessionId);
    sessionData = await requestDbAndWait(request);
    console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
    await setActiveChatSessionId(sessionId);
    if (sessionData && sessionData.messages) {
      console.log(`[Sidepanel] Manually triggering message render for loaded session ${sessionId}.`);
      eventBus$1.publish(
        DbMessagesUpdatedNotification.name,
        new DbMessagesUpdatedNotification(sessionId, sessionData.messages)
      );
    } else {
      console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}. Displaying empty chat.`);
      eventBus$1.publish(
        DbMessagesUpdatedNotification.name,
        new DbMessagesUpdatedNotification(sessionId, { messages: [] })
      );
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to load session ${sessionId}:`, error);
    showError(`Failed to load chat: ${error.message}`);
    await setActiveChatSessionId(null);
  }
}
async function handleDetach() {
  if (!currentTabId) {
    console.error("Cannot detach: Missing tab ID");
    showError("Cannot detach: Missing tab ID");
    return;
  }
  const currentSessionId2 = getActiveChatSessionId();
  try {
    const response = await browser.runtime.sendMessage({
      type: "getPopupForTab",
      tabId: currentTabId
    });
    if (response && response.popupId) {
      await browser.windows.update(response.popupId, { focused: true });
      return;
    }
    const storageKey2 = `detachedSessionId_${currentTabId}`;
    await browser.storage.local.set({
      [storageKey2]: currentSessionId2
    });
    console.log(`Sidepanel: Saved session ID ${currentSessionId2} for detach key ${storageKey2}.`);
    const popup = await browser.windows.create({
      url: browser.runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
      type: "popup",
      width: 400,
      height: 600
    });
    if (popup == null ? void 0 : popup.id) {
      await browser.runtime.sendMessage({
        type: "popupCreated",
        tabId: currentTabId,
        popupId: popup.id
      });
    } else {
      throw new Error("Failed to create popup window.");
    }
  } catch (error) {
    console.error("Error during detach:", error);
    showError(`Error detaching chat: ${error.message}`);
  }
}
async function handlePageChange(event) {
  if (!event || !event.pageId) return;
  console.log(`[Sidepanel] Navigation changed to: ${event.pageId}`);
  if (!isDbReady) {
    console.log("[Sidepanel] DB not ready yet, skipping session load on initial navigation event.");
    return;
  }
  if (event.pageId === "page-home") {
    console.log("[Sidepanel] Navigated to home page, checking for specific session load signal...");
    try {
      const { lastSessionId } = await browser.storage.local.get(["lastSessionId"]);
      if (lastSessionId) {
        console.log(`[Sidepanel] Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
        await loadAndDisplaySession(lastSessionId);
        await browser.storage.local.remove("lastSessionId");
      } else {
        console.log("[Sidepanel] No load signal found. Resetting to welcome state.");
        await loadAndDisplaySession(null);
      }
    } catch (error) {
      console.error("[Sidepanel] Error checking/loading session based on signal:", error);
      showError("Failed to load session state.");
      await loadAndDisplaySession(null);
    }
  }
}
//# sourceMappingURL=sidepanel.js.map
