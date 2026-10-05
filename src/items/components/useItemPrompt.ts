import { useCallback, useEffect, useRef, useState } from 'react';

import { promptPlayer } from '../../audio/player';
import type { PromptId } from '../../audio/prompts';

/** 발문 전에 할 일 (예: C 영역의 "잘 봐!"와 점 보여 주기). alive()가 false면 화면이 닫힌 것이다. */
export type PromptIntro = (alive: () => boolean) => Promise<void>;

/**
 * 문항 화면의 시계와 발문.
 * 화면이 뜬 때를 0으로 재고, 발문(앞에 intro가 있으면 그 뒤의 발문)이 끝난 시각을 promptEndMs로 알려 준다.
 * promptEndMs가 null이면 아직 발문 중이다.
 */
export function useItemPrompt(promptId: PromptId, intro?: PromptIntro) {
  const startRef = useRef(Date.now());
  const introRef = useRef(intro);
  const [promptEndMs, setPromptEndMs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const alive = () => active;
    startRef.current = Date.now();
    (async () => {
      if (introRef.current) await introRef.current(alive);
      if (!active) return;
      await promptPlayer.play(promptId);
      if (!active) return;
      setPromptEndMs(Date.now() - startRef.current);
    })();
    return () => {
      active = false;
      promptPlayer.stop();
    };
  }, [promptId]);

  /** 화면이 뜬 뒤 지난 시간 */
  const elapsed = useCallback(() => Date.now() - startRef.current, []);

  return { elapsed, promptEndMs };
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
