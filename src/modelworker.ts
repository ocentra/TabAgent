/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
export {};

import { env, AutoTokenizer, AutoModelForCausalLM, TextStreamer } from '@huggingface/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';
import {  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, addQuantToManifest,  QuantStatus, getInferenceSettings } from './DB/idbModel';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings } from './Controllers/InferenceSettings';
import { MESSAGE_EVENT } from './Utilities/eventConstants';
import ort from 'onnxruntime-web';


// Feature flag to switch between ONNX/MediaPipe and transformers.js
const USE_TRANSFORMERS = true;



const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();
const prefix = '[ModelWorker]';
const LOG_GENERAL = true; // Enable general logs for model loading debugging
const LOG_DEBUG = true;   // Enable debug logs for model loading debugging
const LOG_ERROR = true;   // Keep error logs enabled
const LOG_WARN = true;    // Enable warning logs for model loading debugging
const LOG_SELF = false;   // Keep self logs disabled
const LOG_GENERATION = false; // Keep generation logs disabled
const LOG_CHAT_HISTORY = false; // Turn off chat history logs for now
const LOG_TRANSFORMERS = true; // Enable transformers.js specific debugging
let currentLoadId: string | undefined = undefined;
let isGenerating = false;
let shouldStopGeneration = false;

// Transformers.js specific variables
let transformersTokenizer: any = null;
let transformersModel: any = null;
let isTransformersModelReady = false;
let isTransformersModelLoading = false;

// Log transformers.js imports to verify what we have available
if (LOG_TRANSFORMERS) {
    console.log('[ModelWorker] transformers.js env:', env);
    console.log('[ModelWorker] transformers.js AutoTokenizer:', AutoTokenizer);
    console.log('[ModelWorker] transformers.js AutoModelForCausalLM:', AutoModelForCausalLM);
    console.log('[ModelWorker] transformers.js TextStreamer:', TextStreamer);
    console.log('[ModelWorker] transformers.js env.allowLocalModels:', env.allowLocalModels);
    console.log('[ModelWorker] transformers.js env.allowRemoteModels:', env.allowRemoteModels);
    console.log('[ModelWorker] transformers.js env keys:', Object.keys(env));
    
    // Let transformers.js use normal flow, but intercept fetch requests
    // (Our custom fetch override will handle IndexedDB serving)
    console.log('[ModelWorker] transformers.js will use fetch interception for IndexedDB');
}

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
console.log('[ModelWorker] ORT:', ort);
console.log('[ModelWorker] ORT keys:', Object.keys(ort));

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

let currentModelRepoId: string | null = null;
let currentModelQuantPath: string | null = null;
let onnxSession: any | null = null;
let tokenizer: any | null = null;
let modelConfig: Record<string, any> | null = null;
let inputNames: readonly string[] = [];
let outputNames: readonly string[] = [];
let isModelReady: boolean = false;
let currentTask: string | null = null;
let envConfig: any = {};
let inferenceSettings: InferenceSettings = DEFAULT_INFERENCE_SETTINGS;
let numAttentionHeads: number | undefined;
let numKeyValueHeads: number | undefined;
let headDim: number | undefined;
let eosTokenId: number | undefined = undefined;
let modelContextLength: number = 2048; // A reasonable default
let modelInputMetadata: Map<string, { type: string; dims: number[] }> = new Map();


