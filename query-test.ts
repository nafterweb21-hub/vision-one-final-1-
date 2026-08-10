import { PrismaClient } from "./src/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const processes = await prisma.processProfile.findMany();
  console.log("Process Profiles:", processes);
  const mainProcesses = await prisma.mainProcess.findMany();
  console.log("Main Processes:", mainProcesses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
