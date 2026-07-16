import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { nextDocumentNo } from "@/lib/document-numbering";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Prisma.SubconRejectTrackingWhereInput = {
      OR: [
        { srjNo: { contains: search, mode: "insensitive" } },
        {
          purchaseOrder: {
            poNo: { contains: search, mode: "insensitive" },
          },
        },
        {
          subconRequestForm: {
            srfNo: { contains: search, mode: "insensitive" },
          },
        },
      ],
    };

    const trackings = await prisma.subconRejectTracking.findMany({
      where,
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
      orderBy: { srjNo: "desc" },
    });

    const formattedTrackings = trackings.map((t) => ({
      id: t.id,
      srjNo: t.srjNo,
      srjDate: t.srjDate,
      companyName: t.company?.companyName || "—",
      supplierName: t.supplier?.supplierName || "—",
      poNo: t.purchaseOrder?.poNo || "—",
      srfNo: t.subconRequestForm?.srfNo || "—",
      workOrderNo: t.purchaseOrder?.workOrderNo || "—",
      description: t.subconRequestForm?.purchaseOrderItem?.description || "—",
      uom: t.subconRequestForm?.purchaseOrderItem?.poUom?.uomName || t.uom || "—",
      rejectedQty: t.rejectedQty,
      status: t.status,
      remark: t.remark,
    }));

    return NextResponse.json(formattedTrackings);
  } catch (error: any) {
    console.error("Error fetching Subcon Reject Trackings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Subcon Reject Trackings", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      companyId,
      supplierId,
      purchaseOrderId,
      subconRequestFormId,
      srjDate,
      rejectedQty,
      remark,
      status,
    } = data;

    const newSrt = await prisma.$transaction(async (tx) => {
      // Taken inside the transaction that writes the row — the counter's lock
      // is only held for the life of the transaction.
      const srjNo = await nextDocumentNo(tx, "SUBCON_REJECT_TRACKING", {
        companyId,
        isTaken: async (no) =>
          (await tx.subconRejectTracking.count({ where: { srjNo: no } })) > 0,
      });

      const srt = await tx.subconRejectTracking.create({
        data: {
          srjNo,
          srjDate: new Date(srjDate),
          companyId,
          supplierId,
          purchaseOrderId,
          subconRequestFormId,
          rejectedQty: new Prisma.Decimal(rejectedQty),
          remark,
          status: status || "Draft",
        },
      });

      // Update Subcon Request Form receiveStatus if status is Submitted
      if (srt.status === "Submitted") {
        const srf = await tx.subconRequestForm.findUnique({
          where: { id: subconRequestFormId },
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
            where: { id: subconRequestFormId },
            data: { receiveStatus },
          });
          
          // Note: "The specific routing process in work order can start only when subcon PO quantity has been fully received."
          // So if fully received, we should probably update the Routing Process fullyReceived = true
          if (receiveStatus === "Fully Received") {
            const srfWithPOItem = await tx.subconRequestForm.findUnique({
              where: { id: subconRequestFormId },
              include: { purchaseOrderItem: true },
            });
            if (srfWithPOItem?.purchaseOrderItem?.woRoutingProcessId) {
               await tx.routingProcess.update({
                  where: { id: srfWithPOItem.purchaseOrderItem.woRoutingProcessId },
                  data: { fullyReceived: true }
               });
            }
          }
        }
      }

      return srt;
    });

    return NextResponse.json(newSrt, { status: 201 });
  } catch (error: any) {
    console.error("Error creating Subcon Reject Tracking:", error);
    return NextResponse.json(
      { error: "Failed to create Subcon Reject Tracking" },
      { status: 500 }
    );
  }
}
