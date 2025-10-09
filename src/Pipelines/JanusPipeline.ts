/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { JanusConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * JanusPipeline.ts
 * 
 * Pipeline for multimodal image+text generation (Janus models).
 * Uses low-level API with AutoProcessor + MultiModalityCausalLM.
 */

const prefix = '[JanusPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * JanusPipeline - For multimodal image+text generation
 * Uses low-level API with AutoProcessor + MultiModalityCausalLM
 */
export class JanusPipeline extends BasePipeline<JanusConfig> {
  async load(config: JanusConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting Janus model load...'
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
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'processor', [10, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 50,
        loadId,
        message: 'Loading Janus model...'
      });

      const { MultiModalityCausalLM } = await import('@huggingface/transformers');
      this.model = await MultiModalityCausalLM.from_pretrained(config.modelId, {
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
      message: 'Janus model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.model !== null;
  }
}

