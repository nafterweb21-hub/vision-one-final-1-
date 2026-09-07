/**
 * Metadata for the generic profile CRUD stack.
 *
 * Server side, `src/lib/profiles.ts` reads this for validation and query
 * building; client side, `/dashboard/profiles/[type]` renders its form from
 * `fields`. Previously the form fields were a hardcoded ternary in the page
 * (`type === "currency" ? CURRENCY_FIELDS : []`), so every other registered
 * type rendered an empty form. They live here now so registering a profile is
 * a single edit.
 *
 * Note that a static route always beats the `[type]` segment: `uom`, `machine`,
 * `bank`, `elcometer`, `payment-term` and `finished-good` each still have their
 * own hand-written page under `src/app/dashboard/profiles/<key>/`, which is what
 * users actually reach. Their entries here back the API and stand ready if
 * those bespoke pages are ever retired.
 */

export interface ProfileFieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface ProfileMeta {
  modelName: string;
  displayName: string;
  immutableFields: string[];
  mandatoryFields: string[];
  uniqueFields: string[];
  searchFields: string[];
  /** Form fields rendered by the generic `[type]` page, in display order. */
  fields: ProfileFieldConfig[];
  includes?: unknown;
}

export const PROFILE_REGISTRY: Record<string, ProfileMeta> = {
  currency: {
    modelName: "currency",
    displayName: "Currency Profile",
    immutableFields: ["code", "name"],
    mandatoryFields: ["code", "name", "exchangeRate"],
    uniqueFields: ["code", "name"],
    searchFields: ["code", "name"],
    fields: [
      { name: "code", label: "Currency Code", type: "text", required: true, placeholder: "e.g. USD" },
      { name: "name", label: "Currency Name", type: "text", required: true, placeholder: "e.g. US Dollar" },
      { name: "exchangeRate", label: "Exchange Rate", type: "number", required: true, placeholder: "e.g. 83.250" },
      { name: "isDefault", label: "Default Currency?", type: "checkbox" },
      { 
        name: "roundingMode", 
        label: "Rounding Mode", 
        type: "select", 
        options: [
          { label: "Exact (No Rounding)", value: "EXACT" },
          { label: "Round Up", value: "UP" },
          { label: "Round Down", value: "DOWN" }
        ],
        required: true
      },
    ],
  },
  uom: {
    modelName: "uomProfile",
    displayName: "UOM Profile",
    immutableFields: ["uomName"],
    mandatoryFields: ["uomName"],
    uniqueFields: ["uomName"],
    searchFields: ["uomName", "remarks"],
    fields: [
      { name: "uomName", label: "UOM Name", type: "text", required: true, placeholder: "e.g. PCS" },
      { name: "remarks", label: "Remarks", type: "text", placeholder: "Optional" },
    ],
  },
  elcometer: {
    modelName: "elcometerProfile",
    displayName: "Elcometer Profile",
    immutableFields: ["serialNo"],
    mandatoryFields: ["serialNo"],
    uniqueFields: ["serialNo"],
    searchFields: ["serialNo", "remark"],
    fields: [
      { name: "serialNo", label: "Serial No", type: "text", required: true, placeholder: "e.g. ELC-0001" },
      { name: "remark", label: "Remark", type: "text", placeholder: "Optional" },
    ],
  },
  machine: {
    modelName: "machineProfile",
    displayName: "Machine Profile",
    immutableFields: ["machineCode"],
    mandatoryFields: ["machineCode", "machineNo", "brand", "model", "machineCategory"],
    uniqueFields: ["machineCode"],
    searchFields: ["machineCode", "machineNo", "brand", "model"],
    fields: [
      { name: "machineCode", label: "Machine Code", type: "text", required: true, placeholder: "e.g. MC-001" },
      { name: "machineNo", label: "Machine No", type: "text", required: true },
      { name: "brand", label: "Brand", type: "text", required: true },
      { name: "model", label: "Model", type: "text", required: true },
      { name: "machineCategory", label: "Machine Category", type: "text", required: true },
      { name: "machineType", label: "Machine Type", type: "text" },
      { name: "operationType", label: "Operation Type", type: "text" },
      { name: "current", label: "Current", type: "text" },
      { name: "serialNo", label: "Serial No", type: "text" },
      { name: "remark", label: "Remark", type: "text", placeholder: "Optional" },
    ],
  },
  "payment-term": {
    modelName: "paymentTermProfile",
    displayName: "Payment Term Profile",
    immutableFields: ["name"],
    mandatoryFields: ["name", "days"],
    uniqueFields: ["name"],
    searchFields: ["name"],
    fields: [
      { name: "name", label: "Payment Term", type: "text", required: true, placeholder: "e.g. Net 30" },
      { name: "days", label: "Days", type: "number", required: true, placeholder: "e.g. 30" },
      { name: "remark", label: "Remark", type: "text", placeholder: "Optional" },
    ],
  },
  "finished-good": {
    modelName: "finishedGoodProfile",
    displayName: "Finished Good Profile",
    immutableFields: ["partNo", "description"],
    mandatoryFields: ["description"],
    uniqueFields: ["partNo", "description"],
    searchFields: ["partNo", "description", "remark"],
    fields: [
      { name: "description", label: "Description", type: "text", required: true },
      { name: "partNo", label: "Part No", type: "text", placeholder: "Optional" },
      { name: "remark", label: "Remark", type: "text", placeholder: "Optional" },
    ],
  },
  bank: {
    modelName: "bankProfile",
    displayName: "Bank Profile",
    immutableFields: [],
    mandatoryFields: ["bankName", "accountName", "accountNo"],
    uniqueFields: ["accountNo"],
    searchFields: ["bankName", "accountName", "accountNo"],
    fields: [
      { name: "bankName", label: "Bank Name", type: "text", required: true },
      { name: "accountName", label: "Account Name", type: "text", required: true },
      { name: "accountNo", label: "Account No", type: "text", required: true },
      { name: "swiftCode", label: "SWIFT Code", type: "text" },
      { name: "branchCode", label: "Branch Code", type: "text" },
      { name: "remark", label: "Remark", type: "text", placeholder: "Optional" },
    ],
  },
};
