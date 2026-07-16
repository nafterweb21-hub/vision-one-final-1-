-- Document numbering now covers document types that have no company at all
-- (quotation, sales order, NCR, COC, rework, material consumption, subcon
-- request form). Those share one global counter, so companyId becomes optional
-- and the unique key moves to a non-null scope key — Postgres treats NULLs as
-- distinct, so a nullable companyId could not enforce "one row per doc type".

ALTER TABLE "DocumentNumberFormat" DROP CONSTRAINT "DocumentNumberFormat_companyId_fkey";

ALTER TABLE "DocumentNumberFormat" ALTER COLUMN "companyId" DROP NOT NULL;

ALTER TABLE "DocumentNumberFormat" ADD COLUMN "scopeKey" TEXT;

UPDATE "DocumentNumberFormat" SET "scopeKey" = COALESCE("companyId", 'GLOBAL');

ALTER TABLE "DocumentNumberFormat" ALTER COLUMN "scopeKey" SET NOT NULL;

DROP INDEX "DocumentNumberFormat_docType_companyId_key";

CREATE UNIQUE INDEX "DocumentNumberFormat_docType_scopeKey_key"
    ON "DocumentNumberFormat"("docType", "scopeKey");

ALTER TABLE "DocumentNumberFormat"
    ADD CONSTRAINT "DocumentNumberFormat_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
