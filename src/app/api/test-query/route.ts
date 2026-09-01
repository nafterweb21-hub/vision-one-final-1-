import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const wo = await prisma.workOrder.findUnique({
    where: { workOrderNo: 'WO-SO-2026-0005-001' },
    include: {
      inProcesses: {
        include: {
          routingProcesses: {
            orderBy: { sn: 'asc' },
            include: {
              routingProcess: true,
              productionTimesheets: true,
              qualityControls: true,
            }
          }
        }
      }
    }
  });
  return NextResponse.json({ wo });
}