(async () => {
    const settings = await getInferenceSettings();
    if (settings) {
      inferenceSettings = { ...settings };
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

async function handleModelFileRewriting(resourceUrl: string): Promise<string> {
    if (!currentModelRepoId || !currentModelQuantPath) {
        return resourceUrl;
    }

    const manifest = await getManifestEntry(currentModelRepoId);
    if (!manifest || !manifest.quants || !manifest.quants[currentModelQuantPath]) {
        if (resourceUrl.match(/\.(onnx|onnx_data|bin|pt)$/i)) {
            await addQuantToManifest(currentModelRepoId, currentModelQuantPath, QuantStatus.Downloaded);
        }
        return resourceUrl;
    }

    const files = manifest.quants[currentModelQuantPath].files;
    const resourceFileName = resourceUrl.split('/').pop() || '';
    let rewrittenUrl = await rewriteGenerationConfigPath(resourceUrl, files);
    
    if (rewrittenUrl === resourceUrl && resourceFileName === 'generation_config.json') {
        return rewrittenUrl;
    }

    rewrittenUrl = await rewriteMainModelFilePath(rewrittenUrl, resourceFileName, files);
    rewrittenUrl = await rewriteSupportingFilePath(rewrittenUrl, resourceFileName, files);

    return rewrittenUrl;
}

async function rewriteMainModelFilePath(resourceUrl: string, resourceFileName: string, files: string[]): Promise<string> {
    if (!resourceFileName.endsWith('.onnx')) {
        return resourceUrl;
    }
    const manifestFile = files.find(f => f.endsWith(resourceFileName));
    if (manifestFile && resourceUrl.endsWith(manifestFile)) {
        return resourceUrl;
    }
    const quantFile = files.find(f => f.endsWith('.onnx'));
    if (quantFile) {
        return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${quantFile}`);
    }
    return resourceUrl;
}

async function rewriteSupportingFilePath(resourceUrl: string, resourceFileName: string, files: string[]): Promise<string> {
    const SUPPORTING_FILE_REGEX = /\.(json|bin|pt|txt|model)$/i;
    if (!SUPPORTING_FILE_REGEX.test(resourceFileName)) {
        return resourceUrl;
    }

    const manifestPath = files.find(f => f.endsWith('/' + resourceFileName) || f === resourceFileName);
    if (manifestPath && !resourceUrl.endsWith(manifestPath)) {
        return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${manifestPath}`);
    }
    return resourceUrl;
}

async function tryServeFromIndexedDB(resourceUrl: string): Promise<Response | null> {
    if (!resourceUrl.includes('/resolve/main/') && !resourceUrl.includes('/resolve/')) {
        if (LOG_DEBUG) console.log(prefix, `[tryServeFromIndexedDB] URL doesn't match pattern, not checking cache: ${resourceUrl}`);
        return null;
    }
    
    try {
        if (LOG_DEBUG) console.log(prefix, `[tryServeFromIndexedDB] Checking cache for: ${resourceUrl}`);
        const cached = await getFromIndexedDB(resourceUrl);
        if (cached) {
            if (LOG_DEBUG) console.log(prefix, `[tryServeFromIndexedDB] Found cached response for: ${resourceUrl}, size: ${cached.size} bytes`);
            const headers = new Headers();
            if (cached.type) {
                headers.set('Content-Type', cached.type);
            } else if (resourceUrl.endsWith('.json')) {
                headers.set('Content-Type', 'application/json');
            } else {
                headers.set('Content-Type', 'application/octet-stream');
            }
            headers.set('Content-Length', cached.size.toString());
            return new Response(cached, { headers: headers });
        } else {
            if (LOG_DEBUG) console.log(prefix, `[tryServeFromIndexedDB] No cached response found for: ${resourceUrl}`);
        }
        return null;
    } catch (dbError) {
        if (LOG_ERROR) console.error(prefix, 'Error reading from IndexedDB, proceeding to network fetch:', dbError);
        return null;
    }
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
    await saveToIndexedDB(resourceUrl, blob);
    
    let originalUrl = undefined;
    if (typeof originalInput === 'string') originalUrl = originalInput;
    else if (originalInput instanceof Request) originalUrl = originalInput.url;
    else if (originalInput instanceof URL) originalUrl = originalInput.href;
    
    const LARGE_FILE_REGEX = /\.(onnx(\.data)?|onnx_data|bin|pt)$/i;
    if (originalUrl && resourceUrl !== originalUrl && !LARGE_FILE_REGEX.test(resourceUrl)) {
        await saveToIndexedDB(originalUrl, blob);
    }
}

async function fetchFromNetworkAndCache(input: RequestInfo | URL, resourceUrl: string, options?: RequestInit): Promise<Response> {
    const { fetchInput } = determineFetchInput(input, resourceUrl);
    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] Fetching from: ${resourceUrl}, fetchInput: ${fetchInput}`);
    
    const resp = await originalFetch.call(self, fetchInput, options);
    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] Response: status=${resp.status}, statusText=${resp.statusText}, ok=${resp.ok}`);
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
    const { url: resourceUrl } = extractResourceUrl(input);

    // Enhanced logging for transformers.js requests
    if (resourceUrl && (resourceUrl.includes('huggingface.co') || resourceUrl.includes('/resolve/'))) {
        console.log(prefix, `[Custom Fetch] Transformers.js requesting: ${resourceUrl}`);
    }

    if (resourceUrl) {
        let finalResourceUrl = await handleModelFileRewriting(resourceUrl);
        
        // Map transformers.js requests to actual files for ONNX models
        if (currentModelQuantPath && currentModelQuantPath.includes('.onnx')) {
            const actualModelFile = currentModelQuantPath.split('/').pop(); // e.g., "model_q4f16.onnx"
            
            // Map generic model requests to the actual quantized file
            if (finalResourceUrl.includes('/model.onnx') || finalResourceUrl.includes('/model.onnx_data')) {
                const originalUrl = finalResourceUrl;
                finalResourceUrl = finalResourceUrl.replace('/model.onnx', `/${actualModelFile}`);
                finalResourceUrl = finalResourceUrl.replace('/model.onnx_data', `/${actualModelFile}`);
                console.log(prefix, `[Custom Fetch] Mapped ONNX request: ${originalUrl} -> ${finalResourceUrl}`);
            }
        }
        
        if (finalResourceUrl !== resourceUrl) {
            console.log(prefix, `[Custom Fetch] URL rewritten: ${resourceUrl} -> ${finalResourceUrl}`);
        }
        
        if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
            const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
            const fileName = finalResourceUrl.split('/').pop() || '';
            if (!configFiles.includes(fileName)) {
                console.log(prefix, `[Custom Fetch] Creating empty generation config for: ${fileName}`);
                return createEmptyGenerationConfig();
            }
        }
        
        if (finalResourceUrl.includes(ONNX_WASM_FILE_NAME)) {
            const wasmPath = await getOnnxWasmFilePath();
            console.log(prefix, `[Custom Fetch] Serving ONNX WASM from: ${wasmPath}`);
            return originalFetch.call(self, wasmPath, options);
        }
        
        console.log(prefix, `[Custom Fetch] Checking IndexedDB cache for: ${finalResourceUrl}`);
        const cachedResponse = await tryServeFromIndexedDB(finalResourceUrl);
        if (cachedResponse) {
            console.log(prefix, `[Custom Fetch] ✅ SERVING FROM INDEXEDDB: ${finalResourceUrl}`);
            return cachedResponse;
        } else {
            console.log(prefix, `[Custom Fetch] ❌ CACHE MISS, will download: ${finalResourceUrl}`);
        }

        // For any HuggingFace request, download and cache it
        if (finalResourceUrl.includes('huggingface.co') || finalResourceUrl.includes('/resolve/')) {
            console.log(prefix, `[Custom Fetch] Downloading and caching HuggingFace file: ${finalResourceUrl}`);
            return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
        }
    }

    console.log(prefix, `[Custom Fetch] Using original fetch for: ${resourceUrl || 'non-URL request'}`);
    return originalFetch.call(self, input, options);
};





