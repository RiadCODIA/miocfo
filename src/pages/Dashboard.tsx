import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Target, BarChart3 } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { LiquidityChart } from "@/components/dashboard/LiquidityChart";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

export default function Dashboard() {
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
          value="€128.450"
          change={12.5}
          changeLabel="vs mese prec."
          icon={<Wallet className="h-5 w-5" />}
          variant="default"
          delay={0}
        />
        <KPICard
          title="Incassi Periodo"
          value="€67.230"
          change={8.3}
          changeLabel="vs mese prec."
          icon={<ArrowDownLeft className="h-5 w-5" />}
          variant="success"
          delay={50}
        />
        <KPICard
          title="Pagamenti Periodo"
          value="€52.180"
          change={-3.2}
          changeLabel="vs mese prec."
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="destructive"
          delay={100}
        />
        <KPICard
          title="Cashflow Netto"
          value="€15.050"
          change={24.1}
          changeLabel="vs mese prec."
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
          delay={150}
        />
        <KPICard
          title="Utile/Perdita Mensile"
          value="€12.340"
          change={15.7}
          changeLabel="vs mese prec."
          icon={<BarChart3 className="h-5 w-5" />}
          variant="success"
          delay={200}
        />
        <KPICard
          title="Break-Even Point"
          value="€45.000"
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
