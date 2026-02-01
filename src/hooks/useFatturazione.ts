import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense" | "all";
  bankAccountId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionWithBank {
  id: string;
  date: string;
  name: string;
  amount: number;
  bank_name: string;
  bank_account_id: string;
  category: string[] | null;
}

export interface PeriodStats {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  transactionCount: number;
}

const DEFAULT_PAGE_SIZE = 25;

export function useAllTransactions(filters: TransactionFilters = {}) {
  const {
    startDate = subDays(new Date(), 30).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    type = "all",
    bankAccountId,
    search,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  return useQuery({
    queryKey: ["all-transactions", startDate, endDate, type, bankAccountId, search, page, pageSize],
    queryFn: async () => {
      // Build the query
      let query = supabase
        .from("bank_transactions")
        .select(`
          id,
          date,
          name,
          amount,
          category,
          bank_account_id,
          bank_accounts!inner(bank_name)
        `, { count: "exact" })
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      // Apply type filter
      if (type === "income") {
        query = query.gt("amount", 0);
      } else if (type === "expense") {
        query = query.lt("amount", 0);
      }

      // Apply bank filter
      if (bankAccountId) {
        query = query.eq("bank_account_id", bankAccountId);
      }

      // Apply search filter
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Transform data to include bank_name at root level
      const transactions: TransactionWithBank[] = (data || []).map((t: any) => ({
        id: t.id,
        date: t.date,
        name: t.name,
        amount: t.amount,
        category: t.category,
        bank_account_id: t.bank_account_id,
        bank_name: t.bank_accounts?.bank_name || "N/A",
      }));

      return {
        transactions,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
  });
}

export function usePeriodStats(startDate?: string, endDate?: string) {
  const start = startDate || subDays(new Date(), 30).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ["period-stats", start, end],
    queryFn: async (): Promise<PeriodStats> => {
      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", start)
        .lte("date", end);

      if (error) throw error;

      const income = (transactions || [])
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = (transactions || [])
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      return {
        totalIncome: Math.round(income * 100) / 100,
        totalExpenses: Math.round(expenses * 100) / 100,
        netFlow: Math.round((income - expenses) * 100) / 100,
        transactionCount: transactions?.length || 0,
      };
    },
  });
}

export function useBankAccountsList() {
  return useQuery({
    queryKey: ["bank-accounts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_name")
        .order("bank_name");

      if (error) throw error;
      return data || [];
    },
  });
}

export function exportTransactionsToCSV(transactions: TransactionWithBank[]) {
  const headers = ["Data", "Descrizione", "Banca", "Importo", "Categoria"];
  const rows = transactions.map(t => [
    format(new Date(t.date), "dd/MM/yyyy"),
    `"${t.name.replace(/"/g, '""')}"`,
    t.bank_name,
    t.amount.toFixed(2).replace(".", ","),
    t.category?.join(", ") || "",
  ]);

  const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transazioni_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
