-- AlterTable
ALTER TABLE "ProductionTimesheet" ADD COLUMN     "qcRemark" TEXT,
ADD COLUMN     "qcStatus" TEXT NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MATERIAL',
    "poNo" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "workOrderNo" TEXT,
    "purchaseRequisitionId" TEXT,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "taxTypeId" TEXT NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "amountBeforeTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amountAfterTax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "millCertificate" BOOLEAN NOT NULL DEFAULT false,
    "certOfConformance" BOOLEAN NOT NULL DEFAULT false,
    "contactPersonId" TEXT,
    "telNo" TEXT NOT NULL DEFAULT '',
    "faxNo" TEXT NOT NULL DEFAULT '',
    "mobileNo" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "receiveStatus" TEXT NOT NULL DEFAULT 'NA',
    "purchaserId" TEXT NOT NULL,
    "remark" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "fromMaterialProfile" BOOLEAN NOT NULL DEFAULT false,
    "material" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "supplierMaterialNo" TEXT NOT NULL DEFAULT '',
    "shape" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "hardness" TEXT,
    "thickness" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "poUomId" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "conversion" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "internalUomId" TEXT,
    "internalQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remark" TEXT NOT NULL DEFAULT '',
    "materialProfileId" TEXT,
    "purchaseRequisitionItemId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "woRoutingProcessId" TEXT,
    "masterMainProcessId" TEXT,
    "masterRoutingProcessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ncr" (
    "id" TEXT NOT NULL,
    "ncrNo" TEXT NOT NULL,
    "ncrDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "inProcessId" TEXT,
    "mainProcessId" TEXT,
    "routingProcessId" TEXT,
    "requestorId" TEXT NOT NULL,
    "responsiblePartyId" TEXT,
    "descriptionOfNonConformance" TEXT NOT NULL,
    "ncrQuantity" INTEGER NOT NULL,
    "reworkQuantity" INTEGER NOT NULL DEFAULT 0,
    "useAsIsQuantity" INTEGER NOT NULL DEFAULT 0,
    "scrapQuantity" INTEGER NOT NULL DEFAULT 0,
    "otherDecisions" TEXT,
    "otherQuantity" INTEGER NOT NULL DEFAULT 0,
    "customerAcceptanceForUseAsIs" BOOLEAN,
    "department" TEXT,
    "correctiveAction" BOOLEAN,
    "reasonToJustify" TEXT,
    "rootCause" TEXT,
    "rootCauseResponsibleStaffId" TEXT,
    "rootCauseDate" TIMESTAMP(3),
    "correctivePreventiveAction" TEXT,
    "cpaResponsibleStaffId" TEXT,
    "cpaDate" TIMESTAMP(3),
    "followUpVerification" TEXT,
    "actionTaken" TEXT,
    "verifiedConfirmedById" TEXT,
    "verifiedConfirmedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ncr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NcrFailureMode" (
    "id" TEXT NOT NULL,
    "ncrId" TEXT NOT NULL,
    "failureModeId" TEXT NOT NULL,

    CONSTRAINT "NcrFailureMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceive" (
    "id" TEXT NOT NULL,
    "grNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "taxTypeId" TEXT NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "doNo" TEXT,
    "doDate" TIMESTAMP(3),
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "remark" TEXT,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiveItem" (
    "id" TEXT NOT NULL,
    "goodsReceiveId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "receiveQty" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceiveItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReturn" (
    "id" TEXT NOT NULL,
    "rtnNo" TEXT NOT NULL,
    "rtnDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "goodsReceiveId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "taxTypeId" TEXT NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReturnItem" (
    "id" TEXT NOT NULL,
    "goodsReturnId" TEXT NOT NULL,
    "goodsReceiveItemId" TEXT NOT NULL,
    "returnQty" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "internalQty" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubconRequestForm" (
    "id" TEXT NOT NULL,
    "srfNo" TEXT NOT NULL,
    "srfDate" TIMESTAMP(3) NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "outsourcedById" TEXT NOT NULL,
    "dateRequired" TIMESTAMP(3) NOT NULL,
    "receivedById" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "receiveStatus" TEXT NOT NULL DEFAULT 'N/A',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubconRequestForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubconReturnTracking" (
    "id" TEXT NOT NULL,
    "srtNo" TEXT NOT NULL,
    "srtDate" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "subconRequestFormId" TEXT NOT NULL,
    "returnedQty" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubconReturnTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryOrder" (
    "id" TEXT NOT NULL,
    "doNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "cocRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryOrderItem" (
    "id" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "uomId" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateOfConformity" (
    "id" TEXT NOT NULL,
    "cocNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deliveryOrderId" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "drawingNo" TEXT,
    "cocQuantity" DECIMAL(65,30) NOT NULL,
    "cocUomId" TEXT NOT NULL,
    "sanNo" TEXT,
    "welderId" TEXT,
    "weldingProcess" TEXT,
    "weldingMachineId" TEXT,
    "partName" TEXT,
    "partNumber" TEXT,
    "paintingSanNo" TEXT,
    "painterId" TEXT,
    "paintingMethodId" TEXT,
    "paintingSpecification" TEXT,
    "paintThicknessSpecification" TEXT,
    "measuredTotalPaintThickness" TEXT,
    "paintBatchNo" TEXT,
    "inspectionEquipment" TEXT,
    "checkedById" TEXT,
    "checkedDate" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateOfConformity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_revision_key" ON "PurchaseOrder"("poNo", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Ncr_ncrNo_key" ON "Ncr"("ncrNo");

-- CreateIndex
CREATE UNIQUE INDEX "NcrFailureMode_ncrId_failureModeId_key" ON "NcrFailureMode"("ncrId", "failureModeId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentProfile_name_key" ON "DepartmentProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceive_grNo_key" ON "GoodsReceive"("grNo");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReturn_rtnNo_key" ON "GoodsReturn"("rtnNo");

-- CreateIndex
CREATE UNIQUE INDEX "SubconRequestForm_srfNo_key" ON "SubconRequestForm"("srfNo");

-- CreateIndex
CREATE UNIQUE INDEX "SubconReturnTracking_srtNo_key" ON "SubconReturnTracking"("srtNo");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_doNo_key" ON "DeliveryOrder"("doNo");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateOfConformity_cocNo_key" ON "CertificateOfConformity"("cocNo");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateOfConformity_deliveryOrderId_type_workOrderNo_we_key" ON "CertificateOfConformity"("deliveryOrderId", "type", "workOrderNo", "welderId", "painterId", "partNumber", "weldingMachineId", "weldingProcess");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "SupplierContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaserId_fkey" FOREIGN KEY ("purchaserId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poUomId_fkey" FOREIGN KEY ("poUomId") REFERENCES "UomProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_internalUomId_fkey" FOREIGN KEY ("internalUomId") REFERENCES "UomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialProfileId_fkey" FOREIGN KEY ("materialProfileId") REFERENCES "MaterialProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES "PurchaseRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_woRoutingProcessId_fkey" FOREIGN KEY ("woRoutingProcessId") REFERENCES "RoutingProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_masterMainProcessId_fkey" FOREIGN KEY ("masterMainProcessId") REFERENCES "MainProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_masterRoutingProcessId_fkey" FOREIGN KEY ("masterRoutingProcessId") REFERENCES "ProcessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_cpaResponsibleStaffId_fkey" FOREIGN KEY ("cpaResponsibleStaffId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_inProcessId_fkey" FOREIGN KEY ("inProcessId") REFERENCES "WorkOrderInProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_mainProcessId_fkey" FOREIGN KEY ("mainProcessId") REFERENCES "MainProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_rootCauseResponsibleStaffId_fkey" FOREIGN KEY ("rootCauseResponsibleStaffId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_routingProcessId_fkey" FOREIGN KEY ("routingProcessId") REFERENCES "RoutingProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_verifiedConfirmedById_fkey" FOREIGN KEY ("verifiedConfirmedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ncr" ADD CONSTRAINT "Ncr_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NcrFailureMode" ADD CONSTRAINT "NcrFailureMode_failureModeId_fkey" FOREIGN KEY ("failureModeId") REFERENCES "FailureModeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NcrFailureMode" ADD CONSTRAINT "NcrFailureMode_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "Ncr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceive" ADD CONSTRAINT "GoodsReceive_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiveItem" ADD CONSTRAINT "GoodsReceiveItem_goodsReceiveId_fkey" FOREIGN KEY ("goodsReceiveId") REFERENCES "GoodsReceive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiveItem" ADD CONSTRAINT "GoodsReceiveItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_goodsReceiveId_fkey" FOREIGN KEY ("goodsReceiveId") REFERENCES "GoodsReceive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturn" ADD CONSTRAINT "GoodsReturn_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturnItem" ADD CONSTRAINT "GoodsReturnItem_goodsReturnId_fkey" FOREIGN KEY ("goodsReturnId") REFERENCES "GoodsReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReturnItem" ADD CONSTRAINT "GoodsReturnItem_goodsReceiveItemId_fkey" FOREIGN KEY ("goodsReceiveItemId") REFERENCES "GoodsReceiveItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRequestForm" ADD CONSTRAINT "SubconRequestForm_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRequestForm" ADD CONSTRAINT "SubconRequestForm_outsourcedById_fkey" FOREIGN KEY ("outsourcedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconRequestForm" ADD CONSTRAINT "SubconRequestForm_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "SupplierContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconReturnTracking" ADD CONSTRAINT "SubconReturnTracking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconReturnTracking" ADD CONSTRAINT "SubconReturnTracking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconReturnTracking" ADD CONSTRAINT "SubconReturnTracking_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubconReturnTracking" ADD CONSTRAINT "SubconReturnTracking_subconRequestFormId_fkey" FOREIGN KEY ("subconRequestFormId") REFERENCES "SubconRequestForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrderItem" ADD CONSTRAINT "DeliveryOrderItem_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrderItem" ADD CONSTRAINT "DeliveryOrderItem_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrderItem" ADD CONSTRAINT "DeliveryOrderItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_deliveryOrderId_fkey" FOREIGN KEY ("deliveryOrderId") REFERENCES "DeliveryOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_cocUomId_fkey" FOREIGN KEY ("cocUomId") REFERENCES "UomProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_welderId_fkey" FOREIGN KEY ("welderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_weldingMachineId_fkey" FOREIGN KEY ("weldingMachineId") REFERENCES "MachineProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_painterId_fkey" FOREIGN KEY ("painterId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_paintingMethodId_fkey" FOREIGN KEY ("paintingMethodId") REFERENCES "PaintingMethodProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateOfConformity" ADD CONSTRAINT "CertificateOfConformity_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
