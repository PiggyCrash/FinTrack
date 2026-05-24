-- PostgreSQL DDL migration for FinTrack
-- Run this against your PostgreSQL database before starting PostgREST.

CREATE TABLE IF NOT EXISTS transactions (
  id                TEXT        PRIMARY KEY NOT NULL,
  transaction_type  TEXT        NOT NULL,
  amount            NUMERIC(15,2) NOT NULL,
  currency          TEXT        NOT NULL DEFAULT 'IDR',
  category          TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  date              TIMESTAMPTZ NOT NULL,
  sync_status       TEXT        NOT NULL DEFAULT 'synced',
  updated_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL
);

-- Constraints
ALTER TABLE transactions
  ADD CONSTRAINT chk_tx_type CHECK (
    transaction_type IN ('expense','income','saving','transfer')
  );

ALTER TABLE transactions
  ADD CONSTRAINT chk_sync_status CHECK (
    sync_status IN ('pending','synced')
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pg_transactions_date
  ON transactions(date DESC);

CREATE INDEX IF NOT EXISTS idx_pg_transactions_type
  ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_pg_transactions_category
  ON transactions(category);

-- PostgREST upsert conflict resolution:
-- The client sends "Prefer: resolution=merge-duplicates"
-- PostgREST generates:
--   INSERT ... ON CONFLICT (id) DO UPDATE SET ...
-- We add a guard so only newer rows win (last-write-wins via updated_at).
-- This is enforced by a trigger:

CREATE OR REPLACE FUNCTION prevent_stale_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.updated_at IS NOT NULL AND NEW.updated_at <= OLD.updated_at THEN
    RETURN OLD; -- silently discard stale update
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_stale ON transactions;
CREATE TRIGGER trg_prevent_stale
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_stale_update();
