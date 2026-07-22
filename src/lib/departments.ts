import { prisma } from "@/lib/prisma";

export async function getDepartments() {
  return prisma.departmentProfile.findMany({ orderBy: { name: "asc" } });
}

export async function createDepartment(data: { name: string; remark?: string }) {
  const existing = await prisma.departmentProfile.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Department already exists");

  return prisma.departmentProfile.create({
    data: {
      name: data.name,
    },
  });
}

export async function updateDepartment(
  id: string,
  data: { remark?: string | null; status?: string }
) {
  return prisma.departmentProfile.update({
    where: { id },
    data: {
      status: data.status,
    },
  });
}

export async function deleteDepartment(id: string) {
  await prisma.departmentProfile.delete({ where: { id } });
  return true;
}
