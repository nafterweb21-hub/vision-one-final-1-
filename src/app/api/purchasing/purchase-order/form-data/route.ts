import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { RecordStatus } from "@/lib/status";
export async function GET() {
  try {
    const [
      companies,
      employees,
      workOrders,
      suppliers,
      currencies,
      taxes,
      uoms,
      materials,
      purchaseRequisitions,
      mainProcesses,
      processProfiles,
    ] = await Promise.all([
      prisma.companyProfile.findMany({
        where: { status: "Active" },
        select: { id: true, companyName: true, allowPoForWo: true },
        orderBy: { companyName: "asc" },
      }),
      prisma.employee.findMany({
        where: { status: RecordStatus.Active },
        select: { id: true, name: true, email: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.workOrder.findMany({
        where: {
          status: {
            notIn: ["Void", "Cancelled"],
          },
        },
        select: { 
          workOrderNo: true, 
          jobDescription: true,
          inProcesses: {
            include: {
              routingProcesses: {
                include: {
                  mainProcess: true,
                  routingProcess: true
                }
              }
            }
          }
        },
        orderBy: { workOrderNo: "desc" },
      }),
      prisma.supplierProfile.findMany({
        where: { status: "Active" },
        include: {
          contactPersons: {
            where: { status: "Active" },
            select: { id: true, contactPersonName: true, telNo: true, faxNo: true, mobileNo: true, email: true, isDefault: true },
          },
        },
        orderBy: { supplierName: "asc" },
      }),
      prisma.currency.findMany({
        where: { status: "Active" },
        select: { id: true, code: true, name: true, exchangeRate: true, isDefault: true },
        orderBy: { code: "asc" },
      }),
      prisma.taxProfile.findMany({
        where: { status: "Active" },
        select: { id: true, taxType: true, taxRate: true },
        orderBy: { taxType: "asc" },
      }),
      prisma.uomProfile.findMany({
        where: { status: "Active" },
        select: { id: true, uomName: true },
        orderBy: { uomName: "asc" },
      }),
      prisma.materialProfile.findMany({
        where: { status: "Active" },
        select: { id: true, partNo: true, description: true, shape: true, size: true },
        orderBy: { description: "asc" },
      }),
      prisma.purchaseRequisition.findMany({
        where: {
          status: "Submitted", // Only submitted PRs can be converted to POs? Or Approved? Assuming Submitted based on previous schema comments.
        },
        include: {
          items: {
            include: {
              uom: true,
              materialProfile: true,
            },
          },
        },
        orderBy: { prNo: "desc" },
      }),
      prisma.mainProcess.findMany({
        where: { status: "Active" },
        select: { id: true, process: true },
        orderBy: { process: "asc" },
      }),
      prisma.processProfile.findMany({
        where: { status: "Active" },
        select: { id: true, routingProcess: true, mainProcessId: true, costPerMinute: true },
        orderBy: { routingProcess: "asc" },
      }),
    ]);

    return NextResponse.json({
      companies,
      employees,
      workOrders,
      suppliers,
      currencies,
      taxes,
      uoms,
      materials,
      purchaseRequisitions,
      mainProcesses,
      processProfiles,
    });
  } catch (e: any) {
    console.error("PO form-data error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
