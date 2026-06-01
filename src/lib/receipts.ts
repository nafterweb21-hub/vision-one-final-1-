import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";

const Prisma_Decimal = Prisma.Decimal;

export type ReceiptStatus = "Draft" | "Confirmed" | "Void";

export async function nextReceiptNo(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `RCPT${currentYear}`;

  const latest = await prisma.receipt.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: "desc" },
    select: { receiptNo: true },
  });

  let runningNumber = 1;
  if (latest?.receiptNo) {
    const match = latest.receiptNo.match(/RCPT\d{2}(\d{5})/);
    if (match && match[1]) {
      runningNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(runningNumber).padStart(5, "0")}`;
}

export const receiptFormSchema = z.object({
  receiptDate: z.string().or(z.date()),
  companyId: z.string().min(1, "Company is required"),
  customerId: z.string().min(1, "Customer is required"),
  invoiceId: z.string().min(1, "Invoice is required"),
  paymentMethod: z.string().min(1, "Payment Method is required"),
  chequeRefNo: z.string().optional().nullable(),
  amountReceived: z.union([z.number(), z.string()]).refine((val) => Number(val) > 0, "Amount must be greater than 0"),
  currencyId: z.string().min(1, "Currency is required"),
  exchangeRate: z.union([z.number(), z.string()]).refine((val) => Number(val) > 0, "Exchange Rate must be greater than 0"),
  remark: z.string().optional().nullable(),
});

export type ReceiptInput = z.infer<typeof receiptFormSchema>;

const cleanStr = (v: any) => (v == null || v === "" ? null : String(v));

export async function createReceipt(input: ReceiptInput & { creatorId: string }) {
  const validated = receiptFormSchema.parse(input);

  const receiptNo = await nextReceiptNo();

  return prisma.receipt.create({
    data: {
      receiptNo,
      receiptDate: new Date(validated.receiptDate),
      companyId: validated.companyId,
      customerId: validated.customerId,
      invoiceId: validated.invoiceId,
      paymentMethod: validated.paymentMethod,
      chequeRefNo: cleanStr(validated.chequeRefNo),
      amountReceived: new Prisma_Decimal(validated.amountReceived),
      currencyId: validated.currencyId,
      exchangeRate: new Prisma_Decimal(validated.exchangeRate),
      remark: cleanStr(validated.remark),
      creatorId: input.creatorId,
      status: "Draft",
    },
  });
}

export async function updateReceipt(id: string, input: ReceiptInput) {
  const existing = await prisma.receipt.findUnique({ where: { id } });
  if (!existing) throw new Error("Receipt not found");
  if (existing.status !== "Draft") throw new Error("Only Draft receipts can be edited");

  const validated = receiptFormSchema.parse(input);

  return prisma.receipt.update({
    where: { id },
    data: {
      receiptDate: new Date(validated.receiptDate),
      companyId: validated.companyId,
      customerId: validated.customerId,
      invoiceId: validated.invoiceId,
      paymentMethod: validated.paymentMethod,
      chequeRefNo: cleanStr(validated.chequeRefNo),
      amountReceived: new Prisma_Decimal(validated.amountReceived),
      currencyId: validated.currencyId,
      exchangeRate: new Prisma_Decimal(validated.exchangeRate),
      remark: cleanStr(validated.remark),
    },
  });
}

export type ReceiptAction = "confirm" | "void";

export async function transitionReceipt(id: string, action: ReceiptAction) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { invoice: true },
  });
  if (!receipt) throw new Error("Receipt not found");

  if (action === "confirm") {
    if (receipt.status !== "Draft") throw new Error("Only Draft receipts can be confirmed");
    
    return prisma.$transaction(async (tx) => {
      // Re-fetch invoice with lock to prevent race conditions on balance update if needed
      // but Prisma doesn't have native row locks without raw queries easily, so we just calculate delta.
      const invoice = await tx.invoice.findUnique({ where: { id: receipt.invoiceId } });
      if (!invoice) throw new Error("Related Invoice not found");

      const amountToReceive = Number(receipt.amountReceived);
      const currentBalanceDue = Number(invoice.balanceDue);
      
      if (amountToReceive > currentBalanceDue) {
        throw new Error(`Amount received (${amountToReceive}) cannot exceed invoice balance due (${currentBalanceDue})`);
      }

      const newAmountPaid = Number(invoice.amountPaid) + amountToReceive;
      const newBalanceDue = currentBalanceDue - amountToReceive;

      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = "Fully Paid";
      } else if (newAmountPaid > 0) {
        newStatus = "Partially Paid";
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: new Prisma_Decimal(newAmountPaid),
          balanceDue: new Prisma_Decimal(newBalanceDue),
          status: newStatus,
        },
      });

      return tx.receipt.update({
        where: { id },
        data: { status: "Confirmed" },
      });
    });
  }

  if (action === "void") {
    if (receipt.status === "Void") throw new Error("Receipt is already voided");
    
    return prisma.$transaction(async (tx) => {
      // If it was already confirmed, we must rollback the invoice amounts
      if (receipt.status === "Confirmed") {
        const invoice = await tx.invoice.findUnique({ where: { id: receipt.invoiceId } });
        if (invoice) {
          const amountToRollback = Number(receipt.amountReceived);
          const newAmountPaid = Math.max(0, Number(invoice.amountPaid) - amountToRollback);
          const newBalanceDue = Number(invoice.amountAfterTax) - newAmountPaid;

          let newStatus = invoice.status;
          if (newAmountPaid === 0) {
            // Check if it was previously Submitted or something else? 
            // Usually if it's 0 paid, it should be Submitted since we only allow receipts against Submitted or Partially Paid.
            newStatus = "Submitted";
          } else if (newBalanceDue > 0) {
            newStatus = "Partially Paid";
          } else {
            newStatus = "Fully Paid";
          }

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: new Prisma_Decimal(newAmountPaid),
              balanceDue: new Prisma_Decimal(newBalanceDue),
              status: newStatus,
            },
          });
        }
      }

      return tx.receipt.update({
        where: { id },
        data: { status: "Void" },
      });
    });
  }

  throw new Error("Invalid action");
}
