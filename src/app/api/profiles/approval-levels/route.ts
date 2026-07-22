import { NextRequest, NextResponse } from "next/server";
import { getApprovalProfiles, saveApprovalProfile } from "@/lib/db-fallback";

export async function GET() {
  try {
    const profiles = await getApprovalProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("GET /api/profiles/approval-levels failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval level profiles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple validation
    if (!body.module) {
      return NextResponse.json({ error: "Module field is mandatory" }, { status: 400 });
    }

    // Min/Max range parsed
    const minRange = body.minRange !== undefined && body.minRange !== null ? Number(body.minRange) : null;
    const maxRange = body.maxRange !== undefined && body.maxRange !== null ? Number(body.maxRange) : null;

    if (minRange !== null && maxRange !== null && minRange > maxRange) {
      return NextResponse.json({ error: "Min Range cannot exceed Max Range" }, { status: 400 });
    }

    const data = {
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
    console.error("POST /api/profiles/approval-levels failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create approval level profile" },
      { status: 500 }
    );
  }
}
