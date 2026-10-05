import type { ItemCode, Score, StrategyCode } from '../../scoring/types';
import { areaReports, recommendations, startPoint, verdictOf, type Results } from '../report';

const ORDER: ItemCode[] = [
  'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'E1', 'E2', 'F1', 'F2', 'F3',
];

const r = (score: Score, strategyCode: StrategyCode = 'NONE') => ({ score, strategyCode });

/** 모든 문항 2점에서 시작해 일부만 바꾼다 */
const allTwo = (overrides: Results = {}): Results => ({
  ...Object.fromEntries(ORDER.map((c) => [c, r(2)])),
  ...overrides,
});

describe('verdictOf (3절 기준)', () => {
  it('80% 이상 도달, 50~79% 보완, 50% 미만 집중 지도', () => {
    expect(verdictOf(5, 6)).toBe('reached'); // 83%
    expect(verdictOf(8, 10)).toBe('reached'); // 80%
    expect(verdictOf(4, 6)).toBe('partial'); // 67%
    expect(verdictOf(3, 6)).toBe('partial'); // 50%
    expect(verdictOf(2, 6)).toBe('focus'); // 33%
  });
});

describe('areaReports', () => {
  it('영역마다 점수·만점·판정', () => {
    const reports = areaReports(ORDER, allTwo({ A1: r(1), A2: r(1), A3: r(0) }));
    expect(reports.map((x) => x.area)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(reports[0]).toEqual({ area: 'A', score: 2, max: 6, total: 3, pending: 0, verdict: 'focus' });
    expect(reports[1].verdict).toBe('reached');
  });

  it('건너뛴 문항은 0점으로 들어가고 판정한다', () => {
    const results = allTwo();
    delete results.A3;
    results.A1 = r(0);
    results.A2 = r(0);
    const a = areaReports(ORDER, results)[0];
    expect(a).toMatchObject({ score: 0, max: 6, pending: 0, verdict: 'focus' });
  });

  it('남은 문항이 있으면 판정하지 않는다', () => {
    const results = allTwo();
    delete results.B3;
    expect(areaReports(ORDER, results)[1]).toMatchObject({ pending: 1, verdict: null });
  });
});

describe('startPoint (4절)', () => {
  it('처음으로 도달하지 못한 영역', () => {
    expect(startPoint(areaReports(ORDER, allTwo({ D1: r(0), D2: r(1) })))).toEqual({
      kind: 'area', area: 'D', alsoC: false,
    });
  });

  it('모두 도달', () => {
    expect(startPoint(areaReports(ORDER, allTwo()))).toEqual({ kind: 'allReached' });
  });

  it('A가 출발점이고 C도 도달하지 못했으면 C를 함께', () => {
    const results = allTwo({ A1: r(0), A2: r(1), C1: r(1), C2: r(1), C3: r(1) });
    expect(startPoint(areaReports(ORDER, results))).toEqual({ kind: 'area', area: 'A', alsoC: true });
  });

  it('앞 영역에 남은 문항이 있으면 아직 정할 수 없다', () => {
    const results = allTwo();
    delete results.B2;
    expect(startPoint(areaReports(ORDER, results))).toEqual({ kind: 'incomplete' });
  });
});

describe('recommendations (4절 표)', () => {
  const signals = (results: Results) => recommendations(results).map((x) => [x.signal, x.activities]);

  it('모두 2점이면 신호 없음', () => {
    expect(recommendations(allTwo())).toEqual([]);
  });

  it('1:1 대응 오류 → 콕콕 세기, 다시 세기 → 콕콕 세기 → 상자에 담기', () => {
    expect(signals(allTwo({ A1: r(0, 'ONE_TO_ONE_ERROR'), A2: r(1, 'RECOUNT') }))).toEqual([
      ['1:1 대응 오류', [1]],
      ['다시 세기 (집합수 미형성)', [1, 2]],
    ]);
  });

  it('B1과 B2 중 하나만 맞으면 서수·기수 혼동, 둘 다 틀리면 아니다', () => {
    expect(signals(allTwo({ B1: r(0) }))).toEqual([['서수와 기수 혼동 (두 문항 결과가 다름)', [3]]]);
    expect(signals(allTwo({ B1: r(0), B2: r(0) }))).toEqual([]);
  });

  it('C가 모두 1점 이하면 반짝 카드', () => {
    expect(signals(allTwo({ C1: r(1), C2: r(0), C3: r(1) }))).toEqual([['직관 인식 안 됨 (모두 1점 이하)', [4]]]);
    expect(signals(allTwo({ C1: r(1), C2: r(2), C3: r(1) }))).toEqual([]);
  });

  it('D1 모두 다시 세기 1점 → 상자 이어세기, D2 지연 → 수 길 걷기', () => {
    expect(signals(allTwo({ D1: r(1, 'COUNT_ALL'), D2: r(1, 'DELAYED') }))).toEqual([
      ['모두 다시 세기', [5]],
      ['다음 수 지연', [9]],
    ]);
  });

  it('E, F 신호', () => {
    expect(signals(allTwo({ A3: r(0), E1: r(1, 'SINGLE_WAY'), E2: r(0), F1: r(0), F3: r(0) }))).toEqual([
      ['6에서 못 멈춤', [2]],
      ['가르기 방법 1개 이하', [6]],
      ['10의 보수 모름', [7]],
      ['크기에 속음', [8]],
      ['숫자 읽기·비교 오류', [9]],
    ]);
  });

  it('답하지 않은(건너뛴) 문항에서는 신호를 찾지 않는다', () => {
    expect(recommendations({ A1: r(2), A2: r(2) })).toEqual([]);
  });
});
