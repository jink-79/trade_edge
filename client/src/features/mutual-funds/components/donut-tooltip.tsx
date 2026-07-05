import { fmtINR } from "../utils/mutual-funds-utils";

interface TooltipPayloadPoint {
  name: string;
  value: number;
  payload: {
    color: string;
  };
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadPoint[];
}

export function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md px-3 py-2 shadow-xl text-xs">
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-sm"
          style={{ background: payload[0].payload.color }}
        />
        <span className="text-muted-foreground">{payload[0].name}</span>
        <span className="ml-2 tabular text-foreground font-medium">
          {fmtINR(payload[0].value)}
        </span>
      </div>
    </div>
  );
}
