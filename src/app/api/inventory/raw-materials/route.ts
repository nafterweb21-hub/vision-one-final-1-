import { createStockItemHandlers } from "@/lib/stock-item-route";

// Raw materials and consumables share a table and a lib module, but stay
// separate RBAC modules so a storekeeper can hold one without the other.
export const { GET, POST, PUT, PATCH, DELETE } = createStockItemHandlers({
  moduleCode: "RAW_MATERIAL",
  itemType: "RAW_MATERIAL",
  label: "raw material",
});
