/// <reference lib="dom" />
// model-worker.js
import { pipeline, env } from './xenova/transformers/dist/transformers.js';
import { WorkerEventNames, ModelLoaderMessageTypes } from './events/eventNames';

console.log("[ModelWorker] model-worker.js loaded (top of file)");

self.postMessage({ type: WorkerEventNames.WORKER_SCRIPT_READY });

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
let tokenizerInstance: any = null;
let currentModelIdForPipeline: string | null = null;
let currentModelIdForGlobalFetchOverride: string | null = null;
let isModelPipelineReady: boolean = false;
let isGenerationInterrupted: boolean = false;

let specialStartThinkingTokenId: number | null = null;
let specialEndThinkingTokenId: number | null = null;

const originalFetch = self.fetch;

const llmChannel = new BroadcastChannel('tabagent-llm');
const senderId = `worker-${Math.random().toString(36).slice(2)}-${Date.now()}`;
const pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();

llmChannel.onmessage = (event: MessageEvent) => {
    const { type, payload, requestId, senderId: respSenderId } = event.data;
    if (respSenderId !== senderId && pendingRequests.has(requestId)) {
        const { resolve } = pendingRequests.get(requestId)!;
        resolve(payload);
        pendingRequests.delete(requestId);
    }
};

function sendRequestViaChannel(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestId = `req-${Math.random().toString(36).slice(2)}-${Date.now()}`;
        pendingRequests.set(requestId, { resolve, reject });
        llmChannel.postMessage({ type, payload, requestId, senderId });
        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error(`Request to channel timed out for type: ${type}`));
            }
        }, 30000);
    });
}

