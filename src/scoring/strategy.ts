import { SUBITIZE_MAX_MS } from './config';
import type { StrategyCode, TouchEvent } from './types';

export interface CountingInput {
  /** 화면에 놓인 대상 수 */
  objectCount: number;
  /** 답을 고르기 전까지의 대상 터치, 시간순 */
  touches: TouchEvent[];
  /** 발문 종료 → 답 선택까지 걸린 시간 */
  responseMs: number;
}

/**
 * 대상 세기 문항(A1, A2)의 전략 판별.
 *
 * - 터치 0회, 응답 2초 이내 → 직관 인식
 * - 처음 N번의 터치가 N개 대상을 하나씩 모두 누름
 *   - 터치가 정확히 N번 → 하나씩 세기
 *   - 그 뒤에 터치가 더 있음 → 다시 세기 (다 센 뒤 처음부터 다시 셈)
 * - 그 밖의 중복 터치나 누락 → 1:1 대응 오류
 * - 터치 0회인데 2초 초과 → 판별 불가 (어른이 고친다)
 */
export function classifyCounting({ objectCount, touches, responseMs }: CountingInput): StrategyCode {
  if (touches.length === 0) {
    return responseMs <= SUBITIZE_MAX_MS ? 'SUBITIZE' : 'UNCLASSIFIED';
  }

  const firstPass = touches.slice(0, objectCount).map((t) => t.targetIndex);
  const firstPassComplete =
    firstPass.length === objectCount &&
    new Set(firstPass).size === objectCount &&
    firstPass.every((i) => i >= 0 && i < objectCount);

  if (!firstPassComplete) return 'ONE_TO_ONE_ERROR';
  return touches.length === objectCount ? 'COUNT_EACH' : 'RECOUNT';
}
