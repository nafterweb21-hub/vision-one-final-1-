import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";

/**
 * Monthly Schedule Report — `docs/spec/reports.md`.
 *
 * "Target completion dates of each routing process per WO", refreshed every
 * five minutes. The spec leaves the column list open ("derive columns from Work
 * Order → In-Process → Routing Process until clarified"), so this returns one
 * row per routing process with its WO and in-process context, plus a derived
 * schedule state the UI colours on.
 */

export const dynamic = "force-dynamic";

/** A routing process is late when its target date has passed unfinished. */
type ScheduleState = "Completed" | "Overdue" | "Due Soon" | "On Track";

const COMPLETED_STATUSES = new Set(["completed", "done", "closed"]);

function scheduleState(
  status: string,
  targetCompletionDate: Date,
  now: Date,
): ScheduleState {
  if (COMPLETED_STATUSES.has(status.trim().toLowerCase())) return "Completed";
  if (targetCompletionDate < now) return "Overdue";

  const daysAway =
    (targetCompletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return daysAway <= 3 ? "Due Soon" : "On Track";
}

/** Inclusive-start/exclusive-end bounds for a `YYYY-MM` month, in local time. */
function monthBounds(month: string): { gte: Date; lt: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return {
    gte: new Date(year, monthIndex, 1),
    lt: new Date(year, monthIndex + 1, 1),
  };
}

export async function GET(req: NextRequest) {
  const { error } = await requirePermission("MONTHLY_SCHEDULE_REPORT", "v");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const workOrderNo = searchParams.get("workOrderNo");
  const customer = searchParams.get("customer");
  const state = searchParams.get("state");

  try {
    const where: Record<string, unknown> = {};

    if (month) {
      const bounds = monthBounds(month);
      if (!bounds) {
        return NextResponse.json(
          { error: "month must be formatted as YYYY-MM" },
          { status: 400 },
        );
      }
      where.targetCompletionDate = bounds;
    }

    if (workOrderNo || customer) {
      where.inProcess = {
        workOrder: {
          ...(workOrderNo
            ? { workOrderNo: { contains: workOrderNo, mode: "insensitive" } }
            : {}),
          ...(customer
            ? {
                customer: {
                  customerName: { contains: customer, mode: "insensitive" },
                },
              }
            : {}),
        },
      };
    }

    const routingProcesses = await prisma.routingProcess.findMany({
      where,
      include: {
        mainProcess: true,
        routingProcess: true,
        inProcess: {
          include: {
            workOrder: { include: { customer: true } },
          },
        },
      },
      orderBy: [{ targetCompletionDate: "asc" }, { sequence: "asc" }],
    });

    const now = new Date();

    const rows = routingProcesses.map((rp) => {
      const wo = rp.inProcess.workOrder;
      return {
        id: rp.id,
        workOrderNo: wo.workOrderNo,
        woDate: wo.date,
        woDeliveryDate: wo.deliveryDate,
        woStatus: wo.status,
        customerName: wo.customer?.customerName ?? "",
        projectCode: wo.projectCode ?? "",
        jobDescription: wo.jobDescription ?? "",
        inProcessDescription: rp.inProcess.description,
        inProcessTargetDate: rp.inProcess.targetCompletionDate,
        sn: rp.sn,
        sequence: rp.sequence,
        mainProcess: rp.mainProcess?.process ?? "",
        routingProcess: rp.routingProcess?.routingProcess ?? "",
        targetCompletionDate: rp.targetCompletionDate,
        fullyReceived: rp.fullyReceived,
        status: rp.status,
        remark: rp.remark ?? "",
        scheduleState: scheduleState(rp.status, rp.targetCompletionDate, now),
      };
    });

    const filtered = state
      ? rows.filter((r) => r.scheduleState === state)
      : rows;

    return NextResponse.json({
      generatedAt: now.toISOString(),
      summary: {
        total: filtered.length,
        overdue: filtered.filter((r) => r.scheduleState === "Overdue").length,
        dueSoon: filtered.filter((r) => r.scheduleState === "Due Soon").length,
        onTrack: filtered.filter((r) => r.scheduleState === "On Track").length,
        completed: filtered.filter((r) => r.scheduleState === "Completed").length,
      },
      rows: filtered,
    });
  } catch (err) {
    console.error("Monthly Schedule Report Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
