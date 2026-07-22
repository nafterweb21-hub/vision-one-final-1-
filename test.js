require('ts-node').register({ transpileOnly: true });
const { prisma } = require('./src/lib/prisma');

async function test() {
  const workOrders = await prisma.workOrder.findMany({
    where: { 
      OR: [
        { status: "Proceed" },
        { status: "Pending For QC" },
        { qcAcceptance: "Rejected" }
      ] 
    }
  });
  console.log("Work Orders found:", workOrders.length);
  const allWorkOrders = await prisma.workOrder.findMany();
  console.log("Total Work Orders:", allWorkOrders.length);
}

test();
