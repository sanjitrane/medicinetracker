import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';

import { StatusBadge } from './StatusBadge';
import type { Medicine } from '../types/medicine';
import {
  calculateDailyConsumption,
  calculateMedicineFinishDate,
  calculateRemainingQuantity,
  getMedicineStatus,
} from '../utils/medicineCalculator';

export interface MedicineListItemProps {
  medicine: Medicine;
  onPress: () => void;
}

function unitLabel(medicine: Medicine): string {
  return medicine.quantityUnit === 'tablet' ? 'tablets' : 'ml';
}

export function MedicineListItem({ medicine, onPress }: MedicineListItemProps) {
  const dailyConsumption = calculateDailyConsumption(medicine.dosage);
  const remaining = calculateRemainingQuantity(medicine);
  const finishDate = calculateMedicineFinishDate(medicine);
  const status = getMedicineStatus(medicine);
  const unit = unitLabel(medicine);

  return (
    <Card onPress={onPress} accessibilityLabel={medicine.name} style={styles.card}>
      <Text style={styles.name}>{medicine.name}</Text>
      {dailyConsumption > 0 ? (
        <Text style={styles.meta}>
          {dailyConsumption} {unit} × day
        </Text>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.meta}>
          Remaining: {remaining} {unit}
        </Text>
        {finishDate ? <Text style={styles.meta}>Finishes: {finishDate}</Text> : null}
      </View>

      <StatusBadge status={status} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
