import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

function fmt(n: any) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

export default async function PrintQuotationPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" }, include: { part: true, uom: true } },
      salesperson: true,
      customer: { include: { addresses: true } },
      contactPerson: true,
      currency: true,
      taxType: true,
      paymentTerm: true,
    },
  });
  if (!q) notFound();

  const company = await prisma.companyProfile.findFirst({ where: { status: "Active" } });
  const defaultAddress =
    q.customer.addresses.find((a) => a.isDefault) || q.customer.addresses[0];

  const currencyCode = q.currency.code;
  const taxLabel = q.taxType ? `Add (${q.taxType.taxRate}%)` : "Add";
  const footerLine = company
    ? `${company.address} (Co. reg. No.: ${company.rocNo || ""}) Telephone: ${company.phoneNo} / Fax: ${company.faxNo}`
    : "";

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; color: #111; font-family: 'Helvetica Neue', Arial, sans-serif; }
        .page { width: 210mm; min-height: 297mm; padding: 18mm 16mm; box-sizing: border-box; position: relative; page-break-after: always; }
        .page:last-of-type { page-break-after: auto; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; }
        .brand { color: #c69200; font-weight: 700; font-size: 22px; letter-spacing: 0.3px; text-align: right; }
        .brand small { display: block; color: #8a8a8a; font-size: 10px; font-weight: 400; }
        .quote-no { font-size: 11px; color: #444; }
        .quote-no b { color: #111; }
        h1.title { text-align: center; font-size: 20px; margin: 60mm 0 0 0; }
        table.kv { width: 100%; border-collapse: collapse; margin-top: 14mm; }
        table.kv td { padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
        table.kv td.label { color: #555; width: 28mm; }
        table.kv td.value { color: #111; }
        .footer { position: absolute; bottom: 8mm; left: 16mm; right: 16mm; font-size: 9px; color: #666; text-align: center; }
        .page-no { position: absolute; bottom: 8mm; left: 16mm; font-size: 9px; color: #666; }
        .blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; margin-top: 10mm; }
        .block h3 { margin: 0 0 4px 0; font-size: 13px; color: #c69200; }
        .block p { margin: 2px 0; font-size: 11px; color: #222; }
        .date-row { display: flex; gap: 30mm; margin-top: 14mm; font-size: 11px; }
        .date-row b { color: #c69200; font-weight: 600; }
        h2.section { font-size: 16px; margin: 8mm 0 4mm 0; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 4mm; }
        table.items thead th { text-align: left; font-size: 11px; padding: 8px 6px; border-bottom: 2px solid #ddd; color: #111; }
        table.items thead th.num { text-align: right; }
        table.items tbody td { font-size: 11px; padding: 8px 6px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
        table.items tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
        table.items tbody td .desc { white-space: pre-wrap; }
        table.totals { width: 100%; border-collapse: collapse; margin-top: 6mm; }
        table.totals td { padding: 6px 6px; font-size: 11px; }
        table.totals td.label { color: #111; font-weight: 600; }
        table.totals td.num { text-align: right; font-variant-numeric: tabular-nums; }
        table.totals tr.total td { border-top: 2px solid #ddd; font-size: 12px; font-weight: 700; }
        .meta-row > div { margin-top: 4px; font-size: 11px; }
        .meta-row .label { color: #555; width: 22mm; display: inline-block; }
        @media screen {
          body { background: #f1f1f1; }
          .page { box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin: 12px auto; background: #fff; }
          .print-actions { position: fixed; top: 12px; right: 12px; z-index: 100; }
          .print-actions button { padding: 8px 14px; font-size: 13px; font-weight: 600; background: #c69200; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
        }
        @media print { .print-actions { display: none; } }
      `}</style>

      <PrintButton />

      {/* Cover */}
      <div className="page">
        <div className="row">
          <div className="quote-no">Quotation No.: <b>{q.quotationNo}</b></div>
          <div className="brand">
            <img src="/logo.jpg" alt="Vision Logo" style={{ maxHeight: "40px", objectFit: "contain" }} />
          </div>
        </div>

        <h1 className="title">{q.title}</h1>

        <table className="kv">
          <tbody>
            <tr>
              <td className="label">From</td>
              <td className="value">{company?.companyName || "Vision One Pte. Ltd."}</td>
              <td className="label">Our Contact</td>
              <td className="value">{q.salesperson.name}</td>
            </tr>
            <tr>
              <td className="label">Customer Name</td>
              <td className="value" colSpan={3}>{q.customer.customerName}</td>
            </tr>
            <tr>
              <td className="label">Quotation No.</td>
              <td className="value">{q.quotationNo}</td>
              <td className="label">Quote Validity</td>
              <td className="value">{q.quoteValidityDays} days</td>
            </tr>
            <tr>
              <td className="label">Revision Number</td>
              <td className="value">{q.revision}</td>
              <td className="label">Customer Contact</td>
              <td className="value">{q.contactPerson?.contactPersonName || "—"}</td>
            </tr>
            <tr>
              <td className="label">Date</td>
              <td className="value">{fmtDate(q.date)}</td>
              <td className="label">Payment Terms</td>
              <td className="value">{q.paymentTerm?.name || "—"}</td>
            </tr>
          </tbody>
        </table>

        <div className="page-no">1/2</div>
        <div className="footer">{footerLine}</div>
      </div>

      {/* Items */}
      <div className="page">
        <div className="row">
          <div className="quote-no">Quotation No.: <b>{q.quotationNo}</b></div>
          <div className="brand">
            <img src="/logo.jpg" alt="Vision Logo" style={{ maxHeight: "40px", objectFit: "contain" }} />
          </div>
        </div>

        <div className="blocks">
          <div className="block">
            <h3>Our Contact</h3>
            <p>{q.salesperson.name}</p>
            <p>{q.salesperson.email}</p>
          </div>
          <div className="block">
            <h3>Customer Contact</h3>
            <p>{q.contactPerson?.contactPersonName || "—"}</p>
            <p>{q.contactPerson?.email || ""}</p>
          </div>
          <div className="block">
            <h3>Customer</h3>
            <p>{q.customer.customerName}</p>
            {defaultAddress && <p>{defaultAddress.address}</p>}
          </div>
        </div>

        <div className="date-row">
          <div><b>Date:</b> {fmtDate(q.date)}</div>
          <div><b>Prepared By:</b> {q.salesperson.name}</div>
        </div>

        <h2 className="section">Quote Items</h2>
        <table className="items">
          <thead>
            <tr>
              <th>Finished Good</th>
              <th>UOM</th>
              <th className="num">Unit Price ({currencyCode})</th>
              <th className="num">Qty</th>
              <th className="num">Price ({currencyCode})</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it) => (
              <tr key={it.id}>
                <td>
                  <div className="desc">
                    {it.part?.partNo ? <><b>{it.part.partNo}</b> — </> : null}
                    {it.part?.description || "—"}
                  </div>
                </td>
                <td>{it.uom?.uomName || "—"}</td>
                <td className="num">{fmt(it.unitPrice)}</td>
                <td className="num">{it.quantity}</td>
                <td className="num">{fmt(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="totals">
          <tbody>
            <tr>
              <td className="label">Sub Total</td>
              <td className="num">{fmt(q.subTotal)}</td>
            </tr>
            {Number(q.lumpSumDisc) > 0 && (
              <tr>
                <td className="label">Lump Sum Discount</td>
                <td className="num">- {fmt(q.lumpSumDisc)}</td>
              </tr>
            )}
            {q.taxType && (
              <tr>
                <td className="label">{taxLabel}</td>
                <td className="num">{fmt(q.taxAmount)}</td>
              </tr>
            )}
            <tr className="total">
              <td className="label">Total Amount</td>
              <td className="num">{fmt(q.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        {(q.leadTime || q.incoterms) && (
          <div className="meta-row">
            {q.leadTime && <div><span className="label">Lead Time</span> {q.leadTime}</div>}
            {q.incoterms && <div><span className="label">Incoterms</span> {q.incoterms}</div>}
          </div>
        )}

        {q.termsAndConditions && (
          <>
            <h2 className="section">Terms & Conditions</h2>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "#222" }}>
              {q.termsAndConditions}
            </div>
          </>
        )}

        <div className="page-no">2/2</div>
        <div className="footer">{footerLine}</div>
      </div>
    </>
  );
}
