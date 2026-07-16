import { prisma } from '@/lib/prisma';
import {
  DEFAULT_PERIOD,
  KRAS,
  attainment,
  ragFor,
  type KpiDef,
  type KraDef,
  type PeriodKey,
  type RagStatus,
} from '@/lib/kpi.config';

/**
 * Computes the Super Admin KPI / KRA scorecard.
 *
 * Every number here is derived from the document trail — sales orders, work
 * orders, NCRs, POs, invoices — so the scorecard can never disagree with the
 * operational screens. Nothing is stored; targets come from `kpi.config.ts`.
 *
 * Document amounts are held in their own currency, so each is converted with
 * the rate stored on the document itself. Snapshot KPIs (overdue work orders,
 * overdue receivables, approval aging) are read as of the end of the period —
 * today for the presets, the chosen end date for a custom range.
 */

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.437;

/** Statuses that mean "this document was never real". Excluded everywhere. */
const VOIDED = ['Draft', 'Void', 'Cancelled', 'Old Version'];

/** A work order still owing output. There is no `Closed` state — completion is terminal. */
const WO_OPEN = { notIn: ['Completed', 'Closed', 'Cancelled', 'Void', 'Draft'] };

/** The exact literal the PO transition route writes. `Pending Approval` matches nothing. */
const PO_PENDING_APPROVAL = 'Pending For Approval';

export interface KpiResult extends KpiDef {
  value: number;
  /** The target after period scaling — this is what `value` was judged against. */
  effectiveTarget: number;
  attainment: number;
  status: RagStatus;
  /**
   * The population the number rests on, not the count of hits. Zero means "no
   * documents to measure", so the KPI is unmeasured rather than failing — but a
   * snapshot like Overdue Work Orders keeps the whole open book as its sample,
   * so a clean zero scores as on-track instead of disappearing as "no data".
   */
  sampleSize: number;
}

export interface KraResult extends Omit<KraDef, 'kpis'> {
  kpis: KpiResult[];
  /** Mean attainment across the KRA's KPIs, as a percentage. */
  score: number;
  status: RagStatus;
}

export interface Scorecard {
  period: PeriodKey;
  from: Date;
  to: Date;
  kras: KraResult[];
  /** Mean of the KRA scores. */
  overallScore: number;
  overallStatus: RagStatus;
  attention: { kra: string; kpi: KpiResult }[];
}

/** A custom range, already parsed. Only consulted when `period` is `CUSTOM`. */
export interface CustomRange {
  from: Date;
  to: Date;
}

/**
 * The end of the range is inclusive of its whole day, so a `to` of the 13th
 * catches documents dated the 13th rather than stopping at its midnight.
 */
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function periodRange(
  period: PeriodKey,
  custom?: CustomRange,
  now = new Date(),
): { from: Date; to: Date } {
  const to = now;
  switch (period) {
    case 'MTD':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case 'QTD':
      return { from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), to };
    case 'YTD':
      return { from: new Date(now.getFullYear(), 0, 1), to };
    case 'L12M':
      return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to };
    case 'CUSTOM':
      // A CUSTOM period with no dates cannot be measured; fall back to the default.
      if (!custom) return periodRange(DEFAULT_PERIOD, undefined, now);
      return { from: custom.from, to: endOfDay(custom.to) };
  }
}

/**
 * Volume targets scale to the time actually elapsed, not the calendar period, so
 * a month-to-date figure on the 5th is judged against five days of target rather
 * than a full month's — the scorecard reads as a run rate, not a shortfall.
 */
function monthsElapsed(from: Date, to: Date): number {
  const days = Math.max(1, (to.getTime() - from.getTime()) / MS_PER_DAY);
  return days / DAYS_PER_MONTH;
}

const num = (v: unknown): number => (v == null ? 0 : Number(v));

/** Converts a document amount to base currency using the rate stored on it. */
const base = (amount: unknown, rate: unknown): number => num(amount) * (num(rate) || 1);

const ratio = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : (numerator / denominator) * 100;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

type Measure = { value: number; sampleSize: number };

