

# Fix Fatture - Invoice Processing Speed and Matching Crash

## Issue 1: Manual Matching Crashes with "Unable to save match"

**Root cause**: In `handleConfirmMatch` (line 223) and `handleAutoMatch` (line 276), the code updates a column called `match_status` -- but this column does NOT exist in the `invoices` table. The correct column is `payment_status`.

```
// Current (BROKEN):
.update({ match_status: 'matched', matched_transaction_id: transactionId })

// Fix:
.update({ payment_status: 'matched', matched_transaction_id: transactionId })
```

Same fix needed in `handleAutoMatch` at line 276.

**File**: `src/pages/Fatture.tsx` (lines 223-224 and 276-277)

## Issue 2: Invoices Stuck as "Pending" - Slow Processing for Bulk Uploads

**Root cause**: The upload flow processes files **sequentially** in a `for` loop (line 106). For 100-200 invoices, each file triggers an individual AI extraction call, making the total time extremely long (potentially minutes or timeouts).

**Fix**: Process files in **parallel batches** of 5 at a time. This keeps things fast without overwhelming the AI gateway with too many simultaneous requests.

**File**: `src/pages/Fatture.tsx` (lines 106-146)

Current sequential loop:
```
for (const file of files) {
  // upload + process one at a time
}
```

Replace with parallel batch processing:
```
const BATCH_SIZE = 5;
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.allSettled(
    batch.map(async (file) => {
      // upload + process
    })
  );
  // collect results, continue with next batch
}
```

Also add a progress indicator showing "Processing X of Y files..." so users know the system is working.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Fatture.tsx` | Fix `match_status` to `payment_status` in two places; add parallel batch upload processing with progress feedback |

## Technical Details

### Matching fix (two locations)

**handleConfirmMatch** (line 223):
- Change `match_status: 'matched'` to `payment_status: 'matched'`

**handleAutoMatch** (line 276):
- Change `match_status: 'matched'` to `payment_status: 'matched'`

### Batch upload processing

- Split files into batches of 5
- Use `Promise.allSettled` for each batch so one failure doesn't stop the rest
- Add a progress state variable to show "Elaborazione 15 di 200 fatture..."
- Show a toast with progress updates during processing
- Collect errors and report them at the end ("195 processed, 5 failed")

