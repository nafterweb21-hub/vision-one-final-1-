import { type NextRequest, NextResponse } from "next/server";
import { resolveExportModule } from "@/lib/access";
import { requirePermission } from "@/lib/authz";
import { originFromRequest, renderPdf, type PdfCookie } from "@/lib/pdf";
import {
  PRINT_DOCUMENTS,
  isPrintDocumentKey,
  pdfFileName,
} from "@/lib/print-documents";

// Chromium is not available in the edge runtime, and every render hits the DB.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/print/purchase-order/<id>/pdf` — renders the matching `/print/*`
 * page to PDF. `?download=1` forces a save dialog instead of inline preview.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ doc: string; id: string }> },
) {
  const { doc, id } = await params;

  if (!isPrintDocumentKey(doc)) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 404 });
  }

  const printPath = `/print/${doc}`;
  // A PDF is an export of the print page, so it is gated by the very same
  // module and the same `x` (export) action that `canAccess` applies there.
  const moduleCode = resolveExportModule(printPath);
  if (!moduleCode) {
    return NextResponse.json(
      { error: "Document type is not registered for export" },
      { status: 404 },
    );
  }

  const { error } = await requirePermission(moduleCode, "x");
  if (error) return error;

  const { pdf } = PRINT_DOCUMENTS[doc];

  // Replay the caller's cookies so Chromium hits `/print/*` as the same user;
  // the print page then applies its own record-level checks.
  const cookies: PdfCookie[] = req.cookies
    .getAll()
    .map(({ name, value }) => ({ name, value }));

  const url = `${originFromRequest(req)}${printPath}/${encodeURIComponent(id)}`;

  let body: Buffer;
  try {
    body = await renderPdf({ url, cookies, pdf });
  } catch (err) {
    console.error(`[pdf] failed to render ${url}`, err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }

  const fileName = await pdfFileName(doc, id);
  const disposition = req.nextUrl.searchParams.get("download")
    ? "attachment"
    : "inline";

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      // Documents are void-only and revisable, so a stale cached PDF would be
      // actively misleading.
      "Cache-Control": "no-store",
    },
  });
}
