/// <reference lib="dom" />
import { AutoTokenizer, AutoModelForCausalLM } from '@huggingface/transformers';
import { LoadingStatusTypes } from '../events/eventNames';

const prefix = '[GenerationPipeline]';

// Logging flags
const LOG_GENERAL = false;
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * Enhanced progress callback interface for detailed UI updates
 */
export interface PipelineProgressInfo {
  status: typeof LoadingStatusTypes[keyof typeof LoadingStatusTypes] | 'generating' | 'stopped' | 'complete';
  file?: string;
  progress?: number; // 0-100 (optional for error/generating states)
  loadId?: string;
  loaded?: number;
  total?: number;
  message?: string;
  error?: string;
  output?: string; // For generation output
  generatedText?: string; // For generation complete
  tps?: string; // Tokens per second
  numTokens?: number; // Number of tokens generated
}

export type EnhancedProgressCallback = (info: PipelineProgressInfo) => void;

/**
 * DeviceCapabilities - Utility class for GPU detection and capabilities
 * Shared across all pipelines to avoid redundant checks
 */
export class DeviceCapabilities {
  private static _hasWebGPU: boolean | null = null;
  private static _hasFP16: boolean | null = null;
  private static _checkPromise: Promise<void> | null = null;

  /**
   * Initialize and detect GPU capabilities
   */
  static async initialize(): Promise<void> {
    if (this._checkPromise) {
      return this._checkPromise;
    }

    this._checkPromise = (async () => {
      try {
        const isNavigatorGpuAvailable = typeof navigator !== 'undefined' && !!(navigator as any).gpu;
        
        if (!isNavigatorGpuAvailable) {
          this._hasWebGPU = false;
          this._hasFP16 = false;
          return;
        }

        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) {
          this._hasWebGPU = false;
          this._hasFP16 = false;
          return;
        }

        this._hasWebGPU = true;
        this._hasFP16 = adapter.features.has('shader-f16');
        
        if (LOG_GENERAL) {
          console.log(prefix, `[DeviceCapabilities] WebGPU: ${this._hasWebGPU}, FP16: ${this._hasFP16}`);
        }
      } catch (error) {
        this._hasWebGPU = false;
        this._hasFP16 = false;
        if (LOG_GENERAL) {
          console.error(prefix, '[DeviceCapabilities] Detection failed:', error);
        }
      }
    })();

    return this._checkPromise;
  }

  /**
   * Check if WebGPU is available
   */
  static async hasWebGPU(): Promise<boolean> {
    await this.initialize();
    return this._hasWebGPU ?? false;
  }

  /**
   * Check if FP16 is supported
   */
  static async hasFP16(): Promise<boolean> {
    await this.initialize();
    return this._hasFP16 ?? false;
  }

  /**
   * Get best available device
   */
  static async getBestDevice(): Promise<DeviceSimple> {
    const hasGPU = await this.hasWebGPU();
    return hasGPU ? 'webgpu' : 'cpu';
  }

  /**
   * Get recommended dtype based on device capabilities
   */
  static async getRecommendedDtype(preferredDtype?: DtypeSimple): Promise<DtypeSimple> {
    if (preferredDtype) return preferredDtype;
    
    const hasFP16 = await this.hasFP16();
    return hasFP16 ? 'q4f16' : 'q4';
  }

  /**
   * Reset cached values (for testing)
   */
  static reset(): void {
    this._hasWebGPU = null;
    this._hasFP16 = null;
    this._checkPromise = null;
  }
}

// Pipeline types supported by transformers.js
export type PipelineType = 
  | 'text-generation'
  | 'text-classification'
  | 'token-classification'
  | 'question-answering'
  | 'fill-mask'
  | 'summarization'
  | 'translation'
  | 'text2text-generation'
  | 'feature-extraction'
  | 'image-classification'
  | 'zero-shot-classification'
  | 'automatic-speech-recognition'
  | 'image-to-text'
  | 'object-detection'
  | 'zero-shot-object-detection'
  | 'document-question-answering'
  | 'image-segmentation'
  | 'depth-estimation'
  | 'visual-language'
  | 'text-to-speech';

