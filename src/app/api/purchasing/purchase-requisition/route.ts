import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPurchaseRequisition } from "@/lib/purchase-requisitions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { prNo: { contains: search, mode: "insensitive" } },
        { workOrderNo: { contains: search, mode: "insensitive" } },
        { requestedBy: { name: { contains: search, mode: "insensitive" } } },
        { remark: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "All") {
      where.status = status;
    } else {
      where.status = { not: "Old Version" };
    }

    const rows = await prisma.purchaseRequisition.findMany({
      where,
      include: {
        company: { select: { companyName: true } },
        workOrder: { select: { jobDescription: true } },
        requestedBy: { select: { name: true } },
      },
      orderBy: [{ prNo: "desc" }, { revision: "desc" }],
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("PR GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pr = await createPurchaseRequisition(body);
    return NextResponse.json(pr, { status: 201 });
  } catch (e: any) {
    console.error("PR POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
