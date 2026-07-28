import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintToolbar from "@/app/print/PrintToolbar";
import CompanyLogo from "../../purchase-order/[id]/CompanyLogo";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.toLocaleString('en-US', { month: 'short' }));
  return `${dd}-${mm}-${dt.getFullYear()}`;
}

export default async function PrintSubconRequestFormPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  
  const srf = await prisma.subconRequestForm.findUnique({
    where: { id },
    include: {
      outsourcedBy: true,
      receivedBy: true,
      purchaseOrderItem: {
        include: {
          purchaseOrder: {
            include: {
              company: true,
              supplier: true,
            }
          },
          poUom: true,
          masterMainProcess: true,
          masterRoutingProcess: true,
          woRoutingProcess: {
            include: { routingProcess: true }
          }
        }
      }
    }
  });

  if (!srf) notFound();

  const po = srf.purchaseOrderItem.purchaseOrder;
  const item = srf.purchaseOrderItem;
  const company = po.company;
  const processName = item.masterRoutingProcess?.routingProcess || item.woRoutingProcess?.routingProcess?.routingProcess || "—";
  
  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; color: #111; font-family: var(--print-font); }
        .page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; box-sizing: border-box; position: relative; font-size: 13px; }
        .dyn { color: #3b82f6; }
        
        .header-top { display: flex; justify-content: flex-end; margin-bottom: 10px; font-weight: bold; font-size: 12px; }
        
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .logo-box { width: 55%; display: flex; align-items: center; justify-content: center; min-height: 90px; padding: 10px; }
        .company-info { width: 40%; font-size: 12px; line-height: 1.4; color: #3b82f6; }
        
        h1.title { text-align: center; font-size: 18px; margin: 30px 0 25px; font-weight: bold; text-decoration: underline; }
        
        table.info-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
        table.info-table td { padding: 4px 0; vertical-align: top; }
        table.info-table td.label { width: 22%; font-weight: bold; }
        table.info-table td.value { width: 33%; color: #3b82f6; }
        
        .checkbox-row { margin: 25px 0; display: flex; align-items: center; gap: 8px; font-weight: bold; color: #3b82f6; }
        .checkbox-box { width: 14px; height: 14px; border: 1px solid #3b82f6; display: flex; align-items: center; justify-content: center; }
        
        table.details-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
        table.details-table td { padding: 4px 0; vertical-align: top; }
        table.details-table td.label { width: 22%; font-weight: bold; }
        table.details-table td.value { width: 78%; color: #3b82f6; }
        
        .remark-section { margin-bottom: 30px; font-size: 13px; }
        .remark-label { font-weight: bold; margin-bottom: 5px; }
        .remark-text { color: #3b82f6; border-bottom: 1px dotted #3b82f6; min-height: 20px; display: inline-block; min-width: 60%; white-space: pre-wrap; padding-bottom: 2px; }
        
        .requirement-box { border: 1px solid #111; padding: 15px; margin-top: 30px; margin-bottom: 40px; font-size: 10px; line-height: 1.5; }
        .req-title { font-weight: bold; text-decoration: underline; margin-bottom: 6px; font-size: 11px; }
        
        .footer-row { display: flex; justify-content: flex-end; margin-top: 40px; font-size: 13px; font-weight: bold; }
        .signature-line { border-bottom: 1px solid #111; width: 200px; display: inline-block; margin-left: 10px; }
        
        @media screen {
          body { background: #f1f1f1; }
          .page { box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px auto; background: #fff; }
        }
      `}</style>

      <PrintToolbar doc="subcon-request-form" id={id} label="Print SRF" />

      <div className="page">
        <div className="header-top">
          V-PUR-003 Rev C
        </div>
        
        <div className="header-row">
          <div className="logo-box">
            <CompanyLogo src={company?.uploadUrl || ""} alt="COMPANY LOGO" style={{ maxHeight: "70px", maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <div className="company-info">
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>{company?.companyName}</div>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: '4px' }}>{company?.address}</div>
            <div>T (65) {company?.phoneNo}</div>
            <div>F (65) {company?.faxNo}</div>
            <div style={{ marginTop: '4px', color: '#111', fontWeight: 'bold' }}>
              GST Reg No. : <span style={{ color: '#3b82f6', fontWeight: 'normal' }}>{company?.gstRegistrationNo}</span>
            </div>
          </div>
        </div>

        <h1 className="title">SUB-CONTRACTOR REQUEST FORM</h1>

        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">Work Order</td>
              <td className="value">: {po.workOrderNo || "—"}</td>
              <td className="label" style={{ width: '15%' }}>Outsource By</td>
              <td className="value" style={{ width: '30%' }}>: {srf.outsourcedBy?.name || "—"}</td>
            </tr>
            <tr>
              <td className="label">Date of Purchase</td>
              <td className="value">: {fmtDate(po.date)}</td>
              <td className="label">Date</td>
              <td className="value">: {fmtDate(srf.srfDate)}</td>
            </tr>
            <tr>
              <td className="label">Sub-Contractor</td>
              <td className="value">: {po.supplier?.supplierName || "—"}</td>
              <td className="label"></td>
              <td className="value"></td>
            </tr>
            <tr>
              <td className="label">Date Required</td>
              <td className="value">: {fmtDate(srf.dateRequired)}</td>
              <td className="label"></td>
              <td className="value"></td>
            </tr>
          </tbody>
        </table>

        <div className="checkbox-row">
          <div className="checkbox-box">
            <span style={{ fontSize: '11px', lineHeight: 1 }}>✓</span>
          </div>
          <span>Fabricate of Parts</span>
        </div>

        <table className="details-table">
          <tbody>
            <tr>
              <td className="label">Part Description</td>
              <td className="value">: {item.description || "—"}</td>
            </tr>
            <tr>
              <td className="label">Qty</td>
              <td className="value">: {Number(srf.quantity)} {item.poUom?.uomName || "Piece"}</td>
            </tr>
            <tr>
              <td className="label">Process</td>
              <td className="value">: {processName}</td>
            </tr>
            <tr>
              <td className="label">Hardness</td>
              <td className="value">: {item.hardness || "#"}</td>
            </tr>
            <tr>
              <td className="label">Thickness</td>
              <td className="value">: {item.thickness || "—"}</td>
            </tr>
          </tbody>
        </table>

        <div className="remark-section">
          <div className="remark-label">Remark :</div>
          <div className="remark-text">{srf.remark || "—"}</div>
        </div>

        <div className="requirement-box">
          <div className="req-title">Requirement (AS9100 product) - Supplier shall:</div>
          <div>- Notify {company?.companyName || "Vision One Pte Ltd"} on non-conforming products</div>
          <div>- Obtain {company?.companyName || "Vision One Pte Ltd"}'s approval for non-conforming product disposition</div>
          <div>- Notify {company?.companyName || "Vision One Pte Ltd"} and obtain approval for :</div>
          <div style={{ marginLeft: '12px' }}>- changes in product and/or process</div>
          <div style={{ marginLeft: '12px' }}>- change of outsource service provider</div>
          <div style={{ marginLeft: '12px' }}>- change of manufacturing facility location</div>
          <div>- Applicable records to be retained for at least 3 years</div>
          <div>- Provide right of access to {company?.companyName || "Vision One Pte Ltd"}, its customer and regulatory authorities to applicable facilities, at any level of the supply chain, involved in the order and all applicable records.</div>
        </div>

        <div className="footer-row">
          <div>
            Received By : <span className="signature-line"></span>
          </div>
        </div>
      </div>
    </>
  );
}
