

# Connect Global Period Filter to All Pages and Charts

## Overview
The TopBar date range picker (`DateRangeContext`) currently only affects **Flussi di Cassa** and **Transazioni**. The Dashboard, Budget & Previsioni, KPI Report, and Category Analysis all use hardcoded date ranges. This plan connects the global filter everywhere.

## Hooks That Need Changes

### 1. `src/hooks/useDashboardData.ts` -- 3 hooks to update

**`useDashboardKPIs`**: Currently hardcoded to "current month" based on latest transaction date.
- Accept `dateRange` from `useDateRange()` context
- Use `dateRange.from` / `dateRange.to` instead of hardcoded month boundaries
- Compare against the same-length previous period (e.g., if 30 days selected, compare vs prior 30 days)
- Include `dateRange` in the `queryKey` so React Query refetches on filter change

**`useLiquidityChart`**: Hardcoded to last 30 days from latest transaction.
- Use `dateRange.from` / `dateRange.to` for the query window
- Build daily balances within the selected range
- Include `dateRange` in `queryKey`

**`useIncomeExpenseChart`**: Hardcoded to last 6 months.
- Use `dateRange.from` / `dateRange.to` to determine which months to show
- Group transactions by month within that range
- Include `dateRange` in `queryKey`

### 2. `src/hooks/useBudgets.ts` -- 2 hooks to update

**`useBudgetChartData`**: Hardcoded 6-past + 6-future month window.
- Use `dateRange` to set the chart window for actuals (bank transactions)
- Keep expected invoices logic (overdue -> current month) but respect chart range from the filter
- Include `dateRange` in `queryKey`

**`useBudgetVarianceSummary`**: No date filter at all on budgets/invoices.
- Filter budgets by `start_date` within `dateRange`
- Filter pending invoices by `due_date` within `dateRange` (or overdue ones if range includes today)
- Include `dateRange` in `queryKey`

### 3. `src/hooks/useKPIData.ts` -- 1 hook to update

**`useKPIData`**: Hardcoded to current month vs last month.
- Use `dateRange` for the "current period" calculations
- Compute a "previous period" of equal length just before `dateRange.from`
- Include `dateRange` in `queryKey`

### 4. `src/hooks/useCategoryAnalysis.ts` -- 1 hook to update

**`useCategoryAnalysis`**: No date filter at all (fetches ALL transactions).
- Add `dateRange` filter using `.gte("date", from).lte("date", to)`
- Include `dateRange` in `queryKey`

### 5. `src/hooks/useDeadlines.ts` -- `useDeadlinesSummary` and `useAccrualForecast`

**`useDeadlinesSummary`**: No date filter.
- Filter by `due_date` within `dateRange`
- Include `dateRange` in `queryKey`

**`useAccrualForecast`**: Hardcoded 6 months back/forward.
- Use `dateRange` to set the window
- Include `dateRange` in `queryKey`

## Pattern for Each Hook

Each hook follows the same pattern:

```text
1. Import useDateRange from context
2. Extract dateRange.from and dateRange.to
3. Format as "yyyy-MM-dd" strings
4. Use in Supabase .gte() / .lte() filters
5. Add formatted dates to queryKey array
```

## Pages That May Need Minor Adjustments

- **Dashboard.tsx**: The KPI subtitle "vs mese prec." should dynamically say "vs periodo precedente" since the filter may not be a single month
- **BudgetPrevisioni.tsx**: The chart X-axis labels should adapt to the selected range (could be weeks if short range, or months if long)

## What Should NOT Change

- **Conto Economico** (`useContoEconomico`): Already uses a year selector independent of the global filter -- this is intentional for annual P&L views
- **Transazioni page**: Already has its own local filter system that overrides the global one -- keep as-is
- **Cash Flow page** (`useCashFlowData`): Already fully connected -- no changes needed

## Testing Plan

After implementation:
1. Navigate to Dashboard, change the period filter, verify KPI cards and charts update
2. Navigate to Budget & Previsioni, change the filter, verify chart redraws with correct range
3. Navigate to KPI Report, change the filter, verify KPI calculations reflect the selected period
4. Test "Tutto il periodo" preset to ensure all historical data loads
5. Test custom date range via calendar picker
6. Verify no infinite re-render loops (queryKey stability)

