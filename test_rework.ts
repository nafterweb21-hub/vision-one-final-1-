import { PrismaClient } from "./src/generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.workOrderRework.count();
  console.log("Count:", count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