// Enum for type-safe pipeline selection
export enum PipelineTypeEnum {
  TEXT_GENERATION = 'text-generation',
  TEXT_CLASSIFICATION = 'text-classification',
  TOKEN_CLASSIFICATION = 'token-classification',
  QUESTION_ANSWERING = 'question-answering',
  FILL_MASK = 'fill-mask',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation',
  TEXT2TEXT_GENERATION = 'text2text-generation',
  FEATURE_EXTRACTION = 'feature-extraction',
  IMAGE_CLASSIFICATION = 'image-classification',
  ZERO_SHOT_CLASSIFICATION = 'zero-shot-classification',
  AUTOMATIC_SPEECH_RECOGNITION = 'automatic-speech-recognition',
  IMAGE_TO_TEXT = 'image-to-text',
  OBJECT_DETECTION = 'object-detection',
  ZERO_SHOT_OBJECT_DETECTION = 'zero-shot-object-detection',
  DOCUMENT_QUESTION_ANSWERING = 'document-question-answering',
  IMAGE_SEGMENTATION = 'image-segmentation',
  DEPTH_ESTIMATION = 'depth-estimation',
  VISUAL_LANGUAGE = 'visual-language',
  TEXT_TO_SPEECH = 'text-to-speech'
}

// Dtype types - can be simple string or complex per-component object
export type DtypeSimple = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16' | 'int8' | 'uint8' | 'bnb4' | 'auto';
export type DtypeComplex = Record<string, DtypeSimple>;
export type Dtype = DtypeSimple | DtypeComplex;

// Device types - can be simple string or complex per-component object
export type DeviceSimple = 'webgpu' | 'cpu' | 'wasm';
export type DeviceComplex = Record<string, DeviceSimple>;
export type Device = DeviceSimple | DeviceComplex;

// Base configuration - ALL pipelines have these
export interface IBaseModelConfig {
  modelId: string;
  pipelineType: PipelineType;
}

// Complex pipeline config (Text Generation, Multimodal, Speech)
export interface IComplexPipelineConfig extends IBaseModelConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
}

// Simple pipeline config (Feature Extraction, Translation, Classification)
export interface ISimplePipelineConfig extends IBaseModelConfig {
  dtype: DtypeSimple;
}

// Specific pipeline configurations
export interface ITextGenerationConfig extends IComplexPipelineConfig {
  pipelineType: 'text-generation';
}

export interface ITranslationConfig extends ISimplePipelineConfig {
  pipelineType: 'translation';
}

export interface IMultimodalConfig extends IComplexPipelineConfig {
  pipelineType: 'image-to-text' | 'visual-language';
  imageOptions?: {
    doImageSplitting?: boolean;
  };
}

export interface IFlorence2Config extends IComplexPipelineConfig {
  pipelineType: 'image-to-text'; // Florence2 is image-to-text specialized
  visionOptions?: {
    task?: string; // e.g., '<CAPTION>', '<DETAILED_CAPTION>', '<OD>', etc.
  };
}

export interface IJanusConfig extends IComplexPipelineConfig {
  pipelineType: 'visual-language'; // Janus is multimodal
  multimodalOptions?: {
    maxNewTextTokens?: number;
    numImageTokens?: number;
  };
}

export interface ISpeechRecognitionConfig extends IComplexPipelineConfig {
  pipelineType: 'automatic-speech-recognition';
  audioOptions?: {
    language?: string;
    task?: 'transcribe' | 'translate';
    maxNewTokens?: number;
  };
}

export interface IEmbeddingConfig extends ISimplePipelineConfig {
  pipelineType: 'feature-extraction';
}

export interface IZeroShotClassificationConfig extends ISimplePipelineConfig {
  pipelineType: 'zero-shot-classification';
}

export interface IClassificationConfig extends ISimplePipelineConfig {
  pipelineType: 'text-classification';
}

// Union type for all possible configs
export type ModelConfig = 
  | ITextGenerationConfig 
  | IMultimodalConfig 
  | IFlorence2Config
  | IJanusConfig
  | ISpeechRecognitionConfig
  | IEmbeddingConfig
  | ITranslationConfig
  | IZeroShotClassificationConfig
  | IClassificationConfig;

