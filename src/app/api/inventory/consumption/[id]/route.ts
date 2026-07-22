import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/authz";
import {
  getConsumption,
  updateConsumption,
  submitConsumption,
  voidConsumption,
} from "@/lib/material-consumption";

const MODULE = "MATERIAL_CONSUMPTION";

/** Next 16 hands route params to the handler as a promise. */
type Ctx = { params: Promise<{ id: string }> };

function failed(verb: string, error: any, status: number) {
  console.error(error);
  return NextResponse.json(
    { error: error?.message || `Failed to ${verb} consumption` },
    { status },
  );
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { error } = await requirePermission(MODULE, "v");
  if (error) return error;

  try {
    const { id } = await params;
    return NextResponse.json(await getConsumption(id));
  } catch (e: any) {
    return failed("fetch", e, 404);
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { error } = await requirePermission(MODULE, "e");
  if (error) return error;

  try {
    const { id } = await params;
    return NextResponse.json(await updateConsumption(id, await request.json()));
  } catch (e: any) {
    return failed("update", e, 400);
  }
}

/**
 * Status transitions. Submit moves stock, void reverses it — both are guarded
 * by the edit permission, and neither ever removes the document.
 */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { error } = await requirePermission(MODULE, "e");
  if (error) return error;

  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action === "submit") return NextResponse.json(await submitConsumption(id));
    if (action === "void") return NextResponse.json(await voidConsumption(id));

    return NextResponse.json(
      { error: `Unknown action "${action}". Expected "submit" or "void".` },
      { status: 400 },
    );
  } catch (e: any) {
    return failed("update", e, 400);
  }
}
