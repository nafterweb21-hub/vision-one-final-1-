import { NextRequest, NextResponse } from "next/server";
import { 
  saveMaterialCategory, 
  toggleMaterialCategoryStatus, 
  voidMaterialCategory 
} from "@/lib/db-fallback";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.category || !body.category.trim()) {
      return NextResponse.json({ error: "Category Name field is mandatory" }, { status: 400 });
    }

    const data = {
      id,
      category: body.category.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveMaterialCategory(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("PUT /api/profiles/material-categories/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update material category" },
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

    await toggleMaterialCategoryStatus(id, body.status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/profiles/material-categories/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to toggle category status" },
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
    await voidMaterialCategory(id);
    return NextResponse.json({ success: true, message: "Record voided successfully" });
  } catch (error: any) {
    console.error("DELETE /api/profiles/material-categories/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to void material category" },
      { status: 500 }
    );
  }
}
