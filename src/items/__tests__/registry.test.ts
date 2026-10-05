import { PROMPTS } from '../../audio/prompts';
import { strategiesFor } from '../../scoring';
import { expectedAnswer, formatAnswer, ITEM_CODES, ITEMS, touchTargets } from '../registry';

describe('items.json', () => {
  it('문항 코드가 겹치지 않고 2절 표 순서(영역 → 번호)를 따른다', () => {
    expect(new Set(ITEM_CODES).size).toBe(ITEM_CODES.length);
    expect([...ITEM_CODES].sort()).toEqual(ITEM_CODES);
  });

  it('발문이 모두 prompts.ts에 있다', () => {
    for (const def of ITEMS) {
      expect(Object.keys(PROMPTS)).toContain(def.promptId);
      if (def.kind === 'flash') expect(Object.keys(PROMPTS)).toContain(def.introPromptId);
    }
  });

  it('정답을 고를 수 있다', () => {
    for (const def of ITEMS) {
      const answer = expectedAnswer(def);
      if (def.kind === 'numeralChoice') {
        expect(def.options).toContain(answer);
      } else if (def.kind === 'compareGroups') {
        expect(def.groups.map((g) => g.count)).toContain(answer);
        expect(Math.max(...def.groups.map((g) => g.count))).toBe(answer);
      } else if (def.kind === 'lineSelect') {
        for (const pos of def.answer) expect(pos).toBeLessThanOrEqual(def.animals.length);
      } else if (typeof answer === 'number') {
        expect(answer).toBeGreaterThanOrEqual(def.answerCards.min);
        expect(answer).toBeLessThanOrEqual(def.answerCards.max);
      }
    }
  });

  it('B3 정답은 가리개 밑까지 센 토끼의 자리', () => {
    const b3 = ITEMS.find((d) => d.code === 'B3');
    if (b3?.kind !== 'hiddenOrder') throw new Error('B3 없음');
    expect(b3.animals.indexOf('🐰') + 1).toBe(b3.answer);
    expect(b3.hiddenIndex).toBeLessThan(b3.animals.indexOf('🐰'));
  });

  it('F3 숫자 카드는 1~10이 한 장씩', () => {
    const f3 = ITEMS.find((d) => d.code === 'F3');
    if (f3?.kind !== 'numeralChoice') throw new Error('F3 없음');
    expect([...f3.options].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('자동 판별 결과를 어른이 고를 수 있는 목록에 모두 넣는다', () => {
    expect(strategiesFor('C1')).toEqual(['SUBITIZE', 'UNCLASSIFIED']);
    expect(strategiesFor('D2')).toEqual(['DELAYED', 'NONE', 'UNCLASSIFIED']);
    expect(strategiesFor('E2')).toEqual(['SUBITIZE', 'COUNT_EACH', 'UNCLASSIFIED']);
    expect(strategiesFor('B3')).toEqual(['NONE', 'UNCLASSIFIED']);
  });

  it('D1 정답 = 상자 안 + 더 온 쿠키', () => {
    const d1 = ITEMS.find((d) => d.code === 'D1');
    if (d1?.kind !== 'countOn') throw new Error('D1 없음');
    expect(d1.boxCount + d1.addedCount).toBe(d1.answer);
  });

  it('어른 화면의 답 표시', () => {
    const b2 = ITEMS.find((d) => d.code === 'B2')!;
    const f1 = ITEMS.find((d) => d.code === 'F1')!;
    expect(formatAnswer(b2, [1, 2, 3, 4, 5])).toBe('1, 2, 3, 4, 5번째');
    expect(formatAnswer(f1, 4)).toBe('수박 4개');
    const d1 = touchTargets(ITEMS.find((d) => d.code === 'D1')!)!;
    expect([-1, 0, 5].map(d1.name)).toEqual(['상자 열기', '상자 안 쿠키 1', '더 온 쿠키 1']);
  });

  it('터치 기록은 누르는 대상이 있는 문항만', () => {
    expect(touchTargets(ITEMS.find((d) => d.code === 'E2')!)).toMatchObject({ count: 4, label: '빈칸' });
    expect(touchTargets(ITEMS.find((d) => d.code === 'C1')!)).toBeNull();
  });
});
