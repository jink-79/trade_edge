import { useRef, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUploadSignals } from "../hooks/use-scanner";
import type { UploadRow } from "../types/scanner.types";

/** Split one CSV line, honoring "quoted, fields". */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** DD-MM-YYYY (or YYYY-MM-DD) → YYYY-MM-DD. */
function toISO(d: string): string | null {
  const dm = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return d;
  return null;
}

function parseCsv(text: string): { rows: UploadRow[]; errors: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: 0 };
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));
  const di = col("date");
  const si = col("symbol", "nsecode", "stock");
  const sci = col("sector");
  const mi = col("marketcap", "cap");
  if (di < 0 || si < 0) return { rows: [], errors: lines.length - 1 };

  const rows: UploadRow[] = [];
  let errors = 0;
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    const iso = toISO((f[di] ?? "").trim());
    const symbol = (f[si] ?? "").trim().toUpperCase();
    if (!iso || !symbol) {
      errors++;
      continue;
    }
    rows.push({
      scanDate: iso,
      symbol,
      sector: sci >= 0 ? f[sci]?.trim() || undefined : undefined,
      marketCap: mi >= 0 ? f[mi]?.trim() || undefined : undefined,
    });
  }
  return { rows, errors };
}

export function ScannerUploadCard() {
  const mut = useUploadSignals();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [fileName, setFileName] = useState("");

  const summary = rows.length
    ? (() => {
        const dates = new Set(rows.map((r) => r.scanDate));
        const symbols = new Set(rows.map((r) => r.symbol));
        const sorted = [...dates].sort();
        return {
          rows: rows.length,
          dates: dates.size,
          symbols: symbols.size,
          from: sorted[0],
          to: sorted[sorted.length - 1],
        };
      })()
    : null;

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const { rows: parsed, errors } = parseCsv(String(reader.result));
      if (parsed.length === 0) {
        toast.error("Couldn't read Date/Symbol columns from that file");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      if (errors) toast.warning(`${errors} rows skipped (bad date/symbol)`);
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setRows([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    mut.mutate(
      { rows, scanName: fileName || "Uploaded scan", note: fileName },
      {
        onSuccess: (r) => {
          toast.success(
            `Uploaded ${r.rows} rows · ${r.newSignals} new signals · ${r.tracked} tracking`,
          );
          reset();
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Upload failed",
          ),
      },
    );
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-primary" /> Bulk upload
        </CardTitle>
        <CardDescription>
          Upload a Chartink backtest CSV (columns: Date, Symbol, Marketcap,
          Sector) to backfill many days at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />

        {!summary ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-border/70 bg-background/40 py-10 grid place-items-center gap-2 text-muted-foreground hover:bg-accent/30 transition-colors"
          >
            <Upload className="size-6" />
            <span className="text-sm">Click to choose a .csv file</span>
          </button>
        ) : (
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileSpreadsheet className="size-4 text-primary" />
                {fileName}
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={reset}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat label="Rows" value={summary.rows.toLocaleString("en-IN")} />
              <Stat label="Dates" value={String(summary.dates)} />
              <Stat label="Symbols" value={String(summary.symbols)} />
              <Stat label="Range" value={`${summary.from} → ${summary.to}`} small />
            </div>
          </div>
        )}

        {summary && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={reset} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={submit} disabled={mut.isPending} className="gap-2">
              <Upload className="size-4" />
              {mut.isPending ? "Uploading…" : `Track ${summary.rows.toLocaleString("en-IN")} signals`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className={small ? "text-xs font-medium tabular mt-0.5" : "text-lg font-semibold tabular"}>
        {value}
      </div>
    </div>
  );
}
