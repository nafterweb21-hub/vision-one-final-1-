"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { findFormatCollision, saveCounter } from "@/lib/document-numbering";
import {
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  SEPARATORS,
  isDocType,
  validateFormat,
  type NumberFormat,
  type PeriodFormat,
  type ResetPeriod,
} from "@/lib/document-numbering.config";

export interface SaveFormatInput {
  docType: string;
  scopeKey: string;
  prefix: string;
  periodFormat: string;
  separator: string;
  sequenceLength: number;
  suffix: string;
  includeRevision: boolean;
  resetPeriod: string;
  nextSequence: number;
}

export type SaveFormatResult = { success: true } | { success: false; error: string };

const PERIOD_FORMATS: PeriodFormat[] = ["NONE", "YY", "YYYY", "MM", "YYMM", "YYYYMM"];
const RESET_PERIODS: ResetPeriod[] = ["NEVER", "YEARLY", "MONTHLY"];

export async function saveNumberFormat(input: SaveFormatInput): Promise<SaveFormatResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Only an administrator can change document numbering." };
  }

  if (!isDocType(input.docType)) {
    return { success: false, error: "Unknown document type." };
  }
  if (!PERIOD_FORMATS.includes(input.periodFormat as PeriodFormat)) {
    return { success: false, error: "Unknown period format." };
  }
  if (!RESET_PERIODS.includes(input.resetPeriod as ResetPeriod)) {
    return { success: false, error: "Unknown reset period." };
  }
  if (!SEPARATORS.some((s) => s.value === input.separator)) {
    return { success: false, error: "Unknown separator." };
  }

  const sequenceLength = Math.trunc(Number(input.sequenceLength));
  if (
    !Number.isFinite(sequenceLength) ||
    sequenceLength < MIN_SEQUENCE_LENGTH ||
    sequenceLength > MAX_SEQUENCE_LENGTH
  ) {
    return {
      success: false,
      error: `Sequence length must be between ${MIN_SEQUENCE_LENGTH} and ${MAX_SEQUENCE_LENGTH}.`,
    };
  }

  const nextSequence = Math.trunc(Number(input.nextSequence));
  if (!Number.isFinite(nextSequence) || nextSequence < 1) {
    return { success: false, error: "The next number must be 1 or greater." };
  }

  const format: NumberFormat = {
    prefix: input.prefix.trim(),
    periodFormat: input.periodFormat as PeriodFormat,
    separator: input.separator,
    sequenceLength,
    suffix: input.suffix.trim(),
    includeRevision: Boolean(input.includeRevision),
    resetPeriod: input.resetPeriod as ResetPeriod,
  };

  const invalid = validateFormat(format);
  if (invalid) return { success: false, error: invalid };

  const clash = await findFormatCollision(input.docType, input.scopeKey, format);
  if (clash) {
    return {
      success: false,
      error: `${clash} already issues this exact format. Document numbers are unique across all companies, so give this one a different prefix or suffix.`,
    };
  }

  await saveCounter(input.docType, input.scopeKey, format, nextSequence);
  revalidatePath("/dashboard/admin/document-numbering");
  return { success: true };
}
