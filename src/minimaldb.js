// --- Imports ---
import browser from 'webextension-polyfill';
import {
  DbCreateSessionRequest,
  DbCreateSessionResponse,
  DbGetSessionRequest,
  DbGetSessionResponse,
  DbAddMessageRequest,
  DbAddMessageResponse,
  DbUpdateMessageRequest,
  DbUpdateMessageResponse,
  DbDeleteMessageRequest,
  DbDeleteMessageResponse,
  DbUpdateStatusRequest,
  DbUpdateStatusResponse,
  DbToggleStarRequest,
  DbToggleStarResponse,
  DbGetAllSessionsRequest,
  DbGetAllSessionsResponse,
  DbMessagesUpdatedNotification,
  DbStatusUpdatedNotification,
  DbSessionUpdatedNotification,
  DbInitializeRequest,
  DbDeleteSessionRequest,
  DbDeleteSessionResponse,
  DbRenameSessionRequest,
  DbRenameSessionResponse,
  DbGetStarredSessionsRequest,
  DbGetStarredSessionsResponse,
  DbGetReadyStateRequest,
  DbGetReadyStateResponse,
  DbResetDatabaseRequest,
  DbResetDatabaseResponse,
  DbAddModelAssetRequest,
  DbAddModelAssetResponse,
  DbCountModelAssetChunksRequest,
  DbCountModelAssetChunksResponse,
  DbLogAllChunkGroupIdsForModelRequest,
  DbLogAllChunkGroupIdsForModelResponse,
  DbListModelFilesRequest,
  DbListModelFilesResponse,
  DbGetModelAssetChunksRequest,
  DbGetModelAssetChunksResponse,
  DbGetModelAssetChunkRequest,
  DbGetModelAssetChunkResponse,
  DbEnsureInitializedRequest,
  DbEnsureInitializedResponse,
  DbAddLogRequest,
  DbGetLogsRequest,
  DbGetLogsResponse,
  DbGetUniqueLogValuesRequest,
  DbGetUniqueLogValuesResponse,
  DbClearLogsRequest,
  DbClearLogsResponse,
  DbGetCurrentAndLastLogSessionIdsRequest,
  DbGetCurrentAndLastLogSessionIdsResponse,
} from './events/dbEvents.js';
import { DBEventNames, Contexts } from './events/eventNames.js';
import * as dbSchema from './Utilities/dbSchema.js';
import { dbChannel } from './Utilities/dbChannels.js';

// --- Constants ---
const DB_INIT_TIMEOUT = 15000;
const POLL_INTERVAL = 100;
const LOG_THROTTLE_MS = 2000;

// --- State ---
let SQL = null;
let absurdSqlBackendInitialized = false;
let chatDB = null;
let logDB = null;
let modelDB = null;
let isDbInitialized = false;
let isLogDbInitialized = false;
let isModelDbInitialized = false;
let isDbReadyFlag = false;
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;
let dbReadyResolve;
let dbReadyPromise = new Promise((resolve) => {
  dbReadyResolve = resolve;
});
let dbInitPromise = null;
let isDbInitInProgress = false;
let dbWorker = null;
let dbWorkerReady = false;
let dbWorkerRequestId = 0;
let dbWorkerCallbacks = {};

// --- Error Handling ---
class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

// --- Worker Management ---
function getDbWorker() {
  if (!dbWorker) {
    const workerUrl = browser.runtime.getURL('js/absurd-sql-backends/sql-worker.js');
    dbWorker = new Worker(workerUrl, { type: 'module' });
    dbWorker.onmessage = (event) => {
      const { requestId, type, result, error, stack } = event.data;
      if (requestId && dbWorkerCallbacks[requestId]) {
        if (error) {
          let errObj = error;
          if (typeof error === 'string') {
            errObj = new Error(error);
            if (stack) errObj.stack = stack;
          } else if (error instanceof Object && !(error instanceof Error)) {
            errObj = new Error(error.message || 'Worker error object');
            Object.assign(errObj, error);
            if (stack) errObj.stack = stack;
          }
          dbWorkerCallbacks[requestId].reject(errObj);
        } else {
          dbWorkerCallbacks[requestId].resolve(result);
        }
        delete dbWorkerCallbacks[requestId];
      } else if (type === 'debug') {
        // console.log(`[DB Worker Debug] ${event.data.message}`);
      } else if (type === 'fatal') {
        console.error(`[DB Worker Fatal] ${event.data.error}`, event.data.stack);
        Object.values(dbWorkerCallbacks).forEach((cb) =>
          cb.reject(new Error('DB Worker encountered a fatal error'))
        );
        dbWorkerCallbacks = {};
      } else if (type === 'ready') {
        dbWorkerReady = true;
        console.log('[DB] SQL Worker signaled script ready.');
      }
    };
    dbWorker.onerror = (errEvent) => {
      console.error('[DB] Uncaught error in DB Worker:', errEvent.message, errEvent);
      Object.values(dbWorkerCallbacks).forEach((cb) =>
        cb.reject(new Error(`DB Worker crashed: ${errEvent.message || 'Unknown worker error'}`))
      );
      dbWorkerCallbacks = {};
      dbWorker = null;
      dbWorkerReady = false;
      absurdSqlBackendInitialized = false;
    };
  }
  return dbWorker;
}

