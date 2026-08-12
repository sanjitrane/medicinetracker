import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing, typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Rendered before the label — an icon or emoji. */
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  leading,
  style,
  accessibilityHint,
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant].container,
        pressed && isInteractive && styles.pressed,
        !isInteractive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text style={[styles.label, variantStyles[variant].label]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leading: {
    justifyContent: 'center',
  },
  label: {
    ...typography.subheading,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; label: { color: string } }
> = {
  primary: {
    container: { backgroundColor: colors.primary },
    label: { color: colors.textInverse },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { color: colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    label: { color: colors.textInverse },
  },
};
