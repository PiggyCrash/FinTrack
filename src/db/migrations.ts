import { getDb } from './client';


export async function runMigrations(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id                TEXT PRIMARY KEY NOT NULL,
      transaction_type  TEXT NOT NULL CHECK(transaction_type IN ('expense','income','saving','transfer')),
      amount            REAL NOT NULL CHECK(amount > 0),
      currency          TEXT NOT NULL DEFAULT 'IDR',
      category          TEXT NOT NULL,
      description       TEXT NOT NULL DEFAULT '',
      date              TEXT NOT NULL,
      sync_status       TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced')),
      updated_at        TEXT NOT NULL,
      created_at        TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_sync_status
      ON transactions(sync_status);

    CREATE INDEX IF NOT EXISTS idx_transactions_date
      ON transactions(date DESC);

    CREATE INDEX IF NOT EXISTS idx_transactions_type
      ON transactions(transaction_type);

    CREATE INDEX IF NOT EXISTS idx_transactions_category
      ON transactions(category);
  `);

  console.log('[DB] Migrations complete.');
}
