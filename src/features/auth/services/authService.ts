import type { AuthSession } from '../types/auth';

/**
 * phase2_architecture.md #5: the UI only ever talks to this interface — it
 * "should NOT know whether the OTP is hardcoded or coming from an external
 * provider". Swapping `hardcodedAuthService` for a real Twilio/Firebase/SNS
 * backed implementation later means writing a new implementation of this
 * interface, not touching a single screen.
 */
export interface AuthService {
  requestOtp(phoneNumber: string): Promise<void>;
  verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession>;
}

/** Thrown by an `AuthService` implementation — always has a message safe to show the user. */
export class AuthServiceError extends Error {}
