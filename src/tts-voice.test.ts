import { selectTTSVoice } from "./tts-voice";

const voices = [
  { name: "French", lang: "fr-FR" },
  { name: "Russian", lang: "ru-RU" },
  { name: "English", lang: "en-US" },
];

describe("system TTS voice selection", () => {
  it("prefers a voice matching the requested language over the configured index", () => {
    expect(selectTTSVoice(voices, "ru", 0)).toBe(voices[1]);
    expect(selectTTSVoice(voices, "EN-us", 0)).toBe(voices[2]);
  });

  it("falls back to the configured voice when no language match exists", () => {
    expect(selectTTSVoice(voices, "pl", 1)).toBe(voices[1]);
    expect(selectTTSVoice(voices, undefined, 2)).toBe(voices[2]);
  });
});
