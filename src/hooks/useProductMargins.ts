import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductService {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFinancial {
  id: string;
  product_id: string;
  period_start: string;
  period_end: string;
  revenue: number;
  variable_costs: number;
  fixed_costs_share: number;
  created_at: string;
}

export interface ProductMarginData {
  id: string;
  prodotto: string;
  ricavi: number;
  costiVariabili: number;
  quotaCostiFissi: number;
  margineLordo: number;
  marginePerc: number;
}

export function useProductsServices() {
  return useQuery({
    queryKey: ["products-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_services")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as ProductService[];
    },
  });
}

export function useProductFinancials(periodStart?: string, periodEnd?: string) {
  return useQuery({
    queryKey: ["product-financials", periodStart, periodEnd],
    queryFn: async () => {
      let query = supabase
        .from("product_financials")
        .select("*, products_services(name)")
        .order("created_at", { ascending: false });

      if (periodStart) {
        query = query.gte("period_start", periodStart);
      }
      if (periodEnd) {
        query = query.lte("period_end", periodEnd);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useProductMargins(periodStart?: string, periodEnd?: string) {
  return useQuery({
    queryKey: ["product-margins", periodStart, periodEnd],
    queryFn: async () => {
      // Get products with their financials
      const { data: products, error: productsError } = await supabase
        .from("products_services")
        .select("*")
        .eq("is_active", true);

      if (productsError) throw productsError;

      let financialsQuery = supabase
        .from("product_financials")
        .select("*");

      if (periodStart) {
        financialsQuery = financialsQuery.gte("period_start", periodStart);
      }
      if (periodEnd) {
        financialsQuery = financialsQuery.lte("period_end", periodEnd);
      }

      const { data: financials, error: financialsError } = await financialsQuery;

      if (financialsError) throw financialsError;

      // Calculate margins for each product
      const margins: ProductMarginData[] = (products || []).map((product) => {
        const productFinancials = (financials || []).filter(
          (f) => f.product_id === product.id
        );

        const ricavi = productFinancials.reduce((sum, f) => sum + Number(f.revenue), 0);
        const costiVariabili = productFinancials.reduce(
          (sum, f) => sum + Number(f.variable_costs),
          0
        );
        const quotaCostiFissi = productFinancials.reduce(
          (sum, f) => sum + Number(f.fixed_costs_share),
          0
        );
        const margineLordo = ricavi - costiVariabili - quotaCostiFissi;
        const marginePerc = ricavi > 0 ? (margineLordo / ricavi) * 100 : 0;

        return {
          id: product.id,
          prodotto: product.name,
          ricavi,
          costiVariabili,
          quotaCostiFissi,
          margineLordo,
          marginePerc,
        };
      });

      return margins;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<ProductService, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("products_services")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-services"] });
      queryClient.invalidateQueries({ queryKey: ["product-margins"] });
      toast.success("Prodotto creato con successo");
    },
    onError: (error) => {
      toast.error("Errore nella creazione del prodotto: " + error.message);
    },
  });
}

export function useCreateProductFinancial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (financial: Omit<ProductFinancial, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("product_financials")
        .insert(financial)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-financials"] });
      queryClient.invalidateQueries({ queryKey: ["product-margins"] });
      toast.success("Dati finanziari aggiunti");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiunta dei dati: " + error.message);
    },
  });
}
