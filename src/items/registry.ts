import { BOX_TARGET } from '../scoring/choice';
import { decodeMove, decodeSplit, isIncompleteSplit, ZONE_DONE, ZONE_REMIND } from '../scoring/drag';
import type { ItemAnswer, ItemCode } from '../scoring/types';
import items from './items.json';
import type { ItemDef } from './types';

/** 진단 순서 = items.json 순서. 2단계 동안 16문항으로 늘린다. */
export const ITEMS = items as ItemDef[];

export function getItem(code: string): ItemDef | undefined {
  return ITEMS.find((item) => item.code === code);
}

/** 정답. E1처럼 정답이 하나로 정해지지 않는 문항은 null. */
export function expectedAnswer(def: ItemDef): ItemAnswer | null {
  if (def.kind === 'counting') return def.count;
  if (def.kind === 'dragSplit') return null;
  return def.answer;
}

/** 어른 화면의 "정답" 칸 */
export function expectedLabel(def: ItemDef): string {
  const answer = expectedAnswer(def);
  return answer === null ? '서로 다른 방법 2가지 이상' : formatAnswer(def, answer);
}

/** 어른 화면에 보이는 답 */
export function formatAnswer(def: ItemDef, answer: ItemAnswer): string {
  if (def.kind === 'dragSplit' && Array.isArray(answer)) {
    return answer.length
      ? answer
          .map((code) => decodeSplit(code).join('+') + (isIncompleteSplit(code, def.total) ? ' (덜 담음)' : ''))
          .join(', ')
      : '담지 않음';
  }
  if (def.kind === 'dragBasket') return `${answer}개`;
  if (Array.isArray(answer)) return answer.length ? `${answer.join(', ')}번째` : '고르지 않음';
  if (def.kind === 'compareGroups') {
    const group = def.groups.find((g) => g.count === answer);
    if (group) return `${group.label} ${group.count}개`;
  }
  return String(answer);
}

export interface TouchTargets {
  /** 대상 수 (상자 열기 같은 특별한 터치는 빼고) */
  count: number;
  /** 터치 기록 표의 열 이름 */
  label: string;
  /** 터치 기록 표에 보이는 대상 이름 */
  name(targetIndex: number): string;
  /** 안 누른 대상을 알려 줄지. 모두 눌러야 하는 세기 문항만 그렇다. */
  showMissed: boolean;
  /** 같은 대상을 다시 누른 줄을 강조할지 */
  markRepeats: boolean;
}

const numbered = (i: number) => `${i + 1}번`;

/** 아이가 누르는 대상. 터치 기록을 남기는 문항만 있다. */
export function touchTargets(def: ItemDef): TouchTargets | null {
  switch (def.kind) {
    case 'counting':
      return { count: def.count, label: def.objectLabel, name: numbered, showMissed: true, markRepeats: true };
    case 'fillTen':
      return { count: 10 - def.filled, label: '빈칸', name: numbered, showMissed: true, markRepeats: true };
    case 'lineSelect':
      return {
        count: def.animals.length,
        label: '동물',
        name: (i) => `${i + 1}번째`,
        showMissed: false,
        markRepeats: true,
      };
    case 'countOn':
      return {
        count: def.boxCount + def.addedCount,
        label: '누른 것',
        name: (i) =>
          i === BOX_TARGET
            ? '상자 열기'
            : i < def.boxCount
              ? `상자 안 쿠키 ${i + 1}`
              : `더 온 쿠키 ${i - def.boxCount + 1}`,
        showMissed: false,
        markRepeats: true,
      };
    case 'dragBasket':
    case 'dragSplit': {
      const zoneNames = def.kind === 'dragBasket' ? ['쟁반', '바구니'] : ['쟁반', '왼쪽 접시', '오른쪽 접시'];
      return {
        count: def.kind === 'dragBasket' ? def.supply : def.total,
        label: '옮김',
        name: (i) => {
          const { zone, objectIndex } = decodeMove(i);
          if (zone === ZONE_DONE) return `✓ (${objectIndex + 1}번째)`;
          if (zone === ZONE_REMIND) return '✓ 덜 담음 → "모두 담아 줘" 다시 안내';
          return `구슬 ${objectIndex + 1} → ${zoneNames[zone] ?? '?'}`;
        },
        showMissed: false,
        markRepeats: false,
      };
    }
    default:
      return null;
  }
}

export const ITEM_CODES: ItemCode[] = ITEMS.map((item) => item.code);
