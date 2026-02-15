
# Add Monthly Receipts vs Payments Chart with Balance Line to Dashboard

## What's Missing
The dashboard currently shows the Hero card, 3 KPI cards, Category Analysis, and Account Balances -- but the "Incassi vs Pagamenti" chart (`IncomeExpenseChart`) is not rendered on the page despite the component already existing.

## Changes

### 1. Add the chart to the Dashboard page
Import and render `IncomeExpenseChart` at the bottom of `src/pages/Dashboard.tsx`, below the existing cards grid.

### 2. Enhance the chart with a net balance line
Update `src/components/dashboard/IncomeExpenseChart.tsx` to include:
- Green bars for receipts (incassi) -- already present
- Red bars for payments (pagamenti) -- already present
- A blue `Line` overlay showing the net monthly balance (incassi - pagamenti) on top of the bar chart, using a `ComposedChart` instead of `BarChart`

### 3. Update the data hook
Modify the `useIncomeExpenseChart` hook in `src/hooks/useDashboardData.ts` to include a `saldo` field (incassi - pagamenti) in each monthly data point so the line can render it.

## Technical Details

### Files to modify:

1. **`src/pages/Dashboard.tsx`**
   - Import `IncomeExpenseChart`
   - Add it as a full-width section at the bottom of the page

2. **`src/components/dashboard/IncomeExpenseChart.tsx`**
   - Switch from `BarChart` to `ComposedChart` (from recharts)
   - Add a `Line` element with `dataKey="saldo"`, blue stroke, and dot markers
   - Update the Legend to include the balance line label

3. **`src/hooks/useDashboardData.ts`**
   - Add `saldo: number` to the `MonthlyComparison` type
   - Compute `saldo = incassi - pagamenti` for each month in the query function
