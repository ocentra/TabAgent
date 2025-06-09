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
export const SERVER_ONLY_SIZE = 2.1 * 1024 * 1024 * 1024; // 2.1GB
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
const LOG_INFERENCE_SETTINGS = true;
const LOG_OPEN_DB = false;

export const CHUNK_SIZE = 10 * 1024 * 1024;

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
        },
        fileChunks: { // NEW store for chunked files
          keyPath: ['fileId', 'chunkIndex'],
          indexes: ['fileId']
        }
      }
    }
  };

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

export async function fetchRepoFiles(repo: string): Promise<{ siblings: { rfilename: string, size?: number }[], task: string, chunkedFiles: Record<string, { size: number, totalChunks: number, chunkSizeUsed: number, serverOnly?: boolean }> }> {
    if (LOG_GENERAL) console.log(prefix, '[fetchRepoFiles] Fetching', repo);
    const url = `https://huggingface.co/api/models/${repo}`;
    try {
        const resp = await fetch(url);
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
        // Build chunkedFiles for .onnx/.onnx.data/.onnx_data files
        const chunkedFiles: Record<string, { size: number, totalChunks: number, chunkSizeUsed: number, serverOnly?: boolean }> = {};
      
        for (const entry of siblings) {
            if ((entry.rfilename.endsWith('.onnx') || entry.rfilename.endsWith('.onnx.data') || entry.rfilename.endsWith('.onnx_data')) && typeof entry.size === 'number' && entry.size > 0) {
                chunkedFiles[entry.rfilename] = {
                    size: entry.size,
                    totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
                    chunkSizeUsed: CHUNK_SIZE,
                    serverOnly: entry.size > SERVER_ONLY_SIZE
                };
            }
        }
        return { siblings, task: json.pipeline_tag || 'text-generation', chunkedFiles };
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
        const response = await fetch(apiUrl);
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

export async function saveFileChunk(fileId: string, chunkIndex: number, chunk: Uint8Array) {
  const db = await openModelCacheDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('fileChunks', 'readwrite');
    const store = tx.objectStore('fileChunks');
    const req = store.put({ fileId, chunkIndex, chunk });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  });
}

export async function getFileChunks(fileId: string, totalChunks: number): Promise<Uint8Array> {
  const db = await openModelCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fileChunks', 'readonly');
    const store = tx.objectStore('fileChunks');
    const chunks: Uint8Array[] = new Array(totalChunks);
    let readCount = 0;
    for (let i = 0; i < totalChunks; i++) {
      const req = store.get([fileId, i]);
      req.onsuccess = () => {
        if (req.result && req.result.chunk) {
          chunks[i] = req.result.chunk;
        } else {
          chunks[i] = new Uint8Array(0);
        }
        readCount++;
        if (readCount === totalChunks) {
          // Concatenate all chunks
          const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const arr of chunks) {
            result.set(arr, offset);
            offset += arr.length;
          }
          resolve(result);
        }
      };
      req.onerror = () => reject(req.error);
    }
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  });
}

/**
 * Check if there are any chunks for a given fileId in the fileChunks store.
 * Returns true if at least one chunk exists, false otherwise.
 */
export async function hasFileChunks(fileId: string): Promise<boolean> {
  const db = await openModelCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fileChunks', 'readonly');
    const store = tx.objectStore('fileChunks');
    const index = store.index('fileId');
    const req = index.get(fileId);
    req.onsuccess = () => {
      resolve(!!req.result);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  });
}

/**
 * Returns chunk info for all .onnx.data/.onnx_data files in the given metadata.
 * For each such file, returns { size, totalChunks, chunkSizeUsed }.
 * Uses metadata.size if present, otherwise fetches size via HEAD request.
 */
export async function getChunkedFileInfoMap(metadata: any, baseRepoUrl: string): Promise<Record<string, { size: number, totalChunks: number, chunkSizeUsed: number }>> {
    const hfFileEntries = metadata.siblings || [];
    // Only .onnx.data or .onnx_data files
    const chunkedEntries = hfFileEntries.filter((f: any) => f.rfilename.endsWith('.onnx.data') || f.rfilename.endsWith('.onnx_data'));
    if (chunkedEntries.length === 0) return {};

    async function getFileSizeWithHEAD(url: string): Promise<number | null> {
        try {
            const headResp = await fetch(url, { method: 'HEAD' });
            if (headResp.ok) {
                const len = headResp.headers.get('Content-Length');
                return len ? parseInt(len, 10) : null;
            }
        } catch (e) {
            if (LOG_WARN) console.warn(prefix, `[getChunkedFileInfoMap] HEAD request failed for ${url}:`, e);
        }
        return null;
    }

    const infoMap: Record<string, { size: number, totalChunks: number, chunkSizeUsed: number }> = {};
    await Promise.all(chunkedEntries.map(async (entry: any) => {
        let size = entry.size;
        if (typeof size !== 'number' || !isFinite(size) || size <= 0) {
            const url = baseRepoUrl + entry.rfilename;
            size = await getFileSizeWithHEAD(url) || 0;
        }
        if (size > 0) {
            infoMap[entry.rfilename] = {
                size,
                totalChunks: Math.ceil(size / CHUNK_SIZE),
                chunkSizeUsed: CHUNK_SIZE
            };
        }
    }));
    return infoMap;
}



