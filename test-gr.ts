import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { prisma } = await import('./src/lib/prisma');
  try {
    const goodsReceive = await prisma.goodsReceive.findUnique({
      where: { id: "cmtr5qdcg0005cguv9sm9occd" },
      include: {
        items: {
          include: {
            purchaseOrderItem: true,
          },
        },
      },
    });
    console.log("Success");
    console.log(goodsReceive);
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
