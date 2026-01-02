import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay } from "date-fns";

interface DashboardKPIs {
  totalBalance: number;
  periodIncome: number;
  periodExpenses: number;
  netCashflow: number;
  previousPeriodIncome: number;
  previousPeriodExpenses: number;
  previousTotalBalance: number;
}

interface DailyBalance {
  date: string;
  saldo: number;
}

interface MonthlyComparison {
  mese: string;
  incassi: number;
  pagamenti: number;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async (): Promise<DashboardKPIs> => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch total balance from bank accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;

      // Fetch current period transactions
      const { data: currentTx, error: currentTxError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(currentMonthStart, "yyyy-MM-dd"))
        .lte("date", format(currentMonthEnd, "yyyy-MM-dd"));

      if (currentTxError) throw currentTxError;

      const periodIncome = currentTx?.filter(tx => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const periodExpenses = currentTx?.filter(tx => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;
      const netCashflow = periodIncome - periodExpenses;

      // Fetch previous period transactions for comparison
      const { data: previousTx, error: previousTxError } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", format(previousMonthStart, "yyyy-MM-dd"))
        .lte("date", format(previousMonthEnd, "yyyy-MM-dd"));

      if (previousTxError) throw previousTxError;

      const previousPeriodIncome = previousTx?.filter(tx => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const previousPeriodExpenses = previousTx?.filter(tx => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;

      return {
        totalBalance,
        periodIncome,
        periodExpenses,
        netCashflow,
        previousPeriodIncome,
        previousPeriodExpenses,
        previousTotalBalance: 0, // Would need historical snapshots
      };
    },
  });
}

export function useLiquidityChart() {
  return useQuery({
    queryKey: ["liquidity-chart"],
    queryFn: async (): Promise<DailyBalance[]> => {
      const now = new Date();
      const thirtyDaysAgo = subMonths(now, 1);

      // Fetch all transactions in the period
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .lte("date", format(now, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (txError) throw txError;

      // Fetch current balance
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;

      // Calculate running balance backwards from current
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyTotals = new Map<string, number>();

      transactions?.forEach(tx => {
        const dateKey = tx.date;
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + Number(tx.amount));
      });

      // Calculate balance for each day
      let runningBalance = currentBalance;
      const balances: DailyBalance[] = [];

      // Work backwards to calculate historical balances
      for (let i = days.length - 1; i >= 0; i--) {
        const day = days[i];
        const dateKey = format(day, "yyyy-MM-dd");
        balances.unshift({
          date: format(day, "dd MMM"),
          saldo: runningBalance,
        });
        runningBalance -= dailyTotals.get(dateKey) || 0;
      }

      // Return last 7 data points for cleaner visualization
      return balances.slice(-7);
    },
  });
}

export function useIncomeExpenseChart() {
  return useQuery({
    queryKey: ["income-expense-chart"],
    queryFn: async (): Promise<MonthlyComparison[]> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("date", format(endOfMonth(now), "yyyy-MM-dd"));

      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { incassi: number; pagamenti: number }>();

      transactions?.forEach(tx => {
        const monthKey = format(new Date(tx.date), "MMM");
        const current = monthlyData.get(monthKey) || { incassi: 0, pagamenti: 0 };
        const amount = Number(tx.amount);

        if (amount > 0) {
          current.incassi += amount;
        } else {
          current.pagamenti += Math.abs(amount);
        }

        monthlyData.set(monthKey, current);
      });

      // Convert to array for chart
      const result: MonthlyComparison[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        const monthKey = format(month, "MMM");
        const data = monthlyData.get(monthKey) || { incassi: 0, pagamenti: 0 };
        result.push({
          mese: monthKey,
          incassi: data.incassi,
          pagamenti: data.pagamenti,
        });
      }

      return result;
    },
  });
}
