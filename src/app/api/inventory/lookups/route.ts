import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";

/**
 * Picker options for the Raw Material / Consumable / Fixed Asset forms.
 *
 * Deliberately not module-scoped: it returns only the id and label of active
 * master records, which every authenticated user already sees in the pickers on
 * other screens. Scoping it to one module would 403 the dropdowns for a role
 * that can edit stock but cannot open the Employee or Supplier profile pages.
 */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const [materialProfiles, categories, materialTypes, uoms, suppliers, departments, employees] = await Promise.all([
      // A stock item attaches to a MaterialProfile rather than restating its
      // code, name and category. `stockItem` says whether one is already taken.
      prisma.materialProfile.findMany({
        where: { status: "Active" },
        select: {
          id: true,
          partNo: true,
          description: true,
          categoryId: true,
          category: { select: { name: true } },
          stockItem: { select: { id: true, itemType: true } },
        },
        orderBy: { partNo: "asc" },
      }),
      prisma.materialCategory.findMany({
        where: { status: "Active" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.materialType.findMany({
        where: { status: "Active" },
        select: { id: true, type: true },
        orderBy: { type: "asc" },
      }),
      prisma.uomProfile.findMany({
        where: { status: "Active" },
        select: { id: true, uomName: true },
        orderBy: { uomName: "asc" },
      }),
      prisma.supplierProfile.findMany({
        where: { status: "Active" },
        select: { id: true, supplierName: true },
        orderBy: { supplierName: "asc" },
      }),
      prisma.departmentProfile.findMany({
        where: { status: "Active" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      // Employee.status is upper-cased, unlike every other master table.
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      materialProfiles: materialProfiles.map((m) => ({
        id: m.id,
        label: `${m.partNo ?? "—"} — ${m.description}`,
        partNo: m.partNo ?? "",
        description: m.description,
        categoryId: m.categoryId,
        categoryName: m.category?.name ?? "",
        takenBy: m.stockItem?.itemType ?? null,
      })),
      categories: categories.map((c) => ({ id: c.id, label: c.name })),
      materialTypes: materialTypes.map((t) => ({ id: t.id, label: t.type })),
      uoms: uoms.map((u) => ({ id: u.id, label: u.uomName })),
      suppliers: suppliers.map((s) => ({ id: s.id, label: s.supplierName })),
      departments: departments.map((d) => ({ id: d.id, label: d.name })),
      employees: employees.map((e) => ({ id: e.id, label: `${e.name} (${e.code})` })),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lookups" },
      { status: 500 }
    );
  }
}
