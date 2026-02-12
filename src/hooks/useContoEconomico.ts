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
  // Bank transactions data
  ricaviMovimenti: MonthlyData;
  costiMovimentiPerCategoria: Record<string, MonthlyData>;
  costiMovimentiTotali: MonthlyData;
  movimentiCategoryNames: string[];
}

export function useContoEconomico(year: number) {
  return useQuery({
    queryKey: ["conto-economico", year],
    queryFn: async (): Promise<ContoEconomicoData> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [emesseRes, ricevuteRes, categoriesRes, transactionsRes] = await Promise.all([
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
        supabase
          .from("bank_transactions")
          .select("amount, date, ai_category_id")
          .gte("date", startDate)
          .lte("date", endDate),
      ]);

      if (emesseRes.error) throw emesseRes.error;
      if (ricevuteRes.error) throw ricevuteRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      const categoryMap: Record<string, string> = {};
      categoriesRes.data?.forEach((c) => {
        categoryMap[c.id] = c.name;
      });

      // Aggregate ricavi by month (invoices)
      const ricavi: MonthlyData = {};
      const ivaRicavi: MonthlyData = {};
      emesseRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        ricavi[month] = (ricavi[month] || 0) + Number(inv.amount);
        ivaRicavi[month] = (ivaRicavi[month] || 0) + Number(inv.vat_amount || 0);
      });

      // Aggregate costi by category and month (invoices)
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

      // Calculate totali costi (invoices)
      const costiTotali: MonthlyData = {};
      for (let m = 0; m < 12; m++) {
        let total = 0;
        Object.values(costiPerCategoria).forEach((catData) => {
          total += catData[m] || 0;
        });
        if (total > 0) costiTotali[m] = total;
      }

      // Aggregate bank transactions
      const ricaviMovimenti: MonthlyData = {};
      const costiMovimentiPerCategoria: Record<string, MonthlyData> = {};
      const costiMovimentiTotali: MonthlyData = {};
      const movCatSet = new Set<string>();

      transactionsRes.data?.forEach((tx) => {
        if (!tx.date) return;
        const month = new Date(tx.date).getMonth();
        const amount = Number(tx.amount);

        if (amount > 0) {
          ricaviMovimenti[month] = (ricaviMovimenti[month] || 0) + amount;
        } else {
          const catName = tx.ai_category_id ? (categoryMap[tx.ai_category_id] || "Non categorizzato") : "Non categorizzato";
          movCatSet.add(catName);
          if (!costiMovimentiPerCategoria[catName]) {
            costiMovimentiPerCategoria[catName] = {};
          }
          costiMovimentiPerCategoria[catName][month] = (costiMovimentiPerCategoria[catName][month] || 0) + Math.abs(amount);
          costiMovimentiTotali[month] = (costiMovimentiTotali[month] || 0) + Math.abs(amount);
        }
      });

      return {
        ricavi,
        costiPerCategoria,
        costiTotali,
        ivaRicavi,
        ivaCosti,
        categoryNames: COST_CATEGORIES_LABELS,
        ricaviMovimenti,
        costiMovimentiPerCategoria,
        costiMovimentiTotali,
        movimentiCategoryNames: Array.from(movCatSet).sort(),
      };
    },
  });
}

export { MONTHS, COST_CATEGORIES_LABELS };
