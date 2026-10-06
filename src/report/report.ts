import { PARTIAL_MIN_RATIO, REACHED_MIN_RATIO } from '../scoring/config';
import { itemStatuses } from '../scoring/skip';
import { areaOf } from '../scoring/strategies';
import type { Area, ItemCode, Score, StrategyCode } from '../scoring/types';
import type { ActivityLevel, ActivityNo } from './activities';

/** 리포트에 필요한 문항 결과만 */
export interface ScoredItem {
  score: Score;
  strategyCode: StrategyCode;
}

export type Results = Partial<Record<ItemCode, ScoredItem>>;

export const AREA_LABELS: Record<Area, string> = {
  A: 'A. 수 세기',
  B: 'B. 서수·기수',
  C: 'C. 한눈에 알기',
  D: 'D. 이어세기',
  E: 'E. 모으기·가르기',
  F: 'F. 크기 비교',
};

export type Verdict = 'reached' | 'partial' | 'focus';

export const VERDICT_LABELS: Record<Verdict, string> = {
  reached: '도달',
  partial: '보완',
  focus: '집중 지도',
};

export interface AreaReport {
  area: Area;
  score: number;
  /** 영역 문항 수 × 2 (건너뛴 문항은 0점으로 들어간다) */
  max: number;
  total: number;
  /** 아직 답하지 않은 문항 수. 0이어야 판정한다. */
  pending: number;
  /** 판정. 아직 남은 문항이 있으면 null */
  verdict: Verdict | null;
}

/** 3절: 80% 이상 도달, 50~79% 보완, 50% 미만 집중 지도 */
export function verdictOf(score: number, max: number): Verdict {
  const ratio = max === 0 ? 0 : score / max;
  if (ratio >= REACHED_MIN_RATIO) return 'reached';
  if (ratio >= PARTIAL_MIN_RATIO) return 'partial';
  return 'focus';
}

/** 영역마다 점수와 판정. order는 진단 순서(그 안의 영역 순서대로 돌려준다). */
export function areaReports(order: ItemCode[], results: Results): AreaReport[] {
  const scores: Partial<Record<ItemCode, Score>> = {};
  for (const [code, r] of Object.entries(results)) scores[code as ItemCode] = r.score;
  const statuses = itemStatuses(order, scores);

  const areas = [...new Set(order.map(areaOf))];
  return areas.map((area) => {
    const codes = order.filter((c) => areaOf(c) === area);
    const score = codes.reduce((sum, c) => sum + (results[c]?.score ?? 0), 0);
    const max = codes.length * 2;
    const pending = codes.filter((c) => statuses[c] === 'pending').length;
    return { area, score, max, total: codes.length, pending, verdict: pending ? null : verdictOf(score, max) };
  });
}

/** 출발점 (4절): 선수 관계 순서에서 처음으로 도달하지 못한 영역. C는 A와 함께 할 수 있다. */
export type StartPoint =
  | { kind: 'incomplete' } // 앞 영역에 아직 답하지 않은 문항이 있어 정할 수 없다
  | { kind: 'allReached' }
  | { kind: 'area'; area: Area; alsoC: boolean };

const PREREQUISITE_ORDER: Area[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function startPoint(reports: AreaReport[]): StartPoint {
  const byArea = new Map(reports.map((r) => [r.area, r]));
  for (const area of PREREQUISITE_ORDER) {
    const r = byArea.get(area);
    if (!r) continue;
    if (r.verdict === null) return { kind: 'incomplete' };
    if (r.verdict !== 'reached') {
      const c = byArea.get('C');
      // 수 세기가 출발점이면, C도 도달하지 못했을 때 함께 하도록 알려 준다
      const alsoC = area === 'A' && c?.verdict != null && c.verdict !== 'reached';
      return { kind: 'area', area, alsoC };
    }
  }
  return { kind: 'allReached' };
}

/** 4절 표의 한 줄: 진단에서 나온 신호 → 추천 놀이 */
export interface Recommendation {
  /** 어른 화면에 보이는 신호 설명 */
  signal: string;
  /** 근거 문항 */
  items: ItemCode[];
  /** 차례대로 할 놀이 (다시 세기는 1 → 2) */
  activities: ActivityNo[];
  level: ActivityLevel;
}

/** 4절 표대로 신호를 찾는다. 답하지 않았거나 건너뛴 문항에서는 신호를 찾지 않는다. */
export function recommendations(results: Results): Recommendation[] {
  const out: Recommendation[] = [];
  const has = (code: ItemCode) => results[code] !== undefined;
  const score = (code: ItemCode) => results[code]?.score;
  const strategy = (code: ItemCode) => results[code]?.strategyCode;
  const counting: ItemCode[] = ['A1', 'A2'];

  const oneToOne = counting.filter((c) => strategy(c) === 'ONE_TO_ONE_ERROR' || score(c) === 0);
  if (oneToOne.length) {
    out.push({ signal: '1:1 대응 오류', items: oneToOne, activities: [1], level: 'concrete' });
  }
  const recount = counting.filter((c) => strategy(c) === 'RECOUNT');
  if (recount.length) {
    out.push({ signal: '다시 세기 (집합수 미형성)', items: recount, activities: [1, 2], level: 'concrete' });
  }
  if (has('A3') && score('A3') === 0) {
    out.push({ signal: '6에서 못 멈춤', items: ['A3'], activities: [2], level: 'concrete' });
  }
  if (has('B1') && has('B2') && (score('B1') === 0) !== (score('B2') === 0)) {
    out.push({ signal: '서수와 기수 혼동 (두 문항 결과가 다름)', items: ['B1', 'B2'], activities: [3], level: 'concrete' });
  }
  const c: ItemCode[] = ['C1', 'C2', 'C3'];
  const cAnswered = c.filter(has);
  if (cAnswered.length && cAnswered.every((code) => (score(code) ?? 0) <= 1)) {
    out.push({ signal: '직관 인식 안 됨 (모두 1점 이하)', items: cAnswered, activities: [4], level: 'semiConcrete' });
  }
  if (has('D1') && strategy('D1') === 'COUNT_ALL' && score('D1') === 1) {
    out.push({ signal: '모두 다시 세기', items: ['D1'], activities: [5], level: 'concrete' });
  }
  // 4절 표에는 없지만 사용자가 더하기로 했다(2026-10-06): 틀렸어도 이어세기가 아직 안 된 것은 같다.
  if (has('D1') && score('D1') === 0) {
    out.push({ signal: '이어세기 안 됨 (D1 0점)', items: ['D1'], activities: [5], level: 'concrete' });
  }
  if (has('D2') && strategy('D2') === 'DELAYED') {
    out.push({ signal: '다음 수 지연', items: ['D2'], activities: [9], level: 'semiConcrete' });
  }
  if (has('E1') && (score('E1') ?? 0) <= 1) {
    out.push({ signal: '가르기 방법 1개 이하', items: ['E1'], activities: [6], level: 'concrete' });
  }
  if (has('E2') && score('E2') === 0) {
    out.push({ signal: '10의 보수 모름', items: ['E2'], activities: [7], level: 'semiConcrete' });
  }
  if (has('F1') && score('F1') === 0) {
    out.push({ signal: '크기에 속음', items: ['F1'], activities: [8], level: 'concrete' });
  }
  const f: ItemCode[] = ['F2', 'F3'];
  const fWrong = f.filter((code) => has(code) && score(code) === 0);
  if (fWrong.length) {
    out.push({ signal: '숫자 읽기·비교 오류', items: fWrong, activities: [9], level: 'numeral' });
  }
  return out;
}
