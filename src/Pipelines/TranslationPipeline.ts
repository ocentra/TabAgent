/// <reference lib="dom" />
import { EnhancedProgressCallback } from './PipelineTypes';
import { TranslationConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * TranslationPipeline.ts
 * 
 * Pipeline for translation tasks.
 * Uses high-level pipeline() API for simplicity.
 */

const prefix = '[TranslationPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * TranslationPipeline - For translation tasks
 * Uses high-level pipeline API for simplicity
 */
export class TranslationPipeline extends BasePipeline<TranslationConfig> {
  private pipelineInstance: any = null;

  async load(config: TranslationConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      this.pipelineInstance = await pipeline('translation', config.modelId, {
        dtype: config.dtype,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'translation', [0, 100])
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

