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
  category_type: string;
}

export interface ContoEconomicoData {
  /** Revenue broken down by category_id */
  ricaviPerCategoria: Record<string, MonthlyData>;
  /** Total revenue across all categories */
  ricaviTotali: MonthlyData;
  /** Revenue categories ordered */
  revenueCategories: CostCategory[];
  /** Flat cost breakdown by category_id */
  costi: Record<string, MonthlyData>;
  /** Uncategorized costs */
  costiNonCategorizzati: MonthlyData;
  /** Total costs (all categories + uncategorized) */
  costiTotali: MonthlyData;
  /** Ordered expense categories */
  orderedCostCategories: CostCategory[];
  /** IVA */
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
  ivaRicaviPagate: MonthlyData;
  ivaCostiPagate: MonthlyData;
  ivaRicaviDaPagare: MonthlyData;
  ivaCostiDaPagare: MonthlyData;
}

const PAID_PAYMENT_STATUSES = new Set(["paid", "matched"]);

const getVatAmount = (vatAmount: number | null, totalAmount: number, amount: number) =>
  Number(vatAmount || 0) || (Number(totalAmount || 0) - Number(amount || 0));

const addMonthlyValue = (target: MonthlyData, month: number, value: number) => {
  target[month] = (target[month] || 0) + value;
};

