import { PROMPTS } from '../../audio/prompts';
import { strategiesFor } from '../../scoring';
import { expectedAnswer, ITEM_CODES, ITEMS, touchTargets } from '../registry';

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
      } else {
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

  it('터치 기록은 세는 문항만', () => {
    expect(touchTargets(ITEMS.find((d) => d.code === 'E2')!)).toEqual({ count: 4, label: '빈칸' });
    expect(touchTargets(ITEMS.find((d) => d.code === 'C1')!)).toBeNull();
  });
});
