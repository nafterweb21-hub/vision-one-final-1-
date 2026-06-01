export const PROFILE_REGISTRY: Record<
  string,
  {
    modelName: string;
    displayName: string;
    immutableFields: string[];
    mandatoryFields: string[];
    uniqueFields: string[];
    searchFields: string[];
    includes?: any;
  }
> = {
  currency: {
    modelName: "currency",
    displayName: "Currency Profile",
    immutableFields: ["code", "name"],
    mandatoryFields: ["code", "name", "exchangeRate"],
    uniqueFields: ["code", "name"],
    searchFields: ["code", "name"],
  },
  uom: {
    modelName: "uomProfile",
    displayName: "UOM Profile",
    immutableFields: ["uomName"],
    mandatoryFields: ["uomName"],
    uniqueFields: ["uomName"],
    searchFields: ["uomName", "remarks"],
  },
  elcometer: {
    modelName: "elcometerProfile",
    displayName: "Elcometer Profile",
    immutableFields: ["serialNo"],
    mandatoryFields: ["serialNo"],
    uniqueFields: ["serialNo"],
    searchFields: ["serialNo", "remark"],
  },
  machine: {
    modelName: "machineProfile",
    displayName: "Machine Profile",
    immutableFields: ["machineCode"],
    mandatoryFields: ["machineCode", "machineNo", "brand", "model", "machineCategory"],
    uniqueFields: ["machineCode"],
    searchFields: ["machineCode", "machineNo", "brand", "model"],
  },
  "payment-term": {
    modelName: "paymentTermProfile",
    displayName: "Payment Term Profile",
    immutableFields: ["name"],
    mandatoryFields: ["name", "days"],
    uniqueFields: ["name"],
    searchFields: ["name"],
  },
  "finished-good": {
    modelName: "finishedGoodProfile",
    displayName: "Finished Good Profile",
    immutableFields: ["partNo", "description"],
    mandatoryFields: ["description"],
    uniqueFields: ["partNo", "description"],
    searchFields: ["partNo", "description", "remark"],
  },
};

