import { INFERENCE_SETTINGS_SINGLETON_ID, InferenceSettings } from '../Controllers/InferenceSettings';
import { DBNames } from './idbSchema';

// --- Types ---
export enum QuantStatus {
  Available = 'available',
  Downloaded = 'downloaded',
  Failed = 'failed',
  NotFound = 'not_found',
  Unavailable = 'unavailable',
  Unsupported = 'unsupported',
  ServerOnly = 'server_only',
}

export type QuantInfo = {
  files: string[]; // Full paths (rfilename) to all required files for this quant
  status: QuantStatus;
};

export const CURRENT_MANIFEST_VERSION = 1;
// Default size limit - will be overridden by settings
export const DEFAULT_SERVER_ONLY_SIZE = 2.1 * 1024 * 1024 * 1024; // 2.1GB

// Function to get the current server-only size limit from settings
export function getServerOnlySizeLimit(): number {
  try {
    const stored = localStorage.getItem('modelLoadingSettings');
    if (LOG_DEBUG) console.log(`${prefix} getServerOnlySizeLimit - stored settings:`, stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (LOG_DEBUG) console.log(`${prefix} getServerOnlySizeLimit - parsed settings:`, parsed);
      const limit = (parsed.maxModelSize || 2.1) * 1024 * 1024 * 1024;
      if (LOG_DEBUG) console.log(`${prefix} getServerOnlySizeLimit - calculated limit:`, limit / (1024*1024*1024), 'GB');
      return limit;
    }
  } catch (e) {
    if (LOG_ERROR) console.error(`${prefix} Error parsing model loading settings:`, e);
  }
  if (LOG_DEBUG) console.log(`${prefix} getServerOnlySizeLimit - using default:`, DEFAULT_SERVER_ONLY_SIZE / (1024*1024*1024), 'GB');
  return DEFAULT_SERVER_ONLY_SIZE;
}

// Function to get the current bypass models from settings
export function getBypassSizeLimitModels(): Set<string> {
  try {
    const stored = localStorage.getItem('modelLoadingSettings');
    if (LOG_DEBUG) console.log(`${prefix} getBypassSizeLimitModels - stored settings:`, stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (LOG_DEBUG) console.log(`${prefix} getBypassSizeLimitModels - parsed settings:`, parsed);
      const bypassSet = new Set<string>(parsed.bypassModels || []);
      if (LOG_DEBUG) console.log(`${prefix} getBypassSizeLimitModels - bypass models:`, Array.from(bypassSet));
      return bypassSet;
    }
  } catch (e) {
    if (LOG_ERROR) console.error(`${prefix} Error parsing model loading settings:`, e);
  }
  
  // Default bypass models (MediaPipe models that need to bypass size limits)
  const defaultBypassModels = new Set<string>([
    'google/gemma-3n-E4B-it-litert-lm'
  ]);
  
  if (LOG_DEBUG) console.log(`${prefix} getBypassSizeLimitModels - using default bypass models:`, Array.from(defaultBypassModels));
  return defaultBypassModels;
}
export type ManifestEntry = {
  repo: string; // e.g., "microsoft/Phi-3-mini-4k-instruct-onnx"
  quants: Record<string, QuantInfo>; // Key is the full rfilename of the .onnx file
  task?: string; // e.g., "text-generation"
  manifestVersion: number; // Version of the manifest structure itself
};

const prefix = '[IDBModel]';
const LOG_GENERAL = true;
const LOG_DEBUG = true;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_INFERENCE_SETTINGS = false;
const LOG_OPEN_DB = false;


export const modelCacheSchema = {
    [DBNames.DB_MODELS]: {
      version: CURRENT_MANIFEST_VERSION, 
      stores: {
        files: {
          keyPath: 'url',
          indexes: []
        },
        manifest: {
          keyPath: 'repo',
          indexes: []
        },
        inferenceSettings: {
          keyPath: 'id',
          indexes: []
        }

      }
    }
  };

// Helper function to get HuggingFace token from IndexedDB
export async function getHuggingFaceToken(): Promise<string | null> {
    try {
        const tokenBlob = await getFromIndexedDB('huggingface_token');
        return tokenBlob ? await tokenBlob.text() : null;
    } catch (error) {
        if (LOG_WARN) console.warn(prefix, '[getHuggingFaceToken] Failed to get token:', error);
        return null;
    }
}

