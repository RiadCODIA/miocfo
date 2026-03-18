export type RevenueRowKey =
  | "productSales"
  | "serviceRevenue"
  | "subscriptionRevenue"
  | "otherIncome";

export type ExpenseRowKey =
  | "rawMaterials"
  | "externalServices"
  | "rentAndLeases"
  | "utilities"
  | "marketing"
  | "softwareLicenses"
  | "bankAndInsurance"
  | "travel"
  | "training"
  | "otherExpenses";

export interface ContoEconomicoRow<TKey extends string> {
  key: TKey;
  label: string;
  keywords: string[];
}

export const CONTO_ECONOMICO_REVENUE_ROWS: ContoEconomicoRow<RevenueRowKey>[] = [
  {
    key: "productSales",
    label: "Ricavi da vendita prodotti",
    keywords: ["prodot", "merce", "vendit", "retail", "shop", "ecommerce"],
  },
  {
    key: "serviceRevenue",
    label: "Ricavi da prestazione servizi",
    keywords: ["serviz", "consulenz", "prestaz", "assistenza", "supporto", "progett"],
  },
  {
    key: "subscriptionRevenue",
    label: "Ricavi da canoni/abbonamenti",
    keywords: ["abbon", "canon", "ricorrent", "membership", "saas", "licenz"],
  },
  {
    key: "otherIncome",
    label: "Altre entrate",
    keywords: [],
  },
];

export const CONTO_ECONOMICO_EXPENSE_ROWS: ContoEconomicoRow<ExpenseRowKey>[] = [
  {
    key: "rawMaterials",
    label: "Costi per materie prime / merci",
    keywords: ["mater", "prima", "merci", "merce", "fornitur", "acquist", "magazz", "imball"],
  },
  {
    key: "externalServices",
    label: "Costi per servizi esterni",
    keywords: ["serviz", "consulenz", "profession", "fornitore", "outsourc", "manutenz"],
  },
  {
    key: "rentAndLeases",
    label: "Affitti e locazioni",
    keywords: ["affitt", "locaz", "leasing", "nolegg"],
  },
  {
    key: "utilities",
    label: "Utenze",
    keywords: ["utenz", "energia", "elettr", "gas", "acqua", "telefon", "internet", "fibra"],
  },
  {
    key: "marketing",
    label: "Marketing e pubblicità",
    keywords: ["marketing", "pubblic", "ads", "advert", "seo", "social", "campagn", "branding"],
  },
  {
    key: "softwareLicenses",
    label: "Software e licenze",
    keywords: ["software", "licenz", "saas", "crm", "gestional", "tool", "piattaform", "cloud"],
  },
  {
    key: "bankAndInsurance",
    label: "Spese bancarie e assicurative",
    keywords: ["banc", "commission", "interess", "assicur", "pos", "fido"],
  },
  {
    key: "travel",
    label: "Spese di viaggio e trasferte",
    keywords: ["viagg", "trasfert", "trasport", "carbur", "hotel", "vol", "treno", "taxi", "pedagg"],
  },
  {
    key: "training",
    label: "Spese di formazione",
    keywords: ["formaz", "corso", "master", "workshop", "academy", "training"],
  },
  {
    key: "otherExpenses",
    label: "Altre uscite",
    keywords: [],
  },
];

export const OTHER_INCOME_KEY: RevenueRowKey = "otherIncome";
export const OTHER_EXPENSE_KEY: ExpenseRowKey = "otherExpenses";

export const ROW_LABELS = {
  revenueTotal: "TOTALE RICAVI",
  expenseTotal: "TOTALE COSTI",
  marginBeforePersonnel: "MARGINE PRIMA DEGLI STIPENDI",
  salaries: "Salari, stipendi e oneri sociali",
  directors: "Compenso soci/amministratori",
  ebitda: "EBITDA",
} as const;

export function normalizeCategoryName(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchRowByKeywords<TKey extends string>(
  categoryName: string | null | undefined,
  rows: ContoEconomicoRow<TKey>[],
  fallbackKey: TKey,
) {
  const normalized = normalizeCategoryName(categoryName);
  if (!normalized) return fallbackKey;

  const matched = rows.find((row) =>
    row.keywords.some((keyword) => normalized.includes(normalizeCategoryName(keyword))),
  );

  return matched?.key ?? fallbackKey;
}
