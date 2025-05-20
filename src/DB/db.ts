// db.js
import browser from 'webextension-polyfill';
import {
  DBEventNames,
  DbCreateSessionRequest, DbCreateSessionResponse,
  DbGetSessionRequest, DbGetSessionResponse,
  DbAddMessageRequest, DbAddMessageResponse,
  DbUpdateMessageRequest, DbUpdateMessageResponse,
  DbDeleteMessageRequest, DbDeleteMessageResponse,
  DbUpdateStatusRequest, DbUpdateStatusResponse,
  DbToggleStarRequest, DbToggleStarResponse,
  DbGetAllSessionsRequest, DbGetAllSessionsResponse,
  DbMessagesUpdatedNotification, DbStatusUpdatedNotification, DbSessionUpdatedNotification,
  DbInitializeRequest, DbInitializationCompleteNotification,
  DbDeleteSessionRequest, DbDeleteSessionResponse,
  DbRenameSessionRequest, DbRenameSessionResponse,
  DbGetStarredSessionsRequest, DbGetStarredSessionsResponse,
  DbGetReadyStateRequest, DbGetReadyStateResponse,
  DbResetDatabaseRequest, DbResetDatabaseResponse,
  DbAddModelAssetRequest, DbAddModelAssetResponse,
  DbAddManifestRequest, DbAddManifestResponse,
  DbGetManifestRequest, DbGetManifestResponse,
  DbCountModelAssetChunksRequest, DbCountModelAssetChunksResponse,
  DbLogAllChunkGroupIdsForModelRequest, DbLogAllChunkGroupIdsForModelResponse,
  DbListModelFilesRequest, DbListModelFilesResponse,
  DbGetModelAssetChunksRequest, DbGetModelAssetChunksResponse,
  DbGetModelAssetChunkRequest, DbGetModelAssetChunkResponse,
  DbEnsureInitializedRequest, DbEnsureInitializedResponse,
  DbAddLogRequest, DbAddLogResponse,
  DbGetLogsRequest, DbGetLogsResponse,
  DbGetUniqueLogValuesRequest, DbGetUniqueLogValuesResponse,
  DbClearLogsRequest, DbClearLogsResponse,
  DbGetCurrentAndLastLogSessionIdsRequest, DbGetCurrentAndLastLogSessionIdsResponse,
  // DbInitWorkerRequest, DbInitWorkerResponse, // Marked as unused previously
} from './dbEvents';
import { schema, dbChannel } from './idbSchema';
import { MODEL_ASSET_TYPE_MANIFEST, CHUNK_SIZE as CONFIG_CHUNK_SIZE_FROM_HELPER } from './idbModelAsset'; 
import { DBActions } from './dbActions'; 
import { Chat } from './idbChat';
import { ModelAsset } from './idbModelAsset';
import { LogEntry } from './idbLog';

const DB_INIT_TIMEOUT = 15000;
const APP_CHUNK_SIZE_CONFIG = CONFIG_CHUNK_SIZE_FROM_HELPER || (10 * 1024 * 1024); // Use helper's or default

let isDbReadyFlag = false;
let currentExtensionSessionId: string | null = null;
let previousExtensionSessionId: string | null = null;
let dbInitPromise: Promise<any> | null = null;
let isDbInitInProgress: boolean = false;
let dbWorker: Worker | null = null;
let dbWorkerReady: boolean = false;
let dbWorkerRequestId: number = 0;
const dbWorkerCallbacks: Record<string, { resolve: Function; reject: Function }> = {};

let lastDbInitStatus: any = null;
let currentChat: any = null;

let _dbReadyResolve: ((value: boolean) => void) | null = null;

function resetDbReadyPromise() {
  _dbReadyResolve = () => {};
}

