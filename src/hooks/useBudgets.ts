import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, addMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useDateRange } from "@/contexts/DateRangeContext";

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

export interface ChartMonthData {
  mese: string;
  monthKey: string;
  ricaviEffettivi: number;
  costiEffettivi: number;
  ricaviPrevisti: number;
  costiPrevisti: number;
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

export function useBudgetChartData() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["budget-chart-data", from, to],
    queryFn: async (): Promise<ChartMonthData[]> => {
      const now = new Date();

      // Build month keys from dateRange
      const rangeStart = startOfMonth(dateRange.from);
      const rangeEnd = startOfMonth(dateRange.to);
      const months: string[] = [];
      let cursor = rangeStart;
      while (cursor <= rangeEnd) {
        months.push(format(cursor, "yyyy-MM"));
        cursor = addMonths(cursor, 1);
      }
      // Ensure at least current month + a few future months for expected
      const futureEnd = addMonths(rangeEnd, 3);
      cursor = addMonths(rangeEnd, 1);
      while (cursor <= futureEnd) {
        months.push(format(cursor, "yyyy-MM"));
        cursor = addMonths(cursor, 1);
      }

      // Fetch bank transactions for actuals within dateRange
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", from)
        .lte("date", to);

      // Fetch ALL unpaid invoices with a due_date (no date filter)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount, total_amount, invoice_type, due_date, payment_status")
        .not("due_date", "is", null)
        .neq("payment_status", "paid");

      // Fetch active budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, budget_type, start_date")
        .eq("is_active", true);

      const monthlyActuals: Record<string, { income: number; expenses: number }> = {};
      transactions?.forEach(tx => {
        const month = format(new Date(tx.date), "yyyy-MM");
        if (!monthlyActuals[month]) monthlyActuals[month] = { income: 0, expenses: 0 };
        const amount = Number(tx.amount);
        if (amount > 0) monthlyActuals[month].income += amount;
        else monthlyActuals[month].expenses += Math.abs(amount);
      });

      const currentMonth = format(startOfMonth(now), "yyyy-MM");
      const monthlyExpected: Record<string, { income: number; expenses: number }> = {};

      // Add invoice-based expected
      invoices?.forEach(inv => {
        if (!inv.due_date) return;
        const dueDate = new Date(inv.due_date);
        const month = dueDate < now ? currentMonth : format(dueDate, "yyyy-MM");
        if (!months.includes(month)) return;
        if (!monthlyExpected[month]) monthlyExpected[month] = { income: 0, expenses: 0 };
        const amount = Number(inv.total_amount || inv.amount);
        if (inv.invoice_type === "emessa") {
          monthlyExpected[month].income += amount;
        } else {
          monthlyExpected[month].expenses += amount;
        }
      });

      // Add budget-based expected
      budgets?.forEach(b => {
        const month = format(new Date(b.start_date), "yyyy-MM");
        if (!months.includes(month)) return;
        if (!monthlyExpected[month]) monthlyExpected[month] = { income: 0, expenses: 0 };
        const amount = Math.abs(Number(b.amount));
        if ((b as any).budget_type === "income") {
          monthlyExpected[month].income += amount;
        } else {
          monthlyExpected[month].expenses += amount;
        }
      });

      return months.map((monthKey) => {
        const actuals = monthlyActuals[monthKey] || { income: 0, expenses: 0 };
        const expected = monthlyExpected[monthKey] || { income: 0, expenses: 0 };
        return {
          mese: format(new Date(monthKey + "-01"), "MMM yy", { locale: it }),
          monthKey,
          ricaviEffettivi: actuals.income,
          costiEffettivi: actuals.expenses,
          ricaviPrevisti: expected.income,
          costiPrevisti: expected.expenses,
        };
      });
    },
  });
}

export function useBudgetVarianceSummary() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["budget-variance-summary", from, to],
    queryFn: async () => {
      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, budget_type, name")
        .eq("is_active", true)
        .gte("start_date", from)
        .lte("start_date", to);

      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount, total_amount, invoice_type, due_date, payment_status")
        .not("due_date", "is", null)
        .gte("due_date", from)
        .lte("due_date", to);

      const totalRicaviPrevistiBudget = budgets
        ?.filter(b => (b as any).budget_type === "income")
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0) || 0;

      const totalCostiPrevistiBudget = budgets
        ?.filter(b => (b as any).budget_type === "expense")
        .reduce((s, b) => s + Math.abs(Number(b.amount)), 0) || 0;

      const pendingInvoices = invoices?.filter(i => i.payment_status !== "paid") || [];
      const ricaviDaFatture = pendingInvoices
        .filter(i => i.invoice_type === "emessa")
        .reduce((s, i) => s + Number(i.total_amount || i.amount), 0);
      const costiDaFatture = pendingInvoices
        .filter(i => i.invoice_type === "ricevuta")
        .reduce((s, i) => s + Number(i.total_amount || i.amount), 0);

      const totalRicaviPrevisti = totalRicaviPrevistiBudget + ricaviDaFatture;
      const totalCostiPrevisti = totalCostiPrevistiBudget + costiDaFatture;
      const cashflowNettoPrevisto = totalRicaviPrevisti - totalCostiPrevisti;

      return {
        totalRicaviPrevisti,
        totalCostiPrevisti,
        cashflowNettoPrevisto,
        ricaviDaBudget: totalRicaviPrevistiBudget,
        costiDaBudget: totalCostiPrevistiBudget,
        ricaviDaFatture,
        costiDaFatture,
        budgetCount: budgets?.length || 0,
        pendingInvoiceCount: pendingInvoices.length,
      };
    },
  });
}

export function useBudgetComparison() {
  return useBudgetChartData();
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      amount,
      name,
      budgetType,
      startDate,
    }: {
      id: string;
      amount?: number;
      name?: string;
      budgetType?: "income" | "expense";
      startDate?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (amount !== undefined) {
        updates.amount = budgetType === "expense" ? -Math.abs(amount) : Math.abs(amount);
      }
      if (name !== undefined) updates.name = name;
      if (budgetType !== undefined) updates.budget_type = budgetType;
      if (startDate !== undefined) updates.start_date = startDate;

      const { error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart-data"] });
      queryClient.invalidateQueries({ queryKey: ["budget-variance-summary"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budgets")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart-data"] });
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
      queryClient.invalidateQueries({ queryKey: ["budget-chart-data"] });
      queryClient.invalidateQueries({ queryKey: ["budget-variance-summary"] });
    },
  });
}
