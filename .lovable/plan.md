

## Problem Analysis

Two issues in Budget & Previsioni:

### 1. Budget entries are not editable
The table (lines 143-163 in `BudgetPrevisioni.tsx`) renders budgets as read-only rows with no edit or delete actions. The `editedValues` state is initialized but never populated — there are no input fields or action buttons on each row.

### 2. Budget entries not visible on chart
`useBudgetChartData()` (lines 55-136 in `useBudgets.ts`) builds chart data from:
- **Actuals**: `bank_transactions` (solid bars)
- **Expected**: unpaid `invoices` with `due_date` (dashed bars)

It **never queries the `budgets` table**, so manually inserted budgets don't appear on the chart at all.

---

## Fix Plan

### A. Make budget rows editable + deletable

In `BudgetPrevisioni.tsx`:
- Add a new column "Azioni" to the table header
- Add inline edit (pencil icon) and delete (trash icon) buttons per row
- On edit click: open a modal or enable inline editing for name, amount, type, and month
- On delete: call a new `useDeleteBudget()` mutation
- Create `useDeleteBudget()` in `useBudgets.ts` that sets `is_active = false` (soft delete) or deletes the row

### B. Include budgets in chart data

In `useBudgetChartData()`:
- Fetch active budgets from the `budgets` table
- For each budget, map its `start_date` to a month key
- Add budget amounts to `ricaviPrevisti` / `costiPrevisti` alongside the invoice-based expected values
- This makes the dashed bars reflect both manual budgets and pending invoices

### C. Add delete mutation

In `useBudgets.ts`, add:
```typescript
export function useDeleteBudget() {
  // delete from "budgets" by id, invalidate queries
}
```

**Files to modify**: `src/pages/BudgetPrevisioni.tsx`, `src/hooks/useBudgets.ts`

