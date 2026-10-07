import { createStorage } from "../storage";
import { settingsStore } from "../components/settings/settings.storage";
import { ITranslationResult, TranslateParams, Translator } from "./translator";
import { GeminiAIModel, ProviderCodeName } from "./providers";
import { translateWithAI } from "./ai";
import OpenAILanguages from "./open-ai.json";

export const geminiApiKey = createStorage<string>("gemini_api_key", { area: "local" });

export class Gemini extends Translator {
  override name = ProviderCodeName.GEMINI;
  override title = "Gemini";
  override publicUrl = "https://aistudio.google.com/apikey";
  override apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai";

  constructor() {
    super({ languages: OpenAILanguages });
  }

  override isAvailable(): boolean {
    return !!geminiApiKey.get();
  }

  async translate({ from, to, text }: TranslateParams): Promise<ITranslationResult> {
    await geminiApiKey.load();
    return translateWithAI({
      provider: this.name,
      apiBaseUrl: this.apiUrl,
      apiKey: geminiApiKey.get(),
      model: settingsStore.data.geminiModel,
      sourceLanguage: from === "auto" ? undefined : this.langFrom[from] ?? from,
      targetLanguage: this.langTo[to] ?? to,
      text: text ?? "",
    });
  }
}

Translator.register(ProviderCodeName.GEMINI, Gemini);
