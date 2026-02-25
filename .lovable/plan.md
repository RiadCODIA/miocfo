

## Problem: Accrual Forecast Chart Not Reflecting Invoice Data

### Root Cause

The `useAccrualForecast` function in `src/hooks/useDeadlines.ts` (line 302) checks:

```typescript
const isIncome = inv.invoice_type === "income";
```

But the actual `invoice_type` values in the database are **`emessa`** (issued = income, 4 records) and **`ricevuta`** (received = expense, 14 records). None match `"income"` or `"expense"`, so **every single invoice is treated as a cost**, and the chart displays incorrectly.

The same issue exists in `invoiceToDeadline` (line 56) which checks `inv.invoice_type === "expense"` -- this also doesn't match `ricevuta`.

### Fix

Update all three functions in `src/hooks/useDeadlines.ts` that reference `invoice_type` to handle both naming conventions:

1. **`invoiceToDeadline`** (line 56): Change `inv.invoice_type === "expense"` to also match `"ricevuta"`
2. **`useDeadlinesSummary`** (line 221-236): Same fix for the summary calculation
3. **`useAccrualForecast`** (line 302): Change `inv.invoice_type === "income"` to also match `"emessa"`

The consistent pattern will be:

```typescript
const isIncome = inv.invoice_type === "income" || inv.invoice_type === "emessa";
const isExpense = inv.invoice_type === "expense" || inv.invoice_type === "ricevuta";
```

This is applied in 3 places within the same file. No new files, no database changes, no new dependencies.

### Technical Details

**File**: `src/hooks/useDeadlines.ts`

- **Line 56** (`invoiceToDeadline`): `const isExpense = inv.invoice_type === "expense";` → add `|| inv.invoice_type === "ricevuta"`
- **Line 222** (`useDeadlinesSummary`): The `.forEach` that determines type uses `inv.invoice_type === "expense"` → add `|| inv.invoice_type === "ricevuta"`  
- **Line 302** (`useAccrualForecast`): `const isIncome = inv.invoice_type === "income";` → add `|| inv.invoice_type === "emessa"`

Also update the type filter in invoice queries (lines 149 and similar) to send the correct filter values matching the actual DB data, or remove server-side type filtering and do it client-side.

