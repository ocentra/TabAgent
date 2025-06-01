import { INFERENCE_SETTINGS_SINGLETON_ID, InferenceSettings } from '../Controllers/InferenceSettings';
import { modelCacheSchema, DBNames } from './idbSchema';

// --- Types ---
export enum QuantStatus {
  Available = 'available',
  Downloaded = 'downloaded',
  Failed = 'failed',
  NotFound = 'not_found',
  Unavailable = 'unavailable',
  Unsupported = 'unsupported',
}

export type QuantInfo = {
  files: string[];
  status: QuantStatus;
};
export type ManifestEntry = {
  repo: string;
  quants: Record<string, QuantInfo>;
  task?: string;
};

const prefix = '[IDBModel]';
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;

// Canonical opener for model cache DB
export async function openModelCacheDB(): Promise<IDBDatabase> {
    if (LOG_GENERAL) console.log(prefix, '[openModelCacheDB] Opening TabAgentModels DB');
    const dbName = DBNames.DB_MODELS;
    const dbConfig = modelCacheSchema[dbName];
    const storeNames = Object.keys(dbConfig.stores) as Array<keyof typeof dbConfig.stores>;
    return new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(dbName, dbConfig.version);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            if (LOG_DEBUG) console.log(prefix, '[openModelCacheDB] onupgradeneeded event', event);
            for (const storeName of storeNames) {
                if (!db.objectStoreNames.contains(storeName)) {
                    const storeConfig = dbConfig.stores[storeName];
                    db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
                    if (LOG_DEBUG) console.log(prefix, `[openModelCacheDB] Created object store: ${storeName}`);
                }
            }
        };
        req.onsuccess = (event) => {
            if (LOG_DEBUG) console.log(prefix, '[openModelCacheDB] onsuccess event', event);
            if (LOG_DEBUG) console.log(prefix, '[openModelCacheDB] Success');
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

// Update all helpers to use openModelCacheDB
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
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getFromIndexedDB] Transaction error for', url, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getFromIndexedDB] Transaction aborted for', url, e);
        };
    });
}

export async function saveToIndexedDB(url: string, blob: Blob) {
    if (LOG_GENERAL) console.log(prefix, '[saveToIndexedDB] Saving', url);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
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
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveToIndexedDB] Transaction error for', url, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[saveToIndexedDB] Transaction aborted for', url, e);
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
            resolve(req.result || null);
        };
        req.onerror = () => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Error for', repo, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG) console.log(prefix, '[getManifestEntry] Transaction complete for', repo);
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Transaction error for', repo, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[getManifestEntry] Transaction aborted for', repo, e);
        };
    });
}

export async function addManifestEntry(repo: string, entry: ManifestEntry): Promise<void> {
    if (!entry || typeof entry !== 'object' || entry.repo !== repo) {
        throw new Error(`[addManifestEntry] Invalid entry: must be an object with repo === ${repo}`);
    }
    if (LOG_GENERAL) console.log(prefix, '[addManifestEntry] Adding/Updating', repo, entry);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
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
        };
        tx.onerror = (e) => {
            if (LOG_ERROR) console.error(prefix, '[addManifestEntry] Transaction error for', repo, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR) console.error(prefix, '[addManifestEntry] Transaction aborted for', repo, e);
        };
    });
}

export async function fetchRepoFiles(repo: string): Promise<{ siblings: any[], task: string }> {
    if (LOG_GENERAL) console.log(prefix, '[fetchRepoFiles] Fetching', repo);
    const url = `https://huggingface.co/api/models/${repo}`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            if (LOG_ERROR) console.error(prefix, '[fetchRepoFiles] Failed for', repo, resp.status, resp.statusText);
            throw new Error(`Failed to fetch repo files for ${repo}`);
        }
        const json = await resp.json();
        if (LOG_DEBUG) console.log(prefix, '[fetchRepoFiles] Success for', repo, json);
        // Return both siblings and pipeline_tag (task)
        return { siblings: json.siblings || [], task: json.pipeline_tag || 'text-generation' };
    } catch (err) {
        if (LOG_ERROR) console.error(prefix, '[fetchRepoFiles] Exception for', repo, err);
        throw err;
    }
}

export function parseQuantFromFilename(filename: string): string | null {
        if (LOG_GENERAL) console.log(prefix, '[parseQuantFromFilename] Parsing', filename);
  const match = filename.match(/model_([a-z0-9_]+)\.onnx$/i);
  const quant = match ? match[1] : null;
  if (LOG_DEBUG) console.log(prefix, '[parseQuantFromFilename] Result', quant);
  return quant;
}

export async function fetchModelMetadataInternal(modelId: string) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    if (LOG_GENERAL) console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        if (LOG_GENERAL) console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}

export async function filterAndValidateFilesInternal(metadata: any, modelId: string, baseRepoUrl: string) {
    const hfFileEntries = metadata.siblings || [];
    // Only keep files we care about
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
            console.warn('[ModelMetadata]', `HEAD request failed for ${url}:`, e);
        }
        return null;
    }

    // Ensure size is set for each entry
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
    // Now build full manifest objects
    const neededFileEntries = filteredEntries.filter((e: any) => !e.skip).map((entry: any) => {
        const fileName = entry.rfilename;
        const fileType = fileName.split('.').pop();
        const size = entry.size;
        const totalChunks = Math.ceil(size / (10 * 1024 * 1024)); // Use CHUNK_SIZE if available
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
            chunkSizeUsed: 10 * 1024 * 1024, // Use CHUNK_SIZE if available
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
            resolve(req.result || []);
        };
        req.onerror = () => {
            reject(req.error);
        };
    });
} 

// Save settings
export async function saveInferenceSettings(settings: InferenceSettings) {
    const db = await openModelCacheDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('inferenceSettings', 'readwrite');
      const store = tx.objectStore('inferenceSettings');
      const req = store.put({ id: INFERENCE_SETTINGS_SINGLETON_ID, ...settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  // Get settings
  export async function getInferenceSettings(): Promise<InferenceSettings | null> {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inferenceSettings', 'readonly');
      const store = tx.objectStore('inferenceSettings');
      const req = store.get(INFERENCE_SETTINGS_SINGLETON_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }