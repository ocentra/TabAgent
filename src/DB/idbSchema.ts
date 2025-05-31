// idbSchema.ts


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

};

export const dbChannel = new BroadcastChannel('tabagent-db');

export const modelCacheSchema = {
  [DBNames.DB_MODELS]: {
    version: 2,
    stores: {
      files: {
        keyPath: 'url', // or just use the URL as the key
        indexes: [] // No indexes needed for simple file storage
      },
      manifest: {
        keyPath: 'repo', // repo name as the key
        indexes: [] // No indexes needed for now
      }
    }
  }
};