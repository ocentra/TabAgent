export const DBEventNames = Object.freeze({
  GET_SESSION_REQUEST: 'DbGetSessionRequest',
  GET_SESSION_RESPONSE: 'DbGetSessionResponse',
  ADD_MESSAGE_REQUEST: 'DbAddMessageRequest',
  ADD_MESSAGE_RESPONSE: 'DbAddMessageResponse',
  UPDATE_MESSAGE_REQUEST: 'DbUpdateMessageRequest',
  UPDATE_MESSAGE_RESPONSE: 'DbUpdateMessageResponse',
  UPDATE_STATUS_REQUEST: 'DbUpdateStatusRequest',
  UPDATE_STATUS_RESPONSE: 'DbUpdateStatusResponse',
  DELETE_MESSAGE_REQUEST: 'DbDeleteMessageRequest',
  DELETE_MESSAGE_RESPONSE: 'DbDeleteMessageResponse',
  TOGGLE_STAR_REQUEST: 'DbToggleStarRequest',
  TOGGLE_STAR_RESPONSE: 'DbToggleStarResponse',
  DB_CREATE_SESSION_REQUEST: 'DbCreateSessionRequest',
  DB_CREATE_SESSION_RESPONSE: 'DbCreateSessionResponse',
  DELETE_SESSION_REQUEST: 'DbDeleteSessionRequest',
  DELETE_SESSION_RESPONSE: 'DbDeleteSessionResponse',
  RENAME_SESSION_REQUEST: 'DbRenameSessionRequest',
  RENAME_SESSION_RESPONSE: 'DbRenameSessionResponse',
  DB_GET_ALL_SESSIONS_REQUEST: 'DbGetAllSessionsRequest',
  DB_GET_ALL_SESSIONS_RESPONSE: 'DbGetAllSessionsResponse',
  DB_GET_STARRED_SESSIONS_REQUEST: 'DbGetStarredSessionsRequest',
  DB_GET_STARRED_SESSIONS_RESPONSE: 'DbGetStarredSessionsResponse',
  MESSAGES_UPDATED_NOTIFICATION: 'DbMessagesUpdatedNotification',
  STATUS_UPDATED_NOTIFICATION: 'DbStatusUpdatedNotification',
  SESSION_UPDATED_NOTIFICATION: 'DbSessionUpdatedNotification',
  INITIALIZE_REQUEST: 'DbInitializeRequest',
  INITIALIZATION_COMPLETE_NOTIFICATION: 'DbInitializationCompleteNotification',
  GET_LOGS_REQUEST: 'DbGetLogsRequest',
  GET_LOGS_RESPONSE: 'DbGetLogsResponse',
  GET_UNIQUE_LOG_VALUES_REQUEST: 'DbGetUniqueLogValuesRequest',
  GET_UNIQUE_LOG_VALUES_RESPONSE: 'DbGetUniqueLogValuesResponse',
  CLEAR_LOGS_REQUEST: 'DbClearLogsRequest',
  CLEAR_LOGS_RESPONSE: 'DbClearLogsResponse',
  GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST: 'DbGetCurrentAndLastLogSessionIdsRequest',
  GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE: 'DbGetCurrentAndLastLogSessionIdsResponse',
  ADD_LOG_REQUEST: 'DbAddLogRequest',
  ADD_LOG_RESPONSE: 'DbAddLogResponse',
  DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
  DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
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

export const DriveMessageTypes = Object.freeze({
  DRIVE_FILE_LIST_DATA: 'driveFileListData',
});

export const ModelLoaderMessageTypes = Object.freeze({
  INIT: 'init',
  GENERATE: 'generate',
  INTERRUPT: 'interrupt',
  RESET: 'reset',
}); 