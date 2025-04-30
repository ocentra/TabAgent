import { pipeline, env } from './xenova/transformers/dist/transformers.js';

let START_THINKING_TOKEN_ID = null;
let END_THINKING_TOKEN_ID = null;

class GenerationPipelineSingleton {
    static task = 'text-generation';
    static instance = null;
    static tokenizer_instance = null;
    static currentModelId = null;

    static async getInstance(modelId, progress_callback = null) {
        if (this.instance !== null && this.currentModelId !== modelId) {
            console.warn(`[ModelWorker] Switching model from ${this.currentModelId} to ${modelId}. Resetting pipeline.`);
            this.instance = null;
            this.tokenizer_instance = null;
            this.currentModelId = null;
            // TODO: Consider more explicit cleanup if needed (e.g., releasing GPU resources?)
        }

        if (this.instance === null) {
            console.log(`[ModelWorker] Loading ${this.task} pipeline for model: ${modelId}`);
            this.currentModelId = modelId;

            try {
                // Configure WebGPU or WebAssembly backend
                if (navigator.gpu) {
                    console.log("[ModelWorker] WebGPU is supported! Configuring ONNX to use WebGPU.");
                    env.backends.onnx = {
                        executionProviders: ['webgpu', 'wasm'], // Prefer WebGPU, fall back to WebAssembly
                        webgpu: {
                            device: 'gpu',
                            lowMemoryMode: true, // Reduce memory usage if supported
                        },
                    };
                } else {
                    console.log("[ModelWorker] WebGPU is not supported. Falling back to WebAssembly.");
                    env.backends.onnx = {
                        executionProviders: ['wasm'], // Use WebAssembly only
                    };
                }

                // Optimize WebAssembly memory usage IF wasm env exists
                if (env.wasm) {
                    console.log("[ModelWorker] Applying WASM specific optimizations.");
                    env.wasm.numThreads = 1; // Use a single thread to reduce memory usage
                    env.wasm.maximumMemory = 4 * 1024 * 1024 * 1024; // Increase memory limit
                } else {
                     console.warn("[ModelWorker] env.wasm is not defined. Skipping WASM specific optimizations.");
                }

                this.instance = await pipeline(this.task, modelId, {
                    quantized: true,
                    progress_callback: progress_callback ? (data) => {
                        progress_callback({ ...data, model: modelId });
                    } : null,
                });

                this.tokenizer_instance = this.instance.tokenizer;
                console.log(`[ModelWorker] Pipeline loaded successfully for ${modelId}.`);

                try {
                    if (!this.tokenizer_instance) throw new Error("Tokenizer not available after pipeline load.");
                    const thinkTokens = this.tokenizer_instance.encode('<think></think>', { add_special_tokens: false });
                    if (thinkTokens && thinkTokens.length === 2) {
                        START_THINKING_TOKEN_ID = thinkTokens[0];
                        END_THINKING_TOKEN_ID = thinkTokens[1];
                        console.log(`[ModelWorker] Encoded <think> tokens for ${modelId}: START=${START_THINKING_TOKEN_ID}, END=${END_THINKING_TOKEN_ID}`);
                    } else {
                        console.warn(`[ModelWorker] Could not encode <think> tokens correctly for ${modelId}.`);
                        START_THINKING_TOKEN_ID = null;
                        END_THINKING_TOKEN_ID = null;
                    }
                } catch (encodeError) {
                    console.error(`[ModelWorker] Error encoding <think> tokens for ${modelId}:`, encodeError);
                    START_THINKING_TOKEN_ID = null;
                    END_THINKING_TOKEN_ID = null;
                }

            } catch (error) {
                console.error(`[ModelWorker] Failed to load pipeline for ${modelId}:`, error);
                this.instance = null;
                this.tokenizer_instance = null;
                this.currentModelId = null;
                throw error;
            }
        }
        return this.instance;
    }

    static getTokenizer() {
        if (!this.tokenizer_instance) {
            console.warn("[ModelWorker] Attempted to get tokenizer before pipeline was loaded.");
        }
        return this.tokenizer_instance;
    }

    static getCurrentModelId() {
        return this.currentModelId;
    }
}

let isInterrupted = false;
let isModelLoaded = false;
let lastLoggedProgress = -10;

