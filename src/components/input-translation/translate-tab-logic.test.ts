import { ProviderCodeName } from "../../providers/providers";
import {
  canSummarizeWithProvider,
  getDetectedSourceLanguage,
  getSwappedLanguages,
  isTranslationForParams,
} from "./translate-tab-logic";

const params = { provider: ProviderCodeName.DEEPL, from: "auto", to: "en", text: "релиз" };
const translation = {
  vendor: ProviderCodeName.DEEPL,
  langFrom: "auto",
  langTo: "en",
  originalText: "релиз",
  translation: "release",
  langDetected: "ru",
};

describe("translate tab state helpers", () => {
  it("accepts only a translation belonging to the current provider, language pair, and input", () => {
    expect(isTranslationForParams(params, translation)).toBe(true);
    expect(isTranslationForParams({ ...params, text: "other" }, translation)).toBe(false);
    expect(isTranslationForParams({ ...params, to: "de" }, translation)).toBe(false);
  });

  it("uses a detected language only for the current auto-detect translation", () => {
    expect(getDetectedSourceLanguage(params, translation)).toBe("ru");
    expect(getDetectedSourceLanguage({ ...params, text: "other" }, translation)).toBeUndefined();
    expect(getDetectedSourceLanguage({ ...params, from: "pl" }, translation)).toBeUndefined();
  });

  it("swaps explicit pairs and uses a current detected source for auto-detect", () => {
    expect(getSwappedLanguages("pl", "en")).toEqual({ langFrom: "en", langTo: "pl" });
    expect(getSwappedLanguages("auto", "en", "ru")).toEqual({ langFrom: "en", langTo: "ru" });
    expect(getSwappedLanguages("auto", "en")).toBeUndefined();
    expect(getSwappedLanguages("auto", "ru", "ru")).toBeUndefined();
  });

  it("allows summarize only with XTranslate PRO", () => {
    expect(canSummarizeWithProvider(ProviderCodeName.XTRANSLATE_PRO)).toBe(true);
    for (const provider of [
      ProviderCodeName.GOOGLE,
      ProviderCodeName.BING,
      ProviderCodeName.DEEPL,
      ProviderCodeName.OPENAI,
      ProviderCodeName.GEMINI,
      ProviderCodeName.GROK,
      ProviderCodeName.DEEPSEEK,
    ]) {
      expect(canSummarizeWithProvider(provider)).toBe(false);
    }
  });
});
