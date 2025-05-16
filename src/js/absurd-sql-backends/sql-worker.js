console.log('IndexedDB in worker:', typeof indexedDB !== 'undefined');
console.log('[SQL Worker][Main] Worker script loaded');

import initSqlJs from '@vendor/sql.js/dist/sql-wasm-debug.js';
import { SQLiteFS } from '@vendor/absurd-sql/dist/index.js';
import IndexedDBBackend from '@vendor/absurd-sql/dist/indexeddb-backend.js';


import {
    DbGetSessionRequest,
    DbCreateSessionRequest,
    DbDeleteSessionRequest,
    DbRenameSessionRequest,
    DbGetAllSessionsRequest,
    DbGetStarredSessionsRequest,
    DbToggleStarRequest,
    DbUpdateStatusRequest,
    DbAddMessageRequest,
    DbUpdateMessageRequest,
    DbDeleteMessageRequest,
    DbAddLogRequest,
    DbGetLogsRequest,
    DbGetUniqueLogValuesRequest,
    DbClearLogsRequest,
    DbAddModelAssetRequest,
    DbCountModelAssetChunksRequest,
    DbLogAllChunkGroupIdsForModelRequest,
    DbListModelFilesRequest,
    DbGetModelAssetChunksRequest,
    DbGetModelAssetChunkRequest
} from '../../events/dbEvents.js';
import { DBEventNames, MessageSenderTypes, DBPaths, TableNames } from '../../events/eventNames.js';

let SQL = null;
let workerInitialized = false;
let sqlJsWasmUrl = null;

// Shared DB files and tables, populated at runtime
let dbFilesAndTables = [];
let dbFilesToCreate = [];

const SQL_WORKER_LOG_PREFIX = '[SQL Worker]';



class AppError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}

// Add error logging helper at the top (after AppError class)
function logErrorWithStack(prefix, error) {
    if (error instanceof Error) {
        console.error(`${prefix} ${error.message}\nStack: ${error.stack}`);
    } else {
        console.error(`${prefix} ${JSON.stringify(error)}`);
    }
}

async function ensureSqlJsAndAbsurdFS(schemaConfig, dbFilesAndTablesFromPayload, dbFilesToCreateFromPayload) {
    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Called.`);
    if (SQL && workerInitialized) {
        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Already initialized.`);
        return;
    }

    if (!SQL) {
        if (!sqlJsWasmUrl) {
            console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] CRITICAL: sqlJsWasmUrl is not set. Cannot initialize SQL.js.`);
            throw new AppError("INIT_ERROR", "sqlJsWasmUrl is not set for SQL.js initialization.");
        }
        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Instantiating sql.js WASM from URL: ${sqlJsWasmUrl}`);
        SQL = await initSqlJs({
            locateFile: (filename) => {
                if (filename.endsWith('.wasm')) return sqlJsWasmUrl;
                return filename;
            }
        });
        if (SQL.default) SQL = SQL.default;
        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] SQL.js WASM instance created. SQL.FS exists: ${!!SQL.FS}`);
    }

    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Setting up SQLiteFS with IndexedDBBackend.`);
    const sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
    SQL.FS.mount(sqlFS, '/sql');
    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] SQLiteFS mounted at /sql.`);

    if (!SQL.FS.analyzePath('/sql').exists) {
        SQL.FS.mkdir('/sql');
        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Created /sql directory.`);
    } else {
        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] /sql directory already exists.`);
    }

    // Set up dbFilesToCreate for schema creation (init only)
    if (dbFilesToCreateFromPayload && Array.isArray(dbFilesToCreateFromPayload)) {
        dbFilesToCreate = dbFilesToCreateFromPayload;
    }
    // Set up dbFilesAndTables for table management (init only)
    if (dbFilesAndTablesFromPayload && Array.isArray(dbFilesAndTablesFromPayload)) {
        dbFilesAndTables = dbFilesAndTablesFromPayload;
    }

    for (const { path: dbPath, schema: dbSchemaContent } of dbFilesToCreate) {
        if (!SQL.FS.analyzePath(dbPath).exists) {
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] DB file ${dbPath} does not exist. Creating...`);
            const tmpDb = new SQL.Database();
            console.log(' [SQL Worker] Absurd-SQL backend:', tmpDb.backend && tmpDb.backend.constructor && tmpDb.backend.constructor.name);
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Executing schema for ${dbPath}:
${dbSchemaContent}`);
            tmpDb.exec(dbSchemaContent);
            // Insert dummy row for chat.db only
            if (dbPath === DBPaths.CHAT) {
                try {
                    tmpDb.run(`INSERT INTO ${TableNames.CHATS} (id, title, timestamp, isStarred, status) VALUES (?, ?, ?, ?, ?)`, [
                        "init-session", "DB Initialized", Date.now(), 0, "idle"
                    ]);
                    tmpDb.run(`INSERT INTO ${TableNames.MESSAGES} (id, chat_id, timestamp, sender, type, content, metadata, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                        "init-msg", "init-session", Date.now(), "system", "text", "Database initialized successfully.", "{}", new Uint8Array(384)
                    ]);
                    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Inserted dummy chat and message row for DB initialization.`);
                } catch (e) {
                    console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Error inserting dummy row:`, e);
                }
            }
            // Insert dummy row for knowledge_graph_nodes if initializing knowledge.db
            if (dbPath === DBPaths.KNOWLEDGE) {
                try {
                    tmpDb.run(`INSERT INTO ${TableNames.KNOWLEDGE_GRAPH_NODES} (id, type, label, properties, embedding, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                        "init-node",
                        "entity",
                        "Initial Node",
                        JSON.stringify({ description: "Dummy node for initialization" }),
                        new Uint8Array(384),
                        Date.now(),
                        Date.now()
                    ]);
                    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Inserted dummy knowledge_graph_nodes row for DB initialization.`);
                } catch (e) {
                    console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Error inserting dummy knowledge_graph_nodes row:`, e);
                }
            }
            
            const tableNames = [];
            const tablesStmt = tmpDb.prepare("SELECT name FROM sqlite_master WHERE type='table'");
            while (tablesStmt.step()) tableNames.push(tablesStmt.getAsObject().name);
            tablesStmt.free();
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Tables in temporary DB for ${dbPath}: ${tableNames.join(', ')}`);

            for (const tableName of tableNames) {
                const pragmaStmt = tmpDb.prepare(`PRAGMA table_info(${tableName})`);
                const columns = [];
                while (pragmaStmt.step()) columns.push(pragmaStmt.getAsObject());
                pragmaStmt.free();
                console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Table ${tableName} columns in temporary DB for ${dbPath}:`, columns.map(c => c.name));
            }

            const data = tmpDb.export();
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Exported data for ${dbPath}. Length: ${data.length}`);
            if (data.length > 0) {
                const headerSlice = data.slice(0, Math.min(16, data.length));
                const headerHex = Array.from(headerSlice).map(b => b.toString(16).padStart(2, '0')).join(' ');
                const headerString = new TextDecoder('ascii', { fatal: false }).decode(headerSlice);
                console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Data header (hex) for ${dbPath}: ${headerHex}`);
                console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Data header (ascii) for ${dbPath}: ${headerString.replace(/[^\x20-\x7E]/g, '.')}`);
                if (headerString.startsWith("SQLite format 3")) {
                    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Exported data for ${dbPath} HAS correct SQLite header.`);
                } else {
                    console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] ERROR: Exported data for ${dbPath} does NOT have correct SQLite header!`);
                }
            } else {
                console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] ERROR: Exported data for ${dbPath} is EMPTY!`);
            }

            SQL.FS.writeFile(dbPath, data);
            tmpDb.close();
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] SQL.FS.writeFile called for ${dbPath}. DB file should be created.`);
            // Force sync and log
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Syncing FS to IndexedDB after schema creation...`);
            await new Promise((resolve) => {
                SQL.FS.syncfs(false, (err) => {
                    if (err) {
                        console.error(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] ERROR syncing FS after schema creation:`, err);
                    } else {
                        console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] DB successfully synced to IndexedDB after schema creation!`);
                    }
                    resolve();
                });
            });
        } else {
            console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] DB file ${dbPath} already exists. Skipping creation.`);
        }
    }
    workerInitialized = true;
    console.log(`${SQL_WORKER_LOG_PREFIX}[ensureSqlJsAndAbsurdFS] Worker initialization complete.`);
}

