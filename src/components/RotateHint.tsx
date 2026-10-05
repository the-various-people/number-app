import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

/**
 * 아이 화면을 세로로 들었을 때 덮는 그림. 글자 없이 휴대폰이 가로로 눕는 움직임을 되풀이한다.
 * 아이 화면은 가로 전용이다 (세로에서는 답 카드 1~10이 화면 밖으로 넘친다).
 */
export function RotateHint() {
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(turn, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] });

  return (
    <View style={styles.cover}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={140} height={140} viewBox="0 0 100 100" style={{ pointerEvents: 'none' }}>
          <Rect x={30} y={8} width={40} height={84} rx={8} fill="#455A64" />
          <Rect x={34} y={16} width={32} height={66} rx={3} fill="#FFFDE7" />
          <Path d="M45 87 L55 87" stroke="#B0BEC5" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Svg width={120} height={60} viewBox="0 0 100 50" style={{ pointerEvents: 'none' }}>
        <Path d="M80 10 Q50 50 20 18" stroke="#66BB6A" strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M12 26 L20 16 L30 22" stroke="#66BB6A" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: '#FFFDE7',
  },
});
