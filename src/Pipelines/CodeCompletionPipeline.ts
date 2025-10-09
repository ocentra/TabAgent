/// <reference lib="dom" />
import { AutoTokenizer, AutoModelForCausalLM, TextStreamer } from '@huggingface/transformers';
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { CodeCompletionConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * CodeCompletionPipeline.ts
 * 
 * Pipeline for code completion tasks.
 * Uses low-level API with AutoTokenizer + AutoModelForCausalLM for maximum control.
 */

const prefix = '[CodeCompletionPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * CodeCompletionPipeline - For code completion tasks
 * Uses low-level API with AutoTokenizer + AutoModelForCausalLM
 */
export class CodeCompletionPipeline extends BasePipeline<CodeCompletionConfig> {
  async load(config: CodeCompletionConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
    const needsReload = this.needsReload(config);

    if (needsReload) {
      if (this.currentConfig !== null) {
        if (LOG_CONFIG_CHANGE) {
          console.log(prefix, 'Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, 'Loading model:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: JSON.stringify(config.dtype),
      progress: 0,
      loadId,
      message: 'Starting code completion model load...'
    });

    // Lazy load tokenizer
    if (!this.tokenizer) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'tokenizer',
        progress: 10,
        loadId,
        message: 'Loading tokenizer...'
      });

      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 40])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 40,
        loadId,
        message: 'Loading code completion model...'
      });

      this.model = await AutoModelForCausalLM.from_pretrained(config.modelId, {
        dtype: config.dtype as any,
        device: config.device as any,
        use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [40, 95])
      });
    }

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'Code completion model ready!'
    });
  }
}