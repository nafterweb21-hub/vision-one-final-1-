import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateQuotation } from "@/lib/quotations";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const q = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: { include: { contactPersons: true, addresses: true } },
        salesperson: true,
        currency: true,
        taxType: true,
        paymentTerm: true,
        contactPerson: true,
        salesOrder: { select: { id: true, orderNo: true } },
      },
    });
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(q);
  } catch (e: any) {
    console.error("Quotation GET[id]:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const q = await updateQuotation(id, body);
    return NextResponse.json(q);
  } catch (e: any) {
    console.error("Quotation PUT:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
