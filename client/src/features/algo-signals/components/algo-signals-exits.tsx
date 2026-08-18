import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// `exits` is a subset of `held_before` where the engine's trend flipped down —
// these are held positions phalanx-live says to close today.
export function AlgoSignalsExits({ exits }: { exits: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exits</CardTitle>
      </CardHeader>
      <CardContent>
        {exits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exits signalled.</p>
        ) : (
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
                    <Badge variant="destructive">SELL</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