// Base model configuration class
export abstract class BaseModelConfig {
  modelId: string;
  pipelineType: PipelineType;

  constructor(config: IBaseModelConfig) {
    this.modelId = config.modelId;
    this.pipelineType = config.pipelineType;
    this.validate();
  }

  protected validate(): void {
    if (!this.modelId || this.modelId.trim().length === 0) {
      throw new Error('ModelConfig: modelId is required');
    }
  }

  abstract equals(other: any): boolean;
  abstract clone(): any;
  abstract toObject(): any;
}

// Text Generation Config Class
export class TextGenerationConfig extends BaseModelConfig implements ITextGenerationConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'text-generation' = 'text-generation';

  constructor(config: ITextGenerationConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
  }

  /**
   * Create config with auto-detected device and dtype
   */
  static async createWithAutoDetect(
    modelId: string, 
    options?: { 
      dtype?: Dtype; 
      device?: Device; 
      useExternalData?: boolean;
    }
  ): Promise<TextGenerationConfig> {
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new TextGenerationConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'text-generation'
    });
  }

  equals(other: TextGenerationConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType;
  }

  clone(): TextGenerationConfig {
    return new TextGenerationConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType
    });
  }

  toObject(): ITextGenerationConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType
    };
  }
}

// Embedding Config Class
export class EmbeddingConfig extends BaseModelConfig implements IEmbeddingConfig {
  dtype: DtypeSimple;
  pipelineType: 'feature-extraction' = 'feature-extraction';

  constructor(config: IEmbeddingConfig) {
    super(config);
    this.dtype = config.dtype;
  }

