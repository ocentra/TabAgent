/// <reference lib="dom" />
import browser from 'webextension-polyfill';
import { env, AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria } from '@huggingface/transformers';
import { WorkerEventNames, UIEventNames } from './events/eventNames';
import { DEFAULT_INFERENCE_SETTINGS, InferenceSettings } from './Controllers/InferenceSettings';
import { 
  getFromIndexedDB, saveToIndexedDB, getManifestEntry, addManifestEntry, addQuantToManifest, 
  QuantStatus, getInferenceSettings as dbGetInferenceSettings, CHUNK_SIZE, shouldChunkFile, saveChunkedFileSafe, 
  getChunkInfo, assembleChunks, createStreamingResponseFromChunks 
} from './DB/idbModel';

const prefix = '[BackgroundModelManager]';

// Core logging flags
const LOG_ERROR = true;   // Keep error logs enabled
const LOG_WARN = false;   // Disable warning logs

// CORE GENERATION FUNCTIONALITY
const LOG_GEN_PARAMS = true;          // Generation parameters being used
const LOG_GEN_DETAILED = true;        // Detailed generation process logs
const LOG_GEN_COMPARISON = true;      // Parameter comparison logs
const LOG_GEN_ANALYSIS = true;        // Detailed analysis logs

// Legacy Q&A flags (for backward compatibility)
const LOG_QA_START = true;            // Generation lifecycle (start/stop/complete)
const LOG_QA_OUTPUT = true;           // Generated text output
const LOG_QA_STATS = true;            // Output statistics

// Model loading and configuration
const LOG_MODEL_LOADING = false;      // Model loading progress
const LOG_MODEL_CONFIG = false;       // Detailed model configuration
const LOG_TOKEN_IDS = false;          // Token ID extraction

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

// CRITICAL: Disable browser cache to force transformers.js to use our custom fetch
// This ensures ALL model file requests go through our fetch intercept
env.useBrowserCache = false;
if (LOG_TRANSFORMERS || LOG_FETCH_INIT) {
  console.log(prefix, '🚫 Disabled transformers.js browser cache - will use custom fetch for all requests');
}

let currentLoadId: string | undefined = undefined;
let isGenerating = false;
let shouldStopGeneration = false;

let transformersTokenizer: any = null;
let transformersModel: any = null;

// Example-style global variables
const stopping_criteria = new InterruptableStoppingCriteria();
let past_key_values_cache: any = null;
let isTransformersModelReady = false;

// Model configuration variables
let modelContextLength: number = 2048;
let numAttentionHeads: number | undefined;
let numKeyValueHeads: number | undefined;
let headDim: number | undefined;

let currentModelRepoId: string | null = null;
let currentModelQuantPath: string | null = null;
let currentTask: string | null = null;
let inferenceSettings: InferenceSettings = DEFAULT_INFERENCE_SETTINGS;

// WebGPU detection
const _isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
let hasWebGPU: boolean = _isNavigatorGpuAvailable;
let webgpuCheckPromise: Promise<void> = Promise.resolve();

// Throttling for high-frequency manifest logs
let manifestLogCount = 0;
const MANIFEST_LOG_THROTTLE_INTERVAL = 5;

// Throttling for progress messages
let lastProgressLogTime = 0;
const PROGRESS_LOG_THROTTLE_MS = 500; // Log progress messages max once per 500ms

// Safe message posting for different contexts
function safePostMessage(message: any) {
  // Throttle progress message logging
  const isProgressMessage = message.type === UIEventNames.MODEL_WORKER_LOADING_PROGRESS;
  const now = Date.now();
  const shouldLogProgress = !isProgressMessage || (now - lastProgressLogTime >= PROGRESS_LOG_THROTTLE_MS);
  
  if (shouldLogProgress && isProgressMessage) {
    lastProgressLogTime = now;
  }
  
  // In background context, send messages directly to sidepanel
  if (LOG_MESSAGE_PASSING && shouldLogProgress) {
    console.log(prefix, 'Sending message to sidepanel:', message.type, message.payload);
  }
  if (typeof browser !== 'undefined' && browser.runtime) {
    browser.runtime.sendMessage(message).catch((error: any) => {
      if (LOG_ERROR) console.error(prefix, 'Failed to send message to sidepanel:', error);
    });
  }
}

// Initialize WebGPU support
(async () => {
  if (_isNavigatorGpuAvailable) {
    webgpuCheckPromise = (async () => {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) {
          hasWebGPU = false;
        }
      } catch (e) {
        hasWebGPU = false;
      }
    })();
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
})();

