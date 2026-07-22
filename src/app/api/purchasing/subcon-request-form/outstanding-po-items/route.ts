import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    const where: any = {
      purchaseOrder: {
        type: "SUBCON",
        status: "Issued",
      },
    };

    if (search) {
      where.OR = [
        { purchaseOrder: { poNo: { contains: search, mode: "insensitive" } } },
        { description: { contains: search, mode: "insensitive" } },
        { purchaseOrder: { supplier: { supplierName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const items = await prisma.purchaseOrderItem.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            company: { select: { companyName: true } },
            supplier: { 
              select: { 
                supplierName: true,
                contactPersons: true
              } 
            },
            currency: { select: { code: true } },
            purchaser: { select: { id: true, name: true } },
            contactPerson: { select: { id: true, contactPersonName: true } },
          }
        },
        poUom: { select: { uomName: true } },
        masterMainProcess: { select: { process: true } },
        masterRoutingProcess: { select: { routingProcess: true } },
        woRoutingProcess: {
          include: {
            inProcess: { select: { description: true } }
          }
        },
        subconRequestForms: {
          where: {
            status: { not: "Void" }
          },
          select: {
            quantity: true,
          }
        }
      },
      orderBy: { purchaseOrder: { poNo: "desc" } }
    });

    // Filter out items that have already been fully requested
    const availableItems = items.map(item => {
      const totalRequested = item.subconRequestForms.reduce((sum, srf) => sum + Number(srf.quantity), 0);
      return {
        ...item,
        totalRequested,
        availableQuantity: Number(item.quantity) - totalRequested
      };
    }).filter(item => item.availableQuantity > 0);

    return NextResponse.json(availableItems);
  } catch (e: any) {
    console.error("GET Outstanding PO Items error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
