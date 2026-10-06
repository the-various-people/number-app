/** 5절 놀이 목록. v0.1에는 implemented인 4개만 만든다 (4단계). */
export type ActivityNo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ActivityLevel = 'concrete' | 'semiConcrete' | 'numeral';

export const LEVEL_LABELS: Record<ActivityLevel, string> = {
  concrete: '구체물',
  semiConcrete: '반구체',
  numeral: '숫자',
};

export const ACTIVITIES: Record<ActivityNo, { name: string; implemented: boolean }> = {
  1: { name: '콕콕 세기', implemented: true },
  2: { name: '상자에 담기', implemented: true },
  3: { name: '기차 칸 놀이', implemented: false },
  4: { name: '반짝 카드', implemented: true },
  5: { name: '상자 이어세기', implemented: true },
  6: { name: '수 막대 자르기', implemented: false },
  7: { name: '10칸 채우기', implemented: false },
  8: { name: '짝꿍 비교', implemented: false },
  9: { name: '수 길 걷기', implemented: false },
};
