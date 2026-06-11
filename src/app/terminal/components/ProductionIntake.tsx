import { SearchableSelect } from "@/components/SearchableSelect";
import { toast as hotToast } from "react-hot-toast";
import { useState, useMemo, useTransition, useEffect } from "react";
import { ArrowLeft, Monitor, Camera, QrCode, Search, Calendar, Clock, Send, Package, ChevronDown, LogOut } from "lucide-react";
import CameraScanner from "./CameraScanner";
import { lookupWorkOrder, scanIn, scanOutQuick } from "../actions";
type Support = {
  employees: { id: string; name: string; code: string }[];
  activeWorkOrders?: { workOrderNo: string }[];
};

type ProductionIntakeProps = {
  isOpen: boolean;
  onClose: () => void;
  support: Support;
  onSuccess: () => void;
  loggedInEmployeeId?: string | null;
  onScanOutRequest?: (routingProcessProfileId: string, employeeId: string, inProcessId: string, mainProcessId: string) => void;
};

export default function ProductionIntake({ isOpen, onClose, support, onSuccess, loggedInEmployeeId, onScanOutRequest }: ProductionIntakeProps) {
  const [woNo, setWoNo] = useState("");
  const [wo, setWo] = useState<any>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [time, setTime] = useState(new Date());
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const [inForm, setInForm] = useState({
    inProcessId: "",
    mainProcessId: "",
    routingProcessProfileId: "",
    employeeId: loggedInEmployeeId || (support.employees[0]?.id ?? ""),
    machineCodes: "",
  });

  const inProcessOptions = wo?.inProcesses ?? [];
  const selectedInProcess = inProcessOptions.find((ip: any) => ip.id === inForm.inProcessId);
  
  const selectedEmployee = useMemo(() => {
    return support.employees.find(e => e.id === inForm.employeeId) || null;
  }, [support.employees, inForm.employeeId]);

  const mainProcessOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    selectedInProcess?.routingProcesses.forEach((rp: any) => {
      if (rp.mainProcess && !seen.has(rp.mainProcess.id)) {
        seen.set(rp.mainProcess.id, { id: rp.mainProcess.id, label: rp.mainProcess.process });
      }
    });
    return Array.from(seen.values());
  }, [selectedInProcess]);

  const routingProcessOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    selectedInProcess?.routingProcesses
      .filter((rp: any) => rp.mainProcessId === inForm.mainProcessId)
      .forEach((rp: any) => {
        if (rp.routingProcess && !seen.has(rp.routingProcess.id)) {
          seen.set(rp.routingProcess.id, {
            id: rp.routingProcess.id,
            label: rp.routingProcess.routingProcess,
          });
        }
      });
    return Array.from(seen.values());
  }, [selectedInProcess, inForm.mainProcessId]);

  function lookup(searchStr?: string) {
    setError("");
    const target = searchStr || woNo.trim();
    if (!target) return;
    
    startTransition(async () => {
      const res = await lookupWorkOrder(target);
      if (!res.ok) {
        setError(res.error);
        setWo(null);
        return;
      }
      setWo(res.wo);

      // Auto-select logic if there is only 1 option for each step
      let newInProcessId = "";
      let newMainProcessId = "";
      let newRoutingProcessId = "";

      const ipOptions = res.wo.inProcesses ?? [];
      if (ipOptions.length === 1) {
        newInProcessId = ipOptions[0].id;
        
        const seenMp = new Map<string, { id: string }>();
        ipOptions[0].routingProcesses.forEach((rp: any) => {
          if (rp.mainProcess && !seenMp.has(rp.mainProcess.id)) {
            seenMp.set(rp.mainProcess.id, { id: rp.mainProcess.id });
          }
        });
        const mpOptions = Array.from(seenMp.values());
        if (mpOptions.length === 1) {
          newMainProcessId = mpOptions[0].id;

          const seenRp = new Map<string, { id: string }>();
          ipOptions[0].routingProcesses
            .filter((rp: any) => rp.mainProcessId === newMainProcessId)
            .forEach((rp: any) => {
              if (rp.routingProcess && !seenRp.has(rp.routingProcess.id)) {
                seenRp.set(rp.routingProcess.id, { id: rp.routingProcess.id });
              }
            });
          const rpOptions = Array.from(seenRp.values());
          if (rpOptions.length === 1) {
            newRoutingProcessId = rpOptions[0].id;
          }
        }
      }

      setInForm(prev => ({
        ...prev,
        inProcessId: newInProcessId,
        mainProcessId: newMainProcessId,
        routingProcessProfileId: newRoutingProcessId
      }));
    });
  }

  function doScanIn() {
    setError("");
    if (!inForm.inProcessId || !inForm.mainProcessId || !inForm.routingProcessProfileId || !inForm.employeeId) {
      setError("Please complete all production selections.");
      return;
    }
    startTransition(async () => {
      const res = await scanIn({ workOrderNo: wo.workOrderNo, ...inForm });
      if (!res.success) {
        setError(res.error || "Scan IN failed");
        return;
      }
      // Reset form
      setWo(null);
      setWoNo("");
      setInForm({ inProcessId: "", mainProcessId: "", routingProcessProfileId: "", employeeId: loggedInEmployeeId || (support.employees[0]?.id ?? ""), machineCodes: "" });
      onSuccess();
    });
  }

  function doScanOut() {
    setError("");
    if (!inForm.inProcessId || !inForm.mainProcessId || !inForm.routingProcessProfileId || !inForm.employeeId) {
      setError("Please complete all production selections.");
      return;
    }
    if (onScanOutRequest) {
      onScanOutRequest(inForm.routingProcessProfileId, inForm.employeeId, inForm.inProcessId, inForm.mainProcessId);
    } else {
      setError("Scan out from intake is not configured.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden h-screen">
      
      {/* TOP HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900">PRODUCTION INTAKE</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Scan Node #012 • Active
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Monitor size={16} />
            LIVE DASHBOARD
          </button>
          
          <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
            <div>
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-0.5">System Time</div>
              <div className="text-sm font-mono font-bold text-cyan-600">
                {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: false})}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{selectedEmployee ? selectedEmployee.name : "Unknown"}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">{selectedEmployee ? selectedEmployee.code : "N/A"}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-200 uppercase">
                {selectedEmployee ? selectedEmployee.name.charAt(0) : "?"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0 overflow-y-auto items-start">
        
        {/* LEFT PANEL: WORK ORDER CAPTURE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <QrCode size={20} className="text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">Work Order Capture</h2>
            </div>
            <Camera size={32} className="text-slate-200" />
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center relative min-h-0 overflow-hidden mb-6">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-slate-400 z-10">
              i
            </div>
            
            {isCameraOpen ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <CameraScanner 
                  onScan={(decodedText) => {
                    setIsCameraOpen(false);
                    setWoNo(decodedText);
                    lookup(decodedText);
                  }}
                  onClose={() => setIsCameraOpen(false)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-16 h-16 border-2 border-slate-300 rounded-xl mb-6 relative">
                  <div className="absolute inset-2 border-2 border-slate-400 rounded-lg border-dashed"></div>
                  <div className="absolute bottom-[-10px] right-[-10px] bg-slate-50 p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path>
                      <path d="M2 20h20"></path>
                      <path d="M14 12v.01"></path>
                    </svg>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="text-lg font-bold text-slate-900 mb-2 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  Request Camera Permissions
                </button>
                
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        try {
                          const { Html5Qrcode } = await import("html5-qrcode");
                          const scanner = new Html5Qrcode("hidden-qr-reader");
                          const decodedText = await scanner.scanFile(file, false);
                          setWoNo(decodedText);
                          lookup(decodedText);
                        } catch (err) {
                          console.error("Error decoding file:", err);
                          hotToast.error("Could not find a valid QR/Barcode in this image.");
                        }
                        // Reset input so the same file can be selected again
                        e.target.value = "";
                      }
                    }}
                  />
                  <span className="text-sm font-bold text-slate-500 underline decoration-slate-300 hover:text-slate-700">
                    Scan an Image File
                  </span>
                </label>
              </div>
            )}
            
            {/* Hidden div required by html5-qrcode for file scanning */}
            <div id="hidden-qr-reader" className="hidden"></div>
          </div>

          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Manual ID Entry</div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                value={woNo}
                onChange={(e) => setWoNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                type="text" 
                placeholder="Type Work Order Number..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
              <button 
                onClick={() => lookup()}
                disabled={isPending || !woNo.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </div>
            {error && <div className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-lg">{error}</div>}
          </div>
        </div>

        {/* RIGHT PANEL: PRODUCTION SELECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <Package size={20} className="text-cyan-600" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">Production Selection</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                <Calendar size={12} /> Date
              </div>
              <div className="text-sm font-bold text-slate-900">
                {time.toLocaleDateString('en-GB')}
              </div>
            </div>
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                <Clock size={12} /> Capture
              </div>
              <div className="text-sm font-bold text-slate-900">
                {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3">Work Order Selection</div>
          
          <div className="mb-6">
            {wo ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{wo.workOrderNo}</div>
                    <div className="text-xs text-slate-500">{wo.customer?.customerName || "No Customer"}</div>
                    {wo.quantity != null && (
                      <div className="text-xs font-bold text-cyan-700 mt-1">
                        TOTAL QTY: {wo.quantity} {wo.uom || ''}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setWo(null); setWoNo(""); }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
                <div className="relative">
                  <input 
                    value={woNo}
                    onChange={(e) => setWoNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        lookup();
                      }
                    }}
                    type="text" 
                    placeholder="Enter or scan a Work Order to begin..." 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm"
                  />
                </div>
            )}
          </div>

          {wo && (
            <div className="grid grid-cols-2 gap-4 mb-6 flex-1 overflow-visible pr-2 content-start">
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="In-Process"
                  value={inForm.inProcessId}
                  onChange={(v) =>
                    setInForm({ inProcessId: v, mainProcessId: "", routingProcessProfileId: "", employeeId: inForm.employeeId, machineCodes: inForm.machineCodes })
                  }
                  options={inProcessOptions.map((ip: any) => ({ id: ip.id, label: `${ip.sn}. ${ip.description}` }))}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Main Process"
                  value={inForm.mainProcessId}
                  onChange={(v) => setInForm({ ...inForm, mainProcessId: v, routingProcessProfileId: "" })}
                  options={mainProcessOptions}
                  disabled={!inForm.inProcessId}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Select
                  label="Routing Process"
                  value={inForm.routingProcessProfileId}
                  onChange={(v) => setInForm({ ...inForm, routingProcessProfileId: v })}
                  options={routingProcessOptions}
                  disabled={!inForm.mainProcessId}
                  dropdownPosition="top"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                {/* Employee Pre-filled Option */}
                <Select
                  label="Employee"
                  value={inForm.employeeId}
                  onChange={(v) => setInForm({ ...inForm, employeeId: v })}
                  dropdownPosition="top"
                  options={support.employees.map((e) => ({
                    id: e.id,
                    label: `${e.name} (${e.code})`,
                  }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-1.5 block">Machine No.</label>
                <input
                  type="text"
                  value={inForm.machineCodes}
                  onChange={(e) => setInForm({ ...inForm, machineCodes: e.target.value })}
                  placeholder="Enter Machine Number (Optional)"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-slate-100 flex gap-4">

            <button 
              onClick={doScanIn}
              disabled={isPending || !wo || !inForm.employeeId || !inForm.routingProcessProfileId}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Send size={18} />
              {isPending ? "Starting..." : "SCAN IN"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  dropdownPosition = "bottom",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
  dropdownPosition?: "bottom" | "top";
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">{label}</label>
      <SearchableSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        dropdownPosition={dropdownPosition}
        className="mt-1.5 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none disabled:opacity-50 shadow-sm transition-all"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </SearchableSelect>
    </div>
  );
}
