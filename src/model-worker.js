// model-worker.js
import { pipeline, env } from './xenova/transformers/dist/transformers.js';
import { WorkerEventNames } from './events/eventNames.js';
import { ModelLoaderMessageTypes } from './events/eventNames.js';


console.log("[ModelWorker] model-worker.js loaded (top of file)");

// Notify background that the worker script is ready
self.postMessage({ type: WorkerEventNames.WORKER_SCRIPT_READY });

self.addEventListener('error', function(e) {
    console.error("[ModelWorker] Global error in model-worker.js:", e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: e.message || e });
    } catch (err) {
        // If postMessage fails, at least log
        console.error("[ModelWorker] Failed to postMessage FATAL_ERROR:", err);
    }
});
self.addEventListener('unhandledrejection', function(e) {
    console.error("[ModelWorker] Unhandled promise rejection in model-worker.js:", e);
    try {
        self.postMessage({ type: 'FATAL_ERROR', payload: e.reason || e });
    } catch (err) {
        console.error("[ModelWorker] Failed to postMessage FATAL_ERROR (unhandledrejection):", err);
    }
});

let pipelineInstance = null;
let tokenizerInstance = null;
let currentModelIdForPipeline = null;
let currentModelIdForGlobalFetchOverride = null; // Track for global fetch override
let isModelPipelineReady = false;
let isGenerationInterrupted = false;

let specialStartThinkingTokenId = null;
let specialEndThinkingTokenId = null;

const browser = self.browser || self.chrome;

// Store the original fetch
const originalFetch = self.fetch;

// --- BroadcastChannel Setup ---
const llmChannel = new BroadcastChannel('tabagent-llm');
const senderId = 'worker-' + Math.random().toString(36).slice(2) + '-' + Date.now();
const pendingRequests = new Map();

llmChannel.onmessage = (event) => {
    const { type, payload, requestId, senderId: respSenderId } = event.data;
    if (respSenderId !== senderId && pendingRequests.has(requestId)) {
        const { resolve } = pendingRequests.get(requestId);
        resolve(payload);
        pendingRequests.delete(requestId);
    }
};

function sendRequestViaChannel(type, payload) {
    return new Promise((resolve) => {
        const requestId = 'req-' + Math.random().toString(36).slice(2) + '-' + Date.now();
        pendingRequests.set(requestId, { resolve });
        llmChannel.postMessage({ type, payload, requestId, senderId });
    });
}

async function getChunkCount(modelId, fileName) {
    const response = await sendRequestViaChannel('COUNT_MODEL_ASSET_CHUNKS', { modelId, fileName });
    return response.count || 0;
}

async function fetchChunk(modelId, fileName, chunkIndex) {
    const response = await sendRequestViaChannel('REQUEST_MODEL_ASSET_CHUNK', { modelId, fileName, chunkIndex });
    return response.arrayBuffer;
}

// Global fetch override
self.fetch = async (resource, options) => {
    const resourceURLString = (typeof resource === 'string') ? resource : resource.url;
    console.log('[ModelWorker][fetch] CALLED:', resourceURLString);

    let isDBAssetRequest = false;
    let fileNameToFetchForDB = null;
    let modelIdForDBFetch = null;
    if (currentModelIdForGlobalFetchOverride && resourceURLString.startsWith(`/${currentModelIdForGlobalFetchOverride}/`)) {
        isDBAssetRequest = true;
        modelIdForDBFetch = currentModelIdForGlobalFetchOverride;
        fileNameToFetchForDB = resourceURLString.substring(`/${modelIdForDBFetch}/`.length);
    }
    if (isDBAssetRequest) {
        // 1. Get chunk count
        const chunkCount = await getChunkCount(modelIdForDBFetch, fileNameToFetchForDB);
        console.log('[ModelWorker][fetch] chunkCount for', modelIdForDBFetch, fileNameToFetchForDB, '=', chunkCount);

        if (chunkCount < 1) {
            throw new Error(`No chunks found for asset: ${modelIdForDBFetch}/${fileNameToFetchForDB}`);
        }

        // Always fetch all chunks, even if only one
        const chunks = [];
        for (let i = 0; i < chunkCount; i++) {
            const chunkBuffer = await fetchChunk(modelIdForDBFetch, fileNameToFetchForDB, i);
            if (!chunkBuffer) {
                console.error(`[ModelWorker][fetch] Failed to fetch chunk ${i} for`, modelIdForDBFetch, fileNameToFetchForDB);
                throw new Error(`Failed to fetch chunk ${i}`);
            }
            if (i === 0 || i === chunkCount - 1) {
                console.log(`[ModelWorker][fetch] Fetched chunk ${i} for`, modelIdForDBFetch, fileNameToFetchForDB, 'length:', chunkBuffer.byteLength);
            }
            chunks.push(new Uint8Array(chunkBuffer));
        }
        // Combine (trivial if only one chunk)
        const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        return new Response(combined.buffer);
    } else {
        console.log('[ModelWorker][fetch] Passing to original fetch:', resourceURLString);
        return originalFetch(resource, options);
    }
};

