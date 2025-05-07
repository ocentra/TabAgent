import * as EventNames from './eventNames.js';

// Simple UUID generator (replace with a more robust library if needed)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Base Classes ---
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

// --- Response Events (Define Before Request Events) ---

export class DbGetSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, sessionData, error = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = EventNames.DB_GET_SESSION_RESPONSE;
  }
}

export class DbAddMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = EventNames.DB_ADD_MESSAGE_RESPONSE;
  }
}

export class DbUpdateMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = EventNames.DB_UPDATE_MESSAGE_RESPONSE;
    }
}

export class DbUpdateStatusResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = EventNames.DB_UPDATE_STATUS_RESPONSE;
  }
}

export class DbDeleteMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = EventNames.DB_DELETE_MESSAGE_RESPONSE;
    }
}

export class DbToggleStarResponse extends DbResponseBase {
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = EventNames.DB_TOGGLE_STAR_RESPONSE;
    }
}

export class DbCreateSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = EventNames.DB_CREATE_SESSION_RESPONSE;
        console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
    }

    get newSessionId() {
        return this.data?.newSessionId;
    }
}

export class DbDeleteSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = EventNames.DB_DELETE_SESSION_RESPONSE;
    }
}

export class DbRenameSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = EventNames.DB_RENAME_SESSION_RESPONSE;
    }
}

export class DbGetAllSessionsResponse extends DbResponseBase {
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error);
        this.type = EventNames.DB_GET_ALL_SESSIONS_RESPONSE;
        this.payload = { sessions };
    }
}

export class DbGetStarredSessionsResponse extends DbResponseBase {
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); 
        this.type = EventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    }
}

// --- Request Events (Define After Response Events) ---

export class DbGetSessionRequest extends DbEventBase {
  static responseEventName = EventNames.DB_GET_SESSION_RESPONSE;
  constructor(sessionId) {
    super();
    this.type = EventNames.DB_GET_SESSION_REQUEST;
    this.payload = { sessionId };
  }
}

export class DbAddMessageRequest extends DbEventBase {
  static responseEventName = EventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(sessionId, messageObject) {
    super();
    this.type = EventNames.DB_ADD_MESSAGE_REQUEST;
    this.payload = { sessionId, messageObject };
  }
}

export class DbUpdateMessageRequest extends DbEventBase {
    static responseEventName = EventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId, updates) {
        super();
        this.type = EventNames.DB_UPDATE_MESSAGE_REQUEST;
        this.payload = { sessionId, messageId, updates };
    }
}

export class DbUpdateStatusRequest extends DbEventBase {
  static responseEventName = EventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(sessionId, status) {
    super();
    this.type = EventNames.DB_UPDATE_STATUS_REQUEST;
    this.payload = { sessionId, status };
  }
}

export class DbDeleteMessageRequest extends DbEventBase {
    static responseEventName = EventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId) {
        super();
        this.type = EventNames.DB_DELETE_MESSAGE_REQUEST;
        this.payload = { sessionId, messageId };
    }
}

export class DbToggleStarRequest extends DbEventBase {
    static responseEventName = EventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = EventNames.DB_TOGGLE_STAR_REQUEST;
        this.payload = { sessionId };
    }
}

export class DbCreateSessionRequest extends DbEventBase {
    static responseEventName = EventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(initialMessage) {
        super();
        this.type = EventNames.DB_CREATE_SESSION_REQUEST;
        this.payload = { initialMessage };
        console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
    }
}

export class DbInitializeRequest extends DbEventBase {
    // No response expected via requestDbAndWait, so no responseEventName needed
    constructor() {
        super();
        this.type = EventNames.DB_INITIALIZE_REQUEST;
        this.payload = {}; 
    }
}

export class DbDeleteSessionRequest extends DbEventBase {
    static responseEventName = EventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = EventNames.DB_DELETE_SESSION_REQUEST;
        this.payload = { sessionId };
    }
}

export class DbRenameSessionRequest extends DbEventBase {
    static responseEventName = EventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(sessionId, newName) {
        super();
        this.type = EventNames.DB_RENAME_SESSION_REQUEST;
        this.payload = { sessionId, newName };
    }
}

export class DbGetAllSessionsRequest extends DbEventBase {
    static responseEventName = EventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = EventNames.DB_GET_ALL_SESSIONS_REQUEST;
    }
}

export class DbGetStarredSessionsRequest extends DbEventBase {
    static responseEventName = EventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = EventNames.DB_GET_STARRED_SESSIONS_REQUEST;
    }
}

// --- Notification Events ---

export class DbMessagesUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = EventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
        this.payload = { messages }; 
    }
}

export class DbStatusUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, status) {
        super(sessionId);
        this.type = EventNames.DB_STATUS_UPDATED_NOTIFICATION;
        this.payload = { status };
    }
}

export class DbSessionUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, updatedSessionData) {
        super(sessionId);
        this.type = EventNames.DB_SESSION_UPDATED_NOTIFICATION;
        this.payload = { session: updatedSessionData }; 
    }
}

export class DbInitializationCompleteNotification {
    constructor({ success, error = null }) {
        this.type = EventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (error.message || String(error)) : null };
    }
}

// --- Log Response Events ---

export class DbGetLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error); // data = logs array
    this.type = EventNames.DB_GET_LOGS_RESPONSE;
  }
}

export class DbGetUniqueLogValuesResponse extends DbResponseBase {
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error); // data = values array
    this.type = EventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  }
}

export class DbClearLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = EventNames.DB_CLEAR_LOGS_RESPONSE;
  }
}

export class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    constructor(originalRequestId, success, ids, error = null) {
      // data = { currentLogSessionId: '...', previousLogSessionId: '...' | null }
      super(originalRequestId, success, ids, error);
      this.type = EventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    }
  }

// --- Log Request Events ---

// Request to add a single log entry
// No response needed, fire-and-forget style
export class DbAddLogRequest extends DbEventBase {
  // No responseEventName needed for fire-and-forget
  constructor(logEntryData) {
    // logEntryData = { level, component, message, chatSessionId (optional) }
    // db service will add id, timestamp, extensionSessionId
    super(); // Generate request ID just for tracking if needed
    this.type = EventNames.DB_ADD_LOG_REQUEST;
    this.payload = { logEntryData };
  }
}

// Request to get logs based on filters
export class DbGetLogsRequest extends DbEventBase {
  static responseEventName = EventNames.DB_GET_LOGS_RESPONSE;
  constructor(filters) {
    // filters = { extensionSessionId: 'id' | 'current' | 'last' | 'all',
    //             component: 'name' | 'all',
    //             level: 'level' | 'all' }
    super();
    this.type = EventNames.DB_GET_LOGS_REQUEST;
    this.payload = { filters };
  }
}

// Request to get unique values for a specific field in logs
export class DbGetUniqueLogValuesRequest extends DbEventBase {
  static responseEventName = EventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(fieldName) {
    // fieldName = 'extensionSessionId', 'component', 'level'
    super();
    this.type = EventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
    this.payload = { fieldName };
  }
}

// Request to clear logs (potentially based on filters in future, but maybe just 'all' or 'last_session' for now)
export class DbClearLogsRequest extends DbEventBase {
    static responseEventName = EventNames.DB_CLEAR_LOGS_RESPONSE;
    constructor(filter = 'all') { // 'all' or potentially 'last_session' or specific session ID later
        super();
        this.type = EventNames.DB_CLEAR_LOGS_REQUEST;
        this.payload = { filter };
    }
}

// Request to get the actual IDs for 'current' and 'last' sessions
export class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static responseEventName = EventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor() {
        super();
        this.type = EventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
    }
} 