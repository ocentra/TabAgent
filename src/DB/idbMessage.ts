// idbMessage.ts

import { KnowledgeGraphNode } from "./idbKnowledgeGraph";
import { Attachment } from "./idbAttachment";
import { Summary } from "./idbSummary";
import { DBNames, NodeType } from "./idbSchema";
import { DBActions } from "./dbActions";
import { Embedding } from "./idbEmbedding";
import { DB_ENTITY_TYPES } from "./idbBase";
import { assertDbWorker } from '../Utilities/dbChannels';
import { MESSAGE_EVENT } from '../Utilities/eventConstants';

export class Message extends KnowledgeGraphNode {

  public chat_id: string;
  public timestamp: number;
  public sender: string;
  public message_type: string;
  public content: string;
  public metadata_json?: string;
  public upvotes: number = 0;
  public downvotes: number = 0;
  public starred: boolean = false;
  public attachment_ids: string[] = [];
  public summary_id?: string;

  constructor(
    id: string,
    chat_id: string,
    sender: string,
    content: string,
    timestamp: number,
    kgn_created_at: number,
    kgn_updated_at: number,
    options: {
      message_type?: string;
      metadata?: Record<string, any>;
      attachment_ids?: string[];
      upvotes?: number;
      downvotes?: number;
      starred?: boolean;
      kgn_properties?: Record<string, any>;
      kgn_embedding_id?: string;
      modelWorker?: Worker;
    } = {},
    dbWorker?: Worker
  ) {
    super(
      id,
      NodeType.Message,
      content,
      kgn_created_at,
      kgn_updated_at,
      options.kgn_properties ? JSON.stringify(options.kgn_properties) : undefined,
      options.kgn_embedding_id,
      options.modelWorker,
      dbWorker
    );
    this.chat_id = chat_id;
    this.timestamp = timestamp;
    this.sender = sender;
    this.message_type = options.message_type || 'text';
    this.content = content;
    this.metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
    this.attachment_ids = options.attachment_ids || [];
    this.upvotes = options.upvotes || 0;
    this.downvotes = options.downvotes || 0;
    this.starred = options.starred || false;
  }

  get metadata(): Record<string, any> | undefined {
    try {
        return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
    } catch (e) {
        console.error(`Failed to parse message metadata_json for message ${this.id}:`, e);
        return undefined;
    }
  }

  set metadata(data: Record<string, any> | undefined) {
    this.metadata_json = data ? JSON.stringify(data) : undefined;
  }

