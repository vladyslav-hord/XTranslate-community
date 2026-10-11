import { selectTTSVoice } from "./tts-voice";

const voices = [
  { name: "French", lang: "fr-FR" },
  { name: "Russian", lang: "ru-RU" },
  { name: "English", lang: "en-US" },
];

describe("system TTS voice selection", () => {
  it("keeps the configured voice when its language matches the request", () => {
    const voicesWithRegionalVariants = [
      { name: "French", lang: "fr-FR" },
      { name: "Russian UK", lang: "ru-GB" },
      { name: "Russian RU", lang: "ru-RU" },
    ];

    expect(selectTTSVoice(voicesWithRegionalVariants, "ru-RU", 1)).toBe(voicesWithRegionalVariants[1]);
    expect(selectTTSVoice(voices, "ru", 1)).toBe(voices[1]);
  });

  it("selects a requested-language voice when the configured voice is incompatible", () => {
    expect(selectTTSVoice(voices, "ru", 0)).toBe(voices[1]);
    expect(selectTTSVoice(voices, "EN-us", 0)).toBe(voices[2]);
  });

  it("falls back to the configured voice when no language match exists", () => {
    expect(selectTTSVoice(voices, "pl", 1)).toBe(voices[1]);
    expect(selectTTSVoice(voices, undefined, 2)).toBe(voices[2]);
  });
});
