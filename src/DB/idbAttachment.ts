// idbAttachment.ts

import { BaseCRUD } from "./idbBase";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";

export class Attachment extends BaseCRUD<Attachment> {
  public message_id: string;
  public file_name: string;
  public mime_type: string;
  public data: Blob;
  public created_at: number;
  public updated_at: number;

  constructor(
    message_id: string,
    file_name: string,
    mime_type: string,
    data: Blob,
    dbWorker: Worker,
    options: { id?: string; created_at?: number; updated_at?: number; } = {}
  ) {
    super(options.id || crypto.randomUUID(), file_name, dbWorker);
    this.message_id = message_id;
    this.file_name = file_name;
    this.mime_type = mime_type;
    this.data = data;
    const now = Date.now();
    this.created_at = options.created_at || now;
    this.updated_at = options.updated_at || now;
  }

  static async create(message_id: string, file_name: string, mime_type: string, data: Blob, dbWorker: Worker, options: { id?: string } = {}): Promise<string> {
    const tempAtt = new Attachment(message_id, file_name, mime_type, data, dbWorker, options);
    return tempAtt.saveToDB();
  }

  static async read(id: string, dbWorker: Worker): Promise<Attachment | undefined> {
    const requestId = crypto.randomUUID();
    return new Promise<Attachment | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && event.data.result) {
            const attData = event.data.result;
            resolve(new Attachment(attData.message_id, attData.file_name, attData.mime_type, attData.data as Blob, dbWorker, { id: attData.id, created_at: attData.created_at, updated_at: attData.updated_at }));
          } else if (event.data.success && !event.data.result) {
            resolve(undefined);
          } else {
            reject(new Error(event.data.error || `Failed to get attachment (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener('message', handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_ATTACHMENTS, id], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for get attachment (id: ${id}) confirmation`));
      }, 5000);
    });
  }

  async update(updates: Partial<Omit<Attachment, 'dbWorker' | 'id' | 'created_at' | 'message_id'>>): Promise<void> {
    const { id, dbWorker, created_at, message_id, ...allowedUpdates } = updates as any;
    Object.assign(this, allowedUpdates);
    await this.saveToDB();
  }

  async delete(): Promise<void> {
    const requestId = crypto.randomUUID();
    return new Promise<void>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error || `Failed to delete attachment (id: ${this.id})`));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_ATTACHMENTS, this.id], requestId });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for delete attachment (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  async saveToDB(): Promise<string> {
    const requestId = crypto.randomUUID();
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) {
        this.created_at = now;
    }
    const { dbWorker, ...attachmentData } = this;
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Attachment saved, but worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save attachment'));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({
        action: DBActions.PUT,
        payload: [DBNames.DB_USER_DATA, DBNames.DB_ATTACHMENTS, attachmentData],
        requestId
      });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for attachment (id: ${this.id}) save confirmation`));
      }, 5000);
    });
  }

  static async getAllByMessageId(message_id: string, dbWorker: Worker): Promise<Attachment[]> {
    const requestId = crypto.randomUUID();
    return new Promise<Attachment[]>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                dbWorker.removeEventListener('message', handleMessage);
                if (event.data.success && Array.isArray(event.data.result)) {
                    const attachments = event.data.result.map((attData: any) => new Attachment(attData.message_id, attData.file_name, attData.mime_type, attData.data as Blob, dbWorker, {id: attData.id, created_at: attData.created_at, updated_at: attData.updated_at }));
                    resolve(attachments);
                } else if (event.data.success && !event.data.result) {
                     resolve([]);
                } else {
                    reject(new Error(event.data.error || `Failed to get attachments for message_id: ${message_id}`));
                }
            }
        };
        dbWorker.addEventListener('message', handleMessage);
        const queryObj = { from: DBNames.DB_ATTACHMENTS, where: { message_id: message_id }, orderBy: [{ field: 'message_id', direction: 'asc' }] };
        dbWorker.postMessage({ action: DBActions.QUERY, payload: [DBNames.DB_USER_DATA, queryObj], requestId });
        setTimeout(() => {
            dbWorker.removeEventListener('message', handleMessage);
            reject(new Error(`Timeout waiting for getAllByMessageId (message_id: ${message_id}) confirmation`));
        }, 5000);
    });
  }
}