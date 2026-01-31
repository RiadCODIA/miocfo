
## Goal
Make Enable Banking-connected accounts show correct “active” status and display API-derived data (balances/transactions) reliably after connection and after “Sincronizza”, avoiding the current situation where accounts stay “pending” with 0 balances and nothing appears “active”.

## What I found (root cause)
1. **Accounts are being saved correctly** (your screenshot shows 4 FinecoBank accounts; network log confirms `get_accounts` returns 4 rows).
2. In `supabase/functions/enable-banking/index.ts` the account `status` is set to **`pending` whenever balances are 0**, even if the balance fetch succeeded:
   - Current logic: `balanceFetchFailed || (currentBalance === 0 && availableBalance === 0) ? "pending" : "active"`
   - This is wrong because a valid bank balance can be 0; it also makes “Conti attivi” stay at 0 forever.
3. In `syncAccount()` the function updates balances and transactions, **but it does not set the account status to `active` on success**, so even after syncing the UI can remain “In sincronizzazione”.

## Expected behavior after fix
- If the balances endpoint call succeeds, the account becomes **`active`**, even if balance is 0.
- If balances/transactions calls fail due to bank/consent issues, status becomes **`error`** or **`disconnected`** as already implemented.
- Clicking **“Sincronizza”** updates:
  - balance fields
  - status = active
  - and upserts bank transactions

## Implementation plan (code changes)
### 1) Fix status assignment in `completeSession()`
File: `supabase/functions/enable-banking/index.ts`

- Change the logic to:
  - `pending` only when **balance fetch fails** (or when the API returns no balances payload at all and we decide to treat it as not-ready)
  - `active` when balances call succeeds (regardless of amount being 0)

Concretely:
- Remove the `(currentBalance === 0 && availableBalance === 0)` condition from the status decision.
- Keep `balanceFetchFailed` as the main driver for `pending`.

### 2) Set status to `active` on successful `syncAccount()`
File: `supabase/functions/enable-banking/index.ts`

- When `syncAccount()` completes successfully, update `bank_accounts.status` to `active` alongside balance updates:
  - `status: "active"`
  - `last_sync_at`, `updated_at` already exist and should remain.

### 3) Make balance/amount parsing robust (avoid silent “0”)
File: `supabase/functions/enable-banking/index.ts`

Even if the API returns amounts as strings (common in PSD2 APIs), we should parse safely:
- Implement a small helper (local function) like:
  - `toNumber(value): number` using `Number(...)` / `parseFloat(...)` and fallback to 0 if NaN
- Apply it to:
  - `balance.balance_amount.amount`
  - `tx.transaction_amount.amount`

This prevents cases where:
- a string amount fails numeric coercion
- Supabase insert/update coerces unexpectedly
- balances appear as 0 despite real values

### 4) Add targeted logging for balances/transactions payload shape (temporary)
File: `supabase/functions/enable-banking/index.ts`

Because providers sometimes differ in response structure, add logs that show:
- the raw `balances` response (trimmed) when it returns 0 balances or unexpected shape
- the raw `transactionsResponse` shape (count + top-level keys)
This will quickly confirm whether we are reading the correct fields for FinecoBank.

(We’ll keep logs minimal to avoid noise; once confirmed stable, we can reduce them.)

### 5) Frontend refresh after sync (UI reliability)
File: `src/hooks/useEnableBanking.ts`

Right now after sync we update the local `accounts` state with `data.account`. That’s fine, but for maximum reliability:
- After a successful `syncAccount`, call `fetchAccounts()` (or, at least, ensure the returned `data.account.status` is reflected).
- This ensures the UI always matches the DB (especially if the edge function updates more fields than the local object includes).

This is aligned with the proven pattern: “invalidate/refetch after mutation”.

## How we’ll verify it works (step-by-step tests)
1. In `/conti-bancari`, click **Aggiorna**:
   - Expect: “Conti attivi” becomes **4** (or at least >0), not 0.
2. Click **Sincronizza** on one FinecoBank card:
   - Expect a toast: “Sincronizzazione completata”
   - Expect status badge becomes “Attivo” after completion.
3. Go to **Transazioni** page:
   - Expect transactions to appear after a successful sync (if the bank returns them).
4. If balances remain 0:
   - Check edge logs to confirm whether FinecoBank is returning balances and in which field shape; then we can adapt mapping if needed.

## Potential edge cases
- FinecoBank multicurrency sub-accounts may legitimately have 0 balance in some currencies.
- Some banks return transactions in separate “booked/pending” arrays rather than a single `transactions` array. If logs show this, we’ll adapt parsing accordingly.
- If consent is limited (AIS without balances), balances may be unavailable; in that case we should still mark `active` but show “Saldo non disponibile” instead of forcing pending. (We can add that UI nuance if needed after we confirm the API behavior.)

## Items I may need from you (only if verification still fails)
- Whether you clicked “Sincronizza” and what toast/error you see
- A timestamp of a sync attempt so we can pinpoint the correct edge logs
