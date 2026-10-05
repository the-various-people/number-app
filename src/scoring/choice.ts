import { DELAYED_MIN_MS, SUBITIZE_MAX_MS } from './config';
import type { StrategyCode, TouchEvent } from './types';

/**
 * 답 카드(또는 숫자 카드)를 하나 골라 답하는 문항의 전략 규칙.
 *
 * - none: 규칙 없음 (B3, F3). 정답이면 2점.
 * - delay: 응답 8초 이상이면 지연 응답 (D2, F2).
 * - flash: 점을 잠깐 보여 주고 묻는 문항 (C1~C3). 2초 이내면 직관 인식, 넘으면 판별 불가.
 * - fillTen: 10격자 빈칸 문항 (E2). 빈칸 터치를 함께 본다.
 */
export type ChoiceRule = 'none' | 'delay' | 'flash' | 'fillTen';

export interface ChoiceInput {
  rule: ChoiceRule;
  /** 발문 종료 → 답 선택까지 걸린 시간 */
  responseMs: number;
  /** fillTen: 누를 수 있는 빈칸 수 */
  targetCount?: number;
  /** fillTen: 빈칸 터치, 시간순 */
  touches?: TouchEvent[];
}

export function classifyChoice({ rule, responseMs, targetCount = 0, touches = [] }: ChoiceInput): StrategyCode {
  switch (rule) {
    case 'none':
      return 'NONE';
    case 'delay':
      return responseMs >= DELAYED_MIN_MS ? 'DELAYED' : 'NONE';
    case 'flash':
      return responseMs <= SUBITIZE_MAX_MS ? 'SUBITIZE' : 'UNCLASSIFIED';
    case 'fillTen':
      return classifyFillTen(targetCount, touches, responseMs);
  }
}

/**
 * E2: 빈칸을 누르지 않고 2초 안에 답하면 직관 인식,
 * 빈칸을 하나씩 정확히 한 번씩 누르면 하나씩 세기, 그 밖에는 판별 불가.
 */
function classifyFillTen(targetCount: number, touches: TouchEvent[], responseMs: number): StrategyCode {
  if (touches.length === 0) return responseMs <= SUBITIZE_MAX_MS ? 'SUBITIZE' : 'UNCLASSIFIED';
  const targets = touches.map((t) => t.targetIndex);
  const eachOnce =
    targets.length === targetCount &&
    new Set(targets).size === targetCount &&
    targets.every((i) => i >= 0 && i < targetCount);
  return eachOnce ? 'COUNT_EACH' : 'UNCLASSIFIED';
}

export interface ChoiceAttempt extends Omit<ChoiceInput, 'responseMs'> {
  expected: number;
  answer: number;
  /** 문항 화면 기준, 발문이 끝난 시각 */
  promptEndMs: number;
  /** 문항 화면 기준, 답을 고른 시각 */
  answeredAtMs: number;
}

export function evaluateChoice({ expected, answer, promptEndMs, answeredAtMs, ...input }: ChoiceAttempt) {
  const responseMs = Math.max(0, answeredAtMs - promptEndMs);
  return {
    correct: answer === expected,
    responseMs,
    autoStrategy: classifyChoice({ ...input, responseMs }),
  };
}
