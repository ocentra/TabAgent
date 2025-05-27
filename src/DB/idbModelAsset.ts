// idbModelAsset.ts

import { BaseCRUD, Manifest } from "./idbBase";
import { DBNames } from "./idbSchema";
import { DBActions } from "./dbActions";
// @ts-ignore: If using JS/TS without types for spark-md5
import SparkMD5 from 'spark-md5';

export const MODEL_ASSET_TYPE_MANIFEST = 'manifest' as const;
export const MODEL_ASSET_TYPE_CHUNK = 'chunk' as const;
export const CHUNK_SIZE = 10 * 1024 * 1024;

export interface ModelAssetManifest extends Manifest {
  type: typeof MODEL_ASSET_TYPE_MANIFEST;
  chunkGroupId: string;
  folder: string;
  size: number;
  totalChunks: number;
  chunkSizeUsed: number;
  downloadTimestamp?: number;
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
  totalChunks?: number;
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
  public dbWorker: Worker;

  constructor(data: ModelAssetManifest | ModelAssetChunk, dbWorker: Worker) {
    super(data.id, (data as any).fileName, dbWorker);
    this.data = data;
    this.dbWorker = dbWorker;
  }

  async saveToDB(): Promise<string> {
    if (isModelAssetManifest(this.data)) {
      return await ModelAsset.createManifest(this.data, this.dbWorker);
    } else if (isModelAssetChunk(this.data)) {
      return await ModelAsset.createChunk(this.data, this.dbWorker);
    }
    throw new Error("Unknown ModelAsset type for saveToDB");
  }

  async update(updates: Partial<ModelAssetManifest | ModelAssetChunk>): Promise<void> {
    if (isModelAssetManifest(this.data)) {
      await ModelAsset.updateManifest(this.data.id, updates, this.dbWorker);
      Object.assign(this.data, updates);
    } else if (isModelAssetChunk(this.data)) {
      await ModelAsset.updateChunk(this.data.id, updates, this.dbWorker);
      Object.assign(this.data, updates);
    } else {
      throw new Error("Unknown ModelAsset type for update");
    }
  }

  async delete(): Promise<void> {
    if (isModelAssetManifest(this.data)) {
      await ModelAsset.deleteManifest(this.data.id, this.dbWorker);
    } else if (isModelAssetChunk(this.data)) {
      await ModelAsset.deleteChunk(this.data.id, this.dbWorker);
    } else {
      throw new Error("Unknown ModelAsset type for delete");
    }
  }

  /**
   * Create this asset in the DB (preferred CRUD method; alias for saveToDB)
   */
  async create(): Promise<string> {
    return this.saveToDB();
  }

  /**
   * Read the latest data for this asset from the DB and update this.data
   */
  async read(): Promise<void> {
    if (isModelAssetManifest(this.data)) {
      const latest = await ModelAsset.readManifest(this.data.id, this.dbWorker);
      if (!latest) throw new Error(`Manifest with id ${this.data.id} not found in DB`);
      this.data = latest;
    } else if (isModelAssetChunk(this.data)) {
      const latest = await ModelAsset.readChunk(this.data.id, this.dbWorker);
      if (!latest) throw new Error(`Chunk with id ${this.data.id} not found in DB`);
      this.data = latest;
    } else {
      throw new Error("Unknown ModelAsset type for read");
    }
  }

  // =====================
  // Repo-level (All manifests for a model/folder)
  // =====================

  static async readAllFileManifestsForRepo(folder: string, dbWorker: Worker): Promise<ModelAssetManifest[]> {
    const results = await ModelAsset.sendWorkerRequest<any[]>(
      dbWorker,
      DBActions.QUERY_MANIFESTS,
      [DBNames.DB_MODELS, DBNames.DB_MODELS, folder]
    );
    return results ? results.filter(isModelAssetManifest) : [];
  }

  static async createAllFileManifestsForRepo(manifests: ModelAssetManifest[], dbWorker: Worker): Promise<string[]> {
    const ids: string[] = [];
    for (const manifest of manifests) {
      const id = await ModelAsset.createManifest(manifest, dbWorker);
      ids.push(id);
    }
    return ids;
  }

  static async updateAllFileManifestsForRepo(manifests: ModelAssetManifest[], dbWorker: Worker): Promise<void> {
    for (const manifest of manifests) {
      await ModelAsset.updateManifest(manifest.id, manifest, dbWorker);
    }
  }