  /**
   * Create config with auto-detected dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple }
  ): Promise<EmbeddingConfig> {
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new EmbeddingConfig({
      modelId,
      dtype,
      pipelineType: 'feature-extraction'
    });
  }

  equals(other: EmbeddingConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType;
  }

  clone(): EmbeddingConfig {
    return new EmbeddingConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    });
  }

  toObject(): IEmbeddingConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    };
  }
}

// Translation Config Class
export class TranslationConfig extends BaseModelConfig implements ITranslationConfig {
  dtype: DtypeSimple;
  pipelineType: 'translation' = 'translation';

  constructor(config: ITranslationConfig) {
    super(config);
    this.dtype = config.dtype;
  }

  /**
   * Create config with auto-detected dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple }
  ): Promise<TranslationConfig> {
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new TranslationConfig({
      modelId,
      dtype,
      pipelineType: 'translation'
    });
  }

  equals(other: TranslationConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType;
  }

  clone(): TranslationConfig {
    return new TranslationConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    });
  }

  toObject(): ITranslationConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    };
  }
}

// ZeroShotClassification Config Class
export class ZeroShotClassificationConfig extends BaseModelConfig implements IZeroShotClassificationConfig {
  dtype: DtypeSimple;
  pipelineType: 'zero-shot-classification' = 'zero-shot-classification';

  constructor(config: IZeroShotClassificationConfig) {
    super(config);
    this.dtype = config.dtype;
  }

  /**
   * Create config with auto-detected dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple }
  ): Promise<ZeroShotClassificationConfig> {
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new ZeroShotClassificationConfig({
      modelId,
      dtype,
      pipelineType: 'zero-shot-classification'
    });
  }

  equals(other: ZeroShotClassificationConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType;
  }

  clone(): ZeroShotClassificationConfig {
    return new ZeroShotClassificationConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    });
  }

  toObject(): IZeroShotClassificationConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    };
  }
}

// SpeechRecognition Config Class (Whisper)
export class SpeechRecognitionConfig extends BaseModelConfig implements ISpeechRecognitionConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'automatic-speech-recognition' = 'automatic-speech-recognition';
  audioOptions?: { language?: string; task?: 'transcribe' | 'translate'; maxNewTokens?: number };

  constructor(config: ISpeechRecognitionConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.audioOptions = config.audioOptions;
  }

  /**
   * Create config with auto-detected device and dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: Dtype;
      device?: Device;
      useExternalData?: boolean;
      audioOptions?: { language?: string; task?: 'transcribe' | 'translate'; maxNewTokens?: number };
    }
  ): Promise<SpeechRecognitionConfig> {
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const hasFP16 = await DeviceCapabilities.hasFP16();
    
    // Default dtype for Whisper - encoder fp32, decoder q4
    const dtype = options?.dtype ?? (hasFP16 ? {
      encoder_model: 'fp16' as DtypeSimple,
      decoder_model_merged: 'q4' as DtypeSimple
    } : {
      encoder_model: 'fp32' as DtypeSimple,
      decoder_model_merged: 'q4' as DtypeSimple
    });
    
    return new SpeechRecognitionConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'automatic-speech-recognition',
      audioOptions: options?.audioOptions
    });
  }

  equals(other: SpeechRecognitionConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.audioOptions) === JSON.stringify(other.audioOptions);
  }

  clone(): SpeechRecognitionConfig {
    return new SpeechRecognitionConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      audioOptions: this.audioOptions
    });
  }

  toObject(): ISpeechRecognitionConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      audioOptions: this.audioOptions
    };
  }
}

// Multimodal Config Class
export class MultimodalConfig extends BaseModelConfig implements IMultimodalConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'image-to-text' | 'visual-language';
  imageOptions?: { doImageSplitting?: boolean };

  constructor(config: IMultimodalConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.pipelineType = config.pipelineType;
    this.imageOptions = config.imageOptions;
  }

  /**
   * Create config with auto-detected device and dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    pipelineType: 'image-to-text' | 'visual-language',
    options?: {
      dtype?: Dtype;
      device?: Device;
      useExternalData?: boolean;
      imageOptions?: { doImageSplitting?: boolean };
    }
  ): Promise<MultimodalConfig> {
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const hasFP16 = await DeviceCapabilities.hasFP16();
    
    // Default dtype for multimodal - use FP16 if supported, otherwise FP32
    const dtype = options?.dtype ?? (hasFP16 ? 'fp16' : 'fp32');
    
    return new MultimodalConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType,
      imageOptions: options?.imageOptions
    });
  }

  equals(other: MultimodalConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.imageOptions) === JSON.stringify(other.imageOptions);
  }

  clone(): MultimodalConfig {
    return new MultimodalConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      imageOptions: this.imageOptions
    });
  }

  toObject(): IMultimodalConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      imageOptions: this.imageOptions
    };
  }
}

// Florence2 Config Class
export class Florence2Config extends BaseModelConfig implements IFlorence2Config {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'image-to-text' = 'image-to-text';
  visionOptions?: { task?: string };

  constructor(config: IFlorence2Config) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.visionOptions = config.visionOptions;
  }

  /**
   * Create config with auto-detected device and dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: Dtype;
      device?: Device;
      useExternalData?: boolean;
      visionOptions?: { task?: string };
    }
  ): Promise<Florence2Config> {
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const hasFP16 = await DeviceCapabilities.hasFP16();
    
    // Default dtype for Florence2 - per-component optimization
    const dtype = options?.dtype ?? (hasFP16 ? {
      embed_tokens: 'fp16' as DtypeSimple,
      vision_encoder: 'fp16' as DtypeSimple,
      encoder_model: 'q4' as DtypeSimple,
      decoder_model_merged: 'q4' as DtypeSimple
    } : {
      embed_tokens: 'fp32' as DtypeSimple,
      vision_encoder: 'fp32' as DtypeSimple,
      encoder_model: 'q4' as DtypeSimple,
      decoder_model_merged: 'q4' as DtypeSimple
    });
    
    return new Florence2Config({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'image-to-text',
      visionOptions: options?.visionOptions
    });
  }

  equals(other: Florence2Config | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.visionOptions) === JSON.stringify(other.visionOptions);
  }

  clone(): Florence2Config {
    return new Florence2Config({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      visionOptions: this.visionOptions
    });
  }

  toObject(): IFlorence2Config {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      visionOptions: this.visionOptions
    };
  }
}

// Janus Config Class
export class JanusConfig extends BaseModelConfig implements IJanusConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'visual-language' = 'visual-language';
  multimodalOptions?: { maxNewTextTokens?: number; numImageTokens?: number };

  constructor(config: IJanusConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.multimodalOptions = config.multimodalOptions;
  }

  /**
   * Create config with auto-detected device and dtype
   */
  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: Dtype;
      device?: Device;
      useExternalData?: boolean;
      multimodalOptions?: { maxNewTextTokens?: number; numImageTokens?: number };
    }
  ): Promise<JanusConfig> {
    const hasFP16 = await DeviceCapabilities.hasFP16();
    
    // Default dtype for Janus - complex per-component config
    const dtype = options?.dtype ?? (hasFP16 ? {
      prepare_inputs_embeds: 'q4' as DtypeSimple,
      language_model: 'q4f16' as DtypeSimple,
      lm_head: 'fp16' as DtypeSimple,
      gen_head: 'fp16' as DtypeSimple,
      gen_img_embeds: 'fp16' as DtypeSimple,
      image_decode: 'fp32' as DtypeSimple
    } : {
      prepare_inputs_embeds: 'fp32' as DtypeSimple,
      language_model: 'q4' as DtypeSimple,
      lm_head: 'fp32' as DtypeSimple,
      gen_head: 'fp32' as DtypeSimple,
      gen_img_embeds: 'fp32' as DtypeSimple,
      image_decode: 'fp32' as DtypeSimple
    });
    
    // Default device for Janus - per-component device assignment
    const device = options?.device ?? {
      prepare_inputs_embeds: 'wasm' as DeviceSimple,
      language_model: 'webgpu' as DeviceSimple,
      lm_head: 'webgpu' as DeviceSimple,
      gen_head: 'webgpu' as DeviceSimple,
      gen_img_embeds: 'webgpu' as DeviceSimple,
      image_decode: 'webgpu' as DeviceSimple
    };
    
    return new JanusConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'visual-language',
      multimodalOptions: options?.multimodalOptions
    });
  }

  equals(other: JanusConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.multimodalOptions) === JSON.stringify(other.multimodalOptions);
  }

  clone(): JanusConfig {
    return new JanusConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      multimodalOptions: this.multimodalOptions
    });
  }

  toObject(): IJanusConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      multimodalOptions: this.multimodalOptions
    };
  }
}

