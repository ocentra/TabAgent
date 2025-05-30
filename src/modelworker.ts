/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
// Import DOM types for TypeScript
export {};
const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();

if (_isNavigatorGpuAvailable) {
    webgpuCheckPromise = (async () => {
        try {
            const adapter = await (navigator as any).gpu.requestAdapter();
            if (!adapter) {
                console.warn('[ModelWorker] WebGPU navigator.gpu exists, but requestAdapter() returned null. WebGPU will not be used.');
                hasWebGPU = false;
            } else {
                console.log('[ModelWorker] WebGPU adapter successfully obtained. WebGPU is available.');
            }
        } catch (e) {
            console.warn('[ModelWorker] Error requesting WebGPU adapter. WebGPU will not be used.', e);
            hasWebGPU = false;
        }
    })();
}

console.log('[ModelWorker] WebGPU available in worker (navigator.gpu):', _isNavigatorGpuAvailable);
import { pipeline, env } from './assets/onnxruntime-web/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';

env.useBrowserCache = false;

let EXT_BASE_URL: string = '';
let extBaseUrlReadyResolve: ((url: string) => void) | null = null;
const extBaseUrlReady = new Promise<string>((resolve) => {
    extBaseUrlReadyResolve = resolve;
});

self.addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === WorkerEventNames.SET_BASE_URL) {
        EXT_BASE_URL = event.data.baseUrl || '';
        console.log('[ModelWorker] Received extension base URL:', EXT_BASE_URL);
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
    console.log('[ModelWorker] Initial state of env.backends:', JSON.stringify(env.backends, null, 2));

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
    (env.backends.onnx as any).logLevel = 'verbose';

    console.log("[ModelWorker]  Minimal modelworker.js loaded and env.backends.onnx after initial setup:", JSON.stringify(env.backends.onnx, null, 2));
    self.postMessage({ type: WorkerEventNames.WORKER_ENV_READY });
})();

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

const DB_NAME = 'transformers-model-cache';
const STORE_NAME = 'files';

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
   // console.log('[ModelWorker] IndexedDB get key:', url);
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(url);
        req.onsuccess = () => {
            if (req.result) {
                //console.log('[ModelWorker] Cache hit in IndexedDB for:', url);
            } else {
                //console.log('[ModelWorker] Cache miss in IndexedDB for:', url);
            }
            resolve(req.result || null);
        };
        req.onerror = () => {
            console.error('[ModelWorker] IndexedDB get error for:', url, req.error);
            reject(req.error);
        };
    });
}

async function saveToIndexedDB(url: string, blob: Blob) {
    //console.log('[ModelWorker] IndexedDB save key:', url);
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(blob, url);
        req.onsuccess = () => {
            //console.log('[ModelWorker] Saved to IndexedDB:', url);
            resolve(undefined);
        };
        req.onerror = () => {
            //console.error('[ModelWorker] IndexedDB save error for:', url, req.error);
            reject(req.error);
        };
    });
}

const originalFetch = self.fetch;

self.fetch = async function(input: RequestInfo | URL, options?: RequestInit): Promise<Response> {
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

    //console.log('[ModelWorker] fetch override called. Resource URL:', resourceUrl || 'N/A (Input not string, URL, or Request)', 'Input type:', typeof input);
    if (isRequestObject) {
        //console.log('[ModelWorker] Input was a Request object:', input);
    }


    if (resourceUrl && resourceUrl.includes(ONNX_WASM_FILE_NAME)) {
       //console.log(`[ModelWorker] Intercepting fetch for WASM: ${resourceUrl}, serving local: ${await getOnnxWasmFilePath()}`);
       const wasmPath = await getOnnxWasmFilePath();
       return originalFetch.call(self, isRequestObject ? new Request(wasmPath, input as Request) : wasmPath, options);
    }

    if (resourceUrl) { 
        //console.log('[ModelWorker] Potentially interceptable non-WASM fetch. URL:', resourceUrl);

        if (resourceUrl.includes('/resolve/main/') || resourceUrl.includes('/resolve/')) { 
           // console.log('[ModelWorker] Matched model file pattern (/resolve/main/ or /resolve/). Attempting IndexedDB for URL:', resourceUrl);
            try {
                const cached = await getFromIndexedDB(resourceUrl);
                if (cached) {
                    //console.log(`[ModelWorker] Serving model file from IndexedDB: ${resourceUrl}`);
                    const headers = new Headers();
                    if (cached.type) {
                        headers.set('Content-Type', cached.type);
                    } else if (resourceUrl.endsWith('.json')) {
                        headers.set('Content-Type', 'application/json');
                    } else {
                        headers.set('Content-Type', 'application/octet-stream');
                    }
                    headers.set('Content-Length', cached.size.toString());
                    //console.log(`[ModelWorker] Serving from IDB with headers: Content-Type: ${headers.get('Content-Type')}, Content-Length: ${headers.get('Content-Length')}`);
                    return new Response(cached, { headers: headers });
                }
            } catch (dbError) {
                console.error('[ModelWorker] Error reading from IndexedDB, proceeding to network fetch:', dbError);
            }

            // console.log(`[ModelWorker] Downloading model file from network: ${resourceUrl}`);
            const resp = await originalFetch.call(self, input, options); 
            if (resp.ok) {
                const blob = await resp.clone().blob(); 
                try {
                    await saveToIndexedDB(resourceUrl, blob);
                    //console.log(`[ModelWorker] Fetched and cached model file to IndexedDB: ${resourceUrl}`);
                } catch (dbError) {
                    // console.error('[ModelWorker] Error saving to IndexedDB:', dbError);
                }
                return resp; 
            }
            return resp;
        } else {
            console.log('[ModelWorker] URL did not match model pattern (/resolve/main/ or /resolve/):', resourceUrl);
        }
    } else {
        console.log('[ModelWorker] fetch override: resourceUrl could not be determined. Passing through.');
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

        console.log('[ModelWorker] Re-affirmed ONNX WASM config. env.backends.onnx.wasm:', JSON.stringify(((env.backends.onnx as any).wasm as any), null, 2));
        console.log('[ModelWorker] Re-affirmed ONNX WASM config. env.backends.onnx.env.wasm:', JSON.stringify(((env.backends.onnx as any).env as any).wasm, null, 2));
    } catch (err) {
        console.warn('[ModelWorker] Failed to re-affirm hardcoded ONNX WASM/loader config:', err);
    }
}

