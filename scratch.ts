import { prisma } from './src/lib/prisma';
async function main() {
    const emp = await prisma.employee.findFirst({
        where: {code: 'EMP001'},
        include: {roleProfile: true}
    });
    console.log("Employee:");
    console.log(JSON.stringify(emp, null, 2));

    const allRows = await prisma.routingProcess.findMany({
        where: { inProcess: { workOrderNo: 'WO-SO-2026-0009-001' } },
        select: {
          id: true,
          sequence: true,
          status: true,
          mainProcessId: true,
          inProcess: { select: { sn: true } },
          mainProcess: true,
          routingProcess: { select: { allowedRoles: { select: { id: true, name: true } } } },
        },
    });
    console.log("Routing processes:");
    console.log(JSON.stringify(allRows, null, 2));
}
main().finally(() => prisma.$disconnect());
