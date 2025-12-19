import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Target, Wallet } from "lucide-react";

// Demo data
const clients = [
  { id: "all", name: "Tutti i Clienti" },
  { id: "1", name: "Tech Solutions S.r.l." },
  { id: "2", name: "Green Energy SpA" },
  { id: "3", name: "Fashion House S.r.l." },
  { id: "4", name: "Food & Beverage Co." },
];

const kpiData: Record<string, {
  revenue: { value: number; trend: number };
  margin: { value: number; trend: number };
  cashflow: { value: number; trend: number };
  dso: { value: number; trend: number };
  currentRatio: { value: number; trend: number };
  debtRatio: { value: number; trend: number };
}> = {
  all: {
    revenue: { value: 1940000, trend: 12 },
    margin: { value: 32.5, trend: 2.3 },
    cashflow: { value: 103000, trend: 8 },
    dso: { value: 45, trend: -5 },
    currentRatio: { value: 1.8, trend: 0.1 },
    debtRatio: { value: 0.42, trend: -0.05 },
  },
  "1": {
    revenue: { value: 450000, trend: 15 },
    margin: { value: 38.2, trend: 3.1 },
    cashflow: { value: 35000, trend: 12 },
    dso: { value: 38, trend: -8 },
    currentRatio: { value: 2.1, trend: 0.2 },
    debtRatio: { value: 0.35, trend: -0.08 },
  },
  "2": {
    revenue: { value: 820000, trend: 18 },
    margin: { value: 35.5, trend: 4.2 },
    cashflow: { value: 62000, trend: 15 },
    dso: { value: 42, trend: -3 },
    currentRatio: { value: 2.4, trend: 0.3 },
    debtRatio: { value: 0.28, trend: -0.1 },
  },
  "3": {
    revenue: { value: 380000, trend: -5 },
    margin: { value: 22.1, trend: -4.5 },
    cashflow: { value: -12000, trend: -25 },
    dso: { value: 68, trend: 12 },
    currentRatio: { value: 0.9, trend: -0.3 },
    debtRatio: { value: 0.65, trend: 0.1 },
  },
  "4": {
    revenue: { value: 290000, trend: 8 },
    margin: { value: 28.8, trend: 1.5 },
    cashflow: { value: 18000, trend: 5 },
    dso: { value: 52, trend: -2 },
    currentRatio: { value: 1.5, trend: 0.05 },
    debtRatio: { value: 0.48, trend: -0.02 },
  },
};

export default function KpiClienti() {
  const [selectedClient, setSelectedClient] = useState("all");
  const data = kpiData[selectedClient] || kpiData.all;

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
          <span className="text-sm font-medium">+{value}%</span>
        </div>
      );
    }
    if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{value}%</span>
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

      {/* KPI Cards */}
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
              {formatCurrency(data.revenue.value)}
            </div>
            <TrendIndicator value={data.revenue.trend} />
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
              {data.margin.value.toFixed(1)}%
            </div>
            <TrendIndicator value={data.margin.trend} />
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className={data.cashflow.value < 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Flow Mensile
            </CardTitle>
            <Wallet className={`h-5 w-5 ${data.cashflow.value < 0 ? "text-destructive" : "text-blue-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.cashflow.value < 0 ? "text-destructive" : "text-foreground"}`}>
              {formatCurrency(data.cashflow.value)}
            </div>
            <TrendIndicator value={data.cashflow.trend} />
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
              {data.dso.value} giorni
            </div>
            <TrendIndicator value={data.dso.trend} />
            <p className="text-xs text-muted-foreground mt-1">
              {data.dso.trend < 0 ? "In miglioramento" : data.dso.trend > 0 ? "In peggioramento" : "Stabile"}
            </p>
          </CardContent>
        </Card>

        {/* Current Ratio */}
        <Card className={data.currentRatio.value < 1 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Ratio
            </CardTitle>
            <BarChart3 className={`h-5 w-5 ${data.currentRatio.value < 1 ? "text-destructive" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.currentRatio.value < 1 ? "text-destructive" : "text-foreground"}`}>
              {data.currentRatio.value.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={data.currentRatio.value >= 1.5 ? "outline" : data.currentRatio.value >= 1 ? "secondary" : "destructive"}>
                {data.currentRatio.value >= 1.5 ? "Ottimo" : data.currentRatio.value >= 1 ? "Adeguato" : "Critico"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Debt Ratio */}
        <Card className={data.debtRatio.value > 0.6 ? "border-amber-500/30 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Debt Ratio
            </CardTitle>
            <PieChart className={`h-5 w-5 ${data.debtRatio.value > 0.6 ? "text-amber-500" : "text-blue-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {(data.debtRatio.value * 100).toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={data.debtRatio.value <= 0.4 ? "outline" : data.debtRatio.value <= 0.6 ? "secondary" : "destructive"}>
                {data.debtRatio.value <= 0.4 ? "Basso" : data.debtRatio.value <= 0.6 ? "Moderato" : "Elevato"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

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
