/// <reference lib="dom" />
import {
  PipelineType,
  DtypeSimple,
  Dtype,
  Device,
  DeviceSimple,
  IBaseModelConfig,
  ITextGenerationConfig,
  ITranslationConfig,
  IEmbeddingConfig,
  IZeroShotClassificationConfig,
  IMultimodalConfig,
  IFlorence2Config,
  IJanusConfig,
  ISpeechRecognitionConfig,
  ICodeCompletionConfig,
  ITokenizerConfig
} from './PipelineTypes';

/**
 * PipelineConfigs.ts
 * 
 * All configuration classes for different pipeline types.
 * Includes DeviceCapabilities utility for GPU detection.
 */

const prefix = '[PipelineConfigs]';
const LOG_GENERAL = false;

// =============================================================================
// DEVICE CAPABILITIES
// =============================================================================

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

// =============================================================================
// BASE MODEL CONFIGURATION CLASS
// =============================================================================

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

// =============================================================================
// TEXT GENERATION CONFIG
// =============================================================================

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

// =============================================================================
// EMBEDDING CONFIG
// =============================================================================

export class EmbeddingConfig extends BaseModelConfig implements IEmbeddingConfig {
  dtype: DtypeSimple;
  pipelineType: 'feature-extraction' = 'feature-extraction';

  constructor(config: IEmbeddingConfig) {
    super(config);
    this.dtype = config.dtype;
  }

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

// =============================================================================
// TRANSLATION CONFIG
// =============================================================================

export class TranslationConfig extends BaseModelConfig implements ITranslationConfig {
  dtype: DtypeSimple;
  pipelineType: 'translation' = 'translation';

  constructor(config: ITranslationConfig) {
    super(config);
    this.dtype = config.dtype;
  }

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

// =============================================================================
// ZERO-SHOT CLASSIFICATION CONFIG
// =============================================================================

export class ZeroShotClassificationConfig extends BaseModelConfig implements IZeroShotClassificationConfig {
  dtype: DtypeSimple;
  pipelineType: 'zero-shot-classification' = 'zero-shot-classification';

  constructor(config: IZeroShotClassificationConfig) {
    super(config);
    this.dtype = config.dtype;
  }

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

// =============================================================================
// MULTIMODAL CONFIG
// =============================================================================

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

// =============================================================================
// FLORENCE2 CONFIG
// =============================================================================

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

// =============================================================================
// JANUS CONFIG
// =============================================================================

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

// =============================================================================
// SPEECH RECOGNITION CONFIG (WHISPER)
// =============================================================================

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

// =============================================================================
// CODE COMPLETION CONFIG
// =============================================================================

export class CodeCompletionConfig extends BaseModelConfig implements ICodeCompletionConfig {
  dtype: Dtype;
  device: Device;
  useExternalData: boolean;
  pipelineType: 'text-generation' = 'text-generation';
  codeOptions?: { language?: string; contextWindow?: number };

  constructor(config: ICodeCompletionConfig) {
    super(config);
    this.dtype = config.dtype;
    this.device = config.device;
    this.useExternalData = config.useExternalData;
    this.codeOptions = config.codeOptions;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: {
      dtype?: Dtype;
      device?: Device;
      useExternalData?: boolean;
      codeOptions?: { language?: string; contextWindow?: number };
    }
  ): Promise<CodeCompletionConfig> {
    const device = options?.device ?? await DeviceCapabilities.getBestDevice();
    const dtype = options?.dtype ?? await DeviceCapabilities.getRecommendedDtype();
    
    return new CodeCompletionConfig({
      modelId,
      dtype,
      device,
      useExternalData: options?.useExternalData ?? false,
      pipelineType: 'text-generation',
      codeOptions: options?.codeOptions
    });
  }

  equals(other: CodeCompletionConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           JSON.stringify(this.dtype) === JSON.stringify(other.dtype) &&
           JSON.stringify(this.device) === JSON.stringify(other.device) &&
           this.useExternalData === other.useExternalData &&
           this.pipelineType === other.pipelineType &&
           JSON.stringify(this.codeOptions) === JSON.stringify(other.codeOptions);
  }

  clone(): CodeCompletionConfig {
    return new CodeCompletionConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      codeOptions: this.codeOptions
    });
  }

  toObject(): ICodeCompletionConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      device: this.device,
      useExternalData: this.useExternalData,
      pipelineType: this.pipelineType,
      codeOptions: this.codeOptions
    };
  }
}

// =============================================================================
// TOKENIZER CONFIG (tokenizer playground - no model loading)
// =============================================================================

export class TokenizerConfig extends BaseModelConfig implements ITokenizerConfig {
  dtype: DtypeSimple;
  pipelineType: 'token-classification' = 'token-classification';

  constructor(config: ITokenizerConfig) {
    super(config);
    this.dtype = config.dtype;
  }

  static async createWithAutoDetect(
    modelId: string,
    options?: { dtype?: DtypeSimple }
  ): Promise<TokenizerConfig> {
    const dtype = options?.dtype ?? 'fp32';
    
    return new TokenizerConfig({
      modelId,
      dtype,
      pipelineType: 'token-classification'
    });
  }

  equals(other: TokenizerConfig | null): boolean {
    if (other === null) return false;
    return this.modelId === other.modelId &&
           this.dtype === other.dtype &&
           this.pipelineType === other.pipelineType;
  }

  clone(): TokenizerConfig {
    return new TokenizerConfig({
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    });
  }

  toObject(): ITokenizerConfig {
    return {
      modelId: this.modelId,
      dtype: this.dtype,
      pipelineType: this.pipelineType
    };
  }
}

