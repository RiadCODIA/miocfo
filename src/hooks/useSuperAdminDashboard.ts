import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export interface SuperAdminKPIs {
  totalUsers: number;
  totalBankAccounts: number;
  totalTransactions: number;
  transactions30d: number;
  income30d: number;
  expenses30d: number;
  netFlow30d: number;
  totalPlans: number;
}

export interface MonthlyFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface DailyTransactions {
  date: string;
  count: number;
  volume: number;
}

export function useSuperAdminKPIs() {
  return useQuery({
    queryKey: ["super-admin-kpis"],
    queryFn: async (): Promise<SuperAdminKPIs> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
      
      // Parallel queries for all counts
      const [profilesResult, bankAccountsResult, transactionsResult, plansResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("bank_accounts").select("id", { count: "exact", head: true }),
        supabase.from("bank_transactions").select("amount, date"),
        supabase.from("subscription_plans").select("id", { count: "exact", head: true }),
      ]);

      const transactions = transactionsResult.data || [];
      
      // Calculate 30-day metrics
      const transactions30d = transactions.filter(t => t.date >= thirtyDaysAgo);
      
      const income30d = transactions30d
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses30d = transactions30d
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      return {
        totalUsers: profilesResult.count || 0,
        totalBankAccounts: bankAccountsResult.count || 0,
        totalTransactions: transactions.length,
        transactions30d: transactions30d.length,
        income30d,
        expenses30d,
        netFlow30d: income30d - expenses30d,
        totalPlans: plansResult.count || 0,
      };
    },
  });
}

export function useMonthlyFlows(months: number = 6) {
  return useQuery({
    queryKey: ["super-admin-monthly-flows", months],
    queryFn: async (): Promise<MonthlyFlow[]> => {
      const startDate = subDays(new Date(), months * 30).toISOString().split('T')[0];
      
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (!transactions) return [];

      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number }> = {};
      
      transactions.forEach(t => {
        const monthKey = format(new Date(t.date), "MMM yyyy");
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        if (t.amount > 0) {
          monthlyData[monthKey].income += Number(t.amount);
        } else {
          monthlyData[monthKey].expenses += Math.abs(Number(t.amount));
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: Math.round(data.income),
        expenses: Math.round(data.expenses),
        net: Math.round(data.income - data.expenses),
      }));
    },
  });
}

export function useDailyTransactions(days: number = 30) {
  return useQuery({
    queryKey: ["super-admin-daily-transactions", days],
    queryFn: async (): Promise<DailyTransactions[]> => {
      const startDate = subDays(new Date(), days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", startDateStr)
        .order("date", { ascending: true });

      if (!transactions) return [];

      // Create all days in range
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
      const dailyData: Record<string, { count: number; volume: number }> = {};
      
      dateRange.forEach(date => {
        const dateKey = format(date, "dd/MM");
        dailyData[dateKey] = { count: 0, volume: 0 };
      });

      // Fill with actual data
      transactions.forEach(t => {
        const dateKey = format(new Date(t.date), "dd/MM");
        if (dailyData[dateKey]) {
          dailyData[dateKey].count += 1;
          dailyData[dateKey].volume += Math.abs(Number(t.amount));
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        count: data.count,
        volume: Math.round(data.volume),
      }));
    },
  });
}
