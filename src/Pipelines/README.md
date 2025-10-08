# Pipeline Architecture

## Overview

This directory contains a robust, extensible pipeline system for loading and managing different types of ML models using `transformers.js`.

## Key Features

- ✅ **Type-safe configuration** - Hierarchical config interfaces for different pipeline types
- ✅ **Auto device detection** - Automatically detects WebGPU/CPU and FP16 support
- ✅ **Shared GPU detection** - Single `DeviceCapabilities` class used across all pipelines
- ✅ **Lazy loading** - Models only load when needed, skip reload if config unchanged
- ✅ **Multiple pipeline types** - Text generation, embeddings, multimodal (vision+text)

---

## Architecture

### 1. Device Capabilities (GPU Detection)

```typescript
import { DeviceCapabilities } from './Pipelines/GenerationPipeline';

// Initialize once (caches results)
await DeviceCapabilities.initialize();

// Check capabilities
const hasWebGPU = await DeviceCapabilities.hasWebGPU();  // true/false
const hasFP16 = await DeviceCapabilities.hasFP16();      // true/false

// Get best device
const device = await DeviceCapabilities.getBestDevice(); // 'webgpu' | 'cpu'

// Get recommended dtype
const dtype = await DeviceCapabilities.getRecommendedDtype(); // 'q4f16' | 'q4'
```

**Why?** This replaces the manual WebGPU detection in `backgroundModelManager.ts`. Now all pipelines share the same detection logic.

---

### 2. Configuration System

#### Type Hierarchy

```
IBaseModelConfig (base for all)
├── IComplexPipelineConfig (text gen, multimodal, speech)
│   ├── ITextGenerationConfig
│   ├── IMultimodalConfig
│   └── ISpeechRecognitionConfig
└── ISimplePipelineConfig (embeddings, translation)
    ├── IEmbeddingConfig
    ├── ITranslationConfig
    └── IClassificationConfig
```

#### Config Classes

- `TextGenerationConfig` - For text generation models
- `EmbeddingConfig` - For feature extraction
- `MultimodalConfig` - For vision-language models

**Union Type:**
```typescript
type ModelConfig = 
  | ITextGenerationConfig 
  | IMultimodalConfig 
  | ISpeechRecognitionConfig
  | IEmbeddingConfig
  | ITranslationConfig
  | IClassificationConfig;
```

---

### 3. Usage Examples

#### Manual Configuration

```typescript
import { TextGenerationConfig, TextGenerationPipeline } from './Pipelines/GenerationPipeline';

// Create config manually
const config = new TextGenerationConfig({
  modelId: 'onnx-community/Phi-3.5-mini-instruct-onnx-web',
  dtype: 'q4f16',
  device: 'webgpu',
  useExternalData: false,
  pipelineType: 'text-generation'
});

// Load pipeline
const pipeline = new TextGenerationPipeline();
await pipeline.load(config);

// Generate
const tokenizer = pipeline.getTokenizer();
const model = pipeline.getModel();
```

#### Auto-Detection (Recommended)

```typescript
import { TextGenerationConfig, TextGenerationPipeline } from './Pipelines/GenerationPipeline';

// Auto-detect best device and dtype
const config = await TextGenerationConfig.createWithAutoDetect(
  'onnx-community/Phi-3.5-mini-instruct-onnx-web',
  {
    // Optional overrides
    dtype: 'q4',  // Override auto-detected dtype
    useExternalData: true
  }
);

const pipeline = new TextGenerationPipeline();
await pipeline.load(config);
```

#### Embedding Pipeline

```typescript
import { EmbeddingConfig, EmbeddingPipeline } from './Pipelines/GenerationPipeline';

const config = await EmbeddingConfig.createWithAutoDetect(
  'Xenova/all-MiniLM-L6-v2'
);

const pipeline = new EmbeddingPipeline();
await pipeline.load(config);

// Use pipeline
const embeddings = await pipeline.getPipeline()('Hello world');
```

#### Multimodal Pipeline

```typescript
import { MultimodalConfig, MultimodalPipeline } from './Pipelines/GenerationPipeline';

const config = await MultimodalConfig.createWithAutoDetect(
  'HuggingFaceTB/SmolVLM-256M-Instruct',
  'image-to-text',
  {
    imageOptions: { doImageSplitting: true }
  }
);

const pipeline = new MultimodalPipeline();
await pipeline.load(config);

// Use processor and model
const processor = pipeline.getProcessor();
const model = pipeline.getModel();
```

---

### 4. Config Comparison & Caching

Configs have built-in equality checking to avoid unnecessary reloads:

```typescript
const config1 = new TextGenerationConfig({
  modelId: 'onnx-community/Phi-3.5-mini-instruct-onnx-web',
  dtype: 'q4f16',
  device: 'webgpu',
  useExternalData: false,
  pipelineType: 'text-generation'
});

const config2 = config1.clone();

// Check equality
if (config1.equals(config2)) {
  console.log('Same config - no reload needed');
}

// Pipeline automatically checks this
await pipeline.load(config1); // Loads model
await pipeline.load(config2); // Skips reload (same config)
```

