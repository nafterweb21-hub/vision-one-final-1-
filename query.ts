import { prisma } from './src/lib/prisma'

async function main() {
  const poStatuses = await prisma.purchaseOrder.findMany({ select: { status: true }, distinct: ['status'] });
  console.log("PO Statuses:", poStatuses);
  
  const ncrStatuses = await prisma.ncr.findMany({ select: { status: true }, distinct: ['status'] });
  console.log("NCR Statuses:", ncrStatuses);
  
  const woStatuses = await prisma.workOrder.findMany({ select: { status: true }, distinct: ['status'] });
  console.log("WO Statuses:", woStatuses);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
