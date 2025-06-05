/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
export {};
const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();
const prefix = '[ModelWorker]';
const LOG_GENERAL = true;
const LOG_DEBUG = true;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_SELF = true;
const LOG_GENERATION = true;
let currentLoadId: string | undefined = undefined;

if (_isNavigatorGpuAvailable) {
    webgpuCheckPromise = (async () => {
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            if (!adapter) {
                if(LOG_WARN)console.warn(prefix, 'WebGPU navigator.gpu exists, but requestAdapter() returned null. WebGPU will not be used.');
                hasWebGPU = false;
            } else {
                if(LOG_GENERAL)console.log(prefix, 'WebGPU adapter successfully obtained. WebGPU is available.');
            }
        } catch (e) {
            if(LOG_WARN)console.warn(prefix, 'Error requesting WebGPU adapter. WebGPU will not be used.', e);
            hasWebGPU = false;
        }
    })();
}

if(LOG_GENERAL)console.log(prefix, 'WebGPU available in worker (navigator.gpu):', _isNavigatorGpuAvailable);
import { pipeline, env } from './assets/onnxruntime-web/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';
import {  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, addQuantToManifest,  QuantStatus, getInferenceSettings, saveFileChunk, getFileChunks, hasFileChunks, openModelCacheDB, getAllManifestEntries, CHUNK_SIZE } from './DB/idbModel';
import type { ManifestEntry, QuantInfo } from './DB/idbModel';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings, INFERENCE_SETTING_KEYS } from './Controllers/InferenceSettings';
import { MESSAGE_EVENT } from './Utilities/eventConstants';


env.useBrowserCache = false;

let EXT_BASE_URL: string = '';
let extBaseUrlReadyResolve: ((url: string) => void) | null = null;
const extBaseUrlReady = new Promise<string>((resolve) => {
    extBaseUrlReadyResolve = resolve;
});

self.addEventListener(MESSAGE_EVENT, (event: MessageEvent) => {
    if (event.data && event.data.type === WorkerEventNames.SET_BASE_URL) {
        EXT_BASE_URL = event.data.baseUrl || '';
        if(LOG_GENERAL)console.log(prefix, 'Received extension base URL:', EXT_BASE_URL);
        if (extBaseUrlReadyResolve) extBaseUrlReadyResolve(EXT_BASE_URL);
    }
});

const ONNX_ASSETS_ROOT_PATH = 'assets/onnxruntime-web/';
const ONNX_WASM_FILE_NAME = 'ort-wasm-simd-threaded.jsep.wasm';
const ONNX_LOADER_FILE_NAME = 'ort-wasm-simd-threaded.jsep.mjs';

async function getOnnxWasmFilePath() {
    const baseUrl = await extBaseUrlReady;
    return baseUrl + ONNX_ASSETS_ROOT_PATH + ONNX_WASM_FILE_NAME;
}
async function getOnnxLoaderFilePath() {
    const baseUrl = await extBaseUrlReady;
    return baseUrl + ONNX_ASSETS_ROOT_PATH + ONNX_LOADER_FILE_NAME;
}
async function getOnnxWasmRootPath() {
    const baseUrl = await extBaseUrlReady;
    return baseUrl + ONNX_ASSETS_ROOT_PATH;
}

(async () => {
    await extBaseUrlReady;
    await webgpuCheckPromise;
    if(LOG_DEBUG)console.log(prefix, 'Initial state of env.backends:', JSON.stringify(env.backends, null, 2));

    if (!env.backends) { (env as any).backends = {}; }
    if (!env.backends.onnx) { (env.backends as any).onnx = {}; }

    if (!(env.backends.onnx as any).wasm) { ((env.backends.onnx as any).wasm as any) = {}; }
    ((env.backends.onnx as any).wasm as any).wasmPaths = await getOnnxWasmRootPath(); 
    ((env.backends.onnx as any).wasm as any).proxy = false;

    if (!((env.backends.onnx as any).env as any)) { ((env.backends.onnx as any).env as any) = {}; }
    if (!(((env.backends.onnx as any).env as any).wasm as any)) { (((env.backends.onnx as any).env as any).wasm as any) = {}; }

    (((env.backends.onnx as any).env as any).wasm as any).wasmPaths = {
        [ONNX_WASM_FILE_NAME]: await getOnnxWasmFilePath(),
        [ONNX_LOADER_FILE_NAME]: await getOnnxLoaderFilePath(),
    };
    (((env.backends.onnx as any).env as any).wasm as any).loader = await getOnnxLoaderFilePath();

    if (hasWebGPU) {
        (env.backends.onnx as any).executionProviders = ['webgpu', 'wasm'];
        if (!(env.backends.onnx as any).webgpu) {
            (env.backends.onnx as any).webgpu = {};
        }
        (env.backends.onnx as any).webgpu.powerPreference = 'high-performance';
    } else {
        (env.backends.onnx as any).executionProviders = ['wasm'];
    }
    (env.backends.onnx as any).logLevel = 'warning';

    if(LOG_DEBUG)console.log(prefix, 'Minimal modelworker.js loaded and env.backends.onnx after initial setup:', JSON.stringify(env.backends.onnx, null, 2));
    self.postMessage({ type: WorkerEventNames.WORKER_ENV_READY });
})();

