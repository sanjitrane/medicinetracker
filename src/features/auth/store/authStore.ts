import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usePatientStore } from '@/features/patients/store/patientStore';

import { hardcodedAuthService } from '../services/hardcodedAuthService';
import type { AuthSession } from '../types/auth';

const SESSION_KEY = 'auth.session';

async function readSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

interface AuthStoreState {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  userId: string | null;

  /** True while the persisted session is still being read at app launch. */
  isRestoring: boolean;
  isRequestingOtp: boolean;
  isVerifyingOtp: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * phase2_architecture.md #7: session persisted via SecureStore (not
 * AsyncStorage) since it identifies who's logged in — architecture.md #32's
 * "store authentication tokens securely" applies here even though Phase 2
 * has no real token yet.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  isAuthenticated: false,
  phoneNumber: null,
  userId: null,
  isRestoring: true,
  isRequestingOtp: false,
  isVerifyingOtp: false,
  error: null,

  async restoreSession() {
    const session = await readSession();
    set({
      isAuthenticated: session !== null,
      phoneNumber: session?.phoneNumber ?? null,
      userId: session?.userId ?? null,
      isRestoring: false,
    });
  },

  async requestOtp(phoneNumber) {
    set({ isRequestingOtp: true, error: null });
    try {
      await hardcodedAuthService.requestOtp(phoneNumber);
      set({ isRequestingOtp: false });
    } catch {
      set({ isRequestingOtp: false, error: 'Could not send a code. Please try again.' });
    }
  },

  async verifyOtp(phoneNumber, otp) {
    set({ isVerifyingOtp: true, error: null });
    try {
      const session = await hardcodedAuthService.verifyOtp(phoneNumber, otp);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      set({
        isAuthenticated: true,
        phoneNumber: session.phoneNumber,
        userId: session.userId,
        isVerifyingOtp: false,
      });
    } catch (error) {
      set({
        isVerifyingOtp: false,
        error: error instanceof Error ? error.message : 'Could not verify that code.',
      });
    }
  },

  async logout() {
    // Deliberately does not clear the phone->userId mapping the auth
    // service keeps — logging back in with the same number must resolve to
    // the same userId, so that user's patients are still there.
    await SecureStore.deleteItemAsync(SESSION_KEY);
    set({ isAuthenticated: false, phoneNumber: null, userId: null });
    // Clears in-memory patient state only — a different user logging in on
    // this device must not see the previous user's patients still cached.
    usePatientStore.getState().reset();
  },
}));
