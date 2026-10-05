import type { PromptId } from '../audio/prompts';
import type { ItemCode } from '../scoring/types';

/** 대상을 하나씩 눌러 세고 답 카드를 고르는 문항 (A1, A2) */
export interface CountingItemDef {
  code: ItemCode;
  kind: 'counting';
  object: 'apple';
  count: number;
  layout: 'row';
  promptId: PromptId;
  answerCards: { min: number; max: number; showNumeral: boolean };
}

export type ItemDef = CountingItemDef;
