import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { promptPlayer } from '../../audio/player';
import { evaluateSelection, type TouchEvent } from '../../scoring';
import type { NewItemResponse } from '../../store/session';
import type { LineSelectItemDef } from '../types';
import { DoneButton } from './DoneButton';
import { RewardSticker } from './RewardSticker';
import { useItemPrompt } from './useItemPrompt';

interface Props {
  def: LineSelectItemDef;
  sticker: string;
  onAnswer(response: NewItemResponse): void;
}

/**
 * 줄 선 동물을 골라 ✓로 답하는 문항 (B1, B2). 왼쪽 깃발 쪽이 앞이다.
 * 동물은 발문 중에도 누를 수 있고, 다시 누르면 고른 것이 취소된다. 모든 터치를 기록한다.
 * ✓는 발문이 끝나면 나타나고, 하나 이상 골라야 누를 수 있다.
 */
export function LineSelectItem({ def, sticker, onAnswer }: Props) {
  const { width } = useWindowDimensions();
  const { elapsed, promptEndMs } = useItemPrompt(def.promptId);
  const [touches, setTouches] = useState<TouchEvent[]>([]);
  const [done, setDone] = useState(false);

  // 터치 횟수가 홀수면 골라진 상태
  const selected = def.animals
    .map((_, i) => i)
    .filter((i) => touches.filter((t) => t.targetIndex === i).length % 2 === 1);

  const handleTap = (targetIndex: number) => {
    if (done) return;
    const tMs = elapsed();
    setTouches((prev) => [...prev, { targetIndex, tMs }]);
  };

  const handleDone = () => {
    if (done || promptEndMs === null || selected.length === 0) return;
    const result = evaluateSelection({
      expected: def.answer,
      selected: selected.map((i) => i + 1),
      promptEndMs,
      answeredAtMs: elapsed(),
    });
    setDone(true);
    onAnswer({
      itemCode: def.code,
      answer: result.answer,
      correct: result.correct,
      autoStrategyCode: result.autoStrategy,
      responseMs: result.responseMs,
      promptEndMs,
      touches,
    });
    promptPlayer.play('praise.neutral');
  };

  const slots = def.animals.length + 1; // 깃발 자리 포함
  const size = Math.min(130, (width - 120) / slots - 12);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={styles.row}>
          <Text style={{ fontSize: size * 0.7 }}>🚩</Text>
          {def.animals.map((animal, i) => (
            <AnimalSlot
              key={i}
              emoji={animal}
              size={size}
              selected={selected.includes(i)}
              disabled={done}
              onTap={() => handleTap(i)}
            />
          ))}
        </View>
        <RewardSticker emoji={sticker} visible={done} />
      </View>
      <DoneButton visible={promptEndMs !== null && !done} disabled={selected.length === 0} onPress={handleDone} />
    </View>
  );
}

/** 누르면 노란 동그라미 위로 살짝 올라온다. 다시 누르면 내려온다. */
function AnimalSlot({
  emoji,
  size,
  selected,
  disabled,
  onTap,
}: {
  emoji: string;
  size: number;
  selected: boolean;
  disabled: boolean;
  onTap(): void;
}) {
  return (
    // 웹에서 Pressable onPressIn은 늦게 오거나 빠질 수 있어 responder grant로 받는다 (CountObject와 같음).
    <View onStartShouldSetResponder={() => !disabled} onResponderGrant={onTap}>
      <View
        style={[
          styles.slot,
          { width: size, height: size, borderRadius: size / 2, pointerEvents: 'none' },
          selected && styles.slotSelected,
          selected && { transform: [{ translateY: -size * 0.15 }] },
        ]}
      >
        <Text style={{ fontSize: size * 0.7 }}>{emoji}</Text>
      </View>
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
    alignItems: 'center',
    gap: 12,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  slotSelected: {
    backgroundColor: '#FFF176',
    borderColor: '#FBC02D',
  },
});
