import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * 누를 수 있는 대상의 움직임. 처음 누르면 쏙 들어가고,
 * 다시 누르면 표시는 그대로 두고 살짝 흔들린다.
 */
export function useTapAnimation(tapCount: number) {
  const scale = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tapCount === 1) {
      Animated.spring(scale, { toValue: 0.82, friction: 4, useNativeDriver: true }).start();
    } else if (tapCount > 1) {
      wiggle.setValue(0);
      Animated.sequence(
        [1, -1, 1, 0].map((toValue) =>
          Animated.timing(wiggle, { toValue, duration: 70, useNativeDriver: true }),
        ),
      ).start();
    } else {
      scale.setValue(1);
    }
  }, [tapCount, scale, wiggle]);

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  return { transform: [{ scale }, { rotate }] };
}
