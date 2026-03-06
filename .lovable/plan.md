

## Plan: Fix Bank Account Data Leak Between Users

### Problem
The edge functions use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) and upsert bank accounts with `onConflict: "external_id"`. If two users connect the same bank account (or banks reuse external IDs), the second user's data overwrites the first user's record, causing cross-user data leaks.

Same issue exists for `acube_account_id` in the A-Cube function and `external_id` on `bank_transactions`.

### Root Cause
The unique constraints on `external_id` and `acube_account_id` are **global** (not scoped per user). Combined with service role key usage, this means upserts can overwrite another user's records.

### Changes

#### 1. Database Migration - User-scoped unique constraints

Drop the existing unique constraints and replace them with composite ones that include `user_id`:

```sql
-- bank_accounts: external_id should be unique per user, not globally
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_external_id_key;
CREATE UNIQUE INDEX bank_accounts_external_id_user_id_idx ON bank_accounts (external_id, user_id) WHERE external_id IS NOT NULL;

-- bank_accounts: acube_account_id should be unique per user
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_acube_account_id_key;
CREATE UNIQUE INDEX bank_accounts_acube_account_id_user_id_idx ON bank_accounts (acube_account_id, user_id) WHERE acube_account_id IS NOT NULL;

-- bank_transactions: external_id should be unique per user
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_external_id_key;
CREATE UNIQUE INDEX bank_transactions_external_id_user_id_idx ON bank_transactions (external_id, user_id) WHERE external_id IS NOT NULL;
```

#### 2. Edge Function `enable-banking/index.ts`

Update upsert calls to use the composite conflict target:
- Line 437: `onConflict: "external_id"` → `onConflict: "external_id,user_id"`
- Line 521: `onConflict: "external_id"` → `onConflict: "external_id,user_id"` (transactions)
- Line 656: `onConflict: "external_id"` → `onConflict: "external_id,user_id"` (sync transactions)

#### 3. Edge Function `acube-banking/index.ts`

- Line 377: `onConflict: "acube_account_id"` → `onConflict: "acube_account_id,user_id"`
- Line 432: `onConflict: "external_id"` → `onConflict: "external_id,user_id"` (transactions)

### Impact
- Each user gets their own isolated bank account records even if connecting the same bank
- Existing data is preserved; the migration only changes constraints
- **4 files modified**: 1 migration + 2 edge functions

