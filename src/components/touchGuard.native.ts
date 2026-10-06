/** 앱에는 브라우저의 범위 선택·말풍선이 없어 할 일이 없다. 웹은 touchGuard.ts. */
export function guardLongPress(_el: unknown): () => void {
  return () => {};
}
