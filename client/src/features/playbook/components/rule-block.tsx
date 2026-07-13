import * as React from "react";
import { cn } from "@/lib/utils";

interface RuleBlockProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "success" | "primary" | "destructive";
}

const toneStyles = {
  success: "text-success",
  primary: "text-primary",
  destructive: "text-destructive",
};

export function RuleBlock({ icon, title, items, tone }: RuleBlockProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className={cn("mb-3 flex items-center gap-2", toneStyles[tone])}>
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90"
          >
            <span
              className={cn(
                "mt-1 size-1.5 shrink-0 rounded-full",
                tone === "success" && "bg-success",
                tone === "primary" && "bg-primary",
                tone === "destructive" && "bg-destructive",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
