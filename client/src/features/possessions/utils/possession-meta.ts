import { Armchair, Car, Gem, Laptop, Package, Refrigerator, type LucideIcon } from "lucide-react";
import type { PossessionCategory } from "../types/possessions.types";

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Default yearly loss of value, in percent. */
  defaultDrop: number;
  example: string;
}

export const CATEGORY_META: Record<PossessionCategory, CategoryMeta> = {
  vehicle: { label: "Vehicle", icon: Car, defaultDrop: 15, example: "Royal Enfield Classic 350" },
  appliance: { label: "Appliance", icon: Refrigerator, defaultDrop: 12, example: "LG refrigerator" },
  electronics: { label: "Electronics", icon: Laptop, defaultDrop: 25, example: "MacBook Air" },
  furniture: { label: "Furniture", icon: Armchair, defaultDrop: 10, example: "Queen bed" },
  jewellery: { label: "Gold & jewellery", icon: Gem, defaultDrop: 0, example: "Gold chain" },
  other: { label: "Other", icon: Package, defaultDrop: 10, example: "Camera" },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as PossessionCategory[];
