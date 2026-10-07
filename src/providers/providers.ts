// Translation providers

export enum ProviderCodeName {
  GOOGLE = "google",
  BING = "bing",
  DEEPL = "deepl",
  XTRANSLATE_PRO = "xtranslate_pro",
  OPENAI = "openai",
  GEMINI = "gemini",
  GROK = "grok",
  DEEPSEEK = "deepseek",
}

export type Provider = (typeof ProviderCodeName)[keyof typeof ProviderCodeName]; // google, bing, etc.

export enum OpenAIModel {
  COST_EFFECTIVE = "gpt-6-luna",
  RECOMMENDED = "gpt-6.1-sol",
}

export enum GeminiAIModel {
  COST_EFFECTIVE = "gemini-3.5-flash-lite",
  RECOMMENDED = "gemini-3.6-flash",
}

export enum GrokAIModel {
  COST_EFFECTIVE = "grok-4.20-non-reasoning",
  RECOMMENDED = "grok-4.7",
}

export enum DeepSeekAIModel {
  COST_EFFECTIVE = "deepseek-flash",
  RECOMMENDED = "deepseek-v4-pro",
}

export const DEFAULT_AI_MODEL_SETTINGS = {
  openAiModel: OpenAIModel.COST_EFFECTIVE,
  geminiModel: GeminiAIModel.COST_EFFECTIVE,
  grokAiModel: GrokAIModel.COST_EFFECTIVE,
  deepSeekModel: DeepSeekAIModel.COST_EFFECTIVE,
};

export enum XTranslateProTTSVoice {
  Alloy = "alloy",
  Echo = "echo",
  Fable = "fable",
  Onyx = "onyx",
  Nova = "nova",
  Shimmer = "shimmer",
}
