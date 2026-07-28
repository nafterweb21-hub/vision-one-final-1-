"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Renders the IRP signed QR code (a JWT string returned by the IRP) as a QR
 * image for the tax invoice printout.
 */
export default function EInvoiceQr({ value, size = 110 }: { value: string; size?: number }) {
  if (!value) return null;
  return <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />;
}