async function loadModelInternal(payload: { modelId: string, dtype: string, task?: string, loadId?: string }): Promise<void> {
    // Feature flag: Use transformers.js implementation
    if (USE_TRANSFORMERS) {
        await loadTransformersModel({ modelId: payload.modelId, dtype: payload.dtype, task: payload.task, loadId: payload.loadId });
        return;
    }
    
        await webgpuCheckPromise;
    const { modelId, dtype, task, loadId } = payload;
    if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] Starting to load. Model ID: ${modelId}, Dtype: ${dtype}, Task: ${task}, Load ID: ${loadId}`);

    currentLoadId = loadId;
    currentModelRepoId = modelId;
    currentModelQuantPath = dtype;
    currentTask = task || 'text-generation';
    isModelReady = false; 

    if (onnxSession) {
        try {
            await onnxSession.release();
        } catch (e) {
            if (LOG_WARN) console.warn(prefix, '[loadModelInternal] Error releasing previous ONNX session:', e);
        }
        onnxSession = null;
    }
    tokenizer = null;
    modelConfig = null;
    inputNames = [];
    outputNames = [];

    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'initiate', file: dtype, progress: 0, loadId } });

    try {
        const manifest = await getManifestEntry(currentModelRepoId);
        if (!manifest || !manifest.quants || !manifest.quants[currentModelQuantPath]) {
            throw new Error(`Manifest or quant path ${currentModelQuantPath} not found for model ${currentModelRepoId}`);
        }
        const quantFiles = manifest.quants[currentModelQuantPath].files;

        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: 'tokenizer', progress: 10, loadId } });
        tokenizer = await AutoTokenizer.from_pretrained(currentModelRepoId, {
            revision: 'main', 
            progress_callback: (progressData: any) => {
                 if (progressData.status === 'progress') {
                    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { ...progressData, progress: 10 + (progressData.progress * 0.15), loadId } });
                 } else if (progressData.status === 'ready' || progressData.status === 'done') {
                     self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: progressData.file || 'tokenizer files', progress: 25, loadId } });
                 }
            }
        });

        const configJsonPath = quantFiles.find(f => f.endsWith('config.json'));
        if (!configJsonPath) {
            throw new Error(`config.json not found in manifest files for ${currentModelRepoId}/${currentModelQuantPath}`);
        }
        const configUrl = `https://huggingface.co/${currentModelRepoId}/resolve/main/${configJsonPath}`;
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: 'config.json', progress: 30, loadId } });
        const configResponse = await self.fetch(configUrl);
        if (!configResponse.ok) {
            throw new Error(`Failed to fetch model config.json from ${configUrl}: ${configResponse.statusText}`);
        }
        modelConfig = await configResponse.json();

        modelContextLength = modelConfig?.max_position_embeddings || modelConfig?.n_positions || 2048;
        if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] Model context length set to: ${modelContextLength}`);
        
        // Log model quantization type for debugging
        if (LOG_GENERAL) {
            const quantType = currentModelQuantPath ? 
                (currentModelQuantPath.includes('fp16') ? 'FP16' : 
                 currentModelQuantPath.includes('bnb4') ? 'BNB4' :
                 currentModelQuantPath.includes('int8') ? 'INT8' : 'Unknown') : 'Unknown';
            console.log(prefix, `[loadModelInternal] Model quantization type: ${quantType}`);
        }

        if (modelConfig) {
            if (tokenizer?.eos_token_id !== null && tokenizer?.eos_token_id !== undefined) {
                eosTokenId = tokenizer.eos_token_id;
            } else if (typeof modelConfig.eos_token_id === 'number') {
                eosTokenId = modelConfig.eos_token_id;
            } else if (Array.isArray((modelConfig as any).eos_token_ids) && typeof (modelConfig as any).eos_token_ids[0] === 'number') {
                eosTokenId = (modelConfig as any).eos_token_ids[0];
            } else if (modelConfig?.tokenizer_class?.includes("LlamaTokenizer")) {
                eosTokenId = 2;
            } else if (modelConfig?.tokenizer_class?.includes("GPT2Tokenizer")) {
                eosTokenId = 50256;
            }
            if (tokenizer && (tokenizer.pad_token_id === null || tokenizer.pad_token_id === undefined) && eosTokenId !== undefined) {
                tokenizer.pad_token_id = eosTokenId;
            }
        }

        numAttentionHeads = modelConfig?.num_attention_heads || modelConfig?.n_head || modelConfig?.num_heads;
        const hiddenSize = modelConfig?.hidden_size || modelConfig?.n_embd;
        numKeyValueHeads = modelConfig?.num_key_value_heads || numAttentionHeads;

        if (hiddenSize && numAttentionHeads) {
            headDim = modelConfig?.head_dim || hiddenSize / numAttentionHeads;
        }

        const onnxModelFile = currentModelQuantPath;
        const onnxModelUrl = `https://huggingface.co/${currentModelRepoId}/resolve/main/${onnxModelFile}`;
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Attempting to fetch ONNX model from: ${onnxModelUrl}`);
        const onnxModelResponse = await self.fetch(onnxModelUrl);
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] ONNX model fetch response: status=${onnxModelResponse.status}, statusText=${onnxModelResponse.statusText}, ok=${onnxModelResponse.ok}`);
        if (!onnxModelResponse.ok) {
            throw new Error(`Failed to fetch ONNX model ${onnxModelFile}: ${onnxModelResponse.statusText}`);
        }
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Converting response to ArrayBuffer...`);
        let onnxModelArrayBuffer: ArrayBuffer;
        try {
            onnxModelArrayBuffer = await onnxModelResponse.arrayBuffer();
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] ArrayBuffer created successfully, size: ${onnxModelArrayBuffer.byteLength} bytes`);
        } catch (arrayBufferError) {
            if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Error converting response to ArrayBuffer:`, arrayBufferError);
            throw arrayBufferError;
        }
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: onnxModelFile, progress: 70, loaded: onnxModelArrayBuffer.byteLength, total: onnxModelArrayBuffer.byteLength, loadId } });

        let externalDataConfig: { externalData?: any[] } = {};
        const onnxDataFilePattern = onnxModelFile.replace(/\.onnx$/, String.raw`\.onnx_data`);
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Looking for external data file with pattern: ${onnxDataFilePattern}`);
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Available quant files:`, quantFiles);
        const onnxDataFile = quantFiles.find(f => f.match(new RegExp(onnxDataFilePattern + '$')) || f.match(new RegExp(onnxModelFile + String.raw`.data` + '$')));
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Found external data file: ${onnxDataFile}`);

        if (onnxDataFile) {
            const onnxDataUrl = `https://huggingface.co/${currentModelRepoId}/resolve/main/${onnxDataFile}`;
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Attempting to fetch ONNX external data from: ${onnxDataUrl}`);
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: onnxDataFile, progress: 75, loadId } });
            const onnxDataResponse = await self.fetch(onnxDataUrl);
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] ONNX external data fetch response: status=${onnxDataResponse.status}, statusText=${onnxDataResponse.statusText}, ok=${onnxDataResponse.ok}`);
            if (!onnxDataResponse.ok) {
                throw new Error(`Failed to fetch ONNX external data ${onnxDataFile}: ${onnxDataResponse.statusText}`);
            }
            const onnxDataArrayBuffer = await onnxDataResponse.arrayBuffer();
            const onnxDataName = onnxDataFile.split('/').pop() || onnxDataFile;
            
            if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] External data file: ${onnxDataFile}, name: ${onnxDataName}, size: ${onnxDataArrayBuffer.byteLength} bytes`);
            
            externalDataConfig.externalData = [{ path: onnxDataName, data: onnxDataArrayBuffer }];
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: onnxDataFile, progress: 85, loaded: onnxDataArrayBuffer.byteLength, total: onnxDataArrayBuffer.byteLength, loadId } });
        }

        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: 'session', progress: 90, loadId } });
        const ortSessionOptions: any = {
            executionProviders: hasWebGPU ? ['webgpu', 'wasm'] : ['wasm'],
            graphOptimizationLevel: 'all',
        };
        if (inferenceSettings.threads && inferenceSettings.threads > 0) {
            ortSessionOptions.intraOpNumThreads = inferenceSettings.threads;
            ortSessionOptions.interOpNumThreads = inferenceSettings.threads;
        }

        onnxSession = await ort.InferenceSession.create(onnxModelArrayBuffer, { ...ortSessionOptions, ...externalDataConfig });
        inputNames = onnxSession.inputNames;
        outputNames = onnxSession.outputNames;
        
        // Store input metadata for tensor type detection
        modelInputMetadata.clear();
        if (onnxSession.inputNames && onnxSession.inputNames.length > 0) {
            // Try to get input metadata from the session
            try {
                // Check if getInputMetadata method exists
                if (typeof onnxSession.getInputMetadata === 'function') {
                    const sessionMetadata = await onnxSession.getInputMetadata();
                    for (const [name, metadata] of Object.entries(sessionMetadata)) {
                        if (metadata && typeof metadata === 'object' && 'type' in metadata) {
                            modelInputMetadata.set(name, metadata as { type: string; dims: number[] });
                        }
                    }
                } else {
                    if (LOG_WARN) console.warn(prefix, '[loadModelInternal] getInputMetadata method not available, using fallback detection');
                }
            } catch (e) {
                if (LOG_WARN) console.warn(prefix, '[loadModelInternal] Could not get input metadata, using fallback detection:', e);
            }
        }

        let actualExecutionProvider = onnxSession.executionProvider;
        let providerNote: string | undefined = undefined;
        if (ortSessionOptions.executionProviders?.includes('webgpu') && actualExecutionProvider !== 'webgpu') {
            providerNote = 'WebGPU was requested but a different provider was used. Check console for ORT warnings.';
        }

        isModelReady = true;
        self.postMessage({
            type: WorkerEventNames.WORKER_READY,
            payload: { modelId, modelPath: dtype, task, executionProvider: actualExecutionProvider, warning: providerNote }
        });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'done', file: 'session', progress: 100, loadId } });
        await setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Downloaded);

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Error loading model ${modelId} (${dtype}):`, error);
        isModelReady = false;
        currentModelRepoId = null;
        currentModelQuantPath = null;
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model ${dtype}: ${error.message}` });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'error', file: dtype, error: error.message, loadId } });
        if (modelId && dtype) {
            try {
                await setManifestQuantStatus(modelId, dtype, QuantStatus.Failed);
            } catch (manifestError) {
                if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Failed to update manifest status on error:`, manifestError);
            }
        }
    } finally {
        currentLoadId = undefined; 
    }
}

