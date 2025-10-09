/// <reference lib="dom" />
import browser from 'webextension-polyfill';
import { env, AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria } from '@huggingface/transformers';
import { WorkerEventNames, UIEventNames, LoadingStatusTypes } from './events/eventNames';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings, DEFAULT_SYSTEM_PROMPT_NORMAL, DEFAULT_SYSTEM_PROMPT_JSON } from './Controllers/InferenceSettings';
import { 
  getManifestEntry, QuantStatus, getInferenceSettings as dbGetInferenceSettings
} from './DB/idbModel';
import { PipelineHelpers } from './Pipelines/PipelineHelpers';
import { PipelineStateManager } from './Pipelines/PipelineStateManager';
import { PipelineDBHandler } from './Pipelines/PipelineDBHandler';
import { 
  PipelineProgressInfo, 
  EnhancedProgressCallback,
  PipelineFactory,
  BasePipeline,
  TextGenerationConfig,
  DeviceCapabilities
} from './Pipelines';

const prefix = '[BackgroundModelManager]';

// Core logging flags
const LOG_ERROR = true;   // Keep error logs enabled
const LOG_WARN = false;   // Disable warning logs

// CORE GENERATION FUNCTIONALITY

const LOG_GEN_PARAMS = true;          // Generation parameters being used


// Legacy Q&A flags (for backward compatibility)
const LOG_QA_START = true;            // Generation lifecycle (start/stop/complete)
const LOG_QA_OUTPUT = true;           // Generated text output
const LOG_QA_STATS = true;            // Output statistics

// Model loading and configuration
const LOG_MODEL_LOADING = true;      // Model loading progress
const LOG_MODEL_CONFIG = true;       // Detailed model configuration
const LOG_TOKEN_IDS = true;          // Token ID extraction

// Transformers.js specific
const LOG_TRANSFORMERS = true;        // Transformers.js debugging
const LOG_TRANSFORMERS_SETTINGS = true; // Settings comparison
const LOG_GENERATION = true;          // Detailed generation parameters
const LOG_GENERATION_FLOW = true;     // Track full generation flow

// Network and storage
const LOG_FETCH = false;              // Fetch interception logs
const LOG_FETCH_INIT = false;         // Fetch override initialization
const LOG_FETCH_DETAILED = false;     // Detailed fetch interception (all requests)
const LOG_CHUNKED = false;            // Chunked download/serve logs

// Message processing
const LOG_MESSAGES = false;
const LOG_PROGRESS_CALLBACK = false;  // Progress callback spam
const LOG_MESSAGE_PASSING = false;    // Message passing to sidepanel

// Debug flags
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_PING_PONG = false;  // Ping/pong VRAM cleanup system

// CRITICAL: Disable browser cache to force transformers.js to use our custom fetch
// This ensures ALL model file requests go through our fetch intercept
env.useBrowserCache = false;


let currentLoadId: string | undefined = undefined;
let isGenerating = false;
let shouldStopGeneration = false;

let transformersTokenizer: any = null;
let transformersModel: any = null;

// UI Connection tracking using BroadcastChannel system
// Tracks all active UI instances by their unique sender IDs
const activeUIConnections = new Set<string>();
let pingTimer: ReturnType<typeof setTimeout> | null = null;
let pongTimeout: ReturnType<typeof setTimeout> | null = null;
const PING_INTERVAL_MS = 2 * 60 * 1000; // Ping every 2 minutes
const PONG_TIMEOUT_MS = 5 * 1000; // Wait 5 seconds for pong

// Legacy flag for backward compatibility - will be removed
let hasActiveUIConnection = false;

// global variables
const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: any = null;
let isTransformersModelReady = false;

// Model configuration variables
let modelContextLength: number = 2048;
let numAttentionHeads: number | undefined;
let numKeyValueHeads: number | undefined;
let headDim: number | undefined;

// Token IDs extracted from model/tokenizer
let eosTokenId: number | undefined;
let padTokenId: number | undefined;
let bosTokenId: number | undefined;

let currentModelRepoId: string | null = null;
let currentModelQuantPath: string | null = null;
let currentTask: string | null = null;
let inferenceSettings: InferenceSettings = DEFAULT_INFERENCE_SETTINGS;

// WebGPU detection (using DeviceCapabilities)
let hasWebGPU: boolean = false; // Will be set after DeviceCapabilities.initialize()

// Throttling for progress messages
let lastProgressLogTime = 0;
const PROGRESS_LOG_THROTTLE_MS = 500; 

// Safe message posting for different contexts
function safePostMessage(message: any) {
  // Throttle progress message logging
  const isProgressMessage = message.type === UIEventNames.MODEL_WORKER_LOADING_PROGRESS;
  const now = Date.now();
  const shouldLogProgress = !isProgressMessage || (now - lastProgressLogTime >= PROGRESS_LOG_THROTTLE_MS);
  
  if (shouldLogProgress && isProgressMessage) {
    lastProgressLogTime = now;
  }
  
  // In background context, send messages directly to UI
  // TODO: When port-based connection is implemented, broadcast to all active ports
  if (!hasActiveUIConnection) {
    // No UI connected - skip sending message to avoid "Receiving end does not exist" errors
    // This is expected during background script initialization before any UI opens
    return;
  }
  
  if (LOG_MESSAGE_PASSING && shouldLogProgress) {
    console.log(prefix, 'Sending message to UI:', message.type, message.payload);
  }
  if (typeof browser !== 'undefined' && browser.runtime) {
    browser.runtime.sendMessage(message).catch((error: any) => {
      // If we reach here with connection error, UI disconnected between check and send
      const isConnectionError = error?.message?.includes('Receiving end does not exist');
      if (isConnectionError) {
        hasActiveUIConnection = false; // Update state
      } else if (LOG_ERROR) {
        console.error(prefix, 'Failed to send message to UI:', error);
      }
    });
  }
}

