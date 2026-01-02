import { TrendingUp, TrendingDown, Target, Percent } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCashFlowData, useCashFlowKPIs } from "@/hooks/useCashFlowData";

export default function FlussiCassa() {
  const { data: monthlyData = [], isLoading: isLoadingData } = useCashFlowData();
  const { data: kpis, isLoading: isLoadingKPIs } = useCashFlowKPIs();

  const totals = monthlyData.reduce(
    (acc, row) => ({
      incassi: acc.incassi + row.incassi,
      pagamenti: acc.pagamenti + row.pagamenti,
      utile: acc.utile + row.utile,
      cashflow: acc.cashflow + row.cashflow,
    }),
    { incassi: 0, pagamenti: 0, utile: 0, cashflow: 0 }
  );

  const formatCurrency = (value: number) => {
    return `€${Math.abs(value).toLocaleString("it-IT")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Flussi di Cassa</h1>
        <p className="text-muted-foreground mt-1">
          Controllo di gestione e sostenibilità finanziaria
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingKPIs ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <KPICard
              title="Break-Even Point"
              value={formatCurrency(kpis?.breakEvenPoint ?? 0)}
              icon={<Target className="h-5 w-5" />}
              variant="warning"
              delay={0}
            />
            <KPICard
              title="Incidenza Costi"
              value={`${kpis?.incidenzaCosti ?? 0}%`}
              change={kpis?.incidenzaCostiChange ? -kpis.incidenzaCostiChange : undefined}
              changeLabel="vs trimestre prec."
              icon={<Percent className="h-5 w-5" />}
              variant="default"
              delay={50}
            />
            <KPICard
              title="Cashflow Cumulativo"
              value={formatCurrency(kpis?.cashflowCumulativo ?? 0)}
              change={kpis?.cashflowChange}
              changeLabel="vs anno prec."
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
              delay={100}
            />
            <KPICard
              title="Margine Operativo"
              value={`${kpis?.margineOperativo ?? 0}%`}
              change={kpis?.margineOperativoChange}
              changeLabel="vs trimestre prec."
              icon={<TrendingDown className="h-5 w-5" />}
              variant="success"
              delay={150}
            />
          </>
        )}
      </div>

      {/* Monthly Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Riepilogo Mensile</h3>
          <p className="text-sm text-muted-foreground">Logica di cassa - Aggregazione mensile</p>
        </div>
        
        {isLoadingData ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : monthlyData.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            Nessun dato disponibile. Connetti un conto bancario per vedere i flussi di cassa.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Mese</TableHead>
                <TableHead className="text-muted-foreground text-right">Incassi</TableHead>
                <TableHead className="text-muted-foreground text-right">Pagamenti</TableHead>
                <TableHead className="text-muted-foreground text-right">Utile/Perdita</TableHead>
                <TableHead className="text-muted-foreground text-right">Cashflow Netto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((row, index) => (
                <TableRow
                  key={row.mese}
                  className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <TableCell className="font-medium capitalize">{row.mese}</TableCell>
                  <TableCell className="text-right text-success font-medium">
                    €{row.incassi.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right text-destructive font-medium">
                    €{row.pagamenti.toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    row.utile >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {row.utile >= 0 ? "+" : "-"}€{Math.abs(row.utile).toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    row.cashflow >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {row.cashflow >= 0 ? "+" : "-"}€{Math.abs(row.cashflow).toLocaleString("it-IT")}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="border-border bg-secondary/30 font-bold">
                <TableCell>Totale Periodo</TableCell>
                <TableCell className="text-right text-success">
                  €{totals.incassi.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  €{totals.pagamenti.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className={cn(
                  "text-right",
                  totals.utile >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totals.utile >= 0 ? "+" : "-"}€{Math.abs(totals.utile).toLocaleString("it-IT")}
                </TableCell>
                <TableCell className={cn(
                  "text-right",
                  totals.cashflow >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totals.cashflow >= 0 ? "+" : "-"}€{Math.abs(totals.cashflow).toLocaleString("it-IT")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
