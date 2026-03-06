

## Plan: Add "Syncing in progress" banner to Transazioni page

### Problem
When a user connects a bank, they navigate to Transazioni and see "Nessuna transazione importata" with no indication that data is being synced in the background. The user doesn't know they need to wait.

### Solution

Add two things to `src/pages/Transazioni.tsx`:

**1. Realtime subscription** (same pattern as ContiBancari)
- Subscribe to `bank_transactions` INSERT events to auto-refresh the transaction list when new data arrives from the background sync.
- Invalidate the `transactions` query key so the table updates live.

**2. "Sync in progress" info banner**
- Query `bank_accounts` to check if any connected accounts exist. If accounts exist but transactions are empty (and not loading), show an informational Alert/banner instead of the current "Nessuna transazione importata" empty state:
  - Icon: blue info/clock icon
  - Title: "Sincronizzazione in corso..."
  - Message: "Le transazioni del conto appena collegato sono in fase di importazione. L'operazione potrebbe richiedere qualche minuto. La pagina si aggiornerà automaticamente."
- If no accounts are connected at all, keep the current empty state message ("Vai su Conti Bancari...").

### File: `src/pages/Transazioni.tsx`

1. Add a `useEffect` with Supabase Realtime subscription on `bank_transactions` table (INSERT events) that invalidates `["transactions"]` query key
2. Add a query for connected bank accounts count (or reuse existing `useBankAccounts`)
3. In the empty state block (lines 415-434), check if there are connected accounts:
   - **Yes accounts, no transactions**: Show the "syncing" info banner with a spinner and auto-refresh message
   - **No accounts**: Show the existing "Vai a Conti Bancari" message

### Technical details

- Reuse the existing `useBankAccounts` hook already imported on line 31
- The Realtime channel ensures the table populates automatically as transactions arrive
- No backend changes needed

