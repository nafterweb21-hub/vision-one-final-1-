const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const employeeBackRelations = `
  Ncr_Ncr_cpaResponsibleStaffIdToEmployee       Ncr[]                           @relation("Ncr_cpaResponsibleStaffIdToEmployee")
  Ncr_Ncr_requestorIdToEmployee                 Ncr[]                           @relation("Ncr_requestorIdToEmployee")
  Ncr_Ncr_responsiblePartyIdToEmployee          Ncr[]                           @relation("Ncr_responsiblePartyIdToEmployee")
  Ncr_Ncr_rootCauseResponsibleStaffIdToEmployee Ncr[]                           @relation("Ncr_rootCauseResponsibleStaffIdToEmployee")
  Ncr_Ncr_verifiedConfirmedByIdToEmployee       Ncr[]                           @relation("Ncr_verifiedConfirmedByIdToEmployee")
`;

schema = schema.replace(/(model Employee\s*\{[\s\S]*?)\}/, (match, p1) => p1 + employeeBackRelations + '}');
schema = schema.replace(/(model CustomerProfile\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  Ncr Ncr[]\n}');
schema = schema.replace(/(model WorkOrderInProcess\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  Ncr Ncr[]\n}');
schema = schema.replace(/(model MainProcess\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  Ncr Ncr[]\n}');
schema = schema.replace(/(model RoutingProcess\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  Ncr Ncr[]\n}');
schema = schema.replace(/(model WorkOrder\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  Ncr Ncr[]\n}');
schema = schema.replace(/(model FailureModeProfile\s*\{[\s\S]*?)\}/, (match, p1) => p1 + '  NcrFailureMode NcrFailureMode[]\n}');

fs.writeFileSync('prisma/schema.prisma', schema);
