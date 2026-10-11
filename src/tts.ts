// Text-to-speech system APIs

import { settingsStore } from "@/components/settings/settings.storage";
import { selectTTSVoice } from "./tts-voice";

export interface SystemTTSVoice extends SpeechSynthesisVoice {
}

export interface SpeakSystemTTSParams {
  voiceIndex?: number;
  lang?: string;
  speed?: number; /* 0-1, default: 0.75*/
  onStart?(): void;
  onPause?(): void;
  onResume?(): void;
  onEnd?(): void;
}

export function ttsEngine() {
  return speechSynthesis;
}

export async function speakSystemTTS(text: string, params: SpeakSystemTTSParams = {}): Promise<SpeechSynthesisUtterance> {
  const {
    voiceIndex = settingsStore.data.systemTTSEngineVoiceIndex,
    lang,
    speed = 0.75,
    onStart, onPause, onResume, onEnd,
  } = params;

  const voices = await getTTSVoices();
  const voice = selectTTSVoice(voices, lang, voiceIndex);

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = lang || voice?.lang || utterance.lang;
  utterance.rate = speed;
  utterance.onstart = onStart;
  utterance.onpause = onPause;
  utterance.onresume = onResume;
  utterance.onend = onEnd;

  ttsEngine().cancel();
  ttsEngine().speak(utterance);

  return utterance;
}

export async function getTTSVoices(): Promise<SystemTTSVoice[]> {
  return new Promise((resolve) => {
    // for some reason `speechSynthesis.getVoices()` not available immediately
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        resolve(speechSynthesis.getVoices());
      };
    }
  });
}
