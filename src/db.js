// Top-level logging control (set to false in production)
const ENABLE_LOGGING = true;

// Set to true during development to reset the database if initialization fails
const RESET_DB_ON_ERROR = true;

// Log levels
const LOG_LEVELS = {
    OFF: 0,
    ERROR: 1,
    INFO: 2,
    DEBUG: 3
};

// Logger class for controlled logging
class Logger {
    constructor(module, defaultLevel = 'debug') {
        this.module = module;
        this.level = ENABLE_LOGGING ? LOG_LEVELS[defaultLevel.toUpperCase()] : LOG_LEVELS.OFF;
    }

    debug(message, meta = {}) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(`[DB:${this.module}] ${message}`, { ...meta, timestamp: new Date().toISOString() });
        }
    }

    info(message, meta = {}) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.info(`[DB:${this.module}] ${message}`, { ...meta, timestamp: new Date().toISOString() });
        }
    }

    error(message, meta = {}) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(`[DB:${this.module}] ${message}`, { ...meta, timestamp: new Date().toISOString() });
        }
    }

    setLevel(level) {
        this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.OFF;
    }
}

// Custom error class for structured errors
class AppError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

// Timeout utility
async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms));
    return Promise.race([promise, timeout]);
}

// Database imports and setup
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
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
    DbInitializationCompleteNotification,
    DbDeleteSessionRequest, DbDeleteSessionResponse,
    DbRenameSessionRequest, DbRenameSessionResponse,
    DbGetStarredSessionsRequest, DbGetStarredSessionsResponse
} from './events/dbEvents.js';
import {
    DbAddLogRequest,
    DbGetLogsRequest, DbGetLogsResponse,
    DbGetUniqueLogValuesRequest, DbGetUniqueLogValuesResponse,
    DbClearLogsRequest, DbClearLogsResponse,
    DbGetCurrentAndLastLogSessionIdsRequest, DbGetCurrentAndLastLogSessionIdsResponse
} from './events/dbEvents.js'; // Updated path

const logger = new Logger('Main');

// Database state
let db = null;
let chatHistoryCollection = null;
let logDbInstance = null;
let logsCollection = null;
let isDbInitialized = false;
let isLogDbInitialized = false;
let dbReadyResolve;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });

// Variable to store the session ID for the current extension run
// These will be set during initialization
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;

// Database schema (version 0)
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

// Log schema (version 0)
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

// Ensure database is ready
async function ensureDbReady(type = 'chat') {
    const isReady = await withTimeout(dbReadyPromise, 5000, 'Database initialization timeout');
    if (!isReady) {
         throw new AppError('DB_NOT_READY', 'Main Database systems not initialized');
    }
    if (type === 'chat') {
        if (!chatHistoryCollection) throw new AppError('COLLECTION_NOT_READY', 'Chat history collection not initialized');
    return chatHistoryCollection;
    } else if (type === 'log') {
        if (!logsCollection) throw new AppError('COLLECTION_NOT_READY', 'Logs collection not initialized');
        return logsCollection;
    } else {
        throw new AppError('INVALID_INPUT', `Unknown DB type requested: ${type}`);
    }
}

// Reset database (for development)
async function resetDatabase() {
    const resetLogger = new Logger('Reset');
    resetLogger.info('Resetting databases due to initialization failure');
    try {
        if (db) {
            await db.destroy();
            resetLogger.debug('Main database instance destroyed');
        }
        if (logDbInstance) {
            await logDbInstance.destroy();
            resetLogger.debug('Log database instance destroyed');
        }
        // Reset state variables *after* attempting destruction
        db = null;
        chatHistoryCollection = null;
        isDbInitialized = false;
        logDbInstance = null;
        logsCollection = null;
        isLogDbInitialized = false;

        // Reset both underlying Dexie stores if possible
        // Note: This might be simplified if they share the same Dexie instance internally, 
        // but safer to attempt separate deletes if names are different.
        try {
            // Check if getRxStorageDexie returns an object with a remove method
            const mainStorage = getRxStorageDexie('tabagentdb');
            if (mainStorage && typeof mainStorage.remove === 'function') {
                 await mainStorage.remove();
                 resetLogger.info('Removed tabagentdb storage');
            } else {
                 resetLogger.warn('Could not get main storage or remove method.');
            }
        } catch (e) { resetLogger.warn('Could not remove tabagentdb storage (might not exist)', { error: e?.message }); }
         try {
             // Check if getRxStorageDexie returns an object with a remove method
             const logStorage = getRxStorageDexie('tabagent_logs_db');
             if (logStorage && typeof logStorage.remove === 'function') {
                 await logStorage.remove();
                 resetLogger.info('Removed tabagent_logs_db storage');
             } else {
                  resetLogger.warn('Could not get log storage or remove method.');
             }
        } catch (e) { resetLogger.warn('Could not remove tabagent_logs_db storage (might not exist)', { error: e?.message }); }

        dbReadyResolve(false);
    } catch (error) {
        console.error("[DB:Reset] CAUGHT RAW ERROR during reset:", error);
        resetLogger.error('Failed to reset databases', { error });
        throw new AppError('RESET_FAILED', 'Could not reset databases', { originalError: error });
    }
}

