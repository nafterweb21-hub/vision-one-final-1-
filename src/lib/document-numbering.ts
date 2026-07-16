/**
 * Mints document serial numbers from the format an admin has set.
 *
 * The counter is stored, not derived. The old approach — find the highest
 * existing number and add one (or worse, count the rows) — reread the same
 * "latest" row when two users saved at once and handed both the same number; a
 * count-based one also reused a number as soon as anything was voided. A stored
 * `nextSequence`, incremented under a row lock, does neither.
 */
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import {
  DEFAULT_FORMATS,
  DOC_TYPES,
  GLOBAL_SCOPE,
  docTypeDef,
  formatDocumentNo,
  periodKeyFor,
  type DocType,
  type NumberFormat,
  type PeriodFormat,
  type ResetPeriod,
} from '@/lib/document-numbering.config';

/** The stored row, as it comes back from a raw locking read. */
interface FormatRow {
  id: string;
  prefix: string;
  periodFormat: string;
  separator: string;
  sequenceLength: number;
  suffix: string;
  includeRevision: boolean;
  resetPeriod: string;
  nextSequence: number;
  periodKey: string;
}

/**
 * Which counter a document draws from: its company's, or the single global one.
 * A company-scoped type without a company would silently share one counter with
 * every other company, so it is an error rather than a fallback.
 */
export function scopeKeyFor(docType: DocType, companyId?: string | null): string {
  const def = docTypeDef(docType);
  if (def.scope === 'GLOBAL') return GLOBAL_SCOPE;
  if (!companyId) {
    throw new Error(`${def.label} numbering is per company, but no company was given.`);
  }
  return companyId;
}

/** Columns are free text at the database level; anything unrecognised falls back
 *  to the document type's default rather than producing a malformed number. */
function toNumberFormat(row: FormatRow, docType: DocType): NumberFormat {
  const fallback = DEFAULT_FORMATS[docType];
  const periods: PeriodFormat[] = ['NONE', 'YY', 'YYYY', 'MM', 'YYMM', 'YYYYMM'];
  const resets: ResetPeriod[] = ['NEVER', 'YEARLY', 'MONTHLY'];

  return {
    prefix: row.prefix,
    periodFormat: periods.includes(row.periodFormat as PeriodFormat)
      ? (row.periodFormat as PeriodFormat)
      : fallback.periodFormat,
    separator: row.separator,
    sequenceLength: row.sequenceLength,
    suffix: row.suffix,
    includeRevision: row.includeRevision,
    resetPeriod: resets.includes(row.resetPeriod as ResetPeriod)
      ? (row.resetPeriod as ResetPeriod)
      : fallback.resetPeriod,
  };
}

/** Reads the counter row and holds it until the transaction ends, so no other
 *  transaction can take the same sequence. */
async function lockFormat(
  tx: Prisma.TransactionClient,
  docType: DocType,
  scopeKey: string,
): Promise<FormatRow | undefined> {
  const rows = await tx.$queryRaw<FormatRow[]>`
    SELECT "id", "prefix", "periodFormat", "separator", "sequenceLength", "suffix",
           "includeRevision", "resetPeriod", "nextSequence", "periodKey"
    FROM "DocumentNumberFormat"
    WHERE "docType" = ${docType} AND "scopeKey" = ${scopeKey}
    FOR UPDATE
  `;
  return rows[0];
}

export interface NextDocumentNoOptions {
  /** Required for company-scoped document types; ignored for global ones. */
  companyId?: string | null;
  /** Revision to stamp; a new document is always 0. */
  revision?: number;
  /**
   * Whether a number is already in use on the target table.
   *
   * Counters can be per company while the number column is unique system-wide,
   * and a counter can start below a number some legacy row already holds. When
   * this is supplied, taken numbers are skipped (and the counter advances past
   * them) instead of failing on a unique constraint. Must query inside the same
   * transaction.
   */
  isTaken?: (documentNo: string) => Promise<boolean>;
}

/** Numbers to skip past before concluding something is wrong with the format. */
const MAX_SKIPS = 5000;

/**
 * Takes the next number for `docType` and advances the counter.
 *
 * MUST be called inside a transaction that also writes the document: the row
 * lock — and therefore the guarantee that nobody else gets this number — lasts
 * only as long as that transaction. Passing the bare `prisma` client would
 * release the lock the instant the SELECT returned.
 */
