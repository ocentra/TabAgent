/// <reference lib="dom" />
import { Dtype, DtypeSimple, Device, DeviceSimple } from './PipelineTypes';

/**
 * ModelPresets.ts
 * 
 * Model-specific optimized dtype and device configurations.
 * Based on transformers.js examples and best practices.
 */

const prefix = '[ModelPresets]';
const LOG_GENERAL = false;

// =============================================================================
// DTYPE PRESET TYPES
// =============================================================================

export interface DtypePreset {
  webgpu_fp16?: Dtype;      // WebGPU with FP16 support
  webgpu_no_fp16?: Dtype;   // WebGPU without FP16 support
  wasm?: Dtype;             // WASM fallback
  default?: Dtype;          // Generic fallback
}

// =============================================================================
// MODEL-SPECIFIC DTYPE PRESETS
// =============================================================================

/**
 * Whisper model dtype presets
 * Used for automatic speech recognition
 */
const WHISPER_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: {
    encoder_model: 'fp16',
    decoder_model_merged: 'q4'
  },
  webgpu_no_fp16: {
    encoder_model: 'fp32',
    decoder_model_merged: 'q4'
  },
  wasm: {
    encoder_model: 'fp32',
    decoder_model_merged: 'q8'
  },
  default: 'q4'
};

/**
 * Florence2 model dtype presets
 * Multi-task vision model
 */
const FLORENCE2_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: {
    embed_tokens: 'fp16',
    vision_encoder: 'fp16',
    encoder_model: 'q4',
    decoder_model_merged: 'q4'
  },
  webgpu_no_fp16: {
    embed_tokens: 'fp32',
    vision_encoder: 'fp32',
    encoder_model: 'q4',
    decoder_model_merged: 'q4'
  },
  wasm: {
    embed_tokens: 'fp32',
    vision_encoder: 'fp32',
    encoder_model: 'q8',
    decoder_model_merged: 'q8'
  },
  default: 'q4'
};

/**
 * Janus model dtype presets
 * Multimodal image+text model
 */
const JANUS_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: {
    prepare_inputs_embeds: 'q4',
    language_model: 'q4f16',
    lm_head: 'fp16',
    gen_head: 'fp16',
    gen_img_embeds: 'fp16',
    image_decode: 'fp32'
  },
  webgpu_no_fp16: {
    prepare_inputs_embeds: 'q4',
    language_model: 'q4',
    lm_head: 'fp32',
    gen_head: 'fp32',
    gen_img_embeds: 'fp32',
    image_decode: 'fp32'
  },
  wasm: {
    prepare_inputs_embeds: 'q8',
    language_model: 'q8',
    lm_head: 'fp32',
    gen_head: 'fp32',
    gen_img_embeds: 'fp32',
    image_decode: 'fp32'
  },
  default: 'q4'
};

/**
 * DeepSeek-R1 model dtype presets
 * Reasoning-focused text generation
 */
const DEEPSEEK_R1_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4f16'
};

/**
 * Llama model dtype presets
 * General text generation
 */
const LLAMA_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4'
};

/**
 * Phi model dtype presets
 * Efficient text generation
 */
const PHI_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4'
};

/**
 * Qwen model dtype presets
 * Multilingual text generation
 */
const QWEN_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4'
};

/**
 * SmolLM/SmolVLM model dtype presets
 * Small language models
 */
const SMOL_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4'
};

/**
 * Gemma model dtype presets
 * Google's language models
 */
const GEMMA_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'q4f16',
  webgpu_no_fp16: 'q4',
  wasm: 'q8',
  default: 'q4'
};

/**
 * SpeechT5 model dtype presets
 * Text-to-speech models
 */
const SPEECHT5_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: {
    text_model: 'fp16',
    vocoder: 'fp32'
  },
  webgpu_no_fp16: {
    text_model: 'fp32',
    vocoder: 'fp32'
  },
  wasm: {
    text_model: 'fp32',
    vocoder: 'fp32'
  },
  default: 'fp32'
};

/**
 * CLIP model dtype presets
 * Image-text similarity
 */
const CLIP_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'fp16',
  webgpu_no_fp16: 'fp32',
  wasm: 'fp32',
  default: 'fp32'
};

/**
 * CLAP model dtype presets
 * Audio-text similarity
 */
const CLAP_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'fp16',
  webgpu_no_fp16: 'fp32',
  wasm: 'fp32',
  default: 'fp32'
};

/**
 * DINOv2 model dtype presets
 * Image classification with attention
 */
const DINO_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'fp16',
  webgpu_no_fp16: 'fp32',
  wasm: 'fp32',
  default: 'fp32'
};

/**
 * Cross-encoder/Reranker model dtype presets
 * Text similarity and reranking
 */
const CROSS_ENCODER_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'fp16',
  webgpu_no_fp16: 'fp32',
  wasm: 'fp32',
  default: 'fp32'
};

/**
 * Embedding model dtype presets
 * Feature extraction
 */
const EMBEDDING_DTYPE_PRESETS: DtypePreset = {
  webgpu_fp16: 'fp16',
  webgpu_no_fp16: 'fp32',
  wasm: 'fp32',
  default: 'fp32'
};

