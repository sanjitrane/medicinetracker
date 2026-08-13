import type { MedicineScanResult } from '../types/scan';

/**
 * architecture.md #15: the scanner screen depends on this interface, never
 * on a specific provider, so the implementation can be swapped (a different
 * vision API, an on-device model, a Phase 2 backend proxy) without touching
 * the camera screen or the confirmation flow.
 */
export interface OCRService {
  scanMedicine(imageUri: string): Promise<MedicineScanResult>;
}

/** Thrown by an `OCRService` implementation — always has a message safe to show the user. */
export class OCRServiceError extends Error {}
