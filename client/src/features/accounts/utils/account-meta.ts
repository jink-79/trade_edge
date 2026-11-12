import { CreditCard, HandCoins, Landmark, LineChart, PiggyBank, type LucideIcon } from "lucide-react";
import type { AccountType } from "../types/accounts.types";

interface TypeMeta {
  label: string; // singular, for forms
  group: string; // plural, for list headings
  icon: LucideIcon;
  dot: string; // Tailwind bg class from the category palette
  liability: boolean;
  tracksInvested: boolean;
  valueLabel: string;
  namePlaceholder: string;
  institutionPlaceholder: string;
}

export const TYPE_META: Record<AccountType, TypeMeta> = {
  mf: {
    label: "Mutual fund",
    group: "Mutual funds",
    icon: PiggyBank,
    dot: "bg-cat-mf",
    liability: false,
    tracksInvested: true,
    valueLabel: "Current value",
    namePlaceholder: "Parag Parikh Flexi Cap",
    institutionPlaceholder: "Groww",
  },
  stock: {
    label: "Stocks",
    group: "Stocks",
    icon: LineChart,
    dot: "bg-cat-stocks",
    liability: false,
    tracksInvested: true,
    valueLabel: "Current value",
    namePlaceholder: "Zerodha",
    institutionPlaceholder: "Zerodha",
  },
  bank: {
    label: "Bank account",
    group: "Bank",
    icon: Landmark,
    dot: "bg-cat-bank",
    liability: false,
    tracksInvested: false,
    valueLabel: "Balance",
    namePlaceholder: "HDFC savings",
    institutionPlaceholder: "HDFC Bank",
  },
  loan: {
    label: "Loan",
    group: "Loans",
    icon: HandCoins,
    dot: "bg-cat-loans",
    liability: true,
    tracksInvested: false,
    valueLabel: "Amount still owed",
    namePlaceholder: "Bike loan",
    institutionPlaceholder: "Bajaj Finance",
  },
  card: {
    label: "Credit card",
    group: "Credit cards",
    icon: CreditCard,
    dot: "bg-cat-cards",
    liability: true,
    tracksInvested: false,
    valueLabel: "Unpaid balance",
    namePlaceholder: "Amazon Pay ICICI",
    institutionPlaceholder: "ICICI Bank",
  },
};

export const ASSET_TYPES: AccountType[] = ["mf", "stock", "bank"];
export const LIABILITY_TYPES: AccountType[] = ["loan", "card"];
export const ALL_TYPES: AccountType[] = [...ASSET_TYPES, ...LIABILITY_TYPES];
