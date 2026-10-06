import type { ItemResponse, Session } from '../../db/types';
import { createWebRepository, memoryStorage } from '../../db/webRepository';
import { toCsv } from '../csv';
import { collectRows, exportFileName, HEADER } from '../records';

describe('toCsv', () => {
  it('엑셀용 BOM을 붙이고 줄은 CRLF로 나눈다', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('﻿a,1\r\nb,2\r\n');
  });

  it('쉼표·따옴표·줄바꿈이 든 칸은 따옴표로 감싼다', () => {
    expect(toCsv([['1, 2', '그는 "네"', '첫 줄\n둘째 줄']])).toBe(
      '﻿"1, 2","그는 ""네""","첫 줄\n둘째 줄"\r\n',
    );
  });

  it('참거짓은 O/X, 빈 값은 빈칸', () => {
    expect(toCsv([[true, false, null, undefined]])).toBe('﻿O,X,,\r\n');
  });

  it('수식처럼 시작하는 글은 엑셀이 수식으로 읽지 않게 막는다', () => {
    expect(toCsv([['=1+1', '+82', '@x', '-메모']])).toBe("﻿'=1+1,'+82,'@x,'-메모\r\n");
    expect(toCsv([[-3]])).toBe('﻿-3\r\n');
  });
});

const session = (id: string, childId: string | null, startedAt: number): Session => ({
  id,
  childId,
  type: 'pre',
  startedAt,
  adultRole: 'teacher',
});

const response = (sessionId: string, itemCode: 'A1' | 'A2', score: 0 | 1 | 2): ItemResponse => ({
  id: `${sessionId}-${itemCode}`,
  sessionId,
  itemCode,
  answer: 5,
  correct: score > 0,
  autoStrategyCode: 'COUNT_EACH',
  strategyOverride: null,
  strategyCode: 'COUNT_EACH',
  score,
  helped: false,
  responseMs: 3240,
  note: '손가락으로 짚음',
  promptEndMs: 4000,
  touches: [{ targetIndex: 0, tMs: 100 }],
});

describe('collectRows', () => {
  it('아이마다 오래된 진단부터, 문항은 진단 순서대로 모은다. 지운 아이·진단은 빠진다.', async () => {
    const repo = createWebRepository(memoryStorage());
    await repo.saveChild({ id: 'c1', nickname: '하늘', birthMonth: '2021-05', createdAt: 1 });
    await repo.saveChild({ id: 'c2', nickname: '지운 아이', birthMonth: '2020-01', createdAt: 2 });
    await repo.createSession(session('new', 'c1', Date.UTC(2026, 9, 6, 1)));
    await repo.createSession(session('old', 'c1', Date.UTC(2026, 9, 5, 1)));
    await repo.createSession(session('gone', 'c1', Date.UTC(2026, 9, 4, 1)));
    await repo.createSession(session('c2s', 'c2', Date.UTC(2026, 9, 5, 1)));
    await repo.saveResponse(response('new', 'A2', 1));
    await repo.saveResponse(response('new', 'A1', 2));
    await repo.saveResponse(response('old', 'A1', 0));
    await repo.saveResponse(response('gone', 'A1', 2));
    await repo.saveResponse(response('c2s', 'A1', 2));
    await repo.deleteSession('gone', 9);
    await repo.deleteChild('c2', 9);

    const rows = await collectRows(repo);
    expect(rows[0]).toEqual(HEADER);
    expect(rows.slice(1).map((r) => [r[0], r[5], r[12], r[17]])).toEqual([
      ['하늘', 'A1', 0, 'old'],
      ['하늘', 'A1', 2, 'new'],
      ['하늘', 'A2', 1, 'new'],
    ]);
    const first = rows[1];
    expect(first[1]).toBe('2021-05');
    expect(first[2]).toBe('만 5세 5개월');
    expect(first[4]).toBe('교사');
    expect(first[7]).toBe('5'); // 정답
    expect(first[14]).toBe(3.2); // 응답 시간(초)
    expect(first[16]).toBe('손가락으로 짚음');
  });

  it('기록이 없으면 머리줄만', async () => {
    expect(await collectRows(createWebRepository(memoryStorage()))).toEqual([HEADER]);
  });
});

describe('exportFileName', () => {
  it('날짜가 들어간다', () => {
    expect(exportFileName(new Date(2026, 9, 6, 15))).toBe('수개념진단_기록_2026-10-06.csv');
  });
});
