/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { BaseModelConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';
import { ISimplePipelineConfig, DtypeSimple } from './PipelineTypes';

/**
 * ClapPipeline.ts
 * 
 * Pipeline for semantic audio search using CLAP models.
 * Uses low-level API with AutoTokenizer + ClapTextModelWithProjection.
 */

const prefix = '[ClapPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

// Clap Config Interface
export interface IClapConfig extends ISimplePipelineConfig {
  pipelineType: 'feature-extraction'; // CLAP uses feature extraction
  audioOptions?: {
    embedDim?: number; // Embedding dimension (default: 512)
  };
}

// Clap Config Class
export class ClapConfig extends BaseModelConfig implements IClapConfig {
  dtype: DtypeSimple;
  pipelineType: 'feature-extraction' = 'feature-extraction';
  audioOptions?: { embedDim?: number };

  constructor(config: IClapConfig) {
    super(config);
    this.dtype = config.dtype;
    this.audioOptions = config.audioOptions;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple; audioOptions?: { embedDim?: number } }
  ): Promise<ClapConfig> {
    const { DeviceCapabilities } = await import('./PipelineConfigs');
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new ClapConfig({
      modelId,
      dtype,
      pipelineType: 'feature-extraction',
      audioOptions: options?.audioOptions
    });
  }

  equals(other: ClapConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.audioOptions) === JSON.stringify(other.audioOptions);
  }

  clone(): ClapConfig {
    return new ClapConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType,
      audioOptions: this.audioOptions
    });
  }

  toObject(): IClapConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType,
      audioOptions: this.audioOptions
    };
  }
}

/**
 * ClapPipeline - For semantic audio search
 * Uses low-level API with AutoTokenizer + ClapTextModelWithProjection
 */
export class ClapPipeline extends BasePipeline<ClapConfig> {
  async load(config: ClapConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting CLAP model load...'
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
        message: 'Loading CLAP model...'
      });

      const { ClapTextModelWithProjection } = await import('@huggingface/transformers');
      this.model = await ClapTextModelWithProjection.from_pretrained(config.modelId, {
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
      message: 'CLAP model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.tokenizer !== null && this.model !== null;
  }
}

