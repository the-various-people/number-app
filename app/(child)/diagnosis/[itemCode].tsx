import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { stickerFor } from '../../../src/components/stickers';
import { ChoiceItem } from '../../../src/items/components/ChoiceItem';
import { CountingItem } from '../../../src/items/components/CountingItem';
import { getItem, ITEM_CODES } from '../../../src/items/registry';
import { diagnosisPath } from '../../../src/navigation';
import { nextItem } from '../../../src/scoring';
import { scoresOf, useSession, type NewItemResponse } from '../../../src/store/session';

/** 답한 뒤 칭찬과 스티커를 보여 주고 다음 문항으로 넘어가기까지 */
const ADVANCE_DELAY_MS = 1800;

/** 아이 화면: 진단 문항 하나. 진행 막대만 보이고 점수는 보이지 않는다. */
export default function DiagnosisItemScreen() {
  const { itemCode } = useLocalSearchParams<{ itemCode: string }>();
  const { responses, statuses, attempts, saveResponse } = useSession();
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const def = getItem(itemCode);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  if (!def) return <Redirect href="/" />;

  const handleAnswer = (input: NewItemResponse) => {
    const saved = saveResponse(input);
    const next = nextItem(ITEM_CODES, { ...scoresOf(responses), [saved.itemCode]: saved.score });
    advanceTimer.current = setTimeout(() => router.replace(diagnosisPath(next)), ADVANCE_DELAY_MS);
  };

  // 다시 하기마다 key가 바뀌어 문항 화면의 상태가 처음으로 돌아간다.
  const key = `${def.code}-${attempts[def.code] ?? 0}`;
  const sticker = stickerFor(ITEM_CODES.indexOf(def.code));
  const finished = ITEM_CODES.filter((code) => statuses[code] !== 'pending').length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(finished / ITEM_CODES.length) * 100}%` }]} />
      </View>
      {def.kind === 'counting' ? (
        <CountingItem key={key} def={def} sticker={sticker} onAnswer={handleAnswer} />
      ) : (
        <ChoiceItem key={key} def={def} sticker={sticker} onAnswer={handleAnswer} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFDE7',
  },
  progressTrack: {
    height: 12,
    marginTop: 16,
    marginHorizontal: 120,
    borderRadius: 6,
    backgroundColor: '#ECEFF1',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#66BB6A',
  },
});
