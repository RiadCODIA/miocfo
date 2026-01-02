import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Target, Wallet } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";
import { useLatestCompanyKpis, useAggregatedKpis } from "@/hooks/useCompanyFinancials";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiClienti() {
  const [selectedClient, setSelectedClient] = useState("all");
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: companyKpis, isLoading: companyKpisLoading } = useLatestCompanyKpis(
    selectedClient !== "all" ? selectedClient : null
  );
  const { data: aggregatedKpis, isLoading: aggregatedKpisLoading } = useAggregatedKpis();

  const isLoading = companiesLoading || (selectedClient === "all" ? aggregatedKpisLoading : companyKpisLoading);
  
  const data = selectedClient === "all" ? aggregatedKpis : companyKpis;

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{value.toFixed(1)}%</span>
        </div>
      );
    }
    if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  };

  const clients = [
    { id: "all", name: "Tutti i Clienti" },
    ...(companies || []).map(c => ({ id: c.id, name: c.name }))
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Default values if no data
  const kpiData = data || {
    revenue: { value: 0, trend: 0 },
    margin: { value: 0, trend: 0 },
    cashflow: { value: 0, trend: 0 },
    dso: { value: 0, trend: 0 },
    currentRatio: { value: 0, trend: 0 },
    debtRatio: { value: 0, trend: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">KPI per Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Analisi delle performance finanziarie dei tuoi clienti
          </p>
        </div>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Seleziona cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Client Badge */}
      {selectedClient !== "all" && (
        <Badge variant="secondary" className="text-sm py-1.5 px-3">
          Visualizzando: {clients.find(c => c.id === selectedClient)?.name}
        </Badge>
      )}

      {/* No Data Message */}
      {!data && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nessun dato disponibile per questo cliente</p>
            <p className="text-sm text-muted-foreground mt-1">I dati finanziari verranno mostrati una volta inseriti</p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fatturato Annuo
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(kpiData.revenue.value)}
              </div>
              <TrendIndicator value={kpiData.revenue.trend} />
            </CardContent>
          </Card>

          {/* Margin */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Margine Operativo
              </CardTitle>
              <PieChart className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {kpiData.margin.value.toFixed(1)}%
              </div>
              <TrendIndicator value={kpiData.margin.trend} />
            </CardContent>
          </Card>

          {/* Cash Flow */}
          <Card className={kpiData.cashflow.value < 0 ? "border-destructive/30 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cash Flow Mensile
              </CardTitle>
              <Wallet className={`h-5 w-5 ${kpiData.cashflow.value < 0 ? "text-destructive" : "text-blue-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${kpiData.cashflow.value < 0 ? "text-destructive" : "text-foreground"}`}>
                {formatCurrency(kpiData.cashflow.value)}
              </div>
              <TrendIndicator value={kpiData.cashflow.trend} />
            </CardContent>
          </Card>

          {/* DSO */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                DSO (Giorni Incasso)
              </CardTitle>
              <Target className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {kpiData.dso.value} giorni
              </div>
              <TrendIndicator value={kpiData.dso.trend} />
              <p className="text-xs text-muted-foreground mt-1">
                {kpiData.dso.trend < 0 ? "In miglioramento" : kpiData.dso.trend > 0 ? "In peggioramento" : "Stabile"}
              </p>
            </CardContent>
          </Card>

          {/* Current Ratio */}
          <Card className={kpiData.currentRatio.value < 1 && kpiData.currentRatio.value > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Ratio
              </CardTitle>
              <BarChart3 className={`h-5 w-5 ${kpiData.currentRatio.value < 1 && kpiData.currentRatio.value > 0 ? "text-destructive" : "text-emerald-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${kpiData.currentRatio.value < 1 && kpiData.currentRatio.value > 0 ? "text-destructive" : "text-foreground"}`}>
                {kpiData.currentRatio.value.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={kpiData.currentRatio.value >= 1.5 ? "outline" : kpiData.currentRatio.value >= 1 ? "secondary" : "destructive"}>
                  {kpiData.currentRatio.value >= 1.5 ? "Ottimo" : kpiData.currentRatio.value >= 1 ? "Adeguato" : kpiData.currentRatio.value > 0 ? "Critico" : "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Debt Ratio */}
          <Card className={kpiData.debtRatio.value > 0.6 ? "border-amber-500/30 bg-amber-500/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Debt Ratio
              </CardTitle>
              <PieChart className={`h-5 w-5 ${kpiData.debtRatio.value > 0.6 ? "text-amber-500" : "text-blue-500"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(kpiData.debtRatio.value * 100).toFixed(0)}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={kpiData.debtRatio.value <= 0.4 ? "outline" : kpiData.debtRatio.value <= 0.6 ? "secondary" : "destructive"}>
                  {kpiData.debtRatio.value <= 0.4 ? "Basso" : kpiData.debtRatio.value <= 0.6 ? "Moderato" : kpiData.debtRatio.value > 0 ? "Elevato" : "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Legenda KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="font-medium">DSO (Days Sales Outstanding)</p>
              <p className="text-sm text-muted-foreground">Giorni medi per incassare i crediti commerciali</p>
            </div>
            <div>
              <p className="font-medium">Current Ratio</p>
              <p className="text-sm text-muted-foreground">Attivo corrente / Passivo corrente. Ideale: {">"} 1.5</p>
            </div>
            <div>
              <p className="font-medium">Debt Ratio</p>
              <p className="text-sm text-muted-foreground">Debiti totali / Attivo totale. Ideale: {"<"} 40%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
