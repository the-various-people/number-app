import { classifyCounting } from './strategy';
import type { StrategyCode, TouchEvent } from './types';

export interface CountingAttempt {
  objectCount: number;
  answer: number;
  touches: TouchEvent[];
  /** 문항 화면 기준, 발문이 끝난 시각 */
  promptEndMs: number;
  /** 문항 화면 기준, 답 카드를 누른 시각 */
  answeredAtMs: number;
}

export interface CountingEvaluation {
  correct: boolean;
  responseMs: number;
  autoStrategy: StrategyCode;
}

export function evaluateCounting(attempt: CountingAttempt): CountingEvaluation {
  const responseMs = Math.max(0, attempt.answeredAtMs - attempt.promptEndMs);
  return {
    correct: attempt.answer === attempt.objectCount,
    responseMs,
    autoStrategy: classifyCounting({
      objectCount: attempt.objectCount,
      touches: attempt.touches,
      responseMs,
    }),
  };
}
