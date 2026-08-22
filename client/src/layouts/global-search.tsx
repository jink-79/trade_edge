import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command as CommandPrimitive } from "cmdk";
import { CheckCircle2, Command, Search, TrendingUp } from "lucide-react";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useJournalTrades } from "@/features/journal/hooks/use-journal";
import { fmtPrice, fmtSignedINR } from "@/features/journal/utils/journal-utils";

const RECENT_LIMIT = 8;

/** Inline dropdown search anchored under the top-bar input — not a modal.
 * Opens on click or ⌘K/Ctrl+K from anywhere. Uses cmdk's raw primitive (not
 * the shadcn CommandInput wrapper) so the top-bar pill styling stays exact.
 *
 * Open is driven solely by PopoverTrigger's own click handling (don't also
 * toggle it from onFocus) — doing both raced Radix's controlled-open state
 * and needed two clicks before it would stick open. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: trades = [] } = useJournalTrades();

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  const recentOpenTrades = useMemo(
    () =>
      trades
        .filter((t) => t.outcome === "STILL-OPEN")
        .sort((a, b) => new Date(b.entry.entryDate).getTime() - new Date(a.entry.entryDate).getTime())
        .slice(0, RECENT_LIMIT),
    [trades],
  );

  const recentClosedTrades = useMemo(
    () =>
      trades
        .filter((t) => t.outcome !== "STILL-OPEN")
        .sort(
          (a, b) =>
            new Date(b.exit?.exitDate ?? 0).getTime() - new Date(a.exit?.exitDate ?? 0).getTime(),
        )
        .slice(0, RECENT_LIMIT),
    [trades],
  );

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <CommandPrimitive className="relative flex-1 max-w-md bg-transparent" shouldFilter>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <CommandPrimitive.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search trades, tickers…"
              className="h-9 w-full rounded-md bg-secondary/50 border border-border/60 pl-9 pr-16 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Command className="size-3" />K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[70vh] overflow-hidden"
        >
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {recentOpenTrades.length > 0 && (
              <CommandGroup heading="Recent open positions">
                {recentOpenTrades.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`${t.entry.ticker} ${t.entry.sector ?? ""}`}
                    onSelect={() => go(`/trades/${t.id}`)}
                  >
                    <TrendingUp className="size-4 text-primary shrink-0" />
                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                      <span className="truncate">{t.entry.ticker}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {fmtPrice(t.entry.entryPrice)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recentOpenTrades.length > 0 && recentClosedTrades.length > 0 && <CommandSeparator />}

            {recentClosedTrades.length > 0 && (
              <CommandGroup heading="Recent closed trades">
                {recentClosedTrades.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`${t.entry.ticker} ${t.entry.sector ?? ""}`}
                    onSelect={() => go(`/trades/${t.id}`)}
                  >
                    <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                      <span className="truncate">{t.entry.ticker}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {t.exit ? fmtSignedINR(t.exit.netPnlAmount ?? 0) : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </CommandPrimitive>
    </Popover>
  );
}
