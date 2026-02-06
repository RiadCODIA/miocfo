import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval, startOfMonth } from "date-fns";

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

export interface ActiveUsersMetrics {
  activeCount: number;
  totalUsers: number;
  activePercentage: number;
}

export interface UserGrowthData {
  growthPercentage: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  monthlyData: { month: string; users: number }[];
}

export interface PlanDistribution {
  name: string;
  count: number;
}

export interface UsageMetrics {
  transactionsPerDay: number;
  transactionsPerUser: number;
  accountsPerUser: number;
  avgVolumePerAccount: number;
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

// New hooks for KPI Interni

export function useActiveUsersMetrics() {
  return useQuery({
    queryKey: ["active-users-metrics"],
    queryFn: async (): Promise<ActiveUsersMetrics> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
      
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      
      // Get users with transactions in last 30 days
      const { data: recentTransactions } = await supabase
        .from("bank_transactions")
        .select("bank_account_id")
        .gte("date", thirtyDaysAgo);
      
      // Get unique bank accounts
      const uniqueAccountIds = new Set(recentTransactions?.map(t => t.bank_account_id) || []);
      
      // Get users who own these accounts
      if (uniqueAccountIds.size === 0) {
        return {
          activeCount: 0,
          totalUsers: totalUsers || 0,
          activePercentage: 0,
        };
      }

      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("user_id")
        .in("id", Array.from(uniqueAccountIds));
      
      const uniqueUserIds = new Set(accounts?.map(a => a.user_id).filter(Boolean) || []);
      const activeCount = uniqueUserIds.size;

      return {
        activeCount,
        totalUsers: totalUsers || 0,
        activePercentage: totalUsers ? Math.round((activeCount / totalUsers) * 100) : 0,
      };
    },
  });
}

export function useUserGrowth() {
  return useQuery({
    queryKey: ["user-growth"],
    queryFn: async (): Promise<UserGrowthData> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      
      // Get all profiles with created_at
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });
      
      if (!profiles) {
        return {
          growthPercentage: 0,
          newUsersThisMonth: 0,
          newUsersLastMonth: 0,
          monthlyData: [],
        };
      }

      // Generate monthly data
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
      const monthlyData: { month: string; users: number }[] = [];
      let cumulativeUsers = 0;

      // Get users before our range for cumulative count
      const { count: usersBefore } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .lt("created_at", sixMonthsAgo.toISOString());
      
      cumulativeUsers = usersBefore || 0;

      months.forEach(monthDate => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = startOfMonth(subMonths(monthDate, -1));
        
        const newUsersInMonth = profiles.filter(p => {
          const createdAt = new Date(p.created_at);
          return createdAt >= monthStart && createdAt < monthEnd;
        }).length;

        cumulativeUsers += newUsersInMonth;
        
        monthlyData.push({
          month: format(monthDate, "MMM"),
          users: cumulativeUsers,
        });
      });

      // Calculate growth
      const thisMonth = startOfMonth(now);
      const lastMonth = subMonths(thisMonth, 1);
      
      const newUsersThisMonth = profiles.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).length;
      
      const newUsersLastMonth = profiles.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= lastMonth && createdAt < thisMonth;
      }).length;

      const growthPercentage = newUsersLastMonth > 0 
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0 ? 100 : 0;

      return {
        growthPercentage,
        newUsersThisMonth,
        newUsersLastMonth,
        monthlyData,
      };
    },
  });
}

export function usePlanDistribution() {
  return useQuery({
    queryKey: ["plan-distribution"],
    queryFn: async (): Promise<PlanDistribution[]> => {
      // Get all plans
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("id, name")
        .eq("is_active", true);

      if (!plans || plans.length === 0) {
        return [];
      }

      // For now, we'll simulate distribution since we don't have user-plan assignments
      // In production, this would query a user_subscriptions table
      return plans.map((plan, index) => ({
        name: plan.name,
        count: Math.max(1, 5 - index * 2), // Simulated distribution
      }));
    },
  });
}

export function useUsageMetrics() {
  return useQuery({
    queryKey: ["usage-metrics"],
    queryFn: async (): Promise<UsageMetrics> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
      
      const [transactionsResult, accountsResult, usersResult] = await Promise.all([
        supabase
          .from("bank_transactions")
          .select("amount")
          .gte("date", thirtyDaysAgo),
        supabase
          .from("bank_accounts")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
      ]);

      const transactions = transactionsResult.data || [];
      const totalAccounts = accountsResult.count || 0;
      const totalUsers = usersResult.count || 0;

      const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const transactionCount = transactions.length;

      return {
        transactionsPerDay: Math.round(transactionCount / 30),
        transactionsPerUser: totalUsers > 0 ? Math.round(transactionCount / totalUsers) : 0,
        accountsPerUser: totalUsers > 0 ? totalAccounts / totalUsers : 0,
        avgVolumePerAccount: totalAccounts > 0 ? totalVolume / totalAccounts : 0,
      };
    },
  });
}
