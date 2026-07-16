/**
 * How a document's serial number is built.
 *
 * A number is assembled left to right from four optional parts and a running
 * sequence, joined by the separator, with an optional revision tail:
 *
 *     prefix   period   sequence   suffix     -R{revision}
 *     INV        26      00001        —          -R0        -> INV2600001-R0
 *     INV       2026     00001       SG          -R0        -> INV-2026-00001-SG-R0   (separator "-")
 *
 * Empty parts drop out entirely rather than leaving a dangling separator, so a
 * blank suffix costs nothing. This file is pure — no Prisma, no server-only
 * imports — because both the admin form (to preview a number as you type) and
 * the generator (to mint the real one) build strings with it.
 */

/**
 * Whether a document type counts per company or once for the whole system.
 *
 * This is not a preference — it follows from the data. A document that records
 * which company issued it (invoice, purchase order, receipt) can hold a counter
 * per company. One that does not (quotation, sales order, NCR) has nothing to
 * scope by, so it counts globally.
 */
export type DocScope = 'COMPANY' | 'GLOBAL';

/** Scope key for document types with no company. */
export const GLOBAL_SCOPE = 'GLOBAL';

export interface DocTypeDef {
  code: string;
  label: string;
  /** Grouping on the settings screen. */
  group: string;
  scope: DocScope;
  description: string;
}

/**
 * Document types wired to the numbering engine.
 *
 * Work orders are deliberately absent: their number is derived from the sales
 * order line it came from (`WO-SO-2026-0001-001-02`), not drawn from a counter,
 * and that traceability is worth more than consistency with everything else.
 */
export const DOC_TYPES = [
  {
    code: 'QUOTATION',
    label: 'Quotation',
    group: 'Sales',
    scope: 'GLOBAL',
    description: 'Costings and quotations issued to customers.',
  },
  {
    code: 'SALES_ORDER',
    label: 'Sales Order',
    group: 'Sales',
    scope: 'GLOBAL',
    description: 'Confirmed customer orders, raised directly or from a quotation.',
  },
  {
    code: 'DELIVERY_ORDER',
    label: 'Delivery Order',
    group: 'Sales',
    scope: 'GLOBAL',
    description: 'Goods despatched to the customer.',
  },
  {
    code: 'INVOICE',
    label: 'Invoice',
    group: 'Sales',
    scope: 'COMPANY',
    description: 'Customer invoices, credit notes and debit notes.',
  },
  {
    code: 'RECEIPT',
    label: 'Receipt',
    group: 'Sales',
    scope: 'COMPANY',
    description: 'Payments received against invoices.',
  },
  {
    code: 'PURCHASE_REQUISITION',
    label: 'Purchase Requisition',
    group: 'Purchasing',
    scope: 'COMPANY',
    description: 'Internal requests to buy.',
  },
  {
    code: 'PURCHASE_ORDER',
    label: 'Purchase Order',
    group: 'Purchasing',
    scope: 'COMPANY',
    description: 'Orders placed on suppliers.',
  },
  {
    code: 'GOODS_RECEIVE',
    label: 'Goods Receive',
    group: 'Purchasing',
    scope: 'COMPANY',
    description: 'Receipt of goods against a purchase order.',
  },
  {
    code: 'GOODS_RETURN',
    label: 'Goods Return',
    group: 'Purchasing',
    scope: 'COMPANY',
    description: 'Goods sent back to a supplier.',
  },
  {
    code: 'SUBCON_REQUEST_FORM',
    label: 'Subcon Request Form',
    group: 'Subcon',
    scope: 'GLOBAL',
    description: 'Work sent out to a subcontractor.',
  },
  {
    code: 'SUBCON_RETURN_TRACKING',
    label: 'Subcon Return Tracking',
    group: 'Subcon',
    scope: 'COMPANY',
    description: 'Parts coming back from a subcontractor.',
  },
  {
    code: 'SUBCON_REJECT_TRACKING',
    label: 'Subcon Reject Tracking',
    group: 'Subcon',
    scope: 'COMPANY',
    description: 'Parts rejected on return from a subcontractor.',
  },
  {
    code: 'NCR',
    label: 'Non-Conformance Report',
    group: 'Quality',
    scope: 'GLOBAL',
    description: 'Raised from the QC screen or automatically on a QC rejection.',
  },
  {
    code: 'REWORK',
    label: 'Work Order Rework',
    group: 'Quality',
    scope: 'GLOBAL',
    description: 'Rework raised when QC rejects a work order.',
  },
  {
    code: 'CERTIFICATE_OF_CONFORMITY',
    label: 'Certificate of Conformity',
    group: 'Quality',
    scope: 'GLOBAL',
    description: 'Conformity certificates issued with a delivery.',
  },
  {
    code: 'MATERIAL_CONSUMPTION',
    label: 'Material Consumption',
    group: 'Inventory',
    scope: 'GLOBAL',
    description: 'Material issued to a work order.',
  },
] as const satisfies readonly DocTypeDef[];

