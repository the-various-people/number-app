import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { BOX_TARGET, type TouchEvent } from '../../scoring';
import type { CountOnItemDef } from '../types';
import { useTapAnimation } from './useTapAnimation';

interface Props {
  def: CountOnItemDef;
  /** 상자 한 변 길이 */
  boxSize: number;
  touches: TouchEvent[];
  disabled: boolean;
  onTap(targetIndex: number): void;
}

/**
 * D1: 왼쪽에 닫힌 상자, 오른쪽에 더 온 쿠키. 상자를 누르면 열려 안의 쿠키가 보인다.
 * 쿠키 번호: 상자 안 0..boxCount-1, 더 온 쿠키는 그 뒤. 상자를 연 터치는 BOX_TARGET.
 */
export function CountOnStage({ def, boxSize, touches, disabled, onTap }: Props) {
  const opened = touches.some((t) => t.targetIndex === BOX_TARGET);
  const tapCount = (i: number) => touches.filter((t) => t.targetIndex === i).length;
  const cookie = boxSize / 3.2;
  const inBox = Array.from({ length: def.boxCount }, (_, i) => i);
  const added = Array.from({ length: def.addedCount }, (_, i) => def.boxCount + i);

  const renderCookie = (i: number) => (
    <Cookie
      key={i}
      emoji={def.object}
      size={cookie}
      tapCount={tapCount(i)}
      disabled={disabled}
      onTap={() => onTap(i)}
    />
  );

  return (
    <View style={[styles.row, { gap: boxSize * 0.25 }]}>
      {opened ? (
        <View style={[styles.openBox, { width: boxSize, height: boxSize, borderRadius: boxSize * 0.06 }]}>
          {/* 위 줄 3개, 아래 줄 2개 */}
          <View style={styles.cookieRow}>{inBox.slice(0, 3).map(renderCookie)}</View>
          <View style={styles.cookieRow}>{inBox.slice(3).map(renderCookie)}</View>
        </View>
      ) : (
        // 웹에서 Pressable onPressIn은 늦게 오거나 빠질 수 있어 responder grant로 받는다.
        <View onStartShouldSetResponder={() => !disabled} onResponderGrant={() => onTap(BOX_TARGET)}>
          <ClosedBox size={boxSize} />
        </View>
      )}
      <View style={[styles.cookieRow, { gap: cookie * 0.25 }]}>{added.map(renderCookie)}</View>
    </View>
  );
}

function ClosedBox({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, pointerEvents: 'none' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Rect x={6} y={28} width={88} height={66} rx={4} fill="#A1887F" />
        <Rect x={2} y={16} width={96} height={18} rx={4} fill="#8D6E63" />
        <Path d="M50 16 L50 94" stroke="#6D4C41" strokeWidth={6} />
        <Path d="M38 10 Q50 2 50 16 Q50 2 62 10" stroke="#E53935" strokeWidth={4} fill="none" />
      </Svg>
    </View>
  );
}

/** 처음 누르면 쏙 들어가며 흰 점이 생기고, 다시 눌러도 꺼지지 않는다(흔들림만). */
function Cookie({
  emoji,
  size,
  tapCount,
  disabled,
  onTap,
}: {
  emoji: string;
  size: number;
  tapCount: number;
  disabled: boolean;
  onTap(): void;
}) {
  const { transform } = useTapAnimation(tapCount);
  const mark = size * 0.28;
  return (
    <View onStartShouldSetResponder={() => !disabled} onResponderGrant={onTap}>
      <Animated.View style={[styles.cookie, { width: size, height: size, pointerEvents: 'none', transform }]}>
        <Text style={{ fontSize: size * 0.78 }}>{emoji}</Text>
        {tapCount > 0 && (
          <View style={[styles.mark, { width: mark, height: mark, borderRadius: mark / 2 }]} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openBox: {
    borderWidth: 6,
    borderTopWidth: 0,
    borderColor: '#8D6E63',
    backgroundColor: '#EFEBE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookieRow: {
    flexDirection: 'row',
  },
  cookie: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
});
