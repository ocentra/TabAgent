console.log('[DB] minimaldb.js context check:', {
  typeofWindow: typeof window,
  typeofSelf: typeof self,
  hasRegistration: typeof self !== 'undefined' && !!self.registration,
  locationHref: typeof location !== 'undefined' ? location.href : 'N/A'
});
if (typeof window !== 'undefined') {
  console.trace('[DB] minimaldb.js loaded in window context! (trace below)');
}
// Throw if loaded in sidepanel or any non-background context
if (typeof window !== 'undefined' && typeof location !== 'undefined' && location.href.includes('sidepanel.html')) {
  throw new Error('[DB] FATAL: minimaldb.js loaded in sidepanel context!');
}
import { isBackgroundContext } from './eventBus.js';
if (!isBackgroundContext()) {
  throw new Error('[DB] FATAL: minimaldb.js loaded outside background context!');
}
class AppError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms));
    return Promise.race([promise, timeout]);
}


import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import browser from 'webextension-polyfill';
import { eventBus } from './eventBus.js';
import {
    DbCreateSessionRequest, DbCreateSessionResponse,
    DbGetSessionRequest, DbGetSessionResponse,
    DbAddMessageRequest, DbAddMessageResponse,
    DbUpdateMessageRequest, DbUpdateMessageResponse,
    DbDeleteMessageRequest, DbDeleteMessageResponse,
    DbUpdateStatusRequest, DbUpdateStatusResponse,
    DbToggleStarRequest, DbToggleStarResponse,
    DbGetAllSessionsRequest, DbGetAllSessionsResponse,
    DbMessagesUpdatedNotification,
    DbStatusUpdatedNotification,
    DbSessionUpdatedNotification,
    DbInitializeRequest, 
    DbDeleteSessionRequest, DbDeleteSessionResponse,
    DbRenameSessionRequest, DbRenameSessionResponse,
    DbGetStarredSessionsRequest, DbGetStarredSessionsResponse,
    DbGetReadyStateRequest, DbGetReadyStateResponse,
    DbResetDatabaseRequest, DbResetDatabaseResponse,
} from './events/dbEvents.js';
import {
    DbAddLogRequest,
    DbGetLogsRequest, DbGetLogsResponse,
    DbGetUniqueLogValuesRequest, DbGetUniqueLogValuesResponse,
    DbClearLogsRequest, DbClearLogsResponse,
    DbGetCurrentAndLastLogSessionIdsRequest, DbGetCurrentAndLastLogSessionIdsResponse
} from './events/dbEvents.js'; 



let db = null;
let chatHistoryCollection = null;
let logDbInstance = null;
let logsCollection = null;
let modelDbInstance = null;
let modelAssetsCollection = null;
let isDbInitialized = false;
let isLogDbInitialized = false;
let isModelDbInitialized = false;
let dbReadyResolve;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;
let isDbReadyFlag = false;

// Track last folder/fileName for addModelAsset log
let lastAddModelAssetFolder = null;
let lastAddModelAssetFile = null;

const chatHistorySchema = {
    title: 'chat history schema',
    version: 0,
    description: 'Stores chat sessions',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        tabId: { type: 'number' },
        timestamp: { type: 'number' },
        title: { type: 'string', maxLength: 100 },
        messages: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', maxLength: 100 },
                    sender: { type: 'string' },
                    text: { type: 'string' },
                    timestamp: { type: 'number' },
                    isLoading: { type: 'boolean', default: false }
                },
                required: ['messageId', 'sender', 'text', 'timestamp']
            }
        },
        isStarred: { type: 'boolean', default: false },
        status: { type: 'string', default: 'idle' }
    },
    required: ['id', 'timestamp', 'messages'],
    indexes: [['timestamp']]
};


const logSchema = {
  title: 'log schema',
  version: 0,
  description: 'Stores application log entries',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { 
      type: 'string',
      maxLength: 100,
      final: true 
    },
    timestamp: { 
      type: 'number',
      index: true 
    },
    level: { 
      type: 'string',
      enum: ['error', 'warn', 'info', 'debug'],
      index: true 
    },
    message: { 
      type: 'string'
    },
    component: { 
      type: 'string',
      index: true
    },
    extensionSessionId: { 
      type: 'string',
      index: true
    },
    chatSessionId: {
      type: ['string', 'null'],
      index: true,
      default: null 
    }
  },
  required: ['id', 'timestamp', 'level', 'component', 'extensionSessionId', 'message']
};

// --- Model Asset Storage Schema ---
const modelAssetSchema = {
    title: 'model asset schema',
    version: 0,
    description: 'Stores model files (ONNX, tokenizer, config, etc.) as blobs or chunks',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 300 }, // `${chunkGroupId}__chunk${chunkIndex}` or `${folderName}/${fileName}`
        folder: { type: 'string', maxLength: 100 },
        fileName: { type: 'string', maxLength: 100 },
        fileType: { type: 'string', maxLength: 50 },
        data: {}, // allow any type (binary or string)
        size: { type: 'number' },
        addedAt: { type: 'number' },
        chunkIndex: { type: 'number', default: 0 },
        totalChunks: { type: 'number', default: 1 },
        chunkGroupId: { type: 'string', maxLength: 200, default: '' },
        binarySize: { type: 'number' },
        totalFileSize: { type: 'number' },
    },
    required: ['id', 'folder', 'fileName', 'fileType', 'data', 'size', 'addedAt', 'chunkIndex', 'totalChunks', 'chunkGroupId', 'binarySize', 'totalFileSize'],
    indexes: [['folder'], ['fileName'], ['chunkGroupId']]
};

eventBus.subscribe(DbInitializeRequest.type, handleInitializeRequest);
eventBus.subscribe(DbGetReadyStateRequest.type, handleDbGetReadyStateRequest);
eventBus.subscribe(DbCreateSessionRequest.type, handleDbCreateSessionRequest);
eventBus.subscribe(DbGetSessionRequest.type, handleDbGetSessionRequest);
eventBus.subscribe(DbAddMessageRequest.type, handleDbAddMessageRequest);
eventBus.subscribe(DbUpdateMessageRequest.type, handleDbUpdateMessageRequest);
eventBus.subscribe(DbDeleteMessageRequest.type, handleDbDeleteMessageRequest);
eventBus.subscribe(DbUpdateStatusRequest.type, handleDbUpdateStatusRequest);
eventBus.subscribe(DbToggleStarRequest.type, handleDbToggleStarRequest);
eventBus.subscribe(DbGetAllSessionsRequest.type, handleDbGetAllSessionsRequest);
eventBus.subscribe(DbGetStarredSessionsRequest.type, handleDbGetStarredSessionsRequest);
eventBus.subscribe(DbDeleteSessionRequest.type, handleDbDeleteSessionRequest);
eventBus.subscribe(DbRenameSessionRequest.type, handleDbRenameSessionRequest);
eventBus.subscribe(DbAddLogRequest.type, handleDbAddLogRequest);
eventBus.subscribe(DbGetLogsRequest.type, handleDbGetLogsRequest);
eventBus.subscribe(DbGetUniqueLogValuesRequest.type, handleDbGetUniqueLogValuesRequest);
eventBus.subscribe(DbClearLogsRequest.type, handleDbClearLogsRequest);
eventBus.subscribe(DbGetCurrentAndLastLogSessionIdsRequest.type, handleDbGetCurrentAndLastLogSessionIdsRequest);
eventBus.subscribe(DbResetDatabaseRequest.type, handleDbResetDatabaseRequest);
async function handleDbGetReadyStateRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] handleDbGetReadyStateRequest: ready=' + isDbReadyFlag);
    return { success: true, data: { ready: isDbReadyFlag } };
}

