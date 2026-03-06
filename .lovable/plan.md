

## Plan: Fix Bank Connection Timeout Error

### Root Cause

The edge function logs show the `complete_session` call is paginating through 40+ pages of transactions (50 per page), taking well over 15 seconds. The current 15-second timeout in `ConnectBankModal.tsx` fires before the edge function finishes, showing the "Timeout" error to the user even though the connection is still processing successfully in the background.

The same 15-second timeout applies to A-Cube connections (line 171-174).

### Fix

**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

1. Increase the Enable Banking timeout from 15s to **120s** (line 108) — the transaction sync can legitimately take 1-2 minutes for accounts with years of history
2. Increase the A-Cube timeout from 15s to **120s** (line 171-174)
3. Update the "connecting" step UI to show a more informative message like "Sincronizzazione transazioni in corso..." so the user knows it's working

These are two simple constant changes (15000 → 120000) on lines 108 and 174.

