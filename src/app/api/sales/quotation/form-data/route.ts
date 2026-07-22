import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [employees, customers, paymentTerms, currencies, taxes, finishedGoods, uoms] = await Promise.all([
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.customerProfile.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          customerName: true,
          customerCode: true,
          contactPersons: {
            where: { status: "Active" },
            select: {
              id: true,
              contactPersonName: true,
              email: true,
              telNo: true,
              faxNo: true,
              isDefault: true,
            },
          },
          addresses: {
            where: { status: "Active" },
            select: { id: true, address: true, isDefault: true },
          },
        },
        orderBy: { customerName: "asc" },
      }),
      prisma.paymentTermProfile.findMany({
        where: { status: "Active" },
        select: { id: true, name: true, days: true },
        orderBy: { name: "asc" },
      }),
      prisma.currency.findMany({
        where: { status: "Active" },
        select: { id: true, code: true, exchangeRate: true, isDefault: true },
        orderBy: { code: "asc" },
      }),
      prisma.taxProfile.findMany({
        where: { status: "Active" },
        select: { id: true, taxType: true, taxRate: true },
        orderBy: { taxType: "asc" },
      }),
      prisma.finishedGoodProfile.findMany({
        where: { status: "Active" },
        select: { id: true, partNo: true, description: true },
        orderBy: { description: "asc" },
      }),
      prisma.uomProfile.findMany({
        where: { status: "Active" },
        select: { id: true, uomName: true },
        orderBy: { uomName: "asc" },
      }),
    ]);

    return NextResponse.json({
      employees,
      customers,
      paymentTerms,
      currencies: currencies.map((c) => ({ ...c, exchangeRate: Number(c.exchangeRate) })),
      taxes,
      finishedGoods,
      uoms,
    });
  } catch (e: any) {
    console.error("Quotation form-data:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
