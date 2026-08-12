import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';

/**
 * Medicine details — placeholder for Phase 1A.
 *
 * Fills in once the store and the calculation engine exist: quantity and
 * remaining quantity, dosage, estimated finish date, expiry status and
 * notification settings, plus Edit / Delete / Mark as Finished.
 */
export default function MedicineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scrollable>
      <Card>
        <Text style={styles.title}>Medicine Details</Text>
        <Text style={styles.body}>
          This screen will show dosage, remaining quantity, the estimated finish date and
          expiry status.
        </Text>
        <Text style={styles.meta}>Medicine ID: {id}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
