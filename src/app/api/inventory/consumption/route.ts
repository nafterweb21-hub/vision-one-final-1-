import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import { getConsumptions, createConsumption } from "@/lib/material-consumption";

const MODULE = "MATERIAL_CONSUMPTION";

function failed(verb: string, error: any, status: number) {
  console.error(error);
  return NextResponse.json(
    { error: error?.message || `Failed to ${verb} consumption` },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "v");
  if (error) return error;

  try {
    const params = request.nextUrl.searchParams;
    return NextResponse.json(
      await getConsumptions(params.get("search") || "", params.get("status") || ""),
    );
  } catch (e: any) {
    return failed("fetch", e, 500);
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requirePermission(MODULE, "c");
  if (error) return error;

  try {
    const { submit, ...data } = await request.json();
    return NextResponse.json(await createConsumption(data, submit === true), { status: 201 });
  } catch (e: any) {
    return failed("create", e, 400);
  }
}