// Helper function to create authenticated fetch headers
export async function getAuthenticatedHeaders(): Promise<Record<string, string>> {
    const token = await getHuggingFaceToken();
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    
    if (token && token.startsWith('hf_')) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Model management functions for UI
export interface CachedModelInfo {
  modelId: string;
  modelPath: string;
  totalSize: number;
  numChunks: number;
  chunkSize: number;
  downloadDate: string;
  cacheKey: string;
  metadataKey: string;
  chunkKeys: string[];
}

export async function getAllCachedModels(): Promise<CachedModelInfo[]> {
  const models: CachedModelInfo[] = [];
  
  try {
    if (LOG_DEBUG) console.log(prefix, '[getAllCachedModels] Starting to retrieve cached models...');
    
    // Get all keys from IndexedDB
    const db = await openModelCacheDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    const request = store.getAll();
    
    const allData = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Found ${allData.length} total entries in IndexedDB`);
    
    // Group by model ID and collect chunks
    const modelGroups = new Map<string, { chunks: string[], totalSize: number, chunkSizes: number[] }>();
    
    for (const item of allData) {
      const key = item.url;
      
      if (LOG_DEBUG && key.includes('chunk')) {
        console.log(prefix, `[getAllCachedModels] Processing chunk: ${key}`);
      }
      
      if (key.includes('_chunk_')) {
        // This is a chunk file - extract the base model path
        const modelKey = key.replace(/_chunk_\d+$/, '');
        if (!modelGroups.has(modelKey)) {
          modelGroups.set(modelKey, { chunks: [], totalSize: 0, chunkSizes: [] });
        }
        
        const group = modelGroups.get(modelKey)!;
        group.chunks.push(key);
        
        // Get the blob size from the item - try different possible structures
        let blobSize = 0;
        if (item.data && item.data.size) {
          blobSize = item.data.size;
        } else if (item.blob && item.blob.size) {
          blobSize = item.blob.size;
        } else if (item.size) {
          blobSize = item.size;
        } else if (item.data instanceof Blob) {
          blobSize = item.data.size;
        } else if (item.data instanceof Uint8Array) {
          blobSize = item.data.length;
        }
        
        if (blobSize > 0) {
          group.totalSize += blobSize;
          group.chunkSizes.push(blobSize);
          if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Chunk ${key}: ${blobSize} bytes`);
        } else {
          if (LOG_WARN) console.warn(prefix, `[getAllCachedModels] Could not determine size for chunk: ${key}`, item);
        }
      } else if (key.includes('_metadata')) {
        // Skip metadata files for now - we'll calculate from chunks
        if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Found metadata file: ${key}`);
      } else if ((key.startsWith('models/') || key.includes('/model.') || key.includes('/onnx/')) && !key.includes('huggingface_token')) {
        // Handle non-chunked models - be more inclusive in detection
        let modelId = '';
        let modelPath = '';
        
        if (key.startsWith('models/')) {
          // Traditional models/ path
          const pathParts = key.replace('models/', '').split('/');
          if (pathParts.length >= 2) {
            modelId = pathParts[0];
            modelPath = pathParts.slice(1).join('/');
          }
        } else if (key.includes('huggingface.co/')) {
          // HuggingFace URL format: https://huggingface.co/ModelName/repo/resolve/main/path/file.ext
          const urlParts = key.split('/');
          const modelIndex = urlParts.findIndex((part: string) => part === 'huggingface.co') + 1;
          if (modelIndex > 0 && urlParts[modelIndex]) {
            modelId = urlParts[modelIndex];
            const filePath = urlParts.slice(modelIndex + 3).join('/'); // Skip 'repo/resolve/main'
            modelPath = filePath;
          }
        }
        
        if (modelId && modelPath) {
          // Get size for non-chunked models
          let modelSize = 0;
          if (item.data && item.data.size) {
            modelSize = item.data.size;
          } else if (item.blob && item.blob.size) {
            modelSize = item.blob.size;
          } else if (item.size) {
            modelSize = item.size;
          } else if (item.data instanceof Blob) {
            modelSize = item.data.size;
          } else if (item.data instanceof Uint8Array) {
            modelSize = item.data.length;
          }
          
          models.push({
            modelId,
            modelPath,
            totalSize: modelSize,
            numChunks: 1,
            chunkSize: modelSize,
            downloadDate: new Date().toISOString(),
            cacheKey: key,
            metadataKey: key,
            chunkKeys: [key]
          });
          
          if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Non-chunked model ${key}: ${modelSize} bytes (${modelId}/${modelPath})`);
        }
      }
    }
    
    if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Found ${modelGroups.size} chunked model groups`);
    
    // Convert chunked models to CachedModelInfo
    for (const [cacheKey, data] of modelGroups) {
      if (data.chunks.length > 0) {
        // Extract model info from cache key
        const pathParts = cacheKey.replace('models/', '').split('/');
        if (pathParts.length >= 2) {
          const modelId = pathParts[0];
          const modelPath = pathParts.slice(1).join('/');
          
          // Calculate average chunk size
          const avgChunkSize = data.chunkSizes.length > 0 ? 
            Math.round(data.totalSize / data.chunkSizes.length) : 0;
          
          models.push({
            modelId,
            modelPath,
            totalSize: data.totalSize,
            numChunks: data.chunks.length,
            chunkSize: avgChunkSize,
            downloadDate: new Date().toISOString(), // We don't store this yet
            cacheKey,
            metadataKey: `${cacheKey}_metadata`,
            chunkKeys: data.chunks.sort((a, b) => {
              const aNum = parseInt(a.match(/_chunk_(\d+)$/)?.[1] || '0');
              const bNum = parseInt(b.match(/_chunk_(\d+)$/)?.[1] || '0');
              return aNum - bNum;
            })
          });
          
          if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Added model: ${modelId}/${modelPath}, ${data.chunks.length} chunks, ${(data.totalSize / 1024 / 1024).toFixed(1)}MB`);
        }
      }
    }
    
    db.close();
    
    if (LOG_DEBUG) console.log(prefix, `[getAllCachedModels] Returning ${models.length} models`);
    
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, '[getAllCachedModels] Error:', error);
  }
  
  return models;
}