/**
 * Abstract base class for all pipelines
 * Provides shared functionality and enforces consistent API
 */
export abstract class BasePipeline<TConfig extends BaseModelConfig = BaseModelConfig> {
  protected tokenizer: any = null;
  protected model: any = null;
  protected processor: any = null; // For vision/audio pipelines
  protected currentConfig: TConfig | null = null;

  /**
   * Check if config has changed and needs reload
   * Shared implementation available to all pipelines
   */
  protected needsReload(newConfig: TConfig): boolean {
    if (this.currentConfig === null) return true;
    return !this.currentConfig.equals(newConfig);
  }

  /**
   * Create a wrapped progress callback for transformers.js
   * Converts transformers.js progress format to our PipelineProgressInfo format
   * 
   * @param progressCallback - Our enhanced callback
   * @param loadId - Load ID for tracking
   * @param component - Component name ('tokenizer', 'model', 'processor')
   * @param progressRange - [min, max] percentage range to remap to (e.g., [10, 40])
   * @returns Wrapped callback compatible with transformers.js
   */
  protected wrapProgressCallback(
    progressCallback: EnhancedProgressCallback | undefined,
    loadId: string | undefined,
    component: string,
    progressRange: [number, number]
  ): ((data: any) => void) | undefined {
    if (!progressCallback) return undefined;

    const [minProgress, maxProgress] = progressRange;
    const progressSpan = maxProgress - minProgress;

    return (data: any) => {
      let progress = minProgress;
      let status: PipelineProgressInfo['status'] = LoadingStatusTypes.PROGRESS;
      let message = `Loading ${component} from cache...`;

      if (data.status === 'progress') {
        progress = minProgress + (data.progress * progressSpan);
        status = LoadingStatusTypes.PROGRESS;
        message = `Loading ${component} from cache... ${Math.round(progress)}%`;
      } else if (data.status === 'ready' || data.status === 'done') {
        progress = maxProgress;
        status = LoadingStatusTypes.DONE;
        message = `${component.charAt(0).toUpperCase() + component.slice(1)} ready`;
      }

      progressCallback({
        status,
        file: data.file || component,
        progress,
        loadId,
        loaded: data.loaded,
        total: data.total,
        message
      });
    };
  }

