import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from '../src/store/session';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </SessionProvider>
  );
}
