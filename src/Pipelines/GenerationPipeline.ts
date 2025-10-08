/// <reference lib="dom" />
import { AutoTokenizer, AutoModelForCausalLM } from '@huggingface/transformers';

const prefix = '[GenerationPipeline]';

// Logging flags
const LOG_GENERAL = false;
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

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

export interface IMultimodalConfig extends IComplexPipelineConfig {
  pipelineType: 'image-to-text' | 'visual-language';
  imageOptions?: {
    doImageSplitting?: boolean;
  };
}

export interface ISpeechRecognitionConfig extends IComplexPipelineConfig {
  pipelineType: 'automatic-speech-recognition';
  audioOptions?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  };
}

export interface IEmbeddingConfig extends ISimplePipelineConfig {
  pipelineType: 'feature-extraction';
}

export interface ITranslationConfig extends ISimplePipelineConfig {
  pipelineType: 'translation';
}

export interface IClassificationConfig extends ISimplePipelineConfig {
  pipelineType: 'zero-shot-classification' | 'text-classification';
}

// Union type for all possible configs
export type ModelConfig = 
  | ITextGenerationConfig 
  | IMultimodalConfig 
  | ISpeechRecognitionConfig
  | IEmbeddingConfig
  | ITranslationConfig
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
   * Load the model and required components
   * Must be implemented by each pipeline type
   */
  abstract load(config: TConfig, progressCallback?: (data: any) => void): Promise<void>;

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
  async load(config: TextGenerationConfig, progressCallback?: (data: any) => void): Promise<void> {
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

    // Lazy load tokenizer (only if not already loaded)
    if (!this.tokenizer) {
      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
      progress_callback: progressCallback,
    });
    }

    // Lazy load model (only if not already loaded)
    if (!this.model) {
      this.model = await AutoModelForCausalLM.from_pretrained(config.modelId, {
      dtype: config.dtype as any,
        device: config.device as any,
      use_external_data_format: config.useExternalData,
      progress_callback: progressCallback,
    });
    }
  }
}

/**
 * EmbeddingPipeline - For feature extraction and semantic search
 * Uses high-level pipeline() API
 */
export class EmbeddingPipeline extends BasePipeline<EmbeddingConfig> {
  private pipelineInstance: any = null;

  async load(config: EmbeddingConfig, progressCallback?: (data: any) => void): Promise<void> {
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
        progress_callback: progressCallback,
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
 * MultimodalPipeline - For vision-language models
 * Handles image + text inputs
 */
export class MultimodalPipeline extends BasePipeline<MultimodalConfig> {
  async load(config: MultimodalConfig, progressCallback?: (data: any) => void): Promise<void> {
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
        progress_callback: progressCallback,
      });
    }

    // Lazy load model
    if (!this.model) {
      const { AutoModelForVision2Seq } = await import('@huggingface/transformers');
      this.model = await AutoModelForVision2Seq.from_pretrained(config.modelId, {
        dtype: config.dtype as any,
        device: config.device as any,
        use_external_data_format: config.useExternalData,
        progress_callback: progressCallback,
      });
    }
  }

  override isLoaded(): boolean {
    return this.processor !== null && this.model !== null;
  }
}

