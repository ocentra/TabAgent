export const DBEventNames = Object.freeze({
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

export const UIEventNames = Object.freeze({
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

export const WorkerEventNames = Object.freeze({
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

export const ModelWorkerStates = Object.freeze({
  UNINITIALIZED: 'uninitialized',
  CREATING_WORKER: 'creating_worker',
  WORKER_SCRIPT_READY: 'worker_script_ready',
  LOADING_MODEL: 'loading_model',
  MODEL_READY: 'model_ready',
  GENERATING: 'generating',
  ERROR: 'error',
  IDLE: 'idle',
});

export const RuntimeMessageTypes = Object.freeze({
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

export const SiteMapperMessageTypes = Object.freeze({
  OPEN_TAB: 'openTab',
  MAPPED: 'mapped',
});

export const ModelLoaderMessageTypes = Object.freeze({
  INIT: 'init',
  GENERATE: 'generate',
  INTERRUPT: 'interrupt',
  RESET: 'reset',
});

export const InternalEventBusMessageTypes = Object.freeze({
  BACKGROUND_EVENT_BROADCAST: 'InternalEventBus:BackgroundEventBroadcast'
});

export const RawDirectMessageTypes = Object.freeze({
  WORKER_GENERIC_RESPONSE: 'response',
  WORKER_GENERIC_ERROR: 'error',
  WORKER_SCRAPE_STAGE_RESULT: 'STAGE_SCRAPE_RESULT',
  WORKER_DIRECT_SCRAPE_RESULT: 'DIRECT_SCRAPE_RESULT',
  WORKER_UI_LOADING_STATUS_UPDATE: 'uiLoadingStatusUpdate' // This one is used as a direct message type
});

export const Contexts = Object.freeze({
  BACKGROUND: 'Background',
  MAIN_UI: 'MainUI',
  POPUP: 'Popup',
  OTHERS: 'Others',
  UNKNOWN: 'Unknown',
}); 