/**
 * Native Model Service
 * 
 * Model lifecycle management: pull, load, unload, delete.
 * 
 * Single Responsibility: Model operations on native backend
 */

import { NativeBackendService } from './NativeBackendService';
import { NativeActionType } from '../../types/native';
import type{
  NativeModelInfo,
  ModelState,
  PullModelRequest,
  LoadModelRequest
} from '../../types/native';

// Logging constants
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_INFO = false;
const prefix = '[NativeModelService]';

export class NativeModelService {
  private static instance: NativeModelService;
  private backend: NativeBackendService;
  private loadedModel: string | null = null;
  
  private constructor() {
    this.backend = NativeBackendService.getInstance();
    if (LOG_DEBUG) console.log(prefix, 'Initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NativeModelService {
    if (!NativeModelService.instance) {
      NativeModelService.instance = new NativeModelService();
    }
    return NativeModelService.instance;
  }
  
  /**
   * Pull model from HuggingFace
   */
  async pullModel(
    modelId: string,
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Pulling model:', modelId);
    
    const request: PullModelRequest = {
      action: NativeActionType.PULL_MODEL,
      model_id: modelId
    };
    
    const response = await this.backend.sendMessage(request);
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Pull failed:', response.message);
      throw new Error(response.message || 'Failed to pull model');
    }
    
    if (LOG_INFO) console.log(prefix, 'Pull complete:', modelId);
  }
  
  /**
   * Load model for inference
   */
  async loadModel(modelPath: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Loading model:', modelPath);
    
    const request: LoadModelRequest = {
      action: NativeActionType.LOAD_MODEL,
      model_path: modelPath
    };
    
    const response = await this.backend.sendMessage(request);
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Load failed:', response.message);
      throw new Error(response.message || 'Failed to load model');
    }
    
    this.loadedModel = modelPath;
    if (LOG_INFO) console.log(prefix, 'Load complete:', modelPath);
  }
  
  /**
   * Unload current model
   */
  async unloadModel(): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Unloading model');
    
    const response = await this.backend.sendMessage({
      action: NativeActionType.UNLOAD_MODEL
    });
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Unload failed:', response.message);
      throw new Error(response.message || 'Failed to unload model');
    }
    
    this.loadedModel = null;
    if (LOG_INFO) console.log(prefix, 'Unload complete');
  }
  
  /**
   * Delete model from disk
   */
  async deleteModel(modelId: string): Promise<void> {
    if (LOG_INFO) console.log(prefix, 'Deleting model:', modelId);
    
    const response = await this.backend.sendMessage({
      action: NativeActionType.DELETE_MODEL,
      model_id: modelId
    });
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Delete failed:', response.message);
      throw new Error(response.message || 'Failed to delete model');
    }
    
    if (LOG_INFO) console.log(prefix, 'Delete complete:', modelId);
  }
  
  /**
   * Get model state from native backend
   */
  async getModelState(): Promise<ModelState> {
    if (LOG_DEBUG) console.log(prefix, 'Getting model state');
    
    const response = await this.backend.sendMessage({
      action: NativeActionType.GET_MODEL_STATE
    });
    
    if (response.status === 'error') {
      if (LOG_ERROR) console.error(prefix, 'Get state failed:', response.message);
      throw new Error(response.message || 'Failed to get model state');
    }
    
    return response as unknown as ModelState;
  }
  
  /**
   * Check if a model is currently loaded
   */
  isModelLoaded(): boolean {
    return this.loadedModel !== null;
  }
  
  /**
   * Get currently loaded model path
   */
  getCurrentModel(): string | null {
    return this.loadedModel;
  }
  
  /**
   * Clear cached model state (e.g., on disconnect)
   */
  clearState(): void {
    this.loadedModel = null;
    if (LOG_DEBUG) console.log(prefix, 'State cleared');
  }
}

// Export singleton instance
export const nativeModelService = NativeModelService.getInstance();

