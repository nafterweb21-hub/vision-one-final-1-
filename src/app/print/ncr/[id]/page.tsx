import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NcrPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ncr = await prisma.ncr.findUnique({
    where: { id },
    include: {
      WorkOrder: true,
      Employee_Ncr_requestorIdToEmployee: true,
      Employee_Ncr_responsiblePartyIdToEmployee: true,
      Employee_Ncr_rootCauseResponsibleStaffIdToEmployee: true,
      Employee_Ncr_cpaResponsibleStaffIdToEmployee: true,
      Employee_Ncr_verifiedConfirmedByIdToEmployee: true,
      NcrFailureMode: {
        include: {
          FailureModeProfile: true
        }
      }
    }
  });

  if (!ncr) notFound();

  // Formatter helpers
  const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "";
  
  const failureModeNames = ncr.NcrFailureMode.map(fm => fm.FailureModeProfile.failureMode);

  // Departments List (based on screenshot)
  const leftDepts = ["Laser Cutting", "Welding", "Belding", "Others"];
  const rightDepts = ["Assembly", "Machining", "Painting"];
  
  // Failure Modes List (based on screenshot)
  const leftFm = ["Dimensional", "Incomplete Product", "Painting Thickness", "Damage Product"];
  const rightFm = ["Material", "Coating", "Welding Defect"];

  const wo = ncr.WorkOrder;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Arial', sans-serif; font-size: 11px; margin: 0; background: #fff; }
        .page { width: 100%; max-width: 190mm; margin: 0 auto; }
        
        /* Header */
        .header-table { width: 100%; border: none; margin-bottom: 10px; }
        .header-logo { max-height: 40px; }
        .header-title { font-size: 16px; font-weight: bold; text-decoration: underline; margin: 0; }
        .header-subtitle { font-size: 12px; font-weight: bold; }
        .header-address { font-size: 10px; color: #0284c7; line-height: 1.2; text-align: left; padding-left: 20px;}
        .header-address-title { font-weight: bold; font-size: 11px; }

        /* Tables */
        .ncr-table { width: 100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed; }
        .ncr-table th, .ncr-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
        .ncr-table-no-top { border-top: none; }
        
        .nested-table { width: 100%; border-collapse: collapse; }
        .nested-table td { border: none; padding: 2px 5px; }
        .cell-border-bottom { border-bottom: 1px solid #000 !important; }
        .cell-border-right { border-right: 1px solid #000 !important; }

        /* Typography */
        .dynamic-text { color: #0284c7; }
        .checkbox-grid { display: flex; font-size: 10px; }
        .checkbox-col { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .checkbox-item { display: flex; items-center; gap: 4px; }
        input[type="checkbox"] { margin: 0; width: 10px; height: 10px; }

        .flex-between { display: flex; justify-content: space-between; }
        .min-h-text { min-height: 50px; margin-top: 5px; }

        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />

      <div className="page">
        <div style={{ textAlign: "right", fontSize: "10px", marginBottom: "5px", fontWeight: "bold" }}>SP-08-F01 Rev I</div>
        
        <table className="header-table">
          <tbody>
            <tr>
              <td style={{ width: "33%", textAlign: "center" }}>
                <img src="/logo.jpg" alt="Company Logo" className="header-logo" />
              </td>
              <td style={{ width: "33%", textAlign: "center", verticalAlign: "bottom" }}>
                <h2 className="header-title">NON-CONFORMANCE REPORT</h2>
                <div className="header-subtitle">[ IN HOUSE ]</div>
              </td>
              <td style={{ width: "34%" }}>
                <div className="header-address">
                  <div className="header-address-title">Vision One Pte Ltd</div>
                  <div>3 Kian Teck Road,</div>
                  <div>Singapore 628762</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1 */}
        <table className="ncr-table">
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: 0 }}>
                <table className="nested-table">
                  <tbody>
                    <tr>
                      <td colSpan={3} className="cell-border-bottom" style={{ padding: "4px 5px" }}>
                        <div>Product Description:</div>
                        <div className="dynamic-text">{wo?.jobDescription || "-"}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: "25%" }}>Work Order No</td>
                      <td style={{ width: "5%" }}>:</td>
                      <td className="dynamic-text">{wo?.workOrderNo}</td>
                    </tr>
                    <tr>
                      <td>Part No</td>
                      <td>:</td>
                      <td className="dynamic-text">{wo?.internalQuotationNo || "-"}</td>
                    </tr>
                    <tr>
                      <td>Project No</td>
                      <td>:</td>
                      <td className="dynamic-text">{wo?.projectCode || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: "50%", padding: 0 }}>
                <table className="nested-table">
                  <tbody>
                    <tr>
                      <td className="cell-border-bottom cell-border-right" style={{ width: "25%" }}>Date</td>
                      <td className="cell-border-bottom" style={{ width: "5%" }}>:</td>
                      <td className="cell-border-bottom dynamic-text">{fmtDate(ncr.ncrDate)}</td>
                    </tr>
                    <tr>
                      <td className="cell-border-bottom cell-border-right">CNR No</td>
                      <td className="cell-border-bottom">:</td>
                      <td className="cell-border-bottom dynamic-text">{ncr.ncrNo}</td>
                    </tr>
                    <tr>
                      <td className="cell-border-bottom cell-border-right">Cust Ref No</td>
                      <td className="cell-border-bottom">:</td>
                      <td className="cell-border-bottom dynamic-text">{wo?.customerPoRef || "-"}</td>
                    </tr>
                    <tr>
                      <td className="cell-border-bottom cell-border-right">Qty</td>
                      <td className="cell-border-bottom">:</td>
                      <td className="cell-border-bottom dynamic-text">{ncr.ncrQuantity} PCS</td>
                    </tr>
                    <tr>
                      <td className="cell-border-right">Raised By</td>
                      <td>:</td>
                      <td className="dynamic-text">{ncr.Employee_Ncr_requestorIdToEmployee?.name}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 2 */}
        <table className="ncr-table ncr-table-no-top">
          <tbody>
            <tr>
              <td style={{ width: "60%" }}>
                <div style={{ textTransform: "uppercase" }}>DESCRIPTION OF NON-CONFORMANCE / PROBLEM</div>
                <div className="dynamic-text min-h-text">{ncr.descriptionOfNonConformance}</div>
              </td>
              <td style={{ width: "40%", padding: 0 }}>
                <table className="nested-table" style={{ height: "100%" }}>
                  <tbody>
                    <tr>
                      <td className="cell-border-bottom cell-border-right">DISPOSITION DECISION</td>
                      <td className="cell-border-bottom" style={{ textAlign: "center" }}>QTY</td>
                    </tr>
                    <tr>
                      <td>Rework</td>
                      <td className="dynamic-text" style={{ textAlign: "right" }}>{ncr.reworkQuantity > 0 ? `${ncr.reworkQuantity} PCS` : ""}</td>
                    </tr>
                    <tr>
                      <td>Use-As-Is *</td>
                      <td className="dynamic-text" style={{ textAlign: "right" }}>{ncr.useAsIsQuantity > 0 ? `${ncr.useAsIsQuantity} PCS` : ""}</td>
                    </tr>
                    <tr>
                      <td>Scrap</td>
                      <td className="dynamic-text" style={{ textAlign: "right" }}>{ncr.scrapQuantity > 0 ? `${ncr.scrapQuantity} PCS` : ""}</td>
                    </tr>
                    <tr>
                      <td className="cell-border-bottom">Others ({ncr.otherDecisions || "Recycle"})</td>
                      <td className="cell-border-bottom dynamic-text" style={{ textAlign: "right" }}>{ncr.otherQuantity > 0 ? `${ncr.otherQuantity} PCS` : ""}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ fontSize: "9px" }}>*Customer Signature for Acceptance Use-As-Is</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 3 */}
        <table className="ncr-table ncr-table-no-top">
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: 0, display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "4px" }}>
                  <div style={{ textTransform: "uppercase" }}>CAUSE OF DISCREPANCY</div>
                  
                  <div style={{ marginTop: "5px" }}>Department :</div>
                  <div className="checkbox-grid" style={{ margin: "2px 0 5px 10px" }}>
                    <div className="checkbox-col">
                      {leftDepts.map(d => (
                        <label key={d} className="checkbox-item">
                          <input type="checkbox" checked={ncr.department === d} readOnly /> {d}
                        </label>
                      ))}
                    </div>
                    <div className="checkbox-col">
                      {rightDepts.map(d => (
                        <label key={d} className="checkbox-item">
                          <input type="checkbox" checked={ncr.department === d} readOnly /> {d}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>Failure Mode :</div>
                  <div className="checkbox-grid" style={{ margin: "2px 0 5px 10px" }}>
                    <div className="checkbox-col">
                      {leftFm.map(d => (
                        <label key={d} className="checkbox-item">
                          <input type="checkbox" checked={failureModeNames.includes(d)} readOnly /> {d}
                        </label>
                      ))}
                    </div>
                    <div className="checkbox-col">
                      {rightFm.map(d => (
                        <label key={d} className="checkbox-item">
                          <input type="checkbox" checked={failureModeNames.includes(d)} readOnly /> {d}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: "auto", borderTop: "1px solid #000", padding: "4px" }}>
                  Responsible Party : <span className="dynamic-text">{ncr.Employee_Ncr_responsiblePartyIdToEmployee?.name || ""}</span>
                </div>
              </td>
              
              <td style={{ width: "50%", padding: 0, position: "relative" }}>
                <div style={{ padding: "4px" }}>
                  <div>
                    Corrective Action : <span className="dynamic-text">{ncr.correctiveAction === true ? "Yes" : ncr.correctiveAction === false ? "No" : ""}</span>
                  </div>
                  <div style={{ marginTop: "5px" }}>
                    If "No", reason to justify :
                    <div className="dynamic-text">{ncr.reasonToJustify}</div>
                  </div>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", borderTop: "1px solid #000", padding: "4px", boxSizing: "border-box" }}>
                  Requested By : <span className="dynamic-text">{ncr.Employee_Ncr_requestorIdToEmployee?.name || ""}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 4 */}
        <table className="ncr-table ncr-table-no-top">
          <tbody>
            <tr>
              <td>
                <div style={{ textTransform: "uppercase" }}>ROOT CAUSE</div>
                <div className="dynamic-text min-h-text">{ncr.rootCause}</div>
                <div className="flex-between" style={{ marginTop: "15px" }}>
                  <div>Responsible Staff : <span className="dynamic-text">{ncr.Employee_Ncr_rootCauseResponsibleStaffIdToEmployee?.name || ""}</span></div>
                  <div>Sign / Date : <span className="dynamic-text">{fmtDate(ncr.rootCauseDate)}</span></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 5 */}
        <table className="ncr-table ncr-table-no-top">
          <tbody>
            <tr>
              <td>
                <div style={{ textTransform: "uppercase" }}>CORRECTIVE ACTION [Information To Be Provided By The Staff / Department Responsible]</div>
                <div style={{ textTransform: "uppercase" }}>PREVENTIVE ACTION</div>
                <div className="dynamic-text min-h-text">{ncr.correctivePreventiveAction}</div>
                <div className="flex-between" style={{ marginTop: "15px" }}>
                  <div>Responsible Staff : <span className="dynamic-text">{ncr.Employee_Ncr_cpaResponsibleStaffIdToEmployee?.name || ""}</span></div>
                  <div>Sign / Date : <span className="dynamic-text">{fmtDate(ncr.cpaDate)}</span></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 6 */}
        <table className="ncr-table ncr-table-no-top">
          <tbody>
            <tr>
              <td style={{ padding: 0 }}>
                <div style={{ padding: "4px" }}>
                  <div style={{ textTransform: "uppercase" }}>FOLLOW-UP / VERIFICATION OF CORRECTION (ON EFFECTIVENESS OF CORRECTIVE ACTION TAKEN)</div>
                  <div>(To Be Filled By Requester)</div>
                  <div className="dynamic-text min-h-text">{ncr.followUpVerification}</div>
                </div>
                
                <table className="nested-table" style={{ borderTop: "1px solid #000" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", padding: "4px" }} className="cell-border-right">
                        Action Taken : &nbsp;
                        <label className="checkbox-item" style={{ display: "inline-flex", marginRight: "15px" }}>
                          <input type="checkbox" checked={ncr.actionTaken === "Acceptable"} readOnly /> Acceptable
                        </label>
                        <label className="checkbox-item" style={{ display: "inline-flex" }}>
                          <input type="checkbox" checked={ncr.actionTaken === "Not Acceptable"} readOnly /> Not Acceptable
                        </label>
                      </td>
                      <td style={{ width: "50%", padding: 0 }}>
                        <table className="nested-table">
                          <tbody>
                            <tr>
                              <td className="cell-border-bottom" style={{ padding: "4px" }}>
                                Verified / Confirmed By : <span className="dynamic-text">{ncr.Employee_Ncr_verifiedConfirmedByIdToEmployee?.name || ""}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: "4px" }}>
                                Signature / Date : <span className="dynamic-text">{fmtDate(ncr.verifiedConfirmedDate)}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
