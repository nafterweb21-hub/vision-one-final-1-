import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Proceed: "bg-blue-100 text-blue-700",
  WIP: "bg-amber-100 text-amber-700",
  "On Hold": "bg-orange-100 text-orange-700",
  "Pending for QC": "bg-purple-100 text-purple-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Void: "bg-rose-100 text-rose-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export default async function QcApprovalPage() {
  const workOrders = await prisma.workOrder.findMany({
    where: {
      OR: [
        { status: "Pending for QC" },
        { qcAcceptance: "Rejected", status: { not: "Completed" } },
        { qcAcceptance: "Approved", status: { not: "Completed" } },
        {
          AND: [
            { status: "WIP" },
            {
              inProcesses: {
                some: {
                  routingProcesses: {
                    some: {
                      productionTimesheets: {
                        some: {
                          completed: true
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { 
      customer: true,
      inProcesses: {
        include: {
          routingProcesses: {
            include: {
              productionTimesheets: true
            }
          }
        }
      }
    },
  });

  const enrichedWorkOrders = workOrders.map((wo: any) => {
    let producedQty = 0;
    const totalQty = Number(wo.quantity) || 0;
    
    if (wo.status === "Completed") {
      producedQty = totalQty;
    } else if (wo.inProcesses && wo.inProcesses.length > 0) {
      let lastProcess = null;
      let maxSn = -1;
      wo.inProcesses.forEach((ip: any) => {
        ip.routingProcesses?.forEach((rp: any) => {
          if (rp.sn > maxSn) {
            maxSn = rp.sn;
            lastProcess = rp;
          }
        });
      });
      
      if (lastProcess) {
        producedQty = (lastProcess as any).productionTimesheets?.reduce((sum: number, ts: any) => sum + (Number(ts.completedQty) || 0), 0) || 0;
      }
    }
    
    producedQty = Math.min(producedQty, totalQty);
    
    return {
      ...wo,
      producedQty,
      totalQty
    };
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">QC Approval</h1>
          <p className="text-sm text-slate-500 mt-1">
            Work orders pending quality control approval.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {workOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg font-medium text-slate-700 mb-2">No work orders pending QC</p>
            <p className="text-sm">
              Work orders will appear here once production is completed and status is "Pending for QC".
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
                  <th className="px-6 py-4 font-semibold">QC Status</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrichedWorkOrders.map((wo: any) => (
                  <tr key={wo.workOrderNo} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-blue-600">{wo.workOrderNo}</td>
                    <td className="px-6 py-4">{new Date(wo.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{wo.customer?.customerName || wo.CustomerProfile?.customerName}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{wo.jobDescription || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>{wo.producedQty} <span className="text-[9px] text-slate-400 font-medium uppercase">{wo.uom}</span></span>
                          <span className="text-slate-400">/ {wo.totalQty}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${wo.totalQty > 0 ? (wo.producedQty / wo.totalQty) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        wo.qcAcceptance === 'Rejected' ? 'bg-rose-100 text-rose-700' : 
                        wo.qcAcceptance === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {wo.qcAcceptance || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[wo.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/qc/approval/${wo.workOrderNo}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Open
                      </Link>
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
}
