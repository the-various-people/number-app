import * as Speech from 'expo-speech';

import type { PromptPlayer } from './player';
import { PROMPTS } from './prompts';

/** 한국어 음성이 없거나 콜백이 오지 않는 기기에서도 문항이 멈추지 않게 하는 상한 */
const fallbackMs = (text: string) => 2000 + text.length * 250;

/** 임시 구현: expo-speech(TTS)로 발문을 읽는다. */
export const speechPlayer: PromptPlayer = {
  play(id) {
    const { text } = PROMPTS[id];
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, fallbackMs(text));
      Speech.speak(text, {
        language: 'ko-KR',
        rate: 0.9,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    });
  },
  stop() {
    Speech.stop();
  },
  unlock() {
    // iPad Safari는 첫 발화가 누르기 처리 안에서 일어나야 이후 발화를 허용한다.
    Speech.speak(' ', { volume: 0 });
  },
};