async function ensureDbReady(type = 'chat') {
    const timeoutMs = 5000;
    const pollInterval = 100;
    const start = Date.now();
    let collection = null;
    let lastLogTime = 0;
    let waitingLogged = false;
    while (Date.now() - start < timeoutMs) {
        if (type === 'chat') {
            if (chatHistoryCollection) {
                collection = chatHistoryCollection;
                break;
            }
        } else if (type === 'log') {
            if (logsCollection) {
                collection = logsCollection;
                break;
            }
        } else if (type === 'model' || type === 'modelAssets') {
            if (modelAssetsCollection) {
                collection = modelAssetsCollection;
                break;
            }
        } else {
            throttledLog('error', '[DB][ensureDbReady] Unknown DB type requested:', type);
            throw new AppError('INVALID_INPUT', `Unknown DB type requested: ${type}`);
        }
        // Only log once if waiting
        if (!waitingLogged && Date.now() - start > 200) {
            throttledLog('log', `[DB][ensureDbReady] Waiting for collection '${type}'... elapsed: ${Date.now() - start}ms`);
            waitingLogged = true;
        }
        await new Promise(res => setTimeout(res, pollInterval));
    }
    if (!collection) {
        throttledLog('error', `[DB][ensureDbReady] Collection for type '${type}' not initialized after ${timeoutMs}ms`);
        throw new AppError('COLLECTION_NOT_READY', `Collection for type '${type}' not initialized after ${timeoutMs}ms`);
    }
    return collection;
}


async function handleDbResetDatabaseRequest() {
    console.log('[DB] Resetting databases due to initialization failure');
    try {
        if (db) {
            await db.destroy();
            console.log('[DB] Main database instance destroyed');
        }
        if (logDbInstance) {
            await logDbInstance.destroy();
            console.log('[DB] Log database instance destroyed');
        }
        if (modelDbInstance) {
            await modelDbInstance.destroy();
            console.log('[DB] Model database instance destroyed');
        }
        db = null;
        chatHistoryCollection = null;
        isDbInitialized = false;
        logDbInstance = null;
        logsCollection = null;
        isLogDbInitialized = false;
        modelDbInstance = null;
        modelAssetsCollection = null;
        isModelDbInitialized = false;
        try {
            const mainStorage = getRxStorageDexie('tabagentdb');
            if (mainStorage && typeof mainStorage.remove === 'function') {
                 await mainStorage.remove();
                 console.log('[DB] Removed tabagentdb storage');
            } else {
                 console.warn('[DB] Could not get main storage or remove method.');
            }
        } catch (e) { console.warn('[DB] Could not remove tabagentdb storage (might not exist)', { error: e?.message }); }
         try {
             const logStorage = getRxStorageDexie('tabagent_logs_db');
             if (logStorage && typeof logStorage.remove === 'function') {
                 await logStorage.remove();
                 console.log('[DB] Removed tabagent_logs_db storage');
             } else {
                  console.warn('[DB] Could not get log storage or remove method.');
             }
        } catch (e) { console.warn('[DB] Could not remove tabagent_logs_db storage (might not exist)', { error: e?.message }); }
        try {
            const modelStorage = getRxStorageDexie('tabagent_models_db');
            if (modelStorage && typeof modelStorage.remove === 'function') {
                await modelStorage.remove();
                console.log('[DB] Removed tabagent_models_db storage');
            } else {
                console.warn('[DB] Could not get model storage or remove method.');
            }
        } catch (e) { console.warn('[DB] Could not remove tabagent_models_db storage (might not exist)', { error: e?.message }); }
        dbReadyResolve(false);
    } catch (error) {
        console.error('[DB] [Database:Reset] CAUGHT RAW ERROR during reset:', error);
        console.error('[DB] Failed to reset databases', { error });
        throw new AppError('RESET_FAILED', 'Could not reset databases', { originalError: error });
    }
}