class AppError extends Error {
  code: string;
  details: any;
  constructor(code: string, message: string, details: any = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = `Operation timed out after ${ms}ms`): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function createDbWorker() {
  if (!dbWorker) {
    const workerUrl = browser.runtime.getURL('DB/indexedDBBackendWorker.js');
    console.log('[DB] Creating new DB Worker with URL:', workerUrl);
    let workerCreated = false;
    try {
      dbWorker = new Worker(workerUrl, { type: 'module' });
      workerCreated = true;
    } catch (workerErr) {
      console.error('[DB] Failed to create DB Worker:', workerErr);
      dbWorker = null;
      dbWorkerReady = false;
      // Optionally, you could throw or handle this error further here
      return null;
    }
    if (workerCreated) {
      dbWorker.onmessage = (event) => {
        const { requestId, type, result, error, stack } = event.data;
        console.log('[DB] Worker onmessage (full event.data):', event.data);
        if (requestId && dbWorkerCallbacks[requestId]) {
          const callback = dbWorkerCallbacks[requestId];
          delete dbWorkerCallbacks[requestId];

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
            console.error('[DB] Worker callback.reject:', errObj, 'for requestId:', requestId);
            callback.reject(errObj);
          } else {
            console.log('[DB] Worker callback.resolve:', result, 'for requestId:', requestId);
            callback.resolve(result);
          }
        } else if (type === 'debug') {
          console.log(`[DB Worker Debug] ${event.data.message}`);
        } else if (type === 'fatal') {
          console.error(`[DB Worker Fatal] ${event.data.error}`, event.data.stack);
          Object.values(dbWorkerCallbacks).forEach((cb: any) =>
            cb.reject(new Error('DB Worker encountered a fatal error'))
          );
          Object.keys(dbWorkerCallbacks).forEach(key => delete dbWorkerCallbacks[key]);
        } else if (type === DBActions.WORKER_READY) {
          dbWorkerReady = true;
          console.log('[DB] DB Worker signaled script ready.');
        } else {
          console.warn('[DB] Worker received unknown message type:', type, event.data);
        }
      };
      dbWorker.onerror = (errEvent) => {
        console.error('[DB] Uncaught error in DB Worker:', errEvent.message, errEvent);
        Object.values(dbWorkerCallbacks).forEach((cb: any) =>
          cb.reject(new Error(`DB Worker crashed: ${errEvent.message || 'Unknown worker error'}`))
        );
        Object.keys(dbWorkerCallbacks).forEach(key => delete dbWorkerCallbacks[key]);
        dbWorker = null;
        dbWorkerReady = false;
      };
      console.log('[DB] DB Worker created and event handlers attached.');
    }
  } else {
    console.log('[DB] Returning existing DB Worker instance.');
  }
  return dbWorker;
}

// Helper to ensure dbWorker is not null
function getDbWorker(): Worker {
  if (!dbWorker) throw new AppError('WORKER_NOT_INITIALIZED', 'DB Worker is not initialized');
  return dbWorker;
}

function checkDbAndStoreReadiness(result: any) {
  if (!result || typeof result !== 'object') {
    console.warn('[DB] checkDbAndStoreReadiness received invalid result:', result);
    return { allSuccess: false, failures: ['Invalid result object'] };
  }
  let allSuccess = true;
  const failures: string[] = [];
  for (const [dbName, dbStatus] of Object.entries(result)) {
    if (!dbStatus || typeof dbStatus !== 'object' || !('success' in dbStatus) || !(dbStatus as any).success) {
      allSuccess = false;
      failures.push(`${dbName} (DB init: ${(dbStatus as any)?.error?.message || 'failed'})`);
    }
    if (dbStatus && typeof dbStatus === 'object' && 'stores' in dbStatus && (dbStatus as any).stores) {
      for (const [storeName, storeStatus] of Object.entries((dbStatus as any).stores)) {
        if (!storeStatus || typeof storeStatus !== 'object' || !('success' in storeStatus) || !(storeStatus as any).success) {
          allSuccess = false;
          failures.push(`${dbName}.${storeName} (Store init: ${(storeStatus as any)?.error?.message || 'failed'})`);
        }
      }
    }
  }
  return { allSuccess, failures };
}

