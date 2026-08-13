import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PatientListItem } from '@/features/patients/components/PatientListItem';
import { usePatientStore } from '@/features/patients/store/patientStore';

/**
 * phase2_architecture.md #11: patient selection. Reached both when there's
 * no selected patient yet and from Home ("switch patient"). Selecting a
 * patient here is what makes Home show that patient's medicines.
 */
export default function PatientListScreen() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const logout = useAuthStore((state) => state.logout);

  const patients = usePatientStore((state) => state.patients);
  const selectedPatientId = usePatientStore((state) => state.selectedPatientId);
  const hasLoaded = usePatientStore((state) => state.hasLoaded);
  const load = usePatientStore((state) => state.load);
  const selectPatient = usePatientStore((state) => state.selectPatient);
  const deletePatient = usePatientStore((state) => state.deletePatient);

  useEffect(() => {
    if (!hasLoaded && userId) {
      load(userId);
    }
  }, [hasLoaded, userId, load]);

  const goToAddPatient = () => router.push('/patients/create');

  const handleSelect = async (id: string) => {
    await selectPatient(id);
    router.replace('/');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete patient?', `This removes ${name} and their medicines. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePatient(id) },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You can sign back in with the same phone number at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Button label="+ Add" variant="ghost" onPress={goToAddPatient} />
      </View>

      {patients.length === 0 ? (
        <EmptyState
          icon="🧑‍🤝‍🧑"
          title="No patients added yet"
          message="Add a patient to start tracking their medicines."
          actionLabel="Add Patient"
          onAction={goToAddPatient}
        />
      ) : (
        <View style={styles.list}>
          {patients.map((patient) => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              isSelected={patient.id === selectedPatientId}
              onSelect={() => handleSelect(patient.id)}
              onEdit={() => router.push({ pathname: '/patients/create', params: { id: patient.id } })}
              onDelete={() => handleDelete(patient.id, patient.name)}
            />
          ))}
        </View>
      )}

      <Button label="Log Out" variant="ghost" onPress={handleLogout} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  list: {
    gap: spacing.md,
  },
  logout: {
    marginTop: spacing.xl,
  },
});
