import { prisma } from "./src/lib/prisma";

async function main() {
  // Find any employee and routing process
  const employee = await prisma.employee.findFirst();
  const routingProcess = await prisma.routingProcess.findFirst();

  if (!employee || !routingProcess) {
    console.log("No employee or routing process found in database.");
    return;
  }

  console.log("Creating timesheets and parameters...");

  const ts1 = await prisma.productionTimesheet.create({
    data: {
      employeeId: employee.id,
      routingProcessId: routingProcess.id,
      timeIn: new Date(),
    }
  });

  await prisma.processParameterWelding.create({
    data: {
      timesheet: { connect: { id: ts1.id } },
      status: "Pending",
      remark: "Dummy Welding Parameter for testing",
      voltageVolts: "220",
      currentAmp: "15",
      weldingPosition: "Flat",
      weldingSizeMm: "5"
    }
  });
  console.log(`Created Welding Parameter for Timesheet ${ts1.id}`);

  const ts2 = await prisma.productionTimesheet.create({
    data: {
      employeeId: employee.id,
      routingProcessId: routingProcess.id,
      timeIn: new Date(),
    }
  });

  await prisma.processParameterSprayPainting.create({
    data: {
      timesheet: { connect: { id: ts2.id } },
      status: "Pending",
      remark: "Dummy Spray Painting Parameter for testing",
      typeOfPaint: "Acrylic",
      sprayNozzleSize: 1.5,
      paintTankPressurePsi: 0,
    }
  });
  console.log(`Created Spray Painting Parameter for Timesheet ${ts2.id}`);

  const ts3 = await prisma.productionTimesheet.create({
    data: {
      employeeId: employee.id,
      routingProcessId: routingProcess.id,
      timeIn: new Date(),
    }
  });

  const machine = await prisma.machineProfile.findFirst();

  await prisma.processParameterMachining.create({
    data: {
      timesheet: { connect: { id: ts3.id } },
      status: "Pending",
      remark: "Dummy Machining Parameter for testing",
      cncProgramNo: "PROG-123",
      testRun: "Yes",
      machine: machine ? { connect: { id: machine.id } } : undefined
    }
  });
  console.log(`Created Machining Parameter for Timesheet ${ts3.id}`);

  console.log("Successfully created test parameters.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