async function autoEnsureDbInitialized() {
  resetDbReadyPromise(); // Ensure _dbReadyResolve is always a function
  if (isDbReadyFlag && (lastDbInitStatus as any)?.success) {
    const result = { success: true, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
    smartNotify(new DbInitializationCompleteNotification(result));
    return result;
  }
  if (isDbInitInProgress) {
    return dbInitPromise; // Return the existing promise
  }
  isDbInitInProgress = true;
  dbInitPromise = (async () => {
    try {
      console.log('[DB] autoEnsureDbInitialized: Initializing databases and backend.');
      let ids = await browser.storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
      if (!ids.currentLogSessionId) {
        ids.currentLogSessionId = crypto.randomUUID();
        await browser.storage.local.set({ currentLogSessionId: ids.currentLogSessionId });
      }
      currentExtensionSessionId = ids.currentLogSessionId;
      previousExtensionSessionId = ids.previousLogSessionId || null;

      const worker = createDbWorker();
      if (!worker) {
        const errorMsg = '[DB] Failed to initialize DB Worker. Aborting DB initialization.';
        console.error(errorMsg);
        isDbReadyFlag = false;
        if (typeof _dbReadyResolve === 'function') _dbReadyResolve(false);
        lastDbInitStatus = { error: errorMsg, success: false };
        const errorResponse = { success: false, error: errorMsg, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
        smartNotify(new DbInitializationCompleteNotification(errorResponse));
        throw new AppError('WORKER_NOT_INITIALIZED', errorMsg);
      }

      if (!dbWorkerReady) {
        console.log('[DB] Waiting for DB worker to become ready...');
        await new Promise<void>((resolveWorkerReady, rejectWorkerReady) => {
          const timeout = setTimeout(() => rejectWorkerReady(new Error(`Worker '${DBActions.WORKER_READY}' signal timeout after 10s`)), 10000);
          const checkWorker = () => {
            if (dbWorkerReady) { clearTimeout(timeout); resolveWorkerReady(); }
            else { setTimeout(checkWorker, 50); }
          };
          checkWorker();
        });
        console.log('[DB] DB Worker is ready.');
      }

      const payloadForWorker = { schemaConfig: schema }; // Make sure 'schema' is defined and imported
      const requestId = (++dbWorkerRequestId).toString();
      
      console.log('[DB] Sending INIT_CUSTOM_IDBS to worker:', { requestId, type: DBActions.INIT_CUSTOM_IDBS, payload: payloadForWorker });
      const initOpPromise = new Promise((resolve, reject) => {
        dbWorkerCallbacks[requestId] = { resolve, reject };
      });
      if (!dbWorker) throw new AppError('WORKER_NOT_INITIALIZED', 'DB Worker is not initialized');
      dbWorker.postMessage({ requestId, action: DBActions.INIT_CUSTOM_IDBS, payload: payloadForWorker });
      
      const resultFromWorker = await withTimeout(initOpPromise, DB_INIT_TIMEOUT, 'DB Init operation with worker timed out');
      lastDbInitStatus = resultFromWorker;

      const { allSuccess, failures } = checkDbAndStoreReadiness(resultFromWorker as any);
      isDbReadyFlag = allSuccess;
      if (typeof _dbReadyResolve === 'function') _dbReadyResolve(allSuccess);

      const responsePayload = { success: allSuccess, dbStatus: resultFromWorker, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
      if (!allSuccess) {
        const errorMsg = `One or more databases/stores failed to initialize: ${failures.join(', ')}.`;
        console.error('[DB]', errorMsg, 'Details:', resultFromWorker);
        (responsePayload as any).error = new AppError('DB_INIT_FAILED', errorMsg, { failures, dbStatus: resultFromWorker });
      }
      
      smartNotify(new DbInitializationCompleteNotification(responsePayload));
      if (!allSuccess) throw (responsePayload as any).error; // Throw if not successful
      return responsePayload;

    } catch (err) {
      console.error('[DB] autoEnsureDbInitialized -> CRITICAL Initialization failed:', (err as Error).message);
      isDbReadyFlag = false;
      if (typeof _dbReadyResolve === 'function') _dbReadyResolve(false);
      lastDbInitStatus = (lastDbInitStatus as any) || { error: (err as Error).message, success: false };
      const errorResponse = { success: false, error: err as Error, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
      smartNotify(new DbInitializationCompleteNotification(errorResponse));
      throw err; // Re-throw the error to be caught by the caller of autoEnsureDbInitialized
    } finally {
      isDbInitInProgress = false;
    }
  })();
  return dbInitPromise;
}

// Unified handler for both DbInitializeRequest and DbEnsureInitializedRequest
async function handleDbEnsureInitialized(event: any) {
  try {
    const result = await autoEnsureDbInitialized();
    return new DbEnsureInitializedResponse(event?.requestId || crypto.randomUUID(), result.success, result, result.success ? null : result.error);
  } catch (e) {
    return new DbEnsureInitializedResponse(event?.requestId || crypto.randomUUID(), false, null, e);
  }
}

async function handleRequest(
  event: any,
  internalHandler: Function,
  ResponseClass: any,
  timeout = 10000,
  successDataExtractor = (result: any) => result.data,
  errorDetailsExtractor = (errorResult: any) => ({ errorDetails: errorResult?.error })
) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {

    if (!isDbReadyFlag) { // Secondary check
        throw new AppError('DB_NOT_READY', 'Database is not ready after initialization attempt.');
    }

    const result = await withTimeout(internalHandler(event.payload), timeout);

    if (result && (result as any).success === false) {
      throw new AppError('INTERNAL_OPERATION_FAILED', (result as any).error || 'Unknown internal error from handler', errorDetailsExtractor(result));
    }
    const responseData = successDataExtractor(result);
    return new ResponseClass(requestId, true, responseData);

  } catch (error) {
    const errObj = error as Error;
    console.error(`[DB] Error in handleRequest for ${event?.type} (reqId: ${requestId}):`, errObj.message, (errObj as any).details || errObj);
    const appError = (error instanceof AppError) ? error : new AppError('UNKNOWN_HANDLER_ERROR', errObj.message || 'Failed in request handler', { originalErrorName: errObj.name, originalErrorStack: errObj.stack, details: (errObj as any).details });
    return new ResponseClass(requestId, false, null, appError);
  }
}

// --- Handler Functions ---

async function handleDbGetReadyStateRequest(event: any) {
  return new DbGetReadyStateResponse(event.requestId, true, { ready: isDbReadyFlag });
}

async function handleDbCreateSessionRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.initialMessage?.text) throw new AppError('INVALID_INPUT', 'Missing initialMessage or message text');
    // Create new chat regardless of currentChat state for this specific request
    const newChat = await Chat.createChat(payload.initialMessage.text, getDbWorker(), {
      initialMessageSender: payload.initialMessage.sender || 'user',
    });
    if (!newChat) throw new AppError('DB_OPERATION_FAILED', 'Failed to create chat session (Chat.createChat returned null)');
    
    currentChat = newChat;
    await publishSessionUpdate(currentChat.id, 'create', currentChat);
    const messages = await currentChat.getMessages(); // Assumes createChat adds the initial message
    await publishMessagesUpdate(currentChat.id, messages);
    await publishStatusUpdate(currentChat.id, currentChat.status);
    return { success: true, data: newChat };
  }, DbCreateSessionResponse, 5000, (res: any) => res.data.id);
}

