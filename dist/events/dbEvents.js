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
    this.type = DbGetSessionResponse.name;
  }
}

export class DbAddMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = DbAddMessageResponse.name;
  }
}

export class DbUpdateMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbUpdateMessageResponse.name;
    }
}

export class DbUpdateStatusResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbUpdateStatusResponse.name;
  }
}

export class DbDeleteMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteMessageResponse.name;
    }
}

export class DbToggleStarResponse extends DbResponseBase {
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbToggleStarResponse.name;
    }
}

export class DbCreateSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = DbCreateSessionResponse.name;
        console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
    }

    get newSessionId() {
        return this.data?.newSessionId;
    }
}

export class DbDeleteSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteSessionResponse.name;
    }
}

export class DbRenameSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbRenameSessionResponse.name;
    }
}

export class DbGetAllSessionsResponse extends DbResponseBase {
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error);
        this.type = DbGetAllSessionsResponse.name;
        this.payload = { sessions };
    }
}

export class DbGetStarredSessionsResponse extends DbResponseBase {
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); 
        this.type = DbGetStarredSessionsResponse.name;
    }
}

// --- Request Events (Define After Response Events) ---

export class DbGetSessionRequest extends DbEventBase {
  static responseEventName = DbGetSessionResponse.name;
  constructor(sessionId) {
    super();
    this.type = DbGetSessionRequest.name;
    this.payload = { sessionId };
  }
}

export class DbAddMessageRequest extends DbEventBase {
  static responseEventName = DbAddMessageResponse.name;
  constructor(sessionId, messageObject) {
    super();
    this.type = DbAddMessageRequest.name;
    this.payload = { sessionId, messageObject };
  }
}

export class DbUpdateMessageRequest extends DbEventBase {
    static responseEventName = DbUpdateMessageResponse.name;
    constructor(sessionId, messageId, updates) {
        super();
        this.type = DbUpdateMessageRequest.name;
        this.payload = { sessionId, messageId, updates };
    }
}

export class DbUpdateStatusRequest extends DbEventBase {
  static responseEventName = DbUpdateStatusResponse.name;
  constructor(sessionId, status) {
    super();
    this.type = DbUpdateStatusRequest.name;
    this.payload = { sessionId, status };
  }
}

export class DbDeleteMessageRequest extends DbEventBase {
    static responseEventName = DbDeleteMessageResponse.name;
    constructor(sessionId, messageId) {
        super();
        this.type = DbDeleteMessageRequest.name;
        this.payload = { sessionId, messageId };
    }
}

export class DbToggleStarRequest extends DbEventBase {
    static responseEventName = DbToggleStarResponse.name;
    constructor(sessionId) {
        super();
        this.type = DbToggleStarRequest.name;
        this.payload = { sessionId };
    }
}

export class DbCreateSessionRequest extends DbEventBase {
    static responseEventName = DbCreateSessionResponse.name;
    constructor(initialMessage) {
        super();
        this.type = DbCreateSessionRequest.name;
        this.payload = { initialMessage };
        console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
    }
}

export class DbInitializeRequest extends DbEventBase {
    // No response expected via requestDbAndWait, so no responseEventName needed
    constructor() {
        super();
        this.type = DbInitializeRequest.name;
        this.payload = {}; 
    }
}

export class DbDeleteSessionRequest extends DbEventBase {
    static responseEventName = DbDeleteSessionResponse.name;
    constructor(sessionId) {
        super();
        this.type = DbDeleteSessionRequest.name;
        this.payload = { sessionId };
    }
}

export class DbRenameSessionRequest extends DbEventBase {
    static responseEventName = DbRenameSessionResponse.name;
    constructor(sessionId, newName) {
        super();
        this.type = DbRenameSessionRequest.name;
        this.payload = { sessionId, newName };
    }
}

export class DbGetAllSessionsRequest extends DbEventBase {
    static responseEventName = DbGetAllSessionsResponse.name;
    constructor() {
        super();
        this.type = DbGetAllSessionsRequest.name;
    }
}

export class DbGetStarredSessionsRequest extends DbEventBase {
    static responseEventName = DbGetStarredSessionsResponse.name;
    constructor() {
        super();
        this.type = DbGetStarredSessionsRequest.name;
    }
}

// --- Notification Events ---

export class DbMessagesUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = DbMessagesUpdatedNotification.name;
        this.payload = { messages }; 
    }
}

export class DbStatusUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, status) {
        super(sessionId);
        this.type = DbStatusUpdatedNotification.name;
        this.payload = { status };
    }
}

export class DbSessionUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, updatedSessionData) {
        super(sessionId);
        this.type = DbSessionUpdatedNotification.name;
        this.payload = { session: updatedSessionData }; 
    }
}

export class DbInitializationCompleteNotification {
    constructor({ success, error = null }) {
        this.type = DbInitializationCompleteNotification.name;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (error.message || String(error)) : null };
    }
}

// --- Log Response Events ---

export class DbGetLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error); // data = logs array
    this.type = DbGetLogsResponse.name;
  }
}

export class DbGetUniqueLogValuesResponse extends DbResponseBase {
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error); // data = values array
    this.type = DbGetUniqueLogValuesResponse.name;
  }
}

export class DbClearLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbClearLogsResponse.name;
  }
}

export class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    constructor(originalRequestId, success, ids, error = null) {
      // data = { currentLogSessionId: '...', previousLogSessionId: '...' | null }
      super(originalRequestId, success, ids, error);
      this.type = DbGetCurrentAndLastLogSessionIdsResponse.name;
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
    this.type = DbAddLogRequest.name;
    this.payload = { logEntryData };
  }
}

// Request to get logs based on filters
export class DbGetLogsRequest extends DbEventBase {
  static responseEventName = DbGetLogsResponse.name;
  constructor(filters) {
    // filters = { extensionSessionId: 'id' | 'current' | 'last' | 'all',
    //             component: 'name' | 'all',
    //             level: 'level' | 'all' }
    super();
    this.type = DbGetLogsRequest.name;
    this.payload = { filters };
  }
}

// Request to get unique values for a specific field in logs
export class DbGetUniqueLogValuesRequest extends DbEventBase {
  static responseEventName = DbGetUniqueLogValuesResponse.name;
  constructor(fieldName) {
    // fieldName = 'extensionSessionId', 'component', 'level'
    super();
    this.type = DbGetUniqueLogValuesRequest.name;
    this.payload = { fieldName };
  }
}

// Request to clear logs (potentially based on filters in future, but maybe just 'all' or 'last_session' for now)
export class DbClearLogsRequest extends DbEventBase {
    static responseEventName = DbClearLogsResponse.name;
    constructor(filter = 'all') { // 'all' or potentially 'last_session' or specific session ID later
        super();
        this.type = DbClearLogsRequest.name;
        this.payload = { filter };
    }
}

// Request to get the actual IDs for 'current' and 'last' sessions
export class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static responseEventName = DbGetCurrentAndLastLogSessionIdsResponse.name;
    constructor() {
        super();
        this.type = DbGetCurrentAndLastLogSessionIdsRequest.name;
    }
} 