self.onmessage = async (event) => {
    const { type, payload } = event.data;
    console.log("[ModelWorker] Received message:", type);

    switch (type) {
        case 'init':
            const requestedModelId = payload?.modelId;
            if (!requestedModelId) {
                console.error("[ModelWorker] Initialization failed: modelId not provided in init payload.");
                self.postMessage({ type: 'error', payload: 'Initialization failed: modelId not provided.' });
                return;
            }

            if (isModelLoaded && GenerationPipelineSingleton.getCurrentModelId() === requestedModelId) {
                console.log(`[ModelWorker] Model ${requestedModelId} already loaded. Ignoring redundant init.`);
                self.postMessage({ type: 'workerReady', payload: { model: requestedModelId } });
                return;
            }

            console.log(`[ModelWorker] Initializing environment and loading model: ${requestedModelId}`);
            isModelLoaded = false;
            self.postMessage({ type: 'loadingStatus', payload: { status: 'init', file: 'pipeline', progress: 0, model: requestedModelId } });

            try {
                if (!env) throw new Error("'env' object not available from transformers import.");
                const wasmPath = payload?.wasmPath;
                if (!wasmPath) {
                    throw new Error("WASM path not provided in init payload.");
                }
                env.backends.onnx.wasm.wasmPaths = wasmPath;
                console.log("[ModelWorker] Transformers WASM path set from payload to:", wasmPath);
            } catch (envError) {
                console.error("[ModelWorker] Failed during WASM path setup:", envError);
                self.postMessage({ type: 'error', payload: `WASM Setup failed: ${envError.message || envError}` });
                return;
            }

            try {
                await GenerationPipelineSingleton.getInstance(requestedModelId, (progressData) => {
                    if (progressData?.status === 'progress' && progressData?.progress) {
                        const currentProgress = Math.floor(progressData.progress);
                        if (currentProgress >= lastLoggedProgress + 10) {
                            self.postMessage({ type: 'loadingStatus', payload: progressData });
                            lastLoggedProgress = currentProgress;
                        }
                    } else {
                        self.postMessage({ type: 'loadingStatus', payload: progressData });
                        lastLoggedProgress = -10;
                    }
                });

                isModelLoaded = true;
                self.postMessage({ type: 'workerReady', payload: { model: requestedModelId } });
                console.log(`[ModelWorker] MODEL ready message sent for ${requestedModelId}.`);

            } catch (error) {
                console.error(`[ModelWorker] Failed during pipeline/model load for ${requestedModelId}:`, error);
                isModelLoaded = false;
                self.postMessage({ type: 'error', payload: `Model Load failed for ${requestedModelId}: ${error.message || error}` });
            }
            break;

        case 'generate':
            if (!isModelLoaded || !GenerationPipelineSingleton.getCurrentModelId()) {
                console.error("[ModelWorker] Cannot generate, model not loaded.");
                self.postMessage({ type: 'generationError', payload: 'Generate failed: Model not loaded.' });
                return;
            }
            console.log(`[ModelWorker] Received generate request using model: ${GenerationPipelineSingleton.getCurrentModelId()}`, payload);
            if (!payload || !payload.messages || !Array.isArray(payload.messages)) {
                console.error("[ModelWorker] Generate failed: Invalid messages payload.");
                self.postMessage({ type: 'generationError', payload: 'Generate failed: Invalid messages payload.' });
                return;
            }

            isInterrupted = false;
            let fullOutput = '';
            let state = (START_THINKING_TOKEN_ID && END_THINKING_TOKEN_ID) ? 'answering' : 'answering-only';

            try {
                const generator = await GenerationPipelineSingleton.getInstance(GenerationPipelineSingleton.getCurrentModelId());
                const tokenizer = GenerationPipelineSingleton.getTokenizer();

                if (!tokenizer) {
                    throw new Error("Tokenizer not available for generation.");
                }

                self.postMessage({ type: 'generationStatus', payload: { status: 'generating', model: GenerationPipelineSingleton.getCurrentModelId(), input: payload.messages } });

                const stream = await generator(payload.messages, {
                    max_new_tokens: payload.max_new_tokens || 512,
                    temperature: payload.temperature || 0.7,
                    top_k: payload.top_k || 0,
                    do_sample: payload.temperature ? payload.temperature > 0 : false,
                    callback_function: (beams) => {
                        if (isInterrupted) return;
                        try {
                            const output_token_ids = beams[0]?.output_token_ids;
                            if (!output_token_ids || output_token_ids.length === 0) return;
                            const decodedChunk = tokenizer.decode(output_token_ids, { skip_special_tokens: true });
                            const newText = decodedChunk.substring(fullOutput.length);
                            fullOutput = decodedChunk;
                            const lastTokenId = output_token_ids[output_token_ids.length - 1];
                            if (state !== 'answering-only') {
                                if (lastTokenId === END_THINKING_TOKEN_ID) state = 'answering';
                                else if (lastTokenId === START_THINKING_TOKEN_ID) state = 'thinking';
                            }
                            if (state === 'answering' || state === 'answering-only') {
                                self.postMessage({ type: 'generationUpdate', payload: { chunk: newText, state: state } });
                            }
                        } catch (streamError) {
                            console.error("[ModelWorker] Error during stream processing callback:", streamError);
                        }
                    }
                });

                console.log("[ModelWorker] Generation stream processing finished.");
                if (isInterrupted) {
                    self.postMessage({ type: 'generationStatus', payload: { status: 'interrupted' } });
                } else {
                    let finalResult = stream;
                    if (typeof stream === 'object' && stream !== null && stream.generated_text) finalResult = stream.generated_text;
                    else if (fullOutput) finalResult = fullOutput;
                    self.postMessage({ type: 'generationComplete', payload: { model: GenerationPipelineSingleton.getCurrentModelId(), input: payload.messages, output: finalResult } });
                }

            } catch (error) {
                console.error(`[ModelWorker] Failed during generation for ${GenerationPipelineSingleton.getCurrentModelId()}:`, error);
                self.postMessage({ type: 'generationError', payload: `Generation failed: ${error.message || error}` });
            }
            break;

        case 'interrupt':
            console.log("[ModelWorker] Received interrupt request.");
            isInterrupted = true;
            break;

        case 'reset':
            console.log("[ModelWorker] Received reset request.");
            isInterrupted = false;
            self.postMessage({ type: 'resetComplete' });
            break;

        default:
            console.warn("[ModelWorker] Unknown message type:", type);
            self.postMessage({ type: 'error', payload: `Unknown message type received: ${type}` });
            break;
    }
};

console.log("[ModelWorker] Worker script evaluated. Sending script ready signal.");
self.postMessage({ type: 'workerScriptReady' });