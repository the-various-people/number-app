import type { StrategyCode } from './types';

/**
 * 끌어다 놓는 문항 (A3, E1).
 *
 * 터치 기록(touch_event)에는 구슬을 놓을 때마다 한 줄을 남긴다.
 * 표에 열을 더하지 않으려고, 어디에 놓았는지를 targetIndex 한 값에 담는다:
 *   targetIndex = 놓은 곳 × 100 + 구슬 번호
 * 놓은 곳: 0 = 처음 자리(쟁반), 1 = 바구니 또는 왼쪽 접시, 2 = 오른쪽 접시
 */
export const ZONE_TRAY = 0;
/** ✓를 누른 때도 기록한다: 9 × 100 + 몇 번째 ✓인지(0부터). E1에서 나눔의 경계를 알 수 있다. */
export const ZONE_DONE = 9;
/**
 * E1: 쟁반에 구슬이 남은 채 ✓를 눌러 "구슬을 모두 담아 줘"를 다시 들려준 때: 8 × 100 + 몇 번째 나눔인지.
 * 이 ✓는 나눔으로 세지 않는다 (사용자 결정 2026-10-06, 문항마다 처음 한 번만).
 */
export const ZONE_REMIND = 8;

export function encodeMove(zone: number, objectIndex: number): number {
  return zone * 100 + objectIndex;
}

export function decodeMove(targetIndex: number): { zone: number; objectIndex: number } {
  return { zone: Math.floor(targetIndex / 100), objectIndex: targetIndex % 100 };
}

/** A3: 바구니에 담은 개수가 목표와 같으면 정답. 전략 규칙이 없어 정답이면 2점이다. */
export function evaluateBasket({ target, placed }: { target: number; placed: number }) {
  return { correct: placed === target, autoStrategy: 'NONE' as StrategyCode };
}

/**
 * E1의 한 번 나눔(왼쪽 개수, 오른쪽 개수)을 수 하나로 저장한다: 왼쪽 × 10 + 오른쪽.
 * 예: 2와 3 → 23. 구슬은 10개를 넘지 않으므로 한 자리씩이다.
 */
export function encodeSplit(left: number, right: number): number {
  return left * 10 + right;
}

export function decodeSplit(code: number): [number, number] {
  return [Math.floor(code / 10), code % 10];
}

/**
 * 서로 다른 나눔 방법 수 (2단계 결정 8).
 * 구슬을 모두(total개) 담고 두 접시 모두 1개 이상이어야 한 가지 방법이다. 2+3과 3+2는 같은 방법이다.
 */
export function countSplitWays(splits: number[], total: number): number {
  const ways = new Set<string>();
  for (const code of splits) {
    const [left, right] = decodeSplit(code);
    if (left >= 1 && right >= 1 && left + right === total) {
      ways.add(`${Math.min(left, right)}+${Math.max(left, right)}`);
    }
  }
  return ways.size;
}

/** 구슬을 다 담지 않았거나 한쪽 접시가 빈 나눔. 방법으로 세지 않고, 어른 화면에 "덜 담음"으로 보인다. */
export function isIncompleteSplit(code: number, total: number): boolean {
  const [left, right] = decodeSplit(code);
  return left < 1 || right < 1 || left + right !== total;
}

/** E1: 2가지 이상 2점, 1가지 1점, 없으면 0점 */
export function evaluateSplit({ splits, total }: { splits: number[]; total: number }) {
  const ways = countSplitWays(splits, total);
  return {
    ways,
    correct: ways >= 1,
    autoStrategy: (ways >= 2 ? 'MULTI_WAY' : 'SINGLE_WAY') as StrategyCode,
  };
}
