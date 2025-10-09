/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback, ITextToSpeechConfig } from './PipelineTypes';
import { BaseModelConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * TextToSpeechPipeline.ts
 * 
 * Pipeline for text-to-speech synthesis (SpeechT5 models).
 * Uses low-level API with AutoTokenizer + SpeechT5ForTextToSpeech + SpeechT5HifiGan.
 */

const prefix = '[TextToSpeechPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

// TextToSpeech Config Class
export class TextToSpeechConfig extends BaseModelConfig implements ITextToSpeechConfig {
  dtype: any;
  device: any;
  useExternalData: boolean;
  pipelineType: 'text-to-speech' = 'text-to-speech';
  vocoderId?: string;
  speakerEmbeddingsUrl?: string;

  constructor(config: ITextToSpeechConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.vocoderId = config.vocoderId;
    this.speakerEmbeddingsUrl = config.speakerEmbeddingsUrl;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: any;
      device?: any;
      useExternalData?: boolean;
      vocoderId?: string;
      speakerEmbeddingsUrl?: string;
    }
  ): Promise<TextToSpeechConfig> {
    const { DeviceCapabilities } = await import('./PipelineConfigs');
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    
    // TTS typically uses fp32 for quality
    const dtype = options?.dtype ?? 'fp32';
    
    return new TextToSpeechConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'text-to-speech',
      vocoderId: options?.vocoderId,
      speakerEmbeddingsUrl: options?.speakerEmbeddingsUrl
    });
  }

  equals(other: TextToSpeechConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           this.vocoderId === other.vocoderId &&
           this.speakerEmbeddingsUrl === other.speakerEmbeddingsUrl;
  }

  clone(): TextToSpeechConfig {
    return new TextToSpeechConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      vocoderId: this.vocoderId,
      speakerEmbeddingsUrl: this.speakerEmbeddingsUrl
    });
  }

  toObject(): ITextToSpeechConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      vocoderId: this.vocoderId,
      speakerEmbeddingsUrl: this.speakerEmbeddingsUrl
    };
  }
}

/**
 * TextToSpeechPipeline - For text-to-speech synthesis
 * Uses low-level API with AutoTokenizer + SpeechT5ForTextToSpeech + SpeechT5HifiGan vocoder
 */
export class TextToSpeechPipeline extends BasePipeline<TextToSpeechConfig> {
  private vocoder: any = null;

  async load(config: TextToSpeechConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
      message: 'Starting text-to-speech model load...'
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
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 30])
      });
    }

    // Lazy load TTS model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 30,
        loadId,
        message: 'Loading TTS model...'
      });

      const { SpeechT5ForTextToSpeech } = await import('@huggingface/transformers');
      this.model = await SpeechT5ForTextToSpeech.from_pretrained(config.modelId, {
        dtype: config.dtype,
        device: config.device as any,
        use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [30, 70])
      });
    }

    // Lazy load vocoder (HiFi-GAN)
    if (!this.vocoder) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'vocoder',
        progress: 70,
        loadId,
        message: 'Loading vocoder...'
      });

      const vocoderId = config.vocoderId || 'Xenova/speecht5_hifigan';
      const { SpeechT5HifiGan } = await import('@huggingface/transformers');
      this.vocoder = await SpeechT5HifiGan.from_pretrained(vocoderId, {
        dtype: 'fp32', // Vocoder needs fp32 for quality
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'vocoder', [70, 95])
      });
    }

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'Text-to-speech model ready!'
    });
  }

  /**
   * Get vocoder instance
   */
  getVocoder(): any {
    return this.vocoder;
  }

  override reset(): void {
    super.reset();
    this.vocoder = null;
  }

  override isLoaded(): boolean {
    return this.tokenizer !== null && this.model !== null && this.vocoder !== null;
  }
}

