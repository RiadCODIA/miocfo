import { 
  LineChart as LineChartIcon, 
  Users, 
  TrendingUp, 
  Landmark, 
  ArrowUpDown,
  Activity,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { 
  useSuperAdminKPIs, 
  useMonthlyFlows,
  useActiveUsersMetrics,
  useUserGrowth,
  usePlanDistribution,
  useUsageMetrics
} from "@/hooks/useSuperAdminDashboard";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function KPIInterni() {
  const { data: kpis, isLoading: loadingKpis } = useSuperAdminKPIs();
  const { data: monthlyFlows, isLoading: loadingFlows } = useMonthlyFlows(6);
  const { data: activeUsers, isLoading: loadingActive } = useActiveUsersMetrics();
  const { data: userGrowth, isLoading: loadingGrowth } = useUserGrowth();
  const { data: planDistribution, isLoading: loadingPlans } = usePlanDistribution();
  const { data: usageMetrics, isLoading: loadingUsage } = useUsageMetrics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("it-IT").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LineChartIcon className="h-7 w-7 text-primary" />
          KPI Interni Piattaforma
        </h1>
        <p className="text-muted-foreground mt-1">
          Metriche di business e utilizzo della piattaforma
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Attivi (30gg)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingActive ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeUsers?.activeCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  su {activeUsers?.totalUsers || 0} totali
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescita Utenti</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingGrowth ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600">
                  {userGrowth?.growthPercentage >= 0 ? "+" : ""}{userGrowth?.growthPercentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +{userGrowth?.newUsersThisMonth || 0} questo mese
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conti Collegati</CardTitle>
            <Landmark className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.totalBankAccounts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  conti bancari attivi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Totale</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            {loadingKpis ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency((kpis?.income30d || 0) + (kpis?.expenses30d || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  movimentato (30gg)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Crescita Utenti nel Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingGrowth ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowth?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    name="Utenti"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Distribuzione per Piano
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <Skeleton className="h-[250px] w-full" />
            ) : planDistribution?.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nessun piano configurato
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {planDistribution?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Volume Transazionale Mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFlows ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyFlows || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                    name="Incassi"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                    name="Pagamenti"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Usage Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Metriche di Utilizzo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Transazioni / Giorno</span>
                  <span className="text-lg font-bold text-primary">
                    {formatNumber(usageMetrics?.transactionsPerDay || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Transazioni / Utente</span>
                  <span className="text-lg font-bold text-primary">
                    {formatNumber(usageMetrics?.transactionsPerUser || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Conti / Utente</span>
                  <span className="text-lg font-bold text-primary">
                    {(usageMetrics?.accountsPerUser || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Volume Medio / Conto</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(usageMetrics?.avgVolumePerAccount || 0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
