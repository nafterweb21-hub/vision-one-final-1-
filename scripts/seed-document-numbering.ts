/**
 * Seeds a counter for every document type from the numbers already in the
 * database, so the engine carries on from where the old hardcoded generators
 * left off instead of restarting at 1.
 *
 * Idempotent: a counter that already exists is left alone. Safe to re-run, and
 * safe to run on an empty database (every counter simply starts at 1).
 *
 *   npx tsx scripts/seed-document-numbering.ts
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import {
  DEFAULT_FORMATS,
  DOC_TYPES,
  GLOBAL_SCOPE,
  formatDocumentNo,
  periodKeyFor,
  type DocType,
  type NumberFormat,
} from '../src/lib/document-numbering.config';

/** Where each document type's existing numbers live. */
const SOURCES: Partial<Record<DocType, { rows: () => Promise<{ no: string | null }[]> }>> = {
  QUOTATION: {
    rows: () =>
      prisma.quotation.findMany({ select: { quotationNo: true } }).then((r) =>
        r.map((x) => ({ no: x.quotationNo })),
      ),
  },
  SALES_ORDER: {
    rows: () =>
      prisma.salesOrder.findMany({ select: { orderNo: true } }).then((r) =>
        r.map((x) => ({ no: x.orderNo })),
      ),
  },
  DELIVERY_ORDER: {
    rows: () =>
      prisma.deliveryOrder.findMany({ select: { doNo: true } }).then((r) =>
        r.map((x) => ({ no: x.doNo })),
      ),
  },
  INVOICE: {
    rows: () =>
      prisma.invoice.findMany({ select: { invoiceNo: true } }).then((r) =>
        r.map((x) => ({ no: x.invoiceNo })),
      ),
  },
  RECEIPT: {
    rows: () =>
      prisma.receipt.findMany({ select: { receiptNo: true } }).then((r) =>
        r.map((x) => ({ no: x.receiptNo })),
      ),
  },
  PURCHASE_REQUISITION: {
    rows: () =>
      prisma.purchaseRequisition.findMany({ select: { prNo: true } }).then((r) =>
        r.map((x) => ({ no: x.prNo })),
      ),
  },
  PURCHASE_ORDER: {
    rows: () =>
      prisma.purchaseOrder.findMany({ select: { poNo: true } }).then((r) =>
        r.map((x) => ({ no: x.poNo })),
      ),
  },
  GOODS_RECEIVE: {
    rows: () =>
      prisma.goodsReceive.findMany({ select: { grNo: true } }).then((r) =>
        r.map((x) => ({ no: x.grNo })),
      ),
  },
  GOODS_RETURN: {
    rows: () =>
      prisma.goodsReturn.findMany({ select: { rtnNo: true } }).then((r) =>
        r.map((x) => ({ no: x.rtnNo })),
      ),
  },
  SUBCON_REQUEST_FORM: {
    rows: () =>
      prisma.subconRequestForm.findMany({ select: { srfNo: true } }).then((r) =>
        r.map((x) => ({ no: x.srfNo })),
      ),
  },
  SUBCON_RETURN_TRACKING: {
    rows: () =>
      prisma.subconReturnTracking.findMany({ select: { srtNo: true } }).then((r) =>
        r.map((x) => ({ no: x.srtNo })),
      ),
  },
  SUBCON_REJECT_TRACKING: {
    rows: () =>
      prisma.subconRejectTracking.findMany({ select: { srjNo: true } }).then((r) =>
        r.map((x) => ({ no: x.srjNo })),
      ),
  },
  NCR: {
    rows: () =>
      prisma.ncr.findMany({ select: { ncrNo: true } }).then((r) => r.map((x) => ({ no: x.ncrNo }))),
  },
  REWORK: {
    rows: () =>
      prisma.workOrderRework.findMany({ select: { reworkNo: true } }).then((r) =>
        r.map((x) => ({ no: x.reworkNo })),
      ),
  },
  CERTIFICATE_OF_CONFORMITY: {
    rows: () =>
      prisma.certificateOfConformity.findMany({ select: { cocNo: true } }).then((r) =>
        r.map((x) => ({ no: x.cocNo })),
      ),
  },
  MATERIAL_CONSUMPTION: {
    rows: () =>
      prisma.materialConsumption.findMany({ select: { mcNo: true } }).then((r) =>
        r.map((x) => ({ no: x.mcNo })),
      ),
  },
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The highest sequence already issued under this format in the current period.
 *
 * Built from the format itself rather than a hand-written regex per document
 * type, so it keeps matching if the format is edited before this is re-run.
 * Numbers in an older format (or an older period) simply do not match, which is
 * what we want — they belong to a sequence that has already ended.
 */
function highestSequence(format: NumberFormat, numbers: string[]): number {
  const at = new Date();
  // Rebuild a specimen number, then swap its sequence for a capture group.
  const specimen = formatDocumentNo(format, 0, 0, at);
  const zeroes = String(0).padStart(format.sequenceLength, '0');
  const index = specimen.lastIndexOf(zeroes);
  if (index === -1) return 0;

  const head = escape(specimen.slice(0, index));
  const tail = escape(specimen.slice(index + zeroes.length)).replace(/-R0$/, '-R\\d+');
  const pattern = new RegExp(`^${head}(\\d+)${tail}$`);

  let highest = 0;
  for (const no of numbers) {
    const match = pattern.exec(no);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  }
  return highest;
}

async function main() {
  const companies = await prisma.companyProfile.findMany({
    select: { id: true, companyName: true },
  });

  for (const def of DOC_TYPES) {
    const format = DEFAULT_FORMATS[def.code];
    const rows = (await SOURCES[def.code]?.rows()) ?? [];
    const numbers = rows.map((r) => r.no).filter((n): n is string => Boolean(n));

    // The old generators numbered globally, even for documents that carry a
    // company. Seeding each company from the global maximum (rather than its
    // own) keeps a company-scoped counter from reissuing a number another
    // company already holds — these number columns are unique system-wide.
    const next = highestSequence(format, numbers) + 1;
    const periodKey = periodKeyFor(format.resetPeriod);

    const scopes =
      def.scope === 'GLOBAL'
        ? [{ scopeKey: GLOBAL_SCOPE, companyId: null, label: 'all companies' }]
        : companies.map((c) => ({ scopeKey: c.id, companyId: c.id, label: c.companyName }));

    for (const scope of scopes) {
      const existing = await prisma.documentNumberFormat.findUnique({
        where: { docType_scopeKey: { docType: def.code, scopeKey: scope.scopeKey } },
      });

      if (existing) {
        console.log(`  = ${def.code} / ${scope.label}: already configured (next ${existing.nextSequence})`);
        continue;
      }

      await prisma.documentNumberFormat.create({
        data: {
          docType: def.code,
          scopeKey: scope.scopeKey,
          companyId: scope.companyId,
          ...format,
          nextSequence: next,
          periodKey,
        },
      });

      console.log(
        `  + ${def.code} / ${scope.label}: next ${formatDocumentNo(format, next)} (${numbers.length} existing)`,
      );
    }
  }

  console.log('\nDocument numbering counters seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
