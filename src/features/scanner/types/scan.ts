/**
 * architecture.md #14: OCR is never trusted directly — it returns a
 * suggestion for the user to verify, not a medicine record. Every field is
 * optional; a provider that can't read something confidently must omit it
 * rather than guess (architecture.md #16).
 */
export interface MedicineScanResult {
  medicineName?: string;
  /** ISO "YYYY-MM" or "YYYY-MM-DD", whichever precision was legible. */
  manufacturingDate?: string;
  expiryDate?: string;
  /** Everything the provider could read off the packaging, for debugging/audit. */
  rawText?: string;
  /** 0-1, the provider's own estimate of how much to trust this result. */
  confidence?: number;
}
