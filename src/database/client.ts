import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './schema';

const DATABASE_NAME = 'medicine-tracker.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

/**
 * Module-level singleton rather than `useSQLiteContext()` — the repository
 * layer sits below the store, outside the component tree, so it needs a
 * plain reference rather than a hook.
 */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return databasePromise;
}
