import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subWeeks, subMonths } from "date-fns";

export interface Transaction {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  bankAccountId: string;
  bankName: string;
  category: string | null;
  merchantName: string | null;
  aiCategoryId: string | null;
  categoryConfirmed: boolean;
  transactionType: string | null;
  externalId: string | null;
}

interface UseTransactionsOptions {
  searchTerm?: string;
  period?: "all" | "today" | "week" | "month";
  accountId?: string;
  category?: string;
  // Advanced filters
  minAmount?: number;
  maxAmount?: number;
  transactionType?: "all" | "income" | "expense";
  startDate?: string;
  endDate?: string;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { 
    searchTerm, 
    period = "all", 
    accountId, 
    category,
    minAmount,
    maxAmount,
    transactionType = "all",
    startDate,
    endDate,
  } = options;

  return useQuery({
    queryKey: ["transactions", { searchTerm, period, accountId, category, minAmount, maxAmount, transactionType, startDate, endDate }],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from("bank_transactions")
        .select(`
          id,
          date,
          description,
          amount,
          bank_account_id,
          category,
          merchant_name,
          ai_category_id,
          category_confirmed,
          transaction_type,
          external_id,
          bank_accounts!inner(bank_name)
        `)
        .order("date", { ascending: false })
        .limit(5000);

      // Apply period filter (only if no custom date range)
      const now = new Date();
      if (!startDate && !endDate) {
        if (period === "today") {
          query = query.eq("date", format(now, "yyyy-MM-dd"));
        } else if (period === "week") {
          query = query.gte("date", format(subWeeks(now, 1), "yyyy-MM-dd"));
        } else if (period === "month") {
          query = query.gte("date", format(subMonths(now, 1), "yyyy-MM-dd"));
        }
      }
      
      // Apply custom date range filter
      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
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
        description: tx.description,
        amount: Number(tx.amount),
        bankAccountId: tx.bank_account_id,
        bankName: tx.bank_accounts?.bank_name || "N/A",
        category: tx.category,
        merchantName: tx.merchant_name,
        aiCategoryId: tx.ai_category_id,
        categoryConfirmed: tx.category_confirmed ?? false,
        transactionType: tx.transaction_type,
        externalId: tx.external_id,
      })) || [];

      // Apply search filter client-side
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        transactions = transactions.filter(
          tx =>
            (tx.description || "").toLowerCase().includes(search) ||
            tx.merchantName?.toLowerCase().includes(search) ||
            (tx.category || "").toLowerCase().includes(search)
        );
      }

      // Apply category filter client-side
      if (category && category !== "all") {
        if (category === "uncategorized") {
          // Filter for transactions without AI category and not confirmed
          transactions = transactions.filter(tx => !tx.aiCategoryId && !tx.categoryConfirmed);
        } else {
          // Filter by specific category ID
          transactions = transactions.filter(tx => tx.aiCategoryId === category);
        }
      }

      // Apply amount filters client-side
      if (minAmount !== undefined && !isNaN(minAmount)) {
        transactions = transactions.filter(tx => Math.abs(tx.amount) >= minAmount);
      }
      if (maxAmount !== undefined && !isNaN(maxAmount)) {
        transactions = transactions.filter(tx => Math.abs(tx.amount) <= maxAmount);
      }

      // Apply transaction type filter
      if (transactionType === "income") {
        transactions = transactions.filter(tx => tx.amount > 0);
      } else if (transactionType === "expense") {
        transactions = transactions.filter(tx => tx.amount < 0);
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
        .select("id, bank_name, name");

      if (error) throw error;
      return data || [];
    },
  });
}
