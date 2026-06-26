import { type ExitReason } from "../types/history.types";

export const fmtINR = (n: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

export const daysBetween = (a: string, b: string): number =>
  Math.max(
    1,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );

export const sectorColors: Record<string, string> = {
  IT: "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.12)] border-[oklch(0.68_0.18_240/0.3)]",
  Electronics:
    "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.12)] border-[oklch(0.82_0.16_85/0.3)]",
  Consumer:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.12)] border-[oklch(0.74_0.15_300/0.3)]",
  Defence:
    "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.3)]",
  Auto: "text-[oklch(0.68_0.21_22)] bg-[oklch(0.68_0.21_22/0.12)] border-[oklch(0.68_0.21_22/0.3)]",
  Materials:
    "text-[oklch(0.82_0.16_85)] bg-[oklch(0.82_0.16_85/0.12)] border-[oklch(0.82_0.16_85/0.3)]",
  Technology:
    "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.12)] border-[oklch(0.68_0.18_240/0.3)]",
  Chemicals:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.12)] border-[oklch(0.74_0.15_300/0.3)]",
};

export const exitStyles: Record<ExitReason, string> = {
  "Target Hit": "text-success border-success/30 bg-success/10",
  "Trail Hit": "text-primary border-primary/30 bg-primary/10",
  "Stop Hit": "text-destructive border-destructive/30 bg-destructive/10",
  "Manual Exit": "text-muted-foreground border-border bg-secondary/40",
  "Time Exit": "text-warning border-warning/30 bg-warning/10",
};

export const PAGE_SIZE = 8;
