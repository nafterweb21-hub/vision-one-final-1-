const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
async function main() {
  const so = await prisma.salesOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: { include: { batches: true } } }
  });
  console.log(JSON.stringify(so, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
