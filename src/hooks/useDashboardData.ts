import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, parseISO, subDays, differenceInDays, startOfMonth, addMonths } from "date-fns";
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

      const { data: accounts, error: accountsError } = await accountsQuery;
      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      // Fetch current period transactions
      let currentTxQuery = supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to);
      if (selectedAccountId) currentTxQuery = currentTxQuery.eq("bank_account_id", selectedAccountId);

      const { data: currentTx, error: currentTxError } = await currentTxQuery;
      if (currentTxError) throw currentTxError;

      const periodIncome = currentTx?.filter(tx => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const periodExpenses = currentTx?.filter(tx => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;
      const netCashflow = periodIncome - periodExpenses;

      // Fetch previous period transactions
      let previousTxQuery = supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", prevFrom)
        .lte("date", prevTo);
      if (selectedAccountId) previousTxQuery = previousTxQuery.eq("bank_account_id", selectedAccountId);

      const { data: previousTx, error: previousTxError } = await previousTxQuery;
      if (previousTxError) throw previousTxError;

      const previousPeriodIncome = previousTx?.filter(tx => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const previousPeriodExpenses = previousTx?.filter(tx => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;

      const previousTotalBalance = totalBalance - (periodIncome - periodExpenses);

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
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

      if (txError) throw txError;

      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);

      if (accountsError) throw accountsError;

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const dailyTotals = new Map<string, number>();

      transactions?.forEach(tx => {
        const dateKey = tx.date;
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + Number(tx.amount));
      });

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
      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to);

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

      transactions?.forEach(tx => {
        const txDate = parseISO(tx.date);
        const monthKey = format(txDate, "yyyy-MM");
        const monthLabel = format(txDate, "MMM", { locale: it });
        const current = monthlyData.get(monthKey) || { incassi: 0, pagamenti: 0, label: monthLabel };
        const amount = Number(tx.amount);

        if (amount > 0) {
          current.incassi += amount;
        } else {
          current.pagamenti += Math.abs(amount);
        }

        monthlyData.set(monthKey, current);
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