async function handleInitializeRequest(event) {
    console.log('[DB] handleInitializeRequest ENTRY', {
        dbReadyPromiseExists: !!dbReadyPromise,
        dbReadyPromiseType: typeof dbReadyPromise,
        isDbReadyFlag,
        isDbInitialized,
        isLogDbInitialized,
        isModelDbInitialized,
        eventType: event?.type,
        eventRequestId: event?.requestId
    });

    // 1. Try to get session IDs
    let ids;
    try {
        ids = await browser.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
        currentExtensionSessionId = ids.currentLogSessionId || null;
        previousExtensionSessionId = ids.previousLogSessionId || null;
        console.log('[DB] Retrieved log session IDs', { current: currentExtensionSessionId, previous: previousExtensionSessionId });
        if (!currentExtensionSessionId) {
            const msg = 'CRITICAL: currentLogSessionId not found in storage during DB init!';
            console.error('[DB] Database:Initialize]', msg);
            console.log('[DB] About to resolve dbReadyPromise with value: false (missing session ID)');
            dbReadyResolve(false);
            console.log('[DB] dbReadyPromise resolved (missing session ID)');
            console.log('[DB] handleInitializeRequest EXIT (missing session ID)');
            return { success: false, error: msg };
        }
    } catch (storageError) {
        console.error('[DB] Failed to retrieve log session IDs from storage', { error: storageError });
        console.log('[DB] About to resolve dbReadyPromise with value: false (storage error)');
        dbReadyResolve(false);
        console.log('[DB] dbReadyPromise resolved (storage error)');
        console.log('[DB] handleInitializeRequest EXIT (storage error)');
        return { success: false, error: storageError.message || String(storageError) };
    }

    // 2. Already initialized?
    if (isDbInitialized && isLogDbInitialized && isModelDbInitialized) {
        console.log('[DB] All databases already initialized, skipping');
        isDbReadyFlag = true;
        console.log('[DB] About to resolve dbReadyPromise with value: true (already initialized)');
        dbReadyResolve(true);
        console.log('[DB] dbReadyPromise resolved (already initialized)');
        console.log('[DB] handleInitializeRequest EXIT (already initialized)');
        return { success: true };
    }

    // 3. In progress?
    if (dbReadyPromise && !isDbReadyFlag) {
        console.log('[DB] Initialization already in progress, waiting for completion');
       // await dbReadyPromise;
       // console.log('[DB] dbReadyPromise finished waiting (in progress check)');
       // console.log('[DB] handleInitializeRequest EXIT (in progress check)');
       // return { success: isDbReadyFlag };
    }

    // 4. Main initialization
    try {
        console.log('[DB][Init Step 1] About to add plugins');
        addRxPlugin(RxDBQueryBuilderPlugin);
        addRxPlugin(RxDBMigrationSchemaPlugin);
        addRxPlugin(RxDBUpdatePlugin);
        console.log('[DB][Init Step 1] Plugins added');
      

        if (!isDbInitialized) {
            console.log('[DB][Init Step 2] About to create main database');
            db = await withTimeout(createRxDatabase({
                name: 'tabagentdb',
                storage: getRxStorageDexie()
            }), 10000);
            console.log('[DB][Init Step 2] Main database instance created', { name: db.name });

            console.log('[DB][Init Step 3] About to add chat collections');
            try {
                const chatCollections = await db.addCollections({
                    chatHistory: {
                        schema: chatHistorySchema
                    }
                });
                chatHistoryCollection = chatCollections.chatHistory;
                console.log('[DB][Init Step 3] Chat history collection initialized');
                isDbInitialized = true;
            } catch (e) {
                console.error('[DB][Init Step 3] Error adding chat collections:', e);
                throw e;
            }
        } else {
            console.log('[DB][Init Step 2/3] Main database and chat collections already initialized');
        }

        // Model DB
        if (!isModelDbInitialized) {
            console.log('[DB][Init Step 4] About to create model database');
            try {
                modelDbInstance = await withTimeout(createRxDatabase({
                    name: 'tabagent_models_db',
                    storage: getRxStorageDexie()
                }), 10000);
                console.log('[DB][Init Step 4] Model database instance created', { name: modelDbInstance.name });
            } catch (e) {
                console.error('[DB][Init Step 4] Error creating model database:', e);
                throw e;
            }
            console.log('[DB][Init Step 5] About to add model assets collection');
            const modelCollections = await modelDbInstance.addCollections({
                modelAssets: {
                    schema: modelAssetSchema
                }
            });
            modelAssetsCollection = modelCollections.modelAssets;
            console.log('[DB][Init Step 5] Model assets collection initialized');
            isModelDbInitialized = true;
        } else {
            console.log('[DB][Init Step 4/5] Model database and model assets collection already initialized');
        }
        // Always log model DB readiness
        try {
            await ensureModelAssetsReady();
            console.log('[DB][Init] Model assets DB/collection readiness check complete');
        } catch (e) {
            console.error('[DB][Init] Model assets DB/collection readiness check failed', e);
        }

        // Log DB
        console.log('[DB][Init Step 6] Checking if log DB needs to be initialized:', isLogDbInitialized);
        if (!isLogDbInitialized) {
            console.log('[DB][Init Step 6] About to create log database');
            try {
                logDbInstance = await withTimeout(createRxDatabase({
                    name: 'tabagent_logs_db',
                    storage: getRxStorageDexie()
                }), 10000);
                console.log('[DB][Init Step 6] Log database instance created', { name: logDbInstance.name });
            } catch (e) {
                console.error('[DB][Init Step 6] Error creating log database:', e);
                throw e;
            }
            console.log('[DB][Init Step 7] About to add log collections');
            const logCollections = await logDbInstance.addCollections({
                logs: {
                    schema: logSchema
                }
            });
            logsCollection = logCollections.logs;
            console.log('[DB][Init Step 7] Logs collection initialized');
            isLogDbInitialized = true;
            console.log('[DB] After Step 7, before subscriptions');
        } else {
            console.log('[DB][Init Step 6/7] Log database and log collections already initialized');
        }
          

        console.log('[DB] Before pruning');

       
        setTimeout(async () => {
            console.log('[DB] Running startup log pruning (delayed)...');
            console.log('[DB] Current/Previous IDs for pruning', { current: currentExtensionSessionId, previous: previousExtensionSessionId });
            try {
                const currentId = currentExtensionSessionId;
                const previousId = previousExtensionSessionId; 

                if (!currentId) {
                    console.log('[DB] Cannot prune logs, currentExtensionSessionId is not set!');
                } else {
                    console.log('[DB] Attempting to get all unique log session IDs...');
                    const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
                    console.log('[DB] Found unique log session IDs in DB', { ids: allLogSessionIds });
                    const sessionsToKeep = new Set();
                    sessionsToKeep.add(currentId);
                    if (previousId) sessionsToKeep.add(previousId);
                    console.log('[DB] Session IDs to keep', { ids: Array.from(sessionsToKeep) });
                    const sessionIdsToDelete = Array.from(allLogSessionIds).filter(id => !sessionsToKeep.has(id));
                    console.log('[DB] Session IDs to delete', { ids: sessionIdsToDelete });
                    if (sessionIdsToDelete.length > 0) {
                        console.log('[DB] Attempting to clear logs for', sessionIdsToDelete.length, 'old session(s).');
                        const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
                        console.log('[DB] Startup pruning removed', deletedCount, 'logs from old session(s).');
                    } else {
                        console.log('[DB] No old log sessions found to prune during startup.');
                    }
                }
            } catch (pruneError) {
                console.error('[DB] Error during startup log pruning:', pruneError);
            }
           
        }, 100);

        console.log('[DB] Before setting isDbReadyFlag and resolving dbReadyPromise');
       
        isDbReadyFlag = true;
        console.log('[DB] About to resolve dbReadyPromise with value: true (init complete)');
        dbReadyResolve(true);
        console.log('[DB] dbReadyPromise resolved (init complete)');
        return { success: true };
    } catch (error) {
        console.error("[DB] Entered CATCH block for init error.");
        console.error("[DB] Raw Error Name:", error?.name);
        console.error("[DB] Raw Error Message:", error?.message);
        console.error("[DB] CAUGHT RAW ERROR OBJECT during init:", error); 

        const appError = error instanceof AppError ? error : new AppError('INIT_FAILED', 'Database initialization failed', { originalError: error });
        console.error('[DB] Initialization failed', { error: appError, details: error }); 
        isDbInitialized = false;
        isLogDbInitialized = false;
        isDbReadyFlag = false;
        console.log('[DB] About to resolve dbReadyPromise with value: false (init error)');
        dbReadyResolve(false); 
        return { success: false, error: appError.message || String(appError) };
    }
}

