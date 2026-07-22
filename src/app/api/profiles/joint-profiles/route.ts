import { NextRequest, NextResponse } from "next/server";
import { getJointProfiles, saveJointProfile } from "@/lib/db-fallback";

export async function GET() {
  try {
    const profiles = await getJointProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("GET /api/profiles/joint-profiles failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch joint profiles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.joint || !body.joint.trim()) {
      return NextResponse.json({ error: "Joint field is mandatory" }, { status: 400 });
    }

    const data = {
      joint: body.joint.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveJointProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/joint-profiles failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create joint profile" },
      { status: 500 }
    );
  }
}