async function handleDbGetSessionRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId) throw new AppError('INVALID_INPUT', 'Session ID is required');
    if (currentChat && currentChat.id === payload.sessionId) return { success: true, data: currentChat };
    const worker = getDbWorker();
    const chat = await Chat.read(payload.sessionId, worker);
    if (!chat) return { success: false, error: `Session ${payload.sessionId} not found` };
    return { success: true, data: chat };
  }, DbGetSessionResponse);
}

async function handleDbAddMessageRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId || !payload.messageObject?.text) throw new AppError('INVALID_INPUT', 'Session ID and message text are required');
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    const messageId = await chat.addMessage(payload.messageObject); // Pass full messageObject
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat; 
    await publishSessionUpdate(chat.id, 'update', chat);
    const messages = await chat.getMessages();
    await publishMessagesUpdate(chat.id, messages);
    return { success: true, data: { newMessageId: messageId }};
  }, DbAddMessageResponse);
}

async function handleDbUpdateMessageRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId || !payload.messageId || !payload.updates || (payload.updates.text === undefined && payload.updates.isLoading === undefined && payload.updates.content === undefined /* Added content */)) {
      throw new AppError('INVALID_INPUT', 'Session ID, message ID, and updates (text, content or isLoading) are required');
    }
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    const message = await chat.getMessage(payload.messageId);
    if (!message) throw new AppError('NOT_FOUND', `Message ${payload.messageId} not found.`);
    await message.update(payload.updates);
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat;
    await publishSessionUpdate(chat.id, 'update', chat);
    const messages = await chat.getMessages();
    await publishMessagesUpdate(chat.id, messages);
    return { success: true, data: true };
  }, DbUpdateMessageResponse);
}

async function handleDbDeleteMessageRequest(event: any) {
   return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId || !payload.messageId) throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    const deleted = await chat.deleteMessage(payload.messageId, { deleteAttachments: true, deleteKGNRels: true, deleteOrphanedEmbedding: true }); // Options from Chat class
    if (!deleted) throw new AppError('DB_OPERATION_FAILED', `Failed to delete message ${payload.messageId}.`);
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat; // Chat object state might change (message_ids)
    await publishSessionUpdate(chat.id, 'update', chat);
    const messages = await chat.getMessages();
    await publishMessagesUpdate(chat.id, messages);
    return { success: true, data: true };
  }, DbDeleteMessageResponse);
}

