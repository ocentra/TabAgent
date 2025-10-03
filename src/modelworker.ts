/// <reference lib="dom" />
/* global RequestInfo, RequestInit */
export {};

import { env, AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria } from '@huggingface/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';
import {  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, addQuantToManifest,  QuantStatus, getInferenceSettings, CHUNK_SIZE, shouldChunkFile, saveChunkedFileSafe, getChunkInfo, assembleChunks, createStreamingResponseFromChunks } from './DB/idbModel';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings } from './Controllers/InferenceSettings';
import { MESSAGE_EVENT } from './Utilities/eventConstants';


const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();
const prefix = '[ModelWorker]';
// Core logging flags
const LOG_ERROR = true;   // Keep error logs enabled
const LOG_WARN = false;   // Disable warning logs

// CORE GENERATION FUNCTIONALITY (what we're focusing on)

const LOG_GEN_PARAMS = false;        // Generation parameters being used
const LOG_GEN_DETAILED = false;      // Detailed generation process logs
const LOG_GEN_COMPARISON = false;    // Parameter comparison logs
const LOG_GEN_ANALYSIS = false;      // Detailed analysis logs

// Legacy Q&A flags (for backward compatibility)
const LOG_QA_START = true;
const LOG_QA_OUTPUT = true;
const LOG_QA_STATS = true;

// Model loading and configuration
const LOG_MODEL_LOADING = false; // Disable model loading progress
const LOG_MODEL_CONFIG = false; // Disable detailed model configuration
const LOG_TOKEN_IDS = false;    // Disable token ID extraction

// Transformers.js specific
const LOG_TRANSFORMERS = false; // Disable transformers.js debugging
const LOG_TRANSFORMERS_SETTINGS = false; // Disable settings comparison
const LOG_GENERATION = false;   // Disable detailed generation parameters
const LOG_CACHE = false;        // Disable cache operations

// Network and storage
const LOG_FETCH = false;   // Disable fetch interception logs
const LOG_CHUNKED = false; // Disable chunked download logs 

// Message processing
const LOG_MESSAGES = false; 

// Legacy flags (for backward compatibility)
const LOG_GENERAL = false; 
const LOG_DEBUG = false;    

// Throttling for high-frequency manifest logs
let manifestLogCount = 0;
const MANIFEST_LOG_THROTTLE_INTERVAL = 5; // Log every 5 manifest updates

let currentLoadId: string | undefined = undefined;
let isGenerating = false;
let shouldStopGeneration = false;

let transformersTokenizer: any = null;
let transformersModel: any = null;

// Example-style global variables (like the working example)
const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: any = null;
let isTransformersModelReady = false;

// Model configuration variables (from workingmodelworker.ts)
let modelContextLength: number = 2048; // Default context length
let numAttentionHeads: number | undefined;
let numKeyValueHeads: number | undefined;
let headDim: number | undefined;

/**
 * Log all supported transformers.js generate parameters for debugging
 */
function logSupportedTransformersParameters() {
    if (LOG_TRANSFORMERS_SETTINGS) {
        if (LOG_TRANSFORMERS) {
        console.log(prefix, '[Transformers.js] Supported generate() parameters:');
        console.log(prefix, '[Transformers.js] Core Generation Parameters:');
        console.log(prefix, '  - do_sample: boolean (whether to use sampling)');
        console.log(prefix, '  - temperature: number (sampling temperature)');
        console.log(prefix, '  - top_k: number (top-k sampling)');
        console.log(prefix, '  - top_p: number (nucleus sampling)');
        console.log(prefix, '  - repetition_penalty: number (penalty for repetition)');
        console.log(prefix, '  - max_new_tokens: number (maximum new tokens to generate)');
        console.log(prefix, '  - min_length: number (minimum length)');
        console.log(prefix, '  - max_length: number (maximum length)');
        console.log(prefix, '[Transformers.js] Advanced Parameters:');
        console.log(prefix, '  - no_repeat_ngram_size: number (prevent n-gram repetition)');
        console.log(prefix, '  - num_beams: number (beam search)');
        console.log(prefix, '  - diversity_penalty: number (beam search diversity)');
        console.log(prefix, '  - length_penalty: number (length penalty)');
        console.log(prefix, '  - early_stopping: boolean (early stopping)');
        console.log(prefix, '  - num_beam_groups: number (beam groups)');
        console.log(prefix, '  - penalty_alpha: number (contrastive search)');
        console.log(prefix, '[Transformers.js] Output Parameters:');
        console.log(prefix, '  - return_dict_in_generate: boolean (return dict)');
        console.log(prefix, '  - output_attentions: boolean (output attention)');
        console.log(prefix, '  - output_hidden_states: boolean (output hidden states)');
        console.log(prefix, '  - output_scores: boolean (output scores)');
        console.log(prefix, '  - use_cache: boolean (use KV cache)');
        console.log(prefix, '[Transformers.js] Token Parameters:');
        console.log(prefix, '  - pad_token_id: number (padding token)');
        console.log(prefix, '  - bos_token_id: number (beginning of sequence)');
        console.log(prefix, '  - eos_token_id: number (end of sequence)');
        console.log(prefix, '  - forced_bos_token_id: number (forced BOS)');
        console.log(prefix, '  - forced_eos_token_id: number (forced EOS)');
        console.log(prefix, '[Transformers.js] Special Parameters:');
        console.log(prefix, '  - streamer: BaseStreamer (for streaming output)');
        console.log(prefix, '  - stopping_criteria: StoppingCriteriaList (custom stopping)');
        console.log(prefix, '  - logits_processor: LogitsProcessorList (custom logits)');
        console.log(prefix, '[Transformers.js] Reference: https://huggingface.co/docs/transformers.js/en/api/generation/parameters');
        }
    }
}

