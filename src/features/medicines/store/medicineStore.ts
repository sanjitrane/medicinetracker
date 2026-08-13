import { create } from 'zustand';

import {
  cancelMedicineNotifications,
  syncMedicineNotifications,
} from '@/features/notifications/services/notificationScheduler';

import { medicineRepository } from '../services/medicineRepository';
import type { Medicine } from '../types/medicine';
import { generateId } from '../utils/id';

export type MedicineInput = Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>;

interface MedicineStoreState {
  medicines: Medicine[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  load: () => Promise<void>;
  addMedicine: (input: MedicineInput) => Promise<Medicine>;
  updateMedicine: (id: string, input: MedicineInput) => Promise<Medicine>;
  deleteMedicine: (id: string) => Promise<void>;
  getMedicine: (id: string) => Medicine | undefined;
}

export const useMedicineStore = create<MedicineStoreState>((set, get) => ({
  medicines: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  async load() {
    set({ isLoading: true, error: null });
    try {
      const medicines = await medicineRepository.findAll();
      set({ medicines, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, error: 'Could not load your medicines.' });
    }
  },

  async addMedicine(input) {
    const now = new Date().toISOString();
    const medicine: Medicine = { ...input, id: generateId(), createdAt: now, updatedAt: now };

    await medicineRepository.create(medicine);
    set((state) => ({ medicines: [medicine, ...state.medicines] }));
    await syncMedicineNotifications(medicine);
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
    await syncMedicineNotifications(updated);
    return updated;
  },

  async deleteMedicine(id) {
    await medicineRepository.delete(id);
    set((state) => ({
      medicines: state.medicines.filter((medicine) => medicine.id !== id),
    }));
    await cancelMedicineNotifications(id);
  },

  getMedicine(id) {
    return get().medicines.find((medicine) => medicine.id === id);
  },
}));
