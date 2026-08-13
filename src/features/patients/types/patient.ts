/**
 * phase2_architecture.md #9. `userId` establishes ownership — every query
 * must be scoped by it so one signed-in user never sees another's patients.
 */
export interface Patient {
  id: string;
  userId: string;
  name: string;
  /** Normalized E.164-ish, e.g. "+919876543210" — where dosage alerts go. */
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}
