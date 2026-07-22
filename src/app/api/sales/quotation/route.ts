import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createQuotation } from "@/lib/quotations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { customer: { customerName: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status && status !== "All") {
      where.status = status;
    } else {
      // Default list hides superseded revisions; use Old Version tab to see them.
      where.status = { not: "Old Version" };
    }

    const rows = await prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { customerName: true } },
        salesperson: { select: { name: true } },
        currency: { select: { code: true } },
        taxType: { select: { taxType: true, taxRate: true } },
      },
      orderBy: [{ quotationNo: "desc" }, { revision: "desc" }],
    });
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("Quotation GET:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const q = await createQuotation(body);
    return NextResponse.json(q, { status: 201 });
  } catch (e: any) {
    console.error("Quotation POST:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
