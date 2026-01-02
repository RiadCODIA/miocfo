import { ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useDeadlines, useDeadlinesSummary, useLiquidityForecast } from "@/hooks/useDeadlines";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Scadenzario() {
  const { data: deadlines, isLoading: loadingDeadlines } = useDeadlines();
  const { data: summary, isLoading: loadingSummary } = useDeadlinesSummary();
  const { data: forecast, isLoading: loadingForecast } = useLiquidityForecast();

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today && status === "pending";

    if (status === "completed") {
      return <Badge variant="outline" className="border-success/50 text-success">Completato</Badge>;
    }
    if (isOverdue || status === "overdue") {
      return <Badge variant="outline" className="border-destructive/50 text-destructive">Scaduto</Badge>;
    }
    if (status === "pending") {
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 5) {
        return <Badge variant="outline" className="border-warning/50 text-warning">In scadenza</Badge>;
      }
      return <Badge variant="outline" className="border-primary/50 text-primary">Programmato</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Scadenzario</h1>
        <p className="text-muted-foreground mt-1">
          Gestione incassi e pagamenti futuri
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Incassi Previsti</p>
          </div>
          {loadingSummary ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-success">{formatCurrency(summary?.incassiTotali || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary?.incassiCount || 0} scadenze</p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Pagamenti Programmati</p>
          </div>
          {loadingSummary ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summary?.pagamentiTotali || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary?.pagamentiCount || 0} scadenze</p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-muted-foreground">Saldo Minimo Previsto</p>
          </div>
          {loadingForecast ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(forecast?.minBalance || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Previsto il {forecast?.minBalanceDate || "N/A"}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar-style List */}
        <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Prossime Scadenze</h3>
          <div className="space-y-3">
            {loadingDeadlines ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : deadlines?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 text-success" />
                <p className="text-sm">Nessuna scadenza programmata</p>
              </div>
            ) : (
              deadlines?.slice(0, 8).map((scadenza, index) => {
                const dueDate = new Date(scadenza.dueDate);
                return (
                  <div
                    key={scadenza.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-secondary/50 opacity-0 animate-slide-in",
                      scadenza.type === "incasso" ? "border-success/20" : "border-destructive/20"
                    )}
                    style={{ animationDelay: `${300 + index * 50}ms` }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0",
                      scadenza.type === "incasso" ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      <span className="text-xs text-muted-foreground">
                        {format(dueDate, "MMM", { locale: it })}
                      </span>
                      <span className={cn(
                        "text-lg font-bold",
                        scadenza.type === "incasso" ? "text-success" : "text-destructive"
                      )}>
                        {format(dueDate, "dd")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{scadenza.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {scadenza.type === "incasso" ? (
                          <ArrowDownLeft className="h-3 w-3 text-success" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-destructive" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">{scadenza.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        scadenza.type === "incasso" ? "text-success" : "text-destructive"
                      )}>
                        {scadenza.type === "incasso" ? "+" : "-"}{formatCurrency(scadenza.amount)}
                      </p>
                      {getStatusBadge(scadenza.status, scadenza.dueDate)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Liquidity Forecast Chart */}
        <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Previsione Liquidità</h3>
            <p className="text-sm text-muted-foreground">Saldo previsto per data</p>
          </div>
          <div className="h-[380px]">
            {loadingForecast ? (
              <Skeleton className="w-full h-full" />
            ) : !forecast?.forecast || forecast.forecast.length <= 1 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Nessuna previsione disponibile</p>
                <p className="text-xs mt-1">Aggiungi scadenze per visualizzare la previsione</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast.forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
                  <XAxis
                    dataKey="data"
                    stroke="hsl(215 20% 45%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215 20% 45%)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 14%)",
                      border: "1px solid hsl(222 47% 22%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Saldo"]}
                  />
                  <ReferenceLine 
                    y={10000} 
                    stroke="hsl(0 72% 51%)" 
                    strokeDasharray="5 5" 
                    label={{ 
                      value: "Soglia min", 
                      position: "right", 
                      fill: "hsl(0 72% 51%)", 
                      fontSize: 11 
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(174 72% 46%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
