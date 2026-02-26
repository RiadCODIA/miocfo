

## Problem

When connecting a bank, after the redirect flow completes and the bank is already linked in the database, the modal stays in "connecting" loading state indefinitely. The user must manually refresh the page to see the connected bank.

Two root causes:

1. **`handleConnect` in `ContiBancari.tsx` doesn't invalidate React Query caches** — it only calls `refetch()` but not `queryClient.invalidateQueries`, so other components using the same query key may not update.

2. **The `completeSession` callback in `ConnectBankModal` may fail silently or the modal may get stuck in the "connecting" step** if the Enable Banking edge function returns an error or the session isn't restored after redirect. The retry logic only retries on session/auth errors, not other failures.

3. **No timeout mechanism** — if `completeSession` hangs, the user sees a spinner forever.

## Plan

### 1. Fix `handleConnect` in `ContiBancari.tsx`
- Use `queryClient.invalidateQueries` for `["bank-accounts"]` and `["bank-transactions-count"]` instead of just `refetch()`, ensuring all consumers of that data refresh.

### 2. Add a timeout to the connecting step in `ConnectBankModal.tsx`
- Add a timeout (e.g., 15 seconds) to the `completeSession` and `completeAcube` async flows. If they don't resolve in time, show an error with a "Riprova" option.

### 3. Improve session restoration polling in the redirect callback
- After the redirect back from the bank, add explicit Supabase session restoration polling (similar to what `completeAcube` already does) before calling `completeSession`, ensuring the auth token is available.

### 4. Add fallback: auto-refetch accounts on success
- In the success step's `handleComplete`, also trigger `queryClient.invalidateQueries` to ensure the accounts list is refreshed even if `onConnect` only does a shallow refetch.

### Technical Details

**`src/pages/ContiBancari.tsx`** — `handleConnect` (line 54-57):
```tsx
const handleConnect = (newAccounts: BankAccount[]) => {
  queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
  queryClient.invalidateQueries({ queryKey: ["bank-transactions-count"] });
  queryClient.invalidateQueries({ queryKey: ["bank-accounts-balances"] });
};
```

**`src/components/conti-bancari/ConnectBankModal.tsx`** — Enable Banking callback (lines 74-89):
- Add session restoration polling before calling `completeSession` (wait for `supabase.auth.getSession()` to return a valid token, up to 5 retries with 1s delay)
- Wrap the `complete()` call in a timeout of 15 seconds that falls back to error state

