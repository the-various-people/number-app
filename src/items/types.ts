import type { PromptId } from '../audio/prompts';
import type { ChoiceRule } from '../scoring/choice';
import type { ItemCode } from '../scoring/types';

interface BaseItemDef {
  code: ItemCode;
  /** 어른 화면에 보이는 문항 설명 */
  label: string;
  promptId: PromptId;
}

export interface AnswerCardsDef {
  min: number;
  max: number;
  showNumeral: boolean;
}

/** 대상을 하나씩 눌러 세고 답 카드를 고르는 문항 (A1, A2) */
export interface CountingItemDef extends BaseItemDef {
  kind: 'counting';
  object: 'apple' | 'star';
  /** 어른 화면의 터치 기록에 쓰는 대상 이름 */
  objectLabel: string;
  count: number;
  /** row: 가지런히 한 줄, scattered: positions에 흩어 놓음 */
  layout: 'row' | 'scattered';
  /** scattered일 때 대상 중심의 위치. 무대 너비·높이에 대한 비율(0~1) */
  positions?: [number, number][];
  answerCards: AnswerCardsDef;
}

/** 답을 하나 골라 답하는 문항의 공통 필드 (B3, C1~C3, D2, E2, F2, F3) */
interface ChoiceItemBase extends BaseItemDef {
  /** 정답 */
  answer: number;
  rule: ChoiceRule;
}

/** B3: 줄 선 동물 가운데 하나가 가리개 밑에 숨어 있다. 왼쪽이 앞이다. */
export interface HiddenOrderItemDef extends ChoiceItemBase {
  kind: 'hiddenOrder';
  /** 앞에서부터 동물 그림. hiddenIndex 자리는 가리개로 덮는다. */
  animals: string[];
  hiddenIndex: number;
  answerCards: AnswerCardsDef;
}

/** C1~C3: 점 무늬를 잠깐 보여 주고 숨긴 뒤 몇 개였는지 묻는다. */
export interface FlashItemDef extends ChoiceItemBase {
  kind: 'flash';
  /** tenFrame: 10격자에 위 줄부터 채움, dice: 주사위 눈 (1~6) */
  pattern: 'tenFrame' | 'dice';
  count: number;
  /** 보여 주기 전에 주의를 끄는 발문 */
  introPromptId: PromptId;
  /** 점을 보여 주는 시간 */
  showMs: number;
  answerCards: AnswerCardsDef;
}

/** D2: 화면의 수 다음에 오는 수 */
export interface NextNumberItemDef extends ChoiceItemBase {
  kind: 'nextNumber';
  from: number;
  answerCards: AnswerCardsDef;
}

/** E2: 10격자에 filled개가 차 있고, 빈칸을 누를 수 있다. */
export interface FillTenItemDef extends ChoiceItemBase {
  kind: 'fillTen';
  filled: number;
  answerCards: AnswerCardsDef;
}

/** F2, F3: 숫자 카드 가운데 하나를 누른다. 점은 없다. */
export interface NumeralChoiceItemDef extends ChoiceItemBase {
  kind: 'numeralChoice';
  /** 화면에 놓는 순서 그대로 */
  options: number[];
  /** 한 줄에 놓을 카드 수 */
  perRow: number;
}

export type ChoiceItemDef =
  | HiddenOrderItemDef
  | FlashItemDef
  | NextNumberItemDef
  | FillTenItemDef
  | NumeralChoiceItemDef;

export type ItemDef = CountingItemDef | ChoiceItemDef;