// Log transformers.js imports to verify what we have available
if (LOG_TRANSFORMERS) {
    console.log(prefix, '[ModelWorker] transformers.js env:', env);
    console.log(prefix, '[ModelWorker] transformers.js AutoTokenizer:', AutoTokenizer);
    console.log(prefix, '[ModelWorker] transformers.js AutoModelForCausalLM:', AutoModelForCausalLM);
    console.log(prefix, '[ModelWorker] transformers.js TextStreamer:', TextStreamer);
    console.log(prefix, '[ModelWorker] transformers.js env.allowLocalModels:', env.allowLocalModels);
    console.log(prefix, '[ModelWorker] transformers.js env.allowRemoteModels:', env.allowRemoteModels);
    console.log(prefix, '[ModelWorker] transformers.js env keys:', Object.keys(env));
    
    logSupportedTransformersParameters();
    

    if (LOG_FETCH) {
        console.log(prefix, '[ModelWorker] transformers.js will use fetch interception for IndexedDB');
    }
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
let currentTask: string | null = null;
let envConfig: any = {};
let inferenceSettings: InferenceSettings = DEFAULT_INFERENCE_SETTINGS;


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
        
        const urlParts = resourceUrl.split('/');
        const fileName = urlParts.slice(urlParts.indexOf('main') + 1).join('/'); // Get everything after '/main/'
        const modelId = currentModelRepoId;
        
        if (LOG_DEBUG) console.log(prefix, `[tryServeFromIndexedDB] DEBUG - Extracted fileName: "${fileName}" from URL: ${resourceUrl}`);
        
        if (modelId) {
            const chunkedInfo = await getChunkInfo(modelId, fileName);
            if (chunkedInfo.isChunked && chunkedInfo.totalChunks && chunkedInfo.totalSize) {
                if (LOG_CHUNKED) console.log(prefix, `[tryServeFromIndexedDB] File is chunked: ${chunkedInfo.totalChunks} chunks, ${chunkedInfo.totalSize} bytes`);
                
                try {
                    // For files over 100MB, use streaming to avoid RAM issues
                    if (chunkedInfo.totalSize > 100 * 1024 * 1024) {
                        if (LOG_CHUNKED) console.log(prefix, `[tryServeFromIndexedDB] Large file detected (${chunkedInfo.totalSize} bytes), using streaming response`);
                        return await createStreamingResponseFromChunks(modelId, fileName, chunkedInfo.totalChunks, chunkedInfo.totalSize);
                    } else {
                        // For smaller chunked files, assemble in memory
                        const assembledBuffer = await assembleChunks(modelId, fileName, chunkedInfo.totalChunks, chunkedInfo.totalSize);
                        
                        const headers = new Headers();
                        if (resourceUrl.endsWith('.json')) {
                            headers.set('Content-Type', 'application/json');
                        } else {
                            headers.set('Content-Type', 'application/octet-stream');
                        }
                        headers.set('Content-Length', assembledBuffer.byteLength.toString());
                        
                        if (LOG_CHUNKED) console.log(prefix, `[tryServeFromIndexedDB] ✅ SERVING CHUNKED FILE: ${resourceUrl}, size: ${assembledBuffer.byteLength} bytes`);
                        return new Response(assembledBuffer, { headers });
                    }
                } catch (assembleError) {
                    if (LOG_ERROR) console.error(prefix, `[tryServeFromIndexedDB] Error assembling chunks for ${resourceUrl}:`, assembleError);
                    // Fall through to regular cache check
                }
            }
        }
        
        // Fall back to regular cache check
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
    
    // Send download start event (progress range: 0-25%)
    const fileName = resourceUrl.split('/').pop() || 'file';
    self.postMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
            status: 'downloading', 
            file: fileName, 
            progress: 0, 
            loadId: currentLoadId,
            message: `Starting download of ${fileName}...`
        } 
    });
    
    // Update manifest status to indicate download started
    if (currentModelRepoId && currentModelQuantPath && resourceUrl.includes('/resolve/main/')) {
        if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - Updating manifest status: repo="${currentModelRepoId}", dtype="${currentModelQuantPath}", status=Available`);
        try {
            await setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Available);
        } catch (manifestError) {
            if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Failed to update manifest status on download start:', manifestError);
        }
    }
    
    const resp = await originalFetch.call(self, fetchInput, options);
    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] Response: status=${resp.status}, statusText=${resp.statusText}, ok=${resp.ok}`);
    if (!resp.ok) {
        return resp;
    }

    // Get content length for progress tracking
    const contentLength = resp.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
    
    if (totalBytes && totalBytes > 0) {
        // Stream the response with progress tracking
        const reader = resp.body?.getReader();
        if (reader) {
            const chunks: Uint8Array[] = [];
            let receivedBytes = 0;
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    chunks.push(value);
                    receivedBytes += value.length;
                    
                    // Calculate progress percentage (map to 0-25% range for downloads)
                    const downloadProgress = Math.round((receivedBytes / totalBytes) * 25);
                    
                    // Send progress update every 5% or every 10MB
                    if (downloadProgress % 5 === 0 || receivedBytes % (10 * 1024 * 1024) === 0) {
                        self.postMessage({ 
                            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                            payload: { 
                                status: 'downloading', 
                                file: fileName, 
                                progress: downloadProgress, 
                                loadId: currentLoadId,
                                loaded: receivedBytes,
                                total: totalBytes,
                                message: `Downloading ${fileName}... ${Math.round((receivedBytes / totalBytes) * 100)}% (${(receivedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB)`
                            } 
                        });
                    }
                }
                
                // Reconstruct the response from chunks
                const allChunks = new Uint8Array(receivedBytes);
                let offset = 0;
                for (const chunk of chunks) {
                    allChunks.set(chunk, offset);
                    offset += chunk.length;
                }
                
                // Send download complete event (25% for download completion)
                self.postMessage({ 
                    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                    payload: { 
                        status: 'downloading', 
                        file: fileName, 
                        progress: 25, 
                        loadId: currentLoadId,
                        loaded: receivedBytes,
                        total: totalBytes,
                        message: `Downloaded ${fileName} (${(receivedBytes / 1024 / 1024).toFixed(1)}MB)`
                    } 
                });
                
                // Update manifest status to indicate download completed
                // Note: Manifest status will be updated by loadModelInternal when model loading completes
                
                // Create new response with the reconstructed body
                const blob = new Blob([allChunks]);
                const fileSize = blob.size;
                if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - File size detection (streaming): blob.size=${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
                
                // Check if file should be chunked (large files) - STREAMING PATH
                if (shouldChunkFile(fileSize)) {
                    if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Large file detected (${fileSize} bytes), will chunk: ${resourceUrl}`);
                    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - File size: ${fileSize}, CHUNK_SIZE: ${CHUNK_SIZE}, shouldChunk: ${shouldChunkFile(fileSize)}`);
                    
                    try {
                        await saveChunkedFileSafe(resourceUrl, blob, currentModelRepoId!);
                        if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved chunked file: ${resourceUrl}`);
                        
                        // Verify chunks were saved
                        const fileName = resourceUrl.split('/').slice(resourceUrl.split('/').indexOf('main') + 1).join('/');
                        const manifest = await getFromIndexedDB(`${currentModelRepoId}/${fileName}:manifest`);
                        if (manifest) {
                            const manifestData = await manifest.text();
                            const manifestObj = JSON.parse(manifestData);
                            if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Chunking verification: ${manifestObj.totalChunks} chunks saved for ${fileName}`);
                        } else {
                            if (LOG_ERROR) console.error(prefix, `[fetchFromNetworkAndCache] DEBUG - Chunking verification failed: No manifest found for ${fileName}`);
                        }
                    } catch (chunkError) {
                        if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Error saving chunked file:', resourceUrl, chunkError);
                        // Fall back to regular storage
                        await saveToDualIndexedDB(resourceUrl, blob, input);
                    }
                } else {
                    // Regular file storage - STREAMING PATH
                    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - Small file (${fileSize} bytes), using regular storage: ${resourceUrl}`);
                    try {
                        await saveToDualIndexedDB(resourceUrl, blob, input);
                        if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - Successfully saved regular file: ${resourceUrl}`);
                    } catch (dbError) {
                        if (LOG_ERROR) console.error(prefix, '[IDB TRACE] Error saving to IndexedDB:', resourceUrl, dbError);
                    }
                }
                
                return new Response(blob, {
                    status: resp.status,
                    statusText: resp.statusText,
                    headers: resp.headers
                });
                
            } finally {
                reader.releaseLock();
            }
        }
    }
    
    // Fallback: if we can't track progress, just download normally
    const blob = await resp.clone().blob();
    const fileSize = blob.size;
    if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - File size detection: blob.size=${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
    
    // Send download complete event (25% for download completion)
    self.postMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
            status: 'downloading', 
            file: fileName, 
            progress: 25, 
            loadId: currentLoadId,
            message: `Downloaded ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`
        } 
    });
    
    // Update manifest status to indicate download completed
    if (currentModelRepoId && currentModelQuantPath && resourceUrl.includes('/resolve/main/')) {
        try {
            await setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Downloaded);
        } catch (manifestError) {
            if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Failed to update manifest status on download complete:', manifestError);
        }
    }
    
    // Check if file should be chunked (large files)
    if (shouldChunkFile(fileSize)) {
        if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Large file detected (${fileSize} bytes), will chunk: ${resourceUrl}`);
        if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - File size: ${fileSize}, CHUNK_SIZE: ${CHUNK_SIZE}, shouldChunk: ${shouldChunkFile(fileSize)}`);
        
        try {
            await saveChunkedFileSafe(resourceUrl, blob, currentModelRepoId!);
            if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved chunked file: ${resourceUrl}`);
            
            // Verify chunks were saved

            const urlParts = resourceUrl.split('/');
            const fileName = urlParts.slice(urlParts.indexOf('main') + 1).join('/'); // Get everything after '/main/'
            const modelId = currentModelRepoId;
            if (modelId) {
                const manifestKey = `${modelId}/${fileName}:manifest`;
                const manifest = await getFromIndexedDB(manifestKey);
                if (manifest) {
                    const manifestData = await manifest.text();
                    const manifestObj = JSON.parse(manifestData);
                    if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Chunking verification: ${manifestObj.totalChunks} chunks saved for ${fileName}`);
                } else {
                    if (LOG_ERROR) console.error(prefix, `[fetchFromNetworkAndCache] DEBUG - Chunking verification failed: No manifest found for ${fileName}`);
                }
            }
        } catch (chunkError) {
            if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Error saving chunked file:', resourceUrl, chunkError);
            // Fall back to regular storage
            await saveToDualIndexedDB(resourceUrl, blob, input);
        }
    } else {
        // Regular file storage
        if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - Small file (${fileSize} bytes), using regular storage: ${resourceUrl}`);
        try {
            await saveToDualIndexedDB(resourceUrl, blob, input);
            if (LOG_DEBUG) console.log(prefix, `[fetchFromNetworkAndCache] DEBUG - Successfully saved regular file: ${resourceUrl}`);
        } catch (dbError) {
            if (LOG_ERROR) console.error(prefix, '[IDB TRACE] Error saving to IndexedDB:', resourceUrl, dbError);
        }
    }
    
    return resp;
}

self.fetch = async function(input: RequestInfo | URL, options?: RequestInit): Promise<Response> {
    const { url: resourceUrl } = extractResourceUrl(input);

    // Enhanced logging for transformers.js requests
    if (LOG_FETCH && resourceUrl && (resourceUrl.includes('huggingface.co') || resourceUrl.includes('/resolve/'))) {
        console.log(prefix, `[Custom Fetch] Transformers.js requesting: ${resourceUrl}`);
    }

    if (resourceUrl) {
        let finalResourceUrl = await handleModelFileRewriting(resourceUrl);
        if (LOG_DEBUG && resourceUrl.includes('model_q4f16.onnx')) {
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Original URL: ${resourceUrl}`);
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Final URL: ${finalResourceUrl}`);
        }
        

        if (currentModelQuantPath && currentModelQuantPath.includes('.onnx')) {
            const actualModelFile = currentModelQuantPath.split('/').pop(); // e.g., "model_q4f16.onnx"
            
            if (finalResourceUrl.includes('/model.onnx') || finalResourceUrl.includes('/model.onnx_data')) {
                const originalUrl = finalResourceUrl;
                finalResourceUrl = finalResourceUrl.replace('/model.onnx', `/${actualModelFile}`);
                finalResourceUrl = finalResourceUrl.replace('/model.onnx_data', `/${actualModelFile}`);
                if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Mapped ONNX request: ${originalUrl} -> ${finalResourceUrl}`);
            }
        }
        
        if (LOG_FETCH && finalResourceUrl !== resourceUrl) {
            console.log(prefix, `[Custom Fetch] URL rewritten: ${resourceUrl} -> ${finalResourceUrl}`);
        }
        
        if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
            const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
            const fileName = finalResourceUrl.split('/').pop() || '';
            if (!configFiles.includes(fileName)) {
                if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Creating empty generation config for: ${fileName}`);
                return createEmptyGenerationConfig();
            }
        }
        
        if (finalResourceUrl.includes(ONNX_WASM_FILE_NAME)) {
            const wasmPath = await getOnnxWasmFilePath();
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Serving ONNX WASM from: ${wasmPath}`);
            return originalFetch.call(self, wasmPath, options);
        }
        
        if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Checking IndexedDB cache for: ${finalResourceUrl}`);
        const cachedResponse = await tryServeFromIndexedDB(finalResourceUrl);
        if (cachedResponse) {
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ✅ SERVING FROM INDEXEDDB: ${finalResourceUrl}`);
            return cachedResponse;
        } else {
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ❌ CACHE MISS, will download: ${finalResourceUrl}`);
        }

        if (finalResourceUrl.includes('huggingface.co') || finalResourceUrl.includes('/resolve/')) {
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Downloading and caching HuggingFace file: ${finalResourceUrl}`);
            return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
        } else {
            if (LOG_DEBUG && resourceUrl.includes('model_q4f16.onnx')) {
                if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - HuggingFace condition NOT met for: ${finalResourceUrl}`);
                if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Contains 'huggingface.co': ${finalResourceUrl.includes('huggingface.co')}`);
                if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Contains '/resolve/': ${finalResourceUrl.includes('/resolve/')}`);
            }
        }
    }

    if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Using original fetch for: ${resourceUrl || 'non-URL request'}`);
    return originalFetch.call(self, input, options);
};


