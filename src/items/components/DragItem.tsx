import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { promptPlayer } from '../../audio/player';
import {
  encodeMove,
  encodeSplit,
  evaluateBasket,
  evaluateSplit,
  ZONE_DONE,
  ZONE_TRAY,
  type ItemAnswer,
  type StrategyCode,
  type TouchEvent,
} from '../../scoring';
import type { NewItemResponse } from '../../store/session';
import type { DragItemDef } from '../types';
import { DoneButton } from './DoneButton';
import { stageHeightFor } from './layout';
import { RewardSticker } from './RewardSticker';
import { useItemPrompt } from './useItemPrompt';

interface Props {
  def: DragItemDef;
  sticker: string;
  onAnswer(response: NewItemResponse): void;
}

/**
 * 웹 전용 CSS touch-action: none. 없으면 손가락으로 옆으로 끌 때 브라우저가
 * "뒤로 가기" 쓸기나 화면 밀기로 가로채 문항 화면을 떠나 버린다. React Native 타입에는 없는 속성이다.
 */
const NO_BROWSER_GESTURE = Platform.OS === 'web' ? ({ touchAction: 'none' } as unknown as ViewStyle) : null;

/** 손가락을 이만큼도 움직이지 않았으면 끌기가 아니라 톡 누른 것으로 본다 */
const DRAG_MIN_PX = 6;

/**
 * 구슬을 끌어다 놓는 문항 (A3: 바구니, E1: 두 접시). 구슬은 발문 중에도 옮길 수 있고,
 * 바구니·접시에서 쟁반으로 되돌릴 수도 있다. 놓을 때마다 터치 기록에 남긴다(drag.ts).
 * ✓는 발문이 끝나면 나타난다.
 *
 * 놓은 곳은 손을 뗀 순간 각 칸의 화면 위치(measureInWindow)를 재서 정한다.
 * onLayout 값은 웹에서 오지 않을 때가 있어 쓰지 않는다 (CLAUDE.md 구현 메모).
 */
