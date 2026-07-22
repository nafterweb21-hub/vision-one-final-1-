import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "All";

    const where: any = {};

    if (status !== "All") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { grNo: { contains: search, mode: "insensitive" } },
        { remark: { contains: search, mode: "insensitive" } },
        { supplier: { supplierName: { contains: search, mode: "insensitive" } } },
        { doNo: { contains: search, mode: "insensitive" } },
        { invoiceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.goodsReceive.findMany({
      where,
      orderBy: { grNo: "desc" },
      include: {
        company: { select: { companyName: true } },
        supplier: { select: { supplierName: true } },
        purchaseOrder: { select: { poNo: true } },
        creator: { select: { name: true } },
      },
    });

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("GET GR list error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