self.addEventListener('error', function(e: ErrorEvent) {
    if(LOG_ERROR)console.error(prefix, 'Global error in model-worker.js:', e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: e.message || e });
    } catch (err) {
        if(LOG_ERROR)console.error(prefix, 'Failed to postMessage FATAL_ERROR:', err);
    }
});
self.addEventListener('unhandledrejection', function(e: PromiseRejectionEvent) {
    if(LOG_ERROR)console.error(prefix, 'Unhandled promise rejection in model-worker.js:', e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: (e as any).reason || e });
    } catch (err) {
        if(LOG_ERROR)console.error(prefix, 'Failed to postMessage FATAL_ERROR (unhandledrejection):', err);
    }
});

let pipelineInstance: any = null;
let currentModel: string | null = null;
let currentModelPath: string | null = null;
let isModelPipelineReady = false;



let envConfig: any = {};
let inferenceSettings: InferenceSettings = DEFAULT_INFERENCE_SETTINGS;

// On startup, fetch settings
(async () => {
    const settings = await getInferenceSettings();
    if (settings) {
      inferenceSettings = { ...settings };
      if (LOG_GENERAL) console.log(prefix, 'Loaded inference settings on startup:', inferenceSettings);
    }
})();
  

const originalFetch = self.fetch;

function extractResourceUrl(input: RequestInfo | URL): { url: string | undefined; isRequestObject: boolean } {
    let resourceUrl: string | undefined = undefined;
    let isRequestObject = false;

    if (typeof input === 'string') {
        resourceUrl = input;
    } else if (input instanceof URL) {
        resourceUrl = input.href;
    } else if (input instanceof Request) {
        resourceUrl = input.url;
        isRequestObject = true;
    }

    return { url: resourceUrl, isRequestObject };
}

async function rewriteGenerationConfigPath(resourceUrl: string, files: string[]): Promise<string> {
    const resourceFileName = resourceUrl.split('/').pop() || '';
    
    if (resourceFileName !== 'generation_config.json') {
        return resourceUrl;
    }

    const exact = files.find(f => f.endsWith('/generation_config.json') || f === 'generation_config.json');
    if (exact) {
        const exactFile = exact.split('/').pop() || 'generation_config.json';
        return resourceUrl.replace('generation_config.json', exactFile);
    }

    const genai = files.find(f => f.endsWith('genai_config.json'));
    if (genai) {
        return resourceUrl.replace('generation_config.json', 'genai_config.json');
    }

    const config = files.find(f => f.endsWith('config.json'));
    if (config) {
        return resourceUrl.replace('generation_config.json', 'config.json');
    }

    return resourceUrl;
}

async function ensureOnnxExternalData(resourceUrl: string, resourceFileName: string, files: string[]): Promise<void> {
    // Only process .onnx, .onnx.data, or .onnx_data files
    if (!resourceFileName.endsWith('.onnx') && !resourceFileName.endsWith('.onnx.data') && !resourceFileName.endsWith('.onnx_data')) {
        return;
    }

    // Find the file in the manifest that matches the resourceFileName
    const targetFile = files.find(f => f.endsWith(resourceFileName));
    if (!targetFile) {
        return;
    }

    let hasChunks = false;
    try {
        hasChunks = await hasFileChunks(targetFile);
    } catch (e) {
        hasChunks = false;
    }
    if (hasChunks) {
        if (LOG_SELF) console.log(prefix, '[self.fetch] already present in IndexedDB (chunks):', targetFile);
        return;
    }
    let fileBlob = await getFromIndexedDB(resourceUrl);
    if (fileBlob) {
        if (LOG_SELF) console.log(prefix, '[self.fetch] already present in IndexedDB (blob):', resourceUrl);
        return;
    }
    if (LOG_SELF) console.log(prefix, '[self.fetch] required for this quant. Fetching:', resourceUrl);
    await downloadAndCacheOnnxData(resourceUrl, targetFile);
}

async function downloadAndCacheOnnxData(onnxDataUrl: string, quantOnnxDataFile: string): Promise<void> {
    self.postMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: 'initiate', file: quantOnnxDataFile, progress: 0, loaded: 0, total: 0, loadId: currentLoadId } 
    });
    try {
        const resp = await originalFetch.call(self, onnxDataUrl);
        if (!resp.ok) {
            console.error('[self.fetch] Failed to fetch .onnx_data file:', onnxDataUrl);
            self.postMessage({ 
                type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                payload: { status: 'error', file: quantOnnxDataFile, error: 'Failed to fetch .onnx_data', loadId: currentLoadId } 
            });
            return;
        }
        const contentLength = resp.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : undefined;
        const reader = resp.body?.getReader();
        // --- Get chunk info from manifest if available ---
        let chunkSize = CHUNK_SIZE;
        let expectedTotalChunks: number | undefined = undefined;
        if (currentModel && currentModelPath) {
            const manifest = await getManifestEntry(currentModel);
            const quant = manifest?.quants?.[currentModelPath];
            const chunkedFiles = (quant as any)?.chunkedFiles;
            if (chunkedFiles && chunkedFiles[quantOnnxDataFile]) {
                chunkSize = chunkedFiles[quantOnnxDataFile].chunkSizeUsed || CHUNK_SIZE;
                expectedTotalChunks = chunkedFiles[quantOnnxDataFile].totalChunks;
            }
        }
        if (reader) {
            await downloadWithProgress(reader, onnxDataUrl, quantOnnxDataFile, total, chunkSize, expectedTotalChunks);
        } else {
            // Fallback: no stream, read full ArrayBuffer and save as a single chunk
            const arrBuf = await resp.clone().arrayBuffer();
            const uint8 = new Uint8Array(arrBuf);
            await saveFileChunk(quantOnnxDataFile, 0, uint8);
            self.postMessage({ 
                type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                payload: { status: 'done', file: quantOnnxDataFile, loaded: uint8.length, total: uint8.length, progress: 100, loadId: currentLoadId, totalChunks: 1 } 
            });
            if (LOG_SELF) console.log(prefix, '[self.fetch] .onnx_data saved as single chunk to IndexedDB:', onnxDataUrl, 'size:', uint8.length);
        }
    } catch (err) {
        console.error('[self.fetch] Error fetching .onnx_data file:', onnxDataUrl, err);
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { status: 'error', file: quantOnnxDataFile, error: String(err), loadId: currentLoadId } 
        });
    }
}

