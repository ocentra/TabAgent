// src/Controllers/InferenceSettings.ts
import { getInferenceSettings, saveInferenceSettings } from '../DB/idbModel';
import { WorkerEventNames } from '../events/eventNames';
import { llmChannel } from '../Utilities/dbChannels';
import { showSystemPromptPopup } from '../Components/SystemPromptPopup';
import popupIcon from '../assets/icons/popup.png';

const prefix = '[InferenceSettings]';
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
export const INFERENCE_SETTINGS_SINGLETON_ID = 'InferenceSettings';

if (LOG_GENERAL) console.log(prefix, 'popupIcon import resolves to:', popupIcon);
export const INFERENCE_SETTING_KEYS = {
  // Core generation parameters
  temperature: 'temperature',
  max_length: 'max_length',
  max_new_tokens: 'max_new_tokens',
  min_length: 'min_length',
  min_new_tokens: 'min_new_tokens',
  top_k: 'top_k',
  top_p: 'top_p',
  typical_p: 'typical_p',
  epsilon_cutoff: 'epsilon_cutoff',
  eta_cutoff: 'eta_cutoff',
  repetition_penalty: 'repetition_penalty',
  encoder_repetition_penalty: 'encoder_repetition_penalty',
  do_sample: 'do_sample',
  
  // Beam search parameters
  num_beams: 'num_beams',
  num_beam_groups: 'num_beam_groups',
  diversity_penalty: 'diversity_penalty',
  early_stopping: 'early_stopping',
  length_penalty: 'length_penalty',
  penalty_alpha: 'penalty_alpha',
  
  // N-gram and repetition control
  no_repeat_ngram_size: 'no_repeat_ngram_size',
  encoder_no_repeat_ngram_size: 'encoder_no_repeat_ngram_size',
  
  // Token control
  pad_token_id: 'pad_token_id',
  bos_token_id: 'bos_token_id',
  eos_token_id: 'eos_token_id',
  decoder_start_token_id: 'decoder_start_token_id',
  forced_bos_token_id: 'forced_bos_token_id',
  forced_eos_token_id: 'forced_eos_token_id',
  
  // Advanced filtering
  bad_words_ids: 'bad_words_ids',
  force_words_ids: 'force_words_ids',
  suppress_tokens: 'suppress_tokens',
  begin_suppress_tokens: 'begin_suppress_tokens',
  
  // Output control
  num_return_sequences: 'num_return_sequences',
  output_attentions: 'output_attentions',
  output_hidden_states: 'output_hidden_states',
  output_scores: 'output_scores',
  return_dict_in_generate: 'return_dict_in_generate',
  
  // Performance and caching
  use_cache: 'use_cache',
  remove_invalid_values: 'remove_invalid_values',
  renormalize_logits: 'renormalize_logits',
  
  // Advanced features
  guidance_scale: 'guidance_scale',
  max_time: 'max_time',
  exponential_decay_length_penalty: 'exponential_decay_length_penalty',
  constraints: 'constraints',
  forced_decoder_ids: 'forced_decoder_ids',
  
  // System prompt
  system_prompt: 'system_prompt',
} as const;

export type InferenceSettingTypes = {
  // Core generation parameters
  temperature: number;
  max_length: number;
  max_new_tokens: number;
  min_length: number;
  min_new_tokens: number;
  top_k: number;
  top_p: number;
  typical_p: number;
  epsilon_cutoff: number;
  eta_cutoff: number;
  repetition_penalty: number;
  encoder_repetition_penalty: number;
  do_sample: boolean;
  
  // Beam search parameters
  num_beams: number;
  num_beam_groups: number;
  diversity_penalty: number;
  early_stopping: boolean;
  length_penalty: number;
  penalty_alpha: number;
  
  // N-gram and repetition control
  no_repeat_ngram_size: number;
  encoder_no_repeat_ngram_size: number;
  
  // Token control
  pad_token_id: number | null;
  bos_token_id: number | null;
  eos_token_id: number | null;
  decoder_start_token_id: number | null;
  forced_bos_token_id: number | null;
  forced_eos_token_id: number | null;
  
  // Advanced filtering
  bad_words_ids: number[][] | null;
  force_words_ids: number[][] | null;
  suppress_tokens: number[] | null;
  begin_suppress_tokens: number[] | null;
  
  // Output control
  num_return_sequences: number;
  output_attentions: boolean;
  output_hidden_states: boolean;
  output_scores: boolean;
  return_dict_in_generate: boolean;
  
  // Performance and caching
  use_cache: boolean;
  remove_invalid_values: boolean;
  renormalize_logits: boolean;
  
  // Advanced features
  guidance_scale: number;
  max_time: number | null;
  exponential_decay_length_penalty: [number, number] | null;
  constraints: any[] | null;
  forced_decoder_ids: any[] | null;
  
  // System prompt
  system_prompt: string;
};

