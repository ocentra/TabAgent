// dbEvents.js

import { ModelAssetManifest } from './idbModelAsset';

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
  DB_ADD_LOG_RESPONSE: 'DbAddLogResponse', // Response for add log, if ever needed (currently fire-and-forget)
  DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
  DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
  DB_RESET_DATABASE_REQUEST: 'DbResetDatabaseRequest',
  DB_RESET_DATABASE_RESPONSE: 'DbResetDatabaseResponse',

  // Model Asset DB Operations
  DB_ADD_MODEL_ASSET_REQUEST: 'DbAddModelAssetRequest',       // For adding chunks
  DB_ADD_MODEL_ASSET_RESPONSE: 'DbAddModelAssetResponse',
  DB_COUNT_MODEL_ASSET_CHUNKS_REQUEST: 'DbCountModelAssetChunksRequest',
  DB_COUNT_MODEL_ASSET_CHUNKS_RESPONSE: 'DbCountModelAssetChunksResponse',
  DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_REQUEST: 'DbLogAllChunkGroupIdsForModelRequest',
  DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_RESPONSE: 'DbLogAllChunkGroupIdsForModelResponse',
  DB_LIST_MODEL_FILES_REQUEST: 'DbListModelFilesRequest',     // Should ideally list manifests
  DB_LIST_MODEL_FILES_RESPONSE: 'DbListModelFilesResponse',
  DB_GET_MODEL_ASSET_CHUNKS_REQUEST: 'DbGetModelAssetChunksRequest', // Gets multiple chunk records (metadata or full)
  DB_GET_MODEL_ASSET_CHUNKS_RESPONSE: 'DbGetModelAssetChunksResponse',
  DB_GET_MODEL_ASSET_CHUNK_REQUEST: 'DbGetModelAssetChunkRequest', // Gets a single chunk record (with data)
  DB_GET_MODEL_ASSET_CHUNK_RESPONSE: 'DbGetModelAssetChunkResponse',

  // Model Asset Manifest Operations (NEW)
  DB_ADD_MANIFEST_REQUEST: 'DbAddManifestRequest',
  DB_ADD_MANIFEST_RESPONSE: 'DbAddManifestResponse',
  DB_GET_MANIFEST_REQUEST: 'DbGetManifestRequest',
  DB_GET_MANIFEST_RESPONSE: 'DbGetManifestResponse',

  // General DB Worker and Initialization
  DB_ENSURE_INITIALIZED_REQUEST: 'DbEnsureInitializedRequest',
  DB_ENSURE_INITIALIZED_RESPONSE: 'DbEnsureInitializedResponse',
  DB_INIT_WORKER_REQUEST: 'DbInitWorkerRequest', // This was unused in db.js handler map
  DB_INIT_WORKER_RESPONSE: 'DbInitWorkerResponse',
  DB_WORKER_ERROR: 'DbWorkerError', // Notification from worker for unhandled errors
  DB_WORKER_RESET: 'DbWorkerReset', // Potential command or notification for worker reset

  // New events
  DB_CREATE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST: 'DbCreateAllFileManifestsForRepoRequest',
  DB_CREATE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE: 'DbCreateAllFileManifestsForRepoResponse',
  DB_UPDATE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST: 'DbUpdateAllFileManifestsForRepoRequest',
  DB_UPDATE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE: 'DbUpdateAllFileManifestsForRepoResponse',
  DB_DELETE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST: 'DbDeleteAllFileManifestsForRepoRequest',
  DB_DELETE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE: 'DbDeleteAllFileManifestsForRepoResponse',
  DB_CREATE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST: 'DbCreateManifestByChunkGroupIdRequest',
  DB_CREATE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE: 'DbCreateManifestByChunkGroupIdResponse',
  DB_UPDATE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST: 'DbUpdateManifestByChunkGroupIdRequest',
  DB_UPDATE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE: 'DbUpdateManifestByChunkGroupIdResponse',
  DB_DELETE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST: 'DbDeleteManifestByChunkGroupIdRequest',
  DB_DELETE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE: 'DbDeleteManifestByChunkGroupIdResponse',
  DB_READ_MANIFEST_REQUEST: 'DbReadManifestRequest',
  DB_READ_MANIFEST_RESPONSE: 'DbReadManifestResponse',
  DB_UPDATE_MANIFEST_REQUEST: 'DbUpdateManifestRequest',
  DB_UPDATE_MANIFEST_RESPONSE: 'DbUpdateManifestResponse',
  DB_DELETE_MANIFEST_REQUEST: 'DbDeleteManifestRequest',
  DB_DELETE_MANIFEST_RESPONSE: 'DbDeleteManifestResponse',
  DB_UPDATE_CHUNK_REQUEST: 'DbUpdateChunkRequest',
  DB_UPDATE_CHUNK_RESPONSE: 'DbUpdateChunkResponse',
  DB_DELETE_CHUNK_REQUEST: 'DbDeleteChunkRequest',
  DB_DELETE_CHUNK_RESPONSE: 'DbDeleteChunkResponse',
  DB_GET_ALL_MODEL_FILE_MANIFESTS_REQUEST: 'DbGetAllModelFileManifestsRequest',
  DB_GET_ALL_MODEL_FILE_MANIFESTS_RESPONSE: 'DbGetAllModelFileManifestsResponse',
  DB_MANIFEST_UPDATED_NOTIFICATION: 'DbManifestUpdatedNotification',
});

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class DbEventBase {
  requestId: string;
  timestamp: number;
  type?: string;
  payload?: any;
  constructor(requestId: string | null = null) {
    this.requestId = requestId || generateUUID();
    this.timestamp = Date.now();
  }
}

