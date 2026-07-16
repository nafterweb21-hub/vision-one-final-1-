-- CreateTable
CREATE TABLE "DocumentNumberFormat" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "periodFormat" TEXT NOT NULL DEFAULT 'NONE',
    "separator" TEXT NOT NULL DEFAULT '',
    "sequenceLength" INTEGER NOT NULL DEFAULT 5,
    "suffix" TEXT NOT NULL DEFAULT '',
    "includeRevision" BOOLEAN NOT NULL DEFAULT false,
    "resetPeriod" TEXT NOT NULL DEFAULT 'NEVER',
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "periodKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentNumberFormat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentNumberFormat_docType_companyId_key" ON "DocumentNumberFormat"("docType", "companyId");

-- AddForeignKey
ALTER TABLE "DocumentNumberFormat" ADD CONSTRAINT "DocumentNumberFormat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed every company with the invoice format that was hardcoded until now
-- (INV + 2-digit year + 5-digit sequence + -R{revision}, resetting yearly), so
-- switching to the configurable engine is a no-op until an admin changes it.
--
-- The counter starts above the highest invoice already issued under this year's
-- prefix. That maximum is taken across all companies, not per company, because
-- the old generator numbered globally — seeding each company from its own
-- maximum would reissue numbers another company already holds, and invoiceNo is
-- globally unique.
INSERT INTO "DocumentNumberFormat" (
    "id", "docType", "companyId", "prefix", "periodFormat", "separator",
    "sequenceLength", "suffix", "includeRevision", "resetPeriod",
    "nextSequence", "periodKey", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    'INVOICE',
    c."id",
    'INV', 'YY', '',
    5, '', true, 'YEARLY',
    (
        SELECT COALESCE(MAX(substring(i."invoiceNo" FROM '^INV[0-9]{2}([0-9]+)-R[0-9]+$')::int), 0) + 1
        FROM "Invoice" i
        WHERE i."invoiceNo" ~ ('^INV' || to_char(now(), 'YY') || '[0-9]+-R[0-9]+$')
    ),
    to_char(now(), 'YYYY'),
    now(), now()
FROM "CompanyProfile" c;
