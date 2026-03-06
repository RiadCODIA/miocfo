import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { useDateRange } from "@/contexts/DateRangeContext";

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
  const isExpense = inv.invoice_type === "expense" || inv.invoice_type === "ricevuta";
  const today = format(new Date(), "yyyy-MM-dd");

  let status: Deadline["status"];
  let dueDate: string;

  const isPaid = inv.payment_status === "paid" || inv.payment_status === "matched";

  if (isPaid) {
    status = "completed";
    dueDate = inv.due_date || inv.invoice_date || today;
  } else if (!inv.due_date) {
    // No due date and not explicitly paid → treat as pending (user can manage)
    status = "pending";
    dueDate = inv.invoice_date || today;
  } else if (inv.due_date < today) {
    status = "overdue";
    dueDate = inv.due_date;
  } else {
    status = "pending";
    dueDate = inv.due_date;
  }

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
    status,
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

      // 2. Fetch ALL invoices (not just unpaid) to apply new logic
      const linkedInvoiceIds = manualDeadlines
        .filter((d) => d.invoiceId)
        .map((d) => d.invoiceId as string);

      let invQuery = supabase
        .from("invoices")
        .select("id, invoice_number, vendor_name, client_name, invoice_type, total_amount, due_date, invoice_date, payment_status, source")
        .order("due_date", { ascending: true });

      // Apply type filter to invoices too
      if (filters?.type && filters.type !== "all") {
        invQuery = invQuery.in("invoice_type", filters.type === "incasso" ? ["income", "emessa"] : ["expense", "ricevuta"]);
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
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["deadlines-summary", from, to],
    queryFn: async () => {
      // Fetch manual deadlines within date range
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("id, title, description, deadline_type, amount, status, invoice_id, due_date")
        .in("status", ["pending", "overdue"])
        .gte("due_date", from)
        .lte("due_date", to);
      if (deadlinesError) throw deadlinesError;
      const linkedInvoiceIds = (deadlinesData || [])
        .filter((d) => d.invoice_id)
        .map((d) => d.invoice_id as string);

      // Fetch ALL invoices (we apply the new logic client-side)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_type, total_amount, due_date, invoice_date, payment_status, invoice_number, vendor_name, client_name, source");
      if (invoicesError) throw invoicesError;

      const today = format(new Date(), "yyyy-MM-dd");

      // Combine - only count PENDING/OVERDUE entries
      type Entry = { type: "incasso" | "pagamento"; amount: number; isOverdue: boolean; id: string; title: string; dueDate: string; source: "manual" | "invoice"; invoiceId: string | null };
      const entries: Entry[] = [];

      // Manual deadlines are already filtered to pending/overdue
      (deadlinesData || []).forEach((d) => {
        entries.push({
          type: d.deadline_type === "income" ? "incasso" : "pagamento",
          amount: Number(d.amount),
          isOverdue: d.status === "overdue",
          id: d.id,
          title: d.title || d.description || "Scadenza manuale",
          dueDate: d.due_date,
          source: "manual",
          invoiceId: d.invoice_id,
        });
      });

      // Invoice-derived: only include those with due_date AND not paid
      (invoicesData || [])
        .filter((inv) => !linkedInvoiceIds.includes(inv.id))
        .forEach((inv) => {
          const isPaid = inv.payment_status === "paid" || inv.payment_status === "matched";
          if (isPaid) return; // Already completed, skip
          
          const isExpense = inv.invoice_type === "expense" || inv.invoice_type === "ricevuta";
          const isOverdue = inv.due_date < today;
          const counterpart = isExpense ? (inv as any).vendor_name : (inv as any).client_name;
          const label = (inv as any).invoice_number
            ? `Fatt. ${(inv as any).invoice_number}${counterpart ? ` - ${counterpart}` : ""}`
            : counterpart || (isExpense ? "Fattura passiva" : "Fattura attiva");
          
          entries.push({
            type: isExpense ? "pagamento" : "incasso",
            amount: Number(inv.total_amount),
            isOverdue,
            id: `inv-${inv.id}`,
            title: label,
            dueDate: inv.due_date,
            source: "invoice",
            invoiceId: inv.id,
          });
        });

      const incassiTotali = entries.filter((e) => e.type === "incasso").reduce((s, e) => s + e.amount, 0);
      const pagamentiTotali = entries.filter((e) => e.type === "pagamento").reduce((s, e) => s + e.amount, 0);
      const incassiCount = entries.filter((e) => e.type === "incasso").length;
      const pagamentiCount = entries.filter((e) => e.type === "pagamento").length;
      const overdueCount = entries.filter((e) => e.isOverdue).length;
      const overdueAmount = entries.filter((e) => e.isOverdue).reduce((s, e) => s + e.amount, 0);

      const overdueIncassi = entries.filter((e) => e.isOverdue && e.type === "incasso");
      const overduePagamenti = entries.filter((e) => e.isOverdue && e.type === "pagamento");

      return {
        incassiTotali,
        pagamentiTotali,
        incassiCount,
        pagamentiCount,
        overdueCount,
        overdueAmount,
        overdueIncassi,
        overduePagamenti,
        saldoNetto: incassiTotali - pagamentiTotali,
      };
    },
  });
}

