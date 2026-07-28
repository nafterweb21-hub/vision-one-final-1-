/**
 * Canonical status values.
 *
 * Every status column in `schema.prisma` is a plain `String`, which let casing
 * drift in (`"ACTIVE"` on Employee vs `"Active"` on all 30-odd other master
 * profiles) and made status-filtered queries silently miss rows. This module is
 * the single source of truth: import the constant, never retype the literal.
 *
 * Values are `as const` so each export doubles as a union type:
 *
 *   import { RecordStatus } from "@/lib/status";
 *   prisma.employee.findMany({ where: { status: RecordStatus.Active } });
 *
 * Real Postgres enums are the eventual goal. They are deliberately not used yet
 * because migrating 62 columns fails hard on any unexpected value already in
 * the database; normalising through this layer first makes that migration safe.
 */

/** Master-data records (profiles, employees, customers, suppliers, machines). */
export const RecordStatus = {
  Active: "Active",
  Inactive: "Inactive",
} as const;
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];

/**
 * Transactional document lifecycle — quotations, sales orders, PRs, POs,
 * invoices, receipts, delivery orders.
 *
 * Per `docs/spec/README.md` documents are never deleted, only voided, so `Void`
 * is a terminal state rather than a row removal.
 */
export const DocStatus = {
  Draft: "Draft",
  Submitted: "Submitted",
  RequireApproval: "Require Approval",
  PendingForApproval: "Pending For Approval",
  Approved: "Approved",
  Rejected: "Rejected",
  RejectedAgain: "Rejected Again",
  Confirmed: "Confirmed",
  Issued: "Issued",
  Converted: "Converted",
  Revised: "Revised",
  OldVersion: "Old Version",
  Completed: "Completed",
  Void: "Void",
} as const;
export type DocStatus = (typeof DocStatus)[keyof typeof DocStatus];

/** Work order / in-process / routing-process progress. */
export const ProductionStatus = {
  New: "New",
  WIP: "WIP",
  OnHold: "On Hold",
  ReworkInProgress: "Rework In Progress",
  PendingClosure: "Pending Closure",
  Completed: "Completed",
} as const;
export type ProductionStatus =
  (typeof ProductionStatus)[keyof typeof ProductionStatus];

/**
 * QC gates.
 *
 * NOTE: production data contains both `"Pending for QC"` and `"Pending QC"`.
 * They are preserved separately rather than silently merged — collapsing them
 * needs a data migration, not a constant rename. Use `PendingForQc` in new code.
 */
export const QcStatus = {
  Pending: "Pending",
  PendingForQc: "Pending for QC",
  /** @deprecated Legacy spelling still present in existing rows. */
  PendingQc: "Pending QC",
  Approved: "Approved",
  Rejected: "Rejected",
} as const;
export type QcStatus = (typeof QcStatus)[keyof typeof QcStatus];

/**
 * Legacy spellings mapped to their canonical form.
 *
 * Kept as a runtime helper for data imported from outside the app (seeds,
 * spreadsheets, the pre-normalisation database) — application code should use
 * the constants directly instead of relying on this.
 */
const RECORD_STATUS_ALIASES: Record<string, RecordStatus> = {
  active: RecordStatus.Active,
  inactive: RecordStatus.Inactive,
  enabled: RecordStatus.Active,
  disabled: RecordStatus.Inactive,
};

/** Normalises any casing of an Active/Inactive value; returns null if unknown. */
export function normalizeRecordStatus(
  value: string | null | undefined,
): RecordStatus | null {
  if (!value) return null;
  return RECORD_STATUS_ALIASES[value.trim().toLowerCase()] ?? null;
}

/** Case-insensitive "is this record live?" check for untrusted input. */
export function isActiveStatus(value: string | null | undefined): boolean {
  return normalizeRecordStatus(value) === RecordStatus.Active;
}
