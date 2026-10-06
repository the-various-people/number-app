import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const HOLD_MS = 3000;
const SIZE = 88;
const ICON = 22;

interface Props {
  onOpen(): void;
}

/**
 * 아이 화면 오른쪽 위 모서리. 3초 동안 길게 누르면 어른 화면으로 넘어간다.
 * 어른이 자리를 찾을 수 있게 아주 옅은 자물쇠를 둔다(아이 눈에는 잘 띄지 않게).
 * 누르고 있는 동안 옅은 원이 차올라 어른이 진행 상황을 알 수 있다.
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
      accessibilityLabel="어른 화면 (3초 동안 누르기)"
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
      {/* SVG가 누르기를 가로채지 않게 막는다 (CLAUDE.md 구현 메모) */}
      <View style={styles.icon}>
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
          <Path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="#90A4AE" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Rect x={5} y={11} width={14} height={10} rx={2} fill="#90A4AE" />
        </Svg>
      </View>
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
    position: 'absolute',
    width: SIZE * 0.7,
    height: SIZE * 0.7,
    borderRadius: SIZE,
    backgroundColor: '#90A4AE',
  },
  icon: {
    pointerEvents: 'none',
    opacity: 0.35,
  },
});
