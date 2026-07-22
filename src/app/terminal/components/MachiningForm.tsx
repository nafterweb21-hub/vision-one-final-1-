"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useMemo } from "react";
type Machine = {
  id: string;
  machineCode: string;
  machineNo: string;
  brand: string;
  model: string;
  machineType: string | null;
  operationType: string | null;
  serialNo: string | null;
};

type Props = {
  value: any;
  onChange: (next: any) => void;
  machiningMachines: Machine[];
};

export default function MachiningForm({ value, onChange, machiningMachines }: Props) {
  const selected = useMemo(
    () => machiningMachines.find((m) => m.id === value.machineSerialNoId),
    [machiningMachines, value.machineSerialNoId],
  );

  function set(field: string, v: any) {
    onChange({ ...value, [field]: v });
  }
  function setTool(idx: number, v: number | undefined) {
    const list = [...(value.toolList || [])];
    list[idx] = v ?? 0;
    onChange({ ...value, toolList: list });
  }
  function addTool() {
    onChange({ ...value, toolList: [...(value.toolList || []), 0] });
  }
  function removeTool(idx: number) {
    const list = [...(value.toolList || [])];
    list.splice(idx, 1);
    onChange({ ...value, toolList: list });
  }

  return (
    <div className="space-y-4">
      <Group label="Machine">
        <Field label="Machine Serial No" required>
          <SearchableSelect value={value.machineSerialNoId || ""} onChange={(e) => set("machineSerialNoId", e.target.value)} className={inputCls}>
            <option value="">Select machine</option>
            {machiningMachines.map((m) => (
              <option key={m.id} value={m.id}>{m.serialNo || m.machineCode}</option>
            ))}
          </SearchableSelect>
        </Field>
        <ReadField label="Machine No/Name" value={selected?.machineNo} />
        <ReadField label="Machine Type" value={selected?.machineType} />
        <ReadField label="Brand" value={selected?.brand} />
        <ReadField label="Model" value={selected?.model} />
        <ReadField label="Operation Type" value={selected?.operationType} />
      </Group>

      <Group label="Operation">
        <Field label="CNC Program No">
          <input value={value.cncProgramNo || ""} onChange={(e) => set("cncProgramNo", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Test Run">
          <input value={value.testRun || ""} onChange={(e) => set("testRun", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Special Tooling">
          <input value={value.specialTooling || ""} onChange={(e) => set("specialTooling", e.target.value)} className={inputCls} />
        </Field>
        <NumField label="Part Runtime (Hr)" value={value.partRuntimeHr} onChange={(v) => set("partRuntimeHr", v)} />
        <NumField label="Part Runtime (Mins)" value={value.partRuntimeMins} onChange={(v) => set("partRuntimeMins", v)} />
      </Group>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tool List</h5>
          <button
            type="button"
            onClick={addTool}
            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add Tool
          </button>
        </div>
        {(value.toolList || []).length === 0 ? (
          <p className="text-xs text-slate-500">No tools added.</p>
        ) : (
          <div className="space-y-1.5">
            {(value.toolList || []).map((v: number, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-6">#{i + 1}</span>
                <input
                  type="number"
                  step="0.1"
                  value={v ?? ""}
                  onChange={(e) => setTool(i, e.target.value === "" ? undefined : Number(e.target.value))}
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeTool(i)}
                  className="text-xs px-2 py-1 rounded bg-rose-700 text-white hover:bg-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Remark</label>
        <textarea
          value={value.remark || ""}
          onChange={(e) => set("remark", e.target.value)}
          rows={2}
          className={`mt-1 ${inputCls}`}
        />
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-800 focus:ring-2 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 pb-1 border-b border-slate-700">{label}</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1 px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-900 text-slate-300 min-h-[38px]">
        {value || "-"}
      </div>
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: any; onChange: (n: number | undefined) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step="1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className={inputCls}
      />
    </Field>
  );
}
