import * as SecureStore from 'expo-secure-store';

import { generateId } from '@/utils/id';

import { AuthServiceError, type AuthService } from './authService';
import type { AuthSession } from '../types/auth';
import { normalizePhoneNumber } from '../utils/phoneNumber';

const HARDCODED_OTP = '12345';
const USER_IDS_BY_PHONE_KEY = 'auth.userIdsByPhone';

type UserIdsByPhone = Record<string, string>;

async function readUserIdsByPhone(): Promise<UserIdsByPhone> {
  const raw = await SecureStore.getItemAsync(USER_IDS_BY_PHONE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UserIdsByPhone;
  } catch {
    return {};
  }
}

async function resolveUserId(phoneNumber: string): Promise<string> {
  const existing = await readUserIdsByPhone();
  const found = existing[phoneNumber];
  if (found) return found;

  const userId = generateId();
  await SecureStore.setItemAsync(
    USER_IDS_BY_PHONE_KEY,
    JSON.stringify({ ...existing, [phoneNumber]: userId })
  );
  return userId;
}

/**
 * phase2_architecture.md #5 / #27: hardcoded OTP "12345" — "No external OTP
 * provider is required" for Phase 2. The one piece of behaviour this keeps
 * realistic for when a real provider replaces it: the same phone number
 * always resolves to the same userId (persisted, not regenerated per
 * login), so a user's patients survive logging out and back in.
 */
export const hardcodedAuthService: AuthService = {
  async requestOtp(): Promise<void> {
    // Nothing to dispatch — the "OTP" is a fixed, known value in Phase 2.
    // Kept as a real async step so the request -> OTP screen -> verify flow
    // never has to change shape when a real provider is swapped in.
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession> {
    if (otp.trim() !== HARDCODED_OTP) {
      throw new AuthServiceError('Incorrect code. Please try again.');
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    const userId = await resolveUserId(normalized);
    return { userId, phoneNumber: normalized };
  },
};
