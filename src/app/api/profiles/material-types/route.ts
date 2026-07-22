import { NextRequest, NextResponse } from "next/server";
import { getMaterialTypes, saveMaterialType } from "@/lib/db-fallback";

export async function GET() {
  try {
    const types = await getMaterialTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET /api/profiles/material-types failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch material types" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.type || !body.type.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      type: body.type.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveMaterialType(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/material-types failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create material type" },
      { status: 500 }
    );
  }
}
