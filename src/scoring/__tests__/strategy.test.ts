import { classifyCounting } from '../strategy';
import { evaluateCounting } from '../evaluate';
import type { TouchEvent } from '../types';

/** 대상 번호 목록 → 500ms 간격 터치 */
const taps = (...targets: number[]): TouchEvent[] =>
  targets.map((targetIndex, i) => ({ targetIndex, tMs: 1000 + i * 500 }));

describe('classifyCounting (A1: 사과 5개)', () => {
  const base = { objectCount: 5, responseMs: 3000 };

  it('터치 없이 2초 이내에 답하면 직관 인식', () => {
    expect(classifyCounting({ ...base, touches: [], responseMs: 1500 })).toBe('SUBITIZE');
  });

  it('직관 인식 경계: 정확히 2000ms는 직관 인식, 2001ms는 판별 불가', () => {
    expect(classifyCounting({ ...base, touches: [], responseMs: 2000 })).toBe('SUBITIZE');
    expect(classifyCounting({ ...base, touches: [], responseMs: 2001 })).toBe('UNCLASSIFIED');
  });

  it('모든 사과를 정확히 1번씩 누르면 하나씩 세기 (순서는 상관없음)', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 3, 4) })).toBe('COUNT_EACH');
    expect(classifyCounting({ ...base, touches: taps(4, 2, 0, 1, 3) })).toBe('COUNT_EACH');
  });

  it('하나씩 다 센 뒤 처음부터 다시 누르면 다시 세기', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 3, 4, 0, 1, 2, 3, 4) })).toBe('RECOUNT');
  });

  it('다 센 뒤 일부만 다시 눌러도 다시 세기', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 3, 4, 0, 1) })).toBe('RECOUNT');
  });

  it('같은 사과를 두 번 누르면 1:1 대응 오류', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 1, 2, 3, 4) })).toBe('ONE_TO_ONE_ERROR');
  });

  it('빠뜨린 사과가 있으면 1:1 대응 오류', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 3) })).toBe('ONE_TO_ONE_ERROR');
  });

  it('누락과 중복이 섞여 있어도 1:1 대응 오류', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 2, 3) })).toBe('ONE_TO_ONE_ERROR');
  });

  it('응답 시간은 터치가 있을 때 판별에 영향을 주지 않는다', () => {
    expect(classifyCounting({ ...base, touches: taps(0, 1, 2, 3, 4), responseMs: 500 })).toBe('COUNT_EACH');
  });
});

describe('evaluateCounting', () => {
  it('응답 시간은 발문 종료부터 답 선택까지', () => {
    const result = evaluateCounting({
      objectCount: 5,
      answer: 5,
      touches: [],
      promptEndMs: 4200,
      answeredAtMs: 5700,
    });
    expect(result).toEqual({ correct: true, responseMs: 1500, autoStrategy: 'SUBITIZE' });
  });

  it('오답이어도 전략은 판별한다', () => {
    const result = evaluateCounting({
      objectCount: 5,
      answer: 6,
      touches: taps(0, 1, 2, 2, 3, 4),
      promptEndMs: 4000,
      answeredAtMs: 9000,
    });
    expect(result).toEqual({ correct: false, responseMs: 5000, autoStrategy: 'ONE_TO_ONE_ERROR' });
  });
});
