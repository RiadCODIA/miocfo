import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Wallet, BarChart3 } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";
import { useCompanyFinancials, useAllCompanyFinancials } from "@/hooks/useCompanyFinancials";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlussiClienti() {
  const [selectedClient, setSelectedClient] = useState("all");
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: companyFinancials, isLoading: companyFinancialsLoading } = useCompanyFinancials(
    selectedClient !== "all" ? selectedClient : null
  );
  const { data: allFinancials, isLoading: allFinancialsLoading } = useAllCompanyFinancials();

  const isLoading = companiesLoading || (selectedClient === "all" ? allFinancialsLoading : companyFinancialsLoading);

  const clients = [
    { id: "all", name: "Tutti i Clienti" },
    ...(companies || []).map(c => ({ id: c.id, name: c.name }))
  ];

  // Transform data for charts
  const rawData = selectedClient === "all" ? allFinancials : companyFinancials;
  
  // Group by month and aggregate
  const monthlyDataMap = new Map<string, { month: string; entrate: number; uscite: number; saldo: number }>();
  
  (rawData || []).forEach(item => {
    const monthKey = `${item.year}-${item.month || 1}`;
    const existing = monthlyDataMap.get(monthKey) || { month: monthKey, entrate: 0, uscite: 0, saldo: 0 };
    existing.entrate += Number(item.revenue) || 0;
    existing.uscite += Number(item.expenses) || 0;
    existing.saldo += Number(item.cash_flow) || 0;
    monthlyDataMap.set(monthKey, existing);
  });

  const data = Array.from(monthlyDataMap.values());

  const totalEntrate = data.reduce((acc, curr) => acc + curr.entrate, 0);
  const totalUscite = data.reduce((acc, curr) => acc + curr.uscite, 0);
  const totalSaldo = totalEntrate - totalUscite;
  const avgMonthlySaldo = data.length > 0 ? totalSaldo / data.length : 0;

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flussi di Cassa</h1>
          <p className="text-muted-foreground mt-1">
            Analisi dei flussi di cassa per cliente
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
      {data.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nessun dato disponibile</p>
            <p className="text-sm text-muted-foreground mt-1">I flussi di cassa verranno mostrati una volta inseriti i dati finanziari</p>
          </CardContent>
        </Card>
      )}

      {data.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entrate Totali
                </CardTitle>
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalEntrate)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Uscite Totali
                </CardTitle>
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalUscite)}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${totalSaldo >= 0 ? "from-blue-500/10 to-blue-500/5 border-blue-500/20" : "from-destructive/10 to-destructive/5 border-destructive/20"}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Netto
                </CardTitle>
                <Wallet className={`h-5 w-5 ${totalSaldo >= 0 ? "text-blue-500" : "text-destructive"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${totalSaldo >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatCurrency(totalSaldo)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Media mensile: {formatCurrency(avgMonthlySaldo)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Area Chart - Entrate vs Uscite */}
            <Card>
              <CardHeader>
                <CardTitle>Entrate vs Uscite</CardTitle>
                <CardDescription>Andamento nel periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatTooltip(value)} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="entrate" 
                        name="Entrate"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="uscite" 
                        name="Uscite"
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive))" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Saldo Mensile */}
            <Card>
              <CardHeader>
                <CardTitle>Saldo Mensile</CardTitle>
                <CardDescription>Differenza tra entrate e uscite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatTooltip(value)} />
                      <Bar 
                        dataKey="saldo" 
                        name="Saldo"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Cumulativo</CardTitle>
              <CardDescription>Evoluzione del saldo nel tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.map((item, index) => ({
                    ...item,
                    cumulativo: data.slice(0, index + 1).reduce((acc, curr) => acc + curr.saldo, 0)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatTooltip(value)} />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativo" 
                      name="Saldo Cumulativo"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
