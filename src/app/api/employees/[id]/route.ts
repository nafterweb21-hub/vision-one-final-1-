import { NextRequest, NextResponse } from "next/server";
import { updateEmployee, deleteEmployee } from "@/lib/employees";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await req.json();

    const updated = await updateEmployee(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("API PUT /api/employees/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update employee";
    return NextResponse.json(
      { error: msg },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const deleted = await deleteEmployee(id);
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("API DELETE /api/employees/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete employee";
    return NextResponse.json(
      { error: msg },
      { status: 400 }
    );
  }
}
