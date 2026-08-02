import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Camera,
  CheckCircle2,
  ChevronRight,
  Hash,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  NotebookPen,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Trade Notes & Screenshots — post-trade review journal.
 *
 * Local-state only for now (no backend module yet): notes, tags, ratings and
 * screenshots (object URLs) live in this component and are lost on refresh.
 * Wire to a real backend later if this proves useful enough to keep.
 */

/* ---------- types ---------- */

type Screenshot = {
  id: string;
  url: string;
  caption: string;
  kind: "entry" | "exit" | "setup" | "chart";
};

type Trade = {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  side: "LONG" | "SHORT";
  qty: number;
  entry: number;
  exit: number | null;
  date: string;
  timeframe: string;
  pnl: number | null;
  rating: number; // 0-5
  pinned: boolean;
  notes: string;
  tags: string[];
  screenshots: Screenshot[];
};

/* ---------- seed ---------- */

const seed: Trade[] = [
  {
    id: "t1",
    symbol: "SOLARINDS",
    name: "Solar Industries India",
    sector: "Industrials",
    side: "LONG",
    qty: 5,
    entry: 9340,
    exit: 9980,
    date: "2026-05-28",
    timeframe: "Swing",
    pnl: 3200,
    rating: 4,
    pinned: true,
    tags: ["breakout", "ATH", "defence"],
    notes:
      "**Thesis:** Sector tailwind from defence capex; clean cup-and-handle breakout on weekly with above-avg volume.\n\n**Execution:** Entry triggered on the retest of the 9340 pivot. Risked 1R below the handle low. Trailed on the 9EMA daily — exited when price closed below trail.\n\n**Lessons:** Be more patient — I took partials too early. The full target was 10,300.",
    screenshots: [],
  },
  {
    id: "t2",
    symbol: "PERSISTENT",
    name: "Persistent Systems",
    sector: "IT",
    side: "LONG",
    qty: 12,
    entry: 4120,
    exit: 4480,
    date: "2026-05-22",
    timeframe: "Positional",
    pnl: 4320,
    rating: 5,
    pinned: false,
    tags: ["sector-rotation", "midcap-IT"],
    notes:
      "Clean stage-2 setup. Bought the pullback to 20EMA after the IT index broke a 6-month downtrend. Held through one shakeout — thesis stayed intact.",
    screenshots: [],
  },
  {
    id: "t3",
    symbol: "DIVISLAB",
    name: "Divi's Laboratories",
    sector: "Pharma",
    side: "SHORT",
    qty: 8,
    entry: 6020,
    exit: 5860,
    date: "2026-06-10",
    timeframe: "Swing",
    pnl: 1280,
    rating: 3,
    pinned: false,
    tags: ["failed-breakout", "short"],
    notes:
      "Short on failed breakout — entered on close below the breakout level. Decent execution, but sized too small relative to the conviction.",
    screenshots: [],
  },
  {
    id: "t4",
    symbol: "TATAPOWER",
    name: "Tata Power",
    sector: "Utilities",
    side: "LONG",
    qty: 40,
    entry: 482,
    exit: null,
    date: "2026-06-04",
    timeframe: "Positional",
    pnl: null,
    rating: 0,
    pinned: false,
    tags: ["open", "renewables"],
    notes:
      "Stage-2 base on weekly. Holding for a multi-month move; trailing 9EMA on daily.",
    screenshots: [],
  },
];

/* ---------- helpers ---------- */

