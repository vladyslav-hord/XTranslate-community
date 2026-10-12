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

type LanguageMap = Readonly<Record<string, string>>;

function resolveLanguage(language: string, supportedLanguages: LanguageMap): string | undefined {
  if (Object.prototype.hasOwnProperty.call(supportedLanguages, language)) {
    return language;
  }

  const normalized = language.toLowerCase();
  const supportedCodes = Object.keys(supportedLanguages);
  const normalizedMatch = supportedCodes.find(code => code.toLowerCase() === normalized);
  if (normalizedMatch) return normalizedMatch;

  const baseLanguage = normalized.split(/[-_]/)[0];
  return supportedCodes.find(code => code.toLowerCase() === baseLanguage);
}

export function getSwappedLanguages(
  from: string,
  to: string,
  detectedSourceLang: string | undefined,
  supportedSourceLanguages: LanguageMap,
  supportedTargetLanguages: LanguageMap,
): { langFrom: string; langTo: string } | undefined {
  const sourceCandidate = from === "auto" ? detectedSourceLang : from;
  if (!sourceCandidate) return;

  const langFrom = resolveLanguage(to, supportedSourceLanguages);
  const langTo = resolveLanguage(sourceCandidate, supportedTargetLanguages);
  if (!langFrom || !langTo || langFrom === langTo) return;

  return { langFrom, langTo };
}

export function canSummarizeWithProvider(provider: ProviderCodeName): boolean {
  return provider === ProviderCodeName.XTRANSLATE_PRO;
}
