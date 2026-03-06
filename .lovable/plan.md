

## Plan: Fix Data Isolation in Edge Functions

### Problem
The `analyze-spending` edge function uses the **service role key** (bypasses RLS) and queries `bank_transactions` **without any `user_id` filter**. This means when any user triggers the spending analysis, they see ALL users' transaction data — a critical data leak.

The `categorize-transactions` function has a similar issue in batch mode (no user filter), though the impact is different (it categorizes all users' transactions together, not leaking data to the UI directly).

### Root Cause
- `analyze-spending` creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` and never extracts the calling user's identity
- It fetches from `bank_transactions` and `cost_categories` without `.eq("user_id", userId)`

### Fix

**File: `supabase/functions/analyze-spending/index.ts`**

1. **Extract the user's identity** from the `Authorization` header (same pattern as `ai-assistant`):
   - Get the Bearer token from the request header
   - Call `supabase.auth.getUser(token)` to verify and get `user.id`
   - Return 401 if not authenticated

2. **Filter all queries by `user_id`**:
   - Line 69-72: Add `.eq("user_id", userId)` to the `bank_transactions` query
   - Line 95-98: Add `.eq("user_id", userId)` or keep global categories (they use `user_id IS NULL` for system ones) — categories are fine as-is since they're read-only reference data

3. **No changes needed** for `ai-assistant` (already filters by userId), `analyze-conto-economico` (receives data from frontend), or `analyze-kpi` (receives data from frontend).

**File: `supabase/functions/categorize-transactions/index.ts`** (optional hardening)

The batch mode (line 100-106) processes all uncategorized transactions across all users. This is acceptable for a background job but should also filter `categorization_rules` by user. Since it doesn't leak data to the UI, this is lower priority but worth noting.

### Summary of Changes
- Single file edit: `analyze-spending/index.ts`
- Add auth validation (~10 lines)
- Add `.eq("user_id", userId)` to the transactions query
- Redeploy automatically

