import type { ReactNode } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { AlertCircle, Database, Radio, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STRATEGY, UNIVERSES, type DocStatus, type ReportUniverse, type VersionRef } from "../types/report.types";
import { useReportSelection } from "../hooks/use-report-selection";
import { useDeleteArchive } from "../hooks/use-delete-archive";

// Ported from a Lovable-style prototype (originally @tanstack/react-router +
// a component at @/components/layout/AppSidebar, neither of which exist in
// this app) — router calls swapped for react-router-dom, and the sidebar
// dropped since AppLayout (src/layouts/app-layout.tsx) already renders one
// for every route.

const TABS = [
  { to: "/report/metrics", label: "Metrics & graphs" },
  { to: "/report/blotter", label: "Week-wise blotter" },
  { to: "/report/stocks", label: "Stock performance" },
  { to: "/report/docs", label: "Documentation" },
  { to: "/report/upload", label: "Upload" },
];

const statusTone: Record<DocStatus, string> = {
  adopted: "bg-primary/12 text-primary ring-primary/25",
  rejected: "bg-destructive/12 text-destructive ring-destructive/25",
  superseded: "bg-muted text-muted-foreground ring-border",
  diagnostic: "bg-accent/60 text-foreground ring-border",
};

export function StatusBadge({ status }: { status: DocStatus | null }) {
  if (!status) return <span className="rounded-md px-2 py-0.5 text-[11px] bg-muted text-muted-foreground ring-1 ring-border">unknown</span>;
  return <span className={`rounded-md px-2 py-0.5 text-[11px] capitalize ring-1 ${statusTone[status]}`}>{status}</span>;
}

export function SourceChip({ source }: { source: "live" | "archive" }) {
  const live = source === "live";
  const Icon = live ? Radio : Database;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] ring-1 ${
        live ? "bg-primary/12 text-primary ring-primary/25" : "bg-accent/60 text-muted-foreground ring-border"
      }`}
    >
      <Icon className="size-3" />
      {live ? "Live courier pipeline" : "Uploaded archive"}
    </span>
  );
}

export function VersionSelector({ versions }: { versions: VersionRef[] }) {
  const { version, universe } = useReportSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const del = useDeleteArchive();
  const activeVersion = version || versions[0]?.version || "";

  const go = (patch: { v?: string; u?: ReportUniverse }) => {
    const next = new URLSearchParams(searchParams);
    if (patch.v !== undefined) next.set("v", patch.v);
    if (patch.u !== undefined) next.set("u", patch.u);
    setSearchParams(next);
  };

  // The version actually selected — only uploaded archives can be deleted
  // (live courier variants aren't stored rows you can remove here).
  const selected =
    versions.find((v) => v.version === activeVersion && v.universe === universe) ??
    versions.find((v) => v.version === activeVersion);
  const canDelete = selected?.source === "archive";

  const onDelete = () => {
    if (!selected) return;
    if (!window.confirm(
      `Delete ${STRATEGY.toLowerCase().replace(/\s+/g, "-")}-v${selected.version} (${selected.universe})?\n\n` +
        "This permanently removes the uploaded report, its symbol scorecard and its trade log. This cannot be undone.",
    )) return;
    del.mutate(
      { strategyName: STRATEGY, version: selected.version, universe: selected.universe },
      {
        onSuccess: () => {
          toast.success(`Deleted ${STRATEGY}-v${selected.version} (${selected.universe})`);
          const next = new URLSearchParams(searchParams);
          next.delete("v"); // fall back to the default selection
          setSearchParams(next);
        },
        onError: (e) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
          toast.error(msg ?? "Delete failed");
        },
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={activeVersion} onValueChange={(val) => go({ v: val })} disabled={!versions.length}>
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder={versions.length ? "Select version" : "No versions yet"} />
        </SelectTrigger>
        <SelectContent>
          {versions.map((ver) => (
            <SelectItem key={ver.key} value={ver.version}>
              <span className="font-mono text-[13px]">
                {STRATEGY.toLowerCase().replace(/\s+/g, "-")}-v{ver.version}
              </span>
              <span className="ml-2 text-xs text-muted-foreground capitalize">{ver.status ?? ver.source}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={universe} onValueChange={(val) => go({ u: val as ReportUniverse })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UNIVERSES.map((uni) => (
            <SelectItem key={uni.id} value={uni.id}>
              {uni.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canDelete && (
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          disabled={del.isPending}
          title="Delete this uploaded version"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function ReportShell({
  title,
  desc,
  action,
  versions,
  current,
  children,
}: {
  title: string;
  desc: string;
  action?: ReactNode;
  versions: VersionRef[];
  current: VersionRef | null;
  children: ReactNode;
}) {
  const { version, universe } = useReportSelection();

  return (
    <div className="min-w-0">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="h-16 flex items-center justify-between gap-4 px-8">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold tracking-tight truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <VersionSelector versions={versions} />
            {action}
          </div>
        </div>
        <div className="px-8 pb-3 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={`${t.to}?v=${current?.version ?? version}&u=${universe}`}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-accent/60 text-foreground ring-1 ring-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {current && (
              <>
                <span className="font-mono text-xs text-muted-foreground">
                  {STRATEGY.toLowerCase().replace(/\s+/g, "-")}-v{current.version} · {current.universe}
                </span>
                <StatusBadge status={current.status} />
                <SourceChip source={current.source} />
              </>
            )}
          </div>
        </div>
      </header>
      <div className="p-8 space-y-6 max-w-[1500px]">{children}</div>
    </div>
  );
}

export function Section({
  title,
  desc,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  desc?: string;
  icon: React.ElementType;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="size-9 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30 shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function NotAvailable({ label = "Not available", hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-dashed border-border/70 bg-background/30 px-4 py-3">
      <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  tone = "default",
  hint,
  title,
}: {
  label: string;
  value: string;
  tone?: "default" | "pos" | "neg";
  hint?: string;
  title?: string;
}) {
  const unavailable = value === "Not available";
  const color = unavailable
    ? "text-muted-foreground/70"
    : tone === "pos"
      ? "text-primary"
      : tone === "neg"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div
        title={title}
        className={`mt-1 font-display font-semibold tabular-nums truncate ${unavailable ? "text-xs" : "text-lg"} ${color}`}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
