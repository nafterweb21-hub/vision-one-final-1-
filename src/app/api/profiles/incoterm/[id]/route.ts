import { NextRequest, NextResponse } from "next/server";
import { 
  saveIncotermProfile, 
  toggleIncotermStatus, 
  voidIncotermProfile 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.incoterm || !body.incoterm.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      id,
      incoterm: body.incoterm.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveIncotermProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/incoterm/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update incoterm" },
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

    await toggleIncotermStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/incoterm/[id] failed:", error);
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
    await voidIncotermProfile(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/incoterm/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void incoterm" },
      { status: 500 }
    );
  }
}
