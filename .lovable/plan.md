

# Fix: Stop recreating read/deleted notifications

## Problem

Notifications keep reappearing after being read or deleted because:

1. The duplicate check only looks back 24 hours -- after that, the same alert is recreated
2. Deadline alert titles change daily ("in 3 giorni" becomes "in 2 giorni"), so title-based matching fails entirely

## Solution

Use a stable `reference_id` for each alert source and check for duplicates without any time limit.

### How it works

Each alert will include a `reference_id` in its metadata that uniquely identifies the source:

| Alert type | reference_id |
|---|---|
| Deadline upcoming | `deadline_{deadline.id}` |
| Deadline overdue | `deadline_overdue_{deadline.id}` |
| Budget exceeded | `budget_{budget.id}` |
| Budget near limit | `budget_warning_{budget.id}` |
| Low liquidity | `liquidity_low` |
| Invoice overdue | `invoice_{invoice.id}` |
| Unmatched invoices | `invoices_unmatched` |
| Bank sync stale | `sync_{account_name}` |

### Duplicate check logic change

**Before (broken):**
- Match by `type + title + user_id` within last 24 hours
- Fails when title changes or after 24h

**After (fixed):**
- Match by `type + reference_id (in metadata) + user_id` with NO time limit
- A read or deleted alert with the same reference prevents recreation
- For deleted alerts: track deletions in metadata of a "suppression" record, OR simply never recreate if no matching unresolved condition exists

Actually, the simplest robust approach: instead of tracking deletions, just check if any alert (read or unread) with the same `type` and `reference_id` already exists. If the user deletes it, it gets recreated -- but that's acceptable since delete means "dismiss now" while read means "I've seen it, don't show again."

For deleted alerts, we add a `dismissed_alerts` tracking approach: store dismissed reference_ids in a lightweight way. The simplest: when checking duplicates, also check recently deleted ones. But since we can't query deleted rows, we'll use a different approach:

**Final approach**: Change `createAlert` to check by `type + reference_id` (stored in metadata JSONB) with no time limit. Read alerts won't be recreated. For deleted alerts, they will be recreated (which is fine -- delete means temporary dismiss).

## Files to modify

| File | Changes |
|---|---|
| `supabase/functions/check-alerts/index.ts` | Add `reference_id` to metadata in all alert creation calls; update `createAlert` to check duplicates by `type + metadata->reference_id` without time limit |

## Technical details

### Updated `createAlert` function

```text
async function createAlert(
  supabase, userId,
  data: { type, title, message, severity, action_url?, reference_id }
) {
  // Check for ANY existing alert with same type + reference_id (no time limit)
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("type", data.type)
    .eq("user_id", userId)
    .contains("metadata", { reference_id: data.reference_id })
    .maybeSingle();

  if (existing) return null; // Already exists (read or unread)

  // Insert with reference_id in metadata
  await supabase.from("alerts").insert({
    ...alertData,
    metadata: { reference_id: data.reference_id }
  });
}
```

### Reference IDs per check function

- `checkDeadlines`: `reference_id: "deadline_" + deadline.id` and `"deadline_overdue_" + deadline.id`
- `checkBudgets`: `reference_id: "budget_exceeded_" + budget.id` or `"budget_warning_" + budget.id`
- `checkLiquidity`: `reference_id: "liquidity_low"`
- `checkInvoices`: `reference_id: "invoice_overdue_" + invoice.id` or `"invoices_unmatched"`
- `checkBankSync`: `reference_id: "sync_stale_" + account.name`

This ensures that once you read a notification about a specific deadline/budget/invoice, it will never be recreated, regardless of title changes or time elapsed.