export type DocType = (typeof DOC_TYPES)[number]['code'];

/** Stable ordering of the groups on the settings screen. */
export const DOC_TYPE_GROUP_ORDER = ['Sales', 'Purchasing', 'Subcon', 'Quality', 'Inventory'];

export function isDocType(value: unknown): value is DocType {
  return DOC_TYPES.some((d) => d.code === value);
}

export function docTypeDef(code: DocType): DocTypeDef {
  return DOC_TYPES.find((d) => d.code === code)!;
}

/** The period stamped into the number itself. */
export type PeriodFormat = 'NONE' | 'YY' | 'YYYY' | 'MM' | 'YYMM' | 'YYYYMM';

/** When the running sequence goes back to 1. */
export type ResetPeriod = 'NEVER' | 'YEARLY' | 'MONTHLY';

export const PERIOD_FORMATS: { value: PeriodFormat; label: string; example: string }[] = [
  { value: 'NONE', label: 'No period', example: '' },
  { value: 'YY', label: '2-digit year', example: '26' },
  { value: 'YYYY', label: '4-digit year', example: '2026' },
  { value: 'MM', label: 'Month only', example: '07' },
  { value: 'YYMM', label: '2-digit year + month', example: '2607' },
  { value: 'YYYYMM', label: '4-digit year + month', example: '202607' },
];

export const RESET_PERIODS: { value: ResetPeriod; label: string; hint: string }[] = [
  { value: 'NEVER', label: 'Never', hint: 'One continuous sequence, forever.' },
  { value: 'YEARLY', label: 'Every year', hint: 'Back to 1 on 1 January.' },
  { value: 'MONTHLY', label: 'Every month', hint: 'Back to 1 on the 1st of each month.' },
];

export const SEPARATORS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: '-', label: 'Hyphen  -' },
  { value: '/', label: 'Slash  /' },
  { value: '.', label: 'Dot  .' },
];

/** The configurable shape of a number. Mirrors the `DocumentNumberFormat` columns. */
export interface NumberFormat {
  prefix: string;
  periodFormat: PeriodFormat;
  separator: string;
  sequenceLength: number;
  suffix: string;
  includeRevision: boolean;
  resetPeriod: ResetPeriod;
}

/**
 * What a document type numbers like until an admin says otherwise.
 *
 * Every default here reproduces the format that was hardcoded before this
 * setting existed, so turning the engine on changes nothing on its own. The two
 * exceptions, both deliberate:
 *
 *  - NCR had two generators writing incompatible formats (`NCR20260701` and
 *    `NCR-2026-0001`) into the same unique column, which could collide. They are
 *    unified here on the house style.
 *  - Delivery orders had no generator — the number was typed by hand — so this
 *    is their first format.
 */
const YEARLY_5: Omit<NumberFormat, 'prefix'> = {
  periodFormat: 'YY',
  separator: '',
  sequenceLength: 5,
  suffix: '',
  includeRevision: false,
  resetPeriod: 'YEARLY',
};

export const DEFAULT_FORMATS: Record<DocType, NumberFormat> = {
  // Q00001 — no year, never resets.
  QUOTATION: {
    prefix: 'Q',
    periodFormat: 'NONE',
    separator: '',
    sequenceLength: 5,
    suffix: '',
    includeRevision: false,
    resetPeriod: 'NEVER',
  },
  // SO-2026-0001
  SALES_ORDER: {
    prefix: 'SO',
    periodFormat: 'YYYY',
    separator: '-',
    sequenceLength: 4,
    suffix: '',
    includeRevision: false,
    resetPeriod: 'YEARLY',
  },
  DELIVERY_ORDER: { prefix: 'DO', ...YEARLY_5 }, // DO2600001 (new)
  INVOICE: { prefix: 'INV', ...YEARLY_5, includeRevision: true }, // INV2600001-R0
  RECEIPT: { prefix: 'RCPT', ...YEARLY_5 }, // RCPT2600001
  PURCHASE_REQUISITION: { prefix: 'PR', ...YEARLY_5 }, // PR2600001
  PURCHASE_ORDER: { prefix: 'PO', ...YEARLY_5 }, // PO2600001
  GOODS_RECEIVE: { prefix: 'GR', ...YEARLY_5 }, // GR2600001
  GOODS_RETURN: { prefix: 'RTN', ...YEARLY_5 }, // RTN2600001
  SUBCON_REQUEST_FORM: { prefix: 'SRF', ...YEARLY_5 }, // SRF2600001
  SUBCON_RETURN_TRACKING: { prefix: 'SRT', ...YEARLY_5 }, // SRT2600001
  SUBCON_REJECT_TRACKING: { prefix: 'SRJ', ...YEARLY_5 }, // SRJ2600001
  NCR: { prefix: 'NCR', ...YEARLY_5 }, // NCR2600001 (unifies two old formats)
  // RWK-2026-0001
  REWORK: {
    prefix: 'RWK',
    periodFormat: 'YYYY',
    separator: '-',
    sequenceLength: 4,
    suffix: '',
    includeRevision: false,
    resetPeriod: 'YEARLY',
  },
  CERTIFICATE_OF_CONFORMITY: { prefix: 'COC', ...YEARLY_5 }, // COC2600001
  MATERIAL_CONSUMPTION: { prefix: 'MC', ...YEARLY_5 }, // MC2600001
};

