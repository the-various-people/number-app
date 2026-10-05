/** 문항 화면 주소. 낼 문항이 없으면 끝 화면. */
export const diagnosisPath = (code: string | null) =>
  code ? (`/diagnosis/${code}` as const) : ('/diagnosis/done' as const);
