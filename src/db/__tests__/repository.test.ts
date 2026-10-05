import { fromRows, fromSessionRow, toResponseRow, toSessionRow, toTouchRows } from '../rows';
import type { ItemResponse, Session } from '../types';
import { createWebRepository, memoryStorage } from '../webRepository';

const session = (id: string, startedAt: number): Session => ({
  id,
  childId: null,
  type: 'pre',
  startedAt,
  adultRole: null,
});

const response = (overrides: Partial<ItemResponse> = {}): ItemResponse => ({
  id: 'r1',
  sessionId: 's1',
  itemCode: 'A1',
  answer: 5,
  correct: true,
  autoStrategyCode: 'RECOUNT',
  strategyOverride: null,
  strategyCode: 'RECOUNT',
  score: 1,
  helped: false,
  responseMs: 3200,
  note: '',
  promptEndMs: 4100,
  touches: [
    { targetIndex: 0, tMs: 1200 },
    { targetIndex: 1, tMs: 1700 },
  ],
  ...overrides,
});

describe('rows (SQLite 행 변환)', () => {
  it('문항 결과와 터치 기록이 행으로 갔다가 그대로 돌아온다', () => {
    const r = response({ strategyOverride: 'COUNT_EACH', strategyCode: 'COUNT_EACH', score: 2, helped: true });
    const touchRows = toTouchRows(r).reverse(); // 순서가 섞여 와도 seq로 정렬된다
    expect(fromRows(toResponseRow(r), touchRows)).toEqual(r);
  });

  it('참거짓은 0과 1로 저장한다', () => {
    const row = toResponseRow(response({ correct: false, helped: true }));
    expect(row.correct).toBe(0);
    expect(row.helped).toBe(1);
  });

  it('회기도 그대로 돌아온다', () => {
    const s = session('s1', 100);
    expect(fromSessionRow(toSessionRow(s))).toEqual(s);
  });
});

describe('createWebRepository', () => {
  it('가장 최근 회기를 찾는다', async () => {
    const repo = createWebRepository(memoryStorage());
    expect(await repo.latestSession()).toBeNull();
    await repo.createSession(session('old', 100));
    await repo.createSession(session('new', 200));
    expect((await repo.latestSession())?.id).toBe('new');
  });

  it('결과를 저장하고, 같은 id면 덮어쓰고, 지울 수 있다', async () => {
    const repo = createWebRepository(memoryStorage());
    await repo.createSession(session('s1', 100));
    await repo.saveResponse(response());
    await repo.saveResponse(response({ helped: true, score: 1 }));
    expect(await repo.listResponses('s1')).toEqual([response({ helped: true, score: 1 })]);

    await repo.deleteResponse('r1');
    expect(await repo.listResponses('s1')).toEqual([]);
  });

  it('회기마다 결과를 따로 둔다', async () => {
    const repo = createWebRepository(memoryStorage());
    await repo.saveResponse(response({ id: 'a', sessionId: 's1' }));
    await repo.saveResponse(response({ id: 'b', sessionId: 's2' }));
    expect((await repo.listResponses('s1')).map((r) => r.id)).toEqual(['a']);
  });

  it('저장된 값이 깨져 있어도 멈추지 않는다', async () => {
    const storage = memoryStorage();
    storage.setItem('number-app:sessions', '{깨진 값');
    expect(await createWebRepository(storage).latestSession()).toBeNull();
  });
});
