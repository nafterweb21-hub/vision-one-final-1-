import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await prisma.companyProfile.findUnique({
      where: { id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profiles/company/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
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

    // Determine what to update based on body
    const updateData: any = {};
    const fields = [
      "companyName", "address", "phoneNo", "faxNo", "email", 
      "rocNo", "gstRegistrationNo", "uploadUrl", 
      "logoName", "footerName", "allowPoForWo", "as9100RequirementNote", "status"
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (updateData.companyName) {
      const existing = await prisma.companyProfile.findUnique({
        where: { companyName: updateData.companyName }
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Company Name already exists" }, { status: 400 });
      }
    }

    const updated = await prisma.companyProfile.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/profiles/company/[id] failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update company profile" },
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
    
    // Instead of actual delete, we void it
    const voided = await prisma.companyProfile.update({
      where: { id },
      data: { status: "Void" }
    });

    return NextResponse.json({ success: true, data: voided });
  } catch (error: any) {
    console.error("DELETE /api/profiles/company/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to void company profile" },
      { status: 500 }
    );
  }
}