// Initialize WebGPU support and environment
(async () => {
  // Initialize DeviceCapabilities (detects WebGPU and FP16 support)
  await DeviceCapabilities.initialize();
  hasWebGPU = await DeviceCapabilities.hasWebGPU();
  
  if (LOG_MODEL_LOADING) {
    const hasFP16 = await DeviceCapabilities.hasFP16();
    console.log(prefix, `GPU capabilities detected: WebGPU=${hasWebGPU}, FP16=${hasFP16}`);
  }
  
  // Configure execution providers - prefer WebGPU if available
  if (!env.backends) { (env as any).backends = {}; }
  if (!env.backends.onnx) { (env.backends as any).onnx = {}; }
  
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
  
  // Send environment ready message
  safePostMessage({ type: WorkerEventNames.WORKER_ENV_READY });
  if (LOG_MODEL_LOADING) console.log(prefix, 'Environment initialized and ready');
  
  // Initialize persistent state using PipelineStateManager
  PipelineStateManager.initialize().then(() => {
    if (LOG_GENERAL) {
      console.log(prefix, '📂 Persistent state loaded during initialization');
    }
  }).catch((error) => {
    if (LOG_ERROR) {
      console.error(prefix, '❌ Failed to load persistent state during initialization:', error);
    }
  });
})();


// Fetch from network and cache (thin wrapper around PipelineDBHandler.fetchAndCacheFile)
async function fetchFromNetworkAndCache(input: string | Request | URL, resourceUrl: string, options?: any): Promise<Response> {
  const { fetchInput } = PipelineDBHandler.determineFetchInput(input, resourceUrl);
  const fileName = resourceUrl.split('/').pop() || 'file';
  
  if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Fetching from: ${resourceUrl}, fetchInput: ${fetchInput}`);
  
  // Send download start event
  safePostMessage({ 
    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
    payload: { 
      status: LoadingStatusTypes.PROGRESS, 
      file: fileName, 
      progress: 0, 
      loadId: currentLoadId,
      message: `Starting download of ${fileName}...`
    } 
  });
  
  // Update manifest status to indicate download started
  if (currentModelRepoId && currentModelQuantPath && resourceUrl.includes('/resolve/main/')) {
    if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Updating manifest status: repo="${currentModelRepoId}", dtype="${currentModelQuantPath}", status=Available`);
    try {
      await PipelineDBHandler.setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Available, () => {
        safePostMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
      });
    } catch (manifestError) {
      if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Failed to update manifest status on download start:', manifestError);
    }
  }
  
  // Use pure fetch logic from PipelineDBHandler
  const response = await PipelineDBHandler.fetchAndCacheFile(
    resourceUrl,
    originalFetch.bind(self),
    {
      currentModelRepoId,
      progressCallback: ({ loaded, total, progress }) => {
        // Map progress to 0-25% range for downloads
        const downloadProgress = Math.round(progress * 0.25);
        
        // Send progress update every 5% or every 10MB
        if (downloadProgress % 5 === 0 || loaded % (10 * 1024 * 1024) === 0) {
          safePostMessage({ 
            type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
            payload: { 
              status: LoadingStatusTypes.PROGRESS, 
              file: fileName, 
              progress: downloadProgress, 
              loadId: currentLoadId,
              loaded,
              total,
              message: `Downloading ${fileName}... ${progress}% (${(loaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`
            } 
          });
        }
      }
    }
  );
  
  // Send download complete event
  const contentLength = response.headers.get('Content-Length');
  const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
  
  safePostMessage({ 
    type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
    payload: { 
      status: LoadingStatusTypes.PROGRESS, 
      file: fileName, 
      progress: 25, 
      loadId: currentLoadId,
      message: `Downloaded ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)}MB)`
    } 
  });
  
  // Update manifest status to indicate download completed
  if (currentModelRepoId && currentModelQuantPath && resourceUrl.includes('/resolve/main/')) {
    try {
      await PipelineDBHandler.setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Downloaded, () => {
        safePostMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
      });
    } catch (manifestError) {
      if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Failed to update manifest status on download complete:', manifestError);
    }
  }
  
  return response;
}

// Store original fetch before overriding
const originalFetch = self.fetch;
if (LOG_FETCH_INIT) {
  const initInfo = `🔧 [Init] Setting up fetch override:
    Original fetch: ${typeof originalFetch}
    hasSelf: ${typeof self !== 'undefined'}
    hasGlobalThis: ${typeof globalThis !== 'undefined'}
    hasWindow: ${typeof window !== 'undefined'}
    selfIsSame: ${self === globalThis}
    fetchIsSame: ${self.fetch === globalThis.fetch}`;
  console.log(prefix, initInfo);
}

