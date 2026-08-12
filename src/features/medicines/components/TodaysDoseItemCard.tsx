import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/constants/theme';

import type { TodaysDoseItem } from '../utils/doseSchedule';
import { formatSlotWindow } from '../utils/doseSchedule';

export interface TodaysDoseItemCardProps {
  item: TodaysDoseItem;
  onConfirm: () => void;
  onUndo: () => void;
}

const TIMING_LABEL: Record<TodaysDoseItem['timingStatus'], string> = {
  done: '✓ Taken',
  overdue: '⚠ Missed — please confirm',
  due: 'Due now',
  upcoming: 'Later today',
};

const TIMING_TONE: Record<TodaysDoseItem['timingStatus'], { fg: string; border: string }> = {
  done: { fg: colors.statusActive, border: colors.border },
  overdue: { fg: colors.statusExpired, border: colors.statusExpired },
  due: { fg: colors.primary, border: colors.primary },
  upcoming: { fg: colors.textMuted, border: colors.border },
};

export function TodaysDoseItemCard({ item, onConfirm, onUndo }: TodaysDoseItemCardProps) {
  const tone = TIMING_TONE[item.timingStatus];

  return (
    <Card style={[styles.card, { borderColor: tone.border }]}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.medicineName}</Text>
        <Text style={[styles.timing, { color: tone.fg }]}>{TIMING_LABEL[item.timingStatus]}</Text>
      </View>

      <Text style={styles.meta}>
        {item.dose.quantity} {item.dose.unit} · {formatSlotWindow(item.slot)}
      </Text>

      {item.isConfirmed ? (
        <Button label="Undo" variant="ghost" onPress={onUndo} style={styles.action} />
      ) : (
        <Button label="Mark as Taken" onPress={onConfirm} style={styles.action} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
    flexShrink: 1,
  },
  timing: {
    ...typography.caption,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  action: {
    marginTop: spacing.sm,
  },
});
