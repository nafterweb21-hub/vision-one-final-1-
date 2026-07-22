import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const deps = await prisma.departmentProfile.findMany();
    console.log("Success:", deps);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
