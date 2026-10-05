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
  | 'UNCLASSIFIED'; // 판별 불가

/** 터치 하나 (7절 touch_event). tMs는 문항 화면이 뜬 시점 기준. */
export interface TouchEvent {
  targetIndex: number;
  tMs: number;
}

export type Score = 0 | 1 | 2;
