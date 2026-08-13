import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';

import type { Patient } from '../types/patient';

export interface PatientListItemProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PatientListItem({ patient, isSelected, onSelect, onEdit, onDelete }: PatientListItemProps) {
  return (
    <Card
      onPress={onSelect}
      accessibilityLabel={`Select ${patient.name}`}
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{patient.name}</Text>
        {isSelected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
      </View>
      <Text style={styles.phone}>{patient.phoneNumber}</Text>

      <View style={styles.actions}>
        <Button label="Edit" variant="ghost" onPress={onEdit} style={styles.actionButton} />
        <Button label="Delete" variant="ghost" onPress={onDelete} style={styles.actionButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  selectedBadge: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  phone: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  actionButton: {
    marginRight: spacing.md,
  },
});