async function sendDbWorkerRequest(type, payload) {
  console.log(`[Trace][minimaldb] sendDbWorkerRequest: Called with type=${type}, payload=`, payload);
  const worker = getDbWorker();
  if (!dbWorkerReady) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Worker 'ready' signal timeout")), 10000);
      const check = () => {
        if (dbWorkerReady) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
  console.log('[Trace][minimaldb] sendDbWorkerRequest: Posting to worker', { type, payload });
  return new Promise((resolve, reject) => {
    const requestId = (++dbWorkerRequestId).toString();
    dbWorkerCallbacks[requestId] = { resolve, reject };
    worker.postMessage({ requestId, type, payload });
  });
}

// --- Database Initialization ---
async function initializeDatabasesAndBackend(isReset = false) {
  console.log(`[DB] initializeDatabasesAndBackend called (isReset: ${isReset})`);
  getDbWorker();
  const wasmUrl = browser.runtime.getURL('wasm/sql-wasm-debug.wasm');
  const dbFilesToCreate = [
    {
      path: '/sql/chat.db',
      schema:
        dbSchema.CHATS_TABLE_SQL +
        '\n' +
        dbSchema.MESSAGES_TABLE_SQL +
        '\n' +
        dbSchema.CHAT_SUMMARIES_TABLE_SQL,
    },
    { path: '/sql/logs.db', schema: dbSchema.LOG_TABLE_SQL },
    { path: '/sql/models.db', schema: dbSchema.MODEL_ASSET_TABLE_SQL },
    {
      path: '/sql/knowledge.db',
      schema: dbSchema.KNOWLEDGE_GRAPH_EDGES_TABLE_SQL + '\n' + dbSchema.KNOWLEDGE_GRAPH_NODES_TABLE_SQL,
    },
  ];
  const dbFilesAndTables = [
    { path: '/sql/chat.db', tables: ['chats', 'messages', 'chat_summaries'] },
    { path: '/sql/logs.db', tables: ['logs'] },
    { path: '/sql/models.db', tables: ['model_assets'] },
    { path: '/sql/knowledge.db', tables: ['knowledge_graph_edges', 'knowledge_graph_nodes'] },
  ];
  const payload = {
    wasmUrl,
    schema: {
      CHATS_TABLE_SQL: dbSchema.CHATS_TABLE_SQL,
      LOG_TABLE_SQL: dbSchema.LOG_TABLE_SQL,
      MODEL_ASSET_TABLE_SQL: dbSchema.MODEL_ASSET_TABLE_SQL,
      MESSAGES_TABLE_SQL: dbSchema.MESSAGES_TABLE_SQL,
    },
    dbFilesToCreate,
    dbFilesAndTables,
  };
  console.log('[DB] Sending worker init/reset with payload:', payload);
  await sendDbWorkerRequest(
    isReset ? DBEventNames.DB_WORKER_RESET : DBEventNames.DB_INIT_WORKER_REQUEST,
    payload
  );
  absurdSqlBackendInitialized = true;
  isDbInitialized = true;
  isLogDbInitialized = true;
  isModelDbInitialized = true;
  isDbReadyFlag = true;
  if (dbReadyResolve) dbReadyResolve(true);
  dbReadyPromise = Promise.resolve(true);
}

async function handleInitializeRequest(isAutoEnsureCall = false) {
  console.log('[DB] handleInitializeRequest ENTRY', {
    isDbReadyFlag,
    isDbInitialized,
    isLogDbInitialized,
    isModelDbInitialized,
    absurdSqlBackendInitialized,
    SQL_exists: !!SQL,
  });
  if (
    SQL &&
    absurdSqlBackendInitialized &&
    isDbInitialized &&
    isLogDbInitialized &&
    isModelDbInitialized &&
    isDbReadyFlag &&
    !isAutoEnsureCall
  ) {
    return { success: true };
  }
  try {
    const ids = await browser.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
    currentExtensionSessionId = ids.currentLogSessionId || null;
    previousExtensionSessionId = ids.previousLogSessionId || null;
    if (!currentExtensionSessionId) {
      const msg = 'CRITICAL: currentLogSessionId not found in storage during DB init!';
      console.error('[DB] Database:Initialize]', msg);
      if (dbReadyResolve) dbReadyResolve(false);
      dbReadyPromise = new Promise((resolve) => {
        dbReadyResolve = resolve;
      });
      return { success: false, error: msg };
    }
  } catch (storageError) {
    console.error('[DB] Failed to retrieve log session IDs from storage', {
      error: storageError,
      stack: storageError?.stack,
    });
    if (dbReadyResolve) dbReadyResolve(false);
    dbReadyPromise = new Promise((resolve) => {
      dbReadyResolve = resolve;
    });
    return { success: false, error: storageError.message || String(storageError) };
  }
  try {
    await initializeDatabasesAndBackend(false);
    console.log('[DB] Databases initialization complete.');
    return { success: true };
  } catch (error) {
    console.error('[DB] CAUGHT ERROR during initializeDatabasesAndBackend:', error, error?.stack);
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INIT_FAILED', 'Database initialization failed', {
            originalError: error.message,
          });
    isDbInitialized = false;
    isLogDbInitialized = false;
    isModelDbInitialized = false;
    isDbReadyFlag = false;
    absurdSqlBackendInitialized = false;
    if (dbReadyResolve) dbReadyResolve(false);
    dbReadyPromise = new Promise((resolve) => {
      dbReadyResolve = resolve;
    });
    return { success: false, error: appError.message || String(appError) };
  }
}