export function DragItem({ def, sticker, onAnswer }: Props) {
  const { width, height } = useWindowDimensions();
  const { elapsed, promptEndMs } = useItemPrompt(def.promptId);
  const count = def.kind === 'dragBasket' ? def.supply : def.total;
  const targetZones = def.kind === 'dragBasket' ? [1] : [1, 2];

  /** 구슬마다 지금 있는 칸 */
  const [zoneOf, setZoneOf] = useState<number[]>(() => Array(count).fill(ZONE_TRAY));
  const [touches, setTouches] = useState<TouchEvent[]>([]);
  /** E1: 지금까지 나눈 결과 (encodeSplit) */
  const [splits, setSplits] = useState<number[]>([]);
  /** E1: "다른 방법도 있을까?"를 들려주는 중 */
  const [retrying, setRetrying] = useState(false);
  const [done, setDone] = useState(false);
  /** 끌고 있는 구슬이 처음 있던 칸. 그 칸을 위로 올려야 다른 칸 위로 끌 때 가려지지 않는다. */
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const zoneRefs = useRef<Record<number, View | null>>({});
  const aliveRef = useRef(true);
  useEffect(() => () => {
    aliveRef.current = false;
  }, []);

  const inZone = (zone: number) => zoneOf.filter((z) => z === zone).length;
  const placed = targetZones.reduce((sum, z) => sum + inZone(z), 0);

  /** 손을 뗀 곳(화면 좌표)이 어느 칸 안인지. 칸 밖이면 null. */
  const zoneAt = async (x: number, y: number): Promise<number | null> => {
    const ids = [ZONE_TRAY, ...targetZones];
    const rects = await Promise.all(
      ids.map(
        (id) =>
          new Promise<{ id: number; x: number; y: number; w: number; h: number } | null>((resolve) => {
            const view = zoneRefs.current[id];
            if (!view) return resolve(null);
            view.measureInWindow((rx, ry, w, h) => resolve({ id, x: rx, y: ry, w, h }));
          }),
      ),
    );
    const hit = rects.find((r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    return hit ? hit.id : null;
  };

  const handleDrop = async (marble: number, x: number, y: number) => {
    const zone = await zoneAt(x, y);
    setDragFrom(null);
    if (zone === null || done) return;
    const tMs = elapsed();
    setZoneOf((prev) => {
      if (prev[marble] === zone) return prev;
      const next = [...prev];
      next[marble] = zone;
      return next;
    });
    if (zoneOf[marble] !== zone) setTouches((prev) => [...prev, { targetIndex: encodeMove(zone, marble), tMs }]);
  };

  const finish = (answer: ItemAnswer, correct: boolean, autoStrategy: StrategyCode, allTouches: TouchEvent[]) => {
    if (promptEndMs === null) return;
    setDone(true);
    onAnswer({
      itemCode: def.code,
      answer,
      correct,
      autoStrategyCode: autoStrategy,
      responseMs: Math.max(0, elapsed() - promptEndMs),
      promptEndMs,
      touches: allTouches,
    });
    promptPlayer.play('praise.neutral');
  };

  const handleDone = async () => {
    if (done || promptEndMs === null || retrying) return;
    const doneTouch = { targetIndex: encodeMove(ZONE_DONE, splits.length), tMs: elapsed() };
    const allTouches = [...touches, doneTouch];

    if (def.kind === 'dragBasket') {
      const result = evaluateBasket({ target: def.answer, placed: inZone(1) });
      finish(inZone(1), result.correct, result.autoStrategy, allTouches);
      return;
    }

    // E1: 두 번째부터는 접시를 비운 채 ✓를 누르면 더 없다는 뜻으로 끝낸다.
    const empty = placed === 0;
    const nextSplits = empty ? splits : [...splits, encodeSplit(inZone(1), inZone(2))];
    if (empty || nextSplits.length >= def.maxTries) {
      const result = evaluateSplit({ splits: nextSplits, total: def.total });
      finish(nextSplits, result.correct, result.autoStrategy, allTouches);
      return;
    }
    setSplits(nextSplits);
    setTouches(allTouches);
    setZoneOf(Array(count).fill(ZONE_TRAY));
    setRetrying(true);
    await promptPlayer.play(def.retryPromptId);
    if (aliveRef.current) setRetrying(false);
  };

  // 무대 크기에서 구슬 크기를 정한다. 휴대폰 가로 화면에서도 칸들이 한 줄에 들어가게 한다.
  const stageHeight = stageHeightFor(width, height, false);
  const marble = Math.min(64, stageHeight / 5, width / 18);
  const cell = marble * 1.2;
  const pad = marble * 0.35;
  const box = (cols: number, rows: number) => ({ width: cols * cell + pad * 2, height: rows * cell + pad * 2 });

  const renderMarbles = (zone: number) =>
    zoneOf.map((z, i) =>
      z === zone ? (
        <View key={i} style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center' }}>
          <Marble
            testID={`marble-${i}`}
            size={marble}
            disabled={done}
            onDragStart={() => setDragFrom(zone)}
            onDrop={(x, y) => handleDrop(i, x, y)}
          />
        </View>
      ) : null,
    );

  const lift = (zone: number) => ({ zIndex: dragFrom === zone ? 10 : 1 });
  const setRef = (zone: number) => (view: View | null) => {
    zoneRefs.current[zone] = view;
  };

  // 쟁반: A3는 10개를 5개씩 두 줄, E1은 5개를 3개·2개로
  const trayCols = def.kind === 'dragBasket' ? 5 : 3;
  const trayRows = Math.ceil(count / trayCols);

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={[styles.row, { gap: marble * 0.8 }]}>
          <View ref={setRef(ZONE_TRAY)} style={[styles.zone, styles.tray, box(trayCols, trayRows), lift(ZONE_TRAY)]}>
            {renderMarbles(ZONE_TRAY)}
          </View>
          {def.kind === 'dragBasket' ? (
            // 바구니: 10개까지 들어가게 4칸 × 3줄
            <View ref={setRef(1)} style={[styles.zone, styles.basket, box(4, 3), lift(1)]}>
              {renderMarbles(1)}
            </View>
          ) : (
            targetZones.map((zone) => (
              // 접시: 5개까지 들어가게 3칸 × 2줄, 둥글게
              <View
                key={zone}
                ref={setRef(zone)}
                style={[styles.zone, styles.plate, box(3, 2), { borderRadius: box(3, 2).height / 2 }, lift(zone)]}
              >
                {renderMarbles(zone)}
              </View>
            ))
          )}
        </View>
        <RewardSticker emoji={sticker} visible={done} />
      </View>
      <DoneButton
        visible={promptEndMs !== null && !retrying && !done}
        // 처음에는 하나라도 옮겨야 누를 수 있다. E1 두 번째부터는 빈 채로 눌러 끝낼 수 있다.
        disabled={placed === 0 && splits.length === 0}
        onPress={handleDone}
      />
    </View>
  );
}

/** 끌 수 있는 구슬. 놓으면 제자리로 돌아오고, 놓은 칸은 부모가 정한다. */
function Marble({
  testID,
  size,
  disabled,
  onDragStart,
  onDrop,
}: {
  testID: string;
  size: number;
  disabled: boolean;
  onDragStart(): void;
  onDrop(x: number, y: number): Promise<void>;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  // PanResponder는 한 번만 만들므로 최신 값은 ref로 읽는다.
  const latest = useRef({ disabled, onDragStart, onDrop });
  latest.current = { disabled, onDragStart, onDrop };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !latest.current.disabled,
        onMoveShouldSetPanResponder: () => !latest.current.disabled,
        onPanResponderGrant: () => latest.current.onDragStart(),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: async (_, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) >= DRAG_MIN_PX) await latest.current.onDrop(g.moveX, g.moveY);
          else await latest.current.onDrop(-1, -1);
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
          latest.current.onDrop(-1, -1);
        },
      }),
    [pan],
  );

  return (
    <Animated.View
      testID={testID}
      {...responder.panHandlers}
      style={[{ width: size, height: size, transform: pan.getTranslateTransform() }, NO_BROWSER_GESTURE]}
    >
      <View style={[styles.marble, { width: size, height: size, borderRadius: size / 2, pointerEvents: 'none' }]}>
        <View style={[styles.shine, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 48,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zone: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  tray: {
    backgroundColor: '#ECEFF1',
    borderRadius: 16,
  },
  basket: {
    backgroundColor: '#FFE0B2',
    borderWidth: 6,
    borderTopWidth: 0,
    borderColor: '#A1887F',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  plate: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#B0BEC5',
  },
  marble: {
    backgroundColor: '#1E88E5',
    borderWidth: 2,
    borderColor: '#1565C0',
  },
  shine: {
    position: 'absolute',
    top: '18%',
    left: '20%',
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
});
