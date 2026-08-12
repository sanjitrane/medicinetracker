import { getDatabase } from '@/database/client';

import type { DosageSchedule, Medicine, NotificationSettings } from '../types/medicine';

/**
 * Repository pattern (architecture.md #27): the store talks to this, never to
 * SQLite directly, so Phase 2 can swap in a remote-backed implementation of
 * the same interface without touching the store or UI.
 */
export interface MedicineRepository {
  create(medicine: Medicine): Promise<void>;
  update(id: string, medicine: Medicine): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Medicine | null>;
  findAll(): Promise<Medicine[]>;
}

interface MedicineRow {
  id: string;
  name: string;
  type: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  startDate: string;
  quantity: number;
  quantityUnit: string;
  tabletsPerStrip: number | null;
  numberOfStrips: number | null;
  bottleQuantityMl: number | null;
  dosage: string | null;
  notificationSettings: string;
  createdAt: string;
  updatedAt: string;
}

function rowToMedicine(row: MedicineRow): Medicine {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Medicine['type'],
    manufacturingDate: row.manufacturingDate ?? undefined,
    expiryDate: row.expiryDate ?? undefined,
    startDate: row.startDate,
    quantity: row.quantity,
    quantityUnit: row.quantityUnit as Medicine['quantityUnit'],
    tabletsPerStrip: row.tabletsPerStrip ?? undefined,
    numberOfStrips: row.numberOfStrips ?? undefined,
    bottleQuantityMl: row.bottleQuantityMl ?? undefined,
    dosage: row.dosage ? (JSON.parse(row.dosage) as DosageSchedule) : undefined,
    notificationSettings: JSON.parse(row.notificationSettings) as NotificationSettings,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const UPSERT_COLUMNS = `
  id, name, type, manufacturingDate, expiryDate, startDate, quantity, quantityUnit,
  tabletsPerStrip, numberOfStrips, bottleQuantityMl, dosage, notificationSettings,
  createdAt, updatedAt
`;

function medicineToParams(medicine: Medicine) {
  return [
    medicine.id,
    medicine.name,
    medicine.type,
    medicine.manufacturingDate ?? null,
    medicine.expiryDate ?? null,
    medicine.startDate,
    medicine.quantity,
    medicine.quantityUnit,
    medicine.tabletsPerStrip ?? null,
    medicine.numberOfStrips ?? null,
    medicine.bottleQuantityMl ?? null,
    medicine.dosage ? JSON.stringify(medicine.dosage) : null,
    JSON.stringify(medicine.notificationSettings),
    medicine.createdAt,
    medicine.updatedAt,
  ];
}

export const medicineRepository: MedicineRepository = {
  async create(medicine) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO medicines (${UPSERT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      medicineToParams(medicine)
    );
  },

  async update(id, medicine) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE medicines SET
        name = ?, type = ?, manufacturingDate = ?, expiryDate = ?, startDate = ?,
        quantity = ?, quantityUnit = ?, tabletsPerStrip = ?, numberOfStrips = ?,
        bottleQuantityMl = ?, dosage = ?, notificationSettings = ?, createdAt = ?, updatedAt = ?
       WHERE id = ?;`,
      [...medicineToParams(medicine).slice(1), id]
    );
  },

  async delete(id) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM medicines WHERE id = ?;', [id]);
  },

  async findById(id) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MedicineRow>('SELECT * FROM medicines WHERE id = ?;', [
      id,
    ]);
    return row ? rowToMedicine(row) : null;
  },

  async findAll() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MedicineRow>(
      'SELECT * FROM medicines ORDER BY createdAt DESC;'
    );
    return rows.map(rowToMedicine);
  },
};