// Buffering version: always writes out fixed-size chunks (chunkSize)
async function downloadWithProgress(reader: ReadableStreamDefaultReader<Uint8Array>, onnxDataUrl: string, quantOnnxDataFile: string, total: number | undefined, chunkSize: number = CHUNK_SIZE, expectedTotalChunks?: number): Promise<void> {
    let loaded = 0;
    let chunkIndex = 0;
    let buffer = new Uint8Array(chunkSize);
    let bufferOffset = 0;
    let done = false;
    while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (value) {
            let valueOffset = 0;
            while (valueOffset < value.length) {
                const spaceLeft = chunkSize - bufferOffset;
                const toCopy = Math.min(spaceLeft, value.length - valueOffset);
                buffer.set(value.subarray(valueOffset, valueOffset + toCopy), bufferOffset);
                bufferOffset += toCopy;
                valueOffset += toCopy;
                if (bufferOffset === chunkSize) {
                    await saveFileChunk(quantOnnxDataFile, chunkIndex, buffer);
                    loaded += buffer.length;
                    const percent = total ? (loaded / total) * 100 : undefined;
                    self.postMessage({ 
                        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                        payload: { status: 'progress', file: quantOnnxDataFile, loaded, total, progress: percent, loadId: currentLoadId, chunkIndex } 
                    });
                    chunkIndex++;
                    buffer = new Uint8Array(chunkSize);
                    bufferOffset = 0;
                }
            }
        }
        done = doneReading;
    }
    // Write any remaining data in buffer
    if (bufferOffset > 0) {
        await saveFileChunk(quantOnnxDataFile, chunkIndex, buffer.subarray(0, bufferOffset));
        loaded += bufferOffset;
        chunkIndex++;
    }
    self.postMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: 'done', file: quantOnnxDataFile, loaded, total, progress: 100, loadId: currentLoadId, totalChunks: chunkIndex } 
    });
    if (LOG_SELF) console.log(prefix, '[self.fetch] .onnx_data streamed to IndexedDB in chunks:', quantOnnxDataFile, 'total chunks:', chunkIndex, 'total size:', loaded);

    // After chunked download, if this is a .onnx, .onnx.data or .onnx_data file, reassemble and store as Blob in files store, then clean up chunks
    if (/\.onnx$|\.onnx\.data$|\.onnx_data$/i.test(quantOnnxDataFile)) {
        // Call the reassembly in a separate async function to help GC
        void reassembleAndStoreOnnxData(onnxDataUrl, quantOnnxDataFile, chunkIndex, chunkSize, currentLoadId);
    }
}

// Place this near the other helper functions
async function reassembleAndStoreOnnxData(
    onnxDataUrl: string,
    quantOnnxDataFile: string,
    chunkIndex: number,
    chunkSize: number,
    currentLoadId: string | undefined
) {
    try {
        if (LOG_SELF) console.log(prefix, '[self.fetch] Reassembling after chunked download:', quantOnnxDataFile, 'chunks:', chunkIndex);

        // Helper to request memory stats from main thread
        function requestMemoryStats(label: string) {
            try {
                self.postMessage({ type: WorkerEventNames.REQUEST_MEMORY_STATS, label });
            } catch (e) {
                // ignore
            }
        }

        // Log memory before waiting
        requestMemoryStats('Before 1s wait');

        // Wait 1 second to allow GC
        await new Promise(r => setTimeout(r, 1000));

        // Log memory after waiting
        requestMemoryStats('After 1s wait');

        if (LOG_SELF) console.log(prefix, '[self.fetch] About to call getFileChunks for', quantOnnxDataFile, 'chunks:', chunkIndex);
        const uint8 = await getFileChunks(quantOnnxDataFile, chunkIndex);
        if (LOG_SELF) console.log(prefix, '[self.fetch] getFileChunks returned, length:', uint8.length);

        // Log memory after getFileChunks
        requestMemoryStats('After getFileChunks');

        if (LOG_SELF) console.log(prefix, '[self.fetch] About to create Blob for', quantOnnxDataFile);
        const blob = new Blob([new Uint8Array(uint8).buffer], { type: 'application/octet-stream' });
        if (LOG_SELF) console.log(prefix, '[self.fetch] Blob created, size:', blob.size);

        // Log memory after Blob creation
        requestMemoryStats('After Blob creation');

        await saveToIndexedDB(onnxDataUrl, blob);
        if (LOG_SELF) console.log(prefix, '[self.fetch] .onnx_data reassembled and saved as Blob in files store:', onnxDataUrl, 'size:', blob.size);

        // Log memory after save
        requestMemoryStats('After saveToIndexedDB');

        // Remove chunks from fileChunks store
        try {
            const db = await openModelCacheDB();
            const tx = db.transaction('fileChunks', 'readwrite');
            for (let i = 0; i < chunkIndex; i++) {
                tx.objectStore('fileChunks').delete([quantOnnxDataFile, i]);
            }
            await new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve(undefined);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            });
            db.close();
            if (LOG_SELF) console.log(prefix, '[self.fetch] .onnx_data chunks cleaned up from fileChunks store:', quantOnnxDataFile);
        } catch (cleanupErr) {
            if (LOG_WARN) console.warn(prefix, '[self.fetch] Failed to clean up .onnx_data chunks:', quantOnnxDataFile, cleanupErr);
        }
    } catch (assembleErr) {
        if (LOG_ERROR) console.error(prefix, '[self.fetch] Failed to reassemble and store .onnx_data as Blob:', quantOnnxDataFile, assembleErr);
    }
}

