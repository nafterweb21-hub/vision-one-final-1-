import "./print.css";

/**
 * Wraps every printout so the shared A4 / Calibri / dynamic-blue baseline in
 * `print.css` applies without each page having to restate it. Pages keep their
 * own inline `<style>` for layout; this only supplies defaults they inherit.
 */
export default function PrintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="print-root">{children}</div>;
}
