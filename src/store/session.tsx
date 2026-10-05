import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { resolveStrategy, scoreResponse } from '../scoring';
import type { ItemCode, Score, StrategyCode, TouchEvent } from '../scoring';

/**
 * 메모리 저장소. 필드는 7절 데이터 모델(item_response, touch_event)에 맞춘다.
 * 다음 단계에서 같은 모양으로 SQLite에 저장한다.
 */
export interface ItemResponse {
  id: string;
  sessionId: string;
  itemCode: ItemCode;
  answer: number;
  correct: boolean;
  /** 규칙으로 판별한 전략 */
  autoStrategyCode: StrategyCode;
  /** 어른이 고친 전략 (없으면 null) */
  strategyOverride: StrategyCode | null;
  /** 실제로 적용되는 전략 = override ?? auto */
  strategyCode: StrategyCode;
  score: Score;
  helped: boolean;
  responseMs: number;
  note: string;
  /** 문항 화면 기준, 발문이 끝난 시각 */
  promptEndMs: number;
  touches: TouchEvent[];
}

export type NewItemResponse = Pick<
  ItemResponse,
  'itemCode' | 'answer' | 'correct' | 'autoStrategyCode' | 'responseMs' | 'promptEndMs' | 'touches'
>;

interface SessionStore {
  sessionId: string;
  responses: Partial<Record<ItemCode, ItemResponse>>;
  /** 문항을 다시 할 때마다 올라간다. 아이 화면이 이 값을 key로 써서 상태를 초기화한다. */
  attempts: Partial<Record<ItemCode, number>>;
  saveResponse(input: NewItemResponse): void;
  setHelped(itemCode: ItemCode, helped: boolean): void;
  setStrategyOverride(itemCode: ItemCode, strategy: StrategyCode | null): void;
  resetItem(itemCode: ItemCode): void;
}

const SessionContext = createContext<SessionStore | null>(null);

/** 전략·점수 파생 필드를 다시 계산한다. */
function withScore(r: Omit<ItemResponse, 'strategyCode' | 'score'>): ItemResponse {
  const strategyCode = resolveStrategy(r.autoStrategyCode, r.strategyOverride);
  return {
    ...r,
    strategyCode,
    score: scoreResponse({ itemCode: r.itemCode, correct: r.correct, strategy: strategyCode, helped: r.helped }),
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [responses, setResponses] = useState<SessionStore['responses']>({});
  const [attempts, setAttempts] = useState<SessionStore['attempts']>({});

  const saveResponse = useCallback(
    (input: NewItemResponse) => {
      setResponses((prev) => ({
        ...prev,
        [input.itemCode]: withScore({
          ...input,
          id: `${sessionId}-${input.itemCode}-${Date.now()}`,
          sessionId,
          strategyOverride: null,
          helped: false,
          note: '',
        }),
      }));
    },
    [sessionId],
  );

  const update = useCallback((itemCode: ItemCode, patch: Partial<ItemResponse>) => {
    setResponses((prev) => {
      const current = prev[itemCode];
      if (!current) return prev;
      return { ...prev, [itemCode]: withScore({ ...current, ...patch }) };
    });
  }, []);

  const setHelped = useCallback(
    (itemCode: ItemCode, helped: boolean) => update(itemCode, { helped }),
    [update],
  );

  const setStrategyOverride = useCallback(
    (itemCode: ItemCode, strategyOverride: StrategyCode | null) => update(itemCode, { strategyOverride }),
    [update],
  );

  const resetItem = useCallback((itemCode: ItemCode) => {
    setResponses((prev) => {
      const next = { ...prev };
      delete next[itemCode];
      return next;
    });
    setAttempts((prev) => ({ ...prev, [itemCode]: (prev[itemCode] ?? 0) + 1 }));
  }, []);

  const value = useMemo(
    () => ({ sessionId, responses, attempts, saveResponse, setHelped, setStrategyOverride, resetItem }),
    [sessionId, responses, attempts, saveResponse, setHelped, setStrategyOverride, resetItem],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있다');
  return store;
}
