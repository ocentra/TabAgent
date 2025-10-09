/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { MultimodalConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * MultimodalPipeline.ts
 * 
 * Generic pipeline for vision-language models.
 * Uses low-level API with AutoProcessor + AutoModelForVision2Seq.
 */

const prefix = '[MultimodalPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * MultimodalPipeline - For vision-language models
 * Handles image + text inputs
 */
export class MultimodalPipeline extends BasePipeline<MultimodalConfig> {
  async load(config: MultimodalConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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

    // Lazy load processor (handles images)
    if (!this.processor) {
      const { AutoProcessor } = await import('@huggingface/transformers');
      this.processor = await AutoProcessor.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'processor', [10, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      const { AutoModelForVision2Seq } = await import('@huggingface/transformers');
      this.model = await AutoModelForVision2Seq.from_pretrained(config.modelId, {
        dtype: config.dtype as any,
        device: config.device as any,
        use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [50, 100])
      });
    }
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.model !== null;
  }
}