export async function deleteCachedModel(modelInfo: CachedModelInfo): Promise<void> {
  try {
    // Delete all chunks
    for (const chunkKey of modelInfo.chunkKeys) {
      await deleteFromIndexedDB(chunkKey);
    }
    
    // Delete metadata
    await deleteFromIndexedDB(modelInfo.metadataKey);
    
    if (LOG_GENERAL) console.log(prefix, `[deleteCachedModel] Deleted model: ${modelInfo.modelId}/${modelInfo.modelPath}`);
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, '[deleteCachedModel] Error:', error);
    throw error;
  }
}

export async function deleteAllCachedModels(): Promise<void> {
  const models = await getAllCachedModels();
  for (const model of models) {
    await deleteCachedModel(model);
  }
  if (LOG_GENERAL) console.log(prefix, '[deleteAllCachedModels] Deleted all cached models');
}

// DB system compatible functions for model management
export async function getCachedModelsViaDB(dbWorker: any): Promise<CachedModelInfo[]> {
  try {
    if (LOG_DEBUG) console.log(prefix, '[getCachedModelsViaDB] Getting cached models via DB system...');
    
    // Use the DB worker to get all files from the model cache
    const result = await dbWorker.postMessage({
      action: 'GET_ALL_MODEL_FILES',
      payload: {}
    });
    
    if (!result || !result.success) {
      throw new Error('Failed to get model files from DB worker');
    }
    
    const allFiles = result.data || [];
    if (LOG_DEBUG) console.log(prefix, `[getCachedModelsViaDB] Found ${allFiles.length} files in model cache`);
    
    // Group files by model
    const modelGroups = new Map<string, { chunks: any[], totalSize: number, chunkSizes: number[] }>();
    
    for (const file of allFiles) {
      const key = file.url || file.key;
      
      if (key.includes('_chunk_')) {
        // This is a chunk file
        const modelKey = key.replace(/_chunk_\d+$/, '');
        if (!modelGroups.has(modelKey)) {
          modelGroups.set(modelKey, { chunks: [], totalSize: 0, chunkSizes: [] });
        }
        
        const group = modelGroups.get(modelKey)!;
        group.chunks.push(file);
        
        // Get size from the file data
        const size = file.data?.size || file.blob?.size || 0;
        group.totalSize += size;
        group.chunkSizes.push(size);
        
      } else if (key.startsWith('models/') && !key.includes('huggingface_token') && !key.includes('_metadata')) {
        // Handle non-chunked models
        const pathParts = key.replace('models/', '').split('/');
        if (pathParts.length >= 2) {
          const modelId = pathParts[0];
          const modelPath = pathParts.slice(1).join('/');
          const size = file.data?.size || file.blob?.size || 0;
          
          return [{
            modelId,
            modelPath,
            totalSize: size,
            numChunks: 1,
            chunkSize: size,
            downloadDate: new Date().toISOString(),
            cacheKey: key,
            metadataKey: key,
            chunkKeys: [key]
          }];
        }
      }
    }
    
    // Convert chunked models to CachedModelInfo
    const models: CachedModelInfo[] = [];
    for (const [cacheKey, data] of modelGroups) {
      if (data.chunks.length > 0) {
        const pathParts = cacheKey.replace('models/', '').split('/');
        if (pathParts.length >= 2) {
          const modelId = pathParts[0];
          const modelPath = pathParts.slice(1).join('/');
          
          const avgChunkSize = data.chunkSizes.length > 0 ? 
            Math.round(data.totalSize / data.chunkSizes.length) : 0;
          
          models.push({
            modelId,
            modelPath,
            totalSize: data.totalSize,
            numChunks: data.chunks.length,
            chunkSize: avgChunkSize,
            downloadDate: new Date().toISOString(),
            cacheKey,
            metadataKey: `${cacheKey}_metadata`,
            chunkKeys: data.chunks.map((c: any) => c.url || c.key).sort((a: string, b: string) => {
              const aNum = parseInt(a.match(/_chunk_(\d+)$/)?.[1] || '0');
              const bNum = parseInt(b.match(/_chunk_(\d+)$/)?.[1] || '0');
              return aNum - bNum;
            })
          });
        }
      }
    }
    
    if (LOG_DEBUG) console.log(prefix, `[getCachedModelsViaDB] Returning ${models.length} models`);
    return models;
    
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, '[getCachedModelsViaDB] Error:', error);
    return [];
  }
}

