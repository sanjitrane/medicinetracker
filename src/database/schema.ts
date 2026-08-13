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
      patientId TEXT NOT NULL DEFAULT '',
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

    -- Phase 2: the people medicines are tracked for. userId scopes every
    -- query so one signed-in user never sees another's patients.
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Installs from before Phase 2 have a medicines table with no patientId
  // column — CREATE TABLE IF NOT EXISTS above is a no-op for them, so it has
  // to be added separately. Existing rows land with patientId = '', which
  // deliberately matches no patient (architecture.md #32: patient is now the
  // parent entity) rather than guessing which patient they belonged to.
  await ensureColumn(db, 'medicines', 'patientId', "TEXT NOT NULL DEFAULT ''");

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_medicines_patientId ON medicines(patientId);
  `);
}

async function ensureColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  const alreadyExists = columns.some((existing) => existing.name === column);
  if (!alreadyExists) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}
