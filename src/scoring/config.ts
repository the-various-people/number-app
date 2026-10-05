/**
 * 판별 규칙의 시간 기준. 시범 사용(8절 6단계) 후 조정한다.
 * 응답 시간은 발문이 끝난 시점부터 답을 고른 시점까지다.
 */
export const SUBITIZE_MAX_MS = 2000;
export const DELAYED_MIN_MS = 8000;

/** 영역 판정 기준 (3절). 영역 점수가 만점의 이 비율 이상이면 도달, 그 아래 PARTIAL_MIN 이상이면 보완, 더 낮으면 집중 지도. */
export const REACHED_MIN_RATIO = 0.8;
export const PARTIAL_MIN_RATIO = 0.5;
