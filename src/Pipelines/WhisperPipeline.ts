/// <reference lib="dom" />
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { SpeechRecognitionConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * WhisperPipeline.ts
 * 
 * Pipeline for automatic speech recognition (Whisper models).
 * Uses low-level API with AutoTokenizer + AutoProcessor + WhisperForConditionalGeneration.
 */

const prefix = '[WhisperPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

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