async function handleInitRequest(payload) {
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleInitRequest] Called. Payload keys: ${Object.keys(payload)}`);
    if (payload && payload.schema) {
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleInitRequest] Received schema keys: ${Object.keys(payload.schema)}`);
    } else {
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleInitRequest] Received NO schema! This is critical.`);
        throw new AppError("INIT_ERROR", "Schema missing in init payload.");
    }
    sqlJsWasmUrl = payload && payload.wasmUrl;
    await ensureSqlJsAndAbsurdFS(payload.schema, payload.dbFilesAndTables, payload.dbFilesToCreate);
    return { success: true };
}

async function handleResetRequest() {
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleResetRequest] Performing CRUD-style reset (delete all data from all tables).`);
    for (const { path: dbPath, tables } of dbFilesAndTables) {
        if (!SQL.FS.analyzePath(dbPath).exists) continue;
        const db = new SQL.Database(SQL.FS.readFile(dbPath));
        for (const table of tables) {
            try {
                db.run(`DELETE FROM ${table};`);
            } catch (e) {
                console.warn(`${SQL_WORKER_LOG_PREFIX}[handleResetRequest] Failed to delete from table ${table} in ${dbPath}:`, e);
            }
        }
        try {
            db.run('VACUUM;');
        } catch (e) {
            console.warn(`${SQL_WORKER_LOG_PREFIX}[handleResetRequest] VACUUM failed for ${dbPath}:`, e);
        }
        SQL.FS.writeFile(dbPath, db.export());
        db.close();
    }
    await flushSqlFsSingle();
    return { success: true };
}

function diagnosticLogDBFileInfo(functionName, dbPath) {
    console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Attempting to access DB ${dbPath}`);
    if (SQL.FS.analyzePath(dbPath).exists) {
        console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] ${dbPath} exists according to SQL.FS.analyzePath.`);
        const stat = SQL.FS.stat(dbPath);
        console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] ${dbPath} stat: mode=${stat.mode}, size=${stat.size}, mtime=${stat.mtime}`);
        try {
            const fileData = SQL.FS.readFile(dbPath, { encoding: 'binary' });
            console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Raw file data length for ${dbPath}: ${fileData.length}`);
            if (fileData.length > 0) {
                const headerSlice = fileData.slice(0, Math.min(16, fileData.length));
                const headerHex = Array.from(headerSlice).map(b => b.toString(16).padStart(2, '0')).join(' ');
                const headerString = new TextDecoder('ascii', { fatal: false }).decode(headerSlice);
                console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Raw file data header (hex) for ${dbPath}: ${headerHex}`);
                console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Raw file data header (ascii) for ${dbPath}: ${headerString.replace(/[^\x20-\x7E]/g, '.')}`);
                if (!headerString.startsWith("SQLite format 3")) {
                    console.error(`${SQL_WORKER_LOG_PREFIX}[${functionName}] ERROR: Raw file data for ${dbPath} does NOT have correct SQLite header!`);
                } else {
                    console.log(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Raw file data for ${dbPath} HAS correct SQLite header.`);
                }
            } else {
                console.error(`${SQL_WORKER_LOG_PREFIX}[${functionName}] ERROR: Raw file data for ${dbPath} is EMPTY!`);
            }
        } catch (e) {
            console.error(`${SQL_WORKER_LOG_PREFIX}[${functionName}] Error reading raw file ${dbPath}: ${e.message}`, e.stack);
        }
    } else {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[${functionName}] ${dbPath} does NOT exist according to SQL.FS.analyzePath! This may be an error for read operations.`);
    }
}

async function handleGetChatSessionByIdRequest(payload) {
    const { sessionId } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetChatSessionByIdRequest] Called with sessionId: ${sessionId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleGetChatSessionByIdRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let result = null;
    if (stmt.step()) result = stmt.getAsObject();
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!result) {
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetChatSessionByIdRequest] Session ${sessionId} not found.`);
        return { success: false, error: `Session ${sessionId} not found` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetChatSessionByIdRequest] Found session: ${result.id}`);
    return { success: true, data: result };
}

