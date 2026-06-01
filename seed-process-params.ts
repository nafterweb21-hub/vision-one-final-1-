const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding process parameters...");

  // 1. Create a dummy employee
  const employee = await prisma.employee.upsert({
    where: { employeeNo: 'EMP-999' },
    update: {},
    create: {
      employeeNo: 'EMP-999',
      name: 'John Doe (Test)',
      designation: 'Operator',
      status: 'Active',
      joinDate: new Date(),
    }
  });

  // 2. Create a dummy WorkOrder, WorkOrderInProcess, and RoutingProcess
  const workOrder = await prisma.workOrder.upsert({
    where: { workOrderNo: 'WO-TEST-001' },
    update: {},
    create: {
      workOrderNo: 'WO-TEST-001',
      date: new Date(),
      status: 'WIP',
      quantity: 10,
      uom: 'PCS',
      jobDescription: 'Test Job for Parameters',
    }
  });

  const inProcess = await prisma.workOrderInProcess.upsert({
    where: { workOrderNo_description: { workOrderNo: 'WO-TEST-001', description: 'Test In Process' } },
    update: {},
    create: {
      workOrderNo: 'WO-TEST-001',
      description: 'Test In Process',
      targetCompletionDate: new Date(),
      status: 'WIP',
    }
  });

  const routingProcess = await prisma.routingProcess.create({
    data: {
      inProcessId: inProcess.id,
      sn: '1',
      targetCompletionDate: new Date(),
      status: 'WIP'
    }
  });

  // 3. Create dummy Machine Profile
  const machine = await prisma.machineProfile.upsert({
    where: { machineCode: 'MAC-TEST-01' },
    update: {},
    create: {
      machineCode: 'MAC-TEST-01',
      machineNo: 'M01',
      brand: 'TestBrand',
      model: 'TestModel',
      machineCategory: 'Welding',
      status: 'Active'
    }
  });

  // 4. Create dummy Timesheet for Welding
  const tsWelding = await prisma.productionTimesheet.create({
    data: {
      routingProcessId: routingProcess.id,
      employeeId: employee.id,
      timeIn: new Date(),
      timeOut: new Date(Date.now() + 3600000), // +1 hour
      completedQty: 5,
      completed: true,
      qcStatus: 'Pending',
      weldingParameter: {
        create: {
          weldingMachineId: machine.id,
          electrodeType: 'Type A',
          weldingPosition: 'Flat',
          weldingJoint: 10.5,
          weldingSizeMm: 5.0,
          voltageVolts: 220,
          currentAmp: 100,
          coolingTimeMins: 30,
          preHeatingC: 150,
          postHeatingC: 200,
          heatTreatmentHrc: 45,
          remark: 'Test Welding Parameter',
          status: 'Pending'
        }
      }
    }
  });

  // 5. Create dummy Timesheet for Spray Painting
  const tsSpray = await prisma.productionTimesheet.create({
    data: {
      routingProcessId: routingProcess.id,
      employeeId: employee.id,
      timeIn: new Date(),
      timeOut: new Date(Date.now() + 3600000),
      completedQty: 5,
      completed: true,
      qcStatus: 'Pending',
      sprayParameter: {
        create: {
          paintTankPressurePsi: 50,
          sprayNozzleSize: 1.5,
          typeOfPaint: 'Epoxy',
          remark: 'Test Spray Parameter',
          surfaceStartDatetime: new Date(),
          surfaceEndDatetime: new Date(Date.now() + 1800000),
          surfaceGeneralWeather: 'Sunny',
          surfaceEnvTemperature: '30C',
          surfaceRelativeHumidity: '60%',
          primerStartDatetime: new Date(Date.now() + 3600000),
          primerEndDatetime: new Date(Date.now() + 5400000),
          primerPaintBatchNo: 'BATCH-001',
          topcoatStartDatetime: new Date(Date.now() + 7200000),
          topcoatEndDatetime: new Date(Date.now() + 9000000),
          topcoatPaintBatchNo: 'BATCH-002',
          status: 'Pending'
        }
      }
    }
  });

  // 6. Create dummy Timesheet for Machining
  const tsMachining = await prisma.productionTimesheet.create({
    data: {
      routingProcessId: routingProcess.id,
      employeeId: employee.id,
      timeIn: new Date(),
      timeOut: new Date(Date.now() + 3600000),
      completedQty: 5,
      completed: true,
      qcStatus: 'Pending',
      machiningParameter: {
        create: {
          machineSerialNoId: machine.id,
          cncProgramNo: 'PROG-123',
          testRun: 'Yes',
          specialTooling: 'None',
          partRuntimeHr: 1,
          partRuntimeMins: 30,
          remark: 'Test Machining Parameter',
          status: 'Pending',
          toolLists: {
            create: [
              { toolValue: 10.5 },
              { toolValue: 20.0 }
            ]
          }
        }
      }
    }
  });

  console.log("Successfully seeded process parameters!");
  console.log("Welding Timesheet ID:", tsWelding.id);
  console.log("Spray Painting Timesheet ID:", tsSpray.id);
  console.log("Machining Timesheet ID:", tsMachining.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
