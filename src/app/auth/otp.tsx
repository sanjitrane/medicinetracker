import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * phase2_architecture.md #4.1/#5: verification goes through
 * `AuthService.verifyOtp` only — there is no `if (otp === "12345")` here
 * (architecture.md #27 is explicit that the UI must never contain that
 * check) so a real OTP provider can replace the hardcoded one later without
 * touching this screen. On success `isAuthenticated` flips in the store and
 * the root layout's `Stack.Protected` guard swaps to the authenticated
 * routes on its own — no manual navigation needed here.
 */
export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');

  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const requestOtp = useAuthStore((state) => state.requestOtp);
  const isVerifyingOtp = useAuthStore((state) => state.isVerifyingOtp);
  const isRequestingOtp = useAuthStore((state) => state.isRequestingOtp);
  const error = useAuthStore((state) => state.error);

  return (
    <Screen scrollable>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>We sent a code to {phone}.</Text>
      <Text style={styles.hint}>Phase 2 uses a fixed test code: 12345.</Text>

      <Input
        label="Verification Code"
        placeholder="12345"
        keyboardType="number-pad"
        maxLength={5}
        autoFocus
        value={otp}
        onChangeText={setOtp}
        error={error ?? undefined}
        containerStyle={styles.input}
      />

      <Button
        label="Verify"
        onPress={() => verifyOtp(phone, otp)}
        loading={isVerifyingOtp}
        style={styles.action}
      />
      <Button
        label="Resend Code"
        variant="ghost"
        onPress={() => requestOtp(phone)}
        loading={isRequestingOtp}
        disabled={isVerifyingOtp}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    marginTop: spacing.xl,
  },
  action: {
    marginTop: spacing.lg,
  },
});