export async function deleteCachedModelViaDB(modelInfo: CachedModelInfo, dbWorker: any): Promise<void> {
  try {
    if (LOG_DEBUG) console.log(prefix, `[deleteCachedModelViaDB] Deleting model: ${modelInfo.modelId}/${modelInfo.modelPath}`);
    
    // Delete all chunks via DB worker
    const deletePromises = modelInfo.chunkKeys.map(chunkKey => 
      dbWorker.postMessage({
        action: 'DELETE_MODEL_FILE',
        payload: { key: chunkKey }
      })
    );
    
    // Delete metadata if it exists
    deletePromises.push(
      dbWorker.postMessage({
        action: 'DELETE_MODEL_FILE',
        payload: { key: modelInfo.metadataKey }
      })
    );
    
    await Promise.all(deletePromises);
    
    if (LOG_GENERAL) console.log(prefix, `[deleteCachedModelViaDB] Successfully deleted model: ${modelInfo.modelId}/${modelInfo.modelPath}`);
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, '[deleteCachedModelViaDB] Error:', error);
    throw error;
  }
}

export async function openModelCacheDB(): Promise<IDBDatabase> {
   if (LOG_OPEN_DB) console.log(prefix, '[openModelCacheDB] Opening TabAgentModels DB');
    const dbName = DBNames.DB_MODELS;
    const dbConfig = modelCacheSchema[dbName];
    const storeNames = Object.keys(dbConfig.stores) as Array<keyof typeof dbConfig.stores>;
    return new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbConfig.version);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            if (LOG_OPEN_DB) console.log(prefix, '[openModelCacheDB] onupgradeneeded event', event);
            for (const storeName of storeNames) {
                if (!db.objectStoreNames.contains(storeName)) {
                    const storeConfig = dbConfig.stores[storeName];
                    db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
                    if (LOG_OPEN_DB) console.log(prefix, `[openModelCacheDB] Created object store: ${storeName}`);
                } else {
                    if (LOG_OPEN_DB) console.log(prefix, `[openModelCacheDB] Object store ${storeName} already exists.`);
                }
            }
        };
        req.onsuccess = (event) => {
            if (LOG_OPEN_DB) console.log(prefix, '[openModelCacheDB] onsuccess event', event);
            if (LOG_OPEN_DB) console.log(prefix, '[openModelCacheDB] Success');
            resolve(req.result);
        };
        req.onerror = (event) => {
            if (LOG_ERROR) console.error(prefix, '[openModelCacheDB] onerror event', event);
            if (LOG_ERROR) console.error(prefix, '[openModelCacheDB] Error', req.error);
            reject(req.error);
        };
        req.onblocked = (event) => {
            if (LOG_WARN) console.warn(prefix, '[openModelCacheDB] onblocked event', event);
            reject(new Error('openModelCacheDB: DB open request was blocked.'));
        };
    });
}

