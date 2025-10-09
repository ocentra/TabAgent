/// <reference lib="dom" />
import { EnhancedProgressCallback } from './PipelineTypes';
import { ZeroShotClassificationConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * ZeroShotClassificationPipeline.ts
 * 
 * Pipeline for zero-shot classification tasks.
 * Uses high-level pipeline() API for simplicity.
 */

const prefix = '[ZeroShotClassificationPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * ZeroShotClassificationPipeline - For zero-shot classification tasks
 * Uses high-level pipeline API for simplicity
 */
export class ZeroShotClassificationPipeline extends BasePipeline<ZeroShotClassificationConfig> {
  private pipelineInstance: any = null;

  async load(config: ZeroShotClassificationConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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

    // Lazy load using high-level pipeline API
    if (!this.pipelineInstance) {
      const { pipeline } = await import('@huggingface/transformers');
      this.pipelineInstance = await pipeline('zero-shot-classification', config.modelId, {
        dtype: config.dtype,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'zero-shot-classification', [0, 100])
      });
      // Store for compatibility
      this.model = this.pipelineInstance;
      this.tokenizer = this.pipelineInstance.tokenizer;
    }
  }

  /**
   * Get the pipeline instance for calling
   */
  getPipeline(): any {
    return this.pipelineInstance;
  }

  override reset(): void {
    super.reset();
    this.pipelineInstance = null;
  }
}

