import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/lib/prisma';
async function main() {
  try {
    const data = await prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { 
        customer: true,
        inProcesses: {
          select: {
            routingProcesses: {
              select: {
                sn: true,
                productionTimesheets: {
                  select: {
                    completedQty: true
                  }
                }
              }
            }
          }
        }
      },
    });
    console.log("Success:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    // await prisma.$disconnect();
  }
}
main();
