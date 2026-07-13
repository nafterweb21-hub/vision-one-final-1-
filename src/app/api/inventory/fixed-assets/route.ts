import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import {
  getFixedAssets,
  createFixedAsset,
  updateFixedAsset,
  toggleFixedAssetStatus,
  deleteFixedAsset,
} from "@/lib/fixed-assets";

const MODULE = "FIXED_ASSET";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "v");
  if (error) return error;

  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    return NextResponse.json(await getFixedAssets(search));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch fixed assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "c");
  if (error) return error;

  try {
    const created = await createFixedAsset(await request.json());
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to create fixed asset" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "e");
  if (error) return error;

  try {
    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing required 'id' for update" }, { status: 400 });
    }

    return NextResponse.json(await updateFixedAsset(id, data));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to update fixed asset" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "e");
  if (error) return error;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing required 'id' for status toggle" }, { status: 400 });
    }

    return NextResponse.json(await toggleFixedAssetStatus(id));
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle fixed asset status" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "d");
  if (error) return error;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing required 'id' for deletion" }, { status: 400 });
    }

    await deleteFixedAsset(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to delete fixed asset" },
      { status: 400 }
    );
  }
}
