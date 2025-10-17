/**
 * Native Backend Type Definitions
 * 
 * Strict TypeScript types for native app communication.
 * Matches Server/core/message_types.py protocol.
 */

import type { InferenceSettings } from '../Controllers/InferenceSettings';

/**
 * Backend types available for inference
 */
export enum BackendType {
  BROWSER = 'browser',                    // Transformers.js (current implementation)
  NATIVE_BITNET = 'native_bitnet',        // Native app: BitNet CPU/GPU
  NATIVE_ONNX = 'native_onnx',            // Native app: ONNX Runtime
  NATIVE_LLAMA = 'native_llama',          // Native app: llama.cpp
  NATIVE_MEDIAPIPE = 'native_mediapipe',  // Native app: MediaPipe
  LMSTUDIO_DIRECT = 'lmstudio_direct',    // LM Studio SDK (future)
  LMSTUDIO_MANAGED = 'lmstudio_managed',  // Native app → LM Studio (future)
  API_OPENAI = 'api_openai',              // External API (future)
}

/**
 * Native message action types
 * Must match Server/core/message_types.py ActionType enum
 */
export enum NativeActionType {
  // Connection
  PING = 'ping',
  GET_SYSTEM_INFO = 'get_system_info',
  EXECUTE_COMMAND = 'execute_command',
  
  // Model lifecycle
  PULL_MODEL = 'pull_model',
  LOAD_MODEL = 'load_model',
  UNLOAD_MODEL = 'unload_model',
  DELETE_MODEL = 'delete_model',
  GET_MODEL_STATE = 'get_model_state',
  
  // Inference
  GENERATE = 'generate',
  STOP_GENERATION = 'stop_generation',
  UPDATE_SETTINGS = 'update_settings',
  
  // Embeddings & RAG (Feature Parity with HTTP API)
  GENERATE_EMBEDDINGS = 'generate_embeddings',
  SEMANTIC_SEARCH = 'semantic_search',
  RERANK_DOCUMENTS = 'rerank_documents',
  CLUSTER_TEXTS = 'cluster_texts',
  RECOMMEND_ITEMS = 'recommend_items',
  COMPUTE_SIMILARITY = 'compute_similarity',
  
  // Configuration
  GET_PARAMS = 'get_params',
  SET_PARAMS = 'set_params',
  GET_RECIPES = 'get_recipes',
  GET_REGISTERED_MODELS = 'get_registered_models',
  
  // Resource Management (For agentic systems)
  QUERY_RESOURCES = 'query_resources',
  ESTIMATE_MODEL_SIZE = 'estimate_model_size',
  LIST_LOADED_MODELS = 'list_loaded_models',
  SELECT_ACTIVE_MODEL = 'select_active_model',
  
  // LM Studio
  CHECK_LMSTUDIO = 'check_lmstudio',
  START_LMSTUDIO = 'start_lmstudio',
  STOP_LMSTUDIO = 'stop_lmstudio',
}

/**
 * Chat message role types
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Base request structure for native messaging
 */
export interface NativeRequest {
  action: NativeActionType;
  [key: string]: any;
}

/**
 * Base response structure from native messaging
 */
export interface NativeResponse {
  status: 'success' | 'error';
  message?: string;
  [key: string]: any;
}

/**
 * Model pull request
 */
export interface PullModelRequest extends NativeRequest {
  action: NativeActionType.PULL_MODEL;
  model_id: string;
}

/**
 * Model load request
 */
export interface LoadModelRequest extends NativeRequest {
  action: NativeActionType.LOAD_MODEL;
  model_path: string;
}

/**
 * Generation request
 */
export interface GenerateRequest extends NativeRequest {
  action: NativeActionType.GENERATE;
  messages: ChatMessage[];
  settings?: Partial<InferenceSettings>;
  stream?: boolean;
}

/**
 * Update settings request
 */
export interface UpdateSettingsRequest extends NativeRequest {
  action: NativeActionType.UPDATE_SETTINGS;
  settings: Partial<InferenceSettings>;
}

/**
 * Model information from native backend
 */
export interface NativeModelInfo {
  id: string;
  name: string;
  backend: string;
  size?: number;
  path?: string;
  loaded?: boolean;
}

/**
 * System information from native app
 */
export interface SystemInfo {
  os: string;
  cpu: string;
  ram: string;
  gpu?: string;
  vram?: string;
  available_backends?: string[];
}

/**
 * Generation statistics
 */
export interface GenerationStats {
  time_to_first_token?: number;  // TTFT in ms
  tokens_per_second?: number;    // TPS
  input_tokens?: number;
  output_tokens?: number;
  total_time?: number;           // Total time in ms
}

/**
 * Inference result with metadata
 */
export interface InferenceResult {
  text: string;
  backend: BackendType;
  stats?: GenerationStats;
  error?: string;
}

/**
 * Model state from native backend
 */
export interface ModelState {
  isReady: boolean;
  backend?: string;
  modelPath?: string;
  time_to_first_token?: number;
  tokens_per_second?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_time?: number;
}

