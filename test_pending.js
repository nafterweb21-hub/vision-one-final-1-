const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const commonWhere = { status: "Pending" };
  const welding = await prisma.processParameterWelding.findMany({
    where: commonWhere,
    include: {
      timesheet: {
        include: {
          routingProcess: {
            include: {
              inProcess: {
                include: {
                  workOrder: true
                }
              }
            }
          }
        }
      }
    }
  });
  console.log("Welding pending:", welding.length);
}
main().finally(() => prisma.$disconnect());
