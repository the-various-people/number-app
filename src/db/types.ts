import type { ItemAnswer, ItemCode, Score, StrategyCode, TouchEvent } from '../scoring/types';

/*
 * 고치기·지우기와 나중의 계정 기능
 *
 * - 지우기는 deletedAt(지운 시각)만 적는 "숨김"이다. 목록에서는 빠지고 기록은 기기에 남는다.
 *   나중에 계정과 서버 동기화를 붙이면 "지웠다"는 사실도 다른 기기에 전해야 하므로 이 방식이 필요하다.
 *   휴지통·되살리기·완전 삭제(보호자 요청 등)는 이 위에 붙인다.
 * - updatedAt은 동기화할 때 어느 쪽이 최신인지 가리는 데 쓴다.
 * - 계정이 생기면 Child와 Session에 ownerId(계정 또는 기관)를 더하고, 저장소가 그 계정의 것만 돌려주게 한다.
 *   화면 코드는 Repository만 쓰므로 화면은 거의 바꾸지 않아도 된다.
 * - 3-1 이전에 저장된 기록에는 updatedAt·deletedAt이 없을 수 있어 선택 필드로 둔다.
 */

/** 7절 child. 개인정보는 별명과 생년월만 받는다 (7절). */
export interface Child {
  id: string;
  nickname: string;
  /** YYYY-MM */
  birthMonth: string;
  createdAt: number;
  /** 마지막으로 고친 시각 */
  updatedAt?: number;
  /** 지운 시각. 있으면 목록에 보이지 않는다. */
  deletedAt?: number | null;
}

/** 7절 session. 아이를 고르지 않고 시작한 회기는 childId가 null이다. */
export interface Session {
  id: string;
  childId: string | null;
  type: 'pre' | 'activity' | 'post';
  startedAt: number;
  adultRole: 'teacher' | 'parent' | null;
  /** 지운 시각. 있으면 목록에 보이지 않는다. */
  deletedAt?: number | null;
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
  /** 지우지 않은 아이, 등록한 순서대로 */
  listChildren(): Promise<Child[]>;
  /** 같은 id가 있으면 덮어쓴다 (고치기). */
  saveChild(child: Child): Promise<void>;
  /** 아이와 그 아이의 회기를 모두 지운 것으로 표시한다. */
  deleteChild(id: string, deletedAt: number): Promise<void>;
  /** 회기를 지운 것으로 표시한다. */
  deleteSession(id: string, deletedAt: number): Promise<void>;
  loadPreferences(): Promise<Preferences>;
  savePreferences(preferences: Preferences): Promise<void>;
  createSession(session: Session): Promise<void>;
  /** 그 아이의 가장 최근 회기(지운 것 빼고). childId가 null이면 아이를 고르지 않고 한 회기 중에서 찾는다. */
  latestSession(childId: string | null): Promise<Session | null>;
  /** 그 아이의 회기 목록(지운 것 빼고), 최근 것부터 */
  listSessions(childId: string | null): Promise<Session[]>;
  listResponses(sessionId: string): Promise<ItemResponse[]>;
  /** 같은 id가 있으면 덮어쓴다 (터치 기록 포함). */
  saveResponse(response: ItemResponse): Promise<void>;
  deleteResponse(id: string): Promise<void>;
}
