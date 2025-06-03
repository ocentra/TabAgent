// idbChat.ts

// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.

import { KnowledgeGraphNode } from "./idbKnowledgeGraph";
import { Message } from "./idbMessage";
import { Summary } from "./idbSummary";
import { DBNames, NodeType } from "./idbSchema";
import { DBActions } from "./dbActions";
import { Embedding } from "./idbEmbedding";
import { DB_ENTITY_TYPES } from "./idbBase";
import { assertDbWorker } from '../Utilities/dbChannels';
import { MESSAGE_EVENT } from '../Utilities/eventConstants';

export class Chat extends KnowledgeGraphNode {

  public user_id: string;
  public tabId?: number;
  public chat_timestamp: number;
  public title: string;
  public isStarred: boolean = false;
  public status: string = 'idle';
  public message_ids: string[] = [];
  public summary_ids: string[] = [];
  public chat_metadata_json?: string;
  public topic?: string;
  public domain?: string;

  constructor(
    id: string,
    title: string,
    kgn_created_at: number,
    kgn_updated_at: number,
    options: {
        user_id?: string;
        tabId?: number;
        chat_timestamp?: number;
        isStarred?: boolean;
        status?: string;
        message_ids?: string[];
        summary_ids?: string[];
        chat_metadata?: Record<string, any>;
        topic?: string;
        domain?: string;
        kgn_properties?: Record<string, any>;
        kgn_embedding_id?: string;
        modelWorker?: Worker;
    } = {},
    dbWorker?: Worker
  ) {
    super(
        id,
        NodeType.Chat,
        title,
        kgn_created_at,
        kgn_updated_at,
        options.kgn_properties ? JSON.stringify(options.kgn_properties) : undefined,
        options.kgn_embedding_id,
        options.modelWorker,
        dbWorker
    );
    this.title = title;
    this.user_id = options.user_id || '';
    this.tabId = options.tabId;
    this.chat_timestamp = options.chat_timestamp || kgn_created_at;
    this.isStarred = options.isStarred || false;
    this.status = options.status || 'idle';
    this.message_ids = options.message_ids || [];
    this.summary_ids = options.summary_ids || [];
    this.chat_metadata_json = options.chat_metadata ? JSON.stringify(options.chat_metadata) : undefined;
    this.topic = options.topic;
    this.domain = options.domain;
  }

  toJSON(): { [key: string]: any } {
    return {
      ...super.toJSON(),
      __type: DB_ENTITY_TYPES.Chat,
      user_id: this.user_id,
      tabId: this.tabId,
      chat_timestamp: this.chat_timestamp,
      title: this.title,
      isStarred: this.isStarred,
      status: this.status,
      message_ids: this.message_ids,
      summary_ids: this.summary_ids,
      chat_metadata_json: this.chat_metadata_json,
      topic: this.topic,
      domain: this.domain
    };
  }

  static fromJSON(obj: any, dbWorker?: Worker, modelWorker?: Worker): Chat {
    if (!obj) throw new Error('Cannot hydrate Chat from null/undefined');
    return new Chat(
      obj.id,
      obj.title,
      obj.kgn_created_at || obj.chat_timestamp,
      obj.kgn_updated_at || obj.chat_timestamp,
      {
        user_id: obj.user_id,
        tabId: obj.tabId,
        chat_timestamp: obj.chat_timestamp,
        isStarred: obj.isStarred,
        status: obj.status,
        message_ids: obj.message_ids || [],
        summary_ids: obj.summary_ids || [],
        chat_metadata: obj.chat_metadata_json ? JSON.parse(obj.chat_metadata_json) : undefined,
        topic: obj.topic,
        domain: obj.domain,
        kgn_properties: obj.kgn_properties_json ? JSON.parse(obj.kgn_properties_json) : undefined,
        kgn_embedding_id: obj.kgn_embedding_id,
        modelWorker: modelWorker
      },
      dbWorker
    );
  }

  get chat_metadata(): Record<string, any> | undefined {
    try {
        return this.chat_metadata_json ? JSON.parse(this.chat_metadata_json) : undefined;
    } catch (e) {
        console.error(`Failed to parse chat_metadata_json for chat ${this.id}:`, e);
        return undefined;
    }
  }

  set chat_metadata(data: Record<string, any> | undefined) {
    this.chat_metadata_json = data ? JSON.stringify(data) : undefined;
  }

