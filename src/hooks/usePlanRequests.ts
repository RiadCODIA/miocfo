import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PlanRequest {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export function useMyPlanRequest() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-plan-request", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("plan_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PlanRequest | null;
    },
    enabled: !!user,
  });
}

export function useRequestPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Cancel any existing pending request
      await supabase
        .from("plan_requests")
        .update({ status: "cancelled" })
        .eq("user_id", user.id)
        .eq("status", "pending");

      const { data, error } = await supabase
        .from("plan_requests")
        .insert({ user_id: user.id, plan_id: planId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-plan-request"] });
      toast.success("Richiesta piano inviata! L'amministratore la esaminerà a breve.");
    },
    onError: (error) => {
      toast.error("Errore nell'invio della richiesta: " + error.message);
    },
  });
}

export function usePendingPlanRequests() {
  return useQuery({
    queryKey: ["pending-plan-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PlanRequest[];
    },
  });
}

export function useProcessPlanRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("plan_requests")
        .update({ status: action, processed_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["pending-plan-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-plan-request"] });
      toast.success(action === "approved" ? "Richiesta approvata" : "Richiesta rifiutata");
    },
    onError: (error) => {
      toast.error("Errore: " + error.message);
    },
  });
}
