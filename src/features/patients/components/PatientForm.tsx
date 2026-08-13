import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { spacing } from '@/constants/theme';

import { emptyPatientFormValues, patientFormSchema, type PatientFormValues } from '../utils/patientForm';

export interface PatientFormProps {
  initialValues?: PatientFormValues;
  submitLabel: string;
  onSubmit: (values: PatientFormValues) => Promise<void>;
  onCancel: () => void;
}

/** phase2_architecture.md #10: name + alert phone number, nothing else. */
export function PatientForm({ initialValues, submitLabel, onSubmit, onCancel }: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: initialValues ?? emptyPatientFormValues(),
  });

  const submit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      Alert.alert('Something went wrong', 'Could not save this patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label="Patient Name"
            placeholder="e.g. Father"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <Input
            label="Alert Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            hint="Dosage reminders for this patient go to this number."
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phoneNumber?.message}
          />
        )}
      />

      <View style={styles.actions}>
        <Button label={submitLabel} onPress={submit} loading={isSubmitting} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={isSubmitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
