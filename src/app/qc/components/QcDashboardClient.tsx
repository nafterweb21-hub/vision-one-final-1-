"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ClipboardCheck, ArrowLeft, RefreshCw, FileText, CheckCircle, AlertCircle, X, Loader2, Calendar, User, Briefcase, Activity, LogOut } from "lucide-react";
import { submitWorkOrderQc, submitProcessQc } from "../actions";

export default function QcDashboardClient({ initialAwaiting, initialWorkOrders }: { initialAwaiting: any[], initialWorkOrders: any[] }) {
  const router = useRouter();
  const [awaiting, setAwaiting] = useState<any[]>(initialAwaiting);
  const [workOrders, setWorkOrders] = useState<any[]>(initialWorkOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"WORK_ORDER" | "PROCESS" | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);

  // Form State
  const [passedQty, setPassedQty] = useState(0);
  const [defectsFound, setDefectsFound] = useState(0);
  const [qcStatus, setQcStatus] = useState("Approved");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    setAwaiting(initialAwaiting);
    setWorkOrders(initialWorkOrders);
  }, [initialAwaiting, initialWorkOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredWorkOrders = workOrders.filter(wo => 
    wo.workOrderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.customer?.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.jobDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openWorkOrderInspection = (wo: any) => {
    setDrawerData(wo);
    setDrawerType("WORK_ORDER");
    setPassedQty(wo.quantity ? Number(wo.quantity) : 0);
    setDefectsFound(0);
    setQcStatus("Approved");
    setRemarks("");
    setDrawerOpen(true);
  };

  const openProcessInspection = (ts: any) => {
    setDrawerData(ts);
    setDrawerType("PROCESS");
    setPassedQty(ts.completedQty ? Number(ts.completedQty) : 0);
    setDefectsFound(0);
    setQcStatus("Approved");
    setRemarks("");
    setDrawerOpen(true);
  };

  const handleSubmitWorkOrder = () => {
    if (!drawerData) return;
    startTransition(async () => {
      const fullRemark = `[Passed: ${passedQty} | Defects: ${defectsFound}] ${remarks}`;
      await submitWorkOrderQc(drawerData.workOrderNo, qcStatus, fullRemark);
      setDrawerOpen(false);
      handleRefresh();
    });
  };

  const handleSubmitProcess = () => {
    if (!drawerData) return;
    startTransition(async () => {
      const fullRemark = `[Passed: ${passedQty} | Defects: ${defectsFound}] ${remarks}`;
      await submitProcessQc(drawerData.id, qcStatus, fullRemark);
      setDrawerOpen(false);
      handleRefresh();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 text-slate-800 font-sans p-6 md:p-8 relative overflow-hidden">
      
      {/* Background Glows (Glossy feel) */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/80 to-transparent pointer-events-none blur-3xl"></div>
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-blue-200/50 relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-2.5 bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-xl hover:bg-white transition-colors">
            <ArrowLeft size={20} className="text-blue-900" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-blue-950 flex items-center gap-3 drop-shadow-sm">
              <div className="bg-gradient-to-b from-blue-500 to-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20 border border-blue-400">
                <ClipboardCheck className="text-white" size={24} />
              </div>
              QC WORKFLOW DASHBOARD
            </h1>
            <div className="text-xs font-bold text-blue-500/80 uppercase tracking-widest mt-1.5 ml-2">
              Inspector View • Real-time
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-xl text-sm font-bold text-blue-900 hover:bg-white transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            REFRESH
          </button>
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-white shadow-sm rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={16} />
            LOGOUT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] lg:grid-cols-[1fr_350px] gap-6 relative z-10">
        
        {/* LEFT COLUMN: WORK ORDER INFORMATION */}
        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-blue-100/50 bg-white/50 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-blue-950 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              Work Order Information
            </h2>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                {workOrders.length} ORDERS
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                <input 
                  type="text" 
                  placeholder="Search Work Orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-sm bg-white/80 border border-blue-100 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-64 font-medium text-blue-950 placeholder:text-blue-300 shadow-inner"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-blue-50/50 border-b border-blue-100/50 text-[10px] uppercase tracking-widest text-blue-700 font-bold">
                  <th className="px-4 py-3 pl-6 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Work Order</th>
                  <th className="px-4 py-3 whitespace-nowrap">Project / Job</th>
                  <th className="px-4 py-3 whitespace-nowrap">Team / Dept</th>
                  <th className="px-4 py-3 whitespace-nowrap">QC Status</th>
                  <th className="px-4 py-3 pr-6 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sm font-medium text-blue-400">
                      No active work orders found.
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((wo) => (
                    <tr key={wo.workOrderNo} className="border-b border-blue-50 hover:bg-white/80 transition-colors group">
                      
                      {/* DATE */}
                      <td suppressHydrationWarning className="px-4 py-4 pl-6 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {new Date(wo.date).toLocaleDateString('en-GB')}
                      </td>
                      
                      {/* WORK ORDER */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                            <FileText size={16} />
                          </div>
                          <div>
                            <div className="font-black text-blue-950 text-base tracking-wide">
                              {wo.workOrderNo}
                            </div>
                            <div className="text-[9px] uppercase font-bold tracking-widest text-blue-400 mt-0.5">
                              {Number(wo.quantity || 0)} UNITS
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* PROJECT / JOB */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-bold text-blue-900 text-sm">
                          {wo.jobDescription || "Standard Production"}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1 flex items-center gap-1">
                          <Briefcase size={10} className="text-blue-400" />
                          CLIENT: {wo.customer?.customerName || "N/A"}
                        </div>
                      </td>

                      {/* TEAM / DEPT */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <User size={14} className="text-blue-400" />
                          Operations
                        </div>
                      </td>

                      {/* QC STATUS */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-3 min-w-[130px]">
                          <div>
                            <div suppressHydrationWarning className="font-bold text-blue-950 text-sm">
                              {new Date(wo.date).toLocaleDateString('en-GB')}
                            </div>
                            <div suppressHydrationWarning className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">
                              DUE: {wo.deliveryDate ? new Date(wo.deliveryDate).toLocaleDateString('en-GB') : "TBD"}
                            </div>
                          </div>
                          <div>
                            {wo.status === 'Completed' || wo.qcAcceptance === 'Approved' ? (
                              <span className="px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                                APPROVED
                              </span>
                            ) : wo.status === 'Pending for QC' ? (
                              <span className="px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
                                PENDING
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full bg-slate-50 text-slate-500 border border-slate-200 shadow-sm">
                                IN-PROGRESS
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* ACTION */}
                      <td className="px-4 py-4 pr-6 text-right whitespace-nowrap">
                        {wo.status !== 'Completed' && wo.qcAcceptance !== 'Approved' && (
                          <button 
                            onClick={() => openWorkOrderInspection(wo)}
                            className="px-4 py-2 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border border-emerald-400 text-xs font-bold tracking-wider rounded-xl transition-all shadow-[0_4px_10px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_15px_rgba(16,185,129,0.4)]"
                          >
                            INSPECT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: AWAITING INSPECTION */}
        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/5 rounded-3xl flex flex-col min-h-[700px]">
          <div className="p-6 border-b border-blue-100/50 bg-white/50 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest uppercase text-blue-950 flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500" />
              Awaiting Inspection
            </h2>
            <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-600 shadow-sm text-xs font-bold rounded-full">
              {awaiting.length} Items
            </span>
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
            {awaiting.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-blue-400 p-8 text-center">
                <div className="p-4 bg-emerald-50 rounded-full mb-4 border border-emerald-100 shadow-inner">
                  <CheckCircle size={48} className="text-emerald-400" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-600">All Caught Up</p>
                <p className="text-xs font-medium mt-2 text-blue-400">No production sessions are awaiting inspection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {awaiting.map((ts) => {
                  const wo = ts.routingProcess?.inProcess?.workOrder;
                  const processName = ts.routingProcess?.routingProcess ? Object.keys(ts.routingProcess.routingProcess).find(k => ts.routingProcess.routingProcess[k] === true && k !== 'id' && k !== 'routingProcessId')?.toUpperCase() : "UNKNOWN";
                  
                  return (
                    <div key={ts.id} className="bg-white/80 border border-white rounded-2xl p-5 shadow-sm hover:shadow-lg shadow-blue-900/5 transition-all relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-400 to-rose-600 shadow-[2px_0_8px_rgba(225,29,72,0.3)]"></div>
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2">
                            <span suppressHydrationWarning className="text-slate-500">{new Date(ts.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> 
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
                            {ts.employee?.name || "Unknown"}
                          </div>
                          <div className="font-bold text-blue-950 text-base tracking-wide">
                            {wo?.workOrderNo || "Unknown WO"}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] uppercase font-bold tracking-widest rounded-lg border border-blue-100 shadow-inner">
                          {processName}
                        </span>
                      </div>
                      
                      <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</div>
                          <div className="text-sm font-bold text-blue-900">{Number(ts.completedQty)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</div>
                          <div className="text-sm font-bold text-blue-900 truncate max-w-[150px]">{wo?.customer?.customerName || "N/A"}</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => openProcessInspection(ts)}
                        className="w-full mt-5 py-3 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold tracking-widest rounded-xl border border-rose-200 transition-all shadow-sm hover:shadow-md"
                      >
                        START INSPECTION
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INSPECTION DRAWER (MODAL) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !isPending && setDrawerOpen(false)}
          ></div>
          
          {/* Modal Panel (Matches Screenshot 2 layout but White/Blue Theme) */}
          {drawerType === "WORK_ORDER" && drawerData ? (
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white shadow-2xl rounded-3xl flex flex-col animate-scale-up overflow-hidden m-4">
              <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-blue-50/50">
                <h3 className="text-xl font-black italic tracking-wide text-blue-950 uppercase flex items-center gap-2">
                  <Activity className="text-emerald-500" size={24} />
                  New QC Inspection
                </h3>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  disabled={isPending}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* WORK ORDER FIELD */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Work Order</label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-950 shadow-inner flex items-center justify-between">
                    <span>{drawerData.workOrderNo} - {drawerData.jobDescription || "Standard Production"}</span>
                  </div>
                </div>

                {/* QTY ROW */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Passed Qty</label>
                    <input 
                      type="number" 
                      value={passedQty}
                      onChange={(e) => setPassedQty(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-950 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Defects Found</label>
                    <input 
                      type="number" 
                      value={defectsFound}
                      onChange={(e) => setDefectsFound(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-950 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* STATUS */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Status</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Approved")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Approved' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Approved
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Rejected")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Rejected' ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Rejected
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Pending")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Pending' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Pending
                    </button>
                  </div>
                </div>

                {/* REMARKS */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Remarks</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Inspection notes..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* SUBMIT */}
                <button 
                  onClick={handleSubmitWorkOrder}
                  disabled={isPending}
                  className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 border border-emerald-400 text-white font-bold text-sm tracking-widest rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin text-white" /> : <ClipboardCheck size={18} />}
                  SUBMIT INSPECTION
                </button>
              </div>
            </div>
          ) : drawerType === "PROCESS" && drawerData ? (
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white shadow-2xl rounded-3xl flex flex-col animate-scale-up overflow-hidden m-4">
              <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-blue-50/50">
                <h3 className="text-xl font-black italic tracking-wide text-blue-950 uppercase flex items-center gap-2">
                  <Activity className="text-emerald-500" size={24} />
                  New Process QC
                </h3>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  disabled={isPending}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* WORK ORDER / PROCESS FIELD */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Process Completed</label>
                  <div className="w-full px-4 py-3 bg-slate-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-950 shadow-inner flex items-center justify-between">
                    <span>
                      {drawerData.routingProcess?.inProcess?.workOrder?.workOrderNo} - {Object.keys(drawerData.routingProcess?.routingProcess || {}).find(k => drawerData.routingProcess.routingProcess[k] === true && k !== 'id' && k !== 'routingProcessId')?.toUpperCase() || "UNKNOWN"}
                    </span>
                  </div>
                </div>

                {/* SPECIFIC PROCESS PARAMETERS */}
                {drawerData.weldingParameter && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={14} /> Welding Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-blue-950">
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Voltage</span><span className="font-semibold">{drawerData.weldingParameter.voltageVolts || "N/A"} V</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Current</span><span className="font-semibold">{drawerData.weldingParameter.currentAmp || "N/A"} A</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Pre-Heat</span><span className="font-semibold">{drawerData.weldingParameter.preHeatingC || "N/A"}°C</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Post-Heat</span><span className="font-semibold">{drawerData.weldingParameter.postHeatingC || "N/A"}°C</span></div>
                      {drawerData.weldingParameter.remark && (
                        <div className="col-span-2 mt-1 flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Operator Notes</span>
                          <span className="font-medium italic text-slate-600">"{drawerData.weldingParameter.remark}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {drawerData.sprayParameter && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={14} /> Spray Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-blue-950">
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Tank Pressure</span><span className="font-semibold">{drawerData.sprayParameter.paintTankPressurePsi || "N/A"} PSI</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Nozzle Size</span><span className="font-semibold">{drawerData.sprayParameter.sprayNozzleSize || "N/A"}</span></div>
                      <div className="col-span-2 flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Paint Type</span><span className="font-semibold">{drawerData.sprayParameter.typeOfPaint || "N/A"}</span></div>
                      {drawerData.sprayParameter.remark && (
                        <div className="col-span-2 mt-1 flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Operator Notes</span>
                          <span className="font-medium italic text-slate-600">"{drawerData.sprayParameter.remark}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {drawerData.machiningParameter && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Activity size={14} /> Machining Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-blue-950">
                      <div className="col-span-2 flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Machine ID</span><span className="font-semibold">{drawerData.machiningParameter.machineSerialNoId || "N/A"}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">CNC Program</span><span className="font-semibold">{drawerData.machiningParameter.cncProgramNo || "N/A"}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Run Time</span><span className="font-semibold">{drawerData.machiningParameter.partRuntimeHr || 0}h {drawerData.machiningParameter.partRuntimeMins || 0}m</span></div>
                      {drawerData.machiningParameter.remark && (
                        <div className="col-span-2 mt-1 flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Operator Notes</span>
                          <span className="font-medium italic text-slate-600">"{drawerData.machiningParameter.remark}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* QTY ROW (READ-ONLY FOR PROCESS) */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Passed Qty</label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-950 shadow-inner flex items-center justify-between">
                      <span>{passedQty}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Defects Found</label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-950 shadow-inner flex items-center justify-between">
                      <span>{defectsFound}</span>
                    </div>
                  </div>
                </div>

                {/* STATUS */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Status</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Approved")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Approved' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Approved
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Rejected")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Rejected' ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Rejected
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setQcStatus("Pending")} 
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${qcStatus === 'Pending' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      Pending
                    </button>
                  </div>
                </div>

                {/* REMARKS */}
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Remarks</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Inspection notes..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* SUBMIT */}
                <button 
                  onClick={handleSubmitProcess}
                  disabled={isPending}
                  className="w-full py-4 bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 border border-emerald-400 text-white font-bold text-sm tracking-widest rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin text-white" /> : <ClipboardCheck size={18} />}
                  SUBMIT INSPECTION
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <style jsx global>{`
        .animate-slide-left {
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
}
