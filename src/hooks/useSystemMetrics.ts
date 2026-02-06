import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface SystemMetric {
  id: string;
  metricName: string;
  metricValue: number;
  metricUnit: string | null;
  tags: Json;
  createdAt: string;
}

export function useSystemMetrics(limit = 100) {
  return useQuery({
    queryKey: ["system-metrics", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(metric => ({
        id: metric.id,
        metricName: metric.metric_name,
        metricValue: metric.metric_value,
        metricUnit: metric.metric_unit,
        tags: metric.tags,
        createdAt: metric.created_at,
      })) as SystemMetric[];
    },
  });
}

export function useAggregatedMetrics() {
  return useQuery({
    queryKey: ["aggregated-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const metrics = (data || []).map(metric => ({
        id: metric.id,
        metricName: metric.metric_name,
        metricValue: metric.metric_value,
        metricUnit: metric.metric_unit,
        tags: metric.tags,
        createdAt: metric.created_at,
      })) as SystemMetric[];
      
      // Aggregate metrics by name (latest value)
      const latestByType: Record<string, number> = {};
      const metricTypes = ["logins", "api_requests", "latency_p50", "latency_p95", "errors", "uptime"];
      
      metricTypes.forEach((type) => {
        const metric = metrics.find((m) => m.metricName === type);
        latestByType[type] = metric?.metricValue ?? 0;
      });

      return latestByType;
    },
  });
}

export function useMetricsByType(metricType: string, limit = 24) {
  return useQuery({
    queryKey: ["metrics-by-type", metricType, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("metric_name", metricType)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(metric => ({
        id: metric.id,
        metricName: metric.metric_name,
        metricValue: metric.metric_value,
        metricUnit: metric.metric_unit,
        tags: metric.tags,
        createdAt: metric.created_at,
      })) as SystemMetric[];
    },
  });
}
