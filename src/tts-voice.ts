export type TTSVoice = Pick<SpeechSynthesisVoice, "lang">;

export function selectTTSVoice<T extends TTSVoice>(
  voices: readonly T[],
  lang?: string,
  voiceIndex = 0,
): T | undefined {
  if (lang) {
    const normalized = lang.toLowerCase();
    const exact = voices.find(voice => voice.lang.toLowerCase() === normalized);
    if (exact) return exact;

    const baseLanguage = normalized.split("-")[0];
    const languageMatch = voices.find(voice => voice.lang.toLowerCase().split("-")[0] === baseLanguage);
    if (languageMatch) return languageMatch;
  }

  return voices[voiceIndex];
}
