import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AdultGate } from '../../src/components/AdultGate';

/** 아이 화면 묶음. 어느 화면에서든 오른쪽 위 모서리를 3초 누르면 어른 화면으로 간다. */
export default function ChildLayout() {
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <AdultGate onOpen={() => router.push('/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
