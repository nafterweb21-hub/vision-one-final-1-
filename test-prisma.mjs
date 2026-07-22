import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    const items = await prisma.purchaseOrder.findMany({
      where: { type: "SUBCON" },
      orderBy: [{ poNo: "desc" }, { revision: "desc" }],
      include: {
        company: { select: { companyName: true } },
        supplier: { select: { supplierName: true } },
        purchaser: { select: { name: true } },
        workOrder: { select: { jobDescription: true } },
        purchaseRequisition: { select: { prNo: true } },
      },
    })
    console.log("Success", items.length)
  } catch(e) {
    console.error("Error", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
