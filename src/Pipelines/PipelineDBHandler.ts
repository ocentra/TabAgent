/// <reference lib="dom" />
import { 
  getManifestEntry, 
  addManifestEntry, 
  addQuantToManifest, 
  QuantStatus,
  saveToIndexedDB,
  getFromIndexedDB,
  getChunkInfo,
  assembleChunks,
  createStreamingResponseFromChunks,
  shouldChunkFile,
  saveChunkedFileSafe
} from '../DB/idbModel';

const prefix = '[PipelineDBHandler]';

// Logging flags
const LOG_GENERAL = false;
const LOG_ERROR = true;
const LOG_MESSAGES = false;

// Throttling for high-frequency manifest logs
let manifestLogCount = 0;
const MANIFEST_LOG_THROTTLE_INTERVAL = 5;

/**
 * PipelineDBHandler - Handles IndexedDB operations for pipelines
 * Manages manifest updates, file path rewriting, and dtype extraction
 */
export class PipelineDBHandler {
  /**
   * Extract clean quantization type from file path
   * 
   * @param filePath - Path to the model file
   * @returns Clean dtype string (e.g., 'q4f16', 'fp32')
   */
  static extractCleanDtypeFromPath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') return 'fp32';

    // Extract filename from path
    const filename = filePath.split('/').pop() || filePath;

    // Remove .onnx extension
    const nameWithoutExt = filename.replace(/\.onnx$/, '');

    // Extract quantization type from filename (check longer patterns first)
    if (nameWithoutExt.includes('q4f16')) return 'q4f16';
    if (nameWithoutExt.includes('uint8')) return 'uint8'; // Check uint8 before int8
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

  /**
   * Set manifest quant status for a model
   * Updates all manifest entries matching the dtype
   * 
   * @param repo - Repository ID
   * @param dtype - Quantization type
   * @param status - New status to set
   * @param onUpdate - Optional callback when manifest is updated
   */
  static async setManifestQuantStatus(
    repo: string,
    dtype: string,
    status: QuantStatus,
    onUpdate?: () => void
  ): Promise<void> {
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
        if (LOG_ERROR)
          console.warn(
            prefix,
            `[setManifestQuantStatus] No manifest entries found for dtype: ${dtype} in repo: ${repo}`
          );
        return;
      }

      // Update the status of ALL found entries
      for (const entryKey of entriesToUpdate) {
        if (manifest.quants[entryKey]) {
          manifest.quants[entryKey].status = status;
          manifestLogCount++;
          if (LOG_MESSAGES && (manifestLogCount % MANIFEST_LOG_THROTTLE_INTERVAL === 0 || manifestLogCount === 1)) {
            console.log(
              prefix,
              `[setManifestQuantStatus] ✅ Updated quant entry: ${entryKey} (dtype: ${dtype}) to status: ${status} (operation #${manifestLogCount})`
            );
          }
        }
      }

      await addManifestEntry(repo, manifest);
      
