import { ArrowUpRight, BookOpen, FileText, GitCompare, ScrollText, ShieldCheck, Target } from "lucide-react";
import { Metric, NotAvailable, ReportShell, Section, StatusBadge } from "../components/report-shell";
import { useBacktestReport } from "../hooks/use-backtest-report";
import { STRATEGY, pct, num, weeks } from "../types/report.types";

/** Minimal inline renderer for the **bold** / paragraph subset used in MD bodies. */
function Body({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {text.split("\n").map((line, i) => (
        <p key={i}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") ? (
              <strong key={j} className="text-foreground font-medium">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export function DocumentationPage() {
  const { versions, current, metrics, doc, isLoading } = useBacktestReport();

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading report…</div>;
  }

  const results = metrics
    ? [
        { label: "CAGR", value: pct(metrics.cagrPct) },
        { label: "Max Drawdown", value: pct(metrics.maxDrawdownPct) },
        { label: "Sharpe", value: num(metrics.sharpe) },
        { label: "Calmar", value: num(metrics.calmar) },
        { label: "Win Rate", value: pct(metrics.winRatePct, 1) },
        { label: "Profit Factor", value: num(metrics.profitFactor) },
        { label: "Total Trades", value: metrics.totalTrades != null ? String(metrics.totalTrades) : "Not available" },
        { label: "Avg Hold", value: weeks(metrics.avgHoldWeeks) },
      ]
    : [];

  return (
    <ReportShell
      title="Documentation"
      desc="The version write-up: what changed, why, results, validation and decision"
      versions={versions}
      current={current}
    >
      <Section title="Frontmatter" desc="Parsed from the version's markdown header" icon={FileText}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="font-mono text-sm">
            {STRATEGY.toLowerCase().replace(/\s+/g, "-")}-v{current?.version ?? "—"}
          </span>
          <StatusBadge status={doc?.status ?? null} />
          {doc?.supersedes && (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              supersedes v{doc.supersedes} <ArrowUpRight className="size-3" />
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Metric label="Strategy" value={STRATEGY} />
          <Metric label="Version" value={current?.version ?? "Not available"} />
          <Metric label="Universe" value={current?.universe ?? "Not available"} />
          <Metric label="Status" value={doc?.status ?? "Not available"} />
          <Metric label="Supersedes" value={doc?.supersedes ? `v${doc.supersedes}` : "Not available"} />
          <Metric label="Date" value={doc?.date ?? "Not available"} />
        </div>
      </Section>

      {!doc?.body ? (
        <NotAvailable
          label={current?.source === "live" ? "Not documented yet" : "No documentation uploaded for this version"}
          hint={
            current?.source === "live"
              ? "Live courier variants don't carry an MD write-up — that's an archive-upload concept."
              : undefined
          }
        />
      ) : (
        <>
          <Section title="What changed / why / validation / decision" desc="Raw markdown, rendered as-is" icon={GitCompare}>
            <Body text={doc.body} />
          </Section>

          <Section title="Results" desc="Key metrics, enough to read standalone" icon={Target}>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              {results.map((r) => (
                <Metric key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
          </Section>

          <div className="grid xl:grid-cols-2 gap-6">
            <Section title="Validation" desc="Friction / survivorship / OOS gauntlet" icon={ShieldCheck}>
              <p className="text-sm text-muted-foreground">See the write-up above — validation isn't a separate structured field yet.</p>
            </Section>
            <Section title="Decision" desc="Adopted, rejected or superseded — and the reasoning" icon={ScrollText}>
              <p className="text-sm text-muted-foreground">See the write-up above and the Status badge.</p>
            </Section>
          </div>
        </>
      )}

      <Section title="About this page" icon={BookOpen}>
        <p className="text-sm text-muted-foreground">
          The MD template's What Changed / Why / Results / Validation / Decision sections are stored as one raw
          markdown body (not re-parsed into separate fields) — rendered together above.
        </p>
      </Section>
    </ReportShell>
  );
}