  /**
   * Load the model and required components
   * Must be implemented by each pipeline type
   */
  abstract load(config: TConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void>;

  /**
   * Reset the pipeline (clears loaded components)
   * Default implementation - can be overridden if needed
   */
  reset(): void {
    this.tokenizer = null;
    this.model = null;
    this.processor = null;
    this.currentConfig = null;
    if (LOG_GENERAL) {
      console.log(prefix, 'Pipeline reset');
    }
  }

  /**
   * Check if pipeline is loaded
   * Default implementation - can be overridden if needed
   */
  isLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * Get current configuration
   * Default implementation - can be overridden if needed
   */
  getConfig(): TConfig | null {
    return this.currentConfig;
  }

  /**
   * Get tokenizer instance
   */
  getTokenizer(): any {
    return this.tokenizer;
  }

  /**
   * Get model instance
   */
  getModel(): any {
    return this.model;
  }

  /**
   * Get processor instance (for vision/audio pipelines)
   */
  getProcessor(): any {
    return this.processor;
  }
}

/**
 * TextGenerationPipeline - For causal language models
 * Follows transformers.js example pattern with proper OOP structure
 */
export class TextGenerationPipeline extends BasePipeline<TextGenerationConfig> {
  /**
   * Load the text generation model and tokenizer
   * If config matches current loaded model, skips reload
   * If config differs, resets and loads new model
   */
  async load(
    config: TextGenerationConfig, 
    progressCallback?: EnhancedProgressCallback,
    loadId?: string
  ): Promise<void> {
    // Check if we need to reload (config changed)
    const needsReload = this.needsReload(config);

    if (needsReload) {
      // Reset existing instances if config changed
      if (this.currentConfig !== null) {
        if (LOG_CONFIG_CHANGE) {
          console.log(prefix, '[TextGeneration] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      // Store new config
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[TextGeneration] Loading model:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: config.dtype.toString(),
      progress: 0,
      loadId,
      message: 'Starting model load...'
    });

    // Lazy load tokenizer (only if not already loaded)
    if (!this.tokenizer) {
      // Send tokenizer loading start
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'tokenizer',
        progress: 10,
        loadId,
        message: 'Loading tokenizer from cache...'
      });

      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 40])
      });
    }

    // Lazy load model (only if not already loaded)
    if (!this.model) {
      // Send model loading start
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 30,
        loadId,
        message: 'Loading model from cache...'
      });

      this.model = await AutoModelForCausalLM.from_pretrained(config.modelId, {
      dtype: config.dtype as any,
        device: config.device as any,
      use_external_data_format: config.useExternalData,
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'model', [40, 90])
      });
    }

    // Send processing message
    progressCallback?.({
      status: LoadingStatusTypes.PROGRESS,
      file: 'model',
      progress: 90,
      loadId,
      message: 'Initializing model...'
    });

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'model',
      progress: 100,
      loadId,
      message: 'Model ready for inference!'
    });
  }
}

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
          console.log(prefix, '[Embedding] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Embedding] Loading model:', config.toObject());
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
          console.log(prefix, '[Translation] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Translation] Loading model:', config.toObject());
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
          console.log(prefix, '[ZeroShotClassification] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[ZeroShotClassification] Loading model:', config.toObject());
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

  /**
 * WhisperPipeline - For automatic speech recognition
 * Uses low-level API with AutoTokenizer + AutoProcessor + WhisperForConditionalGeneration
 */
