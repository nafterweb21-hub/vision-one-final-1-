import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OutstandingWorkButton from "./components/OutstandingWorkButton";
import { auth } from "@/lib/auth";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Proceed: "bg-blue-100 text-blue-700",
  WIP: "bg-amber-100 text-amber-700",
  "On Hold": "bg-orange-100 text-orange-700",
  "Pending for QC": "bg-purple-100 text-purple-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
  Void: "bg-rose-100 text-rose-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export const dynamic = "force-dynamic";

export default async function WorkOrdersPage() {
  try {
    let workOrders: any[] = [];
    let errorMsg = null;

    const session = await auth();
    const userRole = session?.user?.role;
    
    const userEmployeeId = session?.user?.employeeId;
    
    // Bypass role filtering for management/admin roles so they can see all work orders
    const bypassRoles = ["Admin", "VIEWER", "Production Manager", "QC", "QC Manager"];
    const shouldFilterByRole = userRole && !bypassRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());

    try {
      workOrders = await prisma.workOrder.findMany({
        where: { 
          status: { notIn: ["Void", "Cancelled"] },
          ...(shouldFilterByRole ? {
            inProcesses: {
              some: {
                routingProcesses: {
                  some: {
                    routingProcess: {
                      allowedRoles: { some: { name: userRole } }
                    },
                    ...(userEmployeeId ? { assignedEmployeeId: userEmployeeId } : {})
                  }
                }
              }
            }
          } : {})
        },
        orderBy: { createdAt: "desc" },
        take: 500, // Prevent OOM on large datasets
        include: { 
          customer: true,
          inProcesses: {
            select: {
              routingProcesses: {
                select: {
                  sn: true,
                  productionTimesheets: {
                    select: {
                      completedQty: true,
                      rejectedQty: true
                    }
                  }
                }
              }
            }
          }
        },
      });
    } catch (err: any) {
      console.error("Error fetching work orders:", err);
      errorMsg = err instanceof Error ? err.message : (typeof err === 'string' ? err : "Failed to load work orders from database.");
    }

    const enrichedWorkOrders = (workOrders || []).filter(Boolean).map((wo: any) => {
      let producedQty = 0;
      let rejectedQty = 0;
      const totalQty = Number(wo.quantity) || 0;
      
      if (wo.status === "Completed") {
        producedQty = totalQty;
      } else if (wo.inProcesses && wo.inProcesses.length > 0) {
        let lastProcess = null;
        let maxSn = -1;
        wo.inProcesses.forEach((ip: any) => {
          ip.routingProcesses?.forEach((rp: any) => {
            const numericSn = parseInt(rp?.sn, 10);
            if (!isNaN(numericSn) && numericSn > maxSn) {
              maxSn = numericSn;
              lastProcess = rp;
            }
            // Sum up rejected quantities across all processes
            rp.productionTimesheets?.forEach((ts: any) => {
              rejectedQty += (Number(ts.rejectedQty) || 0);
            });
          });
        });
        
        if (lastProcess) {
          producedQty = (lastProcess as any)?.productionTimesheets?.reduce((sum: number, ts: any) => sum + (Number(ts?.completedQty) || 0), 0) || 0;
        }
      }
      
      // Cap at total
      producedQty = Math.min(producedQty, totalQty);
      
      return {
        workOrderNo: wo.workOrderNo,
        date: wo.date ? new Date(wo.date).toISOString() : null,
        customerName: wo.customer?.customerName || wo.CustomerProfile?.customerName || "-",
        jobDescription: wo.jobDescription || "-",
        uom: wo.uom || "",
        status: wo.status || "Unknown",
        qcAcceptance: wo.qcAcceptance,
        producedQty,
        rejectedQty,
        totalQty
      };
    });

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Work Orders</h1>
            <p className="text-sm text-slate-500 mt-1">
              Work orders are created from confirmed Sales Order batches via Outstanding Work.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/production/rework" 
              className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm rounded-lg hover:bg-amber-100 transition-colors"
            >
              Rework Queue
            </Link>
            <OutstandingWorkButton />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <h3 className="font-semibold mb-1">Database Error</h3>
            <p className="text-sm whitespace-pre-wrap">{String(errorMsg)}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {workOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-lg font-medium text-slate-700 mb-2">No work orders yet</p>
              <p className="text-sm">
                Click <span className="font-medium">Outstanding Work</span> to pick a confirmed sales order batch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Work Order No</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Job Description</th>
                    <th className="px-6 py-4 font-semibold w-[160px]">Qty Progress</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enrichedWorkOrders.map((wo: any, index: number) => (
                    <tr
                      key={wo.workOrderNo || `wo-${index}`}
                      className={`hover:bg-slate-50/50 ${
                        wo.status === 'Rejected' ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-blue-600">
                        {wo.workOrderNo || "-"}
                        {wo.status === 'Rejected' && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5 uppercase tracking-wide">
                            ⚠ QC Rejected — Rework Required
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{wo.date ? new Date(wo.date).toLocaleDateString() : "-"}</td>
                      <td className="px-6 py-4">{wo.customerName}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{wo.jobDescription}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>{wo.producedQty} <span className="text-[9px] text-slate-400 font-medium uppercase">{wo.uom}</span></span>
                            <span className="text-slate-400">/ {wo.totalQty}</span>
                          </div>
                          {wo.rejectedQty > 0 && (
                            <div className="text-[10px] font-bold text-rose-500 mt-0.5">
                              {wo.rejectedQty} Rejected
                            </div>
                          )}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${wo.totalQty > 0 ? (wo.producedQty / wo.totalQty) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {wo.status === 'Rejected' ? (
                          <span className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white">
                            QC REJECTED
                          </span>
                        ) : wo.status === 'Completed' || wo.qcAcceptance === 'Approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {wo.status || "Completed"}
                          </span>
                        ) : wo.status === 'Pending for QC' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            PENDING QC
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              wo.status ? (STATUS_STYLES[wo.status] ?? "bg-slate-100 text-slate-700") : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {wo.status || "Unknown"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {wo.status === 'Rejected' && (
                            <Link 
                              href="/dashboard/production/rework"
                              className="text-amber-600 hover:text-amber-800 font-bold text-xs bg-amber-50 px-2 py-1 rounded"
                            >
                              Fix
                            </Link>
                          )}
                          {wo.workOrderNo ? (
                            <Link
                              href={`/dashboard/production/work-order/${wo.workOrderNo}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Open
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-sm">Unavailable</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  } catch (globalError: any) {
    console.error("Fatal error rendering work orders page:", globalError);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow-sm">
          <h1 className="text-xl font-bold mb-2">Fatal Error Loading Page</h1>
          <p className="mb-4">The server encountered an error while rendering this page.</p>
          <pre className="bg-red-100 p-4 rounded text-xs overflow-auto">
            {globalError?.stack || globalError?.message || String(globalError)}
          </pre>
        </div>
      </div>
    );
  }
}

