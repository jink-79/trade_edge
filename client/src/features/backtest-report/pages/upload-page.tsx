import { UploadArchiveForm } from "../components/upload-archive-form";
import { ReportShell } from "../components/report-shell";
import { useBacktestReport } from "../hooks/use-backtest-report";

export function UploadPage() {
  const { versions, current, isLoading } = useBacktestReport();

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading report…</div>;
  }

  return (
    <ReportShell
      title="Upload a version"
      desc="Archive a past or one-off backtest run — XLSX + MD, the two artifacts BACKTEST_REPORT_SCHEMA.md requires"
      versions={versions}
      current={current}
    >
      <UploadArchiveForm />
    </ReportShell>
  );
}
