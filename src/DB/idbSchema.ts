// idbSchema.ts

// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.

/**
 * DB_MODELS store conventions:
 * - Every file in a model repo (ONNX and non-ONNX) gets a manifest record, even if not downloaded yet.
 * - On first model load, fetch the repo's file list and create a manifest record for each file with status 'missing'.
 * - When a file is downloaded, update its status to 'present'.
 * - If a file is found to be corrupt/unloadable, update its status to 'corrupt'.
 * - The 'status' field can be: 'missing' (not downloaded), 'present' (downloaded and valid), 'corrupt' (downloaded but unloadable), 'downloading', 'incomplete', 'complete', etc.
 * - The 'fileType' field distinguishes ONNX, JSON, and other file types.
 * - (Optional) The 'variant' field can be used to store quantization/variant info parsed from the filename (e.g., 'int4', 'fp16').
 * - This enables efficient dropdown population and status display for all quantizations/variants.
 */

export const DBNames = Object.freeze({
  DB_USER_DATA: 'TabAgentUserData',
  DB_LOGS: 'TabAgentLogs',
  DB_MODELS: 'TabAgentModels',
  DB_CHATS: 'TabAgentChats',
  DB_MESSAGES: 'TabAgentMessages',
  DB_EMBEDDINGS: 'TabAgentEmbeddings',
  DB_KNOWLEDGE_GRAPH_NODES: 'TabAgentKnowledgeGraphNodes',
  DB_KNOWLEDGE_GRAPH_EDGES: 'TabAgentKnowledgeGraphEdges',
  DB_CHAT_SUMMARIES: 'TabAgentChatSummaries',
  DB_ATTACHMENTS: 'TabAgentAttachments',
});

export enum NodeType {
  Chat = 'chat',
  Message = 'message',
  Embedding = 'embedding',
  Attachment = 'attachment',
  Summary = 'summary',
  
}

export enum LogLevel {
  Info = 'info',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug',
}

export const schema = {
  [DBNames.DB_USER_DATA]: {
    version: 2,
    stores: {
      [DBNames.DB_CHATS]: {
        keyPath: 'id',
        indexes: [ { name: 'chat_timestamp', keyPath: 'chat_timestamp' }, { name: 'user_id', keyPath: 'user_id' } ]
      },
      [DBNames.DB_MESSAGES]: {
        keyPath: 'id',
        indexes: [ { name: 'chat_id', keyPath: 'chat_id' }, { name: 'timestamp', keyPath: 'timestamp' } ]
      },
      [DBNames.DB_EMBEDDINGS]: {
        keyPath: 'id',
        indexes: [ { name: 'input', keyPath: 'input', unique: false }, { name: 'model', keyPath: 'model', unique: false } ]
      },
      [DBNames.DB_KNOWLEDGE_GRAPH_NODES]: {
        keyPath: 'id',
        indexes: [ { name: 'type', keyPath: 'type', unique: false }, { name: 'label', keyPath: 'label', unique: false }, { name: 'embedding_id', keyPath: 'embedding_id', unique: false } ]
      },
      [DBNames.DB_KNOWLEDGE_GRAPH_EDGES]: {
        keyPath: 'id',
        indexes: [ { name: 'from_node_id', keyPath: 'from_node_id', unique: false }, { name: 'to_node_id', keyPath: 'to_node_id', unique: false }, { name: 'edge_type', keyPath: 'edge_type', unique: false } ]
      },
      [DBNames.DB_ATTACHMENTS]: {
        keyPath: 'id',
        indexes: [ { name: 'message_id', keyPath: 'message_id' } ]
      },
      [DBNames.DB_CHAT_SUMMARIES]: {
        keyPath: 'id',
        indexes: [ { name: 'chat_id', keyPath: 'chat_id' }, { name: 'created_at', keyPath: 'created_at'}]
      },
    }
  },
  [DBNames.DB_LOGS]: {
    version: 1,
    stores: { [DBNames.DB_LOGS]: { keyPath: 'id', indexes: [ { name: 'timestamp', keyPath: 'timestamp' }, { name: 'level', keyPath: 'level' } ] } }
  },
  [DBNames.DB_MODELS]: {
    version: 2, // bump version if needed
    stores: {
      [DBNames.DB_MODELS]: {
        keyPath: 'id',
        indexes: [
          { name: 'chunkGroupId', keyPath: 'chunkGroupId' }, // Group all chunks/manifests for a file
          { name: 'type', keyPath: 'type' }, // 'manifest' or 'chunk'
          { name: 'chunkIndex', keyPath: 'chunkIndex' }, // For ordered chunk retrieval
          { name: 'fileName', keyPath: 'fileName' }, // File name
          { name: 'folder', keyPath: 'folder' }, // Folder or model id
          { name: 'fileType', keyPath: 'fileType' }, // File type (e.g., onnx, json)
          { name: 'addedAt', keyPath: 'addedAt' }, // For recency/cleanup
          { name: 'lastAccessed', keyPath: 'lastAccessed' }, // For LRU/cleanup
          { name: 'status', keyPath: 'status' }, // For manifest status (see above)
          { name: 'totalChunks', keyPath: 'totalChunks' }, // For manifest: total number of chunks
          { name: 'size', keyPath: 'size' }, // For manifest: total file size
          { name: 'chunkSize', keyPath: 'chunkSize' }, // For chunk: size of this chunk
          { name: 'checksum', keyPath: 'checksum' }, // For chunk or manifest integrity
          { name: 'version', keyPath: 'version' }, // For file versioning
          { name: 'variant', keyPath: 'variant' }, // For quantization/variant info
          { name: 'folder_type', keyPath: ['folder', 'type'] }, // Compound index for efficient manifest queries
          // Add more as needed
        ]
      }
    }
  }
};

export const dbChannel = new BroadcastChannel('tabagent-db');