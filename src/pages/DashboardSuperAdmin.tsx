import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Landmark,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Activity
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useSuperAdminKPIs, useMonthlyFlows, useDailyTransactions } from "@/hooks/useSuperAdminDashboard";

export default function DashboardSuperAdmin() {
  const { data: kpis, isLoading: kpisLoading } = useSuperAdminKPIs();
  const { data: monthlyFlows, isLoading: flowsLoading } = useMonthlyFlows(6);
  const { data: dailyTransactions, isLoading: dailyLoading } = useDailyTransactions(30);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard di Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica globale della piattaforma Finexa
        </p>
      </div>

      {/* KPI Cards - 6 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Utenti Totali */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utenti</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{kpis?.totalUsers || 0}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Conti Bancari */}
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conti Bancari</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{kpis?.totalBankAccounts || 0}</p>
                )}
              </div>
              <Landmark className="h-8 w-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        {/* Transazioni Totali */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transazioni</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatNumber(kpis?.totalTransactions || 0)}</p>
                )}
              </div>
              <ArrowLeftRight className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        {/* Incassi 30gg */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incassi 30gg</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(kpis?.income30d || 0)}</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pagamenti 30gg */}
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamenti 30gg</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(kpis?.expenses30d || 0)}</p>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        {/* Piani Attivi */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Piani</p>
                {kpisLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{kpis?.totalPlans || 0}</p>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flussi di Cassa Mensili */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flussi di Cassa Mensili</CardTitle>
            <CardDescription>Andamento incassi e pagamenti ultimi 6 mesi</CardDescription>
          </CardHeader>
          <CardContent>
            {flowsLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : monthlyFlows && monthlyFlows.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyFlows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Incassi" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Pagamenti" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transazioni Giornaliere */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transazioni Giornaliere</CardTitle>
            <CardDescription>Volume transazioni ultimi 30 giorni</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : dailyTransactions && dailyTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyTransactions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? value : formatCurrency(value),
                      name === 'count' ? 'Transazioni' : 'Volume'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                    name="count"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Riepilogo Attività
          </CardTitle>
          <CardDescription>Statistiche piattaforma ultimi 30 giorni</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">
                {kpisLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : formatNumber(kpis?.transactions30d || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Transazioni 30gg</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-emerald-600">
                {kpisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatCurrency(kpis?.income30d || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Totale Incassi</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-rose-600">
                {kpisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatCurrency(kpis?.expenses30d || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Totale Pagamenti</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className={`text-2xl font-bold ${(kpis?.netFlow30d || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpisLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : formatCurrency(kpis?.netFlow30d || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Flusso Netto</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
