import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTO_ECONOMICO_EXPENSE_ROWS,
  CONTO_ECONOMICO_REVENUE_ROWS,
  ExpenseRowKey,
  matchRowByKeywords,
  OTHER_EXPENSE_KEY,
  OTHER_INCOME_KEY,
  RevenueRowKey,
} from "@/lib/conto-economico-schema";

const MONTHS = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];

export interface MonthlyData {
  [month: number]: number;
}

export interface ContoEconomicoData {
  ricavi: Record<RevenueRowKey, MonthlyData>;
  ricaviTotali: MonthlyData;
  costi: Record<ExpenseRowKey, MonthlyData>;
  costiTotali: MonthlyData;
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

const createMonthlyRecord = <TKey extends string>(keys: TKey[]) =>
  keys.reduce((acc, key) => {
    acc[key] = {};
    return acc;
  }, {} as Record<TKey, MonthlyData>);

export function useContoEconomico(year: number) {
  return useQuery({
    queryKey: ["conto-economico", year],
    queryFn: async (): Promise<ContoEconomicoData> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const [emesseRes, ricevuteRes, expenseCatsRes, revenueCatsRes] = await Promise.all([
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
          .select("id, name")
          .eq("category_type", "expense"),
        supabase
          .from("cost_categories")
          .select("id, name")
          .eq("category_type", "revenue"),
      ]);

      if (emesseRes.error) throw emesseRes.error;
      if (ricevuteRes.error) throw ricevuteRes.error;
      if (expenseCatsRes.error) throw expenseCatsRes.error;
      if (revenueCatsRes.error) throw revenueCatsRes.error;

      const expenseCategoryNames = new Map((expenseCatsRes.data || []).map((category) => [category.id, category.name]));
      const revenueCategoryNames = new Map((revenueCatsRes.data || []).map((category) => [category.id, category.name]));

      const ricavi = createMonthlyRecord(CONTO_ECONOMICO_REVENUE_ROWS.map((row) => row.key));
      const ricaviTotali: MonthlyData = {};
      const ivaRicavi: MonthlyData = {};
      const ivaRicaviPagate: MonthlyData = {};
      const ivaRicaviDaPagare: MonthlyData = {};

      emesseRes.data?.forEach((invoice) => {
        if (!invoice.invoice_date) return;

        const month = new Date(invoice.invoice_date).getMonth();
        const imponibile = Number(invoice.amount || 0);
        const vatRicavi = getVatAmount(invoice.vat_amount, invoice.total_amount, invoice.amount);
        const isPaid = PAID_PAYMENT_STATUSES.has((invoice.payment_status || "").toLowerCase());
        const categoryName = invoice.category_id ? revenueCategoryNames.get(invoice.category_id) : null;
        const rowKey = matchRowByKeywords(categoryName, CONTO_ECONOMICO_REVENUE_ROWS, OTHER_INCOME_KEY);

        addMonthlyValue(ivaRicavi, month, vatRicavi);
        addMonthlyValue(isPaid ? ivaRicaviPagate : ivaRicaviDaPagare, month, vatRicavi);
        addMonthlyValue(ricavi[rowKey], month, imponibile);
      });

      for (let m = 0; m < 12; m++) {
        let total = 0;
        CONTO_ECONOMICO_REVENUE_ROWS.forEach((row) => {
          total += ricavi[row.key][m] || 0;
        });
        if (total > 0) ricaviTotali[m] = total;
      }

      const costi = createMonthlyRecord(CONTO_ECONOMICO_EXPENSE_ROWS.map((row) => row.key));
      const costiTotali: MonthlyData = {};
      const ivaCosti: MonthlyData = {};
      const ivaCostiPagate: MonthlyData = {};
      const ivaCostiDaPagare: MonthlyData = {};

      ricevuteRes.data?.forEach((invoice) => {
        if (!invoice.invoice_date) return;

        const month = new Date(invoice.invoice_date).getMonth();
        const imponibile = Number(invoice.amount || 0);
        const vatCosti = getVatAmount(invoice.vat_amount, invoice.total_amount, invoice.amount);
        const isPaid = PAID_PAYMENT_STATUSES.has((invoice.payment_status || "").toLowerCase());
        const categoryName = invoice.category_id ? expenseCategoryNames.get(invoice.category_id) : null;
        const rowKey = matchRowByKeywords(categoryName, CONTO_ECONOMICO_EXPENSE_ROWS, OTHER_EXPENSE_KEY);

        addMonthlyValue(ivaCosti, month, vatCosti);
        addMonthlyValue(isPaid ? ivaCostiPagate : ivaCostiDaPagare, month, vatCosti);
        addMonthlyValue(costi[rowKey], month, imponibile);
      });

      for (let m = 0; m < 12; m++) {
        let total = 0;
        CONTO_ECONOMICO_EXPENSE_ROWS.forEach((row) => {
          total += costi[row.key][m] || 0;
        });
        if (total > 0) costiTotali[m] = total;
      }

      return {
        ricavi,
        ricaviTotali,
        costi,
        costiTotali,
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
