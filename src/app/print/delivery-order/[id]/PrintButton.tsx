"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <div className="print-actions">
      <button onClick={() => window.print()} className="inline-flex items-center gap-2">
        <Printer size={16} />
        Print Delivery Order
      </button>
    </div>
  );
}
