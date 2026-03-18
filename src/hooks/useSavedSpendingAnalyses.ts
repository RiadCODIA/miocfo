import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { SpendingAnalysis } from "./useSpendingAnalysis";

export interface SavedSpendingAnalysisDocument {
  id: string;
  title: string;
  createdAt: string;
  monthYear: string;
  payload: SpendingAnalysis;
}

export function useSavedSpendingAnalyses() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["ai-analysis-documents", user?.id, "transaction_spending"],
    enabled: !!user,
    queryFn: async (): Promise<SavedSpendingAnalysisDocument[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("ai_analysis_documents")
        .select("id, title, payload, created_at, month_year")
        .eq("analysis_type", "transaction_spending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((document) => ({
        id: document.id,
        title: document.title,
        createdAt: document.created_at,
        monthYear: document.month_year,
        payload: document.payload as unknown as SpendingAnalysis,
      }));
    },
  });

  return {
    analyses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
