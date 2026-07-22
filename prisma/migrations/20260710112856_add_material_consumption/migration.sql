-- CreateTable
CREATE TABLE "MaterialConsumption" (
    "id" TEXT NOT NULL,
    "mcNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialConsumptionItem" (
    "id" TEXT NOT NULL,
    "materialConsumptionId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialConsumptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialConsumption_mcNo_key" ON "MaterialConsumption"("mcNo");

-- CreateIndex
CREATE INDEX "MaterialConsumption_workOrderNo_idx" ON "MaterialConsumption"("workOrderNo");

-- CreateIndex
CREATE INDEX "MaterialConsumption_status_idx" ON "MaterialConsumption"("status");

-- CreateIndex
CREATE INDEX "MaterialConsumptionItem_stockItemId_idx" ON "MaterialConsumptionItem"("stockItemId");

-- AddForeignKey
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialConsumptionItem" ADD CONSTRAINT "MaterialConsumptionItem_materialConsumptionId_fkey" FOREIGN KEY ("materialConsumptionId") REFERENCES "MaterialConsumption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialConsumptionItem" ADD CONSTRAINT "MaterialConsumptionItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
