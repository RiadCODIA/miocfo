import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Target, BarChart3, Loader2 } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { LiquidityChart } from "@/components/dashboard/LiquidityChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useDashboardKPIs } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = kpis ? calculateChange(kpis.periodIncome, kpis.previousPeriodIncome) : 0;
  const expenseChange = kpis ? calculateChange(kpis.periodExpenses, kpis.previousPeriodExpenses) : 0;
  const cashflowChange = kpis 
    ? calculateChange(
        kpis.periodIncome - kpis.periodExpenses,
        kpis.previousPeriodIncome - kpis.previousPeriodExpenses
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visione sintetica e aggiornata della situazione finanziaria aziendale
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Saldo Totale Conti"
          value={isLoading ? "..." : formatCurrency(kpis?.totalBalance || 0)}
          change={isLoading ? undefined : 0}
          changeLabel="vs mese prec."
          icon={<Wallet className="h-5 w-5" />}
          variant="default"
          delay={0}
        />
        <KPICard
          title="Incassi Periodo"
          value={isLoading ? "..." : formatCurrency(kpis?.periodIncome || 0)}
          change={isLoading ? undefined : Number(incomeChange.toFixed(1))}
          changeLabel="vs mese prec."
          icon={<ArrowDownLeft className="h-5 w-5" />}
          variant="success"
          delay={50}
        />
        <KPICard
          title="Pagamenti Periodo"
          value={isLoading ? "..." : formatCurrency(kpis?.periodExpenses || 0)}
          change={isLoading ? undefined : Number((-expenseChange).toFixed(1))}
          changeLabel="vs mese prec."
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="destructive"
          delay={100}
        />
        <KPICard
          title="Cashflow Netto"
          value={isLoading ? "..." : formatCurrency(kpis?.netCashflow || 0)}
          change={isLoading ? undefined : Number(cashflowChange.toFixed(1))}
          changeLabel="vs mese prec."
          icon={<TrendingUp className="h-5 w-5" />}
          variant={kpis && kpis.netCashflow >= 0 ? "success" : "destructive"}
          delay={150}
        />
        <KPICard
          title="Utile/Perdita Mensile"
          value={isLoading ? "..." : formatCurrency(kpis?.netCashflow || 0)}
          change={isLoading ? undefined : Number(cashflowChange.toFixed(1))}
          changeLabel="vs mese prec."
          icon={<BarChart3 className="h-5 w-5" />}
          variant={kpis && kpis.netCashflow >= 0 ? "success" : "destructive"}
          delay={200}
        />
        <KPICard
          title="Break-Even Point"
          value={formatCurrency(kpis?.periodExpenses || 0)}
          icon={<Target className="h-5 w-5" />}
          variant="warning"
          delay={250}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiquidityChart />
        <IncomeExpenseChart />
      </div>

      {/* Alerts */}
      <AlertsSummary />
    </div>
  );
}
