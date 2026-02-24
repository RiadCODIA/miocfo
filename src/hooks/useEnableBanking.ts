import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export interface DebugTransactionsResult {
  account_id: string;
  enable_banking_uid: string;
  psu_context: { ip: string | null; userAgent: string | null };
  test_results: Array<{
    variant: string;
    params: Record<string, string>;
    status: number | string;
    body: unknown;
    success: boolean;
  }>;
}

export function useEnableBanking() {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  const callEnableBankingFunction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      const publicActions = ["get_aspsps"];
      const { data: { session } } = await supabase.auth.getSession();

      if (!publicActions.includes(action) && !session?.access_token) {
        throw new Error("Autenticazione richiesta. Effettua il login per utilizzare i conti bancari.");
      }

      const supabaseUrl = "https://ublsnradzhfpqhunfqbn.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibHNucmFkemhmcHFodW5mcWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODUyNDQsImV4cCI6MjA4MTY2MTI0NH0.njhpIOLukx6bmrw5p-AHCNShPkCnB-QqrDOvkYSkTOw";
      const authToken = session?.access_token || anonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/enable-banking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[useEnableBanking] Function error:", response.status, data);
        const errorMessage = data?.error || "Errore nella chiamata Enable Banking";
        throw new Error(errorMessage);
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
    async (redirectUri: string, aspspCountry?: string, aspspName?: string, psuType?: "personal" | "business"): Promise<{ session_id: string; authorization_url: string }> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("create_session", {
          redirect_uri: redirectUri, aspsp_country: aspspCountry, aspsp_name: aspspName, psu_type: psuType || "personal",
        });
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const completeSession = useCallback(
    async (code: string): Promise<BankAccount[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("complete_session", { code });
        const newAccounts = data.accounts as BankAccount[];
        setAccounts((prev) => [...prev, ...newAccounts]);
        toast.success("Conto collegato", { description: `${newAccounts.length} conto/i collegati con successo` });
        return newAccounts;
      } catch (error) {
        toast.error("Errore", { description: error instanceof Error ? error.message : "Errore nel collegamento" });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const fetchAccounts = useCallback(async (): Promise<BankAccount[]> => {
    setIsLoading(true);
    try {
      const data = await callEnableBankingFunction("get_accounts");
      const fetchedAccounts = data.accounts as BankAccount[];
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (error) {
      toast.error("Errore", { description: "Impossibile caricare i conti bancari" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callEnableBankingFunction]);

  const syncAccount = useCallback(
    async (accountId: string): Promise<{ account: BankAccount; transactions_synced: number }> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("sync_account", { account_id: accountId });
        toast.success("Sincronizzazione completata", { description: `${data.transactions_synced} transazioni sincronizzate` });
        await fetchAccounts();
        return data;
      } catch (error) {
        toast.error("Errore sincronizzazione", { description: error instanceof Error ? error.message : "Errore nella sincronizzazione" });
        try { await fetchAccounts(); } catch { /* Ignore */ }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction, fetchAccounts]
  );

  const fetchTransactions = useCallback(
    async (accountId: string, startDate?: string, endDate?: string): Promise<BankTransaction[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("get_transactions", {
          account_id: accountId, start_date: startDate, end_date: endDate,
        });
        const fetchedTransactions = data.transactions as BankTransaction[];
        setTransactions(fetchedTransactions);
        return fetchedTransactions;
      } catch (error) {
        toast.error("Errore", { description: "Impossibile caricare le transazioni" });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const removeAccount = useCallback(
    async (accountId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await callEnableBankingFunction("remove_connection", { account_id: accountId });
        await fetchAccounts();
        toast.success("Conto rimosso", { description: `${result.deleted_count || 1} conto/i scollegati con successo` });
      } catch (error) {
        toast.error("Errore", { description: error instanceof Error ? error.message : "Errore nella rimozione" });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction, fetchAccounts]
  );

  const getASPSPs = useCallback(
    async (country: string): Promise<unknown[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("get_aspsps", { aspsp_country: country });
        return data.aspsps;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const debugTransactions = useCallback(
    async (accountId: string): Promise<DebugTransactionsResult> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("debug_transactions", { account_id: accountId });
        return data as DebugTransactionsResult;
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  return { isLoading, accounts, transactions, createSession, completeSession, fetchAccounts, syncAccount, fetchTransactions, removeAccount, getASPSPs, debugTransactions };
}