/**
 * Helper: Persist and close chat DB after write.
 * Exports the DB, writes to FS, closes, and flushes FS.
 */
async function persistAndCloseChatDb(db, dbPath) {
    SQL.FS.writeFile(dbPath, db.export());
    db.close();
    console.log(`${SQL_WORKER_LOG_PREFIX}[persistAndCloseChatDb] Syncing FS to IndexedDB after write...`);
    await flushSqlFsSingle();
    console.log(`${SQL_WORKER_LOG_PREFIX}[persistAndCloseChatDb] FS sync complete.`);
}

// Helper to get embedding or placeholder
function getEmbeddingOrPlaceholder(obj) {
    if (obj && obj.embedding && (obj.embedding instanceof Uint8Array || obj.embedding instanceof Float32Array)) {
        return obj.embedding;
    }
    if (obj && obj.embedding && Array.isArray(obj.embedding)) {
        return new Uint8Array(obj.embedding);
    }
    // If embedding is a JSON string
    if (obj && typeof obj.embedding === 'string') {
        try {
            const arr = JSON.parse(obj.embedding);
            if (Array.isArray(arr)) return new Uint8Array(arr);
        } catch {}
    }
    // Default: 384-dim zero vector (adjust size as needed)
    return new Uint8Array(384);
}

async function handleCreateChatSessionRequest(payload) {
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] ENTRY. Payload:`, payload);
    const dbPath = DBPaths.CHAT;
    let db = null;
    let dbSuccessfullyOpenedOrReopened = false;
    try {
        const { initialMessage } = payload;
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Called with initialMessage sender: ${initialMessage?.sender}, text length: ${initialMessage?.text?.length}`);
        if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
        if (!initialMessage || !initialMessage.text) {
            console.error(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Initial message with text is required.`);
            return { success: false, error: 'Initial message with text is required' };
        }
        diagnosticLogDBFileInfo('handleCreateChatSessionRequest', dbPath);
        db = new SQL.Database(SQL.FS.readFile(dbPath));
        dbSuccessfullyOpenedOrReopened = true;
        console.log('Absurd-SQL backend (initial open):', db.backend && db.backend.constructor && db.backend.constructor.name);
        const timestamp = Date.now();
        const sessionId = crypto.randomUUID();
        const message = {
            ...initialMessage,
            text: initialMessage.text.replace(/[<>]/g, ''),
            messageId: `${sessionId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: initialMessage.timestamp || timestamp,
            sender: initialMessage.sender || MessageSenderTypes.USER,
            isLoading: initialMessage.isLoading ?? false,
        };
        const sessionData = {
            id: sessionId,
            tabId: null,
            timestamp,
            title: message.text.substring(0, 30) + (message.text.length > 30 ? '...' : ''),
            isStarred: 0,
            status: 'idle'
        };
        db.run(
            `INSERT INTO ${TableNames.CHATS} (id, tabId, timestamp, title, isStarred, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionData.id, sessionData.tabId, sessionData.timestamp, sessionData.title, sessionData.isStarred, sessionData.status]
        );
        db.run(
            `INSERT INTO ${TableNames.MESSAGES} (id, chat_id, timestamp, sender, type, content, metadata, embedding)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                message.messageId,
                sessionId,
                message.timestamp,
                message.sender,
                message.type || 'text',
                message.text,
                message.metadata ? JSON.stringify(message.metadata) : '{}',
                getEmbeddingOrPlaceholder(message)
            ]
        );
        const stmtChat = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
        stmtChat.bind([sessionId]);
        let newSessionRow = null;
        if (stmtChat.step()) newSessionRow = stmtChat.getAsObject();
        stmtChat.free();
        if (!newSessionRow) {
            console.error(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Failed to retrieve session from DB after insert.`);
            return { success: false, error: 'Failed to create session (not found after insert)' };
        }
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Session created and verified in DB: ${newSessionRow.id}`);
        // --- MODIFICATION: Persist, close, and re-open DB ---
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Persisting changes, closing, and re-opening DB before fetching messages.`);
        SQL.FS.writeFile(dbPath, db.export());
        db.close();
        dbSuccessfullyOpenedOrReopened = false;
        db = new SQL.Database(SQL.FS.readFile(dbPath));
        dbSuccessfullyOpenedOrReopened = true;
        console.log('Absurd-SQL backend (re-opened):', db.backend && db.backend.constructor && db.backend.constructor.name);
        // --- END OF MODIFICATION ---
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Fetching messages for session ${sessionId} from re-opened DB...`);
        const stmtMessages = db.prepare(`SELECT * FROM ${TableNames.MESSAGES} WHERE chat_id = ? ORDER BY timestamp ASC LIMIT 1000`);
        const messages = [];
        stmtMessages.bind([sessionId]);
        while (stmtMessages.step()) {
            messages.push(stmtMessages.getAsObject());
        }
        stmtMessages.free();
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] Loaded ${messages.length} messages for session ${sessionId}.`);
        const fullSessionData = { ...sessionData, ...newSessionRow, messages };
        return { success: true, newSessionId: newSessionRow.id, data: fullSessionData };
    } catch (error) {
        logErrorWithStack('[handleCreateChatSessionRequest][CATCH]', error);
        return { success: false, error: error.message, stack: error.stack };
    } finally {
        if (dbSuccessfullyOpenedOrReopened && db) {
            console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] In finally block, ensuring DB is persisted and closed.`);
            await persistAndCloseChatDb(db, dbPath);
        } else {
            console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] In finally block, DB was not in a state to be persisted/closed by persistAndCloseChatDb.`);
        }
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleCreateChatSessionRequest] EXIT`);
    }
}

