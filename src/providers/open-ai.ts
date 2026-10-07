import { createStorage } from "../storage";
import { settingsStore } from "../components/settings/settings.storage";
import { ITranslationResult, TranslateParams, Translator } from "./translator";
import { OpenAIModel, ProviderCodeName } from "./providers";
import { translateWithAI } from "./ai";
import OpenAILanguages from "./open-ai.json";

export const openAiApiKey = createStorage<string>("openai_api_key", { area: "local" });

export class OpenAI extends Translator {
  override name = ProviderCodeName.OPENAI;
  override title = "OpenAI";
  override publicUrl = "https://platform.openai.com";
  override apiUrl = "https://api.openai.com/v1";

  constructor() {
    super({ languages: OpenAILanguages });
  }

  override isAvailable(): boolean {
    return !!openAiApiKey.get();
  }

  async translate({ from, to, text }: TranslateParams): Promise<ITranslationResult> {
    await openAiApiKey.load();
    return translateWithAI({
      provider: this.name,
      apiBaseUrl: this.apiUrl,
      apiKey: openAiApiKey.get(),
      model: settingsStore.data.openAiModel,
      sourceLanguage: from === "auto" ? undefined : this.langFrom[from] ?? from,
      targetLanguage: this.langTo[to] ?? to,
      text: text ?? "",
    });
  }
}

Translator.register(ProviderCodeName.OPENAI, OpenAI);