async function generateInternal(payload: any): Promise<void> {
    // Feature flag: Use transformers.js implementation
    if (USE_TRANSFORMERS) {
        await generateTransformersResponse(payload);
        return;
    }
    
    if (!isModelReady || !onnxSession || !tokenizer || !modelConfig) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Model not ready or core components missing.');
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: 'Model not ready. Please load a model first.' } });
        return;
    }
    
    // Set generation state
    isGenerating = true;
    shouldStopGeneration = false;
    console.log(prefix, '[generateInternal] Generation started. isGenerating:', isGenerating, 'shouldStopGeneration:', shouldStopGeneration);
    
    const { chatId, messageId, messages, message, input } = payload;
    if (LOG_GENERATION) console.log(prefix, '[generateInternal] Received payload:', JSON.stringify(payload));

    try {
        const {
            temperature = 1.0, top_k = 0, top_p = 0.0, repetition_penalty = 1.0,
            do_sample = true, no_repeat_ngram_size = 0, max_new_tokens = 128,
            system_prompt = '', min_length = 0, max_length = 2048,
        } = inferenceSettings;

        let messagesForTemplate: Array<{role: string, content: string}> = [];
        if (system_prompt && typeof system_prompt === 'string' && system_prompt.trim().length > 0) {
            if (!(Array.isArray(messages) && messages.some(msg => msg.role === 'system'))) {
                messagesForTemplate.push({ role: 'system', content: system_prompt });
            }
        }
        if (Array.isArray(messages)) {
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] Received messages array from orchestrator:', messages.length, 'messages');
                messages.forEach((msg: any, i: number) => {
                    console.log(prefix, `[CHAT_HISTORY] Input msg[${i}]:`, {
                        role: msg.role,
                        content: msg.content ? msg.content.substring(0, 100) + '...' : 'NO CONTENT'
                    });
                });
            }
            messagesForTemplate.push(...messages);
        }
        else if (message) {
            if (LOG_CHAT_HISTORY) console.log(prefix, '[CHAT_HISTORY] Using single message:', message.substring(0, 100) + '...');
            messagesForTemplate.push({ role: 'user', content: message });
        }
        else if (input) {
            if (LOG_CHAT_HISTORY) console.log(prefix, '[CHAT_HISTORY] Using input:', input.substring(0, 100) + '...');
            messagesForTemplate.push({ role: 'user', content: input });
        }

        const effectiveMaxLength = Math.min(max_length, modelContextLength);

        let promptTokenIds;
        while (true) {
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] Final messages for tokenization:', messagesForTemplate.length, 'messages');
                messagesForTemplate.forEach((msg: any, i: number) => {
                    console.log(prefix, `[CHAT_HISTORY] Tokenization msg[${i}]:`, {
                        role: msg.role,
                        content: msg.content ? msg.content.substring(0, 100) + '...' : 'NO CONTENT'
                    });
                });
            }
            const tokenIdsTensor = tokenizer.apply_chat_template(messagesForTemplate, { tokenize: true, add_generation_prompt: true });
            promptTokenIds = tokenIdsTensor.tolist().flat();
            
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] Tokenization result:', {
                    promptTokens: promptTokenIds.length,
                    effectiveMaxLength: effectiveMaxLength,
                    modelContextLength: modelContextLength,
                    maxLength: max_length
                });
            }
            
            if (promptTokenIds.length < effectiveMaxLength) {
                break;
            }

            // Context is too long, need to trim intelligently
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] Context too long, trimming content intelligently');
                console.log(prefix, '[CHAT_HISTORY] Before trimming:', messagesForTemplate.length, 'messages,', promptTokenIds.length, 'tokens');
            }
            
            // Smart content trimming: preserve structure but trim content
            const targetTokens = Math.floor(effectiveMaxLength * 0.8); // Use 80% of limit for safety
            const systemPrompt = messagesForTemplate[0];
            const lastUserMessage = messagesForTemplate[messagesForTemplate.length - 1];
            const middleMessages = messagesForTemplate.slice(1, -1);
            
            // Calculate tokens for system prompt and last user message
            const systemTokens = tokenizer.encode(systemPrompt.content).length;
            const lastUserTokens = tokenizer.encode(lastUserMessage.content).length;
            const reservedTokens = systemTokens + lastUserTokens + 100; // 100 tokens buffer
            
            let availableTokens = targetTokens - reservedTokens;
            
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] Token budget:', {
                    targetTokens,
                    systemTokens,
                    lastUserTokens,
                    reservedTokens,
                    availableTokens
                });
            }
            
            // Trim middle messages to fit within available tokens
            const trimmedMessages = [];
            let usedTokens = 0;
            
            for (let i = 0; i < middleMessages.length; i++) {
                const msg = middleMessages[i];
                const msgTokens = tokenizer.encode(msg.content).length;
                
                if (usedTokens + msgTokens <= availableTokens) {
                    // Message fits, add it as-is
                    trimmedMessages.push(msg);
                    usedTokens += msgTokens;
                } else {
                    // Message too long, trim it
                    const remainingTokens = availableTokens - usedTokens;
                    if (remainingTokens > 50) { // Only add if we have meaningful space left
                        const trimmedContent = tokenizer.decode(tokenizer.encode(msg.content).slice(0, remainingTokens - 10)) + '...';
                        trimmedMessages.push({
                            ...msg,
                            content: trimmedContent
                        });
                    }
                    break; // Stop adding more messages
                }
            }
            
            // Reconstruct messages: system + trimmed middle + last user message
            messagesForTemplate = [systemPrompt, ...trimmedMessages, lastUserMessage];
            
            if (LOG_CHAT_HISTORY) {
                console.log(prefix, '[CHAT_HISTORY] After intelligent trimming:', messagesForTemplate.length, 'messages');
                messagesForTemplate.forEach((msg, i) => {
                    console.log(prefix, `[CHAT_HISTORY] Trimmed msg[${i}]:`, {
                        role: msg.role,
                        content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
                    });
                });
            }
            
            // Re-tokenize to check if we're now within limits
            const newTokenIdsTensor = tokenizer.apply_chat_template(messagesForTemplate, { tokenize: true, add_generation_prompt: true });
            promptTokenIds = newTokenIdsTensor.tolist().flat();
        }
        
        if (LOG_GENERATION) console.log(prefix, '[generateInternal] Correctly tokenized prompt IDs:', promptTokenIds);

        const generatedTokenIds: number[] = [];
        const maxLen = Math.min(effectiveMaxLength, promptTokenIds.length + max_new_tokens);
        const minLen = Math.max(min_length, promptTokenIds.length + 1);

        if (eosTokenId === undefined) {
            if (LOG_WARN) console.warn(prefix, '[generateInternal] EOS token ID is not set.');
        }
        if (LOG_GENERATION) console.log(prefix, `[generateInternal] Starting generation. EOS: ${eosTokenId}, MaxLen: ${maxLen}, MinLen: ${minLen}`);
        
        let pastKeyValues: Record<string, ort.Tensor> | null = null;

        for (let i = 0; i < max_new_tokens; i++) {
            // Check if generation should be stopped
            if (shouldStopGeneration) {
                console.log(prefix, '[generateInternal] Generation stopped by user request at iteration', i);
                break;
            }
            
            const currentSequenceLength = promptTokenIds.length + generatedTokenIds.length;
            if (currentSequenceLength >= maxLen) {
                if (LOG_GENERATION) console.log(prefix, '[generateInternal] Max length reached.');
                break;
            }
            
            if (LOG_GENERATION) console.log(prefix, `[generateInternal] Generation step ${i + 1}/${max_new_tokens}, sequence length: ${currentSequenceLength}`);

            const feeds: Record<string, ort.Tensor> = {};
            let inputIds: number[];
            if (i === 0) {
                inputIds = promptTokenIds;
            } else {
                inputIds = [generatedTokenIds[generatedTokenIds.length - 1]];
            }

            const inputIdsName = inputNames.find(name => name === 'input_ids');
            if (!inputIdsName) throw new Error("Model's ONNX graph does not have an 'input_ids' input.");
            feeds[inputIdsName] = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, inputIds.length]);
            
            const attentionMaskName = inputNames.find(name => name === 'attention_mask');
            if (attentionMaskName) {
                const fullSeqLen = (i === 0) ? inputIds.length : (pastKeyValues?.[Object.keys(pastKeyValues)[0]]?.dims[2] ?? 0) + 1;
                feeds[attentionMaskName] = new ort.Tensor('int64', BigInt64Array.from(Array(fullSeqLen).fill(1n)), [1, fullSeqLen]);
            }
            
            const positionIdsName = inputNames.find(name => name === 'position_ids');
            if (positionIdsName) {
                const positions = (i === 0) ? Array.from({ length: inputIds.length }, (_, k) => BigInt(k)) : [BigInt(currentSequenceLength - 1)];
                feeds[positionIdsName] = new ort.Tensor('int64', BigInt64Array.from(positions), [1, positions.length]);
            }

            if (i === 0) {
                if (numKeyValueHeads && headDim) {
                    // Get the expected tensor data type from the model's input metadata
                    const getTensorDataType = (inputName: string): string => {
                        // First, try to get the data type from the model's actual input metadata
                        const metadata = modelInputMetadata.get(inputName);
                        if (metadata && metadata.type) {
                            // Convert ONNX type to ORT type
                            const onnxType = metadata.type.toLowerCase();
                            if (onnxType.includes('float16') || onnxType.includes('f16')) {
                                return 'float16';
                            } else if (onnxType.includes('float32') || onnxType.includes('f32') || onnxType.includes('float')) {
                                return 'float32';
                            }
                        }
                        
                        // Fallback: Check quantization type by examining the model path
                        const isFP16Model = currentModelQuantPath && (
                            currentModelQuantPath.includes('fp16') || 
                            currentModelQuantPath.includes('float16')
                        );
                        const isBNB4Model = currentModelQuantPath && (
                            currentModelQuantPath.includes('bnb4') || 
                            currentModelQuantPath.includes('bitsandbytes')
                        );
                        
                        // For attention-related tensors, use the appropriate precision
                        if (inputName.startsWith('past_key_values.') || inputName.includes('attention')) {
                            if (isFP16Model) return 'float16';
                            if (isBNB4Model) return 'float32'; // BNB4 models typically use float32 for compatibility
                            return 'float32'; // Default
                        }
                        
                        return 'float32'; // Default fallback
                    };
                    
                    for (const name of inputNames) {
                        if (name.startsWith('past_key_values.')) {
                            const dataType = getTensorDataType(name);
                            if (LOG_GENERATION) console.log(prefix, `[generateInternal] Creating tensor for ${name} with data type: ${dataType}`);
                            
                            if (dataType === 'float16') {
                                feeds[name] = new ort.Tensor('float16', new Uint16Array(0), [1, numKeyValueHeads, 0, headDim]);
                            } else {
                                feeds[name] = new ort.Tensor('float32', new Float32Array(0), [1, numKeyValueHeads, 0, headDim]);
                            }
                        }
                    }
                }
            } else if (pastKeyValues) {
                for (const key in pastKeyValues) {
                    if (inputNames.includes(key)) feeds[key] = pastKeyValues[key];
                }
            }

            if (LOG_GENERATION) console.log(prefix, `[generateInternal] Running ONNX session with ${Object.keys(feeds).length} inputs`);
            
            const outputMap = await onnxSession!.run(feeds);
            
            // Check for stop request after ONNX session completes
            if (shouldStopGeneration) {
                console.log(prefix, '[generateInternal] Generation stopped by user request after ONNX session at iteration', i);
                break;
            }
            
            if (LOG_GENERATION) console.log(prefix, `[generateInternal] ONNX session completed, outputs: ${Object.keys(outputMap).join(', ')}`);
            
            const logitsOutputName = outputNames.find(name => name === 'logits');
            if (!logitsOutputName) throw new Error("Model's ONNX graph does not have a 'logits' output.");
            const logitsTensor = outputMap[logitsOutputName];
            const lastTokenLogits = logitsTensor.data.slice(-logitsTensor.dims[2]) as Float32Array;

            const nextTokenId = sample(lastTokenLogits, generatedTokenIds, {
                temperature, top_k, top_p, repetition_penalty, no_repeat_ngram_size, do_sample,
            });

            if (nextTokenId === undefined) {
                if (LOG_ERROR) console.error("Failed to determine next token ID. Breaking loop.");
                break;
            }

            // Check for stop request after token generation
            if (shouldStopGeneration) {
                console.log(prefix, '[generateInternal] Generation stopped by user request after token generation at iteration', i);
                break;
            }

            const newPastKeyValues: Record<string, ort.Tensor> = {};
            for (const name of outputNames) {
                if (name.startsWith('present.')) {
                    newPastKeyValues[name.replace('present.', 'past_key_values.')] = outputMap[name];
                }
            }
            if (Object.keys(newPastKeyValues).length > 0) pastKeyValues = newPastKeyValues;

            if (nextTokenId === eosTokenId && currentSequenceLength >= minLen) {
                if (LOG_GENERATION) console.log(prefix, '[generateInternal] EOS token detected.');
                break;
            }
            
            generatedTokenIds.push(nextTokenId);
            const decodedProgressToken = tokenizer.decode([nextTokenId], { skip_special_tokens: true });
            if (decodedProgressToken) {
                self.postMessage({ type: WorkerEventNames.GENERATION_UPDATE, payload: { chatId, messageId, token: decodedProgressToken } });
            }
        }

        const finalGeneratedText = generatedTokenIds.length > 0 
            ? tokenizer.decode(generatedTokenIds, { skip_special_tokens: true })
            : "";

        if (LOG_GENERATION) console.log(prefix, '[generateInternal] Final generated text (decoded):', finalGeneratedText);
        
        // Send appropriate completion message based on whether generation was stopped
        console.log(prefix, '[generateInternal] Generation finished. shouldStopGeneration:', shouldStopGeneration, 'finalGeneratedText length:', finalGeneratedText.length);
        if (shouldStopGeneration) {
            console.log(prefix, '[generateInternal] Sending GENERATION_STOPPED message');
            self.postMessage({ type: WorkerEventNames.GENERATION_STOPPED, payload: { ...payload, output: finalGeneratedText, generatedText: finalGeneratedText } });
        } else {
            console.log(prefix, '[generateInternal] Sending GENERATION_COMPLETE message');
            self.postMessage({ type: WorkerEventNames.GENERATION_COMPLETE, payload: { ...payload, output: finalGeneratedText, generatedText: finalGeneratedText } });
        }

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Error during generation:', error, error.stack);
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: error.message || String(error) } });
    } finally {
        // Reset generation state
        console.log(prefix, '[generateInternal] Resetting generation state. isGenerating: false, shouldStopGeneration: false');
        isGenerating = false;
        shouldStopGeneration = false;
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = (event.data || {}) as { type: string; payload: any; };
    switch (type) {
        case WorkerEventNames.SET_BASE_URL:
            return;
        case WorkerEventNames.SET_ENV_CONFIG:
            envConfig = { ...envConfig, ...payload };
            break;
        case WorkerEventNames.INFERENCE_SETTINGS_UPDATE: {
            const settings = await getInferenceSettings();
            if(settings) {
                inferenceSettings = { ...inferenceSettings, ...settings };
            }
            break;
        }
        case WorkerEventNames.INIT: {
            const { modelId, dtype, task, loadId } = payload;
            if (!modelId) {
                if(LOG_ERROR) console.error(prefix, `[onmessage] INIT event missing modelId. Payload:`, payload);
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Model ID missing in INIT event.` });
                return;
            }
            

            if (!dtype) {
                if(LOG_ERROR) console.error(prefix, `[onmessage] INIT event missing dtype for non-Google model. Payload:`, payload);
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Dtype missing in INIT event for non-Google model.` });
                return;
            }
            
            await loadModelInternal({ modelId, dtype, task, loadId });
            return;
        }
        case WorkerEventNames.GENERATE:
            await generateInternal(payload);
            break;
        case WorkerEventNames.STOP_GENERATION:
            console.log(prefix, '[onmessage] STOP_GENERATION message received. isGenerating:', isGenerating, 'shouldStopGeneration:', shouldStopGeneration);
            if (isGenerating) {
                shouldStopGeneration = true;
                console.log(prefix, '[onmessage] Stop generation flag set to true.');
            } else {
                console.log(prefix, '[onmessage] Stop generation requested but not currently generating.');
            }
            break;
        case WorkerEventNames.RESET:
            if (onnxSession) {
                try { await onnxSession.release(); } catch(e) { if (LOG_WARN) console.warn(prefix, "Error releasing ONNX session on reset:", e); }
            }
            onnxSession = null; tokenizer = null; modelConfig = null;
            inputNames = []; outputNames = []; isModelReady = false;
            currentModelRepoId = null; currentModelQuantPath = null; currentTask = null;
            numAttentionHeads = undefined; numKeyValueHeads = undefined; headDim = undefined; eosTokenId = undefined;
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            if (LOG_GENERAL) console.log(prefix, "Model worker reset complete.");
            break;
        case WorkerEventNames.HUGGINGFACE_LOGIN:
            await handleHuggingFaceLogin(payload);
            break;
        case WorkerEventNames.HUGGINGFACE_LOGOUT:
            await handleHuggingFaceLogout();
            break;
        case WorkerEventNames.MODEL_SOURCE_SELECTION:
            await handleModelSourceSelection(payload);
            break;
        case WorkerEventNames.GOOGLE_TERMS_ACCEPTED:
            // Google authentication removed
            self.postMessage({ type: WorkerEventNames.ERROR, payload: 'Google authentication is no longer supported.' });
            break;
        default:
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Unknown message type: ${type}` });
            break;
    }
};




async function setManifestQuantStatus(repo: string, quant: string, status: QuantStatus) {
  let manifest = await getManifestEntry(repo);
  if (!manifest) return;
  if (!manifest.quants[quant]) {
    manifest.quants[quant] = { files: [], status, dtype: 'fp32', hasExternalData: false }; // Default values for modelworker-created entries
  } else {
    manifest.quants[quant].status = status;
  }
  await addManifestEntry(repo, manifest);
  self.postMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
}

function createEmptyGenerationConfig(): Response {
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function argMax(array: Float32Array | number[]): number {
    if (array.length === 0) return -1;
    let max = array[0];
    let maxIndex = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[i] > max) {
            maxIndex = i;
            max = array[i];
        }
    }
    return maxIndex;
}

function softmax(logits: Float32Array): Float32Array {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return new Float32Array(exps.map(e => e / sumExps));
}

function sample(logits: Float32Array, generatedIds: number[], options: {
    temperature: number,
    top_k: number,
    top_p: number,
    repetition_penalty: number,
    no_repeat_ngram_size: number,
    do_sample: boolean,
}): number {
    const { temperature, top_k, top_p, repetition_penalty, no_repeat_ngram_size, do_sample } = options;
    const processedLogits = new Float32Array(logits);

    if (repetition_penalty !== 1.0) {
        const penalizedSet = new Set(generatedIds);
        for (const tokenId of penalizedSet) {
            if (processedLogits[tokenId] > 0) processedLogits[tokenId] /= repetition_penalty;
            else processedLogits[tokenId] *= repetition_penalty;
        }
    }

    if (no_repeat_ngram_size > 0 && generatedIds.length >= no_repeat_ngram_size - 1) {
        const n = no_repeat_ngram_size;
        const lastTokens = generatedIds.slice(-(n - 1));
        const bannedTokens = new Set<number>();
        for (let i = 0; i <= generatedIds.length - n; ++i) {
            const ngram = generatedIds.slice(i, i + n);
            const context = ngram.slice(0, n - 1);
            if (context.every((val, idx) => val === lastTokens[idx])) {
                bannedTokens.add(ngram[n - 1]);
            }
        }
        for (const token of bannedTokens) {
            processedLogits[token] = -Infinity;
        }
    }

    if (temperature !== 1.0) {
        for (let i = 0; i < processedLogits.length; i++) {
            processedLogits[i] /= temperature;
        }
    }

    const logitsWithIndices = Array.from(processedLogits).map((value, index) => ({ value, index }))
        .filter(x => x.value !== -Infinity);
    logitsWithIndices.sort((a, b) => b.value - a.value);

    if (top_k > 0) {
        logitsWithIndices.splice(top_k);
    }
    
    if (top_p > 0 && top_p < 1.0) {
        const sortedLogits = Float32Array.from(logitsWithIndices.map(x => x.value));
        const probabilities = softmax(sortedLogits);
        
        let cumulativeProb = 0;
        let nucleusIndex = probabilities.length - 1;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProb += probabilities[i];
            if (cumulativeProb > top_p) {
                nucleusIndex = i;
                break;
            }
        }
        logitsWithIndices.splice(nucleusIndex + 1);
    }

    if (do_sample && logitsWithIndices.length > 1) {
        const finalLogits = Float32Array.from(logitsWithIndices.map(x => x.value));
        const probabilities = softmax(finalLogits);
        const randomVal = Math.random();
        let cumulativeProb = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProb += probabilities[i];
            if (randomVal <= cumulativeProb) {
                return logitsWithIndices[i].index;
            }
        }
        return logitsWithIndices[logitsWithIndices.length - 1].index;
    } else {
        if (logitsWithIndices.length > 0) {
            return logitsWithIndices[0].index;
        }
        return argMax(processedLogits);
    }
}



async function handleModelSourceSelection(payload: { modelId: string, source: string, dtype: string, task?: string, loadId?: string }) {
    const { modelId, source, dtype, task, loadId } = payload;
    
    // Store user's source preference
    await saveToIndexedDB('selected_model_source', new Blob([source], { type: 'text/plain' }));
    
    // Handle authentication based on source
    switch (source) {
        case 'huggingface':
            await handleHuggingFaceAuth(modelId, dtype, task, loadId);
            break;
        default:
            if (LOG_ERROR) console.error(prefix, `[handleModelSourceSelection] Unknown source: ${source}`);
            self.postMessage({
                type: WorkerEventNames.GENERATION_ERROR,
                payload: { error: `Unknown model source: ${source}` }
            });
    }
}

async function handleHuggingFaceAuth(modelId: string, dtype: string, task?: string, loadId?: string) {
    // Check if user is already authenticated
    const hfTokenBlob = await getFromIndexedDB('huggingface_token');
    const hfToken = hfTokenBlob ? await hfTokenBlob.text() : null;
    
    if (!hfToken) {
        // Show HuggingFace login dialog
        self.postMessage({
            type: UIEventNames.SHOW_HUGGINGFACE_LOGIN_DIALOG,
            payload: { modelId, modelPath: dtype, task, loadId }
        });
        return;
    }
    
    // Proceed with model loading
    await loadModelFromHuggingFace(modelId, dtype, task, loadId, hfToken);
}

async function handleHuggingFaceLogin(payload: { token: string, modelId: string, modelPath: string, task?: string, loadId?: string }) {
    const { token, modelId, modelPath: dtype, task, loadId } = payload;
    
    // Store the token
    await saveToIndexedDB('huggingface_token', new Blob([token], { type: 'text/plain' }));
    
    // Proceed with model loading
    await loadModelFromHuggingFace(modelId, dtype, task, loadId, token);
}

async function handleHuggingFaceLogout() {
    // Remove the token
    await saveToIndexedDB('huggingface_token', new Blob([''], { type: 'text/plain' }));
    if (LOG_GENERAL) console.log(prefix, '[handleHuggingFaceLogout] HuggingFace token removed');
}




async function loadModelFromHuggingFace(modelId: string, dtype: string, task?: string, loadId?: string, token?: string) {
    // Add token to your existing fetch interceptor
    if (token) {
        // Update your fetch interceptor to include the token
        // This will be handled in your existing fetch logic
    }
    
    // MediaPipe model loading removed
    self.postMessage({ type: WorkerEventNames.ERROR, payload: 'MediaPipe model loading is no longer supported.' });
}




// ============================================================================
// TRANSFORMERS.JS IMPLEMENTATION
// ============================================================================


function filterScrapedContent(messages: Array<{role: string, content: string}>): Array<{role: string, content: string}> {
    if (LOG_TRANSFORMERS) {
        console.log(prefix, `[filterScrapedContent] Processing ${messages.length} messages`);
    }
    
    return messages.map((msg, index) => {
        let content = msg.content.trim();
        let isJsonContent = false;
        let jsonData = null;
        
        // Check for markdown-wrapped JSON (```json ... ```)
        if (content.startsWith('```json') && content.endsWith('```')) {
            try {
                const jsonStart = content.indexOf('```json') + 7; // Skip ```json
                const jsonEnd = content.lastIndexOf('```');
                const jsonString = content.substring(jsonStart, jsonEnd).trim();
                jsonData = JSON.parse(jsonString);
                isJsonContent = true;
                
                if (LOG_TRANSFORMERS) {
                    console.log(prefix, `[filterScrapedContent] Detected markdown-wrapped JSON in message ${index}`);
                }
            } catch (error) {
                // If JSON parsing fails, treat as regular content
                if (LOG_TRANSFORMERS) {
                    console.log(prefix, `[filterScrapedContent] Failed to parse markdown-wrapped JSON in message ${index}:`, error);
                }
            }
        }
        // Check for direct JSON (starts with { and ends with })
        else if (content.startsWith('{') && content.endsWith('}')) {
            try {
                jsonData = JSON.parse(content);
                isJsonContent = true;
                
                if (LOG_TRANSFORMERS) {
                    console.log(prefix, `[filterScrapedContent] Detected direct JSON in message ${index}`);
                }
            } catch (error) {
                // If JSON parsing fails, treat as regular content
                if (LOG_TRANSFORMERS) {
                    console.log(prefix, `[filterScrapedContent] Failed to parse direct JSON in message ${index}:`, error);
                }
            }
        }
        
        if (LOG_TRANSFORMERS) {
            console.log(prefix, `[filterScrapedContent] Message ${index}:`, {
                role: msg.role,
                isJson: isJsonContent,
                contentLength: msg.content.length,
                contentPreview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
            });
        }
        
        // Check for scraped data patterns
        const isScrapedData = isJsonContent && jsonData && (
            jsonData.method === "tempTabExecuteScript" ||
            jsonData.extractedAt ||
            jsonData.wordCount ||
            jsonData.readingTime ||
            jsonData.segments ||
            jsonData.images ||
            jsonData.links
        );
        
        if (isScrapedData) {
            if (LOG_TRANSFORMERS) {
                console.log(prefix, `[filterScrapedContent] Detected scraped data in message ${index}:`, {
                    hasTitle: !!jsonData.title,
                    hasText: !!jsonData.text,
                    hasContent: !!jsonData.content,
                    hasUrl: !!jsonData.url,
                    hasImages: !!jsonData.images,
                    hasLinks: !!jsonData.links,
                    hasSegments: !!jsonData.segments,
                    originalLength: msg.content.length
                });
            }
            
            // Extract only essential fields
            const filteredContent = {
                title: jsonData.title || 'Untitled',
                text: jsonData.text || jsonData.content || '',
                url: jsonData.url || ''
            };
            
            const newContent = `Title: ${filteredContent.title}\nURL: ${filteredContent.url}\nContent: ${filteredContent.text}`;
            
            if (LOG_TRANSFORMERS) {
                console.log(prefix, `[filterScrapedContent] Filtered message ${index}:`, {
                    originalLength: msg.content.length,
                    newLength: newContent.length,
                    reduction: `${Math.round((1 - newContent.length / msg.content.length) * 100)}%`
                });
            }
            
            // Return clean, minimal content
            return {
                ...msg,
                content: newContent
            };
        }
        
        // Return original content if not scraped data
        return msg;
    });
}

