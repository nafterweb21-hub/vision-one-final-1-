-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "salespersonId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactPersonId" TEXT,
    "customerPoRef" TEXT,
    "refNo" TEXT,
    "title" TEXT NOT NULL,
    "paymentTermId" TEXT,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 60,
    "leadTime" TEXT,
    "incoterms" TEXT,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "subTotal" DECIMAL(65,30) NOT NULL,
    "lumpSumDisc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxTypeId" TEXT,
    "taxRate" DOUBLE PRECISION,
    "taxAmount" DECIMAL(65,30),
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "termsAndConditions" TEXT,
    "remark" TEXT,
    "uploadUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "salesOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_salesOrderId_key" ON "Quotation"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_revision_key" ON "Quotation"("quotationNo", "revision");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "CustomerContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTermProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
