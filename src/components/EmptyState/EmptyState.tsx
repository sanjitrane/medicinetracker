import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/constants/theme';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '💊',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
