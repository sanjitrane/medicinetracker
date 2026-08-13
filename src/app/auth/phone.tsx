import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { isValidPhoneNumber, normalizePhoneNumber } from '@/features/auth/utils/phoneNumber';

/**
 * phase2_architecture.md #4.1: first screen of the auth flow. Only
 * validates format and kicks off `requestOtp` — verification (and thus
 * whether the number is real) happens entirely in `AuthService`.
 */
export default function PhoneNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();

  const requestOtp = useAuthStore((state) => state.requestOtp);
  const isRequestingOtp = useAuthStore((state) => state.isRequestingOtp);
  const requestError = useAuthStore((state) => state.error);

  const handleContinue = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setValidationError('Enter a valid phone number, including country code (e.g. +91 98765 43210).');
      return;
    }
    setValidationError(undefined);

    const normalized = normalizePhoneNumber(phoneNumber);
    await requestOtp(normalized);
    router.push({ pathname: '/auth/otp', params: { phone: normalized } });
  };

  return (
    <Screen scrollable>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Enter your phone number to get started. We&apos;ll send you a code to confirm it&apos;s
        you.
      </Text>

      <Input
        label="Phone Number"
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        autoFocus
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        error={validationError ?? requestError ?? undefined}
        containerStyle={styles.input}
      />

      <Button
        label="Continue"
        onPress={handleContinue}
        loading={isRequestingOtp}
        style={styles.action}
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
  input: {
    marginTop: spacing.xl,
  },
  action: {
    marginTop: spacing.lg,
  },
});
