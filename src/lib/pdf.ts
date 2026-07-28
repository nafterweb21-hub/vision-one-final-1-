import "server-only";
import puppeteer, { type Browser, type PDFOptions } from "puppeteer";

/**
 * Server-side PDF rendering for the `/print/*` views.
 *
 * The print pages already carry their own `@page` rules and layout, so instead
 * of maintaining a second set of PDF templates we drive a headless Chromium
 * over the very same routes. That keeps the on-screen preview and the archived
 * PDF byte-identical by construction.
 */

// Chromium takes ~300ms to boot, which is unacceptable per-request. Reuse one
// browser across requests, and survive hot-reload in dev the same way the
// Prisma singleton does.
const globalForPdf = globalThis as unknown as {
  __pdfBrowser?: Promise<Browser> | undefined;
};

async function launch(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    // `--no-sandbox` is required in most container images; harmless locally.
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });
  // If Chromium dies (OOM, host restart) drop the cached promise so the next
  // request relaunches instead of reusing a dead handle forever.
  browser.on("disconnected", () => {
    globalForPdf.__pdfBrowser = undefined;
  });
  return browser;
}

async function getBrowser(): Promise<Browser> {
  if (!globalForPdf.__pdfBrowser) {
    globalForPdf.__pdfBrowser = launch().catch((err) => {
      globalForPdf.__pdfBrowser = undefined;
      throw err;
    });
  }
  return globalForPdf.__pdfBrowser;
}

export type PdfCookie = { name: string; value: string };

export type RenderPdfOptions = {
  /** Absolute URL of the print page, e.g. `http://localhost:3000/print/purchase-order/abc`. */
  url: string;
  /** Session cookies to replay — `/print/*` is behind auth. */
  cookies?: PdfCookie[];
  /** Defaults to A4; the delivery label overrides with an explicit width/height. */
  pdf?: PDFOptions;
  /** Milliseconds to wait for the page to settle. */
  timeoutMs?: number;
};

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: "a4",
  // The print pages set their own page padding in millimetres, so Chromium must
  // not add a second margin on top of it.
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  printBackground: true,
  preferCSSPageSize: true,
};

export async function renderPdf({
  url,
  cookies = [],
  pdf,
  timeoutMs = 30_000,
}: RenderPdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  // A fresh incognito context per render keeps one user's session cookies from
  // leaking into a concurrent render for a different user.
  const context = await browser.createBrowserContext();

  try {
    const { hostname } = new URL(url);
    if (cookies.length > 0) {
      await context.setCookie(
        ...cookies.map((c) => ({ ...c, domain: hostname, path: "/" })),
      );
    }

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);

    const response = await page.goto(url, { waitUntil: "networkidle0" });
    if (!response || !response.ok()) {
      throw new Error(
        `Print page returned ${response?.status() ?? "no response"} for ${url}`,
      );
    }

    // `@media print` is what the layouts are tuned for — without this the PDF
    // would capture the on-screen variant, including the print button.
    await page.emulateMediaType("print");
    await page.evaluateHandle("document.fonts.ready");

    const bytes = await page.pdf({ ...DEFAULT_PDF_OPTIONS, ...pdf });
    return Buffer.from(bytes);
  } finally {
    await context.close().catch(() => {});
  }
}

/**
 * Rebuilds the public origin of the running app from an inbound request, so a
 * route handler can point Chromium back at itself without hard-coding a host.
 */
export function originFromRequest(req: Request): string {
  const configured = process.env.APP_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const headers = req.headers;
  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  return new URL(req.url).origin;
}
