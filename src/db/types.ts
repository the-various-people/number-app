import type { ItemAnswer, ItemCode, Score, StrategyCode, TouchEvent } from '../scoring/types';

/** 7절 child. 개인정보는 별명과 생년월만 받는다 (7절). */
export interface Child {
  id: string;
  nickname: string;
  /** YYYY-MM */
  birthMonth: string;
  createdAt: number;
}

/** 7절 session. 아이를 고르지 않고 시작한 회기는 childId가 null이다. */
export interface Session {
  id: string;
  childId: string | null;
  type: 'pre' | 'activity' | 'post';
  startedAt: number;
  adultRole: 'teacher' | 'parent' | null;
}

/** 7절 item_response + 그 문항의 touch_event 목록 */
export interface ItemResponse {
  id: string;
  sessionId: string;
  itemCode: ItemCode;
  answer: ItemAnswer;
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

/** 어른 화면에서 고른 값. 앱을 다시 열어도 이어진다. */
export interface Preferences {
  /** 다음 진단을 할 아이 (null이면 아이를 고르지 않음) */
  currentChildId: string | null;
  /** 함께하는 어른 */
  adultRole: Session['adultRole'];
}

export const DEFAULT_PREFERENCES: Preferences = { currentChildId: null, adultRole: null };

/**
 * 저장소. 화면 코드는 이것만 쓴다.
 * 태블릿 앱은 SQLite(repository.native.ts), 웹은 브라우저 저장소(repository.ts)를 쓴다.
 */
export interface Repository {
  listChildren(): Promise<Child[]>;
  /** 같은 id가 있으면 덮어쓴다. */
  saveChild(child: Child): Promise<void>;
  loadPreferences(): Promise<Preferences>;
  savePreferences(preferences: Preferences): Promise<void>;
  createSession(session: Session): Promise<void>;
  /** 그 아이의 가장 최근 회기. childId가 null이면 아이를 고르지 않고 한 회기 중에서 찾는다. */
  latestSession(childId: string | null): Promise<Session | null>;
  /** 그 아이의 회기 목록, 최근 것부터 */
  listSessions(childId: string | null): Promise<Session[]>;
  listResponses(sessionId: string): Promise<ItemResponse[]>;
  /** 같은 id가 있으면 덮어쓴다 (터치 기록 포함). */
  saveResponse(response: ItemResponse): Promise<void>;
  deleteResponse(id: string): Promise<void>;
}
