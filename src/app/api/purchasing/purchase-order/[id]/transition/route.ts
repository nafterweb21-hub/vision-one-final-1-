import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission("PURCHASE_ORDER", "e");
  if (authError) return authError;

  try {
    const { id } = await params;
    const { action, userId } = await req.json();

    return await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { supplier: true, contactPerson: true },
      });

      if (!po) throw new Error("Not found");

      if (action === "submit") {
        if (po.status !== "Draft" && po.status !== "Rejected") {
          throw new Error("Only Draft or Rejected PO can be submitted.");
        }
        if (!po.email) {
          throw new Error("Cannot send for approval when supplier email is blank.");
        }
        // Ideally we should figure out approval tiers from ApprovalLevelProfile.
        // For now, just change status.
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "Pending For Approval" },
        });
        return NextResponse.json({ success: true, status: "Pending For Approval" });
      }

      if (action === "void") {
        if (po.status === "Void" || po.status === "Issued") {
          throw new Error("Cannot void in this status.");
        }
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "Void" },
        });
        return NextResponse.json({ success: true, status: "Void" });
      }

      if (action === "revise") {
        if (po.status !== "Approved" && po.status !== "Issued") {
          throw new Error("Only Approved or Issued PO can be revised.");
        }
        
        // Mark current as Old Version
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "Old Version" },
        });

        // Create new revision
        const items = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });

        const newPo = await tx.purchaseOrder.create({
          data: {
            poNo: po.poNo,
            revision: po.revision + 1,
            date: new Date(),
            companyId: po.companyId,
            supplierId: po.supplierId,
            workOrderNo: po.workOrderNo,
            purchaseRequisitionId: po.purchaseRequisitionId,
            currencyId: po.currencyId,
            exchangeRate: po.exchangeRate,
            taxTypeId: po.taxTypeId,
            taxRate: po.taxRate,
            amountBeforeTax: po.amountBeforeTax,
            taxAmount: po.taxAmount,
            amountAfterTax: po.amountAfterTax,
            millCertificate: po.millCertificate,
            certOfConformance: po.certOfConformance,
            contactPersonId: po.contactPersonId,
            telNo: po.telNo,
            faxNo: po.faxNo,
            mobileNo: po.mobileNo,
            email: po.email,
            purchaserId: po.purchaserId,
            receiveStatus: po.receiveStatus,
            remark: po.remark,
            status: "Revised",
            items: {
              create: items.map(it => ({
                fromMaterialProfile: it.fromMaterialProfile,
                material: it.material,
                description: it.description,
                supplierMaterialNo: it.supplierMaterialNo,
                shape: it.shape,
                size: it.size,
                quantity: it.quantity,
                poUomId: it.poUomId,
                unitPrice: it.unitPrice,
                amount: it.amount,
                conversion: it.conversion,
                internalUomId: it.internalUomId,
                internalQuantity: it.internalQuantity,
                deliveryDate: it.deliveryDate,
                remark: it.remark,
                materialProfileId: it.materialProfileId,
                purchaseRequisitionItemId: it.purchaseRequisitionItemId,
                sortOrder: it.sortOrder,
              })),
            }
          }
        });
        return NextResponse.json(newPo);
      }

      if (action === "approve1") {
        if (po.status !== "Pending For Approval") throw new Error("Invalid status");
        // For simplicity, we just move to Approved directly if we don't have robust tier 2 logic here yet.
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { 
            status: "Approved",
          },
        });
        return NextResponse.json({ success: true, status: "Approved" });
      }

      if (action === "reject") {
        if (po.status !== "Pending For Approval") throw new Error("Invalid status");
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "Rejected" },
        });
        return NextResponse.json({ success: true, status: "Rejected" });
      }

      if (action === "issue") {
        if (po.status !== "Approved") throw new Error("Only Approved PO can be issued.");
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: "Issued" },
        });
        // We'd update PR poQuantityIssued here based on items.
        return NextResponse.json({ success: true, status: "Issued" });
      }

      throw new Error("Unknown action");
    });
  } catch (e: any) {
    console.error("PO transition error:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
