import { createStockItemHandlers } from "@/lib/stock-item-route";

export const { GET, POST, PUT, PATCH, DELETE } = createStockItemHandlers({
  moduleCode: "CONSUMABLE",
  itemType: "CONSUMABLE",
  label: "consumable",
});
