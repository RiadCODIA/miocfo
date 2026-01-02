import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemMetric {
  id: string;
  metric_type: string;
  value: number;
  environment: string;
  measured_at: string;
  metadata: Record<string, unknown>;
}

export function useSystemMetrics(environment = "production") {
  return useQuery({
    queryKey: ["system-metrics", environment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("environment", environment)
        .order("measured_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SystemMetric[];
    },
  });
}

export function useAggregatedMetrics(environment = "production") {
  return useQuery({
    queryKey: ["aggregated-metrics", environment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("environment", environment)
        .order("measured_at", { ascending: false });

      if (error) throw error;

      const metrics = data as SystemMetric[];
      
      // Aggregate metrics by type (latest value)
      const latestByType: Record<string, number> = {};
      const metricTypes = ["logins", "api_requests", "latency_p50", "latency_p95", "errors", "uptime"];
      
      metricTypes.forEach((type) => {
        const metric = metrics.find((m) => m.metric_type === type);
        latestByType[type] = metric?.value ?? 0;
      });

      return latestByType;
    },
  });
}

export function useMetricsByType(metricType: string, environment = "production", limit = 24) {
  return useQuery({
    queryKey: ["metrics-by-type", metricType, environment, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("metric_type", metricType)
        .eq("environment", environment)
        .order("measured_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as SystemMetric[];
    },
  });
}