export type InferenceSettings = {
  [K in keyof typeof INFERENCE_SETTING_KEYS]: InferenceSettingTypes[K];
};

export interface SettingDefinition {
  key: keyof typeof INFERENCE_SETTING_KEYS;
  label: string;
  type: 'slider' | 'input' | 'checkbox' | 'select' | 'textarea';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
  description: string;
  example: string;
  options?: { value: any; label: string }[];
}

export const DEFAULT_INFERENCE_SETTINGS: InferenceSettings = {
  // Core generation parameters
  temperature: 1.0,           // Default: 1.0 (from docs)
  max_length: 2048,           // Default: 20 (from docs) - we override with user-friendly 2048
  max_new_tokens: 50,         // Default: null (from docs) - we use 50 for brief responses
  min_length: 0,              // Default: 0 (from docs)
  min_new_tokens: 0,          // Default: null (from docs) - we use 0 for user experience
  top_k: 50,                  // Default: 50 (from docs)
  top_p: 0.9,                 // Default: 1.0 (from docs) - we use 0.9 for user experience
  typical_p: 1.0,             // Default: 1.0 (from docs)
  epsilon_cutoff: 0.0,        // Default: 0.0 (from docs)
  eta_cutoff: 0.0,            // Default: 0.0 (from docs)
  repetition_penalty: 1.2,    // Default: 1.0 (from docs) - we use 1.2 to prevent rambling
  encoder_repetition_penalty: 1.0, // Default: 1.0 (from docs)
  do_sample: true,            // Default: false (from docs) - we use true for user experience
  
  // Beam search parameters
  num_beams: 1,               // Default: 1 (from docs)
  num_beam_groups: 1,         // Default: 1 (from docs)
  diversity_penalty: 0.0,     // Default: 0.0 (from docs)
  early_stopping: true,       // Default: false (from docs) - we use true for better stopping
  length_penalty: 1.0,        // Default: 1.0 (from docs)
  penalty_alpha: 0.0,         // Default: null (from docs) - we use 0.0 for user experience
  
  // N-gram and repetition control
  no_repeat_ngram_size: 3,    // Default: 0 (from docs) - we use 3 to prevent phrase repetition
  encoder_no_repeat_ngram_size: 0, // Default: 0 (from docs)
  
  // Token control
  pad_token_id: null,        // Default: null (from docs)
  bos_token_id: null,         // Default: null (from docs)
  eos_token_id: null,        // Default: null (from docs)
  decoder_start_token_id: null, // Default: null (from docs)
  forced_bos_token_id: null,  // Default: null (from docs)
  forced_eos_token_id: null,  // Default: null (from docs)
  
  // Advanced filtering
  bad_words_ids: null,        // Default: null (from docs)
  force_words_ids: null,      // Default: null (from docs)
  suppress_tokens: null,      // Default: null (from docs)
  begin_suppress_tokens: null, // Default: null (from docs)
  
  // Output control
  num_return_sequences: 1,     // Default: 1 (from docs)
  output_attentions: false,   // Default: false (from docs)
  output_hidden_states: false, // Default: false (from docs)
  output_scores: false,       // Default: false (from docs)
  return_dict_in_generate: false, // Default: false (from docs)
  
  // Performance and caching
  use_cache: true,            // Default: true (from docs)
  remove_invalid_values: false, // Default: false (from docs)
  renormalize_logits: false,  // Default: false (from docs)
  
  // Advanced features
  guidance_scale: 1.0,        // Default: null (from docs) - we use 1.0 for user experience
  max_time: null,             // Default: null (from docs)
  exponential_decay_length_penalty: null, // Default: null (from docs)
  constraints: null,          // Default: null (from docs)
  forced_decoder_ids: null,   // Default: null (from docs)
  
  // System prompt
  system_prompt: `You are a helpful AI assistant. Be precise and concise. Don't ramble or repeat yourself. Give direct, useful answers. For simple greetings, respond briefly and ask how you can help. Keep responses short and to the point.\n`,
};

export const SYSTEM_PROMPT_SETTING: SettingDefinition = {
  key: INFERENCE_SETTING_KEYS.system_prompt,
  label: keyToLabel(INFERENCE_SETTING_KEYS.system_prompt),
  type: 'textarea',
  defaultValue: DEFAULT_INFERENCE_SETTINGS.system_prompt,
  description: `The default system prompt sets the AI's behavior, personality, and rules for all conversations unless overridden. Use it to instruct the AI on tone, style, or special instructions. This prompt is always sent to the model before any user message, guiding its responses. You can expand or modify it to fit your needs.`,
  example: `You are a helpful AI assistant.\n- Always provide clear, concise, and accurate answers.\n- If you are unsure, say so honestly.\n- Be friendly, professional, and supportive.\n- Format lists and steps with bullet points when helpful.\n- If the user asks for code, provide well-commented examples.\n- If the user asks for advice, consider pros and cons.\n- Never include harmful, unethical, or illegal content.\n- If the user asks for a summary, keep it brief and focused.\n- If the user asks for a translation, be accurate and note the language.\n- If the user asks for a joke, keep it light and appropriate.`
};