// Override global fetch for caching (refactored to use PipelineDBHandler helpers)
const customFetchHandler = async function(input: string | Request | URL, options?: any): Promise<Response> {
  const { url: resourceUrl } = PipelineDBHandler.extractResourceUrl(input);
  
  // Log detailed fetch info if enabled
  if (LOG_FETCH_DETAILED) {
    const fetchInfo = `🌐 [Custom Fetch] INTERCEPTED:
      url: ${resourceUrl}
      inputType: ${typeof input}
      isString: ${typeof input === 'string'}
      isRequest: ${input instanceof Request}
      isURL: ${input instanceof URL}`;
    console.log(prefix, fetchInfo);
  }
  
  // Early exit if no URL extracted
  if (!resourceUrl) {
    if (LOG_FETCH) console.log(prefix, `[Custom Fetch] No resourceUrl, using original fetch.`);
    return originalFetch.call(self, input, options);
  }
  
  // Debug: Check if this is a model file request
  if (LOG_FETCH && (resourceUrl.includes('.onnx') || resourceUrl.includes('.bin'))) {
    console.log(prefix, '🔍 [Custom Fetch] DETECTED MODEL FILE REQUEST:', resourceUrl);
  }
  
  // Check if we should intercept this file
  const { shouldIntercept, isHuggingFaceFile } = PipelineDBHandler.shouldInterceptFile(resourceUrl);
  
  if (LOG_FETCH) {
    const fileTypeCheck = `[Custom Fetch] File type check:
      resourceUrl: ${resourceUrl}
      isHuggingFaceFile: ${isHuggingFaceFile}
      shouldIntercept: ${shouldIntercept}`;
    console.log(prefix, fileTypeCheck);
  }
  
  // If not a model file, use original fetch
  if (!shouldIntercept) {
    if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Using original fetch for non-model file: ${resourceUrl}`);
    return originalFetch.call(self, input, options);
  }
  
  // Handle URL rewriting for HuggingFace files
  let finalResourceUrl = resourceUrl;
  if (isHuggingFaceFile) {
    finalResourceUrl = await PipelineDBHandler.handleModelFileRewriting(resourceUrl, currentModelRepoId, currentModelQuantPath);
    
    if (LOG_DEBUG && resourceUrl.includes('model_q4f16.onnx')) {
      if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Original URL: ${resourceUrl}`);
      if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Final URL: ${finalResourceUrl}`);
    }
    
    // Map generic ONNX paths to specific quantized paths
    finalResourceUrl = PipelineDBHandler.mapOnnxModelPath(finalResourceUrl, currentModelQuantPath);
    
    if (LOG_FETCH && finalResourceUrl !== resourceUrl) {
      console.log(prefix, `[Custom Fetch] URL rewritten: ${resourceUrl} -> ${finalResourceUrl}`);
    }
    
    // Handle generation_config.json fallback
    if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
      const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
      const fileName = finalResourceUrl.split('/').pop() || '';
      if (!configFiles.includes(fileName)) {
        if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Creating empty generation config for: ${fileName}`);
        return PipelineDBHandler.createEmptyGenerationConfig();
      }
    }
  }
  
  // Try to serve from IndexedDB cache
  if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Checking IndexedDB cache for: ${finalResourceUrl}`);
  const cachedResponse = await PipelineDBHandler.tryServeFromIndexedDB(finalResourceUrl, currentModelRepoId, LOG_CHUNKED);
  
  if (cachedResponse) {
    const fileSize = cachedResponse.headers.get('Content-Length');
    const sizeMB = fileSize ? (parseInt(fileSize) / 1024 / 1024).toFixed(1) : 'unknown';
    if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ✅ SERVING FROM INDEXEDDB: ${finalResourceUrl} (${sizeMB}MB)`);
    return cachedResponse;
  }
  
  // Cache miss - download and cache
  if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ❌ CACHE MISS, will download: ${finalResourceUrl}`);
  return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
};

// Apply fetch override to all global contexts
self.fetch = customFetchHandler;
globalThis.fetch = customFetchHandler;
if (typeof window !== 'undefined') {
  (window as any).fetch = customFetchHandler;
}

if (LOG_FETCH_INIT) {
  const verificationInfo = `✅ [Init] Fetch override applied to all global contexts:
    selfFetchOverridden: ${self.fetch === customFetchHandler}
    globalThisFetchOverridden: ${globalThis.fetch === customFetchHandler}`;
  console.log(prefix, verificationInfo);
}

// Auto-load model if not ready (tries last model, then default)
const ensureModelReady = async (callback?: EnhancedProgressCallback): Promise<boolean> => {
  if (isTransformersModelReady && transformersTokenizer && transformersModel) {
    return true; // Already ready
  }

  if (LOG_GENERATION_FLOW) {
    console.log(prefix, '❌ Model not ready! Attempting auto-restoration...');
  }

  // Try to restore last loaded model
  const lastModel = PipelineStateManager.getLastLoadedModel();
  if (lastModel) {
    if (LOG_GENERATION_FLOW) {
      console.log(prefix, `🔄 Auto-restoring last model: ${lastModel.repoId}/${lastModel.quantPath}`);
    }
        
        if (callback) {
      callback({ status: 'progress', progress: 10, message: 'Auto-restoring last model...' });
        } else {
          safePostMessage({
        type: 'modelWorkerLoadingProgress', 
        payload: { status: 'progress', progress: 10, message: 'Auto-restoring last model...' } 
      });
    }
    
    await loadModel({
      modelId: `${lastModel.repoId}/${lastModel.quantPath}`,
      dtype: lastModel.quantPath
    }, callback);
    
    if (LOG_GENERATION_FLOW) {
      console.log(prefix, '✅ Auto-restoration successful');
    }
    return true;
  }

  // No last model - try default model (Phi-3.5)
  if (LOG_GENERATION_FLOW) {
    console.log(prefix, '❌ No last model to restore, trying default model...');
  }
  
  const defaultModel = {
    repoId: 'onnx-community/Phi-3.5-mini-instruct-onnx-web',
    quantPath: 'q4f16'
  };
  
  if (LOG_GENERATION_FLOW) {
    console.log(prefix, `🔄 Auto-loading default model: ${defaultModel.repoId}/${defaultModel.quantPath}`);
  }
  
      if (callback) {
    callback({ status: 'progress', progress: 10, message: 'Auto-loading default model...' });
      } else {
        safePostMessage({
      type: 'modelWorkerLoadingProgress', 
      payload: { status: 'progress', progress: 10, message: 'Auto-loading default model...' } 
    });
  }
  
  await loadModel({
    modelId: `${defaultModel.repoId}/${defaultModel.quantPath}`,
    dtype: defaultModel.quantPath
  }, callback);
  
  if (LOG_GENERATION_FLOW) {
    console.log(prefix, '✅ Default model auto-loading successful');
  }
  return true;
};

// Enhanced Model loading function
export const loadModel = async (payload: { modelId: string, dtype: string, task?: string, loadId?: string }, callback?: EnhancedProgressCallback): Promise<void> => {
  const { modelId, dtype, task, loadId } = payload;
  
  if (LOG_MODEL_LOADING) {
    const loadInfo = `loadModel called with:
      modelId: ${modelId}
      dtype: ${dtype}
      task: ${task}
      loadId: ${loadId}`;
    console.log(prefix, loadInfo);
  }

  try {
    currentLoadId = loadId;
    currentModelRepoId = modelId;
    currentModelQuantPath = dtype;
    currentTask = task || null;
    
    if (LOG_MODEL_LOADING) console.log(prefix, `Loading: ${modelId}, dtype: ${dtype}`);
    
    // Send initial progress message
    if (callback) {
      callback({ status: LoadingStatusTypes.INITIATE, file: dtype, progress: 0, loadId });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: LoadingStatusTypes.INITIATE, file: dtype, progress: 0, loadId } 
      });
    }
    
    const validDtypes = ['auto', 'fp32', 'fp16', 'q8', 'int8', 'uint8', 'q4', 'bnb4', 'q4f16', 'quantized'];
    const modelDtype = validDtypes.includes(dtype) ? dtype as any : 'auto';
    
    // Get hasExternalData from manifest
    const manifestEntry = await getManifestEntry(modelId);
    let hasExternalData = false;
    if (manifestEntry && manifestEntry.quants) {
      // Find the quant info for this dtype
      for (const [modelPath, quantInfo] of Object.entries(manifestEntry.quants)) {
        if (quantInfo.dtype === dtype) {
          hasExternalData = quantInfo.hasExternalData || false;
          break;
        }
      }
    }
    
    // Load tokenizer and model with detailed progress tracking
    if (callback) {
      callback({ 
        status: LoadingStatusTypes.PROGRESS, 
        file: 'tokenizer', 
        progress: 10, 
        loadId,
        message: 'Loading tokenizer from cache...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: LoadingStatusTypes.PROGRESS, 
          file: 'tokenizer', 
          progress: 10, 
          loadId,
          message: 'Loading tokenizer from cache...'
        } 
      });
    }
    
    transformersTokenizer = await AutoTokenizer.from_pretrained(modelId, {
      progress_callback: (data: any) => {
        let progress = 10; 
        let status: PipelineProgressInfo['status'] = LoadingStatusTypes.PROGRESS;
        let message = 'Loading tokenizer from cache...';
        
        if (data.status === 'progress') {
          progress = 25 + (data.progress * 0.15); // 25-40% range for tokenizer
          status = LoadingStatusTypes.PROGRESS;
          message = `Loading tokenizer from cache... ${Math.round(progress)}%`;
        } else if (data.status === 'ready' || data.status === 'done') {
          progress = 40;
          status = LoadingStatusTypes.DONE;
          message = 'Tokenizer ready';
        }
        
        if (callback) {
          callback({ 
            status, 
            file: data.file || 'tokenizer', 
            progress, 
            loadId,
            loaded: data.loaded,
            total: data.total,
            message
          });
        } else {
          if (LOG_PROGRESS_CALLBACK) {
            const tokenizerProgress = `Sending tokenizer progress to sidepanel:
              status: ${status}
              file: ${data.file || 'tokenizer'}
              progress: ${progress}
              loadId: ${loadId}
              loaded: ${data.loaded}
              total: ${data.total}
              message: ${message}`;
            console.log(prefix, tokenizerProgress);
          }
          safePostMessage({ 
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
      }
    });
    
    // Load model configuration to get context length and token IDs
    let modelConfig: any = null;
    try {
      const configUrl = `https://huggingface.co/${modelId}/resolve/main/config.json`;
      if (LOG_TRANSFORMERS) console.log(prefix, '[loadModel] Loading model config from:', configUrl);
      const configResponse = await fetch(configUrl);
      if (configResponse.ok) {
        modelConfig = await configResponse.json();
      }
    } catch (configError) {
      if (LOG_ERROR) console.error(prefix, '[loadModel] Failed to load model config:', configError);
    }
        
        const modelConfigContextLength = modelConfig?.max_position_embeddings || 
                                       modelConfig?.n_positions || 
                                       modelConfig?.max_sequence_length ||
                                       modelConfig?.n_ctx ||
                                       modelConfig?.context_length;
        
    // Get user's current settings as fallback
    const currentSettings = await dbGetInferenceSettings();
    const userMaxLength = currentSettings?.max_length || DEFAULT_INFERENCE_SETTINGS.max_length;
        
    // Use model config if available, otherwise use user's setting
    modelContextLength = modelConfigContextLength || userMaxLength;
        if (LOG_TRANSFORMERS) {
      const contextLengthInfo = `[loadModel] Context length: ${modelContextLength} (source: ${modelConfigContextLength ? 'model-config' : 'user-settings'})`;
      console.log(prefix, contextLengthInfo);
      
      // Full config dump (only when MODEL_CONFIG debug is on)
      if (LOG_MODEL_CONFIG) {
        console.log(prefix, '[loadModel] Full model config JSON:', JSON.stringify(modelConfig, null, 2));
      }
    }
    
    // Extract model architecture details and store globally
    numAttentionHeads = modelConfig?.num_attention_heads || modelConfig?.n_head || modelConfig?.num_heads;
    const hiddenSize = modelConfig?.hidden_size || modelConfig?.n_embd;
    numKeyValueHeads = modelConfig?.num_key_value_heads || numAttentionHeads;
    headDim = (hiddenSize && numAttentionHeads) ? (modelConfig?.head_dim || hiddenSize / numAttentionHeads) : undefined;
    
    // Extract token IDs from tokenizer and config with advanced fallback logic
    eosTokenId = undefined;
    padTokenId = undefined;
    bosTokenId = undefined;
    
    if (transformersTokenizer) {
      // Try tokenizer first
      eosTokenId = transformersTokenizer.eos_token_id;
      padTokenId = transformersTokenizer.pad_token_id;
      bosTokenId = transformersTokenizer.bos_token_id;
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
    }
    
    // Log final token IDs (always from model/tokenizer, never from user settings)
    if (LOG_TRANSFORMERS && LOG_TOKEN_IDS) {
      const finalTokenInfo = `[loadModel] Token IDs: eos=${eosTokenId}, pad=${padTokenId}, bos=${bosTokenId}`;
      console.log(prefix, finalTokenInfo);
    }
    
    // Set pad_token_id to eos_token_id if not set (common pattern)
    if (transformersTokenizer && (padTokenId === null || padTokenId === undefined) && eosTokenId !== undefined) {
      transformersTokenizer.pad_token_id = eosTokenId;
      padTokenId = eosTokenId;
      if (LOG_TRANSFORMERS) console.log(prefix, '[loadModel] Set pad_token_id to eos_token_id:', eosTokenId);
    }
    
    // Load model
    if (callback) {
      callback({ 
        status: LoadingStatusTypes.PROGRESS, 
        file: 'model', 
        progress: 30, 
        loadId,
        message: 'Loading model from cache...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: LoadingStatusTypes.PROGRESS, 
          file: 'model', 
          progress: 30, 
          loadId,
          message: 'Loading model from cache...'
        } 
      });
    }
    
    const modelOptions = {
      ...(modelDtype !== 'auto' && { dtype: modelDtype }),
      device: (hasWebGPU ? "webgpu" : "cpu") as "webgpu" | "cpu",
      use_external_data_format: hasExternalData,
      progress_callback: (data: any) => {
        let progress = 30; // Initial value, will be remapped
        let status: PipelineProgressInfo['status'] = LoadingStatusTypes.PROGRESS;
        let message = 'Loading model from cache...';
        
        if (data.status === 'progress') {
          progress = 40 + (data.progress * 0.5); // 40-90% range for model
          status = LoadingStatusTypes.PROGRESS;
          message = `Loading model from cache... ${Math.round(progress)}%`;
        } else if (data.status === 'ready' || data.status === 'done') {
          progress = 90;
          status = LoadingStatusTypes.DONE;
          message = 'Model loaded from cache';
        }
        
        if (callback) {
          callback({ 
            status, 
            file: data.file || 'model', 
            progress, 
            loadId,
            loaded: data.loaded,
            total: data.total,
            message
          });
        } else {
          if (LOG_PROGRESS_CALLBACK) {
            const modelProgress = `Sending model progress to sidepanel:
              status: ${status}
              file: ${data.file || 'model'}
              progress: ${progress}
              loadId: ${loadId}
              loaded: ${data.loaded}
              total: ${data.total}
              message: ${message}`;
            console.log(prefix, modelProgress);
          }
          safePostMessage({ 
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
      }
    };
    
    // Send processing message
    if (callback) {
      callback({ 
        status: LoadingStatusTypes.PROGRESS, 
        file: 'model', 
        progress: 90, 
        loadId,
        message: 'Initializing model...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: LoadingStatusTypes.PROGRESS, 
          file: 'model', 
          progress: 90, 
          loadId,
          message: 'Initializing model...'
        } 
      });
    }
    
    transformersModel = await AutoModelForCausalLM.from_pretrained(modelId, modelOptions);
    
    isTransformersModelReady = true;
    
    if (LOG_MODEL_LOADING) console.log(prefix, `Model loaded successfully: ${modelId}`);
    
    // Update manifest status to indicate successful download/loading
    await PipelineDBHandler.setManifestQuantStatus(modelId, dtype, QuantStatus.Downloaded, () => {
      safePostMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
    });
    
    // Send completion messages
    if (callback) {
      callback({ 
        status: LoadingStatusTypes.DONE, 
        file: 'model', 
        progress: 100, 
        loadId,
        message: 'Model ready for inference!'
      });
    } else {
      safePostMessage({
        type: WorkerEventNames.WORKER_READY,
        payload: { modelId, dtype, task, executionProvider: hasWebGPU ? 'webgpu' : 'cpu' }
      });
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: LoadingStatusTypes.DONE, 
          file: 'model', 
          progress: 100, 
          loadId,
          message: 'Model ready for inference!'
        } 
      });
    }
    
    currentLoadId = undefined;

  } catch (error: any) {
    isTransformersModelReady = false;
    currentModelRepoId = null;
    currentModelQuantPath = null;
    currentTask = null;
    currentLoadId = undefined;
    
    console.error(prefix, `Error loading model:`, error);
    
    // Update manifest status to indicate failed download/loading
    try {
      await PipelineDBHandler.setManifestQuantStatus(modelId, dtype, QuantStatus.Failed, () => {
        safePostMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
      });
    } catch (manifestError) {
      if (LOG_ERROR) console.error(prefix, `[loadModel] Failed to update manifest status on error:`, manifestError);
    }
    
    if (callback) {
      callback({ status: LoadingStatusTypes.ERROR, file: dtype, error: error.message, loadId });
    } else {
      safePostMessage({ 
        type: WorkerEventNames.ERROR, 
        payload: { error: `Failed to load model ${dtype}: ${error.message}` }
      });
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: LoadingStatusTypes.ERROR, file: dtype, error: error.message, loadId } 
      });
    }
  }
};


