import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requirePermission("CERTIFICATE_OF_CONFORMITY", "a");
  if (error) return error;

  try {
    const { id } = await params;
    // The checker is whoever is signed in — never a client-supplied id.
    const userId = session.user.id;

    const current = await prisma.certificateOfConformity.findUnique({
      where: { id },
      include: { deliveryOrder: true },
    });
    
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (current.status !== "Draft") {
      return NextResponse.json({ error: "Only draft COCs can be checked." }, { status: 400 });
    }

    if (current.deliveryOrder.status === "Submitted") {
      return NextResponse.json({ error: "Cannot check COC because the associated Delivery Order has already been submitted." }, { status: 400 });
    }

    await prisma.certificateOfConformity.update({
      where: { id },
      data: {
        checkedById: userId,
        checkedDate: new Date(),
        status: "Require Approval", // Move to next state
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Check COC Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
