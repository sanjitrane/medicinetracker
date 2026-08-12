import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { getGreeting } from '@/features/medicines/utils/greeting';

/**
 * Dashboard.
 *
 * Phase 1A shows the shell and the empty state only — there is no medicine
 * store yet, so there is nothing real to list. The sectioned list
 * (Needs Attention / Active / Recently Added / Finished) lands in Phase 1B once
 * the repository and store exist.
 */
export default function DashboardScreen() {
  const router = useRouter();

  const goToAddMedicine = () => router.push('/medicines/add');

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>Keep track of your medicines and refills.</Text>
      </View>

      <EmptyState
        title="No medicines yet"
        message="Add your first medicine to start tracking doses, refills and expiry dates."
        actionLabel="Add Medicine"
        onAction={goToAddMedicine}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
