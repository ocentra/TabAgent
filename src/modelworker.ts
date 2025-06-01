/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
export {};
const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();
const prefix = '[ModelWorker]';
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_SELF = false;

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
import {  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, parseQuantFromFilename, QuantStatus, getInferenceSettings } from './DB/idbModel';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings } from './Controllers/InferenceSettings';


env.useBrowserCache = false;

let EXT_BASE_URL: string = '';
let extBaseUrlReadyResolve: ((url: string) => void) | null = null;
const extBaseUrlReady = new Promise<string>((resolve) => {
    extBaseUrlReadyResolve = resolve;
});

self.addEventListener('message', (event: MessageEvent) => {
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
    (env.backends.onnx as any).logLevel = 'verbose';

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
let currentQuantization: string | null = null;
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

   if(LOG_SELF)console.log(prefix, 'fetch override called. Resource URL:', resourceUrl || 'N/A (Input not string, URL, or Request)', 'Input type:', typeof input);
    if (isRequestObject) {
       if(LOG_SELF)console.log(prefix, 'Input was a Request object:', input);
    }


    if (resourceUrl && resourceUrl.includes(ONNX_WASM_FILE_NAME)) {
       if(LOG_SELF)console.log(prefix, 'Intercepting fetch for WASM:', resourceUrl, 'serving local:', await getOnnxWasmFilePath());
       const wasmPath = await getOnnxWasmFilePath();
       return originalFetch.call(self, isRequestObject ? new Request(wasmPath, input as Request) : wasmPath, options);
    }

    if (resourceUrl) { 
        if(LOG_SELF)console.log(prefix, 'Potentially interceptable non-WASM fetch. URL:', resourceUrl);

        if (resourceUrl.includes('/resolve/main/') || resourceUrl.includes('/resolve/')) { 
           if(LOG_SELF)console.log(prefix, 'Matched model file pattern (/resolve/main/ or /resolve/). Attempting IndexedDB for URL:', resourceUrl);
            try {
                const cached = await getFromIndexedDB(resourceUrl);
                if (cached) {
                    if(LOG_SELF)console.log(prefix, 'Serving model file from IndexedDB:', resourceUrl);
                    const headers = new Headers();
                    if (cached.type) {
                        headers.set('Content-Type', cached.type);
                    } else if (resourceUrl.endsWith('.json')) {
                        headers.set('Content-Type', 'application/json');
                    } else {
                        headers.set('Content-Type', 'application/octet-stream');
                    }
                    headers.set('Content-Length', cached.size.toString());
                    if(LOG_SELF)console.log(prefix, 'Serving from IDB with headers: Content-Type:', headers.get('Content-Type'), 'Content-Length:', headers.get('Content-Length'));
                    return new Response(cached, { headers: headers });
                }
            } catch (dbError) {
                if(LOG_ERROR)console.error(prefix, 'Error reading from IndexedDB, proceeding to network fetch:', dbError);
            }

            if(LOG_SELF)console.log(prefix, 'Downloading model file from network:', resourceUrl);
            const resp = await originalFetch.call(self, input, options); 
            if (resp.ok) {
                const blob = await resp.clone().blob(); 
                try {
                    await saveToIndexedDB(resourceUrl, blob);
                } catch (dbError) {
                    if(LOG_ERROR)console.error(prefix, 'Error saving to IndexedDB:', dbError);
                }
                return resp; 
            } else {
                return resp;
            }
        } else {
            if(LOG_GENERAL)console.log(prefix, 'URL did not match model pattern (/resolve/main/ or /resolve/):', resourceUrl);
        }
    } else {
        if(LOG_GENERAL)console.log(prefix, 'fetch override: resourceUrl could not be determined. Passing through.');
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

async function loadPipeline(payload: { modelId: string, quant?: string, task?: string, loadId?: string }) {
    await webgpuCheckPromise;
    const { modelId, quant, task, loadId } = payload;

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

    const modelArg = modelId;
    let quantTried = quant;
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
    
    if (quant && quant !== 'auto') {
        options.quant = quant;
        options.dtype = mapQuantToDtype(quant);
    } else {
        options.dtype = 'auto';
    }

    if (hasWebGPU && resolvedDevice === 'webgpu') {
        options.execution_providers = ['webgpu', 'wasm'];
    }

    if(LOG_GENERAL)console.log(prefix, `Using quant: ${options.quant || 'auto'}, dtype: ${options.dtype}, device: ${options.device || 'auto'}`);

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
        currentModel = modelId;
        currentQuantization = quantTried || null;
        isModelPipelineReady = true;
        if(LOG_DEBUG)console.log(prefix, 'pipelineInstance after creation:', pipelineInstance);

        let actualQuantUsed = quantTried;
        if (pipelineInstance && pipelineInstance.quant) {
            actualQuantUsed = pipelineInstance.quant;
        } else if (options.quant) {
            actualQuantUsed = options.quant;
        } else if (quantTried) {
            actualQuantUsed = quantTried;
        } else {
            actualQuantUsed = 'fp32';
        }

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

        if(LOG_DEBUG)console.log(prefix, `Successfully loaded pipeline. Actual execution provider: ${actualExecutionProvider}`);
        if (providerNote) {
            if(LOG_DEBUG)console.warn(prefix, 'Provider note:', providerNote);
        }
        self.postMessage({ 
            type: WorkerEventNames.WORKER_READY, 
            payload: { 
                modelId, 
                quant: actualQuantUsed, 
                task: pipelineTask, 
                fallback: fallbackUsed, 
                executionProvider: actualExecutionProvider,
                warning: providerNote
            } 
        });
    } catch (err) {
        if(LOG_ERROR)console.error(prefix, 'pipeline() call failed for quant', quantTried, ':', err);
        
        if (quant && quant !== 'auto') {
            try {
                fallbackUsed = true;
                quantTried = 'auto';
                delete options.quant;
                options.dtype = 'auto';
                pipelineInstance = await pipeline(pipelineTask, modelArg, options);
                currentModel = modelId;
                currentQuantization = quantTried || null;
                isModelPipelineReady = true;
                let actualQuantUsed = quantTried;
                if (pipelineInstance && pipelineInstance.quant) {
                    actualQuantUsed = pipelineInstance.quant;
                } else if (options.quant) {
                    actualQuantUsed = options.quant;
                } else if (quantTried) {
                    actualQuantUsed = quantTried;
                } else {
                    actualQuantUsed = 'fp32';
                }
                self.postMessage({ 
                    type: WorkerEventNames.WORKER_READY, 
                    payload: { 
                        modelId, 
                        quant: actualQuantUsed, 
                        task: pipelineTask, 
                        fallback: fallbackUsed, 
                        requestedQuant: quant, 
                        executionProvider: actualExecutionProvider,
                        warning: providerNote
                    } 
                });
                return;
            } catch (fallbackErr) {
                if(LOG_ERROR)console.error(prefix, 'pipeline() fallback to auto failed:', fallbackErr);
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model with quant ${quant} and fallback quant auto` });
                return;
            }
        }
        
        if (resolvedDevice === 'webgpu' && hasWebGPU) {
            try {
                if(LOG_GENERAL)console.log(prefix, 'WebGPU failed, trying WASM fallback...');
                fallbackUsed = true;
                delete options.device;
                delete options.execution_providers;
                pipelineInstance = await pipeline(pipelineTask, modelArg, options);
                currentModel = modelId;
                currentQuantization = quantTried || null;
                isModelPipelineReady = true;
                actualExecutionProvider = 'wasm (WebGPU fallback)';
                let actualQuantUsed = quantTried;
                if (pipelineInstance && pipelineInstance.quant) {
                    actualQuantUsed = pipelineInstance.quant;
                } else if (options.quant) {
                    actualQuantUsed = options.quant;
                } else if (quantTried) {
                    actualQuantUsed = quantTried;
                } else {
                    actualQuantUsed = 'fp32';
                }
                self.postMessage({ 
                    type: WorkerEventNames.WORKER_READY, 
                    payload: { 
                        modelId, 
                        quant: actualQuantUsed, 
                        task: pipelineTask, 
                        fallback: fallbackUsed, 
                        executionProvider: actualExecutionProvider,
                        warning: providerNote
                    } 
                });
                return;
            } catch (wasmErr) {
                if(LOG_ERROR)console.error(prefix, 'WASM fallback also failed:', wasmErr);
            }
        }
        
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model with quant ${quant || 'default'}` });
    }

    if(LOG_DEBUG)console.log(prefix, 'pipelineInstance:', pipelineInstance);

    if (pipelineInstance.device) {
      if(LOG_DEBUG)console.log(prefix, 'Actual device/provider used (pipelineInstance.device):', pipelineInstance.device);
    }
    if (pipelineInstance.model) {
      if(LOG_DEBUG)console.log(prefix, 'pipelineInstance.model:', pipelineInstance.model);
      if (pipelineInstance.model.session) {
        if(LOG_DEBUG)console.log(prefix, 'pipelineInstance.model.session:', pipelineInstance.model.session);
        if ('executionProvider' in pipelineInstance.model.session) {
          if(LOG_DEBUG)console.log(prefix, 'Actual executionProvider (model.session.executionProvider):', pipelineInstance.model.session.executionProvider);
        }
        if ('_backend' in pipelineInstance.model.session) {
          if(LOG_DEBUG)console.log(prefix, 'Backend (model.session._backend):', pipelineInstance.model.session._backend);
        }
        if ('executionProviders' in pipelineInstance.model.session) {
          if(LOG_DEBUG)console.log(prefix, 'Available executionProviders:', pipelineInstance.model.session.executionProviders);
        }
      }
    }
    if (pipelineInstance.session) {
      if(LOG_DEBUG)console.log(prefix, 'pipelineInstance.session:', pipelineInstance.session);
      if ('executionProvider' in pipelineInstance.session) {
        if(LOG_DEBUG)console.log(prefix, 'Actual executionProvider (session.executionProvider):', pipelineInstance.session.executionProvider);
      }
      if ('_backend' in pipelineInstance.session) {
        if(LOG_DEBUG)console.log(prefix, 'Backend (session._backend):', pipelineInstance.session._backend);
      }
    }
}

// Helper: Set quant status in manifest (add if missing)
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

// Helper: Add a new quant to manifest
async function addQuantToManifest(repo: string, quant: string, status: QuantStatus) {
  let manifest = await getManifestEntry(repo);
  if (!manifest) return;
  manifest.quants[quant] = { files: [], status };
  await addManifestEntry(repo, manifest);
  self.postMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
}



self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = (event.data || {}) as { type: string; payload: any };
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
            const { modelId, quant, task, loadId } = payload;
            let loadedSuccessfully = false;
            // Try to load requested quant
            try {
                await loadPipeline({ modelId, quant, task, loadId });
                loadedSuccessfully = true;
            } catch (e: any) {
                // Detect unsupported pipeline error
                if (typeof e?.message === 'string' && e.message.startsWith('Unsupported pipeline:')) {
                    await setManifestQuantStatus(modelId, quant, QuantStatus.Unsupported);
                    self.postMessage({ type: WorkerEventNames.ERROR, payload: `This model's task is not supported by the current runtime.` });
                    return;
                }
                loadedSuccessfully = false;
            }
            if (loadedSuccessfully) {
                // Set quant to downloaded
                await setManifestQuantStatus(modelId, quant, QuantStatus.Downloaded);
                return;
            }
            // Try fallback quant (auto)
            const fallbackQuant = 'auto';
            let fallbackLoaded = false;
            try {
                await loadPipeline({ modelId, quant: fallbackQuant, task, loadId });
                fallbackLoaded = true;
            } catch (e: any) {
                // Detect unsupported pipeline error for fallback
                if (typeof e?.message === 'string' && e.message.startsWith('Unsupported pipeline:')) {
                    await setManifestQuantStatus(modelId, fallbackQuant, QuantStatus.Unsupported);
                    self.postMessage({ type: WorkerEventNames.ERROR, payload: `This model's task is not supported by the current runtime.` });
                    return;
                }
                fallbackLoaded = false;
            }
            if (fallbackLoaded) {
                // Add fallback quant to manifest if not present, set to downloaded
                await addQuantToManifest(modelId, fallbackQuant, QuantStatus.Downloaded);
                return;
            }
            // Both failed, mark original quant as failed
            await setManifestQuantStatus(modelId, quant, QuantStatus.Failed);
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model with quant ${quant || 'default'}` });
            return;
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
            currentQuantization = null;
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