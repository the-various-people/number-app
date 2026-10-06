import { formatAge } from '../children/age';
import type { Child, ItemResponse, Repository, Session } from '../db/types';
import { expectedLabel, formatAnswer, getItem, ITEM_CODES } from '../items/registry';
import { STRATEGY_LABELS } from '../scoring/strategies';
import type { Cell } from './csv';

/** 내보내기 표의 머리줄. 한 줄 = 문항 결과 하나. */
export const HEADER = [
  '아이',
  '생년월',
  '진단 때 나이',
  '진단 시작',
  '함께한 어른',
  '문항',
  '문항 설명',
  '정답',
  '답',
  '정오',
  '자동 판별 전략',
  '적용 전략',
  '점수',
  '도움 줌',
  '응답 시간(초)',
  '터치 수',
  '메모',
  '진단 id',
  '아이 id',
];

const ROLE_LABELS: Record<NonNullable<Session['adultRole']>, string> = { teacher: '교사', parent: '부모' };

const dateTime = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 회기 하나의 결과를 표의 줄로. 문항은 진단 순서대로. */
export function sessionRows(child: Child | null, session: Session, responses: ItemResponse[]): Cell[][] {
  const order = (r: ItemResponse) => ITEM_CODES.indexOf(r.itemCode);
  return [...responses]
    .sort((a, b) => order(a) - order(b))
    .map((r) => {
      const def = getItem(r.itemCode);
      return [
        child?.nickname ?? '(아이 고르지 않음)',
        child?.birthMonth ?? '',
        child ? formatAge(child.birthMonth, new Date(session.startedAt)) : '',
        dateTime(session.startedAt),
        session.adultRole ? ROLE_LABELS[session.adultRole] : '',
        r.itemCode,
        def?.label ?? '',
        def ? expectedLabel(def) : '',
        def ? formatAnswer(def, r.answer) : JSON.stringify(r.answer),
        r.correct,
        STRATEGY_LABELS[r.autoStrategyCode] ?? r.autoStrategyCode,
        STRATEGY_LABELS[r.strategyCode] ?? r.strategyCode,
        r.score,
        r.helped,
        Math.round(r.responseMs / 100) / 10,
        r.touches.length,
        r.note,
        session.id,
        child?.id ?? '',
      ];
    });
}

/**
 * 이 기기에 있는 모든 아이(지운 아이 빼고)와 "아이 고르지 않음"의 진단 결과를 모은다.
 * 나중에 계정이 생기면 저장소가 그 계정의 것만 돌려주므로 여기는 바꾸지 않아도 된다.
 */
export async function collectRows(repo: Repository): Promise<Cell[][]> {
  const children = await repo.listChildren();
  const owners: (Child | null)[] = [...children, null];
  const rows: Cell[][] = [HEADER];
  for (const child of owners) {
    const sessions = await repo.listSessions(child?.id ?? null);
    // 오래된 진단부터 적어야 표를 읽기 쉽다
    for (const session of [...sessions].reverse()) {
      rows.push(...sessionRows(child, session, await repo.listResponses(session.id)));
    }
  }
  return rows;
}

/** 저장할 파일 이름: 수개념진단_기록_2026-10-06.csv */
export function exportFileName(now: Date): string {
  return `수개념진단_기록_${dateTime(now.getTime()).slice(0, 10)}.csv`;
}