async function loadModelInternal(payload: { modelId: string, dtype: string, task?: string, loadId?: string }): Promise<void> {
    const { modelId, dtype, task, loadId } = payload;

    try {
    currentLoadId = loadId;
    currentModelRepoId = modelId;
    currentModelQuantPath = dtype;
        currentTask = task || null;
        
        if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] Loading: ${modelId}, dtype: ${dtype}`);
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] DEBUG - Full payload received:`, payload);
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] DEBUG - dtype type: ${typeof dtype}, value: "${dtype}"`);
        
        // Send initial progress message
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { status: 'initiate', file: dtype, progress: 0, loadId } 
        });
        
        
        const validDtypes = ['auto', 'fp32', 'fp16', 'q8', 'int8', 'uint8', 'q4', 'bnb4', 'q4f16', 'quantized'];
        const modelDtype = validDtypes.includes(dtype) ? dtype as any : 'auto';
        
        // Get hasExternalData from manifest
        const manifestEntry = await getManifestEntry(modelId);
        let hasExternalData = false;
        if (manifestEntry && manifestEntry.quants) {
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Available quants in manifest:`, Object.keys(manifestEntry.quants));
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] DEBUG - Looking for dtype: "${dtype}" in manifest entries`);
            
            // Find the quant info for this dtype
            for (const [modelPath, quantInfo] of Object.entries(manifestEntry.quants)) {
                if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] DEBUG - Checking quant: "${modelPath}", quantInfo.dtype: "${quantInfo.dtype}", hasExternalData: ${quantInfo.hasExternalData}`);
                if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] DEBUG - dtype comparison: "${quantInfo.dtype}" === "${dtype}" ? ${quantInfo.dtype === dtype}`);
                
                if (quantInfo.dtype === dtype) {
                    hasExternalData = quantInfo.hasExternalData || false;
                    if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] ✅ Found quant info for ${dtype}: hasExternalData=${hasExternalData} (from ${modelPath})`);
                    break;
                }
            }
        } else {
            if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] No manifest entry found for ${modelId}`);
        }
        
        // Load tokenizer and model with detailed progress tracking
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { 
                status: 'loading', 
                file: 'tokenizer', 
                progress: 10, 
                loadId,
                message: 'Loading tokenizer from cache...'
            } 
        });
        
        transformersTokenizer = await AutoTokenizer.from_pretrained(modelId, {
            progress_callback: (data: any) => {

                let progress = 10; 
                let status = 'loading';
                let message = 'Loading tokenizer from cache...';
                
                if (data.status === 'progress') {
                    progress = 25 + (data.progress * 0.15); // 25-40% range for tokenizer
                    status = 'loading';
                    message = `Loading tokenizer from cache... ${Math.round(progress)}%`;
                } else if (data.status === 'ready' || data.status === 'done') {
                    progress = 40;
                    status = 'done';
                    message = 'Tokenizer ready';
                }
                
                self.postMessage({ 
                    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                    payload: { 
                        status, 
                        file: data.file || 'tokenizer', 
                        progress, 
                        loadId,
                        loaded: data.loaded,
                        total: data.total,
                        message
                    } 
                });
            }
        });
        
        // Load model configuration to get context length and token IDs
        let modelConfig: any = null;
        try {
            const configUrl = `https://huggingface.co/${modelId}/resolve/main/config.json`;
            if (LOG_TRANSFORMERS) console.log(prefix, '[loadModelInternal] Loading model config from:', configUrl);
            const configResponse = await self.fetch(configUrl);
            if (configResponse.ok) {
                modelConfig = await configResponse.json();
        if (LOG_TRANSFORMERS) {
            if (LOG_MODEL_LOADING) console.log(prefix, '[loadModelInternal] Model config loaded:', {
                max_position_embeddings: modelConfig?.max_position_embeddings,
                n_positions: modelConfig?.n_positions,
                max_sequence_length: modelConfig?.max_sequence_length,
                n_ctx: modelConfig?.n_ctx,
                context_length: modelConfig?.context_length,
                eos_token_id: modelConfig?.eos_token_id,
                pad_token_id: modelConfig?.pad_token_id,
                bos_token_id: modelConfig?.bos_token_id,
                tokenizer_class: modelConfig?.tokenizer_class,
                num_attention_heads: modelConfig?.num_attention_heads,
                num_key_value_heads: modelConfig?.num_key_value_heads,
                hidden_size: modelConfig?.hidden_size,
                n_embd: modelConfig?.n_embd,
                head_dim: modelConfig?.head_dim,
                vocab_size: modelConfig?.vocab_size,
                model_type: modelConfig?.model_type,
                architectures: modelConfig?.architectures
            });
        }
            }
        } catch (configError) {
            if (LOG_ERROR) console.error(prefix, '[loadModelInternal] Failed to load model config:', configError);
        }
        

        const modelConfigContextLength = modelConfig?.max_position_embeddings || 
                                       modelConfig?.n_positions || 
                                       modelConfig?.max_sequence_length ||
                                       modelConfig?.n_ctx ||
                                       modelConfig?.context_length;
        
        // Get user's current settings as fallback
        const currentSettings = await getInferenceSettings();
        const userMaxLength = currentSettings?.max_length || DEFAULT_INFERENCE_SETTINGS.max_length;
        
        // Use model config if available, otherwise use user's setting
        modelContextLength = modelConfigContextLength || userMaxLength;
        if (LOG_TRANSFORMERS) console.log(prefix, '[loadModelInternal] Model context length extracted:', {
            modelConfigContextLength: modelConfigContextLength,
            userMaxLength: userMaxLength,
            final: modelContextLength,
            source: modelConfigContextLength ? 'model-config' : 'user-settings'
        });
        
        // Extract model architecture details and store globally
        numAttentionHeads = modelConfig?.num_attention_heads || modelConfig?.n_head || modelConfig?.num_heads;
        const hiddenSize = modelConfig?.hidden_size || modelConfig?.n_embd;
        numKeyValueHeads = modelConfig?.num_key_value_heads || numAttentionHeads;
        headDim = (hiddenSize && numAttentionHeads) ? (modelConfig?.head_dim || hiddenSize / numAttentionHeads) : undefined;
        
        if (LOG_TRANSFORMERS) console.log(prefix, '[loadModelInternal] Model architecture:', {
            numAttentionHeads,
            hiddenSize,
            numKeyValueHeads,
            headDim
        });
        
        // Extract token IDs from tokenizer and config with advanced fallback logic
        let eosTokenId: number | undefined = undefined;
        let padTokenId: number | undefined = undefined;
        let bosTokenId: number | undefined = undefined;
        
        if (transformersTokenizer) {
            // Try tokenizer first
            eosTokenId = transformersTokenizer.eos_token_id;
            padTokenId = transformersTokenizer.pad_token_id;
            bosTokenId = transformersTokenizer.bos_token_id;
            
            if (LOG_TRANSFORMERS) {
                if (LOG_TOKEN_IDS) console.log(prefix, '[loadModelInternal] Tokenizer token IDs:');
                if (LOG_TOKEN_IDS) console.log(prefix, '  eos_token_id:', eosTokenId);
                if (LOG_TOKEN_IDS) console.log(prefix, '  pad_token_id:', padTokenId);
                if (LOG_TOKEN_IDS) console.log(prefix, '  bos_token_id:', bosTokenId);
            }
        }
        
        // Fallback to model config if tokenizer doesn't have the IDs
        if (modelConfig) {
            if (eosTokenId === null || eosTokenId === undefined) {
                if (typeof modelConfig.eos_token_id === 'number') {
                    eosTokenId = modelConfig.eos_token_id;
                } else if (Array.isArray(modelConfig.eos_token_ids) && typeof modelConfig.eos_token_ids[0] === 'number') {
                    eosTokenId = modelConfig.eos_token_ids[0];
                } else if (modelConfig?.tokenizer_class?.includes("LlamaTokenizer")) {
                    eosTokenId = 2;
                } else if (modelConfig?.tokenizer_class?.includes("GPT2Tokenizer")) {
                    eosTokenId = 50256;
                }
            }
            
            if (padTokenId === null || padTokenId === undefined) {
                padTokenId = modelConfig.pad_token_id;
            }
            
            if (bosTokenId === null || bosTokenId === undefined) {
                bosTokenId = modelConfig.bos_token_id;
            }
            
            if (LOG_TRANSFORMERS) {
                if (LOG_TOKEN_IDS) console.log(prefix, '[loadModelInternal] Final token IDs after fallback:');
                if (LOG_TOKEN_IDS) console.log(prefix, '  eos_token_id:', eosTokenId);
                if (LOG_TOKEN_IDS) console.log(prefix, '  pad_token_id:', padTokenId);
                if (LOG_TOKEN_IDS) console.log(prefix, '  bos_token_id:', bosTokenId);
            }
        }
        
        // 3. Fallback to user settings if still not set
        if (eosTokenId === null || eosTokenId === undefined) {
            const userEosTokenId = currentSettings?.eos_token_id ?? DEFAULT_INFERENCE_SETTINGS.eos_token_id;
            eosTokenId = userEosTokenId !== null ? userEosTokenId : undefined;
        }
        if (padTokenId === null || padTokenId === undefined) {
            const userPadTokenId = currentSettings?.pad_token_id ?? DEFAULT_INFERENCE_SETTINGS.pad_token_id;
            padTokenId = userPadTokenId !== null ? userPadTokenId : undefined;
        }
        if (bosTokenId === null || bosTokenId === undefined) {
            const userBosTokenId = currentSettings?.bos_token_id ?? DEFAULT_INFERENCE_SETTINGS.bos_token_id;
            bosTokenId = userBosTokenId !== null ? userBosTokenId : undefined;
        }
        
        if (LOG_TRANSFORMERS) {
            if (LOG_TOKEN_IDS) console.log(prefix, '[loadModelInternal] Final token IDs after user settings fallback:');
            if (LOG_TOKEN_IDS) console.log(prefix, '  eos_token_id:', eosTokenId, '(source:', eosTokenId === currentSettings?.eos_token_id ? 'user-settings' : 'model/tokenizer', ')');
            if (LOG_TOKEN_IDS) console.log(prefix, '  pad_token_id:', padTokenId, '(source:', padTokenId === currentSettings?.pad_token_id ? 'user-settings' : 'model/tokenizer', ')');
            if (LOG_TOKEN_IDS) console.log(prefix, '  bos_token_id:', bosTokenId, '(source:', bosTokenId === currentSettings?.bos_token_id ? 'user-settings' : 'model/tokenizer', ')');
        }
        
        // Set pad_token_id to eos_token_id if not set (common pattern)
        if (transformersTokenizer && (padTokenId === null || padTokenId === undefined) && eosTokenId !== undefined) {
            transformersTokenizer.pad_token_id = eosTokenId;
            padTokenId = eosTokenId;
            if (LOG_TRANSFORMERS) console.log(prefix, '[loadModelInternal] Set pad_token_id to eos_token_id:', eosTokenId);
        }
        
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { 
                status: 'loading', 
                file: 'model', 
                progress: 30, 
                loadId,
                message: 'Loading model from cache...'
            } 
        });
        
        const modelOptions = {
            ...(modelDtype !== 'auto' && { dtype: modelDtype }),
            device: (hasWebGPU ? "webgpu" : "cpu") as "webgpu" | "cpu",
            use_external_data_format: hasExternalData,
            progress_callback: (data: any) => {

                let progress = 30; // Initial value, will be remapped
                let status = 'loading';
                let message = 'Loading model from cache...';
                
                if (data.status === 'progress') {
                    progress = 40 + (data.progress * 0.5); // 40-90% range for model
                    status = 'loading';
                    message = `Loading model from cache... ${Math.round(progress)}%`;
                } else if (data.status === 'ready' || data.status === 'done') {
                    progress = 90;
                    status = 'done';
                    message = 'Model loaded from cache';
                }
                
                self.postMessage({ 
                    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
                    payload: { 
                        status, 
                        file: data.file || 'model', 
                        progress, 
                        loadId,
                        loaded: data.loaded,
                        total: data.total,
                        message
                    } 
                });
            }
        };
        
        if (LOG_DEBUG) console.log(prefix, `[loadModelInternal] Calling AutoModelForCausalLM.from_pretrained with options:`, modelOptions);
        

        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { 
                status: 'processing', 
                file: 'model', 
                progress: 90, 
                loadId,
                message: 'Initializing model...'
            } 
        });
        
        transformersModel = await AutoModelForCausalLM.from_pretrained(modelId, modelOptions);
        
        isTransformersModelReady = true;
        
        if (LOG_GENERAL) console.log(prefix, `[loadModelInternal] Model loaded successfully: ${modelId}`);
        
        // Log what the loaded model and tokenizer actually have
        if (LOG_TRANSFORMERS) {
            if (LOG_MODEL_LOADING) console.log(prefix, '[loadModelInternal] Loaded tokenizer properties:', {
                eos_token_id: transformersTokenizer?.eos_token_id,
                pad_token_id: transformersTokenizer?.pad_token_id,
                bos_token_id: transformersTokenizer?.bos_token_id,
                vocab_size: transformersTokenizer?.vocab_size,
                model_max_length: transformersTokenizer?.model_max_length,
                tokenizer_class: transformersTokenizer?.constructor?.name
            });
            
            if (LOG_MODEL_LOADING) console.log(prefix, '[loadModelInternal] Loaded model properties:', {
                config: transformersModel?.config ? {
                    max_position_embeddings: transformersModel.config.max_position_embeddings,
                    n_positions: transformersModel.config.n_positions,
                    max_sequence_length: transformersModel.config.max_sequence_length,
                    n_ctx: transformersModel.config.n_ctx,
                    context_length: transformersModel.config.context_length,
                    eos_token_id: transformersModel.config.eos_token_id,
                    pad_token_id: transformersModel.config.pad_token_id,
                    bos_token_id: transformersModel.config.bos_token_id,
                    vocab_size: transformersModel.config.vocab_size,
                    model_type: transformersModel.config.model_type,
                    architectures: transformersModel.config.architectures
                } : 'no config',
                model_class: transformersModel?.constructor?.name
            });
            
            // Check if the model has a generation config with default values
            if (transformersModel?.generation_config) {
                if (LOG_MODEL_CONFIG) console.log(prefix, '[loadModelInternal] 🔍 COMPREHENSIVE CONFIG COMPARISON:');
                if (LOG_MODEL_CONFIG) console.log(prefix, '[loadModelInternal] 📊 OUR EXTRACTED CONFIG:');
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - modelContextLength:', modelContextLength);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - eos_token_id:', eosTokenId);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - pad_token_id:', padTokenId);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - bos_token_id:', bosTokenId);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - numAttentionHeads:', numAttentionHeads);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - numKeyValueHeads:', numKeyValueHeads);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - headDim:', headDim);
                
                if (LOG_MODEL_CONFIG) console.log(prefix, '[loadModelInternal] 🤖 TRANSFORMERS.JS MODEL GENERATION CONFIG:');
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - max_new_tokens:', transformersModel.generation_config.max_new_tokens);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - max_length:', transformersModel.generation_config.max_length);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - min_length:', transformersModel.generation_config.min_length);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - min_new_tokens:', transformersModel.generation_config.min_new_tokens);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - temperature:', transformersModel.generation_config.temperature);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - top_k:', transformersModel.generation_config.top_k);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - top_p:', transformersModel.generation_config.top_p);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - typical_p:', transformersModel.generation_config.typical_p);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - epsilon_cutoff:', transformersModel.generation_config.epsilon_cutoff);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - eta_cutoff:', transformersModel.generation_config.eta_cutoff);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - repetition_penalty:', transformersModel.generation_config.repetition_penalty);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - encoder_repetition_penalty:', transformersModel.generation_config.encoder_repetition_penalty);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - do_sample:', transformersModel.generation_config.do_sample);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - no_repeat_ngram_size:', transformersModel.generation_config.no_repeat_ngram_size);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - eos_token_id:', transformersModel.generation_config.eos_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - pad_token_id:', transformersModel.generation_config.pad_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - bos_token_id:', transformersModel.generation_config.bos_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - decoder_start_token_id:', transformersModel.generation_config.decoder_start_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - forced_bos_token_id:', transformersModel.generation_config.forced_bos_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - forced_eos_token_id:', transformersModel.generation_config.forced_eos_token_id);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - num_beams:', transformersModel.generation_config.num_beams);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - num_beam_groups:', transformersModel.generation_config.num_beam_groups);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - diversity_penalty:', transformersModel.generation_config.diversity_penalty);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - length_penalty:', transformersModel.generation_config.length_penalty);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - early_stopping:', transformersModel.generation_config.early_stopping);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - penalty_alpha:', transformersModel.generation_config.penalty_alpha);
                if (LOG_MODEL_CONFIG) console.log(prefix, '  - use_cache:', transformersModel.generation_config.use_cache);
                
                if (LOG_MODEL_CONFIG) console.log(prefix, '[loadModelInternal] 🎯 ANALYSIS: If our extracted values match transformers.js values, then we were unnecessarily extracting them!');
            } else {
                if (LOG_MODEL_CONFIG) console.log(prefix, '[loadModelInternal] No generation_config found on model');
            }
        }
        
        // Update manifest status to indicate successful download/loading
        await setManifestQuantStatus(modelId, dtype, QuantStatus.Downloaded);
        
        // Send final completion messages
        self.postMessage({
            type: WorkerEventNames.WORKER_READY,
            payload: { modelId, dtype, task, executionProvider: hasWebGPU ? 'webgpu' : 'cpu' }
        });
        self.postMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { 
                status: 'done', 
                file: 'model', 
                progress: 100, 
                loadId,
                message: 'Model ready for inference!'
            } 
        });
        
        currentLoadId = undefined;

    } catch (error: any) {
        isTransformersModelReady = false;
        currentModelRepoId = null;
        currentModelQuantPath = null;
        currentTask = null;
        currentLoadId = undefined;
        
        console.error(prefix, `[loadModelInternal] Error loading model:`, error);
        
        // Update manifest status to indicate failed download/loading
            try {
                await setManifestQuantStatus(modelId, dtype, QuantStatus.Failed);
            } catch (manifestError) {
                if (LOG_ERROR) console.error(prefix, `[loadModelInternal] Failed to update manifest status on error:`, manifestError);
            }
        
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

async function generateInternal(payload: any): Promise<void> {
    const { messages, message, input, chatId, messageId } = payload;
    
    if (LOG_GEN_DETAILED) {
        console.log(prefix, `[generateInternal] Starting generation with payload:`, payload);
        console.log(prefix, `[generateInternal] isTransformersModelReady:`, isTransformersModelReady);
        console.log(prefix, `[generateInternal] transformersTokenizer:`, !!transformersTokenizer);
        console.log(prefix, `[generateInternal] transformersModel:`, !!transformersModel);
    }
    
    if (!isTransformersModelReady || !transformersTokenizer || !transformersModel) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Model not ready');
        self.postMessage({ 
            type: WorkerEventNames.GENERATION_ERROR, 
            payload: { ...payload, error: 'Model not ready. Please load a model first.' } 
        });
        return;
    }
    
    try {

    isGenerating = true;
    shouldStopGeneration = false;
    stopping_criteria.reset();
    
    if (LOG_QA_START) console.log(prefix, '[generateInternal] 🚀 Generation started');
        
        if (LOG_GENERAL) console.log(prefix, '[generateInternal] Starting generation'); 
        const currentSettings = await getInferenceSettings();
        const settings = currentSettings || DEFAULT_INFERENCE_SETTINGS;
        
        // Log current settings for debugging
        if (LOG_GEN_PARAMS) {
            console.log(prefix, '[generateInternal] Current inference settings:', {
                temperature: settings.temperature,
                max_length: settings.max_length,
                max_new_tokens: settings.max_new_tokens,
                min_length: settings.min_length,
                min_new_tokens: settings.min_new_tokens,
                top_k: settings.top_k,
                top_p: settings.top_p,
                typical_p: settings.typical_p,
                epsilon_cutoff: settings.epsilon_cutoff,
                eta_cutoff: settings.eta_cutoff,
                repetition_penalty: settings.repetition_penalty,
                encoder_repetition_penalty: settings.encoder_repetition_penalty,
                do_sample: settings.do_sample,
                no_repeat_ngram_size: settings.no_repeat_ngram_size,
                system_prompt: settings.system_prompt ? 'present' : 'not set',
                eos_token_id: settings.eos_token_id,
                pad_token_id: settings.pad_token_id,
                bos_token_id: settings.bos_token_id
            });
        }
        let messagesForTemplate: Array<{role: string, content: string}> = [];

        if (settings.system_prompt && typeof settings.system_prompt === 'string' && settings.system_prompt.trim().length > 0) {
            if (!(Array.isArray(messages) && messages.some(msg => msg.role === 'system'))) {
                messagesForTemplate.push({ role: 'system', content: settings.system_prompt });
            }
        }
        
        if (Array.isArray(messages)) {
            messagesForTemplate.push(...messages);
        } else if (message) {
            messagesForTemplate.push({ role: 'user', content: message });
        } else if (input) {
            messagesForTemplate.push({ role: 'user', content: input });
        }

        const filteredMessages = filterScrapedContent(messagesForTemplate);
        
        if (LOG_GEN_DETAILED) {
            console.log(prefix, `[generateInternal] Original messages:`, messagesForTemplate.length);
            console.log(prefix, `[generateInternal] Filtered messages:`, filteredMessages.length);
        }
        
        const inputs = transformersTokenizer.apply_chat_template(filteredMessages, {
            add_generation_prompt: true,
            return_dict: true,
        });
        
        let fullGeneratedText = '';
        
        // TPS calculation variables (like the example)
        let startTime: number | undefined;
        let numTokens = 0;
        let tps: number | undefined;
        
        const token_callback_function = () => {
            startTime ??= performance.now();
            if (numTokens++ > 0) {
                tps = (numTokens / (performance.now() - startTime!)) * 1000;
            }
        };
        
        const ourStreamer = new TextStreamer(transformersTokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (output: string) => {
                // Check for stop request during streaming
                if (shouldStopGeneration) {
                    if (LOG_GENERATION) console.log(prefix, '[generateInternal] Stop generation requested during streaming');
                    return;
                }
                
                fullGeneratedText += output;                
                
           // Log streaming progress periodically (every 50 tokens or significant tokens)
           if (LOG_GEN_DETAILED && (fullGeneratedText.length % 200 === 0 || /[.!?]$/.test(output))) {
               console.log(prefix, `[generateInternal] Streaming progress:`, {
                   cumulativeLength: fullGeneratedText.length,
                   lastToken: output,
                   preview: fullGeneratedText.substring(Math.max(0, fullGeneratedText.length - 50)),
                   tps: tps?.toFixed(2),
                   numTokens: numTokens
               });
           }
                
                self.postMessage({
                    type: WorkerEventNames.GENERATION_UPDATE,
                    payload: { 
                        chatId, 
                        messageId, 
                        token: output,
                        tps: tps?.toFixed(2),  // Add TPS to our message
                        numTokens: numTokens   // Add token count to our message
                    }
                });
            },
            token_callback_function,  // Add token callback for TPS calculation
        });
        
        

        const padTokenId = transformersTokenizer?.pad_token_id ?? settings.pad_token_id;
        const bosTokenId = transformersTokenizer?.bos_token_id ?? settings.bos_token_id;
        const eosTokenId = transformersTokenizer?.eos_token_id ?? settings.eos_token_id;
        
        if (LOG_GEN_DETAILED) {
            console.log(prefix, '[generateInternal] Using token IDs:');
            console.log(prefix, '  pad_token_id:', padTokenId, '(from tokenizer:', transformersTokenizer?.pad_token_id, '| settings:', settings.pad_token_id, ')');
            console.log(prefix, '  bos_token_id:', bosTokenId, '(from tokenizer:', transformersTokenizer?.bos_token_id, '| settings:', settings.bos_token_id, ')');
            console.log(prefix, '  eos_token_id:', eosTokenId, '(from tokenizer:', transformersTokenizer?.eos_token_id, '| settings:', settings.eos_token_id, ')');
        }
        
        // Calculate effective max length - use the modelContextLength which already has the right priority
        // modelContextLength = Model Config → User Settings → Default
        const effectiveMaxLength = Math.min(settings.max_length, modelContextLength);
        if (LOG_GEN_DETAILED) {
            console.log(prefix, '[generateInternal] Context length calculation:', {
                settingsMaxLength: settings.max_length,
                modelContextLength: modelContextLength,
                effectiveMaxLength: effectiveMaxLength,
                limitingFactor: modelContextLength < settings.max_length ? 'model-context' : 'user-settings'
            });
        }
        
        
        const generateParams = {
            ...inputs,

            // Cache disabled - following official example approach
            // past_key_values: past_key_values_cache,

            // Core generation parameters
            do_sample: settings.do_sample,
            top_k: settings.top_k,
            temperature: settings.temperature,            
            top_p: settings.top_p,
            repetition_penalty: settings.repetition_penalty,
            max_new_tokens: settings.max_new_tokens,
            no_repeat_ngram_size: settings.no_repeat_ngram_size,

           // min_length: settings.min_length,
           // max_length: effectiveMaxLength,
            
            // Advanced parameters
            
           // encoder_no_repeat_ngram_size: settings.encoder_no_repeat_ngram_size,
           // num_beams: settings.num_beams,
           // num_beam_groups: settings.num_beam_groups,
           // diversity_penalty: settings.diversity_penalty,
           // length_penalty: settings.length_penalty,
           // early_stopping: settings.early_stopping,
           // penalty_alpha: settings.penalty_alpha,
            
            // Additional sampling parameters
           // typical_p: settings.typical_p,
           // epsilon_cutoff: settings.epsilon_cutoff,
           // eta_cutoff: settings.eta_cutoff,
           // encoder_repetition_penalty: settings.encoder_repetition_penalty,
           // min_new_tokens: settings.min_new_tokens,
           // guidance_scale: settings.guidance_scale,
           // max_time: settings.max_time,
            
            // Token control parameters - use dynamic values from tokenizer
           // pad_token_id: padTokenId,
           // bos_token_id: bosTokenId,
           // eos_token_id: eosTokenId,
            // decoder_start_token_id: settings.decoder_start_token_id,
            // forced_bos_token_id: settings.forced_bos_token_id,
            // forced_eos_token_id: settings.forced_eos_token_id,
            
            // Advanced filtering
            // bad_words_ids: settings.bad_words_ids,
            // force_words_ids: settings.force_words_ids,
            // suppress_tokens: settings.suppress_tokens,
            // begin_suppress_tokens: settings.begin_suppress_tokens,
            
            // Output parameters
            return_dict_in_generate: settings.return_dict_in_generate,
           // output_attentions: settings.output_attentions,
           // output_hidden_states: settings.output_hidden_states,
           // output_scores: settings.output_scores,
            
            // Cache and performance
            use_cache: settings.use_cache,
            
            // Streamer for real-time output
            streamer: ourStreamer,
            stopping_criteria,
        };
        
        // DISABLED: Cache causes shape mismatch errors in multi-turn conversations
        // The official example also has this disabled (TODO: Enable once model is fixed)
        
        // exampleGenerateParams removed - generateParams now uses the same proven values via settings
        
        // Cache disabled - no logging needed
        
        if (LOG_GEN_PARAMS) {
            console.log(prefix, '[generateInternal] Using generateParams with proven settings:', generateParams);
            
            // Log the generation parameters we created (official examples approach)
            console.log(prefix, '[generateInternal] 🎯 GENERATION PARAMETERS (official examples approach):', {
                do_sample: generateParams.do_sample,
                top_k: generateParams.top_k,
                temperature: generateParams.temperature,
                max_new_tokens: generateParams.max_new_tokens,
                top_p: generateParams.top_p,
                repetition_penalty: generateParams.repetition_penalty,
                no_repeat_ngram_size: generateParams.no_repeat_ngram_size,
                return_dict_in_generate: generateParams.return_dict_in_generate,
            });
        }
        
        if (LOG_GEN_COMPARISON) {
            console.log(prefix, '[generateInternal] 📋 USING APPROACH: plain object (like official examples)');
            console.log(prefix, '[generateInternal] 🔍 PARAMETER PROCESSING FLOW (from transformers.js source):');
            console.log(prefix, '  1. Our params → kwargs (spread into generate() call)');
            console.log(prefix, '  2. Model defaults → this.generation_config');
            console.log(prefix, '  3. Final config = _prepare_generation_config(kwargs, model_defaults)');
            console.log(prefix, '  4. Our kwargs should override model defaults in final config');
            
            // Log what we're actually passing to model.generate()
            console.log(prefix, '[generateInternal] 🔍 DETAILED PARAMETER ANALYSIS:');
            console.log(prefix, '  - inputs.input_ids length:', inputs.input_ids.length);
            console.log(prefix, '  - inputs.attention_mask length:', inputs.attention_mask.length);
            console.log(prefix, '  - generateParams keys:', Object.keys(generateParams));
            console.log(prefix, '  - hasStreamer: !!generateParams.streamer');
            console.log(prefix, '  - hasStoppingCriteria: !!generateParams.stopping_criteria');
            console.log(prefix, '  - hasGenerationParams: do_sample, top_k, temperature, max_new_tokens, etc.');
        }
        
        // Check for stop request before generation
        if (shouldStopGeneration) {
            if (LOG_GENERATION) console.log(prefix, '[generateInternal] Stop generation requested before model.generate()');
            self.postMessage({
                type: WorkerEventNames.GENERATION_STOPPED,
                payload: { ...payload, output: '', generatedText: '' }
            });
            return;
        }
        

        if (LOG_GEN_DETAILED) {
            console.log(prefix, '[generateInternal] 🚀 TESTING EXAMPLE APPROACH FIRST...');
            
            // Log model's generation_config BEFORE generation
            if (transformersModel?.generation_config) {
                console.log(prefix, `[generateInternal] 🔍 MODEL'S GENERATION CONFIG BEFORE GENERATION:`, transformersModel.generation_config);
                
                // Compare our generation parameters with model's default
                console.log(prefix, `[generateInternal] 🔄 COMPARISON - OUR vs MODEL'S CONFIG:`);
                console.log(prefix, `  - do_sample: ${generateParams.do_sample} vs ${transformersModel.generation_config.do_sample}`);
                console.log(prefix, `  - temperature: ${generateParams.temperature} vs ${transformersModel.generation_config.temperature}`);
                console.log(prefix, `  - max_new_tokens: ${generateParams.max_new_tokens} vs ${transformersModel.generation_config.max_new_tokens}`);
                console.log(prefix, `  - top_k: ${generateParams.top_k} vs ${transformersModel.generation_config.top_k}`);
                console.log(prefix, `  - eos_token_id: NOT PASSED (model will use default: ${transformersModel.generation_config.eos_token_id})`);
            }
        }
        
        // Log what we're passing to model.generate()
        if (LOG_GEN_ANALYSIS) {
            console.log(prefix, `[generateInternal] 📤 PARAMETERS WE'RE PASSING TO model.generate():`, generateParams);
            
            // Log the specific generation parameters we're passing (these become kwargs)
            console.log(prefix, `[generateInternal] 🎯 GENERATION PARAMETERS AS KWARGS:`, {
                do_sample: generateParams.do_sample,
                top_k: generateParams.top_k,
                temperature: generateParams.temperature,
                max_new_tokens: generateParams.max_new_tokens,
                top_p: generateParams.top_p,
                repetition_penalty: generateParams.repetition_penalty,
                no_repeat_ngram_size: generateParams.no_repeat_ngram_size,
                return_dict_in_generate: generateParams.return_dict_in_generate,
            });
        }
        
        const result = await transformersModel.generate(generateParams);
        
        // Update past_key_values_cache like the example
        if (result && typeof result === 'object' && 'past_key_values' in result) {
            const hadCache = past_key_values_cache !== null;
            past_key_values_cache = result.past_key_values;
            
            // Store input length for future validation
            if (past_key_values_cache && typeof past_key_values_cache === 'object') {
                past_key_values_cache.input_ids_length = inputs.input_ids.data.length;
            }
            
            if (LOG_CACHE) {
                console.log(prefix, `[generateInternal] 🔄 CACHE UPDATE: ${hadCache ? 'Updated existing cache' : 'Created new cache'}`);
                console.log(prefix, `[generateInternal] 📊 Cache status: ${past_key_values_cache ? 'Active' : 'Null'}`);
                if (past_key_values_cache && past_key_values_cache.input_ids_length) {
                    console.log(prefix, `[generateInternal] 📏 Cache input length: ${past_key_values_cache.input_ids_length}`);
                }
            }
        }
        
        // Decode the final result like the working example does
        let finalDecodedText = '';
        if (result && typeof result === 'object' && 'sequences' in result) {
            // FIX: Slice sequences to only decode newly generated tokens, not the entire input prompt
            const decoded = transformersTokenizer.batch_decode(result.sequences.slice(inputs.input_ids.length), {
                skip_special_tokens: true,
            });
            // batch_decode returns an array, get the first (and likely only) result
            finalDecodedText = Array.isArray(decoded) ? decoded[0] : decoded;
            
            if (LOG_GEN_ANALYSIS) {
                console.log(prefix, `[generateInternal] 🔍 DECODED RESULT FROM SEQUENCES:`, {
                    sequencesType: typeof result.sequences,
                    sequencesLength: Array.isArray(result.sequences) ? result.sequences.length : 'not array',
                    decodedType: typeof decoded,
                    decodedLength: Array.isArray(decoded) ? decoded.length : 'not array',
                    finalDecodedText: finalDecodedText.substring(0, 100) + (finalDecodedText.length > 100 ? '...' : ''),
                    finalDecodedLength: finalDecodedText.length
                });
            }
        }
        
        // Log what the model actually returned and what parameters were used
        if (LOG_GEN_ANALYSIS) {
            console.log(prefix, `[generateInternal] Generation completed successfully`);
            console.log(prefix, `[generateInternal] Model result type:`, typeof result);
            console.log(prefix, `[generateInternal] Model result keys:`, result ? Object.keys(result) : 'null/undefined');
            
            // Log the FULL result object to see what transformers.js actually returned
            console.log(prefix, `[generateInternal] FULL RESULT OBJECT:`, result);
            
            if (result && typeof result === 'object') {
                console.log(prefix, `[generateInternal] Model result structure:`, {
                    hasGeneratedText: 'generated_text' in result,
                    hasOutputs: 'outputs' in result,
                    hasScores: 'scores' in result,
                    hasAttentions: 'attentions' in result,
                    hasHiddenStates: 'hidden_states' in result,
                    hasSequences: 'sequences' in result,
                    hasPastKeyValues: 'past_key_values' in result,
                    resultKeys: Object.keys(result)
                });
                
                // Check if result contains the actual generation parameters that were used
                if ('generation_config' in result) {
                    console.log(prefix, `[generateInternal] 🎯 ACTUAL GENERATION CONFIG USED:`, result.generation_config);
                }
                
                // Check if there are any other parameter-related fields
                Object.keys(result).forEach(key => {
                    if (key.includes('config') || key.includes('param') || key.includes('setting')) {
                        console.log(prefix, `[generateInternal] Found parameter-related field '${key}':`, result[key]);
                    }
                });
            }
            
            // NOTE: We can't access the final merged config because it's created internally in _prepare_generation_config()
            // The model.generation_config remains unchanged - the final config is only used during generation
            console.log(prefix, `[generateInternal] ⚠️  NOTE: model.generation_config is UNCHANGED (final merged config is internal)`);
            console.log(prefix, `[generateInternal] 🎯 EXPECTED FINAL MERGED CONFIG (our params should override model defaults):`);
            console.log(prefix, `  - do_sample: ${generateParams.do_sample} (our param should override model's defaults)`);
            console.log(prefix, `  - temperature: ${generateParams.temperature} (our param should override model's defaults)`);
            console.log(prefix, `  - max_new_tokens: ${generateParams.max_new_tokens} (our param should override model's defaults)`);
            console.log(prefix, `  - top_k: ${generateParams.top_k} (our param should override model's defaults)`);
            console.log(prefix, `  - eos_token_id: NOT PASSED (model will use its default: ${transformersModel.generation_config.eos_token_id})`);
            
            
            // Log factual observations and the assumptions that were being made
            console.log(prefix, `[generateInternal] Generation results:`, {
                generatedTextLength: fullGeneratedText.length,
                generatedTextPreview: fullGeneratedText.substring(0, 100) + (fullGeneratedText.length > 100 ? '...' : ''),
                stoppedNaturally: !shouldStopGeneration,
            });
            
            // Log the assumptions that were being made (for analysis)
            console.log(prefix, `[generateInternal] ASSUMPTIONS THAT WERE BEING MADE:`, {
                assumption1: "If it generated a reasonable length, it likely has a reasonable max_new_tokens default",
                assumption2: "If it stopped naturally, it likely has proper eos_token_id handling", 
                assumption3: "The quality/temperature can be inferred from the output style"
            });
            
            // Log the FULL generated response for analysis
            console.log(prefix, `[generateInternal] FULL GENERATED RESPONSE:`, fullGeneratedText);
            console.log(prefix, `[generateInternal] Response analysis:`, {
                totalLength: fullGeneratedText.length,
                wordCount: fullGeneratedText.split(/\s+/).length,
                lineCount: fullGeneratedText.split('\n').length,
                endsWithPunctuation: /[.!?]$/.test(fullGeneratedText.trim()),
                containsRepetition: /(.{10,})\1/.test(fullGeneratedText),
                isRambling: fullGeneratedText.length > 500 && !/[.!?]$/.test(fullGeneratedText.trim())
            });
        }
        
        // Use the streamer text (correctly shows only generated tokens)
        // Fall back to decoded text if streamer failed
        const finalOutput = fullGeneratedText || finalDecodedText;
        
        // Log the final output for debugging
        if (LOG_QA_OUTPUT) {
            console.log(prefix, `[generateInternal] 📝 FINAL OUTPUT:`, finalOutput);
        }
        if (LOG_QA_STATS) {
            console.log(prefix, `[generateInternal] 📊 OUTPUT STATS:`, {
                length: finalOutput.length,
                wordCount: finalOutput.split(/\s+/).length,
                lineCount: finalOutput.split('\n').length
            });
        }
        
        if (LOG_GEN_ANALYSIS) {
            console.log(prefix, `[generateInternal] 📊 FINAL OUTPUT COMPARISON:`, {
                streamerText: fullGeneratedText.substring(0, 50) + (fullGeneratedText.length > 50 ? '...' : ''),
                streamerLength: fullGeneratedText.length,
                decodedText: finalDecodedText.substring(0, 50) + (finalDecodedText.length > 50 ? '...' : ''),
                decodedLength: finalDecodedText.length,
                usingDecoded: !!finalDecodedText,
                finalOutput: finalOutput.substring(0, 50) + (finalOutput.length > 50 ? '...' : ''),
                finalLength: finalOutput.length
            });
        }
        
        // Send appropriate completion event based on whether generation was stopped
        if (shouldStopGeneration) {
            if (LOG_QA_START) console.log(prefix, '[generateInternal] ⏹️ Generation stopped');
            self.postMessage({
                type: WorkerEventNames.GENERATION_STOPPED,
                payload: { 
                    ...payload, 
                    output: finalOutput, 
                    generatedText: finalOutput,
                    tps: tps?.toFixed(2),      // Add final TPS
                    numTokens: numTokens       // Add final token count
                }
            });
        } else {
            if (LOG_QA_START) console.log(prefix, '[generateInternal] ✅ Generation completed');
            self.postMessage({
                type: WorkerEventNames.GENERATION_COMPLETE,
                payload: { 
                    ...payload, 
                    output: finalOutput, 
                    generatedText: finalOutput,
                    tps: tps?.toFixed(2),      // Add final TPS
                    numTokens: numTokens       // Add final token count
                }
            });
        }

    } catch (error: any) {
        if (LOG_ERROR) console.error(prefix, '[generateInternal] Error during generation:', error);
        
        // Check if this is a cache-related error and reset cache if so
        if (error.message && error.message.includes('Expand requires shape to be broadcastable')) {
            if (LOG_CACHE) {
                console.log(prefix, '[generateInternal] 🚨 CACHE ERROR: Shape mismatch detected, resetting cache');
            }
            past_key_values_cache = null;
        }
        
        self.postMessage({ 
            type: WorkerEventNames.GENERATION_ERROR, 
            payload: { ...payload, error: error.message || 'Generation failed' } 
        });
    } finally {
        // Reset generation state
        if (LOG_QA_START) console.log(prefix, '[generateInternal] 🔄 Generation state reset');
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
                if (LOG_TRANSFORMERS) {
                    console.log(prefix, '[INFERENCE_SETTINGS_UPDATE] Updated inference settings for transformers.js:', {
                        temperature: settings.temperature,
                        top_k: settings.top_k,
                        top_p: settings.top_p,
                        repetition_penalty: settings.repetition_penalty,
                        max_new_tokens: settings.max_new_tokens,
                        do_sample: settings.do_sample,
                        system_prompt: settings.system_prompt ? 'present' : 'not set'
                    });
                }
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
            if (LOG_MESSAGES) console.log(prefix, '[onmessage] STOP_GENERATION message received. isGenerating:', isGenerating, 'shouldStopGeneration:', shouldStopGeneration);
            if (isGenerating) {
                // Our existing approach
                shouldStopGeneration = true;
                if (LOG_MESSAGES) console.log(prefix, '[onmessage] Stop generation flag set to true.');
                
                // Example-style approach (like the working example)
                stopping_criteria.interrupt();
                if (LOG_MESSAGES) console.log(prefix, '[onmessage] Example-style stopping_criteria.interrupt() called.');
            } else {
                if (LOG_MESSAGES) console.log(prefix, '[onmessage] Stop generation requested but not currently generating.');
            }
            break;
        case WorkerEventNames.RESET:
            transformersModel = null;
            transformersTokenizer = null;
            isTransformersModelReady = false;
            
            // Example-style reset (like the working example)
            past_key_values_cache = null;
            stopping_criteria.reset();
            currentModelRepoId = null; 
            currentModelQuantPath = null; 
            currentTask = null;
            // Reset model configuration variables
            modelContextLength = 2048;
            numAttentionHeads = undefined;
            numKeyValueHeads = undefined;
            headDim = undefined;
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
        default:
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `Unknown message type: ${type}` });
            break;
    }
};




