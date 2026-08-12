import { create } from 'zustand';

import { doseConfirmationRepository } from '../services/doseConfirmationRepository';
import type { DoseConfirmation } from '../types/doseConfirmation';
import type { DoseSlotKey } from '../types/medicine';

interface DoseConfirmationState {
  date: string;
  confirmations: DoseConfirmation[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  load: (date: string) => Promise<void>;
  confirmDose: (medicineId: string, date: string, slot: DoseSlotKey) => Promise<void>;
  unconfirmDose: (medicineId: string, date: string, slot: DoseSlotKey) => Promise<void>;
}

export const useDoseConfirmationStore = create<DoseConfirmationState>((set, get) => ({
  date: '',
  confirmations: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  async load(date) {
    if (get().hasLoaded && get().date === date) return;

    set({ isLoading: true, error: null });
    try {
      const confirmations = await doseConfirmationRepository.findByDate(date);
      set({ confirmations, date, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, error: "Could not load today's doses." });
    }
  },

  async confirmDose(medicineId, date, slot) {
    const alreadyConfirmed = get().confirmations.some(
      (confirmation) =>
        confirmation.medicineId === medicineId &&
        confirmation.date === date &&
        confirmation.slot === slot
    );
    if (alreadyConfirmed) return;

    const confirmation = await doseConfirmationRepository.confirm(medicineId, date, slot);
    set((state) => ({ confirmations: [...state.confirmations, confirmation] }));
  },

  async unconfirmDose(medicineId, date, slot) {
    await doseConfirmationRepository.unconfirm(medicineId, date, slot);
    set((state) => ({
      confirmations: state.confirmations.filter(
        (confirmation) =>
          !(
            confirmation.medicineId === medicineId &&
            confirmation.date === date &&
            confirmation.slot === slot
          )
      ),
    }));
  },
}));
