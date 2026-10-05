import type { ItemCode } from '../scoring/types';
import items from './items.json';
import type { ItemDef } from './types';

/** 진단 순서 = items.json 순서. 2단계 동안 16문항으로 늘린다. */
export const ITEMS = items as ItemDef[];

export function getItem(code: string): ItemDef | undefined {
  return ITEMS.find((item) => item.code === code);
}

/** 정답 */
export function expectedAnswer(def: ItemDef): number {
  return def.kind === 'counting' ? def.count : def.answer;
}

/** 아이가 눌러 세는 대상. 터치 기록을 남기는 문항만 있다. */
export function touchTargets(def: ItemDef): { count: number; label: string } | null {
  if (def.kind === 'counting') return { count: def.count, label: def.objectLabel };
  if (def.kind === 'fillTen') return { count: 10 - def.filled, label: '빈칸' };
  return null;
}

export const ITEM_CODES: ItemCode[] = ITEMS.map((item) => item.code);
