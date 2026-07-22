import { NextRequest, NextResponse } from "next/server";
import { 
  saveWeldingType, 
  toggleWeldingTypeStatus, 
  voidWeldingType 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.type || !body.type.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      id,
      type: body.type.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveWeldingType(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/welding-types/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update welding type" },
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

    await toggleWeldingTypeStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/welding-types/[id] failed:", error);
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
    await voidWeldingType(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/welding-types/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void welding type" },
      { status: 500 }
    );
  }
}
