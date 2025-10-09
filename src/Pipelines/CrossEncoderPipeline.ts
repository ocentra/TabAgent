/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { BaseModelConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';
import { ISimplePipelineConfig, DtypeSimple } from './PipelineTypes';

/**
 * CrossEncoderPipeline.ts
 * 
 * Pipeline for sequence classification and reranking.
 * Uses low-level API with AutoTokenizer + AutoModelForSequenceClassification.
 */

const prefix = '[CrossEncoderPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

// CrossEncoder Config Interface
export interface ICrossEncoderConfig extends ISimplePipelineConfig {
  pipelineType: 'text-classification'; // Cross-encoder uses sequence classification
}

// CrossEncoder Config Class
export class CrossEncoderConfig extends BaseModelConfig implements ICrossEncoderConfig {
  dtype: DtypeSimple;
  pipelineType: 'text-classification' = 'text-classification';

  constructor(config: ICrossEncoderConfig) {
    super(config);
    this.dtype = config.dtype;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple }
  ): Promise<CrossEncoderConfig> {
    const { DeviceCapabilities } = await import('./PipelineConfigs');
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new CrossEncoderConfig({
      modelId,
      dtype,
      pipelineType: 'text-classification'
    });
  }

  equals(other: CrossEncoderConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType;
  }

  clone(): CrossEncoderConfig {
    return new CrossEncoderConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    });
  }

  toObject(): ICrossEncoderConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    };
  }
}

/**
 * CrossEncoderPipeline - For reranking and sequence classification
 * Uses low-level API with AutoTokenizer + AutoModelForSequenceClassification
 */
export class CrossEncoderPipeline extends BasePipeline<CrossEncoderConfig> {
  async load(config: CrossEncoderConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting cross-encoder model load...'
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
        message: 'Loading cross-encoder model...'
      });

      const { AutoModelForSequenceClassification } = await import('@huggingface/transformers');
      this.model = await AutoModelForSequenceClassification.from_pretrained(config.modelId, {
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
      message: 'Cross-encoder model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.tokenizer !== null && this.model !== null;
  }
}

