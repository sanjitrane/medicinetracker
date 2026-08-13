import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing, typography } from '@/constants/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** e.g. a scanned field the OCR provider wasn't confident about (architecture.md #17). */
  warning?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, warning, hint, containerStyle, ...textInputProps }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, !error && warning && styles.inputWarning]}
        accessibilityLabel={label}
        {...textInputProps}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : warning ? (
        <Text style={styles.warning}>{warning}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputWarning: {
    borderColor: colors.warning,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  warning: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
