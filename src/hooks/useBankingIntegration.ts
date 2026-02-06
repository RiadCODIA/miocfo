import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  // Legacy fields for compatibility
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

export function useBankingIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const { toast } = useToast();

  const callAcubeFunction = useCallback(
    async (action: string, params: Record<string, unknown> = {}) => {
      // Get the current session for auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Autenticazione richiesta. Effettua il login per utilizzare i conti bancari.");
      }

      const supabaseUrl = "https://yzhonmuhywdiqaxxbnsj.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY";
      
      const response = await fetch(`${supabaseUrl}/functions/v1/acube-banking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[useBankingIntegration] Function error:", response.status, data);
        const errorMessage = data?.error || "Errore nella chiamata A-Cube";
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

  // Start bank connection flow with fiscal ID
  const createConnectRequest = useCallback(
    async (
      redirectUri: string,
      fiscalId: string
    ): Promise<{ connect_url: string }> => {
      setIsLoading(true);
      try {
        const data = await callAcubeFunction("connect_request", {
          redirect_uri: redirectUri,
          fiscal_id: fiscalId,
        });
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [callAcubeFunction]
  );

  // Complete connection after redirect (sync accounts)
  const completeConnection = useCallback(
    async (fiscalId: string): Promise<BankAccount[]> => {
      setIsLoading(true);
      try {
        const data = await callAcubeFunction("complete_connection", {
          fiscal_id: fiscalId,
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
    [callAcubeFunction, toast]
  );

  const fetchAccounts = useCallback(async (): Promise<BankAccount[]> => {
    setIsLoading(true);
    try {
      const data = await callAcubeFunction("get_accounts");
      const fetchedAccounts = (data.accounts as (BankAccount & { is_connected?: boolean })[]).map(acc => ({
        ...acc,
        // Ensure balance fields are set for compatibility
        current_balance: acc.balance,
        available_balance: acc.balance,
        status: (acc.is_connected !== false ? "active" : "disconnected") as "active" | "pending" | "error" | "disconnected",
      }));
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
  }, [callAcubeFunction, toast]);

  const syncAccount = useCallback(
    async (
      accountId: string
    ): Promise<{ account: BankAccount; transactions_synced: number }> => {
      setIsLoading(true);
      try {
        const data = await callAcubeFunction("sync_account", {
          account_id: accountId,
        });

        toast({
          title: "Sincronizzazione completata",
          description: `${data.transactions_synced} transazioni sincronizzate`,
        });

        // Refresh all accounts from DB
        await fetchAccounts();

        return data;
      } catch (error) {
        toast({
          title: "Errore sincronizzazione",
          description:
            error instanceof Error ? error.message : "Errore nella sincronizzazione",
          variant: "destructive",
        });
        
        // Refresh accounts to sync UI
        try {
          await fetchAccounts();
        } catch {
          // Ignore fetch error
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callAcubeFunction, toast, fetchAccounts]
  );

  const fetchTransactions = useCallback(
    async (
      accountId: string,
      startDate?: string,
      endDate?: string
    ): Promise<BankTransaction[]> => {
      setIsLoading(true);
      try {
        // Fetch from database directly
        const { data, error } = await supabase
          .from("bank_transactions")
          .select("*")
          .eq("bank_account_id", accountId)
          .gte("date", startDate || "2000-01-01")
          .lte("date", endDate || new Date().toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) throw error;

        const fetchedTransactions = data as BankTransaction[];
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
    [toast]
  );

  const removeAccount = useCallback(
    async (accountId: string): Promise<void> => {
      setIsLoading(true);
      try {
        const result = await callAcubeFunction("remove_connection", {
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
    [callAcubeFunction, toast, fetchAccounts]
  );

  return {
    isLoading,
    accounts,
    transactions,
    createConnectRequest,
    completeConnection,
    fetchAccounts,
    syncAccount,
    fetchTransactions,
    removeAccount,
  };
}
