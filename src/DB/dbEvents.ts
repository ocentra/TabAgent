// dbEvents.js


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



  // General DB Worker and Initialization
  DB_ENSURE_INITIALIZED_REQUEST: 'DbEnsureInitializedRequest',
  DB_ENSURE_INITIALIZED_RESPONSE: 'DbEnsureInitializedResponse',
  DB_INIT_WORKER_REQUEST: 'DbInitWorkerRequest', // This was unused in db.js handler map
  DB_INIT_WORKER_RESPONSE: 'DbInitWorkerResponse',
  DB_WORKER_ERROR: 'DbWorkerError', // Notification from worker for unhandled errors
  DB_WORKER_RESET: 'DbWorkerReset', // Potential command or notification for worker reset


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



