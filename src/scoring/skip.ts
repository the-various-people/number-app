import { areaOf } from './strategies';
import type { ItemCode, Score } from './types';

export type ItemStatus = 'answered' | 'skipped' | 'pending';

/** 한 영역에서 0점이 이만큼 연속되면 그 영역의 남은 문항을 건너뛴다 (2절). */
export const SKIP_AFTER_ZEROS = 2;

/**
 * 문항마다 진행 상태를 정한다.
 * 영역 안에서 앞에서부터 보며, 답한 문항이 연속 2번 0점이면 그 뒤의 답하지 않은 문항은 건너뛴다.
 * 0점에는 1:1 대응 오류처럼 답은 맞았지만 0점인 경우도 들어간다.
 * 아직 답하지 않은 문항은 연속을 끊지도 잇지도 않는다.
 */
export function itemStatuses(
  order: ItemCode[],
  scores: Partial<Record<ItemCode, Score>>,
): Partial<Record<ItemCode, ItemStatus>> {
  const zeroStreak = new Map<string, number>();
  const statuses: Partial<Record<ItemCode, ItemStatus>> = {};

  for (const code of order) {
    const area = areaOf(code);
    const streak = zeroStreak.get(area) ?? 0;
    const score = scores[code];

    if (score !== undefined) {
      statuses[code] = 'answered';
      zeroStreak.set(area, score === 0 ? streak + 1 : 0);
    } else {
      statuses[code] = streak >= SKIP_AFTER_ZEROS ? 'skipped' : 'pending';
    }
  }
  return statuses;
}

/** 다음에 낼 문항. 모두 답했거나 건너뛰었으면 null. */
export function nextItem(order: ItemCode[], scores: Partial<Record<ItemCode, Score>>): ItemCode | null {
  const statuses = itemStatuses(order, scores);
  return order.find((code) => statuses[code] === 'pending') ?? null;
}
