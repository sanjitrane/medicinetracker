import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { colors, spacing, typography } from '@/constants/theme';

import {
  emptyMedicineFormValues,
  medicineFormSchema,
  type MedicineFormValues,
} from '../utils/medicineForm';

export interface MedicineFormProps {
  initialValues?: MedicineFormValues;
  submitLabel: string;
  onSubmit: (values: MedicineFormValues) => Promise<void>;
  onCancel: () => void;
}

/**
 * Shared by manual entry and edit (architecture.md #18): both converge on the
 * same medicine creation flow and data model, so there is exactly one form.
 *
 * Dosage here is deliberately just quantity-per-slot. Fraction ("half
 * tablet") and meal timing exist on the `Dose` type but their UI lands in
 * Phase 1C alongside the calculation engine that actually uses them.
 */
export function MedicineForm({ initialValues, submitLabel, onSubmit, onCancel }: MedicineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: initialValues ?? emptyMedicineFormValues(),
  });

  const type = useWatch({ control, name: 'type' });

  const submit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      Alert.alert('Something went wrong', 'Could not save this medicine. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Medicine Information</Text>

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Medicine Name"
              placeholder="e.g. Paracetamol 500mg"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
            />
          )}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <View style={styles.typeRow}>
                <Button
                  label="Tablet"
                  variant={field.value === 'tablet' ? 'primary' : 'secondary'}
                  onPress={() => field.onChange('tablet')}
                  style={styles.typeButton}
                />
                <Button
                  label="Syrup"
                  variant={field.value === 'syrup' ? 'primary' : 'secondary'}
                  onPress={() => field.onChange('syrup')}
                  style={styles.typeButton}
                />
              </View>
            )}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Quantity</Text>

        {type === 'tablet' ? (
          <View style={styles.row}>
            <Controller
              control={control}
              name="tabletsPerStrip"
              render={({ field }) => (
                <Input
                  label="Tablets per strip"
                  placeholder="10"
                  keyboardType="numeric"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.tabletsPerStrip?.message}
                  containerStyle={styles.rowField}
                />
              )}
            />
            <Controller
              control={control}
              name="numberOfStrips"
              render={({ field }) => (
                <Input
                  label="Number of strips"
                  placeholder="3"
                  keyboardType="numeric"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.numberOfStrips?.message}
                  containerStyle={styles.rowField}
                />
              )}
            />
          </View>
        ) : (
          <Controller
            control={control}
            name="bottleQuantityMl"
            render={({ field }) => (
              <Input
                label="Bottle size (ml)"
                placeholder="100"
                keyboardType="numeric"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.bottleQuantityMl?.message}
              />
            )}
          />
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Dosage (optional)</Text>
        <Text style={styles.sectionHint}>
          How much is taken at each time of day, in {type === 'tablet' ? 'tablets' : 'ml'}.
        </Text>

        <Controller
          control={control}
          name="morningQuantity"
          render={({ field }) => (
            <Input
              label="Morning"
              placeholder="0"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.morningQuantity?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="afternoonQuantity"
          render={({ field }) => (
            <Input
              label="Afternoon"
              placeholder="0"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.afternoonQuantity?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="eveningQuantity"
          render={({ field }) => (
            <Input
              label="Evening"
              placeholder="0"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.eveningQuantity?.message}
            />
          )}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>

        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <Input
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.startDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="manufacturingDate"
          render={({ field }) => (
            <Input
              label="Manufacturing Date (optional)"
              placeholder="YYYY-MM-DD"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.manufacturingDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="expiryDate"
          render={({ field }) => (
            <Input
              label="Expiry Date (optional)"
              placeholder="YYYY-MM-DD"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.expiryDate?.message}
            />
          )}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Notify before running out</Text>
          <Controller
            control={control}
            name="finishReminderEnabled"
            render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} />
            )}
          />
        </View>
        <Controller
          control={control}
          name="finishReminderDays"
          render={({ field }) => (
            <Input
              label="Days before"
              placeholder="3"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.finishReminderDays?.message}
            />
          )}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Notify before expiry</Text>
          <Controller
            control={control}
            name="expiryReminderEnabled"
            render={({ field }) => (
              <Switch value={field.value} onValueChange={field.onChange} />
            )}
          />
        </View>
        <Controller
          control={control}
          name="expiryReminderDays"
          render={({ field }) => (
            <Input
              label="Days before"
              placeholder="7"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.expiryReminderDays?.message}
            />
          )}
        />
      </Card>

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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
