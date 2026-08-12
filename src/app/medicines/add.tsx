import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';

/**
 * Entry point of the add-medicine flow.
 *
 * Both paths (scan and manual) converge on the same creation flow and the same
 * data model, so scanning is only ever a way to pre-fill the form.
 *
 * Phase 1A renders the choice; the steps themselves land in 1B (manual entry)
 * and 1D (scanner).
 */
export default function AddMedicineScreen() {
  const router = useRouter();

  return (
    <Screen scrollable>
      <Text style={styles.title}>How would you like to add it?</Text>
      <Text style={styles.subtitle}>
        Scanning fills in what it can read from the pack. You can always check and correct
        every detail before saving.
      </Text>

      <View style={styles.options}>
        <Card style={styles.option}>
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={styles.optionTitle}>Scan Medicine</Text>
          <Text style={styles.optionBody}>
            Use the camera to read the name and dates from the package.
          </Text>
          <Button
            label="Coming soon"
            variant="secondary"
            disabled
            onPress={() => {}}
            style={styles.optionAction}
          />
        </Card>

        <Card style={styles.option}>
          <Text style={styles.optionIcon}>✏️</Text>
          <Text style={styles.optionTitle}>Enter Manually</Text>
          <Text style={styles.optionBody}>
            Type in the medicine name, quantity, dosage and dates yourself.
          </Text>
          <Button
            label="Coming soon"
            variant="secondary"
            disabled
            onPress={() => {}}
            style={styles.optionAction}
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <Button label="Back to Dashboard" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  options: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  option: {
    gap: spacing.xs,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  optionBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionAction: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
