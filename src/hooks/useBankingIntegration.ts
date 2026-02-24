import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  bank_name: string;
  name: string | null;
  account_type: string | null;
  iban: string | null;
  currency: string;
  balance: number;
  status: "active" | "pending" | "error" | "disconnected";
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  fiscal_id: string | null;
  acube_account_id: string | null;
  provider: string | null;
  current_balance?: number;
  available_balance?: number;
  mask?: string | null;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string | null;
  amount: number;
  date: string;
  description: string | null;
  merchant_name: string | null;
  category: string | null;
  transaction_type: string | null;
  created_at: string;
}

export interface ASPSP {
  name: string;
  country: string;
  logo?: string;
  bic?: string;
  [key: string]: unknown;
}

export function useBankingIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  const callEnableBankingFunction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      const publicActions = ["get_aspsps"];
      let session = (await supabase.auth.getSession()).data.session;

      if (!publicActions.includes(action) && !session?.access_token) {
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          session = (await supabase.auth.getSession()).data.session;
          if (session?.access_token) break;
        }
        if (!session?.access_token) {
          throw new Error("Autenticazione richiesta. Effettua il login per utilizzare i conti bancari.");
        }
      }

      const supabaseUrl = "https://yzhonmuhywdiqaxxbnsj.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY";
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
        console.error("[useBankingIntegration] Function error:", response.status, data);
        const errorMessage = data?.error || "Errore nella chiamata Enable Banking";
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error("[useBankingIntegration] API error:", data.error);
        throw new Error(data.error);
      }

      return data;
    },
    []
  );

  const getASPSPs = useCallback(
    async (country: string = "IT"): Promise<ASPSP[]> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("get_aspsps", { aspsp_country: country });
        return (data.aspsps || []) as ASPSP[];
      } finally {
        setIsLoading(false);
      }
    },
    [callEnableBankingFunction]
  );

  const startAuth = useCallback(
    async (aspspName: string, aspspCountry: string, redirectUri: string, psuType: string = "personal"): Promise<{ authorization_url: string; state: string }> => {
      setIsLoading(true);
      try {
        const data = await callEnableBankingFunction("start_auth", {
          aspsp_name: aspspName, aspsp_country: aspspCountry, redirect_uri: redirectUri, psu_type: psuType,
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
      const { data, error } = await supabase.from("bank_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const fetchedAccounts = ((data || []) as any[]).map(acc => ({
        ...acc, current_balance: acc.balance, available_balance: acc.balance,
        status: (acc.is_connected !== false ? "active" : "disconnected") as "active" | "pending" | "error" | "disconnected",
      })) as BankAccount[];
      setAccounts(fetchedAccounts);
      return fetchedAccounts;
    } catch (error) {
      toast.error("Errore", { description: "Impossibile caricare i conti bancari" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        const { data, error } = await supabase.from("bank_transactions").select("*")
          .eq("bank_account_id", accountId)
          .gte("date", startDate || "2000-01-01")
          .lte("date", endDate || new Date().toISOString().split("T")[0])
          .order("date", { ascending: false });
        if (error) throw error;
        const fetchedTransactions = data as BankTransaction[];
        setTransactions(fetchedTransactions);
        return fetchedTransactions;
      } catch (error) {
        toast.error("Errore", { description: "Impossibile caricare le transazioni" });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
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

  return { isLoading, accounts, transactions, getASPSPs, startAuth, completeSession, fetchAccounts, syncAccount, fetchTransactions, removeAccount };
}

export function useBankAccountsQuery() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async (): Promise<BankAccount[]> => {
      const { data, error } = await supabase.from("bank_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).map((acc) => ({
        ...acc, current_balance: acc.balance, available_balance: acc.balance,
        status: (acc.is_connected !== false ? "active" : "disconnected") as "active" | "pending" | "error" | "disconnected",
      })) as BankAccount[];
    },
  });
}