const LOG_GEN_PARAMS_CURRENT = true;  
const LOG_GEN_PARAMS_CURRENT_State_check = true; 
const LOG_GEN_ANALYSIS_CHAT_HISTORY_FILTER = true;
export const generate = async (messages: Array<{role: string, content: string}>, callback?: EnhancedProgressCallback) => {
  if (LOG_GEN_PARAMS_CURRENT_State_check) {
    const stateInfo = `🎯 GENERATE called - State check:
      isTransformersModelReady: ${isTransformersModelReady}
      hasTokenizer: ${!!transformersTokenizer}
      hasModel: ${!!transformersModel}
      currentModelRepoId: ${currentModelRepoId}
      currentModelQuantPath: ${currentModelQuantPath}`;
    console.log(prefix, stateInfo);
  }
  
  // Ensure model is ready (auto-load if needed)
  if (!isTransformersModelReady || !transformersTokenizer || !transformersModel) {
    try {
      await ensureModelReady(callback);
    } catch (error) {
      if (LOG_ERROR) {
        console.error(prefix, '❌ Failed to ensure model ready:', error);
      }
      const errorMsg = 'Model not ready. Please load a model first.';
      if (callback) {
        callback({ status: LoadingStatusTypes.ERROR, error: errorMsg });
      } else {
        safePostMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error: errorMsg } });
      }
      return;
    }
  }
  
  try {
    isGenerating = true;
    shouldStopGeneration = false;
    stopping_criteria.reset();
    
   
    const settings = inferenceSettings;
    
    // Log current settings for debugging
    if (LOG_GEN_PARAMS_CURRENT) {
      const settingsEntries = Object.entries(settings)
        .map(([key, value]) => `        ${key}: ${JSON.stringify(value)}`)
        .join('\n');
      const settingsInfo = `Current inference settings:\n${settingsEntries}`;
      console.log(prefix, settingsInfo);
    }
    
    let messagesForTemplate: Array<{role: string, content: string}> = [];
    
    // Determine which system prompt to use based on json_mode
    const effectiveSystemPrompt = settings.json_mode 
      ? DEFAULT_SYSTEM_PROMPT_JSON 
      : (settings.system_prompt || DEFAULT_SYSTEM_PROMPT_NORMAL);
    
    if (effectiveSystemPrompt && effectiveSystemPrompt.trim().length > 0) {
      if (!(Array.isArray(messages) && messages.some(msg => msg.role === 'system'))) {
        messagesForTemplate.push({ role: 'system', content: effectiveSystemPrompt });
      }
    }
    
    if (Array.isArray(messages)) {
      messagesForTemplate.push(...messages);
    }
    
    // Filter scraped content
    const filteredMessages = PipelineHelpers.filterScrapedContent(messagesForTemplate);
        
    if (LOG_GEN_ANALYSIS_CHAT_HISTORY_FILTER) {
      const messageDetailsInfo = `[generate] 📨 MESSAGE DETAILS:
        Original messages: ${JSON.stringify(messagesForTemplate, null, 2)}
        Filtered messages: ${JSON.stringify(filteredMessages, null, 2)}`;
      console.log(prefix, messageDetailsInfo);
    }
    
    const inputs = transformersTokenizer.apply_chat_template(filteredMessages, {
      add_generation_prompt: true,
      return_dict: true,
    });
    
    let fullGeneratedText = '';
    
    // TPS calculation variables
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
        if (shouldStopGeneration) {
          if (LOG_GENERATION) console.log(prefix, 'Stop generation requested during streaming');
          return;
        }
        
        fullGeneratedText += output;
        
        if (callback) {
          callback({
            status: 'generating',
            output: output,
            message: `Generated ${numTokens} tokens`
          });
        } else {
          safePostMessage({
            type: WorkerEventNames.GENERATION_UPDATE,
            payload: { 
              token: output,
              tps: tps?.toFixed(2),
              numTokens: numTokens
            }
          });
        }
      },
      token_callback_function,
    });
        
    const generateParams = {
      ...inputs,
      // Core sampling parameters
      do_sample: settings.do_sample,
      temperature: settings.temperature,
      top_k: settings.top_k,
      top_p: settings.top_p,
      typical_p: settings.typical_p,
      epsilon_cutoff: settings.epsilon_cutoff,
      eta_cutoff: settings.eta_cutoff,
      
      // Length and repetition control
      max_length: modelContextLength,
      max_new_tokens: settings.max_new_tokens,
      min_length: settings.min_length,
      min_new_tokens: settings.min_new_tokens,
      repetition_penalty: settings.repetition_penalty,
      encoder_repetition_penalty: settings.encoder_repetition_penalty,
      no_repeat_ngram_size: settings.no_repeat_ngram_size,
      encoder_no_repeat_ngram_size: settings.encoder_no_repeat_ngram_size,
      
      // Beam search parameters
      num_beams: settings.num_beams,
      num_beam_groups: settings.num_beam_groups,
      diversity_penalty: settings.diversity_penalty,
      length_penalty: settings.length_penalty,
      early_stopping: settings.early_stopping,
      penalty_alpha: settings.penalty_alpha,
      
      // Token IDs (only forced/decoder variants - basic IDs already set on tokenizer during load)
      decoder_start_token_id: settings.decoder_start_token_id,
      forced_bos_token_id: settings.forced_bos_token_id,
      forced_eos_token_id: settings.forced_eos_token_id,
      
      // Advanced filtering
      bad_words_ids: settings.bad_words_ids,
      force_words_ids: settings.force_words_ids,
      suppress_tokens: settings.suppress_tokens,
      begin_suppress_tokens: settings.begin_suppress_tokens,
      
      // Output control
      num_return_sequences: settings.num_return_sequences,
      output_attentions: settings.output_attentions,
      output_hidden_states: settings.output_hidden_states,
      output_scores: settings.output_scores,
      return_dict_in_generate: settings.return_dict_in_generate,
      
      // Performance and caching
      use_cache: settings.use_cache,
      remove_invalid_values: settings.remove_invalid_values,
      renormalize_logits: settings.renormalize_logits,
      
      // Advanced features
      guidance_scale: settings.guidance_scale,
      max_time: settings.max_time,
      exponential_decay_length_penalty: settings.exponential_decay_length_penalty,
      constraints: settings.constraints,
      forced_decoder_ids: settings.forced_decoder_ids,
      
      // Streamer and stopping
      streamer: ourStreamer,
      stopping_criteria,
    };
      
    
    // Log key generation parameters for debugging (as string to avoid truncation)
    if (LOG_GEN_PARAMS) {
      const paramsEntries = Object.entries(generateParams)
        .map(([key, value]) => {
          // Handle BigInt values which JSON.stringify can't serialize
          if (typeof value === 'bigint') {
            return `        ${key}: ${value.toString()}`;
          }
          try {
            return `        ${key}: ${JSON.stringify(value)}`;
          } catch (e) {
            return `        ${key}: [unserializable: ${typeof value}]`;
          }
        })
        .join('\n');
      
      console.log(prefix, `[generate] 🔧 ACTIVE GENERATION PARAMETERS:\n${paramsEntries}`);
    }
    
    // Check for stop request before generation
    if (shouldStopGeneration) {
      if (LOG_GENERATION) console.log(prefix, 'Stop generation requested before model.generate()');
      if (callback) {
        callback({ status: 'stopped', output: '', generatedText: '' });
      } else {
        safePostMessage({
          type: WorkerEventNames.GENERATION_STOPPED,
          payload: { output: '', generatedText: '' }
        });
      }
      return;
    }
    
    const result = await transformersModel.generate(generateParams);
    
    // Update cache
    if (result && typeof result === 'object' && 'past_key_values' in result) {
      past_key_values_cache = result.past_key_values;
      if (past_key_values_cache && typeof past_key_values_cache === 'object') {
        past_key_values_cache.input_ids_length = inputs.input_ids.data.length;
      }
    }
    
    let finalDecodedText = '';
    if (result && typeof result === 'object' && 'sequences' in result) {
      const decoded = transformersTokenizer.batch_decode(result.sequences.slice(inputs.input_ids.length), {
        skip_special_tokens: true,
      });
      finalDecodedText = Array.isArray(decoded) ? decoded[0] : decoded;
    }
    
    const finalOutput = fullGeneratedText || finalDecodedText;
    
    if (LOG_QA_OUTPUT) {
      console.log(prefix, '📝 FINAL OUTPUT:', finalOutput);
    }
    if (LOG_QA_STATS) {
      const outputStats = `📊 OUTPUT STATS:
        length: ${finalOutput.length}
        wordCount: ${finalOutput.split(/\s+/).length}
        lineCount: ${finalOutput.split('\n').length}`;
      console.log(prefix, outputStats);
    }
    
    // Send completion event
    if (shouldStopGeneration) {
      if (LOG_QA_START) console.log(prefix, '⏹️ Generation stopped');
      if (callback) {
        callback({ 
          status: 'stopped',
          output: finalOutput, 
          generatedText: finalOutput,
          tps: tps?.toFixed(2),
          numTokens: numTokens
        });
      } else {
        safePostMessage({
          type: WorkerEventNames.GENERATION_STOPPED,
          payload: { 
            output: finalOutput, 
            generatedText: finalOutput,
            tps: tps?.toFixed(2),
            numTokens: numTokens
          }
        });
      }
    } else {
      if (LOG_QA_START) console.log(prefix, '✅ Generation completed');
      if (callback) {
        callback({ 
          status: 'complete',
          output: finalOutput, 
          generatedText: finalOutput,
          tps: tps?.toFixed(2),
          numTokens: numTokens
        });
      } else {
        safePostMessage({
          type: WorkerEventNames.GENERATION_COMPLETE,
          payload: { 
            output: finalOutput, 
            generatedText: finalOutput,
            tps: tps?.toFixed(2),
            numTokens: numTokens
          }
        });
      }
    }

  } catch (error: any) {
    if (LOG_ERROR) console.error(prefix, 'Error during generation:', error);
    
    // Check if this is a cache-related error and reset cache if so
    if (error.message && error.message.includes('Expand requires shape to be broadcastable')) {
      past_key_values_cache = null;
    }
    
    if (callback) {
      callback({ status: LoadingStatusTypes.ERROR, error: error.message || 'Generation failed' });
    } else {
      safePostMessage({ 
        type: WorkerEventNames.GENERATION_ERROR, 
        payload: { error: error.message || 'Generation failed' } 
      });
    }
  } finally {

    isGenerating = false;
    shouldStopGeneration = false;
  }
};



