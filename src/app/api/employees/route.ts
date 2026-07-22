import { NextRequest, NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/employees";

export async function GET() {
  try {
    const list = await getEmployees();
    return NextResponse.json(list);
  } catch (error) {
    console.error("API GET /api/employees error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Server-side validation
    if (!body.code || !body.name || !body.nricFin || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields (Employee Code, Employee Name, NRIC/FIN, Email)." },
        { status: 400 }
      );
    }

    const employee = await createEmployee(body);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("API POST /api/employees error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create employee";
    return NextResponse.json(
      { error: msg },
      { status: 400 }
    );
  }
}