async function autoEnsureDbInitialized() {
  if (isDbReadyFlag && absurdSqlBackendInitialized) {
    return { success: true };
  }
  if (isDbInitInProgress) {
    return dbInitPromise;
  }
  isDbInitInProgress = true;
  dbInitPromise = (async () => {
    try {
      const response = await handleInitializeRequest(true);
      if (response?.success) {
        return { success: true };
      }
      return { success: false, error: response?.error || 'Database failed to initialize (autoEnsure)' };
    } catch (err) {
      console.error('[DB] autoEnsureDbInitialized -> Initialization failed:', err);
      isDbInitInProgress = false;
      return { success: false, error: err.message || String(err) };
    } finally {
      isDbInitInProgress = false;
    }
  })();
  return dbInitPromise;
}

async function ensureDbReady(type = 'chat') {
  const dbInstanceGetter =
    {
      chat: () => chatDB,
      log: () => logDB,
      model: () => modelDB,
      modelAssets: () => modelDB,
    }[type] || (() => { throw new AppError('INVALID_INPUT', `Unknown DB type requested: ${type}`); });
  const isInitializedFlagGetter =
    {
      chat: () => isDbInitialized,
      log: () => isLogDbInitialized,
      model: () => isModelDbInitialized,
      modelAssets: () => isModelDbInitialized,
    }[type] || (() => false);
  if (!isDbInitInProgress && !(isDbReadyFlag && absurdSqlBackendInitialized)) {
    try {
      await autoEnsureDbInitialized();
    } catch (initError) {
      throttledLog(
        'error',
        `[DB][ensureDbReady] autoEnsureDbInitialized failed for DB type '${type}'`,
        null,
        initError
      );
      throw new AppError('DB_INIT_FAILED', `DB auto-init failed for type '${type}': ${initError.message}`);
    }
  } else if (isDbInitInProgress) {
    await dbInitPromise;
  }
  const start = Date.now();
  let waitingLogged = false;
  while (Date.now() - start < DB_INIT_TIMEOUT) {
    const dbInstance = dbInstanceGetter();
    const isInitializedFlag = isInitializedFlagGetter();
    if (dbInstance && isInitializedFlag && absurdSqlBackendInitialized && isDbReadyFlag) {
      return dbInstance;
    }
    if (!waitingLogged && Date.now() - start > 300) {
      throttledLog(
        'log',
        `[DB][ensureDbReady] Waiting for DB type '${type}'`,
        null,
        `(absurdSqlBackendInitialized: ${absurdSqlBackendInitialized}, isDbReadyFlag: ${isDbReadyFlag}, specific init: ${isInitializedFlag})... elapsed: ${Date.now() - start}ms`
      );
      waitingLogged = true;
    }
    await new Promise((res) => setTimeout(res, POLL_INTERVAL));
  }
  const dbInstance = dbInstanceGetter();
  const isInitializedFlag = isInitializedFlagGetter();
  if (!dbInstance || !isInitializedFlag || !absurdSqlBackendInitialized || !isDbReadyFlag) {
    throttledLog(
      'error',
      `[DB][ensureDbReady] DB for type '${type}' not initialized after ${DB_INIT_TIMEOUT}ms`,
      null,
      `DB: ${!!dbInstance}, InitFlag: ${isInitializedFlag}, AbsurdReady: ${absurdSqlBackendInitialized}, GlobalReady: ${isDbReadyFlag}`
    );
    throw new AppError('DB_NOT_READY', `DB for type '${type}' not initialized after ${DB_INIT_TIMEOUT}ms`);
  }
  return dbInstance;
}

// --- Internal DB Operations ---
async function createChatSessionInternal(initialMessage) {
  if (!initialMessage?.text) {
    return { success: false, error: 'Initial message with text is required' };
  }
  const result = await sendDbWorkerRequest(DbCreateSessionRequest.type, { initialMessage });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to create session' };
  }
  await publishSessionUpdate(result.data.id, 'create', result.data);
  await publishMessagesUpdate(result.data.id, result.data.messages);
  await publishStatusUpdate(result.data.id, result.data.status);
  return { success: true, data: result.data };
}