// Initialize database
// Modify to accept session IDs (or retrieve them internally if background exports them)
async function handleInitializeRequest(event) {
    const initLogger = new Logger('Initialize');
    initLogger.info('Handling initialize request');

    // ---- Get Session IDs ----
    // Ideally, these are passed from background.js or retrieved via an import
    // For now, let's assume they are set externally before this runs, or retrieve from storage
    // If background exports functions: 
    // import { getCurrentLogSessionId, getPreviousLogSessionId } from '../background.js'; // Adjust path
    // currentExtensionSessionId = getCurrentLogSessionId();
    // previousExtensionSessionId = getPreviousLogSessionId();
    // ---- OR retrieve from storage as a fallback ----
    try {
        const ids = await chrome.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
        currentExtensionSessionId = ids.currentLogSessionId || null;
        previousExtensionSessionId = ids.previousLogSessionId || null;
        if (!currentExtensionSessionId) {
            initLogger.error('CRITICAL: currentLogSessionId not found in storage during DB init!');
            // Handle error - maybe generate one here? Or rely on background?
        }
         initLogger.info('Retrieved log session IDs', { current: currentExtensionSessionId, previous: previousExtensionSessionId });
    } catch (storageError) {
         initLogger.error('Failed to retrieve log session IDs from storage', { error: storageError });
         // Decide how to proceed - block init?
    }
    // ---- End Get Session IDs ----

    // Check if BOTH are initialized to avoid partial re-init
    if (isDbInitialized && isLogDbInitialized) {
        initLogger.info('Both databases already initialized, skipping');
        return; 
    }
    
    try {
        addRxPlugin(RxDBQueryBuilderPlugin);
        addRxPlugin(RxDBMigrationSchemaPlugin);
        addRxPlugin(RxDBUpdatePlugin);

        // Initialize Main DB (Chat History)
        if (!isDbInitialized) {
        db = await withTimeout(createRxDatabase({
            name: 'tabagentdb',
            storage: getRxStorageDexie()
        }), 10000);
            initLogger.debug('Main database instance created', { name: db.name });

            const chatCollections = await db.addCollections({
            chatHistory: {
                schema: chatHistorySchema
            }
        });
            chatHistoryCollection = chatCollections.chatHistory;
        initLogger.debug('Chat history collection initialized');
            isDbInitialized = true;
        } else {
             initLogger.info('Main database already initialized');
        }
        
        // Initialize Log DB
        if (!isLogDbInitialized) {
            logDbInstance = await withTimeout(createRxDatabase({
                 name: 'tabagent_logs_db',
                 storage: getRxStorageDexie()
             }), 10000);
             initLogger.debug('Log database instance created', { name: logDbInstance.name });

            const logCollections = await logDbInstance.addCollections({
                logs: {
                    schema: logSchema
                }
            });
            logsCollection = logCollections.logs;
            initLogger.debug('Logs collection initialized');
            isLogDbInitialized = true;
        } else {
            initLogger.info('Log database already initialized');
        }

        // Only resolve ready promise and subscribe if BOTH succeed
        if (isDbInitialized && isLogDbInitialized) {
             // Subscribe to chat events (only if not already done)
             // This assumes init might be called multiple times if one part fails
             // A better approach might ensure event subscriptions happen only once globally
            const currentSubscriptions = (typeof eventBus?.getSubscriptions === 'function') 
                ? eventBus.getSubscriptions() 
                : {}; // Default to empty object if method doesn't exist
            const chatEventNames = [
                 DbCreateSessionRequest.name,
                 DbGetSessionRequest.name,
                 DbAddMessageRequest.name,
                 DbUpdateMessageRequest.name,
                 DbDeleteMessageRequest.name,
                 DbUpdateStatusRequest.name,
                 DbToggleStarRequest.name,
                 DbGetAllSessionsRequest.name,
                 DbGetStarredSessionsRequest.name,
                 DbDeleteSessionRequest.name,
                 DbRenameSessionRequest.name
             ];
             const needChatSubscription = chatEventNames.some(name => !currentSubscriptions[name]);
            
             if (needChatSubscription) {
                 const chatSubscriptions = [
            { event: DbCreateSessionRequest.name, handler: handleDbCreateSessionRequest },
            { event: DbGetSessionRequest.name, handler: handleDbGetSessionRequest },
            { event: DbAddMessageRequest.name, handler: handleDbAddMessageRequest },
            { event: DbUpdateMessageRequest.name, handler: handleDbUpdateMessageRequest },
            { event: DbDeleteMessageRequest.name, handler: handleDbDeleteMessageRequest },
            { event: DbUpdateStatusRequest.name, handler: handleDbUpdateStatusRequest },
            { event: DbToggleStarRequest.name, handler: handleDbToggleStarRequest },
            { event: DbGetAllSessionsRequest.name, handler: handleDbGetAllSessionsRequest },
            { event: DbGetStarredSessionsRequest.name, handler: handleDbGetStarredSessionsRequest },
            { event: DbDeleteSessionRequest.name, handler: handleDbDeleteSessionRequest },
            { event: DbRenameSessionRequest.name, handler: handleDbRenameSessionRequest }
        ];
                 chatSubscriptions.forEach(({ event, handler }) => eventBus.subscribe(event, handler));
                 initLogger.debug('Chat event bus subscriptions complete', { count: chatSubscriptions.length });
             } else {
                 initLogger.debug('Chat event bus subscriptions already exist.');
             }

            // Subscribe to Log events
            const logEventNames = [
                 DbAddLogRequest.name,
                 DbGetLogsRequest.name,
                 DbGetUniqueLogValuesRequest.name,
                 DbClearLogsRequest.name,
                 DbGetCurrentAndLastLogSessionIdsRequest.name
             ];
             const needLogSubscription = logEventNames.some(name => !currentSubscriptions[name]);

             if (needLogSubscription) {
                 const logSubscriptions = [
                     { event: DbAddLogRequest.name, handler: handleDbAddLogRequest },
                     { event: DbGetLogsRequest.name, handler: handleDbGetLogsRequest },
                     { event: DbGetUniqueLogValuesRequest.name, handler: handleDbGetUniqueLogValuesRequest },
                     { event: DbClearLogsRequest.name, handler: handleDbClearLogsRequest },
                     { event: DbGetCurrentAndLastLogSessionIdsRequest.name, handler: handleDbGetCurrentAndLastLogSessionIdsRequest }
                 ];
                 logSubscriptions.forEach(({ event, handler }) => eventBus.subscribe(event, handler));
                 initLogger.info('Subscribed to Log Database events', { count: logSubscriptions.length });
             } else {
                 initLogger.info('Log Database event subscriptions already exist.');
             }

        dbReadyResolve(true);
            initLogger.info('Initialization complete for both databases');
        await eventBus.publish(DbInitializationCompleteNotification.name, new DbInitializationCompleteNotification({ success: true }));
        } else {
            // Should not happen if logic is correct, but indicates partial init
            initLogger.warn('Initialization partially complete, something went wrong.');
        }

        // --- Run Log Pruning on Startup (with a delay) ---
        if (isDbInitialized && isLogDbInitialized) {
            setTimeout(async () => {
                initLogger.info('Running startup log pruning (delayed)...');
                initLogger.debug('Current/Previous IDs for pruning', { current: currentExtensionSessionId, previous: previousExtensionSessionId });
                try {
                     const currentId = currentExtensionSessionId;
                     const previousId = previousExtensionSessionId; 

                     if (!currentId) {
                         initLogger.warn('Cannot prune logs, currentExtensionSessionId is not set!');
                     } else {
                         // Proceed with pruning only if currentId exists
                         initLogger.debug('Attempting to get all unique log session IDs...');
                         const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
                         initLogger.debug('Found unique log session IDs in DB', { ids: allLogSessionIds });
                         
                         const sessionsToKeep = new Set();
                         sessionsToKeep.add(currentId);
                         if (previousId) sessionsToKeep.add(previousId);
                         initLogger.debug('Session IDs to keep', { ids: Array.from(sessionsToKeep) });

                         const sessionIdsToDelete = Array.from(allLogSessionIds).filter(id => !sessionsToKeep.has(id));
                         initLogger.debug('Session IDs to delete', { ids: sessionIdsToDelete });

                         if (sessionIdsToDelete.length > 0) {
                             initLogger.info(`Attempting to clear logs for ${sessionIdsToDelete.length} old session(s).`);
                             const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
                             initLogger.info(`Startup pruning removed ${deletedCount} logs from old session(s).`);
                         } else {
                             initLogger.info('No old log sessions found to prune during startup.');
                         }
                     }
                } catch (pruneError) {
                    // Simplified error logging
                    console.error('[DB:Initialize] Error during startup log pruning:', pruneError);
                     // Log error but continue - pruning failure shouldn't block app init
                }
            }, 100); // Delay pruning by 100ms
        }
        // --- End Log Pruning ---

    } catch (error) {
        // Add simple string log first
        console.error("[DB:Initialize] Entered CATCH block for init error.");
        // Log specific properties if possible
        console.error("[DB:Initialize] Raw Error Name:", error?.name);
        console.error("[DB:Initialize] Raw Error Message:", error?.message);
        // Log the raw original error object
        console.error("[DB:Initialize] CAUGHT RAW ERROR OBJECT during init:", error); // Keep this one too

        // Then proceed with the AppError wrapping and logging
        const appError = error instanceof AppError ? error : new AppError('INIT_FAILED', 'Database initialization failed', { originalError: error });
        initLogger.error('Initialization failed', { error: appError, details: error }); // Log the wrapped AppError

        if (RESET_DB_ON_ERROR) {
            try {
                await resetDatabase();
                initLogger.info('Attempting reinitialization after reset');
                await handleInitializeRequest(event); // Retry initialization
                return;
            } catch (resetError) {
                initLogger.error('Reinitialization after reset failed', { error: resetError });
            }
        }

        isDbInitialized = false;
        isLogDbInitialized = false;
        dbReadyResolve(false); 
        await eventBus.publish(DbInitializationCompleteNotification.name, new DbInitializationCompleteNotification({ success: false, error: appError }));
    }
}

