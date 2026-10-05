/** 진단 문항 코드 (2절 표). */
export type ItemCode =
  | 'A1' | 'A2' | 'A3'
  | 'B1' | 'B2' | 'B3'
  | 'C1' | 'C2' | 'C3'
  | 'D1' | 'D2'
  | 'E1' | 'E2'
  | 'F1' | 'F2' | 'F3';

export type Area = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** 전략 코드 (3절 표). UNCLASSIFIED는 어느 판별 규칙에도 해당하지 않을 때 붙인다. */
export type StrategyCode =
  | 'SUBITIZE' // 직관 인식
  | 'COUNT_ON' // 이어세기
  | 'COUNT_EACH' // 하나씩 세기
  | 'COUNT_ALL' // 모두 다시 세기
  | 'ONE_TO_ONE_ERROR' // 1:1 대응 오류
  | 'RECOUNT' // 다시 세기
  | 'DELAYED' // 지연 응답
  | 'MULTI_WAY' // 여러 가지 방법 (E1: 서로 다른 나눔 2가지 이상)
  | 'SINGLE_WAY' // 한 가지 방법 (E1)
  | 'NONE' // 일반 응답: 전략을 나누지 않는 문항의 정답, 또는 D2·F2에서 늦지 않은 응답
  | 'UNCLASSIFIED'; // 판별 불가

/** 터치 하나 (7절 touch_event). tMs는 문항 화면이 뜬 시점 기준. */
export interface TouchEvent {
  targetIndex: number;
  tMs: number;
}

export type Score = 0 | 1 | 2;

/**
 * 아이의 답. 대부분 수 하나다.
 * 여러 개를 고르는 문항(B1, B2)은 고른 자리(앞에서 1번째부터) 목록,
 * E1은 나눔마다 왼쪽 × 10 + 오른쪽 목록이다 (drag.ts).
 */
export type ItemAnswer = number | number[];
