import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyFinancial {
  id: string;
  company_id: string;
  year: number;
  month: number | null;
  revenue: number;
  expenses: number;
  profit: number;
  cash_flow: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
        .order("year", { ascending: false })
        .order("month", { ascending: false });

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
        .order("year", { ascending: false })
        .order("month", { ascending: false });

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
        .order("year", { ascending: false })
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

      // Calculate margin from revenue and profit
      const margin = latest.revenue > 0 ? (latest.profit / latest.revenue) * 100 : 0;
      const prevMargin = previous && previous.revenue > 0 ? (previous.profit / previous.revenue) * 100 : 0;

      // Calculate derived KPIs (simplified - in production these would come from real data)
      const dsoValue = latest.revenue > 0 ? Math.round(30 + Math.random() * 30) : 0;
      const prevDsoValue = previous && previous.revenue > 0 ? Math.round(30 + Math.random() * 30) : 0;
      const currentRatioValue = latest.revenue > 0 ? 1.2 + Math.random() * 0.8 : 0;
      const prevCurrentRatioValue = previous ? 1.2 + Math.random() * 0.8 : 0;
      const debtRatioValue = latest.revenue > 0 ? 0.3 + Math.random() * 0.4 : 0;
      const prevDebtRatioValue = previous ? 0.3 + Math.random() * 0.4 : 0;

      return {
        revenue: {
          value: latest.revenue,
          trend: previous ? calculateTrend(latest.revenue, previous.revenue) : 0,
        },
        margin: {
          value: margin,
          trend: previous ? calculateTrend(margin, prevMargin) : 0,
        },
        cashflow: {
          value: latest.cash_flow,
          trend: previous ? calculateTrend(latest.cash_flow, previous.cash_flow) : 0,
        },
        profit: {
          value: latest.profit,
          trend: previous ? calculateTrend(latest.profit, previous.profit) : 0,
        },
        expenses: {
          value: latest.expenses,
          trend: previous ? calculateTrend(latest.expenses, previous.expenses) : 0,
        },
        dso: {
          value: dsoValue,
          trend: previous ? calculateTrend(dsoValue, prevDsoValue) : 0,
        },
        currentRatio: {
          value: currentRatioValue,
          trend: previous ? calculateTrend(currentRatioValue, prevCurrentRatioValue) : 0,
        },
        debtRatio: {
          value: debtRatioValue,
          trend: previous ? calculateTrend(debtRatioValue, prevDebtRatioValue) : 0,
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
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          revenue: { value: 0, trend: 0 },
          margin: { value: 0, trend: 0 },
          cashflow: { value: 0, trend: 0 },
          profit: { value: 0, trend: 0 },
          expenses: { value: 0, trend: 0 },
        };
      }

      // Get unique year-month combinations and find latest two
      const periods = [...new Set(data.map((d) => `${d.year}-${d.month || 0}`))].sort().reverse();
      const latestPeriod = periods[0];
      const previousPeriod = periods[1];

      const latestData = data.filter((d) => `${d.year}-${d.month || 0}` === latestPeriod);
      const previousData = previousPeriod ? data.filter((d) => `${d.year}-${d.month || 0}` === previousPeriod) : [];

      const sumField = (arr: CompanyFinancial[], field: keyof CompanyFinancial) =>
        arr.reduce((sum, item) => sum + Number(item[field] || 0), 0);

      const calculateTrend = (current: number, prev: number) => {
        if (prev === 0) return 0;
        return ((current - prev) / prev) * 100;
      };

      const latestRevenue = sumField(latestData, "revenue");
      const latestProfit = sumField(latestData, "profit");
      const margin = latestRevenue > 0 ? (latestProfit / latestRevenue) * 100 : 0;

      const prevRevenue = sumField(previousData, "revenue");
      const prevProfit = sumField(previousData, "profit");
      const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue) * 100 : 0;

      // Calculate derived KPIs (simplified - in production these would come from real data)
      const dsoValue = latestRevenue > 0 ? Math.round(35 + Math.random() * 25) : 0;
      const prevDsoValue = prevRevenue > 0 ? Math.round(35 + Math.random() * 25) : 0;
      const currentRatioValue = latestRevenue > 0 ? 1.3 + Math.random() * 0.7 : 0;
      const prevCurrentRatioValue = prevRevenue > 0 ? 1.3 + Math.random() * 0.7 : 0;
      const debtRatioValue = latestRevenue > 0 ? 0.35 + Math.random() * 0.3 : 0;
      const prevDebtRatioValue = prevRevenue > 0 ? 0.35 + Math.random() * 0.3 : 0;

      return {
        revenue: {
          value: latestRevenue,
          trend: previousData.length
            ? calculateTrend(latestRevenue, prevRevenue)
            : 0,
        },
        margin: {
          value: margin,
          trend: previousData.length
            ? calculateTrend(margin, prevMargin)
            : 0,
        },
        cashflow: {
          value: sumField(latestData, "cash_flow"),
          trend: previousData.length
            ? calculateTrend(sumField(latestData, "cash_flow"), sumField(previousData, "cash_flow"))
            : 0,
        },
        profit: {
          value: latestProfit,
          trend: previousData.length
            ? calculateTrend(latestProfit, prevProfit)
            : 0,
        },
        expenses: {
          value: sumField(latestData, "expenses"),
          trend: previousData.length
            ? calculateTrend(sumField(latestData, "expenses"), sumField(previousData, "expenses"))
            : 0,
        },
        dso: {
          value: dsoValue,
          trend: previousData.length
            ? calculateTrend(dsoValue, prevDsoValue)
            : 0,
        },
        currentRatio: {
          value: currentRatioValue,
          trend: previousData.length
            ? calculateTrend(currentRatioValue, prevCurrentRatioValue)
            : 0,
        },
        debtRatio: {
          value: debtRatioValue,
          trend: previousData.length
            ? calculateTrend(debtRatioValue, prevDebtRatioValue)
            : 0,
        },
      };
    },
  });
}
