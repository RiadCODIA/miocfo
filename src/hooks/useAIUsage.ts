import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "./useUserSubscription";
import { format } from "date-fns";

export interface AIUsage {
  costAccumulated: number;
  creditRecharged: number;
  numRecharges: number;
  isBlocked: boolean;
  budgetAvailable: number;
  planLimit: number;
}

// Plan-specific AI limits per spec
const AI_LIMITS: Record<string, { limit: number; upgradeSuggestAfter: number | null; upgradeTo: string | null }> = {
  small: { limit: 5, upgradeSuggestAfter: 2, upgradeTo: "Pro" },
  pro: { limit: 8, upgradeSuggestAfter: 3, upgradeTo: "Full" },
  full: { limit: 20, upgradeSuggestAfter: null, upgradeTo: null },
};

export function useAIUsage() {
  const { user } = useAuth();
  const { subscription } = useUserSubscription();
  const monthYear = format(new Date(), "yyyy-MM");
  const planName = (subscription?.planName || "").toLowerCase();
  const planConfig = AI_LIMITS[planName] || AI_LIMITS.small;

  const query = useQuery({
    queryKey: ["ai-usage", user?.id, monthYear],
    queryFn: async (): Promise<AIUsage> => {
      if (!user) return { costAccumulated: 0, creditRecharged: 0, numRecharges: 0, isBlocked: false, budgetAvailable: planConfig.limit, planLimit: planConfig.limit };

      const { data, error } = await supabase
        .from("ai_usage_monthly")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", monthYear)
        .maybeSingle();

      if (error || !data) {
        return {
          costAccumulated: 0,
          creditRecharged: 0,
          numRecharges: 0,
          isBlocked: false,
          budgetAvailable: planConfig.limit,
          planLimit: planConfig.limit,
        };
      }

      const costAccumulated = Number(data.cost_accumulated || 0);
      const creditRecharged = Number(data.credit_recharged || 0);
      const budgetAvailable = planConfig.limit + creditRecharged;

      return {
        costAccumulated,
        creditRecharged,
        numRecharges: data.num_recharges || 0,
        isBlocked: costAccumulated >= budgetAvailable,
        budgetAvailable,
        planLimit: planConfig.limit,
      };
    },
    enabled: !!user,
  });

  const shouldSuggestUpgrade = query.data
    ? planConfig.upgradeSuggestAfter !== null && query.data.numRecharges >= planConfig.upgradeSuggestAfter
    : false;

  return {
    usage: query.data,
    isLoading: query.isLoading,
    isBlocked: query.data?.isBlocked ?? false,
    shouldSuggestUpgrade,
    upgradePlan: planConfig.upgradeTo,
    rechargeOptions: [5, 10, 15],
  };
}
