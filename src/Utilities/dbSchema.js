export const USERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT
);
`;

export const CHATS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    tabId INTEGER,
    timestamp INTEGER,
    title TEXT,
    isStarred INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    metadata TEXT,         -- JSON: {topic, domain, tags, ...}
    summary TEXT,          -- High-level summary of the chat
    embedding BLOB,        -- Vector for the whole chat
    topic TEXT,            -- (optional, for fast lookup)
    domain TEXT,           -- (optional)
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_chats_timestamp ON chats(timestamp);
CREATE INDEX IF NOT EXISTS idx_chats_isStarred ON chats(isStarred);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_topic ON chats(topic);
CREATE INDEX IF NOT EXISTS idx_chats_domain ON chats(domain);
`;

export const LOG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER,
    level TEXT CHECK(level IN ('error', 'warn', 'info', 'debug')),
    message TEXT,
    component TEXT,
    extensionSessionId TEXT,
    chatSessionId TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_component ON logs(component);
CREATE INDEX IF NOT EXISTS idx_logs_extensionSessionId ON logs(extensionSessionId);
CREATE INDEX IF NOT EXISTS idx_logs_chatSessionId ON logs(chatSessionId);
`;

export const MODEL_ASSET_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS model_assets (
    id TEXT PRIMARY KEY,
    folder TEXT,
    fileName TEXT,
    fileType TEXT,
    data BLOB,
    size INTEGER,
    addedAt INTEGER,
    chunkIndex INTEGER DEFAULT 0,
    totalChunks INTEGER DEFAULT 1,
    chunkGroupId TEXT DEFAULT '',
    binarySize INTEGER,
    totalFileSize INTEGER
);
CREATE INDEX IF NOT EXISTS idx_model_assets_folder ON model_assets(folder);
CREATE INDEX IF NOT EXISTS idx_model_assets_fileName ON model_assets(fileName);
CREATE INDEX IF NOT EXISTS idx_model_assets_chunkGroupId ON model_assets(chunkGroupId);
CREATE INDEX IF NOT EXISTS idx_model_assets_chunkGroupId_chunkIndex ON model_assets(chunkGroupId, chunkIndex);
`;

export const MESSAGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT,
    timestamp INTEGER,
    sender TEXT,
    type TEXT,         -- 'text', 'image', 'file', 'code', 'agent_action', etc.
    content TEXT,      -- main content (text, JSON, or reference)
    metadata TEXT,     -- JSON string for extra fields (language, tool args, etc.)
    embedding BLOB,    -- vector embedding for semantic search (Float32Array, Uint8Array, etc.)
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
`;

export const ATTACHMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    file_name TEXT,
    mime_type TEXT,
    data BLOB,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
`;

export const CHAT_SUMMARIES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chat_summaries (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    parent_summary_id TEXT,      -- nullable, for summary-of-summary
    start_message_id TEXT,       -- nullable if summarizing summaries
    end_message_id TEXT,
    start_timestamp INTEGER,
    end_timestamp INTEGER,
    summary TEXT NOT NULL,
    embedding BLOB,              -- vector embedding
    token_count INTEGER,
    metadata TEXT,               -- JSON: {topic, tags, ...}
    created_at INTEGER,
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(parent_summary_id) REFERENCES chat_summaries(id)
);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id ON chat_summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_parent ON chat_summaries(parent_summary_id);
`;

export const KNOWLEDGE_GRAPH_EDGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    id TEXT PRIMARY KEY,
    from_node_id TEXT NOT NULL,   -- can be chat, summary, topic, etc.
    to_node_id TEXT NOT NULL,
    edge_type TEXT,               -- e.g., 'summarizes', 'references', 'is_about'
    metadata TEXT,                -- JSON for edge properties
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON knowledge_graph_edges(edge_type);
`;

export const KNOWLEDGE_GRAPH_NODES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id TEXT PRIMARY KEY,
    type TEXT,           -- e.g. 'entity', 'concept', 'document', etc.
    label TEXT,          -- Human-readable label
    properties TEXT,     -- JSON string for arbitrary node properties
    embedding BLOB,      -- Optional: vector for semantic search
    created_at INTEGER,
    updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON knowledge_graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_label ON knowledge_graph_nodes(label);
`; 

