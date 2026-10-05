import type { PromptId } from './prompts';
import { speechPlayer } from './speechPlayer';

export interface PromptPlayer {
  /** 발문을 재생하고, 끝나거나 멈추거나 실패하면 resolve한다. */
  play(id: PromptId): Promise<void>;
  stop(): void;
  /**
   * 브라우저는 사용자가 누르기 전에는 소리를 막는다.
   * 시작 버튼의 누르기 처리 안에서 한 번 불러 소리를 풀어 둔다. 앱에서는 아무 일도 하지 않아도 된다.
   */
  unlock(): void;
}

/** 녹음 파일로 바꿀 때 이 한 줄만 바꾼다. */
export const promptPlayer: PromptPlayer = speechPlayer;
