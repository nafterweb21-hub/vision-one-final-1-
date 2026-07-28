-- Normalise status casing to the canonical values in `src/lib/status.ts`.
--
-- `Employee.status` was the only column defaulting to upper-case ("ACTIVE"),
-- while every other master-data table uses "Active". Any query that filtered
-- employees with `status = 'Active'` therefore returned nothing, and any query
-- that filtered another profile with `'ACTIVE'` did the same.
--
-- Written case-insensitively and idempotently so it is safe to re-run and safe
-- against rows that were already normalised by hand.

UPDATE "Employee"
SET "status" = 'Active'
WHERE lower("status") = 'active' AND "status" <> 'Active';

UPDATE "Employee"
SET "status" = 'Inactive'
WHERE lower("status") = 'inactive' AND "status" <> 'Inactive';

-- `src/app/api/seed-process-params/route.ts` created customers with 'ACTIVE',
-- which made them invisible to every `status = 'Active'` filter in the app.
UPDATE "CustomerProfile"
SET "status" = 'Active'
WHERE lower("status") = 'active' AND "status" <> 'Active';

UPDATE "CustomerProfile"
SET "status" = 'Inactive'
WHERE lower("status") = 'inactive' AND "status" <> 'Inactive';

-- Bring the column default in line with the rest of the schema.
ALTER TABLE "Employee" ALTER COLUMN "status" SET DEFAULT 'Active';
