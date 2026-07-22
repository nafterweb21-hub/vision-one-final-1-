import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePurchaseRequisition } from "@/lib/purchase-requisitions";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { uom: true, materialProfile: true },
        },
        company: true,
        workOrder: true,
        requestedBy: true,
      },
    });
    if (!pr) return NextResponse.json({ error: "Purchase Requisition not found" }, { status: 404 });
    return NextResponse.json(pr);
  } catch (e: any) {
    console.error("PR GET[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const pr = await updatePurchaseRequisition(id, body);
    return NextResponse.json(pr);
  } catch (e: any) {
    console.error("PR PUT error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
