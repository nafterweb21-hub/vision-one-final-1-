"use client";

import { Droplet } from "lucide-react";
import { StockItemsPage, type StockItemsPageConfig } from "@/components/StockItemsPage";

const CONFIG: StockItemsPageConfig = {
  itemType: "CONSUMABLE",
  noun: "Consumable",
  nounPlural: "Consumables",
  apiPath: "/api/inventory/consumables",
  idPrefix: "consumable",
  icon: Droplet,
  subtitle: "Manage consumable stock items, reorder levels, and unit costs.",
  costLabel: "Unit Cost",
  showMaterialTypeAndGrade: false,
  codeLabel: "Consumable Code",
  nameLabel: "Consumable Name",
  accent: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-600",
    button: "bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 shadow-cyan-500/20",
    ring: "focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500",
    spinner: "text-cyan-600",
    hoverText: "group-hover/name:text-cyan-600",
    hoverBg: "group-hover/name:bg-cyan-600 group-hover/name:text-white",
    pageActive: "bg-cyan-600",
    tint: "bg-cyan-50 border border-cyan-200 text-cyan-700",
  },
};

export default function ConsumablesPage() {
  return <StockItemsPage config={CONFIG} />;
}
