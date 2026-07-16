import { Hash } from "lucide-react";

import { auth } from "@/lib/auth";
import { listDocTypeViews, type CounterView, type DocTypeView } from "@/lib/document-numbering";
import { DOC_TYPE_GROUP_ORDER } from "@/lib/document-numbering.config";
import FormatForm from "./FormatForm";

export const dynamic = "force-dynamic";

/** Everything about a format except the counter — two companies matching on this
 *  produce the same strings, and document numbers are unique system-wide. */
const signature = (counter: CounterView) =>
  [
    counter.prefix,
    counter.periodFormat,
    counter.separator,
    counter.sequenceLength,
    counter.suffix,
  ].join(" ");

/** The other companies this counter would collide with, by name. */
function sharedFormats(all: CounterView[], counter: CounterView): string[] {
  const mine = signature(counter);
  return all
    .filter((other) => other.scopeKey !== counter.scopeKey && signature(other) === mine)
    .map((other) => other.scopeLabel);
}

function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
      <h1 className="text-2xl font-bold text-blue-900">Access denied</h1>
      <p className="mt-2 text-blue-500">You must be an administrator to view this page.</p>
    </div>
  );
}

function DocTypeSection({ docType }: { docType: DocTypeView }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{docType.label}</h3>
          <p className="text-sm font-medium text-slate-500">{docType.description}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {docType.scope === "COMPANY" ? "One counter per company" : "One counter, all companies"}
        </span>
      </div>

      {docType.counters.length === 0 ? (
        <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
          No active company profile. Add one before configuring numbering.
        </p>
      ) : (
        <div className="space-y-6">
          {docType.counters.map((counter) => (
            <FormatForm
              key={counter.scopeKey}
              docType={docType.code}
              scopeKey={counter.scopeKey}
              scopeLabel={counter.scopeLabel}
              docLabel={docType.label}
              configured={counter.id !== null}
              nextSequence={counter.nextSequence}
              sharedWith={sharedFormats(docType.counters, counter)}
              format={{
                prefix: counter.prefix,
                periodFormat: counter.periodFormat,
                separator: counter.separator,
                sequenceLength: counter.sequenceLength,
                suffix: counter.suffix,
                includeRevision: counter.includeRevision,
                resetPeriod: counter.resetPeriod,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DocumentNumberingPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return <AccessDenied />;

  const docTypes = await listDocTypeViews();
  const groups = DOC_TYPE_GROUP_ORDER.map((group) => ({
    group,
    docTypes: docTypes.filter((d) => d.group === group),
  })).filter((g) => g.docTypes.length > 0);

  return (
    <div className="animate-fade-in space-y-10 pb-12">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-[100vw] overflow-hidden rounded-b-3xl bg-slate-900 px-4 pt-6 pb-8 shadow-2xl sm:px-8 sm:pt-8 sm:pb-10 md:px-12 lg:px-16">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="ml-16 max-w-3xl md:ml-20 lg:ml-24 xl:ml-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Hash className="h-3 w-3" />
              Settings
            </span>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Document Numbering
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-300">
              The serial number each document is given when it is created — its prefix, the
              period stamped into it, how many digits the running number has, and when that
              number restarts. Documents that record which company issued them count per
              company; the rest share one counter.
            </p>

            <nav className="mt-6 flex flex-wrap gap-2">
              {groups.map(({ group }) => (
                <a
                  key={group}
                  href={`#${group.toLowerCase()}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10"
                >
                  {group}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {groups.map(({ group, docTypes: inGroup }) => (
        <div key={group} id={group.toLowerCase()} className="space-y-8 scroll-mt-6">
          <h3 className="border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">
            {group}
          </h3>
          {inGroup.map((docType) => (
            <DocTypeSection key={docType.code} docType={docType} />
          ))}
        </div>
      ))}

      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-medium leading-relaxed text-slate-500">
        Changing a format does not renumber documents that already exist — it only affects the
        next one issued. Work orders are not listed: their number is derived from the sales
        order line they belong to (WO-SO-2026-0001-001), not from a counter.
      </p>
    </div>
  );
}