export async function getFromIndexedDB(url: string): Promise<Blob | null> {
    if (LOG_GENERAL) console.log(prefix, '[getFromIndexedDB] Getting', url);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(url);
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[getFromIndexedDB] Success for', url, req.result);
            const result = req.result;
            resolve(result ? result.blob : null);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[getFromIndexedDB] Error for', url, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[getFromIndexedDB] Transaction complete for', url);
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getFromIndexedDB] Transaction error for', url, e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getFromIndexedDB] Transaction aborted for', url, e);
            db.close();
        };
    });
}

export async function saveToIndexedDB(url: string, blob: Blob) {
    if (LOG_GENERAL) console.log(prefix, '[saveToIndexedDB] Saving', url);
    const db = await openModelCacheDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const req = store.put({ url, blob });
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[saveToIndexedDB] Saved', url, blob);
            resolve(undefined);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[saveToIndexedDB] Error saving', url, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[saveToIndexedDB] Transaction complete for', url);
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveToIndexedDB] Transaction error for', url, e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveToIndexedDB] Transaction aborted for', url, e);
            db.close();
        };
    });
}

export async function getManifestEntry(repo: string): Promise<ManifestEntry | null> {
    if (LOG_GENERAL) console.log(prefix, '[getManifestEntry] Getting', repo);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('manifest', 'readonly');
        const store = tx.objectStore('manifest');
        const req = store.get(repo);
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[getManifestEntry] Success for', repo, req.result);
            const entry = req.result as ManifestEntry | null;
            // Check manifest version if needed in the future for migration
            if (entry && entry.manifestVersion !== CURRENT_MANIFEST_VERSION) {
                if (LOG_WARN) console.warn(prefix, `[getManifestEntry] Manifest for ${repo} has old version ${entry.manifestVersion}, current is ${CURRENT_MANIFEST_VERSION}. Consider migration or re-fetching.`);
            }
            resolve(entry || null);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Error for', repo, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[getManifestEntry] Transaction complete for', repo);
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Transaction error for', repo, e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Transaction aborted for', repo, e);
            db.close();
        };
    });
}

export async function addManifestEntry(repo: string, entry: ManifestEntry): Promise<void> {
    if (!entry || typeof entry !== 'object' || entry.repo !== repo) {
        if (LOG_ERROR) console.error(prefix, `[addManifestEntry] Invalid entry for repo ${repo}:`, entry);
        throw new Error(`[addManifestEntry] Invalid entry: must be an object with repo === ${repo}`);
    }
    if (entry.manifestVersion !== CURRENT_MANIFEST_VERSION) {
         if (LOG_WARN) console.warn(prefix, `[addManifestEntry] Attempting to save manifest for ${repo} with version ${entry.manifestVersion}, but current is ${CURRENT_MANIFEST_VERSION}.`);
         // Ensure we always save with the current version, or throw error if strictness is required
         entry.manifestVersion = CURRENT_MANIFEST_VERSION;
    }
    if (LOG_GENERAL) console.log(prefix, '[addManifestEntry] Adding/Updating', repo, entry);
    const db = await openModelCacheDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('manifest', 'readwrite');
        const store = tx.objectStore('manifest');
        const req = store.put(entry);
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[addManifestEntry] Added/Updated', repo, entry);
            resolve();
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[addManifestEntry] Error for', repo, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[addManifestEntry] Transaction complete for', repo);
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[addManifestEntry] Transaction error for', repo, e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[addManifestEntry] Transaction aborted for', repo, e);
            db.close();
        };
    });
}

