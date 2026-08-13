import { getDatabase } from '@/database/client';
import { generateId } from '@/utils/id';

import type { DoseConfirmation } from '../types/doseConfirmation';
import type { DoseSlotKey } from '../types/medicine';

export interface DoseConfirmationRepository {
  confirm(medicineId: string, date: string, slot: DoseSlotKey): Promise<DoseConfirmation>;
  unconfirm(medicineId: string, date: string, slot: DoseSlotKey): Promise<void>;
  findByDate(date: string): Promise<DoseConfirmation[]>;
}

interface DoseConfirmationRow {
  id: string;
  medicineId: string;
  date: string;
  slot: string;
  confirmedAt: string;
}

function rowToConfirmation(row: DoseConfirmationRow): DoseConfirmation {
  return {
    id: row.id,
    medicineId: row.medicineId,
    date: row.date,
    slot: row.slot as DoseSlotKey,
    confirmedAt: row.confirmedAt,
  };
}

export const doseConfirmationRepository: DoseConfirmationRepository = {
  async confirm(medicineId, date, slot) {
    const db = await getDatabase();
    const confirmation: DoseConfirmation = {
      id: generateId(),
      medicineId,
      date,
      slot,
      confirmedAt: new Date().toISOString(),
    };
    // The UNIQUE(medicineId, date, slot) constraint makes re-confirming an
    // already-confirmed slot a harmless no-op rather than a thrown error.
    await db.runAsync(
      'INSERT OR IGNORE INTO dose_confirmations (id, medicineId, date, slot, confirmedAt) VALUES (?, ?, ?, ?, ?);',
      [confirmation.id, confirmation.medicineId, confirmation.date, confirmation.slot, confirmation.confirmedAt]
    );
    return confirmation;
  },

  async unconfirm(medicineId, date, slot) {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM dose_confirmations WHERE medicineId = ? AND date = ? AND slot = ?;',
      [medicineId, date, slot]
    );
  },

  async findByDate(date) {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DoseConfirmationRow>(
      'SELECT * FROM dose_confirmations WHERE date = ?;',
      [date]
    );
    return rows.map(rowToConfirmation);
  },
};
