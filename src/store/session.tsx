import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { repository } from '../db/repository';
import { DEFAULT_PREFERENCES, type Child, type ItemResponse, type Preferences, type Session } from '../db/types';
import { ITEM_CODES } from '../items/registry';
import { itemStatuses, nextItem, resolveStrategy, scoreResponse } from '../scoring';
import type { ItemCode, ItemStatus, Score, StrategyCode } from '../scoring';

export type { Child, ItemResponse, Session } from '../db/types';

export type NewItemResponse = Pick<
  ItemResponse,
  'itemCode' | 'answer' | 'correct' | 'autoStrategyCode' | 'responseMs' | 'promptEndMs' | 'touches'
>;

type Responses = Partial<Record<ItemCode, ItemResponse>>;

interface SessionStore {
  /** 저장소에서 지난 회기를 다 불러왔는지 */
  loaded: boolean;
  childList: Child[];
  /** 다음 진단을 할 아이와 함께하는 어른 (어른 화면에서 고름) */
  preferences: Preferences;
  /** 지금 보고 있는 회기. 처음에는 고른 아이의 가장 최근 회기 */
  session: Session | null;
  /** 고른 아이의 회기 목록, 최근 것부터 */
  pastSessions: Session[];
  responses: Responses;
  statuses: Partial<Record<ItemCode, ItemStatus>>;
  /** 다음에 낼 문항. 모두 끝났으면 null */
  next: ItemCode | null;
  /** 문항을 다시 할 때마다 올라간다. 아이 화면이 이 값을 key로 써서 상태를 초기화한다. */
  attempts: Partial<Record<ItemCode, number>>;
  /** 아이를 등록하고 그 아이를 고른다 */
  addChild(nickname: string, birthMonth: string): Child;
  /** 아이를 고른다 (null이면 아이 없이). 그 아이의 가장 최근 회기를 불러온다. */
  selectChild(childId: string | null): void;
  setAdultRole(role: Session['adultRole']): void;
  /** 지난 회기를 열어 본다 (그 회기의 결과를 보고 고칠 수 있다) */
  openSession(sessionId: string): void;
  /** 고른 아이와 어른 역할로 새 회기를 시작한다 */
  startSession(): void;
  /** 저장한 결과를 돌려준다 (다음 문항 계산용) */
  saveResponse(input: NewItemResponse): ItemResponse;
  setHelped(itemCode: ItemCode, helped: boolean): void;
  setStrategyOverride(itemCode: ItemCode, strategy: StrategyCode | null): void;
  setNote(itemCode: ItemCode, note: string): void;
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

const newSession = ({ currentChildId, adultRole }: Preferences): Session => ({
  id: `session-${Date.now()}`,
  childId: currentChildId,
  type: 'pre',
  startedAt: Date.now(),
  adultRole,
});

const persist = (task: Promise<void>) =>
  task.catch((e) => console.warn('기록을 저장하지 못했어요', e));

/**
 * 아이 목록과 진단 회기 상태. 화면은 바로 바뀌고, 저장은 뒤에서 저장소(SQLite 또는 브라우저 저장소)에 한다.
 * 앱을 다시 열면 마지막에 고른 아이의 가장 최근 회기를 불러온다.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [childList, setChildList] = useState<Child[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [session, setSession] = useState<Session | null>(null);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [responses, setResponses] = useState<Responses>({});
  const [attempts, setAttempts] = useState<SessionStore['attempts']>({});
  // 저장 함수가 최신 값을 바로 읽을 수 있게 같은 값을 ref에도 둔다.
  const sessionRef = useRef<Session | null>(null);
  const responsesRef = useRef<Responses>({});
  const preferencesRef = useRef<Preferences>(DEFAULT_PREFERENCES);
  /** 아이를 바꿀 때마다 올라간다. 늦게 도착한 이전 아이의 기록이 화면을 덮지 않게 한다. */
  const loadTicket = useRef(0);

  const commitResponses = useCallback((next: Responses) => {
    responsesRef.current = next;
    setResponses(next);
  }, []);

  const commitSession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const commitPreferences = useCallback((next: Preferences) => {
    preferencesRef.current = next;
    setPreferences(next);
    persist(repository.savePreferences(next));
  }, []);

