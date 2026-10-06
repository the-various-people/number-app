import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { GateFace, gateStyles, HOLD_MS } from './gate';
import { guardLongPress } from './touchGuard';

interface Props {
  onOpen(): void;
}

/**
 * 웹(태블릿 브라우저)용: 아이 화면 오른쪽 위 모서리를 3초 동안 누르면 어른 화면으로 넘어간다.
 *
 * Pressable 길게 누르기를 쓰지 않는다. 태블릿 브라우저는 길게 누르면 글자 범위 선택·메뉴를 시작하면서
 * 누르기 취소(touchcancel/pointercancel)를 보내, 3초가 되기 전에 끊긴다(2026-10-06 사용자 신고).
 * 그래서 이 칸에서는 브라우저의 길게 누르기 동작을 막고(touchstart preventDefault, contextmenu 막기,
 * 선택·말풍선 끄기), 손가락이 닿고 떨어지는 것을 직접 받아 시간을 잰다. 앱은 AdultGate.native.tsx.
 */
export function AdultGate({ onOpen }: Props) {
  const ref = useRef<View>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const el = ref.current as unknown as HTMLElement | null;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      progress.stopAnimation();
      progress.setValue(0);
    };
    const start = (e: Event) => {
      // 브라우저가 이 누르기를 범위 선택·메뉴·흉내 마우스 이벤트로 가져가지 않게 한다
      e.preventDefault();
      if (timer) return;
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false }).start();
      timer = setTimeout(() => {
        timer = null;
        progress.setValue(0);
        onOpenRef.current();
      }, HOLD_MS);
    };
    const block = (e: Event) => e.preventDefault();

    const unguard = guardLongPress(el);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('contextmenu', block);
    return () => {
      cancel();
      unguard();
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', cancel);
      el.removeEventListener('touchcancel', cancel);
      el.removeEventListener('mousedown', start);
      el.removeEventListener('mouseup', cancel);
      el.removeEventListener('mouseleave', cancel);
      el.removeEventListener('contextmenu', block);
    };
  }, [progress]);

  return (
    <View ref={ref} style={gateStyles.corner} accessibilityLabel="어른 화면 (3초 동안 누르기)">
      <GateFace progress={progress} />
    </View>
  );
}
