"use client";

export default function PrintButton() {
  return (
    <div className="print-actions">
      <button onClick={() => window.print()}>Print / Save as PDF</button>
    </div>
  );
}
