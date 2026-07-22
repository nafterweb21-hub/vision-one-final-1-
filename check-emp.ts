import { prisma } from './src/lib/prisma';
prisma.employee.findMany({ include: { user: true } }).then(emps => {
  console.log('Total Employees:', emps.length);
  emps.forEach(e => console.log(e.name, e.status, e.user?.role));
}).catch(console.error).finally(() => prisma.$disconnect());
