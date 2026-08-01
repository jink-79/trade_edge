import { useMemo, useState } from "react";
import { ClipboardList, Radar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBatch } from "../hooks/use-scanner";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Parse a Chartink paste (plain list or CSV-ish) into unique tickers. */
export function parseSymbols(raw: string): string[] {
  const tokens = raw
    .split(/[\s,;\t\r\n]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    // tickers: letters/numbers/&/-, 1–20 chars, not pure numbers
    .filter((t) => /^[A-Z0-9&-]{1,20}$/.test(t) && !/^\d+$/.test(t));
  return Array.from(new Set(tokens));
}

// Common Chartink header words to ignore if pasted with columns.
const NOISE = new Set([
  "SR", "SR.", "NAME", "SYMBOL", "STOCK", "LINK", "CHART", "PRICE",
  "VOLUME", "CHANGE", "PER", "NO", "NO.", "SECTOR",
]);

export function ScannerPasteCard() {
  const mut = useCreateBatch();
  const [raw, setRaw] = useState("");
  const [scanDate, setScanDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const symbols = useMemo(
    () => parseSymbols(raw).filter((s) => !NOISE.has(s)),
    [raw],
  );

  const submit = () => {
    if (symbols.length === 0) {
      toast.error("Paste at least one symbol");
      return;
    }
    mut.mutate(
      { scanDate, symbols, rawInput: raw.slice(0, 50_000), note: note || undefined },
      {
        onSuccess: (r) => {
          toast.success(`Tracking ${r.tracked} signals for ${scanDate}`);
          setRaw("");
          setNote("");
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Could not create batch",
          ),
      },
    );
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" /> Tonight's scan
        </CardTitle>
        <CardDescription>
          Paste the Chartink output — plain symbols or the exported table both
          work. Entry is the scan-day close; target/SL come from your
          Preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Symbols</Label>
            <Textarea
              rows={5}
              placeholder={"WABAG\nINOXINDIA\nSOLARINDS\n…"}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Scan date</Label>
              <Input
                type="date"
                value={scanDate}
                onChange={(e) => setScanDate(e.target.value)}
                className="tabular"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Note (optional)
              </Label>
              <Input
                placeholder="filter name…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {symbols.length > 0 ? (
              <>
                <span className="text-foreground tabular">
                  {symbols.length}
                </span>{" "}
                symbols detected
              </>
            ) : (
              "No symbols yet"
            )}
          </span>
          <Button onClick={submit} disabled={mut.isPending} className="gap-2">
            <Radar className="size-4" />
            {mut.isPending ? "Tracking…" : "Track these"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
