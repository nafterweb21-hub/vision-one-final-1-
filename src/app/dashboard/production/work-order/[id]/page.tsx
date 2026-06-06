import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WorkOrderHeader from "../components/WorkOrderHeader";
import { getUomList } from "../actions";
import DeliveryLabelModal from "./DeliveryLabelModal";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { workOrderNo: id },
    include: {
      customer: true,
      labelUom: true,
      qcBy: true,
    },
  });

  if (!workOrder) notFound();

  console.log("Work Order QC Data:", { qcAcceptance: workOrder?.qcAcceptance, qcBy: workOrder?.qcBy?.name, qcDate: workOrder?.qcDate });

  const uoms = await getUomList();

  // Decimals → strings to keep client serialisable
  const serialised = JSON.parse(JSON.stringify(workOrder));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/production/work-order"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">
            Work Order: {workOrder.workOrderNo}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage work order details, routing, and parameters
          </p>
        </div>
        <div>
          <a
            href={`/print/work-order/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold transition-colors border border-blue-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print
          </a>
          <DeliveryLabelModal 
            workOrderNo={workOrder.workOrderNo} 
            defaultQty={workOrder.quantity?.toString() || "1"} 
            defaultUom={workOrder.labelUom?.uomName || workOrder.uom || ""} 
            uoms={uoms} 
          />
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <div className="border-b-2 border-blue-600 text-blue-600 whitespace-nowrap py-4 px-1 text-sm font-medium">
            Order Details
          </div>
          <Link
            href={`/dashboard/production/work-order/${id}/routing`}
            className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 text-sm font-medium"
          >
            In-Process & Routing
          </Link>
          <Link
            href={`/dashboard/production/work-order/${id}/timesheets`}
            className="border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 text-sm font-medium"
          >
            Timesheets & Parameters
          </Link>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <WorkOrderHeader wo={serialised} uoms={uoms} />
      </div>
    </div>
  );
}
