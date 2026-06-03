import { prisma } from './src/lib/prisma';
prisma.workOrder.findMany({ include: { inProcesses: { include: { routingProcesses: true } } } }).then(wos => {
  wos.forEach(wo => {
    console.log(wo.workOrderNo, 'InProcesses:', wo.inProcesses.length, 'RoutingProcesses:', wo.inProcesses.flatMap(ip => ip.routingProcesses).length);
  });
}).catch(console.error).finally(() => prisma.$disconnect());