export function keyToLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const COMMON_SETTINGS: SettingDefinition[] = [
  {
      key: INFERENCE_SETTING_KEYS.temperature,
      label: keyToLabel(INFERENCE_SETTING_KEYS.temperature),
      type: 'slider',
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0, 
      description: `Controls how creative or predictable the AI's responses are. Lower values make the AI more strict and focused—great for coding, technical answers, or when you want fewer made-up (hallucinated) details. Higher values make the AI more creative and varied—useful for brainstorming, stories, or blog posts, but can sometimes lead to less accurate or more imaginative answers.`,
      example: `Use 0.1–0.3 for precise tasks like code or factual Q&A. 0.7–1.0 for balanced conversation. 1.2–1.8 for creative writing or idea generation.`
  },
  {
      key: INFERENCE_SETTING_KEYS.max_length,
      label: keyToLabel(INFERENCE_SETTING_KEYS.max_length),
      type: 'input',
      defaultValue: 2048, 
      description: `Sets the maximum total length (in tokens) for the AI's answer, including your question and the response. A higher value allows for longer, more detailed answers, but may take longer to generate.`,
      example: `Use 20 for very short answers, 100 for short, 2048 for medium, 4096+ for long explanations or stories.`
  },
  {
      key: INFERENCE_SETTING_KEYS.max_new_tokens,
      label: keyToLabel(INFERENCE_SETTING_KEYS.max_new_tokens),
      type: 'input',
      defaultValue: 50, // We use 50 for brief responses (official default is null)
      description: `Limits how many new words or pieces (tokens) the AI can add to its answer. Lower values keep responses short and to the point. Higher values allow for longer, more detailed answers.`,
      example: `Try 50 for brief replies, 200 for paragraphs, 500+ for essays or stories.`
  },
  {
      key: INFERENCE_SETTING_KEYS.min_length,
      label: keyToLabel(INFERENCE_SETTING_KEYS.min_length),
      type: 'input',
      defaultValue: 0, // Official default: 0
      description: `Sets the minimum length (in tokens) for the AI's answer. Use this if you want to make sure the response is at least a certain size (for example, always a full sentence or paragraph).`,
      example: `10 for at least a sentence, 50 for a paragraph. 0 means no minimum.`
  },
  {
      key: INFERENCE_SETTING_KEYS.top_k,
      label: keyToLabel(INFERENCE_SETTING_KEYS.top_k),
      type: 'input',
      defaultValue: 50, // Official default: 50
      description: `Controls how many word choices the AI considers at each step. Lower values make the AI more focused and repetitive. Higher values allow for more variety and creativity, but can sometimes make answers less predictable.`,
      example: `1 = most focused (greedy), 10 = focused, 50 = balanced, 0 = unlimited variety.`
  },
  {
      key: INFERENCE_SETTING_KEYS.top_p,
      label: keyToLabel(INFERENCE_SETTING_KEYS.top_p),
      type: 'slider',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.9, // Official default: 1.0
      description: `Lets the AI pick from the most likely words until their combined probability reaches P. Lower values make answers more predictable and safe. Higher values allow for more diverse and surprising responses.`,
      example: `0.5 = very focused, 0.9 = balanced, 1.0 = most creative. Use lower for technical tasks, higher for creative writing.`
  },
  {
      key: INFERENCE_SETTING_KEYS.typical_p,
      label: keyToLabel(INFERENCE_SETTING_KEYS.typical_p),
      type: 'slider',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 1.0, // Official default: 1.0
      description: `Controls the typicality of generated tokens. Lower values make the AI choose more typical/common words, while higher values allow for more unusual word choices. Works alongside top_p for better control.`,
      example: `0.5 = more typical/common words, 1.0 = balanced, 0.95 = more unusual word choices.`
  },
  {
      key: INFERENCE_SETTING_KEYS.repetition_penalty,
      label: keyToLabel(INFERENCE_SETTING_KEYS.repetition_penalty),
      type: 'slider',
      min: 1.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.2, // Official default: 1.0
      description: `Discourages the AI from repeating itself. Higher values mean less repetition, but if set too high, the AI might avoid repeating important words.`,
      example: `1.0 = no penalty, 1.1 = mild, 1.3 = strong penalty. Increase if you notice repeated phrases.`
  },
  {
      key: INFERENCE_SETTING_KEYS.do_sample,
      label: keyToLabel(INFERENCE_SETTING_KEYS.do_sample),
      type: 'checkbox',
      defaultValue: true, // Official default: false
      description: `When ON, the AI will generate more varied and creative answers by sampling from possible words. When OFF, the AI will always pick the most likely next word, making answers more predictable and less creative.`,
      example: `ON = creative, varied output. OFF = more predictable, sometimes repetitive.`
  },
  {
      key: INFERENCE_SETTING_KEYS.num_beams,
      label: keyToLabel(INFERENCE_SETTING_KEYS.num_beams),
      type: 'input',
      defaultValue: 1, // Official default: 1
      description: `Controls how many different answer paths the AI explores before picking the best one. Higher values can improve answer quality but may take longer.`,
      example: `1 = no beam search (faster), 3–5 = better quality, 10+ = very thorough (slower).`
  }
];

