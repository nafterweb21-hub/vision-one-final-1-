"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton({ ncrId }: { ncrId: string }) {
  return (
    <a
      href={`/print/ncr/${ncrId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold transition-colors border border-blue-200"
    >
      <Printer size={16} />
      Print NCR
    </a>
  );
}
