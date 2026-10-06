/**
 * 아이 나이. DESIGN.md 7절대로 생년월(YYYY-MM)만 받는다.
 * 날짜를 모르므로 만 나이는 "그 달이 지나면 한 살"로 계산한다.
 */

/** 가장 이른 생년. 미취학 아동 앱이라 넉넉히 잡는다. */
const MIN_YEAR = 2010;

/**
 * 어른이 입력한 생년월을 YYYY-MM으로 바꾼다. 잘못된 값이면 null.
 * "2020-05", "2020-5", "2020.05", "2020/5", "202005", "2020년 5월"을 모두 받는다.
 */
export function normalizeBirthMonth(input: string, today: Date = new Date()): string | null {
  const digits = input.trim().match(/^(\d{4})\D*(\d{1,2})\D*$/);
  if (!digits) return null;
  const year = Number(digits[1]);
  const month = Number(digits[2]);
  if (month < 1 || month > 12 || year < MIN_YEAR) return null;
  // 미래의 달은 받지 않는다
  if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) return null;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** at 시점의 만 나이 (년, 개월) */
export function ageAt(birthMonth: string, at: Date): { years: number; months: number } {
  const [year, month] = birthMonth.split('-').map(Number);
  const total = (at.getFullYear() - year) * 12 + (at.getMonth() + 1 - month);
  const safe = Math.max(0, total);
  return { years: Math.floor(safe / 12), months: safe % 12 };
}

/** 어른 화면 표시: "만 5세 3개월" */
export function formatAge(birthMonth: string, at: Date): string {
  const { years, months } = ageAt(birthMonth, at);
  return months ? `만 ${years}세 ${months}개월` : `만 ${years}세`;
}