export class DbResponseBase extends DbEventBase {
  success: boolean;
  data: any;
  error: string | null;
  type?: string;
  constructor(originalRequestId: string, success: boolean, data: any = null, error: any = null) {
    super(originalRequestId);
    this.success = success;
    this.data = data;
    this.error = error ? (typeof error === 'string' ? error : (error.message || String(error))) : null;
  }
}

class DbNotificationBase {
  sessionId: string;
  timestamp: number;
  type?: string;
  payload?: any;
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.timestamp = Date.now();
  }
}

// --- Standard Session/Message/Log Events (Existing - no changes needed below unless specified) ---

export class DbGetSessionResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(originalRequestId: string, success: boolean, sessionData: any, error: any = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = DbGetSessionResponse.type;
  }
}

export class DbAddMessageResponse extends DbResponseBase {
  static type = DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(originalRequestId: string, success: boolean, newMessageId: any, error: any = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = DbAddMessageResponse.type;
  }
}

export class DbUpdateMessageResponse extends DbResponseBase {
    static type = DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) { // data defaults to true for simple success
        super(originalRequestId, success, data, error);
        this.type = DbUpdateMessageResponse.type;
    }
}

export class DbUpdateStatusResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbUpdateStatusResponse.type;
  }
}

export class DbDeleteMessageResponse extends DbResponseBase {
    static type = DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) {
        super(originalRequestId, success, data, error);
        this.type = DbDeleteMessageResponse.type;
    }
}

export class DbToggleStarResponse extends DbResponseBase {
    static type = DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(originalRequestId: string, success: boolean, updatedSessionData: any, error: any = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbToggleStarResponse.type;
    }
}

export class DbCreateSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(originalRequestId: string, success: boolean, newSessionId: any, error: any = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = DbCreateSessionResponse.type;
    }
    get newSessionId() { return this.data?.newSessionId; }
}

export class DbDeleteSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) {
        super(originalRequestId, success, data, error);
        this.type = DbDeleteSessionResponse.type;
    }
}

export class DbRenameSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(originalRequestId: string, success: boolean, updatedSessionData: any, error: any = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbRenameSessionResponse.type;
    }
}

export class DbGetAllSessionsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor(requestId: string, success: boolean, sessions: any = null, error: any = null) {
        super(requestId, success, sessions, error); // sessions are directly in 'data'
        this.type = DbGetAllSessionsResponse.type;
    }
}

export class DbGetStarredSessionsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor(requestId: string, success: boolean, starredSessions: any = null, error: any = null) {
        super(requestId, success, starredSessions, error); // starredSessions are directly in 'data'
        this.type = DbGetStarredSessionsResponse.type;
    }
}

