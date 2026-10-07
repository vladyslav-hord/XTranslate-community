import { createStorage } from "../storage";
import { settingsStore } from "../components/settings/settings.storage";
import { ITranslationResult, TranslateParams, Translator } from "./translator";
import { GrokAIModel, ProviderCodeName } from "./providers";
import { translateWithAI } from "./ai";
import OpenAILanguages from "./open-ai.json";

export const grokApiKey = createStorage<string>("grok_x_api_key", { area: "local" });

export class Grok extends Translator {
  override name = ProviderCodeName.GROK;
  override title = "Grok";
  override publicUrl = "https://console.x.ai";
  override apiUrl = "https://api.x.ai/v1";

  constructor() {
    super({ languages: OpenAILanguages });
  }

  override isAvailable(): boolean {
    return !!grokApiKey.get();
  }

  async translate({ from, to, text }: TranslateParams): Promise<ITranslationResult> {
    await grokApiKey.load();
    return translateWithAI({
      provider: this.name,
      apiBaseUrl: this.apiUrl,
      apiKey: grokApiKey.get(),
      model: settingsStore.data.grokAiModel,
      sourceLanguage: from === "auto" ? undefined : this.langFrom[from] ?? from,
      targetLanguage: this.langTo[to] ?? to,
      text: text ?? "",
    });
  }
}

Translator.register(ProviderCodeName.GROK, Grok);
