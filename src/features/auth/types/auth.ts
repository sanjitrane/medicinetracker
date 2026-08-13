export interface AuthSession {
  userId: string;
  phoneNumber: string;
}

/**
 * phase2_architecture.md #6. `isRestoring` is UI-only (are we still reading
 * the persisted session at app launch) and never itself persisted.
 */
export interface AuthState {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  userId: string | null;
}
