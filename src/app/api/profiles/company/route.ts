import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.companyProfile.findMany({
      orderBy: { companyName: "asc" }
    });
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error("GET /api/profiles/company failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch company profiles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    const requiredFields = [
      "companyName", "address", "phoneNo", "faxNo", 
      "gstRegistrationNo", "logoName", "footerName", "uploadUrl"
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is mandatory` }, { status: 400 });
      }
    }

    const existing = await prisma.companyProfile.findUnique({
      where: { companyName: body.companyName }
    });

    if (existing) {
      return NextResponse.json({ error: "Company Name already exists" }, { status: 400 });
    }

    const created = await prisma.companyProfile.create({
      data: {
        id: crypto.randomUUID(),
        companyName: body.companyName,
        address: body.address,
        phoneNo: body.phoneNo,
        faxNo: body.faxNo,
        email: body.email || null,
        rocNo: body.rocNo || null,
        gstRegistrationNo: body.gstRegistrationNo,
        uploadUrl: body.uploadUrl,
        logoName: body.logoName,
        footerName: body.footerName,
        allowPoForWo: body.allowPoForWo || false,
        as9100RequirementNote: body.as9100RequirementNote || false,
        sezTaxRate: body.sezTaxRate !== undefined ? Number(body.sezTaxRate) : 0,
        status: body.status || "Active",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("POST /api/profiles/company failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create company profile" },
      { status: 500 }
    );
  }
}