// Stop generation function
export const stopGeneration = () => {
  if (LOG_MESSAGES) {
    const stopInfo = `Stop generation received - State:
      isGenerating: ${isGenerating}
      shouldStopGeneration: ${shouldStopGeneration}`;
    console.log(prefix, stopInfo);
  }
  
  if (isGenerating) {
    shouldStopGeneration = true;
    stopping_criteria.interrupt();
    if (LOG_MESSAGES) console.log(prefix, 'Stop generation flag set and stopping_criteria interrupted');
  } else {
    if (LOG_MESSAGES) console.log(prefix, 'Stop generation requested but not currently generating');
  }
};

// Clear cache function
export const clearCache = () => {
  stopping_criteria.interrupt();
  if (LOG_GENERATION || LOG_GENERAL) console.log(prefix, 'Cache cleared, stopping criteria interrupted');
};

// UI Connection Management using BroadcastChannel
// Called when UI instances connect/disconnect via llmChannel
export const handleUIConnected = (senderId: string, context: string) => {
  const wasEmpty = activeUIConnections.size === 0;
  activeUIConnections.add(senderId);
  hasActiveUIConnection = true; // Legacy flag
  
  // Cancel any pending VRAM cleanup
  if (pongTimeout) {
    clearTimeout(pongTimeout);
    pongTimeout = null;
    if (LOG_PING_PONG) console.log(prefix, `⏸️ VRAM cleanup cancelled - UI reconnected (${context}, total: ${activeUIConnections.size})`);
  }
  
  if (wasEmpty) {
    if (LOG_PING_PONG) console.log(prefix, `✅ First UI connected (${context}) - ready to communicate [ID: ${senderId}]`);
    // Start ping timer for the first UI
    startPingTimer();
  } else {
    if (LOG_PING_PONG) console.log(prefix, `✅ Additional UI connected (${context}) - total connections: ${activeUIConnections.size} [ID: ${senderId}]`);
  }
};

