/**
 * 새 기록의 id. 여러 기기·계정의 기록을 나중에 합쳐도 겹치지 않도록 무작위 값을 쓴다.
 * 앞에 종류를 붙여 두면 기록을 눈으로 볼 때 알아보기 쉽다 (예: child-1f3a…).
 * 이미 저장된 예전 id(child-1728…처럼 시각으로 만든 것)는 그대로 쓴다.
 */
export function newId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  // randomUUID가 없는 환경(일부 오래된 브라우저·http 주소)
  const random = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
