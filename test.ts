import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const wo = await prisma.workOrder.findUnique({ where: { workOrderNo: 'WO-SO-2026-0015-001' }, include: { inProcesses: { include: { routingProcesses: { include: { mainProcess: true, routingProcess: true } } } } } })
  console.log(JSON.stringify(wo?.inProcesses[0]?.routingProcesses.map(rp => ({ sn: rp.sn, main: rp.mainProcess.process, routing: rp.routingProcess.routingProcess, status: rp.status })), null, 2))
}
main()
