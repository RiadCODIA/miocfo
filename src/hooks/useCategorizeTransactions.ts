import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategorizationResult {
  transaction_id: string;
  category_id: string;
  category_name: string;
  confidence: number;
  reasoning: string;
}

export interface UseCategorizeTransactionsResult {
  categorize: (transactionIds?: string[]) => Promise<CategorizationResult[]>;
  categorizeBatch: () => Promise<CategorizationResult[]>;
  isLoading: boolean;
  error: string | null;
  results: CategorizationResult[];
}

export function useCategorizeTransactions(): UseCategorizeTransactionsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CategorizationResult[]>([]);

  const categorize = async (transactionIds?: string[]): Promise<CategorizationResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("categorize-transactions", {
        body: { transaction_ids: transactionIds },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Limite di richieste raggiunto. Riprova tra qualche secondo.");
        } else if (data.error.includes("Payment required")) {
          toast.error("Crediti AI esauriti. Aggiungi crediti nelle impostazioni.");
        } else {
          toast.error(data.error);
        }
        throw new Error(data.error);
      }

      setResults(data.results || []);
      return data.results || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante la categorizzazione";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeBatch = async (): Promise<CategorizationResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("categorize-transactions", {
        body: { batch_mode: true },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Limite di richieste raggiunto. Riprova tra qualche secondo.");
        } else if (data.error.includes("Payment required")) {
          toast.error("Crediti AI esauriti. Aggiungi crediti nelle impostazioni.");
        } else {
          toast.error(data.error);
        }
        throw new Error(data.error);
      }

      setResults(data.results || []);
      return data.results || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante la categorizzazione batch";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categorize,
    categorizeBatch,
    isLoading,
    error,
    results,
  };
}