// Generate unique message ID
function generateMessageId(chatId) {
    if (!chatId || typeof chatId !== 'string') {
        throw new AppError('INVALID_INPUT', 'Chat ID must be a non-empty string');
    }
    return `${chatId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '');
}


async function publishSessionUpdate(sessionId, updateType = 'update', sessionDataOverride = null) {
    try {
        let sessionData = sessionDataOverride;
        if (!sessionData) {
            const result = await getChatSessionByIdInternal(sessionId);
            if (result.success && result.data) {
                sessionData = result.data.toJSON ? result.data.toJSON() : result.data;
            } else if (updateType === 'delete') {
                sessionData = { id: sessionId };
            } else {
                console.error('[DB] Session not found for notification', { sessionId, updateType });
                return;
            }
        }
        let plainSession = sessionData;
        try {
            const testString = JSON.stringify(sessionData);
            plainSession = JSON.parse(testString);
        } catch (e) {
            console.error('[DB] Session data is NOT serializable:', e, sessionData);
            return;
        }
        const notification = {
            type: DbSessionUpdatedNotification.type,
            payload: { session: plainSession, updateType }
        };
        JSON.stringify(notification); 
        await eventBus.publish(notification.type, notification);
        console.log('[DB] Session update notification published', { sessionId, updateType });
    } catch (e) {
        console.error('[DB] Failed to publish session update notification', e, { sessionId, updateType });
    }
}


async function publishMessagesUpdate(sessionId, messages) {
    try {

        let plainMessages = messages;
        try {
            const testString = JSON.stringify(messages);
            plainMessages = JSON.parse(testString);
        } catch (e) {
            console.error('[DB] Messages are NOT serializable:', e, messages);
            return;
        }
        const notification = new DbMessagesUpdatedNotification(sessionId, plainMessages);
        JSON.stringify(notification); 
        await eventBus.publish(notification.type, notification);
        console.log('[DB] Messages update notification published', { sessionId, count: plainMessages.length });
    } catch (e) {
        console.error('[DB] Failed to publish messages update notification', e, { sessionId });
    }
}

async function publishStatusUpdate(sessionId, status) {
    try {
        let safeStatus = status;
        try {
            JSON.stringify(status);
        } catch (e) {
            console.error('[DB] Status is NOT serializable:', e, status);
            return;
        }
        const notification = new DbStatusUpdatedNotification(sessionId, safeStatus);
        JSON.stringify(notification); 
        await eventBus.publish(notification.type, notification);
        console.log('[DB] Status update notification published', { sessionId, status });
    } catch (e) {
        console.error('[DB] Failed to publish status update notification', e, { sessionId });
    }
}

async function createChatSessionInternal(initialMessage) {
    console.log('[DB] Creating new chat session', { initialMessage });
    try {
        const collection = await ensureDbReady();
        if (!initialMessage || !initialMessage.text) {
            return { success: false, error: 'Initial message with text is required' };
        }
        const timestamp = Date.now();
        const sessionId = crypto.randomUUID();
        const message = {
            ...initialMessage,
            text: sanitizeInput(initialMessage.text),
            messageId: generateMessageId(sessionId),
            timestamp: initialMessage.timestamp || timestamp,
            sender: initialMessage.sender || 'user'
        };
        const sessionData = {
            id: sessionId,
            tabId: null,
            timestamp,
            title: sanitizeInput(message.text.substring(0, 30)) + '...',
            messages: [message],
            isStarred: false,
            status: 'idle'
        };
        console.log('[DB] Inserting session', { sessionId });
        const newSessionDoc = await withTimeout(collection.insert(sessionData), 3000);
        await publishSessionUpdate(sessionId, 'create');
        await publishMessagesUpdate(sessionId, newSessionDoc.messages.map(m => m.toJSON ? m.toJSON() : m));
        await publishStatusUpdate(newSessionDoc.id, newSessionDoc.status);
        return { success: true, data: newSessionDoc };
    } catch (error) {
        console.error('[DB] Failed to create chat session', { error });
        return { success: false, error: error.message || String(error) };
    }
}

async function getChatSessionByIdInternal(sessionId) {
    console.log('[DB] Getting session', { sessionId });
    try {
        if (!sessionId) {
            return { success: false, error: 'Session ID is required' };
        }
        const collection = await ensureDbReady();
        const doc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
        if (!doc) {
            console.log('[DB] Session not found', { sessionId });
            return { success: false, error: `Session ${sessionId} not found` };
        }
        console.log('[DB] Session retrieved', { sessionId });
        return { success: true, data: doc };
    } catch (error) {
        console.error('[DB] Failed to get session', { sessionId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function addMessageToChatInternal(chatId, messageObject) {
    console.log('[DB] Adding message', { chatId });
    try {
        if (!chatId || !messageObject || !messageObject.text) {
            return { success: false, error: 'Chat ID and message with text are required' };
        }
        const collection = await ensureDbReady();
        const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3000);
        if (!chatDoc) {
            return { success: false, error: `Chat session ${chatId} not found` };
        }
        const newMessage = {
            ...messageObject,
            text: sanitizeInput(messageObject.text),
            messageId: messageObject.messageId || generateMessageId(chatId),
            timestamp: messageObject.timestamp || Date.now(),
            isLoading: messageObject.isLoading ?? false
        };
        const updatedDoc = await withTimeout(
            chatDoc.incrementalPatch({ messages: [...chatDoc.messages, newMessage] }),
            3000
        );
        console.log('[DB] Message added', { chatId, messageId: newMessage.messageId });
        await publishSessionUpdate(chatId, 'update');
        await publishMessagesUpdate(chatId, updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m));
        return { success: true, data: { updatedDoc, newMessageId: newMessage.messageId } };
    } catch (error) {
        console.error('[DB] Failed to add message', { chatId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function updateMessageInChatInternal(chatId, messageId, updates) {
    console.log('[DB] Updating message', { chatId, messageId });
    try {
        if (!chatId || !messageId || !updates || !updates.text) {
            return { success: false, error: 'Chat ID, message ID, and updates with text are required' };
        }
        const collection = await ensureDbReady();
        const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3000);
        if (!chatDoc) {
            return { success: false, error: `Chat session ${chatId} not found` };
        }
        let messageFound = false;
        const updatedDoc = await withTimeout(
            chatDoc.incrementalModify((docData) => {
                const messageIndex = docData.messages.findIndex(m => m.messageId === messageId);
                if (messageIndex === -1) return docData;
                messageFound = true;
                const currentMessage = docData.messages[messageIndex];
                docData.messages[messageIndex] = {
                    ...currentMessage,
                    ...updates,
                    text: sanitizeInput(updates.text),
                    messageId: currentMessage.messageId
                };
                return docData;
            }),
            3000
        );
        if (!messageFound) {
            return { success: false, error: `Message ${messageId} not found in chat ${chatId}` };
        }
        console.log('[DB] Message updated', { chatId, messageId });
        await publishSessionUpdate(chatId, 'update');
        await publishMessagesUpdate(chatId, updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m));
        return { success: true, data: updatedDoc };
    } catch (error) {
        console.error('[DB] Failed to update message', { chatId, messageId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function deleteMessageFromChatInternal(sessionId, messageId) {
    console.log('[DB] Deleting message', { sessionId, messageId });
    try {
        if (!sessionId || !messageId) {
            return { success: false, error: 'Session ID and message ID are required' };
        }
        const collection = await ensureDbReady();
        const sessionDoc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
        if (!sessionDoc) {
            return { success: false, error: `Session ${sessionId} not found` };
        }
        const initialLength = sessionDoc.messages.length;
        const updatedMessages = sessionDoc.messages.filter(msg => msg.messageId !== messageId);
        if (updatedMessages.length === initialLength) {
            console.log('[DB] Message not found', { sessionId, messageId });
            return { success: false, error: `Message ${messageId} not found in session ${sessionId}` };
        }
        const updatedDoc = await withTimeout(
            sessionDoc.incrementalPatch({ messages: updatedMessages }),
            3000
        );
        console.log('[DB] Message deleted', { sessionId, messageId });
        await publishSessionUpdate(sessionId, 'update');
        await publishMessagesUpdate(sessionId, updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m));
        return { success: true, data: { updatedDoc, deleted: true } };
    } catch (error) {
        console.error('[DB] Failed to delete message', { sessionId, messageId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function updateSessionStatusInternal(sessionId, newStatus) {
    console.log('[DB] Updating status', { sessionId, newStatus });
    try {
        const validStatuses = ['idle', 'processing', 'complete', 'error'];
        if (!sessionId || !validStatuses.includes(newStatus)) {
            return { success: false, error: `Invalid session ID or status: ${newStatus}` };
        }
        const collection = await ensureDbReady();
        const chatDoc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
        if (!chatDoc) {
            return { success: false, error: `Session ${sessionId} not found` };
        }
        const updatedDoc = await withTimeout(
            chatDoc.incrementalPatch({ status: newStatus }),
            3000
        );
        console.log('[DB] Status updated', { sessionId, newStatus });
        await publishSessionUpdate(sessionId, 'update');
        await publishStatusUpdate(sessionId, newStatus);
        return { success: true, data: updatedDoc };
    } catch (error) {
        console.error('[DB] Failed to update status', { sessionId, newStatus, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function toggleItemStarredInternal(itemId) {
    console.log('[DB] Toggling starred status', { itemId });
    try {
        if (!itemId) {
            return { success: false, error: 'Item ID is required' };
        }
        const collection = await ensureDbReady();
        const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
        if (!entryDoc) {
            return { success: false, error: `Item ${itemId} not found` };
        }
        const currentStarredStatus = entryDoc.get('isStarred') || false;
        const updatedDoc = await withTimeout(
            entryDoc.incrementalPatch({ isStarred: !currentStarredStatus }),
            3000
        );
        console.log('[DB] Starred status toggled', { itemId, isStarred: !currentStarredStatus });
        await publishSessionUpdate(itemId, 'update');
        return { success: true, data: updatedDoc };
    } catch (error) {
        console.error('[DB] Failed to toggle starred status', { itemId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function deleteHistoryItemInternal(itemId) {
    console.log('[DB] Deleting history item', { itemId });
    try {
        if (!itemId) {
            return { success: false, error: 'Item ID is required' };
        }
        const collection = await ensureDbReady();
        const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
        if (!entryDoc) {
            console.log('[DB] Item not found', { itemId });
            return { success: false, error: `Item ${itemId} not found` };
        }
        await withTimeout(entryDoc.remove(), 3000);
        console.log('[DB] Item deleted', { itemId });
        await publishSessionUpdate(itemId, 'delete');
        return { success: true, data: true };
    } catch (error) {
        console.error('[DB] Failed to delete history item', { itemId, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function renameHistoryItemInternal(itemId, newTitle) {
    console.log('[DB] Renaming history item', { itemId, newTitle });
    try {
        if (!itemId || !newTitle) {
            return { success: false, error: 'Item ID and new title are required' };
        }
        const collection = await ensureDbReady();
        const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
        if (!entryDoc) {
            return { success: false, error: `Item ${itemId} not found` };
        }
        const updatedDoc = await withTimeout(
            entryDoc.incrementalPatch({ title: sanitizeInput(newTitle) }),
            3000
        );
        console.log('[DB] Item renamed', { itemId, newTitle });
        await publishSessionUpdate(itemId, 'rename');
        return { success: true, data: updatedDoc };
    } catch (error) {
        console.error('[DB] Failed to rename history item', { itemId, newTitle, error });
        return { success: false, error: error.message || String(error) };
    }
}

async function getAllSessionsInternal() {
    console.log('[DB] Getting all sessions');
    try {
        const collection = await ensureDbReady();
        
        const sessionsDocs = await withTimeout(
            collection.find().sort({ timestamp: 'desc' }).exec(),
            5000
        );
        const plainSessions = sessionsDocs.map(doc => doc.toJSON());
        console.log('[DB] Retrieved sessions', { count: plainSessions.length });
        return { success: true, data: plainSessions };
    } catch (error) {
        console.error('[DB] Failed to get all sessions', { error });
        return { success: false, error: error.message || String(error) };
    }
}

async function getStarredSessionsInternal() {
    console.log('[DB] Getting starred sessions');
    try {
        const collection = await ensureDbReady();
        const sessions = await withTimeout(
            collection.find({ selector: { isStarred: true } }).sort({ timestamp: 'desc' }).exec(),
            5000
        );
        console.log('[DB] Retrieved starred sessions', { count: sessions.length });
        return { success: true, data: sessions };
    } catch (error) {
        console.error('[DB] Failed to get starred sessions', { error });
        return { success: false, error: error.message || String(error) };
    }
}

async function handleDbCreateSessionRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling session creation', { requestId });
    let response;
    try {
        if (!event?.requestId || !event?.payload?.initialMessage || !event.payload.initialMessage.text) {
            throw new AppError('INVALID_INPUT', 'Missing requestId, initialMessage, or message text');
        }

        const result = await withTimeout(createChatSessionInternal(event.payload.initialMessage), 5000);
        if (!result.success || !result.data?.id) {
            throw new AppError('INVALID_DOCUMENT', 'Invalid session document returned');
        }
        const newSessionDoc = result.data;
        const plainMessages = newSessionDoc.messages.map(m => m.toJSON ? m.toJSON() : m);
        console.log('[DB] About to publish DbMessagesUpdatedNotification (create session)', { sessionId: newSessionDoc.id, messages: plainMessages });
        await publishMessagesUpdate(newSessionDoc.id, plainMessages);
        await publishStatusUpdate(newSessionDoc.id, newSessionDoc.status);

        response = new DbCreateSessionResponse(requestId, true, newSessionDoc.id);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Session created successfully', { requestId, sessionId: newSessionDoc.id });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to create session', { originalError: error });
        response = new DbCreateSessionResponse(requestId, false, null, appError);
        try {
             await withTimeout(eventBus.publish(response.type, response), 3000);
        } catch (publishError) {
             console.error('[DB] FATAL: Failed even to publish error response!', { requestId, publishError });
        }
        console.error('[DB] Session creation failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbGetSessionRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling get session', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }
        const result = await withTimeout(getChatSessionByIdInternal(event.payload.sessionId), 5000);
        if (!result.success) {
            throw new AppError('GET_SESSION_FAILED', result.error || 'Unknown error');
        }
        response = new DbGetSessionResponse(requestId, true, result.data ? result.data.toJSON() : null);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Session retrieved', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get session', { originalError: error });
        response = new DbGetSessionResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Get session failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbAddMessageRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling add message', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageObject || !event.payload.messageObject.text) {
            throw new AppError('INVALID_INPUT', 'Session ID and message with text are required');
        }
        const result = await withTimeout(
            addMessageToChatInternal(event.payload.sessionId, event.payload.messageObject),
            5000
        );
        if (!result.success) {
            console.error('[DB][handleDbAddMessageRequest] addMessageToChatInternal failed', { result });
            throw new AppError('ADD_MESSAGE_FAILED', result.error || 'Unknown error');
        }
        const updatedDoc = result.data.updatedDoc || result.data;
        const newMessageId = result.data.newMessageId;
        const plainMessages = updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m); // Ensure plain messages
        console.log('[DB] About to publish DbMessagesUpdatedNotification (add message)', { sessionId: updatedDoc.id, messages: plainMessages });
        await publishMessagesUpdate(updatedDoc.id, plainMessages);
        response = new DbAddMessageResponse(requestId, true, newMessageId);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Message added', { requestId, sessionId: event.payload.sessionId, messageId: newMessageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to add message', { originalError: error });
        response = new DbAddMessageResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Add message failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbUpdateMessageRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling update message', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageId || !event?.payload?.updates || !event.payload.updates.text) {
            throw new AppError('INVALID_INPUT', 'Session ID, message ID, and updates with text are required');
        }
        const result = await withTimeout(
            updateMessageInChatInternal(event.payload.sessionId, event.payload.messageId, event.payload.updates),
            5000
        );
        if (!result.success) {
            throw new AppError('UPDATE_MESSAGE_FAILED', result.error || 'Unknown error');
        }
        const updatedDoc = result.data;
        const plainMessages = updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m);
        console.log('[DB] About to publish DbMessagesUpdatedNotification (update message)', { sessionId: updatedDoc.id, messages: plainMessages });
        await publishMessagesUpdate(updatedDoc.id, plainMessages);
        response = new DbUpdateMessageResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Message updated', { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to update message', { originalError: error });
        response = new DbUpdateMessageResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Update message failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbDeleteMessageRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling delete message', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageId) {
            throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
        }
        const result = await withTimeout(
            deleteMessageFromChatInternal(event.payload.sessionId, event.payload.messageId),
            5000
        );
        if (!result.success) {
            throw new AppError('DELETE_MESSAGE_FAILED', result.error || 'Unknown error');
        }
        const { updatedDoc, deleted } = result.data;
        if (deleted) {
            const plainMessages = updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m);
            console.log('[DB] About to publish DbMessagesUpdatedNotification (delete message)', { sessionId: updatedDoc.id, messages: plainMessages });
            await publishMessagesUpdate(updatedDoc.id, plainMessages);
        }
        response = new DbDeleteMessageResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Message deleted', { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to delete message', { originalError: error });
        response = new DbDeleteMessageResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Delete message failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbUpdateStatusRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling update status', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId || !event?.payload?.status) {
            throw new AppError('INVALID_INPUT', 'Session ID and status are required');
        }
        const result = await withTimeout(
            updateSessionStatusInternal(event.payload.sessionId, event.payload.status),
            5000
        );
        if (!result.success) {
            throw new AppError('UPDATE_STATUS_FAILED', result.error || 'Unknown error');
        }
        const updatedDoc = result.data;
        await publishStatusUpdate(updatedDoc.id, updatedDoc.status);
        response = new DbUpdateStatusResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Status updated', { requestId, sessionId: event.payload.sessionId, status: event.payload.status });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to update status', { originalError: error });
        response = new DbUpdateStatusResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Update status failed', { requestId, error: appError });
        try {
            await publishStatusUpdate(event.payload.sessionId, 'error');
        } catch (notificationError) {
            console.error('Failed to publish error status notification', { requestId, error: notificationError });
        }
    }
    return response;
}

async function handleDbToggleStarRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling toggle star', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }
        const result = await withTimeout(toggleItemStarredInternal(event.payload.sessionId), 5000);
        if (!result.success) {
            throw new AppError('TOGGLE_STAR_FAILED', result.error || 'Unknown error');
        }
        const updatedDoc = result.data;
        response = new DbToggleStarResponse(requestId, true, updatedDoc.toJSON());
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Star toggled', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to toggle star', { originalError: error });
        response = new DbToggleStarResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Toggle star failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbGetAllSessionsRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling get all sessions', { requestId });
    let response;
    try {
        const result = await withTimeout(getAllSessionsInternal(), 5000);
        if (!result.success) {
            throw new AppError('GET_ALL_SESSIONS_FAILED', result.error || 'Unknown error');
        }
        const sortedSessions = (result.data || []).sort((a, b) => b.timestamp - a.timestamp);
        console.log('Using plain sessions directly', { count: sortedSessions.length });
        response = new DbGetAllSessionsResponse(requestId, true, sortedSessions);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Sessions retrieved', { requestId, count: sortedSessions.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get all sessions', { originalError: error });
        response = new DbGetAllSessionsResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Get all sessions failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbGetStarredSessionsRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling get starred sessions', { requestId });
    let response;
    try {
        const result = await withTimeout(getStarredSessionsInternal(), 5000);
        if (!result.success) {
            throw new AppError('GET_STARRED_SESSIONS_FAILED', result.error || 'Unknown error');
        }
        const starredSessions = (result.data || []).map(s => ({
            sessionId: s.id,
            name: s.title,
            lastUpdated: s.timestamp,
            isStarred: s.isStarred
        })).sort((a, b) => b.lastUpdated - a.lastUpdated);
        console.log('Retrieved starred sessions', { count: starredSessions.length });
        response = new DbGetStarredSessionsResponse(requestId, true, starredSessions);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Starred sessions retrieved', { requestId, count: starredSessions.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get starred sessions', { originalError: error });
        response = new DbGetStarredSessionsResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Get starred sessions failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbDeleteSessionRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling delete session', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }
        const result = await withTimeout(deleteHistoryItemInternal(event.payload.sessionId), 5000);
        if (!result.success) {
            throw new AppError('DELETE_SESSION_FAILED', result.error || 'Unknown error');
        }
        // Publish a session update notification for delete
        try {
            const notification = {
                type: DbSessionUpdatedNotification.type,
                payload: {
                    session: { id: event.payload.sessionId },
                    updateType: 'delete'
                }
            };
            JSON.stringify(notification); // Ensure serializable
            await eventBus.publish(notification.type, notification);
        } catch (e) {
            console.error('[DB] Failed to publish session delete notification', e);
        }
        response = new DbDeleteSessionResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Session deleted', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to delete session', { originalError: error });
        response = new DbDeleteSessionResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Delete session failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbRenameSessionRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    console.log('[DB] Handling rename session', { requestId });
    let response;
    try {
        if (!event?.payload?.sessionId || !event?.payload?.newName) {
            throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
        }
        const result = await withTimeout(
            renameHistoryItemInternal(event.payload.sessionId, event.payload.newName),
            5000
        );
        if (!result.success) {
            throw new AppError('RENAME_SESSION_FAILED', result.error || 'Unknown error');
        }
        response = new DbRenameSessionResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.log('[DB] Session renamed', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to rename session', { originalError: error });
        response = new DbRenameSessionResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        console.error('[DB] Rename session failed', { requestId, error: appError });
    }
    return response;
}


async function handleDbAddLogRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    let response;
    try {
        if (!event?.payload?.logEntryData) {
            throw new AppError('INVALID_INPUT', 'Missing logEntryData in payload');
        }
        
        const collection = await ensureDbReady('log');
        await withTimeout(collection.insert(event.payload.logEntryData), 3000); 
        console.log('Log entry added successfully', { logId: event.payload.logEntryData.id });
        response = { success: true };
    } catch (error) {
        response = { success: false, error: error.message || String(error) };
        console.error('Failed to handle add log request', { requestId, error });
    }
    return response;
}

async function handleDbGetLogsRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    let response;
    try {
        if (!event?.payload?.filters) {
            throw new AppError('INVALID_INPUT', 'Missing filters in payload');
        }
        const logs = await getLogsInternal(event.payload.filters);
        response = new DbGetLogsResponse(requestId, true, logs);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response);
        } catch (e) {
            console.error('[DB] DbGetLogsResponse is NOT serializable:', e, response);
        }
        console.log('Log retrieval successful', { requestId, count: logs.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get logs', { originalError: error });
        response = new DbGetLogsResponse(requestId, false, null, appError);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response); // Publish error response
        } catch (e) {
            console.error('[DB] DbGetLogsResponse (error) is NOT serializable:', e, response);
        }
        console.error('Get logs failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbGetUniqueLogValuesRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    let response;
    try {
        if (!event?.payload?.fieldName) {
            throw new AppError('INVALID_INPUT', 'Missing fieldName in payload');
        }
        const values = await getUniqueLogValuesInternal(event.payload.fieldName);
        response = new DbGetUniqueLogValuesResponse(requestId, true, values);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response);
        } catch (e) {
            console.error('[DB] DbGetUniqueLogValuesResponse is NOT serializable:', e, response);
        }
        console.log('Unique value retrieval successful', { requestId, field: event.payload.fieldName, count: values.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get unique log values', { originalError: error });
        response = new DbGetUniqueLogValuesResponse(requestId, false, null, appError);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response); // Publish error response
        } catch (e) {
            console.error('[DB] DbGetUniqueLogValuesResponse (error) is NOT serializable:', e, response);
        }
        console.error('Get unique log values failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbClearLogsRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    let response;
    try {
        console.log('ClearLogs request received. Performing pruning of non-current/last sessions.');
        
        const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
        const sessionsToKeep = new Set();
        if (currentExtensionSessionId) sessionsToKeep.add(currentExtensionSessionId);
        if (previousExtensionSessionId) sessionsToKeep.add(previousExtensionSessionId);
        const sessionIdsToDelete = Array.from(allLogSessionIds).filter(id => !sessionsToKeep.has(id));

        if (sessionIdsToDelete.length > 0) {
            const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
            console.log('[DB] ClearLogs request resulted in pruning ' + deletedCount + ' logs from old sessions.');
        } else {
             console.log('ClearLogs request found no old sessions to prune.');
        }
        
        response = new DbClearLogsResponse(requestId, true);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response);
        } catch (e) {
            console.error('[DB] DbClearLogsResponse is NOT serializable:', e, response);
        }
        
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to clear logs', { originalError: error });
        response = new DbClearLogsResponse(requestId, false, appError);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response); // Publish error response
        } catch (e) {
            console.error('[DB] DbClearLogsResponse (error) is NOT serializable:', e, response);
        }
        console.error('Clear logs failed', { requestId, error: appError });
    }
    return response;
}

async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
    const requestId = event?.requestId || crypto.randomUUID();
    let response;
    try {
        const ids = {
             currentLogSessionId: currentExtensionSessionId,
             previousLogSessionId: previousExtensionSessionId // This might be null if it's the first run
        };
        response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, true, ids);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response);
        } catch (e) {
            console.error('[DB] DbGetCurrentAndLastLogSessionIdsResponse is NOT serializable:', e, response);
        }
        console.log('Current/Last session ID retrieval successful', { requestId });
    } catch (error) { 
        const appError = new AppError('UNKNOWN', 'Failed to get current/last log session IDs', { originalError: error });
        response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, false, null, appError);
        try {
            JSON.stringify(response);
            await eventBus.publish(response.type, response);
        } catch (e) {
            console.error('[DB] DbGetCurrentAndLastLogSessionIdsResponse (error) is NOT serializable:', e, response);
        }
        console.error('Get current/last log session IDs failed', { requestId, error: appError });
    }
    return response;
}


async function getAllUniqueLogSessionIdsInternal() {
    console.log('Starting retrieval of unique session IDs...');
    try {
        const collection = await ensureDbReady('log');
        console.log('Log collection ensured ready.');
        const results = await collection.find().exec();
        console.log('Found ' + results.length + ' log documents.');
        
        const uniqueIds = new Set(results.map(doc => doc.get('extensionSessionId')));
        console.log('Unique session IDs calculated', { count: uniqueIds.size });
        return { success: true, data: uniqueIds };
    } catch (error) {
        console.error('Error during find().select().exec() for unique session IDs', { error });
        return { success: false, error: error.message || String(error) };
    }
}


async function clearLogsInternal(sessionIdsToDelete) {
    console.log('ClearLogs request received. Performing pruning of non-current/last sessions.');
    
    const collection = await ensureDbReady('log');
    console.log('Log collection ensured ready.');

    const results = await collection.find().exec();
    console.log('Found ' + results.length + ' log documents.');
    
    const filteredResults = results.filter(doc => {
        const sessionId = doc.get('extensionSessionId');
        return sessionId && !sessionIdsToDelete.includes(sessionId);
    });

    console.log('Filtered results count: ' + filteredResults.length);
    const deletedCount = filteredResults.length;
    await withTimeout(collection.bulkRemove(filteredResults), 3000);
    console.log('ClearLogs request resulted in pruning ' + deletedCount + ' logs from old sessions.');

    return { success: true, data: { deletedCount } };
}



async function ensureModelAssetsReady() {
    return await ensureDbReady('model');
}


async function addModelAsset(folder, fileName, fileType, data, chunkIndex = 0, totalChunks = 1, chunkGroupId = '', binarySize = null, totalFileSize = null, collection = null) {
    // DEBUG: Log chunkGroupId and related info
    throttledLog('log', '[DEBUG][addModelAsset] chunkGroupId:', `${chunkGroupId} | folder: ${folder} | fileName: ${fileName} | chunkIndex: ${chunkIndex}`);
    throttledLog('log', '[DB][addModelAsset] Called with:', `${folder}/${fileName}`);
    let size = 0;
    if (typeof data === 'string') {
        size = data.length;
    } else if (data instanceof ArrayBuffer) {
        size = data.byteLength;
    } else if (ArrayBuffer.isView(data)) {
        size = data.byteLength;
    } else {
        throttledLog('warn', '[DB][addModelAsset] Data is not a string, ArrayBuffer, or TypedArray!', `${folder}/${fileName}`);
        throw new Error('addModelAsset: data must be a string, ArrayBuffer, or TypedArray');
    }
    if (!collection) collection = await ensureModelAssetsReady();
    const id = chunkGroupId ? `${chunkGroupId}__chunk${chunkIndex}` : `${folder}/${fileName}`;
    const addedAt = Date.now();
    try {
        // Only log for first and last chunk
        if (chunkIndex === 0 || chunkIndex === totalChunks - 1) {
            throttledLog('log', '[DB][addModelAsset] Inserting into DB:', id);
        }
        await collection.insert({ id, folder, fileName, fileType, data, size, addedAt, chunkIndex, totalChunks, chunkGroupId, binarySize, totalFileSize });
        throttledLog('log', '[DB][addModelAsset] Insert successful:', id);
    } catch (err) {
        if (err.code === 'CONFLICT' || (err.parameters && err.parameters.status === 409)) {
            // Only log for first and last chunk
            if (chunkIndex === 0 || chunkIndex === totalChunks - 1) {
                throttledLog('log', '[DB][addModelAsset] Chunk already exists, skipping insert:');
                if (process.env.NODE_ENV === 'development') console.debug('Chunk ID:', id);
            }
            return { success: true, skipped: true };
        }
        throttledLog('error', '[DB][addModelAsset] Insert failed:', id);
        throw err;
    }
    return { success: true };
}
async function getModelAssetChunks(chunkGroupId, collection = null) {
    if (!collection) collection = await ensureModelAssetsReady();
    const docs = await collection.find({ selector: { chunkGroupId } }).sort({ chunkIndex: 'asc' }).exec();
    return docs.map(doc => doc.toJSON());
}
async function getModelAsset(folder, fileName, collection = null) {
    throttledLog('log', '[DB][getModelAsset] Called with:', { folder, fileName });
    if (!collection) collection = await ensureModelAssetsReady();
    const id = `${folder}/${fileName}`;
    let doc = await collection.findOne(id).exec();
    if (doc) {
        const asset = doc.toJSON();
        if (asset.totalChunks && asset.totalChunks > 1 && asset.chunkGroupId) {
            const chunks = await getModelAssetChunks(asset.chunkGroupId, collection);
            if (!chunks) return null;
            const totalFileSize = chunks[0].totalFileSize || chunks.reduce((sum, c) => sum + (c.binarySize || 0), 0);
            const buffer = new Uint8Array(totalFileSize);
            let offset = 0;
            for (const chunk of chunks) {
                const chunkBytes = new Uint8Array(chunk.data);
                buffer.set(chunkBytes, offset);
                offset += chunkBytes.length;
            }
            return {
                id: asset.chunkGroupId,
                folder,
                fileName,
                fileType: chunks[0].fileType,
                data: buffer.buffer,
                size: totalFileSize,
                addedAt: chunks[0].addedAt,
                chunkIndex: 0,
                totalChunks: chunks.length,
                chunkGroupId: asset.chunkGroupId
            };
        }
        if (asset.data && typeof asset.data === 'string') {
            const buffer = new Uint8Array(atob(asset.data).length);
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = atob(asset.data).charCodeAt(i);
            }
            asset.data = buffer.buffer;
            asset.size = buffer.byteLength;
        }
        return asset;
    }
    const chunkGroupId = id;
    const chunks = await getModelAssetChunks(chunkGroupId, collection);
    if (chunks && chunks.length > 0) {
        const totalFileSize = chunks[0].totalFileSize || chunks.reduce((sum, c) => sum + (c.binarySize || 0), 0);
        const buffer = new Uint8Array(totalFileSize);
        let offset = 0;
        for (const chunk of chunks) {
            const chunkBytes = new Uint8Array(chunk.data);
            buffer.set(chunkBytes, offset);
            offset += chunkBytes.length;
        }
        return {
            id: chunkGroupId,
            folder,
            fileName,
            fileType: chunks[0].fileType,
            data: buffer.buffer,
            size: totalFileSize,
            addedAt: chunks[0].addedAt,
            chunkIndex: 0,
            totalChunks: chunks.length,
            chunkGroupId,
        };
    }
    throttledLog('warn', '[DB][getModelAsset] Asset not found:', { id });
    return null;
}

async function countModelAssetChunks(folder, fileName, collection = null) {
    if (!collection) collection = await ensureModelAssetsReady();
    const chunkGroupId = `${folder}/${fileName}`;
    // DEBUG: Log chunkGroupId and related info
    throttledLog('log', '[DB][countModelAssetChunks] chunkGroupId:', `${chunkGroupId} | folder: ${folder} | fileName: ${fileName}`);
    const docs = await collection.find({ selector: { chunkGroupId } }).exec();
    return docs.length;
}

// Helper: Log all chunkGroupIds for a model (folder)
async function logAllChunkGroupIdsForModel(folder, collection = null) {
    if (!collection) collection = await ensureModelAssetsReady();
    const docs = await collection.find({ selector: { folder } }).exec();
    const chunkGroupIds = docs.map(doc => doc.chunkGroupId);
    throttledLog('log', '[DB][AllChunkGroupIds]', JSON.stringify(chunkGroupIds));
}

// Verifies that a model asset can be reassembled and (optionally) matches expected size
async function verifyModelAsset(folder, fileName, expectedSize = null, expectedChunks = null, collection = null) {
    if (!collection) collection = await ensureModelAssetsReady();
    const chunkGroupId = `${folder}/${fileName}`;
    const docs = await collection.find({ selector: { chunkGroupId } }).sort({ chunkIndex: 'asc' }).exec();
    if (!docs || docs.length === 0) {
        return { success: false, error: 'No chunks found' };
    }
    // Check chunk indices are contiguous
    for (let i = 0; i < docs.length; ++i) {
        if (docs[i].chunkIndex !== i) {
            return { success: false, error: `Missing chunk at index ${i}` };
        }
    }
    // Check total size if expected
    if (expectedSize !== null) {
        const total = docs.reduce((sum, c) => sum + (c.binarySize || 0), 0);
        if (total !== expectedSize) {
            return { success: false, error: `Size mismatch: expected ${expectedSize}, got ${total}` };
        }
    }
    // Check chunk count if expected
    if (expectedChunks !== null && docs.length !== expectedChunks) {
        return { success: false, error: `Chunk count mismatch: expected ${expectedChunks}, got ${docs.length}` };
    }
    return { success: true };
}

// Utility: List all files for a model folder, with chunk info
 async function listModelFiles(modelId) {
    const collection = await ensureModelAssetsReady();
    const docs = await collection.find({ selector: { folder: modelId } }).exec();
    const fileMap = {};
    for (const doc of docs) {
        const key = doc.fileName;
        if (!fileMap[key]) fileMap[key] = [];
        fileMap[key].push(doc);
    }
    return Object.entries(fileMap).map(([fileName, docs]) => {
        const chunkGroupIds = new Set(docs.map(d => d.chunkGroupId));
        let chunkCount = 0;
        for (const groupId of chunkGroupIds) {
            chunkCount += docs.filter(d => d.chunkGroupId === groupId).length;
        }
        const isChunked = docs.length > 1 || (docs[0] && docs[0].totalChunks > 1);
        const type = isChunked ? `chunked (${docs.length} parts)` : 'single';
        return { path: `/${modelId}/${fileName}`, type };
    });
}

// Export addModelAsset, getModelAsset, and countModelAssetChunks for direct use
export { addModelAsset, getModelAsset, countModelAssetChunks, logAllChunkGroupIdsForModel, verifyModelAsset, listModelFiles };

// --- Throttled Logging Helper ---
const logThrottleCache = {};
const logLastContext = {};
function throttledLog(type, staticMsg, contextKey = null) {
    const now = Date.now();
    if (!logThrottleCache[type]) logThrottleCache[type] = {};
    if (contextKey !== null) {
        if (logLastContext[staticMsg] === contextKey) return; // skip if same context
        logLastContext[staticMsg] = contextKey;
    }
    if (!logThrottleCache[type][staticMsg] || now - logThrottleCache[type][staticMsg] > 2000) {
        logThrottleCache[type][staticMsg] = now;
        if (type === 'log') console.log(staticMsg, contextKey !== null ? contextKey : '');
        else if (type === 'warn') console.warn(staticMsg, contextKey !== null ? contextKey : '');
        else if (type === 'error') console.error(staticMsg, contextKey !== null ? contextKey : '');
    }
}