export const ADVANCED_SETTINGS: SettingDefinition[] = [
  // Core generation parameters
  {
      key: INFERENCE_SETTING_KEYS.min_new_tokens,
      label: keyToLabel(INFERENCE_SETTING_KEYS.min_new_tokens),
      type: 'input',
      defaultValue: 0, // Official default: null, we use 0 for user experience
      description: `The minimum number of new words or pieces (tokens) the AI must generate. Use this to ensure answers are not too short.`,
      example: `0 = no minimum, 10 = at least 10 new words.`
  },
  {
      key: INFERENCE_SETTING_KEYS.epsilon_cutoff,
      label: keyToLabel(INFERENCE_SETTING_KEYS.epsilon_cutoff),
      type: 'slider',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.0, // Official default: 0.0
      description: `Filters out tokens with probability less than this value. Lower values allow more diverse tokens, higher values filter out less likely tokens.`,
      example: `0.0 = no filtering, 0.1 = filter very unlikely tokens, 0.5 = filter moderately unlikely tokens.`
  },
  {
      key: INFERENCE_SETTING_KEYS.eta_cutoff,
      label: keyToLabel(INFERENCE_SETTING_KEYS.eta_cutoff),
      type: 'slider',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.0, // Official default: 0.0
      description: `Similar to epsilon_cutoff but uses a different filtering method. Can be used alongside epsilon_cutoff for more precise control.`,
      example: `0.0 = no filtering, 0.1 = light filtering, 0.5 = strong filtering.`
  },
  {
      key: INFERENCE_SETTING_KEYS.encoder_repetition_penalty,
      label: keyToLabel(INFERENCE_SETTING_KEYS.encoder_repetition_penalty),
      type: 'slider',
      min: 1.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0, // Official default: 1.0
      description: `Penalty for repetition in the input/encoder part. Higher values reduce repetition in the source text influence.`,
      example: `1.0 = no penalty, 1.1 = mild penalty, 1.3 = strong penalty.`
  },
  
  // Beam search parameters
  {
      key: INFERENCE_SETTING_KEYS.diversity_penalty,
      label: keyToLabel(INFERENCE_SETTING_KEYS.diversity_penalty),
      type: 'slider',
      min: 0.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 0.0, // Official default: 0.0
      description: `Encourages the AI to make each answer in a batch more different from the others. Useful if you want a variety of ideas or styles in multiple responses.`,
      example: `0.0 = no penalty, 0.5 = some variety, 1.0 = high diversity. Use higher values when generating many answers at once.`
  },
  {
      key: INFERENCE_SETTING_KEYS.early_stopping,
      label: keyToLabel(INFERENCE_SETTING_KEYS.early_stopping),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will stop generating as soon as it thinks the answer is complete. When OFF, it will keep going until the maximum length is reached.`,
      example: `ON = shorter, more natural endings. OFF = longer, may run on.`
  },
  {
      key: INFERENCE_SETTING_KEYS.length_penalty,
      label: keyToLabel(INFERENCE_SETTING_KEYS.length_penalty),
      type: 'slider',
      min: -2.0,
      max: 2.0,
      step: 0.01,
      defaultValue: 1.0, // Official default: 1.0
      description: `Controls whether the AI prefers shorter or longer answers. Lower values make answers shorter, higher values make them longer.`,
      example: `<1.0 = shorter, 1.0 = neutral, >1.0 = longer answers.`
  },
  {
      key: INFERENCE_SETTING_KEYS.num_beam_groups,
      label: keyToLabel(INFERENCE_SETTING_KEYS.num_beam_groups),
      type: 'input',
      defaultValue: 1, // Official default: 1
      description: `Splits the answer search into groups for more variety. Useful for getting different styles or ideas in multiple answers.`,
      example: `1 = standard, 2+ = more diverse answers (when batch size > 1).`
  },
  {
      key: INFERENCE_SETTING_KEYS.penalty_alpha,
      label: keyToLabel(INFERENCE_SETTING_KEYS.penalty_alpha),
      type: 'slider',
      min: 0.0,
      max: 1.0,
      step: 0.01,
      defaultValue: 0.0, // Official default: null, we use 0.0 for user experience
      description: `Affects how much the AI penalizes less likely words. Higher values can make answers more focused, but may reduce creativity.`,
      example: `0.0 = disabled, 0.6 = balanced, 0.9 = strong penalty.`
  },
  
  // N-gram and repetition control
  {
      key: INFERENCE_SETTING_KEYS.no_repeat_ngram_size,
      label: keyToLabel(INFERENCE_SETTING_KEYS.no_repeat_ngram_size),
      type: 'input',
      defaultValue: 0, // Official default: 0
      description: `Prevents the AI from repeating the same sequence of words. Set to 2 to avoid repeated word pairs, 3 for triplets, etc.`,
      example: `0 = allow repeats, 2 = no repeated pairs, 3 = no repeated triplets.`
  },
  {
      key: INFERENCE_SETTING_KEYS.encoder_no_repeat_ngram_size,
      label: keyToLabel(INFERENCE_SETTING_KEYS.encoder_no_repeat_ngram_size),
      type: 'input',
      defaultValue: 0, // Official default: 0
      description: `Prevents the AI from repeating n-grams that appear in the input text. Useful for avoiding copying from the source.`,
      example: `0 = allow repeats, 2 = no repeated pairs from input, 3 = no repeated triplets from input.`
  },
  
  // Output control
  {
      key: INFERENCE_SETTING_KEYS.num_return_sequences,
      label: keyToLabel(INFERENCE_SETTING_KEYS.num_return_sequences),
      type: 'input',
      defaultValue: 1, // Official default: 1
      description: `How many different answers the AI should return for your question. Use more than 1 to see a variety of responses.`,
      example: `1 = single answer, 3 = three options, 5+ = many choices.`
  },
  {
      key: INFERENCE_SETTING_KEYS.output_attentions,
      label: keyToLabel(INFERENCE_SETTING_KEYS.output_attentions),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will include extra data about how it paid attention to each word. Useful for advanced users or debugging, but not needed for most people.`,
      example: `ON = include attention data (slower), OFF = text only.`
  },
  {
      key: INFERENCE_SETTING_KEYS.output_hidden_states,
      label: keyToLabel(INFERENCE_SETTING_KEYS.output_hidden_states),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will include its internal state data. Useful for research or advanced analysis, but not needed for most users.`,
      example: `ON = include internal states (memory intensive), OFF = text only.`
  },
  {
      key: INFERENCE_SETTING_KEYS.output_scores,
      label: keyToLabel(INFERENCE_SETTING_KEYS.output_scores),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will include confidence scores for each word it generates. Useful for advanced users or debugging.`,
      example: `ON = include confidence scores, OFF = text only.`
  },
  {
      key: INFERENCE_SETTING_KEYS.return_dict_in_generate,
      label: keyToLabel(INFERENCE_SETTING_KEYS.return_dict_in_generate),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will return a detailed object with extra info about the answer. Useful for advanced users or developers.`,
      example: `ON = detailed output, OFF = simple text.`
  },
  
  // Performance and caching
  {
      key: INFERENCE_SETTING_KEYS.use_cache,
      label: keyToLabel(INFERENCE_SETTING_KEYS.use_cache),
      type: 'checkbox',
      defaultValue: true, // Official default: true
      description: `When ON, the AI remembers previous answers to speed up follow-up responses. Uses more memory, but makes things faster.`,
      example: `ON = faster, OFF = slower but uses less memory.`
  },
  {
      key: INFERENCE_SETTING_KEYS.remove_invalid_values,
      label: keyToLabel(INFERENCE_SETTING_KEYS.remove_invalid_values),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will remove any invalid or strange values from its output. Useful if you see weird symbols or errors in answers.`,
      example: `ON = clean output, OFF = allow all values.`
  },
  {
      key: INFERENCE_SETTING_KEYS.renormalize_logits,
      label: keyToLabel(INFERENCE_SETTING_KEYS.renormalize_logits),
      type: 'checkbox',
      defaultValue: false, // Official default: false
      description: `When ON, the AI will normalize the probability scores to ensure they add up to 1.0. Can help with numerical stability.`,
      example: `ON = normalized probabilities, OFF = raw probabilities.`
  },
  
  // Advanced features
  {
      key: INFERENCE_SETTING_KEYS.guidance_scale,
      label: keyToLabel(INFERENCE_SETTING_KEYS.guidance_scale),
      type: 'slider',
      min: 1.0,
      max: 20.0,
      step: 0.1,
      defaultValue: 1.0, // Official default: null, we use 1.0 for user experience
      description: `Controls how closely the AI follows the input prompt. Higher values make the AI stick more closely to the prompt, but may reduce creativity.`,
      example: `1.0 = normal guidance, 3.0 = strong guidance, 7.5 = very strong guidance.`
  },
  {
      key: INFERENCE_SETTING_KEYS.max_time,
      label: keyToLabel(INFERENCE_SETTING_KEYS.max_time),
      type: 'input',
      defaultValue: null, // Official default: null
      description: `Maximum time (in seconds) to spend generating the response. Useful for preventing very long generation times.`,
      example: `null = no limit, 30 = 30 seconds max, 120 = 2 minutes max.`
  }
];