async function getChatSessionByIdInternal(sessionId) {
  if (!sessionId) {
    return { success: false, error: 'Session ID is required' };
  }
  const result = await sendDbWorkerRequest(DbGetSessionRequest.type, { sessionId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Session ${sessionId} not found` };
  }
  return { success: true, data: result.data };
}

async function addMessageToChatInternal(chatId, messageObject) {
  if (!chatId || !messageObject?.text) {
    return { success: false, error: 'Chat ID and message with text are required' };
  }
  const result = await sendDbWorkerRequest(DbAddMessageRequest.type, { chatId, messageObject });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to add message' };
  }
  await publishSessionUpdate(chatId, 'update', result.data.updatedDoc);
  await publishMessagesUpdate(chatId, result.data.updatedDoc.messages);
  return { success: true, data: result.data };
}

async function updateMessageInChatInternal(chatId, messageId, updates) {
  if (!chatId || !messageId || !updates || (!updates.text && typeof updates.isLoading === 'undefined')) {
    return {
      success: false,
      error: 'Chat ID, message ID, and updates (with text or isLoading) are required',
    };
  }
  const result = await sendDbWorkerRequest(DbUpdateMessageRequest.type, {
    chatId,
    messageId,
    updates,
  });
  console.log('[minimaldb] updateMessageInChatInternal result:', result);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to update message' };
  }
  await publishSessionUpdate(chatId, 'update', result.data);
  await publishMessagesUpdate(chatId, result.data.messages);
  return { success: true, data: result.data };
}

async function deleteMessageFromChatInternal(sessionId, messageId) {
  if (!sessionId || !messageId) {
    return { success: false, error: 'Session ID and message ID are required' };
  }
  const result = await sendDbWorkerRequest(DbDeleteMessageRequest.type, { sessionId, messageId });
  if (!result?.success) {
    return {
      success: false,
      error: result?.error || `Failed to delete message ${messageId} from session ${sessionId}`,
    };
  }
  await publishSessionUpdate(sessionId, 'update', result.data.updatedDoc);
  await publishMessagesUpdate(sessionId, result.data.updatedDoc.messages);
  return { success: true, data: result.data };
}

async function updateSessionStatusInternal(sessionId, newStatus) {
  const validStatuses = ['idle', 'processing', 'complete', 'error'];
  if (!sessionId || !validStatuses.includes(newStatus)) {
    return { success: false, error: `Invalid session ID or status: ${newStatus}` };
  }
  const result = await sendDbWorkerRequest(DbUpdateStatusRequest.type, { sessionId, status: newStatus });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to update session status to ${newStatus}` };
  }
  await publishSessionUpdate(sessionId, 'update', result.data);
  await publishStatusUpdate(sessionId, newStatus);
  return { success: true, data: result.data };
}

async function toggleItemStarredInternal(itemId) {
  if (!itemId) {
    return { success: false, error: 'Item ID is required' };
  }
  const result = await sendDbWorkerRequest(DbToggleStarRequest.type, { sessionId: itemId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to toggle starred status for item ${itemId}` };
  }
  await publishSessionUpdate(itemId, 'update', result.data);
  return { success: true, data: result.data };
}

async function deleteHistoryItemInternal(itemId) {
  if (!itemId) {
    return { success: false, error: 'Item ID is required' };
  }
  const result = await sendDbWorkerRequest(DbDeleteSessionRequest.type, { sessionId: itemId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to delete item ${itemId}` };
  }
  await publishSessionUpdate(itemId, 'delete');
  return { success: true, data: result.data };
}

