import type { ItemCode, Score, StrategyCode, TouchEvent } from '../scoring/types';
import type { ItemResponse, Session } from './types';

/** SQLite 행 모양. 열 이름은 7절 데이터 모델을 따른다. */
export interface SessionRow {
  id: string;
  child_id: string | null;
  type: string;
  started_at: number;
  adult_role: string | null;
}

export interface ItemResponseRow {
  id: string;
  session_id: string;
  item_code: string;
  /** 문항마다 답 모양이 달라질 수 있어 JSON 문자열로 둔다 */
  answer: string;
  correct: number;
  auto_strategy_code: string;
  strategy_override: string | null;
  strategy_code: string;
  score: number;
  helped: number;
  response_ms: number;
  prompt_end_ms: number;
  note: string;
}

export interface TouchEventRow {
  response_id: string;
  seq: number;
  target_index: number;
  t_ms: number;
}

export const toSessionRow = (s: Session): SessionRow => ({
  id: s.id,
  child_id: s.childId,
  type: s.type,
  started_at: s.startedAt,
  adult_role: s.adultRole,
});

export const fromSessionRow = (r: SessionRow): Session => ({
  id: r.id,
  childId: r.child_id,
  type: r.type as Session['type'],
  startedAt: r.started_at,
  adultRole: r.adult_role as Session['adultRole'],
});

export const toResponseRow = (r: ItemResponse): ItemResponseRow => ({
  id: r.id,
  session_id: r.sessionId,
  item_code: r.itemCode,
  answer: JSON.stringify(r.answer),
  correct: r.correct ? 1 : 0,
  auto_strategy_code: r.autoStrategyCode,
  strategy_override: r.strategyOverride,
  strategy_code: r.strategyCode,
  score: r.score,
  helped: r.helped ? 1 : 0,
  response_ms: r.responseMs,
  prompt_end_ms: r.promptEndMs,
  note: r.note,
});

export const toTouchRows = (r: ItemResponse): TouchEventRow[] =>
  r.touches.map((t, seq) => ({ response_id: r.id, seq, target_index: t.targetIndex, t_ms: t.tMs }));

export const fromRows = (r: ItemResponseRow, touches: TouchEventRow[]): ItemResponse => ({
  id: r.id,
  sessionId: r.session_id,
  itemCode: r.item_code as ItemCode,
  answer: JSON.parse(r.answer),
  correct: r.correct === 1,
  autoStrategyCode: r.auto_strategy_code as StrategyCode,
  strategyOverride: r.strategy_override as StrategyCode | null,
  strategyCode: r.strategy_code as StrategyCode,
  score: r.score as Score,
  helped: r.helped === 1,
  responseMs: r.response_ms,
  promptEndMs: r.prompt_end_ms,
  note: r.note,
  touches: [...touches]
    .sort((a, b) => a.seq - b.seq)
    .map((t): TouchEvent => ({ targetIndex: t.target_index, tMs: t.t_ms })),
});
