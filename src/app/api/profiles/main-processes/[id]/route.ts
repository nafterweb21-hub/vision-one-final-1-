import { NextRequest, NextResponse } from "next/server";
import { 
  saveMainProcess, 
  toggleMainProcessStatus, 
  voidMainProcess 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.process || !body.process.trim()) {
      return NextResponse.json({ error: "Process field is mandatory" }, { status: 400 });
    }

    const data = {
      id,
      process: body.process.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveMainProcess(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/main-processes/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update material type" },
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

    await toggleMainProcessStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/main-processes/[id] failed:", error);
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
    await voidMainProcess(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/main-processes/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void material type" },
      { status: 500 }
    );
  }
}
