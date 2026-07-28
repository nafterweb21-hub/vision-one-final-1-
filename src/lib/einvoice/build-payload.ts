/**
 * Build a NIC IRP (e-invoice schema v1.1) payload from a loaded Invoice.
 *
 * The invoice must be loaded with company, customer (+ addresses), contactPerson
 * and items (+ uom, part). The GST breakup is computed separately with
 * src/lib/gst.ts and passed in so line taxes match the printed invoice.
 */
import { roundTo2, resolvePosStateCode, stateCodeFromGstin } from "@/lib/gst";
import type { GstBreakup } from "@/lib/gst";

/** Common UQC (unit quantity code) mappings; unknown units fall back to OTH. */
const UQC_MAP: Record<string, string> = {
  PCS: "PCS", PC: "PCS", NOS: "NOS", NO: "NOS", NUMBERS: "NOS",
  KG: "KGS", KGS: "KGS", KGM: "KGS", GM: "GMS", GMS: "GMS",
  MTR: "MTR", M: "MTR", METER: "MTR", METERS: "MTR",
  CM: "CMS", MM: "MMS", LTR: "LTR", L: "LTR", LITRE: "LTR",
  SET: "SET", SETS: "SET", BOX: "BOX", UNT: "UNT", UNIT: "UNT",
  SQM: "SQM", SQF: "SQF", TON: "TON", TONNES: "TON", ROLL: "ROL",
};

function toUqc(uomName: string | null | undefined): string {
  const key = (uomName ?? "").trim().toUpperCase();
  return UQC_MAP[key] ?? "OTH";
}

/** dd/mm/yyyy, the format IRP expects for document dates. */
function fmtIrpDate(d: Date | string): string {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

/** Extract a 6-digit pincode from a free-text address, if present. */
export function extractPin(address: string | null | undefined): number | null {
  const m = (address ?? "").match(/\b(\d{6})\b/);
  return m ? Number(m[1]) : null;
}

/** First meaningful line / segment of an address, capped at `max` chars. */
function addrLine(address: string | null | undefined, max = 100): string {
  const first = (address ?? "").split(/[\n,]/)[0]?.trim() || (address ?? "").trim();
  return first.slice(0, max) || "NA";
}

/** A city/location string for the IRP (best-effort from the address). */
function locFrom(address: string | null | undefined, fallback: string): string {
  const parts = (address ?? "").split(/[\n,]/).map((p) => p.trim()).filter(Boolean);
  const loc = parts.length > 1 ? parts[parts.length - 1] : fallback;
  return (loc || fallback || "NA").slice(0, 50);
}

const DOC_TYPE_MAP: Record<string, string> = {
  "Customer Invoice": "INV",
  "Credit Note": "CRN",
  "Debit Note": "DBN",
};

export type BuildPayloadInput = {
  invoice: any; // Invoice with items
  company: any; // CompanyProfile
  customer: any; // CustomerProfile
  billToAddress?: any; // CustomerAddress | null
  breakup: GstBreakup;
};

export function buildEInvoicePayload(input: BuildPayloadInput): any {
  const { invoice, company, customer, billToAddress, breakup } = input;

  const sellerStateCode = stateCodeFromGstin(company.gstRegistrationNo) ?? "";
  const buyerGstin = (customer.gstin ?? "").trim().toUpperCase();
  const posStateCode = resolvePosStateCode(customer.placeOfSupply, buyerGstin) ?? "";

  const custAddr = billToAddress?.address || customer.addresses?.[0]?.address || "";

  const items = invoice.items.map((it: any, i: number) => {
    const line = breakup.lines[i] ?? { gstRate: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0 };
    const qty = Number(it.quantity) || 0;
    const unitPrice = roundTo2(Number(it.unitPrice) || 0);
    const assAmt = roundTo2(Number(it.amount) || 0);
    const totItemVal = roundTo2(assAmt + line.cgstAmount + line.sgstAmount + line.igstAmount);
    return {
      SlNo: String(i + 1),
      PrdDesc: (it.part?.partNo ? `${it.part.partNo} ` : "") + (it.description || "Item"),
      IsServc: "N",
      HsnCd: (it.hsnCode || "").trim(),
      Qty: qty,
      Unit: toUqc(it.uom?.uomName),
      UnitPrice: unitPrice,
      TotAmt: assAmt,
      Discount: 0,
      AssAmt: assAmt,
      GstRt: Number(line.gstRate) || 0,
      IgstAmt: line.igstAmount,
      CgstAmt: line.cgstAmount,
      SgstAmt: line.sgstAmount,
      TotItemVal: totItemVal,
    };
  });

  const totInvVal = roundTo2(breakup.totals.taxable + breakup.totals.tax);

  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: {
      Typ: DOC_TYPE_MAP[invoice.invoiceType] ?? "INV",
      No: invoice.invoiceNo,
      Dt: fmtIrpDate(invoice.invoiceDate),
    },
    SellerDtls: {
      Gstin: (company.gstRegistrationNo || "").trim().toUpperCase(),
      LglNm: company.companyName,
      Addr1: addrLine(company.address),
      Loc: locFrom(company.address, company.companyName),
      Pin: extractPin(company.address),
      Stcd: sellerStateCode,
      Ph: (company.phoneNo || "").replace(/\D/g, "").slice(0, 12) || undefined,
      Em: company.email || undefined,
    },
    BuyerDtls: {
      Gstin: buyerGstin,
      LglNm: customer.customerName,
      Pos: posStateCode,
      Addr1: addrLine(custAddr),
      Loc: locFrom(custAddr, customer.customerName),
      Pin: extractPin(custAddr),
      Stcd: stateCodeFromGstin(buyerGstin) ?? posStateCode,
    },
    ValDtls: {
      AssVal: breakup.totals.taxable,
      CgstVal: breakup.totals.cgst,
      SgstVal: breakup.totals.sgst,
      IgstVal: breakup.totals.igst,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: totInvVal,
    },
    ItemList: items,
  };
}