export function useContoEconomico(year: number) {
  return useQuery({
    queryKey: ["conto-economico", year],
    queryFn: async (): Promise<ContoEconomicoData> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [emesseRes, ricevuteRes, expenseCatsRes, revenueCatsRes, transactionsRes, matchedTxRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total_amount, vat_amount, invoice_date, category_id, payment_status")
          .in("invoice_type", ["emessa", "active", "income"])
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("invoices")
          .select("amount, total_amount, vat_amount, invoice_date, category_id, payment_status")
          .in("invoice_type", ["ricevuta", "passive", "expense"])
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
        supabase
          .from("cost_categories")
          .select("id, name, cost_type, category_type")
          .eq("category_type", "expense")
          .order("sort_order"),
        supabase
          .from("cost_categories")
          .select("id, name, cost_type, category_type")
          .eq("category_type", "revenue")
          .order("sort_order"),
        // Fetch categorized bank transactions
        supabase
          .from("bank_transactions")
          .select("id, amount, date, ai_category_id")
          .not("ai_category_id", "is", null)
          .gte("date", startDate)
          .lte("date", endDate),
        // Fetch invoice-matched transaction IDs to avoid double-counting
        supabase
          .from("invoices")
          .select("matched_transaction_id")
          .not("matched_transaction_id", "is", null)
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),
      ]);

      if (emesseRes.error) throw emesseRes.error;
      if (ricevuteRes.error) throw ricevuteRes.error;

      const orderedCostCategories: CostCategory[] = (expenseCatsRes.data || []).map((c) => ({
        id: c.id, name: c.name, cost_type: c.cost_type as "fixed" | "variable", category_type: c.category_type,
      }));

      const EXCLUDED_REVENUE = ["incassi", "bonifici", "altri incassi"];
      const revenueCategories: CostCategory[] = (revenueCatsRes.data || [])
        .filter((c) => !EXCLUDED_REVENUE.includes(c.name.toLowerCase()))
        .map((c) => ({
          id: c.id, name: c.name, cost_type: c.cost_type as "fixed" | "variable", category_type: c.category_type,
        }));

      const expenseCatById: Record<string, CostCategory> = {};
      orderedCostCategories.forEach((c) => { expenseCatById[c.id] = c; });

      const revenueCatById: Record<string, CostCategory> = {};
      revenueCategories.forEach((c) => { revenueCatById[c.id] = c; });

      // Find "Altri ricavi e proventi" for uncategorized revenue fallback
      const altriRicaviCat = revenueCategories.find((c) => c.name.toLowerCase().includes("altri ricavi"));

      // Revenue breakdown by category
      const ricaviPerCategoria: Record<string, MonthlyData> = {};
      const ivaRicavi: MonthlyData = {};
      const ivaRicaviPagate: MonthlyData = {};
      const ivaRicaviDaPagare: MonthlyData = {};
      revenueCategories.forEach((c) => { ricaviPerCategoria[c.id] = {}; });

      emesseRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        const vatRicavi = getVatAmount(inv.vat_amount, inv.total_amount, inv.amount);
        const isPaid = PAID_PAYMENT_STATUSES.has((inv.payment_status || "").toLowerCase());
        addMonthlyValue(ivaRicavi, month, vatRicavi);
        addMonthlyValue(isPaid ? ivaRicaviPagate : ivaRicaviDaPagare, month, vatRicavi);

        let targetId: string;
        if (inv.category_id && revenueCatById[inv.category_id]) {
          targetId = inv.category_id;
        } else if (altriRicaviCat) {
          targetId = altriRicaviCat.id;
        } else if (revenueCategories.length > 0) {
          targetId = revenueCategories[revenueCategories.length - 1].id;
        } else {
          return; // no revenue categories at all
        }

        if (!ricaviPerCategoria[targetId]) ricaviPerCategoria[targetId] = {};
        ricaviPerCategoria[targetId][month] = (ricaviPerCategoria[targetId][month] || 0) + Number(inv.amount);
      });

      // Total revenue
      const ricaviTotali: MonthlyData = {};
      for (let m = 0; m < 12; m++) {
        let total = 0;
        revenueCategories.forEach((c) => { total += ricaviPerCategoria[c.id]?.[m] || 0; });
        if (total > 0) ricaviTotali[m] = total;
      }

      // Costs: flat
      const costi: Record<string, MonthlyData> = {};
      const costiNonCategorizzati: MonthlyData = {};
      const ivaCosti: MonthlyData = {};
      const ivaCostiPagate: MonthlyData = {};
      const ivaCostiDaPagare: MonthlyData = {};
      orderedCostCategories.forEach((c) => { costi[c.id] = {}; });

      ricevuteRes.data?.forEach((inv) => {
        if (!inv.invoice_date) return;
        const month = new Date(inv.invoice_date).getMonth();
        const vatCosti = getVatAmount(inv.vat_amount, inv.total_amount, inv.amount);
        const isPaid = PAID_PAYMENT_STATUSES.has((inv.payment_status || "").toLowerCase());
        addMonthlyValue(ivaCosti, month, vatCosti);
        addMonthlyValue(isPaid ? ivaCostiPagate : ivaCostiDaPagare, month, vatCosti);

        if (!inv.category_id || !expenseCatById[inv.category_id]) {
          costiNonCategorizzati[month] = (costiNonCategorizzati[month] || 0) + Number(inv.amount);
          return;
        }

        const catId = inv.category_id;
        if (!costi[catId]) costi[catId] = {};
        costi[catId][month] = (costi[catId][month] || 0) + Number(inv.amount);
      });

      // ── Bank transactions (categorized, not matched to invoices) ──
      const matchedTxIds = new Set(
        (matchedTxRes.data || []).map((r) => r.matched_transaction_id).filter(Boolean)
      );

      (transactionsRes.data || []).forEach((tx) => {
        if (!tx.date || !tx.ai_category_id) return;
        if (matchedTxIds.has(tx.id)) return; // skip already-invoiced transactions
        const month = new Date(tx.date).getMonth();
        const amount = Math.abs(Number(tx.amount));
        const catId = tx.ai_category_id;

        if (tx.amount > 0 && revenueCatById[catId]) {
          // Income transaction → revenue
          if (!ricaviPerCategoria[catId]) ricaviPerCategoria[catId] = {};
          ricaviPerCategoria[catId][month] = (ricaviPerCategoria[catId][month] || 0) + amount;
        } else if (tx.amount > 0 && !revenueCatById[catId] && altriRicaviCat) {
          // Income but category is expense-type → fallback to "Altri ricavi"
          ricaviPerCategoria[altriRicaviCat.id][month] = (ricaviPerCategoria[altriRicaviCat.id][month] || 0) + amount;
        } else if (tx.amount < 0 && expenseCatById[catId]) {
          // Expense transaction → cost
          if (!costi[catId]) costi[catId] = {};
          costi[catId][month] = (costi[catId][month] || 0) + amount;
        } else if (tx.amount < 0) {
          // Expense but no matching expense category
          costiNonCategorizzati[month] = (costiNonCategorizzati[month] || 0) + amount;
        }
      });

      // Total costs (recalculate after adding transactions)
      const costiTotali: MonthlyData = {};
      for (let m = 0; m < 12; m++) {
        let total = 0;
        orderedCostCategories.forEach((c) => { total += costi[c.id]?.[m] || 0; });
        total += costiNonCategorizzati[m] || 0;
        if (total > 0) costiTotali[m] = total;
      }

      // Recalculate total revenue after adding transactions
      const ricaviTotaliFinal: MonthlyData = {};
      for (let m = 0; m < 12; m++) {
        let total = 0;
        revenueCategories.forEach((c) => { total += ricaviPerCategoria[c.id]?.[m] || 0; });
        if (total > 0) ricaviTotaliFinal[m] = total;
      }

      return {
        ricaviPerCategoria,
        ricaviTotali: ricaviTotaliFinal,
        revenueCategories,
        costi,
        costiNonCategorizzati,
        costiTotali,
        orderedCostCategories,
        ivaRicavi,
        ivaCosti,
        ivaRicaviPagate,
        ivaCostiPagate,
        ivaRicaviDaPagare,
        ivaCostiDaPagare,
      };
    },
  });
}

export { MONTHS };
