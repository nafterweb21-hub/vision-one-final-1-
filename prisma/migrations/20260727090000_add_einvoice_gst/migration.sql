-- Employee profile refactor (nricFin -> aadharNumber, drop contactNo, add dob).
-- This drift was previously applied to some environments via `db push`; this
-- migration captures it. Existing rows are backfilled from `nricFin` so the
-- national-ID value is preserved rather than lost, and a placeholder is used
-- for any row that has no nricFin (edit it later from the Employee profile).
DROP INDEX "Employee_nricFin_key";

ALTER TABLE "Employee" ADD COLUMN "aadharNumber" TEXT;
ALTER TABLE "Employee" ADD COLUMN "dob" TIMESTAMP(3);

UPDATE "Employee"
SET "aadharNumber" = COALESCE(NULLIF("nricFin", ''), 'AADHAR-PENDING-' || "id")
WHERE "aadharNumber" IS NULL;

ALTER TABLE "Employee" ALTER COLUMN "aadharNumber" SET NOT NULL;

ALTER TABLE "Employee" DROP COLUMN "contactNo";
ALTER TABLE "Employee" DROP COLUMN "nricFin";

CREATE UNIQUE INDEX "Employee_aadharNumber_key" ON "Employee"("aadharNumber");

-- GST tax breakup + e-invoicing (IRP / IRN) fields.
ALTER TABLE "Invoice" ADD COLUMN     "ackDate" TIMESTAMP(3),
ADD COLUMN     "ackNo" TEXT,
ADD COLUMN     "cgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "einvoiceCancelReason" TEXT,
ADD COLUMN     "einvoiceCancelledAt" TIMESTAMP(3),
ADD COLUMN     "einvoiceError" TEXT,
ADD COLUMN     "einvoiceGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "einvoiceStatus" TEXT NOT NULL DEFAULT 'Not Generated',
ADD COLUMN     "ewbNo" TEXT,
ADD COLUMN     "igstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "irn" TEXT,
ADD COLUMN     "sgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "signedInvoice" TEXT,
ADD COLUMN     "signedQrCode" TEXT,
ADD COLUMN     "supplyType" TEXT;

ALTER TABLE "InvoiceItem" ADD COLUMN     "cgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "gstRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "igstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Invoice_irn_key" ON "Invoice"("irn");
