import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { promptPlayer } from '../../../src/audio/player';
import { stickerFor } from '../../../src/components/stickers';
import { ITEM_CODES } from '../../../src/items/registry';
import { useSession } from '../../../src/store/session';

/** 진단 끝 화면. 정답 수와 상관없이, 해낸 문항마다 받은 스티커를 모아 보여 준다. */
export default function DiagnosisDoneScreen() {
  const { responses } = useSession();
  const earned = ITEM_CODES.filter((code) => responses[code]);

  useEffect(() => {
    promptPlayer.play('praise.done');
    return () => promptPlayer.stop();
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.board}>
        {earned.map((code) => (
          <Text key={code} style={styles.sticker}>
            {stickerFor(ITEM_CODES.indexOf(code))}
          </Text>
        ))}
      </View>
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
    fontSize: 96,
  },
});
