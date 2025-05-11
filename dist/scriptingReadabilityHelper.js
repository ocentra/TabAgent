/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/events/eventNames.js":
/*!**********************************!*\
  !*** ./src/events/eventNames.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Contexts: () => (/* binding */ Contexts),
/* harmony export */   DBEventNames: () => (/* binding */ DBEventNames),
/* harmony export */   InternalEventBusMessageTypes: () => (/* binding */ InternalEventBusMessageTypes),
/* harmony export */   ModelLoaderMessageTypes: () => (/* binding */ ModelLoaderMessageTypes),
/* harmony export */   ModelWorkerStates: () => (/* binding */ ModelWorkerStates),
/* harmony export */   RawDirectMessageTypes: () => (/* binding */ RawDirectMessageTypes),
/* harmony export */   RuntimeMessageTypes: () => (/* binding */ RuntimeMessageTypes),
/* harmony export */   SiteMapperMessageTypes: () => (/* binding */ SiteMapperMessageTypes),
/* harmony export */   UIEventNames: () => (/* binding */ UIEventNames),
/* harmony export */   WorkerEventNames: () => (/* binding */ WorkerEventNames)
/* harmony export */ });
const DBEventNames = Object.freeze({
  DB_GET_SESSION_REQUEST: 'DbGetSessionRequest',
  DB_GET_SESSION_RESPONSE: 'DbGetSessionResponse',
  DB_ADD_MESSAGE_REQUEST: 'DbAddMessageRequest',
  DB_ADD_MESSAGE_RESPONSE: 'DbAddMessageResponse',
  DB_UPDATE_MESSAGE_REQUEST: 'DbUpdateMessageRequest',
  DB_UPDATE_MESSAGE_RESPONSE: 'DbUpdateMessageResponse',
  DB_UPDATE_STATUS_REQUEST: 'DbUpdateStatusRequest',
  DB_UPDATE_STATUS_RESPONSE: 'DbUpdateStatusResponse',
  DB_DELETE_MESSAGE_REQUEST: 'DbDeleteMessageRequest',
  DB_DELETE_MESSAGE_RESPONSE: 'DbDeleteMessageResponse',
  DB_TOGGLE_STAR_REQUEST: 'DbToggleStarRequest',
  DB_TOGGLE_STAR_RESPONSE: 'DbToggleStarResponse',
  DB_CREATE_SESSION_REQUEST: 'DbCreateSessionRequest',
  DB_CREATE_SESSION_RESPONSE: 'DbCreateSessionResponse',
  DB_DELETE_SESSION_REQUEST: 'DbDeleteSessionRequest',
  DB_DELETE_SESSION_RESPONSE: 'DbDeleteSessionResponse',
  DB_RENAME_SESSION_REQUEST: 'DbRenameSessionRequest',
  DB_RENAME_SESSION_RESPONSE: 'DbRenameSessionResponse',
  DB_GET_ALL_SESSIONS_REQUEST: 'DbGetAllSessionsRequest',
  DB_GET_ALL_SESSIONS_RESPONSE: 'DbGetAllSessionsResponse',
  DB_GET_STARRED_SESSIONS_REQUEST: 'DbGetStarredSessionsRequest',
  DB_GET_STARRED_SESSIONS_RESPONSE: 'DbGetStarredSessionsResponse',
  DB_MESSAGES_UPDATED_NOTIFICATION: 'DbMessagesUpdatedNotification',
  DB_STATUS_UPDATED_NOTIFICATION: 'DbStatusUpdatedNotification',
  DB_SESSION_UPDATED_NOTIFICATION: 'DbSessionUpdatedNotification',
  DB_INITIALIZE_REQUEST: 'DbInitializeRequest',
  DB_INITIALIZATION_COMPLETE_NOTIFICATION: 'DbInitializationCompleteNotification',
  DB_GET_LOGS_REQUEST: 'DbGetLogsRequest',
  DB_GET_LOGS_RESPONSE: 'DbGetLogsResponse',
  DB_GET_UNIQUE_LOG_VALUES_REQUEST: 'DbGetUniqueLogValuesRequest',
  DB_GET_UNIQUE_LOG_VALUES_RESPONSE: 'DbGetUniqueLogValuesResponse',
  DB_CLEAR_LOGS_REQUEST: 'DbClearLogsRequest',
  DB_CLEAR_LOGS_RESPONSE: 'DbClearLogsResponse',
  DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST: 'DbGetCurrentAndLastLogSessionIdsRequest',
  DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE: 'DbGetCurrentAndLastLogSessionIdsResponse',
  DB_ADD_LOG_REQUEST: 'DbAddLogRequest',
  DB_ADD_LOG_RESPONSE: 'DbAddLogResponse',
  DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
  DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
  DB_RESET_DATABASE_REQUEST: 'DbResetDatabaseRequest',
  DB_RESET_DATABASE_RESPONSE: 'DbResetDatabaseResponse',
});

const UIEventNames = Object.freeze({
  QUERY_SUBMITTED: 'ui:querySubmitted',
  BACKGROUND_RESPONSE_RECEIVED: 'background:responseReceived',
  BACKGROUND_ERROR_RECEIVED: 'background:errorReceived',
  BACKGROUND_SCRAPE_STAGE_RESULT: 'background:scrapeStageResult',
  BACKGROUND_SCRAPE_RESULT_RECEIVED: 'background:scrapeResultReceived',
  BACKGROUND_LOADING_STATUS_UPDATE: 'ui:loadingStatusUpdate',
  REQUEST_MODEL_LOAD: 'ui:requestModelLoad',
  WORKER_READY: 'worker:ready',
  WORKER_ERROR: 'worker:error',
  NAVIGATION_PAGE_CHANGED: 'navigation:pageChanged',
  SCRAPE_ACTIVE_TAB: 'SCRAPE_ACTIVE_TAB',
  DYNAMIC_SCRIPT_MESSAGE_TYPE: 'offscreenIframeResult',
  // Add more as needed
});

