"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export default function GlobalHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 sm:px-6 bg-[#0B0F19] shadow-md border-b border-[#1A2235]">
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* System Overview Pill */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#1A2235] border border-[#2A344A] rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
          <span className="text-[11px] font-semibold text-indigo-100 tracking-wider">SYSTEM OVERVIEW</span>
        </div>
      </div>

      {/* Active Company Pill */}
      <div className="flex items-center hidden sm:flex">
        <div className="px-4 py-1.5 bg-[#1A2235] border border-[#2A344A] rounded-full">
          <span className="text-[11px] font-semibold text-slate-300 tracking-wider">ACTIVE COMPANY</span>
        </div>
      </div>
    </header>
  );
}
