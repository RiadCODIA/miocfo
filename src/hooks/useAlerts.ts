import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "error";
  alertType: string;
  title: string;
  description: string | null;
  status: "active" | "resolved" | "dismissed";
  priority: "high" | "medium" | "low";
  createdAt: string;
  resolvedAt: string | null;
}

interface UseAlertsOptions {
  status?: "all" | "active" | "resolved" | "dismissed";
  priority?: "all" | "high" | "medium" | "low";
  alertType?: string;
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const { status = "all", priority = "all", alertType } = options;

  return useQuery({
    queryKey: ["alerts", { status, priority, alertType }],
    queryFn: async (): Promise<Alert[]> => {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (priority !== "all") {
        query = query.eq("priority", priority);
      }

      if (alertType && alertType !== "all") {
        query = query.eq("alert_type", alertType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map((alert) => ({
        id: alert.id,
        type: alert.type as Alert["type"],
        alertType: alert.alert_type,
        title: alert.title,
        description: alert.description,
        status: alert.status as Alert["status"],
        priority: alert.priority as Alert["priority"],
        createdAt: alert.created_at,
        resolvedAt: alert.resolved_at,
      })) || [];
    },
  });
}

export function useActiveAlertsCount() {
  return useQuery({
    queryKey: ["alerts-count"],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("alerts")
        .select("id, priority", { count: "exact" })
        .eq("status", "active");

      if (error) throw error;

      const highPriority = data?.filter(a => a.priority === "high").length || 0;

      return {
        total: count || 0,
        highPriority,
      };
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "dismissed" })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });
}
