import { ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { LiquidityHeroCard } from "@/components/dashboard/LiquidityHeroCard";
import { AccountBalancesList } from "@/components/dashboard/AccountBalancesList";
import { CategoryAnalysisCard } from "@/components/dashboard/CategoryAnalysisCard";
import { useDashboardKPIs } from "@/hooks/useDashboardData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  const { data: accountsCount } = useQuery({
    queryKey: ["connected-accounts-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bank_accounts")
        .select("*", { count: "exact", head: true })
        .eq("is_connected", true);
      if (error) throw error;
      return count || 0;
    },
  });

  const formatCurrency = (value: number) =>
    `€ ${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = kpis ? calculateChange(kpis.periodIncome, kpis.previousPeriodIncome) : 0;
  const expenseChange = kpis ? calculateChange(kpis.periodExpenses, kpis.previousPeriodExpenses) : 0;
  const balanceChange = kpis && kpis.previousTotalBalance
    ? calculateChange(kpis.totalBalance, kpis.previousTotalBalance)
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero - Liquidità Totale */}
      <LiquidityHeroCard
        totalBalance={kpis?.totalBalance || 0}
        change={isLoading ? undefined : Number(balanceChange.toFixed(1))}
        isLoading={isLoading}
      />

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Entrate"
          value={isLoading ? "..." : formatCurrency(kpis?.periodIncome || 0)}
          subtitle="+0% del totale"
          icon={<ArrowDownLeft className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          title="Uscite"
          value={isLoading ? "..." : formatCurrency(kpis?.periodExpenses || 0)}
          subtitle="+0% del totale"
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="destructive"
        />
        <KPICard
          title="Conti Collegati"
          value={String(accountsCount ?? 0)}
          subtitle="Conti attivi"
          icon={<Landmark className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <CategoryAnalysisCard />
        </div>
        <div className="lg:col-span-7">
          <AccountBalancesList />
        </div>
      </div>
    </div>
  );
}