  static async deleteAllFileManifestsForRepo(folder: string, dbWorker: Worker): Promise<void> {
    const manifests = await ModelAsset.readAllFileManifestsForRepo(folder, dbWorker);
    for (const manifest of manifests) {
      await ModelAsset.deleteManifest(manifest.id, dbWorker);
    }
  }
    // =====================
  // All manifests for all repos
  // =====================
  static async readAllFileManifestsForAllRepos(dbWorker: Worker): Promise<ModelAssetManifest[]> {
    const query = {
      from: DBNames.DB_MODELS,
      where: { type: MODEL_ASSET_TYPE_MANIFEST }
    };
    const results = await ModelAsset.sendWorkerRequest<any[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results ? results.filter(isModelAssetManifest) : [];
  }

  // =====================
  // File-level (Single manifest by chunkGroupId)
  // =====================

  static async readManifestByChunkGroupId(chunkGroupId: string, dbWorker: Worker): Promise<ModelAssetManifest | undefined> {
    const query = {
      from: DBNames.DB_MODELS,
      where: { chunkGroupId: chunkGroupId, type: MODEL_ASSET_TYPE_MANIFEST },
      limit: 1
    };
    const results = await ModelAsset.sendWorkerRequest<ModelAssetManifest[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results && results.length > 0 && isModelAssetManifest(results[0]) ? results[0] : undefined;
  }

  static async createManifestByChunkGroupId(manifest: ModelAssetManifest, dbWorker: Worker): Promise<string> {
    return ModelAsset.createManifest(manifest, dbWorker);
  }

  static async updateManifestByChunkGroupId(chunkGroupId: string, updates: Partial<Omit<ModelAssetManifest, 'id' | 'type' | 'addedAt'>>, dbWorker: Worker): Promise<void> {
    const manifest = await ModelAsset.readManifestByChunkGroupId(chunkGroupId, dbWorker);
    if (!manifest) throw new Error(`Manifest with chunkGroupId ${chunkGroupId} not found for update.`);
    await ModelAsset.updateManifest(manifest.id, updates, dbWorker);
  }

  static async deleteManifestByChunkGroupId(chunkGroupId: string, dbWorker: Worker): Promise<void> {
    const manifest = await ModelAsset.readManifestByChunkGroupId(chunkGroupId, dbWorker);
    if (!manifest) throw new Error(`Manifest with chunkGroupId ${chunkGroupId} not found for delete.`);
    await ModelAsset.deleteManifest(manifest.id, dbWorker);
  }


  // =====================
  // Record-level (by id)
  // =====================

  static async readManifest(manifestId: string, dbWorker: Worker): Promise<ModelAssetManifest | undefined> {
    const result = await ModelAsset.sendWorkerRequest<ModelAssetManifest | undefined>(dbWorker, DBActions.GET, [DBNames.DB_MODELS, DBNames.DB_MODELS, manifestId]);
    return result && isModelAssetManifest(result) ? result : undefined;
  }

  static async createManifest(manifest: ModelAssetManifest, dbWorker: Worker): Promise<string> {
    const record = {
      ...manifest,
      id: manifest.id || `${manifest.folder}/${manifest.fileName}:manifest`,
      type: 'manifest',
    };
    return ModelAsset.sendWorkerRequest<string>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, record]);
  }

