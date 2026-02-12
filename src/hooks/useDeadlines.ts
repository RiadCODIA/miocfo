import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

export interface Deadline {
  id: string;
  title: string;
  description: string | null;
  type: "incasso" | "pagamento";
  amount: number;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
  invoiceId: string | null;
  source?: "manual" | "invoice";
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

// Helper: map an invoice row to a Deadline
function invoiceToDeadline(inv: {
  id: string;
  invoice_number: string | null;
  vendor_name: string | null;
  client_name: string | null;
  invoice_type: string;
  total_amount: number;
  due_date: string | null;
  invoice_date: string | null;
  payment_status: string | null;
  source: string | null;
}): Deadline {
  const isExpense = inv.invoice_type === "expense";
  const today = format(new Date(), "yyyy-MM-dd");
  const dueDate = inv.due_date || inv.invoice_date || today;
  const isPaid = inv.payment_status === "paid";
  const isOverdue = !isPaid && dueDate < today;

  const counterpart = isExpense ? inv.vendor_name : inv.client_name;
  const label = inv.invoice_number
    ? `Fatt. ${inv.invoice_number}${counterpart ? ` - ${counterpart}` : ""}`
    : counterpart || (isExpense ? "Fattura passiva" : "Fattura attiva");

  const sourceLabel = inv.source === "sdi" ? " (SDI)" : inv.source === "manual" ? " (Manuale)" : "";

  return {
    id: `inv-${inv.id}`,
    title: `${label}${sourceLabel}`,
    description: null,
    type: isExpense ? "pagamento" : "incasso",
    amount: Number(inv.total_amount),
    dueDate,
    status: isPaid ? "completed" : isOverdue ? "overdue" : "pending",
    invoiceId: inv.id,
    source: "invoice",
  };
}

export function useDeadlines(filters?: DeadlineFilters) {
  return useQuery({
    queryKey: ["deadlines", filters],
    queryFn: async (): Promise<Deadline[]> => {
      // 1. Fetch manual deadlines
      let query = supabase
        .from("deadlines")
        .select("*")
        .order("due_date", { ascending: true });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.type && filters.type !== "all") {
        query = query.eq("deadline_type", filters.type === "incasso" ? "income" : "payment");
      }
      if (filters?.fromDate) {
        query = query.gte("due_date", filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte("due_date", filters.toDate);
      }

      const { data: deadlinesData, error: deadlinesError } = await query.limit(200);
      if (deadlinesError) throw deadlinesError;

      const manualDeadlines: Deadline[] = deadlinesData?.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        type: (d.deadline_type === "income" ? "incasso" : "pagamento") as Deadline["type"],
        amount: Number(d.amount),
        dueDate: d.due_date,
        status: d.status as Deadline["status"],
        invoiceId: d.invoice_id,
        source: "manual" as const,
      })) || [];

      // 2. Fetch invoices with pending/overdue payments (not yet linked to deadlines)
      const linkedInvoiceIds = manualDeadlines
        .filter((d) => d.invoiceId)
        .map((d) => d.invoiceId as string);

      let invQuery = supabase
        .from("invoices")
        .select("id, invoice_number, vendor_name, client_name, invoice_type, total_amount, due_date, invoice_date, payment_status, source")
        .order("due_date", { ascending: true });

      // Apply type filter to invoices too
      if (filters?.type && filters.type !== "all") {
        invQuery = invQuery.eq("invoice_type", filters.type === "incasso" ? "income" : "expense");
      }
      if (filters?.fromDate) {
        invQuery = invQuery.or(`due_date.gte.${filters.fromDate},and(due_date.is.null,invoice_date.gte.${filters.fromDate})`);
      }
      if (filters?.toDate) {
        invQuery = invQuery.or(`due_date.lte.${filters.toDate},and(due_date.is.null,invoice_date.lte.${filters.toDate})`);
      }

      const { data: invoicesData, error: invoicesError } = await invQuery.limit(200);
      if (invoicesError) throw invoicesError;

      const invoiceDeadlines: Deadline[] = (invoicesData || [])
        .filter((inv) => !linkedInvoiceIds.includes(inv.id))
        .map(invoiceToDeadline);

      // Apply status filter to invoice-derived deadlines
      let filteredInvoiceDeadlines = invoiceDeadlines;
      if (filters?.status && filters.status !== "all") {
        filteredInvoiceDeadlines = invoiceDeadlines.filter((d) => d.status === filters.status);
      }

      // 3. Merge and sort by due date
      const all = [...manualDeadlines, ...filteredInvoiceDeadlines];
      all.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      return all;
    },
  });
}

