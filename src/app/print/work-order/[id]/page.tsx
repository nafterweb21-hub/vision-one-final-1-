import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "../../coc/[id]/PrintButton";
import PrintBarcode from "./PrintBarcode";
import PrintQRCode from "./PrintQRCode";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mm = months[dt.getMonth()];
  return `${dd}-${mm}-${dt.getFullYear()}`;
}

export default async function PrintWorkOrderPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const wo = await prisma.workOrder.findUnique({
    where: { workOrderNo: id },
    include: {
      customer: true,
      inProcesses: {
        orderBy: { sn: "asc" },
        include: {
          routingProcesses: {
            orderBy: { sequence: "asc" },
            include: {
              mainProcess: { select: { process: true } },
              routingProcess: { select: { routingProcess: true } },
            },
          },
        },
      },
    },
  });

  if (!wo) notFound();

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; background: #fff; font-family: Calibri, sans-serif; font-size: 10pt; color: #000; }
        .page { width: 210mm; min-height: 297mm; padding: 25mm 20mm; box-sizing: border-box; position: relative; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; }
        
        .header-logo { width: 45%; background-color: #d8f1f8; text-align: center; padding: 15px 0; color: #2d89c9; font-weight: bold; font-size: 11pt; }
        .header-info { width: 45%; text-align: right; }
        .header-doc-no { font-size: 9pt; margin-bottom: 5px; color: #000; }
        .header-wo-no { margin-bottom: 5px; }
        .header-barcode { background-color: #d8f1f8; padding: 5px; display: inline-block; text-align: center; }

        .title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 20mm 0; }
        
        .table { width: 100%; border-collapse: collapse; }
        .table td, .table th { border: 1px solid #000; padding: 8px 10px; vertical-align: top; }
        
        .label { font-weight: bold; color: #000; font-size: 10pt; display: block; margin-bottom: 2px; }
        .value { color: #2d89c9; font-size: 10pt; }

        @media screen {
          body { background: #f1f1f1; }
          .page { box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin: 20px auto; background: #fff; }
          .print-actions { position: fixed; top: 12px; right: 12px; z-index: 100; }
          .print-actions button { padding: 10px 16px; font-size: 14px; font-weight: 600; background: #1e3a8a; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
          .print-actions button:hover { background: #1e40af; }
        }
        @media print { .print-actions { display: none; } }
      `}</style>

      <PrintButton />

      <div className="page">
        <div className="row">
          <div className="header-logo" style={{ backgroundColor: "transparent", padding: 0, textAlign: "left" }}>
            <img src="/logo.jpg" alt="Company Logo" style={{ maxHeight: "50px", objectFit: "contain" }} />
          </div>
          <div className="header-info">
            <div className="header-doc-no">V-OPS-001 Rev F</div>
            <div className="header-wo-no">
              <span style={{ color: "#000" }}>Work Order No : </span>
              <span className="value">{wo.workOrderNo}</span>
            </div>
            <div className="flex flex-col items-end gap-2 mt-2">
              <div style={{ padding: "5px", backgroundColor: "#d8f1f8", display: "inline-block" }}>
                <PrintQRCode value={wo.workOrderNo} />
              </div>
              <div style={{ padding: "5px", backgroundColor: "#d8f1f8", display: "inline-block" }}>
                <PrintBarcode value={wo.workOrderNo} />
              </div>
            </div>
          </div>
        </div>

        <div className="title">WORK ORDER SHEET</div>

        <table className="table" style={{ marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td>
                <span className="label">Customer</span>
                <span className="value">{wo.customer?.customerName || "—"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Delivery Date</span>
                <span className="value">{fmtDate(wo.deliveryDate)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Internal Quo No</span>
                <span className="value">{wo.internalQuotationNo || "—"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Customer Ref No</span>
                <span className="value">{wo.customerPoRef || "—"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Project Code</span>
                <span className="value">{wo.projectCode || "—"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Job Description</span>
                <span className="value">{wo.jobDescription || "—"}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span className="label">Qty</span>
                <span className="value">{wo.quantity?.toString() || "0"} {wo.uom || ""}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {wo.inProcesses && wo.inProcesses.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "10px", color: "#2d89c9" }}>
              Routing Processes
            </div>
            <table className="table">
              <thead>
                <tr style={{ backgroundColor: "#d8f1f8", fontSize: "10pt" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #000" }}>S/N</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #000" }}>In-Process Description</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #000" }}>Main Process</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #000" }}>Routing Process</th>
                  <th style={{ textAlign: "left", padding: "8px 10px", border: "1px solid #000" }}>Target Date</th>
                </tr>
              </thead>
              <tbody>
                {wo.inProcesses.map((ip) => {
                  if (ip.routingProcesses.length === 0) {
                    return (
                      <tr key={ip.id}>
                        <td style={{ border: "1px solid #000", padding: "8px 10px", verticalAlign: "top" }}>{ip.sn}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 10px", fontWeight: "bold", verticalAlign: "top" }}>{ip.description}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 10px", color: "#999", fontStyle: "italic", verticalAlign: "top" }} colSpan={3}>No routing processes added</td>
                      </tr>
                    );
                  }
                  return ip.routingProcesses.map((rp, idx) => (
                    <tr key={rp.id}>
                      {idx === 0 && (
                        <>
                          <td rowSpan={ip.routingProcesses.length} style={{ border: "1px solid #000", padding: "8px 10px", verticalAlign: "top" }}>{ip.sn}</td>
                          <td rowSpan={ip.routingProcesses.length} style={{ border: "1px solid #000", padding: "8px 10px", fontWeight: "bold", verticalAlign: "top" }}>{ip.description}</td>
                        </>
                      )}
                      <td style={{ border: "1px solid #000", padding: "8px 10px", verticalAlign: "top" }}>{rp.mainProcess?.process || "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "8px 10px", verticalAlign: "top" }}>{rp.routingProcess?.routingProcess || "—"}</td>
                      <td style={{ border: "1px solid #000", padding: "8px 10px", verticalAlign: "top" }}>{fmtDate(rp.targetCompletionDate)}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

