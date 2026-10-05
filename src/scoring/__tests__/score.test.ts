import { baseScore, resolveStrategy, scoreResponse } from '../score';
import { strategiesFor } from '../strategies';

describe('baseScore', () => {
  it('하나씩 세기는 A 영역 2점, D·E 영역 1점', () => {
    expect(baseScore('COUNT_EACH', 'A1')).toBe(2);
    expect(baseScore('COUNT_EACH', 'A2')).toBe(2);
    expect(baseScore('COUNT_EACH', 'D1')).toBe(1);
    expect(baseScore('COUNT_EACH', 'E2')).toBe(1);
  });

  it('3절 표의 나머지 점수', () => {
    expect(baseScore('SUBITIZE', 'A1')).toBe(2);
    expect(baseScore('COUNT_ON', 'D1')).toBe(2);
    expect(baseScore('COUNT_ALL', 'D1')).toBe(1);
    expect(baseScore('RECOUNT', 'A1')).toBe(1);
    expect(baseScore('DELAYED', 'D2')).toBe(1);
    expect(baseScore('ONE_TO_ONE_ERROR', 'A1')).toBe(0);
    expect(baseScore('UNCLASSIFIED', 'A1')).toBe(1);
  });
});

describe('scoreResponse', () => {
  const a1 = { itemCode: 'A1' as const, helped: false };

  it('오답은 전략과 상관없이 0점', () => {
    expect(scoreResponse({ ...a1, correct: false, strategy: 'COUNT_EACH' })).toBe(0);
    expect(scoreResponse({ ...a1, correct: false, strategy: 'SUBITIZE' })).toBe(0);
  });

  it('정답 + 효율적 전략 2점, 정답 + 기초 전략 1점', () => {
    expect(scoreResponse({ ...a1, correct: true, strategy: 'COUNT_EACH' })).toBe(2);
    expect(scoreResponse({ ...a1, correct: true, strategy: 'RECOUNT' })).toBe(1);
  });

  it('1:1 대응 오류는 정답이어도 0점 (우연으로 본다)', () => {
    expect(scoreResponse({ ...a1, correct: true, strategy: 'ONE_TO_ONE_ERROR' })).toBe(0);
  });

  it('도움 줌이면 1점 상한', () => {
    expect(scoreResponse({ ...a1, helped: true, correct: true, strategy: 'COUNT_EACH' })).toBe(1);
    expect(scoreResponse({ ...a1, helped: true, correct: true, strategy: 'RECOUNT' })).toBe(1);
    expect(scoreResponse({ ...a1, helped: true, correct: true, strategy: 'ONE_TO_ONE_ERROR' })).toBe(0);
    expect(scoreResponse({ ...a1, helped: true, correct: false, strategy: 'COUNT_EACH' })).toBe(0);
  });
});

describe('resolveStrategy', () => {
  it('어른이 고친 전략이 자동 판별보다 우선', () => {
    expect(resolveStrategy('UNCLASSIFIED', 'SUBITIZE')).toBe('SUBITIZE');
    expect(resolveStrategy('COUNT_EACH', null)).toBe('COUNT_EACH');
  });
});

describe('strategiesFor', () => {
  it('A1에서 고를 수 있는 전략', () => {
    expect(strategiesFor('A1')).toEqual([
      'SUBITIZE',
      'COUNT_EACH',
      'ONE_TO_ONE_ERROR',
      'RECOUNT',
      'UNCLASSIFIED',
    ]);
  });
});
