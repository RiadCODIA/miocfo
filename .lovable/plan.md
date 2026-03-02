
## Plan: Remove "da categorizzare" box and add automatic scheduled categorization

### 1. Remove the "141 da categorizzare" UI element from Transazioni page

**File: `src/pages/Transazioni.tsx`**
- Remove lines 348-353 (the `uncategorizedCount` badge/box)
- Remove the `uncategorizedCount` variable computation (lines 147-149) since it's no longer needed
- Remove the `Sparkles` import if unused elsewhere

### 2. Create a scheduled edge function for auto-categorization every 4 hours

**File: `supabase/functions/auto-categorize/index.ts`**
- Create a new edge function that:
  - Runs as a cron job every 4 hours
  - Calls the existing `categorize-transactions` logic in batch mode
  - Processes all uncategorized transactions automatically
  - Logs results for monitoring

The function will internally invoke the existing `categorize-transactions` function endpoint, reusing all the AI + rule-matching logic already built.

**File: `supabase/config.toml`**
- Add the new function configuration with `verify_jwt = false` (since it's triggered by cron, not by users)

### 3. Set up the cron schedule

**Database migration**: Add a `pg_cron` job to call the `auto-categorize` function every 4 hours:
```sql
SELECT cron.schedule(
  'auto-categorize-transactions',
  '0 */4 * * *',
  $$SELECT extensions.http_post(
    url := '<supabase_url>/functions/v1/auto-categorize',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb,
    body := '{"batch_mode": true}'::jsonb
  )$$
);
```

Alternatively (and more reliably), the `auto-categorize` edge function can be a standalone function that directly queries the DB and calls the AI gateway, without needing pg_cron -- it can be triggered by a simple external cron service or Supabase's built-in cron via `pg_net`.

### Technical details

- The "categorizzazione AI in corso..." loading indicator (lines 342-347) will remain since it shows when a user-initiated categorization is running
- The `useCategorizeTransactions` hook import can stay since it's still used for manual single-transaction categorization
- The auto-categorize function reuses the same AI gateway and rule-matching logic from `categorize-transactions`
