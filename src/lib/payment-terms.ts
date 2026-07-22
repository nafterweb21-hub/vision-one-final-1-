import { prisma } from "@/lib/prisma";

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  remark: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function toPaymentTerm(item: any): PaymentTerm {
  return {
    id: item.id,
    name: item.name,
    days: item.days,
    remark: item.remark,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getPaymentTerms(): Promise<PaymentTerm[]> {
  const rows = await prisma.paymentTermProfile.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toPaymentTerm);
}

export async function createPaymentTerm(data: {
  name: string;
  days: number;
  remark?: string;
}): Promise<PaymentTerm> {
  const existing = await prisma.paymentTermProfile.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Payment Term already exists");

  const created = await prisma.paymentTermProfile.create({
    data: {
      name: data.name,
      days: data.days,
      remark: data.remark || null,
    },
  });
  return toPaymentTerm(created);
}

export async function updatePaymentTerm(
  id: string,
  data: { days?: number; remark?: string | null; status?: string }
): Promise<PaymentTerm> {
  const updated = await prisma.paymentTermProfile.update({
    where: { id },
    data: {
      days: data.days !== undefined ? data.days : undefined,
      remark: data.remark !== undefined ? data.remark : undefined,
      status: data.status,
    },
  });
  return toPaymentTerm(updated);
}

export async function deletePaymentTerm(id: string) {
  await prisma.paymentTermProfile.delete({ where: { id } });
  return true;
}
