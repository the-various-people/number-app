/**
 * 웹에서 길게 눌렀을 때 브라우저가 하는 일(글자 범위 선택, 돋보기·말풍선 메뉴)을 그 요소 안에서 끈다.
 * 아이 화면 전체와 어른 화면으로 가는 모서리에 쓴다. 글자 입력 칸이 있는 곳(어른 화면)에는 쓰지 않는다
 * (iPad Safari는 user-select: none 아래의 입력 칸에 글자가 안 써질 수 있다).
 * 돌려주는 함수를 부르면 원래대로 돌린다. 앱에서는 touchGuard.native.ts(아무 일도 안 함).
 */
export function guardLongPress(el: HTMLElement): () => void {
  const props = ['user-select', '-webkit-user-select', '-webkit-touch-callout'] as const;
  const before = props.map((p) => el.style.getPropertyValue(p));
  for (const p of props) el.style.setProperty(p, 'none');
  const block = (e: Event) => e.preventDefault();
  el.addEventListener('contextmenu', block);
  el.addEventListener('selectstart', block);
  return () => {
    props.forEach((p, i) => el.style.setProperty(p, before[i]));
    el.removeEventListener('contextmenu', block);
    el.removeEventListener('selectstart', block);
  };
}
