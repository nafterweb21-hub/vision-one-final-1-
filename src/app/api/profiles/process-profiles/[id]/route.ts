import { NextRequest, NextResponse } from "next/server";
import { saveProcessProfile, toggleProcessProfileStatus, voidProcessProfile } from "@/lib/db-fallback";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.status) {
      // Toggle Status
      const updated = await toggleProcessProfileStatus(id, body.status);
      return NextResponse.json({ success: true, data: updated });
    }

    // Generic update (if needed, though spec says mostly immutable, we provide it)
    return NextResponse.json({ error: "Method not fully implemented for generic update" }, { status: 400 });
  } catch (error: any) {
    console.error(`PATCH /api/profiles/process-profiles/[id] failed:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await voidProcessProfile(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error(`DELETE /api/profiles/process-profiles/[id] failed:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to void profile" },
      { status: 500 }
    );
  }
}