---

### 5. Dtype & Device Types

#### Simple Types
```typescript
type DtypeSimple = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16' | 'int8' | 'uint8' | 'bnb4' | 'auto';
type DeviceSimple = 'webgpu' | 'cpu' | 'wasm';
```

#### Complex Types (Per-Component)
```typescript
type DtypeComplex = Record<string, DtypeSimple>;
type DeviceComplex = Record<string, DeviceSimple>;

// Example: Janus multimodal model
const dtype: DtypeComplex = {
  prepare_inputs_embeds: 'q4',
  language_model: 'q4f16',
  lm_head: 'fp16',
  gen_head: 'fp16',
  image_decode: 'fp32'
};

const device: DeviceComplex = {
  prepare_inputs_embeds: 'wasm',
  language_model: 'webgpu',
  lm_head: 'webgpu',
  image_decode: 'webgpu'
};
```

---

## Migration from backgroundModelManager.ts

### Before (Old Way)
```typescript
// In backgroundModelManager.ts
const hasWebGPU = _isNavigatorGpuAvailable;
// ... manual detection code ...

const modelOptions = {
  dtype: 'q4f16',
  device: hasWebGPU ? 'webgpu' : 'cpu',
  use_external_data_format: false
};

transformersModel = await AutoModelForCausalLM.from_pretrained(modelId, modelOptions);
```

### After (New Way)
```typescript
import { TextGenerationConfig, TextGenerationPipeline } from './Pipelines/GenerationPipeline';

// Auto-detect best settings
const config = await TextGenerationConfig.createWithAutoDetect(modelId);

// Load via pipeline
const pipeline = new TextGenerationPipeline();
await pipeline.load(config);

// Access model
const model = pipeline.getModel();
const tokenizer = pipeline.getTokenizer();
```

**Benefits:**
- ✅ No duplicate GPU detection code
- ✅ Type-safe configuration
- ✅ Automatic reload prevention
- ✅ Reusable across different contexts
- ✅ Easy to add new pipeline types

---

## Future Extensions

### Adding a New Pipeline Type

1. **Add interface:**
```typescript
export interface INewPipelineConfig extends IComplexPipelineConfig {
  pipelineType: 'new-pipeline-type';
  customOption?: string;
}
```

2. **Add config class:**
```typescript
export class NewPipelineConfig extends BaseModelConfig implements INewPipelineConfig {
  // ... implementation
  
  static async createWithAutoDetect(modelId: string, options?: any) {
    // ... auto-detection logic
  }
}
```

3. **Add to union type:**
```typescript
export type ModelConfig = 
  | ITextGenerationConfig 
  | INewPipelineConfig  // Add here
  | ...;
```

4. **Create pipeline class:**
```typescript
export class NewPipeline extends BasePipeline<NewPipelineConfig> {
  async load(config: NewPipelineConfig, progressCallback?: (data: any) => void): Promise<void> {
    // Load model components
  }
}
```

---

## Pipeline Helpers

Utility functions for common pipeline operations:

### Filter Scraped Content

Automatically cleans scraped web page data to reduce token usage:

```typescript
import { PipelineHelpers } from './Pipelines/PipelineHelpers';

const messages = [
  { role: 'user', content: '{"method":"tempTabExecuteScript","title":"Example","text":"...","wordCount":1000,...}' }
];

// Extracts only title, URL, and text
const filtered = PipelineHelpers.filterScrapedContent(messages);
// Result: { role: 'user', content: 'Title: Example\nURL: ...\nContent: ...' }
```

### Truncate Messages

Keep messages within token limits:

```typescript
const truncated = PipelineHelpers.truncateMessages(messages, 2048);
// Keeps system message + most recent messages that fit
```

### Validate Messages

Ensure messages have correct format:

```typescript
const isValid = PipelineHelpers.validateMessages(messages);
if (!isValid) {
  console.error('Invalid message format');
}
```

### Clean Messages

Remove excessive whitespace:

```typescript
const cleaned = PipelineHelpers.cleanMessages(messages);
// Normalizes spaces, tabs, and line breaks
```

### Ensure System Prompt

Add system prompt if missing:

```typescript
const withSystem = PipelineHelpers.ensureSystemPrompt(
  messages,
  'You are a helpful assistant.'
);
```

---

## Best Practices

1. **Always use `createWithAutoDetect()`** for new configs unless you have specific requirements
2. **Reuse `DeviceCapabilities`** - don't create your own GPU detection
3. **Use `PipelineHelpers`** for message preprocessing instead of custom logic
4. **Use config classes** instead of plain objects for type safety
5. **Check `pipeline.isLoaded()`** before using model
6. **Call `pipeline.reset()`** to free memory when done

---

## Notes

- The `ModelConfig` union type is for type discrimination, not instantiation
- Use specific config classes (`TextGenerationConfig`, etc.) for creating instances
- `DeviceCapabilities` caches results - safe to call multiple times
- All pipelines share the same base functionality via `BasePipeline<TConfig>`
- `PipelineHelpers` are static methods - no need to instantiate the class
