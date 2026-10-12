import deeplLanguages from "../../providers/deepl.json";
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

  it("swaps explicit and auto-detected DeepL languages to valid codes for each side", () => {
    const cases = [
      { from: "auto", to: "en-us", detected: "ru", expected: { langFrom: "en", langTo: "ru" } },
      { from: "ru", to: "en-us", expected: { langFrom: "en", langTo: "ru" } },
      { from: "en", to: "ru", expected: { langFrom: "ru", langTo: "en" } },
      { from: "auto", to: "fr-ca", detected: "ru", expected: { langFrom: "fr", langTo: "ru" } },
    ];

    for (const { from, to, detected, expected } of cases) {
      const swapped = getSwappedLanguages(from, to, detected, deeplLanguages.from, deeplLanguages.to);
      expect(swapped).toEqual(expected);
      expect(Object.keys(deeplLanguages.from)).toContain(swapped!.langFrom);
      expect(Object.keys(deeplLanguages.to)).toContain(swapped!.langTo);
    }
  });

  it("disables auto-detect swaps without a detected source or a supported equivalent", () => {
    expect(getSwappedLanguages("auto", "en-us", undefined, deeplLanguages.from, deeplLanguages.to)).toBeUndefined();
    expect(getSwappedLanguages("auto", "unknown", "ru", deeplLanguages.from, deeplLanguages.to)).toBeUndefined();
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
