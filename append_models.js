const fs = require('fs');

const models = `
model PurchaseRequisition {
  id            String   @id @default(cuid())
  prNo          String
  revision      Int      @default(0)
  date          DateTime
  status        String   @default("Draft")
  poStatus      String   @default("N/A")
  remark        String?
  
  companyId     String
  company       CompanyProfile @relation(fields: [companyId], references: [id])
  
  workOrderNo   String?
  workOrder     WorkOrder? @relation(fields: [workOrderNo], references: [workOrderNo])
  
  requestedById String
  requestedBy   Employee @relation("PrRequestedBy", fields: [requestedById], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  items         PurchaseRequisitionItem[]
  purchaseOrders PurchaseOrder[]

  @@unique([prNo, revision])
}

model PurchaseRequisitionItem {
  id                    String   @id @default(cuid())
  purchaseRequisitionId String
  purchaseRequisition   PurchaseRequisition @relation(fields: [purchaseRequisitionId], references: [id], onDelete: Cascade)
  
  fromMaterialProfile   Boolean  @default(false)
  material              String?
  description           String
  shape                 String?
  size                  String?
  
  uomId                 String
  uom                   UomProfile @relation(fields: [uomId], references: [id])
  
  quantity              Decimal
  cancelQuantity        Decimal  @default(0)
  prQuantity            Decimal
  
  deliveryDate          DateTime
  remark                String?
  
  poQuantityIssued      Decimal  @default(0)
  balanceRequirePurchase Decimal
  
  materialProfileId     String?
  materialProfile       MaterialProfile? @relation(fields: [materialProfileId], references: [id])
  
  sortOrder             Int      @default(0)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  purchaseOrderItems    PurchaseOrderItem[]
}

model PurchaseOrder {
  id                    String   @id @default(cuid())
  poNo                  String
  revision              Int      @default(0)
  date                  DateTime
  
  companyId             String
  company               CompanyProfile @relation(fields: [companyId], references: [id])
  
  supplierId            String
  supplier              SupplierProfile @relation(fields: [supplierId], references: [id])
  
  workOrderNo           String?
  workOrder             WorkOrder? @relation(fields: [workOrderNo], references: [workOrderNo])
  
  purchaseRequisitionId String?
  purchaseRequisition   PurchaseRequisition? @relation(fields: [purchaseRequisitionId], references: [id])
  
  currencyId            String
  currency              Currency @relation(fields: [currencyId], references: [id])
  
  exchangeRate          Decimal
  
  taxTypeId             String
  taxType               TaxProfile @relation(fields: [taxTypeId], references: [id])
  
  taxRate               Decimal
  amountBeforeTax       Decimal  @default(0)
  taxAmount             Decimal  @default(0)
  amountAfterTax        Decimal  @default(0)
  
  millCertificate       Boolean  @default(false)
  certOfConformance     Boolean  @default(false)
  
  contactPersonId       String?
  contactPerson         SupplierContactPerson? @relation(fields: [contactPersonId], references: [id])
  
  telNo                 String   @default("")
  faxNo                 String   @default("")
  mobileNo              String   @default("")
  email                 String   @default("")
  
  receiveStatus         String   @default("NA")
  
  purchaserId           String
  purchaser             Employee @relation("PoPurchaser", fields: [purchaserId], references: [id])
  
  remark                String   @default("")
  status                String   @default("Draft")
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  items                 PurchaseOrderItem[]
  
  @@unique([poNo, revision])
}

model PurchaseOrderItem {
  id                        String   @id @default(cuid())
  purchaseOrderId           String
  purchaseOrder             PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  
  fromMaterialProfile       Boolean  @default(false)
  material                  String   @default("")
  description               String   @default("")
  supplierMaterialNo        String   @default("")
  shape                     String   @default("")
  size                      String   @default("")
  
  quantity                  Decimal  @default(0)
  
  poUomId                   String
  poUom                     UomProfile @relation("PoItemPoUom", fields: [poUomId], references: [id])
  
  unitPrice                 Decimal  @default(0)
  amount                    Decimal  @default(0)
  conversion                Decimal  @default(1)
  
  internalUomId             String?
  internalUom               UomProfile? @relation("PoItemInternalUom", fields: [internalUomId], references: [id])
  
  internalQuantity          Decimal  @default(0)
  
  deliveryDate              DateTime @default(now())
  remark                    String   @default("")
  
  materialProfileId         String?
  materialProfile           MaterialProfile? @relation(fields: [materialProfileId], references: [id])
  
  purchaseRequisitionItemId String?
  purchaseRequisitionItem   PurchaseRequisitionItem? @relation(fields: [purchaseRequisitionItemId], references: [id])
  
  sortOrder                 Int      @default(0)
  
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', models);
