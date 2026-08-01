import { Radar } from "lucide-react";

export function ScannerHero({
  tracking,
  resolved,
}: {
  tracking: number;
  resolved: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Radar className="size-3.5 text-primary" />
        Signal Lab · from Chartink
      </div>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold">Scanner</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Paste your nightly Chartink list. Every stock is paper-traded from the
        scan-day close — {tracking} tracking, {resolved} resolved — so you can
        learn what winners share before you risk real money.
      </p>
    </div>
  );
}
