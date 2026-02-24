import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, parseISO, subDays, differenceInDays } from "date-fns";
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

export function useDashboardKPIs() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["dashboard-kpis", from, to],
    queryFn: async (): Promise<DashboardKPIs> => {
      // Calculate previous period of same length
      const periodDays = differenceInDays(dateRange.to, dateRange.from);
      const prevFrom = format(subDays(dateRange.from, periodDays + 1), "yyyy-MM-dd");
      const prevTo = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

      // Fetch total balance from bank accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);

      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      // Fetch current period transactions
      const { data: currentTx, error: currentTxError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to);

      if (currentTxError) throw currentTxError;

      const periodIncome = currentTx?.filter(tx => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const periodExpenses = currentTx?.filter(tx => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;
      const netCashflow = periodIncome - periodExpenses;

      // Fetch previous period transactions for comparison
      const { data: previousTx, error: previousTxError } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", prevFrom)
        .lte("date", prevTo);

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
      // Fetch all transactions in the period
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

      if (txError) throw txError;

      // Fetch current balance
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);

      if (accountsError) throw accountsError;

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      // Calculate running balance backwards from current
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

      // For large ranges, sample points for cleaner visualization
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

      // Group by month
      const monthlyData = new Map<string, { incassi: number; pagamenti: number; label: string }>();

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

      // Convert to array ordered by date
      const sortedKeys = Array.from(monthlyData.keys()).sort();
      return sortedKeys.map(key => {
        const data = monthlyData.get(key)!;
        return {
          mese: data.label,
          incassi: data.incassi,
          pagamenti: data.pagamenti,
          saldo: data.incassi - data.pagamenti,
        };
      });
    },
  });
}
