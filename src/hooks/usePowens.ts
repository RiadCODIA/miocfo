import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BankAccount {
  id: string;
  plaid_item_id: string | null;
  plaid_account_id: string;
  bank_name: string;
  account_name: string | null;
  account_type: string | null;
  account_subtype: string | null;
  mask: string | null;
  iban: string | null;
  currency: string;
  current_balance: number;
  available_balance: number;
  status: "active" | "pending" | "error" | "disconnected";
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  source: "powens" | "manual";
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  plaid_transaction_id: string;
  amount: number;
  currency: string;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  pending: boolean;
  transaction_type: string | null;
  payment_channel: string | null;
  created_at: string;
}

export function usePowens() {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const { toast } = useToast();

  const callPowensFunction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("powens", {
        body: { action, ...params },
      });

      if (error) {
        console.error("[usePowens] Function error:", error);
        throw new Error(error.message || "Errore nella chiamata Powens");
      }

      if (data?.error) {
        console.error("[usePowens] API error:", data.error);
        throw new Error(data.error);
      }

      return data;
    },
    []
  );

  const createWebviewUrl = useCallback(
    async (redirectUri: string): Promise<{ webview_url: string; auth_token: string }> => {
      setIsLoading(true);
      try {
        const data = await callPowensFunction("create_webview_url", {
          redirect_uri: redirectUri,
        });
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [callPowensFunction]
  );

  const exchangeCode = useCallback(
    async (code: string): Promise<BankAccount[]> => {
      setIsLoading(true);
      try {
        const data = await callPowensFunction("exchange_code", { code });

        const newAccounts = data.accounts as BankAccount[];
        setAccounts((prev) => [...prev, ...newAccounts]);

        toast({
          title: "Conto collegato",
          description: `${newAccounts.length} conto/i collegati con successo`,
        });

        return newAccounts;
      } catch (error) {
        toast({
          title: "Errore",
          description:
            error instanceof Error ? error.message : "Errore nel collegamento",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callPowensFunction, toast]
  );

  const fetchAccounts = useCallback(async (): Promise<BankAccount[]> => {
    setIsLoading(true);
    try {
      const data = await callPowensFunction("get_accounts");
      const fetchedAccounts = data.accounts as BankAccount[];
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i conti bancari",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callPowensFunction, toast]);

  const syncAccount = useCallback(
    async (
      accountId: string
    ): Promise<{ account: BankAccount; transactions_synced: number }> => {
      setIsLoading(true);
      try {
        const data = await callPowensFunction("sync_account", {
          account_id: accountId,
        });

        // Update local state
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId ? (data.account as BankAccount) : acc
          )
        );

        toast({
          title: "Sincronizzazione completata",
          description: `${data.transactions_synced} transazioni sincronizzate`,
        });

        return data;
      } catch (error) {
        toast({
          title: "Errore sincronizzazione",
          description:
            error instanceof Error ? error.message : "Errore nella sincronizzazione",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callPowensFunction, toast]
  );

  const fetchTransactions = useCallback(
    async (
      accountId: string,
      startDate?: string,
      endDate?: string
    ): Promise<BankTransaction[]> => {
      setIsLoading(true);
      try {
        const data = await callPowensFunction("get_transactions", {
          account_id: accountId,
          start_date: startDate,
          end_date: endDate,
        });

        const fetchedTransactions = data.transactions as BankTransaction[];
        setTransactions(fetchedTransactions);
        return fetchedTransactions;
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare le transazioni",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callPowensFunction, toast]
  );

  const removeAccount = useCallback(
    async (accountId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await callPowensFunction("remove_connection", {
          account_id: accountId,
        });

        // Refresh accounts from DB
        await fetchAccounts();

        toast({
          title: "Conto rimosso",
          description: `${result.deleted_count || 1} conto/i scollegati con successo`,
        });
      } catch (error) {
        toast({
          title: "Errore",
          description:
            error instanceof Error ? error.message : "Errore nella rimozione",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callPowensFunction, toast, fetchAccounts]
  );

  return {
    isLoading,
    accounts,
    transactions,
    createWebviewUrl,
    exchangeCode,
    fetchAccounts,
    syncAccount,
    fetchTransactions,
    removeAccount,
  };
}