export class DbGetReadyStateResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor(originalRequestId: string, success: boolean, readyState: any, error: any = null) { // readyState = { ready: boolean }
        super(originalRequestId, success, readyState, error);
        this.type = DbGetReadyStateResponse.type;
    }
}

export class DbGetSessionRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_SESSION_REQUEST;
  constructor(sessionId: string) {
    super();
    this.type = DbGetSessionRequest.type;
    this.payload = { sessionId };
  }
}

export class DbAddMessageRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_MESSAGE_REQUEST;
  constructor(sessionId: string, messageObject: any) {
    super();
    this.type = DbAddMessageRequest.type;
    this.payload = { sessionId, messageObject };
  }
}

export class DbUpdateMessageRequest extends DbEventBase {
    static type = DBEventNames.DB_UPDATE_MESSAGE_REQUEST;
    constructor(sessionId: string, messageId: string, updates: any) {
        super();
        this.type = DbUpdateMessageRequest.type;
        this.payload = { sessionId, messageId, updates };
    }
}

export class DbUpdateStatusRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_STATUS_REQUEST;
  constructor(sessionId: string, status: any) {
    super();
    this.type = DbUpdateStatusRequest.type;
    this.payload = { sessionId, status };
  }
}

export class DbDeleteMessageRequest extends DbEventBase {
    static type = DBEventNames.DB_DELETE_MESSAGE_REQUEST;
    constructor(sessionId: string, messageId: string) {
        super();
        this.type = DbDeleteMessageRequest.type;
        this.payload = { sessionId, messageId };
    }
}

export class DbToggleStarRequest extends DbEventBase {
    static type = DBEventNames.DB_TOGGLE_STAR_REQUEST;
    constructor(sessionId: string) {
        super();
        this.type = DbToggleStarRequest.type;
        this.payload = { sessionId };
    }
}

export class DbCreateSessionRequest extends DbEventBase {
    static type = DBEventNames.DB_CREATE_SESSION_REQUEST;
    constructor(initialMessage: any) {
        super();
        this.type = DbCreateSessionRequest.type;
        this.payload = { initialMessage };
    }
}

export class DbInitializeRequest extends DbEventBase {
    static type = DBEventNames.DB_INITIALIZE_REQUEST;
    constructor() {
        super();
        this.type = DbInitializeRequest.type;
        this.payload = {};
    }
}

export class DbDeleteSessionRequest extends DbEventBase {
    static type = DBEventNames.DB_DELETE_SESSION_REQUEST;
    constructor(sessionId: string) {
        super();
        this.type = DbDeleteSessionRequest.type;
        this.payload = { sessionId };
    }
}

export class DbRenameSessionRequest extends DbEventBase {
    static type = DBEventNames.DB_RENAME_SESSION_REQUEST;
    constructor(sessionId: string, newName: string) {
        super();
        this.type = DbRenameSessionRequest.type;
        this.payload = { sessionId, newName };
    }
}

export class DbGetAllSessionsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_ALL_SESSIONS_REQUEST;
    constructor() {
        super();
        this.type = DbGetAllSessionsRequest.type;
    }
}

export class DbGetStarredSessionsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_STARRED_SESSIONS_REQUEST;
    constructor() {
        super();
        this.type = DbGetStarredSessionsRequest.type;
    }
}

export class DbGetReadyStateRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_READY_STATE_REQUEST;
    constructor() {
        super();
        this.type = DbGetReadyStateRequest.type;
    }
}

export class DbMessagesUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
    constructor(sessionId: string, messages: any) {
        super(sessionId);
        this.type = DbMessagesUpdatedNotification.type;
        this.payload = { messages };
    }
}

export class DbStatusUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_STATUS_UPDATED_NOTIFICATION;
    constructor(sessionId: string, status: any) {
        super(sessionId);
        this.type = DbStatusUpdatedNotification.type;
        this.payload = { status };
    }
}

export class DbSessionUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_SESSION_UPDATED_NOTIFICATION;
    constructor(sessionId: string, updatedSessionData: any, updateType: string = 'update') { // Added updateType
        super(sessionId);
        this.type = DbSessionUpdatedNotification.type;
        this.payload = { session: updatedSessionData, updateType };
    }
}

