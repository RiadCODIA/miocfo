import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupplierAnalysis {
  name: string;
  amount: number;
  category: string;
  status: "high" | "ok" | "low";
  note?: string;
  recommendation?: string;
}

export interface CriticalArea {
  category: string;
  amount: number;
  percentage: number;
  warning: string;
  benchmark?: string;
}

export interface SavingSuggestion {
  title: string;
  description: string;
  estimatedSaving: number;
  priority?: "alta" | "media" | "bassa";
  timeline?: string;
  steps?: string[];
}

export interface CategoryBreakdown {
  name: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface TopSupplier {
  name: string;
  amount: number;
  transactionCount: number;
  category: string;
  monthlyAverage?: number;
  avgTransactionAmount?: number;
}

export interface MonthlyTrend {
  month: string;
  spending: number;
  income: number;
  changePercent: number;
}

export interface TrendAnalysis {
  monthlyTrend: { month: string; amount: number; changePercent: number }[];
  overallTrend: "increasing" | "stable" | "decreasing";
  seasonalPattern: string | null;
  forecast: number;
  trendNote?: string;
}

export interface CashFlowHealth {
  score: number;
  ratio: number;
  diagnosis: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations?: string[];
}

export interface Anomaly {
  description: string;
  amount: number;
  supplier: string;
  date?: string;
  reason: string;
  recommendation: string;
}

export interface ActionItem {
  action: string;
  priority: "urgente" | "alta" | "media";
  impact: string;
}

export interface SpendingAnalysis {
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
  transactionCount: number;
  periodMonths: number;
  avgMonthlySpending: number;
  topCategory: CategoryBreakdown | null;
  categoryBreakdown: CategoryBreakdown[];
  topSuppliers: TopSupplier[];
  monthlyTrend: MonthlyTrend[];
  rawAnomalies?: { name: string; amount: number; date: string; deviation: number }[];
  savedDocumentId?: string;
  aiAnalysis: {
    criticalAreas: CriticalArea[];
    savingSuggestions: SavingSuggestion[];
    supplierAnalysis: SupplierAnalysis[];
    actionItems: ActionItem[] | string[];
    summary: {
      potentialSavings: number;
      criticalAlerts: number;
      mainRisk: string;
      recommendation: string;
    };
    trendAnalysis?: TrendAnalysis;
    cashFlowHealth?: CashFlowHealth;
    anomalies?: Anomaly[];
  };
}

export interface UseSpendingAnalysisResult {
  analyze: () => Promise<SpendingAnalysis | null>;
  isLoading: boolean;
  error: string | null;
  data: SpendingAnalysis | null;
}

async function extractFunctionErrorMessage(error: unknown): Promise<string | null> {
  const functionError = error as Error & { context?: Response };

  if (functionError?.context) {
    try {
      const response = functionError.context.clone();
      const body = await response.json();
      if (body && typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }
    } catch {
      // ignore json parse errors
    }

    try {
      const response = functionError.context.clone();
      const text = await response.text();
      if (!text) return functionError.message || null;

      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
          return parsed.error;
        }
      } catch {
        return text;
      }
    } catch {
      // ignore text parse errors
    }
  }

  return functionError?.message || null;
}

function notifyAnalysisError(message: string) {
  if (message.includes("Rate limit")) {
    toast.error("Limite di richieste raggiunto. Riprova tra qualche secondo.");
    return;
  }

  if (message.includes("limite mensile") || message.includes("analisi")) {
    toast.error("Hai raggiunto il limite mensile di analisi AI del tuo piano.");
    return;
  }

  toast.error(message);
}

export function useSpendingAnalysis(): UseSpendingAnalysisResult {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpendingAnalysis | null>(null);

  const analyze = async (): Promise<SpendingAnalysis | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("analyze-spending");

      if (fnError) {
        const fnMessage = await extractFunctionErrorMessage(fnError);
        throw new Error(fnMessage || "Errore durante l'analisi");
      }

      if (result?.error && typeof result.error === "string") {
        notifyAnalysisError(result.error);
        throw new Error(result.error);
      }

      setData(result as SpendingAnalysis);
      queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
      queryClient.invalidateQueries({ queryKey: ["ai-analysis-documents"] });
      return result as SpendingAnalysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante l'analisi";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyze,
    isLoading,
    error,
    data,
  };
}
