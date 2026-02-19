import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];

const COST_CATEGORIES_LABELS = [
  "Acquisto materie prime",
  "Energia e combustibili",
  "Lavorazioni di terzi",
  "Provvigioni",
  "Carburanti",
  "Manutenzioni",
  "Assicurazioni",
  "Formazione e ricerca",
  "Marketing e pubblicità",
  "God. Beni di terzi",
  "Canoni di leasing",
  "Consulenze",
  "Altre spese",
];

export interface MonthlyData {
  [month: number]: number; // 0-11
}

export interface ContoEconomicoData {
  ricavi: MonthlyData;
  costiPerCategoria: Record<string, MonthlyData>;
  costiTotali: MonthlyData;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
  categoryNames: string[];
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
          .eq("invoice_type", "emessa")
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("invoices")
          .select("amount, vat_amount, invoice_date, category_id")
          .eq("invoice_type", "ricevuta")
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("cost_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (emesseRes.error) throw emesseRes.error;
      if (ricevuteRes.error) throw ricevuteRes.error;

      const categoryMap: Record<string, string> = {};
      categoriesRes.data?.forEach((c) => {
        categoryMap[c.id] = c.name;
      });

      // Aggregate ricavi by month (issued invoices only)
      const ricavi: MonthlyData = {};
      const ivaRicavi: MonthlyData = {};
      emesseRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        ricavi[month] = (ricavi[month] || 0) + Number(inv.amount);
        ivaRicavi[month] = (ivaRicavi[month] || 0) + Number(inv.vat_amount || 0);
      });

      // Aggregate costi by category and month (received invoices only)
      const costiPerCategoria: Record<string, MonthlyData> = {};
      const ivaCosti: MonthlyData = {};
      
      COST_CATEGORIES_LABELS.forEach((label) => {
        costiPerCategoria[label] = {};
      });

      ricevuteRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        const catName = inv.category_id ? (categoryMap[inv.category_id] || "Altre spese") : "Altre spese";
        
        const matchedLabel = COST_CATEGORIES_LABELS.find(
          (l) => catName.toLowerCase().includes(l.toLowerCase().slice(0, 6))
        ) || "Altre spese";

        if (!costiPerCategoria[matchedLabel]) {
          costiPerCategoria[matchedLabel] = {};
        }
        costiPerCategoria[matchedLabel][month] = (costiPerCategoria[matchedLabel][month] || 0) + Number(inv.amount);
        ivaCosti[month] = (ivaCosti[month] || 0) + Number(inv.vat_amount || 0);
      });

      // Calculate totali costi
      const costiTotali: MonthlyData = {};
      for (let m = 0; m < 12; m++) {
        let total = 0;
        Object.values(costiPerCategoria).forEach((catData) => {
          total += catData[m] || 0;
        });
        if (total > 0) costiTotali[m] = total;
      }

      return {
        ricavi,
        costiPerCategoria,
        costiTotali,
        ivaRicavi,
        ivaCosti,
        categoryNames: COST_CATEGORIES_LABELS,
      };
    },
  });
}

export { MONTHS, COST_CATEGORIES_LABELS };
