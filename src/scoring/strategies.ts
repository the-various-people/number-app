import type { Area, ItemCode, StrategyCode } from './types';

export const STRATEGY_LABELS: Record<StrategyCode, string> = {
  SUBITIZE: '직관 인식',
  COUNT_ON: '이어세기',
  COUNT_EACH: '하나씩 세기',
  COUNT_ALL: '모두 다시 세기',
  ONE_TO_ONE_ERROR: '1:1 대응 오류',
  RECOUNT: '다시 세기',
  DELAYED: '지연 응답',
  MULTI_WAY: '여러 가지 방법',
  SINGLE_WAY: '한 가지 방법',
  NONE: '일반 응답',
  UNCLASSIFIED: '판별 불가',
};

/** 3절 표의 "해당 문항" 열. 어른이 전략을 고칠 때 고를 수 있는 목록이기도 하다. */
const STRATEGY_ITEMS: Record<Exclude<StrategyCode, 'UNCLASSIFIED'>, ItemCode[]> = {
  SUBITIZE: ['C1', 'C2', 'C3', 'A1', 'E2'],
  COUNT_ON: ['D1'],
  // D1의 "하나씩 세기"는 모두 다시 세기와 같아서 따로 두지 않는다 (2단계 결정 6)
  COUNT_EACH: ['A1', 'A2', 'E2'],
  COUNT_ALL: ['D1'],
  ONE_TO_ONE_ERROR: ['A1', 'A2'],
  RECOUNT: ['A1', 'A2'],
  DELAYED: ['D2', 'F2'],
  // 전략 규칙이 없는 문항(정답 2점)과, 늦지 않게 답한 D2·F2
  MULTI_WAY: ['E1'],
  SINGLE_WAY: ['E1'],
  NONE: ['A3', 'B1', 'B2', 'B3', 'D2', 'F1', 'F2', 'F3'],
};

export function strategiesFor(itemCode: ItemCode): StrategyCode[] {
  const codes = (Object.keys(STRATEGY_ITEMS) as (keyof typeof STRATEGY_ITEMS)[]).filter(
    (code) => STRATEGY_ITEMS[code].includes(itemCode),
  );
  return [...codes, 'UNCLASSIFIED'];
}

export function areaOf(itemCode: ItemCode): Area {
  return itemCode[0] as Area;
}
