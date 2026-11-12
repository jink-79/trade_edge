import { Armchair, Car, Gem, Laptop, Package, Refrigerator, type LucideIcon } from "lucide-react";
import type { PossessionCategory } from "../types/possessions.types";

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Default yearly loss of value, in percent. */
  defaultDrop: number;
  example: string;
  /** Icon tile: tinted background + coloured icon (full class names so Tailwind keeps them). */
  tile: string;
  /** Icon colour on its own. */
  text: string;
}

export const CATEGORY_META: Record<PossessionCategory, CategoryMeta> = {
  vehicle: {
    label: "Vehicle",
    icon: Car,
    defaultDrop: 15,
    example: "Royal Enfield Classic 350",
    tile: "bg-pos-vehicle/15 text-pos-vehicle",
    text: "text-pos-vehicle",
  },
  appliance: {
    label: "Appliance",
    icon: Refrigerator,
    defaultDrop: 12,
    example: "LG refrigerator",
    tile: "bg-pos-appliance/15 text-pos-appliance",
    text: "text-pos-appliance",
  },
  electronics: {
    label: "Electronics",
    icon: Laptop,
    defaultDrop: 25,
    example: "MacBook Air",
    tile: "bg-pos-electronics/15 text-pos-electronics",
    text: "text-pos-electronics",
  },
  furniture: {
    label: "Furniture",
    icon: Armchair,
    defaultDrop: 10,
    example: "Queen bed",
    tile: "bg-pos-furniture/15 text-pos-furniture",
    text: "text-pos-furniture",
  },
  jewellery: {
    label: "Gold & jewellery",
    icon: Gem,
    defaultDrop: 0,
    example: "Gold chain",
    tile: "bg-pos-jewellery/15 text-pos-jewellery",
    text: "text-pos-jewellery",
  },
  other: {
    label: "Other",
    icon: Package,
    defaultDrop: 10,
    example: "Camera",
    tile: "bg-pos-other/15 text-pos-other",
    text: "text-pos-other",
  },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as PossessionCategory[];
