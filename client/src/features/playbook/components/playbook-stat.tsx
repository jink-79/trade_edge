import { cn } from "@/lib/utils";

interface PlaybookStatProps {
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive" | "muted";
}

const toneStyles = {
  default: "text-foreground",
  success: "text-success",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export function PlaybookStat({
  label,
  value,
  tone = "default",
}: PlaybookStatProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold",
          toneStyles[tone],
        )}
      >
        {value}
      </p>
    </div>
  );
}
