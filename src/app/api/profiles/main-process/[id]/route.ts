import { NextRequest, NextResponse } from "next/server";
import { saveMainProcess, toggleMainProcessStatus, voidMainProcess } from "@/lib/db-fallback";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Only Remark and Status can be updated realistically, Process is immutable
    const data = {
      id,
      process: body.process, // Passed for completeness, but db-fallback should ignore changes
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const updated = await saveMainProcess(data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const { id } = await params;
    console.error(`PUT /api/profiles/main-process/${id} failed:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update main process" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status field is required" }, { status: 400 });
    }

    const updated = await toggleMainProcessStatus(id, body.status);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const { id } = await params;
    console.error(`PATCH /api/profiles/main-process/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to toggle status" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const voided = await voidMainProcess(id);
    return NextResponse.json({ success: true, data: voided });
  } catch (error: any) {
    const { id } = await params;
    console.error(`DELETE /api/profiles/main-process/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to void main process" },
      { status: 500 }
    );
  }
}
