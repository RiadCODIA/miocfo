

# Fix: Cash Flow Calculations Are Wrong Due to Supabase 1000-Row Limit

## Root Cause

The database contains **4,810 transactions**, but Supabase returns a maximum of **1,000 rows per query by default**. Every hook that fetches `bank_transactions` silently gets truncated data, producing incorrect totals.

Affected hooks:
- `useCashFlowData.ts` — Flussi di Cassa page (monthly chart + KPIs)
- `useDashboardData.ts` — Dashboard (KPIs, liquidity chart, income/expense chart)
- `useKPIData.ts` — KPI Report / Dati e Statistiche

Real totals (from DB): Income €273,375 / Expenses €274,439. The app likely shows much less because it only processes the first 1,000 rows.

## Solution

Use **server-side aggregation** via Supabase RPC (database functions) instead of fetching all rows client-side. This is both correct and more performant.

### 1. Create database functions (migration)

**Function A: `get_cashflow_summary`** — Returns monthly aggregates (incassi, pagamenti, cashflow) for a date range, grouped by month. Used by `useCashFlowData` and `useIncomeExpenseChart`.

**Function B: `get_cashflow_totals`** — Returns total income, total expenses for a date range. Used by `useDashboardKPIs`, `useCashFlowKPIs`, and `useKPIData`.

**Function C: `get_daily_totals`** — Returns daily net amounts for the liquidity chart. Used by `useLiquidityChart`.

All functions filter by `user_id = auth.uid()` for security.

### 2. Update hooks to call RPC instead of fetching raw rows

- **`useCashFlowData.ts`**: Replace the `select("amount, date")` query + client-side grouping with a call to `get_cashflow_summary(from, to)`.
- **`useDashboardData.ts`**: Replace transaction fetches with `get_cashflow_totals(from, to)` for KPIs, and `get_daily_totals(from, to)` for the liquidity chart.
- **`useKPIData.ts`**: Replace bank transaction fetches with `get_cashflow_totals` for both current and previous periods.
- **`useCashFlowComposition`**: This one needs row-level `description` access. Add pagination to fetch all rows (loop with `.range()`), or create a dedicated RPC that classifies server-side.

### 3. Pagination fallback for composition

For `useCashFlowComposition` (which needs `description` text for regex classification), implement a paginated fetch loop that retrieves all matching rows in batches of 1000.

### Technical details

```sql
-- Function A
CREATE OR REPLACE FUNCTION get_cashflow_summary(p_from date, p_to date)
RETURNS TABLE(month_key text, incassi numeric, pagamenti numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    to_char(date, 'YYYY-MM') as month_key,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as incassi,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as pagamenti
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
  GROUP BY to_char(date, 'YYYY-MM')
  ORDER BY month_key;
$$;

-- Function B
CREATE OR REPLACE FUNCTION get_cashflow_totals(p_from date, p_to date)
RETURNS TABLE(total_income numeric, total_expenses numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to;
$$;

-- Function C
CREATE OR REPLACE FUNCTION get_daily_totals(p_from date, p_to date)
RETURNS TABLE(day date, net_amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT date as day, COALESCE(SUM(amount), 0) as net_amount
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
  GROUP BY date ORDER BY date;
$$;
```

Files to modify:
- `src/hooks/useCashFlowData.ts` — use RPC for summary/totals/composition
- `src/hooks/useDashboardData.ts` — use RPC for KPIs, daily totals, monthly chart
- `src/hooks/useKPIData.ts` — use RPC for cash flow KPI calculation

