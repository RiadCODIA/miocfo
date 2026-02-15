import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, parseISO } from "date-fns";
import { it } from "date-fns/locale";

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
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async (): Promise<DashboardKPIs> => {
      // First, find the most recent transaction date to use as reference
      const { data: latestTx, error: latestError } = await supabase
        .from("bank_transactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      if (latestError) throw latestError;

      // Use latest transaction date as reference, or today if no transactions
      const referenceDate = latestTx?.[0]?.date 
        ? parseISO(latestTx[0].date) 
        : new Date();

      const currentMonthStart = startOfMonth(referenceDate);
      const currentMonthEnd = endOfMonth(referenceDate);
      const previousMonthStart = startOfMonth(subMonths(referenceDate, 1));
      const previousMonthEnd = endOfMonth(subMonths(referenceDate, 1));

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

      // Calculate previous total balance by subtracting current month's net from current balance
      const currentMonthNet = periodIncome - periodExpenses;
      const previousTotalBalance = totalBalance - (periodIncome - periodExpenses);

      return {
        totalBalance,
        periodIncome,
        periodExpenses,
        netCashflow,
        previousPeriodIncome,
        previousPeriodExpenses,
        previousTotalBalance,
        referenceMonth: format(referenceDate, "MMMM yyyy", { locale: it }),
      };
    },
  });
}

export function useLiquidityChart() {
  return useQuery({
    queryKey: ["liquidity-chart"],
    queryFn: async (): Promise<DailyBalance[]> => {
      // Find the date range with actual transactions
      const { data: dateRange, error: rangeError } = await supabase
        .from("bank_transactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      if (rangeError) throw rangeError;

      // Use latest transaction date as reference
      const latestDate = dateRange?.[0]?.date 
        ? parseISO(dateRange[0].date) 
        : new Date();
      
      const thirtyDaysAgo = subMonths(latestDate, 1);

      // Fetch all transactions in the period
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .lte("date", format(latestDate, "yyyy-MM-dd"))
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
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: latestDate });
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
          date: format(day, "dd MMM", { locale: it }),
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
      // Find the date range with actual transactions
      const { data: dateRange, error: rangeError } = await supabase
        .from("bank_transactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      if (rangeError) throw rangeError;

      // Use latest transaction date as reference
      const latestDate = dateRange?.[0]?.date 
        ? parseISO(dateRange[0].date) 
        : new Date();
      
      const sixMonthsAgo = subMonths(latestDate, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("date", format(endOfMonth(latestDate), "yyyy-MM-dd"));

      if (error) throw error;

      // Group by month with year-month key to avoid duplicates
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

      // Convert to array for chart, ordered by date
      const result: MonthlyComparison[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(latestDate, i);
        const monthKey = format(month, "yyyy-MM");
        const monthLabel = format(month, "MMM", { locale: it });
        const data = monthlyData.get(monthKey) || { incassi: 0, pagamenti: 0, label: monthLabel };
        result.push({
          mese: data.label || monthLabel,
          incassi: data.incassi,
          pagamenti: data.pagamenti,
        });
      }

      return result;
    },
  });
}
