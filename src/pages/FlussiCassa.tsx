import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { useCashFlowData, useCashFlowKPIs, useCashFlowComposition } from "@/hooks/useCashFlowData";
import { useLiquidityForecast } from "@/hooks/useDeadlines";
import { CashFlowChart } from "@/components/flussi-cassa/CashFlowChart";

import { LiquidityProjection } from "@/components/flussi-cassa/LiquidityProjection";
import { CashFlowCompositionChart } from "@/components/flussi-cassa/CashFlowCompositionChart";

export default function FlussiCassa() {
  const { data: monthlyData = [], isLoading: isLoadingData } = useCashFlowData();
  const { data: kpis, isLoading: isLoadingKPIs } = useCashFlowKPIs();
  
  const { data: liquidityForecast, isLoading: isLoadingForecast } = useLiquidityForecast();
  const { data: compositionData = [], isLoading: isLoadingComposition } = useCashFlowComposition();

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

  const chartData = [...monthlyData].map(row => ({
    mese: row.meseShort,
    incassi: row.incassi,
    pagamenti: row.pagamenti,
    cashflow: row.cashflow,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Flussi di Cassa</h1>
        <p className="text-muted-foreground mt-1">
          Analizza la liquidità totale della tua attività e le sue componenti
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
              title="Flusso di Cassa"
              value={formatCurrency(kpis?.cashflowCumulativo ?? 0)}
              icon={<Wallet className="h-5 w-5" />}
              variant={(kpis?.cashflowCumulativo ?? 0) >= 0 ? "success" : "destructive"}
            />
            <KPICard
              title="Totale Incassi"
              value={formatCurrency(kpis?.totaleIncassi ?? 0)}
              icon={<ArrowUpRight className="h-5 w-5" />}
              variant="success"
            />
            <KPICard
              title="Totale Pagamenti"
              value={formatCurrency(kpis?.totalePagamenti ?? 0)}
              icon={<ArrowDownRight className="h-5 w-5" />}
              variant="destructive"
            />
            <KPICard
              title="Margine Operativo"
              value={`${kpis?.margineOperativo ?? 0}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant={(kpis?.margineOperativo ?? 0) >= 20 ? "success" : "warning"}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div>
        {isLoadingData ? (
          <Skeleton className="h-[380px]" />
        ) : (
          <CashFlowChart data={chartData} />
        )}
      </div>

      {/* Liquidity Projection */}
      <div>
        {isLoadingForecast ? (
          <Skeleton className="h-[280px]" />
        ) : (
          <LiquidityProjection
            data={liquidityForecast?.forecast ?? []}
            minBalance={liquidityForecast?.minBalance ?? 0}
            minBalanceDate={liquidityForecast?.minBalanceDate ?? ""}
          />
        )}
      </div>

      {/* Cash Flow Composition */}
      <div>
        <CashFlowCompositionChart data={compositionData} isLoading={isLoadingComposition} />
      </div>

      {/* Monthly Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Riepilogo Mensile</h3>
          <p className="text-sm text-muted-foreground">Logica di cassa - Aggregazione mensile ultimi 6 mesi</p>
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
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowUpRight className="h-4 w-4 text-success" />
                    Incassi
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                    Pagamenti
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground text-right">Margine</TableHead>
                <TableHead className="text-muted-foreground text-right">Cashflow Netto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((row) => {
                const marginPercent = row.incassi > 0 
                  ? ((row.utile / row.incassi) * 100).toFixed(1) 
                  : "0.0";
                return (
                  <TableRow
                    key={row.mese}
                    className="border-border hover:bg-secondary/50"
                  >
                    <TableCell className="font-medium capitalize">{row.mese}</TableCell>
                    <TableCell className="text-right text-success font-medium">
                      €{row.incassi.toLocaleString("it-IT")}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      €{row.pagamenti.toLocaleString("it-IT")}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      parseFloat(marginPercent) >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {marginPercent}%
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      row.cashflow >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {row.cashflow >= 0 ? "+" : "-"}€{Math.abs(row.cashflow).toLocaleString("it-IT")}
                    </TableCell>
                  </TableRow>
                );
              })}
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
                  totals.incassi > 0 && ((totals.utile / totals.incassi) * 100) >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totals.incassi > 0 ? ((totals.utile / totals.incassi) * 100).toFixed(1) : "0.0"}%
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