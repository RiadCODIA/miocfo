

## Standardize Bar Charts Across the Platform

The reference image is the **BudgetPrevisioni** chart ("Ricavi e Costi — Effettivi vs Previsti"). Several other bar-based charts across the platform use inconsistent colors, bar sizes, and styling. This plan aligns all bar charts to the same "thin candle" aesthetic.

### Reference Style (from BudgetPrevisioni)
- Thin bars: `barSize={11}`, `barGap={4}`
- Solid green `hsl(142, 71%, 45%)` for income/revenue actuals
- Solid red `hsl(0, 84%, 60%)` for expense/cost actuals
- Dashed transparent bars for expected/forecasted values (`fillOpacity={0.18}`, `strokeDasharray="6 3"`)
- Grid: horizontal only (`vertical={false}`)
- Axes: `tickLine={false}`, `axisLine={false}`, muted foreground color
- Dark tooltip: `backgroundColor: "hsl(222 47% 14%)"`, rounded 8px
- Legend: small text, bottom-aligned
- Pink dashed line for net/saldo: `hsl(330 70% 60%)`, `strokeDasharray="6 4"`

### Charts That Need Updating (bar-based charts only)

Area charts (LiquidityChart, CashFlowChart), line charts (LiquidityProjection), and pie charts (CashFlowComposition) are excluded — they have a different purpose and visual language.

---

#### 1. `src/components/dashboard/IncomeExpenseChart.tsx`
Currently uses `barSize={14}`, green `hsl(160 64% 52%)`, red `hsl(0 70% 68%)`, grid stroke `hsl(222 47% 18%)`.

Changes:
- `barSize={14}` to `barSize={11}`
- Green fill from `hsl(160 64% 52%)` to `hsl(142, 71%, 45%)`
- Red fill from `hsl(0 70% 68%)` to `hsl(0, 84%, 60%)`
- Grid stroke to `hsl(222 47% 22%)` for consistency
- Axis stroke to `hsl(var(--muted-foreground))` pattern

#### 2. `src/components/scadenzario/LiquidityForecastChart.tsx`
Currently uses stacked bars with hardcoded green `hsl(142 72% 40%)` and red `hsl(0 72% 51%)`, no `barSize` set.

Changes:
- Add `barSize={11}` and `barGap={4}` to `<BarChart>`
- Green from `hsl(142 72% 40%)` to `hsl(142, 71%, 45%)`
- Red from `hsl(0 72% 51%)` to `hsl(0, 84%, 60%)`
- Transparent bars: ensure `fillOpacity={0.18}` (currently 0.3) and `strokeDasharray="6 3"` (currently "4 2") to match the DashedBar style

#### 3. `src/components/flussi-cassa/BudgetComparisonChart.tsx`
Currently uses generic `hsl(var(--primary))` and `hsl(var(--muted-foreground))` fills, no `barSize`.

Changes:
- Add `barSize={11}` and `barGap={4}` to `<BarChart>`
- "Consuntivo" bar: fill `hsl(142, 71%, 45%)` (solid green for actual)
- "Budget" bar: use `DashedBar` shape with green color (since budget is "expected")
- Grid: add `vertical={false}`
- Tooltip: dark style matching reference
- Axis: use `stroke` instead of `tick.fill`, remove `axisLine`

#### 4. `src/components/area-economica/PrevisioniTab.tsx` (lines 188-197)
Currently uses `hsl(var(--primary))` and `hsl(var(--muted-foreground))` with `opacity={0.5}`.

Changes:
- Add `barSize={11}` and `barGap={4}` to `<BarChart>`
- "Consuntivo" bar: fill `hsl(142, 71%, 45%)`
- "Previsionale" bar: use DashedBar shape with green dashed transparent style
- Tooltip: dark background style

#### 5. `src/pages/KPIInterni.tsx` (lines 253-284) — Area chart
This is an AreaChart, not a bar chart. It will be excluded from bar chart standardization but will get color alignment:
- Income area stroke/fill: `hsl(142, 71%, 45%)` instead of `hsl(var(--chart-2))`
- Expense area stroke/fill: `hsl(0, 84%, 60%)` instead of `hsl(var(--chart-1))`

### Shared DashedBar Component
Extract the `DashedBar` component from `BudgetPrevisioni.tsx` into a shared utility file `src/components/charts/DashedBar.tsx` so it can be reused by BudgetComparisonChart, PrevisioniTab, and LiquidityForecastChart without duplication.

### Files to Create
- `src/components/charts/DashedBar.tsx` — shared dashed bar shape component

### Files to Modify
- `src/components/dashboard/IncomeExpenseChart.tsx` — bar size, colors
- `src/components/scadenzario/LiquidityForecastChart.tsx` — bar size, colors, opacity, dash pattern
- `src/components/flussi-cassa/BudgetComparisonChart.tsx` — colors, bar size, dashed bar for budget, tooltip
- `src/components/area-economica/PrevisioniTab.tsx` — colors, bar size, dashed bar for previsionale
- `src/pages/BudgetPrevisioni.tsx` — import shared DashedBar instead of local definition
- `src/pages/KPIInterni.tsx` — color alignment for income/expense areas

