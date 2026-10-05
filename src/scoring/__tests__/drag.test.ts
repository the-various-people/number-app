import {
  countSplitWays,
  decodeMove,
  decodeSplit,
  encodeMove,
  encodeSplit,
  evaluateBasket,
  evaluateSplit,
} from '../drag';
import { scoreResponse } from '../score';

describe('터치 기록 인코딩', () => {
  it('놓은 곳과 구슬 번호가 그대로 돌아온다', () => {
    expect(encodeMove(1, 7)).toBe(107);
    expect(decodeMove(107)).toEqual({ zone: 1, objectIndex: 7 });
    expect(decodeMove(encodeMove(0, 3))).toEqual({ zone: 0, objectIndex: 3 });
  });

  it('나눔: 2와 3 → 23', () => {
    expect(encodeSplit(2, 3)).toBe(23);
    expect(decodeSplit(23)).toEqual([2, 3]);
    expect(decodeSplit(encodeSplit(0, 5))).toEqual([0, 5]);
  });
});

describe('A3: 구슬 6개를 바구니에', () => {
  it('정확히 6개면 정답 2점', () => {
    const r = evaluateBasket({ target: 6, placed: 6 });
    expect(r).toEqual({ correct: true, autoStrategy: 'NONE' });
    expect(scoreResponse({ itemCode: 'A3', correct: true, strategy: r.autoStrategy, helped: false })).toBe(2);
  });

  it('6에서 못 멈추거나 모자라면 오답', () => {
    expect(evaluateBasket({ target: 6, placed: 7 }).correct).toBe(false);
    expect(evaluateBasket({ target: 6, placed: 10 }).correct).toBe(false);
    expect(evaluateBasket({ target: 6, placed: 5 }).correct).toBe(false);
  });
});

describe('E1: 구슬 5개 나눠 담기', () => {
  const split = (...pairs: [number, number][]) => pairs.map(([l, r]) => encodeSplit(l, r));

  it('2+3과 3+2는 같은 방법', () => {
    expect(countSplitWays(split([2, 3], [3, 2]), 5)).toBe(1);
  });

  it('한쪽이 비거나 구슬을 다 담지 않으면 방법이 아니다', () => {
    expect(countSplitWays(split([0, 5], [5, 0], [2, 2]), 5)).toBe(0);
  });

  it('서로 다른 방법 2가지 이상 2점, 1가지 1점, 없으면 0점', () => {
    const score = (splits: number[]) => {
      const r = evaluateSplit({ splits, total: 5 });
      return scoreResponse({ itemCode: 'E1', correct: r.correct, strategy: r.autoStrategy, helped: false });
    };
    expect(score(split([1, 4], [2, 3]))).toBe(2);
    expect(score(split([1, 4], [4, 1], [2, 3]))).toBe(2);
    expect(score(split([1, 4], [4, 1]))).toBe(1);
    expect(score(split([0, 5]))).toBe(0);
    expect(score([])).toBe(0);
  });

  it('도움 줌이면 최대 1점', () => {
    expect(scoreResponse({ itemCode: 'E1', correct: true, strategy: 'MULTI_WAY', helped: true })).toBe(1);
  });
});
