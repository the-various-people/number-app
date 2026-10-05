import type { ItemCode } from '../scoring/types';
import items from './items.json';
import type { ItemDef } from './types';

/** 진단 순서 = items.json 순서. 2단계 동안 16문항으로 늘린다. */
export const ITEMS = items as ItemDef[];

export function getItem(code: string): ItemDef | undefined {
  return ITEMS.find((item) => item.code === code);
}

export const ITEM_CODES: ItemCode[] = ITEMS.map((item) => item.code);
