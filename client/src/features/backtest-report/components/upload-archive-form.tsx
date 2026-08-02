import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FileSpreadsheet, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Section } from "./report-shell";
import { useUploadArchive } from "../hooks/use-upload-archive";
import { STRATEGY, UNIVERSES, type ReportUniverse } from "../types/report.types";

function FileDrop({
  label,
  hint,
  accept,
  required,
  file,
  onChange,
  icon: Icon,
}: {
  label: string;
  hint: string;
  accept: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
  icon: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
          <div className="min-w-0 flex items-center gap-2">
            <Icon className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-[11px] text-muted-foreground tabular-nums">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onChange(null)}
            aria-label={`Remove ${file.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onChange(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            drag ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/50"
          }`}
        >
          <Icon className="size-5 mx-auto text-muted-foreground" />
          <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
    </div>
  );
}

/** Pulls just strategy_name/version/universe out of the MD frontmatter block
 * (between the leading `---` lines) — good enough to pre-fill the form so
 * nobody has to hand-transcribe them and risk a mismatch with what's
 * actually in the file (the backend rejects the upload if they disagree). */
function readFrontmatterHints(text: string): { strategyName?: string; version?: string; universe?: string } {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return {};
  const grab = (key: string) => {
    const m = block[1].match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
    return m?.[1]?.trim().replace(/^["']|["']$/g, "") || undefined;
  };
  return { strategyName: grab("strategy_name"), version: grab("version"), universe: grab("universe") };
}

export function UploadArchiveForm() {
  const navigate = useNavigate();
  const upload = useUploadArchive();

  const [strategyName, setStrategyName] = useState(STRATEGY);
  const [version, setVersion] = useState("");
  const [universe, setUniverse] = useState<ReportUniverse>("tracked");
  const [xlsx, setXlsx] = useState<File | null>(null);
  const [md, setMd] = useState<File | null>(null);
  const [csv, setCsv] = useState<File | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const canSubmit = strategyName.trim() && version.trim() && xlsx && md && !upload.isPending;

  const handleMdChange = async (f: File | null) => {
    setMd(f);
    if (!f) return;
    // Only strategy name/version come from the file — those are checked
    // against it server-side. Universe is your own filing choice (defaults
    // to "tracked"), not read from the MD, so a run documented as "fno" can
    // still be archived under "tracked" without a mismatch error.
    const hints = readFrontmatterHints(await f.text());
    if (hints.strategyName) setStrategyName(hints.strategyName);
    if (hints.version) setVersion(hints.version);
    if (hints.version) {
      toast.info("Pre-filled version from the MD frontmatter", {
        description: "Double-check it against the file before uploading — it must match exactly.",
      });
    }
  };

  const submit = () => {
    setErrorDetail(null);
    if (!strategyName.trim() || !version.trim()) {
      toast.error("Strategy name and version are required");
      return;
    }
    if (!xlsx || !md) {
      toast.error("Both the XLSX and MD files are required");
      return;
    }
    upload.mutate(
      { strategyName: strategyName.trim(), version: version.trim(), universe, xlsx, md, csv },
      {
        onSuccess: (report) => {
          toast.success(`Archived ${report.strategyName}-v${report.version} (${report.universe})`);
          setVersion("");
          setXlsx(null);
          setMd(null);
          setCsv(null);
          navigate(`/report/docs?v=${report.version}&u=${report.universe}`);
        },
        onError: (err) => {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setErrorDetail(message ?? "Upload failed — see the server log for details.");
          toast.error(message ?? "Upload failed");
        },
      },
    );
  };

  return (
    <Section
      title="Upload a version"
      desc="Archive a past or one-off backtest run — the two artifacts BACKTEST_REPORT_SCHEMA.md requires"
      icon={Upload}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="up-strategy">Strategy name</Label>
            <Input id="up-strategy" value={strategyName} onChange={(e) => setStrategyName(e.target.value)} placeholder="Pulse Breaker" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-version">Version</Label>
            <Input id="up-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 9" />
          </div>
          <div className="space-y-1.5">
            <Label>Universe</Label>
            <Select value={universe} onValueChange={(v) => setUniverse(v as ReportUniverse)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSES.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FileDrop
            label="Metrics workbook"
            hint="XLSX — Metrics, Symbol Scorecard, Trade Log, breakdown sheets"
            accept=".xlsx"
            required
            file={xlsx}
            onChange={setXlsx}
            icon={FileSpreadsheet}
          />
          <FileDrop
            label="Write-up"
            hint="MD — frontmatter (status/supersedes/date) + narrative"
            accept=".md"
            required
            file={md}
            onChange={handleMdChange}
            icon={FileText}
          />
          <FileDrop
            label="Trade log CSV"
            hint="Optional — preferred over the XLSX's own Trade Log sheet"
            accept=".csv"
            file={csv}
            onChange={setCsv}
            icon={FileSpreadsheet}
          />
        </div>

        {errorDetail && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">{errorDetail}</div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={submit} disabled={!canSubmit}>
            <Upload className="size-4" />
            {upload.isPending ? "Uploading…" : "Upload & archive"}
          </Button>
        </div>
      </div>
    </Section>
  );
}
