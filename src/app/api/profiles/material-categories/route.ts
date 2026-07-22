import { NextRequest, NextResponse } from "next/server";
import { getMaterialCategories, saveMaterialCategory } from "@/lib/db-fallback";

export async function GET() {
  try {
    const categories = await getMaterialCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/profiles/material-categories failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch material categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.category || !body.category.trim()) {
      return NextResponse.json({ error: "Category Name field is mandatory" }, { status: 400 });
    }

    const data = {
      category: body.category.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveMaterialCategory(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/material-categories failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create material category" },
      { status: 500 }
    );
  }
}
