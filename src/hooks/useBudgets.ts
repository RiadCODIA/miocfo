import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths } from "date-fns";
import { it } from "date-fns/locale";

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null;
  amount: number;
  budgetType: "income" | "expense";
  periodType: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface BudgetComparison {
  mese: string;
  consuntivo: number;
  previsionale: number;
  previsionaleRicavi: number;
  previsionaleCosti: number;
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
        amount: Math.abs(Number(b.amount)),
        budgetType: (b as any).budget_type === "expense" ? "expense" : "income",
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
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"))
        .lte("date", format(now, "yyyy-MM-dd"));

      if (error) throw error;

      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_active", true);

      if (!budgets || budgets.length === 0) {
        return [];
      }

      // Build monthly cashflow from transactions
      const monthlyData: Record<string, { income: number; expenses: number }> = {};
      transactions?.forEach(tx => {
        const month = format(new Date(tx.date), "yyyy-MM");
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
        const amount = Number(tx.amount);
        if (amount > 0) monthlyData[month].income += amount;
        else monthlyData[month].expenses += Math.abs(amount);
      });

      // Separate budget totals by type
      const totalRicavi = budgets
        .filter(b => (b as any).budget_type === "income" || Number(b.amount) > 0)
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

      const totalCosti = budgets
        .filter(b => (b as any).budget_type === "expense" || Number(b.amount) < 0)
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

      const cashflowNetto = totalRicavi - totalCosti;

      // Build result for last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        return format(startOfMonth(date), "yyyy-MM");
      });

      return months.map((month) => {
        const data = monthlyData[month] || { income: 0, expenses: 0 };
        const consuntivo = data.income - data.expenses;
        return {
          mese: format(new Date(month + "-01"), "MMM", { locale: it }),
          consuntivo,
          previsionale: cashflowNetto,
          previsionaleRicavi: totalRicavi,
          previsionaleCosti: totalCosti,
          scostamento: consuntivo - cashflowNetto,
        };
      });
    },
  });
}

export function useBudgetVarianceSummary() {
  return useQuery({
    queryKey: ["budget-variance-summary"],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"));

      if (error) throw error;

      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, budget_type")
        .eq("is_active", true);

      if (!budgets || budgets.length === 0) {
        return {
          positiveVariance: 0,
          negativeVariance: 0,
          netVariance: 0,
          positiveMonths: 0,
          negativeMonths: 0,
          variancePercent: 0,
          totalRicaviPrevisti: 0,
          totalCostiPrevisti: 0,
          cashflowNettoPrevisto: 0,
        };
      }

      const totalRicaviPrevisti = budgets
        .filter(b => (b as any).budget_type === "income" || Number(b.amount) > 0)
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

      const totalCostiPrevisti = budgets
        .filter(b => (b as any).budget_type === "expense" || Number(b.amount) < 0)
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

      const cashflowNettoPrevisto = totalRicaviPrevisti - totalCostiPrevisti;

      const totalActual = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const netVariance = totalActual - cashflowNettoPrevisto;
      const variancePercent = cashflowNettoPrevisto !== 0 ? (netVariance / cashflowNettoPrevisto) * 100 : 0;

      return {
        positiveVariance: netVariance > 0 ? netVariance : 0,
        negativeVariance: netVariance < 0 ? Math.abs(netVariance) : 0,
        netVariance,
        positiveMonths: 0,
        negativeMonths: 0,
        variancePercent,
        totalRicaviPrevisti,
        totalCostiPrevisti,
        cashflowNettoPrevisto,
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
      budgetType,
      categoryId,
      startDate,
      periodType = "monthly",
    }: {
      name: string;
      amount: number;
      budgetType: "income" | "expense";
      categoryId?: string;
      startDate: Date;
      periodType?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Store income as positive, expense as negative
      const storedAmount = budgetType === "expense" ? -Math.abs(amount) : Math.abs(amount);

      const { error } = await supabase.from("budgets").insert({
        name,
        amount: storedAmount,
        budget_type: budgetType,
        category_id: categoryId || null,
        start_date: format(startOfMonth(startDate), "yyyy-MM-dd"),
        period_type: periodType,
        user_id: user.id,
        is_active: true,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-comparison"] });
      queryClient.invalidateQueries({ queryKey: ["budget-variance-summary"] });
    },
  });
}
