import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, typography } from '@/constants/theme';
import { configureNotifications } from '@/features/notifications/services/notificationScheduler';

export default function RootLayout() {
  useEffect(() => {
    // Safe at launch (architecture.md #36) — sets presentation behaviour
    // only, never prompts for permission.
    configureNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            ...typography.subheading,
            color: colors.text,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Medicine Tracker' }} />
        <Stack.Screen name="today" options={{ title: "Today's Doses" }} />
        <Stack.Screen name="medicines/add" options={{ title: 'Add Medicine' }} />
        <Stack.Screen name="medicines/manual" options={{ title: 'Enter Manually' }} />
        <Stack.Screen name="medicines/[id]" options={{ title: 'Medicine Details' }} />
        <Stack.Screen name="scanner/index" options={{ title: 'Scan Medicine' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