async function handleAddMessageToChatRequest(payload) {
    const { chatId, messageObject } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddMessageToChatRequest] Called for chatId: ${chatId}, message sender: ${messageObject?.sender}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleAddMessageToChatRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    // Check if chat exists
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([chatId]);
    let chatRow = null;
    if (stmt.step()) chatRow = stmt.getAsObject();
    stmt.free();
    if (!chatRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleAddMessageToChatRequest] Chat session not found for id ${chatId}`);
        return { success: false, error: `Chat session ${chatId} not found` };
    }
    // Insert new message
    const newMessage = {
        ...messageObject,
        text: messageObject.text.replace(/[<>]/g, ''),
        messageId: messageObject.messageId || `${chatId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: messageObject.timestamp || Date.now(),
        isLoading: messageObject.isLoading ?? false
    };
    db.run(
        `INSERT INTO ${TableNames.MESSAGES} (id, chat_id, timestamp, sender, type, content, metadata, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            newMessage.messageId,
            chatId,
            newMessage.timestamp,
            newMessage.sender,
            newMessage.type || 'text',
            newMessage.text,
            newMessage.metadata ? JSON.stringify(newMessage.metadata) : '{}',
            getEmbeddingOrPlaceholder(newMessage)
        ]
    );
    // Fetch updated session and messages
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([chatId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    // Fetch messages for this chat
    const stmtMessages = db.prepare(`SELECT * FROM ${TableNames.MESSAGES} WHERE chat_id = ? ORDER BY timestamp ASC LIMIT 1000`);
    const messages = [];
    stmtMessages.bind([chatId]);
    while (stmtMessages.step()) {
        messages.push(stmtMessages.getAsObject());
    }
    stmtMessages.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleAddMessageToChatRequest] Failed to retrieve updated session ${chatId}`);
        return { success: false, error: `Failed to update session ${chatId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddMessageToChatRequest] Message added. New messageId: ${newMessage.messageId}`);
    return { success: true, data: { newMessageId: newMessage.messageId, updatedDoc: { ...updatedSessionRow, messages } } };
}

async function handleUpdateMessageInChatRequest(payload) {
    const { chatId, messageId, updates } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleUpdateMessageInChatRequest] Called for chatId: ${chatId}, messageId: ${messageId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleUpdateMessageInChatRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    // Check if chat exists
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([chatId]);
    let chatRow = null;
    if (stmt.step()) chatRow = stmt.getAsObject();
    stmt.free();
    if (!chatRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleUpdateMessageInChatRequest] Chat session not found for id ${chatId}`);
        return { success: false, error: `Chat session ${chatId} not found` };
    }
    // Update message in messages table
    if (updates.text) {
        db.run(
            `UPDATE ${TableNames.MESSAGES} SET content = ?, timestamp = ?, embedding = ? WHERE id = ? AND chat_id = ?`,
            [
                updates.text.replace(/[<>]/g, ''),
                updates.timestamp || Date.now(),
                getEmbeddingOrPlaceholder(updates),
                messageId,
                chatId
            ]
        );
    } else if (updates.hasOwnProperty('text') && updates.text === null) {
        db.run(
            `UPDATE ${TableNames.MESSAGES} SET content = NULL, timestamp = ?, embedding = ? WHERE id = ? AND chat_id = ?`,
            [
                updates.timestamp || Date.now(),
                getEmbeddingOrPlaceholder(updates),
                messageId,
                chatId
            ]
        );
    }
    // Fetch updated session and messages
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([chatId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    // Fetch messages for this chat
    const stmtMessages = db.prepare(`SELECT * FROM ${TableNames.MESSAGES} WHERE chat_id = ? ORDER BY timestamp ASC LIMIT 1000`);
    const messages = [];
    stmtMessages.bind([chatId]);
    while (stmtMessages.step()) {
        messages.push(stmtMessages.getAsObject());
    }
    stmtMessages.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleUpdateMessageInChatRequest] Failed to retrieve updated session ${chatId}`);
        return { success: false, error: `Failed to update session ${chatId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleUpdateMessageInChatRequest] Message updated for messageId: ${messageId}`);
    return { success: true, data: { ...updatedSessionRow, messages } };
}

async function handleDeleteMessageFromChatRequest(payload) {
    const { sessionId, messageId } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleDeleteMessageFromChatRequest] Called for sessionId: ${sessionId}, messageId: ${messageId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleDeleteMessageFromChatRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    // Check if chat exists
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let sessionRow = null;
    if (stmt.step()) sessionRow = stmt.getAsObject();
    stmt.free();
    if (!sessionRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleDeleteMessageFromChatRequest] Session not found for id ${sessionId}`);
        return { success: false, error: `Session ${sessionId} not found` };
    }
    // Delete message from messages table
    db.run(`DELETE FROM ${TableNames.MESSAGES} WHERE id = ? AND chat_id = ?`, [messageId, sessionId]);
    // Fetch updated session and messages
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([sessionId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    // Fetch messages for this chat
    const stmtMessages = db.prepare(`SELECT * FROM ${TableNames.MESSAGES} WHERE chat_id = ? ORDER BY timestamp ASC LIMIT 1000`);
    const messages = [];
    stmtMessages.bind([sessionId]);
    while (stmtMessages.step()) {
        messages.push(stmtMessages.getAsObject());
    }
    stmtMessages.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleDeleteMessageFromChatRequest] Failed to retrieve updated session ${sessionId}`);
        return { success: false, error: `Failed to update session ${sessionId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleDeleteMessageFromChatRequest] Message deleted for messageId: ${messageId}`);
    return { success: true, data: { updatedDoc: { ...updatedSessionRow, messages }, deleted: true } };
}

