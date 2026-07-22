-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "partId" TEXT,
ADD COLUMN     "uomId" TEXT;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "FinishedGoodProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
