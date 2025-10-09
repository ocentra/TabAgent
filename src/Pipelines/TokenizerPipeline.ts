/// <reference lib="dom" />
import { AutoTokenizer } from '@huggingface/transformers';
import { LoadingStatusTypes } from '../events/eventNames';
import { EnhancedProgressCallback } from './PipelineTypes';
import { TokenizerConfig } from './PipelineConfigs';
import { BasePipeline } from './BasePipeline';

/**
 * TokenizerPipeline.ts
 * 
 * Pipeline for tokenization-only tasks (tokenizer playground).
 * Uses AutoTokenizer for tokenization operations without loading a full model.
 */

const prefix = '[TokenizerPipeline]';
const LOG_CONFIG_CHANGE = false;
const LOG_LOADING = false;

/**
 * TokenizerPipeline - For tokenization-only tasks
 * Uses AutoTokenizer for tokenization operations
 */
export class TokenizerPipeline extends BasePipeline<TokenizerConfig> {
  async load(config: TokenizerConfig, progressCallback?: EnhancedProgressCallback, loadId?: string): Promise<void> {
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
        console.log(prefix, 'Loading tokenizer:', config.toObject());
      }
    }

    // Send initiate progress
    progressCallback?.({
      status: LoadingStatusTypes.INITIATE,
      file: config.dtype,
      progress: 0,
      loadId,
      message: 'Starting tokenizer load...'
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

      this.tokenizer = await AutoTokenizer.from_pretrained(config.modelId, {
        progress_callback: this.wrapProgressCallback(progressCallback, loadId, 'tokenizer', [10, 95])
      });
    }

    // Send completion message
    progressCallback?.({
      status: LoadingStatusTypes.DONE,
      file: 'tokenizer',
      progress: 100,
      loadId,
      message: 'Tokenizer ready!'
    });
  }

  /**
   * Tokenize text without loading a full model
   */
  async tokenize(text: string | string[]): Promise<any> {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded. Call load() first.');
    }
    
    return await this.tokenizer(text);
  }

  /**
   * Decode token IDs back to text
   */
  async decode(tokenIds: number[], options?: { skip_special_tokens?: boolean }): Promise<string> {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded. Call load() first.');
    }
    
    return await this.tokenizer.decode(tokenIds, options);
  }
}