import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Every tracked symbol whose trend flipped down today — not scoped to any
// one portfolio, since exit_signal() is a pure per-symbol read. TradeEdge's
// own newsletter/journal intersect this against a user's actual holdings;
// here it's shown as the full scan result.
export function AlgoSignalsExits({ exits }: { exits: string[] }) {
  return (
    <Card className="border-border/70 bg-card/70" style={{ boxShadow: "var(--shadow-card)" }}>
      <CardHeader>
        <CardTitle className="text-base" style={{ fontFamily: "var(--font-display)" }}>
          Exits · {exits.length} signalled
        </CardTitle>
        <CardDescription>Tracked symbols whose trend flipped down today.</CardDescription>
      </CardHeader>
      <CardContent>
        {exits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No exits signalled today.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exits.map((symbol) => (
                  <TableRow key={symbol}>
                    <TableCell className="font-medium">{symbol}</TableCell>
                    <TableCell className="text-right">
                      <span className="rounded-md px-2 py-0.5 text-[11px] ring-1 bg-destructive/12 text-destructive ring-destructive/25">
                        SELL
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