async function handleDbUpdateStatusRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId || !payload.status) throw new AppError('INVALID_INPUT', 'Session ID and status are required');
    const validStatuses = ['idle', 'processing', 'complete', 'error'];
    if (!validStatuses.includes(payload.status)) throw new AppError('INVALID_INPUT', `Invalid status: ${payload.status}`);
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    await chat.update({ status: payload.status });
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat;
    await publishSessionUpdate(chat.id, 'update', chat);
    await publishStatusUpdate(chat.id, payload.status);
    return { success: true, data: chat };
  }, DbUpdateStatusResponse);
}

async function handleDbToggleStarRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId) throw new AppError('INVALID_INPUT', 'Session ID is required');
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    await chat.update({ isStarred: !chat.isStarred });
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat;
    await publishSessionUpdate(chat.id, 'update', chat);
    return { success: true, data: chat };
  }, DbToggleStarResponse);
}

async function handleDbGetAllSessionsRequest(event: any) {
  return handleRequest(event, async () => {
    const worker = getDbWorker();
    const chats = await (Chat as any).getAllChats(worker);
    return { success: true, data: chats };
  }, DbGetAllSessionsResponse, 5000, 
    (res: any) => (res.data || []).sort((a: any, b: any) => (b.chat_timestamp || 0) - (a.chat_timestamp || 0))
  );
}

async function handleDbGetStarredSessionsRequest(event: any) {
  return handleRequest(event, async () => {
    const worker = getDbWorker();
    const chats = await (Chat as any).getAllChats(worker);
    const starred = chats.filter((c: any) => c.isStarred);
    return { success: true, data: starred };
  }, DbGetStarredSessionsResponse, 5000,
    (res: any) => (res.data || []).map((s: any) => ({ sessionId: s.id, name: s.title, lastUpdated: (s.chat_timestamp || 0), isStarred: s.isStarred }))
                               .sort((a: any, b: any) => b.lastUpdated - a.lastUpdated)
  );
}

async function handleDbDeleteSessionRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId) throw new AppError('INVALID_INPUT', 'Session ID is required');
    const worker = getDbWorker();
    const deleteResult = await Chat.deleteChat(payload.sessionId, worker, undefined, { deleteMessages: true, deleteSummaries: true, deleteKGNRels: true, deleteOrphanedEmbedding: true });
    if (!deleteResult.success) throw new AppError('DB_OPERATION_FAILED', deleteResult.error || `Failed to delete session ${payload.sessionId}`);
    if (currentChat && currentChat.id === payload.sessionId) currentChat = null;
    await publishSessionUpdate(payload.sessionId, 'delete', { id: payload.sessionId });
    return { success: true, data: true };
  }, DbDeleteSessionResponse);
}

async function handleDbRenameSessionRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.sessionId || !payload.newName) throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
    const worker = getDbWorker();
    let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await Chat.read(payload.sessionId, worker);
    if (!chat) throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
    await chat.update({ title: payload.newName });
    if (currentChat && currentChat.id === payload.sessionId) currentChat = chat;
    await publishSessionUpdate(chat.id, 'rename', chat);
    return { success: true, data: chat };
  }, DbRenameSessionResponse);
}

async function handleDbAddLogRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.logEntryData) throw new AppError('INVALID_INPUT', 'Missing logEntryData');
    const worker = getDbWorker();
    const logId = await LogEntry.create(payload.logEntryData, worker);
    return { success: true, data: { logId } };
  }, DbAddLogResponse);
}

async function handleDbGetLogsRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.filters) throw new AppError('INVALID_INPUT', 'Missing filters');
    const worker = getDbWorker();
    const logs = await LogEntry.getAll(worker, payload.filters);
    return {success: true, data: logs};
  }, DbGetLogsResponse);
}

async function handleDbGetUniqueLogValuesRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload?.fieldName) throw new AppError('INVALID_INPUT', 'Missing fieldName');
    const worker = getDbWorker();
    const logs = await LogEntry.getAll(worker);
    const uniqueValues = Array.from(new Set(logs.map((l: any) => l[payload.fieldName]).filter(Boolean)));
    return { success: true, data: uniqueValues };
  }, DbGetUniqueLogValuesResponse);
}

