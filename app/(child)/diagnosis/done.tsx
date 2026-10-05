import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { promptPlayer } from '../../../src/audio/player';
import { stickerFor } from '../../../src/components/stickers';
import { ITEM_CODES } from '../../../src/items/registry';
import { diagnosisPath } from '../../../src/navigation';
import { useSession } from '../../../src/store/session';

/** 칭찬을 듣고 스티커를 볼 시간을 준 뒤 다음 할 일을 보여 준다. */
const ACTIONS_DELAY_MS = 2500;

/**
 * 진단 끝 화면. 정답 수와 상관없이, 해낸 문항마다 받은 스티커를 모아 보여 준다.
 * 잠시 뒤 ▶(처음부터 다시)와, 어른에게 결과 보는 방법을 알려 주는 안내가 나타난다.
 */
export default function DiagnosisDoneScreen() {
  const { responses, startSession } = useSession();
  const earned = ITEM_CODES.filter((code) => responses[code]);
  const actions = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    promptPlayer.play('praise.done');
    const timer = setTimeout(
      () => Animated.timing(actions, { toValue: 1, duration: 400, useNativeDriver: true }).start(),
      ACTIONS_DELAY_MS,
    );
    return () => {
      clearTimeout(timer);
      promptPlayer.stop();
    };
  }, [actions]);

  const restart = () => {
    promptPlayer.unlock();
    startSession();
    router.replace(diagnosisPath(ITEM_CODES[0]));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.board}>
        {earned.map((code) => (
          <Text key={code} style={styles.sticker}>
            {stickerFor(ITEM_CODES.indexOf(code))}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.actions, { opacity: actions }]}>
        <Pressable onPress={restart} style={({ pressed }) => [styles.replay, pressed && styles.pressed]}>
          <Svg width={64} height={64} viewBox="0 0 100 100">
            <Path d="M32 20 L82 50 L32 80 Z" fill="#FFFFFF" />
          </Svg>
        </Pressable>
      </Animated.View>

      {/* 아이가 아니라 옆의 어른을 위한 안내 */}
      <Animated.Text style={[styles.adultHint, { opacity: actions }]}>
        결과 보기: 오른쪽 위 모서리를 3초 동안 누르세요
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    backgroundColor: '#FFFDE7',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    maxWidth: 900,
    padding: 32,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  sticker: {
    fontSize: 80,
  },
  actions: {
    alignItems: 'center',
  },
  replay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#66BB6A',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  adultHint: {
    position: 'absolute',
    bottom: 24,
    fontSize: 16,
    color: '#90A4AE',
  },
});
