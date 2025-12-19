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
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

// Demo data
const clients = [
  { id: "all", name: "Tutti i Clienti" },
  { id: "1", name: "Tech Solutions S.r.l." },
  { id: "2", name: "Green Energy SpA" },
  { id: "3", name: "Fashion House S.r.l." },
  { id: "4", name: "Food & Beverage Co." },
];

const monthlyData: Record<string, Array<{
  month: string;
  entrate: number;
  uscite: number;
  saldo: number;
}>> = {
  all: [
    { month: "Gen", entrate: 320000, uscite: 280000, saldo: 40000 },
    { month: "Feb", entrate: 290000, uscite: 260000, saldo: 30000 },
    { month: "Mar", entrate: 380000, uscite: 310000, saldo: 70000 },
    { month: "Apr", entrate: 350000, uscite: 290000, saldo: 60000 },
    { month: "Mag", entrate: 410000, uscite: 340000, saldo: 70000 },
    { month: "Giu", entrate: 390000, uscite: 320000, saldo: 70000 },
  ],
  "1": [
    { month: "Gen", entrate: 85000, uscite: 65000, saldo: 20000 },
    { month: "Feb", entrate: 72000, uscite: 58000, saldo: 14000 },
    { month: "Mar", entrate: 95000, uscite: 70000, saldo: 25000 },
    { month: "Apr", entrate: 88000, uscite: 62000, saldo: 26000 },
    { month: "Mag", entrate: 102000, uscite: 75000, saldo: 27000 },
    { month: "Giu", entrate: 98000, uscite: 68000, saldo: 30000 },
  ],
  "2": [
    { month: "Gen", entrate: 145000, uscite: 110000, saldo: 35000 },
    { month: "Feb", entrate: 138000, uscite: 105000, saldo: 33000 },
    { month: "Mar", entrate: 165000, uscite: 125000, saldo: 40000 },
    { month: "Apr", entrate: 152000, uscite: 115000, saldo: 37000 },
    { month: "Mag", entrate: 178000, uscite: 135000, saldo: 43000 },
    { month: "Giu", entrate: 168000, uscite: 128000, saldo: 40000 },
  ],
  "3": [
    { month: "Gen", entrate: 58000, uscite: 72000, saldo: -14000 },
    { month: "Feb", entrate: 52000, uscite: 68000, saldo: -16000 },
    { month: "Mar", entrate: 75000, uscite: 82000, saldo: -7000 },
    { month: "Apr", entrate: 68000, uscite: 78000, saldo: -10000 },
    { month: "Mag", entrate: 82000, uscite: 95000, saldo: -13000 },
    { month: "Giu", entrate: 78000, uscite: 88000, saldo: -10000 },
  ],
  "4": [
    { month: "Gen", entrate: 52000, uscite: 45000, saldo: 7000 },
    { month: "Feb", entrate: 48000, uscite: 42000, saldo: 6000 },
    { month: "Mar", entrate: 62000, uscite: 52000, saldo: 10000 },
    { month: "Apr", entrate: 58000, uscite: 48000, saldo: 10000 },
    { month: "Mag", entrate: 68000, uscite: 55000, saldo: 13000 },
    { month: "Giu", entrate: 64000, uscite: 50000, saldo: 14000 },
  ],
};

export default function FlussiClienti() {
  const [selectedClient, setSelectedClient] = useState("all");
  const data = monthlyData[selectedClient] || monthlyData.all;

  const totalEntrate = data.reduce((acc, curr) => acc + curr.entrate, 0);
  const totalUscite = data.reduce((acc, curr) => acc + curr.uscite, 0);
  const totalSaldo = totalEntrate - totalUscite;
  const avgMonthlySaldo = totalSaldo / data.length;

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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entrate Totali (6 mesi)
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
              Uscite Totali (6 mesi)
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
            <CardDescription>Andamento negli ultimi 6 mesi</CardDescription>
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
    </div>
  );
}
