import type { ItemCode } from '../scoring/types';
import A1 from './A1.json';
import type { ItemDef } from './types';

/** 진단 순서. 2단계에서 16문항으로 늘린다. */
export const ITEMS: ItemDef[] = [A1 as ItemDef];

export function getItem(code: string): ItemDef | undefined {
  return ITEMS.find((item) => item.code === code);
}

export const ITEM_CODES: ItemCode[] = ITEMS.map((item) => item.code);
