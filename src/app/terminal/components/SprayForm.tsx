"use client";
import { SearchableSelect } from "@/components/SearchableSelect";
type Props = {
  value: any;
  onChange: (next: any) => void;
};

const WEATHERS = ["Dry", "Wet"];

export default function SprayForm({ value, onChange }: Props) {
  function set(field: string, v: any) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div className="space-y-5">
      <Group label="Header">
        <NumField label="Paint Tank Pressure (psi)" value={value.paintTankPressurePsi} onChange={(v) => set("paintTankPressurePsi", v)} />
        <NumField label="Spray Nozzle Size (Ø)" value={value.sprayNozzleSize} onChange={(v) => set("sprayNozzleSize", v)} />
        <Field label="Type of Paint">
          <input value={value.typeOfPaint || ""} onChange={(e) => set("typeOfPaint", e.target.value)} className={inputCls} />
        </Field>
      </Group>

      <Block title="A. Surface Preparation (Blasting / Power Tool / Solvent)">
        <DtField label="Start" field="surfaceStartDatetime" value={value} onChange={onChange} />
        <DtField label="End" field="surfaceEndDatetime" value={value} onChange={onChange} />
        <SelectField
          label="General Weather"
          field="surfaceGeneralWeather"
          value={value}
          onChange={onChange}
          options={WEATHERS}
        />
        <Field label="Env Temperature">
          <input value={value.surfaceEnvTemperature || ""} onChange={(e) => set("surfaceEnvTemperature", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Relative Humidity">
          <input value={value.surfaceRelativeHumidity || ""} onChange={(e) => set("surfaceRelativeHumidity", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Abrasive Type">
          <input value={value.surfaceAbrasiveType || ""} onChange={(e) => set("surfaceAbrasiveType", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Sandpaper Grit (sand blasting only)">
          <input value={value.surfaceSandpaperGrit || ""} onChange={(e) => set("surfaceSandpaperGrit", e.target.value)} className={inputCls} />
        </Field>
      </Block>

      <Block title="B. Primer Coat">
        <DtField label="Start" field="primerStartDatetime" value={value} onChange={onChange} />
        <DtField label="End" field="primerEndDatetime" value={value} onChange={onChange} />
        <SelectField label="General Weather" field="primerGeneralWeather" value={value} onChange={onChange} options={WEATHERS} />
        <Field label="Env Temperature">
          <input value={value.primerEnvTemperature || ""} onChange={(e) => set("primerEnvTemperature", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Relative Humidity">
          <input value={value.primerRelativeHumidity || ""} onChange={(e) => set("primerRelativeHumidity", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Paint Batch No">
          <input value={value.primerPaintBatchNo || ""} onChange={(e) => set("primerPaintBatchNo", e.target.value)} className={inputCls} />
        </Field>
        <DateField label="Expiry Date" field="primerExpiryDate" value={value} onChange={onChange} />
        <Field label="DFT Measurement Result">
          <input value={value.primerDftMeasurement || ""} onChange={(e) => set("primerDftMeasurement", e.target.value)} className={inputCls} />
        </Field>
      </Block>

      <Block title="C. Top Coat">
        <DtField label="Start" field="topcoatStartDatetime2" value={value} onChange={onChange} />
        <DtField label="End" field="topcoatEndDatetime2" value={value} onChange={onChange} />
        <SelectField label="General Weather" field="topcoatGeneralWeather2" value={value} onChange={onChange} options={WEATHERS} />
        <Field label="Env Temperature">
          <input value={value.topcoatEnvTemperature2 || ""} onChange={(e) => set("topcoatEnvTemperature2", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Relative Humidity">
          <input value={value.topcoatRelativeHumidity2 || ""} onChange={(e) => set("topcoatRelativeHumidity2", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Abrasive Type">
          <input value={value.topcoatAbrasiveType || ""} onChange={(e) => set("topcoatAbrasiveType", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Sandpaper Grit">
          <input value={value.topcoatSandpaperGrit || ""} onChange={(e) => set("topcoatSandpaperGrit", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Paint Batch No">
          <input value={value.topcoatPaintBatchNo || ""} onChange={(e) => set("topcoatPaintBatchNo", e.target.value)} className={inputCls} />
        </Field>
        <DateField label="Expiry Date" field="topcoatExpiryDate" value={value} onChange={onChange} />
        <Field label="DFT Measurement">
          <input value={value.topcoatDftMeasurement || ""} onChange={(e) => set("topcoatDftMeasurement", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Adhesive Test Result">
          <input value={value.topcoatAdhesiveTestResult || ""} onChange={(e) => set("topcoatAdhesiveTestResult", e.target.value)} className={inputCls} />
        </Field>
      </Block>

      <div>
        <label className="text-xs font-medium text-slate-500">Remark</label>
        <textarea
          value={value.remark || ""}
          onChange={(e) => set("remark", e.target.value)}
          rows={2}
          className={`mt-1 ${inputCls}`}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">Additional Remark</label>
        <textarea
          value={value.additionalRemark || ""}
          onChange={(e) => set("additionalRemark", e.target.value)}
          rows={2}
          className={`mt-1 ${inputCls}`}
        />
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-800 focus:ring-2 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
      <h5 className="text-sm font-semibold text-blue-300 mb-3">{title}</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 pb-1 border-b border-slate-700">{label}</h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
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
function DtField({ label, field, value, onChange }: { label: string; field: string; value: any; onChange: (v: any) => void }) {
  return (
    <Field label={label}>
      <input type="datetime-local" value={value[field] || ""} onChange={(e) => onChange({ ...value, [field]: e.target.value })} className={inputCls} />
    </Field>
  );
}
function DateField({ label, field, value, onChange }: { label: string; field: string; value: any; onChange: (v: any) => void }) {
  return (
    <Field label={label}>
      <input type="date" value={value[field] || ""} onChange={(e) => onChange({ ...value, [field]: e.target.value })} className={inputCls} />
    </Field>
  );
}
function SelectField({
  label,
  field,
  value,
  onChange,
  options,
}: {
  label: string;
  field: string;
  value: any;
  onChange: (v: any) => void;
  options: string[];
}) {
  return (
    <Field label={label}>
      <SearchableSelect value={value[field] || ""} onChange={(e) => onChange({ ...value, [field]: e.target.value })} className={inputCls}>
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </SearchableSelect>
    </Field>
  );
}
