// Simple UUID generator (replace with a more robust library if needed)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Base Classes ---
class DbEventBase {
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