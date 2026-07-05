import { type FundCategory } from "../types/mutual-funds.types";

export const fmtINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtINR2 = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const fmtDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

export interface CategoryToken {
  color: string;
  chart: string;
  dot: string;
}

export const CAT_TOKENS: Record<FundCategory, CategoryToken> = {
  Smallcap: {
    color:
      "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.12)] border-[oklch(0.74_0.15_300/0.3)]",
    chart: "oklch(0.74 0.15 300)",
    dot: "bg-[oklch(0.74_0.15_300)]",
  },
  Midcap: {
    color:
      "text-[oklch(0.82_0.16_85)]  bg-[oklch(0.82_0.16_85/0.12)]  border-[oklch(0.82_0.16_85/0.3)]",
    chart: "oklch(0.82 0.16 85)",
    dot: "bg-[oklch(0.82_0.16_85)]",
  },
  Largecap: {
    color:
      "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.12)] border-[oklch(0.68_0.18_240/0.3)]",
    chart: "oklch(0.68 0.18 240)",
    dot: "bg-[oklch(0.68_0.18_240)]",
  },
  Flexicap: {
    color:
      "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.3)]",
    chart: "oklch(0.78 0.17 155)",
    dot: "bg-[oklch(0.78_0.17_155)]",
  },
};

export const CATEGORIES: FundCategory[] = [
  "Smallcap",
  "Midcap",
  "Largecap",
  "Flexicap",
];

export const PAGE_SIZE = 10;
