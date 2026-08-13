import { scanResultToFormValues } from '../scanResultToFormValues';
import type { MedicineScanResult } from '../../types/scan';

describe('scanResultToFormValues', () => {
  it('maps scanned fields onto an otherwise-empty form', () => {
    const scan: MedicineScanResult = {
      medicineName: 'Paracetamol 500mg',
      manufacturingDate: '2026-04',
      expiryDate: '2028-03',
      confidence: 0.95,
    };

    const { values } = scanResultToFormValues(scan);

    expect(values.name).toBe('Paracetamol 500mg');
    expect(values.manufacturingDate).toBe('2026-04');
    expect(values.expiryDate).toBe('2028-03');
    // Everything scanning doesn't touch stays at the form's normal defaults.
    expect(values.type).toBe('tablet');
    expect(values.tabletsPerStrip).toBe('');
  });

  it('leaves fields blank the provider could not read', () => {
    const scan: MedicineScanResult = { medicineName: 'Paracetamol 500mg', confidence: 0.95 };
    const { values } = scanResultToFormValues(scan);

    expect(values.manufacturingDate).toBe('');
    expect(values.expiryDate).toBe('');
  });

  it('does not flag anything as uncertain when confidence is high', () => {
    const scan: MedicineScanResult = {
      medicineName: 'Paracetamol 500mg',
      expiryDate: '2028-03',
      confidence: 0.95,
    };
    expect(scanResultToFormValues(scan).uncertainFields).toEqual([]);
  });

  it('flags every populated scanned field as uncertain when confidence is low', () => {
    const scan: MedicineScanResult = {
      medicineName: 'Paracetamol 500mg',
      manufacturingDate: '2026-04',
      expiryDate: '2028-03',
      confidence: 0.4,
    };
    expect(scanResultToFormValues(scan).uncertainFields.sort()).toEqual(
      ['expiryDate', 'manufacturingDate', 'name'].sort()
    );
  });

  it('does not flag a field that is empty, even at low confidence', () => {
    const scan: MedicineScanResult = { medicineName: 'Paracetamol 500mg', confidence: 0.2 };
    expect(scanResultToFormValues(scan).uncertainFields).toEqual(['name']);
  });

  it('treats a missing confidence value as low confidence', () => {
    const scan: MedicineScanResult = { medicineName: 'Paracetamol 500mg' };
    expect(scanResultToFormValues(scan).uncertainFields).toEqual(['name']);
  });
});
