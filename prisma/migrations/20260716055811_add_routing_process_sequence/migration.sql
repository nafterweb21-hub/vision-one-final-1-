-- AlterTable
ALTER TABLE "RoutingProcess" ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign a 1-based sequence per in-process, preserving the current
-- SN ordering (SN is a numeric string in practice; fall back to text order).
WITH ordered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "inProcessId"
      ORDER BY
        CASE WHEN "sn" ~ '^[0-9]+$' THEN "sn"::int ELSE 2147483647 END,
        "sn"
    ) AS rn
  FROM "RoutingProcess"
)
UPDATE "RoutingProcess" rp
SET "sequence" = ordered.rn
FROM ordered
WHERE rp."id" = ordered."id";