async function renameHistoryItemInternal(itemId, newTitle) {
  if (!itemId || !newTitle) {
    return { success: false, error: 'Item ID and new title are required' };
  }
  const result = await sendDbWorkerRequest(DbRenameSessionRequest.type, {
    sessionId: itemId,
    newName: newTitle,
  });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to rename item ${itemId} to ${newTitle}` };
  }
  await publishSessionUpdate(itemId, 'rename', result.data);
  return { success: true, data: result.data };
}

async function getAllSessionsInternal() {
  const result = await sendDbWorkerRequest(DbGetAllSessionsRequest.type);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to retrieve all sessions' };
  }
  return { success: true, data: result.data };
}

async function getStarredSessionsInternal() {
  const result = await sendDbWorkerRequest(DbGetStarredSessionsRequest.type);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to retrieve starred sessions' };
  }
  return { success: true, data: result.data };
}

async function getLogsInternal(filters) {
  const result = await sendDbWorkerRequest(DbGetLogsRequest.type, { filters });
  if (!result?.success) return [];
  return result.data;
}

async function getUniqueLogValuesInternal(fieldName) {
  const result = await sendDbWorkerRequest(DbGetUniqueLogValuesRequest.type, { fieldName });
  if (!result?.success) return [];
  return result.data;
}

async function clearLogsInternal(sessionIdsToDelete) {
  const result = await sendDbWorkerRequest(DbClearLogsRequest.type, { sessionIdsToDelete });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to clear logs', data: { deletedCount: 0 } };
  }
  return result;
}

async function getAllUniqueLogSessionIdsInternal() {
  try {
    const db = await ensureDbReady('log');
    const rows = await queryAll(db, `SELECT DISTINCT extensionSessionId FROM logs WHERE extensionSessionId IS NOT NULL`);
    const uniqueIds = new Set(rows.map((r) => r.extensionSessionId));
    return { success: true, data: uniqueIds };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
}

// --- Request Handlers ---
async function handleRequest(
  event,
  internalHandler,
  ResponseClass,
  timeout = 5000,
  successDataExtractor = (result) => result.data,
  errorDetailsExtractor = () => ({})
) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const result = await withTimeout(internalHandler(event.payload), timeout);
    console.log('[Trace][minimaldb] handleRequest: result', result);
    if (!result.success) {
      throw new AppError('INTERNAL_OPERATION_FAILED', result.error || 'Unknown internal error', errorDetailsExtractor(result));
    }
    const responseData = successDataExtractor(result);
    return new ResponseClass(requestId, true, responseData);
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('UNKNOWN_HANDLER_ERROR', error.message || 'Failed in request handler', {
            originalError: error,
            ...errorDetailsExtractor(error),
          });
    return new ResponseClass(requestId, false, null, appError);
  }
}

const dbHandlerMap = {
  [DbGetReadyStateRequest.type]: handleDbGetReadyStateRequest,
  [DbCreateSessionRequest.type]: handleDbCreateSessionRequest,
  [DbGetSessionRequest.type]: handleDbGetSessionRequest,
  [DbAddMessageRequest.type]: handleDbAddMessageRequest,
  [DbUpdateMessageRequest.type]: handleDbUpdateMessageRequest,
  [DbDeleteMessageRequest.type]: handleDbDeleteMessageRequest,
  [DbUpdateStatusRequest.type]: handleDbUpdateStatusRequest,
  [DbToggleStarRequest.type]: handleDbToggleStarRequest,
  [DbGetAllSessionsRequest.type]: handleDbGetAllSessionsRequest,
  [DbGetStarredSessionsRequest.type]: handleDbGetStarredSessionsRequest,
  [DbDeleteSessionRequest.type]: handleDbDeleteSessionRequest,
  [DbRenameSessionRequest.type]: handleDbRenameSessionRequest,
  [DbAddLogRequest.type]: handleDbAddLogRequest,
  [DbGetLogsRequest.type]: handleDbGetLogsRequest,
  [DbGetUniqueLogValuesRequest.type]: handleDbGetUniqueLogValuesRequest,
  [DbClearLogsRequest.type]: handleDbClearLogsRequest,
  [DbGetCurrentAndLastLogSessionIdsRequest.type]: handleDbGetCurrentAndLastLogSessionIdsRequest,
  [DbResetDatabaseRequest.type]: handleDbResetDatabaseRequest,
  [DbAddModelAssetRequest.type]: handleDbAddModelAssetRequest,
  [DbCountModelAssetChunksRequest.type]: handleDbCountModelAssetChunksRequest,
  [DbLogAllChunkGroupIdsForModelRequest.type]: handleDbLogAllChunkGroupIdsForModelRequest,
  [DbListModelFilesRequest.type]: handleDbListModelFilesRequest,
  [DbGetModelAssetChunksRequest.type]: handleDbGetModelAssetChunksRequest,
  [DbGetModelAssetChunkRequest.type]: handleDbGetModelAssetChunkRequest,
  [DbEnsureInitializedRequest.type]: async (event) => {
    try {
      await autoEnsureDbInitialized();
      return new DbEnsureInitializedResponse(event.requestId, true);
    } catch (e) {
      return new DbEnsureInitializedResponse(event.requestId, false, null, e);
    }
  },
};

async function handleDbGetReadyStateRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  return { success: true, data: { ready: isDbReadyFlag && absurdSqlBackendInitialized } };
}

async function handleDbCreateSessionRequest(event) {
  console.log('[Trace][minimaldb] handleDbCreateSessionRequest: called with', event);
  if (!event?.payload?.initialMessage?.text) {
    throw new AppError('INVALID_INPUT', 'Missing initialMessage or message text');
  }
  return handleRequest(
    event,
    (payload) => createChatSessionInternal(payload.initialMessage),
    DbCreateSessionResponse,
    5000,
    (res) => res.data.id
  );
}

async function handleDbGetSessionRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => getChatSessionByIdInternal(payload.sessionId),
    DbGetSessionResponse,
    5000,
    (res) => (res.data ? res.data : null)
  );
}

async function handleDbAddMessageRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.messageObject?.text) {
    throw new AppError('INVALID_INPUT', 'Session ID and message with text are required');
  }
  return handleRequest(
    event,
    (payload) => addMessageToChatInternal(payload.sessionId, payload.messageObject),
    DbAddMessageResponse,
    5000,
    (res) => res.data.newMessageId
  );
}

async function handleDbUpdateMessageRequest(event) {
  console.log('[minimaldb] handleDbUpdateMessageRequest called with event:', event);
  if (
    !event?.payload?.sessionId ||
    !event?.payload?.messageId ||
    !event?.payload?.updates ||
    (!event.payload.updates.text && typeof event.payload.updates.isLoading === 'undefined')
  ) {
    throw new AppError(
      'INVALID_INPUT',
      'Session ID, message ID, and updates (with text or isLoading) are required'
    );
  }
  return handleRequest(
    event,
    (payload) => updateMessageInChatInternal(payload.sessionId, payload.messageId, payload.updates),
    DbUpdateMessageResponse,
    5000,
    () => true
  );
}

async function handleDbDeleteMessageRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.messageId) {
    throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
  }
  return handleRequest(
    event,
    (payload) => deleteMessageFromChatInternal(payload.sessionId, payload.messageId),
    DbDeleteMessageResponse,
    5000,
    () => true
  );
}

async function handleDbUpdateStatusRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.status) {
    throw new AppError('INVALID_INPUT', 'Session ID and status are required');
  }
  const wrappedHandler = async (payload) => {
    try {
      return await updateSessionStatusInternal(payload.sessionId, payload.status);
    } catch (e) {
      await publishStatusUpdate(payload.sessionId, 'error');
      throw e;
    }
  };
  return handleRequest(event, wrappedHandler, DbUpdateStatusResponse, 5000, () => true);
}

async function handleDbToggleStarRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => toggleItemStarredInternal(payload.sessionId),
    DbToggleStarResponse,
    5000,
    (res) => res.data
  );
}

async function handleDbGetAllSessionsRequest(event) {
  console.log('[Trace][minimaldb] handleDbGetAllSessionsRequest: called with', event);
  return handleRequest(
    event,
    getAllSessionsInternal,
    DbGetAllSessionsResponse,
    5000,
    (res) => (res.data || []).sort((a, b) => b.timestamp - a.timestamp)
  );
}

async function handleDbGetStarredSessionsRequest(event) {
  return handleRequest(
    event,
    getStarredSessionsInternal,
    DbGetStarredSessionsResponse,
    5000,
    (res) =>
      (res.data || [])
        .map((s) => ({ sessionId: s.id, name: s.title, lastUpdated: s.timestamp, isStarred: s.isStarred }))
        .sort((a, b) => b.lastUpdatedpls - a.lastUpdated)
  );
}

async function handleDbDeleteSessionRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => deleteHistoryItemInternal(payload.sessionId),
    DbDeleteSessionResponse,
    5000,
    () => true
  );
}

async function handleDbRenameSessionRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.newName) {
    throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
  }
  return handleRequest(
    event,
    (payload) => renameHistoryItemInternal(payload.sessionId, payload.newName),
    DbRenameSessionResponse,
    5000,
    () => true
  );
}

async function handleDbAddLogRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    if (!event?.payload?.logEntryData) {
      throw new AppError('INVALID_INPUT', 'Missing logEntryData in payload');
    }
    const db = await ensureDbReady('log');
    const entry = event.payload.logEntryData;
    await runQuery(
      db,
      `INSERT INTO logs (id, timestamp, level, message, component, extensionSessionId, chatSessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.timestamp,
        entry.level,
        entry.message,
        entry.component,
        entry.extensionSessionId,
        entry.chatSessionId || null,
      ]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
}

