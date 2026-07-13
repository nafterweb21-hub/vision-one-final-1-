/*
  Warnings:

  - You are about to drop the `Consumable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RawMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Consumable" DROP CONSTRAINT "Consumable_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Consumable" DROP CONSTRAINT "Consumable_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Consumable" DROP CONSTRAINT "Consumable_uomId_fkey";

-- DropForeignKey
ALTER TABLE "RawMaterial" DROP CONSTRAINT "RawMaterial_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "RawMaterial" DROP CONSTRAINT "RawMaterial_materialTypeId_fkey";

-- DropForeignKey
ALTER TABLE "RawMaterial" DROP CONSTRAINT "RawMaterial_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "RawMaterial" DROP CONSTRAINT "RawMaterial_uomId_fkey";

-- DropTable
DROP TABLE "Consumable";

-- DropTable
DROP TABLE "RawMaterial";

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "materialProfileId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "materialTypeId" TEXT,
    "grade" TEXT,
    "uomId" TEXT NOT NULL,
    "openingStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reorderLevel" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "warehouse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_materialProfileId_key" ON "StockItem"("materialProfileId");

-- CreateIndex
CREATE INDEX "StockItem_itemType_idx" ON "StockItem"("itemType");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_materialProfileId_fkey" FOREIGN KEY ("materialProfileId") REFERENCES "MaterialProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "MaterialType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UomProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