async function handleDbClearLogsRequest(event: any) {
  return handleRequest(event, async () => {
    const worker = getDbWorker();
    const logs = await LogEntry.getAll(worker);
    const sessionsToKeep = new Set([currentExtensionSessionId, previousExtensionSessionId].filter(Boolean));
    let deletedCount = 0;
    const deletePromises = logs
        .filter(log => !sessionsToKeep.has(log.extensionSessionId))
        .map(log => log.delete().then(() => deletedCount++).catch(e => console.warn(`Failed to delete log ${log.id}`, e)));
    await Promise.all(deletePromises);
    return { success: true, data: { deletedCount } };
  }, DbClearLogsResponse);
}

async function handleDbGetCurrentAndLastLogSessionIdsRequest(event: any) {
  return new DbGetCurrentAndLastLogSessionIdsResponse(event.requestId, true, {
    currentLogSessionId: currentExtensionSessionId,
    previousLogSessionId: previousExtensionSessionId
  });
}

async function handleDbResetDatabaseRequest(event: any) {
  return handleRequest(event, async () => {
    console.log("[DB] Attempting database reset via DBActions.RESET worker command.");
    const worker = getDbWorker(); // Get the current worker (throws if not available)
    await new Promise((resolve, reject) => {
      const reqId = crypto.randomUUID();
      dbWorkerCallbacks[reqId] = { resolve, reject };
      worker.postMessage({ action: DBActions.RESET, payload: null, requestId: reqId });
    });
    currentChat = null;
    console.log("[DB] Database reset complete. Re-initializing DB state.");
    isDbReadyFlag = false; 
    lastDbInitStatus = null; 
    dbInitPromise = null; // Clear any pending init
    await autoEnsureDbInitialized(); // This will use the existing worker or create a new one if needed
    return { success: true, data: true };
  }, DbResetDatabaseResponse, 15000); 
}

// --- Model Asset and Manifest Handlers ---
async function handleDbAddModelAssetRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload.folder || !payload.fileName || !payload.data || typeof payload.chunkIndex !== 'number') {
        throw new AppError('INVALID_INPUT', 'Missing required fields for model asset chunk (folder, fileName, data, chunkIndex).');
    }
    const worker = getDbWorker();
    const chunkId = await ModelAsset.createChunk(payload, worker);
    return { success: true, data: { chunkId } };
  }, DbAddModelAssetResponse);
}

async function handleDbAddManifestRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload.chunkGroupId || !payload.folder || !payload.fileName || !payload.totalFileSize || typeof payload.totalChunks !== 'number') {
        throw new AppError('INVALID_INPUT', 'Missing required fields for model asset manifest.');
    }
    const manifestId = await ModelAsset.createManifest(payload, getDbWorker());
    return { success: true, data: { manifestId } };
  }, DbAddManifestResponse);
}

async function handleDbGetManifestRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload.folder || !payload.fileName) {
        throw new AppError('INVALID_INPUT', 'Folder and fileName are required to get a manifest.');
    }
    const chunkGroupId = `${payload.folder}/${payload.fileName}`;
    const manifest = await ModelAsset.readManifestByChunkGroupId(chunkGroupId, getDbWorker());
    return { success: true, data: manifest }; // manifest can be null
  }, DbGetManifestResponse, 5000, (res: any) => res.data);
}

async function handleDbCountModelAssetChunksRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    if (!payload.folder || !payload.fileName) {
      throw new AppError('INVALID_INPUT', 'Folder and fileName are required for counting chunks.');
    }
    const chunkGroupId = `${payload.folder}/${payload.fileName}`;
    let count = 0;
    let verified = false;
    let errorMsg;

    try {
      const manifest = await ModelAsset.readManifestByChunkGroupId(chunkGroupId, getDbWorker());
      if (manifest && manifest.status === 'complete') {
        count = manifest.totalChunks;
        verified = (payload.expectedChunks ? count === payload.expectedChunks : true) &&
                   (payload.expectedSize ? manifest.size === payload.expectedSize : true) &&
                   (manifest.chunkSizeUsed ? manifest.chunkSizeUsed === APP_CHUNK_SIZE_CONFIG : true);
        
        return { success: true, data: { count, verified } };
      }
      
      // Fallback: If no complete manifest, count actual stored chunks.
      console.log(`[DB] No complete manifest for ${chunkGroupId}, counting actual chunks.`);
      const actualStoredCount = await ModelAsset.countStoredChunks(chunkGroupId, getDbWorker());
      count = actualStoredCount;
      verified = payload.expectedChunks ? count === payload.expectedChunks : false; 
      if (payload.expectedChunks && count !== payload.expectedChunks) {
          console.warn(`[DB] Chunk count mismatch for ${chunkGroupId}: Expected ${payload.expectedChunks}, Found ${count} actual chunks.`);
      }

    } catch (e: unknown) {
      const errObj = e as Error;
      console.error(`[DB] Error counting/verifying chunks for ${chunkGroupId}:`, errObj);
      errorMsg = errObj.message;
    }
    return { success: true, data: { count, verified, error: errorMsg } };
  }, DbCountModelAssetChunksResponse, 5000, (res: any) => res.data);
}