/**
 * Load model using transformers.js (similar to the examples)
 */
async function loadTransformersModel(payload: { modelId: string, dtype: string, task?: string, loadId?: string }) {
    const { modelId, dtype, task, loadId } = payload;
    
    try {
        isTransformersModelLoading = true;
        currentLoadId = loadId;
        currentModelRepoId = modelId;
        
        console.log(prefix, `[loadTransformersModel] Loading: ${modelId}, dtype: ${dtype}`);
        
        // Validate dtype is one of the supported types
        const validDtypes = ['auto', 'fp32', 'fp16', 'q8', 'int8', 'uint8', 'q4', 'bnb4', 'q4f16', 'quantized'];
        const modelDtype = validDtypes.includes(dtype) ? dtype as any : 'auto';
        
        // Get hasExternalData from manifest
        const manifestEntry = await getManifestEntry(modelId);
        let hasExternalData = false;
        if (manifestEntry && manifestEntry.quants) {
            console.log(prefix, `[loadTransformersModel] Available quants in manifest:`, Object.keys(manifestEntry.quants));
            // Find the quant info for this dtype
            for (const [modelPath, quantInfo] of Object.entries(manifestEntry.quants)) {
                console.log(prefix, `[loadTransformersModel] Checking quant: ${modelPath}, dtype: ${quantInfo.dtype}, hasExternalData: ${quantInfo.hasExternalData}`);
                if (quantInfo.dtype === dtype) {
                    hasExternalData = quantInfo.hasExternalData || false;
                    console.log(prefix, `[loadTransformersModel] Found quant info for ${dtype}: hasExternalData=${hasExternalData} (from ${modelPath})`);
                    break;
                }
            }
        } else {
            console.log(prefix, `[loadTransformersModel] No manifest entry found for ${modelId}`);
        }
        
        // Load tokenizer and model (like the example)
        transformersTokenizer = await AutoTokenizer.from_pretrained(modelId, {
            progress_callback: (data: any) => {
                self.postMessage({ 
                    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                    payload: { ...data, file: "tokenizer", progress: 10 + (data.progress * 0.15), loadId } 
                });
            }
        });
        
        const modelOptions = {
            ...(modelDtype !== 'auto' && { dtype: modelDtype }),
            device: (hasWebGPU ? "webgpu" : "cpu") as "webgpu" | "cpu",
            use_external_data_format: hasExternalData,
            progress_callback: (data: any) => {
                self.postMessage({ 
                    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                    payload: { ...data, file: "model", progress: 30 + (data.progress * 0.6), loadId } 
                });
            }
        };
        
        console.log(prefix, `[loadTransformersModel] Calling AutoModelForCausalLM.from_pretrained with options:`, modelOptions);
        
        transformersModel = await AutoModelForCausalLM.from_pretrained(modelId, modelOptions);
        
        isTransformersModelReady = true;
        isTransformersModelLoading = false;
        
        console.log(prefix, `[loadTransformersModel] Model loaded successfully: ${modelId}`);
        
 
        self.postMessage({
            type: WorkerEventNames.WORKER_READY,
            payload: { modelId, modelPath: dtype, task, executionProvider: hasWebGPU ? 'webgpu' : 'cpu' }
        });
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { status: 'done', file: dtype, progress: 100, loadId } 
        });
        
    } catch (error: any) {
        isTransformersModelLoading = false;
        isTransformersModelReady = false;
        
        console.error(prefix, `[loadTransformersModel] Error loading model:`, error);
        self.postMessage({ 
            type: WorkerEventNames.ERROR, 
            payload: `Failed to load model ${dtype}: ${error.message}` 
        });
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { status: 'error', file: dtype, error: error.message, loadId } 
        });
    }
}

