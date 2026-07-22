-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ApprovalLevelProfile" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "actionButton" TEXT,
    "minRange" DECIMAL(65,30),
    "maxRange" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalLevelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalPerson" (
    "id" TEXT NOT NULL,
    "approvalLevelProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialType" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "processParameterWeldingId" TEXT,

    CONSTRAINT "MaterialType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nricFin" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT NOT NULL,
    "mobileNo" TEXT,
    "gender" TEXT,
    "contactNo" TEXT,
    "employmentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContactPerson" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "telNo" TEXT,
    "mobileNo" TEXT,
    "faxNo" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialProfile" (
    "id" TEXT NOT NULL,
    "partNo" TEXT,
    "description" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "size" TEXT,
    "categoryId" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeldingTypeProfile" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processParameterWeldingId" TEXT,

    CONSTRAINT "WeldingTypeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaintingMethodProfile" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaintingMethodProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainProcess" (
    "id" TEXT NOT NULL,
    "process" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessProfile" (
    "id" TEXT NOT NULL,
    "mainProcessId" TEXT NOT NULL,
    "routingProcess" TEXT NOT NULL,
    "welding" BOOLEAN NOT NULL DEFAULT false,
    "sprayPainting" BOOLEAN NOT NULL DEFAULT false,
    "machining" BOOLEAN NOT NULL DEFAULT false,
    "costPerMinute" DECIMAL(65,30) NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProfile" (
    "id" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierContactPerson" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "telNo" TEXT,
    "mobileNo" TEXT,
    "faxNo" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierAddress" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishedGoodProfile" (
    "id" TEXT NOT NULL,
    "partNo" TEXT,
    "description" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinishedGoodProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UomProfile" (
    "id" TEXT NOT NULL,
    "uomName" TEXT NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UomProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElcometerProfile" (
    "id" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElcometerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineProfile" (
    "id" TEXT NOT NULL,
    "machineCode" TEXT NOT NULL,
    "machineNo" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "current" TEXT,
    "serialNo" TEXT,
    "machineType" TEXT,
    "operationType" TEXT,
    "remark" TEXT,
    "uploadUrl" TEXT,
    "machineCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTermProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTermProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "salespersonId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerPoRef" TEXT,
    "projectCode" TEXT,
    "paymentTermId" TEXT NOT NULL,
    "otherPaymentDetail" TEXT,
    "refContract" TEXT,
    "currencyId" TEXT NOT NULL,
    "exchangeRate" DECIMAL(65,30) NOT NULL,
    "amountBeforeTax" DECIMAL(65,30) NOT NULL,
    "taxTypeId" TEXT,
    "taxRate" DOUBLE PRECISION,
    "taxAmount" DECIMAL(65,30),
    "amountAfterTax" DECIMAL(65,30) NOT NULL,
    "contactPersonId" TEXT,
    "fax" TEXT,
    "tel" TEXT,
    "email" TEXT,
    "deliverToId" TEXT,
    "billToId" TEXT,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "uploadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "uomId" TEXT NOT NULL,
    "internalQuotationNo" TEXT NOT NULL,
    "vendorMaterialNo" TEXT,
    "materialSpecification" TEXT,
    "estimateNo" TEXT,
    "remark" TEXT,
    "uploadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItemBatch" (
    "id" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "workOrderNo" TEXT,
    "remark" TEXT,
    "noRoutingProcess" BOOLEAN NOT NULL DEFAULT false,
    "uploadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderItemBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JointProfile" (
    "id" TEXT NOT NULL,
    "joint" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JointProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailureModeProfile" (
    "id" TEXT NOT NULL,
    "failureMode" TEXT NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailureModeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "workOrderNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "internalQuotationNo" TEXT,
    "customerPoRef" TEXT,
    "projectCode" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "jobDescription" TEXT,
    "quantity" DECIMAL(65,30),
    "uom" TEXT,
    "amount" DECIMAL(65,30),
    "remark" TEXT,
    "qcAcceptance" TEXT,
    "qcById" TEXT,
    "qcDate" TIMESTAMP(3),
    "labelExpiryDate" TIMESTAMP(3),
    "labelQty" DECIMAL(65,30),
    "labelUomId" TEXT,
    "uploadUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("workOrderNo")
);

-- CreateTable
CREATE TABLE "WorkOrderInProcess" (
    "id" TEXT NOT NULL,
    "workOrderNo" TEXT NOT NULL,
    "sn" INTEGER,
    "description" TEXT NOT NULL,
    "conditionalSnId" TEXT,
    "allFlag" BOOLEAN NOT NULL DEFAULT false,
    "targetCompletionDate" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "uploadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderInProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingProcess" (
    "id" TEXT NOT NULL,
    "inProcessId" TEXT NOT NULL,
    "sn" TEXT NOT NULL,
    "mainProcessId" TEXT,
    "routingProcessId" TEXT,
    "targetCompletionDate" TIMESTAMP(3) NOT NULL,
    "fullyReceived" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "uploadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionTimesheet" (
    "id" TEXT NOT NULL,
    "routingProcessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3),
    "timeOut" TIMESTAMP(3),
    "totalMinutes" DECIMAL(65,30),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedQty" DECIMAL(65,30),
    "machineCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionTimesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessParameterWelding" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "weldingMachineId" TEXT,
    "typeOfJointId" TEXT,
    "electrodeType" TEXT,
    "weldingPosition" TEXT,
    "weldingJoint" DECIMAL(65,30),
    "weldingSizeMm" DECIMAL(65,30),
    "voltageVolts" DECIMAL(65,30),
    "currentAmp" DECIMAL(65,30),
    "coolingTimeMins" DECIMAL(65,30),
    "preHeatingC" DECIMAL(65,30),
    "postHeatingC" DECIMAL(65,30),
    "heatTreatmentHrc" DECIMAL(65,30),
    "remark" TEXT,
    "status" TEXT,
    "confirmedById" TEXT,
    "confirmedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessParameterWelding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessParameterSprayPainting" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "paintTankPressurePsi" DECIMAL(65,30) NOT NULL,
    "sprayNozzleSize" DECIMAL(65,30) NOT NULL,
    "typeOfPaint" TEXT NOT NULL,
    "remark" TEXT,
    "surfaceStartDatetime" TIMESTAMP(3),
    "surfaceEndDatetime" TIMESTAMP(3),
    "surfaceGeneralWeather" TEXT,
    "surfaceEnvTemperature" TEXT,
    "surfaceRelativeHumidity" TEXT,
    "surfaceAbrasiveType" TEXT,
    "surfaceSandpaperGrit" TEXT,
    "primerStartDatetime" TIMESTAMP(3),
    "primerEndDatetime" TIMESTAMP(3),
    "primerGeneralWeather" TEXT,
    "primerEnvTemperature" TEXT,
    "primerRelativeHumidity" TEXT,
    "primerPaintBatchNo" TEXT,
    "primerExpiryDate" TIMESTAMP(3),
    "primerDftMeasurement" TEXT,
    "topcoatStartDatetime" TIMESTAMP(3),
    "topcoatEndDatetime" TIMESTAMP(3),
    "topcoatGeneralWeather" TEXT,
    "topcoatEnvTemperature" TEXT,
    "topcoatRelativeHumidity" TEXT,
    "topcoatAbrasiveType" TEXT,
    "topcoatSandpaperGrit" TEXT,
    "topcoatStartDatetime2" TIMESTAMP(3),
    "topcoatEndDatetime2" TIMESTAMP(3),
    "topcoatGeneralWeather2" TEXT,
    "topcoatEnvTemperature2" TEXT,
    "topcoatRelativeHumidity2" TEXT,
    "topcoatPaintBatchNo" TEXT,
    "topcoatExpiryDate" TIMESTAMP(3),
    "topcoatDftMeasurement" TEXT,
    "topcoatAdhesiveTestResult" TEXT,
    "additionalRemark" TEXT,
    "status" TEXT,
    "elcometerName" TEXT,
    "elcometerSerialNoId" TEXT,
    "confirmedById" TEXT,
    "confirmedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessParameterSprayPainting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessParameterMachining" (
    "id" TEXT NOT NULL,
    "timesheetId" TEXT NOT NULL,
    "machineSerialNoId" TEXT NOT NULL,
    "cncProgramNo" TEXT,
    "testRun" TEXT,
    "specialTooling" TEXT,
    "partRuntimeHr" DECIMAL(65,30),
    "partRuntimeMins" DECIMAL(65,30),
    "remark" TEXT,
    "status" TEXT,
    "confirmedById" TEXT,
    "confirmedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessParameterMachining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachiningToolList" (
    "id" TEXT NOT NULL,
    "machiningParamId" TEXT NOT NULL,
    "toolValue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachiningToolList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "faxNo" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "rocNo" TEXT,
    "gstRegistrationNo" TEXT NOT NULL,
    "uploadUrl" TEXT NOT NULL,
    "logoName" TEXT NOT NULL,
    "footerName" TEXT NOT NULL,
    "allowPoForWo" BOOLEAN NOT NULL DEFAULT false,
    "as9100RequirementNote" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalPerson_approvalLevelProfileId_userId_key" ON "ApprovalPerson"("approvalLevelProfileId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialType_type_key" ON "MaterialType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_name_key" ON "Currency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nricFin_key" ON "Employee"("nricFin");

-- CreateIndex
CREATE UNIQUE INDEX "TaxProfile_taxType_key" ON "TaxProfile"("taxType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_customerCode_key" ON "CustomerProfile"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_customerName_key" ON "CustomerProfile"("customerName");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCategory_name_key" ON "MaterialCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProfile_partNo_key" ON "MaterialProfile"("partNo");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProfile_description_key" ON "MaterialProfile"("description");

-- CreateIndex
CREATE UNIQUE INDEX "WeldingTypeProfile_type_key" ON "WeldingTypeProfile"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PaintingMethodProfile_method_key" ON "PaintingMethodProfile"("method");

-- CreateIndex
CREATE UNIQUE INDEX "MainProcess_process_key" ON "MainProcess"("process");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessProfile_routingProcess_key" ON "ProcessProfile"("routingProcess");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_supplierCode_key" ON "SupplierProfile"("supplierCode");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_supplierName_key" ON "SupplierProfile"("supplierName");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedGoodProfile_partNo_key" ON "FinishedGoodProfile"("partNo");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedGoodProfile_description_key" ON "FinishedGoodProfile"("description");

-- CreateIndex
CREATE UNIQUE INDEX "UomProfile_uomName_key" ON "UomProfile"("uomName");

-- CreateIndex
CREATE UNIQUE INDEX "ElcometerProfile_serialNo_key" ON "ElcometerProfile"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "MachineProfile_machineCode_key" ON "MachineProfile"("machineCode");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTermProfile_name_key" ON "PaymentTermProfile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNo_key" ON "SalesOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "JointProfile_joint_key" ON "JointProfile"("joint");

-- CreateIndex
CREATE UNIQUE INDEX "FailureModeProfile_failureMode_key" ON "FailureModeProfile"("failureMode");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderInProcess_workOrderNo_description_key" ON "WorkOrderInProcess"("workOrderNo", "description");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingProcess_inProcessId_sn_key" ON "RoutingProcess"("inProcessId", "sn");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessParameterWelding_timesheetId_key" ON "ProcessParameterWelding"("timesheetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessParameterSprayPainting_timesheetId_key" ON "ProcessParameterSprayPainting"("timesheetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessParameterMachining_timesheetId_key" ON "ProcessParameterMachining"("timesheetId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_companyName_key" ON "CompanyProfile"("companyName");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPerson" ADD CONSTRAINT "ApprovalPerson_approvalLevelProfileId_fkey" FOREIGN KEY ("approvalLevelProfileId") REFERENCES "ApprovalLevelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPerson" ADD CONSTRAINT "ApprovalPerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialType" ADD CONSTRAINT "MaterialType_processParameterWeldingId_fkey" FOREIGN KEY ("processParameterWeldingId") REFERENCES "ProcessParameterWelding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContactPerson" ADD CONSTRAINT "CustomerContactPerson_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProfile" ADD CONSTRAINT "MaterialProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldingTypeProfile" ADD CONSTRAINT "WeldingTypeProfile_processParameterWeldingId_fkey" FOREIGN KEY ("processParameterWeldingId") REFERENCES "ProcessParameterWelding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessProfile" ADD CONSTRAINT "ProcessProfile_mainProcessId_fkey" FOREIGN KEY ("mainProcessId") REFERENCES "MainProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierContactPerson" ADD CONSTRAINT "SupplierContactPerson_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierAddress" ADD CONSTRAINT "SupplierAddress_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "PaymentTermProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "TaxProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "CustomerContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_deliverToId_fkey" FOREIGN KEY ("deliverToId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_billToId_fkey" FOREIGN KEY ("billToId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "FinishedGoodProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "UomProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItemBatch" ADD CONSTRAINT "SalesOrderItemBatch_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_qcById_fkey" FOREIGN KEY ("qcById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_labelUomId_fkey" FOREIGN KEY ("labelUomId") REFERENCES "UomProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderInProcess" ADD CONSTRAINT "WorkOrderInProcess_workOrderNo_fkey" FOREIGN KEY ("workOrderNo") REFERENCES "WorkOrder"("workOrderNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderInProcess" ADD CONSTRAINT "WorkOrderInProcess_conditionalSnId_fkey" FOREIGN KEY ("conditionalSnId") REFERENCES "WorkOrderInProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingProcess" ADD CONSTRAINT "RoutingProcess_inProcessId_fkey" FOREIGN KEY ("inProcessId") REFERENCES "WorkOrderInProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingProcess" ADD CONSTRAINT "RoutingProcess_mainProcessId_fkey" FOREIGN KEY ("mainProcessId") REFERENCES "MainProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingProcess" ADD CONSTRAINT "RoutingProcess_routingProcessId_fkey" FOREIGN KEY ("routingProcessId") REFERENCES "ProcessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTimesheet" ADD CONSTRAINT "ProductionTimesheet_routingProcessId_fkey" FOREIGN KEY ("routingProcessId") REFERENCES "RoutingProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionTimesheet" ADD CONSTRAINT "ProductionTimesheet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterWelding" ADD CONSTRAINT "ProcessParameterWelding_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "ProductionTimesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterWelding" ADD CONSTRAINT "ProcessParameterWelding_weldingMachineId_fkey" FOREIGN KEY ("weldingMachineId") REFERENCES "MachineProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterWelding" ADD CONSTRAINT "ProcessParameterWelding_typeOfJointId_fkey" FOREIGN KEY ("typeOfJointId") REFERENCES "JointProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterWelding" ADD CONSTRAINT "ProcessParameterWelding_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterSprayPainting" ADD CONSTRAINT "ProcessParameterSprayPainting_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "ProductionTimesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterSprayPainting" ADD CONSTRAINT "ProcessParameterSprayPainting_elcometerSerialNoId_fkey" FOREIGN KEY ("elcometerSerialNoId") REFERENCES "ElcometerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterSprayPainting" ADD CONSTRAINT "ProcessParameterSprayPainting_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterMachining" ADD CONSTRAINT "ProcessParameterMachining_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "ProductionTimesheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterMachining" ADD CONSTRAINT "ProcessParameterMachining_machineSerialNoId_fkey" FOREIGN KEY ("machineSerialNoId") REFERENCES "MachineProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessParameterMachining" ADD CONSTRAINT "ProcessParameterMachining_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachiningToolList" ADD CONSTRAINT "MachiningToolList_machiningParamId_fkey" FOREIGN KEY ("machiningParamId") REFERENCES "ProcessParameterMachining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