export function setupInferenceSettings(): void {
  const settingsContainer = document.getElementById('page-settings');
  if (!settingsContainer) return;

  const inferenceSection = createInferenceSettingsSection();
  settingsContainer.appendChild(inferenceSection);

  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = 'Reload Settings';
  reloadBtn.className = 'ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600';
  reloadBtn.onclick = () => reloadSettingsFromDB();
  inferenceSection.appendChild(reloadBtn);

  // Add Reset Settings button
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Settings';
  resetBtn.className = 'ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600';
  resetBtn.onclick = () => resetSettingsToDefault();
  inferenceSection.appendChild(resetBtn);

  initInferenceSettingsUI();
}

function createInferenceSettingsSection(): HTMLElement {
  const section = document.createElement('div');
  section.className = 'inference-settings mb-6';
  section.innerHTML = `
    <div class="border border-gray-200 dark:border-gray-600 rounded-lg">
      <div class="inference-content p-3 space-y-1">
        ${createSystemPromptSection()}
        ${createCommonSettingsSection()}
        ${createAdvancedSettingsSection()}
      </div>
    </div>
  `;

  setupCommonSettingsToggle(section);
  setupAdvancedSettingsToggle(section);
  setupAllSettingsControls(section);

  // System prompt info tooltip (handled by createSettingControl)
  setupSettingControl(section, SYSTEM_PROMPT_SETTING);

  return section;
}

