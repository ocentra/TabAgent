/**
 * Native Inference Service
 * 
 * Text generation using native backends.
 * 
 * Single Responsibility: AI inference operations on native backend
 */

import { NativeBackendService } from './NativeBackendService';
import { NativeModelService } from './NativeModelService';
import { NativeActionType } from '../../types/native';
import type {
  ChatMessage,
  GenerateRequest,
  UpdateSettingsRequest,
  GenerationStats
} from '../../types/native';
import type { InferenceSettings } from '../InferenceSettings';

// Logging constants
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_INFO = false;
const prefix = '[NativeInferenceService]';

export class NativeInferenceService {
  private static instance: NativeInferenceService;
  private backend: NativeBackendService;
  private modelService: NativeModelService;
  
  private constructor() {
    this.backend = NativeBackendService.getInstance();
    this.modelService = NativeModelService.getInstance();
    if (LOG_DEBUG) console.log(prefix, 'Initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NativeInferenceService {
    if (!NativeInferenceService.instance) {
      NativeInferenceService.instance = new NativeInferenceService();
    }
    return NativeInferenceService.instance;
  }
  
  /**
   * Generate text (non-streaming)
   */
  async generate(
    messages: ChatMessage[],
    settings?: Partial<InferenceSettings>
  ): Promise<{ text: string; stats?: GenerationStats }> {
    if (!this.modelService.isModelLoaded()) {
      if (LOG_ERROR) console.error(prefix, 'No model loaded');
      throw new Error('No model loaded. Load a model first.');
    }
    
    if (LOG_INFO) console.log(prefix, 'Generating text (non-streaming)');
    
    const request: GenerateRequest = {
      action: NativeActionType.GENERATE,
      messages,
      settings: settings || {},
      stream: false
    };
    
    const response = await this.backend.sendMessage(request);
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Generation failed:', response.message);
      throw new Error(response.message || 'Generation failed');
    }
    
    const text = response.text || '';
    const stats: GenerationStats | undefined = response.stats ? {
      time_to_first_token: response.stats.time_to_first_token,
      tokens_per_second: response.stats.tokens_per_second,
      input_tokens: response.stats.input_tokens,
      output_tokens: response.stats.output_tokens,
      total_time: response.stats.total_time
    } : undefined;
    
    if (LOG_INFO) console.log(prefix, 'Generation complete, length:', text.length);
    
    return { text, stats };
  }
  
  /**
   * Generate text (streaming)
   * 
   * Note: Streaming via Chrome native messaging is complex.
   * Consider using HTTP/WebSocket for better streaming support.
   * For now, this is a placeholder that falls back to non-streaming.
   */
  async* generateStream(
    messages: ChatMessage[],
    settings?: Partial<InferenceSettings>
  ): AsyncGenerator<string, void, unknown> {
    if (!this.modelService.isModelLoaded()) {
      if (LOG_ERROR) console.error(prefix, 'No model loaded');
      throw new Error('No model loaded. Load a model first.');
    }
    
    if (LOG_INFO) console.log(prefix, 'Generating text (streaming fallback)');
    
    // TODO: Implement proper streaming when server supports SSE or WebSocket
    // For now, fallback to non-streaming
    const result = await this.generate(messages, settings);
    yield result.text;
  }
  
  /**
   * Stop ongoing generation
   */
  async stopGeneration(): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Stopping generation');
    
    const response = await this.backend.sendMessage({
      action: NativeActionType.STOP_GENERATION
    });
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Stop failed:', response.message);
      throw new Error(response.message || 'Failed to stop generation');
    }
    
    if (LOG_INFO) console.log(prefix, 'Generation stopped');
  }
  
  /**
   * Update inference settings on native backend
   */
  async updateSettings(settings: Partial<InferenceSettings>): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Updating settings');
    
    const request: UpdateSettingsRequest = {
      action: NativeActionType.UPDATE_SETTINGS,
      settings
    };
    
    const response = await this.backend.sendMessage(request);
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Update settings failed:', response.message);
      throw new Error(response.message || 'Failed to update settings');
    }
    
    if (LOG_INFO) console.log(prefix, 'Settings updated');
  }
}

// Export singleton instance
export const nativeInferenceService = NativeInferenceService.getInstance();