async function initializePipeline(modelIdToLoad, progressCallbackForPipeline) {
    if (pipelineInstance && currentModelIdForPipeline === modelIdToLoad) {
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
    currentModelIdForPipeline = modelIdToLoad; // Set this early for customFetch
    isModelPipelineReady = false;
    console.log(`[ModelWorker] Attempting to load 'text-generation' pipeline for model: ${modelIdToLoad}`);

    try {
        if (typeof navigator !== 'undefined' && navigator.gpu) {
            console.log("[ModelWorker] WebGPU is supported by navigator. Configuring ONNX to use WebGPU.");
            env.backends.onnx.executionProviders = ['webgpu', 'wasm'];
            env.backends.onnx.webgpu = { powerPreference: 'high-performance' };
        } else {
            console.log("[ModelWorker] WebGPU not supported or navigator undefined. Falling back to WebAssembly.");
            env.backends.onnx.executionProviders = ['wasm'];
        }
        if (env.backends.onnx.wasm) {
            console.log("[ModelWorker] Applying WASM specific optimizations: numThreads=1.");
            env.backends.onnx.wasm.numThreads = 1; // Default is navigator.hardwareConcurrency
        } else {
            console.warn("[ModelWorker] env.backends.onnx.wasm is not defined when trying to set numThreads. This might be set later by transformers.js.");
        }

        env.allowRemoteModels = false;
        env.allowLocalModels = true; // Must be true for customFetch to be used effectively
        console.log('[ModelWorker] (FIXED) Set allowRemoteModels:', env.allowRemoteModels, 'allowLocalModels:', env.allowLocalModels);

        console.log(`[ModelWorker] Calling transformers.js pipeline() for model: ${currentModelIdForPipeline}`);
        pipelineInstance = await pipeline('text-generation', currentModelIdForPipeline, {
            quantized: true,
            progress_callback: progressCallbackForPipeline ? (data) => {
                const progressDataWithModel = { ...data, model: currentModelIdForPipeline };
                progressCallbackForPipeline(progressDataWithModel);
            } : null,
        });

        tokenizerInstance = pipelineInstance.tokenizer;
        console.log(`[ModelWorker] Pipeline and tokenizer loaded successfully for ${currentModelIdForPipeline}.`);
        isModelPipelineReady = true;

        if (!tokenizerInstance) {
            console.warn(`[ModelWorker] Tokenizer instance is null after pipeline load for ${currentModelIdForPipeline}. Special tokens cannot be encoded.`);
        } else {
            try {
                const thinkTokens = tokenizerInstance.encode('<think></think>', { add_special_tokens: false });
                if (thinkTokens && thinkTokens.length === 2) {
                    specialStartThinkingTokenId = thinkTokens[0];
                    specialEndThinkingTokenId = thinkTokens[1];
                    console.log(`[ModelWorker] Encoded <think> tokens for ${currentModelIdForPipeline}: START=${specialStartThinkingTokenId}, END=${specialEndThinkingTokenId}`);
                } else {
                    console.warn(`[ModelWorker] Could not encode <think> tokens correctly for ${currentModelIdForPipeline}. Received:`, thinkTokens);
                }
            } catch (encodeError) {
                console.error(`[ModelWorker] Error encoding <think> tokens for ${currentModelIdForPipeline}:`, encodeError);
            }
        }
        return pipelineInstance;

    } catch (error) {
        console.error(`[ModelWorker] Failed to load pipeline for ${currentModelIdForPipeline}:`, error);
        self.postMessage({ type: WorkerEventNames.ERROR, payload: `[ModelWorker] Pipeline load failed for ${currentModelIdForPipeline}: ${error.message || String(error)}` });
        pipelineInstance = null;
        tokenizerInstance = null;
        currentModelIdForPipeline = null;
        isModelPipelineReady = false;
        throw error;
    }
}

let perFileProgressMap = {};
function calculateOverallProgress() {
    let totalLoadedBytes = 0;
    let totalFileSizes = 0;
    Object.values(perFileProgressMap).forEach(file => {
        totalLoadedBytes += file.loaded || 0;
        totalFileSizes += file.total || 0;
    });
    return totalFileSizes > 0 ? (totalLoadedBytes / totalFileSizes) * 100 : 0;
}

self.onmessage = async (event) => {
    if (!event.data || !event.data.type) {
        console.error("[ModelWorker] Received message without type or data:", event);
        return;
    }
    const { type, payload } = event.data;
    console.log(`[ModelWorker] Received message: Type: ${type}, Payload:`, payload);

    switch (type) {
        case 'init':
            const modelIdToInit = payload?.modelId;
            const wasmPathForEnv = payload?.wasmPath;

            if (!modelIdToInit) {
                console.error("[ModelWorker] Initialization failed: modelId not provided in 'init' payload.");
                self.postMessage({ type: WorkerEventNames.ERROR, payload: 'Initialization failed: modelId not provided.' });
                return;
            }
            if (!wasmPathForEnv) {
                console.error("[ModelWorker] Initialization failed: wasmPath not provided in 'init' payload.");
                self.postMessage({ type: WorkerEventNames.ERROR, payload: 'Initialization failed: wasmPath not provided.' });
                return;
            }

            if (isModelPipelineReady && currentModelIdForPipeline === modelIdToInit) {
                console.log(`[ModelWorker] Model ${modelIdToInit} is already loaded and ready. Signaling WORKER_READY.`);
                self.postMessage({ type: WorkerEventNames.WORKER_READY, payload: { model: modelIdToInit } });
                return;
            }

            // Log all files in the model's folder before loading
            console.log('[ModelWorker] [PreLoad] Requesting file list for', modelIdToInit);
            // --- Begin: Request file list from offscreen worker using MessageChannel ---
            function requestModelFileListViaChannel(modelId) {
                return sendRequestViaChannel('LIST_MODEL_FILES', { modelId });
            }
            try {
                const responseData = await requestModelFileListViaChannel(modelIdToInit);
                if (responseData && responseData.success && Array.isArray(responseData.files)) {
                    console.log(`[ModelWorker] [PreLoad] Files present in model folder '${modelIdToInit}':`);
                    responseData.files.forEach(f => {
                        console.log(f.path);
                    });
                } else {
                    console.warn(`[ModelWorker] [PreLoad] Could not list files for model '${modelIdToInit}':`, responseData && responseData.error);
                }
            } catch (err) {
                console.error('[ModelWorker] [PreLoad] Error requesting file list for model:', modelIdToInit, err);
            }
            console.log('[ModelWorker] [PreLoad] LIST_MODEL_FILES message posted for', modelIdToInit);

            console.log(`[ModelWorker] Starting initialization for model: ${modelIdToInit}. WASM path: ${wasmPathForEnv}`);
            isModelPipelineReady = false; // Mark as not ready during new init
            perFileProgressMap = {}; // Reset progress map
            self.postMessage({ type: WorkerEventNames.LOADING_STATUS, payload: { status: 'initializing_pipeline', file: 'pipeline_setup', progress: 0, model: modelIdToInit } });

            try {
                if (!env) throw new Error("'env' object from transformers.js is not available.");

                env.backends.onnx.wasm.wasmPaths = wasmPathForEnv;
                console.log(`[ModelWorker] Transformers.js WASM path configured to: ${wasmPathForEnv}`);

                env.localModelPath = '';

                currentModelIdForPipeline = modelIdToInit; // Set for customFetch
                currentModelIdForGlobalFetchOverride = modelIdToInit; // Set for global fetch override

                await initializePipeline(modelIdToInit, (progressReport) => {
                    if (progressReport && progressReport.file) {
                         perFileProgressMap[progressReport.file] = {
                            loaded: progressReport.loaded || 0,
                            total: progressReport.total || 0,
                            progress: progressReport.progress || 0,
                            status: progressReport.status || 'progress',
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
                console.log(`[ModelWorker] Model ${modelIdToInit} initialization complete. WORKER_READY message sent.`);

            } catch (error) {
                console.error(`[ModelWorker] Critical failure during model initialization for ${modelIdToInit}:`, error);
                isModelPipelineReady = false; // Ensure state is reset on failure
                // Error message would have been sent by initializePipeline
            }
            break;

        case 'generate':
            if (!isModelPipelineReady || !pipelineInstance || !currentModelIdForPipeline) {
                console.error(`[ModelWorker] Cannot generate. Model pipeline not ready. Ready: ${isModelPipelineReady}, Instance: ${!!pipelineInstance}, CurrentModel: ${currentModelIdForPipeline}`);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: 'Generation failed: Model pipeline is not ready.' });
                return;
            }
            const generationModelId = currentModelIdForPipeline;
            console.log(`[ModelWorker] Received 'generate' request for model: ${generationModelId}. Payload:`, payload);

            if (!payload || typeof payload.messages === 'undefined') {
                console.error(`[ModelWorker] Generate failed: 'messages' property is missing or invalid in payload for model ${generationModelId}. Payload:`, payload);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: 'Generate failed: Invalid messages payload.' });
                return;
            }

            isGenerationInterrupted = false;
            let accumulatedOutputText = '';
            let currentThinkingState = (specialStartThinkingTokenId !== null && specialEndThinkingTokenId !== null) ? 'answering' : 'answering-only';

            try {
                self.postMessage({ type: WorkerEventNames.GENERATION_STATUS, payload: { status: 'generating', model: generationModelId, input: payload.messages } });

                const generationResultStream = await pipelineInstance(payload.messages, {
                    max_new_tokens: payload.max_new_tokens || 512,
                    temperature: payload.temperature || 0.7,
                    top_k: payload.top_k || 0,
                    do_sample: (payload.temperature && payload.temperature > 0) || (payload.top_k && payload.top_k > 0),
                    callback_function: (beams) => {
                        if (isGenerationInterrupted) {
                            console.log("[ModelWorker] Generation interrupted by flag, stopping further callback processing.");
                            return; // Stop processing new beam updates
                        }
                        try {
                            const tokenIdsForCurrentBeam = beams[0]?.output_token_ids;
                            if (!tokenIdsForCurrentBeam || tokenIdsForCurrentBeam.length === 0) return;

                            let newTextChunk = "";
                            if (tokenizerInstance) {
                                const decodedText = tokenizerInstance.decode(tokenIdsForCurrentBeam, { skip_special_tokens: true });
                                newTextChunk = decodedText.substring(accumulatedOutputText.length);
                                accumulatedOutputText = decodedText;
                            } else {
                                // Fallback if tokenizer is somehow unavailable
                                const newTokens = tokenIdsForCurrentBeam.slice(accumulatedOutputText.split(',').filter(Boolean).length);
                                newTextChunk = `[RAW_TOKENS:${newTokens.join(',')}]`;
                                accumulatedOutputText += (accumulatedOutputText ? ',' : '') + newTokens.join(',');
                                console.warn("[ModelWorker] Tokenizer instance not available during generation callback. Emitting raw token info.");
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
                            console.error(`[ModelWorker] Error during generation stream processing callback for model ${generationModelId}:`, streamError);
                        }
                    }
                });

                console.log(`[ModelWorker] Generation stream processing finished for model ${generationModelId}.`);
                if (isGenerationInterrupted) {
                    self.postMessage({ type: WorkerEventNames.GENERATION_STATUS, payload: { status: 'interrupted', model: generationModelId } });
                    console.log(`[ModelWorker] Generation was interrupted for ${generationModelId}. Final output from stream (if any):`, generationResultStream);
                } else {
                    let finalOutputText = accumulatedOutputText; // Default to text accumulated via callbacks
                    if (typeof generationResultStream === 'string') {
                        finalOutputText = generationResultStream;
                    } else if (Array.isArray(generationResultStream) && generationResultStream.length > 0 && generationResultStream[0].generated_text) {
                        finalOutputText = generationResultStream[0].generated_text;
                    } else if (typeof generationResultStream === 'object' && generationResultStream !== null && generationResultStream.generated_text) {
                        finalOutputText = generationResultStream.generated_text;
                    }
                    console.log(`[ModelWorker] Generation complete for ${generationModelId}. Final output text:`, finalOutputText);
                    self.postMessage({ type: WorkerEventNames.GENERATION_COMPLETE, payload: { model: generationModelId, input: payload.messages, output: finalOutputText } });
                }

            } catch (error) {
                console.error(`[ModelWorker] Failed during generation process for model ${generationModelId}:`, error);
                self.postMessage({ type: WorkerEventNames.GENERATION_ERROR, payload: `Generation process failed for ${generationModelId}: ${error.message || String(error)}` });
            }
            break;

        case 'interrupt':
            console.log("[ModelWorker] Received 'interrupt' request. Setting interruption flag.");
            isGenerationInterrupted = true;
            // Note: This flag primarily stops UI updates. True interruption of ONNX runtime is not directly handled here.
            break;

        case 'reset':
            console.log("[ModelWorker] Received 'reset' request.");
            isGenerationInterrupted = false;
            // Optionally, reset the pipeline fully if needed for a hard reset
            pipelineInstance = null;
            tokenizerInstance = null;
            currentModelIdForPipeline = null;
            isModelPipelineReady = false;
            console.log("[ModelWorker] Pipeline instance has been reset due to 'reset' command.");
            self.postMessage({ type: WorkerEventNames.RESET_COMPLETE });
            break;

        case ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT:
            // No-op: handled by MessageChannel or legacy Promise, suppress warning
            break;
        default:
            console.warn(`[ModelWorker] Unknown message type received: ${type}. Payload:`, payload);
            self.postMessage({ type: WorkerEventNames.ERROR, payload: `[ModelWorker] Unknown message type received by model-worker: ${type}` });
            break;
    }
};