function createSystemPromptSection(): string {
    return `
      <div class="system-prompt-box border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">System Prompt</span>
          <div class="flex items-center gap-1">
            <button id="setting-system_prompt-expand" class="ml-1 w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors" title="Expand">
              <img src="${popupIcon}" alt="Expand" class="w-4 h-4" />
            </button>
            <button id="setting-system_prompt-info" class="ml-1 w-5 h-5 flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300 transition-colors" title="Info">?</button>
          </div>
        </div>
        <div>
          <textarea id="setting-system_prompt" rows="8" style="min-height: 5rem; max-height: 16rem; overflow-y: auto;" class="w-full p-2 bg-transparent text-gray-900 dark:text-gray-100 text-sm resize-vertical border-0 rounded-b">${SYSTEM_PROMPT_SETTING.defaultValue}</textarea>
        </div>
      </div>
    `;
}

function createCommonSettingsSection(): string {
  return `
      <div class="common-settings">
          <button class="common-foldout-toggle w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors">
              <h4 class="font-medium text-blue-800 dark:text-blue-200">Common Settings</h4>
              <span class="fold-icon transform transition-transform duration-200">▼</span>
          </button>
          <div class="common-content mt-2 space-y-1">
              ${COMMON_SETTINGS.map(setting => createSettingControl(setting)).join('')}
          </div>
      </div>
  `;
}

function createAdvancedSettingsSection(): string {
  return `
      <div class="advanced-settings">
          <button class="advanced-foldout-toggle w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded transition-colors">
              <h4 class="font-medium text-purple-800 dark:text-purple-200">Advanced Settings</h4>
              <span class="fold-icon transform transition-transform duration-200">▼</span>
          </button>
          <div class="advanced-content mt-2 space-y-1 hidden">
              ${ADVANCED_SETTINGS.map(setting => createSettingControl(setting)).join('')}
          </div>
      </div>
  `;
}

function createSettingControl(setting: SettingDefinition): string {
  const controlId = `setting-${setting.key}`;
  const valueId = `${controlId}-value`;
  const infoId = `${controlId}-info`;

  // Special layout for system prompt
  if (setting.key === INFERENCE_SETTING_KEYS.system_prompt) {
    // Use the new box structure from createSystemPromptSection
    return '';
  }

  let controlHTML = '';
  switch (setting.type) {
    case 'slider':
      controlHTML = `
        <input type="range" 
               id="${controlId}" 
               min="${setting.min}" 
               max="${setting.max}" 
               step="${setting.step}" 
               value="${setting.defaultValue}"
               class="flex-1 mx-2 accent-blue-500">
        <span id="${valueId}" class="min-w-[3rem] text-sm font-mono text-gray-600 dark:text-gray-300">${setting.defaultValue}</span>
      `;
      break;
    case 'input':
      controlHTML = `
        <input type="number" 
               id="${controlId}" 
               value="${setting.defaultValue}"
               class="flex-1 mx-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
      `;
      break;
    case 'checkbox':
      controlHTML = `
        <input type="checkbox" 
               id="${controlId}" 
               ${setting.defaultValue ? 'checked' : ''}
               class="mx-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      `;
      break;
    case 'textarea':
      controlHTML = `
        <textarea id="${controlId}" rows="6" style="min-height: 3.5rem; max-height: 12rem; overflow-y: auto;" placeholder="You are a helpful AI assistant..." class="flex-1 mx-2 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-vertical">${setting.defaultValue}</textarea>
      `;
      break;
  }

  return `
    <div class="setting-row flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <label for="${controlId}" class="min-w-[8rem] text-sm font-medium text-gray-700 dark:text-gray-300">${setting.label}</label>
      ${controlHTML}
      <button id="${infoId}" class="ml-2 w-5 h-5 flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full text-gray-600 dark:text-gray-300 transition-colors" title="Info">?</button>
    </div>
  `;
}

