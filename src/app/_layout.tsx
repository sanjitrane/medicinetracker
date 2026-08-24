import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { configureNotifications } from '@/features/notifications/services/notificationScheduler';

// Keep the native splash up until the persisted session has been read —
// otherwise there's a one-frame flash of the auth screens (or the app)
// before Stack.Protected knows which one is actually correct.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function DashboardTitle() {
  return (
    <View style={headerStyles.row}>
      <Image source={require('../../assets/icon.png')} style={headerStyles.logo} />
      <Text style={headerStyles.title}>Medicine Tracker</Text>
    </View>
  );
}

export default function RootLayout() {
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    // Safe at launch (architecture.md #36) — sets presentation behaviour
    // only, never prompts for permission.
    configureNotifications();
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isRestoring) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isRestoring]);

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
        {/*
          phase2_architecture.md #19: Stack.Protected reactively swaps which
          group is reachable as `isAuthenticated` changes — no manual
          redirects. Unauthenticated users can only reach `auth/*`;
          authenticated users can reach everything else.
        */}
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="index" options={{ title: 'Medicine Tracker' }}>
            <Stack.Title asChild>
              <DashboardTitle />
            </Stack.Title>
          </Stack.Screen>
          <Stack.Screen name="today" options={{ title: "Today's Doses" }} />
          <Stack.Screen name="medicines/add" options={{ title: 'Add Medicine' }} />
          <Stack.Screen name="medicines/manual" options={{ title: 'Enter Manually' }} />
          <Stack.Screen name="medicines/[id]" options={{ title: 'Medicine Details' }} />
          <Stack.Screen name="scanner/index" options={{ title: 'Scan Medicine' }} />
          <Stack.Screen name="patients/index" options={{ title: 'Patients' }} />
          <Stack.Screen name="patients/create" options={{ title: 'Add Patient' }} />
        </Stack.Protected>

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="auth/phone" options={{ title: 'Sign In' }} />
          <Stack.Screen name="auth/otp" options={{ title: 'Verify' }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 7,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
});
