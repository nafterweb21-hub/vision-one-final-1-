"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useMemo, useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { editRoutingProcess } from "../actions";

type MainProcess = { id: string; process: string };
type ProcessProfile = {
  id: string;
  routingProcess: string;
  mainProcessId: string;
  welding: boolean;
  sprayPainting: boolean;
  machining: boolean;
};

type Pair = { mainProcessId: string; routingProcessId: string };

type Props = {
  routingProcess: any; // the existing routing process object
  mainProcesses: MainProcess[];
  processProfiles: ProcessProfile[];
  existingPairs?: Pair[];
  employees?: any[];
  disabled?: boolean;
};

type FormValues = {
  mainProcessId: string;
  routingProcessId: string;
  targetCompletionDate: string;
  remark: string;
  assignedEmployeeId: string;
};

export default function EditRoutingProcessModal({
  routingProcess,
  mainProcesses,
  processProfiles,
  existingPairs = [],
  employees = [],
  disabled,
}: Props) {
  const [isOpen, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mainProcessId: routingProcess?.mainProcessId || "",
      routingProcessId: routingProcess?.routingProcessId || "",
      targetCompletionDate: routingProcess?.targetCompletionDate ? new Date(routingProcess.targetCompletionDate).toISOString().slice(0, 10) : "",
      remark: routingProcess?.remark || "",
      assignedEmployeeId: routingProcess?.assignedEmployeeId || "",
    },
  });

  // Update default values if the routingProcess prop changes
  useEffect(() => {
    reset({
      mainProcessId: routingProcess?.mainProcessId || "",
      routingProcessId: routingProcess?.routingProcessId || "",
      targetCompletionDate: routingProcess?.targetCompletionDate ? new Date(routingProcess.targetCompletionDate).toISOString().slice(0, 10) : "",
      remark: routingProcess?.remark || "",
      assignedEmployeeId: routingProcess?.assignedEmployeeId || "",
    });
  }, [routingProcess, reset]);

  const selectedMain = watch("mainProcessId");
  const usedRoutingIds = useMemo(
    () =>
      new Set(
        existingPairs
          .filter((p) => p.mainProcessId === selectedMain && p.routingProcessId !== routingProcess?.routingProcessId)
          .map((p) => p.routingProcessId),
      ),
    [existingPairs, selectedMain, routingProcess],
  );
  const filteredRouting = useMemo(
    () =>
      processProfiles.filter(
        (p) => p.mainProcessId === selectedMain && !usedRoutingIds.has(p.id),
      ),
    [processProfiles, selectedMain, usedRoutingIds],
  );

  function onSubmit(data: FormValues) {
    setError("");
    startTransition(async () => {
      const res = await editRoutingProcess(routingProcess.id, {
        mainProcessId: data.mainProcessId,
        routingProcessId: data.routingProcessId,
        targetCompletionDate: data.targetCompletionDate,
        remark: data.remark,
        assignedEmployeeId: data.assignedEmployeeId,
      });
      if (!res.success) {
        setError(res.error || "An error occurred");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        title="Edit Routing Process"
        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 inline-flex items-center gap-1"
      >
        <Pencil size={12} />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Edit Routing Process</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <form id={`edit-rp-form-${routingProcess.id}`} onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Main Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect 
                      {...register("mainProcessId", { required: true })} 
                      value={watch("mainProcessId")}
                      className={inputCls}
                    >
                      <option value="">Select</option>
                      {mainProcesses.map((m) => (
                        <option key={m.id} value={m.id}>{m.process}</option>
                      ))}
                    </SearchableSelect>
                    {errors.mainProcessId && <p className="text-xs text-red-500">Required</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Routing Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      {...register("routingProcessId", { required: true })}
                      value={watch("routingProcessId")}
                      className={inputCls}
                      disabled={!selectedMain}
                    >
                      <option value="">Select</option>
                      {filteredRouting.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.routingProcess}
                          {p.welding ? " (Welding)" : ""}
                          {p.sprayPainting ? " (Spray)" : ""}
                          {p.machining ? " (Machining)" : ""}
                        </option>
                      ))}
                    </SearchableSelect>
                    {errors.routingProcessId && <p className="text-xs text-red-500">Required</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Target Completion Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      max="2035-12-31"
                      {...register("targetCompletionDate", {
                        required: "Required",
                      })}
                      className={inputCls}
                    />
                    {errors.targetCompletionDate && (
                      <p className="text-xs text-red-500">{errors.targetCompletionDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Assigned Employee
                    </label>
                    <SearchableSelect 
                      {...register("assignedEmployeeId")} 
                      value={watch("assignedEmployeeId")}
                      className={inputCls}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </SearchableSelect>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Remark</label>
                  <textarea {...register("remark")} rows={2} className={inputCls} />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">
                Cancel
              </button>
              <button form={`edit-rp-form-${routingProcess.id}`} type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500";