      // Call optional update callback
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      if (LOG_ERROR) console.error(prefix, `[setManifestQuantStatus] Error updating manifest:`, error);
    }
  }

  /**
   * Rewrite generation config path to match available files
   * 
   * @param resourceUrl - Original resource URL
   * @param files - Available files from manifest
   * @returns Rewritten URL or original if no match
   */
  static async rewriteGenerationConfigPath(resourceUrl: string, files: string[]): Promise<string> {
    const resourceFileName = resourceUrl.split('/').pop() || '';

    if (resourceFileName !== 'generation_config.json') {
      return resourceUrl;
    }

    const exact = files.find((f) => f.endsWith('/generation_config.json') || f === 'generation_config.json');
    if (exact) {
      const exactFile = exact.split('/').pop() || 'generation_config.json';
      return resourceUrl.replace('generation_config.json', exactFile);
    }

    const genai = files.find((f) => f.endsWith('genai_config.json'));
    if (genai) {
      return resourceUrl.replace('generation_config.json', 'genai_config.json');
    }

    const config = files.find((f) => f.endsWith('config.json'));
    if (config) {
      return resourceUrl.replace('generation_config.json', 'config.json');
    }

    return resourceUrl;
  }

  /**
   * Rewrite main model file path to match manifest
   * 
   * @param resourceUrl - Original resource URL
   * @param resourceFileName - File name from URL
   * @param files - Available files from manifest
   * @returns Rewritten URL or original if no match
   */
  static async rewriteMainModelFilePath(
    resourceUrl: string,
    resourceFileName: string,
    files: string[]
  ): Promise<string> {
    if (!resourceFileName.endsWith('.onnx')) {
      return resourceUrl;
    }
    const manifestFile = files.find((f) => f.endsWith(resourceFileName));
    if (manifestFile && resourceUrl.endsWith(manifestFile)) {
      return resourceUrl;
    }
    const quantFile = files.find((f) => f.endsWith('.onnx'));
    if (quantFile) {
      return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${quantFile}`);
    }
    return resourceUrl;
  }

  /**
   * Rewrite supporting file path (json, bin, pt, txt, model)
   * 
   * @param resourceUrl - Original resource URL
   * @param resourceFileName - File name from URL
   * @param files - Available files from manifest
   * @returns Rewritten URL or original if no match
   */
  static async rewriteSupportingFilePath(
    resourceUrl: string,
    resourceFileName: string,
    files: string[]
  ): Promise<string> {
    const SUPPORTING_FILE_REGEX = /\.(json|bin|pt|txt|model)$/i;
    if (!SUPPORTING_FILE_REGEX.test(resourceFileName)) {
      return resourceUrl;
    }

    const manifestPath = files.find((f) => f.endsWith('/' + resourceFileName) || f === resourceFileName);
    if (manifestPath && !resourceUrl.endsWith(manifestPath)) {
      return resourceUrl.replace(/resolve\/main\/.*$/, `resolve/main/${manifestPath}`);
    }
    return resourceUrl;
  }

  /**
   * Handle model file rewriting based on manifest
   * Coordinates all rewriting logic
   * 
   * @param resourceUrl - Original resource URL
   * @param currentModelRepoId - Current model repository ID
   * @param currentModelQuantPath - Current model quantization path
   * @returns Rewritten URL or original
   */
  static async handleModelFileRewriting(
    resourceUrl: string,
    currentModelRepoId: string | null,
    currentModelQuantPath: string | null
  ): Promise<string> {
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
    let rewrittenUrl = await this.rewriteGenerationConfigPath(resourceUrl, files);

    if (rewrittenUrl === resourceUrl && resourceFileName === 'generation_config.json') {
      return rewrittenUrl;
    }

    rewrittenUrl = await this.rewriteMainModelFilePath(rewrittenUrl, resourceFileName, files);
    rewrittenUrl = await this.rewriteSupportingFilePath(rewrittenUrl, resourceFileName, files);

    return rewrittenUrl;
  }

  /**
   * Create empty generation config response
   * Used as fallback when config file is not found
   * 
   * @returns Response with empty JSON object
   */
  static createEmptyGenerationConfig(): Response {
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  /**
   * Fetch model configuration from HuggingFace
   * 
   * @param modelId - HuggingFace model ID (e.g., 'openai/whisper-tiny')
   * @returns Model config JSON or null if not found
   */
  static async fetchModelConfig(modelId: string): Promise<any | null> {
    try {
      const configUrl = `https://huggingface.co/${modelId}/resolve/main/config.json`;
      if (LOG_GENERAL) console.log(prefix, '[fetchModelConfig] Fetching from:', configUrl);
      
      const configResponse = await fetch(configUrl);
      if (configResponse.ok) {
        const config = await configResponse.json();
        if (LOG_GENERAL) console.log(prefix, '[fetchModelConfig] Config loaded successfully');
        return config;
      }
      
      if (LOG_GENERAL) console.log(prefix, '[fetchModelConfig] Config not found (non-OK response)');
      return null;
    } catch (error) {
      if (LOG_ERROR) console.error(prefix, '[fetchModelConfig] Failed to load model config:', error);
      return null;
    }
  }

  /**
   * Extract context length from model config
   * 
   * @param modelConfig - Model configuration object
   * @param userFallback - Fallback value from user settings
   * @returns Context length
   */
  static extractContextLength(modelConfig: any, userFallback: number): number {
    if (!modelConfig) return userFallback;
    
    const contextLength = modelConfig.max_position_embeddings || 
                         modelConfig.n_positions || 
                         modelConfig.max_sequence_length ||
                         modelConfig.n_ctx ||
                         modelConfig.context_length;
    
    return contextLength || userFallback;
  }

  /**
   * Extract model architecture details from config
   * 
   * @param modelConfig - Model configuration object
   * @returns Architecture details (attention heads, dimensions, etc.)
   */
  static extractArchitecture(modelConfig: any): {
    numAttentionHeads?: number;
    numKeyValueHeads?: number;
    headDim?: number;
  } {
    if (!modelConfig) {
      return {
        numAttentionHeads: undefined,
        numKeyValueHeads: undefined,
        headDim: undefined
      };
    }
    
    const numAttentionHeads = modelConfig.num_attention_heads || modelConfig.n_head || modelConfig.num_heads;
    const hiddenSize = modelConfig.hidden_size || modelConfig.n_embd;
    const numKeyValueHeads = modelConfig.num_key_value_heads || numAttentionHeads;
    const headDim = (hiddenSize && numAttentionHeads) ? (modelConfig.head_dim || hiddenSize / numAttentionHeads) : undefined;
    
    return {
      numAttentionHeads,
      numKeyValueHeads,
      headDim
    };
  }

  /**
   * Fetch model metadata (config, context length, architecture) in one call
   * Combines fetchModelConfig, extractContextLength, and extractArchitecture
   * 
   * @param modelId - HuggingFace model ID
   * @param userMaxLengthFallback - Fallback context length from user settings
   * @returns Object with config, contextLength, and architecture
   */
  static async fetchModelMetadata(
    modelId: string,
    userMaxLengthFallback: number
  ): Promise<{
    config: any | null;
    contextLength: number;
    architecture: {
      numAttentionHeads?: number;
      numKeyValueHeads?: number;
      headDim?: number;
    };
  }> {
    // Fetch config
    const config = await this.fetchModelConfig(modelId);
    
    // Extract context length
    const contextLength = this.extractContextLength(config, userMaxLengthFallback);
    
    // Extract architecture
    const architecture = this.extractArchitecture(config);
    
    if (LOG_GENERAL) {
      console.log(prefix, `[fetchModelMetadata] Metadata extracted for ${modelId}:`, {
        contextLength,
        architecture
      });
    }
    
    return { config, contextLength, architecture };
  }

  /**
   * Determine if a file should be intercepted for caching
   * Checks for HuggingFace model files and local model files
   * 
   * @param resourceUrl - URL to check
   * @returns Object with interception flags
   */
  static shouldInterceptFile(resourceUrl: string): {
    shouldIntercept: boolean;
    isHuggingFaceFile: boolean;
    isLocalFile: boolean;
  } {
    const isHuggingFaceFile = resourceUrl.includes('huggingface.co') || resourceUrl.includes('/resolve/');
    const isLocalFile = resourceUrl.startsWith('chrome-extension://') && 
                        (resourceUrl.endsWith('.wasm') || 
                         resourceUrl.includes('.onnx') || 
                         resourceUrl.includes('.bin') || 
                         resourceUrl.includes('.pt') ||
                         resourceUrl.includes('.safetensors'));
    
    return {
      shouldIntercept: isHuggingFaceFile || isLocalFile,
      isHuggingFaceFile,
      isLocalFile
    };
  }

  /**
   * Map generic ONNX paths to specific quantized model paths
   * Handles model.onnx -> model_q4f16.onnx type mappings
   * 
   * @param resourceUrl - Original resource URL
   * @param currentModelQuantPath - Current model quantization path (e.g., 'onnx/model_q4f16.onnx')
   * @returns Mapped URL or original if no mapping needed
   */
  static mapOnnxModelPath(resourceUrl: string, currentModelQuantPath: string | null): string {
    if (!currentModelQuantPath || !currentModelQuantPath.includes('.onnx')) {
      return resourceUrl;
    }
    
    const actualModelFile = currentModelQuantPath.split('/').pop();
    if (!actualModelFile) return resourceUrl;
    
    let result = resourceUrl;
    if (result.includes('/model.onnx') || result.includes('/model.onnx_data')) {
      const originalUrl = result;
      result = result.replace('/model.onnx', `/${actualModelFile}`);
      result = result.replace('/model.onnx_data', `/${actualModelFile}`);
      
      if (LOG_GENERAL && result !== originalUrl) {
        console.log(prefix, `[mapOnnxModelPath] Mapped: ${originalUrl} -> ${result}`);
      }
    }
    
    return result;
  }

  /**
   * Extract resource URL from fetch input
   * Handles string, URL, and Request objects
   * 
   * @param input - Fetch input (string | Request | URL)
   * @returns Object with url and isRequestObject flag
   */
  static extractResourceUrl(input: string | Request | URL): { url: string | undefined; isRequestObject: boolean } {
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

  /**
   * Determine fetch input (handles URL rewriting)
   * 
   * @param input - Original fetch input
   * @param resourceUrl - Potentially rewritten URL
   * @returns Object with fetchInput and isRewritten flag
   */
  static determineFetchInput(
    input: string | Request | URL,
    resourceUrl: string
  ): { fetchInput: string | Request | URL; isRewritten: boolean } {
    let fetchInput = input;
    let isRewritten = false;

    if (
      resourceUrl &&
      ((typeof input === 'string' && resourceUrl !== input) ||
        (input instanceof Request && resourceUrl !== input.url) ||
        (input instanceof URL && resourceUrl !== input.href))
    ) {
      fetchInput = resourceUrl;
      isRewritten = true;
    }

    return { fetchInput, isRewritten };
  }

  /**
   * Save to dual IndexedDB (both rewritten and original URLs)
   * Saves large model files only once, but small files to both URLs for compatibility
   * 
   * @param resourceUrl - Rewritten resource URL
   * @param blob - File blob to save
   * @param originalInput - Original fetch input
   */
  static async saveToDualIndexedDB(
    resourceUrl: string,
    blob: Blob,
    originalInput: string | Request | URL
  ): Promise<void> {
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

  /**
   * Fetch file from network and cache to IndexedDB
   * Pure logic - no UI dependencies or global state
   * 
   * @param resourceUrl - URL to fetch
   * @param originalFetch - Unmodified fetch function
   * @param options - Optional configuration
   * @returns Response from network
   */
  static async fetchAndCacheFile(
    resourceUrl: string,
    originalFetch: typeof fetch,
    options?: {
      currentModelRepoId?: string | null;
      progressCallback?: (info: {
        loaded: number;
        total: number;
        progress: number; // 0-100
      }) => void;
    }
  ): Promise<Response> {
    if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Fetching: ${resourceUrl}`);
    
    // Fetch from network
    const resp = await originalFetch(resourceUrl);
    if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Response: status=${resp.status}, ok=${resp.ok}`);
    
    if (!resp.ok) {
      return resp;
    }

    // Get content length for progress tracking
    const contentLength = resp.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
    
    if (totalBytes && totalBytes > 0 && options?.progressCallback) {
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
            
            // Calculate progress percentage (0-100)
            const progress = Math.round((receivedBytes / totalBytes) * 100);
            
            // Send progress update every 5% or every 10MB
            if (progress % 5 === 0 || receivedBytes % (10 * 1024 * 1024) === 0) {
              options.progressCallback({
                loaded: receivedBytes,
                total: totalBytes,
                progress
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
          
          // Create blob for caching
          const blob = new Blob([allChunks]);
          const fileSize = blob.size;
          
          // Check if file should be chunked (large files)
          if (shouldChunkFile(fileSize)) {
            if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Large file (${fileSize} bytes), chunking: ${resourceUrl}`);
            try {
              await saveChunkedFileSafe(resourceUrl, blob, options.currentModelRepoId!);
            } catch (chunkError) {
              if (LOG_ERROR) console.error(prefix, '[fetchAndCacheFile] Chunking failed, using regular storage:', chunkError);
              await saveToIndexedDB(resourceUrl, blob);
            }
          } else {
            // Regular file storage
            if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Small file (${fileSize} bytes), regular storage: ${resourceUrl}`);
            await saveToIndexedDB(resourceUrl, blob);
          }
          
          // Return response with reconstructed body
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
    if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
    
    // Check if file should be chunked
    if (shouldChunkFile(fileSize)) {
      if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Large file (${fileSize} bytes), chunking: ${resourceUrl}`);
      try {
        await saveChunkedFileSafe(resourceUrl, blob, options?.currentModelRepoId!);
      } catch (chunkError) {
        if (LOG_ERROR) console.error(prefix, '[fetchAndCacheFile] Chunking failed, using regular storage:', chunkError);
        await saveToIndexedDB(resourceUrl, blob);
      }
    } else {
      // Regular file storage
      if (LOG_GENERAL) console.log(prefix, `[fetchAndCacheFile] Small file (${fileSize} bytes), regular storage: ${resourceUrl}`);
      await saveToIndexedDB(resourceUrl, blob);
    }
    
    return resp;
  }

  /**
   * Try to serve file from IndexedDB cache
   * Handles both chunked and regular files
   * 
   * @param resourceUrl - Resource URL to serve
   * @param currentModelRepoId - Current model repository ID (for chunked files)
   * @param logChunked - Enable chunked file logging
   * @returns Response from cache or null if not found
   */
  static async tryServeFromIndexedDB(
    resourceUrl: string,
    currentModelRepoId: string | null,
    logChunked: boolean = false
  ): Promise<Response | null> {
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
          if (logChunked) {
            console.log(prefix, `🔄 [tryServeFromIndexedDB] FOUND CHUNKED FILE: ${fileName}`);
            console.log(
              prefix,
              `   Total chunks: ${chunkedInfo.totalChunks}, Total size: ${(chunkedInfo.totalSize / 1024 / 1024).toFixed(1)}MB`
            );
          }
          try {
            // For files over 100MB, use streaming to avoid RAM issues
            if (chunkedInfo.totalSize > 100 * 1024 * 1024) {
              if (logChunked) console.log(prefix, `   Using streaming response (file > 100MB)`);
              return await createStreamingResponseFromChunks(modelId, fileName, chunkedInfo.totalChunks, chunkedInfo.totalSize);
            } else {
              if (logChunked) console.log(prefix, `   Assembling in memory (file < 100MB)`);
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
}
