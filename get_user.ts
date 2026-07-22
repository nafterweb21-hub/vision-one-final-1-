import { PrismaClient } from './src/generated/prisma'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findFirst()
  console.log("USER_ID_FOUND:", user?.id)
}
main()
