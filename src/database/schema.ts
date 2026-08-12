import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * `dosage` and `notificationSettings` are stored as JSON text rather than
 * normalised columns — they are always read and written whole, as a single
 * medicine record, never queried by their internal fields.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      manufacturingDate TEXT,
      expiryDate TEXT,
      startDate TEXT NOT NULL,
      quantity REAL NOT NULL,
      quantityUnit TEXT NOT NULL,
      tabletsPerStrip REAL,
      numberOfStrips REAL,
      bottleQuantityMl REAL,
      dosage TEXT,
      notificationSettings TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Phase 1D: one row per scheduled dose the user has confirmed taking.
    -- UNIQUE guards against double-confirming the same slot (e.g. a fast
    -- double-tap) from ever producing two rows.
    CREATE TABLE IF NOT EXISTS dose_confirmations (
      id TEXT PRIMARY KEY NOT NULL,
      medicineId TEXT NOT NULL,
      date TEXT NOT NULL,
      slot TEXT NOT NULL,
      confirmedAt TEXT NOT NULL,
      UNIQUE(medicineId, date, slot)
    );
  `);
}
