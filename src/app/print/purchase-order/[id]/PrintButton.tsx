"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <div className="print-actions">
      <button onClick={() => window.print()} className="flex items-center gap-2">
        <Printer size={16} /> Print PO
      </button>
    </div>
  );
}
