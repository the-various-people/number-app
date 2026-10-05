/**
 * 발문 목록. 지금은 text를 TTS로 읽는다.
 * 녹음 파일이 생기면 각 항목에 file: require('../assets/audio/xxx.m4a')를 붙이고
 * player.ts에서 녹음 파일 플레이어로 바꾼다.
 */
export const PROMPTS = {
  'count.apples': { text: '사과를 하나씩 눌러서 세어 볼까? 모두 몇 개야?' },
  'count.stars': { text: '별을 하나씩 눌러서 세어 볼까? 모두 몇 개야?' },
  'order.fifthAnimal': { text: '앞에서 다섯 번째 동물을 눌러 줘. 다 했으면 초록 버튼을 눌러.' },
  'order.fiveAnimals': { text: '앞에서 동물 다섯 마리를 눌러 줘. 다 했으면 초록 버튼을 눌러.' },
  'countOn.cookies': { text: '상자에 쿠키 5개가 있어. 3개가 더 왔어. 모두 몇 개야?' },
  'compare.more': { text: '어느 쪽이 더 많아? 많은 쪽을 눌러 줘.' },
  'order.hiddenRabbit': { text: '동물들이 줄을 섰어. 가리개 밑에 1마리가 숨었어. 토끼는 앞에서 몇 번째야?' },
  'flash.look': { text: '잘 봐!' },
  'flash.howMany': { text: '점이 몇 개였지?' },
  'next.afterSeven': { text: '칠 다음에 오는 수는?' },
  'fillTen.howManyMore': { text: '열 칸을 다 채우려면 몇 개 더 있어야 해?' },
  'compare.bigger': { text: '더 큰 수를 눌러 줘.' },
  'find.seven': { text: '칠을 찾아 줘.' },
  'praise.neutral': { text: '잘했어!' },
  'praise.done': { text: '다 했어! 정말 잘했어!' },
} as const satisfies Record<string, { text: string }>;

export type PromptId = keyof typeof PROMPTS;
