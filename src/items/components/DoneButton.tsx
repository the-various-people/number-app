import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  /** 발문이 끝나면 나타난다 */
  visible: boolean;
  /** 아직 아무것도 고르지 않았으면 흐리게 두고 누를 수 없다 */
  disabled: boolean;
  onPress(): void;
}

const MAX_SIZE = 120;

/** "다 했어요" 버튼. 오른쪽 아래의 글자 없는 큰 ✓ (2단계 결정 5). */
export function DoneButton({ visible, disabled, onPress }: Props) {
  const appear = useRef(new Animated.Value(0)).current;
  // 휴대폰 가로 화면처럼 낮은 화면에서는 줄여서 바구니·접시를 가리지 않게 한다.
  const { height } = useWindowDimensions();
  const size = Math.min(MAX_SIZE, height * 0.2);
  const inset = Math.min(32, height * 0.04);

  useEffect(() => {
    if (visible) Animated.spring(appear, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [visible, appear]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrap, { right: inset, bottom: inset, opacity: disabled ? 0.35 : 1, transform: [{ scale: appear }] }]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && styles.pressed,
        ]}
      >
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100" style={{ pointerEvents: 'none' }}>
          <Path d="M18 52 L42 76 L84 26" stroke="#FFFFFF" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43A047',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});
