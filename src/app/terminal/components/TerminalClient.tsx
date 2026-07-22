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
  togglePauseSession,
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
  
  const displayEmployee = loggedInEmployee && loggedInEmployee.code !== "UNLINKED_USER" ? loggedInEmployee : null;
  const [localEmployee, setLocalEmployee] = useState<any>(null);
  
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTogglePause = async () => {
    if (!selectedSession) return;
    startTransition(async () => {
      const res = await togglePauseSession(selectedSession.id);
      if (res.success) {
        hotToast.success(selectedSession.isPaused ? "Session Resumed" : "Session Paused");
        router.refresh();
      } else {
        hotToast.error("Failed to pause/resume: " + res.error);
      }
    });
  };

  const activeEmployee = localEmployee || displayEmployee;
  
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const match = support.employees.find((emp) => emp.code.toLowerCase() === loginCode.toLowerCase());
    if (match) {
      setLocalEmployee(match);
      setLoginError("");
      setLoginCode("");
    } else {
      setLoginError("Invalid Employee ID.");
    }
  };

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
    if (activeEmployee) {
      setActiveSessions(initialSessions.filter((s: any) => s.employeeId === activeEmployee.id));
      setRecentCompletes(initialRecentCompletes);
    }
  }, [initialSessions, initialRecentCompletes, activeEmployee]);
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
  const [weldingForm, setWeldingForm] = useState<any>({});
  const [sprayForm, setSprayForm] = useState<any>({});
  const [machiningForm, setMachiningForm] = useState<any>({});
  const [machineCodes, setMachineCodes] = useState<string>("");
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
    closeScanInModal();
    router.refresh();
  }

  function handleSelectSession(session: any) {
    setSelectedSessionId(session.id);
    setProducedCount(0);
    setDefectCount(0);
    setDefectReason("");
    setSessionNote("");
    setWeldingForm({});
    setSprayForm({});
    setMachiningForm({});
    setMachineCodes("");
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
      machineCodes: machineCodes || undefined,
    };

    const flags = selectedSession.routingProcess?.routingProcess;
    
    if (flags?.machining && !machiningForm.machineSerialNoId) {
      hotToast.error("Please select a Machine in the Machining form.");
      return;
    }

    if (flags?.welding) payload.welding = weldingForm;
    if (flags?.sprayPainting) payload.spray = sprayForm;
    if (flags?.machining) payload.machining = machiningForm;

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

  // If no active employee, show Login Screen
  if (!activeEmployee) {
    return (
      <div className="bg-white min-h-[calc(100vh-80px)] rounded-3xl p-10 font-sans flex flex-col items-center justify-center text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
        <div className="w-[400px] border border-slate-200 rounded-2xl p-8 bg-slate-50 shadow-sm">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-slate-900 rounded-xl p-4 mb-4 shadow-md">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operator Login</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Scan or enter your Employee ID</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="text"
                autoFocus
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="w-full border-2 border-slate-200 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-center text-lg font-mono font-medium tracking-wider"
                placeholder="EMP-XXXX"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] rounded-3xl p-6 font-sans text-slate-900 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
      
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 shadow-sm rounded-3xl p-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <Monitor className="text-cyan-600" size={28} />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">Operator</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                {activeEmployee.name}
              </div>
            </div>
            {!displayEmployee && (
              <button 
                onClick={() => setLocalEmployee(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
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
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[100px]">
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">Duration</div>
                      <div className={`text-sm font-bold tracking-wider ${selectedSession.isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {(() => {
                          if (!selectedSession.timeIn) return "--:--";
                          let elapsedMs = now.getTime() - new Date(selectedSession.timeIn).getTime();
                          const idleMs = (Number(selectedSession.totalIdleMinutes) || 0) * 60000;
                          elapsedMs -= idleMs;
                          if (selectedSession.isPaused && selectedSession.lastPauseTime) {
                            elapsedMs -= (now.getTime() - new Date(selectedSession.lastPauseTime).getTime());
                          }
                          const totalMins = Math.max(0, Math.floor(elapsedMs / 60000));
                          const hrs = Math.floor(totalMins / 60);
                          const mins = totalMins % 60;
                          return `${hrs}h ${mins}m`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex gap-4 mb-8 relative z-10">
                  <button
                    onClick={handleTogglePause}
                    disabled={isPending}
                    className={`px-6 py-3 rounded-xl font-bold transition-colors shadow-sm text-sm border flex items-center gap-2 ${selectedSession.isPaused ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                  >
                    {selectedSession.isPaused ? "▶ Resume Job" : "⏸ Pause Job"}
                  </button>
                  {selectedSession.isPaused && (
                    <div className="flex items-center text-amber-600 text-sm font-medium">
                      Job is currently paused. Resume to track time.
                    </div>
                  )}
                </div>

                {/* Process Information Display */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 relative z-10">
                  <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                    <Info size={14} className="text-cyan-600" /> Process Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Drawing Number</div>
                      <div className="font-semibold text-slate-900">DWG-{selectedSession.routingProcess?.inProcess?.workOrderNo?.split('-').pop() || '0000'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">Machine No.</div>
                      <div className="font-semibold text-slate-900">{selectedSession.machineCodes || 'N/A'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 font-medium mb-1">Work Instructions</div>
                      <div className="font-medium text-slate-700 text-xs leading-relaxed">Follow standard operating procedure. Ensure calibration before start.</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 font-medium mb-1">Safety Instructions</div>
                      <div className="font-medium text-amber-700 bg-amber-50 rounded text-xs leading-relaxed p-2 border border-amber-100 mt-1">
                        Wear PPE (Safety Glasses, Gloves). Beware of pinch points.
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 font-medium mb-1">Quality Requirements</div>
                      <div className="font-medium text-slate-700 text-xs leading-relaxed mt-1">
                        Tolerance ±0.05mm. Verify first piece with QA.
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

                {/* Process Parameters Area */}
                {selectedSession.routingProcess?.routingProcess?.welding && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 relative z-10 shadow-inner">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={16} className="text-cyan-500" />
                      Welding Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <SearchableSelect 
                        value={weldingForm.weldingMachineId || ""} 
                        onChange={(e) => setWeldingForm({...weldingForm, weldingMachineId: e.target.value})} 
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      >
                        <option value="">Select Machine...</option>
                        {support.weldingMachines.map((m) => <option key={m.id} value={m.id}>{m.machineCode} - {m.model}</option>)}
                      </SearchableSelect>
                      <input type="number" placeholder="Voltage (V)" value={weldingForm.voltageVolts || ""} onChange={(e) => setWeldingForm({...weldingForm, voltageVolts: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20" />
                      <input type="number" placeholder="Current (A)" value={weldingForm.currentAmp || ""} onChange={(e) => setWeldingForm({...weldingForm, currentAmp: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20" />
                      <input type="text" placeholder="Electrode Type" value={weldingForm.electrodeType || ""} onChange={(e) => setWeldingForm({...weldingForm, electrodeType: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20" />
                      <input type="text" placeholder="Welding Position" value={weldingForm.weldingPosition || ""} onChange={(e) => setWeldingForm({...weldingForm, weldingPosition: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20" />
                      <input type="text" placeholder="Remarks" value={weldingForm.remark || ""} onChange={(e) => setWeldingForm({...weldingForm, remark: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20" />
                    </div>
                  </div>
                )}

                {selectedSession.routingProcess?.routingProcess?.sprayPainting && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 relative z-10 shadow-inner">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={16} className="text-emerald-500" />
                      Spray Painting Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input type="text" placeholder="Type of Paint" value={sprayForm.typeOfPaint || ""} onChange={(e) => setSprayForm({...sprayForm, typeOfPaint: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" />
                      <input type="number" placeholder="Paint Tank Pressure (Psi)" value={sprayForm.paintTankPressurePsi || ""} onChange={(e) => setSprayForm({...sprayForm, paintTankPressurePsi: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" />
                      <input type="number" placeholder="Spray Nozzle Size" value={sprayForm.sprayNozzleSize || ""} onChange={(e) => setSprayForm({...sprayForm, sprayNozzleSize: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" />
                      <input type="text" placeholder="Remarks" value={sprayForm.remark || ""} onChange={(e) => setSprayForm({...sprayForm, remark: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
                )}

                {selectedSession.routingProcess?.routingProcess?.machining && (
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 relative z-10 shadow-inner">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Monitor size={16} className="text-indigo-500" />
                      Machining Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <SearchableSelect 
                        value={machiningForm.machineSerialNoId || ""} 
                        onChange={(e) => setMachiningForm({...machiningForm, machineSerialNoId: e.target.value})} 
                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">Select Machine...</option>
                        {support.machiningMachines.map((m) => <option key={m.id} value={m.id}>{m.machineCode} - {m.model}</option>)}
                      </SearchableSelect>
                      <input type="text" placeholder="CNC Program No" value={machiningForm.cncProgramNo || ""} onChange={(e) => setMachiningForm({...machiningForm, cncProgramNo: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                      <input type="text" placeholder="Special Tooling" value={machiningForm.specialTooling || ""} onChange={(e) => setMachiningForm({...machiningForm, specialTooling: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                      <input type="number" placeholder="Part Runtime (Hrs)" value={machiningForm.partRuntimeHr || ""} onChange={(e) => setMachiningForm({...machiningForm, partRuntimeHr: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                      <input type="number" placeholder="Part Runtime (Mins)" value={machiningForm.partRuntimeMins || ""} onChange={(e) => setMachiningForm({...machiningForm, partRuntimeMins: e.target.value ? Number(e.target.value) : undefined})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                      <input type="text" placeholder="Remarks" value={machiningForm.remark || ""} onChange={(e) => setMachiningForm({...machiningForm, remark: e.target.value})} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                )}

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
