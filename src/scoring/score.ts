import { areaOf } from './strategies';
import type { ItemCode, Score, StrategyCode } from './types';

/** 정답일 때 전략별 점수 (3절 표의 마지막 열). */
export function baseScore(strategy: StrategyCode, itemCode: ItemCode): Score {
  switch (strategy) {
    case 'SUBITIZE':
    case 'COUNT_ON':
    case 'NONE':
      return 2;
    case 'COUNT_EACH':
      return areaOf(itemCode) === 'A' ? 2 : 1;
    case 'COUNT_ALL':
    case 'RECOUNT':
    case 'DELAYED':
    case 'UNCLASSIFIED':
      return 1;
    case 'ONE_TO_ONE_ERROR':
      return 0;
  }
}

/** 어른이 고친 전략이 있으면 그것을 쓴다. */
export function resolveStrategy(auto: StrategyCode, override: StrategyCode | null): StrategyCode {
  return override ?? auto;
}

export interface ScoreInput {
  itemCode: ItemCode;
  correct: boolean;
  strategy: StrategyCode;
  /** 어른이 "도움 줌"을 누름 → 1점 상한 */
  helped: boolean;
}

export function scoreResponse({ itemCode, correct, strategy, helped }: ScoreInput): Score {
  if (!correct) return 0;
  const score = baseScore(strategy, itemCode);
  return helped ? (Math.min(score, 1) as Score) : score;
}
