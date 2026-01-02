import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subWeeks, subMonths } from "date-fns";

export interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  bankAccountId: string;
  bankName: string;
  category: string[];
  pending: boolean;
  merchantName: string | null;
}

interface UseTransactionsOptions {
  searchTerm?: string;
  period?: "all" | "today" | "week" | "month";
  accountId?: string;
  category?: string;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { searchTerm, period = "all", accountId, category } = options;

  return useQuery({
    queryKey: ["transactions", { searchTerm, period, accountId, category }],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from("bank_transactions")
        .select(`
          id,
          date,
          name,
          amount,
          bank_account_id,
          category,
          pending,
          merchant_name,
          bank_accounts!inner(bank_name)
        `)
        .order("date", { ascending: false })
        .limit(100);

      // Apply period filter
      const now = new Date();
      if (period === "today") {
        query = query.eq("date", format(now, "yyyy-MM-dd"));
      } else if (period === "week") {
        query = query.gte("date", format(subWeeks(now, 1), "yyyy-MM-dd"));
      } else if (period === "month") {
        query = query.gte("date", format(subMonths(now, 1), "yyyy-MM-dd"));
      }

      // Apply account filter
      if (accountId && accountId !== "all") {
        query = query.eq("bank_account_id", accountId);
      }

      const { data, error } = await query;

      if (error) throw error;

      let transactions = data?.map((tx: any) => ({
        id: tx.id,
        date: tx.date,
        name: tx.name,
        amount: Number(tx.amount),
        bankAccountId: tx.bank_account_id,
        bankName: tx.bank_accounts?.bank_name || "N/A",
        category: tx.category || [],
        pending: tx.pending,
        merchantName: tx.merchant_name,
      })) || [];

      // Apply search filter client-side
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        transactions = transactions.filter(
          tx =>
            tx.name.toLowerCase().includes(search) ||
            tx.merchantName?.toLowerCase().includes(search) ||
            tx.category?.some((c: string) => c.toLowerCase().includes(search))
        );
      }

      // Apply category filter client-side
      if (category && category !== "all") {
        transactions = transactions.filter(tx =>
          tx.category?.some((c: string) => c.toLowerCase().includes(category.toLowerCase()))
        );
      }

      return transactions;
    },
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, account_name")
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
  });
}