async function rewriteOnnxFilePath(resourceUrl: string, resourceFileName: string, files: string[]): Promise<string> {
    if (!resourceFileName.endsWith('.onnx')) {
        return resourceUrl;
    }

    const quantOnnxFile = files.find(f => f.endsWith('.onnx'));
    if (quantOnnxFile && !resourceUrl.endsWith(quantOnnxFile)) {
        if (LOG_SELF) console.log(prefix, ' [self.fetch] Rewritten ONNX file request to:', `https://huggingface.co/${currentModel}/resolve/main/${quantOnnxFile}`);
        return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${quantOnnxFile}`);
    }
    
    return resourceUrl;
}

async function rewriteSupportingFilePath(resourceUrl: string, resourceFileName: string, files: string[]): Promise<string> {
    const SUPPORTING_FILE_REGEX = /\.(onnx(\.data)?|onnx_data|json|bin|pt|txt|model)$/i;
    
    if (!SUPPORTING_FILE_REGEX.test(resourceFileName)) {
        return resourceUrl;
    }

    const manifestPath = files.find(f => f.endsWith('/' + resourceFileName) || f === resourceFileName);
    if (manifestPath && !resourceUrl.endsWith(manifestPath)) {
        return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${manifestPath}`);
    }
    
    return resourceUrl;
}

async function handleModelFileRewriting(resourceUrl: string): Promise<string> {
    if (!currentModel || !currentModelPath) {
        return resourceUrl;
    }

    const manifest = await getManifestEntry(currentModel);
    if (!manifest || !manifest.quants || !manifest.quants[currentModelPath]) {
        if (resourceUrl.match(/\.(onnx|onnx_data|bin|pt)$/i)) {
            await addQuantToManifest(currentModel, currentModelPath, QuantStatus.Downloaded);
        }
        return resourceUrl;
    }

    const files = manifest.quants[currentModelPath].files;
    const resourceFileName = resourceUrl.split('/').pop() || '';

    if (LOG_SELF) console.log(prefix, ' [self.fetch] resourceFileName:', resourceFileName);

    let rewrittenUrl = await rewriteGenerationConfigPath(resourceUrl, files);
    
    if (rewrittenUrl === resourceUrl && resourceFileName === 'generation_config.json') {
        return rewrittenUrl;
    }

    rewrittenUrl = await rewriteOnnxFilePath(rewrittenUrl, resourceFileName, files);
    await ensureOnnxExternalData(rewrittenUrl, resourceFileName, files);
    rewrittenUrl = await rewriteSupportingFilePath(rewrittenUrl, resourceFileName, files);

    return rewrittenUrl;
}

async function handleWasmInterception(resourceUrl: string, input: RequestInfo | URL, isRequestObject: boolean, options?: RequestInit): Promise<Response | null> {
    if (!resourceUrl || !resourceUrl.includes(ONNX_WASM_FILE_NAME)) {
        return null;
    }

    if (LOG_SELF) console.log(prefix, ' [self.fetch] Intercepting fetch for WASM:', resourceUrl, 'serving local:', await getOnnxWasmFilePath());
    const wasmPath = await getOnnxWasmFilePath();
    return originalFetch.call(self, isRequestObject ? new Request(wasmPath, input as Request) : wasmPath, options);
}

