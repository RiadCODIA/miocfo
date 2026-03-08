/**
 * Fixed P&L category lists per client specification.
 * These names must match exactly the cost_categories table in the DB.
 * Used to filter dropdowns in invoice matching, invoice table, and transaction modals.
 */

export const INVOICE_REVENUE_CATEGORIES = [
  "Ricavi da vendita prodotti",
  "Ricavi da prestazione servizi",
  "Ricavi da canoni/abbonamenti",
  "Altre entrate",
];

export const INVOICE_EXPENSE_CATEGORIES = [
  "Costi per materie prime / merci",
  "Costi per servizi esterni",
  "Affitti e locazioni",
  "Utenze",
  "Marketing e pubblicità",
  "Software e licenze",
  "Spese bancarie e assicurative",
  "Spese di viaggio e trasferte",
  "Spese di formazione",
  "Altre uscite",
];

/** Set for O(1) lookup */
export const ALLOWED_INVOICE_CATEGORIES = new Set([
  ...INVOICE_REVENUE_CATEGORIES,
  ...INVOICE_EXPENSE_CATEGORIES,
]);
