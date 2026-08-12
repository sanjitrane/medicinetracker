import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { TodaysDoseItemCard } from '@/features/medicines/components/TodaysDoseItemCard';
import { useDoseConfirmationStore } from '@/features/medicines/store/doseConfirmationStore';
import { useMedicineStore } from '@/features/medicines/store/medicineStore';
import { buildTodaysDoseItems, DOSE_SLOT_ORDER, getSlotWindow } from '@/features/medicines/utils/doseSchedule';
import { today } from '@/utils/dateUtils';

/**
 * Today's dose checklist (architecture.md #41, Phase 1D). One entry per
 * scheduled slot per medicine, grouped and sorted by time of day, each with
 * a "Mark as Taken" action. This is a separate, additive concern from the
 * finish-date/remaining-quantity engine — see `DoseConfirmation`'s doc
 * comment for why confirming a dose here doesn't change those numbers.
 */
export default function TodaysDosesScreen() {
  const todayDate = today();

  const medicines = useMedicineStore((state) => state.medicines);
  const medicinesLoaded = useMedicineStore((state) => state.hasLoaded);
  const loadMedicines = useMedicineStore((state) => state.load);

  const confirmations = useDoseConfirmationStore((state) => state.confirmations);
  const confirmationsLoaded = useDoseConfirmationStore((state) => state.hasLoaded);
  const loadConfirmations = useDoseConfirmationStore((state) => state.load);
  const confirmDose = useDoseConfirmationStore((state) => state.confirmDose);
  const unconfirmDose = useDoseConfirmationStore((state) => state.unconfirmDose);

  useEffect(() => {
    if (!medicinesLoaded) {
      loadMedicines();
    }
  }, [medicinesLoaded, loadMedicines]);

  useEffect(() => {
    loadConfirmations(todayDate);
  }, [todayDate, loadConfirmations]);

  const items = useMemo(
    () => buildTodaysDoseItems(medicines, confirmations),
    [medicines, confirmations]
  );

  if (!medicinesLoaded || !confirmationsLoaded) {
    return (
      <Screen>
        <Text style={styles.status}>Loading…</Text>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen scrollable>
        <EmptyState
          icon="✅"
          title="Nothing due today"
          message="Medicines with a dosage schedule will show up here when they're due."
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      {DOSE_SLOT_ORDER.map((slot) => {
        const slotItems = items.filter((item) => item.slot === slot);
        if (slotItems.length === 0) return null;

        return (
          <View key={slot} style={styles.group}>
            <Text style={styles.groupLabel}>{getSlotWindow(slot).label}</Text>
            {slotItems.map((item) => (
              <TodaysDoseItemCard
                key={`${item.medicineId}:${item.slot}`}
                item={item}
                onConfirm={() => confirmDose(item.medicineId, todayDate, item.slot)}
                onUndo={() => unconfirmDose(item.medicineId, todayDate, item.slot)}
              />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    ...typography.body,
    color: colors.textSecondary,
  },
  group: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  groupLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
});