function setupFoldoutToggle(container: HTMLElement, toggleSelector: string, contentSelector: string): void {
  const toggle = container.querySelector(toggleSelector) as HTMLButtonElement;
  const content = container.querySelector(contentSelector) as HTMLElement;
  const icon = toggle?.querySelector('.fold-icon') as HTMLElement;

  if (toggle && content && icon) {
      toggle.addEventListener('click', () => {
          const isHidden = content.classList.contains('hidden');
          content.classList.toggle('hidden');
          icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-180deg)';
      });
  }
}

function setupCommonSettingsToggle(container: HTMLElement): void {
  setupFoldoutToggle(container, '.common-foldout-toggle', '.common-content');
}

function setupAdvancedSettingsToggle(container: HTMLElement): void {
  setupFoldoutToggle(container, '.advanced-foldout-toggle', '.advanced-content');
}

function setupAllSettingsControls(container: HTMLElement): void {
  [...COMMON_SETTINGS, ...ADVANCED_SETTINGS].forEach(setting => {
      setupSettingControl(container, setting);
  });
}

function setupSettingControl(container: HTMLElement, setting: SettingDefinition): void {
  const controlId = `setting-${setting.key}`;
  const control = container.querySelector(`#${controlId}`) as HTMLInputElement;
  const valueSpan = container.querySelector(`#${controlId}-value`) as HTMLElement;
  const infoButton = container.querySelector(`#${controlId}-info`) as HTMLButtonElement;

  if (setting.type === 'slider' && control && valueSpan) {
      control.addEventListener('input', () => {
          valueSpan.textContent = control.value;
      });
  }

  if (infoButton) {
      let tooltip: HTMLElement | null = null;
      
      infoButton.addEventListener('mouseenter', () => {
          tooltip = createTooltip(setting.description, setting.example);
          document.body.appendChild(tooltip);
          positionTooltip(tooltip, infoButton);
      });

      infoButton.addEventListener('mouseleave', () => {
          if (tooltip) {
              tooltip.remove();
              tooltip = null;
          }
      });
  }
}

function createTooltip(description: string, example: string): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'fixed z-50 max-w-sm p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg border border-gray-700 dark:border-gray-300';
  tooltip.innerHTML = `
      <div class="font-medium mb-1">${description}</div>
      <div class="text-xs opacity-75 italic">Example: ${example}</div>
  `;
  return tooltip;
}

function positionTooltip(tooltip: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
  tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
  
  if (parseFloat(tooltip.style.left) < 0) {
      tooltip.style.left = `${rect.right + 10}px`;
  }
}

export function getCurrentSettings(): InferenceSettings {
  const settings = { ...DEFAULT_INFERENCE_SETTINGS };
  [...COMMON_SETTINGS, ...ADVANCED_SETTINGS].forEach(setting => {
      const control = document.querySelector(`#setting-${setting.key}`) as HTMLInputElement;
      if (control) {
          let value: any;
          switch (setting.type) {
              case 'slider':
              case 'input':
                  value = parseFloat(control.value);
                  if (isNaN(value)) value = setting.defaultValue;
                  break;
              case 'checkbox':
                  value = control.checked;
                  break;
              default:
                  value = setting.defaultValue;
          }
          (settings as any)[setting.key] = value;
      }
  });

  // System prompt (handled generically)
  const sysPrompt = document.querySelector(`#setting-${SYSTEM_PROMPT_SETTING.key}`) as HTMLTextAreaElement;
  if (sysPrompt) {
    settings.system_prompt = sysPrompt.value;
  }
  if (LOG_DEBUG) console.log(prefix, 'getCurrentSettings() returning:', settings);
  return settings;
}

