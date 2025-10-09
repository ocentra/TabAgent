/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { BaseModelConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';
import { ISimplePipelineConfig, DtypeSimple } from './PipelineTypes';

/**
 * ClipPipeline.ts
 * 
 * Pipeline for semantic image search using CLIP models.
 * Uses low-level API with AutoTokenizer + CLIPTextModelWithProjection.
 */

const prefix = '[ClipPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

// Clip Config Interface
export interface IClipConfig extends ISimplePipelineConfig {
  pipelineType: 'feature-extraction'; // CLIP uses feature extraction
  imageSearchOptions?: {
    embedDim?: number; // Embedding dimension (default: 512)
  };
}

// Clip Config Class
export class ClipConfig extends BaseModelConfig implements IClipConfig {
  dtype: DtypeSimple;
  pipelineType: 'feature-extraction' = 'feature-extraction';
  imageSearchOptions?: { embedDim?: number };

  constructor(config: IClipConfig) {
    super(config);
    this.dtype = config.dtype;
    this.imageSearchOptions = config.imageSearchOptions;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple; imageSearchOptions?: { embedDim?: number } }
  ): Promise<ClipConfig> {
    const { DeviceCapabilities } = await import('./PipelineConfigs');
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new ClipConfig({
      modelId,
      dtype,
      pipelineType: 'feature-extraction',
      imageSearchOptions: options?.imageSearchOptions
    });
  }

  equals(other: ClipConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.imageSearchOptions) === JSON.stringify(other.imageSearchOptions);
  }

  clone(): ClipConfig {
    return new ClipConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType,
      imageSearchOptions: this.imageSearchOptions
    });
  }

  toObject(): IClipConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType,
      imageSearchOptions: this.imageSearchOptions
    };
  }
}

/**
 * ClipPipeline - For semantic image search
 * Uses low-level API with AutoTokenizer + CLIPTextModelWithProjection
 */
export class ClipPipeline extends BasePipeline<ClipConfig> {
  async load(config: ClipConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      file: config.dtype,
      progress: 0,
      loadId,
      message: 'Starting CLIP model load...'
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

      const { AutoTokenizer } = await import('@huggingface/transformers');
      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 50,
        loadId,
        message: 'Loading CLIP model...'
      });

      const { CLIPTextModelWithProjection } = await import('@huggingface/transformers');
      this.model = await CLIPTextModelWithProjection.from_pretrained(config.modelId, {
        dtype: config.dtype,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [50, 95])
      });
    }

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'CLIP model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.tokenizer !== null && this.model !== null;
  }
}

