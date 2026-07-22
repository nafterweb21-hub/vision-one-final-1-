import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import CompanyLogo from "./CompanyLogo";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = m[dt.getMonth()];
  return `${dd}-${mm}-${dt.getFullYear()}`;
}

const formatNumber = (num: any, decimals: number = 2) => {
  if (num === null || num === undefined) return "0.00";
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default async function PrintPurchaseRequisitionPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pr = await prisma.purchaseRequisition.findUnique({
    where: { id },
    include: {
      company: true,
      requestedBy: true,
      items: {
        include: { uom: true, materialProfile: true }
      }
    }
  });

  if (!pr) notFound();

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; color: #111; font-family: Arial, sans-serif; }
        .page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; box-sizing: border-box; position: relative; font-size: 13px; }
        .dyn { color: #3b82f6; }
        
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .logo-box { width: 55%; display: flex; align-items: center; justify-content: center; min-height: 80px; padding: 10px; font-weight: bold; color: #0284c7; font-size: 16px; }
        .company-info { width: 40%; font-size: 13px; line-height: 1.4; }
        
        h1.title { text-align: center; font-size: 18px; margin: 25px 0 35px 0; font-weight: bold; text-decoration: underline; color: #000; }
        
        .info-table { width: 40%; margin-left: auto; margin-bottom: 25px; font-size: 13px; border-collapse: collapse; }
        .info-table td { padding: 3px 0; }
        .info-table td.label { width: 100px; color: #000; }
        .info-table td.colon { width: 15px; color: #000; }
        
        table.items-table { width: 100%; border-collapse: collapse; border: 1px solid #111; font-size: 12px; margin-bottom: 25px; }
        table.items-table th, table.items-table td { border: 1px solid #111; padding: 6px 8px; }
        table.items-table th { color: #000; font-weight: bold; text-align: center; }
        
        .footer-section { font-size: 13px; color: #000; margin-bottom: 30px; }
        .footer-row { display: flex; margin-bottom: 10px; }
        .footer-label { width: 80px; color: #000; }
        .footer-colon { width: 15px; color: #000; }
        
        .checkbox-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .checkbox-box { width: 14px; height: 14px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 11px; }
        
        .as9100-box { border: 1px solid #111; padding: 15px; font-size: 10px; line-height: 1.4; color: #000; margin-bottom: 30px; }
        
        @media screen {
          body { background: #f1f1f1; }
          .page { box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px auto; background: #fff; }
          .print-actions { position: fixed; top: 12px; right: 12px; z-index: 100; }
          .print-actions button { padding: 10px 16px; font-size: 14px; font-weight: 600; background: #1e3a8a; color: #fff; border: 0; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .print-actions button:hover { background: #1e40af; }
        }
        @media print { .print-actions { display: none; } }
      `}</style>

      <PrintButton />

      <div className="page">
        <div style={{ textAlign: "right", fontSize: "12px", marginBottom: "15px", color: "#000" }}>V-PUR-002 Rev D</div>
        
        <div className="header-row">
          <div className="logo-box">
            <CompanyLogo src={pr.company?.uploadUrl || ""} alt="COMPANY LOGO" style={{ maxHeight: "70px", maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <div className="company-info dyn">
            <div style={{ marginBottom: '4px' }}>{pr.company?.companyName || "Vision One Pte Ltd"}</div>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{pr.company?.address || "No. 3 Kian Teck Road\\nSingapore 628764"}</div>
            <div>T (65) {pr.company?.phoneNo || "6264 8334"}</div>
            <div>F (65) {pr.company?.faxNo || "6264 8335"}</div>
            <div style={{ marginTop: '4px' }}>GST Reg No. : {pr.company?.gstRegistrationNo || "201007671E"}</div>
          </div>
        </div>

        <h1 className="title">PURCHASE REQUISITION</h1>

        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">PR No</td>
              <td className="colon">:</td>
              <td className="dyn">{pr.prNo}</td>
            </tr>
            <tr>
              <td className="label">Date</td>
              <td className="colon">:</td>
              <td className="dyn">{fmtDate(pr.date)}</td>
            </tr>
            <tr>
              <td className="label">Requisitor</td>
              <td className="colon">:</td>
              <td className="dyn">{pr.requestedBy?.name || "—"}</td>
            </tr>
            <tr>
              <td className="label">Work Order</td>
              <td className="colon">:</td>
              <td className="dyn">{pr.workOrderNo || "—"}</td>
            </tr>
          </tbody>
        </table>

        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>Item</th>
              <th style={{ width: '35%' }}>Material</th>
              <th style={{ width: '15%' }}>Shape</th>
              <th style={{ width: '15%' }}>Size</th>
              <th style={{ width: '12%' }}>Delivery Date</th>
              <th style={{ width: '8%' }}>Qty</th>
              <th style={{ width: '10%' }}>UOM</th>
            </tr>
          </thead>
          <tbody>
            {pr.items.map((it, idx) => (
              <tr key={it.id} className="dyn">
                <td style={{ textAlign: 'center', color: '#000' }}>{idx + 1}</td>
                <td style={{ textAlign: 'center' }}>{it.material || it.description}</td>
                <td style={{ textAlign: 'center' }}>{it.shape}</td>
                <td style={{ textAlign: 'center' }}>{it.size}</td>
                <td style={{ textAlign: 'center' }}>{fmtDate(it.deliveryDate)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(it.quantity, Number(it.quantity) % 1 === 0 ? 0 : 2)}</td>
                <td style={{ textAlign: 'center' }}>{it.uom?.uomName}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer-section">
          <div className="footer-row">
            <div className="footer-label">Require</div>
            <div className="footer-colon">:</div>
            <div style={{ flex: 1 }}>
              <div className="checkbox-item dyn">
                <div className="checkbox-box" style={{ color: "#000" }}>✓</div>
                <span>Mill Certificate</span>
              </div>
              <div className="checkbox-item dyn">
                <div className="checkbox-box" style={{ color: "#000" }}>✓</div>
                <span>Certificate of Conformance</span>
              </div>
            </div>
          </div>
          
          <div className="footer-row" style={{ marginTop: '15px' }}>
            <div className="footer-label">Remark</div>
            <div className="footer-colon">:</div>
            <div className="dyn" style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
              {pr.remark || "—"}
            </div>
          </div>
        </div>

        {pr.company?.as9100RequirementNote && (
          <div className="as9100-box">
            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>Requirement (AS9100 product) - Supplier shall:</div>
            <div>- Notify {pr.company?.companyName || "Vision One Pte Ltd"} on non-conforming products</div>
            <div>- Obtain {pr.company?.companyName || "Vision One Pte Ltd"}'s approval for non-conforming product disposition</div>
            <div>- Notify {pr.company?.companyName || "Vision One Pte Ltd"} and obtain approval for :</div>
            <div style={{ marginLeft: '10px' }}>- changes in product and/or process</div>
            <div style={{ marginLeft: '10px' }}>- change of outsource service provider</div>
            <div style={{ marginLeft: '10px' }}>- change of manufacturing facility location</div>
            <div>- Applicable records to be retained for at least 3 years</div>
            <div>- Provide right of access to {pr.company?.companyName || "Vision One Pte Ltd"}, its customer and regulatory authorities to applicable facilities, at any level of the supply chain, involved in the order and all applicable records.</div>
          </div>
        )}
        
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#000', marginTop: '40px', paddingBottom: '20px' }}>
          This is computer-generated document. No signature is required.
        </div>

      </div>
    </>
  );
}