async function handleDbGetLogsRequest(event) {
  if (!event?.payload?.filters) {
    throw new AppError('INVALID_INPUT', 'Missing filters in payload');
  }
  return handleRequest(event, (payload) => getLogsInternal(payload.filters), DbGetLogsResponse);
}

async function handleDbGetUniqueLogValuesRequest(event) {
  if (!event?.payload?.fieldName) {
    throw new AppError('INVALID_INPUT', 'Missing fieldName in payload');
  }
  return handleRequest(
    event,
    (payload) => getUniqueLogValuesInternal(payload.fieldName),
    DbGetUniqueLogValuesResponse
  );
}

async function handleDbClearLogsRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const allLogSessionIdsResult = await getAllUniqueLogSessionIdsInternal();
    if (!allLogSessionIdsResult.success) {
      throw new AppError(
        'FETCH_FAILED',
        allLogSessionIdsResult.error || 'Failed to get unique log session IDs for clearing.'
      );
    }
    const allLogSessionIds = allLogSessionIdsResult.data;
    const sessionsToKeep = new Set();
    if (currentExtensionSessionId) sessionsToKeep.add(currentExtensionSessionId);
    if (previousExtensionSessionId) sessionsToKeep.add(previousExtensionSessionId);
    const sessionIdsToDelete = Array.from(allLogSessionIds).filter((id) => !sessionsToKeep.has(id));
    let deletedCount = 0;
    if (sessionIdsToDelete.length > 0) {
      const clearResult = await clearLogsInternal(sessionIdsToDelete);
      if (clearResult.success) deletedCount = clearResult.data.deletedCount;
      else throw new AppError('DELETE_FAILED', clearResult.error || 'Failed to delete old logs.');
    }
    return new DbClearLogsResponse(requestId, true, { deletedCount });
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('UNKNOWN', 'Failed to clear logs', { originalError: error });
    return new DbClearLogsResponse(requestId, false, null, appError);
  }
}

