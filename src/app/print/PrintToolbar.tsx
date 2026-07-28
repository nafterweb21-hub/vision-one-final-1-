"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import type { PrintDocumentKey } from "@/lib/print-documents";

/**
 * Screen-only action bar for the `/print/*` views: browser print plus a
 * server-rendered PDF download. Hidden in `@media print` by `print.css`, so it
 * never reaches paper or the generated PDF itself.
 *
 * Replaces the per-document `PrintButton` copies that previously differed only
 * in their label.
 */
export default function PrintToolbar({
  doc,
  id,
  label = "Print",
}: {
  doc: PrintDocumentKey;
  id: string;
  label?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setDownloading(true);
    setFailed(false);
    try {
      const res = await fetch(
        `/api/print/${doc}/${encodeURIComponent(id)}/pdf?download=1`,
      );
      if (!res.ok) throw new Error(`PDF request failed (${res.status})`);

      // Read the server-supplied file name so the download matches the archive
      // naming used elsewhere (e.g. "PO 800123-R1.pdf").
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const fileName =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${doc}-${id}.pdf`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[print] PDF download failed", err);
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="print-actions" style={{ display: "flex", gap: 8 }}>
      <button onClick={() => window.print()} className="flex items-center gap-2">
        <Printer size={16} /> {label}
      </button>
      <button
        onClick={download}
        disabled={downloading}
        className="flex items-center gap-2"
        title={failed ? "PDF generation failed — try again" : "Download as PDF"}
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {downloading ? "Generating…" : failed ? "Retry PDF" : "PDF"}
      </button>
    </div>
  );
}
