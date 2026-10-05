import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { promptPlayer } from '../../src/audio/player';
import { ITEM_CODES } from '../../src/items/registry';
import { useSession } from '../../src/store/session';

/**
 * 시작 화면. 어른이 아이와 함께 ▶를 눌러 새 진단 회기를 시작한다.
 * 웹에서는 이 누르기가 있어야 음성 발문이 나온다.
 */
export default function StartScreen() {
  const { startSession } = useSession();

  const start = () => {
    promptPlayer.unlock();
    startSession();
    router.replace(`/diagnosis/${ITEM_CODES[0]}`);
  };

  return (
    <View style={styles.screen}>
      <Pressable onPress={start} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Svg width={96} height={96} viewBox="0 0 100 100">
          <Path d="M32 20 L82 50 L32 80 Z" fill="#FFFFFF" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDE7',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#66BB6A',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