export async function fetchRepoFiles(repo: string): Promise<{ siblings: { rfilename: string, size?: number }[], task: string }> {
    if (LOG_GENERAL) console.log(prefix, '[fetchRepoFiles] Fetching', repo);
    const url = `https://huggingface.co/api/models/${repo}`;
    try {
        const headers = await getAuthenticatedHeaders();
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            if (LOG_ERROR) console.error(prefix, '[fetchRepoFiles] Failed for', repo, resp.status, resp.statusText);
            throw new Error(`Failed to fetch repo files for ${repo}: ${resp.status} ${resp.statusText}`);
        }
        const json = await resp.json();
        if (LOG_DEBUG) console.log(prefix, '[fetchRepoFiles] Success for', repo, json);
        const siblings = json.siblings || [];
        const baseRepoUrl = `https://huggingface.co/${repo}/resolve/main/`;
        // Ensure every file has .size (use HEAD if missing/invalid)
        await Promise.all(siblings.map(async (entry: any) => {
            if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
                const url = baseRepoUrl + entry.rfilename;
                try {
                    const headResp = await fetch(url, { method: 'HEAD' });
                    if (headResp.ok) {
                        const len = headResp.headers.get('Content-Length');
                        if (len) entry.size = parseInt(len, 10);
                    }
                } catch (e) {
                    if (LOG_WARN) console.warn(prefix, `[fetchRepoFiles] HEAD request failed for ${url}:`, e);
                }
            }
        }));
        return { siblings, task: json.pipeline_tag || 'text-generation' };
    } catch (err) {
        if (LOG_ERROR) console.error(prefix, '[fetchRepoFiles] Exception for', repo, err);
        throw err;
    }
}

export function parseQuantFromFilename(filename: string): string | null {
    if (LOG_GENERAL) console.log(prefix, '[parseQuantFromFilename] Parsing', filename);
    const match = filename.match(/model_([a-z0-9_]+)\.onnx$/i);
    const quant = match ? match[1] : null;
    if (LOG_DEBUG) console.log(prefix, '[parseQuantFromFilename] Result for', filename, 'is', quant);
    return quant;
}

export async function fetchModelMetadataInternal(modelId: string) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    if (LOG_GENERAL) console.log(prefix, `[fetchModelMetadataInternal] Fetching model metadata from: ${apiUrl}`);
    try {
        const headers = await getAuthenticatedHeaders();
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            const errorText = await response.text();
            if (LOG_ERROR) console.error(prefix, `[fetchModelMetadataInternal] Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`[fetchModelMetadataInternal] Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        if (LOG_GENERAL) console.log(prefix, `[fetchModelMetadataInternal] Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, `[fetchModelMetadataInternal] Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}

export async function filterAndValidateFilesInternal(metadata: any, modelId: string, baseRepoUrl: string) {
    const hfFileEntries = metadata.siblings || [];
    const filteredEntries = hfFileEntries.filter((f: any) => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('on') || f.rfilename.endsWith('.txt'));

    if (filteredEntries.length === 0) {
        return { neededFileEntries: [], message: "No .onnx, on, or .txt files found in model metadata." };
    }

    async function getFileSizeWithHEAD(url: string) {
        try {
            const headResp = await fetch(url, { method: 'HEAD' });
            if (headResp.ok) {
                const len = headResp.headers.get('Content-Length');
                return len ? parseInt(len, 10) : null;
            }
        } catch (e) {
            if (LOG_WARN) console.warn(prefix, `[filterAndValidateFilesInternal] HEAD request failed for ${url}:`, e);
        }
        return null;
    }

    const sizePromises = filteredEntries.map(async (entry: any) => {
        if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
            const url = baseRepoUrl + entry.rfilename;
            const size = await getFileSizeWithHEAD(url);
            if (size && isFinite(size) && size > 0) {
                entry.size = size;
            } else {
                entry.skip = true;
            }
        }
    });

    await Promise.all(sizePromises);
    const neededFileEntries = filteredEntries.filter((e: any) => !e.skip).map((entry: any) => {
        const fileName = entry.rfilename;
        const fileType = fileName.split('.').pop();
        const size = entry.size;
        const totalChunks = Math.ceil(size / (10 * 1024 * 1024));
        const chunkGroupId = `${modelId}/${fileName}`;
        return {
            id: `${chunkGroupId}:manifest`,
            type: 'manifest',
            chunkGroupId,
            fileName,
            folder: modelId,
            fileType,
            size,
            totalChunks,
            chunkSizeUsed: 10 * 1024 * 1024,
            status: 'missing',
            addedAt: Date.now(),
        };
    });
    return { neededFileEntries, message: null };
}

export async function getAllManifestEntries(): Promise<ManifestEntry[]> {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('manifest', 'readonly');
        const store = tx.objectStore('manifest');
        const req = store.getAll();
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[getAllManifestEntries] result:', req.result);
            const entries = (req.result || []) as ManifestEntry[];
            // Optionally filter or migrate entries based on manifestVersion here if needed
            resolve(entries);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[getAllManifestEntries] error:', req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[getAllManifestEntries] transaction complete');
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getAllManifestEntries] transaction error:', e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getAllManifestEntries] transaction aborted:', e);
            db.close();
        };
    });
}

