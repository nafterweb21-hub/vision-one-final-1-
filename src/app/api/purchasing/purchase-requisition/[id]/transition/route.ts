import { NextResponse } from "next/server";
import { transitionPurchaseRequisition } from "@/lib/purchase-requisitions";
import { requirePermission } from "@/lib/authz";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission("PURCHASE_REQUISITION", "e");
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const { action } = await request.json();

    if (!action || !["submit", "void", "revise"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'submit', 'void', or 'revise'." }, { status: 400 });
    }

    const updated = await transitionPurchaseRequisition(id, action as any);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PR Transition error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