export class DbInitializationCompleteNotification {
    static type = DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
    type: string;
    timestamp: number;
    payload: any;
    constructor({ success, error = null, dbStatus = null, sessionIds = null }: { success: boolean, error?: any, dbStatus?: any, sessionIds?: any }) { // Added dbStatus and sessionIds
        this.type = DbInitializationCompleteNotification.type;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (typeof error === 'string' ? error : (error.message || String(error))) : null, dbStatus, sessionIds };
    }
}

export class DbGetLogsResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(originalRequestId: string, success: boolean, logs: any, error: any = null) {
    super(originalRequestId, success, logs, error);
    this.type = DbGetLogsResponse.type;
  }
}

export class DbGetUniqueLogValuesResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(originalRequestId: string, success: boolean, values: any, error: any = null) {
    super(originalRequestId, success, values, error);
    this.type = DbGetUniqueLogValuesResponse.type;
  }
}

export class DbClearLogsResponse extends DbResponseBase {
  static type = DBEventNames.DB_CLEAR_LOGS_RESPONSE;
  constructor(originalRequestId: string, success: boolean, data: any = { deletedCount: 0 }, error: any = null) { // Added deletedCount
    super(originalRequestId, success, data, error);
    this.type = DbClearLogsResponse.type;
  }
}

export class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor(originalRequestId: string, success: boolean, ids: any, error: any = null) {
      super(originalRequestId, success, ids, error);
      this.type = DbGetCurrentAndLastLogSessionIdsResponse.type;
    }
  }

export class DbAddLogRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_LOG_REQUEST;
  constructor(logEntryData: any) {
    super();
    this.type = DbAddLogRequest.type;
    this.payload = { logEntryData };
  }
}
// DbAddLogResponse is not strictly necessary if it's fire and forget,
// but can be added for consistency if db.js handler for it sends one.
export class DbAddLogResponse extends DbResponseBase {
  static type = DBEventNames.DB_ADD_LOG_RESPONSE;
  constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbAddLogResponse.type;
  }
}


export class DbGetLogsRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_LOGS_REQUEST;
  constructor(filters: any) {
    super();
    this.type = DbGetLogsRequest.type;
    this.payload = { filters };
  }
}

export class DbGetUniqueLogValuesRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
  constructor(fieldName: string) {
    super();
    this.type = DbGetUniqueLogValuesRequest.type;
    this.payload = { fieldName };
  }
}

export class DbClearLogsRequest extends DbEventBase {
    static type = DBEventNames.DB_CLEAR_LOGS_REQUEST;
    constructor(filter: string = 'all') {
        super();
        this.type = DbClearLogsRequest.type;
        this.payload = { filter };
    }
}

export class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
    constructor() {
        super();
        this.type = DbGetCurrentAndLastLogSessionIdsRequest.type;
    }
}

export class DbResetDatabaseRequest extends DbEventBase {
  static type = DBEventNames.DB_RESET_DATABASE_REQUEST;
  constructor() {
    super();
    this.type = DbResetDatabaseRequest.type;
  }
}

export class DbResetDatabaseResponse extends DbResponseBase {
  static type = DBEventNames.DB_RESET_DATABASE_RESPONSE;
  constructor(originalRequestId: string, success: boolean, data: any = true, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbResetDatabaseResponse.type;
  }
}

// --- Model Asset DB Operations ---

/**
 * @typedef {Object} ModelAssetChunkPayloadForRequest
 * @property {string} folder - The modelId or folder name.
 * @property {string} fileName - The name of the asset file.
 * @property {string} fileType - The type/extension of the file.
 * @property {ArrayBuffer} data - The binary data of the chunk.
 * @property {number} chunkIndex - The 0-based index of this chunk.
 * @property {number} totalChunks - The total number of chunks for this file.
 * @property {string} chunkGroupId - Identifier for the group of chunks (e.g., modelId/fileName).
 * // @property {number} [totalFileSize] - Optional: Total size of the parent file (contextual).
 */
export class DbAddModelAssetRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_MODEL_ASSET_REQUEST;
  /**
   * @param {ModelAssetChunkPayloadForRequest} payload
   */
  constructor(payload: any) {
    super();
    this.type = DbAddModelAssetRequest.type;
    this.payload = payload;
  }
}

