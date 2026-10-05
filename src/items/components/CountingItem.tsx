import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { promptPlayer } from '../../audio/player';
import { evaluateCounting, type TouchEvent } from '../../scoring';
import type { NewItemResponse } from '../../store/session';
import type { CountingItemDef } from '../types';
import { AnswerCards } from './AnswerCards';
import { CountObject } from './CountObject';

interface Props {
  def: CountingItemDef;
  sticker: string;
  onAnswer(response: NewItemResponse): void;
}

/**
 * 대상 세기 문항 (A1, A2). 아이 화면이므로 글자가 없다.
 * 대상은 발문 중에도 누를 수 있고, 답 카드는 발문이 끝난 뒤에 열린다.
 * 정오 피드백 없이 어떤 답이든 같은 칭찬과 스티커를 준다.
 */
export function CountingItem({ def, sticker, onAnswer }: Props) {
  const { width, height } = useWindowDimensions();
  const startRef = useRef(Date.now());
  const promptEndRef = useRef<number | null>(null);
  const [touches, setTouches] = useState<TouchEvent[]>([]);
  const [promptDone, setPromptDone] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const stickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    startRef.current = Date.now();
    promptPlayer.play(def.promptId).then(() => {
      if (!active) return;
      promptEndRef.current = Date.now() - startRef.current;
      setPromptDone(true);
    });
    return () => {
      active = false;
      promptPlayer.stop();
    };
  }, [def.promptId]);

  const tapCounts = Array.from({ length: def.count }, (_, i) => touches.filter((t) => t.targetIndex === i).length);

  const handleTap = (targetIndex: number) => {
    if (answer !== null) return;
    const tMs = Date.now() - startRef.current;
    setTouches((prev) => [...prev, { targetIndex, tMs }]);
  };

  const handleAnswer = (value: number) => {
    if (answer !== null || promptEndRef.current === null) return;
    const answeredAtMs = Date.now() - startRef.current;
    const promptEndMs = promptEndRef.current;
    const result = evaluateCounting({ objectCount: def.count, answer: value, touches, promptEndMs, answeredAtMs });
    setAnswer(value);
    onAnswer({
      itemCode: def.code,
      answer: value,
      correct: result.correct,
      autoStrategyCode: result.autoStrategy,
      responseMs: result.responseMs,
      promptEndMs,
      touches,
    });
    promptPlayer.play('praise.neutral');
    Animated.spring(stickerAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  // 흩어 놓을 때 대상 크기. 무대는 화면 높이의 약 절반이다.
  const scatteredSize = Math.min(130, height * 0.16, width / 9);

  const renderObject = (count: number, i: number, size: number) => (
    <CountObject
      shape={def.object}
      size={size}
      tapCount={count}
      disabled={answer !== null}
      onTap={() => handleTap(i)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        {def.layout === 'row' ? (
          <View style={styles.row}>
            {tapCounts.map((count, i) => (
              <View key={i}>{renderObject(count, i, Math.min(150, (width - 96) / def.count - 16))}</View>
            ))}
          </View>
        ) : (
          // 무대 크기를 재지 않고 비율로 놓는다. 웹에서는 화면이 바뀔 때 onLayout이 오지 않는 경우가 있다.
          tapCounts.map((count, i) => {
            const [fx, fy] = def.positions?.[i] ?? [0.5, 0.5];
            return (
              <View
                key={i}
                style={[
                  styles.placed,
                  { left: `${fx * 100}%`, top: `${fy * 100}%`, marginLeft: -scatteredSize / 2, marginTop: -scatteredSize / 2 },
                ]}
              >
                {renderObject(count, i, scatteredSize)}
              </View>
            );
          })
        )}
        <Animated.View style={[styles.sticker, { opacity: stickerAnim, transform: [{ scale: stickerAnim }] }]}>
          <Text style={styles.stickerEmoji}>{sticker}</Text>
        </Animated.View>
      </View>
      <AnswerCards {...def.answerCards} disabled={!promptDone} selected={answer} onSelect={handleAnswer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 48,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  placed: {
    position: 'absolute',
  },
  sticker: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  stickerEmoji: {
    fontSize: 96,
  },
});