async function getModelFileManifest(modelId: string, fileName: string): Promise<any> {
    try {
        const response = await sendRequestViaChannel('REQUEST_MODEL_ASSET_MANIFEST', { modelId, fileName });
        return response;
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[ModelWorker] Error in getModelFileManifest for ${modelId}/${fileName}:`, error);
        return { success: false, error: errMsg };
    }
}

async function fetchChunk(modelId: string, fileName: string, chunkIndex: number): Promise<ArrayBuffer | null> {
    try {
        const response = await sendRequestViaChannel('REQUEST_MODEL_ASSET_CHUNK', { modelId, fileName, chunkIndex });
        return response && response.arrayBuffer ? response.arrayBuffer : null;
    } catch (error) {
        console.error(`[ModelWorker] Error in fetchChunk ${chunkIndex} for ${modelId}/${fileName}:`, error);
        return null;
    }
}

self.fetch = async (resource: any, options?: any): Promise<Response> => {
    let resourceURLString: string;
    if (typeof resource === 'string') {
        resourceURLString = resource;
    } else if (typeof Request !== 'undefined' && resource instanceof Request) {
        resourceURLString = resource.url;
    } else if (typeof URL !== 'undefined' && typeof resource === 'object' && resource instanceof URL) {
        resourceURLString = resource.toString();
    } else if (typeof resource === 'object' && resource && 'url' in resource && typeof (resource as any).url === 'string') {
        resourceURLString = (resource as any).url;
    } else {
        resourceURLString = '';
    }
    let isDBAssetRequest = false;
    let fileNameToFetchForDB: string | null = null;
    let modelIdForDBFetch: string | null = null;

    if (currentModelIdForGlobalFetchOverride && resourceURLString.startsWith(`/${currentModelIdForGlobalFetchOverride}/`)) {
        isDBAssetRequest = true;
        modelIdForDBFetch = currentModelIdForGlobalFetchOverride;
        fileNameToFetchForDB = resourceURLString.substring(`/${modelIdForDBFetch}/`.length);
    }

    if (isDBAssetRequest && modelIdForDBFetch && fileNameToFetchForDB) {
        console.log(`[ModelWorker][fetch] DB Asset Request for: ${modelIdForDBFetch}/${fileNameToFetchForDB}`);
        const manifestResult: any = await getModelFileManifest(modelIdForDBFetch, fileNameToFetchForDB);

        if (!manifestResult || !manifestResult.success || !manifestResult.manifest) {
            console.error(`[ModelWorker][fetch] Failed to get manifest for ${modelIdForDBFetch}/${fileNameToFetchForDB}`, manifestResult);
            throw new Error(`No manifest found for asset: ${modelIdForDBFetch}/${fileNameToFetchForDB}. Manifest result: ${JSON.stringify(manifestResult)}`);
        }

        const { totalFileSize, totalChunks } = manifestResult.manifest;

        if (!Number.isFinite(totalChunks) || totalChunks < 1 || !Number.isFinite(totalFileSize) || totalFileSize <= 0) {
            console.error(`[ModelWorker][fetch] Invalid manifest data for ${modelIdForDBFetch}/${fileNameToFetchForDB}:`, manifestResult.manifest);
            throw new Error(`Invalid manifest (chunks/size) for asset: ${modelIdForDBFetch}/${fileNameToFetchForDB}`);
        }
        console.log(`[ModelWorker][fetch] Assembling ${fileNameToFetchForDB}: Total Chunks: ${totalChunks}, Total Size: ${totalFileSize}`);

        const combined = new Uint8Array(totalFileSize);
        let currentOffset = 0;

        for (let i = 0; i < totalChunks; i++) {
            const chunkArrayBuffer = await fetchChunk(modelIdForDBFetch, fileNameToFetchForDB, i);
            if (!chunkArrayBuffer) {
                console.error(`[ModelWorker][fetch] Failed to fetch chunk ${i} (returned null/undefined) for ${fileNameToFetchForDB}`);
                throw new Error(`Failed to fetch chunk ${i} of ${fileNameToFetchForDB}`);
            }
            const chunkUint8Array = new Uint8Array(chunkArrayBuffer);
            if (currentOffset + chunkUint8Array.length > totalFileSize) {
                 console.error(`[ModelWorker][fetch] Chunk ${i} overflow for ${fileNameToFetchForDB}. Offset: ${currentOffset}, ChunkLen: ${chunkUint8Array.length}, TotalSize: ${totalFileSize}`);
                 throw new Error(`Chunk ${i} would overflow buffer for ${fileNameToFetchForDB}.`);
            }
            combined.set(chunkUint8Array, currentOffset);
            currentOffset += chunkUint8Array.length;
            if (i % 20 === 0 || i === totalChunks - 1) {
                 console.log(`[ModelWorker][fetch] Assembled chunk ${i}/${totalChunks-1}. Offset: ${currentOffset}/${totalFileSize}`);
            }
        }

        if (currentOffset !== totalFileSize) {
            console.warn(`[ModelWorker][fetch] Assembled size ${currentOffset} mismatch expected ${totalFileSize} for ${fileNameToFetchForDB}. This may indicate an issue.`);
            const headers = new Headers({ 'Content-Length': currentOffset.toString() });
            return new Response(combined.buffer.slice(0, currentOffset), { headers });
        }
        
        const headers = new Headers({ 'Content-Length': totalFileSize.toString() });
        return new Response(combined.buffer, { headers });

    } else {
        return originalFetch(resource, options);
    }
};

async function initializePipeline(modelIdToLoad: string, progressCallbackForPipeline?: (data: any) => void): Promise<any> {
    if (pipelineInstance && currentModelIdForPipeline === modelIdToLoad && isModelPipelineReady) {
        console.log(`[ModelWorker] Pipeline for model ${modelIdToLoad} is already initialized.`);
        return pipelineInstance;
    }

    if (pipelineInstance) {
        console.warn(`[ModelWorker] Switching pipeline from ${currentModelIdForPipeline} to ${modelIdToLoad}. Disposing existing instance.`);
        if (typeof pipelineInstance.dispose === 'function') {
            try {
                pipelineInstance.dispose();
                console.log("[ModelWorker] Disposed previous pipeline instance.");
            } catch (disposeError) {
                console.warn("[ModelWorker] Error disposing previous pipeline instance:", disposeError);
            }
        }
        pipelineInstance = null;
        tokenizerInstance = null;
        specialStartThinkingTokenId = null;
        specialEndThinkingTokenId = null;
    }
    currentModelIdForPipeline = modelIdToLoad;
    isModelPipelineReady = false;
    console.log(`[ModelWorker] Attempting to load 'text-generation' pipeline for model: ${modelIdToLoad}`);

    try {
        if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
            console.log("[ModelWorker] WebGPU is supported. Configuring ONNX for WebGPU.");
            env.backends.onnx.executionProviders = ['webgpu', 'wasm'];
            env.backends.onnx.webgpu = { powerPreference: 'high-performance' };
        } else {
            console.log("[ModelWorker] WebGPU not supported. Falling back to WebAssembly.");
            env.backends.onnx.executionProviders = ['wasm'];
        }
        if (env.backends.onnx.wasm) {
            console.log("[ModelWorker] Applying WASM numThreads=1.");
            env.backends.onnx.wasm.numThreads = 1;
        } else {
            console.warn("[ModelWorker] env.backends.onnx.wasm not defined for numThreads.");
        }

        env.allowRemoteModels = false;
        env.allowLocalModels = true;
        console.log('[ModelWorker] allowRemoteModels:', env.allowRemoteModels, 'allowLocalModels:', env.allowLocalModels);

        console.log(`[ModelWorker] Calling transformers.js pipeline() for model: ${currentModelIdForPipeline}`);
        pipelineInstance = await pipeline('text-generation', currentModelIdForPipeline, {
            quantized: true,
            progress_callback: progressCallbackForPipeline ? (data: any) => {
                const progressDataWithModel = { ...data, model: currentModelIdForPipeline };
                progressCallbackForPipeline(progressDataWithModel);
            } : null,
        });

        tokenizerInstance = pipelineInstance.tokenizer;
        console.log(`[ModelWorker] Pipeline and tokenizer loaded for ${currentModelIdForPipeline}.`);
        isModelPipelineReady = true;

        if (!tokenizerInstance) {
            console.warn(`[ModelWorker] Tokenizer instance is null for ${currentModelIdForPipeline}.`);
        } else {
            try {
                const thinkTokens = tokenizerInstance.encode('<think></think>', { add_special_tokens: false });
                if (thinkTokens && thinkTokens.length === 2) {
                    specialStartThinkingTokenId = thinkTokens[0];
                    specialEndThinkingTokenId = thinkTokens[1];
                    console.log(`[ModelWorker] Encoded <think> tokens: START=${specialStartThinkingTokenId}, END=${specialEndThinkingTokenId}`);
                } else {
                    console.warn(`[ModelWorker] Could not encode <think> tokens correctly for ${currentModelIdForPipeline}. Received:`, thinkTokens);
                }
            } catch (encodeError) {
                console.error(`[ModelWorker] Error encoding <think> tokens for ${currentModelIdForPipeline}:`, encodeError);
            }
        }
        return pipelineInstance;

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[ModelWorker] Pipeline load failed for ${currentModelIdForPipeline}:`, error);
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `[ModelWorker] Pipeline load failed for ${currentModelIdForPipeline}: ${errMsg}` });
        pipelineInstance = null;
        tokenizerInstance = null;
        currentModelIdForPipeline = null;
        isModelPipelineReady = false;
        throw error;
    }
}

