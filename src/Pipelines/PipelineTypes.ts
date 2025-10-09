/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';

/**
 * PipelineTypes.ts
 * 
 * All type definitions, interfaces, and enums for the pipeline system.
 * This file contains NO implementation code - only type definitions.
 */

// =============================================================================
// PROGRESS AND CALLBACK TYPES
// =============================================================================

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

// =============================================================================
// PIPELINE TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// DTYPE AND DEVICE TYPES
// =============================================================================

// Dtype types - can be simple string or complex per-component object
export type DtypeSimple = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16' | 'int8' | 'uint8' | 'bnb4' | 'auto';
export type DtypeComplex = Record<string, DtypeSimple>;
export type Dtype = DtypeSimple | DtypeComplex;

// Device types - can be simple string or complex per-component object
export type DeviceSimple = 'webgpu' | 'cpu' | 'wasm';
export type DeviceComplex = Record<string, DeviceSimple>;
export type Device = DeviceSimple | DeviceComplex;

// =============================================================================
// BASE CONFIGURATION INTERFACES
// =============================================================================

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

// =============================================================================
// SPECIFIC PIPELINE CONFIGURATION INTERFACES
// =============================================================================

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
  pipelineType: 'image-to-text';
  visionOptions?: {
    task?: string; // e.g., '<CAPTION>', '<DETAILED_CAPTION>', '<OD>', etc.
  };
}

export interface IJanusConfig extends IComplexPipelineConfig {
  pipelineType: 'visual-language';
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

export interface ITextToSpeechConfig extends IComplexPipelineConfig {
  pipelineType: 'text-to-speech';
  vocoderId?: string;
  speakerEmbeddingsUrl?: string;
}

// =============================================================================
// UNION TYPE FOR ALL CONFIGS
// =============================================================================

export type ModelConfig = 
  | ITextGenerationConfig 
  | IMultimodalConfig 
  | IFlorence2Config
  | IJanusConfig
  | ISpeechRecognitionConfig
  | IEmbeddingConfig
  | ITranslationConfig
  | IZeroShotClassificationConfig
  | IClassificationConfig
  | ITextToSpeechConfig;

