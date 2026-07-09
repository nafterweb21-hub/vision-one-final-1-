import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission("SUBCON_REQUEST_FORM", "e");
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const { action } = await req.json(); // "submit" | "void"
    
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.subconRequestForm.findUnique({
        where: { id },
      });

      if (!existing) throw new Error("Not found");

      if (action === "submit") {
        if (existing.status !== "Draft") throw new Error("Only Draft can be submitted");
        
        const updated = await tx.subconRequestForm.update({
          where: { id },
          data: { status: "Submitted" },
        });
        
        return NextResponse.json(updated);
      } 
      else if (action === "void") {
        if (existing.status === "Void") throw new Error("Already voided");
        
        const updated = await tx.subconRequestForm.update({
          where: { id },
          data: { status: "Void" },
        });
        
        return NextResponse.json(updated);
      } 
      else {
        throw new Error("Invalid action");
      }
    });
  } catch (e: any) {
    console.error("Transition SRF error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
