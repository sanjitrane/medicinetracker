import {
  emptyMedicineFormValues,
  type MedicineFormValues,
  type UncertainFormField,
} from '@/features/medicines/utils/medicineForm';

import type { MedicineScanResult } from '../types/scan';

const LOW_CONFIDENCE_THRESHOLD = 0.7;

export interface ScannedFormResult {
  values: MedicineFormValues;
  uncertainFields: UncertainFormField[];
}

/**
 * architecture.md #17/#18: a scan only ever pre-fills the same form manual
 * entry uses — it never creates a medicine record directly (architecture.md
 * #14) — and every field the scan wasn't confident about must be flagged for
 * the user to check, not silently trusted.
 */
export function scanResultToFormValues(scan: MedicineScanResult): ScannedFormResult {
  const values: MedicineFormValues = {
    ...emptyMedicineFormValues(),
    name: scan.medicineName ?? '',
    manufacturingDate: scan.manufacturingDate ?? '',
    expiryDate: scan.expiryDate ?? '',
  };

  const isLowConfidence = scan.confidence === undefined || scan.confidence < LOW_CONFIDENCE_THRESHOLD;

  const uncertainFields: UncertainFormField[] = [];
  if (isLowConfidence) {
    if (values.name) uncertainFields.push('name');
    if (values.manufacturingDate) uncertainFields.push('manufacturingDate');
    if (values.expiryDate) uncertainFields.push('expiryDate');
  }

  return { values, uncertainFields };
}