async function handleDbListModelFilesRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    const folderToList = payload.modelId || payload.folder;
    if (!folderToList) throw new AppError('INVALID_INPUT', 'modelId (or folder) is required.');
    
    const manifests = await ModelAsset.queryManifests({ folder: folderToList, type: MODEL_ASSET_TYPE_MANIFEST }, getDbWorker());
    const fileNames = manifests.map(m => m.fileName);
    return { success: true, data: fileNames };
  }, DbListModelFilesResponse);
}

async function handleDbGetModelAssetChunkRequest(event: any) {
  return handleRequest(event, async (payload: any) => {
    let chunkId;
    if (payload.chunkId) {
        chunkId = payload.chunkId;
    } else if (payload.folder && payload.fileName && typeof payload.chunkIndex === 'number') {
        chunkId = `${payload.folder}/${payload.fileName}:${payload.chunkIndex}`;
    } else {
        throw new AppError('INVALID_INPUT', 'Requires chunkId or (folder, fileName, chunkIndex).');
    }
    const chunk = await ModelAsset.readChunk(chunkId, getDbWorker());
    if (!chunk) return { success: false, error: `Chunk ${chunkId} not found` }; 
    return { success: true, data: chunk };
  }, DbGetModelAssetChunkResponse, 5000, (res: any) => res.data);
}

async function handleDbLogAllChunkGroupIdsForModelRequest(event: any) {
  return handleRequest( event, async (payload: any) => {
      if (!payload.folder) throw new AppError('INVALID_INPUT', 'Folder is required.');
      const groupIds = await ModelAsset.getUniqueChunkGroupIds(payload.folder, getDbWorker());
      return { success: true, data: groupIds };
    }, DbLogAllChunkGroupIdsForModelResponse
  );
}

async function handleDbGetModelAssetChunksRequest(event: any) {
  return handleRequest( event, async (payload: any) => {
      if (!payload.chunkGroupId) throw new AppError('INVALID_INPUT', 'chunkGroupId is required.');
      const metadataOnly = payload.metadataOnly === true;
      const chunks = await ModelAsset.getChunksByGroupId(payload.chunkGroupId, metadataOnly, getDbWorker());
      return { success: true, data: chunks };
    }, DbGetModelAssetChunksResponse
  );
}


// --- DB Handler Map ---
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
  [DbAddManifestRequest.type]: handleDbAddManifestRequest,
  [DbGetManifestRequest.type]: handleDbGetManifestRequest,
  [DbCountModelAssetChunksRequest.type]: handleDbCountModelAssetChunksRequest,
  [DbLogAllChunkGroupIdsForModelRequest.type]: handleDbLogAllChunkGroupIdsForModelRequest,
  [DbListModelFilesRequest.type]: handleDbListModelFilesRequest,
  [DbGetModelAssetChunksRequest.type]: handleDbGetModelAssetChunksRequest,
  [DbGetModelAssetChunkRequest.type]: handleDbGetModelAssetChunkRequest,
  
  [DbInitializeRequest.type]: handleDbEnsureInitialized,
  [DbEnsureInitializedRequest.type]: handleDbEnsureInitialized,
};

// --- Notification Publishing ---
function smartNotify(notification: any) {
 
  if (typeof window === 'undefined' || !window.document) {
    try {
        browser.runtime.sendMessage(notification).catch((e: any) => console.warn(`[DB] Error sending notification to runtime: ${e.message}`, notification.type));
    } catch (e: unknown) {
        const errObj = e as Error;
        console.warn(`[DB] Failed to call browser.runtime.sendMessage (maybe not in extension context): ${errObj.message}`);
    }
  } else {
    document.dispatchEvent(new CustomEvent(notification.type, { detail: notification }));
    if (dbChannel) dbChannel.postMessage(notification); else console.warn("[DB] dbChannel not initialized for smartNotify.");
  }
}

