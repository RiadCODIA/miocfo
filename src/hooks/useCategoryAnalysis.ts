import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useDateRange } from "@/contexts/DateRangeContext";

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 340 75% 55%))",
  "hsl(var(--chart-4, 160 60% 45%))",
  "hsl(var(--chart-5, 30 80% 55%))",
  "hsl(280, 65%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(50, 80%, 50%)",
];

export function useCategoryAnalysis() {
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["category-analysis", from, to],
    queryFn: async (): Promise<CategoryData[]> => {
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("amount, ai_category_id, cost_categories(name)")
        .lt("amount", 0)
        .not("ai_category_id", "is", null)
        .gte("date", from)
        .lte("date", to);

      if (error) throw error;
      if (!data?.length) return [];

      const grouped: Record<string, number> = {};
      for (const tx of data) {
        const name = (tx.cost_categories as any)?.name || "Altro";
        grouped[name] = (grouped[name] || 0) + Math.abs(Number(tx.amount));
      }

      const total = Object.values(grouped).reduce((a, b) => a + b, 0);
      return Object.entries(grouped)
        .map(([name, amount]) => ({
          name,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
  });
}

export { COLORS };
