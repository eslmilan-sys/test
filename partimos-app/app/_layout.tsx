import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { color } from '@/ui/tokens';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.sand100 },
        }}
      />
    </>
  );
}
