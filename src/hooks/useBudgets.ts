import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths } from "date-fns";
import { it } from "date-fns/locale";

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null;
  amount: number;
  periodType: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface BudgetComparison {
  mese: string;
  consuntivo: number;
  previsionale: number;
  scostamento: number;
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: false });

      if (error) throw error;

      return data?.map((b) => ({
        id: b.id,
        name: b.name,
        categoryId: b.category_id,
        amount: Number(b.amount),
        periodType: b.period_type,
        startDate: b.start_date,
        endDate: b.end_date,
        isActive: b.is_active,
      })) || [];
    },
  });
}

export function useBudgetComparison() {
  return useQuery({
    queryKey: ["budget-comparison"],
    queryFn: async (): Promise<BudgetComparison[]> => {
      // Get the last 6 months of transactions for comparison
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("date", format(now, "yyyy-MM-dd"));

      if (error) throw error;

      // Get budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_active", true);

      // If no active budgets, return empty array (no comparison to show)
      if (!budgets || budgets.length === 0) {
        return [];
      }

      // Calculate monthly totals
      const monthlyData: Record<string, { income: number; expenses: number }> = {};
      
      transactions?.forEach(tx => {
        const month = format(new Date(tx.date), "yyyy-MM");
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }
        const amount = Number(tx.amount);
        if (amount > 0) {
          monthlyData[month].income += amount;
        } else {
          monthlyData[month].expenses += Math.abs(amount);
        }
      });

      // Calculate total budgeted amount (simplified - assumes monthly budget)
      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

      return Object.entries(monthlyData).map(([month, data]) => {
        const consuntivo = data.income - data.expenses;
        return {
          mese: format(new Date(month + "-01"), "MMM", { locale: it }),
          consuntivo,
          previsionale: totalBudget,
          scostamento: consuntivo - totalBudget,
        };
      });
    },
  });
}

export function useBudgetVarianceSummary() {
  return useQuery({
    queryKey: ["budget-variance-summary"],
    queryFn: async () => {
      // Simplified variance calculation
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"));

      if (error) throw error;

      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount")
        .eq("is_active", true);

      if (!budgets || budgets.length === 0) {
        return {
          positiveVariance: 0,
          negativeVariance: 0,
          netVariance: 0,
          positiveMonths: 0,
          negativeMonths: 0,
          variancePercent: 0,
        };
      }

      const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
      const totalActual = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      const netVariance = totalActual - totalBudget;
      const variancePercent = totalBudget ? (netVariance / totalBudget) * 100 : 0;

      return {
        positiveVariance: netVariance > 0 ? netVariance : 0,
        negativeVariance: netVariance < 0 ? Math.abs(netVariance) : 0,
        netVariance,
        positiveMonths: 0,
        negativeMonths: 0,
        variancePercent,
      };
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      amount,
      name,
    }: {
      id: string;
      amount?: number;
      name?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (amount !== undefined) updates.amount = amount;
      if (name !== undefined) updates.name = name;

      const { error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["budget-variance-summary"] });
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      amount,
      categoryId,
      startDate,
      periodType = "monthly",
    }: {
      name: string;
      amount: number;
      categoryId?: string;
      startDate: Date;
      periodType?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("budgets").insert({
        name,
        amount,
        category_id: categoryId || null,
        start_date: format(startOfMonth(startDate), "yyyy-MM-dd"),
        period_type: periodType,
        user_id: user.id,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
