import { DBEventNames } from './eventNames.js';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export class DbEventBase {
  constructor(requestId = null) {
    this.requestId = requestId || generateUUID();
    this.timestamp = Date.now();
  }
}

export class DbResponseBase extends DbEventBase {
  constructor(originalRequestId, success, data = null, error = null) {
    super(originalRequestId);
    this.success = success;
    this.data = data;
    this.error = error ? (error.message || String(error)) : null;
  }
}

class DbNotificationBase {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.timestamp = Date.now();
    }
}



export class DbGetSessionResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(originalRequestId, success, sessionData, error = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = DbGetSessionResponse.type;
  }
}

export class DbAddMessageResponse extends DbResponseBase {
  static type = DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = DbAddMessageResponse.type;
  }
}

export class DbUpdateMessageResponse extends DbResponseBase {
    static type = DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbUpdateMessageResponse.type;
    }
}

export class DbUpdateStatusResponse extends DbResponseBase {
  static type = DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbUpdateStatusResponse.type;
  }
}

export class DbDeleteMessageResponse extends DbResponseBase {
    static type = DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteMessageResponse.type;
    }
}

export class DbToggleStarResponse extends DbResponseBase {
    static type = DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbToggleStarResponse.type;
    }
}

export class DbCreateSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = DbCreateSessionResponse.type;
        console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
    }

    get newSessionId() {
        return this.data?.newSessionId;
    }
}

export class DbDeleteSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteSessionResponse.type;
    }
}

export class DbRenameSessionResponse extends DbResponseBase {
    static type = DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbRenameSessionResponse.type;
    }
}

export class DbGetAllSessionsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error);
        this.type = DbGetAllSessionsResponse.type;
        this.payload = { sessions };
    }
}

export class DbGetStarredSessionsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); 
        this.type = DbGetStarredSessionsResponse.type;
    }
}

export class DbGetReadyStateResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor(originalRequestId, success, ready, error = null) {
        super(originalRequestId, success, { ready }, error);
        this.type = DbGetReadyStateResponse.type;
        this.payload = { ready };
    }
}

// --- Request Events (Define After Response Events) ---

export class DbGetSessionRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_SESSION_REQUEST;
  static responseEventName = DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(sessionId) {
    super();
    this.type = DbGetSessionRequest.type;
    this.payload = { sessionId };
  }
}

export class DbAddMessageRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_MESSAGE_REQUEST;
  static responseEventName = DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(sessionId, messageObject) {
    super();
    this.type = DbAddMessageRequest.type;
    this.payload = { sessionId, messageObject };
  }
}

export class DbUpdateMessageRequest extends DbEventBase {
    static type = DBEventNames.DB_UPDATE_MESSAGE_REQUEST;
    static responseEventName = DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId, updates) {
        super();
        this.type = DbUpdateMessageRequest.type;
        this.payload = { sessionId, messageId, updates };
    }
}

export class DbUpdateStatusRequest extends DbEventBase {
  static type = DBEventNames.DB_UPDATE_STATUS_REQUEST;
  static responseEventName = DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(sessionId, status) {
    super();
    this.type = DbUpdateStatusRequest.type;
    this.payload = { sessionId, status };
  }
}

export class DbDeleteMessageRequest extends DbEventBase {
    static type = DBEventNames.DB_DELETE_MESSAGE_REQUEST;
    static responseEventName = DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId) {
        super();
        this.type = DbDeleteMessageRequest.type;
        this.payload = { sessionId, messageId };
    }
}

export class DbToggleStarRequest extends DbEventBase {
    static type = DBEventNames.DB_TOGGLE_STAR_REQUEST;
    static responseEventName = DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = DbToggleStarRequest.type;
        this.payload = { sessionId };
    }
}

export class DbCreateSessionRequest extends DbEventBase {
    static type = DBEventNames.DB_CREATE_SESSION_REQUEST;
    static responseEventName = DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(initialMessage) {
        super();
        this.type = DbCreateSessionRequest.type;
        this.payload = { initialMessage };
        console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
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
    static responseEventName = DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = DbDeleteSessionRequest.type;
        this.payload = { sessionId };
    }
}

