/// <reference lib="dom" />
import { PipelineTypeEnum } from './PipelineTypes';
import { BasePipeline } from './BasePipeline';
import { BaseModelConfig } from './PipelineConfigs';
import { TextGenerationPipeline } from './TextGenerationPipeline';
import { EmbeddingPipeline } from './EmbeddingPipeline';
import { TranslationPipeline } from './TranslationPipeline';
import { ZeroShotClassificationPipeline } from './ZeroShotClassificationPipeline';
import { WhisperPipeline } from './WhisperPipeline';
import { Florence2Pipeline } from './Florence2Pipeline';
import { JanusPipeline } from './JanusPipeline';
import { MultimodalPipeline } from './MultimodalPipeline';
import { ImageClassificationPipeline } from './ImageClassificationPipeline';
import { CrossEncoderPipeline } from './CrossEncoderPipeline';
import { ClapPipeline } from './ClapPipeline';
import { ClipPipeline } from './ClipPipeline';
import { TextToSpeechPipeline } from './TextToSpeechPipeline';
import { CodeCompletionPipeline } from './CodeCompletionPipeline';
import { TokenizerPipeline } from './TokenizerPipeline';
import {
  TextGenerationConfig,
  EmbeddingConfig,
  TranslationConfig,
  ZeroShotClassificationConfig,
  SpeechRecognitionConfig,
  Florence2Config,
  JanusConfig,
  MultimodalConfig,
  CodeCompletionConfig,
  TokenizerConfig
} from './PipelineConfigs';
import { ImageClassificationConfig } from './ImageClassificationPipeline';
import { CrossEncoderConfig } from './CrossEncoderPipeline';
import { ClapConfig } from './ClapPipeline';
import { ClipConfig } from './ClipPipeline';
import { TextToSpeechConfig } from './TextToSpeechPipeline';

/**
 * PipelineFactory.ts
 * 
 * Factory pattern for creating appropriate pipeline instances.
 * Supports both task-based and model-specific routing.
 */

const prefix = '[PipelineFactory]';
const LOG_GENERAL = false;
const LOG_MODEL_LOADING = false;  // Track model loading flow - OFF

/**
 * PipelineFactory - Factory pattern for creating appropriate pipeline instances
 * Pure factory with no dependencies on DB or external services
 */
export class PipelineFactory {
  /**
   * Create appropriate pipeline based on task type and optional modelId
   * Supports model-specific routing for specialized pipelines
   * Defaults to TextGenerationPipeline if task is unknown or not provided
   * 
   * @param task - Pipeline task type (e.g., 'text-generation', 'feature-extraction')
   * @param modelId - Optional model ID for specialized routing (e.g., 'Florence-2', 'Janus')
   * @returns Concrete pipeline instance
   */
  static createPipeline(task?: string, modelId?: string): BasePipeline {
    // Default to text generation if no task specified
    const pipelineTask = task || PipelineTypeEnum.TEXT_GENERATION;
    
    if (LOG_GENERAL) {
      console.log(prefix, `Creating pipeline for task: ${pipelineTask}, modelId: ${modelId || 'none'}`);
    }
    
    // Model-specific routing for specialized models
    if (modelId) {
      const lowerModelId = modelId.toLowerCase();
      
      // Florence2 detection
      if (lowerModelId.includes('florence') || lowerModelId.includes('florence-2')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected Florence2 model, using Florence2Pipeline');
        }
        return new Florence2Pipeline();
      }
      
      // Janus detection
      if (lowerModelId.includes('janus')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected Janus model, using JanusPipeline');
        }
        return new JanusPipeline();
      }
      
