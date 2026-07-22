import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationNo = searchParams.get("quotationNo");
    if (!quotationNo) {
      return NextResponse.json({ error: "quotationNo is required" }, { status: 400 });
    }

    const rows = await prisma.quotation.findMany({
      where: { quotationNo },
      include: {
        customer: { select: { customerName: true } },
        salesperson: { select: { name: true } },
        currency: { select: { code: true } },
      },
      orderBy: { revision: "desc" },
    });
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("Quotation history GET:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
