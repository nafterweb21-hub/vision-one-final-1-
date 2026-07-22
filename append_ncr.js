const fs = require('fs');

const models = `
model Ncr {
  id                                                 String              @id @default(cuid())
  ncrNo                                              String              @unique
  ncrDate                                            DateTime
  customerId                                         String
  workOrderNo                                        String
  inProcessId                                        String?
  mainProcessId                                      String?
  routingProcessId                                   String?
  requestorId                                        String
  responsiblePartyId                                 String?
  descriptionOfNonConformance                        String
  ncrQuantity                                        Int
  reworkQuantity                                     Int                 @default(0)
  useAsIsQuantity                                    Int                 @default(0)
  scrapQuantity                                      Int                 @default(0)
  otherDecisions                                     String?
  otherQuantity                                      Int                 @default(0)
  customerAcceptanceForUseAsIs                       Boolean?
  department                                         String?
  correctiveAction                                   Boolean?
  reasonToJustify                                    String?
  rootCause                                          String?
  rootCauseResponsibleStaffId                        String?
  rootCauseDate                                      DateTime?
  correctivePreventiveAction                         String?
  cpaResponsibleStaffId                              String?
  cpaDate                                            DateTime?
  followUpVerification                               String?
  actionTaken                                        String?
  verifiedConfirmedById                              String?
  verifiedConfirmedDate                              DateTime?
  status                                             String              @default("Draft")
  createdAt                                          DateTime            @default(now())
  updatedAt                                          DateTime            @updatedAt
  Employee_Ncr_cpaResponsibleStaffIdToEmployee       Employee?           @relation("Ncr_cpaResponsibleStaffIdToEmployee", fields: [cpaResponsibleStaffId], references: [id])
  CustomerProfile                                    CustomerProfile     @relation(fields: [customerId], references: [id])
  WorkOrderInProcess                                 WorkOrderInProcess? @relation(fields: [inProcessId], references: [id])
  MainProcess                                        MainProcess?        @relation(fields: [mainProcessId], references: [id])
  Employee_Ncr_requestorIdToEmployee                 Employee            @relation("Ncr_requestorIdToEmployee", fields: [requestorId], references: [id])
  Employee_Ncr_responsiblePartyIdToEmployee          Employee?           @relation("Ncr_responsiblePartyIdToEmployee", fields: [responsiblePartyId], references: [id])
  Employee_Ncr_rootCauseResponsibleStaffIdToEmployee Employee?           @relation("Ncr_rootCauseResponsibleStaffIdToEmployee", fields: [rootCauseResponsibleStaffId], references: [id])
  RoutingProcess                                     RoutingProcess?     @relation(fields: [routingProcessId], references: [id])
  Employee_Ncr_verifiedConfirmedByIdToEmployee       Employee?           @relation("Ncr_verifiedConfirmedByIdToEmployee", fields: [verifiedConfirmedById], references: [id])
  WorkOrder                                          WorkOrder           @relation(fields: [workOrderNo], references: [workOrderNo])
  NcrFailureMode                                     NcrFailureMode[]
}

model NcrFailureMode {
  id                 String             @id @default(cuid())
  ncrId              String
  failureModeId      String
  FailureModeProfile FailureModeProfile @relation(fields: [failureModeId], references: [id], onDelete: Cascade)
  Ncr                Ncr                @relation(fields: [ncrId], references: [id], onDelete: Cascade)

  @@unique([ncrId, failureModeId])
}
`;

fs.appendFileSync('prisma/schema.prisma', models);
