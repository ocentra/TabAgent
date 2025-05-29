/// <reference lib="dom" />

import { pipeline, env } from './assets/onnxruntime-web/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';

// --- START: Extension base URL setup ---
let EXT_BASE_URL = '';
self.addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === 'setBaseUrl') {
        EXT_BASE_URL = event.data.baseUrl || '';
        console.log('[ModelWorker] Received extension base URL:', EXT_BASE_URL);
    }
});
// --- END: Extension base URL setup ---

// --- START: Define constants for ONNX paths (using EXT_BASE_URL) ---
const ONNX_ASSETS_ROOT_PATH = 'assets/onnxruntime-web/';
const ONNX_WASM_FILE_NAME = 'ort-wasm-simd-threaded.jsep.wasm';
const ONNX_LOADER_FILE_NAME = 'ort-wasm-simd-threaded.jsep.mjs';

function getOnnxWasmFilePath() {
    return EXT_BASE_URL + ONNX_ASSETS_ROOT_PATH + ONNX_WASM_FILE_NAME;
}
function getOnnxLoaderFilePath() {
    return EXT_BASE_URL + ONNX_ASSETS_ROOT_PATH + ONNX_LOADER_FILE_NAME;
}
function getOnnxWasmRootPath() {
    return EXT_BASE_URL + ONNX_ASSETS_ROOT_PATH;
}
// --- END: Define constants for ONNX paths ---

console.log('[ModelWorker] Initial state of env.backends.onnx:', JSON.stringify(env.backends.onnx, null, 2));
console.log('[ModelWorker] Initial state of env.backends:', JSON.stringify(env.backends, null, 2));

// Ensure base objects exist and set crucial paths early
if (!env.backends) { (env as any).backends = {}; }
if (!env.backends.onnx) { (env.backends as any).onnx = {}; }

// Configure env.backends.onnx.wasm (for ONNX runtime's own use, like finding the .mjs file)
if (!(env.backends.onnx as any).wasm) { ((env.backends.onnx as any).wasm as any) = {}; }
((env.backends.onnx as any).wasm as any).wasmPaths = getOnnxWasmRootPath(); // CRITICAL: Set base directory for .mjs
((env.backends.onnx as any).wasm as any).proxy = false;

// Configure env.backends.onnx.env.wasm (for Transformers.js layer)
if (!((env.backends.onnx as any).env as any)) { ((env.backends.onnx as any).env as any) = {}; }
if (!(((env.backends.onnx as any).env as any).wasm as any)) { (((env.backends.onnx as any).env as any).wasm as any) = {}; }

(((env.backends.onnx as any).env as any).wasm as any).wasmPaths = {
    [ONNX_WASM_FILE_NAME]: getOnnxWasmFilePath(),
    [ONNX_LOADER_FILE_NAME]: getOnnxLoaderFilePath(),
};
(((env.backends.onnx as any).env as any).wasm as any).loader = getOnnxLoaderFilePath();

(env.backends.onnx as any).executionProviders = ['webgpu', 'wasm'];
(env.backends.onnx as any).logLevel = 'verbose';

console.log("[ModelWorker] env.backends.onnx after initial setup:", JSON.stringify(env.backends.onnx, null, 2));
console.log("[ModelWorker] Minimal modelworker.js loaded");

self.addEventListener('error', function(e: ErrorEvent) {
    console.error("[ModelWorker] Global error in model-worker.js:", e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: e.message || e });
    } catch (err) {
        console.error("[ModelWorker] Failed to postMessage FATAL_ERROR:", err);
    }
});
self.addEventListener('unhandledrejection', function(e: PromiseRejectionEvent) {
    console.error("[ModelWorker] Unhandled promise rejection in model-worker.js:", e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: (e as any).reason || e });
    } catch (err) {
        console.error("[ModelWorker] Failed to postMessage FATAL_ERROR (unhandledrejection):", err);
    }
});

let pipelineInstance: any = null;
let currentModel: string | null = null;
let isModelPipelineReady = false;

// IndexedDB-backed fetch cache for model files
const DB_NAME = 'transformers-model-cache';
const STORE_NAME = 'files';

let llamaWasmPathRef: string | null = null;
let hasWebGPU: boolean = false;
let envConfig: any = {};

function openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getFromIndexedDB(url: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(url);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function saveToIndexedDB(url: string, blob: Blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, url);
        req.onsuccess = () => resolve(undefined);
        req.onerror = () => reject(req.error);
    });
}

