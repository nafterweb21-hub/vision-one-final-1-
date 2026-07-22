import { NextRequest, NextResponse } from "next/server";
import { 
  savePaintingMethodProfile, 
  togglePaintingMethodStatus, 
  voidPaintingMethodProfile 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.method || !body.method.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      id,
      method: body.method.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await savePaintingMethodProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/painting-method/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update painting method" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status field is mandatory" }, { status: 400 });
    }

    await togglePaintingMethodStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/painting-method/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle type status" },
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
    
    // Business rule: No DELETE anywhere - Void only
    await voidPaintingMethodProfile(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/painting-method/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void painting method" },
      { status: 500 }
    );
  }
}
