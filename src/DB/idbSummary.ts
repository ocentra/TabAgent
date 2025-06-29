// idbSummary.ts

import { BaseCRUD, DB_ENTITY_TYPES } from "./idbBase";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";
import { assertDbWorker } from '../Utilities/dbChannels';
import { MESSAGE_EVENT } from '../Utilities/eventConstants';

export class Summary extends BaseCRUD<Summary> {
  public chat_id: string;
  public summary_text: string;
  public message_ids: string[];
  public parent_summary_id: string | null = null;
  public start_message_id: string | null = null;
  public end_message_id: string | null = null;
  public start_timestamp?: number;
  public end_timestamp?: number;
  public token_count?: number;
  public metadata_json?: string;
  public created_at: number;
  public updated_at: number;
  public embedding_id?: string;

  constructor(
    id: string,
    chat_id: string,
    summary_text: string,
    dbWorker: Worker,
    created_at: number,
    updated_at: number,
    options: {
      message_ids?: string[];
      parent_summary_id?: string | null;
      start_message_id?: string | null;
      end_message_id?: string | null;
      start_timestamp?: number;
      end_timestamp?: number;
      token_count?: number;
      metadata?: Record<string, any>;
      embedding_id?: string;
    } = {}
  ) {
    super(id, summary_text, dbWorker);
    this.chat_id = chat_id;
    this.summary_text = summary_text;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.message_ids = options.message_ids || [];
    this.parent_summary_id = options.parent_summary_id === undefined ? null : options.parent_summary_id;
    this.start_message_id = options.start_message_id === undefined ? null : options.start_message_id;
    this.end_message_id = options.end_message_id === undefined ? null : options.end_message_id;
    this.start_timestamp = options.start_timestamp;
    this.end_timestamp = options.end_timestamp;
    this.token_count = options.token_count;
    this.metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
    this.embedding_id = options.embedding_id;
  }

  static async create(
    chat_id: string,
    summary_text: string,
    dbWorker: Worker,
    options: {
      id?: string;
      message_ids?: string[];
      parent_summary_id?: string | null;
      start_message_id?: string | null;
      end_message_id?: string | null;
      start_timestamp?: number;
      end_timestamp?: number;
      token_count?: number;
      metadata?: Record<string, any>;
      embedding_id?: string;
    } = {}
  ): Promise<string> {
    assertDbWorker(dbWorker, Summary.create.name, Summary.name);
    const id = options.id || crypto.randomUUID();
    const now = Date.now();
    const summaryInstance = new Summary(id, chat_id, summary_text, dbWorker, now, now, options);
    return summaryInstance.saveToDB();
  }

  get metadata(): Record<string, any> | undefined {
    try {
        return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
    } catch (e) {
        console.error(`Failed to parse summary metadata_json for summary ${this.id}:`, e);
        return undefined;
    }
  }

  set metadata(data: Record<string, any> | undefined) {
    this.metadata_json = data ? JSON.stringify(data) : undefined;
  }

  static async read(id: string, dbWorker: Worker): Promise<Summary | undefined> {
    assertDbWorker(dbWorker, Summary.read.name, Summary.name);
    const requestId = crypto.randomUUID();
    return new Promise<Summary | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && event.data.result) {
            const sd = event.data.result;
            resolve(new Summary(sd.id, sd.chat_id, sd.summary_text, dbWorker, sd.created_at, sd.updated_at,
              { message_ids: sd.message_ids, parent_summary_id: sd.parent_summary_id, start_message_id: sd.start_message_id, end_message_id: sd.end_message_id, start_timestamp: sd.start_timestamp, end_timestamp: sd.end_timestamp, token_count: sd.token_count, metadata: sd.metadata_json ? JSON.parse(sd.metadata_json) : undefined, embedding_id: sd.embedding_id }
            ));
          } else if (event.data.success && !event.data.result) {
            resolve(undefined);
          } else {
            reject(new Error(event.data.error || `Failed to get summary (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener(MESSAGE_EVENT, handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHAT_SUMMARIES, id], requestId });
      setTimeout(() => { dbWorker.removeEventListener(MESSAGE_EVENT, handleMessage); reject(new Error(`Timeout getting summary ${id}`)); }, 5000);
    });
  }

  async update(updates: Partial<Omit<Summary, 'dbWorker' | 'id' | 'chat_id' | 'created_at'>>): Promise<void> {
    const { id, chat_id, created_at, dbWorker, ...allowedUpdates } = updates as any;
     if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
        this.metadata = allowedUpdates.metadata; delete allowedUpdates.metadata;
    }
    Object.assign(this, allowedUpdates);
    assertDbWorker(this, 'update', this.constructor.name);
    await this.saveToDB();
  }

  async delete(): Promise<void> {
    assertDbWorker(this, 'delete', this.constructor.name);
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success) { resolve(); }
          else { reject(new Error(event.data.error || `Failed to delete summary (id: ${this.id})`)); }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_CHAT_SUMMARIES, this.id], requestId });
      setTimeout(() => { 
        this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage); 
        reject(new Error(`Timeout deleting summary ${this.id}`)); 
      }, 5000);
    });
  }

  async saveToDB(): Promise<string> {
    assertDbWorker(this, 'saveToDB', this.constructor.name);
    const requestId = crypto.randomUUID();
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) { this.created_at = now; }
    const { dbWorker, ...summaryData } = this;
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Summary saved, but worker did not return valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save summary'));
          }
        }
      };
      this.dbWorker!.addEventListener(MESSAGE_EVENT, handleMessage);
      this.dbWorker!.postMessage({
        action: DBActions.PUT,
        payload: [DBNames.DB_USER_DATA, DBNames.DB_CHAT_SUMMARIES, summaryData],
        requestId
      });
      setTimeout(() => { 
        this.dbWorker!.removeEventListener(MESSAGE_EVENT, handleMessage); 
        reject(new Error(`Timeout saving summary ${this.id}`)); 
      }, 5000);
    });
  }

  toJSON() {
    return {
      __type: DB_ENTITY_TYPES.Summary,
      id: this.id,
      chat_id: this.chat_id,
      summary_text: this.summary_text,
      message_ids: this.message_ids,
      parent_summary_id: this.parent_summary_id,
      start_message_id: this.start_message_id,
      end_message_id: this.end_message_id,
      start_timestamp: this.start_timestamp,
      end_timestamp: this.end_timestamp,
      token_count: this.token_count,
      metadata_json: this.metadata_json,
      created_at: this.created_at,
      updated_at: this.updated_at,
      embedding_id: this.embedding_id
    };
  }

  static fromJSON(obj: any, dbWorker: Worker): Summary {
    if (!obj) throw new Error('Cannot hydrate Summary from null/undefined');
    return new Summary(
      obj.id,
      obj.chat_id,
      obj.summary_text,
      dbWorker,
      obj.created_at,
      obj.updated_at,
      {
        message_ids: obj.message_ids || [],
        parent_summary_id: obj.parent_summary_id,
        start_message_id: obj.start_message_id,
        end_message_id: obj.end_message_id,
        start_timestamp: obj.start_timestamp,
        end_timestamp: obj.end_timestamp,
        token_count: obj.token_count,
        metadata: obj.metadata_json ? JSON.parse(obj.metadata_json) : undefined,
        embedding_id: obj.embedding_id
      }
    );
  }
}