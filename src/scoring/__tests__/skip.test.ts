import { itemStatuses, nextItem } from '../skip';
import type { ItemCode } from '../types';

const ORDER: ItemCode[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

describe('itemStatuses', () => {
  it('아무것도 안 했으면 모두 대기', () => {
    expect(itemStatuses(ORDER, {})).toEqual({
      A1: 'pending', A2: 'pending', A3: 'pending', B1: 'pending', B2: 'pending', B3: 'pending',
    });
  });

  it('한 영역에서 연속 2번 0점이면 그 영역의 남은 문항을 건너뛴다', () => {
    const s = itemStatuses(ORDER, { A1: 0, A2: 0 });
    expect(s.A3).toBe('skipped');
    expect(s.B1).toBe('pending');
  });

  it('0점이 연속되지 않으면 건너뛰지 않는다', () => {
    expect(itemStatuses(ORDER, { A1: 0, A2: 1 }).A3).toBe('pending');
    expect(itemStatuses(ORDER, { A1: 2, A2: 0 }).A3).toBe('pending');
  });

  it('연속은 영역을 넘어 이어지지 않는다', () => {
    const s = itemStatuses(ORDER, { A1: 2, A2: 2, A3: 0, B1: 0 });
    expect(s.B2).toBe('pending');
  });

  it('건너뛴 영역 뒤의 영역은 그대로 진행한다', () => {
    const s = itemStatuses(ORDER, { A1: 0, A2: 0, B1: 0, B2: 0 });
    expect(s.A3).toBe('skipped');
    expect(s.B3).toBe('skipped');
  });
});

describe('nextItem', () => {
  it('처음 문항부터 순서대로', () => {
    expect(nextItem(ORDER, {})).toBe('A1');
    expect(nextItem(ORDER, { A1: 2 })).toBe('A2');
  });

  it('건너뛴 문항을 넘어 다음 영역으로', () => {
    expect(nextItem(ORDER, { A1: 0, A2: 0 })).toBe('B1');
  });

  it('다시 하려고 지운 문항이 있으면 그 문항부터', () => {
    expect(nextItem(ORDER, { A2: 2, A3: 2 })).toBe('A1');
  });

  it('모두 끝나면 null', () => {
    expect(nextItem(['A1', 'A2'], { A1: 2, A2: 1 })).toBeNull();
    expect(nextItem(['A1', 'A2', 'A3'], { A1: 0, A2: 0 })).toBeNull();
  });
});
