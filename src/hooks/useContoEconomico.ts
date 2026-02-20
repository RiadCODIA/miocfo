import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];

export interface MonthlyData {
  [month: number]: number; // 0-11
}

export interface CostCategory {
  id: string;
  name: string;
  cost_type: "fixed" | "variable";
}

export interface ContoEconomicoData {
  ricavi: MonthlyData;
  costiVariabili: Record<string, MonthlyData>;
  costiFissi: Record<string, MonthlyData>;
  costiNonCategorizzati: MonthlyData;
  costiVariabiliTotali: MonthlyData;
  costiFissiTotali: MonthlyData;
  costiTotali: MonthlyData;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
  variableCategories: CostCategory[];
  fixedCategories: CostCategory[];
}

export function useContoEconomico(year: number) {
  return useQuery({
    queryKey: ["conto-economico", year],
    queryFn: async (): Promise<ContoEconomicoData> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [emesseRes, ricevuteRes, categoriesRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, vat_amount, invoice_date")
          .in("invoice_type", ["emessa", "active", "income"])
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("invoices")
          .select("amount, vat_amount, invoice_date, category_id")
          .in("invoice_type", ["ricevuta", "passive", "expense"])
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("cost_categories")
          .select("id, name, cost_type")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (emesseRes.error) throw emesseRes.error;
      if (ricevuteRes.error) throw ricevuteRes.error;

      const allCategories: CostCategory[] = (categoriesRes.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        cost_type: c.cost_type as "fixed" | "variable",
      }));

      const variableCategories = allCategories.filter((c) => c.cost_type === "variable");
      const fixedCategories = allCategories.filter((c) => c.cost_type === "fixed");

      // Map category id → category object
      const categoryById: Record<string, CostCategory> = {};
      allCategories.forEach((c) => { categoryById[c.id] = c; });

      // Aggregate ricavi by month (issued invoices)
      const ricavi: MonthlyData = {};
      const ivaRicavi: MonthlyData = {};
      emesseRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        ricavi[month] = (ricavi[month] || 0) + Number(inv.amount);
        ivaRicavi[month] = (ivaRicavi[month] || 0) + Number(inv.vat_amount || 0);
      });

      // Initialize cost buckets
      const costiVariabili: Record<string, MonthlyData> = {};
      const costiFissi: Record<string, MonthlyData> = {};
      const costiNonCategorizzati: MonthlyData = {};
      const ivaCosti: MonthlyData = {};

      variableCategories.forEach((c) => { costiVariabili[c.id] = {}; });
      fixedCategories.forEach((c) => { costiFissi[c.id] = {}; });

      // Aggregate received invoices
      ricevuteRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        ivaCosti[month] = (ivaCosti[month] || 0) + Number(inv.vat_amount || 0);

        if (!inv.category_id) {
          // No category assigned at all → non categorizzato
          costiNonCategorizzati[month] = (costiNonCategorizzati[month] || 0) + Number(inv.amount);
          return;
        }

        const cat = categoryById[inv.category_id];
        if (!cat) {
          // Category ID exists but not in active list → non categorizzato
          costiNonCategorizzati[month] = (costiNonCategorizzati[month] || 0) + Number(inv.amount);
          return;
        }

        if (cat.cost_type === "variable") {
          if (!costiVariabili[cat.id]) costiVariabili[cat.id] = {};
          costiVariabili[cat.id][month] = (costiVariabili[cat.id][month] || 0) + Number(inv.amount);
        } else {
          if (!costiFissi[cat.id]) costiFissi[cat.id] = {};
          costiFissi[cat.id][month] = (costiFissi[cat.id][month] || 0) + Number(inv.amount);
        }
      });

      // Compute totals
      const costiVariabiliTotali: MonthlyData = {};
      const costiFissiTotali: MonthlyData = {};
      const costiTotali: MonthlyData = {};

      for (let m = 0; m < 12; m++) {
        let varTotal = 0;
        variableCategories.forEach((c) => { varTotal += costiVariabili[c.id]?.[m] || 0; });
        varTotal += costiNonCategorizzati[m] || 0; // non-cat goes to variable for now
        if (varTotal > 0) costiVariabiliTotali[m] = varTotal;

        let fixTotal = 0;
        fixedCategories.forEach((c) => { fixTotal += costiFissi[c.id]?.[m] || 0; });
        if (fixTotal > 0) costiFissiTotali[m] = fixTotal;

        const total = varTotal + fixTotal;
        if (total > 0) costiTotali[m] = total;
      }

      return {
        ricavi,
        costiVariabili,
        costiFissi,
        costiNonCategorizzati,
        costiVariabiliTotali,
        costiFissiTotali,
        costiTotali,
        ivaRicavi,
        ivaCosti,
        variableCategories,
        fixedCategories,
      };
    },
  });
}

export { MONTHS };
