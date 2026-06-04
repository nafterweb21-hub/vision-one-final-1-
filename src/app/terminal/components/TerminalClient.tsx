"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { toast as hotToast } from "react-hot-toast";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Plus, ChevronRight, CheckCircle2, Info, AlertCircle, Minus, ChevronDown, Check, Zap, Clock, Box, LogOut, Keyboard } from "lucide-react";
import ProductionIntake from "./ProductionIntake";
import {
  lookupWorkOrder,
  getOpenScans,
  scanOut,
  type ScanOutPayload,
} from "../actions";

type Support = {
  employees: { id: string; name: string; code: string }[];
  weldingMachines: any[];
  machiningMachines: any[];
  materialTypes: any[];
  weldingTypes: any[];
  joints: any[];
  elcometers: any[];
};

export default function TerminalClient({ support, loggedInEmployee, initialSessions = [], initialRecentCompletes = [] }: { support: Support, loggedInEmployee?: any | null, initialSessions?: any[], initialRecentCompletes?: any[] }) {
  const router = useRouter();
  const [isScanInOpen, setIsScanInOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>(initialSessions);
  const [recentCompletes, setRecentCompletes] = useState<any[]>(initialRecentCompletes);
  
  const displayEmployee = loggedInEmployee || null;
  
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If the back button is pressed and the modal is open, close it
      if (isScanInOpen) {
        setIsScanInOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isScanInOpen]);

  const openScanInModal = () => {
    // Push a dummy state to history so the back button just pops this state instead of navigating away
    window.history.pushState({ modal: "scan-in" }, "");
    setIsScanInOpen(true);
  };

  const closeScanInModal = () => {
    if (window.history.state?.modal === "scan-in") {
      window.history.back(); // This triggers popstate, which closes the modal
    } else {
      setIsScanInOpen(false);
    }
  };

  useEffect(() => {
    setActiveSessions(initialSessions);
    setRecentCompletes(initialRecentCompletes);
  }, [initialSessions, initialRecentCompletes]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  function handleIntakeScanOutRequest(routingProcessProfileId: string, employeeId: string, inProcessId: string, mainProcessId: string) {
    const matchingSession = activeSessions.find((s) =>
      s.routingProcess?.inProcessId === inProcessId &&
      s.routingProcess?.mainProcessId === mainProcessId &&
      s.routingProcess?.routingProcessId === routingProcessProfileId &&
      s.employeeId === employeeId
    );

    if (matchingSession) {
      closeScanInModal();
      handleSelectSession(matchingSession);
    } else {
      hotToast.error("No active session found for this combination.");
    }
  }

  const [producedCount, setProducedCount] = useState<number | "">(0);
  const [defectCount, setDefectCount] = useState<number | "">(0);
  const [defectReason, setDefectReason] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isManualProduced, setIsManualProduced] = useState(false);
  const [isManualDefect, setIsManualDefect] = useState(false);
  const producedInputRef = useRef<HTMLInputElement>(null);
  const defectInputRef = useRef<HTMLInputElement>(null);

  // loggedInEmployee is now provided directly by the server page

  const selectedSession = useMemo(
    () => activeSessions.find((s) => s.id === selectedSessionId),
    [activeSessions, selectedSessionId]
  );

  const targetQty = selectedSession ? Number(selectedSession.routingProcess?.inProcess?.workOrder?.quantity || 0) : 0;
  const previouslyCompleted = selectedSession 
    ? (selectedSession.routingProcess?.productionTimesheets?.reduce((acc: number, ts: any) => acc + (Number(ts.completedQty) || 0), 0) || 0)
    : 0;
  const remainingQty = Math.max(0, targetQty - previouslyCompleted - (Number(producedCount) || 0));

  function handleScanInSuccess() {
    router.refresh();
  }

  function handleSelectSession(session: any) {
    setSelectedSessionId(session.id);
    setProducedCount(0);
    setDefectCount(0);
    setDefectReason("");
    setSessionNote("");
  }

  function handleCompleteSession() {
    if (!selectedSession) return;
    
    const pCount = Number(producedCount) || 0;
    const dCount = Number(defectCount) || 0;
    
    if (pCount <= 0 && dCount <= 0) return; // Prevent empty completion

    const payload: ScanOutPayload = {
      timesheetId: selectedSession.id,
      completedQty: pCount, // Assuming producedCount is the valid completedQty for now
      rejectedQty: dCount > 0 ? dCount : undefined,
      rejectReason: defectReason || undefined,
    };

    startTransition(async () => {
      const res = await scanOut(payload);
      if (res.success) {
        // Move to recent completes
        setRecentCompletes((prev) => [selectedSession, ...prev]);
        setActiveSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
        setSelectedSessionId("");
        setProducedCount(0);
      } else {
        hotToast.error("Failed to complete session: " + res.error);
      }
    });
  }

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] rounded-3xl p-6 font-sans text-slate-900 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
      
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 shadow-sm rounded-3xl p-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <Monitor className="text-cyan-600" size={28} />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Operator Node</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
              {displayEmployee ? displayEmployee.name : "Unassigned"}
            </div>
            <div className="text-xs text-cyan-600 font-mono tracking-wider">
              {displayEmployee ? displayEmployee.code : "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 flex flex-col items-center justify-center">
            <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mb-1">Active Jobs</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900 leading-none">{activeSessions.length}</span>
              <span className="text-[9px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Running</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 flex flex-col items-center justify-center">
            <div className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mb-1">Total Produced</div>
            <div className="text-2xl font-bold text-emerald-600 leading-none">
              {recentCompletes.length}
            </div>
          </div>
          <button 
            onClick={openScanInModal}
            className="font-bold rounded-2xl px-6 py-3 flex items-center gap-2 transition-colors h-full shadow-lg bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/20"
          >
            <Plus size={20} strokeWidth={3} />
            Scan In
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
          
          <section>
            <div className="flex items-center gap-2 mb-4 text-cyan-600">
              <Zap size={16} fill="currentColor" />
              <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Active Sessions</h3>
            </div>
            
            <div className="space-y-4 relative">
              {/* Optional cyan border effect for the selected item container visually linking them */}
              
              {activeSessions.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 shadow-sm rounded-3xl p-6 text-center text-slate-500 text-sm">
                  No active sessions.
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`bg-white border-2 rounded-3xl p-5 cursor-pointer transition-all ${selectedSessionId === session.id ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-50 p-2.5 rounded-xl text-cyan-500">
                          <Box size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{session.routingProcess?.inProcess?.workOrderNo || "Unknown WO"}</div>
                          <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                            {session.routingProcess?.routingProcess?.routingProcess || "Unknown Process"}
                          </div>
                        </div>
                      </div>
                      {selectedSessionId === session.id && <ChevronRight size={18} className="text-cyan-500" />}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Done</div>
                        <div className="font-bold text-sm text-slate-900">{session.id === selectedSessionId ? producedCount : 0}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Defects</div>
                        <div className="font-bold text-sm text-slate-900">{session.id === selectedSessionId ? defectCount : 0}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Clock size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase">Recent Completes</h3>
            </div>
            
            <div className="space-y-3">
              {recentCompletes.length === 0 ? (
                <div className="text-slate-400 text-xs italic ml-6">None recently</div>
              ) : (
                recentCompletes.map((rc, idx) => (
                  <div key={rc.id || idx} className="bg-white border-2 border-slate-100 shadow-sm rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-1.5 rounded-full text-emerald-500 border border-emerald-100">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{rc.routingProcess?.inProcess?.workOrderNo}</div>
                        <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">{rc.routingProcess?.routingProcess?.routingProcess}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-500">+1</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {rc.timeIn ? new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "--:--"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

        {/* MAIN AREA */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 min-h-[600px] flex flex-col relative overflow-hidden">
            
            {/* Background decorative element */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>

            {!selectedSession ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Monitor size={48} className="mb-4 opacity-20" />
                <p>Select an active session to view details</p>
              </div>
            ) : (
              <>
                {/* Session Header */}
                <div className="flex items-start justify-between mb-10 relative z-10">
                  <div>
                    <div className="inline-block bg-cyan-50 text-cyan-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                      Active Session
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">
                      {selectedSession.routingProcess?.routingProcess?.routingProcess || "Unknown Process"}
                    </h2>
                    <div className="text-slate-400 font-bold tracking-widest text-sm uppercase">
                      {selectedSession.routingProcess?.inProcess?.workOrderNo}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[100px]">
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">Station</div>
                      <div className="text-cyan-500 font-bold uppercase tracking-wider text-sm">DEFAULT</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[100px]">
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">Started</div>
                      <div className="text-slate-900 font-bold tracking-wider text-sm">
                        {selectedSession.timeIn ? new Date(selectedSession.timeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : "--:--"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Counters Area */}
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 mb-8 relative z-10">
                  
                  {/* TOTAL PRODUCED */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-inner relative group">
                    <div className="absolute top-6 right-6 transition-opacity">
                      <button
                        onClick={() => {
                          setIsManualProduced(true);
                          setTimeout(() => producedInputRef.current?.focus(), 10);
                        }}
                        className={`p-2 rounded-xl transition-colors ${isManualProduced ? 'bg-cyan-100 text-cyan-600' : 'bg-white text-slate-400 hover:text-cyan-500 shadow-sm border border-slate-200'}`}
                        title="Manual Typing"
                      >
                        <Keyboard size={20} />
                      </button>
                    </div>
                    <div className="text-[10px] font-bold text-cyan-600 tracking-widest uppercase mb-8">Total Produced</div>
                    <div className="flex items-center justify-center gap-8 w-full">
                      <button 
                        onClick={() => setProducedCount(Math.max(0, (Number(producedCount) || 0) - 1))}
                        className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
                      >
                        <Minus size={24} className="text-slate-500" />
                      </button>
                      <input 
                        ref={producedInputRef}
                        readOnly={!isManualProduced}
                        onBlur={() => setIsManualProduced(false)}
                        type="number"
                        min="0"
                        value={producedCount}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setProducedCount("");
                          } else {
                            const val = parseInt(e.target.value, 10);
                            setProducedCount(isNaN(val) ? "" : Math.max(0, val));
                          }
                        }}
                        className={`text-[2rem] leading-none font-bold tracking-tighter w-48 text-center outline-none focus:ring-0 p-2 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${isManualProduced ? 'text-cyan-600 bg-white border-2 border-cyan-500 rounded-2xl shadow-[0_0_0_4px_rgba(6,182,212,0.15)]' : 'text-slate-900 cursor-default border-2 border-transparent bg-transparent'}`}
                      />
                      <button 
                        onClick={() => setProducedCount((Number(producedCount) || 0) + 1)}
                        className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30 text-white"
                      >
                        <Plus size={24} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* QUALITY FAILURES */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-[2rem] p-8 flex flex-col shadow-inner relative group">
                    <div className="absolute top-6 right-6 transition-opacity">
                      <button
                        onClick={() => {
                          setIsManualDefect(true);
                          setTimeout(() => defectInputRef.current?.focus(), 10);
                        }}
                        className={`p-2 rounded-xl transition-colors ${isManualDefect ? 'bg-rose-100 text-rose-600' : 'bg-white text-rose-400 hover:text-rose-500 shadow-sm border border-rose-200'}`}
                        title="Manual Typing"
                      >
                        <Keyboard size={20} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-8">
                      <AlertCircle size={16} className="text-rose-500" />
                      <div className="text-[10px] font-bold text-rose-500 tracking-widest uppercase">Quality Failures</div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-8">
                      <button 
                        onClick={() => setDefectCount(Math.max(0, (Number(defectCount) || 0) - 1))}
                        className="w-14 h-14 rounded-2xl bg-white border border-rose-200 flex items-center justify-center hover:bg-rose-50 transition-colors shrink-0"
                      >
                        <Minus size={20} className="text-rose-400" />
                      </button>
                      <input
                        ref={defectInputRef}
                        readOnly={!isManualDefect}
                        onBlur={() => setIsManualDefect(false)}
                        type="number"
                        min="0"
                        value={defectCount}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setDefectCount("");
                          } else {
                            const val = parseInt(e.target.value, 10);
                            setDefectCount(isNaN(val) ? "" : Math.max(0, val));
                          }
                        }}
                        className={`text-[2rem] font-bold tracking-tighter w-24 text-center outline-none focus:ring-0 p-2 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${isManualDefect ? 'text-rose-500 bg-white border-2 border-rose-400 rounded-2xl shadow-[0_0_0_4px_rgba(244,63,94,0.15)]' : 'text-slate-900 cursor-default border-2 border-transparent bg-transparent'}`}
                      />
                      <button 
                        onClick={() => setDefectCount((Number(defectCount) || 0) + 1)}
                        className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center hover:bg-rose-400 transition-colors text-white shadow-md shadow-rose-500/20"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    <div className="relative mt-auto">
                      <SearchableSelect 
                        value={defectReason}
                        onChange={(e) => setDefectReason(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 shadow-sm cursor-pointer"
                      >
                        <option value="">Reason for defect...</option>
                        <option value="scratch">Surface Scratch</option>
                        <option value="dent">Dent / Damage</option>
                        <option value="dimension">Out of Tolerance</option>
                      </SearchableSelect>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Bottom Stats & Action */}
                <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] gap-6 mt-auto relative z-10">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 min-w-[140px] flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-400 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Target</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 tracking-tight">
                      {targetQty}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 min-w-[140px] flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Remaining</div>
                    </div>
                    <div className="text-3xl font-bold text-amber-500 tracking-tight">
                      {remainingQty}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={14} className="text-cyan-500" />
                      <div className="text-[9px] font-bold text-slate-900 tracking-widest uppercase">Session Notes</div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input 
                        type="text"
                        placeholder="Add log entry..."
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      />
                      <button 
                        className="bg-cyan-500 text-white p-3 rounded-xl hover:bg-cyan-400 transition-colors"
                        onClick={() => {
                          if (sessionNote.trim()) {
                            hotToast.error("Log entry noted! (Saving will be implemented soon)");
                            setSessionNote("");
                          }
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end relative z-10 border-t border-slate-100 pt-8">
                  <button 
                    onClick={handleCompleteSession}
                    disabled={isPending || ((Number(producedCount) || 0) === 0 && (Number(defectCount) || 0) === 0)}
                    className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors shadow-sm"
                  >
                    <LogOut size={18} className="text-slate-500" />
                    SCAN OUT JOB
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
      
      {/* Scan In Full Page Overlay */}
      <ProductionIntake 
        isOpen={isScanInOpen} 
        onClose={closeScanInModal} 
        support={support} 
        onSuccess={handleScanInSuccess}
        loggedInEmployeeId={loggedInEmployee?.id}
        onScanOutRequest={handleIntakeScanOutRequest}
      />
    </div>
  );
}