export class DbRenameSessionRequest extends DbEventBase {
    static type = DBEventNames.DB_RENAME_SESSION_REQUEST;
    static responseEventName = DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(sessionId, newName) {
        super();
        this.type = DbRenameSessionRequest.type;
        this.payload = { sessionId, newName };
    }
}

export class DbGetAllSessionsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_ALL_SESSIONS_REQUEST;
    static responseEventName = DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = DbGetAllSessionsRequest.type;
        console.log('[DEBUG][Create] DbGetAllSessionsRequest:', this, this.type);
    }
}

export class DbGetStarredSessionsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_STARRED_SESSIONS_REQUEST;
    static responseEventName = DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = DbGetStarredSessionsRequest.type;
    }
}

export class DbGetReadyStateRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_READY_STATE_REQUEST;
    static responseEventName = DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor() {
        super();
        this.type = DbGetReadyStateRequest.type;
    }
}

// --- Notification Events ---

export class DbMessagesUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = DbMessagesUpdatedNotification.type;
        this.payload = { messages }; 
    }
}

export class DbStatusUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_STATUS_UPDATED_NOTIFICATION;
    constructor(sessionId, status) {
        super(sessionId);
        this.type = DbStatusUpdatedNotification.type;
        this.payload = { status };
    }
}

export class DbSessionUpdatedNotification extends DbNotificationBase {
    static type = DBEventNames.DB_SESSION_UPDATED_NOTIFICATION;
    constructor(sessionId, updatedSessionData) {
        super(sessionId);
        this.type = DbSessionUpdatedNotification.type;
        this.payload = { session: updatedSessionData }; 
    }
}

export class DbInitializationCompleteNotification {
    static type = DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
    constructor({ success, error = null }) {
        this.type = DbInitializationCompleteNotification.type;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (error.message || String(error)) : null };
    }
}

// --- Log Response Events ---

export class DbGetLogsResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error); // data = logs array
    this.type = DbGetLogsResponse.type;
  }
}

export class DbGetUniqueLogValuesResponse extends DbResponseBase {
  static type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error); // data = values array
    this.type = DbGetUniqueLogValuesResponse.type;
  }
}

export class DbClearLogsResponse extends DbResponseBase {
  static type = DBEventNames.DB_CLEAR_LOGS_RESPONSE;
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbClearLogsResponse.type;
  }
}

export class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    static type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor(originalRequestId, success, ids, error = null) {
      // data = { currentLogSessionId: '...', previousLogSessionId: '...' | null }
      super(originalRequestId, success, ids, error);
      this.type = DbGetCurrentAndLastLogSessionIdsResponse.type;
    }
  }

export class DbAddLogRequest extends DbEventBase {
  static type = DBEventNames.DB_ADD_LOG_REQUEST;
  // No responseEventName needed for fire-and-forget
  constructor(logEntryData) {
    super(); 
    this.type = DbAddLogRequest.type;
    this.payload = { logEntryData };
  }
}

export class DbGetLogsRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_LOGS_REQUEST;
  static responseEventName = DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(filters) {
    // filters = { extensionSessionId: 'id' | 'current' | 'last' | 'all',
    //             component: 'name' | 'all',
    //             level: 'level' | 'all' }
    super();
    this.type = DbGetLogsRequest.type;
    this.payload = { filters };
  }
}

export class DbGetUniqueLogValuesRequest extends DbEventBase {
  static type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
  static responseEventName = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(fieldName) {
    // fieldName = 'extensionSessionId', 'component', 'level'
    super();
    this.type = DbGetUniqueLogValuesRequest.type;
    this.payload = { fieldName };
  }
}

export class DbClearLogsRequest extends DbEventBase {
    static type = DBEventNames.DB_CLEAR_LOGS_REQUEST;
    static responseEventName = DBEventNames.DB_CLEAR_LOGS_RESPONSE;
    constructor(filter = 'all') { // 'all' or potentially 'last_session' or specific session ID later
        super();
        this.type = DbClearLogsRequest.type;
        this.payload = { filter };
    }
}

export class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
    static responseEventName = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
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
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbResetDatabaseResponse.type;
  }
} 