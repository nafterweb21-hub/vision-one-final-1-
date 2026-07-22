import { NextRequest, NextResponse } from "next/server";
import { getMainProcesses, saveMainProcess } from "@/lib/db-fallback";

export async function GET() {
  try {
    const types = await getMainProcesses();
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET /api/profiles/main-processes failed:", error);
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
    if (!body.process || !body.process.trim()) {
      return NextResponse.json({ error: "Process field is mandatory" }, { status: 400 });
    }

    const data = {
      process: body.process.trim(),
      remark: body.remark || null,
      status: body.status || "Active"
    };

    const saved = await saveMainProcess(data);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    console.error("POST /api/profiles/main-processes failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create material type" },
      { status: 500 }
    );
  }
}
