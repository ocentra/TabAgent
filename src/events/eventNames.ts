export const UIEventNames = Object.freeze({
  QUERY_SUBMITTED: 'querySubmitted',
  BACKGROUND_RESPONSE_RECEIVED: 'background:responseReceived',
  BACKGROUND_ERROR_RECEIVED: 'background:errorReceived',
  BACKGROUND_SCRAPE_STAGE_RESULT: 'background:scrapeStageResult',
  REQUEST_MODEL_LOAD: 'ui:requestModelLoad',
  WORKER_READY: 'worker:ready',
  WORKER_ERROR: 'worker:error',
  NAVIGATION_PAGE_CHANGED: 'navigation:pageChanged',
  SCRAPE_PAGE: 'SCRAPE_PAGE',
  SCRAPE_ACTIVE_TAB: 'SCRAPE_ACTIVE_TAB',
  DYNAMIC_SCRIPT_MESSAGE_TYPE: 'offscreenIframeResult',
  MODEL_WORKER_LOADING_PROGRESS: 'modelWorkerLoadingProgress', // For when the worker itself is loading the model (pipeline init)
  MODEL_SELECTION_CHANGED: 'ui:modelSelectionChanged', // When model or ONNX variant dropdown changes
  REQUEST_MODEL_DOWNLOAD_ACTION: 'ui:requestModelDownloadAction', // When user clicks "Download Model" button
  REQUEST_MODEL_EXECUTION: 'ui:requestModelExecution', // When user clicks "Load Model" button (to load into worker)
  WORKER_STATE_CHANGED: 'worker:stateChanged', // Generic event for worker state updates (ready, error, etc.)
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
  UNINITIALIZED: 'uninitialized',
  CREATING_WORKER: 'creating_worker',
  LOADING_MODEL: 'loading_model',
  MODEL_READY: 'model_ready',
  GENERATING: 'generating',
  IDLE: 'idle',
  WORKER_ENV_READY: 'workerEnvReady',
  INIT: 'init',
  GENERATE: 'generate',
  RESET: 'reset',
  SET_BASE_URL: 'setBaseUrl',
  SET_ENV_CONFIG: 'setEnvConfig',
  MANIFEST_UPDATED: 'manifestUpdated',
  INFERENCE_SETTINGS_UPDATE: 'inferenceSettingsUpdate',
  MEMORY_STATS: 'memoryStats',
  REQUEST_MEMORY_STATS: 'requestMemoryStats',
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
  GENERATE: 'Generate',
  INTERRUPT: 'Interrupt',
  RESET: 'Reset',
  DOWNLOAD_MODEL_ASSETS: 'DownloadModelAssets',
  LIST_MODEL_FILES: 'ListModelFiles',
  LIST_MODEL_FILES_RESULT: 'ListModelFilesResult',
});

export const InternalEventBusMessageTypes = Object.freeze({
  BACKGROUND_EVENT_BROADCAST: 'BackgroundEventBroadcast'
});

export const RawDirectMessageTypes = Object.freeze({
  WORKER_GENERIC_RESPONSE: 'WorkerGenericResponse',
  WORKER_GENERIC_ERROR: 'WorkerGenericError',
  WORKER_SCRAPE_STAGE_RESULT: 'WorkerScrapeStageResult',
  WORKER_UI_LOADING_STATUS_UPDATE: 'UiLoadingStatusUpdate' // This one is used as a direct message type
});

export const Contexts = Object.freeze({
  BACKGROUND: 'Background',
  MAIN_UI: 'MainUI',
  POPUP: 'Popup',
  OTHERS: 'Others',
  UNKNOWN: 'Unknown',
});

export const MessageSenderTypes = Object.freeze({
  USER: 'user',
  SYSTEM: 'system',
  AI: 'ai',
  AGENT: 'agent',
  // Add more as needed
});

export const MessageContentTypes = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  CODE: 'code',
  AGENT_ACTION: 'agent_action',
  // Add more as needed
});

export const TableNames = Object.freeze({
  CHATS: 'chats',
  MESSAGES: 'messages',
  CHAT_SUMMARIES: 'chat_summaries',
  ATTACHMENTS: 'attachments',
  USERS: 'users',
  LOGS: 'logs',
  MODEL_ASSETS: 'model_assets',
  KNOWLEDGE_GRAPH_NODES: 'knowledge_graph_nodes',
  KNOWLEDGE_GRAPH_EDGES: 'knowledge_graph_edges',
});

