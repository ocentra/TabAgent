/// <reference lib="dom" />
import { AutoTokenizer, AutoModelForCausalLM } from '@huggingface/transformers';
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { TextGenerationConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * TextGenerationPipeline.ts
 * 
 * Pipeline for causal language models (text generation).
 * Uses low-level API for maximum control and streaming support.
 */

const prefix = '[TextGenerationPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;
const LOG_MODEL_LOADING = false;  // Track model loading and dtype passed to transformers.js - OFF

/**
 * TextGenerationPipeline - For causal language models
 * Follows transformers.js example pattern with proper OOP structure
 */
export class TextGenerationPipeline extends BasePipeline<TextGenerationConfig> {
  /**
   * Load the text generation model and tokenizer
   * If config matches current loaded model, skips reload
   * If config differs, resets and loads new model
   */
  async load(
    config: TextGenerationConfig, 
    progressCallback?: EnhancedProgressCallback,
    loadId?: string
  ): Promise<void> {
    // Check if we need to reload (config changed)
    const needsReload = this.needsReload(config);

    if (needsReload) {
      // Reset existing instances if config changed
      if (this.currentConfig !== null) {
        if (LOG_CONFIG_CHANGE) {
          console.log(prefix, 'Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      // Store new config
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, 'Loading model:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: config.dtype.toString(),
      progress: 0,
      loadId,
      message: 'Starting model load...'
    });

    // Lazy load tokenizer (only if not already loaded)
    if (!this.tokenizer) {
      // Send tokenizer loading start
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'tokenizer',
        progress: 10,
        loadId,
        message: 'Loading tokenizer from cache...'
      });

      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 40])
      });
    }

    // Lazy load model (only if not already loaded)
    if (!this.model) {
      // Send model loading start
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 30,
        loadId,
        message: 'Loading model from cache...'
      });

      if (LOG_MODEL_LOADING) {
        console.log(prefix, `[load] Calling AutoModelForCausalLM.from_pretrained with:
          modelId: ${config.modelId}
          dtype: ${JSON.stringify(config.dtype)}
          device: ${JSON.stringify(config.device)}
          use_external_data_format: ${config.useExternalData}`);
      }

      this.model = await AutoModelForCausalLM.from_pretrained(config.modelId, {
      dtype: config.dtype as any,
        device: config.device as any,
      use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [40, 90])
      });
      
      if (LOG_MODEL_LOADING) {
        console.log(prefix, `[load] AutoModelForCausalLM.from_pretrained completed successfully`);
      }
    }

    // Send processing message
    progressCallback?.({
      status: LoadingStatusTypes.PROGRESS,
      file: 'model',
      progress: 90,
      loadId,
      message: 'Initializing model...'
    });

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'Model ready for inference!'
    });
  }
}

