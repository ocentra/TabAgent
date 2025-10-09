/// <reference lib="dom" />
import { EnhancedProgressCallback } from './PipelineTypes';
import { EmbeddingConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * EmbeddingPipeline.ts
 * 
 * Pipeline for feature extraction and semantic search.
 * Uses high-level pipeline() API for simplicity.
 */

const prefix = '[EmbeddingPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * EmbeddingPipeline - For feature extraction and semantic search
 * Uses high-level pipeline() API
 */
export class EmbeddingPipeline extends BasePipeline<EmbeddingConfig> {
  private pipelineInstance: any = null;

  async load(config: EmbeddingConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      this.pipelineInstance = await pipeline('feature-extraction', config.modelId, {
        dtype: config.dtype,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'embedding', [0, 100])
      });
      // Store for compatibility
      this.model = this.pipelineInstance;
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

