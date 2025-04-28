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

const logger = new Logger('Main');

// Database state
let db = null;
let chatHistoryCollection = null;
let isDbInitialized = false;
let dbReadyResolve;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });

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

// Ensure database is ready
async function ensureDbReady() {
    const isReady = await withTimeout(dbReadyPromise, 5000, 'Database initialization timeout');
    if (!isReady || !chatHistoryCollection) {
        throw new AppError('DB_NOT_READY', 'Database not initialized');
    }
    return chatHistoryCollection;
}

// Reset database (for development)
async function resetDatabase() {
    const resetLogger = new Logger('Reset');
    resetLogger.info('Resetting database due to initialization failure');
    try {
        if (db) {
            await db.destroy();
            resetLogger.debug('Existing database destroyed');
        }
        await getRxStorageDexie().getDexieDb().delete();
        resetLogger.info('Dexie database deleted');
        db = null;
        chatHistoryCollection = null;
        isDbInitialized = false;
        dbReadyResolve(false);
    } catch (error) {
        // Log the raw reset error
        console.error("[DB:Reset] CAUGHT RAW ERROR during reset:", error);
        resetLogger.error('Failed to reset database', { error });
        throw new AppError('RESET_FAILED', 'Could not reset database', { originalError: error });
    }
}

// Initialize database
async function handleInitializeRequest(event) {
    const initLogger = new Logger('Initialize');
    initLogger.info('Handling initialize request');
    if (isDbInitialized) {
        initLogger.info('Already initialized, skipping');
        return; 
    }
    
    try {
        addRxPlugin(RxDBQueryBuilderPlugin);
        addRxPlugin(RxDBMigrationSchemaPlugin);
        addRxPlugin(RxDBUpdatePlugin);

        db = await withTimeout(createRxDatabase({
            name: 'tabagentdb',
            storage: getRxStorageDexie()
        }), 10000);
        initLogger.debug('Database created', { name: db.name });

        const collections = await db.addCollections({
            chatHistory: {
                schema: chatHistorySchema
            }
        });
        chatHistoryCollection = collections.chatHistory;
        initLogger.debug('Chat history collection initialized');

        // Subscribe to events
        const subscriptions = [
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
        subscriptions.forEach(({ event, handler }) => eventBus.subscribe(event, handler));
        initLogger.debug('Event bus subscriptions complete', { count: subscriptions.length });

        isDbInitialized = true;
        dbReadyResolve(true);
        initLogger.info('Initialization complete');
        await eventBus.publish(DbInitializationCompleteNotification.name, new DbInitializationCompleteNotification({ success: true }));
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

// Subscribe to initialization
eventBus.subscribe(DbInitializeRequest.name, handleInitializeRequest);
logger.info('Subscribed to DbInitializeRequest');