const fmtInr = (n: number) =>
  `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const kindColor: Record<Screenshot["kind"], string> = {
  entry: "bg-primary/15 text-primary border-primary/30",
  exit: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  setup: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  chart: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

/* ---------- page ---------- */

export function TradeNotesPage() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>(seed);
  const [selectedId, setSelectedId] = useState<string>(seed[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "withNotes" | "withScreens" | "pinned">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = trades.find((t) => t.id === selectedId) ?? trades[0];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return trades
      .filter((t) => {
        if (filter === "withNotes" && !t.notes.trim()) return false;
        if (filter === "withScreens" && t.screenshots.length === 0) return false;
        if (filter === "pinned" && !t.pinned) return false;
        if (!q) return true;
        return (
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [trades, search, filter]);

  function update(patch: Partial<Trade>) {
    setTrades((all) => all.map((t) => (t.id === selected.id ? { ...t, ...patch } : t)));
  }

  function addScreenshots(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, 8);
    const created: Screenshot[] = arr.map((f, i) => ({
      id: `s${Date.now()}_${i}`,
      url: URL.createObjectURL(f),
      caption: f.name.replace(/\.[^.]+$/, ""),
      kind: "chart",
    }));
    update({ screenshots: [...selected.screenshots, ...created] });
    toast.success(`${created.length} screenshot${created.length === 1 ? "" : "s"} added`);
  }

  function removeScreenshot(id: string) {
    update({ screenshots: selected.screenshots.filter((s) => s.id !== id) });
  }

  function setKind(id: string, kind: Screenshot["kind"]) {
    update({
      screenshots: selected.screenshots.map((s) => (s.id === id ? { ...s, kind } : s)),
    });
  }

  function setCaption(id: string, caption: string) {
    update({
      screenshots: selected.screenshots.map((s) => (s.id === id ? { ...s, caption } : s)),
    });
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || selected.tags.includes(t)) return;
    update({ tags: [...selected.tags, t] });
  }

  function removeTag(tag: string) {
    update({ tags: selected.tags.filter((t) => t !== tag) });
  }

  function setRating(r: number) {
    update({ rating: r === selected.rating ? 0 : r });
  }

  function save() {
    toast.success("Review saved", { description: `${selected.symbol} · journal updated (local only — not persisted yet)` });
  }

  function wrapSelection(prefix: string, suffix = prefix) {
    const el = document.getElementById("notes-area") as HTMLTextAreaElement | null;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const v = selected.notes;
    const next = v.slice(0, s) + prefix + v.slice(s, e) + suffix + v.slice(e);
    update({ notes: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + prefix.length, e + prefix.length);
    });
  }

  return (
    <div className="min-w-0">
      {/* topbar */}
      <div className="h-16 border-b border-border/60 bg-background/60 backdrop-blur-xl sticky top-0 z-20 flex items-center px-6 lg:px-10 gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2 text-sm">
          <NotebookPen className="size-4 text-primary" />
          <span className="font-medium">Trade Notes & Screenshots</span>
          <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-[0.18em]">
            Journal
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="gap-2" onClick={save}>
            <CheckCircle2 className="size-4" />
            Save review
          </Button>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Post-trade Review
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Every trade tells a story — write it down.
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Attach charts, capture your thesis, rate the execution. The trades that taught you
            the most should be the easiest to revisit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* trade list */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl h-fit lg:sticky lg:top-24">
            <CardHeader className="border-b border-border/60 space-y-3">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by symbol, tag, note…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-background/60"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { k: "all", l: "All" },
                    { k: "pinned", l: "Pinned" },
                    { k: "withNotes", l: "Notes" },
                    { k: "withScreens", l: "Charts" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setFilter(f.k)}
                    className={cn(
                      "text-[11px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-md border transition-colors",
                      filter === f.k
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/40",
                    )}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[640px] overflow-y-auto">
              {filtered.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  No trades match your filters.
                </div>
              )}
              {filtered.map((t) => {
                const active = t.id === selected.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border/40 last:border-0 transition-colors flex items-start gap-3",
                      active ? "bg-accent/60" : "hover:bg-accent/30",
                    )}
                  >
                    <div
                      className={cn(
                        "size-9 rounded-lg grid place-items-center text-[10px] font-bold tracking-wider ring-1",
                        t.side === "LONG"
                          ? "bg-primary/15 text-primary ring-primary/30"
                          : "bg-destructive/15 text-destructive ring-destructive/30",
                      )}
                    >
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{t.symbol}</span>
                        {t.pinned && <Pin className="size-3 text-primary" />}
                        {t.screenshots.length > 0 && (
                          <ImageIcon className="size-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{t.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {t.date}
                        </span>
                        {t.pnl !== null && (
                          <span
                            className={cn(
                              "text-[11px] tabular-nums font-medium",
                              t.pnl >= 0 ? "text-primary" : "text-destructive",
                            )}
                          >
                            {t.pnl >= 0 ? "+" : "−"}
                            {fmtInr(t.pnl)}
                          </span>
                        )}
                        {t.pnl === null && (
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.14em] py-0 h-4">
                            Open
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={cn("size-4 mt-1 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* editor */}
          <div className="space-y-6 min-w-0">
            {/* header */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div
                    className={cn(
                      "size-14 rounded-xl grid place-items-center font-bold tracking-wider ring-1",
                      selected.side === "LONG"
                        ? "bg-primary/15 text-primary ring-primary/30"
                        : "bg-destructive/15 text-destructive ring-destructive/30",
                    )}
                  >
                    {selected.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-xl font-semibold tracking-tight">
                        {selected.symbol}
                      </h2>
                      <span className="text-sm text-muted-foreground">— {selected.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase tracking-[0.14em] gap-1",
                          selected.side === "LONG" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive",
                        )}
                      >
                        {selected.side === "LONG" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {selected.side}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selected.sector} · {selected.timeframe} · {selected.date}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                      <Metric label="Qty" value={selected.qty.toString()} />
                      <Metric label="Entry" value={fmtInr(selected.entry)} />
                      <Metric label="Exit" value={selected.exit !== null ? fmtInr(selected.exit) : "—"} />
                      <Metric
                        label="P&L"
                        value={selected.pnl !== null ? `${selected.pnl >= 0 ? "+" : "−"}${fmtInr(selected.pnl)}` : "Open"}
                        tone={selected.pnl === null ? "muted" : selected.pnl >= 0 ? "pos" : "neg"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selected.pinned ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => update({ pinned: !selected.pinned })}
                    >
                      <Pin className="size-4" />
                      {selected.pinned ? "Pinned" : "Pin"}
                    </Button>
                    <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-background/50 px-2 py-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button key={r} onClick={() => setRating(r)} className="p-0.5">
                          <Star
                            className={cn(
                              "size-4 transition-colors",
                              r <= selected.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400/60",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* notes editor */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardHeader className="border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <NotebookPen className="size-4 text-primary" />
                    Review & notes
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <FormatBtn onClick={() => wrapSelection("**")} icon={Bold} label="Bold" />
                    <FormatBtn onClick={() => wrapSelection("_")} icon={Italic} label="Italic" />
                    <FormatBtn onClick={() => wrapSelection("\n- ", "")} icon={List} label="List" />
                    <FormatBtn onClick={() => wrapSelection("[", "](url)")} icon={Link2} label="Link" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <Textarea
                  id="notes-area"
                  value={selected.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder="Write your thesis, what went well, what you'd do differently…"
                  className="min-h-[260px] resize-y bg-background/40 leading-relaxed font-mono text-[13px]"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
                      <Tag className="size-3" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-1.5 min-h-[34px]">
                      {selected.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/40 border border-border/60 text-xs">
                          <Hash className="size-3 text-muted-foreground" />
                          {t}
                          <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-destructive">
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <TagInput onAdd={addTag} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Suggested tags
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {["breakout", "trend-follow", "reversal", "earnings", "fomo", "hesitation"].map((s) => (
                        <button
                          key={s}
                          onClick={() => addTag(s)}
                          className="text-[11px] px-2 py-1 rounded-md border border-dashed border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* screenshots */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardHeader className="border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Camera className="size-4 text-primary" />
                    Screenshots
                    <Badge variant="outline" className="text-[10px]">
                      {selected.screenshots.length}
                    </Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                    <Plus className="size-4" />
                    Add chart
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addScreenshots(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selected.screenshots.length === 0 ? (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-2xl border border-dashed border-border/80 hover:border-primary/50 hover:bg-accent/30 p-12 text-center transition-all"
                  >
                    <div className="mx-auto size-12 rounded-xl bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                      <Upload className="size-5 text-primary" />
                    </div>
                    <div className="mt-4 font-medium">Drop chart screenshots</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Entry, exit, setup, daily/weekly context — anything that helps the review
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selected.screenshots.map((s) => (
                      <div key={s.id} className="group rounded-xl overflow-hidden border border-border/70 bg-background/40">
                        <div className="relative aspect-[16/10] bg-muted/40 overflow-hidden">
                          <img
                            src={s.url}
                            alt={s.caption}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {(["entry", "exit", "setup", "chart"] as const).map((k) => (
                              <button
                                key={k}
                                onClick={() => setKind(s.id, k)}
                                className={cn(
                                  "text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border backdrop-blur-sm transition-colors",
                                  s.kind === k ? kindColor[k] : "bg-background/70 border-border/60 text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {k}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => removeScreenshot(s.id)}
                            className="absolute top-2 right-2 size-7 rounded-md grid place-items-center bg-background/70 border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 backdrop-blur-sm"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="p-3">
                          <Input
                            value={s.caption}
                            onChange={(e) => setCaption(s.id, e.target.value)}
                            placeholder="Add caption…"
                            className="h-8 bg-background/60 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "pos" | "neg" | "muted";
}) {
  return (
    <div className="leading-tight">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-medium tabular-nums",
          tone === "pos" && "text-primary",
          tone === "neg" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FormatBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="size-8 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
    >
      <Icon className="size-4" />
    </button>
  );
}

function TagInput({ onAdd }: { onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(v);
            setV("");
          }
        }}
        placeholder="Add tag, hit Enter…"
        className="h-8 bg-background/60 text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        onClick={() => {
          onAdd(v);
          setV("");
        }}
      >
        Add
      </Button>
    </div>
  );
}
