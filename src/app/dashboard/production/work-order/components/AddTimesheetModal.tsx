"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, X, Pencil } from "lucide-react";
import { upsertTimesheet } from "../actions";
import { useRouter } from "next/navigation";
type AddTimesheetModalProps = {
  workOrderNo: string;
  employees: { id: string; name: string; code: string }[];
  routingProcesses: { id: string; name: string; description: string }[];
  timesheet?: any;
};

export default function AddTimesheetModal({ workOrderNo, employees, routingProcesses, timesheet }: AddTimesheetModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      routingProcessId: timesheet?.routingProcessId || "",
      employeeId: timesheet?.employeeId || "",
      timeIn: timesheet?.timeIn ? new Date(timesheet.timeIn).toISOString().slice(0, 16) : "",
      timeOut: timesheet?.timeOut ? new Date(timesheet.timeOut).toISOString().slice(0, 16) : "",
      completed: timesheet?.completed || false,
      completedQty: timesheet?.completedQty || "",
      machineCodes: timesheet?.machineCodes || ""
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await upsertTimesheet({
        id: timesheet?.id,
        workOrderNo,
        routingProcessId: data.routingProcessId,
        employeeId: data.employeeId,
        timeIn: data.timeIn || undefined,
        timeOut: data.timeOut || undefined,
        completed: data.completed,
        completedQty: data.completedQty || undefined,
        machineCodes: data.machineCodes || undefined
      });

      if (result.success) {
        setIsOpen(false);
        reset();
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add timesheet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {timesheet ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Edit Timesheet"
        >
          <Pencil size={16} />
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Timesheet
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">{timesheet ? 'Edit Production Timesheet' : 'Add Production Timesheet'}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <form id="timesheet-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Process <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      {...register("routingProcessId", { required: true })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Process</option>
                      {routingProcesses.map(rp => (
                        <option key={rp.id} value={rp.id}>
                          {rp.name} ({rp.description})
                        </option>
                      ))}
                    </SearchableSelect>
                    {errors.routingProcessId && <p className="text-xs text-red-500">Process is required</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      {...register("employeeId", { required: true })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.code})
                        </option>
                      ))}
                    </SearchableSelect>
                    {errors.employeeId && <p className="text-xs text-red-500">Employee is required</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Time In</label>
                    <input
                      type="datetime-local"
                      {...register("timeIn")}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Time Out</label>
                    <input
                      type="datetime-local"
                      {...register("timeOut")}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1">Total minutes will be calculated automatically.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Completed Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("completedQty")}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Machine Code(s)</label>
                    <input
                      {...register("machineCodes")}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                      placeholder="e.g. MC-01, MC-02"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="completed"
                    {...register("completed")}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="completed" className="text-sm font-medium text-slate-700">Mark as Completed</label>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                form="timesheet-form"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm shadow-blue-500/20"
              >
                {isSubmitting ? "Saving..." : timesheet ? "Save Changes" : "Add Timesheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
