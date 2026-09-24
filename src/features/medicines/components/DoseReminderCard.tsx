import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';

import { TimeField } from './TimeField';
import type { DoseSlotKey, Medicine } from '../types/medicine';
import { DOSE_SLOT_ORDER, getSlotWindow } from '../utils/doseSchedule';

export interface DoseReminderCardProps {
  medicine: Medicine;
  onSave: (medicineId: string, times: Partial<Record<DoseSlotKey, string>>) => Promise<void>;
}

function defaultTimeFor(slot: DoseSlotKey): string {
  return `${getSlotWindow(slot).startHour.toString().padStart(2, '0')}:00`;
}

/**
 * One medicine's dose-reminder editor. Only slots with a positive quantity
 * are shown — an unset slot has no dose to alarm on. Times are edited
 * locally and committed together via a single Save, both to avoid
 * rescheduling notifications on every picker tap and to match the app's
 * explicit-save convention (`MedicineForm`).
 */
export function DoseReminderCard({ medicine, onSave }: DoseReminderCardProps) {
  const activeSlots = DOSE_SLOT_ORDER.filter((slot) => (medicine.dosage?.[slot]?.quantity ?? 0) > 0);

  const [times, setTimes] = useState<Record<DoseSlotKey, string>>(() => {
    const initial = {} as Record<DoseSlotKey, string>;
    activeSlots.forEach((slot) => {
      initial[slot] = medicine.dosage?.[slot]?.time ?? defaultTimeFor(slot);
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  if (activeSlots.length === 0) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setJustSaved(false);
    try {
      await onSave(medicine.id, times);
      setJustSaved(true);
    } catch {
      Alert.alert('Something went wrong', 'Could not save these reminders. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.name}>{medicine.name}</Text>

      {activeSlots.map((slot) => {
        const dose = medicine.dosage?.[slot];
        return (
          <View key={slot} style={styles.slotRow}>
            <View style={styles.slotInfo}>
              <Text style={styles.slotLabel}>{getSlotWindow(slot).label}</Text>
              <Text style={styles.slotDose}>
                {dose?.quantity} {dose?.unit}
              </Text>
            </View>
            <TimeField
              label="Alarm time"
              value={times[slot]}
              onChange={(next) => {
                setJustSaved(false);
                setTimes((prev) => ({ ...prev, [slot]: next }));
              }}
            />
          </View>
        );
      })}

      <View style={styles.footer}>
        {justSaved ? <Text style={styles.saved}>Saved ✓</Text> : <View />}
        <Button label="Save Reminders" onPress={handleSave} loading={isSaving} style={styles.saveButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotInfo: {
    gap: 2,
  },
  slotLabel: {
    ...typography.label,
    color: colors.text,
  },
  slotDose: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saved: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  saveButton: {
    marginLeft: 'auto',
  },
});
