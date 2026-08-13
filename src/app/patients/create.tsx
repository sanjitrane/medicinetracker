import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { PatientForm } from '@/features/patients/components/PatientForm';
import { usePatientStore } from '@/features/patients/store/patientStore';
import { normalizePatientFormValues, type PatientFormValues } from '@/features/patients/utils/patientForm';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * Create and edit share this screen (same pattern as the medicine form,
 * architecture.md #18) — `id` present means edit.
 */
export default function CreatePatientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const userId = useAuthStore((state) => state.userId);
  const createPatient = usePatientStore((state) => state.createPatient);
  const updatePatient = usePatientStore((state) => state.updatePatient);
  const existing = usePatientStore((state) =>
    id ? state.patients.find((patient) => patient.id === id) : undefined
  );

  const initialValues = useMemo<PatientFormValues | undefined>(
    () => (existing ? { name: existing.name, phoneNumber: existing.phoneNumber } : undefined),
    [existing]
  );

  if (isEditing && !existing) {
    return (
      <Screen>
        <Text style={styles.status}>This patient could not be found.</Text>
      </Screen>
    );
  }

  const handleSubmit = async (values: PatientFormValues) => {
    const normalized = normalizePatientFormValues(values);

    if (isEditing && id) {
      await updatePatient(id, normalized);
      router.back();
      return;
    }

    if (!userId) {
      throw new Error('Not signed in');
    }
    await createPatient(userId, normalized);
    router.replace('/');
  };

  return (
    <Screen scrollable>
      <Text style={styles.title}>{isEditing ? 'Edit Patient' : 'Add Patient'}</Text>
      <Text style={styles.subtitle}>
        {isEditing
          ? 'Update this patient’s details.'
          : 'Add someone to start tracking their medicines.'}
      </Text>

      <PatientForm
        key={id ?? 'new'}
        initialValues={initialValues}
        submitLabel={isEditing ? 'Save Changes' : 'Save Patient'}
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
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
