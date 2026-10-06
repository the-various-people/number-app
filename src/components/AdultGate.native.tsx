import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { GateFace, gateStyles, HOLD_MS } from './gate';

interface Props {
  onOpen(): void;
}

/**
 * 태블릿 앱(Expo Go)용: 아이 화면 오른쪽 위 모서리를 3초 동안 길게 누르면 어른 화면으로 넘어간다.
 * 앱에서는 길게 누르기를 가로채는 브라우저가 없어 Pressable 길게 누르기로 충분하다. 웹은 AdultGate.tsx.
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
      style={gateStyles.corner}
      delayLongPress={HOLD_MS}
      onPressIn={start}
      onPressOut={cancel}
      onLongPress={onOpen}
      accessibilityLabel="어른 화면 (3초 동안 누르기)"
    >
      <GateFace progress={progress} />
    </Pressable>
  );
}
