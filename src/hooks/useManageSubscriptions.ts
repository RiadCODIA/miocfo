import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useUserSubscriptions() {
  return useQuery({
    queryKey: ["all-user-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAssignPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      // Deactivate any existing active subscription
      await supabase
        .from("user_subscriptions")
        .update({ status: "expired" })
        .eq("user_id", userId)
        .eq("status", "active");

      // Create new active subscription
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          ai_credits_remaining: 100, // Default credits for Full plan
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      toast.success("Piano assegnato con successo");
    },
    onError: (error) => {
      toast.error("Errore nell'assegnazione del piano: " + error.message);
    },
  });
}
