import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

interface Props {
  size: number;
  /** 지금까지 이 사과를 누른 횟수 */
  tapCount: number;
  disabled: boolean;
  onTap(): void;
}

/** 임시 SVG 사과. 처음 누르면 쏙 들어가고, 다시 누르면 표시는 그대로 두고 살짝 흔들린다. */
export function Apple({ size, tapCount, disabled, onTap }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const marked = tapCount > 0;

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

  return (
    // Pressable은 웹에서 onPressIn을 50ms 늦게 부르고 그 전에 손을 떼면 건너뛴다.
    // 짧은 톡 터치도 빠짐없이 그 순간에 기록하도록 responder grant(터치 시작)로 받는다.
    <View onStartShouldSetResponder={() => !disabled} onResponderGrant={onTap}>
      {/* SVG가 터치를 가로채지 않게 막는다. */}
      <Animated.View style={{ width: size, height: size, pointerEvents: 'none', transform: [{ scale }, { rotate }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M50 30 C35 18 10 25 12 52 C14 78 32 94 50 88 C68 94 86 78 88 52 C90 25 65 18 50 30 Z"
            fill={marked ? '#B71C1C' : '#E53935'}
          />
          <Path d="M50 30 Q52 18 58 10" stroke="#5D4037" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M56 18 C64 8 78 10 80 14 C74 22 62 24 56 18 Z" fill="#43A047" />
          <Ellipse cx={32} cy={48} rx={6} ry={10} fill="#FFFFFF" opacity={marked ? 0.15 : 0.35} />
          {marked && <Circle cx={50} cy={60} r={13} fill="#FFFFFF" opacity={0.9} />}
        </Svg>
      </Animated.View>
    </View>
  );
}