async function handleUpdateSessionStatusRequest(payload) {
    const { sessionId, status } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleUpdateSessionStatusRequest] Called for sessionId: ${sessionId}, status: ${status}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const validStatuses = ['idle', 'processing', 'complete', 'error'];
    if (!sessionId || !validStatuses.includes(status)) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleUpdateSessionStatusRequest] Invalid sessionId or status. SessionId: ${sessionId}, Status: ${status}`);
        return { success: false, error: `Invalid session ID or status: ${status}` };
    }
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleUpdateSessionStatusRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let chatRow = null;
    if (stmt.step()) chatRow = stmt.getAsObject();
    stmt.free();
    if (!chatRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleUpdateSessionStatusRequest] Session not found for id ${sessionId}`);
        return { success: false, error: `Session ${sessionId} not found` };
    }
    db.run(`UPDATE ${TableNames.CHATS} SET status = ? WHERE id = ?`, [status, sessionId]);
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([sessionId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleUpdateSessionStatusRequest] Failed to retrieve updated session ${sessionId}`);
        return { success: false, error: `Failed to update session ${sessionId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleUpdateSessionStatusRequest] Status updated to ${status} for sessionId: ${sessionId}`);
    return { success: true, data: updatedSessionRow };
}

async function handleToggleItemStarredRequest(payload) {
    const { sessionId } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleToggleItemStarredRequest] Called for sessionId: ${sessionId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleToggleItemStarredRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT isStarred FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let entryRow = null;
    if (stmt.step()) entryRow = stmt.getAsObject();
    stmt.free();
    if (!entryRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleToggleItemStarredRequest] Item not found for id ${sessionId}`);
        return { success: false, error: `Item ${sessionId} not found` };
    }
    const newStarredStatus = entryRow.isStarred ? 0 : 1;
    db.run(`UPDATE ${TableNames.CHATS} SET isStarred = ? WHERE id = ?`, [newStarredStatus, sessionId]);
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([sessionId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleToggleItemStarredRequest] Failed to retrieve updated item ${sessionId}`);
        return { success: false, error: `Failed to update item ${sessionId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleToggleItemStarredRequest] Starred status toggled for sessionId: ${sessionId} to ${newStarredStatus}`);
    return { success: true, data: updatedSessionRow };
}

async function handleDeleteHistoryItemRequest(payload) {
    const { sessionId } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleDeleteHistoryItemRequest] Called for sessionId: ${sessionId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleDeleteHistoryItemRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let entryRow = null;
    if (stmt.step()) entryRow = stmt.getAsObject();
    stmt.free();
    if (!entryRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleDeleteHistoryItemRequest] Item not found for id ${sessionId}`);
        return { success: false, error: `Item ${sessionId} not found` };
    }
    db.run(`DELETE FROM ${TableNames.MESSAGES} WHERE chat_id = ?`, [sessionId]); // Cascade delete support
    db.run(`DELETE FROM ${TableNames.CHATS} WHERE id = ?`, [sessionId]);
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleDeleteHistoryItemRequest] Item deleted for sessionId: ${sessionId}`);
    return { success: true, data: true }; // Indicate success
}

async function handleRenameHistoryItemRequest(payload) {
    const { sessionId, newName } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleRenameHistoryItemRequest] Called for sessionId: ${sessionId}, newName: ${newName}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleRenameHistoryItemRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT id FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt.bind([sessionId]);
    let entryRow = null;
    if (stmt.step()) entryRow = stmt.getAsObject();
    stmt.free();
    if (!entryRow) {
        await persistAndCloseChatDb(db, dbPath);
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleRenameHistoryItemRequest] Item not found for id ${sessionId}`);
        return { success: false, error: `Item ${sessionId} not found` };
    }
    const sanitizedTitle = newName.replace(/[<>]/g, '');
    db.run(`UPDATE ${TableNames.CHATS} SET title = ? WHERE id = ?`, [sanitizedTitle, sessionId]);
    const stmt2 = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE id = ?`);
    stmt2.bind([sessionId]);
    let updatedSessionRow = null;
    if (stmt2.step()) updatedSessionRow = stmt2.getAsObject();
    stmt2.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!updatedSessionRow) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleRenameHistoryItemRequest] Failed to retrieve updated item ${sessionId}`);
        return { success: false, error: `Failed to update item ${sessionId}` };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleRenameHistoryItemRequest] Item renamed for sessionId: ${sessionId} to ${sanitizedTitle}`);
    return { success: true, data: updatedSessionRow };
}

async function handleGetAllSessionsRequest() {
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetAllSessionsRequest] Called.`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleGetAllSessionsRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT * FROM ${TableNames.CHATS} ORDER BY timestamp DESC`);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);

    let safeRows;
    try {
        safeRows = rows.map(row => ({
            ...row,
            messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages,
        }));
        safeRows = JSON.parse(JSON.stringify(safeRows));
    } catch (e) {
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleGetAllSessionsRequest] JSON processing error: ${e.message}`);
        safeRows = [];
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetAllSessionsRequest] Returning ${safeRows.length} sessions.`);
    return { success: true, data: safeRows };
}

async function handleGetStarredSessionsRequest() {
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetStarredSessionsRequest] Called.`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.CHAT;
    diagnosticLogDBFileInfo('handleGetStarredSessionsRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT * FROM ${TableNames.CHATS} WHERE isStarred = 1 ORDER BY timestamp DESC`);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetStarredSessionsRequest] Returning ${rows.length} starred sessions.`);
    return { success: true, data: rows };
}

async function handleAddLogRequest(payload) {
    const { logEntryData } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddLogRequest] Called. Level: ${logEntryData?.level}, Component: ${logEntryData?.component}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    if (!logEntryData) {
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleAddLogRequest] logEntryData is missing.`);
        return { success: false, error: "logEntryData is missing" };
    }
    const dbPath = DBPaths.LOGS;
    // No diagnosticLogDBFileInfo here to avoid recursive logging for logs DB itself
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    try {
        db.run(
            `INSERT INTO logs (id, timestamp, level, message, component, extensionSessionId, chatSessionId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                logEntryData.id || crypto.randomUUID(),
                logEntryData.timestamp || Date.now(),
                logEntryData.level,
                logEntryData.message,
                logEntryData.component,
                logEntryData.extensionSessionId,
                logEntryData.chatSessionId || null
            ]
        );
    } catch(e) {
        await persistAndCloseChatDb(db, dbPath);
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleAddLogRequest] Error inserting log: ${e.message}`);
        return { success: false, error: e.message };
    }
    await persistAndCloseChatDb(db, dbPath);
    // console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddLogRequest] Log entry added.`); // Avoid excessive logging
    return { success: true }; // Fire and forget, but indicate success of DB operation
}


