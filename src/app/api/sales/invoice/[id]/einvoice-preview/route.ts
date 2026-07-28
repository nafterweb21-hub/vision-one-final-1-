import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { collectEInvoiceIssues, prepareEInvoicePayload } from "@/lib/einvoice";

/**
 * Dry-run preview of the GST e-invoice for an invoice: runs data validation,
 * computes the CGST/SGST/IGST breakup, and builds the exact IRP (schema v1.1)
 * JSON payload — WITHOUT contacting the IRP. Use it to verify the payload
 * before wiring live NIC credentials. Requires an authenticated session.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      company: true,
      customer: { include: { addresses: true } },
      billTo: true,
      items: { orderBy: { lineNo: "asc" }, include: { uom: true, part: true } },
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const issues = collectEInvoiceIssues({
    invoice,
    company: invoice.company,
    customer: invoice.customer,
    billToAddress: invoice.billTo,
  });

  let payload: unknown = null;
  let breakup: unknown = null;
  try {
    const prepared = prepareEInvoicePayload({
      invoice,
      company: invoice.company,
      customer: invoice.customer,
      billToAddress: invoice.billTo,
    });
    payload = prepared.payload;
    breakup = prepared.breakup;
  } catch (e: any) {
    return NextResponse.json(
      { invoiceNo: invoice.invoiceNo, ready: false, issues, error: e?.message || String(e) },
      { status: 200 },
    );
  }

  return NextResponse.json({
    invoiceNo: invoice.invoiceNo,
    ready: issues.length === 0,
    issues,
    breakup,
    payload,
  });
}
