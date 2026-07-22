import { NextRequest, NextResponse } from "next/server";
import { getIncotermProfiles, saveIncotermProfile } from "@/lib/db-fallback";

export async function GET() {
  try {
    const types = await getIncotermProfiles();
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET /api/profiles/incoterm failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch incoterms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.incoterm || !body.incoterm.trim()) {
      return NextResponse.json({ error: "Type field is mandatory" }, { status: 400 });
    }

    const data = {
      incoterm: body.incoterm.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveIncotermProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/incoterm failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create incoterm" },
      { status: 500 }
    );
  }
}
