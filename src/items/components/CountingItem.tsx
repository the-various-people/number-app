import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { promptPlayer } from '../../audio/player';
import { evaluateCounting, type TouchEvent } from '../../scoring';
import type { NewItemResponse } from '../../store/session';
import type { CountingItemDef } from '../types';
import { AnswerCards } from './AnswerCards';
import { Apple } from './Apple';

interface Props {
  def: CountingItemDef;
  onAnswer(response: NewItemResponse): void;
}

/**
 * 대상 세기 문항. 아이 화면이므로 글자가 없다.
 * 사과는 발문 중에도 누를 수 있고, 답 카드는 발문이 끝난 뒤에 열린다.
 * 정오 피드백 없이 어떤 답이든 같은 칭찬을 한다.
 */
export function CountingItem({ def, onAnswer }: Props) {
  const { width } = useWindowDimensions();
  const startRef = useRef(Date.now());
  const promptEndRef = useRef<number | null>(null);
  const [touches, setTouches] = useState<TouchEvent[]>([]);
  const [promptDone, setPromptDone] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const sticker = useRef(new Animated.Value(0)).current;

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
    Animated.spring(sticker, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const appleSize = Math.min(150, (width - 96) / def.count - 16);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={styles.appleRow}>
          {tapCounts.map((count, i) => (
            <Apple key={i} size={appleSize} tapCount={count} disabled={answer !== null} onTap={() => handleTap(i)} />
          ))}
        </View>
        <Animated.View style={[styles.sticker, { opacity: sticker, transform: [{ scale: sticker }] }]}>
          <Text style={styles.stickerEmoji}>⭐</Text>
        </Animated.View>
      </View>
      <AnswerCards
        {...def.answerCards}
        disabled={!promptDone}
        selected={answer}
        onSelect={handleAnswer}
      />
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
  },
  appleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sticker: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 8,
    right: 48,
  },
  stickerEmoji: {
    fontSize: 96,
  },
});
