import { prisma } from './src/lib/prisma';

async function main() {
  const modes = await prisma.failureModeProfile.findMany();
  console.log(JSON.stringify(modes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
