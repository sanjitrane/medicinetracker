import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

import type { MedicineStatus } from '../types/medicine';

const LABEL: Record<MedicineStatus, string> = {
  ACTIVE: 'Active',
  FINISHING_SOON: 'Finishing Soon',
  FINISHED: 'Finished',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
};

const ICON: Record<MedicineStatus, string> = {
  ACTIVE: '🟢',
  FINISHING_SOON: '🟡',
  FINISHED: '⚪️',
  EXPIRING_SOON: '🟠',
  EXPIRED: '🔴',
};

const TONE: Record<MedicineStatus, { fg: string; bg: string }> = {
  ACTIVE: { fg: colors.statusActive, bg: colors.statusActiveBg },
  FINISHING_SOON: { fg: colors.statusFinishingSoon, bg: colors.statusFinishingSoonBg },
  FINISHED: { fg: colors.statusFinished, bg: colors.statusFinishedBg },
  EXPIRING_SOON: { fg: colors.statusExpiringSoon, bg: colors.statusExpiringSoonBg },
  EXPIRED: { fg: colors.statusExpired, bg: colors.statusExpiredBg },
};

export interface StatusBadgeProps {
  status: MedicineStatus;
}

/** The one place the app decides what a status looks like (architecture.md #8). */
export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = TONE[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.label, { color: tone.fg }]}>
        {ICON[status]} {LABEL[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
