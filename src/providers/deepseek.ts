import { createStorage } from "../storage";
import { settingsStore } from "../components/settings/settings.storage";
import { ITranslationResult, TranslateParams, Translator } from "./translator";
import { DeepSeekAIModel, ProviderCodeName } from "./providers";
import { translateWithAI } from "./ai";
import OpenAILanguages from "./open-ai.json";

export const deepSeekApiKey = createStorage<string>("deepseek_api_key", { area: "local" });

export class DeepSeek extends Translator {
  override name = ProviderCodeName.DEEPSEEK;
  override title = "DeepSeek";
  override publicUrl = "https://platform.deepseek.com";
  override apiUrl = "https://api.deepseek.com";

  constructor() {
    super({ languages: OpenAILanguages });
  }

  override isAvailable(): boolean {
    return !!deepSeekApiKey.get();
  }

  async translate({ from, to, text }: TranslateParams): Promise<ITranslationResult> {
    await deepSeekApiKey.load();
    return translateWithAI({
      provider: this.name,
      apiBaseUrl: this.apiUrl,
      apiKey: deepSeekApiKey.get(),
      model: settingsStore.data.deepSeekModel,
      sourceLanguage: from === "auto" ? undefined : this.langFrom[from] ?? from,
      targetLanguage: this.langTo[to] ?? to,
      text: text ?? "",
    });
  }
}

Translator.register(ProviderCodeName.DEEPSEEK, DeepSeek);
