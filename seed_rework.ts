import { PrismaClient } from "./src/generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
  const wo = await prisma.workOrder.findFirst();
  if (!wo) {
    console.log("No work order found.");
    return;
  }
  const reworkCount = await prisma.workOrderRework.count();
  const reworkNo = `RWK-${new Date().getFullYear()}-${String(reworkCount + 1).padStart(4, '0')}`;
  
  await prisma.workOrderRework.create({
    data: {
      reworkNo,
      workOrderNo: wo.workOrderNo,
      originalQty: wo.quantity || 10,
      acceptedQty: 8,
      rejectedQty: 2,
      rejectedById: "demo-qc", // Replace with valid employee if needed or just string
      rejectedAt: new Date(),
      rejectionReason: "Test Rejection - Scratches on surface",
      status: "Rework In Progress"
    }
  });
  console.log("Created mock rework task:", reworkNo);
}
main().catch(console.error).finally(() => prisma.$disconnect());