export const MIN_SEQUENCE_LENGTH = 1;
export const MAX_SEQUENCE_LENGTH = 12;

function periodPart(format: PeriodFormat, at: Date): string {
  const yyyy = String(at.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(at.getMonth() + 1).padStart(2, '0');

  switch (format) {
    case 'NONE':
      return '';
    case 'YY':
      return yy;
    case 'YYYY':
      return yyyy;
    case 'MM':
      return mm;
    case 'YYMM':
      return yy + mm;
    case 'YYYYMM':
      return yyyy + mm;
  }
}

/**
 * Builds the document number. A sequence longer than `sequenceLength` is
 * printed in full rather than truncated — overflowing the padding is ugly, but
 * silently reusing a number would be worse.
 */
export function formatDocumentNo(
  format: NumberFormat,
  sequence: number,
  revision = 0,
  at: Date = new Date(),
): string {
  const parts = [
    format.prefix,
    periodPart(format.periodFormat, at),
    String(sequence).padStart(format.sequenceLength, '0'),
    format.suffix,
  ].filter((part) => part !== '');

  const base = parts.join(format.separator);
  return format.includeRevision ? `${base}-R${revision}` : base;
}

/**
 * The bucket the counter currently belongs to. When the bucket changes, the
 * sequence restarts. `NEVER` returns a constant, so the bucket never changes.
 */
export function periodKeyFor(reset: ResetPeriod, at: Date = new Date()): string {
  const yyyy = String(at.getFullYear());
  const mm = String(at.getMonth() + 1).padStart(2, '0');

  switch (reset) {
    case 'NEVER':
      return 'ALL';
    case 'YEARLY':
      return yyyy;
    case 'MONTHLY':
      return `${yyyy}-${mm}`;
  }
}

/**
 * Rejects formats that would hand out the same number twice.
 *
 * The trap is resetting more often than the number distinguishes: reset monthly
 * while stamping only the year and January's INV2600001 comes round again in
 * February. Returns null when the format is safe.
 */
export function validateFormat(format: NumberFormat): string | null {
  if (format.sequenceLength < MIN_SEQUENCE_LENGTH || format.sequenceLength > MAX_SEQUENCE_LENGTH) {
    return `Sequence length must be between ${MIN_SEQUENCE_LENGTH} and ${MAX_SEQUENCE_LENGTH}.`;
  }

  const stampsYear = format.periodFormat.includes('YY');
  const stampsMonth = format.periodFormat.includes('MM');

  if (format.resetPeriod === 'YEARLY' && !stampsYear) {
    return 'Resetting every year needs a year in the number, or last year’s numbers will be issued again. Add a 2- or 4-digit year.';
  }

  if (format.resetPeriod === 'MONTHLY' && !(stampsYear && stampsMonth)) {
    return 'Resetting every month needs both a year and a month in the number, or last month’s numbers will be issued again. Use "year + month".';
  }

  if (/\s/.test(format.prefix) || /\s/.test(format.suffix)) {
    return 'Prefix and suffix cannot contain spaces.';
  }

  return null;
}

/** The number the next document will get, for the preview on the admin form. */
export function previewDocumentNo(format: NumberFormat, nextSequence: number): string {
  return formatDocumentNo(format, nextSequence, 0);
}

/**
 * The same document number, at a later revision.
 *
 * A revision reuses its original's number, so the `-R` tail is the only thing
 * keeping the two rows apart under a unique constraint. If the format was
 * configured without a tail, one is appended anyway — a duplicate number is a
 * worse outcome than a suffix the admin did not ask for.
 */
export function withRevision(documentNo: string, revision: number): string {
  return /-R\d+$/.test(documentNo)
    ? documentNo.replace(/-R\d+$/, `-R${revision}`)
    : `${documentNo}-R${revision}`;
}
