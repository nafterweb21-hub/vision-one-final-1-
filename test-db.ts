const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.salesOrder.findFirst({
  orderBy: { createdAt: "desc" },
  include: { items: true }
}).then((order: any) => {
  console.log(JSON.stringify(order, null, 2));
  process.exit(0);
});
