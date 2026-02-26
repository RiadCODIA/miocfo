/**
 * Fixed category lists for invoice categorization.
 * These names must match exactly the cost_categories table in the DB.
 * Used to filter dropdowns in invoice matching, invoice table, and transaction modals.
 */

export const INVOICE_REVENUE_CATEGORIES = [
  "Ricavi delle vendite",
  "Ricavi delle prestazioni",
  "Altri ricavi e proventi",
];

export const INVOICE_EXPENSE_CATEGORIES = [
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
  "Oneri bancari",
  "Canoni vari",
  "Altre spese",
  "Affitto e utenze",
  "Software",
  "Servizi generali",
];

/** Set for O(1) lookup */
export const ALLOWED_INVOICE_CATEGORIES = new Set([
  ...INVOICE_REVENUE_CATEGORIES,
  ...INVOICE_EXPENSE_CATEGORIES,
]);
