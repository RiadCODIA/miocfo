

# Automatic Bank Account Sync Every 4 Hours

## Problem

Currently, bank balances and transactions only update when the user manually clicks "Sincronizza". The screenshot shows stale data (last update Feb 20-23). There is no automated/scheduled synchronization.

## Solution

Create an automated sync system using:
1. A new Edge Function (`sync-bank-accounts`) that syncs all connected Enable Banking accounts using the service role key (no user auth needed)
2. A `pg_cron` + `pg_net` scheduled job that calls this function every 4 hours
3. Logging each sync run in the existing `sync_jobs` table

## Implementation Plan

### 1. Enable Required Extensions

Enable `pg_cron` and `pg_net` extensions via a SQL migration. These are available on all Supabase projects.

### 2. Create Edge Function: `sync-bank-accounts`

A new edge function that:
- Uses the service role key (no user authentication)
- Queries all `bank_accounts` where `is_connected = true` and `provider = 'enable_banking'`
- For each account, calls Enable Banking API to refresh balance and fetch new transactions (reusing the same logic as the existing `syncSingleAccount`)
- Updates `balance` and `last_sync_at` in the database
- Logs results to `sync_jobs` table
- Has `verify_jwt = false` in config (called by pg_cron, not by users)

### 3. Set Up pg_cron Schedule

Create a cron job that runs every 4 hours:

```text
Schedule: 0 */4 * * *  (every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
```

This calls the edge function via `pg_net` HTTP extension, which makes an HTTP POST to the function URL using the service role key.

### 4. Update config.toml

Add the new function with `verify_jwt = false` since it's called by pg_cron, not by authenticated users. The function will validate requests using a shared secret or the service role key header.

## Technical Details

### Edge Function Structure (`supabase/functions/sync-bank-accounts/index.ts`)

```text
1. Verify request is from cron (check for service role key or secret header)
2. Query all bank_accounts WHERE is_connected = true AND provider = 'enable_banking'
3. Group accounts by user_id
4. For each account:
   a. Generate Enable Banking JWT
   b. Call /accounts/{uid}/balances API
   c. Update balance + last_sync_at in DB
   d. Fetch new transactions since last sync
   e. Upsert new transactions
5. Log sync result to sync_jobs table
6. Return summary
```

### SQL Migration

```text
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the job (every 4 hours)
SELECT cron.schedule(
  'sync-bank-accounts-every-4h',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/sync-bank-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);
```

### Files to Create/Modify

1. **Create** `supabase/functions/sync-bank-accounts/index.ts` -- New scheduled sync function
2. **Modify** `supabase/config.toml` -- Add `[functions.sync-bank-accounts]` with `verify_jwt = false`
3. **SQL Migration** -- Enable pg_cron + pg_net, create the scheduled job

### Security

- The edge function checks for the service role key in the Authorization header to prevent unauthorized calls
- The function reuses the Enable Banking JWT generation logic from the existing `enable-banking` function
- All database writes use the service role key (bypasses RLS)

