"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { addRoutingProcess } from "../actions";
type MainProcess = { id: string; process: string };
type ProcessProfile = {
  id: string;
  routingProcess: string;
  mainProcessId: string;
  welding: boolean;
  sprayPainting: boolean;
  machining: boolean;
};

type Props = {
  inProcessId: string;
  mainProcesses: MainProcess[];
  processProfiles: ProcessProfile[];
  disabled?: boolean;
};

type FormValues = {
  mainProcessId: string;
  routingProcessId: string;
  targetCompletionDate: string;
  remark: string;
};

export default function AddRoutingProcessModal({
  inProcessId,
  mainProcesses,
  processProfiles,
  disabled,
}: Props) {
  const [isOpen, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      mainProcessId: "",
      routingProcessId: "",
      targetCompletionDate: "",
      remark: "",
    },
  });

  const selectedMain = watch("mainProcessId");
  const filteredRouting = useMemo(
    () => processProfiles.filter((p) => p.mainProcessId === selectedMain),
    [processProfiles, selectedMain],
  );

  function onSubmit(data: FormValues) {
    setError("");
    startTransition(async () => {
      const res = await addRoutingProcess({
        inProcessId,
        mainProcessId: data.mainProcessId,
        routingProcessId: data.routingProcessId,
        targetCompletionDate: data.targetCompletionDate,
        remark: data.remark,
      });
      if (!res.success) {
        setError(res.error || "An error occurred");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
      >
        <Plus size={14} />
        Add Routing Process
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">Add Routing Process</h3>
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

              <form id="rp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Main Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect {...register("mainProcessId", { required: true })} className={inputCls}>
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

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Target Completion Date <span className="text-red-500">*</span>
                    </label>
                    <input type="date" {...register("targetCompletionDate", { required: true })} className={inputCls} />
                    {errors.targetCompletionDate && <p className="text-xs text-red-500">Required</p>}
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
              <button form="rp-form" type="submit" disabled={isPending} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {isPending ? "Saving..." : "Add"}
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
