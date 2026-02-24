

# Fix Budget Chart: Show Real Data & Dashed Bars

## Problem
The dashed (expected) bars never appear because all pending invoices have due dates in early 2025 (March-May), but the chart only queries invoices with due dates within Sep 2025 - Aug 2026. Since these invoices are overdue but still unpaid, they should still count as "expected" payments.

## Solution

### File: `src/hooks/useBudgets.ts`

**Change the invoice query logic for the chart:**

1. **Remove the date filter on pending invoices** -- overdue unpaid invoices are still expected cash movements. Instead of filtering by `due_date` within the chart range, fetch ALL unpaid invoices with a `due_date`.

2. **Place overdue invoices in the current month** -- if an invoice's `due_date` is before today, it's overdue but still expected; assign it to the current month so it shows up as a dashed bar "now". Invoices with future due dates keep their original month placement.

3. **Ensure months with only expected data still render** -- currently the chart builds months from the 12-month window, which is correct, but the expected values from overdue invoices need to land in a month that's within that window (the current month).

### Specific Code Changes

In `useBudgetChartData`:

```text
Current: Query invoices WHERE due_date >= rangeStart AND due_date <= rangeEnd
New:     Query invoices WHERE payment_status != 'paid' AND due_date IS NOT NULL (no date filter)
```

Then when grouping by month:
```text
Current: month = format(invoice.due_date, "yyyy-MM")
New:     if due_date < today -> month = currentMonth (overdue = show now)
         else -> month = format(due_date, "yyyy-MM")
```

This ensures overdue invoices (like the 4 pending ones from Mar-May 2025) appear as dashed bars in February 2026.

### Expected Result

With the current data:
- **Feb 2026 dashed green bar**: euro 3000 (1 pending issued invoice)
- **Feb 2026 dashed red bar**: euro 2830 (3 pending received invoices: 1000 + 1830 + 800... actually that's 3630 -- all overdue, grouped into current month)
- **Solid green/red bars**: continue showing actual bank movements as before

This matches what the KPI cards already show (Ricavi Attesi euro 3065, Costi Attesi euro 3630) -- the chart will now visually reflect the same data.

### No changes needed to the chart rendering
The `DashedBar` custom shape component and the 4 `<Bar>` series are already correctly configured. The only issue was that the data arrays had all zeros for the expected fields.
