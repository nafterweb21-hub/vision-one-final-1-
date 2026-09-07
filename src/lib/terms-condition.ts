import { prisma } from "@/lib/prisma";

export async function getTermsConditions() {
  return await prisma.termsAndConditionProfile.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getTermsCondition(id: string) {
  return await prisma.termsAndConditionProfile.findUnique({
    where: { id },
  });
}

export async function createTermsCondition(data: { name: string; content: string; remark?: string }) {
  const existing = await prisma.termsAndConditionProfile.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw new Error("A Terms and Condition profile with this name already exists.");
  }
  return await prisma.termsAndConditionProfile.create({
    data,
  });
}

export async function updateTermsCondition(id: string, data: { name?: string; content?: string; remark?: string; status?: string }) {
  if (data.name) {
    const existing = await prisma.termsAndConditionProfile.findUnique({
      where: { name: data.name },
    });
    if (existing && existing.id !== id) {
      throw new Error("A Terms and Condition profile with this name already exists.");
    }
  }
  return await prisma.termsAndConditionProfile.update({
    where: { id },
    data,
  });
}

export async function deleteTermsCondition(id: string) {
  return await prisma.termsAndConditionProfile.delete({
    where: { id },
  });
}
