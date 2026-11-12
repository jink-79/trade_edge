import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  text: string;
}

// Empty state for screens that aren't built yet.
export function ComingSoon({ icon: Icon, text }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
