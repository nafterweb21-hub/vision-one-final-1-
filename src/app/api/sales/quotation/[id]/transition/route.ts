import { NextResponse } from "next/server";
import { transitionQuotation } from "@/lib/quotations";
import { requirePermission } from "@/lib/authz";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission("QUOTATION", "e");
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const { action } = await request.json();
    if (!["issue", "confirm", "void", "revise", "convertToSo", "convertToInvoice"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const result = await transitionQuotation(id, action);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Quotation transition:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
