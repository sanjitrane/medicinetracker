import { create } from 'zustand';

import { cancelDoseReminders, syncDoseReminders } from '@/features/notifications/services/doseReminderScheduler';
import {
  cancelMedicineNotifications,
  syncMedicineNotifications,
} from '@/features/notifications/services/notificationScheduler';
import { usePatientStore } from '@/features/patients/store/patientStore';
import { generateId } from '@/utils/id';

import { medicineRepository } from '../services/medicineRepository';
import type { Medicine } from '../types/medicine';

export type MedicineInput = Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>;

interface MedicineStoreState {
  medicines: Medicine[];
  isLoading: boolean;
  /** Which patient `medicines` currently holds data for — `null` until the first load. */
  loadedForPatientId: string | null;
  error: string | null;

  load: (patientId: string) => Promise<void>;
  addMedicine: (input: MedicineInput) => Promise<Medicine>;
  updateMedicine: (id: string, input: MedicineInput) => Promise<Medicine>;
  deleteMedicine: (id: string) => Promise<void>;
  getMedicine: (id: string) => Medicine | undefined;
}

function patientNameFor(patientId: string): string {
  return usePatientStore.getState().getPatient(patientId)?.name ?? 'Patient';
}

/**
 * phase2_architecture.md #13: "Home should never load medicines globally" —
 * `medicines` only ever holds one patient's records at a time, fetched by
 * `getMedicinesByPatientId`. Switching patients means `loadedForPatientId`
 * no longer matches the newly selected patient, so callers naturally reload.
 */
export const useMedicineStore = create<MedicineStoreState>((set, get) => ({
  medicines: [],
  isLoading: false,
  loadedForPatientId: null,
  error: null,

  async load(patientId) {
    if (get().loadedForPatientId === patientId && !get().error) return;

    set({ isLoading: true, error: null });
    try {
      const medicines = await medicineRepository.findAllByPatientId(patientId);
      set({ medicines, isLoading: false, loadedForPatientId: patientId });
    } catch {
      set({ isLoading: false, error: 'Could not load your medicines.' });
    }
  },

  async addMedicine(input) {
    const now = new Date().toISOString();
    const medicine: Medicine = { ...input, id: generateId(), createdAt: now, updatedAt: now };

    await medicineRepository.create(medicine);
    set((state) => ({ medicines: [medicine, ...state.medicines] }));
    await syncMedicineNotifications(medicine, patientNameFor(medicine.patientId));
    await syncDoseReminders(medicine, patientNameFor(medicine.patientId));
    return medicine;
  },

  async updateMedicine(id, input) {
    const existing = get().medicines.find((medicine) => medicine.id === id);
    if (!existing) {
      throw new Error('Medicine not found');
    }

    const updated: Medicine = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await medicineRepository.update(id, updated);
    set((state) => ({
      medicines: state.medicines.map((medicine) => (medicine.id === id ? updated : medicine)),
    }));
    await syncMedicineNotifications(updated, patientNameFor(updated.patientId));
    await syncDoseReminders(updated, patientNameFor(updated.patientId));
    return updated;
  },

  async deleteMedicine(id) {
    await medicineRepository.delete(id);
    set((state) => ({
      medicines: state.medicines.filter((medicine) => medicine.id !== id),
    }));
    await cancelMedicineNotifications(id);
    await cancelDoseReminders(id);
  },

  getMedicine(id) {
    return get().medicines.find((medicine) => medicine.id === id);
  },
}));
