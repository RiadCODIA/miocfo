import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  features: Json;
  maxUsers: number | null;
  maxBankAccounts: number | null;
  maxInvoicesMonthly: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  aiMonthlyLimitEur: number;
  aiTopupMinEur: number;
  aiUpgradeSuggestionAfter: number | null;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      return (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.price_monthly,
        priceYearly: plan.price_yearly,
        features: plan.features,
        maxUsers: plan.max_users,
        maxBankAccounts: plan.max_bank_accounts,
        maxInvoicesMonthly: plan.max_invoices_monthly,
        isActive: plan.is_active ?? true,
        sortOrder: plan.sort_order ?? 0,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        aiMonthlyLimitEur: (plan as any).ai_monthly_limit_eur ?? 0,
        aiTopupMinEur: (plan as any).ai_topup_min_eur ?? 5,
        aiUpgradeSuggestionAfter: (plan as any).ai_upgrade_suggestion_after ?? null,
      })) as SubscriptionPlan[];
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: { 
      name: string; 
      description?: string;
      price_monthly: number; 
      price_yearly?: number;
      features?: Json;
      max_users?: number;
      max_bank_accounts?: number;
      max_invoices_monthly?: number;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Piano creato con successo");
    },
    onError: (error) => {
      toast.error("Errore nella creazione del piano: " + error.message);
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name: string;
      description: string;
      price_monthly: number;
      price_yearly: number;
      features: Json;
      max_users: number;
      max_bank_accounts: number;
      max_invoices_monthly: number;
      is_active: boolean;
      sort_order: number;
    }>) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Piano aggiornato con successo");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento del piano: " + error.message);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Piano eliminato con successo");
    },
    onError: (error) => {
      toast.error("Errore nell'eliminazione del piano: " + error.message);
    },
  });
}