async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const ids = { currentLogSessionId: currentExtensionSessionId, previousLogSessionId: previousExtensionSessionId };
    return new DbGetCurrentAndLastLogSessionIdsResponse(requestId, true, ids);
  } catch (error) {
    const appError = new AppError('UNKNOWN', 'Failed to get current/last log session IDs', {
      originalError: error,
    });
    return new DbGetCurrentAndLastLogSessionIdsResponse(requestId, false, null, appError);
  }
}

async function handleDbResetDatabaseRequest(event) {
  return await sendDbWorkerRequest(DBEventNames.DB_WORKER_RESET);
}

// --- Notification Utilities ---
function smartNotify(notification) {
  const payloadKeys = notification && notification.payload ? Object.keys(notification.payload) : [];
  const sessionId = notification.sessionId || (notification.payload && notification.payload.session && notification.payload.session.id) || 'N/A';
  let deliveryPath = '';
  if (typeof window === 'undefined') {
    deliveryPath = 'background (browser.runtime.sendMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    browser.runtime.sendMessage(notification);
  } else if (window.EXTENSION_CONTEXT === Contexts.MAIN_UI) {
    deliveryPath = 'same-context (document.dispatchEvent)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    document.dispatchEvent(new CustomEvent(notification.type, { detail: notification }));
    deliveryPath = 'cross-context (dbChannel.postMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    dbChannel.postMessage(notification);
  } else {
    deliveryPath = 'cross-context (dbChannel.postMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    dbChannel.postMessage(notification);
  }
}

async function publishSessionUpdate(sessionId, updateType = 'update', sessionDataOverride = null) {
  try {
    let sessionData = sessionDataOverride;
    if (!sessionData) {
      const result = await getChatSessionByIdInternal(sessionId);
      if (result.success && result.data) {
        sessionData = result.data;
      } else if (updateType === 'delete') {
        sessionData = { id: sessionId };
      } else {
        return;
      }
    }
    let plainSession = sessionData;
    if (sessionData && typeof sessionData.toJSON === 'function') {
      plainSession = sessionData.toJSON();
    } else if (sessionData) {
      try {
        plainSession = JSON.parse(JSON.stringify(sessionData));
      } catch (e) {
        return;
      }
    }
    const notification = {
      type: DbSessionUpdatedNotification.type,
      payload: { session: plainSession, updateType },
    };
    smartNotify(notification);
  } catch (e) {
    // console.error('[DB] Failed to publish session update notification', e, { sessionId, updateType });
  }
}

/**
 * Publishes a messages update notification for a session.
 * Always expects messages to be an array of message objects.
 */
async function publishMessagesUpdate(sessionId, messages) {
  try {
    if (!Array.isArray(messages)) {
      console.error('[minimaldb] publishMessagesUpdate: messages is not an array! Got:', messages);
      return;
    }
    let plainMessages = messages.map((m) => ({ ...m }));
    const notification = new DbMessagesUpdatedNotification(sessionId, plainMessages);
    smartNotify(notification);
  } catch (e) {
    console.error('[DB] Failed to publish messages update notification', e, { sessionId });
  }
}

async function publishStatusUpdate(sessionId, status) {
  try {
    const notification = new DbStatusUpdatedNotification(sessionId, status);
    smartNotify(notification);
  } catch (e) {
    console.error('[DB] Failed to publish status update notification', e, { sessionId });
  }
}

// --- Model Asset Management ---
async function ensureModelAssetsReady() {
  return await ensureDbReady('model');
}

function shouldLogOrSendChunkProgress(chunkIndex, totalChunks) {
  return chunkIndex === 0 || (totalChunks && chunkIndex === totalChunks - 1) || chunkIndex % 100 === 0;
}

async function addModelAsset(
  folder,
  fileName,
  fileType,
  data,
  chunkIndex = 0,
  totalChunks = 1,
  chunkGroupId = '',
  binarySize = null,
  totalFileSize = null
) {
  const result = await sendDbWorkerRequest(DbAddModelAssetRequest.type, {
    folder,
    fileName,
    fileType,
    data,
    chunkIndex,
    totalChunks,
    chunkGroupId,
    binarySize,
    totalFileSize,
  });
  if (!result?.success) throw new Error(result?.error || 'Failed to add model asset');
  return result;
}

