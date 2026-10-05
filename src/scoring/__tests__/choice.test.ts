import { classifyChoice, evaluateChoice, evaluateSelection } from '../choice';
import { scoreResponse } from '../score';
import type { TouchEvent } from '../types';

const taps = (...targets: number[]): TouchEvent[] =>
  targets.map((targetIndex, i) => ({ targetIndex, tMs: 1000 + i * 500 }));

describe('규칙 없음 (B3, F3)', () => {
  it('언제 답해도 일반 응답, 정답이면 2점', () => {
    expect(classifyChoice({ rule: 'none', responseMs: 20000 })).toBe('NONE');
    expect(scoreResponse({ itemCode: 'B3', correct: true, strategy: 'NONE', helped: false })).toBe(2);
    expect(scoreResponse({ itemCode: 'F3', correct: false, strategy: 'NONE', helped: false })).toBe(0);
  });

  it('도움 줌이면 최대 1점', () => {
    expect(scoreResponse({ itemCode: 'B3', correct: true, strategy: 'NONE', helped: true })).toBe(1);
  });
});

describe('지연 응답 (D2, F2)', () => {
  it('8초 미만은 일반 응답 2점, 8초 이상은 지연 응답 1점', () => {
    expect(classifyChoice({ rule: 'delay', responseMs: 7999 })).toBe('NONE');
    expect(classifyChoice({ rule: 'delay', responseMs: 8000 })).toBe('DELAYED');
    expect(scoreResponse({ itemCode: 'D2', correct: true, strategy: 'DELAYED', helped: false })).toBe(1);
  });
});

describe('한눈에 알기 (C1~C3)', () => {
  it('2초 이내 직관 인식 2점, 넘으면 판별 불가 1점', () => {
    expect(classifyChoice({ rule: 'flash', responseMs: 2000 })).toBe('SUBITIZE');
    expect(classifyChoice({ rule: 'flash', responseMs: 2001 })).toBe('UNCLASSIFIED');
    expect(scoreResponse({ itemCode: 'C1', correct: true, strategy: 'UNCLASSIFIED', helped: false })).toBe(1);
  });
});

describe('10칸 채우기 (E2: 빈칸 4개)', () => {
  const base = { rule: 'fillTen' as const, targetCount: 4, responseMs: 5000 };

  it('빈칸을 누르지 않고 2초 안에 답하면 직관 인식', () => {
    expect(classifyChoice({ ...base, touches: [], responseMs: 1500 })).toBe('SUBITIZE');
    expect(classifyChoice({ ...base, touches: [], responseMs: 2500 })).toBe('UNCLASSIFIED');
  });

  it('빈칸을 하나씩 한 번씩 누르면 하나씩 세기 (E 영역 1점)', () => {
    expect(classifyChoice({ ...base, touches: taps(0, 1, 2, 3) })).toBe('COUNT_EACH');
    expect(classifyChoice({ ...base, touches: taps(3, 1, 0, 2) })).toBe('COUNT_EACH');
    expect(scoreResponse({ itemCode: 'E2', correct: true, strategy: 'COUNT_EACH', helped: false })).toBe(1);
  });

  it('빠뜨리거나 두 번 누르면 판별 불가', () => {
    expect(classifyChoice({ ...base, touches: taps(0, 1, 2) })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(0, 1, 1, 2, 3) })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(0, 1, 2, 3, 0) })).toBe('UNCLASSIFIED');
  });
});

describe('evaluateChoice', () => {
  it('응답 시간은 발문 종료부터, 정답은 기대값과 비교', () => {
    expect(
      evaluateChoice({ rule: 'flash', expected: 3, answer: 3, promptEndMs: 3000, answeredAtMs: 4200 }),
    ).toEqual({ correct: true, responseMs: 1200, autoStrategy: 'SUBITIZE' });
    expect(
      evaluateChoice({ rule: 'delay', expected: 8, answer: 7, promptEndMs: 2000, answeredAtMs: 12000 }),
    ).toEqual({ correct: false, responseMs: 10000, autoStrategy: 'DELAYED' });
  });
});

describe('상자 이어세기 (D1: 상자 안 5개 + 더 온 3개)', () => {
  const base = { rule: 'countOn' as const, boxCount: 5, targetCount: 3, responseMs: 4000 };
  const BOX = -1;

  it('상자를 열지 않고 더 온 3개만 하나씩 누르면 이어세기 (2점)', () => {
    expect(classifyChoice({ ...base, touches: taps(5, 6, 7) })).toBe('COUNT_ON');
    expect(classifyChoice({ ...base, touches: taps(7, 5, 6) })).toBe('COUNT_ON');
    expect(scoreResponse({ itemCode: 'D1', correct: true, strategy: 'COUNT_ON', helped: false })).toBe(2);
  });

  it('상자를 열고 8개를 전부 하나씩 누르면 모두 다시 세기 (1점)', () => {
    expect(classifyChoice({ ...base, touches: taps(BOX, 0, 1, 2, 3, 4, 5, 6, 7) })).toBe('COUNT_ALL');
    expect(scoreResponse({ itemCode: 'D1', correct: true, strategy: 'COUNT_ALL', helped: false })).toBe(1);
  });

  it('그 밖에는 판별 불가 (1점)', () => {
    expect(classifyChoice({ ...base, touches: [] })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(5, 6) })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(5, 6, 6, 7) })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(BOX, 5, 6, 7) })).toBe('UNCLASSIFIED');
    expect(classifyChoice({ ...base, touches: taps(BOX, 0, 1, 2, 3, 4, 5, 6) })).toBe('UNCLASSIFIED');
  });
});

describe('evaluateSelection (B1, B2)', () => {
  const at = { promptEndMs: 3000, answeredAtMs: 7000 };

  it('B1: 다섯 번째 하나만 골라야 정답', () => {
    expect(evaluateSelection({ ...at, expected: [5], selected: [5] })).toEqual({
      answer: [5], correct: true, responseMs: 4000, autoStrategy: 'NONE',
    });
    expect(evaluateSelection({ ...at, expected: [5], selected: [1, 2, 3, 4, 5] }).correct).toBe(false);
  });

  it('B2: 앞에서 1~5번째를 정확히 골라야 정답 (고른 순서는 상관없음)', () => {
    expect(evaluateSelection({ ...at, expected: [1, 2, 3, 4, 5], selected: [3, 1, 5, 2, 4] }).correct).toBe(true);
    expect(evaluateSelection({ ...at, expected: [1, 2, 3, 4, 5], selected: [2, 3, 4, 5, 6] }).correct).toBe(false);
    expect(evaluateSelection({ ...at, expected: [1, 2, 3, 4, 5], selected: [5] }).correct).toBe(false);
  });
});