function mapQuantToDtype(quant: string): string {
    switch (quant) {
        case 'auto':
            return 'auto';
        case 'fp32':
        case 'float32':
            return 'fp32';
        case 'fp16':
        case 'float16':
            return 'fp16';
        case 'int8':
        case 'q8':
            return 'int8';
        case 'uint8':
            return 'uint8';
        case 'q4':
        case 'int4':
            return 'q4';
        case 'q4f16':
            return 'q4f16';
        case 'bnb4':
        case 'nf4':
            return quant;
        case 'q6_k':
            return 'q6_k';
        default:
            return quant;
    }
}

async function loadPipeline(payload: { modelId: string, onnxFile?: string }) {
    await webgpuCheckPromise;
    const { modelId, onnxFile: quantization } = payload;

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
    if (!resolvedDevice && hasWebGPU) {
        resolvedDevice = 'webgpu';
        console.log('[ModelWorker] Auto-selecting WebGPU as device');
    }

    const modelArg = modelId;
    let quantTried = quantization;
    let fallbackUsed = false;
    let options: any = {
        progress_callback: (data: any) => {
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: data });
        }
    };

    if (resolvedDevice) {
        options.device = resolvedDevice;
        console.log('[ModelWorker] Setting device to:', resolvedDevice);
    }
    
    if (envConfig.dtype) options.dtype = envConfig.dtype;
    if (envConfig.quantized !== undefined) options.quantized = envConfig.quantized;
    
    if (quantization && quantization !== 'auto') {
        options.quant = quantization;
        options.dtype = mapQuantToDtype(quantization);
    } else {
        options.dtype = 'auto';
    }

    if (hasWebGPU && resolvedDevice === 'webgpu') {
        options.execution_providers = ['webgpu', 'wasm'];
    }

    console.log(`[ModelWorker] Using quant: ${options.quant || 'auto'}, dtype: ${options.dtype}, device: ${options.device || 'auto'}`);

    const pipelineLog: any = {
        pipelineType: typeof pipeline,
        modelArg,
        options,
        env: JSON.parse(JSON.stringify(env)), 
        currentEnvOnnx: JSON.parse(JSON.stringify(env.backends.onnx)) 
    };
    console.log('[ModelWorker][DEBUG] About to call pipeline (pretty):', JSON.stringify(pipelineLog, null, 2));

    let actualExecutionProvider: string = 'unknown';
    let providerNote: string | undefined = undefined;
    try {
      
        pipelineInstance = await pipeline('text-generation', modelArg, options);
        currentModel = modelId;
        isModelPipelineReady = true;
        console.log('[ModelWorker] pipelineInstance after creation:', pipelineInstance);

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

        // Normalize provider string
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

        console.log(`[ModelWorker] Successfully loaded pipeline. Actual execution provider: ${actualExecutionProvider}`);
        if (providerNote) {
            console.warn('[ModelWorker] Provider note:', providerNote);
        }
        self.postMessage({ 
            type: WorkerEventNames.WORKER_READY, 
            payload: { 
                modelId, 
                onnxFile: quantTried, 
                task: 'text-generation', 
                fallback: fallbackUsed, 
                executionProvider: actualExecutionProvider,
                providerNote
            } 
        });
    } catch (err) {
        console.error('[ModelWorker][ERROR] pipeline() call failed for quant', quantTried, ':', err);
        
        if (quantization && quantization !== 'auto') {
            try {
                fallbackUsed = true;
                quantTried = 'auto';
                delete options.quant;
                options.dtype = 'auto';
                pipelineInstance = await pipeline('text-generation', modelArg, options);
                currentModel = modelId;
                isModelPipelineReady = true;
                self.postMessage({ 
                    type: WorkerEventNames.WORKER_READY, 
                    payload: { 
                        modelId, 
                        onnxFile: quantTried, 
                        task: 'text-generation', 
                        fallback: fallbackUsed, 
                        requestedQuant: quantization, 
                        executionProvider: actualExecutionProvider 
                    } 
                });
                return;
            } catch (fallbackErr) {
                console.error('[ModelWorker][ERROR] pipeline() fallback to auto failed:', fallbackErr);
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model with quant ${quantization} and fallback quant auto` });
                return;
            }
        }
        
        if (resolvedDevice === 'webgpu' && hasWebGPU) {
            try {
                console.log('[ModelWorker] WebGPU failed, trying WASM fallback...');
                fallbackUsed = true;
                delete options.device;
                delete options.execution_providers;
                pipelineInstance = await pipeline('text-generation', modelArg, options);
                currentModel = modelId;
                isModelPipelineReady = true;
                actualExecutionProvider = 'wasm (WebGPU fallback)';
                self.postMessage({ 
                    type: WorkerEventNames.WORKER_READY, 
                    payload: { 
                        modelId, 
                        onnxFile: quantTried, 
                        task: 'text-generation', 
                        fallback: fallbackUsed, 
                        executionProvider: actualExecutionProvider 
                    } 
                });
                return;
            } catch (wasmErr) {
                console.error('[ModelWorker][ERROR] WASM fallback also failed:', wasmErr);
            }
        }
        
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model with quant ${quantization || 'default'}` });
    }

    console.log('[ModelWorker] pipelineInstance:', pipelineInstance);

    if (pipelineInstance.device) {
      console.log('[ModelWorker] Actual device/provider used (pipelineInstance.device):', pipelineInstance.device);
    }
    if (pipelineInstance.model) {
      console.log('[ModelWorker] pipelineInstance.model:', pipelineInstance.model);
      if (pipelineInstance.model.session) {
        console.log('[ModelWorker] pipelineInstance.model.session:', pipelineInstance.model.session);
        if ('executionProvider' in pipelineInstance.model.session) {
          console.log('[ModelWorker] Actual executionProvider (model.session.executionProvider):', pipelineInstance.model.session.executionProvider);
        }
        if ('_backend' in pipelineInstance.model.session) {
          console.log('[ModelWorker] Backend (model.session._backend):', pipelineInstance.model.session._backend);
        }
        if ('executionProviders' in pipelineInstance.model.session) {
          console.log('[ModelWorker] Available executionProviders:', pipelineInstance.model.session.executionProviders);
        }
      }
    }
    if (pipelineInstance.session) {
      console.log('[ModelWorker] pipelineInstance.session:', pipelineInstance.session);
      if ('executionProvider' in pipelineInstance.session) {
        console.log('[ModelWorker] Actual executionProvider (session.executionProvider):', pipelineInstance.session.executionProvider);
      }
      if ('_backend' in pipelineInstance.session) {
        console.log('[ModelWorker] Backend (session._backend):', pipelineInstance.session._backend);
      }
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = (event.data || {}) as { type: string; payload: any };
    switch (type) {
        case WorkerEventNames.SET_BASE_URL: {
            return;
        }
        case WorkerEventNames.SET_ENV_CONFIG: {
            envConfig = { ...envConfig, ...payload };
            console.log('[ModelWorker] Environment config updated:', envConfig);
            break;
        }
        case WorkerEventNames.INIT: {
            try {
                if (currentModel !== payload.modelId || !isModelPipelineReady) {
                    isModelPipelineReady = false;
                    await loadPipeline(payload);
                } else {
                    self.postMessage({ type: WorkerEventNames.WORKER_READY, payload: { modelId: payload.modelId, onnxFile: payload.onnxFile, task: payload.task || 'text-generation', fallback: false } });
                }
            } catch (error) {
                self.postMessage({ type: WorkerEventNames.ERROR, payload: error instanceof Error ? error.message : String(error) });
            }
            break;
        }
        case WorkerEventNames.GENERATE: {
            if (!isModelPipelineReady || !pipelineInstance) {
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error: 'Model pipeline is not ready.', chatId: payload.chatId, messageId: payload.messageId } });
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
                    type: WorkerEventNames.GENERATION_COMPLETE,
                    payload: {
                        chatId: payload.chatId,
                        messageId: payload.messageId,
                        text
                    }
                });
            } catch (error) {
                self.postMessage({
                    type: WorkerEventNames.GENERATION_ERROR,
                    payload: {
                        error: error instanceof Error ? error.message : String(error),
                        chatId: payload.chatId,
                        messageId: payload.messageId
                    }
                });
            }
            break;
        }
        case WorkerEventNames.RESET: {
            pipelineInstance = null;
            currentModel = null;
            isModelPipelineReady = false;
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            break;
        }
        default: {
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Unknown message type: ${type}` });
            break;
        }
    }
};