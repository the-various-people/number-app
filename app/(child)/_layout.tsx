import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AdultGate } from '../../src/components/AdultGate';
import { RotateHint } from '../../src/components/RotateHint';
import { guardLongPress } from '../../src/components/touchGuard';
import { useIsPortrait } from '../../src/items/components/layout';

/**
 * 아이 화면 묶음. 어느 화면에서든 오른쪽 위 모서리를 3초 누르면 어른 화면으로 간다.
 * 아이 화면은 가로 전용이라, 세로로 들면 돌려 달라는 그림으로 덮는다(어른 모서리는 그 위에서도 된다).
 * 웹에서는 길게 눌러도 글자 범위 선택·말풍선이 생기지 않게 막는다(아이 화면에는 입력 칸이 없다).
 */
export default function ChildLayout() {
  const portrait = useIsPortrait();
  const rootRef = useRef<View>(null);

  useEffect(() => {
    const el = rootRef.current as unknown as HTMLElement | null;
    return el ? guardLongPress(el) : undefined;
  }, []);

  return (
    <View ref={rootRef} style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {portrait && <RotateHint />}
      <AdultGate onOpen={() => router.push('/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