  /** 그 아이의 가장 최근 회기와 결과를 불러와 화면에 놓는다. */
  const loadLatest = useCallback(
    async (childId: string | null) => {
      const ticket = ++loadTicket.current;
      const sessions = await repository.listSessions(childId);
      const latest = sessions[0] ?? null;
      const saved = latest ? await repository.listResponses(latest.id) : [];
      if (ticket !== loadTicket.current) return; // 그사이 다른 아이를 골랐거나 새 회기를 시작했다
      setPastSessions(sessions);
      commitSession(latest);
      commitResponses(Object.fromEntries(saved.map((r) => [r.itemCode, r])));
    },
    [commitResponses, commitSession],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedChildren, savedPreferences] = await Promise.all([
          repository.listChildren(),
          repository.loadPreferences(),
        ]);
        if (!active) return;
        setChildList(savedChildren);
        preferencesRef.current = savedPreferences;
        setPreferences(savedPreferences);
        await loadLatest(savedPreferences.currentChildId);
      } catch (e) {
        console.warn('지난 기록을 불러오지 못했어요', e);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadLatest]);

  const addChild = useCallback(
    (nickname: string, birthMonth: string) => {
      const child: Child = { id: `child-${Date.now()}`, nickname, birthMonth, createdAt: Date.now() };
      setChildList((prev) => [...prev, child]);
      persist(repository.saveChild(child));
      // 새 아이는 아직 기록이 없다
      loadTicket.current++;
      commitSession(null);
      setPastSessions([]);
      commitResponses({});
      commitPreferences({ ...preferencesRef.current, currentChildId: child.id });
      return child;
    },
    [commitPreferences, commitResponses, commitSession],
  );

  const selectChild = useCallback(
    (childId: string | null) => {
      commitPreferences({ ...preferencesRef.current, currentChildId: childId });
      loadLatest(childId).catch((e) => console.warn('기록을 불러오지 못했어요', e));
    },
    [commitPreferences, loadLatest],
  );

  const setAdultRole = useCallback(
    (adultRole: Session['adultRole']) => commitPreferences({ ...preferencesRef.current, adultRole }),
    [commitPreferences],
  );

  const openSession = useCallback(
    (sessionId: string) => {
      const target = pastSessions.find((s) => s.id === sessionId);
      if (!target) return;
      const ticket = ++loadTicket.current;
      repository
        .listResponses(sessionId)
        .then((saved) => {
          if (ticket !== loadTicket.current) return;
          commitSession(target);
          commitResponses(Object.fromEntries(saved.map((r) => [r.itemCode, r])));
          setAttempts({});
        })
        .catch((e) => console.warn('기록을 불러오지 못했어요', e));
    },
    [pastSessions, commitResponses, commitSession],
  );

  const startSession = useCallback(() => {
    loadTicket.current++; // 불러오던 지난 기록이 새 회기를 덮지 않게
    const s = newSession(preferencesRef.current);
    commitSession(s);
    setPastSessions((prev) => [s, ...prev]);
    commitResponses({});
    persist(repository.createSession(s));
  }, [commitResponses, commitSession]);

  /** 회기 없이 문항 화면으로 바로 들어온 경우(새로고침 등)를 위해 필요할 때 회기를 만든다. */
  const ensureSession = useCallback((): Session => {
    if (sessionRef.current) return sessionRef.current;
    loadTicket.current++;
    const s = newSession(preferencesRef.current);
    commitSession(s);
    setPastSessions((prev) => [s, ...prev]);
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

  const setNote = useCallback((itemCode: ItemCode, note: string) => update(itemCode, { note }), [update]);

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
      childList,
      preferences,
      session,
      pastSessions,
      responses,
      statuses: itemStatuses(ITEM_CODES, scores),
      next: nextItem(ITEM_CODES, scores),
      attempts,
      addChild,
      selectChild,
      setAdultRole,
      openSession,
      startSession,
      saveResponse,
      setHelped,
      setStrategyOverride,
      setNote,
      resetItem,
    };
  }, [
    loaded,
    childList,
    preferences,
    session,
    pastSessions,
    responses,
    attempts,
    addChild,
    selectChild,
    setAdultRole,
    openSession,
    startSession,
    saveResponse,
    setHelped,
    setStrategyOverride,
    setNote,
    resetItem,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionStore {
  const store = useContext(SessionContext);
  if (!store) throw new Error('useSession은 SessionProvider 안에서만 쓸 수 있다');
  return store;
}
