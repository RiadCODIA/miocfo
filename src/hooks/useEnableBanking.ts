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
  source: "enable_banking" | "manual";
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

export function useEnableBanking() {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const { toast } = useToast();

  const callEnableBankingFunction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      const { data, error } = await supabase.functions.invoke("enable-banking", {
        body: { action, ...params },
      });

      if (error) {
        console.error("[useEnableBanking] Function error:", error);
        throw new Error(error.message || "Errore nella chiamata Enable Banking");
      }

      if (data?.error) {
        console.error("[useEnableBanking] API error:", data.error);
        throw new Error(data.error);
      }

      return data;
    },
    []
  );

  const createSession = useCallback(
    async (
      redirectUri: string,
      aspspCountry?: string,
      aspspName?: string
    ): Promise<{ session_id: string; authorization_url: string }> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("create_session", {
          redirect_uri: redirectUri,
          aspsp_country: aspspCountry,
          aspsp_name: aspspName,
        });
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const completeSession = useCallback(
    async (sessionId: string): Promise<BankAccount[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("complete_session", {
          session_id: sessionId,
        });

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
    [callEnableBankingFunction, toast]
  );

  const fetchAccounts = useCallback(async (): Promise<BankAccount[]> => {
    setIsLoading(true);
    try {
      const data = await callEnableBankingFunction("get_accounts");
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
  }, [callEnableBankingFunction, toast]);

  const syncAccount = useCallback(
    async (
      accountId: string
    ): Promise<{ account: BankAccount; transactions_synced: number }> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("sync_account", {
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
    [callEnableBankingFunction, toast]
  );

  const fetchTransactions = useCallback(
    async (
      accountId: string,
      startDate?: string,
      endDate?: string
    ): Promise<BankTransaction[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("get_transactions", {
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
    [callEnableBankingFunction, toast]
  );

  const removeAccount = useCallback(
    async (accountId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await callEnableBankingFunction("remove_connection", {
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
    [callEnableBankingFunction, toast, fetchAccounts]
  );

  const getASPSPs = useCallback(
    async (country: string): Promise<unknown[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("get_aspsps", {
          aspsp_country: country,
        });
        return data.aspsps;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  return {
    isLoading,
    accounts,
    transactions,
    createSession,
    completeSession,
    fetchAccounts,
    syncAccount,
    fetchTransactions,
    removeAccount,
    getASPSPs,
  };
}
