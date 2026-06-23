export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

export const daysSince = (iso: string): number => {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

export const SECTOR_COLOR: Record<string, string> = {
  IT: "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.12)] border-[oklch(0.68_0.18_240/0.3)]",
  Electronics:
    "text-[oklch(0.82_0.16_85)]  bg-[oklch(0.82_0.16_85/0.12)]  border-[oklch(0.82_0.16_85/0.3)]",
  Consumer:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.12)] border-[oklch(0.74_0.15_300/0.3)]",
  Defence:
    "text-[oklch(0.78_0.17_155)] bg-[oklch(0.78_0.17_155/0.12)] border-[oklch(0.78_0.17_155/0.3)]",
  Auto: "text-[oklch(0.68_0.21_22)]  bg-[oklch(0.68_0.21_22/0.12)]  border-[oklch(0.68_0.21_22/0.3)]",
  Materials:
    "text-[oklch(0.82_0.16_85)]  bg-[oklch(0.82_0.16_85/0.12)]  border-[oklch(0.82_0.16_85/0.3)]",
  Technology:
    "text-[oklch(0.68_0.18_240)] bg-[oklch(0.68_0.18_240/0.12)] border-[oklch(0.68_0.18_240/0.3)]",
  Chemicals:
    "text-[oklch(0.74_0.15_300)] bg-[oklch(0.74_0.15_300/0.12)] border-[oklch(0.74_0.15_300/0.3)]",
};
