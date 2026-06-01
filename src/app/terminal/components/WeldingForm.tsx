"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useMemo } from "react";
type Machine = {
  id: string;
  machineCode: string;
  machineNo: string;
  brand: string;
  model: string;
  current: string | null;
  serialNo: string | null;
};

type Props = {
  value: any;
  onChange: (next: any) => void;
  weldingMachines: Machine[];
  materialTypes: { id: string; type: string }[];
  weldingTypes: { id: string; type: string }[];
  joints: { id: string; joint: string }[];
};

const POSITIONS = ["1F", "2F", "3F", "4F", "1G", "2G", "3G", "4G", "5G", "6G"];

export default function WeldingForm({
  value,
  onChange,
  weldingMachines,
  materialTypes,
  weldingTypes,
  joints,
}: Props) {
  const selectedMachine = useMemo(
    () => weldingMachines.find((m) => m.id === value.weldingMachineId),
    [weldingMachines, value.weldingMachineId],
  );

  function set(field: string, v: any) {
    onChange({ ...value, [field]: v });
  }

  function toggle(field: string, id: string) {
    const arr: string[] = value[field] || [];
    const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    onChange({ ...value, [field]: next });
  }

  return (
    <div className="space-y-4">
      <Group label="Material & Type">
        <MultiPills
          label="Type of Material"
          options={materialTypes.map((m) => ({ id: m.id, label: m.type }))}
          selectedIds={value.materialTypeIds || []}
          onToggle={(id) => toggle("materialTypeIds", id)}
        />
        <MultiPills
          required
          label="Type of Welding"
          options={weldingTypes.map((w) => ({ id: w.id, label: w.type }))}
          selectedIds={value.weldingTypeIds || []}
          onToggle={(id) => toggle("weldingTypeIds", id)}
        />
      </Group>

      <Group label="Welding Machine">
        <Field label="Welding Machine" required>
          <SearchableSelect
            value={value.weldingMachineId || ""}
            onChange={(e) => set("weldingMachineId", e.target.value)}
            className={inputCls}
          >
            <option value="">Select machine</option>
            {weldingMachines.map((m) => (
              <option key={m.id} value={m.id}>{m.machineCode}</option>
            ))}
          </SearchableSelect>
        </Field>
        <ReadField label="Machine No" value={selectedMachine?.machineNo} />
        <ReadField label="Brand" value={selectedMachine?.brand} />
        <ReadField label="Model" value={selectedMachine?.model} />
        <ReadField label="Current" value={selectedMachine?.current} />
        <ReadField label="S/No" value={selectedMachine?.serialNo} />
      </Group>

      <Group label="Joint & Process">
        <Field label="Type of Joint">
          <SearchableSelect
            value={value.typeOfJointId || ""}
            onChange={(e) => set("typeOfJointId", e.target.value)}
            className={inputCls}
          >
            <option value="">None</option>
            {joints.map((j) => (
              <option key={j.id} value={j.id}>{j.joint}</option>
            ))}
          </SearchableSelect>
        </Field>
        <Field label="Electrode Type">
          <input value={value.electrodeType || ""} onChange={(e) => set("electrodeType", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Welding Position">
          <SearchableSelect value={value.weldingPosition || ""} onChange={(e) => set("weldingPosition", e.target.value)} className={inputCls}>
            <option value="">Select</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </SearchableSelect>
        </Field>
        <NumField label="Welding Joint" value={value.weldingJoint} onChange={(v) => set("weldingJoint", v)} />
        <NumField label="Welding Size (mm)" value={value.weldingSizeMm} onChange={(v) => set("weldingSizeMm", v)} />
      </Group>

      <Group label="Parameters">
        <NumField label="Voltage (V)" value={value.voltageVolts} onChange={(v) => set("voltageVolts", v)} />
        <NumField label="Current (A)" value={value.currentAmp} onChange={(v) => set("currentAmp", v)} />
        <NumField label="Cooling Time (mins)" value={value.coolingTimeMins} onChange={(v) => set("coolingTimeMins", v)} />
        <NumField label="Pre Heating (°C)" value={value.preHeatingC} onChange={(v) => set("preHeatingC", v)} />
        <NumField label="Post Heating (°C)" value={value.postHeatingC} onChange={(v) => set("postHeatingC", v)} />
        <NumField label="Heat Treatment (HRC)" value={value.heatTreatmentHrc} onChange={(v) => set("heatTreatmentHrc", v)} />
      </Group>

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
function MultiPills({
  label,
  options,
  selectedIds,
  onToggle,
  required,
}: {
  label: string;
  options: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  required?: boolean;
}) {
  return (
    <div className="md:col-span-3">
      <label className="text-xs font-medium text-slate-500">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.length === 0 && <span className="text-xs text-slate-500">No options available</span>}
        {options.map((o) => {
          const on = selectedIds.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                on
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
