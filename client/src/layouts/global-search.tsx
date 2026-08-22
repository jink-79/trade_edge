import { useNavigate } from "react-router-dom";
import { CheckCircle2, TrendingUp } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useJournalTrades } from "@/features/journal/hooks/use-journal";
import { fmtPrice, fmtSignedINR } from "@/features/journal/utils/journal-utils";
import { NAV_ITEMS } from "./side-bar";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: trades = [] } = useJournalTrades();

  const openTrades = trades.filter((t) => t.outcome === "STILL-OPEN");
  const closedTrades = trades.filter((t) => t.outcome !== "STILL-OPEN");

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a page or a trade"
    >
      <CommandInput placeholder="Search trades, tickers, pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.path} value={item.label} onSelect={() => go(item.path)}>
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {openTrades.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Open positions">
              {openTrades.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.entry.ticker} ${t.entry.sector ?? ""}`}
                  onSelect={() => go(`/trades/${t.id}`)}
                >
                  <TrendingUp className="size-4 text-primary" />
                  <span>{t.entry.ticker}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {fmtPrice(t.entry.entryPrice)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {closedTrades.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Closed trades">
              {closedTrades.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.entry.ticker} ${t.entry.sector ?? ""}`}
                  onSelect={() => go(`/trades/${t.id}`)}
                >
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  <span>{t.entry.ticker}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {t.exit ? fmtSignedINR(t.exit.netPnlAmount ?? 0) : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
