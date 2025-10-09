/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { BaseModelConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';
import { IComplexPipelineConfig, DtypeSimple, DeviceSimple } from './PipelineTypes';

/**
 * ImageClassificationPipeline.ts
 * 
 * Pipeline for image classification with optional attention visualization.
 * Uses low-level API with AutoProcessor + AutoModelForImageClassification.
 */

const prefix = '[ImageClassificationPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

// Image Classification Config Interface
export interface IImageClassificationConfig extends IComplexPipelineConfig {
  pipelineType: 'image-classification';
  includeAttentions?: boolean; // For attention visualization
}

// Image Classification Config Class
export class ImageClassificationConfig extends BaseModelConfig implements IImageClassificationConfig {
  dtype: any;
  device: any;
  useExternalData: boolean;
  pipelineType: 'image-classification' = 'image-classification';
  includeAttentions?: boolean;

  constructor(config: IImageClassificationConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.includeAttentions = config.includeAttentions;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: any;
      device?: any;
      useExternalData?: boolean;
      includeAttentions?: boolean;
    }
  ): Promise<ImageClassificationConfig> {
    const { DeviceCapabilities } = await import('./PipelineConfigs');
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new ImageClassificationConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'image-classification',
      includeAttentions: options?.includeAttentions ?? false
    });
  }

  equals(other: ImageClassificationConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           this.includeAttentions === other.includeAttentions;
  }

  clone(): ImageClassificationConfig {
    return new ImageClassificationConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      includeAttentions: this.includeAttentions
    });
  }

  toObject(): IImageClassificationConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      includeAttentions: this.includeAttentions
    };
  }
}

/**
 * ImageClassificationPipeline - For image classification
 * Uses low-level API with AutoProcessor + AutoModelForImageClassification
 */
export class ImageClassificationPipeline extends BasePipeline<ImageClassificationConfig> {
  async load(config: ImageClassificationConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting image classification model load...'
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
        message: 'Loading image classification model...'
      });

      const { AutoModelForImageClassification } = await import('@huggingface/transformers');
      this.model = await AutoModelForImageClassification.from_pretrained(config.modelId, {
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
      message: 'Image classification model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.model !== null;
  }
}