// =============================================================================
// MODEL FAMILY MATCHING PATTERNS
// =============================================================================

interface ModelPattern {
  pattern: RegExp;
  preset: DtypePreset;
  description: string;
}

const MODEL_PATTERNS: ModelPattern[] = [
  // Speech models
  { pattern: /whisper|moonshine/i, preset: WHISPER_DTYPE_PRESETS, description: 'Whisper/Moonshine ASR' },
  
  // Vision models
  { pattern: /florence-?2/i, preset: FLORENCE2_DTYPE_PRESETS, description: 'Florence2 vision' },
  { pattern: /dino/i, preset: DINO_DTYPE_PRESETS, description: 'DINOv2 vision' },
  
  // Multimodal models
  { pattern: /janus/i, preset: JANUS_DTYPE_PRESETS, description: 'Janus multimodal' },
  { pattern: /smolvlm/i, preset: SMOL_DTYPE_PRESETS, description: 'SmolVLM multimodal' },
  
  // Text generation models
  { pattern: /deepseek-?r1/i, preset: DEEPSEEK_R1_DTYPE_PRESETS, description: 'DeepSeek-R1 reasoning' },
  { pattern: /llama|llama-?3/i, preset: LLAMA_DTYPE_PRESETS, description: 'Llama text generation' },
  { pattern: /phi-?3/i, preset: PHI_DTYPE_PRESETS, description: 'Phi text generation' },
  { pattern: /qwen/i, preset: QWEN_DTYPE_PRESETS, description: 'Qwen text generation' },
  { pattern: /smollm/i, preset: SMOL_DTYPE_PRESETS, description: 'SmolLM text generation' },
  { pattern: /gemma/i, preset: GEMMA_DTYPE_PRESETS, description: 'Gemma text generation' },
  
  // Audio models
  { pattern: /speecht5|tts/i, preset: SPEECHT5_DTYPE_PRESETS, description: 'SpeechT5 TTS' },
  { pattern: /clap/i, preset: CLAP_DTYPE_PRESETS, description: 'CLAP audio-text' },
  
  // Embedding and similarity models
  { pattern: /clip/i, preset: CLIP_DTYPE_PRESETS, description: 'CLIP image-text' },
  { pattern: /cross-encoder|rerank/i, preset: CROSS_ENCODER_DTYPE_PRESETS, description: 'Cross-encoder reranking' },
  { pattern: /bge|gte|e5|sentence-transformers/i, preset: EMBEDDING_DTYPE_PRESETS, description: 'Embedding models' },
];

// =============================================================================
// PRESET RESOLUTION LOGIC
// =============================================================================

export class ModelPresets {
  /**
   * Get optimized dtype preset for a specific model
   * 
   * @param modelId - HuggingFace model ID (e.g., 'openai/whisper-tiny')
   * @param hasWebGPU - Whether WebGPU is available
   * @param hasFP16 - Whether FP16 is supported
   * @returns Optimized dtype configuration
   */
  static getDtypePreset(
    modelId: string,
    hasWebGPU: boolean = true,
    hasFP16: boolean = true
  ): Dtype {
    // Match model against patterns
    for (const { pattern, preset, description } of MODEL_PATTERNS) {
      if (pattern.test(modelId)) {
        if (LOG_GENERAL) {
          console.log(prefix, `Matched "${modelId}" to ${description}`);
        }
        
        // Select appropriate preset based on device capabilities
        if (hasWebGPU && hasFP16 && preset.webgpu_fp16) {
          return preset.webgpu_fp16;
        } else if (hasWebGPU && !hasFP16 && preset.webgpu_no_fp16) {
          return preset.webgpu_no_fp16;
        } else if (!hasWebGPU && preset.wasm) {
          return preset.wasm;
        } else {
          return preset.default ?? 'q4';
        }
      }
    }
    
    // No match - return generic optimized dtype
    if (LOG_GENERAL) {
      console.log(prefix, `No preset for "${modelId}", using generic`);
    }
    
    if (hasWebGPU && hasFP16) return 'q4f16';
    if (hasWebGPU && !hasFP16) return 'q4';
    return 'q8'; // WASM fallback
  }
  
  /**
   * Get optimized device for a specific model
   * 
   * @param modelId - HuggingFace model ID
   * @param hasWebGPU - Whether WebGPU is available
   * @returns Optimized device configuration
   */
  static getDevicePreset(
    modelId: string,
    hasWebGPU: boolean = true
  ): Device {
    // For now, simple logic: use WebGPU if available, otherwise WASM
    // Can be extended with model-specific device preferences
    return hasWebGPU ? 'webgpu' : 'wasm';
  }
  
  /**
   * Check if a model has a specific preset
   * 
   * @param modelId - HuggingFace model ID
   * @returns true if model has a specific preset
   */
  static hasPreset(modelId: string): boolean {
    return MODEL_PATTERNS.some(({ pattern }) => pattern.test(modelId));
  }
  
  /**
   * Get preset description for a model
   * 
   * @param modelId - HuggingFace model ID
   * @returns Description of the preset or null
   */
  static getPresetDescription(modelId: string): string | null {
    const match = MODEL_PATTERNS.find(({ pattern }) => pattern.test(modelId));
    return match ? match.description : null;
  }
}

