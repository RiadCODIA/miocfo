

## Problem

In `invoiceToDeadline()` (useDeadlines.ts, line 59-66), invoices **without a `due_date`** are unconditionally marked as `status: "completed"`. Even when a user unchecks "Saldato" (which sets `payment_status` back to `"pending"` on the invoice), the deadline still shows as completed because the `!inv.due_date` check takes priority over `payment_status`.

This creates a loop: the user unchecks → DB updates to `pending` → but the UI re-derives `completed` from the missing `due_date`.

## Fix

**File: `src/hooks/useDeadlines.ts`** — Change `invoiceToDeadline()` logic:

Currently (lines 59-77):
```
if (!inv.due_date) {
  status = "completed";  // ← always completed, ignores payment_status
  dueDate = inv.invoice_date || today;
} else { ... }
```

Change to: check `payment_status` **first**, then use `due_date` absence only as a fallback hint:

```typescript
const isPaid = inv.payment_status === "paid" || inv.payment_status === "matched";

if (isPaid) {
  status = "completed";
  dueDate = inv.due_date || inv.invoice_date || today;
} else if (!inv.due_date) {
  // No due date and not explicitly paid → treat as pending (user can manage)
  status = "pending";
  dueDate = inv.invoice_date || today;
} else if (inv.due_date < today) {
  status = "overdue";
  dueDate = inv.due_date;
} else {
  status = "pending";
  dueDate = inv.due_date;
}
```

Same logic fix in `useDeadlinesSummary()` (line 229-233) and `useAccrualForecast()` (line 326) where the same pattern `!inv.due_date → completed` is used.

**3 locations to fix**, all in `src/hooks/useDeadlines.ts`. No other files need changes.

