"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRoutingProcessStatus } from "../actions";
import ParameterDetailDrawer from "./ParameterDetailDrawer";

type Props = {
  rp: any;
  woStatus: string;
  employees?: any[];
  supportData?: any;
  workOrderNo?: string;
};

function fmtDate(d?: string | Date | null) {
  if (!d) return "-";
  const iso = typeof d === "string" ? d : d.toISOString();
  const [y, m, day] = iso.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

const STATUS_BADGE: Record<string, string> = {
  New: "bg-slate-100 text-slate-700",
  WIP: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

export default function RoutingProcessRow({
  rp,
  woStatus,
  employees = [],
  supportData = {},
  workOrderNo = "",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const editable = !["Void", "Cancelled", "Completed"].includes(woStatus);

  function setStatus(next: "WIP" | "Completed") {
    setError("");
    startTransition(async () => {
      const res = await markRoutingProcessStatus(rp.id, next);
      if (!res.success) setError(res.error || "Failed");
      else router.refresh();
    });
  }

  // Find all timesheets that have process parameters
  const paramsTimesheets = rp.productionTimesheets?.filter(
    (ts: any) => ts.weldingParameter || ts.sprayParameter || ts.machiningParameter
  ) || [];

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-3 py-2 text-slate-600">{rp.sn}</td>
      <td className="px-3 py-2">{rp.mainProcess?.process ?? "-"}</td>
      <td className="px-3 py-2 font-medium text-slate-800">
        {rp.routingProcess?.routingProcess ?? "-"}
      </td>
      <td className="px-3 py-2 text-slate-600">{fmtDate(rp.targetCompletionDate)}</td>
      <td className="px-3 py-2 text-center">
        {rp.fullyReceived ? (
          <span className="text-xs text-emerald-700">Yes</span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {paramsTimesheets.length > 0 ? (
          paramsTimesheets.map((ts: any) => (
            <div key={ts.id} className="inline-block m-0.5">
              <ParameterDetailDrawer
                welding={ts.weldingParameter ? JSON.parse(JSON.stringify(ts.weldingParameter)) : null}
                spray={ts.sprayParameter ? JSON.parse(JSON.stringify(ts.sprayParameter)) : null}
                machining={ts.machiningParameter ? JSON.parse(JSON.stringify(ts.machiningParameter)) : null}
                employees={employees}
                workOrderNo={workOrderNo}
                editable={editable}
                supportData={supportData}
              />
            </div>
          ))
        ) : (
          <span className="text-slate-400 text-xs">-</span>
        )}
      </td>
      <td className="px-3 py-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[rp.status] ?? "bg-slate-100 text-slate-700"}`}>
          {rp.status}
        </span>
      </td>
      <td className="px-3 py-2 text-right space-x-1.5">
        {editable && rp.status === "New" && (
          <button
            onClick={() => setStatus("WIP")}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
          >
            Start
          </button>
        )}
        {editable && rp.status === "WIP" && (
          <button
            onClick={() => setStatus("Completed")}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
          >
            Complete
          </button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </td>
    </tr>
  );
}
