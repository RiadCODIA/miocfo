import { ArrowUpDown, TrendingUp, TrendingDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProductMargins } from "@/hooks/useProductMargins";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marginalita() {
  const { data: productsData, isLoading } = useProductMargins();

  // Calculate totals
  const totals = (productsData || []).reduce(
    (acc, row) => ({
      ricavi: acc.ricavi + row.ricavi,
      margineLordo: acc.margineLordo + row.margineLordo,
    }),
    { ricavi: 0, margineLordo: 0 }
  );

  const avgMargin = totals.ricavi > 0 ? (totals.margineLordo / totals.ricavi) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Marginalità</h1>
        <p className="text-muted-foreground mt-1">
          Analisi redditività prodotti o servizi
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Anno corrente</SelectItem>
            <SelectItem value="q4">Q4 2024</SelectItem>
            <SelectItem value="q3">Q3 2024</SelectItem>
            <SelectItem value="q2">Q2 2024</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
          <ArrowUpDown className="h-4 w-4" />
          Ordina per marginalità
        </Button>
      </div>

      {/* No Data Message */}
      {(!productsData || productsData.length === 0) && (
        <div className="glass rounded-xl p-12 text-center opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">Nessun prodotto o servizio trovato</p>
          <p className="text-sm text-muted-foreground mt-1">Aggiungi prodotti e i relativi dati finanziari per vedere l'analisi della marginalità</p>
        </div>
      )}

      {/* Table */}
      {productsData && productsData.length > 0 && (
        <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Prodotto/Servizio</TableHead>
                <TableHead className="text-muted-foreground text-right">Ricavi</TableHead>
                <TableHead className="text-muted-foreground text-right">Costi Variabili</TableHead>
                <TableHead className="text-muted-foreground text-right">Quota Costi Fissi</TableHead>
                <TableHead className="text-muted-foreground text-right">Margine Lordo</TableHead>
                <TableHead className="text-muted-foreground text-right w-[200px]">Margine %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <TableCell className="font-medium">{row.prodotto}</TableCell>
                  <TableCell className="text-right text-foreground">
                    €{row.ricavi.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    €{row.costiVariabili.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    €{row.quotaCostiFissi.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    row.margineLordo >= 0 ? "text-success" : "text-destructive"
                  )}>
                    €{row.margineLordo.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <Progress
                        value={Math.min(Math.max(row.marginePerc, 0), 100)}
                        className="w-[80px] h-2 bg-secondary"
                      />
                      <span className={cn(
                        "font-semibold min-w-[50px]",
                        row.marginePerc >= 40 ? "text-success" : row.marginePerc >= 25 ? "text-warning" : "text-destructive"
                      )}>
                        {row.marginePerc.toFixed(1)}%
                      </span>
                      {row.marginePerc >= 40 ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Ricavi Totali</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            €{totals.ricavi.toLocaleString("it-IT")}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Margine Lordo Totale</p>
          <p className="text-2xl font-bold text-success mt-1">
            €{totals.margineLordo.toLocaleString("it-IT")}
          </p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Margine Medio</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {avgMargin.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