async function handleGetLogsRequest(payload) {
    const { filters } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetLogsRequest] Called with filters: ${JSON.stringify(filters)}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.LOGS;
    diagnosticLogDBFileInfo('handleGetLogsRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    let sql = `SELECT * FROM logs`;
    const whereClauses = [];
    const params = [];
    if (filters.level) { whereClauses.push("level = ?"); params.push(filters.level); }
    if (filters.component) { whereClauses.push("component = ?"); params.push(filters.component); }
    if (filters.extensionSessionId) { whereClauses.push("extensionSessionId = ?"); params.push(filters.extensionSessionId); }
    if (filters.chatSessionId) { whereClauses.push("chatSessionId = ?"); params.push(filters.chatSessionId); }
    if (filters.searchTerm) { whereClauses.push("message LIKE ?"); params.push(`%${filters.searchTerm}%`); }
    if (filters.startDate) { whereClauses.push("timestamp >= ?"); params.push(filters.startDate); }
    if (filters.endDate) { whereClauses.push("timestamp <= ?"); params.push(filters.endDate); }
    if (whereClauses.length > 0) sql += " WHERE " + whereClauses.join(" AND ");
    sql += ` ORDER BY timestamp ${(filters.sortOrder || 'DESC').toUpperCase()}`;
    if (filters.limit) { sql += " LIMIT ?"; params.push(filters.limit); }
    if (filters.offset) { sql += " OFFSET ?"; params.push(filters.offset); }
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetLogsRequest] Returning ${rows.length} logs.`);
    return { success: true, data: rows };
}

async function handleGetUniqueLogValuesRequest(payload) {
    const { fieldName } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetUniqueLogValuesRequest] Called for fieldName: ${fieldName}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const validFields = ['level', 'component', 'extensionSessionId', 'chatSessionId'];
    if (!validFields.includes(fieldName)) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleGetUniqueLogValuesRequest] Invalid fieldName: ${fieldName}`);
        return { success: false, error: `Invalid field name for unique values: ${fieldName}` };
    }
    const dbPath = DBPaths.LOGS;
    diagnosticLogDBFileInfo('handleGetUniqueLogValuesRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT DISTINCT ${fieldName} FROM logs WHERE ${fieldName} IS NOT NULL ORDER BY ${fieldName} ASC`);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    const uniqueValues = rows.map(r => r[fieldName]);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetUniqueLogValuesRequest] Returning ${uniqueValues.length} unique values for ${fieldName}.`);
    return { success: true, data: uniqueValues };
}

async function handleClearLogsRequest(payload) {
    const { sessionIdsToDelete } = payload; // Assuming payload is { sessionIdsToDelete: [...] }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleClearLogsRequest] Called with ${sessionIdsToDelete?.length || 0} sessionIdsToDelete.`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    
    const dbPath = DBPaths.LOGS;
    diagnosticLogDBFileInfo('handleClearLogsRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);

    let deletedCount = 0;
    if (!sessionIdsToDelete || sessionIdsToDelete.length === 0) {
        console.log(`${SQL_WORKER_LOG_PREFIX}[handleClearLogsRequest] No specific session IDs provided to delete. Clearing all logs.`);
        // To clear all logs (if that's the desired behavior for empty sessionIdsToDelete):
        // db.run("DELETE FROM logs"); 
        // For now, let's assume empty means "do nothing specific" or an error.
        // Based on minimaldb, it calculates sessionIdsToDelete. If it sends empty, it means nothing to delete.
        await persistAndCloseChatDb(db, dbPath);
        return { success: true, data: { deletedCount: 0 } };
    }
    
    const placeholders = sessionIdsToDelete.map(() => '?').join(',');
    const sql = `DELETE FROM logs WHERE extensionSessionId IN (${placeholders})`;
    
    try {
        db.run(sql, sessionIdsToDelete);
        const changesStmt = db.prepare("SELECT changes()");
        if (changesStmt.step()) deletedCount = changesStmt.get()[0];
        changesStmt.free();
    } catch (e) {
        await persistAndCloseChatDb(db, dbPath);
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleClearLogsRequest] Error during deletion: ${e.message}`);
        return { success: false, error: e.message || String(e), data: { deletedCount: 0 } };
    }
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleClearLogsRequest] Deleted ${deletedCount} logs based on session IDs.`);
    return { success: true, data: { deletedCount } };
}

async function handleAddModelAssetRequest(payload) {
    const { folder, fileName, fileType, data, chunkIndex = 0, totalChunks = 1, chunkGroupId = '', binarySize = null, totalFileSize = null } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddModelAssetRequest] Called for folder: ${folder}, fileName: ${fileName}, chunkIndex: ${chunkIndex}, totalChunks: ${totalChunks}, chunkGroupId: ${chunkGroupId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleAddModelAssetRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);

    const currentChunkIndex = Number(chunkIndex);
    const isValidType = (typeof data === 'string' || Array.isArray(data) || data instanceof Uint8Array || data instanceof ArrayBuffer);
    const isEmpty = ((typeof data === 'string' && data.length === 0) || (Array.isArray(data) && data.length === 0) || (data instanceof Uint8Array && data.byteLength === 0) || (data instanceof ArrayBuffer && data.byteLength === 0));

    if (!isValidType || isEmpty) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleAddModelAssetRequest] Invalid or empty chunk data. Type: ${typeof data}, Length: ${data?.length || data?.byteLength}`);
        await persistAndCloseChatDb(db, dbPath);
        return { success: false, error: 'Invalid or empty chunk data type' };
    }

    const id = chunkGroupId ? `${chunkGroupId}__chunk${currentChunkIndex}` : `${folder}/${fileName}`;
    const addedAt = Date.now();
    let sqlData = data;
    if (typeof data === 'string') sqlData = new TextEncoder().encode(data);
    else if (Array.isArray(data)) sqlData = new Uint8Array(data);
    else if (data instanceof ArrayBuffer) sqlData = new Uint8Array(data);
    
    const actualSize = sqlData.byteLength;

    try {
        db.run(
            `INSERT INTO model_assets (id, folder, fileName, fileType, data, size, addedAt, chunkIndex, totalChunks, chunkGroupId, binarySize, totalFileSize)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
             data=excluded.data, size=excluded.size, addedAt=excluded.addedAt, binarySize=excluded.binarySize, totalFileSize=excluded.totalFileSize`, // Upsert behavior
            [id, folder, fileName, fileType, sqlData, actualSize, addedAt, currentChunkIndex, totalChunks, chunkGroupId, binarySize ?? actualSize, totalFileSize ?? actualSize]
        );
        await persistAndCloseChatDb(db, dbPath);
    } catch (err) {
        await persistAndCloseChatDb(db, dbPath);
        console.error(`${SQL_WORKER_LOG_PREFIX}[handleAddModelAssetRequest] Error adding/updating asset id ${id}: ${err.message}`);
        return { success: false, error: err.message || String(err) };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleAddModelAssetRequest] Asset added/updated: id ${id}`);
    return { success: true, id, folder, fileName, chunkIndex: currentChunkIndex }; // Return some info
}

