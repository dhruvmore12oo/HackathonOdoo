/**
 * Phase 4 — Budgeting & Expense Tracking Schema.
 * Extends expenses table with financial fields, adds budget_settings,
 * and creates expense_status enum.
 */
export const up = `

-- ============================================
-- ENUM: expense_status
-- ============================================
DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('planned', 'pending', 'paid', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Add missing values to expense_category
-- ============================================
DO $$ BEGIN ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'hotel'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'shopping'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'emergency'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'other'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- Extend expenses table
-- ============================================
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS activity_id          UUID REFERENCES section_activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title                VARCHAR(200),
  ADD COLUMN IF NOT EXISTS currency             VARCHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS status               expense_status NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS payment_method       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vendor               VARCHAR(200),
  ADD COLUMN IF NOT EXISTS receipt_url           TEXT,
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expense_date          DATE,
  ADD COLUMN IF NOT EXISTS is_estimated          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes                 TEXT,
  ADD COLUMN IF NOT EXISTS metadata              JSONB DEFAULT '{}';

-- ============================================
-- Budget settings per trip
-- ============================================
CREATE TABLE IF NOT EXISTS budget_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id               UUID NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  daily_budget          DECIMAL(12,2) DEFAULT 0,
  category_limits       JSONB DEFAULT '{}',
  warning_threshold     DECIMAL(5,2) DEFAULT 80.00,
  preferred_currency    VARCHAR(3) DEFAULT 'INR',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Performance indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_expenses_trip_category ON expenses (trip_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses (trip_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_status ON expenses (trip_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_section ON expenses (section_id);
CREATE INDEX IF NOT EXISTS idx_expenses_activity ON expenses (activity_id);

-- ============================================
-- updated_at trigger for budget_settings
-- ============================================
DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at ON budget_settings;
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON budget_settings
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
END $$;
`;

export const down = `
DROP INDEX IF EXISTS idx_expenses_activity;
DROP INDEX IF EXISTS idx_expenses_section;
DROP INDEX IF EXISTS idx_expenses_trip_status;
DROP INDEX IF EXISTS idx_expenses_trip_date;
DROP INDEX IF EXISTS idx_expenses_trip_category;
DROP TABLE IF EXISTS budget_settings CASCADE;

ALTER TABLE expenses
  DROP COLUMN IF EXISTS activity_id,
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS vendor,
  DROP COLUMN IF EXISTS receipt_url,
  DROP COLUMN IF EXISTS transaction_reference,
  DROP COLUMN IF EXISTS expense_date,
  DROP COLUMN IF EXISTS is_estimated,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS metadata;

DROP TYPE IF EXISTS expense_status;
`;
