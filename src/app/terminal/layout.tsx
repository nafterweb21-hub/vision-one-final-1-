import type { Metadata } from "next";
import LogoutButton from "./components/LogoutButton";

export const metadata: Metadata = {
  title: "Production Terminal — Vision One",
};

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-900">
      <header className="flex items-center justify-between bg-white/70 backdrop-blur-lg border-b border-white/50 shadow-sm px-6 py-3 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-blue-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">Production Terminal</h1>
          <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">Scan IN / OUT</p>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
