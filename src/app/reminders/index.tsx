import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DoseReminderCard } from '@/features/medicines/components/DoseReminderCard';
import { useMedicineStore } from '@/features/medicines/store/medicineStore';
import type { DoseSlotKey } from '@/features/medicines/types/medicine';
import { getNotificationPermissionGranted } from '@/features/notifications/services/notificationScheduler';
import { PatientChipRow } from '@/features/patients/components/PatientChipRow';
import { usePatientStore } from '@/features/patients/store/patientStore';

/**
 * Dose Reminders: pick a patient, see their medicines that have a dosage
 * schedule, and set an exact daily alarm time per scheduled slot. Saving a
 * card schedules a `DAILY`-repeating local notification per slot (via
 * `medicineStore.updateMedicine` -> `syncDoseReminders`).
 */
export default function RemindersScreen() {
  const userId = useAuthStore((state) => state.userId);

  const patients = usePatientStore((state) => state.patients);
  const patientsHaveLoaded = usePatientStore((state) => state.hasLoaded);
  const loadPatients = usePatientStore((state) => state.load);
  const selectedPatientId = usePatientStore((state) => state.selectedPatientId);
  const selectPatient = usePatientStore((state) => state.selectPatient);

  const medicines = useMedicineStore((state) => state.medicines);
  const loadedForPatientId = useMedicineStore((state) => state.loadedForPatientId);
  const loadMedicines = useMedicineStore((state) => state.load);
  const updateMedicine = useMedicineStore((state) => state.updateMedicine);

  const [permissionGranted, setPermissionGranted] = useState(true);

  useEffect(() => {
    if (!patientsHaveLoaded && userId) {
      loadPatients(userId);
    }
  }, [patientsHaveLoaded, userId, loadPatients]);

  useEffect(() => {
    if (selectedPatientId && loadedForPatientId !== selectedPatientId) {
      loadMedicines(selectedPatientId);
    }
  }, [selectedPatientId, loadedForPatientId, loadMedicines]);

  useEffect(() => {
    getNotificationPermissionGranted().then(setPermissionGranted);
  }, []);

  const medicinesWithSchedule = useMemo(
    () =>
      medicines.filter(
        (medicine) =>
          medicine.dosage &&
          (['morning', 'afternoon', 'evening'] as DoseSlotKey[]).some(
            (slot) => (medicine.dosage?.[slot]?.quantity ?? 0) > 0
          )
      ),
    [medicines]
  );

  const handleSave = async (medicineId: string, times: Partial<Record<DoseSlotKey, string>>) => {
    const medicine = medicines.find((item) => item.id === medicineId);
    if (!medicine) return;

    const { id, createdAt, updatedAt, ...rest } = medicine;
    await updateMedicine(medicineId, {
      ...rest,
      dosage: {
        morning: medicine.dosage?.morning
          ? { ...medicine.dosage.morning, time: times.morning ?? medicine.dosage.morning.time }
          : undefined,
        afternoon: medicine.dosage?.afternoon
          ? { ...medicine.dosage.afternoon, time: times.afternoon ?? medicine.dosage.afternoon.time }
          : undefined,
        evening: medicine.dosage?.evening
          ? { ...medicine.dosage.evening, time: times.evening ?? medicine.dosage.evening.time }
          : undefined,
      },
    });
  };

  if (patientsHaveLoaded && patients.length === 0) {
    return (
      <Screen scrollable>
        <EmptyState
          icon="👪"
          title="No patients yet"
          message="Add a patient before setting up dose reminders."
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Dose Reminders</Text>
        <Text style={styles.subtitle}>Set an alarm time for each scheduled dose.</Text>
      </View>

      <PatientChipRow patients={patients} selectedPatientId={selectedPatientId} onSelect={selectPatient} />

      {!permissionGranted ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningText}>
            Notifications are turned off, so these alarms won&apos;t fire yet. You&apos;ll be asked to enable
            them when you save your first reminder.
          </Text>
        </Card>
      ) : null}

      {medicinesWithSchedule.length === 0 ? (
        <EmptyState
          icon="⏰"
          title="Nothing to remind yet"
          message="Medicines with a dosage schedule will show up here so you can set an alarm time."
        />
      ) : (
        <View style={styles.list}>
          {medicinesWithSchedule.map((medicine) => (
            <DoseReminderCard key={medicine.id} medicine={medicine} onSave={handleSave} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  warningCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.statusFinishingSoonBg,
    borderColor: colors.statusFinishingSoon,
  },
  warningText: {
    ...typography.caption,
    color: colors.statusFinishingSoon,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