// Start periodic ping timer
const startPingTimer = () => {
  if (pingTimer) {
    clearInterval(pingTimer);
  }
  
  pingTimer = setInterval(() => {
    if (activeUIConnections.size > 0) {
      sendPingToAllUIs();
    } else {
      // No UIs connected, stop pinging
      clearInterval(pingTimer!);
      pingTimer = null;
    }
  }, PING_INTERVAL_MS);
  
  if (LOG_PING_PONG) console.log(prefix, `🔄 Started ping timer (every ${PING_INTERVAL_MS / 1000}s)`);
};

// Send ping to all connected UIs
const sendPingToAllUIs = () => {
  if (activeUIConnections.size === 0) return;
  
  if (LOG_PING_PONG) console.log(prefix, `🏓 Pinging ${activeUIConnections.size} UI(s) - waiting for pong...`);
  
  // Send ping via BroadcastChannel
  (async () => {
    try {
      const { llmChannel } = await import('./Utilities/dbChannels');
      llmChannel.postMessage({
        type: WorkerEventNames.UI_PING,
        payload: { timestamp: Date.now() },
        senderId: 'background',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(prefix, 'Failed to send ping:', error);
    }
  })();
  
  // Set timeout - if no pong received, cleanup VRAM
  pongTimeout = setTimeout(() => {
    if (LOG_PING_PONG) console.log(prefix, '⏰ No pong received - cleaning up VRAM and resetting model');
    resetModel();
    pongTimeout = null;
  }, PONG_TIMEOUT_MS);
};

export const handleUIDisconnected = (senderId: string, context: string) => {
  if (!activeUIConnections.has(senderId)) {
    if (LOG_PING_PONG) console.log(prefix, `⚠️ Disconnect from unknown UI [ID: ${senderId}]`);
    return;
  }
  
  activeUIConnections.delete(senderId);
  if (LOG_PING_PONG) console.log(prefix, `🔌 UI disconnected (${context}) - remaining connections: ${activeUIConnections.size} [ID: ${senderId}]`);
  
  // Check if any remaining connections are sidepanels
  const hasSidepanelConnection = Array.from(activeUIConnections).some(id => id.startsWith('sidepanel-'));
  
  if (activeUIConnections.size === 0) {
    hasActiveUIConnection = false; // Legacy flag
    if (LOG_PING_PONG) console.log(prefix, `⚠️ Last UI disconnected - will ping in ${PING_INTERVAL_MS / 1000}s to check if still alive`);
    
    // Stop ping timer since no UIs are connected
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  } else if (hasSidepanelConnection) {
    // If we still have sidepanel connections, cancel any pending cleanup
    if (pongTimeout) {
      clearTimeout(pongTimeout);
      pongTimeout = null;
      if (LOG_PING_PONG) console.log(prefix, `⏸️ VRAM cleanup cancelled - sidepanel still active (${activeUIConnections.size} connections)`);
    }
  }
};

export const handleUIPong = (senderId: string) => {
  // UI responded to ping - it's alive!
  if (LOG_PING_PONG) {
    console.log(prefix, `🏓 Pong received from UI [ID: ${senderId}]`);
  }
  
  // Cancel the pong timeout since we got a response
  if (pongTimeout) {
    clearTimeout(pongTimeout);
    pongTimeout = null;
    if (LOG_PING_PONG) console.log(prefix, '⏸️ VRAM cleanup cancelled - pong received');
  }
};

export const getActiveUICount = () => activeUIConnections.size;
export const hasActiveUI = () => activeUIConnections.size > 0;

// Legacy function for backward compatibility
export const setUIConnectionActive = (active: boolean) => {
  hasActiveUIConnection = active;
};

// Reset function
export const resetModel = () => {
  transformersModel = null;
  transformersTokenizer = null;
  isTransformersModelReady = false;
  past_key_values_cache = null;
  stopping_criteria.reset();
  currentModelRepoId = null; 
  currentModelQuantPath = null; 
  currentTask = null;
  modelContextLength = 2048;
  numAttentionHeads = undefined;
  numKeyValueHeads = undefined;
  headDim = undefined;
  
  if (LOG_MODEL_LOADING) console.log(prefix, "Model reset complete");
};

// Update inference settings
export const updateInferenceSettings = async () => {
  try {
    const settings = await dbGetInferenceSettings();
    if (settings) {
      inferenceSettings = { ...inferenceSettings, ...settings };
      if (LOG_TRANSFORMERS || LOG_GEN_PARAMS) {
        const settingsInfo = `[updateInferenceSettings] Updated inference settings for transformers.js:
          temperature: ${settings.temperature}
          top_k: ${settings.top_k}
          top_p: ${settings.top_p}
          repetition_penalty: ${settings.repetition_penalty}
          max_new_tokens: ${settings.max_new_tokens}
          do_sample: ${settings.do_sample}
          system_prompt: ${settings.system_prompt ? 'present' : 'not set'}`;
        console.log(prefix, settingsInfo);
      }
    }
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, '[updateInferenceSettings] Error updating settings:', error);
  }
};

// State persistence functions (now using PipelineStateManager)
export const initializePersistentState = async (): Promise<void> => {
  await PipelineStateManager.initialize();
  if (LOG_GENERAL) {
    console.log(prefix, '📂 Persistent state initialized');
  }
};

export const getPersistentState = () => {
  return PipelineStateManager.getState();
};

export const saveLastChatSession = (sessionId: string): void => {
  PipelineStateManager.updateLastChatSession(sessionId);
  if (LOG_GENERAL) {
    console.log(prefix, `💾 Saved last chat session: ${sessionId}`);
  }
};

export const getModelState = () => {
  return {
    isReady: isTransformersModelReady,
    repoId: currentModelRepoId,
    quantPath: currentModelQuantPath
  };
};

export const saveLastLoadedModel = (modelId: string, dtype: string): void => {
  // modelId is the repo path (e.g., "onnx-community/Phi-3.5-mini-instruct-onnx-web")
  // dtype is the quantization (e.g., "q4f16")
  const repoId = modelId;
  const quantPath = dtype;
  
  PipelineStateManager.updateLastLoadedModel(repoId, quantPath);
  if (LOG_GENERAL) {
    console.log(prefix, `💾 Saved last loaded model: ${modelId} (dtype: ${dtype})`);
  }
};

export const restoreLastLoadedModel = async (): Promise<boolean> => {
  const lastModel = PipelineStateManager.getLastLoadedModel();
  if (!lastModel) {
    if (LOG_GENERAL) {
      console.log(prefix, '📂 No last loaded model to restore');
    }
    return false;
  }

  if (LOG_GENERAL) {
    console.log(prefix, `🔄 Attempting to restore last loaded model: ${lastModel.repoId}/${lastModel.quantPath}`);
  }

  try {
    // Check if model is already loaded
    if (isTransformersModelReady && 
        currentModelRepoId === lastModel.repoId && 
        currentModelQuantPath === lastModel.quantPath) {
      if (LOG_GENERAL) {
        console.log(prefix, '✅ Last loaded model already active, no restoration needed');
      }
      return true;
    }

    // Load the model
    await loadModel({
      modelId: lastModel.repoId,        // Just the repo path, not including quant
      dtype: lastModel.quantPath         // Pass quant separately
    });

    if (LOG_GENERAL) {
      console.log(prefix, '✅ Successfully restored last loaded model');
    }
    return true;
  } catch (error) {
    if (LOG_ERROR) {
      console.error(prefix, '❌ Failed to restore last loaded model:', error);
    }
    return false;
  }
};

// Global error handlers
self.addEventListener('error', function(e: ErrorEvent) {
  if (LOG_ERROR) console.error(prefix, 'Global error in background model manager:', e);
  try {
    safePostMessage({ type: WorkerEventNames.ERROR, payload: { error: e.message || e } });
  } catch (err) {
    if (LOG_ERROR) console.error(prefix, 'Failed to postMessage ERROR:', err);
  }
});

self.addEventListener('unhandledrejection', function(e: PromiseRejectionEvent) {
  if (LOG_ERROR) console.error(prefix, 'Unhandled promise rejection in background model manager:', e);
  try {
    safePostMessage({ type: WorkerEventNames.ERROR, payload: { error: (e as any).reason || e } });
  } catch (err) {
    if (LOG_ERROR) console.error(prefix, 'Failed to postMessage ERROR (unhandledrejection):', err);
  }
});