import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import {
  getStockItems,
  createStockItem,
  updateStockItem,
  toggleStockItemStatus,
  deleteStockItem,
  type ItemType,
} from "@/lib/stock-items";

interface Config {
  /** RBAC module that owns this route. */
  moduleCode: string;
  itemType: ItemType;
  /** Lower-case noun used in error messages, e.g. "raw material". */
  label: string;
}

/**
 * The Raw Materials and Consumables endpoints differ only by RBAC module and
 * item type, so they are generated from one implementation rather than copied.
 */
export function createStockItemHandlers({ moduleCode, itemType, label }: Config) {
  const failed = (verb: string, error: any, status: number) => {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || `Failed to ${verb} ${label}` },
      { status },
    );
  };

  return {
    async GET(request: NextRequest) {
      const { error } = await requirePermission(moduleCode, "v");
      if (error) return error;

      try {
        const search = request.nextUrl.searchParams.get("search") || "";
        return NextResponse.json(await getStockItems(itemType, search));
      } catch (e: any) {
        return failed("fetch", e, 500);
      }
    },

    async POST(request: NextRequest) {
      const { error } = await requirePermission(moduleCode, "c");
      if (error) return error;

      try {
        return NextResponse.json(await createStockItem(itemType, await request.json()), { status: 201 });
      } catch (e: any) {
        return failed("create", e, 400);
      }
    },

    async PUT(request: NextRequest) {
      const { error } = await requirePermission(moduleCode, "e");
      if (error) return error;

      try {
        const { id, ...data } = await request.json();
        if (!id) {
          return NextResponse.json({ error: "Missing required 'id' for update" }, { status: 400 });
        }
        return NextResponse.json(await updateStockItem(itemType, id, data));
      } catch (e: any) {
        return failed("update", e, 400);
      }
    },

    async PATCH(request: NextRequest) {
      const { error } = await requirePermission(moduleCode, "e");
      if (error) return error;

      try {
        const { id } = await request.json();
        if (!id) {
          return NextResponse.json({ error: "Missing required 'id' for status toggle" }, { status: 400 });
        }
        return NextResponse.json(await toggleStockItemStatus(id));
      } catch (e: any) {
        return failed("toggle", e, 400);
      }
    },

    async DELETE(request: NextRequest) {
      const { error } = await requirePermission(moduleCode, "d");
      if (error) return error;

      try {
        const { id } = await request.json();
        if (!id) {
          return NextResponse.json({ error: "Missing required 'id' for deletion" }, { status: 400 });
        }
        await deleteStockItem(id);
        return NextResponse.json({ success: true });
      } catch (e: any) {
        return failed("delete", e, 400);
      }
    },
  };
}
