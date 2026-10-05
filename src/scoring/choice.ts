import { DELAYED_MIN_MS, SUBITIZE_MAX_MS } from './config';
import type { StrategyCode, TouchEvent } from './types';

/**
 * 답 카드(또는 숫자 카드)를 하나 골라 답하는 문항의 전략 규칙.
 *
 * - none: 규칙 없음 (B3, F3). 정답이면 2점.
 * - delay: 응답 8초 이상이면 지연 응답 (D2, F2).
 * - flash: 점을 잠깐 보여 주고 묻는 문항 (C1~C3). 2초 이내면 직관 인식, 넘으면 판별 불가.
 * - fillTen: 10격자 빈칸 문항 (E2). 빈칸 터치를 함께 본다.
 * - countOn: 상자 이어세기 문항 (D1). 상자를 열었는지와 쿠키 터치를 함께 본다.
 */
export type ChoiceRule = 'none' | 'delay' | 'flash' | 'fillTen' | 'countOn';

/** D1에서 상자를 연 터치의 targetIndex. 쿠키는 상자 안 0..boxCount-1, 더 온 쿠키는 그 뒤 번호다. */
export const BOX_TARGET = -1;

export interface ChoiceInput {
  rule: ChoiceRule;
  /** 발문 종료 → 답 선택까지 걸린 시간 */
  responseMs: number;
  /** fillTen: 누를 수 있는 빈칸 수. countOn: 더 온 쿠키 수 */
  targetCount?: number;
  /** countOn: 상자 안 쿠키 수 */
  boxCount?: number;
  /** fillTen·countOn: 대상 터치, 시간순 */
  touches?: TouchEvent[];
}

export function classifyChoice({
  rule,
  responseMs,
  targetCount = 0,
  boxCount = 0,
  touches = [],
}: ChoiceInput): StrategyCode {
  switch (rule) {
    case 'none':
      return 'NONE';
    case 'delay':
      return responseMs >= DELAYED_MIN_MS ? 'DELAYED' : 'NONE';
    case 'flash':
      return responseMs <= SUBITIZE_MAX_MS ? 'SUBITIZE' : 'UNCLASSIFIED';
    case 'fillTen':
      return classifyFillTen(targetCount, touches, responseMs);
    case 'countOn':
      return classifyCountOn(boxCount, targetCount, touches);
  }
}

/** 터치한 대상이 expected와 정확히 같고, 각각 한 번씩인지 */
function touchedEachOnce(targets: number[], expected: number[]): boolean {
  return (
    targets.length === expected.length &&
    new Set(targets).size === expected.length &&
    expected.every((i) => targets.includes(i))
  );
}

/**
 * D1: 상자를 열지 않고 더 온 쿠키만 하나씩 누르면 이어세기,
 * 상자를 열고 쿠키를 전부 하나씩 누르면 모두 다시 세기, 그 밖에는 판별 불가.
 */
function classifyCountOn(boxCount: number, addedCount: number, touches: TouchEvent[]): StrategyCode {
  const opened = touches.some((t) => t.targetIndex === BOX_TARGET);
  const cookies = touches.filter((t) => t.targetIndex !== BOX_TARGET).map((t) => t.targetIndex);
  const range = (from: number, length: number) => Array.from({ length }, (_, i) => from + i);
  if (!opened) return touchedEachOnce(cookies, range(boxCount, addedCount)) ? 'COUNT_ON' : 'UNCLASSIFIED';
  return touchedEachOnce(cookies, range(0, boxCount + addedCount)) ? 'COUNT_ALL' : 'UNCLASSIFIED';
}

/**
 * E2: 빈칸을 누르지 않고 2초 안에 답하면 직관 인식,
 * 빈칸을 하나씩 정확히 한 번씩 누르면 하나씩 세기, 그 밖에는 판별 불가.
 */
function classifyFillTen(targetCount: number, touches: TouchEvent[], responseMs: number): StrategyCode {
  if (touches.length === 0) return responseMs <= SUBITIZE_MAX_MS ? 'SUBITIZE' : 'UNCLASSIFIED';
  const all = Array.from({ length: targetCount }, (_, i) => i);
  return touchedEachOnce(touches.map((t) => t.targetIndex), all) ? 'COUNT_EACH' : 'UNCLASSIFIED';
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

export interface SelectionAttempt {
  /** 정답 자리 목록 (앞에서 1번째부터) */
  expected: number[];
  /** 아이가 ✓를 누를 때 골라져 있던 자리 */
  selected: number[];
  promptEndMs: number;
  answeredAtMs: number;
}

/** 여러 개를 골라 ✓로 답하는 문항 (B1, B2). 전략 규칙이 없어 정답이면 2점이다. */
export function evaluateSelection({ expected, selected, promptEndMs, answeredAtMs }: SelectionAttempt) {
  const sorted = [...selected].sort((a, b) => a - b);
  const want = [...expected].sort((a, b) => a - b);
  return {
    answer: sorted,
    correct: sorted.length === want.length && sorted.every((v, i) => v === want[i]),
    responseMs: Math.max(0, answeredAtMs - promptEndMs),
    autoStrategy: 'NONE' as const,
  };
}
