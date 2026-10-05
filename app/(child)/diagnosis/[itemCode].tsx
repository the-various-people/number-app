import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdultGate } from '../../../src/components/AdultGate';
import { CountingItem } from '../../../src/items/components/CountingItem';
import { getItem, ITEM_CODES } from '../../../src/items/registry';
import { useSession } from '../../../src/store/session';

/** 아이 화면: 진단 문항 하나. 진행 막대만 보이고 점수는 보이지 않는다. */
export default function DiagnosisItemScreen() {
  const { itemCode } = useLocalSearchParams<{ itemCode: string }>();
  const { responses, attempts, saveResponse } = useSession();
  const def = getItem(itemCode);

  if (!def) return <Redirect href="/" />;

  const done = ITEM_CODES.filter((code) => responses[code]).length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(done / ITEM_CODES.length) * 100}%` }]} />
      </View>
      <CountingItem key={attempts[def.code] ?? 0} def={def} onAnswer={saveResponse} />
      <AdultGate onOpen={() => router.push('/home')} />
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
