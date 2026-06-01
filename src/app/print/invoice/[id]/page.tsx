import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

function fmt(n: any) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  if (!d) return "";
  const dt = new Date(d);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dd}-${m[dt.getMonth()]}-${dt.getFullYear()}`;
}

export default async function PrintInvoicePage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { lineNo: "asc" }, include: { uom: true, part: true } },
      preparedBy: true,
      customer: { include: { addresses: true } },
      contactPerson: true,
      currency: true,
      taxType: true,
      paymentTerm: true,
      company: true,
      deliveryOrders: { include: { deliveryOrder: true } },
      billTo: true,
    },
  });
  if (!inv) notFound();

  const company = inv.company || await prisma.companyProfile.findFirst({ where: { status: "Active" } });
  
  const totalQty = inv.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const uomName = inv.items.length > 0 && inv.items[0].uom ? inv.items[0].uom.uomName : "PCS";
  
  const gstRegistrationNo = company?.gstRegistrationNo || "";
  const companyAddress = company?.address || "";
  const companyPhone = company?.phoneNo || "";
  const companyEmail = company?.email || "";
  const msmeNo = company?.msmeNo || "";
  const companyName = company?.companyName || "Vision Fab Private Limited";

  const customerName = inv.customer.customerName;
  const customerAddress = inv.billTo?.address || inv.customer.addresses?.[0]?.address || "";
  const customerGstin = inv.customer.gstin || "";
  const customerPan = inv.customer.pan || "";
  const customerPlace = inv.customer.placeOfSupply || "";

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Arial, sans-serif; }
        .page { width: 210mm; min-height: 297mm; padding: 12mm 12mm; box-sizing: border-box; position: relative; }
        .print-actions { position: fixed; top: 12px; right: 12px; z-index: 100; }
        @media screen {
          body { background: #f1f1f1; }
          .page { box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin: 12px auto; background: #fff; }
          .print-actions button { padding: 8px 14px; font-size: 13px; font-weight: 600; background: #c69200; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
        }
        @media print { .print-actions { display: none; } }
        
        .header { display: flex; justify-content: space-between; margin-bottom: 5mm; }
        .header-left { width: 40%; }
        .header-left img { max-width: 100%; height: auto; max-height: 60px; }
        .tagline { font-size: 11px; font-weight: 600; margin-top: 2px; }
        .header-right { width: 55%; text-align: left; }
        .company-name { color: #d00000; font-size: 20px; font-weight: bold; margin-bottom: 4px; }
        .company-details { font-size: 10px; line-height: 1.3; font-weight: 500; }
        
        .main-box { border: 1.5px solid #63a0d4; border-radius: 0; }
        
        .title-bar { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-bottom: 1.5px solid #63a0d4; }
        .title-bar .gstin { font-weight: bold; font-size: 14px; }
        .title-bar .invoice-title { color: #0070c0; font-size: 16px; font-weight: bold; }
        .title-bar .original { font-size: 10px; font-weight: bold; }
        
        .info-grid { display: grid; grid-template-columns: 45% 55%; border-bottom: 1.5px solid #63a0d4; }
        .info-left { border-right: 1.5px solid #63a0d4; padding: 0; }
        .info-right { padding: 0; }
        
        .info-left-header { text-align: center; font-size: 10px; font-weight: bold; border-bottom: 1px solid #63a0d4; padding: 2px; }
        .info-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .info-table td { padding: 3px 6px; vertical-align: top; font-weight: 600; }
        .info-table td:first-child { font-weight: bold; width: 60px; }
        
        .right-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .right-table td { padding: 3px 6px; vertical-align: top; font-weight: 600; }
        .right-table td:nth-child(odd) { width: 80px; }
        
        .items-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; }
        .items-table th { background: #e6f2ff; border-bottom: 1.5px solid #63a0d4; border-right: 1.5px solid #63a0d4; padding: 4px; font-weight: bold; }
        .items-table th:last-child { border-right: none; }
        .items-table td { border-right: 1.5px solid #63a0d4; padding: 4px; vertical-align: top; font-weight: 600; }
        .items-table td:last-child { border-right: none; }
        
        .items-table .text-left { text-align: left; }
        .items-table .text-right { text-align: right; }
        .items-table .font-bold { font-weight: bold; }
        
        .items-table tbody tr.item-row td { padding-bottom: 2px; padding-top: 4px; }
        
        .items-table tbody tr.tax-row td { padding-top: 4px; padding-bottom: 2px; }
        
        .totals-row td { border-top: 1.5px solid #63a0d4; padding: 4px; font-weight: bold; background: #e6f2ff; }
      `}</style>

      <PrintButton />

      <div className="page">
        <div className="header">
          <div className="header-left">
            <img src="/logo.jpg" alt="Logo" />
            <div className="tagline">Your Engineering & Innovative Solution</div>
          </div>
          <div className="header-right">
            <div className="company-name">{companyName}</div>
            <div className="company-details">
              <div>{companyAddress}</div>
              <div>GST No.: {gstRegistrationNo}</div>
              {msmeNo && <div>MSME No.: {msmeNo}</div>}
              <div>T(91) {companyPhone}</div>
              <div>E mail.: {companyEmail}</div>
            </div>
          </div>
        </div>
        
        <div style={{borderBottom: "2px solid #000", marginBottom: "4px"}}></div>

        <div className="main-box">
          <div className="title-bar">
            <div className="gstin">GSTIN : {gstRegistrationNo}</div>
            <div className="invoice-title">TAX INVOICE</div>
            <div className="original">ORIGINAL FOR RECIPIENT</div>
          </div>

          <div className="info-grid">
            <div className="info-left">
              <div className="info-left-header">Customer Detail</div>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>M/S</td>
                    <td>{customerName}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>{customerAddress}</td>
                  </tr>
                  <tr>
                    <td>GSTIN</td>
                    <td>{customerGstin}</td>
                  </tr>
                  <tr>
                    <td>PAN</td>
                    <td>{customerPan}</td>
                  </tr>
                  <tr>
                    <td>Place of<br/>Supply</td>
                    <td>{customerPlace}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="info-right">
              <table className="right-table">
                <tbody>
                  <tr>
                    <td>Invoice No.</td>
                    <td className="font-bold">{inv.invoiceNo}</td>
                    <td>Invoice Date</td>
                    <td>{fmtDate(inv.invoiceDate)}</td>
                  </tr>
                  <tr>
                    <td>P.O. No.</td>
                    <td>{inv.poNo || ""}</td>
                    <td>Due Date</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                  </tr>
                  <tr>
                    <td>Vehicle Number</td>
                    <td>{inv.vehicleNumber || ""}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th style={{width: "4%"}}>Sr.<br/>No.</th>
                <th style={{width: "48%"}}>Name of Product / Service</th>
                <th style={{width: "12%"}}>HSN / SAC</th>
                <th style={{width: "10%"}}>Qty</th>
                <th style={{width: "12%"}}>Rate</th>
                <th style={{width: "14%"}}>Taxable Value</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, idx) => (
                <tr key={it.id} className="item-row">
                  <td>{idx + 1}</td>
                  <td className="text-left font-bold">
                    {it.part?.partNo ? `${it.part.partNo} ` : ""}
                    {it.description}
                  </td>
                  <td>{it.hsnCode || ""}</td>
                  <td className="text-right">{fmt(it.quantity)} {it.uom?.uomName || ""}</td>
                  <td className="text-right">{fmt(it.unitPrice)}</td>
                  <td className="text-right bg-[#f7fbff]">{fmt(it.amount)}</td>
                </tr>
              ))}
              
              <tr className="tax-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="text-right font-bold border-t-2 border-[#63a0d4] bg-[#f7fbff]">{fmt(inv.amountBeforeTax)}</td>
              </tr>
              
              {inv.taxType && Number(inv.taxType.taxRate) > 0 && (
                <tr className="tax-row">
                  <td></td>
                  <td className="text-right font-bold italic pr-4">
                    {inv.taxType.taxType} ({inv.taxType.taxRate}%)
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="text-right bg-[#f7fbff]">{fmt(inv.taxAmount)}</td>
                </tr>
              )}
              
              <tr style={{ height: "40px" }}>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="bg-[#f7fbff]"></td>
              </tr>
              
              <tr className="totals-row">
                <td colSpan={3} className="text-right pr-4">Total</td>
                <td className="text-right">{fmt(totalQty)} {uomName}</td>
                <td></td>
                <td className="text-right">₹ {fmt(inv.amountAfterTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