/** Every KPI code in `kpi.config.ts` must be produced here or the card renders empty. */
async function measureAll(from: Date, to: Date): Promise<Record<string, Measure>> {
  const window = { gte: from, lte: to };
  const now = to;

  const [
    salesOrders,
    quotations,
    invoices,
    deliveryItems,
    overdueWoCount,
    openWoCount,
    deliveryOrders,
    dueWorkOrders,
    completedWorkOrders,
    timesheets,
    qcWorkOrders,
    ncrs,
    touchedWoCount,
    goodsReceives,
    pendingPos,
    periodPos,
    overdueInvoices,
    openInvoiceCount,
    receipts,
  ] = await Promise.all([
    // Sales
    prisma.salesOrder.findMany({
      where: { date: window, status: { notIn: VOIDED } },
      select: { amountAfterTax: true, exchangeRate: true },
    }),
    prisma.quotation.findMany({
      where: { date: window, status: { notIn: VOIDED } },
      select: { salesOrderId: true },
    }),
    prisma.invoice.findMany({
      where: { invoiceDate: window, invoiceType: 'Customer Invoice', status: { notIn: VOIDED } },
      select: { amountAfterTax: true, amountPaid: true, exchangeRate: true },
    }),

    // Delivery
    prisma.deliveryOrderItem.findMany({
      where: {
        deliveryOrder: { date: window, status: { notIn: VOIDED } },
        workOrder: { deliveryDate: { not: null } },
      },
      select: { deliveryOrder: { select: { date: true } }, workOrder: { select: { deliveryDate: true } } },
    }),
    prisma.workOrder.count({
      where: { deliveryDate: { lt: now }, status: WO_OPEN },
    }),
    prisma.workOrder.count({ where: { status: WO_OPEN } }),
    prisma.deliveryOrder.findMany({
      where: { date: window, status: { notIn: VOIDED } },
      select: { date: true, salesOrderId: true, salesOrder: { select: { date: true } } },
      orderBy: { date: 'asc' },
    }),

    // Production
    prisma.workOrder.findMany({
      where: { deliveryDate: window, status: { notIn: ['Cancelled', 'Void', 'Draft'] } },
      select: { status: true },
    }),
    prisma.workOrder.findMany({
      where: { status: { in: ['Completed', 'Closed'] }, updatedAt: window },
      select: { finalApprovedQty: true, acceptedQty: true, quantity: true },
    }),
    prisma.productionTimesheet.findMany({
      where: { timeOut: window },
      select: { totalMinutes: true, totalIdleMinutes: true },
    }),

    // Quality
    prisma.workOrder.findMany({
      where: { qcDate: window },
      select: { acceptedQty: true, rejectedQty: true },
    }),
    prisma.ncr.findMany({
      where: { ncrDate: window },
      select: { status: true, ncrQuantity: true, scrapQuantity: true },
    }),
    prisma.workOrder.count({
      where: { updatedAt: window, status: { notIn: ['Cancelled', 'Void', 'Draft'] } },
    }),

    // Procurement
    prisma.goodsReceive.findMany({
      where: { date: window, status: { notIn: VOIDED } },
      select: {
        date: true,
        items: { select: { purchaseOrderItem: { select: { deliveryDate: true } } } },
      },
    }),
    prisma.purchaseOrder.findMany({
      where: { status: PO_PENDING_APPROVAL },
      select: { createdAt: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { date: window, status: { notIn: VOIDED } },
      select: { receiveStatus: true },
    }),

    // Finance
    prisma.invoice.findMany({
      where: { dueDate: { lt: now }, status: { notIn: VOIDED }, balanceDue: { gt: 0 } },
      select: { balanceDue: true, exchangeRate: true },
    }),
    prisma.invoice.count({
      where: { status: { notIn: VOIDED }, balanceDue: { gt: 0 } },
    }),
    prisma.receipt.findMany({
      where: { receiptDate: window, status: { notIn: VOIDED } },
      select: { receiptDate: true, invoice: { select: { invoiceDate: true } } },
    }),
  ]);

  // ── Sales ──────────────────────────────────────────────────────────────────
  const orderIntake = salesOrders.reduce((sum, so) => sum + base(so.amountAfterTax, so.exchangeRate), 0);
  const wonQuotations = quotations.filter((q) => q.salesOrderId !== null).length;
  const revenueInvoiced = invoices.reduce((sum, inv) => sum + base(inv.amountAfterTax, inv.exchangeRate), 0);

  // ── Delivery ───────────────────────────────────────────────────────────────
  const onTimeLines = deliveryItems.filter(
    (item) => item.deliveryOrder.date <= item.workOrder.deliveryDate!,
  ).length;

  // A sales order can ship in several drops; only the first one measures the
  // promise the customer was given, so later drops are not separate lead times.
  const firstDropBySalesOrder = new Map<string, number>();
  for (const doc of deliveryOrders) {
    if (firstDropBySalesOrder.has(doc.salesOrderId)) continue;
    firstDropBySalesOrder.set(
      doc.salesOrderId,
      (doc.date.getTime() - doc.salesOrder.date.getTime()) / MS_PER_DAY,
    );
  }
  const leadTimes = [...firstDropBySalesOrder.values()].filter((days) => days >= 0);

  // ── Production ─────────────────────────────────────────────────────────────
  const completedDue = dueWorkOrders.filter((wo) => ['Completed', 'Closed'].includes(wo.status)).length;
  const throughput = completedWorkOrders.reduce(
    (sum, wo) => sum + (num(wo.finalApprovedQty) || num(wo.acceptedQty) || num(wo.quantity)),
    0,
  );

  // `totalMinutes` is wall-clock from scan-in to scan-out, so idle time is inside it.
  const bookedMinutes = timesheets.reduce((sum, ts) => sum + num(ts.totalMinutes), 0);
  const idleMinutes = timesheets.reduce((sum, ts) => sum + num(ts.totalIdleMinutes), 0);

  // ── Quality ────────────────────────────────────────────────────────────────
  const acceptedQty = qcWorkOrders.reduce((sum, wo) => sum + num(wo.acceptedQty), 0);
  const rejectedQty = qcWorkOrders.reduce((sum, wo) => sum + num(wo.rejectedQty), 0);
  const closedNcrs = ncrs.filter((n) => ['Closed', 'Completed'].includes(n.status)).length;
  const ncrQty = ncrs.reduce((sum, n) => sum + n.ncrQuantity, 0);
  const scrapQty = ncrs.reduce((sum, n) => sum + n.scrapQuantity, 0);

  // ── Procurement ────────────────────────────────────────────────────────────
  // A receipt is on time against the earliest line it was due to satisfy.
  const datedReceives = goodsReceives
    .map((gr) => {
      const dueDates = gr.items
        .map((item) => item.purchaseOrderItem.deliveryDate)
        .filter((d): d is Date => d != null);
      return dueDates.length === 0 ? null : { date: gr.date, due: new Date(Math.min(...dueDates.map((d) => d.getTime()))) };
    })
    .filter((gr): gr is { date: Date; due: Date } => gr !== null);
  const onTimeReceives = datedReceives.filter((gr) => gr.date <= gr.due).length;

  const approvalAges = pendingPos.map((po) => (now.getTime() - po.createdAt.getTime()) / MS_PER_DAY);
  const fullyReceivedPos = periodPos.filter((po) => po.receiveStatus === 'FULLY_RECEIVED').length;

  // ── Finance ────────────────────────────────────────────────────────────────
  const invoicedValue = invoices.reduce((sum, inv) => sum + base(inv.amountAfterTax, inv.exchangeRate), 0);
  const collectedValue = invoices.reduce((sum, inv) => sum + base(inv.amountPaid, inv.exchangeRate), 0);
  const overdueAr = overdueInvoices.reduce((sum, inv) => sum + base(inv.balanceDue, inv.exchangeRate), 0);
  const collectionDays = receipts.map(
    (r) => (r.receiptDate.getTime() - r.invoice.invoiceDate.getTime()) / MS_PER_DAY,
  );

  return {
    ORDER_INTAKE: { value: orderIntake, sampleSize: salesOrders.length },
    QUOTE_WIN_RATE: { value: ratio(wonQuotations, quotations.length), sampleSize: quotations.length },
    REVENUE_INVOICED: { value: revenueInvoiced, sampleSize: invoices.length },

    ON_TIME_DELIVERY: { value: ratio(onTimeLines, deliveryItems.length), sampleSize: deliveryItems.length },
    // Watched against the whole open book: no overdue work orders is a result, not a gap in the data.
    OVERDUE_WO: { value: overdueWoCount, sampleSize: openWoCount },
    ORDER_LEAD_TIME: { value: mean(leadTimes), sampleSize: leadTimes.length },

    WO_COMPLETION: { value: ratio(completedDue, dueWorkOrders.length), sampleSize: dueWorkOrders.length },
    THROUGHPUT: { value: throughput, sampleSize: completedWorkOrders.length },
    LABOUR_EFFICIENCY: {
      value: ratio(Math.max(0, bookedMinutes - idleMinutes), bookedMinutes),
      sampleSize: timesheets.length,
    },

    FIRST_PASS_YIELD: {
      value: ratio(acceptedQty, acceptedQty + rejectedQty),
      sampleSize: qcWorkOrders.length,
    },
    NCR_RATE: { value: ratio(ncrs.length, touchedWoCount), sampleSize: ncrs.length },
    NCR_CLOSURE: { value: ratio(closedNcrs, ncrs.length), sampleSize: ncrs.length },
    SCRAP_RATE: { value: ratio(scrapQty, ncrQty), sampleSize: ncrs.length },

    SUPPLIER_OTD: { value: ratio(onTimeReceives, datedReceives.length), sampleSize: datedReceives.length },
    // An empty approval queue ages zero days — measurable, and good, so long as POs were raised at all.
    PO_APPROVAL_AGING: { value: mean(approvalAges), sampleSize: periodPos.length },
    PO_FULFILMENT: { value: ratio(fullyReceivedPos, periodPos.length), sampleSize: periodPos.length },

    COLLECTION_RATE: { value: ratio(collectedValue, invoicedValue), sampleSize: invoices.length },
    OVERDUE_AR: { value: overdueAr, sampleSize: openInvoiceCount },
    DSO: { value: mean(collectionDays), sampleSize: receipts.length },
  };
}

export async function getScorecard(period: PeriodKey, custom?: CustomRange): Promise<Scorecard> {
  const { from, to } = periodRange(period, custom);
  const measures = await measureAll(from, to);
  const months = monthsElapsed(from, to);

  const kras: KraResult[] = KRAS.map((kra) => {
    const kpis: KpiResult[] = kra.kpis.map((kpi) => {
      const measure = measures[kpi.code] ?? { value: 0, sampleSize: 0 };
      const effectiveTarget = kpi.scaling === 'monthly' ? kpi.target * months : kpi.target;
      const ratio = attainment(measure.value, effectiveTarget, kpi.direction);

      return {
        ...kpi,
        value: measure.value,
        effectiveTarget,
        attainment: ratio,
        status: ragFor(ratio),
        sampleSize: measure.sampleSize,
      };
    });

    // A KPI with no documents behind it is unmeasured, not failed — leaving it in
    // would drag the KRA score down for a quiet month.
    //
    // Attainment is capped at target for scoring, so overshooting one KPI cannot
    // paper over another that is failing. The uncapped figure still shows on the
    // KPI row itself.
    const measured = kpis.filter((k) => k.sampleSize > 0);
    const score = mean(measured.map((k) => Math.min(k.attainment, 1))) * 100;

    return {
      code: kra.code,
      name: kra.name,
      owner: kra.owner,
      kpis,
      score,
      status: measured.length === 0 ? 'at-risk' : ragFor(score / 100),
    };
  });

  const scored = kras.filter((k) => k.kpis.some((kpi) => kpi.sampleSize > 0));
  const overallScore = mean(scored.map((k) => k.score));

  const attention = kras
    .flatMap((kra) => kra.kpis.map((kpi) => ({ kra: kra.name, kpi })))
    .filter(({ kpi }) => kpi.sampleSize > 0 && kpi.status !== 'on-track')
    .sort((a, b) => a.kpi.attainment - b.kpi.attainment);

  return {
    period,
    from,
    to,
    kras,
    overallScore,
    overallStatus: scored.length === 0 ? 'at-risk' : ragFor(overallScore / 100),
    attention,
  };
}