export interface AccrualMonth {
  month: string; // "Gen 2025", "Feb 2025", etc.
  ricaviPagati: number;
  ricaviDaPagare: number;
  costiPagati: number;
  costiDaPagare: number;
}

export function useAccrualForecast() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["accrual-forecast", from, to],
    queryFn: async (): Promise<AccrualMonth[]> => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("invoice_type, total_amount, due_date, invoice_date, payment_status")
        .order("invoice_date", { ascending: true });
      if (error) throw error;

      const monthMap = new Map<string, AccrualMonth>();

      // Build months from dateRange
      let cursor = startOfMonth(dateRange.from);
      const end = startOfMonth(dateRange.to);
      while (cursor <= end) {
        const key = format(cursor, "yyyy-MM");
        const label = format(cursor, "MMM yyyy");
        monthMap.set(key, { month: label, ricaviPagati: 0, ricaviDaPagare: 0, costiPagati: 0, costiDaPagare: 0 });
        cursor = addMonths(cursor, 1);
      }

      (invoices || []).forEach((inv) => {
        // Determine the accrual month from invoice_date or due_date
        const refDate = inv.invoice_date || inv.due_date;
        if (!refDate) return;
        const key = refDate.substring(0, 7); // "yyyy-MM"
        
        const entry = monthMap.get(key);
        if (!entry) return; // Outside our range

        const amount = Math.abs(Number(inv.total_amount));
        const isIncome = inv.invoice_type === "income" || inv.invoice_type === "emessa";
        
        // Determine if paid/collected
        const isPaidOrCollected = inv.payment_status === "paid" || inv.payment_status === "matched";

        if (isIncome) {
          if (isPaidOrCollected) {
            entry.ricaviPagati += amount;
          } else {
            entry.ricaviDaPagare += amount;
          }
        } else {
          if (isPaidOrCollected) {
            entry.costiPagati += amount;
          } else {
            entry.costiDaPagare += amount;
          }
        }
      });

      // Convert to sorted array
      const sortedKeys = Array.from(monthMap.keys()).sort();
      return sortedKeys.map((k) => monthMap.get(k)!);
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
      queryClient.invalidateQueries({ queryKey: ["accrual-forecast"] });
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
      queryClient.invalidateQueries({ queryKey: ["accrual-forecast"] });
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
      queryClient.invalidateQueries({ queryKey: ["accrual-forecast"] });
    },
  });
}

export function useCompleteDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deadline: Deadline) => {
      if (deadline.source === "invoice" && deadline.invoiceId) {
        const { error } = await supabase
          .from("invoices")
          .update({ payment_status: "paid" })
          .eq("id", deadline.invoiceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("deadlines")
          .update({ status: "completed" })
          .eq("id", deadline.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["accrual-forecast"] });
      queryClient.invalidateQueries({ queryKey: ["conto-economico"] });
    },
  });
}

export function useUncompleteDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deadline: Deadline) => {
      if (deadline.source === "invoice" && deadline.invoiceId) {
        // Revert invoice payment_status to "pending"
        const { error } = await supabase
          .from("invoices")
          .update({ payment_status: "pending" })
          .eq("id", deadline.invoiceId);
        if (error) throw error;
      } else {
        // Determine correct status based on due_date vs today
        const today = format(new Date(), "yyyy-MM-dd");
        const newStatus = deadline.dueDate < today ? "overdue" : "pending";
        const { error } = await supabase
          .from("deadlines")
          .update({ status: newStatus })
          .eq("id", deadline.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines-summary"] });
      queryClient.invalidateQueries({ queryKey: ["accrual-forecast"] });
      queryClient.invalidateQueries({ queryKey: ["conto-economico"] });
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

// Keep for FlussiCassa page compatibility
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

      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, invoice_type, total_amount, due_date, invoice_date, payment_status")
        .not("due_date", "is", null)
        .neq("payment_status", "paid")
        .neq("payment_status", "matched")
        .gte("due_date", today)
        .lte("due_date", thirtyDaysLater);
      if (invoicesError) throw invoicesError;

      const dateMap = new Map<string, number>();

      deadlines?.forEach((d) => {
        const impact = d.deadline_type === "income" ? Number(d.amount) : -Number(d.amount);
        dateMap.set(d.due_date, (dateMap.get(d.due_date) || 0) + impact);
      });

      (invoices || [])
        .filter((inv) => !linkedInvoiceIds.includes(inv.id))
        .forEach((inv) => {
          const dueDate = inv.due_date!;
          const impact = inv.invoice_type === "expense" ? -Number(inv.total_amount) : Number(inv.total_amount);
          dateMap.set(dueDate, (dateMap.get(dueDate) || 0) + impact);
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
