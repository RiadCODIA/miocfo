

## Audit: Data Isolation by User ID Across Edge Functions

I reviewed all 16 edge functions. Here are the findings:

### Already Secure (no changes needed)
- **analyze-spending** — Fixed in previous iteration, filters by `user_id`
- **ai-assistant** — Authenticates user, all queries scoped to `userId`
- **check-alerts** — All queries filtered by `userId`
- **process-bank-statement** — Authenticates user, scoped to `userId`
- **process-invoice** — Authenticates user, scoped to `userId`
- **sync-bank-accounts** — Background job, writes with `account.user_id` from existing records
- **acube-banking** — Extracts `userId` from auth, all queries scoped
- **enable-banking** — Extracts `userId` from auth, all queries scoped
- **acube-cassetto-fiscale** — `fetch-invoices` requires auth; setup/status are per-fiscal-id (no DB leak)
- **analyze-kpi** — Receives data from frontend, no DB queries
- **analyze-conto-economico** — Receives data from frontend, no DB queries
- **create-client-user** — Verifies admin role before acting
- **send-alert-email** — Internal service call, no user-facing data leak

### Issues Found

#### 1. `categorize-transactions` — Batch mode leaks across users
**Problem:** In `batch_mode` (line 100-106), it queries `bank_transactions` where `ai_category_id IS NULL` with **no `user_id` filter**. This means it categorizes ALL users' uncategorized transactions together. Also, `categorization_rules` (line 68-71) are fetched globally without user filtering.

**Fix:**
- Add auth extraction (same pattern as `analyze-spending`)
- Add `.eq("user_id", userId)` to the batch transactions query (line 102)
- Add `.eq("user_id", userId)` to the categorization rules query (line 68)
- For specific `transaction_ids` mode, verify transactions belong to the caller

#### 2. `auto-categorize` — Triggers batch mode without user context
**Problem:** Calls `categorize-transactions` with `batch_mode: true` using the service role key. Since `categorize-transactions` doesn't filter by user, this processes all users' data together.

**Fix:** After fixing `categorize-transactions`, `auto-categorize` needs to iterate per-user or pass a user context. The simplest approach: query distinct `user_id` values from uncategorized transactions, then call `categorize-transactions` once per user.

#### 3. `powens` — Multiple functions lack user scoping
**Problem:**
- `getAccounts()` (line 183-196): fetches ALL `bank_accounts` from DB with no `user_id` filter
- `syncAccount()` (line 198-291): fetches account by `id` without verifying ownership
- `getTransactions()` (line 294-322): fetches transactions by `bank_account_id` without user check
- `removeConnection()` (line 324-380): deletes accounts without verifying ownership

**Fix:**
- Add auth extraction to the main handler
- Pass `userId` to all action handlers
- Add `.eq("user_id", userId)` to all DB queries

### Plan Summary

| File | Change | Priority |
|------|--------|----------|
| `categorize-transactions/index.ts` | Add auth + user_id filter to batch mode and rules query | High |
| `auto-categorize/index.ts` | Iterate per-user when triggering batch categorization | Medium |
| `powens/index.ts` | Add auth + user_id filter to all DB queries | High |

Three files to modify. The `categorize-transactions` and `powens` fixes are critical for preventing cross-user data access. The `auto-categorize` fix ensures background jobs respect user boundaries.

