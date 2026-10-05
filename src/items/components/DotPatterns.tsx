import { Animated, StyleSheet, View } from 'react-native';

import { useTapAnimation } from './useTapAnimation';

const DOT_COLOR = '#E53935';

interface TenFrameProps {
  /** 칸 한 변 길이 */
  cell: number;
  /** 위 줄 왼쪽부터 채운 칸 수 */
  filled: number;
  /** false면 빈 격자만 보인다 (C 영역에서 점을 숨길 때) */
  showDots: boolean;
  /** 빈칸을 누를 수 있게 할 때: 빈칸 번호(채운 칸 다음부터 0, 1, ...)별 누른 횟수 */
  emptyTapCounts?: number[];
  onTapEmpty?(emptyIndex: number): void;
  disabled?: boolean;
}

/** 10격자 (2줄 × 5칸). 위 줄 5칸을 먼저 채운다. */
export function TenFrame({ cell, filled, showDots, emptyTapCounts, onTapEmpty, disabled }: TenFrameProps) {
  const dot = cell * 0.7;
  return (
    <View style={[styles.frame, { borderRadius: cell * 0.12 }]}>
      {[0, 5].map((rowStart) => (
        <View key={rowStart} style={styles.frameRow}>
          {Array.from({ length: 5 }, (_, col) => {
            const i = rowStart + col;
            const emptyIndex = i - filled;
            return (
              <View key={col} style={[styles.cell, { width: cell, height: cell }]}>
                {i < filled ? (
                  showDots && <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }]} />
                ) : (
                  emptyTapCounts &&
                  onTapEmpty && (
                    <EmptyCell
                      size={cell}
                      tapCount={emptyTapCounts[emptyIndex] ?? 0}
                      disabled={!!disabled}
                      onTap={() => onTapEmpty(emptyIndex)}
                    />
                  )
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** 누를 수 있는 빈칸. 처음 누르면 연한 동그라미가 생기고, 다시 눌러도 꺼지지 않는다(흔들림만). */
function EmptyCell({ size, tapCount, disabled, onTap }: { size: number; tapCount: number; disabled: boolean; onTap(): void }) {
  const { transform } = useTapAnimation(tapCount);
  const mark = size * 0.6;
  return (
    // 웹에서 Pressable onPressIn은 늦게 오거나 빠질 수 있어 responder grant로 받는다 (CountObject와 같음).
    <View
      style={styles.fill}
      onStartShouldSetResponder={() => !disabled}
      onResponderGrant={onTap}
    >
      <Animated.View style={[styles.center, { pointerEvents: 'none', transform }]}>
        {tapCount > 0 && (
          <View style={[styles.mark, { width: mark, height: mark, borderRadius: mark / 2 }]} />
        )}
      </Animated.View>
    </View>
  );
}

/** 주사위 눈 위치 (3×3 칸의 열, 행) */
const DICE_PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

/** 주사위 한 면 (1~6) */
export function Dice({ size, count, showDots }: { size: number; count: number; showDots: boolean }) {
  const dot = size * 0.18;
  return (
    <View style={[styles.dice, { width: size, height: size, borderRadius: size * 0.16 }]}>
      {showDots &&
        (DICE_PIPS[count] ?? []).map(([col, row], i) => (
          <View
            key={i}
            style={[
              styles.dot,
              styles.pip,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                left: size * (0.22 + col * 0.28) - dot / 2,
                top: size * (0.22 + row * 0.28) - dot / 2,
              },
            ]}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 3,
    borderColor: '#455A64',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  frameRow: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1.5,
    borderColor: '#90A4AE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    backgroundColor: DOT_COLOR,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    backgroundColor: '#BBDEFB',
    borderWidth: 3,
    borderColor: '#1E88E5',
  },
  dice: {
    borderWidth: 3,
    borderColor: '#455A64',
    backgroundColor: '#FFFFFF',
  },
  pip: {
    position: 'absolute',
  },
});
