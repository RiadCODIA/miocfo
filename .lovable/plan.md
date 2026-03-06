

## Plan: Fix Partial Index Issue in Bank Isolation Migration

### Problem Found
The current migration creates **partial unique indexes** with `WHERE external_id IS NOT NULL`. According to project memory (`memory/technical/database-sync-constraints`), **partial indexes with WHERE clauses are NOT recognized by Supabase's ON CONFLICT spec**. This means all upsert operations in the edge functions will fail when they try to use `onConflict: "external_id,user_id"`.

### No Mock Data Found
There are no mock bank accounts or fake banking data in the codebase. The `useBankAccountsQuery` hook queries `bank_accounts` directly through the Supabase client with RLS (`auth.uid() = user_id`), which already ensures frontend isolation. The landing page has mock UI elements (visual only), and `Comunicazioni.tsx` has mock messages, but neither relates to banking.

### Fix Required

**File: New migration to replace partial indexes with standard unique indexes**

Replace the 3 partial indexes from the previous migration with standard (non-partial) unique indexes:

```sql
-- Drop the partial indexes that don't work with ON CONFLICT
DROP INDEX IF EXISTS bank_accounts_external_id_user_id_idx;
DROP INDEX IF EXISTS bank_accounts_acube_account_id_user_id_idx;
DROP INDEX IF EXISTS bank_transactions_external_id_user_id_idx;

-- Create standard composite unique indexes (no WHERE clause)
CREATE UNIQUE INDEX bank_accounts_external_id_user_id_idx 
  ON bank_accounts (external_id, user_id);

CREATE UNIQUE INDEX bank_accounts_acube_account_id_user_id_idx 
  ON bank_accounts (acube_account_id, user_id);

CREATE UNIQUE INDEX bank_transactions_external_id_user_id_idx 
  ON bank_transactions (external_id, user_id);
```

Since `external_id` and `acube_account_id` are nullable, rows with NULL values won't conflict (SQL standard: NULL != NULL in unique indexes), so this is safe.

### Verification Checklist
- Edge functions already updated with `onConflict: "external_id,user_id"` -- correct
- RLS on `bank_accounts` enforces `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE -- correct
- Frontend queries go through RLS (no service role key on client) -- correct
- No mock bank data exists -- confirmed

### Testing Approach
After the migration, I'll use the Supabase `read-query` tool to verify:
1. The new indexes exist and are non-partial
2. No old global unique constraints remain

**1 file modified**: 1 new migration