const WorkerEventNames = Object.freeze({
  WORKER_SCRIPT_READY: 'workerScriptReady',
  WORKER_READY: 'workerReady',
  LOADING_STATUS: 'loadingStatus',
  GENERATION_STATUS: 'generationStatus',
  GENERATION_UPDATE: 'generationUpdate',
  GENERATION_COMPLETE: 'generationComplete',
  GENERATION_ERROR: 'generationError',
  RESET_COMPLETE: 'resetComplete',
  ERROR: 'error',
});

const ModelWorkerStates = Object.freeze({
  UNINITIALIZED: 'uninitialized',
  CREATING_WORKER: 'creating_worker',
  WORKER_SCRIPT_READY: 'worker_script_ready',
  LOADING_MODEL: 'loading_model',
  MODEL_READY: 'model_ready',
  GENERATING: 'generating',
  ERROR: 'error',
  IDLE: 'idle',
});

const RuntimeMessageTypes = Object.freeze({
  LOAD_MODEL: 'loadModel',
  SEND_CHAT_MESSAGE: 'sendChatMessage',
  INTERRUPT_GENERATION: 'interruptGeneration',
  RESET_WORKER: 'resetWorker',
  GET_MODEL_WORKER_STATE: 'getModelWorkerState',
  SCRAPE_REQUEST: 'scrapeRequest',
  GET_DRIVE_FILE_LIST: 'getDriveFileList',
  GET_LOG_SESSIONS: 'getLogSessions',
  GET_LOG_ENTRIES: 'getLogEntries',
  DETACH_SIDE_PANEL: 'detachSidePanel',
  GET_DETACHED_STATE: 'getDetachedState',
  GET_DB_READY_STATE: 'getDbReadyState',
});

const SiteMapperMessageTypes = Object.freeze({
  OPEN_TAB: 'openTab',
  MAPPED: 'mapped',
});

const ModelLoaderMessageTypes = Object.freeze({
  INIT: 'init',
  GENERATE: 'generate',
  INTERRUPT: 'interrupt',
  RESET: 'reset',
});

const InternalEventBusMessageTypes = Object.freeze({
  BACKGROUND_EVENT_BROADCAST: 'InternalEventBus:BackgroundEventBroadcast'
});

const RawDirectMessageTypes = Object.freeze({
  WORKER_GENERIC_RESPONSE: 'response',
  WORKER_GENERIC_ERROR: 'error',
  WORKER_SCRAPE_STAGE_RESULT: 'STAGE_SCRAPE_RESULT',
  WORKER_DIRECT_SCRAPE_RESULT: 'DIRECT_SCRAPE_RESULT',
  WORKER_UI_LOADING_STATUS_UPDATE: 'uiLoadingStatusUpdate' // This one is used as a direct message type
});

const Contexts = Object.freeze({
  BACKGROUND: 'Background',
  MAIN_UI: 'MainUI',
  POPUP: 'Popup',
  OTHERS: 'Others',
  UNKNOWN: 'Unknown',
}); 

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************************!*\
  !*** ./src/scriptingReadabilityHelper.js ***!
  \*******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");

window.EXTENSION_CONTEXT = _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.Contexts.OTHERS;
// DO NOT use import statements here - they won't work in scripts injected via registerContentScripts.
// Readability should be globally available because Readability.js is injected first.

(function() {
    // This must match eventNames.js UIEventNames.DYNAMIC_SCRIPT_MESSAGE_TYPE
    const DYNAMIC_SCRIPT_MESSAGE_TYPE = 'offscreenIframeResult';
    // Polyfill for browser API if only chrome is available
    const browser = typeof window.browser !== 'undefined' ? window.browser : (typeof window.chrome !== 'undefined' ? window.chrome : undefined);
    console.log('[Dynamic Script Helper] Running in iframe...');

    let result = { success: false, source: 'dynamic-script-helper' };

    const runReadabilityAndSend = () => {
        try {
            if (typeof Readability === 'undefined') {
                throw new Error('Readability library not found in iframe context.');
            }

            const article = new Readability(document).parse();
            result = {
                success: true,
                source: 'dynamic-script-helper',
                title: article ? article.title : '',
                textContent: article ? article.textContent : '',
                content: article ? article.content : '',
                byline: article ? article.byline : '',
                length: article ? article.length : 0,
                excerpt: article ? article.excerpt : '',
                siteName: article ? article.siteName : ''
            };
            console.log('[Dynamic Script Helper] Readability parsing successful.');
        } catch (e) {
            console.error('[Dynamic Script Helper] Error:', e);
            result.error = e.message || 'Unknown error in dynamic script helper';
        }
        console.log('[Dynamic Script Helper] Sending result back to background:', result);
        browser.runtime.sendMessage({ type: DYNAMIC_SCRIPT_MESSAGE_TYPE, payload: result });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
         console.log('[Dynamic Script Helper] Document already ready. Running Readability...');
         runReadabilityAndSend();
    } else {
         console.log('[Dynamic Script Helper] Document not ready. Adding load listener...');
         window.addEventListener('load', () => {
              console.log('[Dynamic Script Helper] Window load event fired. Running Readability...');
              runReadabilityAndSend();
         }, { once: true });
    }

})(); 
})();

/******/ })()
;
//# sourceMappingURL=scriptingReadabilityHelper.js.map