const originalFetch = self.fetch;
self.fetch = async function(resource: any, options: any) {
    if (typeof resource === 'string' && resource.includes(ONNX_WASM_FILE_NAME)) {
       console.log(`[ModelWorker] Intercepting fetch for WASM: ${resource}, serving local: ${getOnnxWasmFilePath()}`);
       return originalFetch.call(this, getOnnxWasmFilePath(), options);
    }
    // Model file caching logic (IndexedDB)
    if (typeof resource === 'string' && resource.includes('/resolve/main/')) {
        const cached = await getFromIndexedDB(resource);
        if (cached) {
            console.log(`[ModelWorker] Serving model file from IndexedDB: ${resource}`);
            return new Response(cached);
        }
        const resp = await originalFetch(resource, options);
        if (resp.ok) {
            const blob = await resp.blob();
            await saveToIndexedDB(resource, blob.slice()); // Use slice() to ensure the blob can be reused
            console.log(`[ModelWorker] Fetched and cached model file: ${resource}`);
            return new Response(blob, { headers: resp.headers });
        }
        return resp;
    }
    return originalFetch.call(this, resource, options);
};

if (typeof (self as any).importScripts === 'function') {
    const origImportScripts = (self as any).importScripts;
    (self as any).importScripts = function (...urls: any[]) {
        const patchedUrls = urls.map((url: any) =>
            typeof url === 'string' && url.includes(ONNX_LOADER_FILE_NAME) ? getOnnxLoaderFilePath() : url
        );
        console.log('[ModelWorker] importScripts called with patched URLs:', patchedUrls);
        return origImportScripts.apply(this, patchedUrls);
    };
}
try {
    console.log(`[ModelWorker] Attempting to importScripts: ${getOnnxLoaderFilePath()}`);
    (self as any).importScripts(getOnnxLoaderFilePath());
    console.log(`[ModelWorker] Successfully imported ${getOnnxLoaderFilePath()}`);
} catch (e) {
    console.warn(`[ModelWorker] Failed to importScripts ${getOnnxLoaderFilePath()} (may be normal if already loaded or not needed by direct importScripts):`, e);
}

async function setupOnnxWasmPathsHardcoded() {
    try {
        if (!env.backends) { (env as any).backends = {}; }
        if (!env.backends.onnx) { (env.backends as any).onnx = {}; }

        if (!(env.backends.onnx as any).wasm) { ((env.backends.onnx as any).wasm as any) = {}; }
        ((env.backends.onnx as any).wasm as any).wasmPaths = getOnnxWasmRootPath();
        ((env.backends.onnx as any).wasm as any).proxy = false;

        if (!((env.backends.onnx as any).env as any)) { ((env.backends.onnx as any).env as any) = {}; }
        if (!(((env.backends.onnx as any).env as any).wasm as any)) { (((env.backends.onnx as any).env as any).wasm as any) = {}; }

        (((env.backends.onnx as any).env as any).wasm as any).wasmPaths = {
            [ONNX_WASM_FILE_NAME]: getOnnxWasmFilePath(),
            [ONNX_LOADER_FILE_NAME]: getOnnxLoaderFilePath()
        };
        (((env.backends.onnx as any).env as any).wasm as any).loader = getOnnxLoaderFilePath();

        console.log('[ModelWorker] Re-affirmed ONNX WASM config. env.backends.onnx.wasm:', JSON.stringify(((env.backends.onnx as any).wasm as any), null, 2));
        console.log('[ModelWorker] Re-affirmed ONNX WASM config. env.backends.onnx.env.wasm:', JSON.stringify(((env.backends.onnx as any).env as any).wasm, null, 2));
    } catch (err) {
        console.warn('[ModelWorker] Failed to re-affirm hardcoded ONNX WASM/loader config:', err);
    }
}

async function initWorker({ wasmBase, llamaWasmPath, allowRemoteModels, allowLocalModels, localModelPath, device, useWebGPU, dtype, quantized }: {
    wasmBase?: string,
    llamaWasmPath: string,
    allowRemoteModels?: boolean,
    allowLocalModels?: boolean,
    localModelPath?: string,
    device?: string,
    useWebGPU?: boolean,
    dtype?: string,
    quantized?: boolean
}) {
    try {
        console.log('[ModelWorker] initWorker called with wasmBase:', wasmBase);
        await setupOnnxWasmPathsHardcoded();

        llamaWasmPathRef = llamaWasmPath;
        hasWebGPU = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
        if (typeof allowRemoteModels === 'boolean') env.allowRemoteModels = allowRemoteModels;
        if (typeof allowLocalModels === 'boolean') env.allowLocalModels = allowLocalModels;
        if (localModelPath) env.localModelPath = localModelPath;
        envConfig = { device, useWebGPU, dtype, quantized };
        
        console.log('[ModelWorker] env.backends.onnx after initWorker:', JSON.stringify(env.backends.onnx, null, 2));
        self.postMessage({ type: WorkerEventNames.WORKER_ENV_READY, payload: { gpu: hasWebGPU, llamaWasmPath: llamaWasmPathRef } });
    } catch (error) {
        console.error("[ModelWorker] initWorker failed:", error);
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `initWorker failed: ${(error as Error).message}` });
    }
}

