import { ProviderCodeName } from "../../providers/providers";
import type { ITranslationResult } from "../../providers/translator";
import type { TranslationPageParams } from "../../navigation";

export type TranslateTabParams = Pick<TranslationPageParams, "provider" | "from" | "to" | "text">;

export function isTranslationForParams(
  params?: TranslateTabParams,
  translation?: ITranslationResult,
): translation is ITranslationResult {
  return !!params && !!translation &&
    translation.vendor === params.provider &&
    translation.langFrom === params.from &&
    translation.langTo === params.to &&
    translation.originalText === params.text.trim();
}

export function getDetectedSourceLanguage(
  params?: TranslateTabParams,
  translation?: ITranslationResult,
): string | undefined {
  if (params?.from !== "auto" || !isTranslationForParams(params, translation)) return;
  const detected = translation.langDetected;
  return detected && detected !== "auto" ? detected : undefined;
}

export function getSwappedLanguages(
  from: string,
  to: string,
  detectedSourceLang?: string,
): { langFrom: string; langTo: string } | undefined {
  if (from === "auto") {
    if (!detectedSourceLang || detectedSourceLang === to) return;
    return { langFrom: to, langTo: detectedSourceLang };
  }
  return { langFrom: to, langTo: from };
}

export function canSummarizeWithProvider(provider: ProviderCodeName): boolean {
  return provider === ProviderCodeName.XTRANSLATE_PRO;
}
