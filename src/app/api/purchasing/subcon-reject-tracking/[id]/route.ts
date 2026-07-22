import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const srt = await prisma.subconRejectTracking.findUnique({
      where: { id },
      include: {
        company: true,
        supplier: true,
        purchaseOrder: true,
        subconRequestForm: {
          include: {
            purchaseOrderItem: {
              include: {
                poUom: true,
                woRoutingProcess: {
                  include: {
                    inProcess: true,
                    mainProcess: true,
                    routingProcess: true,
                  }
                }
              }
            }
          }
        },
      },
    });

    if (!srt) {
      return NextResponse.json(
        { error: "Subcon Reject Tracking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(srt);
  } catch (error: any) {
    console.error("Error fetching Subcon Reject Tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch Subcon Reject Tracking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { rejectedQty, remark, status } = data;

    const existingSrt = await prisma.subconRejectTracking.findUnique({
      where: { id },
    });

    if (!existingSrt) {
      return NextResponse.json(
        { error: "Subcon Reject Tracking not found" },
        { status: 404 }
      );
    }

    if (existingSrt.status !== "Draft") {
      // Allow Voiding a Submitted record, but otherwise no edits to Submitted
      if (status === "Void" && existingSrt.status === "Submitted") {
        // Just voiding
      } else {
        return NextResponse.json(
          { error: "Cannot edit a submitted/voided tracking" },
          { status: 400 }
        );
      }
    }

    const updatedSrt = await prisma.$transaction(async (tx) => {
      const srt = await tx.subconRejectTracking.update({
        where: { id },
        data: {
          rejectedQty: rejectedQty !== undefined ? new Prisma.Decimal(rejectedQty) : undefined,
          remark,
          status,
        },
      });

      // If status changed to Submitted or Void, update SRF receiveStatus
      if (status === "Submitted" || status === "Void") {
        const srf = await tx.subconRequestForm.findUnique({
          where: { id: existingSrt.subconRequestFormId },
          include: { subconRejectTrackings: true },
        });

        if (srf) {
          const totalRejected = srf.subconRejectTrackings
            .filter((t) => t.status === "Submitted")
            .reduce((sum, t) => sum + Number(t.rejectedQty), 0);

          let receiveStatus = "N/A";
          if (totalRejected >= Number(srf.quantity)) {
            receiveStatus = "Fully Received";
          } else if (totalRejected > 0) {
            receiveStatus = "Partially Received";
          }

          await tx.subconRequestForm.update({
            where: { id: existingSrt.subconRequestFormId },
            data: { receiveStatus },
          });

          // Check for Routing Process fullyReceived
          if (receiveStatus === "Fully Received") {
            const srfWithPOItem = await tx.subconRequestForm.findUnique({
              where: { id: existingSrt.subconRequestFormId },
              include: { purchaseOrderItem: true },
            });
            if (srfWithPOItem?.purchaseOrderItem?.woRoutingProcessId) {
               await tx.routingProcess.update({
                  where: { id: srfWithPOItem.purchaseOrderItem.woRoutingProcessId },
                  data: { fullyReceived: true }
               });
            }
          } else {
             // If we voided and it's no longer fully received
             const srfWithPOItem = await tx.subconRequestForm.findUnique({
              where: { id: existingSrt.subconRequestFormId },
              include: { purchaseOrderItem: true },
            });
            if (srfWithPOItem?.purchaseOrderItem?.woRoutingProcessId) {
               await tx.routingProcess.update({
                  where: { id: srfWithPOItem.purchaseOrderItem.woRoutingProcessId },
                  data: { fullyReceived: false }
               });
            }
          }
        }
      }

      return srt;
    });

    return NextResponse.json(updatedSrt);
  } catch (error: any) {
    console.error("Error updating Subcon Reject Tracking:", error);
    return NextResponse.json(
      { error: "Failed to update Subcon Reject Tracking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const srt = await prisma.subconRejectTracking.findUnique({
      where: { id },
    });

    if (!srt) {
      return NextResponse.json(
        { error: "Subcon Reject Tracking not found" },
        { status: 404 }
      );
    }

    if (srt.status !== "Draft") {
      return NextResponse.json(
        { error: "Can only delete draft tracking" },
        { status: 400 }
      );
    }

    await prisma.subconRejectTracking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subcon Reject Tracking deleted" });
  } catch (error: any) {
    console.error("Error deleting Subcon Reject Tracking:", error);
    return NextResponse.json(
      { error: "Failed to delete Subcon Reject Tracking" },
      { status: 500 }
    );
  }
}
