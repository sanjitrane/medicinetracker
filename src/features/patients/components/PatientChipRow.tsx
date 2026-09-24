import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

import type { Patient } from '../types/patient';

export interface PatientChipRowProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Inline patient switcher: tap a chip to select that patient, no navigation
 * away. A plain wrapping row rather than a horizontal ScrollView — nesting a
 * horizontal ScrollView inside the screen's outer vertical ScrollView (see
 * `Screen`) hits an Android measurement quirk where the inner ScrollView
 * claims a large, unbounded share of the remaining vertical space instead of
 * sizing to its content. A household's patient list is short enough that
 * wrapping onto a second line reads fine without a scroll affordance.
 */
export function PatientChipRow({ patients, selectedPatientId, onSelect }: PatientChipRowProps) {
  if (patients.length === 0) return null;

  return (
    <View style={styles.row}>
      {patients.map((patient) => {
        const isSelected = patient.id === selectedPatientId;
        return (
          <Pressable
            key={patient.id}
            onPress={() => onSelect(patient.id)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${patient.name}`}
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{patient.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
});