  static async createChat(
    initialTitleOrPrompt: string,
    dbWorker: Worker,
    options: {
        id?: string;
        user_id?: string;
        tabId?: number;
        isStarred?: boolean;
        status?: string;
        topic?: string;
        domain?: string;
        kgn_properties?: Record<string, any>;
        kgn_embeddingInput?: string;
        kgn_embeddingModel?: string;
        kgn_embeddingVector?: number[] | Float32Array | ArrayBuffer;
        modelWorker?: Worker;
        initialMessageSender?: string;
    } = {}
  ): Promise<Chat> {
    console.log('[DEBUG] Chat.createChat called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.createChat.name, Chat.name);
    const chatId = options.id || crypto.randomUUID();
    const now = Date.now();
    const title = initialTitleOrPrompt.length > 50 ? initialTitleOrPrompt.split(' ').slice(0, 7).join(' ') + '...' : initialTitleOrPrompt;
    let kgn_embedding_id_to_set: string | undefined;

    if (options.kgn_embeddingInput && options.kgn_embeddingModel) {
        const existingEmbedding = await Embedding.getByInputAndModel(options.kgn_embeddingInput, options.kgn_embeddingModel, dbWorker);
        if (existingEmbedding) {
            kgn_embedding_id_to_set = existingEmbedding.id;
             if (options.kgn_embeddingVector !== undefined) {
                const vectorBuffer = Embedding.toArrayBuffer(options.kgn_embeddingVector);
                if (!KnowledgeGraphNode.areArrayBuffersEqual(vectorBuffer, existingEmbedding.vector)) {
                     await existingEmbedding.update({ vector: vectorBuffer });
                }
            }
        } else {
            let vectorToSave: ArrayBuffer;
            if (options.kgn_embeddingVector !== undefined) {
                vectorToSave = Embedding.toArrayBuffer(options.kgn_embeddingVector);
            } else if (options.modelWorker) {
                vectorToSave = await Embedding.generateVectorWithModelWorker(options.kgn_embeddingInput, options.kgn_embeddingModel, options.modelWorker);
            } else {
                throw new Error("Chat.createChat: Cannot create embedding - kgn_embeddingVector not provided and modelWorker is missing.");
            }
            kgn_embedding_id_to_set = await Embedding.create(options.kgn_embeddingInput, vectorToSave, options.kgn_embeddingModel, dbWorker);
        }
    }

    const chat = new Chat(
      chatId, title, now, now,
      {
        user_id: options.user_id, tabId: options.tabId, chat_timestamp: now,
        isStarred: options.isStarred, status: options.status, topic: options.topic, domain: options.domain,
        kgn_properties: options.kgn_properties, kgn_embedding_id: kgn_embedding_id_to_set, modelWorker: options.modelWorker
      },
      dbWorker
    );
    await chat.saveToDB();
    if (initialTitleOrPrompt.length > title.length || (initialTitleOrPrompt && options.initialMessageSender)) {
        await chat.addMessage({
            text: initialTitleOrPrompt,
            sender: options.initialMessageSender || 'user'
        });
    }
    const dbChat = await Chat.read(chatId, dbWorker, options.modelWorker);
    if (!dbChat) throw new Error('Failed to retrieve chat from DB after creation');
    return dbChat;
  }

  async saveToDB(): Promise<string> {
    assertDbWorker(this, 'saveToDB', this.constructor.name);
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) { this.created_at = this.chat_timestamp; }
    this.label = this.title;
    await super.saveToDB();

    const requestId = crypto.randomUUID();
    
    const chatDataForStore = {
        id: this.id, // Ensure id is part of the object
        user_id: this.user_id,
        tabId: this.tabId,
        chat_timestamp: this.chat_timestamp,
        title: this.title,
        isStarred: this.isStarred,
        status: this.status,
        message_ids: this.message_ids,
        summary_ids: this.summary_ids,
        chat_metadata_json: this.chat_metadata_json,
        topic: this.topic,
        domain: this.domain,
        kgn_type: this.type, kgn_label: this.label, kgn_properties_json: this.properties_json,
        kgn_embedding_id: this.embedding_id, kgn_created_at: this.created_at, kgn_updated_at: this.updated_at,
    };

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Chat saved, but DB_CHATS worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save chat to DB_CHATS'));
          }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({ action: DBActions.PUT, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHATS, chatDataForStore], requestId });
      setTimeout(() => { this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout for DB_CHATS save (id: ${this.id})`)); }, 5000);
    });
  }

  static async read(id: string, dbWorker: Worker, modelWorker?: Worker): Promise<Chat | undefined> {
    console.log('[DEBUG] Chat.read called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.read.name, Chat.name);
    if (!dbWorker) throw new Error('dbWorker is required for Chat.read');
    const requestId = crypto.randomUUID();
    const chatData = await new Promise<any | undefined>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
                if (event.data.success) { resolve(event.data.result); }
                else { reject(new Error(event.data.error || `Failed to get chat (id: ${id}) from DB_CHATS`)); }
            }
        };
        dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
        dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHATS, id], requestId });
        setTimeout(() => { dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout getting chat ${id}`)); }, 5000);
    });

    if (chatData) {
        return new Chat(
            chatData.id, chatData.title, chatData.kgn_created_at, chatData.kgn_updated_at,
            {
                user_id: chatData.user_id, tabId: chatData.tabId, chat_timestamp: chatData.chat_timestamp,
                isStarred: chatData.isStarred, status: chatData.status, message_ids: chatData.message_ids || [],
                summary_ids: chatData.summary_ids || [],
                chat_metadata: chatData.chat_metadata_json ? JSON.parse(chatData.chat_metadata_json) : undefined,
                topic: chatData.topic, domain: chatData.domain,
                kgn_properties: chatData.kgn_properties_json ? JSON.parse(chatData.kgn_properties_json) : undefined,
                kgn_embedding_id: chatData.kgn_embedding_id, modelWorker: modelWorker
            },
            dbWorker
        );
    }
    return undefined;
  }

  async update(updates: Partial<Omit<Chat, 'dbWorker' | 'modelWorker' | 'id' | 'created_at' | 'type' | 'label' | 'edgesOut' | 'edgesIn' | '_embedding' >>): Promise<void> {
    assertDbWorker(this, 'update', this.constructor.name);
    const { ...allowedUpdates } = updates as any;
    if (allowedUpdates.title !== undefined) { this.title = allowedUpdates.title; this.label = allowedUpdates.title; }
    if (allowedUpdates.chat_metadata && typeof allowedUpdates.chat_metadata === 'object') {
        this.chat_metadata = allowedUpdates.chat_metadata; delete allowedUpdates.chat_metadata;
    } else if (allowedUpdates.chat_metadata_json !== undefined) { this.chat_metadata_json = allowedUpdates.chat_metadata_json; }
     if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
        this.properties = allowedUpdates.properties; delete allowedUpdates.properties;
    } else if (allowedUpdates.properties_json !== undefined) { this.properties_json = allowedUpdates.properties_json; }

    Object.assign(this, allowedUpdates);
    await this.saveToDB();
  }

  async delete(options: { deleteMessages?: boolean, deleteSummaries?: boolean, deleteKGNRels?: boolean, deleteOrphanedEmbedding?: boolean } = {}): Promise<void> {
    assertDbWorker(this, 'delete', this.constructor.name);
    const { deleteMessages = true, deleteSummaries = true, deleteKGNRels = true, deleteOrphanedEmbedding = false } = options;
    if (deleteMessages) {
        for (const msgId of this.message_ids) {
            const message = await Message.read(msgId, this.dbWorker!, this.modelWorker);
            if (message) {
                await message.delete({ deleteAttachments: true, deleteKGNRels: true, deleteOrphanedEmbedding: true })
                    .catch(e => console.warn(`Failed to delete message ${msgId} for chat ${this.id}: ${e.message}`));
            }
        }
        this.message_ids = [];
    }
    if (deleteSummaries) {
        for (const summaryId of this.summary_ids) {
            const summary = await Summary.read(summaryId, this.dbWorker!);
            if (summary) {
                await summary.delete().catch(e => console.warn(`Failed to delete summary ${summaryId} for chat ${this.id}: ${e.message}`));
            }
        }
        this.summary_ids = [];
    }

    const requestId = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
                if (event.data.success) { resolve(); }
                else { reject(new Error(event.data.error || `Failed to delete chat (id: ${this.id}) from DB_CHATS`)); }
            }
        };
        this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
        this.dbWorker!.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHATS, this.id], requestId });
        setTimeout(() => { this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout deleting chat ${this.id} from DB_CHATS`)); }, 5000);
    });
    await super.delete({ deleteOrphanedEmbedding, deleteEdges: deleteKGNRels });
  }

  async addMessage(
    data: {
        text?: string;
        attachment?: { file_name: string; mime_type: string; data: Blob; }; // Single convenience attachment
        sender: string;
        message_type?: string;
        metadata?: Record<string, any>;
        attachmentsData?: { file_name: string; mime_type: string; data: Blob; }[]; // For multiple attachments
        kgn_properties?: Record<string, any>;
        kgn_embeddingInput?: string;
        kgn_embeddingModel?: string;
        kgn_embeddingVector?: number[] | Float32Array | ArrayBuffer;
    }
  ): Promise<string> {
    assertDbWorker(this, 'addMessage', this.constructor.name);
    const content = data.text || (data.attachment ? data.attachment.file_name : (data.attachmentsData && data.attachmentsData.length > 0 ? data.attachmentsData[0].file_name : 'Message with attachments'));
    if (!data.text && !data.attachment && (!data.attachmentsData || data.attachmentsData.length === 0)) {
        throw new Error("Cannot add an empty message without text or attachments.");
    }

    const messageId = await Message.createMessage(
      this.id, data.sender, content, this.dbWorker!,
      {
        message_type: data.message_type, metadata: data.metadata,
        kgn_properties: data.kgn_properties, kgn_embeddingInput: data.kgn_embeddingInput,
        kgn_embeddingModel: data.kgn_embeddingModel, kgn_embeddingVector: data.kgn_embeddingVector,
        modelWorker: this.modelWorker
      }
    );
    if (!this.message_ids.includes(messageId)) {
        this.message_ids.push(messageId);
    }

    const messageInstance = await Message.read(messageId, this.dbWorker!, this.modelWorker);
    if (!messageInstance) throw new Error("Failed to retrieve newly created message for attachment processing.");

    if (data.attachment) {
        await messageInstance.addAttachment(data.attachment);
    }
    if (data.attachmentsData) {
        for (const attData of data.attachmentsData) {
            await messageInstance.addAttachment(attData);
        }
    }
    await this.saveToDB(); // Save chat after message_ids and potential attachments are processed
    return messageId;
  }

  async getMessage(messageId: string): Promise<Message | undefined> {
    assertDbWorker(this, 'getMessage', this.constructor.name);
    return Message.read(messageId, this.dbWorker!, this.modelWorker);
  }

  async getMessages(): Promise<Message[]> {
    assertDbWorker(this, 'getMessages', this.constructor.name);
    const messages: Message[] = [];
    for (const msgId of this.message_ids) {
        const msg = await Message.read(msgId, this.dbWorker!, this.modelWorker);
        if (msg) messages.push(msg);
    }
    return messages;
  }

  async deleteMessage(messageId: string, deleteOptions: { deleteAttachments?: boolean, deleteKGNRels?: boolean, deleteOrphanedEmbedding?: boolean } = {}): Promise<boolean> {
    assertDbWorker(this, 'deleteMessage', this.constructor.name);
    const msg = await Message.read(messageId, this.dbWorker!, this.modelWorker);
    if (msg && msg.chat_id === this.id) {
      await msg.delete(deleteOptions);
      const initialLength = this.message_ids.length;
      this.message_ids = this.message_ids.filter(id => id !== messageId);
      if (this.message_ids.length < initialLength) {
          await this.saveToDB();
          return true;
      }
    }
    return false;
  }

  async addSummary(
    message_ids_for_summary: string[],
    summary_text: string,
    options?: {
      id?: string;
      parent_summary_id?: string | null;
      metadata?: Record<string, any>;
      start_message_id?: string | null;
      end_message_id?: string | null;
      start_timestamp?: number;
      end_timestamp?: number;
      token_count?: number;
      embedding_id?: string;
    }
  ): Promise<string> {
    assertDbWorker(this, 'addSummary', this.constructor.name);
    const summaryId = await Summary.create(
      this.id, // chat_id
      summary_text,
      this.dbWorker!,
      {
        ...options,
        message_ids: message_ids_for_summary,
        start_message_id: options?.start_message_id || (message_ids_for_summary.length > 0 ? message_ids_for_summary[0] : null),
        end_message_id: options?.end_message_id || (message_ids_for_summary.length > 0 ? message_ids_for_summary[message_ids_for_summary.length - 1] : null),
      }
    );
    if (!this.summary_ids.includes(summaryId)) {
      this.summary_ids.push(summaryId);
      await this.saveToDB();
    }
    return summaryId;
  }

  async getSummary(summaryId: string): Promise<Summary | undefined> {
    assertDbWorker(this, 'getSummary', this.constructor.name);
    return Summary.read(summaryId, this.dbWorker!);
  }

  async getSummaries(): Promise<Summary[]> {
    assertDbWorker(this, 'getSummaries', this.constructor.name);
    const summaries: Summary[] = [];
    for (const summaryId of this.summary_ids) {
        const summary = await Summary.read(summaryId, this.dbWorker!);
        if (summary) summaries.push(summary);
    }
    return summaries;
  }

  async deleteSummary(summaryId: string): Promise<boolean> {
    assertDbWorker(this, 'deleteSummary', this.constructor.name);
    const summary = await Summary.read(summaryId, this.dbWorker!);
    if (summary && summary.chat_id === this.id) {
        await summary.delete();
        const initialLength = this.summary_ids.length;
        this.summary_ids = this.summary_ids.filter(id => id !== summaryId);
        if (this.summary_ids.length < initialLength) {
            await this.saveToDB();
            return true;
        }
    }
    return false;
  }

  static async updateChat(
    chatId: string,
    updates: Partial<Omit<Chat, 'dbWorker' | 'modelWorker' | 'id' | 'created_at' | 'type' | 'label' | 'edgesOut' | 'edgesIn' | '_embedding' >>,
    dbWorker: Worker,
    modelWorker?: Worker
  ): Promise<{ success: boolean; chat?: Chat; error?: string }> {
    console.log('[DEBUG] Chat.updateChat called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.updateChat.name, Chat.name);
    const chat = await Chat.read(chatId, dbWorker, modelWorker);
    if (!chat) return { success: false, error: 'Chat not found' };
    try {
      await chat.update(updates);
      const updatedChat = await Chat.read(chatId, dbWorker, modelWorker);
      return { success: true, chat: updatedChat };      
    } catch (e: any) {
      return { success: false, error: e.message || 'Update failed' };
    }
  }

  static async deleteChat(
    chatId: string,
    dbWorker: Worker,
    modelWorker?: Worker,
    options: { deleteMessages?: boolean, deleteSummaries?: boolean, deleteKGNRels?: boolean, deleteOrphanedEmbedding?: boolean } = {}
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[DEBUG] Chat.deleteChat called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.deleteChat.name, Chat.name);
    const chat = await Chat.read(chatId, dbWorker, modelWorker);
    if (!chat) return { success: false, error: 'Chat not found' };
    try {
      await chat.delete(options);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Delete failed' };
    }
  }

  static async addMessageToChat(
    chatId: string,
    data: {
      text?: string;
      attachment?: { file_name: string; mime_type: string; data: Blob; };
      sender: string;
      message_type?: string;
      metadata?: Record<string, any>;
      attachmentsData?: { file_name: string; mime_type: string; data: Blob; }[];
      kgn_properties?: Record<string, any>;
      kgn_embeddingInput?: string;
      kgn_embeddingModel?: string;
      kgn_embeddingVector?: number[] | Float32Array | ArrayBuffer;
    },
    dbWorker: Worker,
    modelWorker?: Worker
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[DEBUG] Chat.addMessageToChat called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.addMessageToChat.name, Chat.name);
    const chat = await Chat.read(chatId, dbWorker, modelWorker);
    if (!chat) return { success: false, error: 'Chat not found' };
    try {
      const messageId = await chat.addMessage(data);
      return { success: true, messageId };
    } catch (e: any) {
      return { success: false, error: e.message || 'Add message failed' };
    }
  }

  static async getAllChats(dbWorker: Worker): Promise<Chat[]> {
    console.log('[DEBUG] Chat.getAllChats called with dbWorker:', dbWorker);
    assertDbWorker(dbWorker, Chat.getAllChats.name, Chat.name);
    const requestId = crypto.randomUUID();
    const chatDatas = await new Promise<any[]>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success) { resolve(event.data.result); }
          else { reject(new Error(event.data.error || 'Failed to get all chats from DB_CHATS')) }
        }
      };
      dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
      dbWorker.postMessage({ action: DBActions.GET_ALL, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHATS], requestId });
      setTimeout(() => { dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error('Timeout getting all chats')); }, 5000);
    });
    return (chatDatas || []).map(chatData => new Chat(
      chatData.id, chatData.title, chatData.kgn_created_at, chatData.kgn_updated_at,
      {
        user_id: chatData.user_id, tabId: chatData.tabId, chat_timestamp: chatData.chat_timestamp,
        isStarred: chatData.isStarred, status: chatData.status, message_ids: chatData.message_ids || [],
        summary_ids: chatData.summary_ids || [],
        chat_metadata: chatData.chat_metadata_json ? JSON.parse(chatData.chat_metadata_json) : undefined,
        topic: chatData.topic, domain: chatData.domain,
        kgn_properties: chatData.kgn_properties_json ? JSON.parse(chatData.kgn_properties_json) : undefined,
        kgn_embedding_id: chatData.kgn_embedding_id
      },
      dbWorker
    ));
  }
}