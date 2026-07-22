import { prisma } from './src/lib/prisma';

async function main() {
  const itemsWithoutBatches = await prisma.salesOrderItem.findMany({
    where: { batches: { none: {} } },
    include: { salesOrder: true }
  });

  for (const item of itemsWithoutBatches) {
    const isConfirmed = item.salesOrder.status === 'Confirmed';
    let woNo = null;
    if (isConfirmed) {
      // Find index of this item
      const allItems = await prisma.salesOrderItem.findMany({
        where: { salesOrderId: item.salesOrderId },
        orderBy: { createdAt: 'asc' }
      });
      const index = allItems.findIndex(i => i.id === item.id);
      const itemNumber = String(index + 1).padStart(3, "0");
      woNo = `WO-${item.salesOrder.orderNo}-${itemNumber}`;
    }

    await prisma.salesOrderItemBatch.create({
      data: {
        salesOrderItemId: item.id,
        quantity: item.quantity,
        deliveryDate: new Date(),
        noRoutingProcess: false,
        workOrderNo: woNo
      }
    });
    console.log(`Created batch for item ${item.id} with WO: ${woNo}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
