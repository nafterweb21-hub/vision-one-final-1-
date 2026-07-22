import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PROFILE_REGISTRY } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const summary: Record<string, { total: number; active: number }> = {};
    
    // Loop through the profile registry and get counts
    for (const [key, meta] of Object.entries(PROFILE_REGISTRY)) {
      const model = (prisma as any)[meta.modelName];
      if (model) {
        const total = await model.count();
        const active = await model.count({ where: { status: "Active" } });
        summary[key] = { total, active };
      } else {
        summary[key] = { total: 0, active: 0 };
      }
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Failed to generate profiles summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate profiles summary" },
      { status: 500 }
    );
  }
}