let perFileProgressMap: Record<string, { loaded: number, total: number }> = {};
function calculateOverallProgress(): number {
    let totalLoadedBytes = 0;
    let totalFileSizes = 0;
    Object.values(perFileProgressMap).forEach((file: { loaded: number, total: number }) => {
        totalLoadedBytes += file.loaded || 0;
        totalFileSizes += file.total || 0;
    });
    return totalFileSizes > 0 ? (totalLoadedBytes / totalFileSizes) * 100 : 0;
}

self.onmessage = async (event: MessageEvent) => {
    if (!event.data || !event.data.type) {
        console.error("[ModelWorker] Received message without type or data:", event);
        return;
    }
    const { type, payload } = event.data;
    console.log(`[ModelWorker] Received message: Type: ${type}`);

    switch (type) {
        case 'init': {
            console.log(`[ModelWorker] 'init' payload:`, payload);
            const modelIdToInit: string | undefined = payload?.modelId;
            const wasmPathForEnv: string | undefined = payload?.wasmPath;

            if (!modelIdToInit) {
                console.error("[ModelWorker] Init failed: modelId not provided.");
                self.postMessage({ type: WorkerEventNames.ERROR, payload: 'Initialization failed: modelId not provided.' });
                return;
            }
            if (!wasmPathForEnv) {
                console.error("[ModelWorker] Init failed: wasmPath not provided.");
                self.postMessage({ type: WorkerEventNames.ERROR, payload: 'Initialization failed: wasmPath not provided.' });
                return;
            }

            if (isModelPipelineReady && currentModelIdForPipeline === modelIdToInit) {
                console.log(`[ModelWorker] Model ${modelIdToInit} already loaded. Signaling WORKER_READY.`);
                self.postMessage({ type: WorkerEventNames.WORKER_READY, payload: { model: modelIdToInit } });
                return;
            }
            
            console.log(`[ModelWorker] [PreLoad] Requesting file list for ${modelIdToInit}`);
            try {
                const responseData: any = await sendRequestViaChannel('LIST_MODEL_FILES', { modelId: modelIdToInit });
                if (responseData && responseData.success && Array.isArray(responseData.files)) {
                    console.log(`[ModelWorker] [PreLoad] Files for '${modelIdToInit}': ${responseData.files.map((f: any) => f.fileName || f.path || f).join(', ')}`);
                } else {
                    console.warn(`[ModelWorker] [PreLoad] Could not list files for '${modelIdToInit}':`, responseData?.error);
                }
            } catch (err) {
                console.error('[ModelWorker] [PreLoad] Error requesting file list for model:', modelIdToInit, err);
            }

            console.log(`[ModelWorker] Starting initialization for model: ${modelIdToInit}.`);
            isModelPipelineReady = false;
            perFileProgressMap = {};
            self.postMessage({ type: WorkerEventNames.LOADING_STATUS, payload: { status: 'initializing_pipeline', file: 'pipeline_setup', progress: 0, model: modelIdToInit } });

            try {
                if (!env) throw new Error("'env' object from transformers.js not available.");

                env.backends.onnx.wasm.wasmPaths = wasmPathForEnv;
                console.log(`[ModelWorker] WASM path configured to: ${wasmPathForEnv}`);
                env.localModelPath = '';
                currentModelIdForGlobalFetchOverride = modelIdToInit;

                await initializePipeline(modelIdToInit, (progressReport: any) => {
                    if (progressReport && progressReport.file) {
                         perFileProgressMap[progressReport.file] = {
                            loaded: progressReport.loaded || 0,
                            total: progressReport.total || 0,
                        };
                    }
                    const overallProgressPercentage = calculateOverallProgress();
                    self.postMessage({
                        type: WorkerEventNames.LOADING_STATUS,
                        payload: {
                            ...progressReport,
                            model: modelIdToInit,
                            overallProgress: overallProgressPercentage,
                        }
                    });
                });

                self.postMessage({ type: WorkerEventNames.WORKER_READY, payload: { model: modelIdToInit } });
                console.log(`[ModelWorker] Model ${modelIdToInit} init complete. WORKER_READY sent.`);

            } catch (error: unknown) {
                console.error(`[ModelWorker] Critical failure during model init for ${modelIdToInit}:`, error);
                isModelPipelineReady = false;
            }
            break;
        }
        case 'generate': {
            console.log(`[ModelWorker] 'generate' payload:`, payload);
            if (!isModelPipelineReady || !pipelineInstance || !currentModelIdForPipeline) {
                console.error(`[ModelWorker] Cannot generate. Model pipeline not ready.`);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: 'Generation failed: Model pipeline is not ready.' });
                return;
            }
            const generationModelId: string = currentModelIdForPipeline;
            
            if (!payload || typeof payload.messages === 'undefined') {
                console.error(`[ModelWorker] Generate failed: 'messages' missing for ${generationModelId}.`);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: 'Generate failed: Invalid messages payload.' });
                return;
            }

            isGenerationInterrupted = false;
            let accumulatedOutputText = '';
            let currentThinkingState: string = (specialStartThinkingTokenId !== null && specialEndThinkingTokenId !== null) ? 'answering' : 'answering-only';

            try {
                self.postMessage({ type: WorkerEventNames.GENERATION_STATUS, payload: { status: 'generating', model: generationModelId } });

                const generationResultStream = await pipelineInstance(payload.messages, {
                    max_new_tokens: payload.max_new_tokens || 512,
                    temperature: payload.temperature || 0.7,
                    top_k: payload.top_k || 0,
                    do_sample: (payload.temperature && payload.temperature > 0) || (payload.top_k && payload.top_k > 0),
                    callback_function: (beams: any) => {
                        if (isGenerationInterrupted) return;
                        try {
                            const tokenIdsForCurrentBeam = beams[0]?.output_token_ids;
                            if (!tokenIdsForCurrentBeam || tokenIdsForCurrentBeam.length === 0) return;

                            let newTextChunk = "";
                            if (tokenizerInstance) {
                                const decodedText = tokenizerInstance.decode(tokenIdsForCurrentBeam, { skip_special_tokens: true });
                                newTextChunk = decodedText.substring(accumulatedOutputText.length);
                                accumulatedOutputText = decodedText;
                            } else {
                                const lastTokenId = tokenIdsForCurrentBeam.slice(-1)[0];
                                newTextChunk = `[RAW_TOKEN:${lastTokenId}]`;
                                accumulatedOutputText += newTextChunk;
                            }

                            const lastToken = tokenIdsForCurrentBeam[tokenIdsForCurrentBeam.length - 1];
                            if (currentThinkingState !== 'answering-only') {
                                if (lastToken === specialEndThinkingTokenId) currentThinkingState = 'answering';
                                else if (lastToken === specialStartThinkingTokenId) currentThinkingState = 'thinking';
                            }

                            if (newTextChunk && (currentThinkingState === 'answering' || currentThinkingState === 'answering-only')) {
                                self.postMessage({
                                    type: WorkerEventNames.GENERATION_UPDATE,
                                    payload: { chunk: newTextChunk, state: currentThinkingState, model: generationModelId }
                                });
                            }
                        } catch (streamError) {
                            console.error(`[ModelWorker] Error in generation stream callback for ${generationModelId}:`, streamError);
                        }
                    }
                });

                let finalOutputText = accumulatedOutputText;
                if (typeof generationResultStream === 'string') {
                    finalOutputText = generationResultStream;
                } else if (Array.isArray(generationResultStream) && generationResultStream.length > 0 && generationResultStream[0].generated_text) {
                    finalOutputText = generationResultStream[0].generated_text;
                } else if (typeof generationResultStream === 'object' && generationResultStream !== null && generationResultStream.generated_text) {
                    finalOutputText = generationResultStream.generated_text;
                }
                
                console.log(`[ModelWorker] Generation stream finished for ${generationModelId}.`);
                if (isGenerationInterrupted) {
                    self.postMessage({ type: WorkerEventNames.GENERATION_STATUS, payload: { status: 'interrupted', model: generationModelId, output: finalOutputText } });
                } else {
                    self.postMessage({ type: WorkerEventNames.GENERATION_COMPLETE, payload: { model: generationModelId, output: finalOutputText } });
                }

            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                console.error(`[ModelWorker] Failed during generation for ${generationModelId}:`, error);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: `Generation process failed: ${errMsg}` });
            }
            break;
        }
        case 'interrupt': {
            console.log("[ModelWorker] Received 'interrupt'. Setting flag.");
            isGenerationInterrupted = true;
            break;
        }
        case 'reset': {
            console.log("[ModelWorker] Received 'reset'.");
            isGenerationInterrupted = false;
            if (pipelineInstance && typeof pipelineInstance.dispose === 'function') {
                try { pipelineInstance.dispose(); } catch(e) { console.warn("Error disposing pipeline on reset:", e); }
            }
            pipelineInstance = null;
            tokenizerInstance = null;
            currentModelIdForPipeline = null;
            isModelPipelineReady = false;
            console.log("[ModelWorker] Pipeline instance reset.");
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            break;
        }
        case ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT: {
            break;
        }
        default: {
            console.warn(`[ModelWorker] Unknown message type: ${type}. Payload:`, payload);
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `[ModelWorker] Unknown message type: ${type}` });
            break;
        }
    }
};