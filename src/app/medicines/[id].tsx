import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { StatusBadge } from '@/features/medicines/components/StatusBadge';
import { useMedicineStore } from '@/features/medicines/store/medicineStore';
import type { Dose } from '@/features/medicines/types/medicine';
import {
  calculateMedicineFinishDate,
  calculateRemainingQuantity,
  getMedicineStatus,
} from '@/features/medicines/utils/medicineCalculator';
import { getNotificationPermissionGranted } from '@/features/notifications/services/notificationScheduler';
import { usePatientStore } from '@/features/patients/store/patientStore';

function formatDose(dose?: Dose): string {
  return dose ? `${dose.quantity} ${dose.unit}` : '—';
}

/**
 * Medicine details. Remaining quantity, estimated finish date and status are
 * computed from the record, never stored (architecture.md #22) — they can
 * never drift out of agreement with the quantity, dosage and dates above.
 */
export default function MedicineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const selectedPatientId = usePatientStore((state) => state.selectedPatientId);

  const loadedForPatientId = useMedicineStore((state) => state.loadedForPatientId);
  const load = useMedicineStore((state) => state.load);
  const deleteMedicine = useMedicineStore((state) => state.deleteMedicine);
  const medicine = useMedicineStore((state) => state.medicines.find((item) => item.id === id));
  const hasLoaded = loadedForPatientId === selectedPatientId;

  const [notificationsGranted, setNotificationsGranted] = useState(true);

  useEffect(() => {
    if (!hasLoaded && selectedPatientId) {
      load(selectedPatientId);
    }
  }, [hasLoaded, selectedPatientId, load]);

  useEffect(() => {
    getNotificationPermissionGranted().then(setNotificationsGranted);
  }, []);

  const handleDelete = () => {
    Alert.alert(
      'Delete medicine?',
      `This removes ${medicine?.name ?? 'this medicine'} and its reminders. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMedicine(id);
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!hasLoaded) {
    return (
      <Screen>
        <Text style={styles.status}>Loading…</Text>
      </Screen>
    );
  }

  if (!medicine) {
    return (
      <Screen>
        <Text style={styles.status}>This medicine could not be found.</Text>
      </Screen>
    );
  }

  const status = getMedicineStatus(medicine);
  const remaining = calculateRemainingQuantity(medicine);
  const finishDate = calculateMedicineFinishDate(medicine);
  const hasAnyReminderEnabled =
    medicine.notificationSettings.finishMedicine.enabled ||
    medicine.notificationSettings.expiryMedicine.enabled;
  const showNotificationsOffNotice = hasAnyReminderEnabled && !notificationsGranted;

  return (
    <Screen scrollable>
      <Card style={styles.section}>
        <Text style={styles.title}>{medicine.name}</Text>
        <Text style={styles.subtitle}>{medicine.type === 'tablet' ? 'Tablet' : 'Syrup'}</Text>
        <StatusBadge status={status} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <Row label="Total" value={`${medicine.quantity} ${medicine.quantityUnit}`} />
        <Row label="Remaining (estimated)" value={`${remaining} ${medicine.quantityUnit}`} />
        {finishDate ? <Row label="Estimated Finish Date" value={finishDate} /> : null}
        {medicine.type === 'tablet' && medicine.tabletsPerStrip && medicine.numberOfStrips ? (
          <Row
            label="Packaging"
            value={`${medicine.numberOfStrips} × ${medicine.tabletsPerStrip} per strip`}
          />
        ) : null}
        {medicine.type === 'syrup' && medicine.bottleQuantityMl ? (
          <Row label="Bottle" value={`${medicine.bottleQuantityMl} ml`} />
        ) : null}
      </Card>

      {medicine.dosage ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Dosage</Text>
          <Row label="Morning" value={formatDose(medicine.dosage.morning)} />
          <Row label="Afternoon" value={formatDose(medicine.dosage.afternoon)} />
          <Row label="Evening" value={formatDose(medicine.dosage.evening)} />
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <Row label="Start Date" value={medicine.startDate} />
        <Row label="Manufacturing Date" value={medicine.manufacturingDate ?? '—'} />
        <Row label="Expiry Date" value={medicine.expiryDate ?? '—'} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <Row
          label="Running out"
          value={
            medicine.notificationSettings.finishMedicine.enabled
              ? `${medicine.notificationSettings.finishMedicine.daysBefore} days before`
              : 'Off'
          }
        />
        <Row
          label="Expiry"
          value={
            medicine.notificationSettings.expiryMedicine.enabled
              ? `${medicine.notificationSettings.expiryMedicine.daysBefore} days before`
              : 'Off'
          }
        />

        {showNotificationsOffNotice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Notifications are turned off for Medicine Tracker, so these reminders won&apos;t
              fire. Enable them in Settings to get notified.
            </Text>
            <Button
              label="Open Settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Edit"
          onPress={() =>
            router.push({ pathname: '/medicines/manual', params: { id: medicine.id } })
          }
        />
        <Button label="Delete" variant="danger" onPress={handleDelete} />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  notice: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.statusExpiringSoonBg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.statusExpiringSoon,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