// Generate unique message ID
function generateMessageId(chatId) {
    if (!chatId || typeof chatId !== 'string') {
        throw new AppError('INVALID_INPUT', 'Chat ID must be a non-empty string');
    }
    return `${chatId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Sanitize input to prevent injection
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '');
}

// Internal database operations
async function createChatSessionInternal(initialMessage) {
    const opLogger = new Logger('CreateSession');
    opLogger.debug('Creating new chat session', { initialMessage });

    const collection = await ensureDbReady();
    if (!initialMessage || !initialMessage.text) {
        throw new AppError('INVALID_INPUT', 'Initial message with text is required');
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

    opLogger.debug('Inserting session', { sessionId });
    const newSessionDoc = await withTimeout(collection.insert(sessionData), 3000);
    opLogger.info('Session created', { sessionId });

    await publishSessionUpdateNotificationInternal(sessionId);
    return newSessionDoc;
}

async function getChatSessionByIdInternal(sessionId) {
    const opLogger = new Logger('GetSession');
    opLogger.debug('Getting session', { sessionId });

    if (!sessionId) {
        throw new AppError('INVALID_INPUT', 'Session ID is required');
    }

    const collection = await ensureDbReady();
    const doc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
    if (!doc) {
        opLogger.info('Session not found', { sessionId });
        return null;
    }

    opLogger.debug('Session retrieved', { sessionId });
    return doc;
}

async function addMessageToChatInternal(chatId, messageObject) {
    const opLogger = new Logger('AddMessage');
    opLogger.debug('Adding message', { chatId });

    if (!chatId || !messageObject || !messageObject.text) {
        throw new AppError('INVALID_INPUT', 'Chat ID and message with text are required');
        }

    const collection = await ensureDbReady();
    const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3000);
        if (!chatDoc) {
        throw new AppError('NOT_FOUND', `Chat session ${chatId} not found`);
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
    opLogger.info('Message added', { chatId, messageId: newMessage.messageId });

    return { updatedDoc, newMessageId: newMessage.messageId };
}

async function updateMessageInChatInternal(chatId, messageId, updates) {
    const opLogger = new Logger('UpdateMessage');
    opLogger.debug('Updating message', { chatId, messageId });

    if (!chatId || !messageId || !updates || !updates.text) {
        throw new AppError('INVALID_INPUT', 'Chat ID, message ID, and updates with text are required');
        }

    const collection = await ensureDbReady();
    const chatDoc = await withTimeout(collection.findOne(chatId).exec(), 3000);
        if (!chatDoc) {
        throw new AppError('NOT_FOUND', `Chat session ${chatId} not found`);
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
        throw new AppError('NOT_FOUND', `Message ${messageId} not found in chat ${chatId}`);
    }

    opLogger.info('Message updated', { chatId, messageId });
    await publishSessionUpdateNotificationInternal(chatId);
    return updatedDoc;
        }
        
async function deleteMessageFromChatInternal(sessionId, messageId) {
    const opLogger = new Logger('DeleteMessage');
    opLogger.debug('Deleting message', { sessionId, messageId });

    if (!sessionId || !messageId) {
        throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
    }

    const collection = await ensureDbReady();
    const sessionDoc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
    if (!sessionDoc) {
        throw new AppError('NOT_FOUND', `Session ${sessionId} not found`);
    }

    const initialLength = sessionDoc.messages.length;
    const updatedMessages = sessionDoc.messages.filter(msg => msg.messageId !== messageId);
    if (updatedMessages.length === initialLength) {
        opLogger.info('Message not found', { sessionId, messageId });
        return { updatedDoc: sessionDoc, deleted: false };
    }

    const updatedDoc = await withTimeout(
        sessionDoc.incrementalPatch({ messages: updatedMessages }),
        3000
    );
    opLogger.info('Message deleted', { sessionId, messageId });

    await publishSessionUpdateNotificationInternal(sessionId);
    return { updatedDoc, deleted: true };
}

async function updateSessionStatusInternal(sessionId, newStatus) {
    const opLogger = new Logger('UpdateStatus');
    opLogger.debug('Updating status', { sessionId, newStatus });

    const validStatuses = ['idle', 'processing', 'complete', 'error'];
    if (!sessionId || !validStatuses.includes(newStatus)) {
        throw new AppError('INVALID_INPUT', `Invalid session ID or status: ${newStatus}`);
        }

    const collection = await ensureDbReady();
    const chatDoc = await withTimeout(collection.findOne(sessionId).exec(), 3000);
    if (!chatDoc) {
        throw new AppError('NOT_FOUND', `Session ${sessionId} not found`);
    }

    const updatedDoc = await withTimeout(
        chatDoc.incrementalPatch({ status: newStatus }),
        3000
    );
    opLogger.info('Status updated', { sessionId, newStatus });

    await publishSessionUpdateNotificationInternal(sessionId);
    return updatedDoc;
}

async function toggleItemStarredInternal(itemId) {
    const opLogger = new Logger('ToggleStar');
    opLogger.debug('Toggling starred status', { itemId });

    if (!itemId) {
        throw new AppError('INVALID_INPUT', 'Item ID is required');
    }

    const collection = await ensureDbReady();
    const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
        if (!entryDoc) {
        throw new AppError('NOT_FOUND', `Item ${itemId} not found`);
    }

    const currentStarredStatus = entryDoc.get('isStarred') || false;
    const updatedDoc = await withTimeout(
        entryDoc.incrementalPatch({ isStarred: !currentStarredStatus }),
        3000
    );
    opLogger.info('Starred status toggled', { itemId, isStarred: !currentStarredStatus });

    await publishSessionUpdateNotificationInternal(itemId);
    return updatedDoc;
}

async function deleteHistoryItemInternal(itemId) {
    const opLogger = new Logger('DeleteHistory');
    opLogger.debug('Deleting history item', { itemId });

    if (!itemId) {
        throw new AppError('INVALID_INPUT', 'Item ID is required');
    }

    const collection = await ensureDbReady();
    const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
    if (!entryDoc) {
        opLogger.info('Item not found', { itemId });
        return false;
    }

    await withTimeout(entryDoc.remove(), 3000);
    opLogger.info('Item deleted', { itemId });

    await publishSessionUpdateNotificationInternal(itemId);
    return true;
}

async function renameHistoryItemInternal(itemId, newTitle) {
    const opLogger = new Logger('RenameHistory');
    opLogger.debug('Renaming history item', { itemId, newTitle });

    if (!itemId || !newTitle) {
        throw new AppError('INVALID_INPUT', 'Item ID and new title are required');
        }

    const collection = await ensureDbReady();
    const entryDoc = await withTimeout(collection.findOne(itemId).exec(), 3000);
    if (!entryDoc) {
        throw new AppError('NOT_FOUND', `Item ${itemId} not found`);
    }

    const updatedDoc = await withTimeout(
        entryDoc.incrementalPatch({ title: sanitizeInput(newTitle) }),
        3000
    );
    opLogger.info('Item renamed', { itemId, newTitle });

    await publishSessionUpdateNotificationInternal(itemId);
    return updatedDoc;
}

async function getAllSessionsInternal() {
    const opLogger = new Logger('GetAllSessions');
    opLogger.debug('Getting all sessions');

    const collection = await ensureDbReady();
    const sessionsDocs = await withTimeout(
        collection.find().sort({ timestamp: 'desc' }).exec(),
        5000
    );
    
    // Convert RxDocuments to plain JSON objects before returning
    const plainSessions = sessionsDocs.map(doc => doc.toJSON());

    opLogger.info('Retrieved sessions', { count: plainSessions.length });

    return plainSessions; // Return array of plain objects
}

async function getStarredSessionsInternal() {
    const opLogger = new Logger('GetStarredSessions');
    opLogger.debug('Getting starred sessions');

    const collection = await ensureDbReady();
    const sessions = await withTimeout(
        collection.find({ selector: { isStarred: true } }).sort({ timestamp: 'desc' }).exec(),
        5000
    );
    opLogger.info('Retrieved starred sessions', { count: sessions.length });

    return sessions;
    }

// Modified to send only the specific updated session data
// Added updateType parameter for context (optional but good practice)
async function publishSessionUpdateNotificationInternal(sessionId, updateType = 'update') { 
    const opLogger = new Logger('SessionUpdate');
    opLogger.debug(`Attempting to publish session update for ${sessionId}, type: ${updateType}`);
    try {
        // Ensure the DB is ready
        await ensureDbReady();

        // Fetch ONLY the data for the updated session
        const updatedSessionDoc = await getChatSessionByIdInternal(sessionId);

        if (!updatedSessionDoc) {
            opLogger.error('Session not found after update, cannot publish notification', { sessionId });
            return; // Cannot publish if the session doesn't exist
        }

        // Get the plain JS object representation
        const updatedSessionData = updatedSessionDoc.toJSON ? updatedSessionDoc.toJSON() : updatedSessionDoc;
        
        opLogger.info(`Publishing session update notification for ${sessionId}`); 
        
        // Publish the notification with the single session data and update type
        await eventBus.publish(
            DbSessionUpdatedNotification.name, 
            new DbSessionUpdatedNotification(sessionId, updatedSessionData, updateType)
        );
        opLogger.debug('Session update published', { sessionId, updateType });
    } catch (error) {
        opLogger.error('Failed to publish session update', { sessionId, error });
    }
}

// Event handlers
async function handleDbCreateSessionRequest(event) {
    const opLogger = new Logger('CreateSessionHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling session creation', { requestId });

    try {
        if (!event?.requestId || !event?.payload?.initialMessage || !event.payload.initialMessage.text) {
            throw new AppError('INVALID_INPUT', 'Missing requestId, initialMessage, or message text');
        }

        const newSessionDoc = await withTimeout(createChatSessionInternal(event.payload.initialMessage), 5000);
        if (!newSessionDoc?.id) {
            throw new AppError('INVALID_DOCUMENT', 'Invalid session document returned');
        }

        await withTimeout(Promise.all([
            eventBus.publish(
                DbMessagesUpdatedNotification.name,
                new DbMessagesUpdatedNotification(newSessionDoc.id, newSessionDoc.messages)
            ),
            eventBus.publish(
                DbStatusUpdatedNotification.name,
                new DbStatusUpdatedNotification(newSessionDoc.id, newSessionDoc.status)
            )
        ]), 3000);

        const response = new DbCreateSessionResponse(requestId, true, newSessionDoc.id);
        console.log(`[DB:${opLogger.module}] PRE-PUBLISH Check (Success Path): ReqID ${requestId}, Response Success: ${response?.success}, Response Type: ${response?.type}`);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Session created successfully', { requestId, sessionId: newSessionDoc.id });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to create session', { originalError: error });
        const response = new DbCreateSessionResponse(requestId, false, null, appError);
        console.log(`[DB:${opLogger.module}] PRE-PUBLISH Check (Error Path): ReqID ${requestId}, Response Success: ${response?.success}, Response Type: ${response?.type}`);
        // Use try/catch for final publish just in case eventBus fails catastrophically
        try {
             await withTimeout(eventBus.publish(response.type, response), 3000);
        } catch (publishError) {
             opLogger.error('FATAL: Failed even to publish error response!', { requestId, publishError });
        }
        opLogger.error('Session creation failed', { requestId, error: appError });
    }
}

async function handleDbGetSessionRequest(event) {
    const opLogger = new Logger('GetSessionHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling get session', { requestId });

    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }

        const doc = await withTimeout(getChatSessionByIdInternal(event.payload.sessionId), 5000);
        const response = new DbGetSessionResponse(requestId, true, doc ? doc.toJSON() : null);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Session retrieved', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get session', { originalError: error });
        const response = new DbGetSessionResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Get session failed', { requestId, error: appError });
    }
}

async function handleDbAddMessageRequest(event) {
    const opLogger = new Logger('AddMessageHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling add message', { requestId });

    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageObject || !event.payload.messageObject.text) {
            throw new AppError('INVALID_INPUT', 'Session ID and message with text are required');
        }

        const { updatedDoc, newMessageId } = await withTimeout(
            addMessageToChatInternal(event.payload.sessionId, event.payload.messageObject),
            5000
        );

        // ADD this notification - needed by ChatRenderer
        // Pass the updated messages array from the document (or its JSON representation)
        const plainMessages = updatedDoc.messages.map(m => m.toJSON ? m.toJSON() : m); // Ensure plain messages
        await withTimeout(
            eventBus.publish(
                DbMessagesUpdatedNotification.name,
                new DbMessagesUpdatedNotification(updatedDoc.id, plainMessages)
            ),
            3000
        );

        const response = new DbAddMessageResponse(requestId, true, newMessageId);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Message added', { requestId, sessionId: event.payload.sessionId, messageId: newMessageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to add message', { originalError: error });
        const response = new DbAddMessageResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Add message failed', { requestId, error: appError });
    }
}

async function handleDbUpdateMessageRequest(event) {
    const opLogger = new Logger('UpdateMessageHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling update message', { requestId });

    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageId || !event?.payload?.updates || !event.payload.updates.text) {
            throw new AppError('INVALID_INPUT', 'Session ID, message ID, and updates with text are required');
        }

        const updatedDoc = await withTimeout(
            updateMessageInChatInternal(event.payload.sessionId, event.payload.messageId, event.payload.updates),
            5000
        );
        await withTimeout(
            eventBus.publish(
                DbMessagesUpdatedNotification.name,
                new DbMessagesUpdatedNotification(updatedDoc.id, updatedDoc.messages)
            ),
            3000
        );
        const response = new DbUpdateMessageResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Message updated', { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to update message', { originalError: error });
        const response = new DbUpdateMessageResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Update message failed', { requestId, error: appError });
    }
}

async function handleDbDeleteMessageRequest(event) {
    const opLogger = new Logger('DeleteMessageHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling delete message', { requestId });

    try {
        if (!event?.payload?.sessionId || !event?.payload?.messageId) {
            throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
        }

        const { updatedDoc, deleted } = await withTimeout(
            deleteMessageFromChatInternal(event.payload.sessionId, event.payload.messageId),
            5000
        );
        if (deleted) {
            await withTimeout(
                eventBus.publish(
                    DbMessagesUpdatedNotification.name,
                    new DbMessagesUpdatedNotification(updatedDoc.id, updatedDoc.messages)
                ),
                3000
            );
        }
        const response = new DbDeleteMessageResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Message deleted', { requestId, sessionId: event.payload.sessionId, messageId: event.payload.messageId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to delete message', { originalError: error });
        const response = new DbDeleteMessageResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Delete message failed', { requestId, error: appError });
    }
}

async function handleDbUpdateStatusRequest(event) {
    const opLogger = new Logger('UpdateStatusHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling update status', { requestId });

    try {
        if (!event?.payload?.sessionId || !event?.payload?.status) {
            throw new AppError('INVALID_INPUT', 'Session ID and status are required');
        }

        const updatedDoc = await withTimeout(
            updateSessionStatusInternal(event.payload.sessionId, event.payload.status),
            5000
        );
        await withTimeout(
            eventBus.publish(
                DbStatusUpdatedNotification.name,
                new DbStatusUpdatedNotification(updatedDoc.id, updatedDoc.status)
            ),
            3000
        );
        const response = new DbUpdateStatusResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Status updated', { requestId, sessionId: event.payload.sessionId, status: event.payload.status });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to update status', { originalError: error });
        const response = new DbUpdateStatusResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Update status failed', { requestId, error: appError });
    try {
            await withTimeout(
                eventBus.publish(
                    DbStatusUpdatedNotification.name,
                    new DbStatusUpdatedNotification(event.payload.sessionId, 'error')
                ),
                3000
            );
        } catch (notificationError) {
            opLogger.error('Failed to publish error status notification', { requestId, error: notificationError });
        }
    }
}

async function handleDbToggleStarRequest(event) {
    const opLogger = new Logger('ToggleStarHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling toggle star', { requestId });

    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }

        const updatedDoc = await withTimeout(toggleItemStarredInternal(event.payload.sessionId), 5000);
        const response = new DbToggleStarResponse(requestId, true, updatedDoc.toJSON());
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Star toggled', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to toggle star', { originalError: error });
        const response = new DbToggleStarResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Toggle star failed', { requestId, error: appError });
    }
}

async function handleDbGetAllSessionsRequest(event) {
    const opLogger = new Logger('GetAllSessionsHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling get all sessions', { requestId });

    try {
        // This returns plain objects with {id, title, timestamp, isStarred, ...}
        const sessionsRaw = await withTimeout(getAllSessionsInternal(), 5000);
        
        // Remove the unnecessary mapping. Just sort the raw plain objects.
        const sortedSessions = sessionsRaw.sort((a, b) => b.timestamp - a.timestamp); // Sort by original timestamp

        opLogger.debug('Using plain sessions directly', { count: sortedSessions.length });
        
        // Pass the sorted plain session objects directly to the response constructor
        const response = new DbGetAllSessionsResponse(requestId, true, sortedSessions);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Sessions retrieved', { requestId, count: sortedSessions.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get all sessions', { originalError: error });
        const response = new DbGetAllSessionsResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Get all sessions failed', { requestId, error: appError });
    }
}

async function handleDbGetStarredSessionsRequest(event) {
    const opLogger = new Logger('GetStarredSessionsHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling get starred sessions', { requestId });

    try {
        const sessionsRaw = await withTimeout(getStarredSessionsInternal(), 5000);
        const starredSessions = sessionsRaw.map(s => ({
            sessionId: s.id,
            name: s.title,
            lastUpdated: s.timestamp,
            isStarred: s.isStarred
        })).sort((a, b) => b.lastUpdated - a.lastUpdated);

        opLogger.debug('Retrieved starred sessions', { count: starredSessions.length });
        const response = new DbGetStarredSessionsResponse(requestId, true, starredSessions);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Starred sessions retrieved', { requestId, count: starredSessions.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get starred sessions', { originalError: error });
        const response = new DbGetStarredSessionsResponse(requestId, false, null, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Get starred sessions failed', { requestId, error: appError });
    }
}

async function handleDbDeleteSessionRequest(event) {
    const opLogger = new Logger('DeleteSessionHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling delete session', { requestId });

    try {
        if (!event?.payload?.sessionId) {
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        }

        const deleted = await withTimeout(deleteHistoryItemInternal(event.payload.sessionId), 5000);
        const response = new DbDeleteSessionResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Session deleted', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to delete session', { originalError: error });
        const response = new DbDeleteSessionResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Delete session failed', { requestId, error: appError });
    }
}

async function handleDbRenameSessionRequest(event) {
    const opLogger = new Logger('RenameSessionHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    opLogger.info('Handling rename session', { requestId });

    try {
        if (!event?.payload?.sessionId || !event?.payload?.newName) {
            throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
        }

        const updatedDoc = await withTimeout(
            renameHistoryItemInternal(event.payload.sessionId, event.payload.newName),
            5000
        );
        const response = new DbRenameSessionResponse(requestId, true);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.info('Session renamed', { requestId, sessionId: event.payload.sessionId });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to rename session', { originalError: error });
        const response = new DbRenameSessionResponse(requestId, false, appError);
        await withTimeout(eventBus.publish(response.type, response), 3000);
        opLogger.error('Rename session failed', { requestId, error: appError });
    }
}

// --- Log Event Handlers ---

// Fire-and-forget handler for adding logs
async function handleDbAddLogRequest(event) {
    const opLogger = new Logger('AddLogHandler');
    try {
        if (!event?.payload?.logEntryData) {
            throw new AppError('INVALID_INPUT', 'Missing logEntryData in payload');
        }
        
        // Directly insert the log using the logsCollection
        const collection = await ensureDbReady('log');
        await withTimeout(collection.insert(event.payload.logEntryData), 3000); 
        opLogger.debug('Log entry added successfully', { logId: event.payload.logEntryData.id });

        // No response needed for this fire-and-forget operation
    } catch (error) {
        // Log error internally, but don't try to send a response
        opLogger.error('Failed to handle add log request', { requestId: event?.requestId, error });
    }
}

async function handleDbGetLogsRequest(event) {
    const opLogger = new Logger('GetLogsHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    try {
        if (!event?.payload?.filters) {
            throw new AppError('INVALID_INPUT', 'Missing filters in payload');
        }
        const logs = await getLogsInternal(event.payload.filters);
        const response = new DbGetLogsResponse(requestId, true, logs);
        await eventBus.publish(response.type, response);
        opLogger.info('Log retrieval successful', { requestId, count: logs.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get logs', { originalError: error });
        const response = new DbGetLogsResponse(requestId, false, null, appError);
        await eventBus.publish(response.type, response); // Publish error response
        opLogger.error('Get logs failed', { requestId, error: appError });
    }
}

async function handleDbGetUniqueLogValuesRequest(event) {
    const opLogger = new Logger('GetUniqueLogValuesHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    try {
        if (!event?.payload?.fieldName) {
            throw new AppError('INVALID_INPUT', 'Missing fieldName in payload');
        }
        const values = await getUniqueLogValuesInternal(event.payload.fieldName);
        const response = new DbGetUniqueLogValuesResponse(requestId, true, values);
        await eventBus.publish(response.type, response);
        opLogger.info('Unique value retrieval successful', { requestId, field: event.payload.fieldName, count: values.length });
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to get unique log values', { originalError: error });
        const response = new DbGetUniqueLogValuesResponse(requestId, false, null, appError);
        await eventBus.publish(response.type, response); // Publish error response
        opLogger.error('Get unique log values failed', { requestId, error: appError });
    }
}

async function handleDbClearLogsRequest(event) {
    const opLogger = new Logger('ClearLogsHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    try {
        // For now, assume filter='all' means clear *all* logs except current/last session
        // This might need refinement based on how filter payload is defined/used.
        // Let's stick to the pruning logic: clear logs NOT matching current/last.
        opLogger.info('ClearLogs request received. Performing pruning of non-current/last sessions.');
        
        const allLogSessionIds = await getAllUniqueLogSessionIdsInternal();
        const sessionsToKeep = new Set();
        if (currentExtensionSessionId) sessionsToKeep.add(currentExtensionSessionId);
        if (previousExtensionSessionId) sessionsToKeep.add(previousExtensionSessionId);
        const sessionIdsToDelete = Array.from(allLogSessionIds).filter(id => !sessionsToKeep.has(id));

        if (sessionIdsToDelete.length > 0) {
            const { deletedCount } = await clearLogsInternal(sessionIdsToDelete);
            opLogger.info(`ClearLogs request resulted in pruning ${deletedCount} logs from old sessions.`);
        } else {
             opLogger.info('ClearLogs request found no old sessions to prune.');
        }
        
        const response = new DbClearLogsResponse(requestId, true);
        await eventBus.publish(response.type, response);
        
    } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('UNKNOWN', 'Failed to clear logs', { originalError: error });
        const response = new DbClearLogsResponse(requestId, false, appError);
        await eventBus.publish(response.type, response); // Publish error response
        opLogger.error('Clear logs failed', { requestId, error: appError });
    }
}

async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
    const opLogger = new Logger('GetCurrentAndLastIdsHandler');
    const requestId = event?.requestId || crypto.randomUUID();
    try {
        // These IDs should be available as module variables now
        const ids = {
             currentLogSessionId: currentExtensionSessionId,
             previousLogSessionId: previousExtensionSessionId // This might be null if it's the first run
        };
        const response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, true, ids);
        await eventBus.publish(response.type, response);
        opLogger.info('Current/Last session ID retrieval successful', { requestId });
    } catch (error) { // Should realistically not error here, but good practice
        const appError = new AppError('UNKNOWN', 'Failed to get current/last log session IDs', { originalError: error });
        const response = new DbGetCurrentAndLastLogSessionIdsResponse(requestId, false, null, appError);
        await eventBus.publish(response.type, response);
        opLogger.error('Get current/last log session IDs failed', { requestId, error: appError });
    }
}

// --- End Log Event Handlers ---

// Subscribe to initialization
eventBus.subscribe(DbInitializeRequest.name, handleInitializeRequest);
logger.info('Subscribed to DbInitializeRequest');

// Internal database operations (Chat History - Existing)
// ... rest of existing code ...

// Internal helper to get all unique extensionSessionId values from logs
async function getAllUniqueLogSessionIdsInternal() {
    const opLogger = new Logger('GetUniqueLogSessionIds');
    opLogger.debug('Starting retrieval of unique session IDs...');
    const collection = await ensureDbReady('log');
    opLogger.debug('Log collection ensured ready.');

    // Use RxDB's methods if possible, otherwise query all and process
    // RxDB doesn't have a direct 'distinct' query. We fetch all docs or specific field.
    try {
        opLogger.debug('Executing find().select(extensionSessionId).exec()...');
        const results = await collection.find().exec();
        opLogger.debug(`Found ${results.length} log documents.`);
        
        const uniqueIds = new Set(results.map(doc => doc.get('extensionSessionId')));
        opLogger.debug('Unique session IDs calculated', { count: uniqueIds.size });
        return uniqueIds; // Return the Set directly
    } catch (error) {
        opLogger.error('Error during find().select().exec() for unique session IDs', { error });
        throw new AppError('DB_QUERY_FAILED', 'Failed to retrieve unique log session IDs', { originalError: error });
    }
}

// Internal helper to get unique values for a given field (e.g., component, level)

// Internal helper to clear logs
async function clearLogsInternal(sessionIdsToDelete) {
    const opLogger = new Logger('ClearLogs');
    opLogger.info('ClearLogs request received. Performing pruning of non-current/last sessions.');
    
    const collection = await ensureDbReady('log');
    opLogger.debug('Log collection ensured ready.');

    const results = await collection.find().exec();
    opLogger.debug(`Found ${results.length} log documents.`);
    
    const filteredResults = results.filter(doc => {
        const sessionId = doc.get('extensionSessionId');
        return sessionId && !sessionIdsToDelete.includes(sessionId);
    });

    opLogger.debug(`Filtered results count: ${filteredResults.length}`);

    const deletedCount = filteredResults.length;
    await withTimeout(collection.bulkRemove(filteredResults), 3000);
    opLogger.info(`ClearLogs request resulted in pruning ${deletedCount} logs from old sessions.`);

    return { deletedCount };
}