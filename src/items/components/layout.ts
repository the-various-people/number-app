import { useWindowDimensions } from 'react-native';

/**
 * 문항 화면 배치. 태블릿 가로 화면이 기준이지만 휴대폰 가로 화면(높이 330~430)에서도
 * 대상과 답 카드가 화면 안에 들어오도록 창 크기에서 무대 크기를 계산한다.
 * onLayout 측정값은 웹에서 오지 않는 경우가 있어 쓰지 않는다 (CLAUDE.md 구현 메모).
 */

/** 진행 막대(12) + 위 여백(16) + 여유 */
const PROGRESS_SPACE = 36;
/** 무대 위아래 여백(16 + 16) + 화면 바닥 여백(24) */
const STAGE_MARGINS = 56;
const CARD_COUNT = 10;

/** 답 카드 1~10 한 줄의 크기. 좁은 화면에서는 간격을 줄이고, 카드도 64보다 작아질 수 있다. */
export function answerCardMetrics(width: number) {
  const narrow = width < 900;
  const gap = narrow ? 6 : 12;
  const sidePadding = narrow ? 12 : 24;
  const cardWidth = Math.max(44, Math.min(110, (width - sidePadding * 2 - gap * (CARD_COUNT - 1)) / CARD_COUNT));
  return { gap, sidePadding, cardWidth, height: cardWidth * 1.3 };
}

/** 문항 무대(대상을 놓는 곳)의 높이 */
export function stageHeightFor(width: number, height: number, hasAnswerCards: boolean) {
  const cards = hasAnswerCards ? answerCardMetrics(width).height : 0;
  return Math.max(120, height - PROGRESS_SPACE - STAGE_MARGINS - cards);
}

/** 세로로 든 화면. 아이 화면은 가로 전용이라 이때는 "돌려 주세요" 그림을 띄운다. */
export function useIsPortrait() {
  const { width, height } = useWindowDimensions();
  return height > width;
}