export class DbAddModelAssetResponse extends DbResponseBase {
  static type = DBEventNames.DB_ADD_MODEL_ASSET_RESPONSE;
  /**
   * @param {string} originalRequestId
   * @param {boolean} success
   * @param {{ chunkId: string } | null} data - On success, object containing the ID of the stored chunk.
   * @param {string | null} error
   */
  constructor(originalRequestId: string, success: boolean, data: any, error: any = null) { // data = { chunkId: '...' }
    super(originalRequestId, success, data, error);
    this.type = DbAddModelAssetResponse.type;
  }
}

export class DbCountModelAssetChunksRequest extends DbEventBase {
  static type = DBEventNames.DB_COUNT_MODEL_ASSET_CHUNKS_REQUEST;
  /**
   * @param {{folder: string, fileName: string, expectedSize?: number, expectedChunks?: number}} payload
   */
  constructor(payload: any) {
    super();
    this.type = DbCountModelAssetChunksRequest.type;
    this.payload = payload;
  }
}

export class DbCountModelAssetChunksResponse extends DbResponseBase {
  static type = DBEventNames.DB_COUNT_MODEL_ASSET_CHUNKS_RESPONSE;
  /**
   * @param {string} originalRequestId
   * @param {boolean} success
   * @param {{ count: number, verified: boolean, error?: string } | null} data - Result of count/verification.
   * @param {string | null} error - Top-level error for the request.
   */
  constructor(originalRequestId: string, success: boolean, data: any, error: any = null) {
    super(originalRequestId, success, data, error); // data = { count, verified, (optional error for count op itself) }
    this.type = DbCountModelAssetChunksResponse.type;
  }
  get count() { return this.data?.count; }
  get verified() { return this.data?.verified; }
}

export class DbLogAllChunkGroupIdsForModelRequest extends DbEventBase {
  static type = DBEventNames.DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_REQUEST;
  constructor(payload: any) { // payload: { folder: string }
    super();
    this.type = DbLogAllChunkGroupIdsForModelRequest.type;
    this.payload = payload;
  }
}
export class DbLogAllChunkGroupIdsForModelResponse extends DbResponseBase {
  static type = DBEventNames.DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_RESPONSE;
  constructor(originalRequestId: string, success: boolean, groupIdsArray: string[], error: any = null) { // groupIdsArray is string[]
    super(originalRequestId, success, groupIdsArray, error);
    this.type = DbLogAllChunkGroupIdsForModelResponse.type;
  }
}

export class DbListModelFilesRequest extends DbEventBase {
  static type = DBEventNames.DB_LIST_MODEL_FILES_REQUEST;
  constructor(payload: any) { // payload: { modelId: string } or { folder: string }
    super();
    this.type = DbListModelFilesRequest.type;
    this.payload = payload;
  }
}
export class DbListModelFilesResponse extends DbResponseBase {
  static type = DBEventNames.DB_LIST_MODEL_FILES_RESPONSE;
  constructor(originalRequestId: string, success: boolean, fileNamesArray: string[], error: any = null) { // fileNamesArray is string[]
    super(originalRequestId, success, fileNamesArray, error);
    this.type = DbListModelFilesResponse.type;
  }
}

export class DbGetModelAssetChunksRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_MODEL_ASSET_CHUNKS_REQUEST;
  constructor(payload: any) { // payload: { chunkGroupId: string, metadataOnly?: boolean }
    super();
    this.type = DbGetModelAssetChunksRequest.type;
    this.payload = payload;
  }
}
export class DbGetModelAssetChunksResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_MODEL_ASSET_CHUNKS_RESPONSE;
  constructor(originalRequestId: string, success: boolean, chunksArray: any, error: any = null) { // chunksArray is ModelAssetChunk[]
    super(originalRequestId, success, chunksArray, error);
    this.type = DbGetModelAssetChunksResponse.type;
  }
}

export class DbGetModelAssetChunkRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_MODEL_ASSET_CHUNK_REQUEST;
  constructor(payload: any) { // payload: { folder: string, fileName: string, chunkIndex: number } or { chunkId: string }
    super();
    this.type = DbGetModelAssetChunkRequest.type;
    this.payload = payload;
  }
}
export class DbGetModelAssetChunkResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_MODEL_ASSET_CHUNK_RESPONSE;
  constructor(originalRequestId: string, success: boolean, chunkData: any, error: any = null) { // chunkData is ModelAssetChunk
    super(originalRequestId, success, chunkData, error);
    this.type = DbGetModelAssetChunkResponse.type;
  }
  get chunk() { return this.data; }
}


// --- Model Asset Manifest Operations (NEW - Definitions) ---

/**
 * @typedef {import('./idbModelAsset').ModelAssetManifest} ModelAssetManifest
 */

/**
 * @typedef {Object} ModelAssetManifestPayloadForRequest
 * @property {string} chunkGroupId - Identifier for the group of chunks (e.g., modelId/fileName).
 * @property {string} fileName - The original name of the model asset file.
 * @property {string} folder - The "folder" or modelId this asset belongs to.
 * @property {string} fileType - The type/extension of the file (e.g., 'onnx', 'json').
 * @property {number} totalFileSize - The total size of the complete file in bytes.
 * @property {number} totalChunks - The total number of chunks the file was split into.
 * @property {number} chunkSizeUsed - The CHUNK_SIZE (in bytes) that was used.
 * @property {'complete' | 'incomplete' | string} status - The status of this asset.
 * @property {number} downloadTimestamp - Timestamp of when the download/processing was completed.
 * @property {string} [id] - Optional: if pre-defining the manifest ID.
 * @property {string} [checksum] - Optional: checksum of the full file.
 * @property {string | number} [version] - Optional: version of the file.
 */
export class DbAddManifestRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_MANIFEST_REQUEST;
  payload: ModelAssetManifest;
  /**
   * @param {ModelAssetManifest} payload
   */
  constructor(payload: ModelAssetManifest) {
    super();
    this.type = DbAddManifestRequest.type;
    this.payload = payload;
  }
}

export class DbAddManifestResponse extends DbResponseBase {
  static type = DBEventNames.DB_ADD_MANIFEST_RESPONSE;
  data: { manifestId: string } | null;
  /**
   * @param {string} originalRequestId
   * @param {boolean} success
   * @param {{ manifestId: string } | null} data - On success, object containing the ID of the stored/updated manifest.
   * @param {string | null} error
   */
  constructor(originalRequestId: string, success: boolean, data: { manifestId: string } | null, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbAddManifestResponse.type;
    this.data = data;
  }
  get manifestId() { return this.data?.manifestId; }
}

/**
 * @typedef {Object} GetManifestPayload
 * @property {string} folder - The folder (modelId) of the asset.
 * @property {string} fileName - The fileName of the asset.
 */
export class DbGetManifestRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_MANIFEST_REQUEST;
  payload: { folder: string; fileName: string };
  /**
   * @param {{ folder: string, fileName: string }} payload
   */
  constructor(payload: { folder: string; fileName: string }) {
    super();
    this.type = DbGetManifestRequest.type;
    this.payload = payload;
  }
}

export class DbGetManifestResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_MANIFEST_RESPONSE;
  data: ModelAssetManifest | null;
  /**
   * The manifest object (from idbModelAsset.ts ModelAssetManifest interface) is expected
   * to be the direct value of the `data` property in this response.
   * @param {string} originalRequestId
   * @param {boolean} success
   * @param {ModelAssetManifest | null} data - The manifest object or null.
   * @param {string | null} error
   */
  constructor(originalRequestId: string, success: boolean, data: ModelAssetManifest | null, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbGetManifestResponse.type;
    this.data = data;
  }
  /** @returns {ModelAssetManifest | null} */
  get manifest() { return this.data; }
}


// --- General DB Worker and Initialization ---
export class DbEnsureInitializedRequest extends DbEventBase {
  static type = DBEventNames.DB_ENSURE_INITIALIZED_REQUEST;
  constructor() {
    super();
    this.type = DbEnsureInitializedRequest.type;
  }
}

export class DbEnsureInitializedResponse extends DbResponseBase {
  static type = DBEventNames.DB_ENSURE_INITIALIZED_RESPONSE;
  // data can be { success: boolean, dbStatus: object, sessionIds: object } or null on error
  constructor(originalRequestId: string, success: boolean, data: any = null, error: any = null) {
    super(originalRequestId, success, data, error);
    this.type = DbEnsureInitializedResponse.type;
  }
}

