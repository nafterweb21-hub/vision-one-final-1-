import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [employees, machines, uoms, paintingMethods, customers] = await Promise.all([
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.machineProfile.findMany({
        where: { status: "Active" },
        select: { id: true, machineNo: true, brand: true, model: true, machineCategory: true },
        orderBy: { machineNo: "asc" },
      }),
      prisma.uomProfile.findMany({
        where: { status: "Active" },
        select: { id: true, uomName: true },
        orderBy: { uomName: "asc" },
      }),
      prisma.paintingMethodProfile.findMany({
        where: { status: "Active" },
        select: { id: true, method: true },
        orderBy: { method: "asc" },
      }),
      prisma.customerProfile.findMany({
        where: { status: "Active" },
        select: { id: true, customerName: true, customerCode: true },
        orderBy: { customerName: "asc" },
      }),
    ]);

    return NextResponse.json({
      employees,
      machines,
      uoms,
      paintingMethods,
      customers,
    });
  } catch (e: any) {
    console.error("COC form-data error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
