// idbModelAsset.ts

import { BaseCRUD } from "./idbBase";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";


export const MODEL_ASSET_TYPE_MANIFEST = 'manifest' as const;
export const MODEL_ASSET_TYPE_CHUNK = 'chunk' as const;
export const CHUNK_SIZE = 10 * 1024 * 1024;

export interface ModelAssetManifest {
  id: string;
  type: typeof MODEL_ASSET_TYPE_MANIFEST;
  chunkGroupId: string;
  fileName: string;
  folder: string;
  fileType: string;
  size: number; // Total file size
  totalChunks: number;
  chunkSizeUsed: number;
  status: string;
  downloadTimestamp?: number;
  addedAt: number;
  lastAccessed?: number;
  checksum?: string;
  version?: string | number;
}

export interface ModelAssetChunk {
  id: string;
  type: typeof MODEL_ASSET_TYPE_CHUNK;
  chunkGroupId: string;
  chunkIndex: number;
  fileName: string;
  folder: string;
  fileType: string;
  chunkSize: number;
  data: ArrayBuffer;
  addedAt: number;
  lastAccessed?: number;
  checksum?: string;
  totalChunks?: number; // Now part of the interface (optional)
  version?: string | number;
}

export function isModelAssetManifest(obj: any): obj is ModelAssetManifest {
  return obj && obj.type === MODEL_ASSET_TYPE_MANIFEST;
}
export function isModelAssetChunk(obj: any): obj is ModelAssetChunk {
  return obj && obj.type === MODEL_ASSET_TYPE_CHUNK;
}

export class ModelAsset extends BaseCRUD<ModelAssetManifest | ModelAssetChunk> {
  public data: ModelAssetManifest | ModelAssetChunk;

  constructor(data: ModelAssetManifest | ModelAssetChunk, dbWorker: Worker) {
    super(data.id, data.fileName, dbWorker);
    this.data = data;
  }

  async update(updates: Partial<ModelAssetManifest | ModelAssetChunk>): Promise<void> {
    const currentData = this.data;
    if (isModelAssetManifest(currentData)) {
      const { id, type, addedAt, ...restUpdates } = updates as Partial<ModelAssetManifest>;
      await ModelAsset.updateManifest(currentData.id, restUpdates, this.dbWorker);
      Object.assign(this.data, restUpdates);
    } else if (isModelAssetChunk(currentData)) {
      const { id, type, data, addedAt, ...restUpdates } = updates as Partial<ModelAssetChunk>;
      await ModelAsset.updateChunk(currentData.id, restUpdates, this.dbWorker);
      Object.assign(this.data, restUpdates);
    } else {
      throw new Error('Unknown ModelAsset type for instance update');
    }
  }

  async delete(): Promise<void> {
    if (isModelAssetManifest(this.data)) {
      await ModelAsset.deleteManifest(this.id, this.dbWorker);
    } else if (isModelAssetChunk(this.data)) {
      await ModelAsset.deleteChunk(this.id, this.dbWorker);
    } else {
      throw new Error('Unknown ModelAsset type for instance delete');
    }
  }

  async saveToDB(): Promise<string> {
    const currentData = this.data;
    if (isModelAssetManifest(currentData)) {
      const payloadForCreate: Parameters<typeof ModelAsset.createManifest>[0] = {
        chunkGroupId: currentData.chunkGroupId,
        fileName: currentData.fileName,
        folder: currentData.folder,
        fileType: currentData.fileType,
        totalFileSize: currentData.size,
        totalChunks: currentData.totalChunks,
        chunkSizeUsed: currentData.chunkSizeUsed,
        status: currentData.status,
        downloadTimestamp: currentData.downloadTimestamp || Date.now(),
        checksum: currentData.checksum,
        version: currentData.version,
      };
      if (currentData.id && currentData.id.startsWith('manifest:')) {
        payloadForCreate.id = currentData.id;
      }
      return ModelAsset.createManifest(payloadForCreate, this.dbWorker);

    } else if (isModelAssetChunk(currentData)) {

      if (typeof currentData.totalChunks !== 'number') {

        console.warn(`[ModelAsset.saveToDB] Chunk instance ${currentData.id} is missing 'totalChunks' property. This is required by static ModelAsset.createChunk. Defaulting to 0, but this may be incorrect.`);

      }

      const payloadForCreate: Parameters<typeof ModelAsset.createChunk>[0] = {
        folder: currentData.folder,
        fileName: currentData.fileName,
        fileType: currentData.fileType,
        data: currentData.data, 
        chunkIndex: currentData.chunkIndex,
        totalChunks: currentData.totalChunks || 0, 
        chunkGroupId: currentData.chunkGroupId,
      };
      if (currentData.id && currentData.id.includes(':')) {
        payloadForCreate.id = currentData.id; 
      }
      return ModelAsset.createChunk(payloadForCreate, this.dbWorker);
    } else {
      throw new Error('Unknown ModelAsset type for instance saveToDB');
    }
  }