/**
 * Generate text using transformers.js (similar to the examples)
 */
async function generateTransformersResponse(payload: any) {
    const { messages, settings } = payload;
    
    if (LOG_TRANSFORMERS) {
        console.log(prefix, `[generateTransformersResponse] Starting generation with payload:`, payload);
        console.log(prefix, `[generateTransformersResponse] isTransformersModelReady:`, isTransformersModelReady);
        console.log(prefix, `[generateTransformersResponse] transformersTokenizer:`, !!transformersTokenizer);
        console.log(prefix, `[generateTransformersResponse] transformersModel:`, !!transformersModel);
    }
    
    if (!isTransformersModelReady || !transformersTokenizer || !transformersModel) {
        if (LOG_ERROR) console.error(prefix, '[generateTransformersResponse] Model not ready');
        self.postMessage({ 
            type: WorkerEventNames.GENERATION_ERROR, 
            payload: { ...payload, error: 'Model not ready. Please load a model first.' } 
        });
        return;
    }
    
    try {
        isGenerating = true;
        shouldStopGeneration = false;
        
        if (LOG_GENERAL) console.log(prefix, '[generateTransformersResponse] Starting generation');
        
        // Filter scraped content to reduce context size
        const filteredMessages = filterScrapedContent(messages);
        
        if (LOG_TRANSFORMERS) {
            console.log(prefix, `[generateTransformersResponse] Original messages:`, messages.length);
            console.log(prefix, `[generateTransformersResponse] Filtered messages:`, filteredMessages.length);
        }
        
        // Apply chat template with filtered messages
        const inputs = transformersTokenizer.apply_chat_template(filteredMessages, {
            add_generation_prompt: true,
            return_dict: true,
        });
        
        // Accumulate the full generated text for the completion event
        let fullGeneratedText = '';
        
        // Create streamer for incremental updates
        const streamer = new TextStreamer(transformersTokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (output: string) => {
                // Accumulate the full text
                fullGeneratedText += output;
                
                // Send incremental updates - use same format as original ONNX code
                // Don't log every token to reduce spam
                self.postMessage({
                    type: WorkerEventNames.GENERATION_UPDATE,
                    payload: { chatId: payload.chatId, messageId: payload.messageId, token: output }
                });
            }
        });
        
        // Generate with the model
        const result = await transformersModel.generate({
            ...inputs,
            do_sample: true,
            top_k: 3,
            temperature: 0.2,
            max_new_tokens: 512,
            streamer: streamer,
        });
        
        // Only log the final completion, not every token
        if (LOG_TRANSFORMERS) console.log(prefix, `[generateTransformersResponse] Generation completed successfully`);
        
        // Send appropriate completion event based on whether generation was stopped
        if (shouldStopGeneration) {
            console.log(prefix, '[generateTransformersResponse] Sending GENERATION_STOPPED message');
            self.postMessage({
                type: WorkerEventNames.GENERATION_STOPPED,
                payload: { ...payload, output: fullGeneratedText, generatedText: fullGeneratedText }
            });
        } else {
            console.log(prefix, '[generateTransformersResponse] Sending GENERATION_COMPLETE message');
            self.postMessage({
                type: WorkerEventNames.GENERATION_COMPLETE,
                payload: { ...payload, output: fullGeneratedText, generatedText: fullGeneratedText }
            });
        }
        
    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, '[generateTransformersResponse] Error during generation:', error);
        self.postMessage({ 
            type: WorkerEventNames.GENERATION_ERROR, 
            payload: { ...payload, error: error.message || 'Generation failed' } 
        });
    } finally {
        isGenerating = false;
    }
}