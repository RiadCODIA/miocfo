
# Fix Budget & Previsioni - 4 Issues

## Issue 1: Wrong Subtitle
**File**: `src/pages/BudgetPrevisioni.tsx` (line 68-69)

Current: "Pianificazione finanziaria futura"
Replace with: "Pianifica un budget di costi e ricavi e verifica gli scostamenti sul consuntivo"

## Issue 2: Page Crash on Budget Entry

Two problems found:

**A) DialogFooter ref warning** (`src/components/ui/dialog.tsx` line 59-61): `DialogFooter` is a plain function component, but Radix Dialog tries to pass a ref to it. This triggers a React warning that can cascade into rendering issues with the ErrorBoundary.

Fix: Wrap `DialogFooter` with `React.forwardRef`.

**B) Negative amounts rejected** (`src/components/budget/CreateBudgetModal.tsx` line 54): The validation `amount <= 0` blocks negative values, so users cannot enter costs (which should use a minus sign per the user's requirement). Also, the `formatInputCurrency` function strips the minus sign.

Fix: Allow negative amounts in validation (check `amount === 0` instead) and preserve the minus sign in formatting.

**C) Missing DialogDescription** (console warning): The modal has no `DialogDescription`, causing Radix to throw an accessibility warning that may contribute to instability.

Fix: Add a `DialogDescription` with the tutorial text (solves issue 3 simultaneously).

## Issue 3: Tutorial Text for "Inserisci Budget"

Add the tutorial text in two places:
- **Tooltip on the button** (hover): Short summary of the functionality
- **DialogDescription in the modal**: Full text: "Enter the expense amount (with a minus sign) or revenue amount (with a plus sign) you've forecasted for your budget. This way, you can plan your fixed costs or future revenues to monitor their performance from month to month." (translated to Italian for UI consistency)

## Issue 4: Variance Numbers Without Budget

**File**: `src/hooks/useBudgets.ts`

The `useBudgetVarianceSummary` and `useBudgetComparison` hooks fetch `bank_transactions` regardless of whether any budgets exist. When `totalBudget = 0`, the variance becomes the raw transaction total, which is meaningless.

Fix: If no active budgets exist, return zeroed-out variance data instead of comparing transactions against nothing. The comparison chart already handles this correctly (shows "Nessun dato di confronto" when empty), but the variance summary cards need the same guard.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BudgetPrevisioni.tsx` | Update subtitle; add Tooltip around "Inserisci Budget" button |
| `src/components/budget/CreateBudgetModal.tsx` | Fix negative amount validation; add DialogDescription with tutorial text; fix formatInputCurrency for negative values |
| `src/components/ui/dialog.tsx` | Wrap DialogFooter with React.forwardRef to fix ref warning |
| `src/hooks/useBudgets.ts` | Guard variance summary to return zeros when no budgets exist |

## Technical Details

### DialogFooter fix (dialog.tsx)
```text
// Before:
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (...)

// After:
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={...} {...props} />
  )
);
DialogFooter.displayName = "DialogFooter";
```

### Amount validation fix (CreateBudgetModal.tsx)
```text
// Before: rejects negative (costs)
if (amount <= 0) { toast.error("Inserisci un importo valido"); return; }

// After: only rejects zero
if (amount === 0) { toast.error("Inserisci un importo valido (positivo per ricavi, negativo per costi)"); return; }
```

### Variance guard (useBudgets.ts)
```text
// Early return if no budgets
const totalBudget = budgets?.reduce(...) || 0;
if (!budgets || budgets.length === 0) {
  return { positiveVariance: 0, negativeVariance: 0, netVariance: 0, positiveMonths: 0, negativeMonths: 0, variancePercent: 0 };
}
```