export async function saveInferenceSettings(settings: InferenceSettings) {
    const db = await openModelCacheDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('inferenceSettings', 'readwrite');
        const store = tx.objectStore('inferenceSettings');
        const req = store.put({ id: INFERENCE_SETTINGS_SINGLETON_ID, ...settings });
        req.onsuccess = () => {
            if (LOG_INFERENCE_SETTINGS) console.log(prefix, '[saveInferenceSettings] success:', settings);
            resolve();
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[saveInferenceSettings] error:', req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_INFERENCE_SETTINGS) console.log(prefix, '[saveInferenceSettings] transaction complete');
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveInferenceSettings] transaction error:', e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveInferenceSettings] transaction aborted:', e);
            db.close();
        };
    });
}

export async function getInferenceSettings(): Promise<InferenceSettings | null> {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('inferenceSettings', 'readonly');
        const store = tx.objectStore('inferenceSettings');
        const req = store.get(INFERENCE_SETTINGS_SINGLETON_ID);
        req.onsuccess = () => {
            if (LOG_INFERENCE_SETTINGS) console.log(prefix, '[getInferenceSettings] result:', req.result);
            resolve(req.result || null);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[getInferenceSettings] error:', req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_INFERENCE_SETTINGS) console.log(prefix, '[getInferenceSettings] transaction complete');
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getInferenceSettings] transaction error:', e);
            db.close();
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getInferenceSettings] transaction aborted:', e);
            db.close();
        };
    });
}

/**
 * Add or update a quant (modelPath) in the manifest for a repo, setting its status.
 * If the quant already exists, update its status. If not, add it with an empty files array.
 * Optionally, you can pass a files array to set required files, otherwise it will keep existing or set to [modelPath].
 */
export async function addQuantToManifest(repo: string, modelPath: string, status: QuantStatus, files?: string[]): Promise<void> {
    let manifest = await getManifestEntry(repo);
    if (!manifest) {
        manifest = {
            repo,
            quants: {},
            manifestVersion: CURRENT_MANIFEST_VERSION,
        };
    }
    if (!manifest.quants[modelPath]) {
        manifest.quants[modelPath] = {
            files: files && files.length ? files : [modelPath],
            status,
        };
    } else {
        manifest.quants[modelPath].status = status;
        if (files && files.length) {
            manifest.quants[modelPath].files = files;
        }
    }
    await addManifestEntry(repo, manifest);
}

export async function deleteFromIndexedDB(url: string) {
    if (LOG_GENERAL) console.log(prefix, '[deleteFromIndexedDB] Deleting', url);
    const db = await openModelCacheDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const req = store.delete(url);
        req.onsuccess = () => {
            if (LOG_DEBUG) console.log(prefix, '[deleteFromIndexedDB] Deleted', url);
            resolve(undefined);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[deleteFromIndexedDB] Error deleting', url, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[deleteFromIndexedDB] Transaction complete for', url);
            db.close();
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[deleteFromIndexedDB] Transaction error for', url, e);
            db.close();
        };
    });
}

