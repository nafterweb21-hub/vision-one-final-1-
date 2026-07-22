const { PrismaClient } = require('./src/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.salesOrderItemBatch.findMany({
    include: { salesOrderItem: { include: { salesOrder: true } } }
  });
  console.log("Total Batches:", batches.length);
  batches.forEach(b => {
    console.log(`- Batch ID: ${b.id}, WO No: ${b.workOrderNo}, SO Status: ${b.salesOrderItem.salesOrder.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
