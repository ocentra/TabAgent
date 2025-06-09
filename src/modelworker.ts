/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
export {};

import { env, AutoTokenizer, pipeline, AutoModelForCausalLM, Tensor } from './assets/onnxruntime-web/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';
import {  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, addQuantToManifest,  QuantStatus, getInferenceSettings } from './DB/idbModel';
import type { ManifestEntry } from './DB/idbModel';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings } from './Controllers/InferenceSettings';
import { MESSAGE_EVENT } from './Utilities/eventConstants';
import ort from 'onnxruntime-web';

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

    rewrittenUrl = await rewriteOnnxFilePath(rewrittenUrl, resourceFileName, files);
    rewrittenUrl = await rewriteSupportingFilePath(rewrittenUrl, resourceFileName, files);

    return rewrittenUrl;
}

async function rewriteOnnxFilePath(resourceUrl: string, resourceFileName: string, files: string[]): Promise<string> {
    if (!resourceFileName.endsWith('.onnx')) {
        return resourceUrl;
    }

    const manifestOnnxFile = files.find(f => f.endsWith(resourceFileName));
    if (manifestOnnxFile && resourceUrl.endsWith(manifestOnnxFile)) {
        return resourceUrl;
    }

    const quantOnnxFile = files.find(f => f.endsWith('.onnx') && !f.endsWith('.onnx_data'));
    if (quantOnnxFile) {
        return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${quantOnnxFile}`);
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
        return null;
    }
    
    try {
        const cached = await getFromIndexedDB(resourceUrl);
        if (cached) {
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
    const { url: resourceUrl } = extractResourceUrl(input);

    if (resourceUrl) {
        const finalResourceUrl = await handleModelFileRewriting(resourceUrl);
        
        if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
            const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
            const fileName = finalResourceUrl.split('/').pop() || '';
            if (!configFiles.includes(fileName)) {
                return createEmptyGenerationConfig();
            }
        }
        
        if (finalResourceUrl.includes(ONNX_WASM_FILE_NAME)) {
            const wasmPath = await getOnnxWasmFilePath();
            return originalFetch.call(self, wasmPath, options);
        }

        const cachedResponse = await tryServeFromIndexedDB(finalResourceUrl);
        if (cachedResponse) {
            return cachedResponse;
        }

        if (finalResourceUrl.includes('/resolve/main/') || finalResourceUrl.includes('/resolve/')) {
            return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
        }
    }

    return originalFetch.call(self, input, options);
};

async function loadModelInternal(payload: { modelId: string, modelPath: string, task?: string, loadId?: string }): Promise<void> {
    await webgpuCheckPromise; 
    const { modelId, modelPath, task, loadId } = payload;
    if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] Starting to load. Model ID: ${modelId}, Quant Path: ${modelPath}, Task: ${task}, Load ID: ${loadId}`);

    currentLoadId = loadId;
    currentModelRepoId = modelId;
    currentModelQuantPath = modelPath;
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

    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'initiate', file: modelPath, progress: 0, loadId } });

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
        const onnxModelResponse = await self.fetch(onnxModelUrl);
        if (!onnxModelResponse.ok) {
            throw new Error(`Failed to fetch ONNX model ${onnxModelFile}: ${onnxModelResponse.statusText}`);
        }
        const onnxModelArrayBuffer = await onnxModelResponse.arrayBuffer();
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: onnxModelFile, progress: 70, loaded: onnxModelArrayBuffer.byteLength, total: onnxModelArrayBuffer.byteLength, loadId } });

        let externalDataConfig: { externalData?: any[] } = {};
        const onnxDataFilePattern = onnxModelFile.replace(/\.onnx$/, String.raw`\.onnx_data`);
        const onnxDataFile = quantFiles.find(f => f.match(new RegExp(onnxDataFilePattern + '$')) || f.match(new RegExp(onnxModelFile + String.raw`.data` + '$')));

        if (onnxDataFile) {
            const onnxDataUrl = `https://huggingface.co/${currentModelRepoId}/resolve/main/${onnxDataFile}`;
            self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'progress', file: onnxDataFile, progress: 75, loadId } });
            const onnxDataResponse = await self.fetch(onnxDataUrl);
            if (!onnxDataResponse.ok) {
                throw new Error(`Failed to fetch ONNX external data ${onnxDataFile}: ${onnxDataResponse.statusText}`);
            }
            const onnxDataArrayBuffer = await onnxDataResponse.arrayBuffer();
            const onnxDataName = onnxDataFile.split('/').pop();
            externalDataConfig.externalData = [{ name: onnxDataName, data: onnxDataArrayBuffer }];
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

        let actualExecutionProvider = onnxSession.executionProvider;
        let providerNote: string | undefined = undefined;
        if (ortSessionOptions.executionProviders?.includes('webgpu') && actualExecutionProvider !== 'webgpu') {
            providerNote = 'WebGPU was requested but a different provider was used. Check console for ORT warnings.';
        }

        isModelReady = true;
        self.postMessage({
            type: WorkerEventNames.WORKER_READY,
            payload: { modelId, modelPath, task, executionProvider: actualExecutionProvider, warning: providerNote }
        });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'done', file: 'session', progress: 100, loadId } });
        await setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Downloaded);

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Error loading model ${modelId} (${modelPath}):`, error);
        isModelReady = false;
        currentModelRepoId = null;
        currentModelQuantPath = null;
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model ${modelPath}: ${error.message}` });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'error', file: modelPath, error: error.message, loadId } });
        if (modelId && modelPath) {
            try {
                await setManifestQuantStatus(modelId, modelPath, QuantStatus.Failed);
            } catch (manifestError) {
                if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Failed to update manifest status on error:`, manifestError);
            }
        }
    } finally {
        currentLoadId = undefined; 
    }
}

async function generateInternal(payload: any): Promise<void> {
    if (!isModelReady || !onnxSession || !tokenizer || !modelConfig) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Model not ready or core components missing.');
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: 'Model not ready. Please load a model first.' } });
        return;
    }
    const { chatId, messageId, messages, message, input } = payload;
    if (LOG_GENERATION) console.log(prefix, '[generateInternal] Received payload:', JSON.stringify(payload));

    try {
        const {
            temperature = 1.0,
            top_k = 0,
            top_p = 0.0,
            repetition_penalty = 1.0,
            do_sample = true,
            no_repeat_ngram_size = 0,
            max_new_tokens = 128,
            system_prompt = '',
            min_length = 0,
            max_length = 2048,
        } = inferenceSettings;

        let messagesForTemplate: Array<{role: string, content: string}> = [];
        if (system_prompt && typeof system_prompt === 'string' && system_prompt.trim().length > 0) {
            if (!(Array.isArray(messages) && messages.some(msg => msg.role === 'system'))) {
                messagesForTemplate.push({ role: 'system', content: system_prompt });
            }
        }
        if (Array.isArray(messages)) messagesForTemplate.push(...messages);
        else if (message) messagesForTemplate.push({ role: 'user', content: message });
        else if (input) messagesForTemplate.push({ role: 'user', content: input });

        const promptTokenIdsTensor = tokenizer.apply_chat_template(messagesForTemplate, { tokenize: true, add_generation_prompt: true });
        const promptTokenIds = promptTokenIdsTensor.tolist().flat();
        if (LOG_GENERATION) console.log(prefix, '[generateInternal] Correctly tokenized prompt IDs:', promptTokenIds);

        const generatedTokenIds: number[] = [];
        const maxLen = Math.min(max_length, promptTokenIds.length + max_new_tokens);
        const minLen = Math.max(min_length, promptTokenIds.length + 1);

        if (eosTokenId === undefined) {
            if (LOG_WARN) console.warn(prefix, '[generateInternal] EOS token ID is not set.');
        }
        if (LOG_GENERATION) console.log(prefix, `[generateInternal] Starting generation. EOS: ${eosTokenId}, MaxLen: ${maxLen}, MinLen: ${minLen}`);
        
        let pastKeyValues: Record<string, ort.Tensor> | null = null;

        for (let i = 0; i < max_new_tokens; i++) {
            const currentSequenceLength = promptTokenIds.length + generatedTokenIds.length;
            if (currentSequenceLength >= maxLen) {
                if (LOG_GENERATION) console.log(prefix, '[generateInternal] Max length reached.');
                break;
            }

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
                    for (const name of inputNames) {
                        if (name.startsWith('past_key_values.')) {
                            feeds[name] = new ort.Tensor('float32', new Float32Array(0), [1, numKeyValueHeads, 0, headDim]);
                        }
                    }
                }
            } else if (pastKeyValues) {
                for (const key in pastKeyValues) {
                    if (inputNames.includes(key)) feeds[key] = pastKeyValues[key];
                }
            }

            const outputMap = await onnxSession!.run(feeds);
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

        const finalGeneratedText = tokenizer.decode(generatedTokenIds, { skip_special_tokens: true });
        if (LOG_GENERATION) console.log(prefix, '[generateInternal] Final generated text (decoded):', finalGeneratedText);
        self.postMessage({ type: WorkerEventNames.GENERATION_COMPLETE, payload: { ...payload, output: finalGeneratedText, generatedText: finalGeneratedText } });

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Error during generation:', error, error.stack);
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: error.message || String(error) } });
    }
}

let transformersPipeline: any = null;
let transformersTask: string | null = null;
let transformersModelId: string | null = null;
let transformersTokenizer: any = null;
let transformersModel: any = null;

async function loadModelWithTransformers(payload: { modelId: string, modelPath?: string, task?: string, loadId?: string }) {
    const { modelId, modelPath, task = 'text-generation', loadId } = payload;
    currentLoadId = loadId;
    transformersModelId = modelId;
    transformersTask = task;
    transformersModel = null;
    transformersTokenizer = null;
    transformersPipeline = null;

    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'initiate', file: modelId, progress: 0, loadId } });
    if (LOG_GENERAL) console.log(prefix, `[loadModelWithTransformers] Starting load for ${modelId}`);

    try {
        transformersTokenizer = await AutoTokenizer.from_pretrained(modelId, {
            progress_callback: (progressData: any) => {
                if (progressData.status === 'progress') {
                    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { ...progressData, progress: 10 + (progressData.progress * 0.4), loadId } });
                }
            }
        });
        if (LOG_GENERAL) console.log(prefix, `[loadModelWithTransformers] Tokenizer loaded.`);

        transformersModel = await AutoModelForCausalLM.from_pretrained(modelId, {
            progress_callback: (progressData: any) => {
                if (progressData.status === 'progress') {
                    self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { ...progressData, progress: 50 + (progressData.progress * 0.4), loadId } });
                }
            }
        });
        if (LOG_GENERAL) console.log(prefix, `[loadModelWithTransformers] Model loaded.`);

        transformersPipeline = await pipeline(task, modelId, { model: transformersModel, tokenizer: transformersTokenizer });
        if (LOG_GENERAL) console.log(prefix, `[loadModelWithTransformers] Pipeline created successfully.`);

        self.postMessage({ type: WorkerEventNames.WORKER_READY, payload: { modelId: transformersModelId, modelPath: modelPath || null, task: transformersTask } });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'done', file: 'transformers', progress: 100, loadId } });

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, `[loadModelWithTransformers] Error loading model ${modelId}:`, error.stack);
        transformersPipeline = null;
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `Failed to load model ${modelId}: ${error.message}` });
        self.postMessage({ type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, payload: { status: 'error', file: modelId, error: error.message, loadId } });
    } finally {
        currentLoadId = undefined;
    }
}

async function generateWithTransformers(payload: any): Promise<void> {
    if (!transformersPipeline || !transformersTokenizer) {
        if (LOG_ERROR) console.error(prefix, '[generateWithTransformers] Pipeline or tokenizer not ready.');
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: 'Model pipeline not ready. Please load a model first.' } });
        return;
    }

    const { chatId, messageId, messages } = payload;
    if (LOG_GENERATION) console.log(prefix, '[generateWithTransformers] Received payload:', JSON.stringify(payload));

    try {
        const {
            temperature = 1.0, top_k = 50, top_p = 1.0, repetition_penalty = 1.0,
            do_sample = true, max_new_tokens = 128, system_prompt = '',
        } = inferenceSettings;

        let messagesForTemplate: Array<{role: string, content: string}> = [];
        if (system_prompt && typeof system_prompt === 'string' && system_prompt.trim().length > 0) {
            messagesForTemplate.push({ role: 'system', content: system_prompt });
        }
        if (Array.isArray(messages)) {
            messagesForTemplate.push(...messages);
        } else {
            messagesForTemplate.push({ role: 'user', content: messages });
        }
        
        const promptString = transformersTokenizer.apply_chat_template(messagesForTemplate, { tokenize: false, add_generation_prompt: true });
        if (LOG_GENERATION) console.log(prefix, '[generateWithTransformers] Prompt for pipeline:', promptString);

        let fullOutputText = '';

        const streamer = {
            put(output: any) {
                if (!output || !output[0] || output[0].length === 0) return;
                const tokenId = Number(output[0][output[0].length - 1]);
                const decodedToken = transformersTokenizer.decode([tokenId], { skip_special_tokens: true });
                if (LOG_GENERATION) console.log(prefix, '[generateWithTransformers] Streamed token:', decodedToken);
                fullOutputText += decodedToken;
                self.postMessage({ type: WorkerEventNames.GENERATION_UPDATE, payload: { chatId, messageId, token: decodedToken } });
            },
            end() {
                if (LOG_GENERATION) console.log(prefix, '[generateWithTransformers] Stream finished. Final text:', fullOutputText);
                self.postMessage({ type: WorkerEventNames.GENERATION_COMPLETE, payload: { ...payload, output: fullOutputText, generatedText: fullOutputText, } });
            }
        };

        await transformersPipeline(promptString, {
            max_new_tokens, temperature, top_k, top_p, repetition_penalty, do_sample, streamer,
        });

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, '[generateWithTransformers] Error during generation:', error, error.stack);
        self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { ...payload, error: error.message || String(error) } });
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = (event.data || {}) as { type: string; payload: any; };
    switch (type) {
        case WorkerEventNames.SET_BASE_URL: {
            return;
        }
        case WorkerEventNames.SET_ENV_CONFIG: {
            envConfig = { ...envConfig, ...payload };
            break;
        }
        case WorkerEventNames.INFERENCE_SETTINGS_UPDATE: {
            const settings = await getInferenceSettings();
            if(settings) {
                inferenceSettings = { ...inferenceSettings, ...settings };
            }
            break;
        }
        case WorkerEventNames.INIT: {
            const { modelId, modelPath, task, loadId } = payload;
            if (!modelId || !modelPath) {
                if(LOG_ERROR) console.error(prefix, `[onmessage] INIT event missing modelId or modelPath. Payload:`, payload);
                self.postMessage({ type: WorkerEventNames.ERROR, payload: `Model ID or Quant Path missing in INIT event.` });
                return;
            }
            // Use manual ONNX path by default
            await loadModelInternal({ modelId, modelPath, task, loadId });
            return;
        }
        case WorkerEventNames.GENERATE: {
            // Use manual ONNX path by default
            await generateInternal(payload);
            break;
        }
        case WorkerEventNames.RESET: {
            if (onnxSession) {
                try { await onnxSession.release(); } catch(e) { if (LOG_WARN) console.warn(prefix, "Error releasing session on reset:", e); }
            }
            onnxSession = null; tokenizer = null; modelConfig = null;
            inputNames = []; outputNames = []; isModelReady = false;
            currentModelRepoId = null; currentModelQuantPath = null; currentTask = null;
            numAttentionHeads = undefined; numKeyValueHeads = undefined; headDim = undefined; eosTokenId = undefined;
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            if (LOG_GENERAL) console.log(prefix, "Model worker reset complete.");
            break;
        }
        default: {
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Unknown message type: ${type}` });
            break;
        }
    }
};

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