// DbInitWorkerRequest was previously noted as unused in db.js handler map.
// If it becomes used, define its payload and response. For now, just the request.
export class DbInitWorkerRequest extends DbEventBase {
  static type = DBEventNames.DB_INIT_WORKER_REQUEST;
  constructor(payload: any = {}) { // e.g., payload could contain schema if needed by worker directly
      super();
      this.type = DbInitWorkerRequest.type;
      this.payload = payload;
  }
}
// DbInitWorkerResponse already exists in your DBEventNames, assuming a simple success/error response.
export class DbInitWorkerResponse extends DbResponseBase {
    static type = DBEventNames.DB_INIT_WORKER_RESPONSE;
    constructor(originalRequestId: string, success: boolean, data: any = null, error: any = null) {
        super(originalRequestId, success, data, error);
        this.type = DbInitWorkerResponse.type;
    }
}

// --- Notification Publishing ---

export class DbWorkerCreatedNotification {
  static type = 'DbWorkerCreatedNotification';
  type: string;
  timestamp: number;
  payload: any;
  constructor(payload: any) {
    this.type = DbWorkerCreatedNotification.type;
    this.timestamp = Date.now();
    this.payload = payload;
  }
}

// Add new event classes for ModelAsset CRUD/static symmetry
export class DbCreateAllFileManifestsForRepoRequest extends DbEventBase {
  static type = DBEventNames.DB_CREATE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST;
  payload: { manifests: ModelAssetManifest[] };
  constructor(manifests: ModelAssetManifest[]) {
    super();
    this.type = DbCreateAllFileManifestsForRepoRequest.type;
    this.payload = { manifests };
  }
}
export class DbCreateAllFileManifestsForRepoResponse extends DbResponseBase {
  static type = DBEventNames.DB_CREATE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE;
  data: string[];
  constructor(requestId: string, success: boolean, ids: string[], error: any = null) {
    super(requestId, success, ids, error);
    this.type = DbCreateAllFileManifestsForRepoResponse.type;
    this.data = ids;
  }
}
export class DbUpdateAllFileManifestsForRepoRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST;
  payload: { manifests: ModelAssetManifest[] };
  constructor(manifests: ModelAssetManifest[]) {
    super();
    this.type = DbUpdateAllFileManifestsForRepoRequest.type;
    this.payload = { manifests };
  }
}
export class DbUpdateAllFileManifestsForRepoResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE;
  data: boolean;
  constructor(requestId: string, success: boolean, data: boolean = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbUpdateAllFileManifestsForRepoResponse.type;
    this.data = data;
  }
}
export class DbDeleteAllFileManifestsForRepoRequest extends DbEventBase {
  static type = DBEventNames.DB_DELETE_ALL_FILE_MANIFESTS_FOR_REPO_REQUEST;
  constructor(folder: string) {
    super();
    this.type = DbDeleteAllFileManifestsForRepoRequest.type;
    this.payload = { folder };
  }
}
export class DbDeleteAllFileManifestsForRepoResponse extends DbResponseBase {
  static type = DBEventNames.DB_DELETE_ALL_FILE_MANIFESTS_FOR_REPO_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbDeleteAllFileManifestsForRepoResponse.type;
  }
}
export class DbCreateManifestByChunkGroupIdRequest extends DbEventBase {
  static type = DBEventNames.DB_CREATE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST;
  payload: { manifest: ModelAssetManifest };
  constructor(manifest: ModelAssetManifest) {
    super();
    this.type = DbCreateManifestByChunkGroupIdRequest.type;
    this.payload = { manifest };
  }
}
export class DbCreateManifestByChunkGroupIdResponse extends DbResponseBase {
  static type = DBEventNames.DB_CREATE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE;
  constructor(requestId: string, success: boolean, id: string, error: any = null) {
    super(requestId, success, { id }, error);
    this.type = DbCreateManifestByChunkGroupIdResponse.type;
  }
}
export class DbUpdateManifestByChunkGroupIdRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST;
  constructor(chunkGroupId: string, updates: any) {
    super();
    this.type = DbUpdateManifestByChunkGroupIdRequest.type;
    this.payload = { chunkGroupId, updates };
  }
}
export class DbUpdateManifestByChunkGroupIdResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbUpdateManifestByChunkGroupIdResponse.type;
  }
}
export class DbDeleteManifestByChunkGroupIdRequest extends DbEventBase {
  static type = DBEventNames.DB_DELETE_MANIFEST_BY_CHUNK_GROUP_ID_REQUEST;
  constructor(chunkGroupId: string) {
    super();
    this.type = DbDeleteManifestByChunkGroupIdRequest.type;
    this.payload = { chunkGroupId };
  }
}
export class DbDeleteManifestByChunkGroupIdResponse extends DbResponseBase {
  static type = DBEventNames.DB_DELETE_MANIFEST_BY_CHUNK_GROUP_ID_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbDeleteManifestByChunkGroupIdResponse.type;
  }
}
export class DbReadManifestRequest extends DbEventBase {
  static type = DBEventNames.DB_READ_MANIFEST_REQUEST;
  constructor(manifestId: string) {
    super();
    this.type = DbReadManifestRequest.type;
    this.payload = { manifestId };
  }
}
export class DbReadManifestResponse extends DbResponseBase {
  static type = DBEventNames.DB_READ_MANIFEST_RESPONSE;
  data: ModelAssetManifest | null;
  constructor(requestId: string, success: boolean, manifest: ModelAssetManifest | null, error: any = null) {
    super(requestId, success, manifest, error);
    this.type = DbReadManifestResponse.type;
    this.data = manifest;
  }
}
export class DbUpdateManifestRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_MANIFEST_REQUEST;
  constructor(manifestId: string, updates: any) {
    super();
    this.type = DbUpdateManifestRequest.type;
    this.payload = { manifestId, updates };
  }
}
export class DbUpdateManifestResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_MANIFEST_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbUpdateManifestResponse.type;
  }
}
export class DbDeleteManifestRequest extends DbEventBase {
  static type = DBEventNames.DB_DELETE_MANIFEST_REQUEST;
  constructor(manifestId: string) {
    super();
    this.type = DbDeleteManifestRequest.type;
    this.payload = { manifestId };
  }
}
export class DbDeleteManifestResponse extends DbResponseBase {
  static type = DBEventNames.DB_DELETE_MANIFEST_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbDeleteManifestResponse.type;
  }
}
export class DbUpdateChunkRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_CHUNK_REQUEST;
  constructor(chunkId: string, updates: any) {
    super();
    this.type = DbUpdateChunkRequest.type;
    this.payload = { chunkId, updates };
  }
}
export class DbUpdateChunkResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_CHUNK_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbUpdateChunkResponse.type;
  }
}
export class DbDeleteChunkRequest extends DbEventBase {
  static type = DBEventNames.DB_DELETE_CHUNK_REQUEST;
  constructor(chunkId: string) {
    super();
    this.type = DbDeleteChunkRequest.type;
    this.payload = { chunkId };
  }
}
export class DbDeleteChunkResponse extends DbResponseBase {
  static type = DBEventNames.DB_DELETE_CHUNK_RESPONSE;
  constructor(requestId: string, success: boolean, data: any = true, error: any = null) {
    super(requestId, success, data, error);
    this.type = DbDeleteChunkResponse.type;
  }
}

export class DbGetAllModelFileManifestsRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_ALL_MODEL_FILE_MANIFESTS_REQUEST;
  constructor() {
    super();
    this.type = DbGetAllModelFileManifestsRequest.type;
  }
}

export class DbGetAllModelFileManifestsResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_ALL_MODEL_FILE_MANIFESTS_RESPONSE;
  constructor(originalRequestId: string, success: boolean, manifests: any[], error: any = null) {
    super(originalRequestId, success, manifests, error);
    this.type = DbGetAllModelFileManifestsResponse.type;
  }
}

export class DbManifestUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_MANIFEST_UPDATED_NOTIFICATION;
    constructor(manifest: ModelAssetManifest) {
        super(manifest.folder);
        this.type = DbManifestUpdatedNotification.type;
        this.payload = { manifest };
    }
}