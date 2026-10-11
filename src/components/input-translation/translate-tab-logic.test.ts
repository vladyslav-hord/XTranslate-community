import { ProviderCodeName } from "../../providers/providers";
import {
  canSummarizeWithProvider,
  getDetectedSourceLanguage,
  getSwappedLanguages,
  getTranslateTabSelection,
  isTranslationForParams,
  saveTranslateTabPair,
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
  it("rejects stale results after any provider, language, or input change", () => {
    expect(isTranslationForParams(params, translation)).toBe(true);
    expect(isTranslationForParams({ ...params, provider: ProviderCodeName.GOOGLE }, translation)).toBe(false);
    expect(isTranslationForParams({ ...params, from: "ru" }, translation)).toBe(false);
    expect(isTranslationForParams({ ...params, to: "de" }, translation)).toBe(false);
    expect(isTranslationForParams({ ...params, text: "other" }, translation)).toBe(false);
  });

  it("uses a detected language only for the current auto-detect translation", () => {
    expect(getDetectedSourceLanguage(params, translation)).toBe("ru");
    expect(getDetectedSourceLanguage({ ...params, text: "other" }, translation)).toBeUndefined();
    expect(getDetectedSourceLanguage({ ...params, from: "pl" }, translation)).toBeUndefined();
  });

  it("keeps Translate-tab provider and language preferences independent per provider", () => {
    const settings = { provider: ProviderCodeName.GOOGLE, from: "auto", to: "en" };
    const deepl = saveTranslateTabPair({}, ProviderCodeName.DEEPL, "ru", "en-us");
    const google = saveTranslateTabPair(deepl, ProviderCodeName.GOOGLE, "auto", "fr");
    const resolvePair = (_provider: ProviderCodeName, from: string, to: string) => ({ from, to });

    expect(getTranslateTabSelection(settings, deepl, {}, resolvePair)).toEqual({
      provider: ProviderCodeName.DEEPL, from: "ru", to: "en-us",
    });
    expect(getTranslateTabSelection(settings, google, {}, resolvePair)).toEqual({
      provider: ProviderCodeName.GOOGLE, from: "auto", to: "fr",
    });
    expect(settings).toEqual({ provider: ProviderCodeName.GOOGLE, from: "auto", to: "en" });
  });

  it("lets URL language parameters override saved Translate-tab preferences", () => {
    const saved = saveTranslateTabPair({}, ProviderCodeName.DEEPL, "ru", "en-us");
    const selection = getTranslateTabSelection(
      { provider: ProviderCodeName.GOOGLE, from: "auto", to: "en" },
      saved,
      { from: "fr", to: "en-gb" },
      (_provider, from, to) => ({ from, to }),
    );
    expect(selection).toEqual({ provider: ProviderCodeName.DEEPL, from: "fr", to: "en-gb" });
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
