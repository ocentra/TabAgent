/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { Florence2Config } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * Florence2Pipeline.ts
 * 
 * Pipeline for multi-task vision models (Florence2).
 * Uses low-level API with AutoProcessor + AutoTokenizer + Florence2ForConditionalGeneration.
 */

const prefix = '[Florence2Pipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * Florence2Pipeline - For multi-task vision models
 * Uses low-level API with AutoProcessor + AutoTokenizer + Florence2ForConditionalGeneration
 */
export class Florence2Pipeline extends BasePipeline<Florence2Config> {
  async load(config: Florence2Config, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting Florence2 model load...'
    });

    // Lazy load processor
    if (!this.processor) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'processor',
        progress: 10,
        loadId,
        message: 'Loading processor...'
      });

      const { AutoProcessor } = await import('@huggingface/transformers');
      this.processor = await AutoProcessor.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'processor', [10, 30])
      });
    }

    // Lazy load tokenizer
    if (!this.tokenizer) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'tokenizer',
        progress: 30,
        loadId,
        message: 'Loading tokenizer...'
      });

      const { AutoTokenizer } = await import('@huggingface/transformers');
      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [30, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 50,
        loadId,
        message: 'Loading Florence2 model...'
      });

      const { Florence2ForConditionalGeneration } = await import('@huggingface/transformers');
      this.model = await Florence2ForConditionalGeneration.from_pretrained(config.modelId, {
        dtype: config.dtype as any,
        device: config.device as any,
        use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [50, 95])
      });
    }

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'Florence2 model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.tokenizer !== null && this.model !== null;
  }
}

