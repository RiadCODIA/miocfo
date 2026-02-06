import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export interface ProductMarginData {
  id: string;
  prodotto: string;
  ricavi: number;
  costiVariabili: number;
  quotaCostiFissi: number;
  margineLordo: number;
  marginePerc: number;
}

// Since products_services and product_financials tables don't exist,
// we'll calculate product margins from transaction categories
export function useProductMargins(periodStart?: string, periodEnd?: string) {
  return useQuery({
    queryKey: ["product-margins", periodStart, periodEnd],
    queryFn: async (): Promise<ProductMarginData[]> => {
      const now = new Date();
      const start = periodStart || format(startOfMonth(subMonths(now, 6)), "yyyy-MM-dd");
      const end = periodEnd || format(endOfMonth(now), "yyyy-MM-dd");

      // Get transactions grouped by category as proxy for products/services
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, category, ai_category_id")
        .gte("date", start)
        .lte("date", end);

      if (txError) throw txError;

      // Get cost categories for names
      const { data: categories, error: catError } = await supabase
        .from("cost_categories")
        .select("id, name, cost_type");

      if (catError) throw catError;

      // Group transactions by category
      const categoryMap = new Map<string, { revenue: number; expenses: number }>();
      
      transactions?.forEach(tx => {
        const categoryId = tx.ai_category_id || tx.category || "uncategorized";
        const current = categoryMap.get(categoryId) || { revenue: 0, expenses: 0 };
        
        if (Number(tx.amount) > 0) {
          current.revenue += Number(tx.amount);
        } else {
          current.expenses += Math.abs(Number(tx.amount));
        }
        
        categoryMap.set(categoryId, current);
      });

      // Calculate margins for each category
      const margins: ProductMarginData[] = [];
      let index = 0;

      categoryMap.forEach((data, categoryId) => {
        const category = categories?.find(c => c.id === categoryId);
        const categoryName = category?.name || categoryId;
        
        // Assume 70% of expenses are variable costs, 30% fixed
        const costiVariabili = data.expenses * 0.7;
        const quotaCostiFissi = data.expenses * 0.3;
        const margineLordo = data.revenue - costiVariabili - quotaCostiFissi;
        const marginePerc = data.revenue > 0 ? (margineLordo / data.revenue) * 100 : 0;

        if (data.revenue > 0 || data.expenses > 0) {
          margins.push({
            id: `margin-${index++}`,
            prodotto: categoryName,
            ricavi: data.revenue,
            costiVariabili,
            quotaCostiFissi,
            margineLordo,
            marginePerc,
          });
        }
      });

      // Sort by revenue descending
      return margins.sort((a, b) => b.ricavi - a.ricavi);
    },
  });
}

// Stub functions for compatibility - these would need actual tables to work
export function useProductsServices() {
  return useQuery({
    queryKey: ["products-services"],
    queryFn: async () => {
      // Return empty array since table doesn't exist
      return [];
    },
  });
}

export function useProductFinancials() {
  return useQuery({
    queryKey: ["product-financials"],
    queryFn: async () => {
      // Return empty array since table doesn't exist
      return [];
    },
  });
}

export function useCreateProduct() {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  };
}

export function useCreateProductFinancial() {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isPending: false,
  };
}