// Prevent recursive manifest updates
let isUpdatingManifest = false;

async function setManifestQuantStatus(repo: string, dtype: string, status: QuantStatus) {
    // Prevent recursive calls
    if (isUpdatingManifest) {
        if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] Skipping recursive call for ${repo}/${dtype}`);
        return;
    }
    
    isUpdatingManifest = true;
    try {
        // Reduced debug logging to prevent spam
        // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - Called with repo: "${repo}", dtype: "${dtype}", status: ${status}`);
      
      let manifest = await getManifestEntry(repo);
  if (!manifest) {
    if (LOG_WARN) console.warn(prefix, `[setManifestQuantStatus] No manifest found for repo: ${repo}`);
    return;
  }
  
    // Reduced debug logging to prevent spam
    // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - Manifest quants keys:`, Object.keys(manifest.quants));
  
  // Find ALL manifest entries that correspond to this dtype
  const entriesToUpdate: string[] = [];
  for (const [modelPath, quantInfo] of Object.entries(manifest.quants)) {
    // Reduced debug logging to prevent spam
    // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - Checking entry: "${modelPath}", quantInfo.dtype: "${quantInfo.dtype}"`);
    // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - dtype comparison: "${quantInfo.dtype}" === "${dtype}" ? ${quantInfo.dtype === dtype}`);
    
    if (quantInfo.dtype === dtype) {
      entriesToUpdate.push(modelPath);
      // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - ✅ Found matching entry: "${modelPath}"`);
    }
  }
  
  // Reduced debug logging to prevent spam
  // if (LOG_DEBUG) console.log(prefix, `[setManifestQuantStatus] DEBUG - Found ${entriesToUpdate.length} entries to update:`, entriesToUpdate);
  
  if (entriesToUpdate.length === 0) {
    if (LOG_WARN) console.warn(prefix, `[setManifestQuantStatus] No manifest entries found for dtype: ${dtype} in repo: ${repo}`);
    return;
  }
  
  // Update the status of ALL found entries
  for (const entryKey of entriesToUpdate) {
    if (manifest.quants[entryKey]) {
      manifest.quants[entryKey].status = status;
      manifestLogCount++;
      if (LOG_DEBUG && (manifestLogCount % MANIFEST_LOG_THROTTLE_INTERVAL === 0 || manifestLogCount === 1)) {
        console.log(prefix, `[setManifestQuantStatus] ✅ Updated quant entry: ${entryKey} (dtype: ${dtype}) to status: ${status} (operation #${manifestLogCount})`);
      }
    } else {
      if (LOG_WARN) console.warn(prefix, `[setManifestQuantStatus] Quant entry ${entryKey} not found in manifest`);
    }
  }
  
      await addManifestEntry(repo, manifest);
      self.postMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
    } finally {
        isUpdatingManifest = false;
    }
}

function createEmptyGenerationConfig(): Response {
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
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