      // Whisper detection
      if (lowerModelId.includes('whisper') || lowerModelId.includes('moonshine')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected Whisper-like model, using WhisperPipeline');
        }
        return new WhisperPipeline();
      }
      
      // CLIP detection (semantic image search)
      if (lowerModelId.includes('clip')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected CLIP model, using ClipPipeline');
        }
        return new ClipPipeline();
      }
      
      // CLAP detection (semantic audio search)
      if (lowerModelId.includes('clap')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected CLAP model, using ClapPipeline');
        }
        return new ClapPipeline();
      }
      
      // Cross-encoder detection (reranking)
      if (lowerModelId.includes('rerank') || lowerModelId.includes('cross-encoder')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected cross-encoder model, using CrossEncoderPipeline');
        }
        return new CrossEncoderPipeline();
      }
      
      // DINOv2 / Attention visualization detection
      if (lowerModelId.includes('dino') || lowerModelId.includes('with-attentions')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected image classification model with attentions, using ImageClassificationPipeline');
        }
        return new ImageClassificationPipeline();
      }
      
      // SpeechT5 detection (text-to-speech)
      if (lowerModelId.includes('speecht5') || lowerModelId.includes('tts')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected text-to-speech model, using TextToSpeechPipeline');
        }
        return new TextToSpeechPipeline();
      }
      
      // Code completion models detection
      if (lowerModelId.includes('code') || lowerModelId.includes('codellama') || lowerModelId.includes('starcoder')) {
        if (LOG_GENERAL) {
          console.log(prefix, 'Detected code completion model, using CodeCompletionPipeline');
        }
        return new CodeCompletionPipeline();
      }
    }
    
    // Task-based routing (standard pipeline selection)
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
        // Default to generic MultimodalPipeline for image-to-text
        // (Florence2 is handled above via model-specific routing)
        return new MultimodalPipeline();
        
      case PipelineTypeEnum.VISUAL_LANGUAGE:
        // Default to generic MultimodalPipeline for visual-language
        // (Janus is handled above via model-specific routing)
        return new MultimodalPipeline();
        
      case PipelineTypeEnum.AUTOMATIC_SPEECH_RECOGNITION:
        return new WhisperPipeline();
        
      case PipelineTypeEnum.IMAGE_CLASSIFICATION:
        return new ImageClassificationPipeline();
        
      case PipelineTypeEnum.TEXT_CLASSIFICATION:
        // Check if it's a cross-encoder based on modelId
        if (modelId && (modelId.toLowerCase().includes('rerank') || modelId.toLowerCase().includes('cross-encoder'))) {
          return new CrossEncoderPipeline();
        }
        // Default text classification pipeline (can use high-level API if needed)
        return new CrossEncoderPipeline();
        
      case PipelineTypeEnum.TEXT_TO_SPEECH:
        return new TextToSpeechPipeline();
        
      case PipelineTypeEnum.TOKEN_CLASSIFICATION:
        return new TokenizerPipeline();
        
      default:
        // Fallback to text generation for unknown tasks
        console.warn(prefix, `Unknown task "${pipelineTask}", defaulting to text-generation`);
        return new TextGenerationPipeline();
    }
  }

  /**
   * Create pipeline and its corresponding config in one call
   * Automatically matches the correct config type to the pipeline type
   * 
   * @param task - Pipeline task type (optional)
   * @param modelId - Model ID for specialized routing
   * @param options - Configuration options (dtype, device, etc.)
   * @returns Object with pipeline instance and its config
   */
  static async createPipelineWithConfig(
    task: string | undefined,
    modelId: string,
    options: {
      dtype?: any;
      device?: any;
      useExternalData?: boolean;
      // Additional pipeline-specific options
      audioOptions?: any;
      visionOptions?: any;
      multimodalOptions?: any;
      codeOptions?: any;
      imageOptions?: any;
    }
  ): Promise<{
    pipeline: BasePipeline;
    config: BaseModelConfig;
  }> {
    if (LOG_MODEL_LOADING) {
      console.log(prefix, `[createPipelineWithConfig] Inputs:
        task: ${task}
        modelId: ${modelId}
        options.dtype: ${JSON.stringify(options?.dtype)}
        options.device: ${JSON.stringify(options?.device)}
        options.useExternalData: ${options?.useExternalData}`);
    }
    
    // Create pipeline instance
    const pipeline = this.createPipeline(task, modelId);
    
    if (LOG_MODEL_LOADING) {
      console.log(prefix, `Creating config for pipeline: ${pipeline.constructor.name}`);
    }
    
    // Create appropriate config based on pipeline type
    let config: BaseModelConfig;
    
    if (pipeline instanceof TextGenerationPipeline) {
      config = await TextGenerationConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof CodeCompletionPipeline) {
      config = await CodeCompletionConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof WhisperPipeline) {
      config = await SpeechRecognitionConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof Florence2Pipeline) {
      config = await Florence2Config.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof JanusPipeline) {
      config = await JanusConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof MultimodalPipeline) {
      // Determine pipelineType based on task
      const pipelineType = task === 'visual-language' ? 'visual-language' : 'image-to-text';
      config = await MultimodalConfig.createWithAutoDetect(modelId, pipelineType, options);
    } else if (pipeline instanceof EmbeddingPipeline) {
      config = await EmbeddingConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof TranslationPipeline) {
      config = await TranslationConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof ZeroShotClassificationPipeline) {
      config = await ZeroShotClassificationConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof ImageClassificationPipeline) {
      config = await ImageClassificationConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof CrossEncoderPipeline) {
      config = await CrossEncoderConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof ClapPipeline) {
      config = await ClapConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof ClipPipeline) {
      config = await ClipConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof TextToSpeechPipeline) {
      config = await TextToSpeechConfig.createWithAutoDetect(modelId, options);
    } else if (pipeline instanceof TokenizerPipeline) {
      config = await TokenizerConfig.createWithAutoDetect(modelId, options);
    } else {
      // Fallback to TextGenerationConfig for unknown pipeline types
      config = await TextGenerationConfig.createWithAutoDetect(modelId, options);
    }
    
    return { pipeline, config };
  }
}