  static async updateManifest(manifestId: string, updates: Partial<Omit<ModelAssetManifest, 'id' | 'type' | 'addedAt'>>, dbWorker: Worker): Promise<void> {
    const existing = await ModelAsset.readManifest(manifestId, dbWorker);
    if (!existing) throw new Error(`Manifest with id ${manifestId} not found for update.`);
    const updatedRecord: ModelAssetManifest = {
      ...existing,
      ...updates,
      id: existing.id,
      type: MODEL_ASSET_TYPE_MANIFEST,
      addedAt: existing.addedAt
    };
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, updatedRecord]);
  }

  static async deleteManifest(manifestId: string, dbWorker: Worker): Promise<void> {
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.DELETE, [DBNames.DB_MODELS, DBNames.DB_MODELS, manifestId]);
  }



  // =====================
  // Chunk-level (file data)
  // =====================

  static async createChunk(chunk: ModelAssetChunk, dbWorker: Worker): Promise<string> {
    const id = chunk.id || `${chunk.chunkGroupId}:${chunk.chunkIndex}`;
    const record: ModelAssetChunk = {
      ...chunk,
      id,
      type: MODEL_ASSET_TYPE_CHUNK,
      addedAt: chunk.addedAt || Date.now(),
    };
    return ModelAsset.sendWorkerRequest<string>(dbWorker, DBActions.PUT, [DBNames.DB_MODELS, DBNames.DB_MODELS, record]);
  }

  static async readChunk(chunkId: string, dbWorker: Worker): Promise<ModelAssetChunk | undefined> {
    const result = await ModelAsset.sendWorkerRequest<ModelAssetChunk | undefined>(dbWorker, DBActions.GET, [DBNames.DB_MODELS, DBNames.DB_MODELS, chunkId]);
    return result && isModelAssetChunk(result) ? result : undefined;
  }

  static async updateChunk(chunkId: string, updates: Partial<Omit<ModelAssetChunk, 'id' | 'type' | 'addedAt' | 'data'>>, dbWorker: Worker): Promise<void> {
    const existing = await ModelAsset.readChunk(chunkId, dbWorker);
    if (!existing) throw new Error(`Chunk with id ${chunkId} not found for update.`);
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

  static async deleteChunk(chunkId: string, dbWorker: Worker): Promise<void> {
    await ModelAsset.sendWorkerRequest<void>(dbWorker, DBActions.DELETE, [DBNames.DB_MODELS, DBNames.DB_MODELS, chunkId]);
  }

  static async readChunksByGroupId(chunkGroupId: string, metadataOnly: boolean, dbWorker: Worker): Promise<Partial<ModelAssetChunk>[]> {
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

  static async countStoredChunks(chunkGroupId: string, dbWorker: Worker): Promise<number> {
    const query = {
      from: DBNames.DB_MODELS,
      select: ['id','fileName','fileType','chunkIndex','chunkSize','data'],
      where: { chunkGroupId: chunkGroupId, type: MODEL_ASSET_TYPE_CHUNK }
    };
    const results = await ModelAsset.sendWorkerRequest<any[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    return results ? results.length : 0;
  }

  static async readUniqueChunkGroupIds(folder: string, dbWorker: Worker): Promise<string[]> {
    const query = {
      from: DBNames.DB_MODELS,
      select: ['chunkGroupId'],
      where: { folder: folder }
    };
    const results = await ModelAsset.sendWorkerRequest<{chunkGroupId: string}[]>(dbWorker, DBActions.QUERY, [DBNames.DB_MODELS, query]);
    if (!results) return [];
    return Array.from(new Set(results.map(r => r.chunkGroupId).filter(Boolean)));
  }

  // =====================
  // Utility
  // =====================

  static checksumChunkMD5(arrayBuffer: ArrayBuffer): string {
    return SparkMD5.ArrayBuffer.hash(arrayBuffer);
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

  // =====================
  // Static instance helpers (for symmetry with Chat)
  // =====================

  /**
   * Create a new ModelAsset in the DB and return an instance
   */
  static async createAsset(data: ModelAssetManifest | ModelAssetChunk, dbWorker: Worker): Promise<ModelAsset> {
    let id: string;
    if (isModelAssetManifest(data)) {
      id = await ModelAsset.createManifest(data, dbWorker);
    } else if (isModelAssetChunk(data)) {
      id = await ModelAsset.createChunk(data, dbWorker);
    } else {
      throw new Error("Unknown ModelAsset type for createAsset");
    }
    // Fetch the latest from DB to ensure all fields are up to date
    const asset = await ModelAsset.read(id, dbWorker);
    if (!asset) throw new Error(`Failed to retrieve asset after creation (id: ${id})`);
    return asset;
  }

  /**
   * Read a ModelAsset (manifest or chunk) by id and return an instance
   */
  static async read(id: string, dbWorker: Worker): Promise<ModelAsset | undefined> {
    const manifest = await ModelAsset.readManifest(id, dbWorker);
    if (manifest) return new ModelAsset(manifest, dbWorker);
    const chunk = await ModelAsset.readChunk(id, dbWorker);
    if (chunk) return new ModelAsset(chunk, dbWorker);
    return undefined;
  }



}