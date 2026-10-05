import type { ItemCode, Score, StrategyCode, TouchEvent } from '../scoring/types';

/** 7절 session. 아이 등록은 3단계에서 붙이므로 childId는 아직 비어 있을 수 있다. */
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

/**
 * 저장소. 화면 코드는 이것만 쓴다.
 * 태블릿 앱은 SQLite(repository.native.ts), 웹은 브라우저 저장소(repository.ts)를 쓴다.
 */
export interface Repository {
  createSession(session: Session): Promise<void>;
  latestSession(): Promise<Session | null>;
  listResponses(sessionId: string): Promise<ItemResponse[]>;
  /** 같은 id가 있으면 덮어쓴다 (터치 기록 포함). */
  saveResponse(response: ItemResponse): Promise<void>;
  deleteResponse(id: string): Promise<void>;
}