async function handleCountModelAssetChunksRequest(payload) {
    const { folder, fileName, expectedSize, expectedChunks } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleCountModelAssetChunksRequest] Called for folder: ${folder}, fileName: ${fileName}, expectedSize: ${expectedSize}, expectedChunks: ${expectedChunks}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleCountModelAssetChunksRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const chunkGroupId = `${folder}/${fileName}`;
    const stmt = db.prepare("SELECT COUNT(*) as count, SUM(binarySize) as totalSize FROM model_assets WHERE chunkGroupId = ?");
    stmt.bind([chunkGroupId]);
    let result = null;
    if (stmt.step()) result = stmt.getAsObject();
    stmt.free();
    
    const foundChunks = result ? result.count : 0;
    const totalSize = result ? result.totalSize || 0 : 0;
    let verified = true;
    let errors = [];

    if (foundChunks !== expectedChunks) {
        verified = false;
        errors.push(`Chunk count mismatch: expected ${expectedChunks}, got ${foundChunks}`);
    }
    if (expectedSize !== null && totalSize !== expectedSize) {
        verified = false;
        errors.push(`Total size mismatch: expected ${expectedSize}, got ${totalSize}`);
    }

    let indices = [];
    if (foundChunks > 0) {
        const stmt2 = db.prepare("SELECT chunkIndex FROM model_assets WHERE chunkGroupId = ? ORDER BY chunkIndex ASC");
        stmt2.bind([chunkGroupId]);
        while (stmt2.step()) {
            indices.push(stmt2.getAsObject().chunkIndex);
        }
        stmt2.free();
        if (foundChunks < expectedChunks && !verified) {
            for (let i = 0; i < expectedChunks; i++) {
                if (!indices.includes(i)) errors.push(`Missing chunk at index ${i}`);
            }
        }
    } else if (expectedChunks > 0 && !verified) {
        errors.push(`No chunks found in DB for ${chunkGroupId}, expected ${expectedChunks}`);
    }
    await persistAndCloseChatDb(db, dbPath);
    const responseData = { count: foundChunks, indices, verified, error: errors.length > 0 ? errors.join('; ') : null, totalSize, expectedSize, expectedChunks };
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleCountModelAssetChunksRequest] Result for ${chunkGroupId}: ${JSON.stringify(responseData)}`);
    return { success: verified, data: responseData };
}

async function handleLogAllChunkGroupIdsForModelRequest(payload) {
    const { folder } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleLogAllChunkGroupIdsForModelRequest] Called for folder: ${folder}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleLogAllChunkGroupIdsForModelRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare("SELECT DISTINCT chunkGroupId FROM model_assets WHERE folder = ?");
    stmt.bind([folder]);
    const chunkGroupIds = [];
    while (stmt.step()) {
        chunkGroupIds.push(stmt.getAsObject().chunkGroupId);
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleLogAllChunkGroupIdsForModelRequest] Found ${chunkGroupIds.length} chunkGroupIds for folder ${folder}: ${chunkGroupIds.join(', ')}`);
    return { success: true, data: chunkGroupIds };
}

async function handleListModelFilesRequest(payload) {
    const { modelId } = payload; // modelId is used as 'folder'
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleListModelFilesRequest] Called for modelId (folder): ${modelId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleListModelFilesRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT fileName, COUNT(*) as numDocs, MAX(totalChunks) as maxTotalChunks, SUM(size) as totalSize FROM model_assets WHERE folder = ? GROUP BY fileName`);
    stmt.bind([modelId]);
    const rows = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        const isChunked = row.maxTotalChunks > 1 || row.numDocs > 1;
        const type = isChunked ? `chunked (${row.numDocs} parts)` : 'single';
        rows.push({ path: `/${modelId}/${row.fileName}`, type, numDocs: row.numDocs, totalSize: row.totalSize });
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleListModelFilesRequest] Found ${rows.length} model files/groups for modelId ${modelId}.`);
    return { success: true, data: rows };
}

