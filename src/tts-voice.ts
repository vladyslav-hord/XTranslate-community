export type TTSVoice = Pick<SpeechSynthesisVoice, "lang">;

export function selectTTSVoice<T extends TTSVoice>(
  voices: readonly T[],
  lang?: string,
  voiceIndex = 0,
): T | undefined {
  const configuredVoice = voices[voiceIndex];
  if (lang) {
    const normalized = lang.toLowerCase();
    const baseLanguage = normalized.split("-")[0];
    const configuredLanguage = configuredVoice?.lang.toLowerCase();
    if (configuredLanguage && configuredLanguage.split("-")[0] === baseLanguage) {
      return configuredVoice;
    }

    const exact = voices.find(voice => voice.lang.toLowerCase() === normalized);
    if (exact) return exact;

    const languageMatch = voices.find(voice => voice.lang.toLowerCase().split("-")[0] === baseLanguage);
    if (languageMatch) return languageMatch;
  }

  return configuredVoice;
}