export function applySettings(settings: Partial<InferenceSettings>): void {
  if (LOG_DEBUG) console.log(prefix, 'Applying settings to UI:', settings);
  Object.entries(settings).forEach(([key, value]) => {
      const control = document.querySelector(`#setting-${key}`) as HTMLInputElement;
      const valueSpan = document.querySelector(`#setting-${key}-value`) as HTMLElement;
      
      if (control) {
          if (control.type === 'checkbox') {
              control.checked = Boolean(value);
          } else {
              control.value = String(value);
              if (valueSpan) {
                  valueSpan.textContent = String(value);
              }
          }
      }
  });

  // System prompt (textarea)
  const sysPrompt = document.querySelector(`#setting-${SYSTEM_PROMPT_SETTING.key}`) as HTMLTextAreaElement;
  if (sysPrompt && typeof settings.system_prompt === 'string') {
    sysPrompt.value = settings.system_prompt;
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 200;

export async function loadAndApplySettingsToUI() {
  try {
    if (LOG_GENERAL) console.log(prefix, 'Loading inference settings from DB...');
    const settings = await getInferenceSettings() || DEFAULT_INFERENCE_SETTINGS;
    if (!settings || Object.keys(settings).length === 0) {
      if (LOG_WARN) console.warn(prefix, 'No inference settings found in DB, applying defaults.');
      applySettings(DEFAULT_INFERENCE_SETTINGS);
      await saveInferenceSettings(DEFAULT_INFERENCE_SETTINGS);
      if (LOG_GENERAL) console.log(prefix, 'Default inference settings saved to DB.');
    } else {
      if (LOG_GENERAL) console.log(prefix, 'Loaded inference settings from DB:', settings);
      applySettings(settings);
    }
  } catch (e) {
    if (LOG_ERROR) console.error(prefix, 'Failed to load settings from DB:', e);
    applySettings(DEFAULT_INFERENCE_SETTINGS);
  }
}

export function saveCurrentSettingsToDBDebounced() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const settings = getCurrentSettings();
      if (LOG_GENERAL) console.log(prefix, 'Saving inference settings to DB:', settings);
      await saveInferenceSettings(settings);
      llmChannel.postMessage({ type: WorkerEventNames.INFERENCE_SETTINGS_UPDATE });
      if (LOG_GENERAL) console.log(prefix, 'Inference settings saved and update event posted.');
    } catch (e) {
      if (LOG_ERROR) console.error(prefix, 'Failed to save settings to DB:', e);
    }
  }, SAVE_DEBOUNCE_MS);
}

function attachSettingsListeners() {
  document.querySelectorAll('.setting-row input').forEach(input => {
    input.addEventListener('change', saveCurrentSettingsToDBDebounced);
    input.addEventListener('input', saveCurrentSettingsToDBDebounced); // for sliders
  });
  // System prompt textarea
  const sysPrompt = document.querySelector(`#setting-${SYSTEM_PROMPT_SETTING.key}`) as HTMLTextAreaElement;
  if (sysPrompt) {
    sysPrompt.addEventListener('change', saveCurrentSettingsToDBDebounced);
    sysPrompt.addEventListener('input', saveCurrentSettingsToDBDebounced);
  }
}

export async function reloadSettingsFromDB() {
  if (LOG_GENERAL) console.log(prefix, 'Reloading inference settings from DB...');
  await loadAndApplySettingsToUI();
}

export async function initInferenceSettingsUI() {
  if (LOG_GENERAL) console.log(prefix, 'Initializing inference settings UI...');
  await loadAndApplySettingsToUI();
  attachSettingsListeners();

  // Attach expand button handler for system prompt
  const expandBtn = document.getElementById('setting-system_prompt-expand');
  const textarea = document.getElementById('setting-system_prompt') as HTMLTextAreaElement;
  if (expandBtn && textarea) {
    expandBtn.onclick = async () => {
      const currentPrompt = textarea.value;
      showSystemPromptPopup(currentPrompt, async (newPrompt) => {
        // Save to DB and fire event
        const settings = await getInferenceSettings() || DEFAULT_INFERENCE_SETTINGS;
        const updatedSettings = { ...settings, system_prompt: newPrompt };
        await saveInferenceSettings(updatedSettings);
        llmChannel.postMessage({ type: WorkerEventNames.INFERENCE_SETTINGS_UPDATE });
        // Update textarea immediately
        textarea.value = newPrompt;
      });
    };
  }
}

export async function resetSettingsToDefault() {
  try {
    if (LOG_GENERAL) console.log(prefix, 'Resetting inference settings to default...');
    await saveInferenceSettings(DEFAULT_INFERENCE_SETTINGS);
    await reloadSettingsFromDB();
    llmChannel.postMessage({ type: WorkerEventNames.INFERENCE_SETTINGS_UPDATE });
    if (LOG_GENERAL) console.log(prefix, 'Inference settings reset to default and UI reloaded.');
  } catch (e) {
    if (LOG_ERROR) console.error(prefix, 'Failed to reset settings to default:', e);
  }
}

