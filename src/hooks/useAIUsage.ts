import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "./useUserSubscription";
import { format } from "date-fns";

export interface AIUsage {
  assistantMessagesUsed: number;
  assistantMessagesLimit: number;
  assistantMessagesRemaining: number;
  transactionAnalysesUsed: number;
  transactionAnalysesLimit: number;
  transactionAnalysesRemaining: number;
  isAssistantBlocked: boolean;
  isTransactionAnalysesBlocked: boolean;
}

const PLAN_LIMITS: Record<string, { messages: number; analyses: number; upgradeTo: string | null }> = {
  small: { messages: 50, analyses: 3, upgradeTo: "Pro" },
  pro: { messages: 60, analyses: 3, upgradeTo: "Full" },
  full: { messages: 100, analyses: 5, upgradeTo: null },
};

export function useAIUsage() {
  const { user } = useAuth();
  const { subscription } = useUserSubscription();
  const monthYear = format(new Date(), "yyyy-MM");
  const planName = (subscription?.planName || "small").toLowerCase();
  const fallback = PLAN_LIMITS[planName] || PLAN_LIMITS.small;

  const assistantLimit = subscription?.aiAssistantMessagesLimitMonthly ?? fallback.messages;
  const analysesLimit = subscription?.aiTransactionAnalysesLimitMonthly ?? fallback.analyses;

  const query = useQuery({
    queryKey: ["ai-usage", user?.id, monthYear, assistantLimit, analysesLimit],
    queryFn: async (): Promise<AIUsage> => {
      if (!user) {
        return {
          assistantMessagesUsed: 0,
          assistantMessagesLimit: assistantLimit,
          assistantMessagesRemaining: assistantLimit,
          transactionAnalysesUsed: 0,
          transactionAnalysesLimit: analysesLimit,
          transactionAnalysesRemaining: analysesLimit,
          isAssistantBlocked: false,
          isTransactionAnalysesBlocked: false,
        };
      }

      const { data, error } = await supabase
        .from("ai_usage_monthly")
        .select("assistant_messages_used, transaction_analyses_used")
        .eq("user_id", user.id)
        .eq("month_year", monthYear)
        .maybeSingle();

      if (error || !data) {
        return {
          assistantMessagesUsed: 0,
          assistantMessagesLimit: assistantLimit,
          assistantMessagesRemaining: assistantLimit,
          transactionAnalysesUsed: 0,
          transactionAnalysesLimit: analysesLimit,
          transactionAnalysesRemaining: analysesLimit,
          isAssistantBlocked: false,
          isTransactionAnalysesBlocked: false,
        };
      }

      const assistantMessagesUsed = Number(data.assistant_messages_used || 0);
      const transactionAnalysesUsed = Number(data.transaction_analyses_used || 0);
      const assistantMessagesRemaining = Math.max(assistantLimit - assistantMessagesUsed, 0);
      const transactionAnalysesRemaining = Math.max(analysesLimit - transactionAnalysesUsed, 0);

      return {
        assistantMessagesUsed,
        assistantMessagesLimit: assistantLimit,
        assistantMessagesRemaining,
        transactionAnalysesUsed,
        transactionAnalysesLimit: analysesLimit,
        transactionAnalysesRemaining,
        isAssistantBlocked: assistantMessagesUsed >= assistantLimit,
        isTransactionAnalysesBlocked: transactionAnalysesUsed >= analysesLimit,
      };
    },
    enabled: !!user,
  });

  return {
    usage: query.data,
    isLoading: query.isLoading,
    isBlocked: (query.data?.isAssistantBlocked ?? false) || (query.data?.isTransactionAnalysesBlocked ?? false),
    isAssistantBlocked: query.data?.isAssistantBlocked ?? false,
    isTransactionAnalysesBlocked: query.data?.isTransactionAnalysesBlocked ?? false,
    shouldSuggestUpgrade: Boolean((query.data?.isAssistantBlocked || query.data?.isTransactionAnalysesBlocked) && fallback.upgradeTo),
    upgradePlan: fallback.upgradeTo,
  };
}
