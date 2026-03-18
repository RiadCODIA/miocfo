import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  features: string[];
  aiCreditsRemaining: number;
  expiresAt: string | null;
  aiMonthlyLimitEur: number;
  aiAssistantMessagesLimitMonthly: number;
  aiTransactionAnalysesLimitMonthly: number;
}

const PLAN_FEATURES: Record<string, string[]> = {
  small: [
    "dashboard",
    "collegamenti_banche",
    "collegamenti",
    "flussi_cassa",
    "transazioni",
    "conti_bancari",
  ],
  pro: [
    "dashboard",
    "collegamenti_banche",
    "collegamenti",
    "flussi_cassa",
    "transazioni",
    "conti_bancari",
    "conto_economico",
    "fatture",
    "scadenzario",
    "kpi_report",
  ],
  full: [
    "dashboard",
    "collegamenti_banche",
    "collegamenti",
    "flussi_cassa",
    "transazioni",
    "conti_bancari",
    "conto_economico",
    "fatture",
    "scadenzario",
    "kpi_report",
    "budget_previsioni",
    "ai_assistant",
    "alert_notifiche",
  ],
};

export const FEATURE_ROUTE_MAP: Record<string, string> = {
  dashboard: "/dashboard",
  collegamenti: "/collegamenti",
  collegamenti_banche: "/collegamenti",
  flussi_cassa: "/flussi-cassa",
  transazioni: "/transazioni",
  conti_bancari: "/conti-bancari",
  conto_economico: "/area-economica",
  budget_previsioni: "/budget",
  fatture: "/fatture",
  scadenzario: "/scadenzario",
  kpi_report: "/kpi-report",
  alert_notifiche: "/alert",
  ai_assistant: "/ai-assistant",
};

const ALWAYS_ALLOWED_ROUTES = ["/dashboard", "/impostazioni", "/configurazione", "/comunicazioni"];

export function useUserSubscription() {
  const { user, userRole } = useAuth();

  const query = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          id,
          plan_id,
          status,
          ai_credits_remaining,
          ai_cost_used_eur,
          expires_at,
          subscription_plans (
            name,
            features,
            ai_monthly_limit_eur,
            ai_assistant_messages_limit_monthly,
            ai_transaction_analyses_limit_monthly
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) return null;

      const plan = data.subscription_plans as any;
      const planName = (plan?.name || "").toLowerCase();
      const features = PLAN_FEATURES[planName] || (Array.isArray(plan?.features) ? (plan.features as string[]) : []);

      return {
        id: data.id,
        planId: data.plan_id,
        planName: plan?.name || "",
        status: data.status,
        features,
        aiCreditsRemaining: data.ai_credits_remaining ?? 0,
        expiresAt: data.expires_at,
        aiMonthlyLimitEur: plan?.ai_monthly_limit_eur ?? 0,
        aiAssistantMessagesLimitMonthly: plan?.ai_assistant_messages_limit_monthly ?? 0,
        aiTransactionAnalysesLimitMonthly: plan?.ai_transaction_analyses_limit_monthly ?? 0,
      };
    },
    enabled: !!user && userRole !== "super_admin",
  });

  const isSuperAdmin = userRole === "super_admin";

  const hasFeature = (featureId: string): boolean => {
    if (isSuperAdmin) return true;
    if (!query.data) return false;
    return query.data.features.includes(featureId);
  };

  const canAccessRoute = (path: string): boolean => {
    if (isSuperAdmin) return true;
    if (ALWAYS_ALLOWED_ROUTES.includes(path)) return true;
    if (!query.data) return false;

    for (const [featureId, route] of Object.entries(FEATURE_ROUTE_MAP)) {
      if (route === path && query.data.features.includes(featureId)) return true;
    }

    return false;
  };

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    hasFeature,
    canAccessRoute,
    hasSubscription: !!query.data,
    isSuperAdmin,
  };
}
