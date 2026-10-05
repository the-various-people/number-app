import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

/** 답하면 무대 오른쪽 위에 튀어나오는 스티커. 정답과 상관없이 같다. */
export function RewardSticker({ emoji, visible }: { emoji: string; visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [visible, anim]);

  return (
    <Animated.View style={[styles.sticker, { opacity: anim, transform: [{ scale: anim }] }]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  emoji: {
    fontSize: 96,
  },
});
