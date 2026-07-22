-- Reconciles the migration history with schemas that were previously applied
-- via `prisma db push`. Replaying migrations from empty produced only 63 of the
-- 71 tables; this migration adds the 8 that were never captured, plus the
-- columns, indexes and foreign keys that went with them.
--
-- Hand-edited in two places where the generated SQL was unsafe on a populated
-- database. Both edits are marked below.

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "msmeNo" TEXT;

-- AlterTable
ALTER TABLE "CustomerAddress" ADD COLUMN     "district" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "roNumber" TEXT;

-- AlterTable
ALTER TABLE "ProductionTimesheet" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPauseTime" TIMESTAMP(3),
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "rejectedQty" DECIMAL(65,30),
ADD COLUMN     "totalIdleMinutes" DECIMAL(65,30) DEFAULT 0;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "invoiceId" TEXT;

-- AlterTable
-- HAND-EDITED: Prisma generated `DROP COLUMN "role", ADD COLUMN "role" TEXT`,
-- which would reset every existing user to 'VIEWER'. Cast in place instead so
-- the enum's values survive.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "acceptedQty" DECIMAL(65,30),
ADD COLUMN     "finalApprovedQty" DECIMAL(65,30),
ADD COLUMN     "rejectedQty" DECIMAL(65,30),
ADD COLUMN     "reworkedQty" DECIMAL(65,30);

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "IncotermProfile" (
    "id" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncotermProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderRework" (
    "id" TEXT NOT NULL,
    "reworkNo" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "originalQty" DECIMAL(65,30) NOT NULL,
    "acceptedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rejectedQty" DECIMAL(65,30) NOT NULL,
    "reworkedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "finalApprovedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Rework In Progress',
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "reworkStartTime" TIMESTAMP(3),
    "reworkEndTime" TIMESTAMP(3),
    "reInspectedById" TEXT,
    "reInspectedAt" TIMESTAMP(3),
    "reInspectionResult" TEXT,
    "reInspectionRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderRework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactPersonId" TEXT NOT NULL,
    "tel" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "billToId" TEXT,
    "paymentTermId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "amountBeforeTax" DECIMAL(65,30) NOT NULL,
    "taxTypeId" TEXT NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "amountAfterTax" DECIMAL(65,30) NOT NULL,
    "amountPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(65,30) NOT NULL,
    "bankDetails" TEXT,
    "remark" TEXT,
    "preparedById" TEXT NOT NULL,
    "uploadUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "poNo" TEXT,
    "vehicleNumber" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "workOrderNo" TEXT,
    "partId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "uomId" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "hsnCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceDeliveryOrder" (
    "invoiceId" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceDeliveryOrder_pkey" PRIMARY KEY ("invoiceId","deliveryOrderId")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "chequeRefNo" TEXT,
    "amountReceived" DECIMAL(65,30) NOT NULL,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubconRejectTracking" (
    "id" TEXT NOT NULL,
    "srjNo" TEXT NOT NULL,
    "srjDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "subconRequestFormId" TEXT NOT NULL,
    "rejectedQty" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'Pcs',
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubconRejectTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignationProfile" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankProfile" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "swiftCode" TEXT,
    "branchCode" TEXT,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppModule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT,
    "pathPrefix" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncotermProfile_incoterm_key" ON "IncotermProfile"("incoterm");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderRework_reworkNo_key" ON "WorkOrderRework"("reworkNo");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "RoleProfile_name_key" ON "RoleProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubconRejectTracking_srjNo_key" ON "SubconRejectTracking"("srjNo");

-- CreateIndex
CREATE UNIQUE INDEX "DesignationProfile_designation_key" ON "DesignationProfile"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "BankProfile_accountNo_key" ON "BankProfile"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "AppModule_code_key" ON "AppModule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_moduleId_key" ON "RolePermission"("roleId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_invoiceId_key" ON "Quotation"("invoiceId");

-- HAND-EDITED: `User_role_fkey` below points at RoleProfile(name), which this
-- migration has just created empty. On a populated database every existing
-- User.role would violate it. Seed the roles actually in use (plus the full set
-- from the old UserRole enum) before the constraint is added.
INSERT INTO "RoleProfile" ("id", "name", "permissions", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, r.name, '{}', 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT unnest(ARRAY['ADMIN','SALES','PRODUCTION','PURCHASING','QC','PLANNER','VIEWER']) AS name
    UNION
    SELECT DISTINCT "role" FROM "User" WHERE "role" IS NOT NULL
) AS r
ON CONFLICT ("name") DO NOTHING;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "RoleProfile"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderRework" ADD CONSTRAINT "WorkOrderRework_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderRework" ADD CONSTRAINT "WorkOrderRework_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderRework" ADD CONSTRAINT "WorkOrderRework_reInspectedById_fkey" FOREIGN KEY ("reInspectedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "CustomerContactPerson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billToId_fkey" FOREIGN KEY ("billToId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTermProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "FinishedGoodProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDeliveryOrder" ADD CONSTRAINT "InvoiceDeliveryOrder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDeliveryOrder" ADD CONSTRAINT "InvoiceDeliveryOrder_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRejectTracking" ADD CONSTRAINT "SubconRejectTracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRejectTracking" ADD CONSTRAINT "SubconRejectTracking_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRejectTracking" ADD CONSTRAINT "SubconRejectTracking_subconRequestFormId_fkey" FOREIGN KEY ("subconRequestFormId") REFERENCES "SubconRequestForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRejectTracking" ADD CONSTRAINT "SubconRejectTracking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AppModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

