

## Remove "Consuntivo vs Budget" and Expand "Andamento Flussi di Cassa"

The "Consuntivo vs Budget" chart (`BudgetComparisonChart`) will be removed from the Flussi di Cassa page. The remaining "Andamento Flussi di Cassa" chart (`CashFlowChart`) will expand to fill the full width of the row, eliminating the empty space.

### Changes

#### `src/pages/FlussiCassa.tsx`
1. Remove the `BudgetComparisonChart` import (line 16)
2. Remove `useCashFlowVsBudget` from the hook import and its usage (lines 13, 23)
3. Replace the 2-column grid (lines 98-110) with a single full-width container rendering only `CashFlowChart`
4. Remove the `isLoadingBudget` variable since it's no longer needed

The chart row changes from:
```text
┌──────────────────┐ ┌──────────────────┐
│ Andamento Flussi │ │Consuntivo vs Bud.│
└──────────────────┘ └──────────────────┘
```
To:
```text
┌─────────────────────────────────────────┐
│        Andamento Flussi di Cassa        │
└─────────────────────────────────────────┘
```

### Files to modify
- `src/pages/FlussiCassa.tsx` — remove BudgetComparisonChart, expand CashFlowChart to full width

### Notes
- The `BudgetComparisonChart` component file itself is kept in place since it may be used elsewhere or re-added later
- No other pages reference `useCashFlowVsBudget`, but the hook is also kept for potential future use

