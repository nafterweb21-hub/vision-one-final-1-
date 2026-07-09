import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// Dummy function to simulate sending emails
async function sendEmailNotification(to: string, subject: string, body: string) {
  console.log("-----------------------------------------");
  console.log(`[EMAIL NOTIFICATION] To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.log("-----------------------------------------");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission("PO_APPROVAL", "a");
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, remark, currentUserId } = body; // action = 'approve' or 'reject'

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        purchaser: true,
        supplier: true,
      },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    if (po.status !== "Pending For Approval") {
      return NextResponse.json({ error: "Purchase Order is not pending approval" }, { status: 400 });
    }

    let newStatus = po.status;
    let updateData: any = { remark };

    if (action === "reject") {
      newStatus = "Rejected";
      
      // Email purchaser asking for revision
      await sendEmailNotification(
        po.purchaser?.email || "purchaser@example.com",
        `Purchase Order ${po.poNo} Rejected`,
        `Your purchase order ${po.poNo} has been rejected.\nRemark: ${remark}\nPlease revise and amend.`
      );
    } else if (action === "approve") {

      newStatus = "Issued";
      // Send email to supplier
      await sendEmailNotification(
        po.supplier?.supplierName || "supplier@example.com",
        `Purchase Order ${po.poNo} Issued`,
        `Please find the attached Purchase Order ${po.poNo}.`
      );
    }

    updateData.status = newStatus;

    const updatedPo = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPo);
  } catch (e: any) {
    console.error("POST PO Approval error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
