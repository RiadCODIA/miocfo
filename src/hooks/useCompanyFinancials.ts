import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyFinancial {
  id: string;
  company_id: string;
  month: string;
  revenue: number;
  margin: number;
  cashflow: number;
  income: number;
  expenses: number;
  dso: number;
  current_ratio: number;
  debt_ratio: number;
  created_at: string;
}

export function useCompanyFinancials(companyId: string | null) {
  return useQuery({
    queryKey: ["company-financials", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("company_financials")
        .select("*")
        .eq("company_id", companyId)
        .order("month", { ascending: true });

      if (error) throw error;
      return data as CompanyFinancial[];
    },
    enabled: !!companyId,
  });
}

export function useAllCompanyFinancials() {
  return useQuery({
    queryKey: ["all-company-financials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_financials")
        .select("*")
        .order("month", { ascending: true });

      if (error) throw error;
      return data as CompanyFinancial[];
    },
  });
}

export function useLatestCompanyKpis(companyId: string | null) {
  return useQuery({
    queryKey: ["company-kpis", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from("company_financials")
        .select("*")
        .eq("company_id", companyId)
        .order("month", { ascending: false })
        .limit(2);

      if (error) throw error;
      
      if (!data || data.length === 0) return null;

      const latest = data[0];
      const previous = data[1];

      // Calculate trends
      const calculateTrend = (current: number, prev: number | undefined) => {
        if (!prev || prev === 0) return 0;
        return ((current - prev) / prev) * 100;
      };

      return {
        revenue: {
          value: latest.revenue,
          trend: previous ? calculateTrend(latest.revenue, previous.revenue) : 0,
        },
        margin: {
          value: latest.margin,
          trend: previous ? calculateTrend(latest.margin, previous.margin) : 0,
        },
        cashflow: {
          value: latest.cashflow,
          trend: previous ? calculateTrend(latest.cashflow, previous.cashflow) : 0,
        },
        dso: {
          value: latest.dso,
          trend: previous ? calculateTrend(latest.dso, previous.dso) : 0,
        },
        currentRatio: {
          value: latest.current_ratio,
          trend: previous ? calculateTrend(latest.current_ratio, previous.current_ratio) : 0,
        },
        debtRatio: {
          value: latest.debt_ratio,
          trend: previous ? calculateTrend(latest.debt_ratio, previous.debt_ratio) : 0,
        },
      };
    },
    enabled: !!companyId,
  });
}

export function useAggregatedKpis() {
  return useQuery({
    queryKey: ["aggregated-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_financials")
        .select("*")
        .order("month", { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          revenue: { value: 0, trend: 0 },
          margin: { value: 0, trend: 0 },
          cashflow: { value: 0, trend: 0 },
          dso: { value: 0, trend: 0 },
          currentRatio: { value: 0, trend: 0 },
          debtRatio: { value: 0, trend: 0 },
        };
      }

      // Get unique months and find latest two
      const months = [...new Set(data.map((d) => d.month))].sort().reverse();
      const latestMonth = months[0];
      const previousMonth = months[1];

      const latestData = data.filter((d) => d.month === latestMonth);
      const previousData = previousMonth ? data.filter((d) => d.month === previousMonth) : [];

      const sumField = (arr: CompanyFinancial[], field: keyof CompanyFinancial) =>
        arr.reduce((sum, item) => sum + Number(item[field] || 0), 0);

      const avgField = (arr: CompanyFinancial[], field: keyof CompanyFinancial) =>
        arr.length > 0 ? sumField(arr, field) / arr.length : 0;

      const calculateTrend = (current: number, prev: number) => {
        if (prev === 0) return 0;
        return ((current - prev) / prev) * 100;
      };

      return {
        revenue: {
          value: sumField(latestData, "revenue"),
          trend: previousData.length
            ? calculateTrend(sumField(latestData, "revenue"), sumField(previousData, "revenue"))
            : 0,
        },
        margin: {
          value: avgField(latestData, "margin"),
          trend: previousData.length
            ? calculateTrend(avgField(latestData, "margin"), avgField(previousData, "margin"))
            : 0,
        },
        cashflow: {
          value: sumField(latestData, "cashflow"),
          trend: previousData.length
            ? calculateTrend(sumField(latestData, "cashflow"), sumField(previousData, "cashflow"))
            : 0,
        },
        dso: {
          value: avgField(latestData, "dso"),
          trend: previousData.length
            ? calculateTrend(avgField(latestData, "dso"), avgField(previousData, "dso"))
            : 0,
        },
        currentRatio: {
          value: avgField(latestData, "current_ratio"),
          trend: previousData.length
            ? calculateTrend(avgField(latestData, "current_ratio"), avgField(previousData, "current_ratio"))
            : 0,
        },
        debtRatio: {
          value: avgField(latestData, "debt_ratio"),
          trend: previousData.length
            ? calculateTrend(avgField(latestData, "debt_ratio"), avgField(previousData, "debt_ratio"))
            : 0,
        },
      };
    },
  });
}
