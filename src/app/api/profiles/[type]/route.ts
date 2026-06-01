import { NextRequest, NextResponse } from "next/server";
import {
  getProfileItems,
  createProfileItem,
  updateProfileItem,
  toggleProfileItemStatus,
  deleteProfileItem,
  PROFILE_REGISTRY,
} from "@/lib/profiles";

// Helper to check if the profile type is valid
function validateType(type: string) {
  if (!PROFILE_REGISTRY[type]) {
    return NextResponse.json(
      { error: `Invalid profile type: '${type}'` },
      { status: 400 }
    );
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const errorRes = validateType(type);
    if (errorRes) return errorRes;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const items = await getProfileItems(type, search, activeOnly);
    return NextResponse.json(items);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile items" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const errorRes = validateType(type);
    if (errorRes) return errorRes;

    const body = await request.json();
    const newItem = await createProfileItem(type, body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to create profile item" },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const errorRes = validateType(type);
    if (errorRes) return errorRes;

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required 'id' for update" },
        { status: 400 }
      );
    }

    const updatedItem = await updateProfileItem(type, id, data);
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile item" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const errorRes = validateType(type);
    if (errorRes) return errorRes;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required 'id' for status toggle" },
        { status: 400 }
      );
    }

    const updatedItem = await toggleProfileItemStatus(type, id);
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle profile item status" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const errorRes = validateType(type);
    if (errorRes) return errorRes;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required 'id' for deletion" },
        { status: 400 }
      );
    }

    await deleteProfileItem(type, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to delete profile item" },
      { status: 400 }
    );
  }
}
