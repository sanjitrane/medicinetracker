import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { MedicineForm } from '@/features/medicines/components/MedicineForm';
import { useMedicineStore } from '@/features/medicines/store/medicineStore';
import {
  formValuesToMedicineInput,
  medicineToFormValues,
  type MedicineFormValues,
  type UncertainFormField,
} from '@/features/medicines/utils/medicineForm';
import type { MedicineScanResult } from '@/features/scanner/types/scan';
import { scanResultToFormValues } from '@/features/scanner/utils/scanResultToFormValues';

/**
 * Manual medicine entry, edit, and scan confirmation, all in one screen
 * (architecture.md #18): all three converge on the same creation flow and
 * data model, so there is only ever one form to maintain. A scan
 * (`?scan=<json>`) only ever pre-fills this form — it never saves on its own
 * (architecture.md #14).
 */
export default function ManualEntryScreen() {
  const router = useRouter();
  const { id, scan } = useLocalSearchParams<{ id?: string; scan?: string }>();
  const isEditing = Boolean(id);

  const hasLoaded = useMedicineStore((state) => state.hasLoaded);
  const load = useMedicineStore((state) => state.load);
  const addMedicine = useMedicineStore((state) => state.addMedicine);
  const updateMedicine = useMedicineStore((state) => state.updateMedicine);
  const existing = useMedicineStore((state) =>
    id ? state.medicines.find((medicine) => medicine.id === id) : undefined
  );

  useEffect(() => {
    if (!hasLoaded) {
      load();
    }
  }, [hasLoaded, load]);

  const scanResult = useMemo<MedicineScanResult | undefined>(() => {
    if (!scan) return undefined;
    try {
      return JSON.parse(scan) as MedicineScanResult;
    } catch {
      return undefined;
    }
  }, [scan]);

  const { initialValues, uncertainFields } = useMemo<{
    initialValues: MedicineFormValues | undefined;
    uncertainFields: UncertainFormField[];
  }>(() => {
    if (existing) {
      return { initialValues: medicineToFormValues(existing), uncertainFields: [] };
    }
    if (scanResult) {
      const scanned = scanResultToFormValues(scanResult);
      return { initialValues: scanned.values, uncertainFields: scanned.uncertainFields };
    }
    return { initialValues: undefined, uncertainFields: [] };
  }, [existing, scanResult]);

  if (isEditing && !hasLoaded) {
    return (
      <Screen>
        <Text style={styles.status}>Loading…</Text>
      </Screen>
    );
  }

  if (isEditing && !existing) {
    return (
      <Screen>
        <Text style={styles.status}>This medicine could not be found.</Text>
      </Screen>
    );
  }

  const handleSubmit = async (values: MedicineFormValues) => {
    const input = formValuesToMedicineInput(values);
    const medicine =
      isEditing && id ? await updateMedicine(id, input) : await addMedicine(input);
    router.replace({ pathname: '/medicines/[id]', params: { id: medicine.id } });
  };

  return (
    <Screen scrollable>
      <Text style={styles.title}>{isEditing ? 'Edit Medicine' : 'Medicine Information'}</Text>
      <MedicineForm
        key={id ?? scan ?? 'new'}
        initialValues={initialValues}
        uncertainFields={uncertainFields}
        submitLabel={isEditing ? 'Save Changes' : 'Save Medicine'}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
