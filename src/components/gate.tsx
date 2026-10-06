import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

/** 어른 화면으로 가려면 이만큼 누르고 있어야 한다 */
export const HOLD_MS = 3000;
export const GATE_SIZE = 88;
const ICON = 22;

/**
 * 모서리 칸 안의 그림: 누르는 동안 차오르는 옅은 원 + 아주 옅은 자물쇠.
 * 자물쇠는 어른이 자리를 찾게 하려는 것이고 아이 눈에는 잘 띄지 않게 한다.
 */
export function GateFace({ progress }: { progress: Animated.Value }) {
  return (
    <>
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
    </>
  );
}

export const gateStyles = StyleSheet.create({
  corner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: GATE_SIZE,
    height: GATE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    width: GATE_SIZE * 0.7,
    height: GATE_SIZE * 0.7,
    borderRadius: GATE_SIZE,
    backgroundColor: '#90A4AE',
  },
  icon: {
    pointerEvents: 'none',
    opacity: 0.35,
  },
});