export function useDeadlinesSummary() {
  return useQuery({
    queryKey: ["deadlines-summary"],
    queryFn: async () => {
      // Fetch manual deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("deadline_type, amount, status, invoice_id")
        .in("status", ["pending", "overdue"]);
      if (deadlinesError) throw deadlinesError;

      const linkedInvoiceIds = (deadlinesData || [])
        .filter((d) => d.invoice_id)
        .map((d) => d.invoice_id as string);

      // Fetch unpaid invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_type, total_amount, due_date, invoice_date, payment_status")
        .neq("payment_status", "paid");
      if (invoicesError) throw invoicesError;

      const today = format(new Date(), "yyyy-MM-dd");

      // Combine
      type Entry = { type: "incasso" | "pagamento"; amount: number; isOverdue: boolean };
      const entries: Entry[] = [];

      (deadlinesData || []).forEach((d) => {
        entries.push({
          type: d.deadline_type === "income" ? "incasso" : "pagamento",
          amount: Number(d.amount),
          isOverdue: d.status === "overdue",
        });
      });

      (invoicesData || [])
        .filter((inv) => !linkedInvoiceIds.includes(inv.id))
        .forEach((inv) => {
          const dueDate = inv.due_date || inv.invoice_date || today;
          entries.push({
            type: inv.invoice_type === "expense" ? "pagamento" : "incasso",
            amount: Number(inv.total_amount),
            isOverdue: dueDate < today,
          });
        });

      const incassiTotali = entries.filter((e) => e.type === "incasso").reduce((s, e) => s + e.amount, 0);
      const pagamentiTotali = entries.filter((e) => e.type === "pagamento").reduce((s, e) => s + e.amount, 0);
      const incassiCount = entries.filter((e) => e.type === "incasso").length;
      const pagamentiCount = entries.filter((e) => e.type === "pagamento").length;
      const overdueCount = entries.filter((e) => e.isOverdue).length;

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
      const { data: accounts, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("balance");
      if (accountsError) throw accountsError;

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysLater = format(addDays(new Date(), 30), "yyyy-MM-dd");

      // Fetch manual deadlines
      const { data: deadlines, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("due_date, deadline_type, amount, invoice_id")
        .in("status", ["pending", "overdue"])
        .gte("due_date", today)
        .lte("due_date", thirtyDaysLater)
        .order("due_date", { ascending: true });
      if (deadlinesError) throw deadlinesError;

      const linkedInvoiceIds = (deadlines || [])
        .filter((d) => d.invoice_id)
        .map((d) => d.invoice_id as string);

      // Fetch unpaid invoices in the 30-day window
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_type, total_amount, due_date, invoice_date, payment_status")
        .neq("payment_status", "paid")
        .or(`due_date.gte.${today},and(due_date.is.null,invoice_date.gte.${today})`)
        .or(`due_date.lte.${thirtyDaysLater},and(due_date.is.null,invoice_date.lte.${thirtyDaysLater})`);
      if (invoicesError) throw invoicesError;

      // Build date impact map
      const dateMap = new Map<string, number>();

      deadlines?.forEach((d) => {
        const impact = d.deadline_type === "income" ? Number(d.amount) : -Number(d.amount);
        dateMap.set(d.due_date, (dateMap.get(d.due_date) || 0) + impact);
      });

      (invoices || [])
        .filter((inv) => !linkedInvoiceIds.includes(inv.id))
        .forEach((inv) => {
          const dueDate = inv.due_date || inv.invoice_date || today;
          if (dueDate >= today && dueDate <= thirtyDaysLater) {
            const impact = inv.invoice_type === "expense" ? -Number(inv.total_amount) : Number(inv.total_amount);
            dateMap.set(dueDate, (dateMap.get(dueDate) || 0) + impact);
          }
        });

      let runningBalance = currentBalance;
      const forecast: { data: string; saldo: number; min: number }[] = [];

      forecast.push({
        data: format(new Date(), "dd/MM"),
        saldo: currentBalance,
        min: 10000,
      });

      const sortedDates = Array.from(dateMap.keys()).sort();
      for (const date of sortedDates) {
        runningBalance += dateMap.get(date) || 0;
        forecast.push({
          data: format(new Date(date), "dd/MM"),
          saldo: runningBalance,
          min: 10000,
        });
      }

      const minBalance = Math.min(...forecast.map((f) => f.saldo));
      const minBalanceDate = forecast.find((f) => f.saldo === minBalance)?.data || "";

      return { forecast, minBalance, minBalanceDate };
    },
  });
}

export function useCreateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeadlineInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("deadlines")
        .insert({
          title: input.description,
          description: input.description,
          deadline_type: input.type === "incasso" ? "income" : "payment",
          amount: input.amount,
          due_date: input.dueDate,
          invoice_id: input.invoiceId || null,
          status: "pending",
          user_id: user.id,
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
      
      if (input.description !== undefined) {
        updateData.title = input.description;
        updateData.description = input.description;
      }
      if (input.type !== undefined) updateData.deadline_type = input.type === "incasso" ? "income" : "payment";
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
        .select("id, invoice_number, vendor_name, amount, invoice_date")
        .order("invoice_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data?.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        vendor_name: inv.vendor_name,
        amount: inv.amount,
        invoice_date: inv.invoice_date,
      })) || [];
    },
  });
}