async function handleGetModelAssetChunksRequest(payload) {
    const { chunkGroupId } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetModelAssetChunksRequest] Called for chunkGroupId: ${chunkGroupId}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleGetModelAssetChunksRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const stmt = db.prepare(`SELECT id, folder, fileName, fileType, size, chunkIndex, totalChunks, chunkGroupId, binarySize, totalFileSize, data FROM model_assets WHERE chunkGroupId = ? ORDER BY chunkIndex ASC`); // Explicitly select data
    stmt.bind([chunkGroupId]);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetModelAssetChunksRequest] Returning ${rows.length} chunks for ${chunkGroupId}.`);
    return { success: true, data: rows };
}

async function handleGetModelAssetChunkRequest(payload) {
    const { folder, fileName, chunkIndex } = payload;
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetModelAssetChunkRequest] Called for folder: ${folder}, fileName: ${fileName}, chunkIndex: ${chunkIndex}`);
    if (!SQL) throw new AppError('DB_ERROR', 'SQL.js not initialized');
    const dbPath = DBPaths.MODELS;
    diagnosticLogDBFileInfo('handleGetModelAssetChunkRequest', dbPath);
    const db = new SQL.Database(SQL.FS.readFile(dbPath));
    console.log('Absurd-SQL backend:', db.backend && db.backend.constructor && db.backend.constructor.name);
    const chunkGroupId = `${folder}/${fileName}`;
    const stmt = db.prepare(`SELECT id, folder, fileName, fileType, size, chunkIndex, totalChunks, chunkGroupId, binarySize, totalFileSize, data FROM model_assets WHERE chunkGroupId = ? AND chunkIndex = ?`);  // Explicitly select data
    stmt.bind([chunkGroupId, chunkIndex]);
    let row = null;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    await persistAndCloseChatDb(db, dbPath);
    if (!row) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[handleGetModelAssetChunkRequest] Chunk not found for ${chunkGroupId}, index ${chunkIndex}.`);
        return { success: false, error: 'Chunk not found' };
    }
    console.log(`${SQL_WORKER_LOG_PREFIX}[handleGetModelAssetChunkRequest] Chunk found for ${chunkGroupId}, index ${chunkIndex}. Size: ${row.size}`);
    return { success: true, data: row };
}

// --- FS Flush Helpers ---
/**
 * Flushes the SQL.js FS to IndexedDB after a single write operation.
 * Use after db.close() for chat/log single write ops.
 */
async function flushSqlFsSingle() {
    console.log(`${SQL_WORKER_LOG_PREFIX}[flushSqlFsSingle] Calling SQL.FS.syncfs...`);
    await new Promise((resolve, reject) => {
        SQL.FS.syncfs(false, (err) => {
            if (err) {
                console.error(`${SQL_WORKER_LOG_PREFIX}[flushSqlFsSingle] ERROR syncing FS:`, err);
            } else {
                console.log(`${SQL_WORKER_LOG_PREFIX}[flushSqlFsSingle] FS successfully synced to IndexedDB!`);
            }
            resolve();
        });
    });
}

/**
 * For batch operations: call once after all writes are done.
 * For now, this is just an alias to flushSqlFsSingle, but can be extended.
 */
async function flushSqlFsBatch() {
    await flushSqlFsSingle();
}

// --- Batch DB Operation Helpers ---
/**
 * For batch operations (e.g., chunked uploads):
 * Open DB once, write many times, then close and flush at the end.
 * Usage:
 *   const db = openDbForBatch('/sql/models.db');
 *   writeChunkToBatchDb(db, ...); // call many times
 *   await closeAndFlushBatchDb(db);
 */
function openDbForBatch(dbPath) {
    // Open and return a DB instance for batch writes
    return new SQL.Database(SQL.FS.readFile(dbPath));
}

function writeChunkToBatchDb(db, { sql, params }) {
    // Example: db.run(sql, params);
    db.run(sql, params);
}

async function closeAndFlushBatchDb(db) {
    db.close();
    await flushSqlFsBatch();
}

const dbHandlerMap = {

    [DBEventNames.DB_INIT_WORKER_REQUEST]: handleInitRequest, 
    [DBEventNames.DB_WORKER_RESET]: handleResetRequest, 
    
    [DbGetSessionRequest.type]: handleGetChatSessionByIdRequest,
    [DbCreateSessionRequest.type]: handleCreateChatSessionRequest,
    [DbDeleteSessionRequest.type]: handleDeleteHistoryItemRequest,
    [DbRenameSessionRequest.type]: handleRenameHistoryItemRequest,
    [DbGetAllSessionsRequest.type]: handleGetAllSessionsRequest,
    [DbGetStarredSessionsRequest.type]: handleGetStarredSessionsRequest,
    [DbToggleStarRequest.type]: handleToggleItemStarredRequest,
    [DbUpdateStatusRequest.type]: handleUpdateSessionStatusRequest,
    [DbAddMessageRequest.type]: handleAddMessageToChatRequest,
    [DbUpdateMessageRequest.type]: handleUpdateMessageInChatRequest,
    [DbDeleteMessageRequest.type]: handleDeleteMessageFromChatRequest,
    [DbAddLogRequest.type]: handleAddLogRequest,
    [DbGetLogsRequest.type]: handleGetLogsRequest,
    [DbGetUniqueLogValuesRequest.type]: handleGetUniqueLogValuesRequest,
    [DbClearLogsRequest.type]: handleClearLogsRequest,
    [DbAddModelAssetRequest.type]: handleAddModelAssetRequest,
    [DbCountModelAssetChunksRequest.type]: handleCountModelAssetChunksRequest,
    [DbLogAllChunkGroupIdsForModelRequest.type]: handleLogAllChunkGroupIdsForModelRequest,
    [DbListModelFilesRequest.type]: handleListModelFilesRequest,
    [DbGetModelAssetChunksRequest.type]: handleGetModelAssetChunksRequest,
    [DbGetModelAssetChunkRequest.type]: handleGetModelAssetChunkRequest,

};

self.onmessage = async (event) => {
    const { requestId, type, payload } = event.data || {};
    console.log(`${SQL_WORKER_LOG_PREFIX}[self.onmessage] Received message. Type: ${type}, RequestId: ${requestId}, Payload keys: ${payload ? Object.keys(payload).join(', ') : 'N/A'}`);

    if (!type) {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[self.onmessage] Received message with no type:`, event.data);
        self.postMessage({ requestId, result: { success: false, error: 'Message has no type' }});
        return;
    }

    const handler = dbHandlerMap[type];
    if (handler) {
        try {
            const result = await handler(payload || {});
            console.log(`${SQL_WORKER_LOG_PREFIX}[self.onmessage] Handler for type '${type}' (RequestId: ${requestId}) completed. Result success: ${result?.success}`);
            self.postMessage({ requestId, result });
        } catch (error) {
            let errorMsg;
            let errorStack;
            let errorCode;
            if (error instanceof AppError) {
                errorMsg = error.message;
                errorStack = error.stack;
                errorCode = error.code;
            } else if (error instanceof Error) {
                errorMsg = error.message;
                errorStack = error.stack;
            } else {
                errorMsg = String(error);
            }
            console.error(`${SQL_WORKER_LOG_PREFIX}[self.onmessage] Error in handler for type '${type}' (RequestId: ${requestId}). Message: ${errorMsg}, Code: ${errorCode || 'N/A'}, Stack: ${errorStack}`);
            self.postMessage({ requestId, result: { success: false, error: errorMsg, code: errorCode, stack: errorStack } });
        }
    } else {
        console.warn(`${SQL_WORKER_LOG_PREFIX}[self.onmessage] Received unhandled message type: ${type} (RequestId: ${requestId})`);
        self.postMessage({ requestId, result: { success: false, error: `Unhandled message type: ${type}` } });
    }
};

self.postMessage({ type: 'ready' });
console.log(`${SQL_WORKER_LOG_PREFIX}[Main] Worker ready message posted.`);
// --- END OF FILE sql-worker.js ---