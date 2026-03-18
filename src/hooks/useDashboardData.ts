import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, differenceInDays, subDays, startOfMonth, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useDateRange } from "@/contexts/DateRangeContext";

interface DashboardKPIs {
  totalBalance: number;
  periodIncome: number;
  periodExpenses: number;
  netCashflow: number;
  previousPeriodIncome: number;
  previousPeriodExpenses: number;
  previousTotalBalance: number;
  referenceMonth: string;
}

interface DailyBalance {
  date: string;
  saldo: number;
}

interface MonthlyComparison {
  mese: string;
  incassi: number;
  pagamenti: number;
  saldo: number;
}

export function useDashboardKPIs(selectedAccountId?: string | null) {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard-kpis", from, to, selectedAccountId ?? "all"],
    queryFn: async (): Promise<DashboardKPIs> => {
      const periodDays = differenceInDays(dateRange.to, dateRange.from);
      const prevFrom = format(subDays(dateRange.from, periodDays + 1), "yyyy-MM-dd");
      const prevTo = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

      // Fetch balance
      let accountsQuery = supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);
      if (selectedAccountId) accountsQuery = accountsQuery.eq("id", selectedAccountId);

      // Use RPC for totals — pick account-specific or global variant
      const currentTotalsPromise = selectedAccountId
        ? supabase.rpc("get_cashflow_totals_by_account", { p_from: from, p_to: to, p_account_id: selectedAccountId })
        : supabase.rpc("get_cashflow_totals", { p_from: from, p_to: to });

      const prevTotalsPromise = selectedAccountId
        ? supabase.rpc("get_cashflow_totals_by_account", { p_from: prevFrom, p_to: prevTo, p_account_id: selectedAccountId })
        : supabase.rpc("get_cashflow_totals", { p_from: prevFrom, p_to: prevTo });

      const [accountsRes, currentRes, prevRes] = await Promise.all([
        accountsQuery,
        currentTotalsPromise,
        prevTotalsPromise,
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (currentRes.error) throw currentRes.error;
      if (prevRes.error) throw prevRes.error;

      const totalBalance = accountsRes.data?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      const cur = currentRes.data?.[0] || { total_income: 0, total_expenses: 0 };
      const periodIncome = Number(cur.total_income);
      const periodExpenses = Number(cur.total_expenses);
      const netCashflow = periodIncome - periodExpenses;

      const prev = prevRes.data?.[0] || { total_income: 0, total_expenses: 0 };
      const previousPeriodIncome = Number(prev.total_income);
      const previousPeriodExpenses = Number(prev.total_expenses);
      const previousTotalBalance = totalBalance - netCashflow;

      return {
        totalBalance,
        periodIncome,
        periodExpenses,
        netCashflow,
        previousPeriodIncome,
        previousPeriodExpenses,
        previousTotalBalance,
        referenceMonth: `${format(dateRange.from, "dd MMM", { locale: it })} - ${format(dateRange.to, "dd MMM yyyy", { locale: it })}`,
      };
    },
  });
}

export function useLiquidityChart() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["liquidity-chart", from, to],
    queryFn: async (): Promise<DailyBalance[]> => {
      const [dailyRes, accountsRes] = await Promise.all([
        supabase.rpc("get_daily_totals", { p_from: from, p_to: to }),
        supabase.from("bank_accounts").select("balance").eq("is_connected", true),
      ]);

      if (dailyRes.error) throw dailyRes.error;
      if (accountsRes.error) throw accountsRes.error;

      const currentBalance = accountsRes.data?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      const dailyTotals = new Map<string, number>();
      (dailyRes.data || []).forEach((row: any) => {
        dailyTotals.set(row.day, Number(row.net_amount));
      });

      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      let runningBalance = currentBalance;
      const balances: DailyBalance[] = [];

      for (let i = days.length - 1; i >= 0; i--) {
        const day = days[i];
        const dateKey = format(day, "yyyy-MM-dd");
        balances.unshift({
          date: format(day, "dd MMM", { locale: it }),
          saldo: runningBalance,
        });
        runningBalance -= dailyTotals.get(dateKey) || 0;
      }

      if (balances.length > 30) {
        const step = Math.ceil(balances.length / 30);
        return balances.filter((_, i) => i % step === 0 || i === balances.length - 1);
      }

      return balances;
    },
  });
}

export function useIncomeExpenseChart() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["income-expense-chart", from, to],
    queryFn: async (): Promise<MonthlyComparison[]> => {
      const { data: rpcData, error } = await supabase
        .rpc("get_cashflow_summary", { p_from: from, p_to: to });

      if (error) throw error;

      // Pre-fill all months in the date range so empty months still appear
      const monthlyData = new Map<string, { incassi: number; pagamenti: number; label: string }>();
      let cursor = startOfMonth(dateRange.from);
      const end = startOfMonth(dateRange.to);
      while (cursor <= end) {
        const key = format(cursor, "yyyy-MM");
        const label = format(cursor, "MMM", { locale: it });
        monthlyData.set(key, { incassi: 0, pagamenti: 0, label });
        cursor = addMonths(cursor, 1);
      }

      (rpcData || []).forEach((row: any) => {
        const existing = monthlyData.get(row.month_key);
        if (existing) {
          existing.incassi = Number(row.incassi);
          existing.pagamenti = Number(row.pagamenti);
        }
      });

      const sortedKeys = Array.from(monthlyData.keys()).sort();
      const spanYears = sortedKeys.length > 0 &&
        sortedKeys[0].slice(0, 4) !== sortedKeys[sortedKeys.length - 1].slice(0, 4);

      return sortedKeys.map(key => {
        const d = monthlyData.get(key)!;
        const label = spanYears ? `${d.label} ${key.slice(2, 4)}` : d.label;
        return {
          mese: label,
          incassi: d.incassi,
          pagamenti: d.pagamenti,
          saldo: d.incassi - d.pagamenti,
        };
      });
    },
  });
}