export class WhisperPipeline extends BasePipeline<SpeechRecognitionConfig> {
  async load(config: SpeechRecognitionConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
    const needsReload = this.needsReload(config);

    if (needsReload) {
      if (this.currentConfig !== null) {
        if (LOG_CONFIG_CHANGE) {
          console.log(prefix, '[Whisper] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Whisper] Loading model:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: JSON.stringify(config.dtype),
      progress: 0,
      loadId,
      message: 'Starting Whisper model load...'
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

    // Lazy load processor
    if (!this.processor) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'processor',
        progress: 30,
        loadId,
        message: 'Loading processor...'
      });

      const { AutoProcessor } = await import('@huggingface/transformers');
      this.processor = await AutoProcessor.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'processor', [30, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 50,
        loadId,
        message: 'Loading Whisper model...'
      });

      const { WhisperForConditionalGeneration } = await import('@huggingface/transformers');
      this.model = await WhisperForConditionalGeneration.from_pretrained(config.modelId, {
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
      message: 'Whisper model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.tokenizer !== null && this.processor !== null && this.model !== null;
    }
  }

  /**
 * Florence2Pipeline - For multi-task vision models
 * Uses low-level API with AutoProcessor + AutoTokenizer + Florence2ForConditionalGeneration
 */
export class Florence2Pipeline extends BasePipeline<Florence2Config> {
  async load(config: Florence2Config, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
    const needsReload = this.needsReload(config);

    if (needsReload) {
      if (this.currentConfig !== null) {
        if (LOG_CONFIG_CHANGE) {
          console.log(prefix, '[Florence2] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Florence2] Loading model:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: JSON.stringify(config.dtype),
      progress: 0,
      loadId,
      message: 'Starting Florence2 model load...'
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
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'processor', [10, 30])
      });
    }

    // Lazy load tokenizer
    if (!this.tokenizer) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'tokenizer',
        progress: 30,
        loadId,
        message: 'Loading tokenizer...'
      });

      const { AutoTokenizer } = await import('@huggingface/transformers');
      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [30, 50])
      });
    }

    // Lazy load model
    if (!this.model) {
      progressCallback?.({
        status: LoadingStatusTypes.PROGRESS,
        file: 'model',
        progress: 50,
        loadId,
        message: 'Loading Florence2 model...'
      });

      const { Florence2ForConditionalGeneration } = await import('@huggingface/transformers');
      this.model = await Florence2ForConditionalGeneration.from_pretrained(config.modelId, {
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
      message: 'Florence2 model ready!'
    });
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.tokenizer !== null && this.model !== null;
  }
}

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
          console.log(prefix, '[Janus] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Janus] Loading model:', config.toObject());
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
          console.log(prefix, '[Multimodal] Config changed, resetting pipeline');
        }
        this.reset();
      }
      
      this.currentConfig = config;
      
      if (LOG_LOADING) {
        console.log(prefix, '[Multimodal] Loading model:', config.toObject());
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

/**
 * PipelineFactory - Factory pattern for creating appropriate pipeline instances
 * Pure factory with no dependencies on DB or external services
 */
export class PipelineFactory {
  /**
   * Create appropriate pipeline based on task type
   * Defaults to TextGenerationPipeline if task is unknown or not provided
   * 
   * @param task - Pipeline task type (e.g., 'text-generation', 'feature-extraction')
   * @returns Concrete pipeline instance
   */
  static createPipeline(task?: string): BasePipeline {
    // Default to text generation if no task specified
    const pipelineTask = task || PipelineTypeEnum.TEXT_GENERATION;
    
    if (LOG_GENERAL) {
      console.log(prefix, `[PipelineFactory] Creating pipeline for task: ${pipelineTask}`);
    }
    
    switch (pipelineTask) {
      case PipelineTypeEnum.TEXT_GENERATION:
        return new TextGenerationPipeline();
        
      case PipelineTypeEnum.FEATURE_EXTRACTION:
        return new EmbeddingPipeline();
        
      case PipelineTypeEnum.TRANSLATION:
        return new TranslationPipeline();
        
      case PipelineTypeEnum.ZERO_SHOT_CLASSIFICATION:
        return new ZeroShotClassificationPipeline();
        
      case PipelineTypeEnum.IMAGE_TO_TEXT:
      case PipelineTypeEnum.VISUAL_LANGUAGE:
        return new MultimodalPipeline();
        
      case PipelineTypeEnum.AUTOMATIC_SPEECH_RECOGNITION:
        return new WhisperPipeline();
        
      default:
        // Fallback to text generation for unknown tasks
        console.warn(prefix, `[PipelineFactory] Unknown task "${pipelineTask}", defaulting to text-generation`);
        return new TextGenerationPipeline();
    }
  }
}

