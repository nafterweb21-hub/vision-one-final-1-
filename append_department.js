const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const departmentModel = `
model DepartmentProfile {
  id        String   @id @default(cuid())
  name      String   @unique
  status    String   @default("Active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

fs.appendFileSync('prisma/schema.prisma', departmentModel);
