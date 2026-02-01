import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, addMonths } from "date-fns";
import { it } from "date-fns/locale";

export interface Budget {
  id: string;
  month: string;
  monthLabel: string;
  predictedIncome: number;
  predictedExpenses: number;
  actualIncome: number;
  actualExpenses: number;
  cashflowPrevisto: number;
  notes: string | null;
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
        .order("month", { ascending: true });

      if (error) throw error;

      return data?.map((b) => ({
        id: b.id,
        month: b.month,
        monthLabel: format(new Date(b.month), "MMM yyyy", { locale: it }),
        predictedIncome: Number(b.predicted_income),
        predictedExpenses: Number(b.predicted_expenses),
        actualIncome: Number(b.actual_income),
        actualExpenses: Number(b.actual_expenses),
        cashflowPrevisto: Number(b.predicted_income) - Number(b.predicted_expenses),
        notes: b.notes,
      })) || [];
    },
  });
}

export function useBudgetComparison() {
  return useQuery({
    queryKey: ["budget-comparison"],
    queryFn: async (): Promise<BudgetComparison[]> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .gte("month", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("month", format(startOfMonth(now), "yyyy-MM-dd"))
        .order("month", { ascending: true });

      if (error) throw error;

      return data?.map((b) => {
        const actualCashflow = Number(b.actual_income) - Number(b.actual_expenses);
        const predictedCashflow = Number(b.predicted_income) - Number(b.predicted_expenses);

        return {
          mese: format(new Date(b.month), "MMM", { locale: it }),
          consuntivo: actualCashflow,
          previsionale: predictedCashflow,
          scostamento: actualCashflow - predictedCashflow,
        };
      }) || [];
    },
  });
}

export function useBudgetVarianceSummary() {
  return useQuery({
    queryKey: ["budget-variance-summary"],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .gte("month", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("month", format(startOfMonth(now), "yyyy-MM-dd"));

      if (error) throw error;

      let positiveVariance = 0;
      let negativeVariance = 0;
      let positiveMonths = 0;
      let negativeMonths = 0;

      data?.forEach((b) => {
        const actual = Number(b.actual_income) - Number(b.actual_expenses);
        const predicted = Number(b.predicted_income) - Number(b.predicted_expenses);
        const variance = actual - predicted;

        if (variance >= 0) {
          positiveVariance += variance;
          positiveMonths++;
        } else {
          negativeVariance += Math.abs(variance);
          negativeMonths++;
        }
      });

      const netVariance = positiveVariance - negativeVariance;
      const totalPredicted = data?.reduce((sum, b) => sum + Number(b.predicted_income) - Number(b.predicted_expenses), 0) || 1;
      const variancePercent = (netVariance / totalPredicted) * 100;

      return {
        positiveVariance,
        negativeVariance,
        netVariance,
        positiveMonths,
        negativeMonths,
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
      predictedIncome,
      predictedExpenses,
    }: {
      id: string;
      predictedIncome?: number;
      predictedExpenses?: number;
    }) => {
      const updates: Record<string, number> = {};
      if (predictedIncome !== undefined) updates.predicted_income = predictedIncome;
      if (predictedExpenses !== undefined) updates.predicted_expenses = predictedExpenses;

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
      month,
      predictedIncome,
      predictedExpenses,
    }: {
      month: Date;
      predictedIncome: number;
      predictedExpenses: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("budgets").insert({
        month: format(startOfMonth(month), "yyyy-MM-dd"),
        predicted_income: predictedIncome,
        predicted_expenses: predictedExpenses,
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
