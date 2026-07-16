"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarRange } from "lucide-react";

/**
 * The custom-range control for the scorecard. Presets are plain links; this one
 * needs two inputs before it can navigate, so it holds them until Apply.
 */
export default function DateRangePicker({
  from,
  to,
  active,
}: {
  /** `YYYY-MM-DD`. Seeded from the period currently on screen, so switching to custom starts where you were. */
  from: string;
  to: string;
  active: boolean;
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  const invalid = !fromDate || !toDate || fromDate > toDate;

  function apply() {
    if (invalid) return;
    router.push(`/dashboard/admin/kpi?period=CUSTOM&from=${fromDate}&to=${toDate}`);
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 transition-colors ${
        active ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"
      }`}
    >
      <CalendarRange className="h-4 w-4 shrink-0 text-indigo-300" />

      <label className="sr-only" htmlFor="kpi-from">
        From date
      </label>
      <input
        id="kpi-from"
        type="date"
        value={fromDate}
        max={toDate || undefined}
        onChange={(event) => setFromDate(event.target.value)}
        className="rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-indigo-400 [color-scheme:dark]"
      />

      <span className="text-xs font-bold text-slate-400">to</span>

      <label className="sr-only" htmlFor="kpi-to">
        To date
      </label>
      <input
        id="kpi-to"
        type="date"
        value={toDate}
        min={fromDate || undefined}
        onChange={(event) => setToDate(event.target.value)}
        className="rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-indigo-400 [color-scheme:dark]"
      />

      <button
        type="button"
        onClick={apply}
        disabled={invalid}
        className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
      >
        Apply
      </button>
    </div>
  );
}
