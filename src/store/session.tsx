import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { repository } from '../db/repository';
import type { ItemResponse, Session } from '../db/types';
import { ITEM_CODES } from '../items/registry';
import { itemStatuses, nextItem, resolveStrategy, scoreResponse } from '../scoring';
import type { ItemCode, ItemStatus, Score, StrategyCode } from '../scoring';

export type { ItemResponse, Session } from '../db/types';

export type NewItemResponse = Pick<
  ItemResponse,
  'itemCode' | 'answer' | 'correct' | 'autoStrategyCode' | 'responseMs' | 'promptEndMs' | 'touches'
>;

type Responses = Partial<Record<ItemCode, ItemResponse>>;

interface SessionStore {
  /** 저장소에서 지난 회기를 다 불러왔는지 */
  loaded: boolean;
  session: Session | null;
  responses: Responses;
  statuses: Partial<Record<ItemCode, ItemStatus>>;
  /** 다음에 낼 문항. 모두 끝났으면 null */
  next: ItemCode | null;
  /** 문항을 다시 할 때마다 올라간다. 아이 화면이 이 값을 key로 써서 상태를 초기화한다. */
  attempts: Partial<Record<ItemCode, number>>;
  startSession(): void;
  /** 저장한 결과를 돌려준다 (다음 문항 계산용) */
  saveResponse(input: NewItemResponse): ItemResponse;
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

export function scoresOf(responses: Responses): Partial<Record<ItemCode, Score>> {
  const scores: Partial<Record<ItemCode, Score>> = {};
  for (const [code, r] of Object.entries(responses)) scores[code as ItemCode] = r.score;
  return scores;
}

const newSession = (): Session => ({
  id: `session-${Date.now()}`,
  childId: null,
  type: 'pre',
  startedAt: Date.now(),
  adultRole: null,
});

const persist = (task: Promise<void>) =>
  task.catch((e) => console.warn('기록을 저장하지 못했어요', e));

/**
 * 진단 회기 상태. 화면은 바로 바뀌고, 저장은 뒤에서 저장소(SQLite 또는 브라우저 저장소)에 한다.
 * 앱을 다시 열면 가장 최근 회기를 불러온다.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Responses>({});
  const [attempts, setAttempts] = useState<SessionStore['attempts']>({});
  // 저장 함수가 최신 값을 바로 읽을 수 있게 같은 값을 ref에도 둔다.
  const sessionRef = useRef<Session | null>(null);
  const responsesRef = useRef<Responses>({});

  const commitResponses = useCallback((next: Responses) => {
    responsesRef.current = next;
    setResponses(next);
  }, []);

  const commitSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const latest = await repository.latestSession();
        if (!active || !latest) return;
        const saved = await repository.listResponses(latest.id);
        if (!active || sessionRef.current) return; // 불러오는 사이에 새 회기가 시작됐으면 그대로 둔다
        commitSession(latest);
        commitResponses(Object.fromEntries(saved.map((r) => [r.itemCode, r])));
      } catch (e) {
        console.warn('지난 기록을 불러오지 못했어요', e);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [commitResponses, commitSession]);

  const startSession = useCallback(() => {
    const s = newSession();
    commitSession(s);
    commitResponses({});
    persist(repository.createSession(s));
  }, [commitResponses, commitSession]);

  /** 회기 없이 문항 화면으로 바로 들어온 경우(새로고침 등)를 위해 필요할 때 회기를 만든다. */
  const ensureSession = useCallback((): Session => {
    if (sessionRef.current) return sessionRef.current;
    const s = newSession();
    commitSession(s);
    persist(repository.createSession(s));
    return s;
  }, [commitSession]);

  const saveResponse = useCallback(
    (input: NewItemResponse) => {
      const s = ensureSession();
      const response = withScore({
        ...input,
        id: `${s.id}-${input.itemCode}-${Date.now()}`,
        sessionId: s.id,
        strategyOverride: null,
        helped: false,
        note: '',
      });
      commitResponses({ ...responsesRef.current, [input.itemCode]: response });
      persist(repository.saveResponse(response));
      return response;
    },
    [commitResponses, ensureSession],
  );

  const update = useCallback(
    (itemCode: ItemCode, patch: Partial<ItemResponse>) => {
      const current = responsesRef.current[itemCode];
      if (!current) return;
      const updated = withScore({ ...current, ...patch });
      commitResponses({ ...responsesRef.current, [itemCode]: updated });
      persist(repository.saveResponse(updated));
    },
    [commitResponses],
  );

  const setHelped = useCallback(
    (itemCode: ItemCode, helped: boolean) => update(itemCode, { helped }),
    [update],
  );

  const setStrategyOverride = useCallback(
    (itemCode: ItemCode, strategyOverride: StrategyCode | null) => update(itemCode, { strategyOverride }),
    [update],
  );

  const resetItem = useCallback(
    (itemCode: ItemCode) => {
      const current = responsesRef.current[itemCode];
      if (current) {
        const next = { ...responsesRef.current };
        delete next[itemCode];
        commitResponses(next);
        persist(repository.deleteResponse(current.id));
      }
      setAttempts((prev) => ({ ...prev, [itemCode]: (prev[itemCode] ?? 0) + 1 }));
    },
    [commitResponses],
  );

  const value = useMemo(() => {
    const scores = scoresOf(responses);
    return {
      loaded,
      session,
      responses,
      statuses: itemStatuses(ITEM_CODES, scores),
      next: nextItem(ITEM_CODES, scores),
      attempts,
      startSession,
      saveResponse,
      setHelped,
      setStrategyOverride,
      resetItem,
    };
  }, [loaded, session, responses, attempts, startSession, saveResponse, setHelped, setStrategyOverride, resetItem]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있다');
  return store;
}
