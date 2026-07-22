"use client";

import { Layers } from "lucide-react";
import { StockItemsPage, type StockItemsPageConfig } from "@/components/StockItemsPage";

const CONFIG: StockItemsPageConfig = {
  itemType: "RAW_MATERIAL",
  noun: "Raw Material",
  nounPlural: "Raw Materials",
  apiPath: "/api/inventory/raw-materials",
  idPrefix: "raw-material",
  icon: Layers,
  subtitle: "Manage raw material stock items, reorder levels, and standard costs.",
  costLabel: "Standard Cost",
  showMaterialTypeAndGrade: true,
  codeLabel: "Material Code",
  nameLabel: "Material Name",
  accent: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600",
    button: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20",
    ring: "focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500",
    spinner: "text-amber-600",
    hoverText: "group-hover/name:text-amber-600",
    hoverBg: "group-hover/name:bg-amber-600 group-hover/name:text-white",
    pageActive: "bg-amber-600",
    tint: "bg-amber-50 border border-amber-200 text-amber-700",
  },
};

export default function RawMaterialsPage() {
  return <StockItemsPage config={CONFIG} />;
}
