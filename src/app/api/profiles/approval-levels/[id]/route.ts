import { NextRequest, NextResponse } from "next/server";
import { 
  saveApprovalProfile, 
  toggleApprovalProfileStatus, 
  voidApprovalProfile 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.module) {
      return NextResponse.json({ error: "Module field is mandatory" }, { status: 400 });
    }

    const minRange = body.minRange !== undefined && body.minRange !== null ? Number(body.minRange) : null;
    const maxRange = body.maxRange !== undefined && body.maxRange !== null ? Number(body.maxRange) : null;

    if (minRange !== null && maxRange !== null && minRange > maxRange) {
      return NextResponse.json({ error: "Min Range cannot exceed Max Range" }, { status: 400 });
    }

    const data = {
      id,
      module: body.module,
      actionButton: body.actionButton || null,
      minRange,
      maxRange,
      status: body.status || "Active",
      approvers: body.approvers || []
    };

    const saved = await saveApprovalProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/approval-levels/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update approval level profile" },
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

    await toggleApprovalProfileStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/approval-levels/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle profile status" },
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
    await voidApprovalProfile(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/approval-levels/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void approval level profile" },
      { status: 500 }
    );
  }
}
