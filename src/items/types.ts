import type { PromptId } from '../audio/prompts';
import type { ItemCode } from '../scoring/types';

/** 대상을 하나씩 눌러 세고 답 카드를 고르는 문항 (A1, A2) */
export interface CountingItemDef {
  code: ItemCode;
  kind: 'counting';
  /** 어른 화면에 보이는 문항 설명 */
  label: string;
  object: 'apple' | 'star';
  /** 어른 화면의 터치 기록에 쓰는 대상 이름 */
  objectLabel: string;
  count: number;
  /** row: 가지런히 한 줄, scattered: positions에 흩어 놓음 */
  layout: 'row' | 'scattered';
  /** scattered일 때 대상 중심의 위치. 무대 너비·높이에 대한 비율(0~1) */
  positions?: [number, number][];
  promptId: PromptId;
  answerCards: { min: number; max: number; showNumeral: boolean };
}

export type ItemDef = CountingItemDef;
