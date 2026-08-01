import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileUp,
  Gauge,
  LineChart as LineIcon,
  ListChecks,
  Shield,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBatch, useUploadSignals } from "@/features/scanner/hooks/use-scanner";
import { usePerformance } from "@/features/performance/hooks/use-performance";
import { usePreferences } from "@/features/preferences/hooks/use-preferences";
import { PulseMetricsView } from "@/features/pulse/components/pulse-metrics";
import {
  equitySeries,
  monthlyReturns,
  parseChartinkCsv,
  statSections,
  type Stat,
} from "@/features/signals/utils/signals-format";

function Section({
  title,
  desc,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="size-9 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30 shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Metric({ label, value, tone = "default", hint }: {
  label: string;
  value: string;
  tone?: "default" | "pos" | "neg";
  hint?: string;
}) {
  const color =
    tone === "pos" ? "text-primary" : tone === "neg" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg font-semibold tabular ${color}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

const Metrics = ({ items }: { items: Stat[] }) => (
  <>
    {items.map((s) => (
      <Metric key={s.l} label={s.l} value={s.v} tone={s.t} hint={s.hint} />
    ))}
  </>
);

function Rsi2SignalsPage() {
  const [list, setList] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [scanName, setScanName] = useState("all-cash");
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createMut = useCreateBatch();
  const uploadMut = useUploadSignals();
  const { data: perf } = usePerformance();

  const equity = useMemo(() => (perf ? equitySeries(perf) : []), [perf]);
  const monthly = useMemo(() => (perf ? monthlyReturns(perf) : []), [perf]);
  const stats = perf?.metrics ? statSections(perf.metrics) : null;

  const parsed = useMemo(
    () =>
      list
        .split(/[\n,]/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [list],
  );

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    setFiles((p) => [...p, ...Array.from(fl)]);
  };

  const scan = () => scanName.trim() || "all-cash";

  const savePaste = () => {
    if (!parsed.length) {
      toast.error("Paste at least one symbol");
      return;
    }
    createMut.mutate(
      { scanDate: date, symbols: parsed, scanName: scan(), note: note || undefined },
      {
        onSuccess: (r) => {
          toast.success(`Tracking ${r.tracked} signals for ${date} · ${scan()}`);
          setList("");
          setNote("");
        },
      },
    );
  };

  const uploadFiles = async () => {
    if (!files.length) {
      toast.error("Add a file first");
      return;
    }
    for (const f of files) {
      const text = await f.text();
      const { rows } = parseChartinkCsv(text);
      if (!rows.length) {
        toast.error(`${f.name}: couldn't read Date/Symbol columns`);
        continue;
      }
      uploadMut.mutate(
        { rows, scanName: scan(), note: f.name },
        {
          onSuccess: (r) =>
            toast.success(`${f.name}: ${r.rows} rows · ${r.newSignals} new · ${r.dates} dates · ${scan()}`),
          onError: () => toast.error(`${f.name}: upload failed`),
        },
      );
    }
    setFiles([]);
  };

  return (
    <div className="min-w-0">
      <header className="h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">Signals</h1>
          <p className="text-xs text-muted-foreground">
            Log daily signal lists and track how the system performs
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/signal-results">
            <ListChecks className="size-4" /> Stock-wise results
          </Link>
        </Button>
      </header>

      <div className="p-8 space-y-6 max-w-[1400px]">
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6">
          <Section title="Today's signal list" desc="Paste symbols separated by comma or new line" icon={Sparkles}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sig-date">Signal date</Label>
                  <Input id="sig-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Symbols detected</Label>
                  <div className="h-9 rounded-md border border-border/60 bg-background/40 px-3 flex items-center text-sm tabular">
                    {parsed.length}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sig-list">Stocks list</Label>
                <Textarea
                  id="sig-list"
                  rows={7}
                  value={list}
                  onChange={(e) => setList(e.target.value)}
                  placeholder={"SOLARINDS\nPOLYCAB\nCDSL, KAYNES"}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sig-note">Note</Label>
                <Textarea
                  id="sig-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Market context, filters used, anything worth remembering…"
                />
              </div>
              {parsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {parsed.map((s, i) => (
                    <span key={`${s}-${i}`} className="rounded-md bg-primary/10 ring-1 ring-primary/25 px-2 py-0.5 text-[11px] font-mono text-primary">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button onClick={savePaste} disabled={createMut.isPending}>
                  <CheckCircle2 className="size-4" /> Save signals
                </Button>
                <Button variant="ghost" onClick={() => { setList(""); setNote(""); setFiles([]); }}>
                  Clear
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Bulk upload" desc="Drop Chartink CSV files (Date, Symbol, Marketcap, Sector)" icon={FileUp}>
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="scan-name">Scan name</Label>
              <Input
                id="scan-name"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder="e.g. fno, cash-no-smallcap"
              />
              <p className="text-[11px] text-muted-foreground">
                Labels this batch (paste + files) so you can compare scans — e.g.
                <span className="text-foreground"> fno</span> vs
                <span className="text-foreground"> cash-no-smallcap</span>.
              </p>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                drag ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/50"
              }`}
            >
              <Upload className="size-6 mx-auto text-primary" />
              <div className="mt-3 text-sm font-medium">Drop files here or click to browse</div>
              <p className="text-xs text-muted-foreground mt-1">
                Expected columns: Date, Symbol, Marketcap, Sector
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>
            <div className="mt-4 space-y-2">
              {files.length === 0 && <p className="text-xs text-muted-foreground">No files queued yet.</p>}
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground tabular">{(f.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setFiles((p) => p.filter((_, j) => j !== i)); }}
                    aria-label={`Remove ${f.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            {files.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button onClick={uploadFiles} disabled={uploadMut.isPending}>
                  <Upload className="size-4" />
                  {uploadMut.isPending
                    ? "Uploading…"
                    : `Upload & track ${files.length} file${files.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            )}
          </Section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Strategy vs Nifty 50" desc="Paper equity, 1% risk per trade" icon={LineIcon}>
            <div className="h-[260px]">
              {equity.length < 2 ? (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  Runs the backtest (courier) to populate.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equity}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={30} />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={52} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="strategy" stroke="var(--primary)" fill="url(#sg)" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="nifty" stroke="var(--muted-foreground)" strokeWidth={1.5} dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>

          <Section title="Monthly returns" desc="% per month" icon={BarChart3}>
            <div className="h-[260px]">
              {monthly.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">No monthly data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={40} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.3 }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="r" radius={[6, 6, 0, 0]}>
                      {monthly.map((d) => (
                        <Cell key={d.m} fill={d.r >= 0 ? "var(--primary)" : "var(--destructive)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>
        </div>

        {stats ? (
          <>
            <Section title="Returns" desc="Headline performance of the signal book" icon={TrendingUp}>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <Metrics items={stats.returns} />
              </div>
            </Section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Section title="Risk" icon={Shield}>
                <div className="grid grid-cols-2 gap-3"><Metrics items={stats.risk} /></div>
              </Section>
              <Section title="Performance" icon={Gauge}>
                <div className="grid grid-cols-2 gap-3"><Metrics items={stats.perf} /></div>
              </Section>
            </div>

            <Section title="Trade stats" desc="Across all generated signals" icon={Target}>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <Metrics items={stats.trades} />
              </div>
            </Section>

            <Section title="Robustness" desc="Out-of-sample consistency checks" icon={Activity}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metrics items={stats.robust} />
              </div>
            </Section>
          </>
        ) : (
          <Section title="Backtest metrics" desc="Populated by the courier's backtest.py" icon={TrendingUp}>
            <p className="text-sm text-muted-foreground">
              No backtest yet. Run the courier's <code className="text-foreground">backtest.py</code> to see
              returns, risk, performance and trade stats here.
            </p>
          </Section>
        )}

        <div className="pb-4">
          <Button asChild variant="outline">
            <Link to="/signal-results">
              <CalendarDays className="size-4" /> View day-by-day stock results
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Strategy-aware entry point: Pulse shows the v10 dashboard; otherwise the RSI_2
// (Chartink) signal lab above. The wrapper only calls usePreferences so hook
// order stays stable across strategy switches.
export function SignalsPage() {
  const { data: prefs, isLoading } = usePreferences();
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (prefs?.activeStrategy === "pulse") return <PulseMetricsView />;
  return <Rsi2SignalsPage />;
}