  static async createMessage(
    chat_id: string,
    sender: string,
    content: string,
    dbWorker: Worker,
    options: {
      id?: string;
      timestamp?: number;
      message_type?: string;
      metadata?: Record<string, any>;
      attachment_ids?: string[];
      upvotes?: number;
      downvotes?: number;
      starred?: boolean;
      kgn_properties?: Record<string, any>;
      kgn_embeddingInput?: string;
      kgn_embeddingModel?: string;
      kgn_embeddingVector?: number[] | Float32Array | ArrayBuffer;
      modelWorker?: Worker;
    } = {}
  ): Promise<string> {
    assertDbWorker(dbWorker, Message.createMessage.name, Message.name);
    const messageId = options.id || crypto.randomUUID();
    const now = Date.now();
    const messageTimestamp = options.timestamp || now;
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
                throw new Error("Message.createMessage: Cannot create embedding - kgn_embeddingVector not provided and modelWorker is missing.");
            }
            kgn_embedding_id_to_set = await Embedding.create(options.kgn_embeddingInput, vectorToSave, options.kgn_embeddingModel, dbWorker);
        }
    }

    const msg = new Message(
      messageId, chat_id, sender, content, messageTimestamp, now, now,
      {
        message_type: options.message_type,
        metadata: options.metadata,
        attachment_ids: options.attachment_ids,
        upvotes: options.upvotes,
        downvotes: options.downvotes,
        starred: options.starred,
        kgn_properties: options.kgn_properties,
        kgn_embedding_id: kgn_embedding_id_to_set,
        modelWorker: options.modelWorker
      },
      dbWorker
    );
    await msg.saveToDB();
    return messageId;
  }

  async saveToDB(): Promise<string> {
    assertDbWorker(this, 'saveToDB', this.constructor.name);
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) {
        this.created_at = this.timestamp;
    }
    this.label = this.content;
    await super.saveToDB();

    const requestId = crypto.randomUUID();
    const { dbWorker, modelWorker, edgesOut, edgesIn, embedding, type, label, properties_json, embedding_id, created_at, updated_at, ...messageSpecificsForStore } = this;
    
    const messageDataForStore = {
        id: this.id, // Ensure id is part of the object if not captured by spread
        chat_id: this.chat_id,
        timestamp: this.timestamp,
        sender: this.sender,
        message_type: this.message_type,
        content: this.content,
        metadata_json: this.metadata_json,
        upvotes: this.upvotes,
        downvotes: this.downvotes,
        starred: this.starred,
        attachment_ids: this.attachment_ids,
        kgn_type: this.type,
        kgn_label: this.label,
        kgn_properties_json: this.properties_json,
        kgn_embedding_id: this.embedding_id,
        kgn_created_at: this.created_at,
        kgn_updated_at: this.updated_at,
    };
    // console.log('[DB][TRACE] Message.saveToDB: messageDataForStore:', messageDataForStore);

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Message saved, but DB_MESSAGES worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save message to DB_MESSAGES'));
          }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({ action: DBActions.PUT, payload: [DBNames.DB_USER_DATA, DBNames.DB_MESSAGES, messageDataForStore], requestId });
      setTimeout(() => {
        this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
        reject(new Error(`Timeout waiting for DB_MESSAGES save (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  static async read(id: string, dbWorker: Worker, modelWorker?: Worker): Promise<Message | undefined> {
    assertDbWorker(dbWorker, 'read', 'Message');
    const requestId = crypto.randomUUID();
    const messageData = await new Promise<any | undefined>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
                if (event.data.success) {
                    resolve(event.data.result);
                } else {
                    reject(new Error(event.data.error || `Failed to get message (id: ${id}) from DB_MESSAGES`));
                }
            }
        };
        dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
        dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_MESSAGES, id], requestId });
        setTimeout(() => { dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout getting message ${id}`)); }, 5000);
    });

    if (messageData) {
        return new Message(
            messageData.id, messageData.chat_id, messageData.sender, messageData.content,
            messageData.timestamp,
            messageData.kgn_created_at, messageData.kgn_updated_at,
            {
                message_type: messageData.message_type,
                metadata: messageData.metadata_json ? JSON.parse(messageData.metadata_json) : undefined,
                attachment_ids: messageData.attachment_ids || [],
                upvotes: messageData.upvotes, downvotes: messageData.downvotes, starred: messageData.starred,
                kgn_properties: messageData.kgn_properties_json ? JSON.parse(messageData.kgn_properties_json) : undefined,
                kgn_embedding_id: messageData.kgn_embedding_id,
                modelWorker: modelWorker
            },
            dbWorker
        );
    }
    return undefined;
  }

  async update(updates: Partial<Omit<Message, 'dbWorker' | 'modelWorker' | 'id' | 'chat_id' | 'timestamp' | 'created_at' | 'type' | 'label' | 'edgesOut' | 'edgesIn' | '_embedding' >>): Promise<void> {
    assertDbWorker(this, 'update', this.constructor.name);
    const { id, chat_id, timestamp, created_at, type, label, edgesOut, edgesIn, _embedding, dbWorker, modelWorker, ...allowedUpdates } = updates as any;
    if (allowedUpdates.appendContent !== undefined) {
      this.content = (this.content || '') + allowedUpdates.appendContent;
      this.label = this.content;
      delete allowedUpdates.appendContent;
    }
    if (allowedUpdates.content !== undefined) {
        this.content = allowedUpdates.content;
        this.label = allowedUpdates.content;
    }
    if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
        this.metadata = allowedUpdates.metadata;
        delete allowedUpdates.metadata;
    } else if (allowedUpdates.metadata_json !== undefined) {
        this.metadata_json = allowedUpdates.metadata_json;
    }
    if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
        this.properties = allowedUpdates.properties;
        delete allowedUpdates.properties;
    } else if (allowedUpdates.properties_json !== undefined) {
        this.properties_json = allowedUpdates.properties_json;
    }

    Object.assign(this, allowedUpdates);
    await this.saveToDB();
  }

  async delete(options: { deleteAttachments?: boolean, deleteKGNRels?: boolean, deleteOrphanedEmbedding?: boolean } = {}): Promise<void> {
    assertDbWorker(this, 'delete', this.constructor.name);
    const { deleteAttachments = true, deleteKGNRels = true, deleteOrphanedEmbedding = false } = options;
    if (deleteAttachments) {
        for (const attId of this.attachment_ids) {
            const attachment = await Attachment.read(attId, this.dbWorker!);
            if (attachment) {
                await attachment.delete().catch(e => console.warn(`Failed to delete attachment ${attId} for message ${this.id}: ${e.message}`));
            }
        }
        this.attachment_ids = [];
    }
    const requestId = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
                if (event.data.success) {
                    resolve();
                } else {
                    reject(new Error(event.data.error || `Failed to delete message (id: ${this.id}) from DB_MESSAGES`));
                }
            }
        };
        this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
        this.dbWorker!.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_MESSAGES, this.id], requestId });
        setTimeout(() => { this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout deleting message ${this.id} from DB_MESSAGES`)); }, 5000);
    });
    await super.delete({ deleteOrphanedEmbedding, deleteEdges: deleteKGNRels });
  }

  async addAttachment(fileData: { file_name: string; mime_type: string; data: Blob; }): Promise<string> {
    assertDbWorker(this, 'addAttachment', this.constructor.name);
    const newAttachmentId = await Attachment.create(this.id, fileData.file_name, fileData.mime_type, fileData.data, this.dbWorker!);
    if (!this.attachment_ids.includes(newAttachmentId)) {
        this.attachment_ids.push(newAttachmentId);
        await this.saveToDB();
    }
    return newAttachmentId;
  }

  async getAttachments(): Promise<Attachment[]> {
    assertDbWorker(this, 'getAttachments', this.constructor.name);
    if (!this.attachment_ids || this.attachment_ids.length === 0) {
        return [];
    }
    return Attachment.getAllByMessageId(this.id, this.dbWorker!);
  }

  async deleteAttachment(attachmentIdToDelete: string): Promise<boolean> {
    assertDbWorker(this, 'deleteAttachment', this.constructor.name);
    const att = await Attachment.read(attachmentIdToDelete, this.dbWorker!);
    if (att && att.message_id === this.id) {
      await att.delete();
      const initialLength = this.attachment_ids.length;
      this.attachment_ids = this.attachment_ids.filter(id => id !== attachmentIdToDelete);
      if (this.attachment_ids.length < initialLength) {
          await this.saveToDB();
          return true;
      }
    }
    return false;
  }

  async upvote(): Promise<void> { this.upvotes++; await this.update({ upvotes: this.upvotes }); }
  async downvote(): Promise<void> { this.downvotes++; await this.update({ downvotes: this.downvotes }); }
  async toggleStarred(): Promise<void> { this.starred = !this.starred; await this.update({ starred: this.starred }); }

  async addSummary(
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
      this.id, // message id as chat_id/parent_id
      summary_text,
      this.dbWorker!,
      {
        ...options,
        message_ids: [this.id],
        start_message_id: options?.start_message_id || this.id,
        end_message_id: options?.end_message_id || this.id,
      }
    );
    this.summary_id = summaryId;
    await this.saveToDB();
    return summaryId;
  }

  toJSON(): { [key: string]: any } {
    return {
      ...super.toJSON(),
      __type: DB_ENTITY_TYPES.Message,
      chat_id: this.chat_id,
      timestamp: this.timestamp,
      sender: this.sender,
      message_type: this.message_type,
      content: this.content,
      metadata_json: this.metadata_json,
      upvotes: this.upvotes,
      downvotes: this.downvotes,
      starred: this.starred,
      attachment_ids: this.attachment_ids,
      summary_id: this.summary_id,
      attachments: (this as any).attachments
    };
  }

  static fromJSON(obj: any, dbWorker?: Worker, modelWorker?: Worker): Message {
    if (!obj) throw new Error('Cannot hydrate Message from null/undefined');
    return new Message(
      obj.id,
      obj.chat_id,
      obj.sender,
      obj.content,
      obj.timestamp,
      obj.kgn_created_at || obj.timestamp,
      obj.kgn_updated_at || obj.timestamp,
      {
        message_type: obj.message_type,
        metadata: obj.metadata_json ? JSON.parse(obj.metadata_json) : undefined,
        attachment_ids: obj.attachment_ids || [],
        upvotes: obj.upvotes,
        downvotes: obj.downvotes,
        starred: obj.starred,
        kgn_properties: obj.kgn_properties_json ? JSON.parse(obj.kgn_properties_json) : undefined,
        kgn_embedding_id: obj.kgn_embedding_id,
        modelWorker: modelWorker
      },
      dbWorker
    );
  }
}