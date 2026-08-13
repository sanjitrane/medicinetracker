import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { MedicineListItem } from '@/features/medicines/components/MedicineListItem';
import { useDoseConfirmationStore } from '@/features/medicines/store/doseConfirmationStore';
import { useMedicineStore } from '@/features/medicines/store/medicineStore';
import type { Medicine, MedicineStatus } from '@/features/medicines/types/medicine';
import { buildTodaysDoseItems, type TodaysDoseItem } from '@/features/medicines/utils/doseSchedule';
import { getGreeting } from '@/features/medicines/utils/greeting';
import { getMedicineStatus } from '@/features/medicines/utils/medicineCalculator';
import { usePatientStore } from '@/features/patients/store/patientStore';
import { today } from '@/utils/dateUtils';

const NEEDS_ATTENTION: ReadonlySet<MedicineStatus> = new Set([
  'EXPIRED',
  'EXPIRING_SOON',
  'FINISHING_SOON',
]);

/**
 * Dashboard.
 *
 * Sectioned by computed status (architecture.md #20): "Needs Attention"
 * bubbles anything expired, expiring soon or finishing soon above the rest,
 * so the one thing a user needs to act on today isn't buried in a flat list.
 * "Recently Added" is left out — it needs a definition of "recent" the
 * architecture doc doesn't specify, and guessing one is more likely to be
 * wrong than useful.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const todayDate = today();

  const userId = useAuthStore((state) => state.userId);

  const patients = usePatientStore((state) => state.patients);
  const selectedPatientId = usePatientStore((state) => state.selectedPatientId);
  const patientsHaveLoaded = usePatientStore((state) => state.hasLoaded);
  const loadPatients = usePatientStore((state) => state.load);
  const selectedPatient = usePatientStore((state) =>
    state.patients.find((patient) => patient.id === state.selectedPatientId)
  );

  const medicines = useMedicineStore((state) => state.medicines);
  const loadedForPatientId = useMedicineStore((state) => state.loadedForPatientId);
  const load = useMedicineStore((state) => state.load);

  const confirmations = useDoseConfirmationStore((state) => state.confirmations);
  const loadConfirmations = useDoseConfirmationStore((state) => state.load);

  useEffect(() => {
    if (!patientsHaveLoaded && userId) {
      loadPatients(userId);
    }
  }, [patientsHaveLoaded, userId, loadPatients]);

  // Reloads whenever the selected patient changes — never shows a patient's
  // medicines under a different one (phase2_architecture.md #13).
  useEffect(() => {
    if (selectedPatientId && loadedForPatientId !== selectedPatientId) {
      load(selectedPatientId);
    }
  }, [selectedPatientId, loadedForPatientId, load]);

  useEffect(() => {
    loadConfirmations(todayDate);
  }, [todayDate, loadConfirmations]);

  const todaysDoseItems = useMemo(
    () => buildTodaysDoseItems(medicines, confirmations),
    [medicines, confirmations]
  );

  const sections = useMemo(() => {
    const needsAttention: Medicine[] = [];
    const active: Medicine[] = [];
    const finished: Medicine[] = [];

    medicines.forEach((medicine) => {
      const status = getMedicineStatus(medicine);
      if (NEEDS_ATTENTION.has(status)) {
        needsAttention.push(medicine);
      } else if (status === 'FINISHED') {
        finished.push(medicine);
      } else {
        active.push(medicine);
      }
    });

    return { needsAttention, active, finished };
  }, [medicines]);

  const goToAddMedicine = () => router.push('/medicines/add');
  const goToToday = () => router.push('/today');
  const goToDetails = (id: string) =>
    router.push({ pathname: '/medicines/[id]', params: { id } });
  const goToPatients = () => router.push('/patients');

  // phase2_architecture.md #20/#21: no patients yet -> create one; patients
  // exist but none selected -> pick one. Both land back here once resolved.
  if (patientsHaveLoaded && patients.length === 0) {
    return <Redirect href="/patients/create" />;
  }
  if (patientsHaveLoaded && !selectedPatientId) {
    return <Redirect href="/patients" />;
  }

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.subtitle}>Keep track of your medicines and refills.</Text>
      </View>

      <Card onPress={goToPatients} accessibilityLabel="Switch patient" style={styles.patientSelector}>
        <View>
          <Text style={styles.patientSelectorLabel}>Patient</Text>
          <Text style={styles.patientSelectorName}>{selectedPatient?.name ?? '—'}</Text>
        </View>
        <Text style={styles.patientSelectorLink}>Switch →</Text>
      </Card>

      <TodaysDosesBanner items={todaysDoseItems} onPress={goToToday} />

      {medicines.length === 0 ? (
        <EmptyState
          title="No medicines yet"
          message="Add your first medicine to start tracking doses, refills and expiry dates."
          actionLabel="Add Medicine"
          onAction={goToAddMedicine}
        />
      ) : (
        <View style={styles.list}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Your Medicines</Text>
            <Button label="+ Add" variant="ghost" onPress={goToAddMedicine} />
          </View>

          <MedicineGroup
            title="Needs Attention"
            medicines={sections.needsAttention}
            onSelect={goToDetails}
          />
          <MedicineGroup title="Active" medicines={sections.active} onSelect={goToDetails} />
          <MedicineGroup title="Finished" medicines={sections.finished} onSelect={goToDetails} />
        </View>
      )}
    </Screen>
  );
}

/**
 * Entry point into the Phase 1D checklist (architecture.md #41). Only shown
 * once there is something scheduled today — an empty dashboard for a
 * brand-new user has nothing to check off yet.
 */
function TodaysDosesBanner({
  items,
  onPress,
}: {
  items: TodaysDoseItem[];
  onPress: () => void;
}) {
  if (items.length === 0) return null;

  const pending = items.filter((item) => !item.isConfirmed).length;

  return (
    <Card onPress={onPress} accessibilityLabel="Today's Doses" style={styles.doseBanner}>
      <Text style={styles.doseBannerTitle}>
        {pending > 0 ? `🕐 ${pending} dose${pending === 1 ? '' : 's'} due today` : "✓ All doses taken today"}
      </Text>
      <Text style={styles.doseBannerLink}>View Today&apos;s Doses →</Text>
    </Card>
  );
}

function MedicineGroup({
  title,
  medicines,
  onSelect,
}: {
  title: string;
  medicines: Medicine[];
  onSelect: (id: string) => void;
}) {
  if (medicines.length === 0) return null;

  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.groupList}>
        {medicines.map((medicine) => (
          <MedicineListItem key={medicine.id} medicine={medicine} onPress={() => onSelect(medicine.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  patientSelectorLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  patientSelectorName: {
    ...typography.subheading,
    color: colors.text,
  },
  patientSelectorLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  doseBanner: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  doseBannerTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  doseBannerLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
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
  list: {
    gap: spacing.lg,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  groupList: {
    gap: spacing.md,
  },
});