async function getModelAssetChunks(chunkGroupId) {
  const result = await sendDbWorkerRequest(DbGetModelAssetChunksRequest.type, { chunkGroupId });
  if (!result?.success) return [];
  return result.data;
}

async function countModelAssetChunks(folder, fileName, expectedSize, expectedChunks) {
  const result = await sendDbWorkerRequest(DbCountModelAssetChunksRequest.type, {
    folder,
    fileName,
    expectedSize,
    expectedChunks,
  });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to count model asset chunks' };
  }
  return result;
}

async function logAllChunkGroupIdsForModel(folder) {
  const result = await sendDbWorkerRequest(DbLogAllChunkGroupIdsForModelRequest.type, { folder });
  if (!result?.success) return [];
  return result.data;
}

async function listModelFiles(modelId) {
  const result = await sendDbWorkerRequest(DbListModelFilesRequest.type, { modelId });
  if (!result?.success) return [];
  return result.data;
}

async function getModelAssetChunk(folder, fileName, chunkIndex) {
  const result = await sendDbWorkerRequest(DbGetModelAssetChunkRequest.type, {
    folder,
    fileName,
    chunkIndex,
  });
  if (!result?.success) return null;
  return result.data;
}

async function handleDbAddModelAssetRequest(event) {
  return handleRequest(
    event,
    (payload) =>
      addModelAsset(
        payload.folder,
        payload.fileName,
        payload.fileType,
        payload.data,
        payload.chunkIndex,
        payload.totalChunks,
        payload.chunkGroupId,
        payload.binarySize,
        payload.totalFileSize
      ),
    DbAddModelAssetResponse,
    5000,
    (res) => res
  );
}

async function handleDbCountModelAssetChunksRequest(event) {
  return handleRequest(
    event,
    (payload) =>
      countModelAssetChunks(payload.folder, payload.fileName, payload.expectedSize, payload.expectedChunks),
    DbCountModelAssetChunksResponse,
    5000,
    (res) => res
  );
}

async function handleDbLogAllChunkGroupIdsForModelRequest(event) {
  return handleRequest(
    event,
    (payload) => logAllChunkGroupIdsForModel(payload.folder),
    DbLogAllChunkGroupIdsForModelResponse,
    5000,
    (res) => res
  );
}

async function handleDbListModelFilesRequest(event) {
  return handleRequest(
    event,
    (payload) => listModelFiles(payload.modelId),
    DbListModelFilesResponse
  );
}

async function handleDbGetModelAssetChunksRequest(event) {
  return handleRequest(
    event,
    (payload) => getModelAssetChunks(payload.chunkGroupId),
    DbGetModelAssetChunksResponse
  );
}

async function handleDbGetModelAssetChunkRequest(event) {
  return handleRequest(
    event,
    (payload) => getModelAssetChunk(payload.folder, payload.fileName, payload.chunkIndex),
    DbGetModelAssetChunkResponse
  );
}

// --- Logging Utilities ---
const logThrottleCache = {};
const logLastContext = {};

function throttledLog(type, staticMsg, contextKey = null, ...args) {
  const now = Date.now();
  const cacheKey = contextKey ? `${staticMsg}__${contextKey}` : staticMsg;
  if (!logThrottleCache[type]) logThrottleCache[type] = {};
  if (contextKey !== null) {
    if (logLastContext[staticMsg] === contextKey && now - (logThrottleCache[type][cacheKey] || 0) < LOG_THROTTLE_MS) {
      return;
    }
    logLastContext[staticMsg] = contextKey;
  }
  if (!logThrottleCache[type][cacheKey] || now - logThrottleCache[type][cacheKey] > LOG_THROTTLE_MS) {
    logThrottleCache[type][cacheKey] = now;
    const fullMessage = contextKey !== null ? [staticMsg, contextKey, ...args] : [staticMsg, ...args];
    if (type === 'log') console.log(...fullMessage);
    else if (type === 'warn') console.warn(...fullMessage);
    else if (type === 'error') console.error(...fullMessage);
  }
}

// --- Message Listener ---
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type || !Object.values(DBEventNames).includes(message.type)) {
    return false;
  }
  forwardDbRequest(message)
    .then((result) => {
      console.log('[Trace][minimaldb] onMessage: Handler result', result);
      sendResponse(result);
    })
    .catch((err) => {
      console.error('[Trace][minimaldb] onMessage: Handler error', err);
      sendResponse({ success: false, error: err.message || 'Unknown error in handler' });
    });
  return true;
});

// --- Exported Functions ---
export async function forwardDbRequest(request) {
  const handler = dbHandlerMap[request?.type];
  if (!handler) {
    throw new Error(`No DB handler for type: ${request?.type}`);
  }
  try {
    const result = await handler(request);
    return result;
  } catch (err) {
    return { success: false, error: err.message || 'Unknown error in handler' };
  }
}

export async function resetDatabase() {
  try {
    await initializeDatabasesAndBackend(true);
    return { success: true };
  } catch (e) {
    throw e;
  }
}

export { autoEnsureDbInitialized };