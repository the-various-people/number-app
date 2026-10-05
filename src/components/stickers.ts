/** 판을 끝낼 때마다 주는 스티커 (5절 보상). 문항 대상 그림과 겹치지 않게 고른다. */
const STICKERS = ['🌈', '🎈', '🍀', '🐣', '🌻', '🚀', '🐳', '🦋', '🍦', '🎨', '🐞', '🌷', '🚂', '🦄', '🎠', '🐢'];

export function stickerFor(index: number): string {
  return STICKERS[index % STICKERS.length];
}
