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
  aiCategoryId: string | null;
  aiConfidence: number | null;
  categoryConfirmed: boolean;
  // Extended fields from Enable Banking PSD2 API
  valueDate: string | null;
  transactionDate: string | null;
  creditDebitIndicator: string | null;
  creditorName: string | null;
  creditorIban: string | null;
  debtorName: string | null;
  debtorIban: string | null;
  mccCode: string | null;
  bankTxCode: string | null;
  bankTxDescription: string | null;
  referenceNumber: string | null;
  balanceAfter: number | null;
  entryReference: string | null;
  currency: string;
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
          ai_category_id,
          ai_confidence,
          category_confirmed,
          currency,
          value_date,
          transaction_date,
          credit_debit_indicator,
          creditor_name,
          creditor_iban,
          debtor_name,
          debtor_iban,
          mcc_code,
          bank_tx_code,
          bank_tx_description,
          reference_number,
          balance_after,
          entry_reference,
          bank_accounts!inner(bank_name)
        `)
        .order("date", { ascending: false })
        .limit(500);

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
        aiCategoryId: tx.ai_category_id,
        aiConfidence: tx.ai_confidence,
        categoryConfirmed: tx.category_confirmed ?? false,
        currency: tx.currency || "EUR",
        valueDate: tx.value_date,
        transactionDate: tx.transaction_date,
        creditDebitIndicator: tx.credit_debit_indicator,
        creditorName: tx.creditor_name,
        creditorIban: tx.creditor_iban,
        debtorName: tx.debtor_name,
        debtorIban: tx.debtor_iban,
        mccCode: tx.mcc_code,
        bankTxCode: tx.bank_tx_code,
        bankTxDescription: tx.bank_tx_description,
        referenceNumber: tx.reference_number,
        balanceAfter: tx.balance_after ? Number(tx.balance_after) : null,
        entryReference: tx.entry_reference,
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
        if (category === "uncategorized") {
          // Filter for transactions without AI category and not confirmed
          transactions = transactions.filter(tx => !tx.aiCategoryId && !tx.categoryConfirmed);
        } else {
          // Filter by specific category ID
          transactions = transactions.filter(tx => tx.aiCategoryId === category);
        }
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
