jest.mock("../storage", () => ({
  createStorage: jest.fn(() => ({
    get: jest.fn(() => ""),
    load: jest.fn(() => Promise.resolve()),
    set: jest.fn(),
  })),
}));
jest.mock("../background/httpProxy.bgc", () => ({ proxyRequest: jest.fn() }));
jest.mock("../i18n", () => ({ getMessage: (key: string) => key }));
jest.mock("../components/settings/settings.storage", () => ({
  settingsStore: {
    data: {
      openAiModel: "gpt-6-luna",
      geminiModel: "gemini-3.5-flash-lite",
      grokAiModel: "grok-4.20-non-reasoning",
      deepSeekModel: "deepseek-flash",
    },
  },
  settingsStorage: {
    defaultValue: {
      openAiModel: "gpt-6-luna",
      geminiModel: "gemini-3.5-flash-lite",
      grokAiModel: "grok-4.20-non-reasoning",
      deepSeekModel: "deepseek-flash",
    },
  },
}));
jest.mock("./translator", () => ({
  Translator: class {
    static register = jest.fn();
    langFrom: Record<string, string>;
    langTo: Record<string, string>;

    constructor({ languages }: any) {
      this.langFrom = languages.from;
      this.langTo = languages.to;
    }

    translateMany() {
      return Promise.resolve([]);
    }
  },
}));

import { createStorage } from "../storage";
import { Translator } from "./translator";
import { ProviderCodeName, OpenAIModel, GeminiAIModel, GrokAIModel, DeepSeekAIModel, DEFAULT_AI_MODEL_SETTINGS } from "./providers";
import { OpenAI, openAiApiKey } from "./open-ai";
import { Gemini, geminiApiKey } from "./gemini";
import { Grok, grokApiKey } from "./grok";
import { DeepSeek, deepSeekApiKey } from "./deepseek";

const providerCases = [
  [ProviderCodeName.OPENAI, OpenAI, openAiApiKey, "https://api.openai.com/v1", "openai_api_key"],
  [ProviderCodeName.GEMINI, Gemini, geminiApiKey, "https://generativelanguage.googleapis.com/v1beta/openai", "gemini_api_key"],
  [ProviderCodeName.GROK, Grok, grokApiKey, "https://api.x.ai/v1", "grok_x_api_key"],
  [ProviderCodeName.DEEPSEEK, DeepSeek, deepSeekApiKey, "https://api.deepseek.com", "deepseek_api_key"],
] as const;

describe("AI provider adapters", () => {
  it.each(providerCases)("registers %s with the configured API base URL", (name, ProviderClass, _storage, apiUrl) => {
    const provider = new ProviderClass();

    expect(Translator.register).toHaveBeenCalledWith(name, ProviderClass);
    expect(provider.apiUrl).toBe(apiUrl);
    expect(provider.translateMany).toBe(Translator.prototype.translateMany);
  });

  it.each(providerCases)("stores %s API keys locally", (_name, _ProviderClass, _storage, _apiUrl, storageKey) => {
    expect(createStorage).toHaveBeenCalledWith(storageKey, { area: "local" });
  });

  it("defaults each provider to its cost-effective model", () => {
    expect(DEFAULT_AI_MODEL_SETTINGS).toEqual({
      openAiModel: OpenAIModel.COST_EFFECTIVE,
      geminiModel: GeminiAIModel.COST_EFFECTIVE,
      grokAiModel: GrokAIModel.COST_EFFECTIVE,
      deepSeekModel: DeepSeekAIModel.COST_EFFECTIVE,
    });
  });
});