  private static sendWorkerRequest<T>(dbWorker: Worker, action: string, payloadArray: any[]): Promise<T> {
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.requestId === requestId) {
          dbWorker.removeEventListener('message', handleMessage);
          if (event.data.success) {
            resolve(event.data.result as T);
          } else {
            const err = event.data.error;
            reject(new Error(err?.message || err || `Worker request failed for action ${action}`));
          }
        }
      };
      dbWorker.addEventListener('message', handleMessage);
      dbWorker.postMessage({ action, payload: payloadArray, requestId });
      setTimeout(() => {
        dbWorker.removeEventListener('message', handleMessage);
        reject(new Error(`Timeout for worker request action ${action}`));
      }, 15000);
    });
  }

  static async createChunk(
    chunkPayload: {
        folder: string;
        fileName: string;
        fileType: string;
        data: ArrayBuffer;
        chunkIndex: number;
        totalChunks: number; 
        chunkGroupId: string;
        id?: string;
    },
    dbWorker: Worker
  ): Promise<string> {
    const id = chunkPayload.id || `${chunkPayload.chunkGroupId}:${chunkPayload.chunkIndex}`;
    const record: ModelAssetChunk = {
      id,
      type: MODEL_ASSET_TYPE_CHUNK,
      chunkGroupId: chunkPayload.chunkGroupId,
      chunkIndex: chunkPayload.chunkIndex,
      fileName: chunkPayload.fileName,
      folder: chunkPayload.folder,
      fileType: chunkPayload.fileType,
      chunkSize: chunkPayload.data.byteLength,
      data: chunkPayload.data,
      addedAt: Date.now(),
      totalChunks: chunkPayload.totalChunks, 
    };
    return ModelAsset.sendWorkerRequest<string>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, record]);
  }

  static async createManifest(
    manifestPayload: {
        chunkGroupId: string;
        fileName: string;
        folder: string;
        fileType: string;
        totalFileSize: number;
        totalChunks: number;
        chunkSizeUsed: number;
        status: string;
        downloadTimestamp: number;
        id?: string;
        checksum?: string;
        version?: string | number;
    },
    dbWorker: Worker
  ): Promise<string> {
    const id = manifestPayload.id || `manifest:${manifestPayload.chunkGroupId}`;
    const record: ModelAssetManifest = {
      id,
      type: MODEL_ASSET_TYPE_MANIFEST,
      chunkGroupId: manifestPayload.chunkGroupId,
      fileName: manifestPayload.fileName,
      folder: manifestPayload.folder,
      fileType: manifestPayload.fileType,
      size: manifestPayload.totalFileSize,
      totalChunks: manifestPayload.totalChunks,
      chunkSizeUsed: manifestPayload.chunkSizeUsed,
      status: manifestPayload.status,
      downloadTimestamp: manifestPayload.downloadTimestamp,
      addedAt: Date.now(),
      checksum: manifestPayload.checksum,
      version: manifestPayload.version,
    };
    return ModelAsset.sendWorkerRequest<string>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, record]);
  }

  static async readChunk(chunkId: string, dbWorker: Worker): Promise<ModelAssetChunk | undefined> {
    const result = await ModelAsset.sendWorkerRequest<ModelAssetChunk | undefined>(dbWorker, DBActions.GET, [DBNames.DB_MODELS, DBNames.DB_MODELS, chunkId]);
    return result && isModelAssetChunk(result) ? result : undefined;
  }

  static async readManifest(manifestId: string, dbWorker: Worker): Promise<ModelAssetManifest | undefined> {
    const result = await ModelAsset.sendWorkerRequest<ModelAssetManifest | undefined>(dbWorker, DBActions.GET, [DBNames.DB_MODELS, DBNames.DB_MODELS, manifestId]);
    return result && isModelAssetManifest(result) ? result : undefined;
  }

  static async readManifestByChunkGroupId(chunkGroupId: string, dbWorker: Worker): Promise<ModelAssetManifest | undefined> {
    const query = {
      from: DBNames.DB_MODELS,
      where: { chunkGroupId: chunkGroupId, type: MODEL_ASSET_TYPE_MANIFEST },
      limit: 1
    };
    const results = await ModelAsset.sendWorkerRequest<ModelAssetManifest[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results && results.length > 0 && isModelAssetManifest(results[0]) ? results[0] : undefined;
  }

  static async countStoredChunks(chunkGroupId: string, dbWorker: Worker): Promise<number> {
    const query = {
      from: DBNames.DB_MODELS,
      select: ['id'],
      where: { chunkGroupId: chunkGroupId, type: MODEL_ASSET_TYPE_CHUNK }
    };
    const results = await ModelAsset.sendWorkerRequest<any[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results ? results.length : 0;
  }

  static async queryManifests(
    queryParams: { folder: string; type: typeof MODEL_ASSET_TYPE_MANIFEST; fileName?: string },
    dbWorker: Worker
  ): Promise<ModelAssetManifest[]> {
    const whereClause: any = { folder: queryParams.folder, type: queryParams.type };
    if (queryParams.fileName) {
      whereClause.fileName = queryParams.fileName;
    }
    const query = {
      from: DBNames.DB_MODELS,
      where: whereClause
    };
    const results = await ModelAsset.sendWorkerRequest<any[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results ? results.filter(isModelAssetManifest) : [];
  }

  static async getUniqueChunkGroupIds(folder: string, dbWorker: Worker): Promise<string[]> {
    const query = {
        from: DBNames.DB_MODELS,
        select: ['chunkGroupId'],
        where: { folder: folder }
    };
    const results = await ModelAsset.sendWorkerRequest<{chunkGroupId: string}[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    if (!results) return [];
    return Array.from(new Set(results.map(r => r.chunkGroupId).filter(Boolean)));
  }

  static async getChunksByGroupId(chunkGroupId: string, metadataOnly: boolean, dbWorker: Worker): Promise<Partial<ModelAssetChunk>[]> {
    const query: any = {
        from: DBNames.DB_MODELS,
        where: { chunkGroupId: chunkGroupId, type: MODEL_ASSET_TYPE_CHUNK },
        orderBy: [{ field: 'chunkIndex', direction: 'asc' }]
    };
    if (metadataOnly) {
        query.select = ['id', 'type', 'chunkGroupId', 'chunkIndex', 'fileName', 'folder', 'fileType', 'chunkSize', 'addedAt', 'lastAccessed', 'checksum', 'version', 'totalChunks'];
    }
    const results = await ModelAsset.sendWorkerRequest<ModelAssetChunk[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results || [];
  }

   static async updateManifest(id: string, updates: Partial<Omit<ModelAssetManifest, 'id' | 'type' | 'addedAt'>>, dbWorker: Worker): Promise<void> {
    const existing = await ModelAsset.readManifest(id, dbWorker);
    if (!existing) throw new Error(`Manifest with id ${id} not found for update.`);
    const updatedRecord: ModelAssetManifest = {
        ...existing,
        ...updates,
        id: existing.id,
        type: MODEL_ASSET_TYPE_MANIFEST,
        addedAt: existing.addedAt
    };
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, updatedRecord]);
  }

  static async updateChunk(id: string, updates: Partial<Omit<ModelAssetChunk, 'id' | 'type' | 'addedAt' | 'data'>>, dbWorker: Worker): Promise<void> {
    const existing = await ModelAsset.readChunk(id, dbWorker);
    if (!existing) throw new Error(`Chunk with id ${id} not found for update.`);
    const updatedRecord: ModelAssetChunk = {
        ...existing,
        ...updates,
        id: existing.id,
        type: MODEL_ASSET_TYPE_CHUNK,
        addedAt: existing.addedAt,
        data: existing.data
    };
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, updatedRecord]);
  }

  static async deleteManifest(manifestId: string, dbWorker: Worker): Promise<void> {
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.DELETE, [DBNames.DB_MODELS, DBNames.DB_MODELS, manifestId]);
  }

  static async deleteChunk(chunkId: string, dbWorker: Worker): Promise<void> {
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.DELETE, [DBNames.DB_MODELS, DBNames.DB_MODELS, chunkId]);
  }
}