async function loadPipeline(payload: { modelId: string }) {
    const { modelId } = payload;

    console.log('[ModelWorker] Re-affirming ONNX paths before pipeline call.');
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
    console.log('[ModelWorker] loadPipeline environment (pretty):', JSON.stringify(envLog, null, 2));

    let resolvedDevice = envConfig.device;
    if (!resolvedDevice && envConfig.useWebGPU && hasWebGPU) {
        resolvedDevice = 'webgpu';
    }
    const modelArg = modelId;
    const options: any = {
        progress_callback: (data: any) => {
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: data });
        }
    };
    if (resolvedDevice) options.device = resolvedDevice;
    if (envConfig.dtype) options.dtype = envConfig.dtype;
    if (envConfig.quantized !== undefined) options.quantized = envConfig.quantized;

    const pipelineLog: any = {
        pipelineType: typeof pipeline,
        modelArg,
        options,
        env: JSON.parse(JSON.stringify(env)), // Deep copy for logging
        currentEnvOnnx: JSON.parse(JSON.stringify(env.backends.onnx)) // Deep copy for logging
    };
    console.log('[ModelWorker][DEBUG] About to call pipeline (pretty):', JSON.stringify(pipelineLog, null, 2));

    try {
        pipelineInstance = await pipeline('text-generation', modelArg, options);
        currentModel = modelId;
        isModelPipelineReady = true;
        self.postMessage({ type: 'WORKER_READY', payload: { modelId, task: 'text-generation' } });
    } catch (err) {
        console.error('[ModelWorker][ERROR] pipeline() call failed:', err);
        console.error('[ModelWorker][ERROR] env.backends.onnx at time of failure:', JSON.stringify(env.backends.onnx, null, 2));
        throw err; // Rethrow to be caught by the onmessage handler
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = (event.data || {}) as { type: string; payload: any };
    switch (type) {
        case 'init': {
            try {
                if (currentModel !== payload.modelId || !isModelPipelineReady) {
                    isModelPipelineReady = false;
                    await loadPipeline(payload);
                } else {
                    self.postMessage({ type: 'WORKER_READY', payload: { modelId: payload.modelId, task: payload.task || 'text-generation' } });
                }
            } catch (error) {
                self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : String(error) });
            }
            break;
        }
        case 'generate': {
            if (!isModelPipelineReady || !pipelineInstance) {
                self.postMessage({ type: 'GENERATION_ERROR', payload: { error: 'Model pipeline is not ready.', chatId: payload.chatId, messageId: payload.messageId } });
                return;
            }
            try {
                const result = await pipelineInstance(payload.messages, {
                    max_new_tokens: payload.max_new_tokens || 128,
                    temperature: payload.temperature || 0.7,
                });
                let text = '';
                if (Array.isArray(result) && result[0]?.generated_text) {
                    text = result[0].generated_text;
                } else if (typeof result === 'object' && (result as any).generated_text) {
                    text = (result as any).generated_text;
                } else {
                    text = JSON.stringify(result);
                }
                self.postMessage({
                    type: 'GENERATION_COMPLETE',
                    payload: {
                        chatId: payload.chatId,
                        messageId: payload.messageId,
                        text
                    }
                });
            } catch (error) {
                self.postMessage({
                    type: 'GENERATION_ERROR',
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        chatId: payload.chatId,
                        messageId: payload.messageId
                    }
                });
            }
            break;
        }
        case 'reset': {
            pipelineInstance = null;
            currentModel = null;
            isModelPipelineReady = false;
            self.postMessage({ type: 'RESET_COMPLETE' });
            break;
        }
        case 'initWorker': {
            initWorker(payload);
            break;
        }
        default: {
            self.postMessage({ type: 'ERROR', payload: `Unknown message type: ${type}` });
            break;
        }
    }
};