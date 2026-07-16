"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";

import {
  MAX_SEQUENCE_LENGTH,
  MIN_SEQUENCE_LENGTH,
  PERIOD_FORMATS,
  RESET_PERIODS,
  SEPARATORS,
  previewDocumentNo,
  validateFormat,
  withRevision,
  type DocType,
  type NumberFormat,
  type PeriodFormat,
  type ResetPeriod,
} from "@/lib/document-numbering.config";
import { saveNumberFormat } from "./document-numbering.actions";

export interface FormatFormProps {
  docType: DocType;
  /** The counter being edited: a company id, or "GLOBAL". */
  scopeKey: string;
  /** The company's name, or "All companies". */
  scopeLabel: string;
  docLabel: string;
  format: NumberFormat;
  /** What the next document actually gets, allowing for a period that has rolled over. */
  nextSequence: number;
  /** False until the counter has been saved or has issued its first document. */
  configured: boolean;
  /** Other companies currently issuing this exact format, if any. */
  sharedWith: string[];
}

const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-500";
const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default function FormatForm({
  docType,
  scopeKey,
  scopeLabel,
  docLabel,
  format: initial,
  nextSequence: initialNext,
  configured,
  sharedWith,
}: FormatFormProps) {
  const [format, setFormat] = useState<NumberFormat>(initial);
  const [nextSequence, setNextSequence] = useState(String(initialNext));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof NumberFormat>(key: K, value: NumberFormat[K]) => {
    setFormat((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const seq = Math.max(1, Math.trunc(Number(nextSequence) || 1));
  // The preview is only meaningful for a format that could actually be issued;
  // for an unsafe one, the warning takes its place.
  const problem = validateFormat(format);
  const preview = problem ? null : previewDocumentNo(format, seq);
  const dirty =
    JSON.stringify(format) !== JSON.stringify(initial) || seq !== initialNext;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveNumberFormat({
        docType,
        scopeKey,
        ...format,
        nextSequence: seq,
      });

      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error);
      }
    });
  };

  const reset = () => {
    setFormat(initial);
    setNextSequence(String(initialNext));
    setError(null);
    setSaved(false);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
        <div>
          <h4 className="text-base font-bold text-slate-900">{scopeLabel}</h4>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {configured
              ? "Numbering configured."
              : "Using the default format — nothing saved yet."}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Next number
          </p>
          {preview ? (
            <p className="font-mono text-xl font-extrabold tracking-tight text-slate-900">
              {preview}
            </p>
          ) : (
            <p className="text-sm font-bold text-rose-500">Not valid</p>
          )}
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
            Revision 1 would be {withRevision(preview ?? "—", 1)}
          </p>
        </div>
      </div>

      {sharedWith.length > 0 && (
        <div className="px-6 pt-5">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-700">
            {sharedWith.join(", ")} {sharedWith.length === 1 ? "issues" : "issue"} this same
            format. Each company counts on its own, but document numbers are unique across the
            whole system, so numbers already taken by the other company will be skipped. Give
            one of them a distinct prefix or suffix.
          </p>
        </div>
      )}

      <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor={`prefix-${scopeKey}`}>
            Prefix
          </label>
          <input
            id={`prefix-${scopeKey}`}
            className={fieldClass}
            value={format.prefix}
            maxLength={12}
            placeholder="INV"
            onChange={(e) => set("prefix", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`period-${scopeKey}`}>
            Period in the number
          </label>
          <select
            id={`period-${scopeKey}`}
            className={fieldClass}
            value={format.periodFormat}
            onChange={(e) => set("periodFormat", e.target.value as PeriodFormat)}
          >
            {PERIOD_FORMATS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.example ? ` — ${option.example}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`separator-${scopeKey}`}>
            Separator
          </label>
          <select
            id={`separator-${scopeKey}`}
            className={fieldClass}
            value={format.separator}
            onChange={(e) => set("separator", e.target.value)}
          >
            {SEPARATORS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`length-${scopeKey}`}>
            Sequence digits
          </label>
          <input
            id={`length-${scopeKey}`}
            type="number"
            min={MIN_SEQUENCE_LENGTH}
            max={MAX_SEQUENCE_LENGTH}
            className={fieldClass}
            value={format.sequenceLength}
            onChange={(e) => set("sequenceLength", Number(e.target.value))}
          />
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Zero-padded, e.g. 5 gives 00042.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor={`suffix-${scopeKey}`}>
            Suffix
          </label>
          <input
            id={`suffix-${scopeKey}`}
            className={fieldClass}
            value={format.suffix}
            maxLength={12}
            placeholder="optional"
            onChange={(e) => set("suffix", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`reset-${scopeKey}`}>
            Restart the sequence
          </label>
          <select
            id={`reset-${scopeKey}`}
            className={fieldClass}
            value={format.resetPeriod}
            onChange={(e) => set("resetPeriod", e.target.value as ResetPeriod)}
          >
            {RESET_PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {RESET_PERIODS.find((r) => r.value === format.resetPeriod)?.hint}
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor={`next-${scopeKey}`}>
            Next number
          </label>
          <input
            id={`next-${scopeKey}`}
            type="number"
            min={1}
            className={fieldClass}
            value={nextSequence}
            onChange={(e) => {
              setNextSequence(e.target.value);
              setSaved(false);
              setError(null);
            }}
          />
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Set this when carrying numbering over from another system.
          </p>
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <span className={labelClass}>Revision suffix</span>
          <label className="mt-1.5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
              checked={format.includeRevision}
              onChange={(e) => set("includeRevision", e.target.checked)}
            />
            <span className="text-xs font-medium text-slate-600">
              End the number with <span className="font-mono font-bold">-R0</span> on first
              issue. Revised documents always carry a{" "}
              <span className="font-mono font-bold">-R</span> tail regardless — it is what
              keeps each revision distinct.
            </span>
          </label>
        </div>
      </div>

      {(problem || error || saved) && (
        <div className="px-6 pb-2">
          {problem && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              {problem}
            </p>
          )}
          {error && !problem && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}
          {saved && !problem && !error && (
            <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Saved. The next {docLabel.toLowerCase()} will use
              this format.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={reset}
          disabled={pending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Discard
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || Boolean(problem) || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save format
        </button>
      </div>
    </div>
  );
}
