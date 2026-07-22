import { NextRequest, NextResponse } from "next/server";
import { getProcessProfiles, saveProcessProfile } from "@/lib/db-fallback";

export async function GET() {
  try {
    const profiles = await getProcessProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("GET /api/profiles/process-profiles failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch process profiles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.mainProcessId || !body.mainProcessId.trim()) {
      return NextResponse.json({ error: "Main Process is mandatory" }, { status: 400 });
    }
    if (!body.routingProcess || !body.routingProcess.trim()) {
      return NextResponse.json({ error: "Routing Process is mandatory" }, { status: 400 });
    }
    if (body.costPerMinute === undefined || body.costPerMinute === null || body.costPerMinute < 0) {
      return NextResponse.json({ error: "Valid Cost Per Minute is mandatory" }, { status: 400 });
    }

    const data = {
      mainProcessId: body.mainProcessId.trim(),
      routingProcess: body.routingProcess.trim(),
      welding: Boolean(body.welding),
      sprayPainting: Boolean(body.sprayPainting),
      machining: Boolean(body.machining),
      costPerMinute: Number(body.costPerMinute),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveProcessProfile(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/process-profiles failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create process profile" },
      { status: 500 }
    );
  }
}
