import { ClipboardCheck, House, Landmark, Sofa, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shows the count of accounts still missing this month. */
  badge?: "missing";
}

// Shared by the phone tab bar and the desktop sidebar. The profile entry is
// rendered separately (it shows the user's initial instead of an icon).
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/update", label: "Update", icon: ClipboardCheck, badge: "missing" },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/possessions", label: "Possessions", icon: Sofa },
];

export function initialOf(name?: string): string {
  return (name?.trim()[0] ?? "?").toUpperCase();
}