export async function nextDocumentNo(
  tx: Prisma.TransactionClient,
  docType: DocType,
  options: NextDocumentNoOptions = {},
): Promise<string> {
  const { companyId, revision = 0, isTaken } = options;
  const scopeKey = scopeKeyFor(docType, companyId);

  let row = await lockFormat(tx, docType, scopeKey);

  if (!row) {
    // First document of this type in this scope. Create the counter from the
    // default format; if a concurrent transaction beat us to it, re-read (which
    // now blocks on its lock instead of racing it).
    try {
      const created = await tx.documentNumberFormat.create({
        data: {
          docType,
          scopeKey,
          companyId: scopeKey === GLOBAL_SCOPE ? null : scopeKey,
          ...DEFAULT_FORMATS[docType],
          periodKey: '',
        },
      });
      row = { ...created } as FormatRow;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
      row = await lockFormat(tx, docType, scopeKey);
      if (!row) throw error;
    }
  }

  const format = toNumberFormat(row, docType);
  const now = new Date();
  const periodKey = periodKeyFor(format.resetPeriod, now);

  // A new period restarts the sequence — that is the whole point of the reset
  // setting. Within the same period we carry on from where we left off, which
  // is also what makes the admin's "next number" edit stick.
  let sequence = row.periodKey === periodKey ? row.nextSequence : 1;
  let documentNo = formatDocumentNo(format, sequence, revision, now);

  if (isTaken) {
    let skips = 0;
    while (await isTaken(documentNo)) {
      if (++skips > MAX_SKIPS) {
        throw new Error(
          `Could not find a free ${docType} number after ${MAX_SKIPS} attempts. Check the format under Admin → Document Numbering.`,
        );
      }
      sequence += 1;
      documentNo = formatDocumentNo(format, sequence, revision, now);
    }
  }

  await tx.documentNumberFormat.update({
    where: { id: row.id },
    data: { nextSequence: sequence + 1, periodKey },
  });

  return documentNo;
}

/** One configurable counter: a company's, or the global one for a doc type. */
export interface CounterView extends NumberFormat {
  /** Absent until the first document is issued, or until an admin saves. */
  id: string | null;
  docType: DocType;
  /** Null for globally-scoped document types. */
  companyId: string | null;
  /** The company's name, or "All companies" for a global counter. */
  scopeLabel: string;
  scopeKey: string;
  /** The sequence resets when the period rolls over, so the stored value is only
   *  the real next number if it belongs to the current period. */
  nextSequence: number;
}

export interface DocTypeView {
  code: DocType;
  label: string;
  group: string;
  description: string;
  scope: 'COMPANY' | 'GLOBAL';
  counters: CounterView[];
}

/**
 * Every counter an admin can configure, with defaults filled in for those that
 * have never been saved, so the settings screen can show them all.
 */
export async function listDocTypeViews(): Promise<DocTypeView[]> {
  const [companies, rows] = await Promise.all([
    prisma.companyProfile.findMany({
      where: { status: 'Active' },
      select: { id: true, companyName: true },
      orderBy: { companyName: 'asc' },
    }),
    prisma.documentNumberFormat.findMany(),
  ]);

  const byKey = new Map(rows.map((row) => [`${row.docType}:${row.scopeKey}`, row]));

  const counterFor = (
    docType: DocType,
    scopeKey: string,
    companyId: string | null,
    scopeLabel: string,
  ): CounterView => {
    const row = byKey.get(`${docType}:${scopeKey}`);
    if (!row) {
      return {
        ...DEFAULT_FORMATS[docType],
        id: null,
        docType,
        companyId,
        scopeKey,
        scopeLabel,
        nextSequence: 1,
      };
    }

    const format = toNumberFormat(row as FormatRow, docType);
    const live = row.periodKey === periodKeyFor(format.resetPeriod);

    return {
      ...format,
      id: row.id,
      docType,
      companyId,
      scopeKey,
      scopeLabel,
      nextSequence: live ? row.nextSequence : 1,
    };
  };

  return DOC_TYPES.map((def) => ({
    code: def.code,
    label: def.label,
    group: def.group,
    description: def.description,
    scope: def.scope,
    counters:
      def.scope === 'GLOBAL'
        ? [counterFor(def.code, GLOBAL_SCOPE, null, 'All companies')]
        : companies.map((company) =>
            counterFor(def.code, company.id, company.id, company.companyName),
          ),
  }));
}

/**
 * The other company whose numbers this format would collide with, if any.
 *
 * Company-scoped counters run independently but the number column is unique
 * system-wide, so two companies numbering identically will eventually both mint
 * PO2600042 — and the second one to save would fail on a database constraint
 * with nothing useful to say. Catch it here, while the admin can still add a
 * distinguishing prefix or suffix.
 */
export async function findFormatCollision(
  docType: DocType,
  scopeKey: string,
  format: NumberFormat,
): Promise<string | null> {
  if (docTypeDef(docType).scope === 'GLOBAL') return null;

  const others = await prisma.documentNumberFormat.findMany({
    where: {
      docType,
      scopeKey: { not: scopeKey },
      prefix: format.prefix,
      periodFormat: format.periodFormat,
      separator: format.separator,
      sequenceLength: format.sequenceLength,
      suffix: format.suffix,
    },
    include: { company: { select: { companyName: true, status: true } } },
  });

  const clash = others.find((row) => row.company?.status === 'Active');
  return clash?.company?.companyName ?? null;
}

/**
 * Saves a counter's format and its next number.
 *
 * The counter is stamped with the current period so that an edited "next
 * number" is used by the very next document rather than being wiped by a period
 * rollover that never happened.
 */
export async function saveCounter(
  docType: DocType,
  scopeKey: string,
  format: NumberFormat,
  nextSequence: number,
): Promise<void> {
  const data = {
    ...format,
    nextSequence,
    periodKey: periodKeyFor(format.resetPeriod),
  };

  await prisma.documentNumberFormat.upsert({
    where: { docType_scopeKey: { docType, scopeKey } },
    update: data,
    create: {
      docType,
      scopeKey,
      companyId: scopeKey === GLOBAL_SCOPE ? null : scopeKey,
      ...data,
    },
  });
}