async function publishSessionUpdate(sessionId: string, updateType = 'update', sessionDataOverride: any = null) {
  try {
    let sessionData = sessionDataOverride;
    if (!sessionData) {
      if (!sessionId) {
        if (updateType === 'delete') sessionData = { id: null }; else return;
      } else {
        const worker = getDbWorker();
        const chat = await Chat.read(sessionId, worker);
        if (chat) sessionData = chat;
        else if (updateType === 'delete') sessionData = { id: sessionId };
        else { console.warn(`[DB] publishSessionUpdate: Session ${sessionId} not found for ${updateType}.`); return; }
      }
    }
    const plainSession = (sessionData && typeof sessionData.toJSON === 'function') ? sessionData.toJSON() : JSON.parse(JSON.stringify(sessionData || {}));
    smartNotify(new DbSessionUpdatedNotification(sessionId, plainSession, updateType));
  } catch (e) { console.error('[DB] Failed to publish session update:', e, { sessionId, updateType }); }
}

async function publishMessagesUpdate(sessionId: string, messages: any) {
  try {
    if (!Array.isArray(messages)) { console.error('[DB] publishMessagesUpdate: messages not an array:', messages); return; }
    const plainMessages = messages.map(m => (typeof m.toJSON === 'function' ? m.toJSON() : { ...m }));
    smartNotify(new DbMessagesUpdatedNotification(sessionId, plainMessages));
  } catch (e) { console.error('[DB] Failed to publish messages update:', e, { sessionId });}
}

async function publishStatusUpdate(sessionId: string, status: string) {
  try {
    smartNotify(new DbStatusUpdatedNotification(sessionId, status));
  } catch (e) { console.error('[DB] Failed to publish status update:', e, { sessionId });}
}

// --- Message Listener for External Requests ---
browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  if (!message || !message.type || !(dbHandlerMap as any)[message.type]) {
    if (Object.values(DBEventNames).includes(message?.type)) {
        // console.warn(`[DB] No handler mapped for DBEvent type: ${message.type}`);
    }
    return false;
  }

  console.log(`[DB] Received message for DB: ${message.type}, ReqID: ${message.requestId}`);
  forwardDbRequest(message)
    .then(responseObject => {
        // console.log(`[DB] Sending response for ${message.type} (ReqID: ${message.requestId}):`, responseObject);
        sendResponse(responseObject);
    })
    .catch(err => {
      console.error(`[DB] Error processing request ${message.type} (ReqID: ${message.requestId}):`, err);
      // Construct a generic error response if one isn't already formed by forwardDbRequest
      const errorResponse: any = { 
          success: false, 
          error: err.message || 'Unknown error in DB request processing chain', 
          requestId: message.requestId,
          type: `${message.type}_RESPONSE` // Attempt to form a conventional response type
      };
      if (err instanceof AppError) {
          errorResponse.code = err.code;
          errorResponse.details = err.details;
      }
      sendResponse(errorResponse);
    });
  return true;
});

export async function forwardDbRequest(request: any) {
  const handler = (dbHandlerMap as any)[request?.type];
  if (!handler) { // Should have been caught by listener, but defensive check
      console.error(`[DB] CRITICAL: No handler found in forwardDbRequest for type: ${request?.type}`);
      const NoHandlerErrorResponse = (globalThis as any)[request.type.replace("Request", "Response")];
      if (NoHandlerErrorResponse && typeof NoHandlerErrorResponse === 'function') {
          return new NoHandlerErrorResponse(request.requestId, false, null, new AppError('NO_HANDLER', `No handler for ${request.type}`));
      }
      return { success: false, error: `No handler for ${request.type}`, requestId: request.requestId, type: `${request.type}_ERROR_RESPONSE` };
  }
  
  try {
    return await handler(request);
  } catch (err: any) {

    console.error(`[DB] Synchronous or unhandled promise error in handler for ${request.type}:`, err);
    const appError = (err instanceof AppError) ? err : new AppError('HANDLER_EXECUTION_ERROR', err.message || `Error executing handler for ${request.type}`, { originalError: err });
    const ResponseClass = (globalThis as any)[request.type.replace("Request", "Response")];
    if (ResponseClass && typeof ResponseClass === 'function') {
        return new ResponseClass(request.requestId, false, null, appError);
    }
    return { success: false, error: appError.message, details: appError.details, requestId: request.requestId, type: `${request.type}_ERROR_RESPONSE` };
  }
}

export { autoEnsureDbInitialized, lastDbInitStatus };



