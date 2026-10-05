import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

const HOLD_MS = 3000;
const SIZE = 88;

interface Props {
  onOpen(): void;
}

/**
 * 아이 화면 오른쪽 위 모서리. 3초 동안 길게 누르면 어른 화면으로 넘어간다.
 * 누르고 있는 동안만 옅은 원이 차올라 어른이 진행 상황을 알 수 있다.
 */
export function AdultGate({ onOpen }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  const start = () => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: true }).start();
  };
  const cancel = () => {
    progress.stopAnimation();
    progress.setValue(0);
  };

  return (
    <Pressable
      style={styles.corner}
      delayLongPress={HOLD_MS}
      onPressIn={start}
      onPressOut={cancel}
      onLongPress={onOpen}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            opacity: progress.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.25, 0.5] }),
            transform: [{ scale: progress }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: SIZE * 0.7,
    height: SIZE * 0.7,
    borderRadius: SIZE,
    backgroundColor: '#90A4AE',
  },
});
