import { ageAt, formatAge, normalizeBirthMonth } from '../age';

const TODAY = new Date(2026, 9, 5); // 2026년 10월 5일

describe('normalizeBirthMonth', () => {
  it('여러 가지 쓰는 법을 YYYY-MM으로 바꾼다', () => {
    for (const input of ['2021-05', '2021-5', '2021.05', '2021/5', '202105', '2021년 5월', ' 2021-05 ']) {
      expect(normalizeBirthMonth(input, TODAY)).toBe('2021-05');
    }
  });

  it('잘못된 값은 null', () => {
    for (const input of ['', '2021', '2021-13', '2021-0', '21-05', '1999-05', 'abcd-ef', '2021-05-03']) {
      expect(normalizeBirthMonth(input, TODAY)).toBeNull();
    }
  });

  it('미래의 달은 받지 않는다', () => {
    expect(normalizeBirthMonth('2026-10', TODAY)).toBe('2026-10');
    expect(normalizeBirthMonth('2026-11', TODAY)).toBeNull();
    expect(normalizeBirthMonth('2027-01', TODAY)).toBeNull();
  });
});

describe('ageAt', () => {
  it('그 달이 지나면 한 살', () => {
    expect(ageAt('2021-10', TODAY)).toEqual({ years: 5, months: 0 });
    expect(ageAt('2021-11', TODAY)).toEqual({ years: 4, months: 11 });
    expect(ageAt('2021-05', TODAY)).toEqual({ years: 5, months: 5 });
  });

  it('표시', () => {
    expect(formatAge('2021-10', TODAY)).toBe('만 5세');
    expect(formatAge('2021-05', TODAY)).toBe('만 5세 5개월');
  });
});
