import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOpeningStocks,
  getStockAggregates,
  netReceived,
  onHand,
  available,
} from "@/lib/stock-balance";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Fetch materials matching the search
    const materials = await prisma.materialProfile.findMany({
      where: {
        OR: [
          { partNo: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ]
      },
      include: {
        category: true,
      }
    });

    const materialIds = materials.map(m => m.id);
    if (materialIds.length === 0) {
      return NextResponse.json([]);
    }

    // On-hand quantities come from the shared document-trail derivation, the
    // same one the Raw Materials and Consumables pages read. Opening stock sits
    // on the StockItem and is what the trail is added to — without it a material
    // that was stocked but never purchased would report a balance of zero here
    // while the Raw Materials page reports its true figure.
    const [aggregates, openings] = await Promise.all([
      getStockAggregates(materialIds),
      getOpeningStocks(materialIds),
    ]);

    const results = materials.map(m => {
      const agg = aggregates.get(m.id)!;
      const opening = openings.get(m.id);
      const openingStock = opening?.openingStock ?? 0;
      const netReceivedQty = netReceived(agg);
      return {
        id: m.id,
        partNo: m.partNo || "",
        description: m.description || "",
        shape: m.shape || "",
        size: m.size || "",
        category: m.category?.name || "",
        materialStatus: m.status || "",
        // The document trail names the UOM; a material with no trail still has
        // one on its stock item.
        internalUom: agg.internalUom || opening?.uomName || "",
        openingStock,
        onOrderQty: agg.onOrderQty,
        receivedQty: agg.receivedQty,
        returnedQty: agg.returnedQty,
        consumedQty: agg.consumedQty,
        reservedQty: agg.reservedQty,
        openPoCount: agg.openPoCount,
        netReceivedQty,
        balance: onHand(agg, openingStock),
        available: available(agg, openingStock),
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
