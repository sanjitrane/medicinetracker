import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { generateId } from '@/utils/id';

import { patientRepository } from '../services/patientRepository';
import type { Patient } from '../types/patient';

const SELECTED_PATIENT_KEY = 'patients.selectedId';

export type PatientInput = Pick<Patient, 'name' | 'phoneNumber'>;

interface PatientStoreState {
  patients: Patient[];
  selectedPatientId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  /** Loads every patient for this user and restores the last-selected one. */
  load: (userId: string) => Promise<void>;
  createPatient: (userId: string, input: PatientInput) => Promise<Patient>;
  updatePatient: (id: string, input: PatientInput) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  selectPatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  /** Clears in-memory state on logout — does not touch persisted patient rows. */
  reset: () => void;
}

/**
 * phase2_architecture.md #18: the patient store, scoped entirely by the
 * signed-in user's `userId` — `load` is always called with it, so one
 * user's patients can never leak into another's session on the same device.
 */
export const usePatientStore = create<PatientStoreState>((set, get) => ({
  patients: [],
  selectedPatientId: null,
  isLoading: false,
  hasLoaded: false,
  error: null,

  async load(userId) {
    set({ isLoading: true, error: null });
    try {
      const patients = await patientRepository.findAllByUserId(userId);
      const storedSelectedId = await SecureStore.getItemAsync(SELECTED_PATIENT_KEY);
      const selectedPatientId =
        storedSelectedId && patients.some((patient) => patient.id === storedSelectedId)
          ? storedSelectedId
          : (patients[0]?.id ?? null);

      set({ patients, selectedPatientId, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, error: 'Could not load patients.' });
    }
  },

  async createPatient(userId, input) {
    const now = new Date().toISOString();
    const patient: Patient = { ...input, id: generateId(), userId, createdAt: now, updatedAt: now };

    await patientRepository.create(patient);
    set((state) => ({ patients: [...state.patients, patient] }));

    if (!get().selectedPatientId) {
      await get().selectPatient(patient.id);
    }
    return patient;
  },

  async updatePatient(id, input) {
    const existing = get().patients.find((patient) => patient.id === id);
    if (!existing) {
      throw new Error('Patient not found');
    }

    const updated: Patient = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await patientRepository.update(id, updated);
    set((state) => ({
      patients: state.patients.map((patient) => (patient.id === id ? updated : patient)),
    }));
    return updated;
  },

  async deletePatient(id) {
    await patientRepository.delete(id);
    set((state) => {
      const patients = state.patients.filter((patient) => patient.id !== id);
      const selectedPatientId =
        state.selectedPatientId === id ? (patients[0]?.id ?? null) : state.selectedPatientId;
      return { patients, selectedPatientId };
    });

    const nextSelected = get().selectedPatientId;
    if (nextSelected) {
      await SecureStore.setItemAsync(SELECTED_PATIENT_KEY, nextSelected);
    } else {
      await SecureStore.deleteItemAsync(SELECTED_PATIENT_KEY);
    }
  },

  async selectPatient(id) {
    await SecureStore.setItemAsync(SELECTED_PATIENT_KEY, id);
    set({ selectedPatientId: id });
  },

  getPatient(id) {
    return get().patients.find((patient) => patient.id === id);
  },

  reset() {
    set({ patients: [], selectedPatientId: null, isLoading: false, hasLoaded: false, error: null });
  },
}));
