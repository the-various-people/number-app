import { newId } from '../ids';

describe('newId', () => {
  it('종류를 앞에 붙이고, 매번 다르다', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId('child')));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id.startsWith('child-')).toBe(true);
  });
});