// Singleton pattern for model management
export class TextGenerationPipeline {
  private static instance: TextGenerationPipeline | null = null;
  
  public static getInstance(callback?: (data: any) => void): Promise<TextGenerationPipeline> {
    if (TextGenerationPipeline.instance) {
      return Promise.resolve(TextGenerationPipeline.instance);
    }
    
    TextGenerationPipeline.instance = new TextGenerationPipeline();
    return Promise.resolve(TextGenerationPipeline.instance);
  }
  
  private constructor() {
    // Private constructor for singleton
  }
}

// Extract resource URL helper
function extractResourceUrl(input: string | Request | URL): { url: string | undefined; isRequestObject: boolean } {
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

// Rewrite generation config path
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

// Rewrite main model file path
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

// Rewrite supporting file path
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

// Handle model file rewriting
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

// Create empty generation config
function createEmptyGenerationConfig(): Response {
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Extract clean quantization type from file path
function extractCleanDtypeFromPath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return 'fp32';
  
  // Extract filename from path
  const filename = filePath.split('/').pop() || filePath;
  
  // Remove .onnx extension
  const nameWithoutExt = filename.replace(/\.onnx$/, '');
  
  // Extract quantization type from filename (check longer patterns first)
  if (nameWithoutExt.includes('q4f16')) return 'q4f16';
  if (nameWithoutExt.includes('uint8')) return 'uint8';  // Check uint8 before int8
  if (nameWithoutExt.includes('int8')) return 'int8';
  if (nameWithoutExt.includes('bnb4')) return 'bnb4';
  if (nameWithoutExt.includes('q4')) return 'q4';
  if (nameWithoutExt.includes('q8')) return 'q8';
  if (nameWithoutExt.includes('fp16')) return 'fp16';
  if (nameWithoutExt.includes('fp32')) return 'fp32';
  if (nameWithoutExt.includes('quantized')) return 'quantized';
  
  // Default to fp32 if no match (for "model.onnx" files)
  return 'fp32';
}

// Filter scraped content
function filterScrapedContent(messages: Array<{role: string, content: string}>): Array<{role: string, content: string}> {
  if (LOG_TRANSFORMERS) {
    console.log(prefix, `[filterScrapedContent] Processing ${messages.length} messages`);
  }
  
  return messages.map((msg, index) => {
    let content = msg.content.trim();
    let isJsonContent = false;
    let jsonData = null;
    
    // Check for markdown-wrapped JSON (``json ... ```)
    if (content.startsWith('```json') && content.endsWith('```')) {
      try {
        const jsonStart = content.indexOf('```json') + 7; // Skip ```json
        const jsonEnd = content.lastIndexOf('```');
        const jsonString = content.substring(jsonStart, jsonEnd).trim();
        jsonData = JSON.parse(jsonString);
        isJsonContent = true;
      } catch (error) {
        // If JSON parsing fails, treat as regular content
      }
    }
    // Check for direct JSON (starts with { and ends with })
    else if (content.startsWith('{') && content.endsWith('}')) {
      try {
        jsonData = JSON.parse(content);
        isJsonContent = true;
      } catch (error) {
        // If JSON parsing fails, treat as regular content
      }
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
      // Extract only essential fields
      const filteredContent = {
        title: jsonData.title || 'Untitled',
        text: jsonData.text || jsonData.content || '',
        url: jsonData.url || ''
      };
      
      const newContent = `Title: ${filteredContent.title}\nURL: ${filteredContent.url}\nContent: ${filteredContent.text}`;
      
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

// Set manifest quant status
async function setManifestQuantStatus(repo: string, dtype: string, status: QuantStatus) {
  try {
    let manifest = await getManifestEntry(repo);
    if (!manifest) {
      if (LOG_ERROR) console.warn(prefix, `[setManifestQuantStatus] No manifest found for repo: ${repo}`);
      return;
    }
    
    // Find ALL manifest entries that correspond to this dtype
    const entriesToUpdate: string[] = [];
    for (const [modelPath, quantInfo] of Object.entries(manifest.quants)) {
      if (quantInfo.dtype === dtype) {
        entriesToUpdate.push(modelPath);
      }
    }
    
    if (entriesToUpdate.length === 0) {
      if (LOG_ERROR) console.warn(prefix, `[setManifestQuantStatus] No manifest entries found for dtype: ${dtype} in repo: ${repo}`);
      return;
    }
    
    // Update the status of ALL found entries
    for (const entryKey of entriesToUpdate) {
      if (manifest.quants[entryKey]) {
        manifest.quants[entryKey].status = status;
        manifestLogCount++;
        if (LOG_MESSAGES && (manifestLogCount % MANIFEST_LOG_THROTTLE_INTERVAL === 0 || manifestLogCount === 1)) {
          console.log(prefix, `[setManifestQuantStatus] ✅ Updated quant entry: ${entryKey} (dtype: ${dtype}) to status: ${status} (operation #${manifestLogCount})`);
        }
      }
    }
    
    await addManifestEntry(repo, manifest);
    safePostMessage({ type: WorkerEventNames.MANIFEST_UPDATED });
  } catch (error) {
    if (LOG_ERROR) console.error(prefix, `[setManifestQuantStatus] Error updating manifest:`, error);
  }
}

// Try to serve from IndexedDB
async function tryServeFromIndexedDB(resourceUrl: string): Promise<Response | null> {
  if (!resourceUrl.includes('/resolve/main/') && !resourceUrl.includes('/resolve/')) {
    return null;
  }
  
  try {
    const urlParts = resourceUrl.split('/');
    const fileName = urlParts.slice(urlParts.indexOf('main') + 1).join('/'); // Get everything after '/main/'
    const modelId = currentModelRepoId;
    
    if (modelId) {
      const chunkedInfo = await getChunkInfo(modelId, fileName);
      if (chunkedInfo.isChunked && chunkedInfo.totalChunks && chunkedInfo.totalSize) {
        if (LOG_CHUNKED) {
          console.log(prefix, `🔄 [tryServeFromIndexedDB] FOUND CHUNKED FILE: ${fileName}`);
          console.log(prefix, `   Total chunks: ${chunkedInfo.totalChunks}, Total size: ${(chunkedInfo.totalSize / 1024 / 1024).toFixed(1)}MB`);
        }
        try {
          // For files over 100MB, use streaming to avoid RAM issues
          if (chunkedInfo.totalSize > 100 * 1024 * 1024) {
            if (LOG_CHUNKED) console.log(prefix, `   Using streaming response (file > 100MB)`);
            return await createStreamingResponseFromChunks(modelId, fileName, chunkedInfo.totalChunks, chunkedInfo.totalSize);
          } else {
            if (LOG_CHUNKED) console.log(prefix, `   Assembling in memory (file < 100MB)`);
            // For smaller chunked files, assemble in memory
            const assembledBuffer = await assembleChunks(modelId, fileName, chunkedInfo.totalChunks, chunkedInfo.totalSize);
            
            const headers = new Headers();
            if (resourceUrl.endsWith('.json')) {
              headers.set('Content-Type', 'application/json');
            } else {
              headers.set('Content-Type', 'application/octet-stream');
            }
            headers.set('Content-Length', assembledBuffer.byteLength.toString());
            
            return new Response(assembledBuffer, { headers });
          }
        } catch (assembleError) {
          // Fall through to regular cache check
        }
      }
    }
    
    // Fall back to regular cache check
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
    return null;
  }
}

// Determine fetch input
function determineFetchInput(input: string | Request | URL, resourceUrl: string): { fetchInput: string | Request | URL; isRewritten: boolean } {
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

// Save to dual IndexedDB
async function saveToDualIndexedDB(resourceUrl: string, blob: Blob, originalInput: string | Request | URL): Promise<void> {
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

// Fetch from network and cache
async function fetchFromNetworkAndCache(input: string | Request | URL, resourceUrl: string, options?: any): Promise<Response> {
  const { fetchInput } = determineFetchInput(input, resourceUrl);
  if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Fetching from: ${resourceUrl}, fetchInput: ${fetchInput}`);
  
  // Send download start event (progress range: 0-25%)
  const fileName = resourceUrl.split('/').pop() || 'file';
  safePostMessage({ 
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
    if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Updating manifest status: repo="${currentModelRepoId}", dtype="${currentModelQuantPath}", status=Available`);
    try {
      await setManifestQuantStatus(currentModelRepoId, currentModelQuantPath, QuantStatus.Available);
    } catch (manifestError) {
      if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Failed to update manifest status on download start:', manifestError);
    }
  }
  
  const resp = await originalFetch.call(self, fetchInput, options);
  if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Response: status=${resp.status}, statusText=${resp.statusText}, ok=${resp.ok}`);
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
            safePostMessage({ 
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
        safePostMessage({ 
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
        
        // Create new response with the reconstructed body
        const blob = new Blob([allChunks]);
        const fileSize = blob.size;
        
        // Check if file should be chunked (large files) - STREAMING PATH
        if (shouldChunkFile(fileSize)) {
          if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Large file detected (${fileSize} bytes), will chunk: ${resourceUrl}`);
          if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] File size: ${fileSize}, CHUNK_SIZE: ${CHUNK_SIZE}, shouldChunk: ${shouldChunkFile(fileSize)}`);
          
          try {
            await saveChunkedFileSafe(resourceUrl, blob, currentModelRepoId!);
            if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved chunked file: ${resourceUrl}`);
            
            // Verify chunks were saved
            const urlParts = resourceUrl.split('/');
            const fileName = urlParts.slice(urlParts.indexOf('main') + 1).join('/');
            const modelId = currentModelRepoId;
            if (modelId) {
              const manifestKey = `${modelId}/${fileName}:manifest`;
              const manifest = await getFromIndexedDB(manifestKey);
              if (manifest) {
                const manifestData = await manifest.text();
                const manifestObj = JSON.parse(manifestData);
                if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Chunking verification: ${manifestObj.totalChunks} chunks saved for ${fileName}`);
              } else {
                if (LOG_ERROR) console.error(prefix, `[fetchFromNetworkAndCache] Chunking verification failed: No manifest found for ${fileName}`);
              }
            }
          } catch (chunkError) {
            if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Error saving chunked file:', resourceUrl, chunkError);
            // Fall back to regular storage
            await saveToDualIndexedDB(resourceUrl, blob, input);
          }
        } else {
          // Regular file storage - STREAMING PATH
          if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Small file (${fileSize} bytes), using regular storage: ${resourceUrl}`);
          try {
            await saveToDualIndexedDB(resourceUrl, blob, input);
            if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved regular file: ${resourceUrl}`);
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
  if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] File size detection: blob.size=${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
  
  // Send download complete event (25% for download completion)
  safePostMessage({ 
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
    if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] File size: ${fileSize}, CHUNK_SIZE: ${CHUNK_SIZE}, shouldChunk: ${shouldChunkFile(fileSize)}`);
    
    try {
      await saveChunkedFileSafe(resourceUrl, blob, currentModelRepoId!);
      if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved chunked file: ${resourceUrl}`);
      
      // Verify chunks were saved
      const urlParts = resourceUrl.split('/');
      const fileName = urlParts.slice(urlParts.indexOf('main') + 1).join('/');
      const modelId = currentModelRepoId;
      if (modelId) {
        const manifestKey = `${modelId}/${fileName}:manifest`;
        const manifest = await getFromIndexedDB(manifestKey);
        if (manifest) {
          const manifestData = await manifest.text();
          const manifestObj = JSON.parse(manifestData);
          if (LOG_CHUNKED) console.log(prefix, `[fetchFromNetworkAndCache] Chunking verification: ${manifestObj.totalChunks} chunks saved for ${fileName}`);
        } else {
          if (LOG_ERROR) console.error(prefix, `[fetchFromNetworkAndCache] Chunking verification failed: No manifest found for ${fileName}`);
        }
      }
    } catch (chunkError) {
      if (LOG_ERROR) console.error(prefix, '[fetchFromNetworkAndCache] Error saving chunked file:', resourceUrl, chunkError);
      // Fall back to regular storage
      await saveToDualIndexedDB(resourceUrl, blob, input);
    }
  } else {
    // Regular file storage
    if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Small file (${fileSize} bytes), using regular storage: ${resourceUrl}`);
    try {
      await saveToDualIndexedDB(resourceUrl, blob, input);
      if (LOG_FETCH) console.log(prefix, `[fetchFromNetworkAndCache] Successfully saved regular file: ${resourceUrl}`);
    } catch (dbError) {
      if (LOG_ERROR) console.error(prefix, '[IDB TRACE] Error saving to IndexedDB:', resourceUrl, dbError);
    }
  }
  
  return resp;
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

// Override global fetch for caching
const customFetchHandler = async function(input: string | Request | URL, options?: any): Promise<Response> {
  const { url: resourceUrl } = extractResourceUrl(input);
  
  // Log ALL fetch requests to see what's being requested
  if (LOG_FETCH_DETAILED) {
    const fetchInfo = `🌐 [Custom Fetch] INTERCEPTED:
      url: ${resourceUrl}
      inputType: ${typeof input}
      isString: ${typeof input === 'string'}
      isRequest: ${input instanceof Request}
      isURL: ${input instanceof URL}`;
    console.log(prefix, fetchInfo);
  }
  
  // Debug: Check if this is a model file request
  if (LOG_FETCH && resourceUrl && (resourceUrl.includes('.onnx') || resourceUrl.includes('.bin'))) {
    console.log(prefix, '🔍 [Custom Fetch] DETECTED MODEL FILE REQUEST:', resourceUrl);
  }

  if (resourceUrl) {
    // Check if this is a model-related file that should be cached/chunked
    const isHuggingFaceModelFile = resourceUrl.includes('huggingface.co') || resourceUrl.includes('/resolve/');
    const isLocalWasmOrModelFile = resourceUrl.startsWith('chrome-extension://') && 
                                   (resourceUrl.endsWith('.wasm') || 
                                    resourceUrl.includes('.onnx') || 
                                    resourceUrl.includes('.bin') || 
                                    resourceUrl.includes('.pt') ||
                                    resourceUrl.includes('.safetensors'));
    
    if (LOG_FETCH) {
      const fileTypeCheck = `[Custom Fetch] File type check:
        resourceUrl: ${resourceUrl}
        isHuggingFaceModelFile: ${isHuggingFaceModelFile}
        isLocalWasmOrModelFile: ${isLocalWasmOrModelFile}
        shouldIntercept: ${isHuggingFaceModelFile || isLocalWasmOrModelFile}`;
      console.log(prefix, fileTypeCheck);
    }

    if (isHuggingFaceModelFile || isLocalWasmOrModelFile) {
      // Handle HuggingFace files with rewriting
      let finalResourceUrl = resourceUrl;
      if (isHuggingFaceModelFile) {
        finalResourceUrl = await handleModelFileRewriting(resourceUrl);
        if (LOG_DEBUG && resourceUrl.includes('model_q4f16.onnx')) {
          if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Original URL: ${resourceUrl}`);
          if (LOG_FETCH) console.log(prefix, `[Custom Fetch] DEBUG - Final URL: ${finalResourceUrl}`);
        }
        
        // Handle model.onnx -> model_q4f16.onnx mapping
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
        
        // Handle generation_config.json fallback
        if (finalResourceUrl.endsWith('generation_config.json') && finalResourceUrl !== resourceUrl) {
          const configFiles = ['generation_config.json', 'genai_config.json', 'config.json'];
          const fileName = finalResourceUrl.split('/').pop() || '';
          if (!configFiles.includes(fileName)) {
            if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Creating empty generation config for: ${fileName}`);
            return createEmptyGenerationConfig();
          }
        }
      }
      
      if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Checking IndexedDB cache for: ${finalResourceUrl}`);
      const cachedResponse = await tryServeFromIndexedDB(finalResourceUrl);
      if (cachedResponse) {
        const fileSize = cachedResponse.headers.get('Content-Length');
        const sizeMB = fileSize ? (parseInt(fileSize) / 1024 / 1024).toFixed(1) : 'unknown';
        if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ✅ SERVING FROM INDEXEDDB: ${finalResourceUrl} (${sizeMB}MB)`);
        return cachedResponse;
      } else {
        if (LOG_FETCH) console.log(prefix, `[Custom Fetch] ❌ CACHE MISS, will download: ${finalResourceUrl}`);
      }

      if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Downloading and caching file: ${finalResourceUrl}`);
      return await fetchFromNetworkAndCache(input, finalResourceUrl, options);
    } else {
      if (LOG_FETCH) console.log(prefix, `[Custom Fetch] Using original fetch for non-model file: ${resourceUrl}`);
      return originalFetch.call(self, input, options);
    }
  }
  
  if (LOG_FETCH) console.log(prefix, `[Custom Fetch] No resourceUrl, using original fetch.`);
  return originalFetch.call(self, input, options);
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

export const generate = async (messages: Array<{role: string, content: string}>, callback?: (data: any) => void) => {
  if (LOG_GENERATION_FLOW) {
    const stateInfo = `🎯 GENERATE called - State check:
      isTransformersModelReady: ${isTransformersModelReady}
      hasTokenizer: ${!!transformersTokenizer}
      hasModel: ${!!transformersModel}
      currentModelRepoId: ${currentModelRepoId}
      currentModelQuantPath: ${currentModelQuantPath}`;
    console.log(prefix, stateInfo);
  }
  
  if (!isTransformersModelReady || !transformersTokenizer || !transformersModel) {
    const error = 'Model not ready. Please load a model first.';
    if (LOG_GENERATION_FLOW) console.error(prefix, '❌ GENERATE BLOCKED - Model not ready!');
    if (callback) {
      callback({ status: 'error', error });
    } else {
      safePostMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: { error } });
    }
    return;
  }
  
  try {
    isGenerating = true;
    shouldStopGeneration = false;
    stopping_criteria.reset();
    
    if (LOG_QA_START) console.log(prefix, '🚀 Generation started');
    
    const settings = inferenceSettings;
    
    // Log current settings for debugging
    if (LOG_GEN_PARAMS) {
      console.log(prefix, 'Current inference settings:');
      console.log(prefix, `  temperature: ${settings.temperature}`);
      console.log(prefix, `  max_length: ${settings.max_length}`);
      console.log(prefix, `  max_new_tokens: ${settings.max_new_tokens}`);
      console.log(prefix, `  top_k: ${settings.top_k}`);
      console.log(prefix, `  top_p: ${settings.top_p}`);
      console.log(prefix, `  repetition_penalty: ${settings.repetition_penalty}`);
      console.log(prefix, `  do_sample: ${settings.do_sample}`);
    }
    
    let messagesForTemplate: Array<{role: string, content: string}> = [];
    
    if (settings.system_prompt && typeof settings.system_prompt === 'string' && settings.system_prompt.trim().length > 0) {
      if (!(Array.isArray(messages) && messages.some(msg => msg.role === 'system'))) {
        messagesForTemplate.push({ role: 'system', content: settings.system_prompt });
      }
    }
    
    if (Array.isArray(messages)) {
      messagesForTemplate.push(...messages);
    }
    
    // Filter scraped content
    const filteredMessages = filterScrapedContent(messagesForTemplate);
    
    if (LOG_GEN_DETAILED) {
      console.log(prefix, `[generate] Original messages:`, messagesForTemplate.length);
      console.log(prefix, `[generate] Filtered messages:`, filteredMessages.length);
    }
    
    if (LOG_GEN_ANALYSIS) {
      console.log(prefix, `[generate] 📨 MESSAGE DETAILS:`);
      console.log(prefix, `  Original messages:`, messagesForTemplate);
      console.log(prefix, `  Filtered messages:`, filteredMessages);
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
    
    const padTokenId = transformersTokenizer?.pad_token_id ?? settings.pad_token_id;
    const bosTokenId = transformersTokenizer?.bos_token_id ?? settings.bos_token_id;
    const eosTokenId = transformersTokenizer?.eos_token_id ?? settings.eos_token_id;
    
    // Calculate effective max length - prioritize model's context length over user settings
    // For modern models with large context windows, use the model's actual capacity
    const effectiveMaxLength = modelContextLength;
    if (LOG_GEN_DETAILED) {
      console.log(prefix, '[generate] Context length calculation:');
      console.log(prefix, '  settingsMaxLength:', settings.max_length);
      console.log(prefix, '  modelContextLength:', modelContextLength);
      console.log(prefix, '  effectiveMaxLength:', effectiveMaxLength);
      console.log(prefix, '  strategy: using model context length (not user settings)');
    }
    
    const generateParams = {
      ...inputs,
      do_sample: settings.do_sample,
      top_k: settings.top_k,
      temperature: settings.temperature,
      top_p: settings.top_p,
      repetition_penalty: settings.repetition_penalty,
      max_new_tokens: settings.max_new_tokens,
      no_repeat_ngram_size: settings.no_repeat_ngram_size,
      min_length: settings.min_length,
      max_length: effectiveMaxLength,
      pad_token_id: padTokenId,
      bos_token_id: bosTokenId,
      eos_token_id: eosTokenId,
      streamer: ourStreamer,
      stopping_criteria,
    };
    
    // Detailed parameter logging
    if (LOG_GEN_PARAMS) {
      const detailedParams = `[generate] 📋 DETAILED GENERATION PARAMETERS:
        Input Info:
            input_ids length: ${inputs.input_ids.length}
            attention_mask length: ${inputs.attention_mask.length}
        
        Core Generation:
            do_sample: ${generateParams.do_sample}
            temperature: ${generateParams.temperature}
            top_k: ${generateParams.top_k}
            top_p: ${generateParams.top_p}
            repetition_penalty: ${generateParams.repetition_penalty}
            max_new_tokens: ${generateParams.max_new_tokens}
            min_length: ${generateParams.min_length}
            max_length: ${generateParams.max_length} (effective: ${effectiveMaxLength})
        
        Token Control:
            pad_token_id: ${generateParams.pad_token_id}
            bos_token_id: ${generateParams.bos_token_id}
            eos_token_id: ${generateParams.eos_token_id}
        
        Advanced:
            no_repeat_ngram_size: ${generateParams.no_repeat_ngram_size}
            has_streamer: ${!!generateParams.streamer}
            has_stopping_criteria: ${!!generateParams.stopping_criteria}`;
      console.log(prefix, detailedParams);
    }
    
    // Log key generation parameters for debugging (as string to avoid truncation)
    if (LOG_GEN_PARAMS) {
      const activeParams = `[generate] 🔧 ACTIVE GENERATION PARAMETERS:
        temperature: ${generateParams.temperature}
        max_length: ${generateParams.max_length} (effective: ${effectiveMaxLength})
        max_new_tokens: ${generateParams.max_new_tokens}
        top_k: ${generateParams.top_k}
        top_p: ${generateParams.top_p}
        repetition_penalty: ${generateParams.repetition_penalty}
        length_penalty: ${settings.length_penalty}
        no_repeat_ngram_size: ${generateParams.no_repeat_ngram_size}
        do_sample: ${generateParams.do_sample}`;
      
      console.log(prefix, activeParams);
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
      callback({ status: 'error', error: error.message || 'Generation failed' });
    } else {
      safePostMessage({ 
        type: WorkerEventNames.GENERATION_ERROR, 
        payload: { error: error.message || 'Generation failed' } 
      });
    }
  } finally {
    if (LOG_QA_START) console.log(prefix, '🔄 Generation state reset');
    isGenerating = false;
    shouldStopGeneration = false;
  }
};

// Enhanced Model loading function
export const loadModel = async (payload: { modelId: string, dtype: string, task?: string, loadId?: string }, callback?: (data: any) => void): Promise<void> => {
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
      callback({ status: 'initiate', file: dtype, progress: 0, loadId });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: 'initiate', file: dtype, progress: 0, loadId } 
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
        status: 'loading', 
        file: 'tokenizer', 
        progress: 10, 
        loadId,
        message: 'Loading tokenizer from cache...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: 'loading', 
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
        if (LOG_TRANSFORMERS) {
          if (LOG_MODEL_LOADING) {
            const modelConfigInfo = `[loadModel] Model config loaded:
              max_position_embeddings: ${modelConfig?.max_position_embeddings}
              n_positions: ${modelConfig?.n_positions}
              max_sequence_length: ${modelConfig?.max_sequence_length}
              n_ctx: ${modelConfig?.n_ctx}
              context_length: ${modelConfig?.context_length}
              eos_token_id: ${modelConfig?.eos_token_id}
              pad_token_id: ${modelConfig?.pad_token_id}
              bos_token_id: ${modelConfig?.bos_token_id}
              tokenizer_class: ${modelConfig?.tokenizer_class}
              num_attention_heads: ${modelConfig?.num_attention_heads}
              num_key_value_heads: ${modelConfig?.num_key_value_heads}
              hidden_size: ${modelConfig?.hidden_size}
              n_embd: ${modelConfig?.n_embd}
              head_dim: ${modelConfig?.head_dim}
              vocab_size: ${modelConfig?.vocab_size}
              model_type: ${modelConfig?.model_type}
              architectures: ${modelConfig?.architectures?.join(', ')}`;
            console.log(prefix, modelConfigInfo);
          }
        }
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
      const contextLengthInfo = `[loadModel] Model context length extracted:
        Full model config keys: ${Object.keys(modelConfig || {}).join(', ')}
        modelConfigContextLength: ${modelConfigContextLength}
        userMaxLength: ${userMaxLength}
        final modelContextLength: ${modelContextLength}
        source: ${modelConfigContextLength ? 'model-config' : 'user-settings'}
        max_position_embeddings: ${modelConfig?.max_position_embeddings}
        n_positions: ${modelConfig?.n_positions}
        max_sequence_length: ${modelConfig?.max_sequence_length}
        n_ctx: ${modelConfig?.n_ctx}
        context_length: ${modelConfig?.context_length}`;
      console.log(prefix, contextLengthInfo);
      
      // Keep JSON.stringify separate for full config dump (only when MODEL_CONFIG debug is on)
      if (LOG_MODEL_CONFIG) {
        console.log(prefix, '[loadModel] Full model config JSON:', JSON.stringify(modelConfig, null, 2));
      }
    }
    
    // Extract model architecture details and store globally
    numAttentionHeads = modelConfig?.num_attention_heads || modelConfig?.n_head || modelConfig?.num_heads;
    const hiddenSize = modelConfig?.hidden_size || modelConfig?.n_embd;
    numKeyValueHeads = modelConfig?.num_key_value_heads || numAttentionHeads;
    headDim = (hiddenSize && numAttentionHeads) ? (modelConfig?.head_dim || hiddenSize / numAttentionHeads) : undefined;
    
    if (LOG_TRANSFORMERS) {
      const archInfo = `[loadModel] Model architecture:
        numAttentionHeads: ${numAttentionHeads}
        hiddenSize: ${hiddenSize}
        numKeyValueHeads: ${numKeyValueHeads}
        headDim: ${headDim}`;
      console.log(prefix, archInfo);
    }
    
    // Extract token IDs from tokenizer and config with advanced fallback logic
    let eosTokenId: number | undefined = undefined;
    let padTokenId: number | undefined = undefined;
    let bosTokenId: number | undefined = undefined;
    
    if (transformersTokenizer) {
      // Try tokenizer first
      eosTokenId = transformersTokenizer.eos_token_id;
      padTokenId = transformersTokenizer.pad_token_id;
      bosTokenId = transformersTokenizer.bos_token_id;
      
      if (LOG_TRANSFORMERS && LOG_TOKEN_IDS) {
        const tokenizerTokenInfo = `[loadModel] Tokenizer token IDs:
          eos_token_id: ${eosTokenId}
          pad_token_id: ${padTokenId}
          bos_token_id: ${bosTokenId}`;
        console.log(prefix, tokenizerTokenInfo);
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
      
      if (LOG_TRANSFORMERS && LOG_TOKEN_IDS) {
        const fallbackTokenInfo = `[loadModel] Final token IDs after fallback:
          eos_token_id: ${eosTokenId}
          pad_token_id: ${padTokenId}
          bos_token_id: ${bosTokenId}`;
        console.log(prefix, fallbackTokenInfo);
      }
    }
    
    // Fallback to user settings if still not set
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
    
    if (LOG_TRANSFORMERS && LOG_TOKEN_IDS) {
      const finalTokenInfo = `[loadModel] Final token IDs after user settings fallback:
        eos_token_id: ${eosTokenId} (source: ${eosTokenId === currentSettings?.eos_token_id ? 'user-settings' : 'model/tokenizer'})
        pad_token_id: ${padTokenId} (source: ${padTokenId === currentSettings?.pad_token_id ? 'user-settings' : 'model/tokenizer'})
        bos_token_id: ${bosTokenId} (source: ${bosTokenId === currentSettings?.bos_token_id ? 'user-settings' : 'model/tokenizer'})`;
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
        status: 'loading', 
        file: 'model', 
        progress: 30, 
        loadId,
        message: 'Loading model from cache...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: 'loading', 
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
        status: 'processing', 
        file: 'model', 
        progress: 90, 
        loadId,
        message: 'Initializing model...'
      });
    } else {
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { 
          status: 'processing', 
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
    await setManifestQuantStatus(modelId, dtype, QuantStatus.Downloaded);
    
    // Send completion messages
    if (callback) {
      callback({ 
        status: 'done', 
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
          status: 'done', 
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
      await setManifestQuantStatus(modelId, dtype, QuantStatus.Failed);
    } catch (manifestError) {
      if (LOG_ERROR) console.error(prefix, `[loadModel] Failed to update manifest status on error:`, manifestError);
    }
    
    if (callback) {
      callback({ status: 'error', file: dtype, error: error.message, loadId });
    } else {
      safePostMessage({ 
        type: WorkerEventNames.ERROR, 
        payload: { error: `Failed to load model ${dtype}: ${error.message}` }
      });
      safePostMessage({ 
        type: UIEventNames.MODEL_WORKER_LOADING_PROGRESS, 
        payload: { status: 'error', file: dtype, error: error.message, loadId } 
      });
    }
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