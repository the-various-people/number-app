import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AdultGate } from '../../src/components/AdultGate';
import { RotateHint } from '../../src/components/RotateHint';
import { useIsPortrait } from '../../src/items/components/layout';

/**
 * 아이 화면 묶음. 어느 화면에서든 오른쪽 위 모서리를 3초 누르면 어른 화면으로 간다.
 * 아이 화면은 가로 전용이라, 세로로 들면 돌려 달라는 그림으로 덮는다(어른 모서리는 그 위에서도 된다).
 */
export default function ChildLayout() {
  const portrait = useIsPortrait();
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {portrait && <RotateHint />}
      <AdultGate onOpen={() => router.push('/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