async function tryServeFromIndexedDB(resourceUrl: string): Promise<Response | null> {
    if (!resourceUrl.includes('/resolve/main/') && !resourceUrl.includes('/resolve/')) {
        return null;
    }

    if (LOG_SELF) console.log(prefix, ' [self.fetch] Matched model file pattern (/resolve/main/ or /resolve/). Attempting IndexedDB for URL:', resourceUrl);
    
    try {
        const cached = await getFromIndexedDB(resourceUrl);
        if (cached) {
            if (LOG_SELF) console.log(prefix, ' [self.fetch] Serving model file from IndexedDB:', resourceUrl, 'size:', cached.size, 'type:', cached.type);
            const headers = new Headers();
            if (cached.type) {
                headers.set('Content-Type', cached.type);
            } else if (resourceUrl.endsWith('.json')) {
                headers.set('Content-Type', 'application/json');
            } else {
                headers.set('Content-Type', 'application/octet-stream');
            }
            headers.set('Content-Length', cached.size.toString());
            if (LOG_SELF) console.log(prefix, ' [self.fetch] Serving from IDB with headers: Content-Type:', headers.get('Content-Type'), 'Content-Length:', headers.get('Content-Length'));
            return new Response(cached, { headers: headers });
        }
        // --- Chunked ONNX file support ---
        // Try to serve from chunked storage if Blob is not found
        // Use the filename as fileId (as in saveFileChunk)
        const fileId = resourceUrl.split('/').pop() || resourceUrl;
        // Only check for chunks if the file is .onnx_data or .onnx.data
        if (/\.onnx_data$|\.onnx\.data$/i.test(fileId)) {
            const hasChunks = await hasFileChunks(fileId);
            if (hasChunks) {
                // Try to get totalChunks from manifest if possible
                let totalChunks = 0;
                try {
                    let manifestEntries: ManifestEntry[] = [];
                    try {
                        manifestEntries = await getAllManifestEntries();
                    } catch (e) {
                        // ignore
                    }
                    let found = false;
                    for (const entry of manifestEntries) {
                        for (const quantKey in (entry.quants || {})) {
                            const quantInfo: QuantInfo = entry.quants[quantKey];
                            if (quantInfo.files && quantInfo.files.some((f: string) => f.endsWith(fileId))) {
                                // Try to get totalChunks from quantInfo if present
                                if ((quantInfo as any).totalChunks && typeof (quantInfo as any).totalChunks === 'number') {
                                    totalChunks = (quantInfo as any).totalChunks;
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (found) break;
                    }
                } catch (e) {
                    // ignore
                }
                // Fallback: try to count chunks by iterating chunkIndex until not found
                if (!totalChunks || totalChunks <= 0) {
                    // Count chunks by iterating chunkIndex until not found
                    let chunkCount = 0;
                    while (true) {
                        try {
                            const db = await openModelCacheDB();
                            const tx = db.transaction('fileChunks', 'readonly');
                            const store = tx.objectStore('fileChunks');
                            const req = store.get([fileId, chunkCount]);
                            const result = await new Promise(resolve => {
                                req.onsuccess = () => resolve(req.result);
                                req.onerror = () => resolve(null);
                            });
                            db.close();
                            if (!result) break;
                            chunkCount++;
                        } catch (e) {
                            break;
                        }
                    }
                    totalChunks = chunkCount;
                }
                if (totalChunks > 0) {
                    if (LOG_SELF) console.log(prefix, ' [self.fetch] Reassembling ONNX file from chunks:', fileId, 'totalChunks:', totalChunks);
                    const uint8 = await getFileChunks(fileId, totalChunks);
                    const blob = new Blob([new Uint8Array(uint8).buffer], { type: 'application/octet-stream' });
                    const headers = new Headers();
                    headers.set('Content-Type', 'application/octet-stream');
                    headers.set('Content-Length', blob.size.toString());
                    return new Response(blob, { headers });
                } else {
                    if (LOG_SELF) console.warn(prefix, ' [self.fetch] No chunks found for fileId:', fileId);
                }
            }
        }
        return null;
    } catch (dbError) {
        if (LOG_ERROR) console.error(prefix, 'Error reading from IndexedDB, proceeding to network fetch:', dbError);
        return null;
    }
}

function createEmptyGenerationConfig(): Response {
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function determineFetchInput(input: RequestInfo | URL, resourceUrl: string): { fetchInput: RequestInfo | URL; isRewritten: boolean } {
    let fetchInput = input;
    let isRewritten = false;
    
    if (resourceUrl && (
        (typeof input === 'string' && resourceUrl !== input) ||
        (input instanceof Request && resourceUrl !== input.url) ||
        (input instanceof URL && resourceUrl !== input.href)
    )) {
        fetchInput = resourceUrl;
        isRewritten = true;
    }
    
    return { fetchInput, isRewritten };
}

async function saveToDualIndexedDB(resourceUrl: string, blob: Blob, originalInput: RequestInfo | URL): Promise<void> {
    if (LOG_SELF) console.log(prefix, '[IDB TRACE] About to save to IndexedDB:', resourceUrl, 'size:', blob.size, 'type:', blob.type);
    await saveToIndexedDB(resourceUrl, blob);
    if (LOG_SELF) console.log(prefix, '[IDB TRACE] Saved to IndexedDB:', resourceUrl, 'size:', blob.size, 'type:', blob.type);
    
    let originalUrl = undefined;
    if (typeof originalInput === 'string') {
        originalUrl = originalInput;
    } else if (originalInput instanceof Request) {
        originalUrl = originalInput.url;
    } else if (originalInput instanceof URL) {
        originalUrl = originalInput.href;
    }
    
    const LARGE_FILE_REGEX = /\.(onnx(\.data)?|onnx_data|bin|pt)$/i;
    if (originalUrl && resourceUrl !== originalUrl && !LARGE_FILE_REGEX.test(resourceUrl)) {
        if (LOG_SELF) console.log(prefix, '[IDB TRACE] About to save duplicate to IndexedDB:', originalUrl, 'size:', blob.size, 'type:', blob.type);
        await saveToIndexedDB(originalUrl, blob);
        if (LOG_SELF) console.log(prefix, '[IDB TRACE] Saved duplicate to IndexedDB:', originalUrl, 'size:', blob.size, 'type:', blob.type);
    }
}

async function fetchFromNetworkAndCache(input: RequestInfo | URL, resourceUrl: string, options?: RequestInit): Promise<Response> {
    if (LOG_SELF) console.log(prefix, ' [self.fetch] Downloading model file from network:', resourceUrl);
    
    const { fetchInput, isRewritten } = determineFetchInput(input, resourceUrl);
    if (isRewritten && LOG_SELF) console.log(prefix, '[self.fetch] Fetching from network using rewritten URL:', resourceUrl);
    
    const resp = await originalFetch.call(self, fetchInput, options);
    if (!resp.ok) {
        return resp;
    }

    const blob = await resp.clone().blob();
    try {
        await saveToDualIndexedDB(resourceUrl, blob, input);
    } catch (dbError) {
        if (LOG_ERROR) console.error(prefix, '[IDB TRACE] Error saving to IndexedDB:', resourceUrl, dbError);
    }
    
    return resp;
}

self.fetch = async function(input: RequestInfo | URL, options?: RequestInit): Promise<Response> {
    const { url: resourceUrl, isRequestObject } = extractResourceUrl(input);

    if (LOG_SELF) console.log(prefix, ' [self.fetch] fetch override called. Resource URL:', resourceUrl || 'N/A (Input not string, URL, or Request)', 'Input type:', typeof input);
    if (isRequestObject) {
        if (LOG_SELF) console.log(prefix, ' [self.fetch] Input was a Request object:', input);
    }

    let finalResourceUrl = resourceUrl;
    if (finalResourceUrl) {
        finalResourceUrl = await handleModelFileRewriting(finalResourceUrl);
        
        if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
            const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
            const fileName = finalResourceUrl.split('/').pop() || '';
            if (!configFiles.includes(fileName)) {
                return createEmptyGenerationConfig();
            }
        }
        
        if (LOG_SELF) console.log(prefix, ' [self.fetch] resourceUrl after rewrite:', finalResourceUrl);
    }

    let wasmResponse: Response | null = null;
    if (finalResourceUrl) {
        if (LOG_SELF) console.log(prefix, ' [self.fetch] Potentially interceptable non-WASM fetch. URL:', finalResourceUrl);

        const cachedResponse = await tryServeFromIndexedDB(finalResourceUrl);
        if (cachedResponse) {
            return cachedResponse;
        }

        if (finalResourceUrl.includes('/resolve/main/') || finalResourceUrl.includes('/resolve/')) {
            return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
        } else {
            if (LOG_GENERAL) console.log(prefix, ' [self.fetch] URL did not match model pattern (/resolve/main/ or /resolve/):', finalResourceUrl);
        }

        wasmResponse = await handleWasmInterception(finalResourceUrl, input, isRequestObject, options);
    } else {
        if (LOG_GENERAL) console.log(prefix, ' [self.fetch] fetch override: resourceUrl could not be determined. Passing through.');
    }

    if (wasmResponse) {
        return wasmResponse;
    }

    return originalFetch.call(self, input, options);
};

async function setupOnnxWasmPathsHardcoded() {
    try {
        if (!env.backends) { (env as any).backends = {}; }
        if (!env.backends.onnx) { (env.backends as any).onnx = {}; }

        if (!(env.backends.onnx as any).wasm) { ((env.backends.onnx as any).wasm as any) = {}; }
        ((env.backends.onnx as any).wasm as any).wasmPaths = await getOnnxWasmRootPath();
        ((env.backends.onnx as any).wasm as any).proxy = false;

        if (!((env.backends.onnx as any).env as any)) { ((env.backends.onnx as any).env as any) = {}; }
        if (!(((env.backends.onnx as any).env as any).wasm as any)) { (((env.backends.onnx as any).env as any).wasm as any) = {}; }

        (((env.backends.onnx as any).env as any).wasm as any).wasmPaths = {
            [ONNX_WASM_FILE_NAME]: await getOnnxWasmFilePath(),
            [ONNX_LOADER_FILE_NAME]: await getOnnxLoaderFilePath()
        };
        (((env.backends.onnx as any).env as any).wasm as any).loader = await getOnnxLoaderFilePath();

        if (hasWebGPU) {
            (env.backends.onnx as any).executionProviders = ['webgpu', 'wasm'];
            if (!(env.backends.onnx as any).webgpu) {
                (env.backends.onnx as any).webgpu = {};
            }
            (env.backends.onnx as any).webgpu.powerPreference = 'high-performance';
        } else {
            (env.backends.onnx as any).executionProviders = ['wasm'];
        }

        if(LOG_DEBUG)console.log(prefix, 'Re-affirmed ONNX WASM config. env.backends.onnx.wasm:', JSON.stringify(((env.backends.onnx as any).wasm as any), null, 2));
        if(LOG_DEBUG)console.log(prefix, 'Re-affirmed ONNX WASM config. env.backends.onnx.env.wasm:', JSON.stringify(((env.backends.onnx as any).env as any).wasm, null, 2));
    } catch (err) {
        if(LOG_WARN)console.warn(prefix, 'Failed to re-affirm hardcoded ONNX WASM/loader config:', err);
    }
}



async function loadPipeline(payload: { modelId: string, modelPath: string, task?: string, loadId?: string }) {
    await webgpuCheckPromise;
    const { modelId, modelPath, task, loadId } = payload;
    currentLoadId = loadId;

    // Wire up globals for fetch override
    currentModel = modelId;
    currentModelPath = modelPath;

    await setupOnnxWasmPathsHardcoded();

    const envLog = {
        env: {
            allowRemoteModels: env.allowRemoteModels,
            allowLocalModels: env.allowLocalModels,
            localModelPath: env.localModelPath,
            onnxWasm: env.backends.onnx && (env.backends.onnx as any).env && ((env.backends.onnx as any).env as { wasm?: any }).wasm ? { ...(((env.backends.onnx as any).env as { wasm: any }).wasm) } : undefined
        },
        envConfig,
        hasWebGPU
    };
    if(LOG_GENERAL)console.log(prefix, 'loadPipeline environment (pretty):', JSON.stringify(envLog, null, 2));

    let resolvedDevice = envConfig.device;
    if (!resolvedDevice && hasWebGPU) {
        resolvedDevice = 'webgpu';
        if(LOG_GENERAL)console.log(prefix, 'Auto-selecting WebGPU as device');
    }

    const modelArg = currentModel;
    let fallbackUsed = false;
    let options: any = {
        progress_callback: (data: any) => {
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { ...data, loadId } });
        }
    };

    if (resolvedDevice) {
        options.device = resolvedDevice;
        if(LOG_GENERAL)console.log(prefix, 'Setting device to:', resolvedDevice);
    }
    
    if (envConfig.dtype) options.dtype = envConfig.dtype;
    if (envConfig.quantized !== undefined) options.quantized = envConfig.quantized;
    
    if (hasWebGPU && resolvedDevice === 'webgpu') {
        options.execution_providers = ['webgpu', 'wasm'];
    }

    if (inferenceSettings.threads !== undefined && options.threads === undefined) {
        options.threads = inferenceSettings.threads;
    }
    if (inferenceSettings.batch_size !== undefined && options.batch_size === undefined) {
        options.batch_size = inferenceSettings.batch_size;
    }

    if(LOG_GENERAL)console.log(prefix, `Loading ONNX model: ${modelArg}, device: ${options.device || 'auto'}`);

    const pipelineTask = task || 'text-generation';

    const pipelineLog: any = {
        pipelineType: typeof pipeline,
        modelArg,
        options,
        env: JSON.parse(JSON.stringify(env)), 
        currentEnvOnnx: JSON.parse(JSON.stringify(env.backends.onnx)) 
    };
    if(LOG_DEBUG)console.log(prefix, 'About to call pipeline (pretty):', JSON.stringify(pipelineLog, null, 2));

    let actualExecutionProvider: string = 'unknown';
    let providerNote: string | undefined = undefined;
    try {
        pipelineInstance = await pipeline(pipelineTask, modelArg, options);
        isModelPipelineReady = true;
        if(LOG_DEBUG)console.log(prefix, 'pipelineInstance after creation:', pipelineInstance);

        if (pipelineInstance) {
            if (pipelineInstance.device && typeof pipelineInstance.device === 'string') {
                actualExecutionProvider = pipelineInstance.device;
            } else if (pipelineInstance.model && pipelineInstance.model.session) {
                const session = pipelineInstance.model.session;
                if (session.executionProviders && Array.isArray(session.executionProviders) && session.executionProviders.length > 0) {
                    actualExecutionProvider = session.executionProviders[0];
                } else if (session.providerName && typeof session.providerName === 'string') {
                    actualExecutionProvider = session.providerName;
                } else if (session.handler && session.handler.backend && typeof session.handler.backend === 'string') {
                    actualExecutionProvider = session.handler.backend;
                }
            }
        }

        actualExecutionProvider = (actualExecutionProvider || 'unknown').toLowerCase().trim();

        if (actualExecutionProvider === 'unknown' || actualExecutionProvider === 'cpu') {
            if (resolvedDevice === 'webgpu' && hasWebGPU) {
                actualExecutionProvider = 'wasm';
                providerNote = 'WebGPU was requested but WASM was used. This may be due to a backend limitation or model incompatibility.';
            } else {
                actualExecutionProvider = 'wasm';
            }
        } else if (actualExecutionProvider.includes('webgpu')) {
            actualExecutionProvider = 'webgpu';
        } else if (actualExecutionProvider.includes('wasm')) {
            actualExecutionProvider = 'wasm';
        }

        if(LOG_DEBUG)console.log(prefix, `Successfully loaded pipeline. Actual execution provider: ${actualExecutionProvider}`);
        if (providerNote) {
            if(LOG_DEBUG)console.warn(prefix, 'Provider note:', providerNote);
        }
        self.postMessage({ 
            type: WorkerEventNames.WORKER_READY, 
            payload: { 
                modelPath, 
                task: pipelineTask, 
                fallback: fallbackUsed, 
                executionProvider: actualExecutionProvider,
                warning: providerNote,
                modelId: modelId
            } 
        });
        await setManifestQuantStatus(modelId, modelPath, QuantStatus.Downloaded);
    } catch (err) {
        if(LOG_ERROR)console.error(prefix, 'pipeline() call failed for modelPath', modelPath, ':', err);
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model at path ${modelPath}` });
    }
}

function chatHistoryToPrompt(history: any[]): string {
    return history.map(msg => {
        if (msg.role === 'user') return `User: ${msg.content}`;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
    }).join('\n') + '\nAssistant: ';
}
async function generateText(payload: any, useArray: boolean = false) {
    if (!isModelPipelineReady || !pipelineInstance) {
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error: 'Model pipeline is not ready.', chatId: payload.chatId, messageId: payload.messageId } });
        return;
    }
    try {
        const {
            threads, 
            batch_size, 
            ...runTimeGenerationParams 
        } = inferenceSettings;
        
        if (LOG_GENERATION) console.log(prefix, '[generateText] Raw payload:', JSON.stringify(payload));
        const input = payload.messages || payload.message || payload.input;
        if (LOG_GENERATION) console.log(prefix, '[generateText] Extracted input:', JSON.stringify(input));

        if (input === undefined) {
            self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error: 'No input provided to model.', chatId: payload.chatId, messageId: payload.messageId } });
            return;
        }

        let output;
        let generatedText;
        try {
            let modelInput = input;
            if (Array.isArray(input) && !useArray) {
                modelInput = chatHistoryToPrompt(input);
                if (LOG_GENERATION) console.log(prefix, '[generateText] Converted chat history to prompt string:', modelInput);
            } else {
                if (LOG_GENERATION) console.log(prefix, '[generateText] modelInput (no conversion):', modelInput);
            }
            output = await pipelineInstance(modelInput); // TEMP: do not pass params for this test
            if (LOG_GENERATION) console.log(prefix, '[generateText] Pipeline output:', output);
            let rawText = '';
            if (typeof output === 'string') {
                rawText = output;
            } else if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
                rawText = output[0].generated_text;
            } else {
                rawText = JSON.stringify(output); // fallback for debugging
            }
            if (LOG_GENERATION) console.log(prefix, '[generateText] rawText for extraction:', rawText);
            generatedText = extractLastAssistantReply(rawText);
            if (LOG_GENERATION) console.log(prefix, '[generateText] Final generatedText:', generatedText);
        } catch (pipelineErr: any) {
            console.error(prefix, '[generateText] Error during pipelineInstance call:', 
                pipelineErr, 
                'Input:', JSON.stringify(input), // Keep this for debugging if it still fails
                'Params:', JSON.stringify(runTimeGenerationParams) // Keep this for debugging
            );
            throw pipelineErr; 
        }

        self.postMessage({
            type: WorkerEventNames.GENERATION_COMPLETE,
            payload: {
                ...payload,
                output,
                generatedText,
            },
        });
    } catch (err: any) {
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error: err?.message || String(err), chatId: payload.chatId, messageId: payload.messageId } });
    }
}

async function setManifestQuantStatus(repo: string, quant: string, status: QuantStatus) {
  let manifest = await getManifestEntry(repo);
  if (!manifest) return;
  if (!manifest.quants[quant]) {
    manifest.quants[quant] = { files: [], status };
  } else {
    manifest.quants[quant].status = status;
  }
  await addManifestEntry(repo, manifest);
  self.postMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload, label } = (event.data || {}) as { type: string; payload: any; label?: string };
    switch (type) {
        case WorkerEventNames.SET_BASE_URL: {
            return;
        }
        case WorkerEventNames.SET_ENV_CONFIG: {
            envConfig = { ...envConfig, ...payload };
            if(LOG_GENERAL)console.log(prefix, 'Environment config updated:', envConfig);
            break;
        }
        case WorkerEventNames.INFERENCE_SETTINGS_UPDATE: {
            const settings = await getInferenceSettings();
            if(settings) {
                inferenceSettings = { ...inferenceSettings, ...settings };
            }
            if(LOG_GENERAL)console.log(prefix, 'Inference settings updated:', inferenceSettings);
            break;
        }
        case WorkerEventNames.INIT: {
            const { modelPath, task, loadId, modelId } = payload;
            let loadedSuccessfully = false;
            try {
                await loadPipeline({ modelId, modelPath, task, loadId });
                loadedSuccessfully = true;
            } catch (e: any) {
                loadedSuccessfully = false;
            }
            if (!loadedSuccessfully) {
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model at path ${modelPath}` });
            }
            return;
        }
        case WorkerEventNames.GENERATE: {
            await generateText(payload);
            break;
        }
        case WorkerEventNames.RESET: {
            pipelineInstance = null;
            currentModel = null;
            currentModelPath = null;
            isModelPipelineReady = false;
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            break;
        }
        case WorkerEventNames.MEMORY_STATS: {
            const memPayload = payload;
            const memLabel = label || '';
            console.log(prefix, `[MEMORY]${memLabel ? ' ' + memLabel : ''}:`, memPayload);
            break;
        }
        default: {
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Unknown message type: ${type}` });
            break;
        }
    }
};

function extractLastAssistantReply(generatedText: string): string {
    const idx = generatedText.lastIndexOf("Assistant:");
    if (idx !== -1) {
        return generatedText.substring(idx + "Assistant:".length).trim();
    }
    return generatedText;
}