-- Upstream made Employee.aadharNumber optional (commit 25444c3) by running
-- `db push` against production, so the schema change never got a migration.
-- This backfills it so migrate-based environments match the schema.
-- Widening only: dropping NOT NULL cannot fail on existing rows.
ALTER TABLE "Employee" ALTER COLUMN "aadharNumber" DROP NOT NULL;
