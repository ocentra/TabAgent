// idbEmbedding.ts

// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.

import { BaseCRUD } from "./idbBase";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";

export class Embedding extends BaseCRUD<Embedding> {
  public input: string;
  public vector: ArrayBuffer;
  public model: string;
  public created_at: number;
  public updated_at: number;

  constructor(
    id: string,
    input: string,
    vector: ArrayBuffer,
    model: string,
    created_at: number,
    updated_at: number,
    dbWorker: Worker,
    label?: string // optional, defaults to input
  ) {
    super(id, label ?? input, dbWorker);
    this.input = input;
    this.vector = vector;
    this.model = model;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static toArrayBuffer(arr: number[] | Float32Array | ArrayBuffer): ArrayBuffer {
    if (arr instanceof ArrayBuffer) return arr;
    if (arr instanceof Float32Array) return ArrayBuffer.prototype.slice.call(arr.buffer, arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
    return new Float32Array(arr).buffer;
  }

  static fromArrayBuffer(buf: ArrayBuffer): Float32Array {
    return new Float32Array(buf);
  }

  static async create(
    input: string,
    vectorData: number[] | Float32Array | ArrayBuffer,
    model: string,
    dbWorker: Worker,
    options: { id?: string; label?: string } = {}
  ): Promise<string> {
    const id = options.id || crypto.randomUUID();
    const now = Date.now();
    const vector = Embedding.toArrayBuffer(vectorData);
    const embeddingInstance = new Embedding(id, input, vector, model, now, now, dbWorker, options.label);
    return embeddingInstance.saveToDB();
  }

  async saveToDB(): Promise<string> {
    const requestId = crypto.randomUUID();
    const now = Date.now();
    this.updated_at = now;
    if (!this.created_at) {
      this.created_at = now;
    }
    const embeddingData: any = { ...this };
    if ('dbWorker' in embeddingData) delete embeddingData.dbWorker;
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          this.dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && typeof event.data.result === 'string') {
            resolve(event.data.result);
          } else if (event.data.success) {
            reject(new Error('Embedding saved, but worker did not return a valid ID.'));
          } else {
            reject(new Error(event.data.error || 'Failed to save embedding'));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({ action: DBActions.PUT, payload: [DBNames.DB_USER_DATA, DBNames.DB_EMBEDDINGS, embeddingData], requestId });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for embedding (id: ${this.id}) save confirmation`));
      }, 5000);
    });
  }

  static async get(id: string, dbWorker: Worker): Promise<Embedding | undefined> {
    const requestId = crypto.randomUUID();
    return new Promise<Embedding | undefined>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success && event.data.result) {
            const embData = event.data.result;
            resolve(new Embedding(embData.id, embData.input, embData.vector as ArrayBuffer, embData.model, embData.created_at, embData.updated_at, dbWorker, embData.label));
          } else if (event.data.success && !event.data.result) {
            resolve(undefined);
          } else {
            reject(new Error(event.data.error || `Failed to get embedding (id: ${id})`));
          }
        }
      };
      dbWorker.addEventListener('message', handleMessage);
      dbWorker.postMessage({ action: DBActions.GET, payload: [DBNames.DB_USER_DATA, DBNames.DB_EMBEDDINGS, id], requestId });
      setTimeout(() => {
        dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for get embedding (id: ${id}) confirmation`));
      }, 5000);
    });
  }

  static async getByInputAndModel(input: string, model: string, dbWorker: Worker): Promise<Embedding | undefined> {
    const requestId = crypto.randomUUID();
    return new Promise<Embedding | undefined>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.requestId === requestId) {
                dbWorker.removeEventListener('message', handleMessage);
                if (event.data.success && Array.isArray(event.data.result)) {
                    const results = event.data.result;
                    if (results.length > 0) {
                        const embData = results[0];
                        resolve(new Embedding(embData.id, embData.input, embData.vector as ArrayBuffer, embData.model, embData.created_at, embData.updated_at, dbWorker, embData.label));
                    } else {
                        resolve(undefined);
                    }
                } else if (event.data.success && !event.data.result) {
                     resolve(undefined);
                } else {
                    reject(new Error(event.data.error || `Failed to get embedding by input/model`));
                }
            }
        };
        dbWorker.addEventListener('message', handleMessage);
        const queryObj = { from: DBNames.DB_EMBEDDINGS, where: { input: input, model: model }, limit: 1, orderBy: [{field: 'input', direction: 'asc'}]};
        dbWorker.postMessage({ action: DBActions.QUERY, payload: [DBNames.DB_USER_DATA, queryObj], requestId });
        setTimeout(() => {
            dbWorker.removeEventListener('message', handleMessage);
            reject(new Error(`Timeout waiting for getByInputAndModel confirmation for input: "${input.substring(0,30)}..."`));
        }, 5000);
    });
  }

  async update(updates: Partial<Omit<Embedding, 'dbWorker' | 'id' | 'created_at' | 'input'>>): Promise<void> {
    const { ...allowedUpdates } = updates as any;
    if (allowedUpdates.vector && !(allowedUpdates.vector instanceof ArrayBuffer)) {
        allowedUpdates.vector = Embedding.toArrayBuffer(allowedUpdates.vector);
    }
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
            reject(new Error(event.data.error || `Failed to delete embedding (id: ${this.id})`));
          }
        }
      };
      this.dbWorker.addEventListener('message', handleMessage);
      this.dbWorker.postMessage({ action: DBActions.DELETE, payload: [DBNames.DB_USER_DATA, DBNames.DB_EMBEDDINGS, this.id], requestId });
      setTimeout(() => {
        this.dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout waiting for delete embedding (id: ${this.id}) confirmation`));
      }, 5000);
    });
  }

  static async generateVectorWithModelWorker(input: string, model: string, modelWorker: Worker): Promise<ArrayBuffer> {
    const requestId = crypto.randomUUID();
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const handleModelResponse = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          modelWorker.removeEventListener('message', handleModelResponse);
          if (event.data.success && event.data.vector instanceof ArrayBuffer) {
            resolve(event.data.vector);
          } else if (event.data.success) {
            reject(new Error('Model worker returned success but no valid vector.'));
          } else {
            reject(new Error(event.data.error || 'Model worker failed to generate embedding vector.'));
          }
        }
      };
      modelWorker.addEventListener('message', handleModelResponse);
      modelWorker.postMessage({ action: 'generateEmbeddingVector', input, model, requestId });
      setTimeout(() => {
        modelWorker.removeEventListener('message', handleModelResponse);
        reject(new Error(`Timeout waiting for model worker to generate vector for input: "${input.substring(0,30)}..."`));
      }, 15000);
    });
  }
}