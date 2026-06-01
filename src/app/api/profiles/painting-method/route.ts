import { NextRequest, NextResponse } from "next/server";
import { getPaintingMethodProfiles, savePaintingMethodProfile } from "@/lib/db-fallback";

export async function GET() {
  try {
    const types = await getPaintingMethodProfiles();
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET /api/profiles/painting-method failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch painting methods" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.method || !body.method.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      method: body.method.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await savePaintingMethodProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/painting-method failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create painting method" },
      { status: 500 }
    );
  }
}
