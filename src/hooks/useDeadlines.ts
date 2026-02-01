import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

export interface Deadline {
  id: string;
  description: string;
  type: "incasso" | "pagamento";
  amount: number;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  invoiceId: string | null;
}

export interface DeadlineFilters {
  status?: "pending" | "completed" | "overdue" | "all";
  type?: "incasso" | "pagamento" | "all";
  fromDate?: string;
  toDate?: string;
}

export interface CreateDeadlineInput {
  description: string;
  type: "incasso" | "pagamento";
  amount: number;
  dueDate: string;
  invoiceId?: string | null;
}

export interface UpdateDeadlineInput {
  id: string;
  description?: string;
  type?: "incasso" | "pagamento";
  amount?: number;
  dueDate?: string;
  status?: "pending" | "completed" | "overdue";
  invoiceId?: string | null;
}

export function useDeadlines(filters?: DeadlineFilters) {
  return useQuery({
    queryKey: ["deadlines", filters],
    queryFn: async (): Promise<Deadline[]> => {
      let query = supabase
        .from("deadlines")
        .select("*")
        .order("due_date", { ascending: true });

      // Apply status filter
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Apply type filter
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      // Apply date range filters
      if (filters?.fromDate) {
        query = query.gte("due_date", filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte("due_date", filters.toDate);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      return data?.map((d) => ({
        id: d.id,
        description: d.description,
        type: d.type as Deadline["type"],
        amount: Number(d.amount),
        dueDate: d.due_date,
        status: d.status as Deadline["status"],
        invoiceId: d.invoice_id,
      })) || [];
    },
  });
}

export function useDeadlinesSummary() {
  return useQuery({
    queryKey: ["deadlines-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadlines")
        .select("type, amount, status")
        .in("status", ["pending", "overdue"]);

      if (error) throw error;

      const incassiTotali = data?.filter(d => d.type === "incasso").reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const pagamentiTotali = data?.filter(d => d.type === "pagamento").reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const incassiCount = data?.filter(d => d.type === "incasso").length || 0;
      const pagamentiCount = data?.filter(d => d.type === "pagamento").length || 0;
      const overdueCount = data?.filter(d => d.status === "overdue").length || 0;

      return {
        incassiTotali,
        pagamentiTotali,
        incassiCount,
        pagamentiCount,
        overdueCount,
        saldoNetto: incassiTotali - pagamentiTotali,
      };
    },
  });
}

export function useLiquidityForecast() {
  return useQuery({
    queryKey: ["liquidity-forecast"],
    queryFn: async () => {
      // Fetch current balance
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;

      // Fetch upcoming deadlines
      const { data: deadlines, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("due_date, type, amount")
        .in("status", ["pending", "overdue"])
        .gte("due_date", format(new Date(), "yyyy-MM-dd"))
        .lte("due_date", format(addDays(new Date(), 30), "yyyy-MM-dd"))
        .order("due_date", { ascending: true });

      if (deadlinesError) throw deadlinesError;

      // Calculate forecast
      let runningBalance = currentBalance;
      const forecast: { data: string; saldo: number; min: number }[] = [];

      // Group deadlines by date
      const dateMap = new Map<string, number>();
      deadlines?.forEach(d => {
        const impact = d.type === "incasso" ? Number(d.amount) : -Number(d.amount);
        dateMap.set(d.due_date, (dateMap.get(d.due_date) || 0) + impact);
      });

      // Add current date
      forecast.push({
        data: format(new Date(), "dd/MM"),
        saldo: currentBalance,
        min: 10000,
      });

      // Add forecasted dates
      const sortedDates = Array.from(dateMap.keys()).sort();
      for (const date of sortedDates) {
        runningBalance += dateMap.get(date) || 0;
        forecast.push({
          data: format(new Date(date), "dd/MM"),
          saldo: runningBalance,
          min: 10000,
        });
      }

      const minBalance = Math.min(...forecast.map(f => f.saldo));
      const minBalanceDate = forecast.find(f => f.saldo === minBalance)?.data || "";

      return {
        forecast,
        minBalance,
        minBalanceDate,
      };
    },
  });
}

export function useCreateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeadlineInput) => {
      const { data, error } = await supabase
        .from("deadlines")
        .insert({
          description: input.description,
          type: input.type,
          amount: input.amount,
          due_date: input.dueDate,
          invoice_id: input.invoiceId || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["liquidity-forecast"] });
    },
  });
}

export function useUpdateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDeadlineInput) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.description !== undefined) updateData.description = input.description;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.invoiceId !== undefined) updateData.invoice_id = input.invoiceId;

      const { data, error } = await supabase
        .from("deadlines")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["liquidity-forecast"] });
    },
  });
}

export function useDeleteDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deadlineId: string) => {
      const { error } = await supabase
        .from("deadlines")
        .delete()
        .eq("id", deadlineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["liquidity-forecast"] });
    },
  });
}

export function useCompleteDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deadlineId: string) => {
      const { error } = await supabase
        .from("deadlines")
        .update({ status: "completed" })
        .eq("id", deadlineId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["liquidity-forecast"] });
    },
  });
}

export function useInvoicesForDeadlines() {
  return useQuery({
    queryKey: ["invoices-for-deadlines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, supplier_name, amount, invoice_date")
        .order("invoice_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}
